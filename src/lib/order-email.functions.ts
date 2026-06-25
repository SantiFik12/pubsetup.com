import * as React from 'react'
import { createServerFn } from '@tanstack/react-start'
import { render } from '@react-email/components'

const SITE_NAME = 'pubsetup.com'
const FROM_DOMAIN = 'pubsetup.com'
const FROM_LOCAL = 'noreply'
const NOTIFICATION_RECIPIENT = 'contact@pubsetup.com'

interface OrderEmailInput {
  orderCode: string
  customerName: string
  customerEmail: string
  website?: string | null
  notes?: string | null
  serviceName: string
  extensionName?: string | null
  amount: number
}

export const sendOrderNotification = createServerFn({ method: 'POST' })
  .inputValidator((input: OrderEmailInput) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { TEMPLATES } = await import('@/lib/email-templates/registry')
    const { sendCloudflareEmail } = await import('@/lib/cloudflare-email.server')

    async function send(templateName: 'order-notification' | 'order-confirmation', recipient: string) {
      const tpl = TEMPLATES[templateName]
      if (!tpl) {
        console.error('Template missing', templateName)
        return { ok: false as const, reason: 'template_missing' }
      }
      const messageId = crypto.randomUUID()

      // Suppression check (fail-closed)
      const { data: suppressed, error: suppErr } = await supabaseAdmin
        .from('suppressed_emails')
        .select('id')
        .eq('email', recipient.toLowerCase())
        .maybeSingle()
      if (suppErr) {
        console.error('Suppression lookup failed', suppErr)
        return { ok: false as const, reason: 'suppression_lookup_failed' }
      }
      if (suppressed) {
        await supabaseAdmin.from('email_send_log').insert({
          message_id: messageId,
          template_name: templateName,
          recipient_email: recipient,
          status: 'suppressed',
        })
        return { ok: false as const, reason: 'suppressed' }
      }

      const element = React.createElement(tpl.component, data as any)
      const html = await render(element)
      const text = await render(element, { plainText: true })
      const subject =
        typeof tpl.subject === 'function' ? tpl.subject(data as any) : tpl.subject

      await supabaseAdmin.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: recipient,
        status: 'pending',
      })

      try {
        await sendCloudflareEmail({
          to: recipient,
          fromName: SITE_NAME,
          fromEmail: `${FROM_LOCAL}@${FROM_DOMAIN}`,
          subject,
          html,
          text,
          replyTo: NOTIFICATION_RECIPIENT,
          messageId,
        })

        await supabaseAdmin.from('email_send_log').insert({
          message_id: messageId,
          template_name: templateName,
          recipient_email: recipient,
          status: 'sent',
        })
        return { ok: true as const }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error('Failed to send email', templateName, message)
        await supabaseAdmin.from('email_send_log').insert({
          message_id: messageId,
          template_name: templateName,
          recipient_email: recipient,
          status: 'failed',
          error_message: message,
        })
        return { ok: false as const, reason: 'send_failed' }
      }
    }

    const [internal, customer] = await Promise.all([
      send('order-notification', NOTIFICATION_RECIPIENT),
      send('order-confirmation', data.customerEmail),
    ])

    return { internal, customer }
  })
