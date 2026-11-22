import type { Metadata } from 'next'
import { ParleurDynamique } from './chargeur'

export const metadata: Metadata = { title: 'Parler' }

export default function PageParler() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Signer → voix</h1>
        <p className="text-doux">
          Posez le téléphone face à la personne qui signe. Chaque signe reconnu s’affiche et est dit à voix haute.
        </p>
      </header>
      <ParleurDynamique />
    </div>
  )
}
