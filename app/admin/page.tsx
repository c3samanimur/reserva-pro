import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { AdminActions } from './client'
import { formatDate } from '@/lib/utils'
import { CATEGORY_LABELS } from '@/lib/utils'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: pending } = await supabase
    .from('businesses')
    .select('*, owner:profiles(full_name, email)')
    .eq('is_approved', false)
    .order('created_at')

  const { data: approved } = await supabase
    .from('businesses')
    .select('*, owner:profiles(full_name, email)')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Panel de administración</h1>
          <p className="text-slate-500 mt-1">Gestiona los negocios de la plataforma</p>
        </div>

        {/* Pending approval */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2.5">
            Negocios pendientes de aprobación
            {pending && pending.length > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold">
                {pending.length}
              </span>
            )}
          </h2>

          {pending && pending.length > 0 ? (
            <div className="space-y-4">
              {pending.map(b => (
                <div key={b.id} className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-slate-900">{b.name}</h3>
                        <Badge variant="info">{CATEGORY_LABELS[b.category]}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">{b.city} — {b.address}</p>
                      <p className="text-sm text-slate-600">Propietario: {(b as any).owner?.full_name} ({(b as any).owner?.email})</p>
                      <p className="text-xs text-slate-400 mt-2 font-medium">Registrado el {formatDate(b.created_at)}</p>
                      {b.description && <p className="text-sm text-slate-600 mt-3 line-clamp-2">{b.description}</p>}
                    </div>
                    <AdminActions businessId={b.id} action="approve" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 py-10 text-center shadow-sm">
              <p className="text-slate-500 font-medium">No hay negocios pendientes de aprobación</p>
            </div>
          )}
        </section>

        {/* Approved businesses */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-5">Negocios aprobados (últimos 20)</h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Negocio</th>
                    <th className="text-left px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Categoría</th>
                    <th className="text-left px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Ciudad</th>
                    <th className="text-left px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Valoración</th>
                    <th className="text-left px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {approved?.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 font-semibold text-slate-900">{b.name}</td>
                      <td className="px-5 py-4"><Badge variant="info">{CATEGORY_LABELS[b.category]}</Badge></td>
                      <td className="px-5 py-4 text-slate-600">{b.city}</td>
                      <td className="px-5 py-4 text-slate-600">
                        {b.rating_avg > 0 ? `⭐ ${b.rating_avg.toFixed(1)} (${b.rating_count})` : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <AdminActions businessId={b.id} action="deactivate" isActive={b.is_active} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
