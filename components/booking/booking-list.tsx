'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ReviewForm } from '@/components/reviews/review-form'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Star } from 'lucide-react'
import { formatDate, formatPrice } from '@/lib/utils'
import type { Booking } from '@/types/database'

const STATUS_MAP = {
  pending: { label: 'Pendiente', variant: 'warning' as const },
  confirmed: { label: 'Confirmada', variant: 'success' as const },
  cancelled: { label: 'Cancelada', variant: 'danger' as const },
  completed: { label: 'Completada', variant: 'default' as const },
}

export function BookingList({ bookings }: { bookings: Booking[] }) {
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null)
  const [submittedReviews, setSubmittedReviews] = useState<Set<string>>(new Set())

  if (bookings.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">Sin reservas todavía</h3>
        <p className="text-slate-500 text-sm mb-6">Encuentra un negocio y reserva tu primera cita</p>
        <Link href="/negocios" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
          Explorar negocios
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map(b => {
        const status = STATUS_MAP[b.status as keyof typeof STATUS_MAP]
        const showReviewForm = reviewBookingId === b.id
        const alreadyReviewed = submittedReviews.has(b.id)

        return (
          <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <Link
                  href={`/negocios/${b.business?.slug}`}
                  className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                >
                  {b.business?.name}
                </Link>
                <p className="text-sm text-slate-500 mt-0.5">{b.service?.name}</p>
              </div>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <div className="flex flex-wrap gap-5 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{formatDate(b.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                {b.start_time.slice(0, 5)} ({b.service?.duration_minutes} min)
              </div>
              {(b.business as any)?.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {(b.business as any).city}
                </div>
              )}
            </div>
            <div className="border-t border-slate-100 mt-5 pt-4 flex items-center justify-between">
              <span className="text-sm font-bold text-indigo-600">{formatPrice(b.total_price)}</span>
              <div className="flex items-center gap-3">
                {b.status === 'pending' && (
                  <CancelBookingButton bookingId={b.id} />
                )}
                {b.status === 'completed' && !alreadyReviewed && !showReviewForm && (
                  <button
                    onClick={() => setReviewBookingId(b.id)}
                    className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                  >
                    <Star className="w-4 h-4" /> Dejar reseña
                  </button>
                )}
                {alreadyReviewed && (
                  <span className="text-sm text-emerald-600 font-semibold flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-emerald-600" /> Reseña enviada
                  </span>
                )}
              </div>
            </div>
            {showReviewForm && (
              <ReviewForm
                booking={b}
                onSubmitted={() => { setReviewBookingId(null); setSubmittedReviews(prev => new Set(prev).add(b.id)) }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [cancelling, setCancelling] = useState(false)

  const handleCancel = async () => {
    if (!confirm('¿Seguro que quieres cancelar esta reserva?')) return
    setCancelling(true)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
    window.location.reload()
  }

  return (
    <button
      onClick={handleCancel}
      disabled={cancelling}
      className="text-sm text-red-600 hover:text-red-700 font-semibold transition-colors disabled:opacity-50"
    >
      {cancelling ? 'Cancelando...' : 'Cancelar'}
    </button>
  )
}
