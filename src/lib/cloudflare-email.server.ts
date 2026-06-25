import { EmailMessage } from 'cloudflare:email'
import { getCloudflareEnv } from './cloudflare-env.server'

interface SendEmailInput {
  fromName: string
  fromEmail: string
  to: string
  replyTo?: string
  subject: string
  html: string
  text: string
  messageId: string
}

function encodeHeader(value: string) {
  if (/^[\x20-\x7e]*$/.test(value)) return value
  const encoded = btoa(unescape(encodeURIComponent(value)))
  return `=?UTF-8?B?${encoded}?=`
}

function sanitizeHeader(value: string) {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

function normalizeLineEndings(value: string) {
  return value.replace(/\r?\n/g, '\r\n')
}

function buildMimeMessage(input: SendEmailInput) {
  const boundary = `pubsetup-${crypto.randomUUID()}`
  const fromName = encodeHeader(sanitizeHeader(input.fromName))
  const fromEmail = sanitizeHeader(input.fromEmail)
  const to = sanitizeHeader(input.to)
  const subject = encodeHeader(sanitizeHeader(input.subject))
  const replyTo = input.replyTo ? sanitizeHeader(input.replyTo) : undefined

  return [
    `Message-ID: <${sanitizeHeader(input.messageId)}@pubsetup.com>`,
    `Date: ${new Date().toUTCString()}`,
    `From: ${fromName} <${fromEmail}>`,
    `To: ${to}`,
    replyTo ? `Reply-To: ${replyTo}` : undefined,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    normalizeLineEndings(input.text),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    normalizeLineEndings(input.html),
    '',
    `--${boundary}--`,
    '',
  ]
    .filter((line): line is string => line !== undefined)
    .join('\r\n')
}

export async function sendCloudflareEmail(input: SendEmailInput) {
  const binding = getCloudflareEnv().SEND_EMAIL

  if (!binding) {
    throw new Error('Missing Cloudflare SEND_EMAIL binding')
  }

  const message = new EmailMessage(
    input.fromEmail,
    input.to,
    buildMimeMessage(input),
  )

  await binding.send(message)
}
