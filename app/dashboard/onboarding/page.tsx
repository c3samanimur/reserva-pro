'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { generateSlug, CATEGORY_LABELS, DAY_NAMES } from '@/lib/utils'
import { Briefcase, Scissors, Clock, CreditCard, ChevronRight, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORIES = Object.entries(CATEGORY_LABELS)
const defaultDay = { enabled: false, start_time: '09:00', end_time: '20:00' }

type Step = 'perfil' | 'servicios' | 'horarios' | 'suscripcion'

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('perfil')
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [processingCheckout, setProcessingCheckout] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [profileForm, setProfileForm] = useState({
    name: '', slug: '', description: '', address: '', city: '', phone: '', email: '', category: 'peluqueria',
  })
  const [slugError, setSlugError] = useState('')

  const [services, setServices] = useState<{ name: string; description: string; duration_minutes: number; price: number }[]>([])
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', duration_minutes: 30, price: 0 })
  const [showServiceForm, setShowServiceForm] = useState(false)

  const [schedule, setSchedule] = useState<{ enabled: boolean; start_time: string; end_time: string }[]>(
    Array.from({ length: 7 }, () => ({ ...defaultDay }))
  )

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data: businesses } = await supabase.from('businesses').select('id').eq('owner_id', user.id).limit(1)
      if (businesses && businesses.length > 0) setBusinessId(businesses[0].id)
    })
  }, [])

  const handleProfileNameChange = (name: string) => {
    setProfileForm(f => ({ ...f, name, slug: businessId ? f.slug : generateSlug(name) }))
    setSlugError('')
  }

  const ensureUniqueSlug = async (slug: string): Promise<string> => {
    let candidate = slug
    let suffix = 1
    while (true) {
      const { data, error } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', candidate)
        .limit(1)
      if (error || !data || data.length === 0) return candidate
      candidate = `${slug}-${suffix}`
      suffix++
    }
  }

  const saveProfile = async () => {
    if (!profileForm.name) return
    setLoading(true)
    setSlugError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const slug = profileForm.slug || generateSlug(profileForm.name)
    const uniqueSlug = await ensureUniqueSlug(slug)

    const { data: biz, error } = await supabase.from('businesses').insert({
      ...profileForm,
      slug: uniqueSlug,
      owner_id: user.id,
    }).select('id').single()

    if (error) {
      setLoading(false)
      if (error.code === '23505') {
        setSlugError('Este nombre/URL ya está en uso. Intenta con otro.')
      }
      return
    }
    setBusinessId(biz.id)
    setLoading(false)
    setStep('servicios')
  }

  const addService = () => {
    if (!serviceForm.name) return
    setServices([...services, { ...serviceForm }])
    setServiceForm({ name: '', description: '', duration_minutes: 30, price: 0 })
    setShowServiceForm(false)
  }

  const saveServices = async () => {
    if (!businessId || services.length === 0) return
    setLoading(true)
    await supabase.from('services').insert(services.map(s => ({ ...s, business_id: businessId })))
    setLoading(false)
    setStep('horarios')
  }

  const saveHorarios = async () => {
    if (!businessId) return
    setLoading(true)
    await supabase.from('availability').delete().eq('business_id', businessId).is('staff_id', null)
    const inserts = schedule
      .map((d, i) => d.enabled ? { business_id: businessId, staff_id: null, day_of_week: i, start_time: d.start_time + ':00', end_time: d.end_time + ':00' } : null)
      .filter(Boolean)
    if (inserts.length > 0) await supabase.from('availability').insert(inserts as any)
    setLoading(false)
    setStep('suscripcion')
  }

  const handleCheckout = async () => {
    setProcessingCheckout(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert('Error al iniciar el pago')
    } catch {
      alert('Error de red')
    } finally {
      setProcessingCheckout(false)
    }
  }

  const steps: { key: Step; label: string; icon: typeof Briefcase }[] = [
    { key: 'perfil', label: 'Perfil', icon: Briefcase },
    { key: 'servicios', label: 'Servicios', icon: Scissors },
    { key: 'horarios', label: 'Horarios', icon: Clock },
    { key: 'suscripcion', label: 'Suscripción', icon: CreditCard },
  ]

  const currentIndex = steps.findIndex(s => s.key === step)

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configura tu negocio</h1>
          <p className="text-slate-500 text-sm mt-1">Sigue estos pasos para empezar a recibir reservas</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                i <= currentIndex ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'
              )}>
                {i < currentIndex ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn(
                'text-xs font-bold hidden sm:block',
                i <= currentIndex ? 'text-indigo-600' : 'text-slate-400'
              )}>{s.label}</span>
              {i < steps.length - 1 && (
                <div className={cn('flex-1 h-0.5 rounded', i < currentIndex ? 'bg-indigo-600' : 'bg-slate-200')} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {step === 'perfil' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-slate-900">Información de tu negocio</h2>
              <Input
                label="Nombre del negocio *"
                value={profileForm.name}
                onChange={e => handleProfileNameChange(e.target.value)}
                placeholder="Ej: Barbería El Maestro"
                required
              />
              <Input
                label="URL personalizada"
                value={profileForm.slug}
                onChange={e => { setProfileForm(f => ({ ...f, slug: generateSlug(e.target.value) })); setSlugError('') }}
                placeholder="barberia-el-maestro"
              />
              {slugError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 font-medium">
                  {slugError}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Categoría *</label>
                <select
                  value={profileForm.category}
                  onChange={e => setProfileForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-white"
                >
                  {CATEGORIES.map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descripción</label>
                <textarea
                  value={profileForm.description}
                  onChange={e => setProfileForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe tu negocio, especialidades, ambiente..."
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-colors"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Dirección" value={profileForm.address} onChange={e => setProfileForm(f => ({ ...f, address: e.target.value }))} placeholder="Calle Mayor 1" />
                <Input label="Ciudad" value={profileForm.city} onChange={e => setProfileForm(f => ({ ...f, city: e.target.value }))} placeholder="Madrid" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Teléfono" type="tel" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="+34 600 000 000" />
                <Input label="Email de contacto" type="email" value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} placeholder="negocio@email.com" />
              </div>
              <Button loading={loading} className="w-full" onClick={saveProfile}>
                Continuar <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {step === 'servicios' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-slate-900">Tus servicios</h2>
              <p className="text-sm text-slate-500">Añade al menos un servicio para que los clientes puedan reservar.</p>

              {services.length > 0 && (
                <div className="space-y-2">
                  {services.map((s, i) => (
                    <div key={i} className="bg-slate-50 rounded-lg p-3 flex items-center justify-between text-sm border border-slate-100">
                      <div>
                        <span className="font-semibold">{s.name}</span>
                        <span className="text-slate-500 ml-2">{s.duration_minutes} min · {s.price}€</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showServiceForm ? (
                <div className="bg-slate-50 rounded-xl p-5 space-y-3 border border-slate-100">
                  <Input
                    label="Nombre del servicio *"
                    value={serviceForm.name}
                    onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Corte de cabello"
                  />
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descripción</label>
                    <textarea
                      value={serviceForm.description}
                      onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-colors"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Duración (min) *</label>
                      <input type="number" min={5} step={5} value={serviceForm.duration_minutes}
                        onChange={e => setServiceForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Precio (€) *</label>
                      <input type="number" min={0} step={0.5} value={serviceForm.price}
                        onChange={e => setServiceForm(f => ({ ...f, price: Number(e.target.value) }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={addService}>Añadir</Button>
                    <Button size="sm" variant="secondary" onClick={() => setShowServiceForm(false)}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full border-dashed" onClick={() => setShowServiceForm(true)}>
                  <Scissors className="w-4 h-4 mr-2" /> Añadir servicio
                </Button>
              )}

              <Button loading={loading} className="w-full" onClick={saveServices} disabled={services.length === 0}>
                Continuar <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {step === 'horarios' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-slate-900">Horario de apertura</h2>
              <p className="text-sm text-slate-500">Define los días y horas en que tu negocio está abierto para recibir reservas.</p>

              <div className="space-y-2">
                {schedule.map((day, i) => (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                    <input
                      type="checkbox"
                      id={`day-${i}`}
                      checked={day.enabled}
                      onChange={() => setSchedule(s => s.map((d, j) => j === i ? { ...d, enabled: !d.enabled } : d))}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <label htmlFor={`day-${i}`} className={`w-24 text-sm font-semibold ${day.enabled ? 'text-slate-900' : 'text-slate-400'}`}>
                      {DAY_NAMES[i]}
                    </label>
                    {day.enabled ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input type="time" value={day.start_time}
                          onChange={e => setSchedule(s => s.map((d, j) => j === i ? { ...d, start_time: e.target.value } : d))}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                        <span className="text-slate-400 text-sm">–</span>
                        <input type="time" value={day.end_time}
                          onChange={e => setSchedule(s => s.map((d, j) => j === i ? { ...d, end_time: e.target.value } : d))}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 flex-1 font-medium">Cerrado</span>
                    )}
                  </div>
                ))}
              </div>

              <Button loading={loading} className="w-full" onClick={saveHorarios}>
                Continuar <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {step === 'suscripcion' && (
            <div className="text-center space-y-7 py-4">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto ring-1 ring-indigo-100">
                <CreditCard className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">¡Casi listo!</h2>
                <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                  Activa tu suscripción de <strong className="text-slate-900">25€/mes</strong> para que tu negocio aparezca en el directorio y empieces a recibir reservas.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-5 max-w-sm mx-auto text-sm space-y-3 text-left border border-slate-100">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-slate-700 font-medium">Perfil de negocio creado</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-slate-700 font-medium">{services.length} servicio(s) añadido(s)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-slate-700 font-medium">Horarios configurados</span>
                </div>
              </div>
              <Button size="lg" className="w-full max-w-sm shadow-lg shadow-indigo-500/20" onClick={handleCheckout} loading={processingCheckout}>
                <CreditCard className="w-4 h-4 mr-2" />
                Activar suscripción — 25€/mes
              </Button>
              <p className="text-xs text-slate-400">Sin permanencia. Cancela cuando quieras.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
