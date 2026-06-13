import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { bookingStatusUpdateEmail } from '@/lib/email-templates'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const limit = await rateLimit(ip, '/api/bookings/status-notify')
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { booking_id, status } = body

    if (!booking_id || !status) {
      return NextResponse.json({ error: 'Missing booking_id or status' }, { status: 400 })
    }

    if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Verify the user is the business owner
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        business:businesses(name, owner_id),
        service:services(name),
        client:profiles(full_name, email)
      `)
      .eq('id', booking_id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const business = booking.business as any
    if (business?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const service = booking.service as any
    const client = booking.client as any

    const emailData = bookingStatusUpdateEmail({
      clientName: client?.full_name || 'Cliente',
      businessName: business?.name || 'Negocio',
      serviceName: service?.name || 'Servicio',
      date: booking.date,
      time: booking.start_time.slice(0, 5),
      price: booking.total_price,
      status: status as 'confirmed' | 'cancelled' | 'completed',
    })

    await sendEmail({
      to: client?.email,
      subject: emailData.subject,
      html: emailData.html,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Status Notify] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
