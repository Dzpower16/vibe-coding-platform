import type { Metadata } from 'next'
import { AVenir } from '@/components/a-venir'

export const metadata: Metadata = { title: 'Validation' }

export default function Admin() {
  return (
    <AVenir titre="Validation des vidéos" etape="Étape 1c">
      <p>Les validateur·rice·s sourd·e·s regardent chaque prise, ajustent le rognage et la marquent valide ou rejetée. Seules les prises valides entrent dans le lexique du direct.</p>
    </AVenir>
  )
}
