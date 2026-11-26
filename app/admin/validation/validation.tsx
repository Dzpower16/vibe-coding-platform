'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabaseNavigateur } from '@/lib/supabase/client'
import { nomCategorie } from '@/lib/categories'
import { IDENTITES, type PriseAValider, type StatutEnregistrement } from '@/lib/types'

const MOTIFS = [
  'Ce n’est pas le bon signe (autre sens)',
  'Mains ou visage hors de l’image',
  'Image floue, trop sombre ou saccadée',
  'Signe incomplet ou coupé',
  'Plusieurs signes dans la même prise',
  'Doute sur le consentement de la personne filmée',
]

const VERIFS = [
  { icone: '🎯', texte: 'Le signe correspond bien au sens du mot' },
  { icone: '🖐️', texte: 'Mains et visage visibles du début à la fin' },
  { icone: '💡', texte: 'Image nette et bien éclairée' },
  { icone: '✂️', texte: 'Un seul signe, complet' },
]

type Annonce = { type: 'ok' | 'erreur' | 'info'; texte: string; annuler?: () => void } | null

const libelleIdentite = (v: string) => IDENTITES.find((i) => i.valeur === v)?.libelle ?? v
const dateCourte = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }) : ''

/** Lecteur en boucle sur la partie utile (rognage suggéré), avec ralenti. */
function Lecteur({ prise, ralenti }: { prise: PriseAValider; ralenti: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  const debut = (prise.debut_ms ?? 0) / 1000
  const fin = prise.fin_ms ? prise.fin_ms / 1000 : null

  useEffect(() => {
    if (ref.current) ref.current.playbackRate = ralenti ? 0.5 : 1
  }, [ralenti, prise.id])

  if (!prise.video_url) {
    return (
      <div className="grid aspect-video place-items-center rounded-2xl bg-encre p-6 text-center text-white/80">
        Vidéo introuvable dans le stockage. Refusez la prise avec le motif « autre » si le problème persiste.
      </div>
    )
  }
  return (
    <video
      key={prise.id}
      ref={ref}
      src={prise.video_url}
      controls
      autoPlay
      muted
      playsInline
      preload="auto"
      className="block aspect-video w-full rounded-2xl bg-black object-contain"
      onLoadedMetadata={(e) => {
        e.currentTarget.currentTime = debut
        e.currentTarget.playbackRate = ralenti ? 0.5 : 1
      }}
      onTimeUpdate={(e) => {
        const v = e.currentTarget
        if (fin && v.currentTime >= fin + 0.15) v.currentTime = debut
      }}
      onEnded={(e) => {
        e.currentTarget.currentTime = debut
        void e.currentTarget.play()
      }}
    />
  )
}

function FichePrise({ prise }: { prise: PriseAValider }) {
  const mot = prise.signe.mots_fr[0] ?? prise.signe.glose
  const qui =
    prise.origine === 'externe'
      ? prise.signeur_externe || 'Personne filmée (vidéo importée)'
      : prise.signeur?.nom_affiche ?? 'Contributeur·rice'
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-doux">{nomCategorie(prise.signe.categorie)}</p>
        <h2 className="titre mt-1 break-words text-4xl leading-tight first-letter:uppercase sm:text-5xl">{mot}</h2>
        <p className="mt-2 flex flex-wrap items-center gap-2">
          <span className="glose">{prise.signe.glose}</span>
          {prise.signe.mots_fr.length > 1 && <span className="text-sm text-doux">aussi : {prise.signe.mots_fr.slice(1).join(', ')}</span>}
        </p>
        {prise.signe.definition && <p className="mt-2 text-lg">{prise.signe.definition}</p>}
        {prise.signe.notes && <p className="text-sm italic text-doux">Sens : {prise.signe.notes}</p>}
        {prise.signe.reference_url && (
          <a
            href={prise.signe.reference_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent underline"
          >
            📖 Vérifier le sens dans Mon dictionnaire LSQ<span className="sr-only"> (nouvel onglet)</span>
          </a>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-fond p-4 text-sm">
        <div className="col-span-2">
          <dt className="text-doux">Filmé par</dt>
          <dd className="font-semibold">
            {qui}
            {prise.signeur && prise.origine === 'tournage' && (
              <span className="font-normal text-doux">
                {' '}
                · {libelleIdentite(prise.signeur.identite)}
                {prise.signeur.region ? ` · ${prise.signeur.region}` : ''}
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-doux">Main dominante</dt>
          <dd className="font-semibold">{prise.main_dominante === 'gauche' ? '🤚 Gauche' : prise.main_dominante === 'droite' ? 'Droite ✋' : '—'}</dd>
        </div>
        <div>
          <dt className="text-doux">Durée</dt>
          <dd className="font-semibold">{(prise.duree_ms / 1000).toLocaleString('fr-CA', { maximumFractionDigits: 1 })} s</dd>
        </div>
        <div>
          <dt className="text-doux">Origine</dt>
          <dd>
            <span className={`pastille ${prise.origine === 'externe' ? 'bg-attention-doux text-attention' : 'bg-accent-doux text-accent'}`}>
              {prise.origine === 'externe' ? 'Importée · accord écrit' : 'Filmée dans l’app'}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-doux">Déjà validées</dt>
          <dd className="font-semibold">
            {prise.deja_valides} prise{prise.deja_valides > 1 ? 's' : ''}
          </dd>
        </div>
        {prise.variante && (
          <div className="col-span-2">
            <dt className="text-doux">Variante indiquée</dt>
            <dd className="font-semibold">{prise.variante}</dd>
          </div>
        )}
        {prise.commentaire && (
          <div className="col-span-2">
            <dt className="text-doux">Message pour la validation</dt>
            <dd className="rounded-lg bg-carte p-2">« {prise.commentaire} »</dd>
          </div>
        )}
      </dl>
    </div>
  )
}

export function Validation({
  aValiderInitial,
  historiqueInitial,
  mesPrisesEnAttente,
}: {
  aValiderInitial: PriseAValider[]
  historiqueInitial: PriseAValider[]
  mesPrisesEnAttente: number
}) {
  const [file, setFile] = useState(aValiderInitial)
  const [historique, setHistorique] = useState(historiqueInitial)
  const [onglet, setOnglet] = useState<'file' | 'historique'>('file')
  const [refus, setRefus] = useState(false)
  const [motifs, setMotifs] = useState<string[]>([])
  const [autreMotif, setAutreMotif] = useState('')
  const [ralenti, setRalenti] = useState(false)
  const [occupe, setOccupe] = useState(false)
  const [annonce, setAnnonce] = useState<Annonce>(null)
  const [nbDecisions, setNbDecisions] = useState(0)

  const prise = file[0] ?? null

  function reinitialiser() {
    setRefus(false)
    setMotifs([])
    setAutreMotif('')
  }

  /** Change le statut d'une prise. La base inscrit elle-même qui décide et quand. */
  const changerStatut = useCallback(async (p: PriseAValider, statut: StatutEnregistrement, motif: string | null) => {
    const { data, error } = await supabaseNavigateur()
      .from('enregistrements')
      .update({ statut, motif_rejet: motif })
      .eq('id', p.id)
      .select('id, statut, motif_rejet, valide_le')
    if (error) throw new Error(error.message)
    if (!data?.length) throw new Error('action refusée (votre propre prise, ou rôle insuffisant)')
    return data[0] as { statut: StatutEnregistrement; motif_rejet: string | null; valide_le: string | null }
  }, [])

  const annulerDecision = useCallback(
    async (p: PriseAValider) => {
      setOccupe(true)
      try {
        await changerStatut(p, 'en_attente', null)
        setHistorique((h) => h.filter((x) => x.id !== p.id))
        setFile((f) => [{ ...p, statut: 'en_attente', motif_rejet: null, valide_le: null }, ...f.filter((x) => x.id !== p.id)])
        setNbDecisions((n) => Math.max(0, n - 1))
        setOnglet('file')
        setAnnonce({ type: 'info', texte: `↩️ Décision annulée : « ${p.signe.mots_fr[0] ?? p.signe.glose} » revient dans la file.` })
      } catch (e) {
        setAnnonce({ type: 'erreur', texte: `Annulation impossible : ${e instanceof Error ? e.message : e}` })
      } finally {
        setOccupe(false)
      }
    },
    [changerStatut],
  )

  const decider = useCallback(
    async (statut: 'valide' | 'rejete') => {
      if (!prise || occupe) return
      const motif = statut === 'rejete' ? [...motifs, autreMotif.trim()].filter(Boolean).join(' · ').slice(0, 500) : null
      if (statut === 'rejete' && !motif) {
        setAnnonce({ type: 'erreur', texte: 'Choisissez au moins un motif de refus.' })
        return
      }
      setOccupe(true)
      try {
        const res = await changerStatut(prise, statut, motif)
        const decidee = { ...prise, ...res }
        setFile((f) => f.slice(1))
        setHistorique((h) => [decidee, ...h])
        setNbDecisions((n) => n + 1)
        reinitialiser()
        const mot = prise.signe.mots_fr[0] ?? prise.signe.glose
        setAnnonce({
          type: 'ok',
          texte: statut === 'valide' ? `✅ « ${mot} » validée : elle entre dans l’application.` : `⛔ « ${mot} » refusée.`,
          annuler: () => void annulerDecision(decidee),
        })
      } catch (e) {
        setAnnonce({ type: 'erreur', texte: `La décision n’a pas été enregistrée : ${e instanceof Error ? e.message : e}` })
      } finally {
        setOccupe(false)
      }
    },
    [prise, occupe, motifs, autreMotif, changerStatut, annulerDecision],
  )

  const passer = useCallback(() => {
    setFile((f) => (f.length > 1 ? [...f.slice(1), f[0]] : f))
    reinitialiser()
    setAnnonce(null)
  }, [])

  // Raccourcis clavier (ordinateur) : V valider, R refuser, P passer, L ralenti.
  useEffect(() => {
    function touche(e: KeyboardEvent) {
      const cible = e.target as HTMLElement
      if (onglet !== 'file' || !prise || e.metaKey || e.ctrlKey || e.altKey) return
      if (cible.closest('input, textarea, select, [contenteditable]')) return
      const k = e.key.toLowerCase()
      if (k === 'v' && !refus) void decider('valide')
      else if (k === 'r') setRefus(true)
      else if (k === 'p' || k === 'arrowright') passer()
      else if (k === 'l') setRalenti((r) => !r)
      else if (k === 'escape') reinitialiser()
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [onglet, prise, refus, decider, passer])

  const puceOnglet = (actif: boolean) =>
    `min-h-11 rounded-full px-5 font-semibold transition ${actif ? 'bg-encre text-white' : 'text-doux hover:bg-carte hover:text-encre'}`

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="pastille bg-accent-doux px-3 py-1 text-sm text-accent">{file.length} à vérifier</span>
        {nbDecisions > 0 && <span className="pastille bg-ok-doux px-3 py-1 text-sm text-ok">{nbDecisions} décision{nbDecisions > 1 ? 's' : ''} pendant cette séance</span>}
        {mesPrisesEnAttente > 0 && (
          <span className="pastille bg-ligne px-3 py-1 text-sm normal-case tracking-normal text-doux">
            {mesPrisesEnAttente} de vos prises attendent un·e autre validateur·rice
          </span>
        )}
      </div>

      <div role="tablist" aria-label="Validation" className="inline-flex gap-1 rounded-full border border-ligne bg-fond p-1">
        <button role="tab" aria-selected={onglet === 'file'} onClick={() => setOnglet('file')} className={puceOnglet(onglet === 'file')}>
          À vérifier ({file.length})
        </button>
        <button role="tab" aria-selected={onglet === 'historique'} onClick={() => setOnglet('historique')} className={puceOnglet(onglet === 'historique')}>
          Mes décisions ({historique.length})
        </button>
      </div>

      {annonce && (
        <div
          role={annonce.type === 'erreur' ? 'alert' : 'status'}
          aria-live="polite"
          className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 font-medium ${
            annonce.type === 'erreur' ? 'bg-alerte-doux text-alerte' : annonce.type === 'ok' ? 'bg-ok-doux text-ok' : 'bg-accent-doux text-accent'
          }`}
        >
          <span>{annonce.texte}</span>
          {annonce.annuler && (
            <button onClick={annonce.annuler} disabled={occupe} className="bouton bouton-secondaire min-h-11 px-4 text-base">
              ↩️ Annuler
            </button>
          )}
        </div>
      )}

      {onglet === 'file' &&
        (prise ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <section aria-label="Vidéo" className="space-y-3">
              <Lecteur prise={prise} ralenti={ralenti} />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setRalenti((r) => !r)}
                  aria-pressed={ralenti}
                  className={`bouton min-h-11 border-2 px-4 text-base ${ralenti ? 'border-accent bg-accent-doux text-accent' : 'border-ligne bg-carte'}`}
                >
                  🐢 Ralenti {ralenti ? 'activé' : '0,5×'}
                </button>
                <span className="self-center text-sm text-doux">Lecture en boucle sur la partie où les mains bougent.</span>
              </div>
              <ul className="grid gap-2 sm:grid-cols-2" aria-label="À vérifier">
                {VERIFS.map((v) => (
                  <li key={v.texte} className="flex items-center gap-2 rounded-xl border border-ligne bg-carte px-3 py-2 text-sm">
                    <span aria-hidden>{v.icone}</span>
                    {v.texte}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-label="Décision" className="carte space-y-6 p-5 sm:p-6">
              <FichePrise prise={prise} />

              {!refus ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => void decider('valide')} disabled={occupe} className="bouton bouton-succes bouton-grand">
                      ✓ Valider
                    </button>
                    <button
                      onClick={() => setRefus(true)}
                      disabled={occupe}
                      className="bouton bouton-grand border-2 border-alerte/40 bg-carte text-alerte hover:bg-alerte-doux"
                    >
                      ✗ Refuser
                    </button>
                  </div>
                  <button onClick={passer} disabled={occupe || file.length < 2} className="min-h-11 w-full font-medium text-doux underline disabled:no-underline disabled:opacity-60">
                    Je ne suis pas sûr·e : passer à la suivante →
                  </button>
                  <p className="hidden text-center text-xs text-doux lg:block">
                    Raccourcis : <kbd className="glose">V</kbd> valider · <kbd className="glose">R</kbd> refuser · <kbd className="glose">P</kbd> passer ·{' '}
                    <kbd className="glose">L</kbd> ralenti
                  </p>
                </div>
              ) : (
                <fieldset className="space-y-3 rounded-2xl border-2 border-alerte/30 bg-alerte-doux/40 p-4">
                  <legend className="px-1 font-bold text-alerte">Pourquoi refuser ?</legend>
                  <p className="text-sm text-doux">La personne qui a filmé verra ce motif pour refaire sa prise.</p>
                  <div className="flex flex-wrap gap-2">
                    {MOTIFS.map((m) => {
                      const actif = motifs.includes(m)
                      return (
                        <button
                          key={m}
                          type="button"
                          aria-pressed={actif}
                          onClick={() => setMotifs((l) => (actif ? l.filter((x) => x !== m) : [...l, m]))}
                          className={`min-h-11 rounded-full border-2 px-3 text-left text-sm font-semibold transition ${
                            actif ? 'border-alerte bg-alerte text-white' : 'border-ligne bg-carte hover:border-alerte/50'
                          }`}
                        >
                          {actif ? '✓ ' : ''}
                          {m}
                        </button>
                      )
                    })}
                  </div>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">Autre précision (facultatif)</span>
                    <textarea
                      rows={2}
                      maxLength={300}
                      value={autreMotif}
                      onChange={(e) => setAutreMotif(e.target.value)}
                      className="champ min-h-0 py-2 text-base"
                      placeholder="ex. le signe est fait avec une seule main au lieu de deux"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={reinitialiser} disabled={occupe} className="bouton bouton-secondaire">
                      Retour
                    </button>
                    <button
                      onClick={() => void decider('rejete')}
                      disabled={occupe || (!motifs.length && !autreMotif.trim())}
                      className="bouton bg-alerte text-white hover:brightness-110"
                    >
                      Confirmer le refus
                    </button>
                  </div>
                </fieldset>
              )}
            </section>
          </div>
        ) : (
          <div className="carte mx-auto max-w-xl space-y-3 p-10 text-center">
            <p aria-hidden className="text-6xl">🎉</p>
            <h2 className="titre text-3xl">Tout est vérifié</h2>
            <p className="texte-doux">
              Aucune prise n’attend de décision pour l’instant. Les nouvelles prises apparaîtront ici dès qu’elles seront
              envoyées.
            </p>
          </div>
        ))}

      {onglet === 'historique' &&
        (historique.length ? (
          <ul className="space-y-3">
            {historique.map((p) => {
              const valide = p.statut === 'valide'
              return (
                <li key={p.id} className="carte flex flex-wrap items-center gap-4 p-4">
                  <span
                    aria-hidden
                    className={`grid size-12 shrink-0 place-items-center rounded-2xl text-2xl ${valide ? 'bg-ok-doux' : 'bg-alerte-doux'}`}
                  >
                    {valide ? '✅' : '⛔'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="titre text-xl first-letter:uppercase">{p.signe.mots_fr[0] ?? p.signe.glose}</span>
                      <span className={`pastille ${valide ? 'bg-ok-doux text-ok' : 'bg-alerte-doux text-alerte'}`}>
                        {valide ? 'Validée' : 'Refusée'}
                      </span>
                      <span className="glose">{p.signe.glose}</span>
                    </p>
                    {!valide && p.motif_rejet && <p className="mt-1 text-sm text-alerte">Motif : {p.motif_rejet}</p>}
                    <p className="mt-1 text-xs text-doux">{dateCourte(p.valide_le)}</p>
                  </div>
                  <button onClick={() => void annulerDecision(p)} disabled={occupe} className="bouton bouton-secondaire min-h-11 px-4 text-base">
                    ↩️ Annuler
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="carte p-6 text-center text-doux">Vous n’avez encore pris aucune décision.</p>
        ))}
    </div>
  )
}
