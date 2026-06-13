'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Scissors, Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nueva-contrasena`,
    })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
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
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Recuperar contraseña</h1>
          <p className="text-slate-500">Te enviaremos un enlace para restablecerla</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-emerald-100">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">¡Revisa tu email!</h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Hemos enviado un enlace a <strong className="text-slate-900">{email}</strong> para restablecer tu contraseña.
              </p>
              <Link href="/login" className="text-indigo-600 font-semibold hover:text-indigo-700 text-sm transition-colors">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
              />
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 font-medium">{error}</div>
              )}
              <Button type="submit" size="lg" loading={loading} className="w-full">
                Enviar enlace
              </Button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100">
            <Link href="/login" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 justify-center font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
