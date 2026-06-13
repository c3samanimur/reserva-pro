import { createClient } from '@supabase/supabase-js'

const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 10

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase admin credentials not configured')
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function rateLimit(
  identifier: string,
  route: string
): Promise<{ success: boolean; remaining: number }> {
  const key = `${identifier}:${route}`
  const now = Date.now()
  const resetTime = now + WINDOW_MS

  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Upsert rate limit entry with atomic count increment
    const { data, error } = await supabaseAdmin
      .from('rate_limits')
      .select('count, reset_time')
      .eq('key', key)
      .single()

    if (error && error.code !== 'PGRST116') {
      // Database error — allow request to prevent blocking legitimate users
      console.warn('[RateLimit] DB error:', error)
      return { success: true, remaining: 0 }
    }

    if (!data || now > data.reset_time) {
      // Reset window
      const { error: upsertError } = await supabaseAdmin
        .from('rate_limits')
        .upsert(
          { key, count: 1, reset_time: resetTime },
          { onConflict: 'key' }
        )
      if (upsertError) {
        console.warn('[RateLimit] Upsert error:', upsertError)
        return { success: true, remaining: 0 }
      }
      return { success: true, remaining: MAX_REQUESTS - 1 }
    }

    if (data.count >= MAX_REQUESTS) {
      return { success: false, remaining: 0 }
    }

    // Increment count
    const { error: updateError } = await supabaseAdmin
      .from('rate_limits')
      .update({ count: data.count + 1 })
      .eq('key', key)

    if (updateError) {
      console.warn('[RateLimit] Update error:', updateError)
      return { success: true, remaining: 0 }
    }

    return { success: true, remaining: MAX_REQUESTS - data.count - 1 }
  } catch (err) {
    console.warn('[RateLimit] Exception:', err)
    // Fail open — don't block legitimate users on rate limiter errors
    return { success: true, remaining: 0 }
  }
}
