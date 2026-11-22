import type { Metadata } from 'next'
import { AVenir } from '@/components/a-venir'

export const metadata: Metadata = { title: 'Conversation' }

export default function Conversation() {
  return (
    <AVenir titre="Conversation sur téléphone" etape="Étape 1e">
      <p>Un téléphone posé entre deux personnes : la moitié tournée vers la personne entendante affiche le texte, l’autre moitié montre les signes.</p>
    </AVenir>
  )
}
