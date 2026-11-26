import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { NavigationBas, NavigationHaut } from '@/components/navigation'
import './globals.css'

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
  themeColor: '#ffffff',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-CA">
      <body className="flex min-h-dvh flex-col">
        <a
          href="#contenu"
          className="sr-only rounded-lg bg-accent px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50"
        >
          Aller au contenu
        </a>
        <header className="sticky top-0 z-30 border-b border-ligne bg-carte/95 pt-[env(safe-area-inset-top)] backdrop-blur">
          <nav
            aria-label="Navigation principale"
            className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:justify-start sm:gap-6"
          >
            <Link href="/" className="flex min-h-11 items-center gap-2 text-xl font-bold">
              {/* eslint-disable-next-line @next/next/no-img-element -- icône SVG locale, taille fixe */}
              <img src="/icon.svg" alt="" width={32} height={32} className="size-8 rounded-lg" />
              Entre-Mains
            </Link>
            <NavigationHaut />
          </nav>
        </header>

        <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 sm:pb-10 sm:pt-8">
          {children}
        </main>

        <footer className="hidden border-t border-ligne bg-carte sm:block">
          <div className="mx-auto max-w-6xl px-4 py-5 text-sm text-doux">
            Entre-Mains est une aide à la communication. Elle ne remplace pas un·e interprète professionnel·le
            (santé, justice, urgence).
          </div>
        </footer>

        <NavigationBas />
      </body>
    </html>
  )
}
