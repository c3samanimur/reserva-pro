'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Scissors, Mail, Lock, User, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

type Role = 'client' | 'business'

function RegistroFormInner() {
  const searchParams = useSearchParams()
  const initialRole: Role = searchParams.get('tipo') === 'negocio' ? 'business' : 'client'

  const [role, setRole] = useState<Role>(initialRole)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Register via server endpoint (bypasses Supabase Auth confirmation email)
    const registerRes = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, role }),
    })

    if (!registerRes.ok) {
      const data = await registerRes.json().catch(() => ({}))
      setError(data.error || 'Error al crear la cuenta')
      setLoading(false)
      return
    }

    // Log in immediately to get a session
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError('Cuenta creada, pero hubo un error al iniciar sesión. Intenta iniciar sesión manualmente.')
      setLoading(false)
      return
    }

    // Send welcome email (non-blocking)
    fetch('/api/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName, role }),
    }).catch(() => {
      // Silently fail
    })

    router.push(role === 'business' ? '/dashboard/onboarding' : '/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-700 transition-colors">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">ReservaPro</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Crear cuenta</h1>
          <p className="text-slate-500">Elige cómo quieres usar ReservaPro</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('client')}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                role === 'client' 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
              )}
            >
              <User className="w-5 h-5" />
              <span className="text-sm font-semibold">Soy cliente</span>
              <span className="text-xs text-center opacity-70">Quiero reservar citas</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('business')}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                role === 'business' 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
              )}
            >
              <Briefcase className="w-5 h-5" />
              <span className="text-sm font-semibold">Tengo un negocio</span>
              <span className="text-xs text-center opacity-70">Quiero recibir reservas</span>
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Nombre completo"
              type="text"
              placeholder={role === 'business' ? 'Tu nombre' : 'Tu nombre completo'}
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              icon={<User className="w-4 h-4" />}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              minLength={8}
              required
            />
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 font-medium">
                {error}
              </div>
            )}
            <Button type="submit" size="lg" loading={loading} className="w-full">
              {role === 'business' ? 'Crear cuenta de negocio' : 'Crear cuenta gratis'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export function RegistroForm() {
  return (
    <Suspense>
      <RegistroFormInner />
    </Suspense>
  )
}
