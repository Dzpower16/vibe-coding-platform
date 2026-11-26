import type { Metadata } from 'next'
import Link from 'next/link'
import { contexteAdmin } from '@/lib/admin/contexte'
import { AccesRefuse } from '@/components/acces-refuse'

export const metadata: Metadata = { title: 'Administration' }

const sections = [
  {
    href: '/admin/sources',
    titre: 'Accords écrits',
    texte: 'Enregistrer l’accord d’un·e créateur·rice et des personnes filmées, avec sa preuve.',
    etat: 'Ouvert',
  },
  {
    href: '/admin/import',
    titre: 'Importer des vidéos',
    texte: 'Déposer une vidéo autorisée, la découper signe par signe et calculer les mouvements.',
    etat: 'Ouvert',
  },
  {
    href: '/admin',
    titre: 'Validation',
    texte: 'Des personnes sourdes vérifient chaque prise avant qu’elle soit utilisée.',
    etat: 'À venir',
  },
]

export default async function Admin() {
  const { estAdmin, signeur } = await contexteAdmin('/admin')
  if (!estAdmin) return <AccesRefuse aProfil={!!signeur} />
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Administration</h1>
      <ul className="grid gap-4 sm:grid-cols-3">
        {sections.map((s) => (
          <li key={s.titre}>
            <Link href={s.href} className="flex h-full flex-col gap-2 rounded-2xl border border-ligne bg-carte p-5 hover:border-accent">
              <span className="text-xs font-semibold uppercase tracking-wide text-doux">{s.etat}</span>
              <span className="text-xl font-bold">{s.titre}</span>
              <span className="text-doux">{s.texte}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
