import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function readAccessTokenFromCookies(
  allCookies: { name: string; value: string }[],
  storageKey: string
): string | null {
  let raw = allCookies.find((c) => c.name === storageKey)?.value ?? null
  if (!raw) {
    const chunks: string[] = []
    for (let i = 0; ; i++) {
      const chunk = allCookies.find((c) => c.name === `${storageKey}.${i}`)?.value
      if (!chunk) break
      chunks.push(chunk)
    }
    if (chunks.length > 0) raw = chunks.join('')
  }
  if (!raw) return null

  try {
    const json = raw.startsWith('base64-')
      ? Buffer.from(raw.slice('base64-'.length), 'base64url').toString('utf-8')
      : raw
    const session = JSON.parse(json)
    return (session?.access_token as string) ?? null
  } catch {
    return null
  }
}

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  const storageKey = `sb-${projectRef}-auth-token`

  const allCookies = cookieStore.getAll()
  const accessToken = readAccessTokenFromCookies(allCookies, storageKey)

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    ...(accessToken && {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    }),
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {}
      },
    },
  })
}

// For server actions: bypasses PostgREST JWT verification entirely.
// Identity must be verified separately via auth.getUser() before calling this.
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables')
  }

  return createServerClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    cookies: { getAll: () => [], setAll: () => {} },
  })
}
