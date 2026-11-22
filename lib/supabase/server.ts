import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseEnv } from './env'

/** Client Supabase pour composants serveur et route handlers (agit au nom de l'utilisateur·rice). */
export async function supabaseServeur() {
  const cookieStore = await cookies()
  const { url, key } = supabaseEnv()
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(aEcrire) {
        try {
          for (const { name, value, options } of aEcrire) cookieStore.set(name, value, options)
        } catch {
          // Appelé depuis un composant serveur : sans effet, proxy.ts rafraîchit la session.
        }
      },
    },
  })
}
