import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Entre-Mains', template: '%s · Entre-Mains' },
  description: 'Français ↔ langue des signes québécoise (LSQ), en temps réel.',
  applicationName: 'Entre-Mains',
  // Installée sur l'écran d'accueil d'un iPhone : plein écran, sans barre Safari.
  appleWebApp: { capable: true, title: 'Entre-Mains', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f8f7f4',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-CA">
      <body className="min-h-dvh">
        <a
          href="#contenu"
          className="sr-only rounded-lg bg-accent px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50"
        >
          Aller au contenu
        </a>
        <header className="border-b border-ligne bg-carte pt-[env(safe-area-inset-top)]">
          <nav
            aria-label="Navigation principale"
            className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6"
          >
            <Link href="/" className="flex min-h-11 items-center gap-2 text-xl font-bold">
              <span aria-hidden>🤲</span> Entre-Mains
            </Link>
            <Navigation />
          </nav>
        </header>
        <main id="contenu" className="mx-auto max-w-6xl px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </main>
      </body>
    </html>
  )
}
