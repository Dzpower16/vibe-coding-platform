'use client'

import { createBrowserClient } from '@supabase/ssr'
import { supabaseEnv } from './env'

let client: ReturnType<typeof createBrowserClient> | undefined

/** Client Supabase pour le navigateur (session dans les cookies). */
export function supabaseNavigateur() {
  if (!client) {
    const { url, key } = supabaseEnv()
    client = createBrowserClient(url, key)
  }
  return client
}
