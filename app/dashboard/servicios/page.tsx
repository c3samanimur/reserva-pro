'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import type { Service } from '@/types/database'

interface ServiceForm {
  name: string
  description: string
  duration_minutes: number
  price: number
}

const emptyForm: ServiceForm = { name: '', description: '', duration_minutes: 30, price: 0 }

import { SubscriptionGate } from '@/components/subscription-gate'

export default function ServiciosPageWrapper() {
  return (
    <SubscriptionGate>
      <ServiciosPage />
    </SubscriptionGate>
  )
}

function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([])
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ServiceForm>(emptyForm)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const loadServices = async (bId: string) => {
    const { data } = await supabase.from('services').select('*').eq('business_id', bId).order('price')
    setServices(data ?? [])
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: businesses } = await supabase.from('businesses').select('id').eq('owner_id', user.id).limit(1)
      if (businesses && businesses.length > 0) { setBusinessId(businesses[0].id); loadServices(businesses[0].id) }
    })
  }, [])

  const handleSave = async () => {
    if (!businessId || !form.name) return
    setLoading(true)
    if (editingId) {
      await supabase.from('services').update(form).eq('id', editingId)
    } else {
      await supabase.from('services').insert({ ...form, business_id: businessId })
    }
    await loadServices(businessId)
    setForm(emptyForm); setShowForm(false); setEditingId(null)
    setLoading(false)
  }

  const handleEdit = (s: Service) => {
    setForm({ name: s.name, description: s.description ?? '', duration_minutes: s.duration_minutes, price: s.price })
    setEditingId(s.id); setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!businessId) return
    await supabase.from('services').delete().eq('id', id)
    await loadServices(businessId)
  }

  const handleCancel = () => {
    setForm(emptyForm); setShowForm(false); setEditingId(null)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Servicios</h1>
          <p className="text-slate-500 mt-1">Gestiona los servicios que ofreces</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> Añadir
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900">{editingId ? 'Editar servicio' : 'Nuevo servicio'}</h2>
          <Input
            label="Nombre *"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Ej: Corte de cabello"
          />
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descripción (opcional)</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-colors"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Duración (minutos) *</label>
              <input
                type="number"
                min={5}
                step={5}
                value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Precio (€) *</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button loading={loading} onClick={handleSave} className="flex-1">
              <Check className="w-4 h-4 mr-1.5" /> {editingId ? 'Guardar' : 'Añadir'}
            </Button>
            <Button variant="secondary" onClick={handleCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {services.length > 0 ? (
        <div className="space-y-3">
          {services.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <p className="font-semibold text-slate-900">{s.name}</p>
                {s.description && <p className="text-sm text-slate-500 mt-0.5">{s.description}</p>}
                <p className="text-xs text-slate-400 mt-1.5 font-medium">{s.duration_minutes} min · {formatPrice(s.price)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleEdit(s)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 font-medium">Aún no has añadido servicios.</p>
            <button onClick={() => setShowForm(true)} className="text-indigo-600 text-sm font-semibold hover:underline mt-3">
              Añadir el primero
            </button>
          </div>
        )
      )}
    </div>
  )
}
