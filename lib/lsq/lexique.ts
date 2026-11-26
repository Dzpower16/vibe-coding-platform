import 'server-only'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { EntreeLexique } from '@/lib/lsq/prompt'

/**
 * Lexique du direct (vue `lexique`, CLAUDE.md §6) et vidéos à lire.
 * Clé secrète : la vue est en `security_invoker`, et une personne connectée ne voit pas les prises des
 * autres par RLS. On ne renvoie au navigateur que des URL signées de courte durée (§11).
 */

export interface SigneLexique extends EntreeLexique {
  type: 'signe' | 'lettre' | 'chiffre'
}

export interface VideoSigne {
  url: string
  debut_ms: number | null
  fin_ms: number | null
}

const DUREE_CACHE_MS = 60_000
const DUREE_LIEN_S = 60 * 60

let cache: { expire: number; lexique: SigneLexique[] } | null = null

export async function chargerLexique(): Promise<SigneLexique[]> {
  if (cache && cache.expire > Date.now()) return cache.lexique
  const { data, error } = await supabaseAdmin()
    .from('lexique')
    .select('glose, mots_fr, type')
    .order('glose')
    .returns<SigneLexique[]>()
  if (error) throw new Error(`Lexique illisible : ${error.message}`)
  const lexique = data ?? []
  cache = { expire: Date.now() + DUREE_CACHE_MS, lexique }
  return lexique
}

interface LigneVideo {
  video_path: string
  debut_ms: number | null
  fin_ms: number | null
  created_at: string
  signes: { glose: string } | null
}

/**
 * Une vidéo par glose (la plus récente prise validée dont le consentement ou l'accord est actif),
 * avec une URL signée d'une heure. Mêmes conditions que la vue `lexique`.
 */
export async function videosPour(gloses: readonly string[]): Promise<Map<string, VideoSigne>> {
  const uniques = [...new Set(gloses)]
  const resultat = new Map<string, VideoSigne>()
  if (!uniques.length) return resultat

  const admin = supabaseAdmin()
  const colonnes = 'video_path, debut_ms, fin_ms, created_at, signes!inner(glose)'
  const [tournage, externes] = await Promise.all([
    admin
      .from('enregistrements')
      .select(`${colonnes}, consentements!inner(revoque_le)`)
      .eq('origine', 'tournage')
      .eq('statut', 'valide')
      .is('consentements.revoque_le', null)
      .in('signes.glose', uniques)
      .returns<LigneVideo[]>(),
    admin
      .from('enregistrements')
      .select(`${colonnes}, sources_externes!inner(revoque_le, portee_application)`)
      .eq('origine', 'externe')
      .eq('statut', 'valide')
      .is('sources_externes.revoque_le', null)
      .eq('sources_externes.portee_application', true)
      .in('signes.glose', uniques)
      .returns<LigneVideo[]>(),
  ])
  const erreur = tournage.error ?? externes.error
  if (erreur) throw new Error(`Vidéos illisibles : ${erreur.message}`)

  const choisies = new Map<string, LigneVideo>()
  for (const l of [...(tournage.data ?? []), ...(externes.data ?? [])]) {
    const glose = l.signes?.glose
    if (!glose) continue
    const deja = choisies.get(glose)
    if (!deja || l.created_at > deja.created_at) choisies.set(glose, l)
  }
  if (!choisies.size) return resultat

  const lignes = [...choisies.entries()]
  const { data: liens, error } = await admin.storage
    .from('videos-signes')
    .createSignedUrls(
      lignes.map(([, l]) => l.video_path),
      DUREE_LIEN_S,
    )
  if (error) throw new Error(`Liens vidéo impossibles : ${error.message}`)

  lignes.forEach(([glose, l], i) => {
    const url = liens?.[i]?.signedUrl
    if (url) resultat.set(glose, { url, debut_ms: l.debut_ms, fin_ms: l.fin_ms })
  })
  return resultat
}
