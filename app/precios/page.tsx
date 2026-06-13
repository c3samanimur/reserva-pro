import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Check, Scissors, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const features = [
  'Perfil público de tu negocio',
  'Gestión ilimitada de servicios',
  'Calendario de reservas en tiempo real',
  'Notificaciones por email a clientes',
  'Visibilidad en el directorio de ReservaPro',
  'Soporte prioritario',
]

export default function PreciosPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <div className="bg-slate-950 py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
          <div className="max-w-3xl mx-auto px-4 text-center relative">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Un solo plan, todo incluido
            </h1>
            <p className="text-lg text-slate-400 mb-0 max-w-lg mx-auto leading-relaxed">
              Sin comisiones por reserva. Sin límites. Solo una cuota mensual fija.
            </p>
          </div>
        </div>

        {/* Pricing card */}
        <div className="max-w-lg mx-auto px-4 -mt-10 pb-24">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
            <div className="bg-indigo-600 p-10 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-2xl mb-5 ring-1 ring-white/20">
                <Scissors className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-3">Plan Negocio</h2>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-6xl font-bold text-white tracking-tight">25€</span>
                <span className="text-indigo-200 text-lg">/mes</span>
              </div>
              <p className="text-indigo-200 text-sm mt-3">Sin permanencia. Cancela cuando quieras.</p>
            </div>

            <div className="p-10">
              <ul className="space-y-4 mb-10">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5 ring-1 ring-emerald-100">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-slate-700 text-sm font-medium">{f}</span>
                  </li>
                ))}
              </ul>

              <Link href="/registro?tipo=negocio">
                <Button size="lg" className="w-full shadow-lg shadow-indigo-500/20">
                  Empezar ahora <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <p className="text-center text-xs text-slate-400 mt-4">
                El pago se procesa de forma segura a través de Stripe.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
