'use client'

import dynamic from 'next/dynamic'

// La caméra et MediaPipe ne s'exécutent que dans le navigateur.
export const ParleurDynamique = dynamic(() => import('./parleur').then((m) => m.Parleur), {
  ssr: false,
  loading: () => <p className="p-6 text-doux">Ouverture…</p>,
})
