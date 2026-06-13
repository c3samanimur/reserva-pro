import { NextRequest, NextResponse } from 'next/server'
import { stripe, isStripeEnabled } from '@/lib/stripe'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret || webhookSecret.includes('placeholder')) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 })
  }

  let event
  try {
    event = stripe!.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  // Legacy booking payments (keep for compatibility if needed)
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as any
    await supabase
      .from('bookings')
      .update({ payment_status: 'paid', status: 'confirmed' })
      .eq('stripe_payment_intent_id', paymentIntent.id)
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as any
    await supabase
      .from('bookings')
      .update({ payment_status: 'pending', status: 'cancelled' })
      .eq('stripe_payment_intent_id', paymentIntent.id)
  }

  // Subscription events
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const businessId = session.metadata?.business_id
    const customerId = session.customer as string
    const subscriptionId = session.subscription as string

    if (businessId && subscriptionId) {
      // Upsert subscription
      await supabase.from('subscriptions').upsert({
        business_id: businessId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        status: 'active',
      }, { onConflict: 'business_id' })

      // Activate and approve business
      await supabase.from('businesses').update({
        is_active: true,
        is_approved: true,
      }).eq('id', businessId)
    }
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as any
    const subscriptionId = invoice.subscription as string
    const periodStart = new Date(invoice.period_start * 1000).toISOString()
    const periodEnd = new Date(invoice.period_end * 1000).toISOString()

    if (subscriptionId) {
      await supabase.from('subscriptions').update({
        status: 'active',
        current_period_start: periodStart,
        current_period_end: periodEnd,
      }).eq('stripe_subscription_id', subscriptionId)

      // Ensure business is active
      const { data: sub } = await supabase.from('subscriptions').select('business_id').eq('stripe_subscription_id', subscriptionId).single()
      if (sub?.business_id) {
        await supabase.from('businesses').update({ is_active: true }).eq('id', sub.business_id)
      }
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as any
    const subscriptionId = invoice.subscription as string

    if (subscriptionId) {
      await supabase.from('subscriptions').update({
        status: 'past_due',
      }).eq('stripe_subscription_id', subscriptionId)

      // Deactivate business visibility
      const { data: sub } = await supabase.from('subscriptions').select('business_id').eq('stripe_subscription_id', subscriptionId).single()
      if (sub?.business_id) {
        await supabase.from('businesses').update({ is_active: false }).eq('id', sub.business_id)
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as any
    const subscriptionId = subscription.id as string

    if (subscriptionId) {
      await supabase.from('subscriptions').update({
        status: 'cancelled',
      }).eq('stripe_subscription_id', subscriptionId)

      // Deactivate business
      const { data: sub } = await supabase.from('subscriptions').select('business_id').eq('stripe_subscription_id', subscriptionId).single()
      if (sub?.business_id) {
        await supabase.from('businesses').update({ is_active: false }).eq('id', sub.business_id)
      }
    }
  }

  return NextResponse.json({ received: true })
}