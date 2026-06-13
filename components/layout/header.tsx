'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Scissors, Menu, X, ChevronDown, User, Calendar, LayoutDashboard, LogOut } from 'lucide-react'
import type { Profile } from '@/types/database'

export function Header() {
  const [user, setUser] = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) return
      const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
      if (data) setUser(data)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session) { setUser(null); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (data) setUser(data)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-700 transition-colors">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">ReservaPro</span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1">
            <Link 
              href="/negocios" 
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
            >
              Negocios
            </Link>
            {user?.role === 'business' && (
              <Link 
                href="/dashboard" 
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
              >
                Mi negocio
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link 
                href="/admin" 
                className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Auth section */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 pl-2 pr-3 py-1.5 rounded-lg transition-all"
                >
                  <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-indigo-700">
                      {user.full_name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span className="max-w-[120px] truncate">{user.full_name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-100 py-1.5 z-50 overflow-hidden">
                    <div className="px-3 py-2 border-b border-slate-50 mb-1">
                      <p className="text-sm font-semibold text-slate-900">{user.full_name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    {user.role === 'client' && (
                      <Link
                        href="/mis-reservas"
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <Calendar className="w-4 h-4 text-slate-400" /> Mis reservas
                      </Link>
                    )}
                    {user.role === 'business' && (
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" /> Dashboard
                      </Link>
                    )}
                    <hr className="my-1 border-slate-50" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Iniciar sesión</Button>
                </Link>
                <Link href="/registro">
                  <Button size="sm">Registrarse</Button>
                </Link>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button 
            className="md:hidden p-2 hover:bg-slate-50 rounded-lg transition-colors" 
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5 text-slate-600" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-slate-100 space-y-1">
            <Link 
              href="/negocios" 
              className="block px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
              onClick={() => setMenuOpen(false)}
            >
              Negocios
            </Link>
            {user ? (
              <>
                {user.role === 'client' && (
                  <Link 
                    href="/mis-reservas" 
                    className="block px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                    onClick={() => setMenuOpen(false)}
                  >
                    Mis reservas
                  </Link>
                )}
                {user.role === 'business' && (
                  <Link 
                    href="/dashboard" 
                    className="block px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                <button 
                  onClick={() => { handleLogout(); setMenuOpen(false); }} 
                  className="block w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <div className="flex gap-2 px-3 pt-2">
                <Link href="/login" className="flex-1" onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">Iniciar sesión</Button>
                </Link>
                <Link href="/registro" className="flex-1" onClick={() => setMenuOpen(false)}>
                  <Button size="sm" className="w-full">Registrarse</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
