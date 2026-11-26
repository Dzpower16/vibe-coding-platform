import type { MetadataRoute } from 'next'

/** Permet d'installer Entre-Mains sur l'écran d'accueil (plein écran, comme une app). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Entre-Mains — français ↔ LSQ',
    short_name: 'Entre-Mains',
    description: 'Aide à la communication entre le français et la langue des signes québécoise (LSQ).',
    lang: 'fr-CA',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f8f7f4',
    theme_color: '#f8f7f4',
    categories: ['accessibility', 'education', 'utilities'],
    icons: [
      { src: '/icones/icone-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icones/icone-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icones/icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
