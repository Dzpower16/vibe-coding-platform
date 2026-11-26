import 'server-only'
import { redirect } from 'next/navigation'
import { supabaseServeur } from '@/lib/supabase/server'
import { CONSENTEMENT_VERSION } from '@/lib/consentement'
import type { Consentement, Signeur } from '@/lib/types'

/** Utilisateur·rice connecté·e + profil + consentement actif le plus récent. */
export async function contexteTournage() {
  const supabase = await supabaseServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion?suite=/tournage')

  const [{ data: signeur }, { data: consentements }] = await Promise.all([
    supabase
      .from('signeurs')
      .select('id, nom_affiche, identite, region, main_dominante, role')
      .eq('id', user.id)
      .maybeSingle<Signeur>(),
    supabase
      .from('consentements')
      .select('id, version, nom_signature, portee_application, portee_reconnaissance, portee_avatar, portee_credit_public, portee_promotion, signe_le, revoque_le')
      .eq('signeur_id', user.id)
      .is('revoque_le', null)
      .order('signe_le', { ascending: false })
      .limit(1)
      .returns<Consentement[]>(),
  ])

  const consentement = consentements?.[0] ?? null
  return {
    supabase,
    user,
    signeur: signeur ?? null,
    consentement,
    consentementAJour: consentement?.version === CONSENTEMENT_VERSION,
  }
}
