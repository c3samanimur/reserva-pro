'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'
import type { Booking } from '@/types/database'

interface ReviewFormProps {
  booking: Booking
  onSubmitted: () => void
}

export function ReviewForm({ booking, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSubmit = async () => {
    if (rating === 0) { setError('Selecciona una valoración'); return }
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Debes iniciar sesión'); setLoading(false); return }

    const { error: insertError } = await supabase.from('reviews').insert({
      client_id: user.id,
      business_id: booking.business_id,
      booking_id: booking.id,
      rating,
      comment: comment || null,
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }
    onSubmitted()
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mt-4">
      <p className="text-sm font-semibold text-slate-900 mb-3">¿Cómo fue tu experiencia?</p>
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHoverRating(i + 1)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(i + 1)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star className={`w-6 h-6 ${i < (hoverRating || rating) ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
          </button>
        ))}
        <span className="text-xs text-slate-500 ml-2 font-medium">
          {rating > 0 ? ['Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][rating - 1] : 'Selecciona estrellas'}
        </span>
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Cuéntanos tu experiencia (opcional)..."
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none mb-3 transition-colors"
        rows={2}
      />
      {error && <p className="text-xs font-medium text-red-600 mb-3">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" loading={loading} onClick={handleSubmit}>Enviar reseña</Button>
        <Button size="sm" variant="secondary" onClick={onSubmitted}>Cancelar</Button>
      </div>
    </div>
  )
}
