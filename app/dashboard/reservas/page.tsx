'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatPrice } from '@/lib/utils'
import { Calendar, Check, X, ArrowRight } from 'lucide-react'

const STATUS_MAP = {
  pending: { label: 'Pendiente', variant: 'warning' as const },
  confirmed: { label: 'Confirmada', variant: 'success' as const },
  cancelled: { label: 'Cancelada', variant: 'danger' as const },
  completed: { label: 'Completada', variant: 'default' as const },
}

import { SubscriptionGate } from '@/components/subscription-gate'

export default function ReservasDashboardPageWrapper() {
  return (
    <SubscriptionGate>
      <ReservasDashboardPage />
    </SubscriptionGate>
  )
}

function ReservasDashboardPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all')
  const supabase = createClient()

  const loadBookings = async (bId: string) => {
    let query = supabase
      .from('bookings')
      .select('*, client:profiles(full_name, phone), service:services(name, duration_minutes)')
      .eq('business_id', bId)
      .order('date', { ascending: false })

    if (filter !== 'all') query = query.eq('status', filter)
    const { data } = await query
    setBookings(data ?? [])
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: businesses } = await supabase.from('businesses').select('id').eq('owner_id', user.id).limit(1)
      if (businesses && businesses.length > 0) { setBusinessId(businesses[0].id); loadBookings(businesses[0].id) }
    })
  }, [])

  useEffect(() => {
    if (businessId) loadBookings(businessId)
  }, [filter])

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id)
    
    if (status === 'confirmed' || status === 'cancelled' || status === 'completed') {
      fetch('/api/bookings/status-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: id, status }),
      }).catch(() => {})
    }
    
    if (businessId) loadBookings(businessId)
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de reservas</h1>
        <p className="text-slate-500 mt-1">Administra las citas de tu negocio</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'pending', 'confirmed', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
              filter === f 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {f === 'all' ? 'Todas' : STATUS_MAP[f].label + 's'}
          </button>
        ))}
      </div>

      {bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map(b => {
            const status = STATUS_MAP[b.status as keyof typeof STATUS_MAP]
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-slate-900">{b.client?.full_name ?? 'Cliente'}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{b.service?.name}</p>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <div className="text-sm text-slate-500 space-y-1.5 mb-5">
                  <p className="flex items-center gap-2">📅 <span className="font-medium text-slate-700">{formatDate(b.date)}</span> a las {b.start_time.slice(0, 5)}</p>
                  <p>⏱ {b.service?.duration_minutes} min</p>
                  <p>💶 <span className="font-bold text-indigo-600">{formatPrice(b.total_price)}</span></p>
                  {b.client?.phone && <p>📞 {b.client.phone}</p>}
                  {b.notes && <p className="italic text-slate-400">&ldquo;{b.notes}&rdquo;</p>}
                </div>
                {b.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateStatus(b.id, 'confirmed')}>
                      <Check className="w-3.5 h-3.5 mr-1.5" /> Confirmar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(b.id, 'cancelled')}>
                      <X className="w-3.5 h-3.5 mr-1.5" /> Rechazar
                    </Button>
                  </div>
                )}
                {b.status === 'confirmed' && (
                  <Button size="sm" variant="secondary" onClick={() => updateStatus(b.id, 'completed')}>
                    <Check className="w-3.5 h-3.5 mr-1.5" /> Marcar completada
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">Sin reservas</h3>
          <p className="text-slate-500 text-sm">No hay reservas con este filtro</p>
        </div>
      )}
    </div>
  )
}
