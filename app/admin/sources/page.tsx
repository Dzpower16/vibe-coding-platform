import type { Metadata } from 'next'
import { contexteAdmin } from '@/lib/admin/contexte'
import { AccesRefuse } from '@/components/acces-refuse'
import type { SourceExterne } from '@/lib/types'
import { GestionSources } from './gestion'

export const metadata: Metadata = { title: 'Accords écrits' }

export default async function PageSources() {
  const { supabase, user, estAdmin, signeur } = await contexteAdmin('/admin/sources')
  if (!estAdmin) return <AccesRefuse aProfil={!!signeur} />

  const { data: sources } = await supabase
    .from('sources_externes')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<SourceExterne[]>()

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="titre text-3xl sm:text-4xl">Accords écrits</h1>
        <p className="max-w-3xl text-doux">
          Une vidéo filmée hors d’Entre-Mains n’entre dans la bibliothèque que si son titulaire <strong>et</strong> les
          personnes filmées ont donné leur accord par écrit. Enregistrez ici chaque accord et sa preuve.
        </p>
      </header>
      <GestionSources userId={user.id} sources={sources ?? []} />
    </div>
  )
}
