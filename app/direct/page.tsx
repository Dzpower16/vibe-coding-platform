import type { Metadata } from 'next'
import { AVenir } from '@/components/a-venir'

export const metadata: Metadata = { title: 'Direct' }

export default function Direct() {
  return (
    <AVenir titre="Direct : français → LSQ" etape="Étape 1d">
      <p>Micro → texte français (Gladia) → phrase remise en ordre LSQ par Claude, avec seulement les signes filmés et validés → vidéos enchaînées.</p>
      <p>Les mots sans signe filmé sont épelés avec l’alphabet LSQ.</p>
    </AVenir>
  )
}
