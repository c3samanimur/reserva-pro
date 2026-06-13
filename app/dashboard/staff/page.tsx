'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Pencil, Check, X, User } from 'lucide-react'
import type { Staff } from '@/types/database'

import { SubscriptionGate } from '@/components/subscription-gate'

export default function StaffPageWrapper() {
  return (
    <SubscriptionGate>
      <StaffPage />
    </SubscriptionGate>
  )
}

function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', is_active: true })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const loadStaff = async (bId: string) => {
    const { data } = await supabase.from('staff').select('*').eq('business_id', bId).order('name')
    setStaffList(data ?? [])
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: businesses } = await supabase.from('businesses').select('id').eq('owner_id', user.id).limit(1)
      if (businesses && businesses.length > 0) { setBusinessId(businesses[0].id); loadStaff(businesses[0].id) }
    })
  }, [])

  const handleSave = async () => {
    if (!businessId || !form.name.trim()) return
    setLoading(true)
    if (editingId) {
      await supabase.from('staff').update({ name: form.name.trim(), is_active: form.is_active }).eq('id', editingId)
    } else {
      await supabase.from('staff').insert({ name: form.name.trim(), is_active: form.is_active, business_id: businessId })
    }
    await loadStaff(businessId)
    setForm({ name: '', is_active: true }); setShowForm(false); setEditingId(null)
    setLoading(false)
  }

  const handleEdit = (s: Staff) => {
    setForm({ name: s.name, is_active: s.is_active })
    setEditingId(s.id); setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!businessId) return
    if (!confirm('¿Eliminar este empleado?')) return
    await supabase.from('staff').delete().eq('id', id)
    await loadStaff(businessId)
  }

  const handleCancel = () => {
    setForm({ name: '', is_active: true }); setShowForm(false); setEditingId(null)
  }

  const toggleActive = async (s: Staff) => {
    if (!businessId) return
    await supabase.from('staff').update({ is_active: !s.is_active }).eq('id', s.id)
    await loadStaff(businessId)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Empleados</h1>
          <p className="text-slate-500 mt-1">Gestiona tu equipo</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> Añadir
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900">{editingId ? 'Editar empleado' : 'Nuevo empleado'}</h2>
          <Input
            label="Nombre *"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Ej: Juan Pérez"
          />
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="staff-active"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="staff-active" className="text-sm text-slate-700 font-medium">Activo (visible para reservas)</label>
          </div>
          <div className="flex gap-2 pt-1">
            <Button loading={loading} onClick={handleSave} className="flex-1">
              <Check className="w-4 h-4 mr-1.5" /> {editingId ? 'Guardar' : 'Añadir'}
            </Button>
            <Button variant="secondary" onClick={handleCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {staffList.length > 0 ? (
        <div className="space-y-3">
          {staffList.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm ring-1 ring-indigo-100">
                  {s.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-400 font-medium">{s.is_active ? 'Activo' : 'Inactivo'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleActive(s)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                    s.is_active ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {s.is_active ? 'Desactivar' : 'Activar'}
                </button>
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
            <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Aún no has añadido empleados.</p>
            <button onClick={() => setShowForm(true)} className="text-indigo-600 text-sm font-semibold hover:underline mt-3">
              Añadir el primero
            </button>
          </div>
        )
      )}
    </div>
  )
}
