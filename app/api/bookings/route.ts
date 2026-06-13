import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, isStripeEnabled } from '@/lib/stripe'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const limit = await rateLimit(ip, '/api/bookings')
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { booking_id } = body

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, business:businesses(name, accepts_online_payment), service:services(name)')
    .eq('id', booking_id)
    .eq('client_id', user.id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (!booking.business?.accepts_online_payment) return NextResponse.json({ error: 'Online payment not available' }, { status: 400 })

  if (!isStripeEnabled()) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  const paymentIntent = await stripe!.paymentIntents.create({
    amount: Math.round(booking.total_price * 100),
    currency: 'eur',
    metadata: { booking_id, business_name: booking.business.name, service_name: booking.service?.name ?? '' },
  })

  await supabase
    .from('bookings')
    .update({ stripe_payment_intent_id: paymentIntent.id, payment_status: 'pending' })
    .eq('id', booking_id)

  return NextResponse.json({ client_secret: paymentIntent.client_secret })
}
