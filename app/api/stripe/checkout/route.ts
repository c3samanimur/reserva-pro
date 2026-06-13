import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, isStripeEnabled } from '@/lib/stripe'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    if (!isStripeEnabled()) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const limit = await rateLimit(ip, '/api/stripe/checkout')
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'business') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: business } = await supabase.from('businesses').select('*').eq('owner_id', user.id).single()
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Check or create Stripe Customer
    let customerId = ''
    const { data: existingSub } = await supabase.from('subscriptions').select('stripe_customer_id').eq('business_id', business.id).single()
    
    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id
    } else {
      const customer = await stripe!.customers.create({
        email: user.email,
        name: business.name,
        metadata: { business_id: business.id, user_id: user.id },
      })
      customerId = customer.id
    }

    const priceId = process.env.STRIPE_PRICE_ID
    if (!priceId || priceId.includes('placeholder')) {
      return NextResponse.json({ error: 'Stripe price ID is not configured' }, { status: 503 })
    }

    const session = await stripe!.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/suscripcion?canceled=1`,
      metadata: {
        business_id: business.id,
        user_id: user.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}