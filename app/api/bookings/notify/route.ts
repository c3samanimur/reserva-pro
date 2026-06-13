import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { bookingConfirmationClientEmail, bookingNotificationBusinessEmail } from '@/lib/email-templates'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const limit = await rateLimit(ip, '/api/bookings/notify')
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { booking_id } = body

    if (!booking_id) {
      return NextResponse.json({ error: 'Missing booking_id' }, { status: 400 })
    }

    // Fetch booking details with relations
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        business:businesses(name, email, address),
        service:services(name),
        client:profiles(full_name, email, phone),
        staff:staff(name)
      `)
      .eq('id', booking_id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const business = booking.business as any
    const service = booking.service as any
    const client = booking.client as any
    const staff = booking.staff as any

    // Email to client
    const clientEmailData = bookingConfirmationClientEmail({
      clientName: client?.full_name || 'Cliente',
      businessName: business?.name || 'Negocio',
      serviceName: service?.name || 'Servicio',
      date: booking.date,
      time: booking.start_time.slice(0, 5),
      price: booking.total_price,
      address: business?.address,
      status: booking.status,
    })

    await sendEmail({
      to: client?.email || user.email!,
      subject: clientEmailData.subject,
      html: clientEmailData.html,
    })

    // Email to business
    const businessEmailData = bookingNotificationBusinessEmail({
      businessName: business?.name || 'Tu negocio',
      clientName: client?.full_name || 'Cliente',
      clientEmail: client?.email,
      clientPhone: client?.phone,
      serviceName: service?.name || 'Servicio',
      date: booking.date,
      time: booking.start_time.slice(0, 5),
      price: booking.total_price,
      notes: booking.notes,
    })

    await sendEmail({
      to: business?.email,
      subject: businessEmailData.subject,
      html: businessEmailData.html,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Notify] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
