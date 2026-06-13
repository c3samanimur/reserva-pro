import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Scissors, LayoutDashboard, Briefcase, Clock, Calendar, CreditCard, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/perfil', label: 'Mi negocio', icon: Briefcase },
  { href: '/dashboard/servicios', label: 'Servicios', icon: Scissors },
  { href: '/dashboard/staff', label: 'Empleados', icon: Users },
  { href: '/dashboard/horarios', label: 'Horarios', icon: Clock },
  { href: '/dashboard/reservas', label: 'Reservas', icon: Calendar },
  { href: '/dashboard/suscripcion', label: 'Suscripción', icon: CreditCard },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'business') redirect('/')

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 gap-8 py-8">
        {/* Sidebar */}
        <aside className="md:w-56 flex-shrink-0">
          <nav className="space-y-0.5 sticky top-24">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
