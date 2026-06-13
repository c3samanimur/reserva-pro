'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, Calendar, Clock, ChevronLeft, ChevronRight, CreditCard, CheckCircle } from 'lucide-react'
import { formatPrice, formatDate, addMinutes, DAY_NAMES } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Business, Service, Staff, Availability } from '@/types/database'

interface BookingModalProps {
  business: Business
  services: Service[]
  staff: Staff[]
  availability: Availability[]
  onClose: () => void
}

type Step = 'service' | 'staff' | 'datetime' | 'notes' | 'confirm'

function generateSlots(startTime: string, endTime: string, durationMinutes: number): string[] {
  const slots: string[] = []
  let current = startTime
  while (current < endTime) {
    slots.push(current)
    current = addMinutes(current, durationMinutes)
  }
  return slots
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export function BookingModal({ business, services, staff, availability, onClose }: BookingModalProps) {
  const [step, setStep] = useState<Step>('service')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [takenSlots, setTakenSlots] = useState<string[]>([])
  const [calMonth, setCalMonth] = useState(() => new Date())
  const supabase = createClient()
  const router = useRouter()

  const activeStaff = staff.filter(s => s.is_active)
  const activeServices = services.filter(s => s.is_active)

  useEffect(() => {
    if (!selectedDate || !business) return
    supabase
      .from('bookings')
      .select('start_time')
      .eq('business_id', business.id)
      .eq('date', selectedDate)
      .in('status', ['pending', 'confirmed'])
      .then(({ data }) => {
        setTakenSlots(data?.map(b => b.start_time.slice(0, 5)) ?? [])
      })
  }, [selectedDate])

  const availableSlots = () => {
    if (!selectedDate || !selectedService) return []
    const date = new Date(selectedDate + 'T00:00:00')
    const dayOfWeek = date.getDay()
    const avail = availability.find(a => a.day_of_week === dayOfWeek)
    if (!avail) return []
    return generateSlots(avail.start_time.slice(0, 5), avail.end_time.slice(0, 5), selectedService.duration_minutes)
      .filter(s => !takenSlots.includes(s))
  }

  const isDateAvailable = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    const dow = date.getDay()
    return availability.some(a => a.day_of_week === dow)
  }

  const getDates = () => {
    const year = calMonth.getFullYear()
    const month = calMonth.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = new Date(year, month, 1).getDay()
    return { year, month, daysInMonth, firstDay }
  }

  const handleBook = async () => {
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    if (!selectedService || !selectedDate || !selectedTime) return

    const endTime = addMinutes(selectedTime, selectedService.duration_minutes)

    const { data: inserted, error: insertError } = await supabase
      .from('bookings')
      .insert({
        client_id: user.id,
        business_id: business.id,
        service_id: selectedService.id,
        staff_id: selectedStaff?.id ?? null,
        date: selectedDate,
        start_time: selectedTime + ':00',
        end_time: endTime + ':00',
        status: 'pending',
        payment_status: business.accepts_online_payment ? 'pending' : 'not_required',
        total_price: selectedService.price,
        notes: notes || null,
      })
      .select('id')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        setError('Este horario ya ha sido reservado por otro cliente. Por favor, elige otro horario.')
      } else {
        setError('Error al crear la reserva. Inténtalo de nuevo.')
      }
      setLoading(false)
      return
    }

    if (inserted?.id) {
      fetch('/api/bookings/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: inserted.id }),
      }).catch(() => {})
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-10 max-w-sm w-full text-center shadow-2xl shadow-slate-950/20">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 ring-1 ring-emerald-100">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">¡Reserva confirmada!</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Tu cita en <strong className="text-slate-900">{business.name}</strong> el {formatDate(selectedDate)} a las {selectedTime} ha sido solicitada.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cerrar</Button>
            <Button className="flex-1" onClick={() => { onClose(); router.push('/mis-reservas') }}>
              Mis reservas
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const { year, month, daysInMonth, firstDay } = getDates()
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Nueva reserva</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{business.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex px-6 pt-5 gap-2">
          {(['service', 'datetime', 'confirm'] as const).map((s, i) => (
            <div key={s} className={cn('flex-1 h-1.5 rounded-full', step === s || (i < ['service', 'datetime', 'confirm'].indexOf(step)) ? 'bg-indigo-600' : 'bg-slate-100')} />
          ))}
        </div>

        <div className="p-6">
          {/* Step 1: Service */}
          {step === 'service' && (
            <div>
              <h3 className="font-bold text-slate-900 mb-5 text-lg">¿Qué servicio quieres?</h3>
              <div className="space-y-3">
                {activeServices.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedService(s); setStep(activeStaff.length > 0 ? 'staff' : 'datetime') }}
                    className={cn(
                      'w-full text-left p-5 rounded-xl border-2 transition-all',
                      selectedService?.id === s.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{s.name}</p>
                        {s.description && <p className="text-sm text-slate-500 mt-1">{s.description}</p>}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-indigo-600 text-lg">{formatPrice(s.price)}</p>
                        <p className="text-xs text-slate-400 font-medium">{s.duration_minutes} min</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Staff (optional) */}
          {step === 'staff' && (
            <div>
              <h3 className="font-bold text-slate-900 mb-5 text-lg">¿Con quién quieres la cita?</h3>
              <div className="space-y-3">
                <button
                  onClick={() => { setSelectedStaff(null); setStep('datetime') }}
                  className="w-full text-left p-5 rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
                >
                  <p className="font-semibold text-slate-900">Sin preferencia</p>
                  <p className="text-sm text-slate-500">El primer profesional disponible</p>
                </button>
                {activeStaff.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedStaff(s); setStep('datetime') }}
                    className={cn(
                      'w-full text-left p-5 rounded-xl border-2 transition-all flex items-center gap-4',
                      selectedStaff?.id === s.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                      {s.name[0]}
                    </div>
                    <p className="font-semibold text-slate-900">{s.name}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep('service')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mt-5 font-medium transition-colors">
                <ChevronLeft className="w-4 h-4" /> Volver
              </button>
            </div>
          )}

          {/* Step 3: Date & Time */}
          {step === 'datetime' && (
            <div>
              <h3 className="font-bold text-slate-900 mb-5 text-lg">Elige fecha y hora</h3>

              {/* Calendar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() - 1))} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold capitalize text-slate-900">
                    {calMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() + 1))} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                    <div key={d} className="text-center text-xs text-slate-400 font-bold py-2">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: (firstDay + 6) % 7 }).map((_, i) => <div key={i} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const isToday = dateStr === today
                    const isPast = dateStr < today
                    const isAvail = !isPast && isDateAvailable(dateStr)
                    const isSelected = dateStr === selectedDate
                    return (
                      <button
                        key={day}
                        disabled={!isAvail}
                        onClick={() => { setSelectedDate(dateStr); setSelectedTime('') }}
                        className={cn(
                          'h-9 w-full rounded-lg text-xs font-semibold transition-all',
                          isSelected && 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25',
                          !isSelected && isAvail && 'hover:bg-indigo-50 text-slate-700',
                          !isSelected && !isAvail && 'text-slate-300 cursor-not-allowed',
                          isToday && !isSelected && 'ring-1 ring-indigo-500 text-indigo-600'
                        )}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-3">Horas disponibles</p>
                  {availableSlots().length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-sm text-slate-500 font-medium">No hay horas disponibles este día</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots().map(slot => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={cn(
                            'py-2.5 rounded-xl text-sm font-semibold transition-all border',
                            selectedTime === slot ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                          )}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(activeStaff.length > 0 ? 'staff' : 'service')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Volver
                </button>
                <Button
                  disabled={!selectedDate || !selectedTime}
                  className="flex-1"
                  onClick={() => setStep('confirm')}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 'confirm' && (
            <div>
              <h3 className="font-bold text-slate-900 mb-5 text-lg">Confirmar reserva</h3>

              <div className="bg-slate-50 rounded-xl p-5 space-y-3.5 mb-5 border border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Servicio</span>
                  <span className="font-semibold text-slate-900">{selectedService?.name}</span>
                </div>
                {selectedStaff && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Profesional</span>
                    <span className="font-semibold text-slate-900">{selectedStaff.name}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Fecha</span>
                  <span className="font-semibold text-slate-900">{selectedDate && formatDate(selectedDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Hora</span>
                  <span className="font-semibold text-slate-900">{selectedTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Duración</span>
                  <span className="font-semibold text-slate-900">{selectedService?.duration_minutes} min</span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between text-sm font-bold">
                  <span className="text-slate-900">Total</span>
                  <span className="text-indigo-600">{selectedService && formatPrice(selectedService.price)}</span>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Notas adicionales (opcional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ej: Pelo largo, alergia a ciertos productos..."
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-colors"
                  rows={3}
                />
              </div>

              {business.accepts_online_payment && (
                <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-5">
                  <CreditCard className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <p className="text-sm text-indigo-700 font-medium">Este negocio acepta pago online. El pago se procesará de forma segura.</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5 font-medium">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep('datetime')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Volver
                </button>
                <Button loading={loading} className="flex-1" onClick={handleBook}>
                  Confirmar reserva
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
