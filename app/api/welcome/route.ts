import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { welcomeEmail } from '@/lib/email-templates'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, fullName, role = 'client' } = body

    if (!email || !fullName) {
      return NextResponse.json({ error: 'Missing email or fullName' }, { status: 400 })
    }

    const emailData = welcomeEmail({
      name: fullName,
      role: role === 'business' ? 'business' : 'client',
    })

    await sendEmail({
      to: email,
      subject: emailData.subject,
      html: emailData.html,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Welcome] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
