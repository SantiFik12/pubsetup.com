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

interface PostmarkSendResponse {
  MessageID?: string
  ErrorCode?: number
  Message?: string
}

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name} environment variable`)
  }
  return value
}

function formatAddress(name: string, email: string) {
  return `${name} <${email}>`
}

export async function sendPostmarkEmail(input: SendEmailInput) {
  const token = getRequiredEnv('POSTMARK_SERVER_TOKEN')
  const messageStream = process.env.POSTMARK_MESSAGE_STREAM || 'outbound'

  const response = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': token,
    },
    body: JSON.stringify({
      From: formatAddress(input.fromName, input.fromEmail),
      To: input.to,
      ReplyTo: input.replyTo,
      Subject: input.subject,
      HtmlBody: input.html,
      TextBody: input.text,
      MessageStream: messageStream,
      Headers: [
        {
          Name: 'Message-ID',
          Value: `<${input.messageId}@pubsetup.com>`,
        },
      ],
    }),
  })

  const result = (await response.json().catch(() => ({}))) as PostmarkSendResponse

  if (!response.ok || result.ErrorCode) {
    throw new Error(result.Message || `Postmark send failed with HTTP ${response.status}`)
  }

  return result
}
