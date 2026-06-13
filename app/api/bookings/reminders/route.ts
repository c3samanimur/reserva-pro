import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { bookingReminderEmail } from '@/lib/email-templates'
import { rateLimit } from '@/lib/rate-limit'

// This endpoint is designed to be called by a cron job or scheduler
// It sends reminder emails for bookings happening tomorrow
export async function POST(request: NextRequest) {
  try {
    // Optional: require a secret key for cron calls
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const limit = await rateLimit(ip, '/api/bookings/reminders')
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createClient()

    // Calculate tomorrow's date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    // Fetch confirmed bookings for tomorrow
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        business:businesses(name, address, phone),
        service:services(name),
        client:profiles(full_name, email)
      `)
      .eq('date', tomorrowStr)
      .in('status', ['confirmed', 'pending'])

    if (error) {
      console.error('[Reminders] Fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No bookings for tomorrow' })
    }

    let sent = 0
    let failed = 0

    for (const booking of bookings) {
      const business = booking.business as any
      const service = booking.service as any
      const client = booking.client as any

      if (!client?.email) {
        failed++
        continue
      }

      const emailData = bookingReminderEmail({
        clientName: client.full_name || 'Cliente',
        businessName: business?.name || 'Negocio',
        serviceName: service?.name || 'Servicio',
        date: booking.date,
        time: booking.start_time.slice(0, 5),
        address: business?.address,
        phone: business?.phone,
      })

      const result = await sendEmail({
        to: client.email,
        subject: emailData.subject,
        html: emailData.html,
      })

      if (result.success) {
        sent++
      } else {
        failed++
      }
    }

    console.log(`[Reminders] Sent: ${sent}, Failed: ${failed}, Total: ${bookings.length}`)

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: bookings.length,
    })
  } catch (error) {
    console.error('[Reminders] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
