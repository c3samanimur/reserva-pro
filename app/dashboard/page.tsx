import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserBusiness } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Star, ArrowRight } from 'lucide-react'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getUserBusiness(supabase, user.id)

  if (business) {
    const { data: subscription } = await supabase.from('subscriptions').select('status').eq('business_id', business.id).single()
    if (subscription?.status !== 'active') {
      redirect('/dashboard/suscripcion')
    }
  }

  if (!business) {
    redirect('/dashboard/onboarding')
  }

  const [{ data: bookings }, { data: reviews }, { count: clientCount }] = await Promise.all([
    supabase.from('bookings').select('*').eq('business_id', business.id).in('status', ['pending', 'confirmed']).gte('date', new Date().toISOString().split('T')[0]).order('date').limit(5),
    supabase.from('reviews').select('*, client:profiles(full_name)').eq('business_id', business.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('bookings').select('client_id', { count: 'exact', head: true }).eq('business_id', business.id),
  ])

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{business.name}</h1>
          {business.is_approved ? (
            <Badge variant="success">Activo</Badge>
          ) : (
            <Badge variant="warning">Pendiente de aprobación</Badge>
          )}
        </div>
        {!business.is_approved && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mt-3">
            <p className="text-sm font-medium text-amber-800">
              Tu negocio está pendiente de revisión. Aparecerá en el catálogo una vez aprobado por el equipo de ReservaPro.
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { icon: Calendar, label: 'Próximas citas', value: bookings?.length ?? 0, color: 'text-indigo-600', bg: 'bg-indigo-50', ring: 'ring-indigo-100' },
          { icon: Users, label: 'Clientes totales', value: clientCount ?? 0, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-100' },
          { icon: Star, label: 'Valoración media', value: business.rating_avg > 0 ? business.rating_avg.toFixed(1) : '—', color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-100' },
        ].map(stat => (
          <div key={stat.label} className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow`}>
            <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center mb-4 ring-1 ${stat.ring}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</div>
            <div className="text-sm text-slate-500 mt-1 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Upcoming bookings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Próximas reservas</h2>
            <p className="text-sm text-slate-500 mt-0.5">Citas programadas para los próximos días</p>
          </div>
          <Link href="/dashboard/reservas" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
            Ver todas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {bookings && bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.map(b => (
              <div key={b.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{b.date} a las {b.start_time.slice(0, 5)}</p>
                </div>
                <Badge variant={b.status === 'confirmed' ? 'success' : 'warning'}>
                  {b.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-500 font-medium">No hay reservas próximas</p>
          </div>
        )}
      </div>

      {/* Recent reviews */}
      {reviews && reviews.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Últimas reseñas</h2>
              <p className="text-sm text-slate-500 mt-0.5">Lo que dicen tus clientes</p>
            </div>
          </div>
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                  ))}
                  <span className="text-xs text-slate-500 ml-1 font-medium">{(r as any).client?.full_name}</span>
                </div>
                {r.comment && <p className="text-sm text-slate-600 leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
