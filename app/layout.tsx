import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Entre-Mains', template: '%s · Entre-Mains' },
  description: 'Français ↔ langue des signes québécoise (LSQ), en temps réel.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f8f7f4',
}

const liens = [
  { href: '/parler', libelle: 'Signer → voix' },
  { href: '/direct', libelle: 'Direct' },
  { href: '/conversation', libelle: 'Conversation' },
  { href: '/tournage', libelle: 'Bibliothèque' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-CA">
      <body className="min-h-dvh">
        <header className="border-b border-ligne bg-carte">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold">
              <span aria-hidden>🤲</span> Entre-Mains
            </Link>
            <ul className="flex flex-wrap gap-1">
              {liens.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-flex min-h-11 items-center rounded-lg px-3 font-medium hover:bg-fond"
                  >
                    {l.libelle}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
