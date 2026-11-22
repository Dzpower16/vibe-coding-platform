'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseNavigateur } from '@/lib/supabase/client'

export function FormulaireConnexion({ suite }: { suite: string }) {
  const router = useRouter()
  const [courriel, setCourriel] = useState('')
  const [code, setCode] = useState('')
  const [etape, setEtape] = useState<'courriel' | 'code'>('courriel')
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function envoyerLien(e: React.FormEvent) {
    e.preventDefault()
    setOccupe(true)
    setErreur(null)
    const { error } = await supabaseNavigateur().auth.signInWithOtp({
      email: courriel.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?suite=${encodeURIComponent(suite)}`,
        shouldCreateUser: true,
      },
    })
    setOccupe(false)
    if (error) setErreur('Envoi impossible. Vérifiez le courriel et réessayez dans une minute.')
    else setEtape('code')
  }

  async function verifierCode(e: React.FormEvent) {
    e.preventDefault()
    setOccupe(true)
    setErreur(null)
    const { error } = await supabaseNavigateur().auth.verifyOtp({
      email: courriel.trim(),
      token: code.trim(),
      type: 'email',
    })
    setOccupe(false)
    if (error) setErreur('Code invalide ou expiré.')
    else {
      router.replace(suite)
      router.refresh()
    }
  }

  const champ = 'w-full min-h-12 rounded-lg border border-ligne bg-carte px-3 text-lg'
  const bouton =
    'w-full min-h-12 rounded-lg bg-accent px-4 text-lg font-semibold text-white hover:bg-accent-fort disabled:opacity-60'

  return (
    <div className="space-y-4 rounded-2xl border border-ligne bg-carte p-5">
      {etape === 'courriel' ? (
        <form onSubmit={envoyerLien} className="space-y-3">
          <label className="block space-y-1">
            <span className="font-medium">Courriel</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={courriel}
              onChange={(e) => setCourriel(e.target.value)}
              className={champ}
            />
          </label>
          <button disabled={occupe} className={bouton}>
            {occupe ? 'Envoi…' : 'Recevoir le lien'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifierCode} className="space-y-3">
          <p role="status" className="rounded-lg bg-ok/10 p-3 text-ok">
            ✉️ Courriel envoyé à <strong>{courriel}</strong>. Cliquez sur le lien, ou entrez le code ici.
          </p>
          <label className="block space-y-1">
            <span className="font-medium">Code à 6 chiffres</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,10}"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`${champ} tracking-[0.4em]`}
            />
          </label>
          <button disabled={occupe} className={bouton}>
            {occupe ? 'Vérification…' : 'Se connecter'}
          </button>
          <button type="button" onClick={() => setEtape('courriel')} className="w-full min-h-11 text-accent underline">
            Changer de courriel
          </button>
        </form>
      )}
      {erreur && (
        <p role="alert" className="text-alerte">
          {erreur}
        </p>
      )}
    </div>
  )
}
