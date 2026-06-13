'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { DAY_NAMES } from '@/lib/utils'
import { Check, Clock } from 'lucide-react'

interface DayConfig {
  enabled: boolean
  start_time: string
  end_time: string
}

const defaultDay: DayConfig = { enabled: false, start_time: '09:00', end_time: '20:00' }

import { SubscriptionGate } from '@/components/subscription-gate'

export default function HorariosPageWrapper() {
  return (
    <SubscriptionGate>
      <HorariosPage />
    </SubscriptionGate>
  )
}

function HorariosPage() {
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [schedule, setSchedule] = useState<DayConfig[]>(Array.from({ length: 7 }, () => ({ ...defaultDay })))
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: businesses } = await supabase.from('businesses').select('id').eq('owner_id', user.id).limit(1)
      if (!businesses || businesses.length === 0) return
      const biz = businesses[0]
      setBusinessId(biz.id)
      const { data: avail } = await supabase.from('availability').select('*').eq('business_id', biz.id).is('staff_id', null)
      if (avail) {
        setSchedule(prev => {
          const next = [...prev]
          avail.forEach(a => {
            next[a.day_of_week] = { enabled: true, start_time: a.start_time.slice(0, 5), end_time: a.end_time.slice(0, 5) }
          })
          return next
        })
      }
    })
  }, [])

  const handleSave = async () => {
    if (!businessId) return
    setLoading(true)
    await supabase.from('availability').delete().eq('business_id', businessId).is('staff_id', null)
    const inserts = schedule
      .map((d, i) => d.enabled ? { business_id: businessId, staff_id: null, day_of_week: i, start_time: d.start_time + ':00', end_time: d.end_time + ':00' } : null)
      .filter(Boolean)
    if (inserts.length > 0) await supabase.from('availability').insert(inserts as any)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setLoading(false)
  }

  const toggleDay = (i: number) => setSchedule(s => s.map((d, j) => j === i ? { ...d, enabled: !d.enabled } : d))
  const updateDay = (i: number, key: 'start_time' | 'end_time', val: string) =>
    setSchedule(s => s.map((d, j) => j === i ? { ...d, [key]: val } : d))

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Horarios</h1>
        <p className="text-slate-500 mt-1">Define los días y horas en que tu negocio está abierto</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 mb-5">
        {schedule.map((day, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
            <input
              type="checkbox"
              id={`day-${i}`}
              checked={day.enabled}
              onChange={() => toggleDay(i)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor={`day-${i}`} className={`w-24 text-sm font-semibold ${day.enabled ? 'text-slate-900' : 'text-slate-400'}`}>
              {DAY_NAMES[i]}
            </label>
            {day.enabled ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={day.start_time}
                  onChange={e => updateDay(i, 'start_time', e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
                <span className="text-slate-400 text-sm">–</span>
                <input
                  type="time"
                  value={day.end_time}
                  onChange={e => updateDay(i, 'end_time', e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            ) : (
              <span className="text-xs text-slate-400 flex-1 font-medium">Cerrado</span>
            )}
          </div>
        ))}
      </div>

      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3 mb-4 font-medium">
          <Check className="w-4 h-4" /> Horarios guardados correctamente
        </div>
      )}

      <Button onClick={handleSave} loading={loading} size="lg" className="w-full sm:w-auto">
        <Clock className="w-4 h-4 mr-2" /> Guardar horarios
      </Button>
    </div>
  )
}
