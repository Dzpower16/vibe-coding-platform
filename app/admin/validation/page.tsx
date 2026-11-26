import type { Metadata } from 'next'
import Link from 'next/link'
import { contexteAdmin } from '@/lib/admin/contexte'
import { AccesRefuse } from '@/components/acces-refuse'
import type { PriseAValider } from '@/lib/types'
import { Validation } from './validation'

export const metadata: Metadata = { title: 'Validation' }

const COLONNES = `id, video_path, mime, duree_ms, debut_ms, fin_ms, main_dominante, variante, commentaire, origine,
  signeur_externe, created_at, statut, motif_rejet, valide_le, signeur_id,
  signe:signes(id, glose, mots_fr, definition, categorie, reference_url, notes),
  signeur:signeurs!enregistrements_signeur_id_fkey(nom_affiche, identite, region),
  consentement:consentements(revoque_le),
  source:sources_externes(revoque_le)`

type Ligne = Omit<PriseAValider, 'video_url' | 'deja_valides'> & {
  video_path: string
  signeur_id: string
  consentement: { revoque_le: string | null } | null
  source: { revoque_le: string | null } | null
}

/** Durée de vie des liens vidéo privés (l'onglet reste ouvert pendant la séance). */
const DUREE_LIEN_S = 60 * 60

export default async function PageValidation() {
  const { supabase, user, signeur, estValidateur, estAdmin } = await contexteAdmin('/admin/validation')
  if (!estValidateur) return <AccesRefuse aProfil={!!signeur} role="validateur" />

  const [{ data: enAttente, error }, { data: decisions }, { count: mesPrisesEnAttente }] = await Promise.all([
    supabase
      .from('enregistrements')
      .select(COLONNES)
      .eq('statut', 'en_attente')
      .neq('signeur_id', user.id) // on ne valide jamais ses propres prises (aussi bloqué par la base)
      .order('created_at')
      .limit(40)
      .returns<Ligne[]>(),
    supabase
      .from('enregistrements')
      .select(COLONNES)
      .eq('valide_par', user.id)
      .order('valide_le', { ascending: false })
      .limit(20)
      .returns<Ligne[]>(),
    supabase
      .from('enregistrements')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'en_attente')
      .eq('signeur_id', user.id),
  ])
  if (error) throw new Error(`Lecture de la file impossible : ${error.message}`)

  // Une prise dont le consentement (ou l'accord écrit) est retiré ne doit pas être validée.
  const utilisables = (enAttente ?? []).filter((l) => !l.consentement?.revoque_le && !l.source?.revoque_le)
  const toutes = [...utilisables, ...(decisions ?? [])]

  // Liens vidéo privés et nombre de prises déjà validées par signe.
  const chemins = [...new Set(toutes.map((l) => l.video_path))]
  const idsSignes = [...new Set(toutes.map((l) => l.signe.id))]
  const [{ data: liens }, { data: valides }] = await Promise.all([
    chemins.length
      ? supabase.storage.from('videos-signes').createSignedUrls(chemins, DUREE_LIEN_S)
      : Promise.resolve({ data: [] as { path: string | null; signedUrl: string }[] }),
    idsSignes.length
      ? supabase.from('enregistrements').select('signe_id').eq('statut', 'valide').in('signe_id', idsSignes)
      : Promise.resolve({ data: [] as { signe_id: number }[] }),
  ])
  const urlPar = new Map((liens ?? []).map((l) => [l.path, l.signedUrl]))
  const validesPar = new Map<number, number>()
  for (const v of valides ?? []) validesPar.set(v.signe_id, (validesPar.get(v.signe_id) ?? 0) + 1)

  const enPrise = (l: Ligne): PriseAValider => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- on retire les champs internes
    const { video_path, signeur_id, consentement, source, ...reste } = l
    return { ...reste, video_url: urlPar.get(video_path) ?? null, deja_valides: validesPar.get(l.signe.id) ?? 0 }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="surtitre">Validation</p>
        <h1 className="titre text-3xl sm:text-5xl">Vérifier les prises</h1>
        <p className="texte-doux max-w-3xl text-lg">
          Chaque vidéo est regardée par une personne de la communauté avant de servir dans l’application. Vous êtes juge
          de la qualité : le code ne décide rien à votre place.
        </p>
        {estAdmin && (
          <p className="text-sm">
            <Link href="/admin" className="font-semibold text-accent hover:underline">
              ← Administration
            </Link>
          </p>
        )}
      </header>
      <Validation
        aValiderInitial={utilisables.map(enPrise)}
        historiqueInitial={(decisions ?? []).map(enPrise)}
        mesPrisesEnAttente={mesPrisesEnAttente ?? 0}
      />
    </div>
  )
}
