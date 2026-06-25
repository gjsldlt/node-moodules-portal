// This module must only be imported in Server Components, Server Actions, and Route Handlers.
// The 'server-only' guard enforces this at build time.
import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * Server-side Supabase client — uses the service role key.
 * Only call this from Server Components, Server Actions, and Route Handlers.
 * Never expose the service role key to the browser.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // setAll throws in Server Components — safe to ignore
            // when using the client for read-only operations.
          }
        },
      },
    },
  )
}
