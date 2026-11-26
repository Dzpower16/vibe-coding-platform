'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const liens = [
  { href: '/parler', icone: '✋', libelle: 'Signer → voix', bientot: false },
  { href: '/tournage', icone: '🎬', libelle: 'Bibliothèque', bientot: false },
  { href: '/direct', icone: '🎙️', libelle: 'Direct', bientot: true },
  { href: '/conversation', icone: '💬', libelle: 'Conversation', bientot: true },
]

export function Navigation() {
  const chemin = usePathname()

  return (
    <ul className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap">
      {liens.map((l) => {
        const actif = chemin === l.href || chemin.startsWith(`${l.href}/`)
        return (
          <li key={l.href}>
            <Link
              href={l.href}
              aria-current={actif ? 'page' : undefined}
              // Pages protégées ou à venir : pas de préchargement inutile sur mobile.
              prefetch={false}
              className={`flex min-h-11 min-w-0 flex-wrap items-center gap-x-1.5 rounded-lg px-3 py-1 font-medium transition sm:inline-flex ${
                actif ? 'bg-accent text-white' : 'hover:bg-fond'
              }`}
            >
              <span aria-hidden>{l.icone}</span>
              {l.libelle}
              {l.bientot && (
                <span
                  className={`rounded-full px-1.5 text-[0.7rem] font-semibold uppercase ${
                    actif ? 'bg-white/20' : 'bg-ligne text-doux'
                  }`}
                >
                  Bientôt
                </span>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
