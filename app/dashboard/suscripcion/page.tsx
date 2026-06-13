'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, CreditCard, Calendar, ArrowRight, Settings } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { Subscription } from '@/types/database'
import { isStripeEnabled } from '@/lib/stripe'

export default function SuscripcionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: businesses } = await supabase.from('businesses').select('id').eq('owner_id', user.id).limit(1)
      if (businesses && businesses.length > 0) {
        const { data: sub } = await supabase.from('subscriptions').select('*').eq('business_id', businesses[0].id).maybeSingle()
        setSubscription(sub)
      }
      setLoading(false)
    })
  }, [])

  const handleCheckout = async () => {
    setProcessing(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert('Error al iniciar el pago')
    } catch {
      alert('Error de red')
    } finally {
      setProcessing(false)
    }
  }

  const handlePortal = async () => {
    setProcessing(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert('Error al abrir el portal')
    } catch {
      alert('Error de red')
    } finally {
      setProcessing(false)
    }
  }

  const [stripeEnabled, setStripeEnabled] = useState(false)

  useEffect(() => {
    setStripeEnabled(isStripeEnabled())
  }, [])

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  const isActive = subscription?.status === 'active'

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tu suscripción</h1>
        <p className="text-slate-500 mt-1">Gestiona tu plan y pagos</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-7">
        {isActive ? (
          <>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center ring-1 ring-emerald-100">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-lg">Suscripción activa</p>
                <p className="text-sm text-slate-500">Tu negocio es visible en el directorio.</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 space-y-3 text-sm border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Plan</span>
                <span className="font-bold text-slate-900">Negocio — 25€/mes</span>
              </div>
              {subscription.current_period_end && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Renovación</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(subscription.current_period_end)}
                  </span>
                </div>
              )}
            </div>

            <Button variant="outline" className="w-full" onClick={handlePortal} loading={processing}>
              <CreditCard className="w-4 h-4 mr-2" />
              Gestionar suscripción
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center ring-1 ring-amber-100">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-lg">Suscripción requerida</p>
                <p className="text-sm text-slate-500">
                  Activa tu suscripción para que tu negocio aparezca en el directorio y recibir reservas.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 text-center border border-slate-100">
              <p className="text-5xl font-bold text-slate-900 tracking-tight">25€<span className="text-lg font-normal text-slate-500">/mes</span></p>
              <p className="text-sm text-slate-500 mt-2">Sin permanencia. Cancela cuando quieras.</p>
            </div>

            {!stripeEnabled ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Settings className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-bold text-amber-800">Stripe no configurado</span>
                </div>
                <p className="text-xs text-amber-700 mb-3">
                  Las suscripciones están desactivadas. Configura STRIPE_SECRET_KEY, STRIPE_PRICE_ID y STRIPE_WEBHOOK_SECRET en tu archivo .env.local para activar pagos.
                </p>
                <Link href="/dashboard" className="text-xs font-semibold text-amber-800 hover:text-amber-900 underline">
                  Volver al dashboard
                </Link>
              </div>
            ) : (
              <Button className="w-full shadow-lg shadow-indigo-500/20" onClick={handleCheckout} loading={processing}>
                <CreditCard className="w-4 h-4 mr-2" />
                Activar suscripción <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            <Link href="/precios" className="block text-center text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
              Ver detalles del plan
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
