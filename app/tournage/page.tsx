import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { contexteTournage } from '@/lib/tournage/contexte'
import type { MesPrises, Signe } from '@/lib/types'
import { Bibliotheque } from './bibliotheque'

export const metadata: Metadata = { title: 'Bibliothèque de signes' }

export default async function PageTournage() {
  const { supabase, user, signeur, consentement, consentementAJour } = await contexteTournage()
  if (!signeur || !consentement || !consentementAJour) redirect('/tournage/consentement')

  const [{ data: signes, error }, { data: prises }] = await Promise.all([
    supabase
      .from('signes')
      .select('id, glose, mots_fr, categorie, type, priorite, notes, definition, reference_url')
      .order('priorite')
      .order('glose')
      .limit(2000)
      .returns<Signe[]>(),
    supabase
      .from('enregistrements')
      .select('signe_id, statut, motif_rejet, valide_le')
      .eq('signeur_id', user.id)
      .order('valide_le', { ascending: true, nullsFirst: true }),
  ])

  if (error) throw new Error(`Lecture des signes impossible : ${error.message}`)

  // Validateur·rice : nombre de prises des autres qui attendent une décision.
  const estValidateur = signeur.role === 'validateur' || signeur.role === 'admin'
  const { count: aValider } = estValidateur
    ? await supabase
        .from('enregistrements')
        .select('id', { count: 'exact', head: true })
        .eq('statut', 'en_attente')
        .neq('signeur_id', user.id)
    : { count: 0 }

  const mesPrises: MesPrises = {}
  for (const p of prises ?? []) {
    const m = (mesPrises[p.signe_id] ??= { total: 0, valides: 0 })
    m.total++
    if (p.statut === 'valide') m.valides++
    if (p.statut === 'rejete') {
      m.refusees = (m.refusees ?? 0) + 1
      m.motifRefus = p.motif_rejet // le plus récent (tri par date de décision)
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="titre text-3xl sm:text-4xl">Bibliothèque de signes</h1>
          <p className="text-doux">Bonjour {signeur.nom_affiche} 👋 Choisissez un signe et filmez-le comme vous le signez naturellement.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {estValidateur && (
            <Link href="/admin/validation" className="bouton bouton-primaire min-h-11 px-4 text-base">
              ✅ Valider des prises{aValider ? ` (${aValider})` : ''}
            </Link>
          )}
          <Link href="/tournage/consentement" className="bouton bouton-secondaire min-h-11 px-4 text-base">
            Profil et consentement
          </Link>
          <form action="/auth/deconnexion" method="post">
            <button className="min-h-11 rounded-lg px-3 text-doux underline">Déconnexion</button>
          </form>
        </div>
      </header>
      {signes && signes.length > 0 ? (
        <Bibliotheque
          signes={signes}
          mesPrisesInitiales={mesPrises}
          userId={user.id}
          consentementId={consentement.id}
          mainDominante={signeur.main_dominante}
        />
      ) : (
        <p className="rounded-lg bg-attention/10 p-4 text-attention">
          La liste des signes est vide : exécutez <code>supabase/seed.sql</code> dans Supabase.
        </p>
      )}
    </div>
  )
}
