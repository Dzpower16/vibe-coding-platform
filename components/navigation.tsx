'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const liens = [
  { href: '/parler', icone: '✋', libelle: 'Signer → voix', court: 'Signer', bientot: false },
  { href: '/tournage', icone: '🎬', libelle: 'Bibliothèque', court: 'Bibliothèque', bientot: false },
  { href: '/direct', icone: '🎙️', libelle: 'Direct', court: 'Direct', bientot: true },
  { href: '/conversation', icone: '💬', libelle: 'Conversation', court: 'Face à face', bientot: true },
]

function estActif(chemin: string, href: string) {
  return chemin === href || chemin.startsWith(`${href}/`)
}

/** Ordinateur et tablette : liens dans l'en-tête. */
export function NavigationHaut() {
  const chemin = usePathname()
  return (
    <ul className="hidden flex-wrap gap-1 sm:flex">
      {liens.map((l) => {
        const actif = estActif(chemin, l.href)
        return (
          <li key={l.href}>
            <Link
              href={l.href}
              aria-current={actif ? 'page' : undefined}
              prefetch={false}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-[15px] font-medium transition ${
                actif ? 'bg-accent-doux text-accent' : 'text-doux hover:bg-carte hover:text-encre'
              }`}
            >
              <span aria-hidden>{l.icone}</span>
              {l.libelle}
              {l.bientot && (
                <span className="pastille bg-ligne text-[0.65rem] text-doux">Bientôt</span>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

/** Téléphone : barre d'onglets en bas, à portée du pouce (comme une app). */
export function NavigationBas() {
  const chemin = usePathname()
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ligne/70 bg-fond/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
    >
      <ul className="grid grid-cols-4">
        {liens.map((l) => {
          const actif = estActif(chemin, l.href)
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={actif ? 'page' : undefined}
                prefetch={false}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-0.5 px-1 text-xs font-semibold transition ${
                  actif ? 'text-accent' : 'text-doux'
                }`}
              >
                {actif && <span aria-hidden className="absolute inset-x-5 top-0 h-1 rounded-b-full bg-accent" />}
                <span aria-hidden className={`text-2xl leading-none ${l.bientot && !actif ? 'opacity-60' : ''}`}>
                  {l.icone}
                </span>
                <span className="text-center leading-tight">{l.court}</span>
                {l.bientot && <span className="text-[0.65rem] font-medium leading-none text-doux">bientôt</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
