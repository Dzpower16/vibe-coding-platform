import type { Metadata } from 'next'
import { chargerLexique } from '@/lib/lsq/lexique'
import { Direct } from './direct'

export const metadata: Metadata = { title: 'Direct' }
export const dynamic = 'force-dynamic'

export default async function PageDirect() {
  let nbSignes = 0
  let nbLettres = 0
  try {
    const lexique = await chargerLexique()
    nbSignes = lexique.filter((s) => s.type === 'signe').length
    nbLettres = lexique.filter((s) => s.type === 'lettre' && /^LETTRE-[A-Z]$/.test(s.glose)).length
  } catch {
    // Sans clé secrète, la page s'affiche quand même ; l'API renverra un message clair.
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="titre text-3xl sm:text-4xl">Français → LSQ</h1>
        <p className="text-doux">
          Parlez près du téléphone : la phrase est remise en ordre LSQ et montrée avec des signes filmés par des personnes
          sourdes. Les mots sans signe sont épelés.
        </p>
      </header>
      <Direct nbSignes={nbSignes} nbLettres={nbLettres} />
    </div>
  )
}
