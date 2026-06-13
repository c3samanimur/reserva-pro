import Stripe from 'stripe'

const secretKey = process.env.STRIPE_SECRET_KEY

if (!secretKey || secretKey.includes('placeholder')) {
  console.warn(
    '[Stripe] STRIPE_SECRET_KEY is not configured or is a placeholder. ' +
    'Stripe features (payments, subscriptions) will be disabled. ' +
    'Set a real key in your .env.local (see .env.local.example).'
  )
}

export const stripe = secretKey && !secretKey.includes('placeholder')
  ? new Stripe(secretKey, { apiVersion: '2026-04-22.dahlia' })
  : null

export function isStripeEnabled(): boolean {
  return stripe !== null
}
