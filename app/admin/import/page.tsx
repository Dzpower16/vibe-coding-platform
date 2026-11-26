import type { Metadata } from 'next'
import Link from 'next/link'
import { contexteAdmin } from '@/lib/admin/contexte'
import { AccesRefuse } from '@/components/acces-refuse'
import type { Signe, SourceExterne } from '@/lib/types'
import { ImporteurDynamique } from './chargeur'

export const metadata: Metadata = { title: 'Importer des vidéos' }

export default async function PageImport() {
  const { supabase, user, estAdmin, signeur } = await contexteAdmin('/admin/import')
  if (!estAdmin) return <AccesRefuse aProfil={!!signeur} />

  const [{ data: sources }, { data: signes }] = await Promise.all([
    supabase
      .from('sources_externes')
      .select('*')
      .is('revoque_le', null)
      .order('titulaire')
      .returns<SourceExterne[]>(),
    supabase
      .from('signes')
      .select('id, glose, mots_fr, categorie, type, priorite, notes, definition, reference_url')
      .order('glose')
      .limit(2000)
      .returns<Signe[]>(),
  ])

  const actives = (sources ?? []).filter((s) => s.portee_application || s.portee_reconnaissance)

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="titre text-3xl sm:text-4xl">Importer des vidéos autorisées</h1>
        <p className="max-w-3xl text-doux">
          Déposez une vidéo dont l’accord écrit est enregistré, marquez le début et la fin de chaque signe : chaque
          segment devient une prise séparée, avec ses mouvements de mains. Les prises importées passent par la
          validation comme les autres.
        </p>
      </header>
      {actives.length === 0 ? (
        <p className="rounded-lg bg-attention/10 p-4 text-attention">
          Aucun accord actif.{' '}
          <Link href="/admin/sources" className="underline">
            Enregistrez d’abord un accord écrit
          </Link>
          .
        </p>
      ) : (
        <ImporteurDynamique userId={user.id} sources={actives} signes={signes ?? []} />
      )}
    </div>
  )
}
