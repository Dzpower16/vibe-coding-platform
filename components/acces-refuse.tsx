import Link from 'next/link'

export function AccesRefuse({ aProfil, role = 'admin' }: { aProfil: boolean; role?: 'admin' | 'validateur' }) {
  const nom = role === 'admin' ? 'admin' : 'validateur·rice'
  return (
    <div className="max-w-2xl space-y-3 rounded-2xl border border-ligne bg-carte p-6">
      <h1 className="titre text-3xl sm:text-4xl">Accès réservé aux {role === 'admin' ? 'admins' : 'validateur·rice·s'}</h1>
      {aProfil ? (
        <p className="text-doux">Votre compte n’a pas encore le rôle {nom}. Demandez à la personne responsable du projet de vous l’attribuer.</p>
      ) : (
        <p className="text-doux">
          Créez d’abord votre profil dans{' '}
          <Link href="/tournage/consentement" className="text-accent underline">
            Profil et consentement
          </Link>
          , puis demandez le rôle {nom}.
        </p>
      )}
    </div>
  )
}
