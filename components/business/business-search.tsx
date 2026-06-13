'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, MapPin, X } from 'lucide-react'
import { CATEGORY_LABELS } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Props {
  initialQ?: string
  initialCiudad?: string
  initialCategoria?: string
}

export function BusinessSearch({ initialQ, initialCiudad, initialCategoria }: Props) {
  const [q, setQ] = useState(initialQ ?? '')
  const [ciudad, setCiudad] = useState(initialCiudad ?? '')
  const [categoria, setCategoria] = useState(initialCategoria ?? '')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (ciudad) params.set('ciudad', ciudad)
    if (categoria) params.set('categoria', categoria)
    router.push(`/negocios?${params.toString()}`)
  }

  const handleCategoryClick = (key: string) => {
    const next = categoria === key ? '' : key
    setCategoria(next)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (ciudad) params.set('ciudad', ciudad)
    if (next) params.set('categoria', next)
    router.push(`/negocios?${params.toString()}`)
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSearch} className="flex gap-3 flex-col sm:flex-row">
        <Input
          placeholder="Buscar negocio..."
          value={q}
          onChange={e => setQ(e.target.value)}
          icon={<Search className="w-4 h-4" />}
          className="flex-1"
        />
        <Input
          placeholder="Ciudad..."
          value={ciudad}
          onChange={e => setCiudad(e.target.value)}
          icon={<MapPin className="w-4 h-4" />}
          className="sm:w-48"
        />
        <Button type="submit" size="md" className="sm:w-auto">Buscar</Button>
      </form>

      <div className="flex gap-2 flex-wrap">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => handleCategoryClick(key)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold transition-all border',
              categoria === key
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            )}
          >
            {label}
          </button>
        ))}
        {(q || ciudad || categoria) && (
          <button
            type="button"
            onClick={() => {
              setQ(''); setCiudad(''); setCategoria('')
              router.push('/negocios')
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-all"
          >
            <X className="w-3.5 h-3.5" /> Limpiar filtros
          </button>
        )}
      </div>
    </div>
  )
}
