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
    supabase.from('enregistrements').select('signe_id, statut').eq('signeur_id', user.id),
  ])

  if (error) throw new Error(`Lecture des signes impossible : ${error.message}`)

  const mesPrises: MesPrises = {}
  for (const p of prises ?? []) {
    const m = (mesPrises[p.signe_id] ??= { total: 0, valides: 0 })
    m.total++
    if (p.statut === 'valide') m.valides++
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bibliothèque de signes</h1>
          <p className="text-doux">Bonjour {signeur.nom_affiche} 👋 Choisissez un signe et filmez-le comme vous le signez naturellement.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tournage/consentement" className="inline-flex min-h-11 items-center rounded-lg border border-ligne bg-carte px-3">
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
