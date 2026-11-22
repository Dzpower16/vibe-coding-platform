import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Client avec la clé secrète : contourne RLS. Serveur uniquement,
 * pour les opérations que l'utilisateur·rice ne peut pas faire seul·e (URL signées du lexique, etc.).
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SECRET_KEY
  if (!url || !secret) throw new Error('SUPABASE_SECRET_KEY manquante')
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
}
