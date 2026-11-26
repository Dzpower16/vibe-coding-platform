'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseNavigateur } from '@/lib/supabase/client'
import {
  CONSENTEMENT_SECTIONS,
  CONSENTEMENT_VERSION,
  PORTEES,
  texteConsentementComplet,
  type ClePortee,
} from '@/lib/consentement'
import { IDENTITES, type Consentement, type Identite, type MainDominante, type Signeur } from '@/lib/types'

const champ = 'champ'

export function FormulaireConsentement({
  userId,
  signeur,
  consentement,
  consentementAJour,
}: {
  userId: string
  signeur: Signeur | null
  consentement: Consentement | null
  consentementAJour: boolean
}) {
  const router = useRouter()
  const supabase = supabaseNavigateur()

  // Profil
  const [nom, setNom] = useState(signeur?.nom_affiche ?? '')
  const [identite, setIdentite] = useState<Identite>(signeur?.identite ?? 'sourd')
  const [region, setRegion] = useState(signeur?.region ?? '')
  const [main, setMain] = useState<MainDominante>(signeur?.main_dominante ?? 'droite')

  // Consentement
  const [portees, setPortees] = useState<Record<ClePortee, boolean>>({
    portee_application: false,
    portee_reconnaissance: false,
    portee_avatar: false,
    portee_credit_public: false,
  })
  const [age, setAge] = useState(false)
  const [signature, setSignature] = useState('')
  const [occupe, setOccupe] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null)

  const doitSigner = !consentement || !consentementAJour

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault()
    setOccupe(true)
    setMessage(null)

    const profil = {
      nom_affiche: nom.trim(),
      identite,
      region: region.trim() || null,
      main_dominante: main,
    }
    const { error: erreurProfil } = signeur
      ? await supabase.from('signeurs').update(profil).eq('id', userId)
      : await supabase.from('signeurs').insert({ id: userId, ...profil })
    if (erreurProfil) {
      setOccupe(false)
      setMessage({ type: 'erreur', texte: `Profil non enregistré : ${erreurProfil.message}` })
      return
    }

    if (doitSigner) {
      const { error } = await supabase.from('consentements').insert({
        signeur_id: userId,
        version: CONSENTEMENT_VERSION,
        texte: texteConsentementComplet(),
        nom_signature: signature.trim(),
        a_14_ans_ou_plus: age,
        ...portees,
      })
      if (error) {
        setOccupe(false)
        setMessage({ type: 'erreur', texte: `Consentement non enregistré : ${error.message}` })
        return
      }
    }

    setOccupe(false)
    router.push('/tournage')
    router.refresh()
  }

  async function revoquer() {
    if (!window.confirm('Retirer votre consentement ? Vos vidéos ne seront plus utilisées par l’application.')) return
    setOccupe(true)
    const { error } = await supabase
      .from('consentements')
      .update({ revoque_le: new Date().toISOString() })
      .eq('signeur_id', userId)
      .is('revoque_le', null)
    setOccupe(false)
    if (error) setMessage({ type: 'erreur', texte: `Échec : ${error.message}` })
    else {
      setMessage({ type: 'ok', texte: 'Consentement retiré. Vos vidéos ne sont plus utilisées.' })
      router.refresh()
    }
  }

  // Ce qu'il manque encore, affiché à côté du bouton (au lieu d'un bouton grisé muet).
  const manquants = [
    !nom.trim() && 'votre nom affiché',
    doitSigner && !portees.portee_application && 'la case « vidéos montrées dans l’application »',
    doitSigner && !age && 'la case « 14 ans ou plus »',
    doitSigner && signature.trim().length < 2 && 'votre signature',
  ].filter((m): m is string => !!m)
  const peutEnvoyer = manquants.length === 0

  return (
    <form onSubmit={enregistrer} className="space-y-6">
      <fieldset className="carte space-y-4 p-5">
        <legend className="px-1 text-lg font-bold">1. Votre profil</legend>
        <label className="block space-y-1">
          <span className="font-medium">Nom affiché</span>
          <input required maxLength={80} value={nom} onChange={(e) => setNom(e.target.value)} className={champ} />
        </label>
        <label className="block space-y-1">
          <span className="font-medium">Vous êtes</span>
          <select value={identite} onChange={(e) => setIdentite(e.target.value as Identite)} className={champ}>
            {IDENTITES.map((i) => (
              <option key={i.valeur} value={i.valeur}>
                {i.libelle}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="font-medium">Région (facultatif)</span>
          <input
            maxLength={80}
            placeholder="ex. Montréal, Québec, Saguenay…"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className={champ}
          />
          <span className="text-sm text-doux">Utile pour repérer les variantes régionales des signes.</span>
        </label>
        <div className="space-y-1">
          <span className="font-medium">Main dominante</span>
          <div className="flex gap-2">
            {(['droite', 'gauche'] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={main === m}
                onClick={() => setMain(m)}
                className={`min-h-12 flex-1 rounded-xl border-2 text-lg font-semibold transition ${
                  main === m ? 'border-accent bg-accent-doux text-accent' : 'border-ligne bg-carte hover:border-accent/50'
                }`}
              >
                {m === 'droite' ? 'Droite ✋' : '🤚 Gauche'}
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset className="carte space-y-4 p-5">
        <legend className="px-1 text-lg font-bold">2. Consentement écrit</legend>

        {consentement && consentementAJour ? (
          <div className="space-y-3">
            <p className="rounded-lg bg-ok/10 p-3 text-ok">
              ✅ Signé par <strong>{consentement.nom_signature}</strong> le{' '}
              {new Date(consentement.signe_le).toLocaleDateString('fr-CA')} (version {consentement.version}).
            </p>
            <ul className="space-y-1 text-sm">
              {PORTEES.map((p) => (
                <li key={p.cle}>
                  {consentement[p.cle] ? '✅' : '⛔'} {p.libelle}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={revoquer}
              disabled={occupe}
              className="min-h-11 rounded-lg border-2 border-alerte px-4 font-semibold text-alerte hover:bg-alerte/10"
            >
              Retirer mon consentement
            </button>
          </div>
        ) : (
          <>
            {consentement && !consentementAJour && (
              <p role="status" className="rounded-lg bg-attention/10 p-3 text-attention">
                Le texte du consentement a changé. Merci de le relire et de signer la nouvelle version.
              </p>
            )}
            <div className="max-h-96 space-y-4 overflow-y-auto rounded-lg border border-ligne bg-fond p-4">
              <p className="rounded-lg border border-dashed border-ligne p-3 text-sm text-doux">
                🎬 Version vidéo en LSQ : à venir.
              </p>
              {CONSENTEMENT_SECTIONS.map((s) => (
                <section key={s.titre} className="space-y-1">
                  <h3 className="font-bold">{s.titre}</h3>
                  {s.paragraphes.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </section>
              ))}
              <p className="text-xs text-doux">Version {CONSENTEMENT_VERSION}</p>
            </div>

            <div className="space-y-3">
              {PORTEES.map((p) => (
                <label key={p.cle} className="flex min-h-11 items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-6 shrink-0 accent-accent"
                    checked={portees[p.cle]}
                    onChange={(e) => setPortees((v) => ({ ...v, [p.cle]: e.target.checked }))}
                  />
                  <span>
                    {p.libelle}{' '}
                    {p.obligatoire ? (
                      <strong className="text-sm">(nécessaire pour filmer)</strong>
                    ) : (
                      <span className="text-sm text-doux">(facultatif)</span>
                    )}
                  </span>
                </label>
              ))}
              <label className="flex min-h-11 items-start gap-3">
                <input type="checkbox" className="mt-0.5 size-6 shrink-0 accent-accent" checked={age} onChange={(e) => setAge(e.target.checked)} />
                <span>
                  J’ai 14 ans ou plus. <strong className="text-sm">(nécessaire)</strong>
                </span>
              </label>
            </div>

            <label className="block space-y-1">
              <span className="font-medium">Signature : écrivez votre nom complet</span>
              <input
                maxLength={120}
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className={`${champ} font-serif italic`}
                autoComplete="name"
              />
              <span className="text-sm text-doux">Date : {new Date().toLocaleDateString('fr-CA')}</span>
            </label>
          </>
        )}
      </fieldset>

      {message && (
        <p role={message.type === 'erreur' ? 'alert' : 'status'} className={message.type === 'erreur' ? 'text-alerte' : 'text-ok'}>
          {message.texte}
        </p>
      )}

      <div className="space-y-2">
        {manquants.length > 0 && (
          <p className="text-sm text-doux" aria-live="polite">
            <span aria-hidden>📝 </span>Il manque : {manquants.join(', ')}.
          </p>
        )}
        <button disabled={!peutEnvoyer || occupe} className="bouton bouton-primaire bouton-grand w-full">
          {occupe ? 'Enregistrement…' : doitSigner ? '✍️ Signer et commencer à filmer' : 'Enregistrer et filmer'}
        </button>
      </div>
    </form>
  )
}
