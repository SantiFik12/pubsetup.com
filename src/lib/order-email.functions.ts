import { createServerFn } from '@tanstack/react-start'
import { sendLovableEmail } from '@lovable.dev/email-js'

const SITE_NAME = 'pubsetup.com'
const SENDER_DOMAIN = 'info.pubsetup.com'
const FROM_DOMAIN = 'pubsetup.com'
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

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )
}

function buildHtml(d: OrderEmailInput): string {
  const rows: Array<[string, string]> = [
    ['Order code', d.orderCode],
    ['Service', d.serviceName],
    ...(d.extensionName ? [['Extension', d.extensionName] as [string, string]] : []),
    ['Customer', d.customerName],
    ['Email', d.customerEmail],
    ...(d.website ? [['Website', d.website] as [string, string]] : []),
    ['Amount', `$${d.amount}`],
  ]
  const rowsHtml = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;color:#666;border-bottom:1px solid #eee">${escapeHtml(k)}</td><td style="padding:6px 12px;border-bottom:1px solid #eee"><strong>${escapeHtml(v)}</strong></td></tr>`,
    )
    .join('')
  const notes = d.notes
    ? `<h3 style="margin-top:24px;font-size:14px">Notes / requirements</h3><div style="white-space:pre-wrap;background:#f7f7f7;padding:12px;border-radius:6px;font-size:14px">${escapeHtml(d.notes)}</div>`
    : ''
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#222;max-width:600px;margin:0 auto;padding:24px">
<h2 style="margin:0 0 16px">New order ${escapeHtml(d.orderCode)}</h2>
<table style="width:100%;border-collapse:collapse;font-size:14px">${rowsHtml}</table>
${notes}
</body></html>`
}

function buildText(d: OrderEmailInput): string {
  return [
    `New order ${d.orderCode}`,
    `Service: ${d.serviceName}`,
    d.extensionName ? `Extension: ${d.extensionName}` : null,
    `Customer: ${d.customerName}`,
    `Email: ${d.customerEmail}`,
    d.website ? `Website: ${d.website}` : null,
    `Amount: $${d.amount}`,
    d.notes ? `\nNotes:\n${d.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}

export const sendOrderNotification = createServerFn({ method: 'POST' })
  .inputValidator((input: OrderEmailInput) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY
    if (!apiKey) {
      console.error('LOVABLE_API_KEY missing — cannot send order notification')
      return { sent: false }
    }
    try {
      await sendLovableEmail(
        {
          to: NOTIFICATION_RECIPIENT,
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          sender_domain: SENDER_DOMAIN,
          subject: `New order ${data.orderCode} — ${data.serviceName}`,
          html: buildHtml(data),
          text: buildText(data),
          purpose: 'transactional',
          label: 'order_notification',
          reply_to: data.customerEmail,
          idempotency_key: `order-${data.orderCode}`,
        },
        { apiKey, sendUrl: process.env.LOVABLE_SEND_URL },
      )
      return { sent: true }
    } catch (err) {
      console.error('Failed to send order notification email', err)
      return { sent: false }
    }
  })
