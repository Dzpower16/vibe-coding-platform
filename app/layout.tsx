import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import Link from 'next/link'
import { NavigationBas, NavigationHaut } from '@/components/navigation'
import './globals.css'

// Polices copiées dans le site au build (aucun appel à Google côté visiteur).
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap', weight: ['600', '700', '800'] })

export const metadata: Metadata = {
  title: { default: 'Entre-Mains — français ↔ LSQ', template: '%s · Entre-Mains' },
  description:
    'Aide à la communication entre le français et la langue des signes québécoise (LSQ), avec des signes filmés par des personnes sourdes.',
  applicationName: 'Entre-Mains',
  // Installée sur l'écran d'accueil d'un iPhone : plein écran, sans barre Safari.
  appleWebApp: { capable: true, title: 'Entre-Mains', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fafaf8',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-CA" className={`${inter.variable} ${playfair.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#contenu"
          className="sr-only rounded-lg bg-accent px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50"
        >
          Aller au contenu
        </a>
        <header className="sticky top-0 z-30 border-b border-ligne/70 bg-fond/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
          <nav
            aria-label="Navigation principale"
            className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:justify-start sm:gap-6"
          >
            <Link href="/" className="flex min-h-11 items-center gap-2.5 font-serif text-[1.35rem] font-bold tracking-tight">
              {/* eslint-disable-next-line @next/next/no-img-element -- icône SVG locale, taille fixe */}
              <img src="/icon.svg" alt="" width={32} height={32} className="size-8 rounded-lg" />
              Entre-Mains
            </Link>
            <NavigationHaut />
            <Link
              href="/guide"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-[15px] font-medium text-doux transition hover:bg-carte hover:text-encre sm:ml-auto"
            >
              <span aria-hidden className="grid size-6 place-items-center rounded-full border-2 border-current text-xs font-bold">?</span>
              Guide
            </Link>
          </nav>
        </header>

        <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 sm:pb-10 sm:pt-8">
          {children}
        </main>

        <footer className="hidden border-t border-ligne sm:block">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-doux">
            <p className="flex items-center gap-4">
              <span className="font-serif text-base font-bold text-encre">Entre-Mains</span>
              <Link href="/guide" className="font-medium text-accent hover:underline">
                Guide d’utilisation
              </Link>
            </p>
            <p className="max-w-xl">
              Une aide à la communication. Elle ne remplace pas un·e interprète professionnel·le (santé, justice,
              urgence).
            </p>
          </div>
        </footer>

        <NavigationBas />
      </body>
    </html>
  )
}
