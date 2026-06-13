import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined') {
      // Client components can be evaluated while Vercel prerenders static pages.
      // Use a harmless placeholder client during that server-only pass.
      return createBrowserClient(
        'https://placeholder.supabase.co',
        'placeholder-anon-key'
      )
    }

    throw new Error('Supabase browser credentials are not configured')
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}
