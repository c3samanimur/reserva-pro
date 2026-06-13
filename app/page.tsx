import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { BusinessCard } from '@/components/business/business-card'
import { Button } from '@/components/ui/button'
import { Search, Star, Shield, Clock, MapPin, ArrowRight } from 'lucide-react'
import { CATEGORY_LABELS } from '@/lib/utils'

export default async function Page() {
  const supabase = await createClient()

  const { data: businesses } = await supabase
    .from('businesses')
    .select('*, services(*)')
    .eq('is_approved', true)
    .eq('is_active', true)
    .order('rating_avg', { ascending: false })
    .limit(8)

  const { count: totalBusinesses } = await supabase
    .from('businesses')
    .select('id', { count: 'exact', head: true })
    .eq('is_approved', true)

  const categories = Object.entries(CATEGORY_LABELS)

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative bg-slate-950 overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-medium mb-8 ring-1 ring-indigo-500/20">
              <Shield className="w-3.5 h-3.5" />
              Negocios verificados
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.1] mb-6 text-white tracking-tight">
              Reserva tu cita en los
              <span className="text-indigo-400"> mejores salones</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-xl leading-relaxed">
              Peluquerías, barberías y centros de estética. Encuentra el lugar perfecto y reserva en segundos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/negocios">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  <Search className="w-4 h-4" />
                  Buscar negocios
                </Button>
              </Link>
              <Link href="/registro?tipo=negocio">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-slate-600 text-white hover:bg-slate-800 hover:text-white hover:border-slate-500">
                  Registrar mi negocio
                </Button>
              </Link>
            </div>

            <div className="flex gap-10 mt-14 pt-8 border-t border-slate-800">
              <div>
                <div className="text-3xl font-bold text-white">{totalBusinesses ?? 0}+</div>
                <div className="text-slate-500 text-sm mt-1">Negocios</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">100%</div>
                <div className="text-slate-500 text-sm mt-1">Verificados</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-slate-500 text-sm mt-1">Disponible</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Explorar por categoría</h2>
            <p className="text-slate-500">Encuentra el servicio que necesitas</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map(([key, label]) => (
              <Link
                key={key}
                href={`/negocios?categoria=${key}`}
                className="px-6 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/negocios"
              className="px-6 py-3 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-500/20"
            >
              Ver todos
            </Link>
          </div>
        </div>
      </section>

      {/* Featured businesses */}
      {businesses && businesses.length > 0 && (
        <section className="py-20 bg-slate-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Negocios destacados</h2>
                <p className="text-slate-500 mt-1">Los mejor valorados por nuestros clientes</p>
              </div>
              <Link href="/negocios" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                Ver todos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {businesses.map(b => (
                <BusinessCard key={b.id} business={b as any} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              ¿Por qué usar ReservaPro?
            </h2>
            <p className="text-slate-500 max-w-md mx-auto">
              La forma más sencilla de gestionar y reservar citas de belleza
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                icon: <Search className="w-6 h-6 text-indigo-600" />,
                title: 'Encuentra fácilmente',
                desc: 'Busca entre negocios verificados cerca de ti. Filtra por categoría, precio o valoración.',
              },
              {
                icon: <Clock className="w-6 h-6 text-indigo-600" />,
                title: 'Reserva en segundos',
                desc: 'Elige el servicio, el horario y listo. Sin llamadas, sin esperas. Confirmación instantánea.',
              },
              {
                icon: <Star className="w-6 h-6 text-indigo-600" />,
                title: 'Opiniones reales',
                desc: 'Lee las reseñas de otros clientes y elige con confianza. Valoraciones verificadas.',
              },
            ].map(f => (
              <div key={f.title} className="text-center group">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5 ring-1 ring-indigo-100 group-hover:ring-indigo-200 transition-all">
                  {f.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-lg">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-indigo-500/20">
            <MapPin className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            ¿Tienes una peluquería o barbería?
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
            Únete a ReservaPro y empieza a recibir reservas online. Gestiona tu agenda, servicios y clientes desde un solo lugar.
          </p>
          <Link href="/registro?tipo=negocio">
            <Button size="lg" className="bg-white text-indigo-700 hover:bg-slate-100 shadow-lg shadow-white/10">
              Registrar mi negocio gratis
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
