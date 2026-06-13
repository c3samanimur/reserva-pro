import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (pathname === '/dashboard/suscripcion') {
      setChecked(true)
      return
    }

    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data: businesses } = await supabase.from('businesses').select('id').eq('owner_id', user.id).limit(1)
      if (!businesses || businesses.length === 0) { setChecked(true); return } // No business yet, allow onboarding
      const business = businesses[0]
      const { data: subscription } = await supabase.from('subscriptions').select('status').eq('business_id', business.id).maybeSingle()
      if (subscription?.status !== 'active') {
        router.push('/dashboard/suscripcion')
        return
      }
      setChecked(true)
    })
  }, [pathname, router])

  if (!checked) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  return <>{children}</>
}