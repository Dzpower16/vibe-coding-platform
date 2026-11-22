import type { Metadata } from 'next'
import { contexteTournage } from '@/lib/tournage/contexte'
import { FormulaireConsentement } from './formulaire'

export const metadata: Metadata = { title: 'Consentement' }

export default async function PageConsentement() {
  const { user, signeur, consentement, consentementAJour } = await contexteTournage()
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Votre profil et votre consentement</h1>
        <p className="text-doux">À remplir une seule fois avant de filmer. Vous pouvez revenir ici à tout moment.</p>
      </header>
      <FormulaireConsentement
        userId={user.id}
        signeur={signeur}
        consentement={consentement}
        consentementAJour={consentementAJour}
      />
    </div>
  )
}
