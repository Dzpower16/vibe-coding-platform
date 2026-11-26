'use client'

import dynamic from 'next/dynamic'

// MediaPipe et MediaRecorder ne s'exécutent que dans le navigateur.
export const ImporteurDynamique = dynamic(() => import('./importeur').then((m) => m.Importeur), {
  ssr: false,
  loading: () => <p className="p-6 text-doux">Ouverture de l’outil d’import…</p>,
})
