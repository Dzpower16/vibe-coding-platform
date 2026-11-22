import type { Metadata } from 'next'
import { cheminSur } from '@/lib/redirection'
import { FormulaireConnexion } from './formulaire'

export const metadata: Metadata = { title: 'Connexion' }

export default async function Connexion({ searchParams }: { searchParams: Promise<{ suite?: string; erreur?: string }> }) {
  const { suite, erreur } = await searchParams
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Connexion</h1>
      <p className="text-doux">
        Entrez votre courriel. Vous recevrez un lien et un code à 6 chiffres. Pas de mot de passe.
      </p>
      {erreur && (
        <p role="alert" className="rounded-lg border border-alerte/40 bg-alerte/10 p-3 text-alerte">
          Le lien de connexion n’a pas fonctionné (expiré ou ouvert sur un autre appareil). Utilisez le code à 6 chiffres.
        </p>
      )}
      <FormulaireConnexion suite={cheminSur(suite)} />
    </div>
  )
}
