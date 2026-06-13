import { Resend } from 'resend'

export const FROM_EMAIL = process.env.FROM_EMAIL ?? 'noreply@reservapro.com'

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 'your_resend_api_key') {
    return null
  }
  return new Resend(apiKey)
}

export async function sendEmail({
  to,
  subject,
  html,
  from = FROM_EMAIL,
}: {
  to: string | string[]
  subject: string
  html: string
  from?: string
}) {
  const resend = getResendClient()
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not configured. Email not sent.')
    return { success: false, skipped: true }
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })

    if (error) {
      console.error('[Email] Resend error:', error)
      return { success: false, error }
    }

    console.log('[Email] Sent:', data?.id)
    return { success: true, id: data?.id }
  } catch (err) {
    console.error('[Email] Exception:', err)
    return { success: false, error: err }
  }
}
