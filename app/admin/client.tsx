'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Check, X, EyeOff, Eye } from 'lucide-react'

interface Props {
  businessId: string
  action: 'approve' | 'deactivate'
  isActive?: boolean
}

export function AdminActions({ businessId, action, isActive }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const handleApprove = async () => {
    await supabase.from('businesses').update({ is_approved: true }).eq('id', businessId)
    router.refresh()
  }

  const handleReject = async () => {
    await supabase.from('businesses').delete().eq('id', businessId)
    router.refresh()
  }

  const handleToggle = async () => {
    await supabase.from('businesses').update({ is_active: !isActive }).eq('id', businessId)
    router.refresh()
  }

  if (action === 'approve') {
    return (
      <div className="flex gap-2">
        <Button size="sm" onClick={handleApprove}>
          <Check className="w-3.5 h-3.5 mr-1" /> Aprobar
        </Button>
        <Button size="sm" variant="destructive" onClick={handleReject}>
          <X className="w-3.5 h-3.5 mr-1" /> Rechazar
        </Button>
      </div>
    )
  }

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
        isActive ? 'text-slate-600 hover:text-red-600 hover:bg-red-50' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
      }`}
    >
      {isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      {isActive ? 'Desactivar' : 'Activar'}
    </button>
  )
}
