import Link from 'next/link'
import { Scissors } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Scissors className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">ReservaPro</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
              La plataforma de reservas para peluquerías, barberías y centros de estética.
              Encuentra y reserva cita en los mejores salones cerca de ti.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Para clientes</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/negocios" className="hover:text-white transition-colors">
                  Buscar negocios
                </Link>
              </li>
              <li>
                <Link href="/mis-reservas" className="hover:text-white transition-colors">
                  Mis reservas
                </Link>
              </li>
              <li>
                <Link href="/registro" className="hover:text-white transition-colors">
                  Crear cuenta
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Para negocios</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/registro?tipo=negocio" className="hover:text-white transition-colors">
                  Registrar mi negocio
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Panel de control
                </Link>
              </li>
              <li>
                <Link href="/precios" className="hover:text-white transition-colors">
                  Precios
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} ReservaPro. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-xs">
            <Link href="#" className="text-slate-500 hover:text-slate-300 transition-colors">
              Privacidad
            </Link>
            <Link href="#" className="text-slate-500 hover:text-slate-300 transition-colors">
              Términos
            </Link>
            <Link href="#" className="text-slate-500 hover:text-slate-300 transition-colors">
              Contacto
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
