import 'server-only'
import { redirect } from 'next/navigation'
import { supabaseServeur } from '@/lib/supabase/server'

/** Personne connectée + vérification du rôle (la RLS reste la vraie barrière). */
export async function contexteAdmin(suite: string) {
  const supabase = await supabaseServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/connexion?suite=${encodeURIComponent(suite)}`)

  const { data: signeur } = await supabase
    .from('signeurs')
    .select('id, nom_affiche, role')
    .eq('id', user.id)
    .maybeSingle<{ id: string; nom_affiche: string; role: string }>()

  return {
    supabase,
    user,
    signeur,
    estAdmin: signeur?.role === 'admin',
    estValidateur: signeur?.role === 'admin' || signeur?.role === 'validateur',
  }
}
