import type { Metadata } from 'next'
import { cheminSur } from '@/lib/redirection'
import { FormulaireConnexion } from './formulaire'

export const metadata: Metadata = { title: 'Connexion' }

export default async function Connexion({ searchParams }: { searchParams: Promise<{ suite?: string; erreur?: string }> }) {
  const { suite, erreur } = await searchParams
  return (
    <div className="mx-auto max-w-md space-y-5 sm:pt-6">
      <div className="space-y-2 text-center">
        <p aria-hidden className="text-5xl">🤲</p>
        <h1 className="titre text-4xl">Connexion</h1>
        <p className="text-doux">
          Entrez votre courriel : vous recevrez un lien et un code à 6 chiffres. <strong className="text-encre">Pas de mot de passe.</strong>
        </p>
      </div>
      {erreur && (
        <p role="alert" className="rounded-lg border border-alerte/40 bg-alerte/10 p-3 text-alerte">
          Le lien de connexion n’a pas fonctionné (expiré ou ouvert sur un autre appareil). Utilisez le code à 6 chiffres.
        </p>
      )}
      <FormulaireConnexion suite={cheminSur(suite)} />
    </div>
  )
}
