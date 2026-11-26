'use client'

import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { CODE_CAPTEUR, lireTranscription, versPcm16 } from '@/lib/audio/pcm'
import type { ElementAvecVideo, ResultatDirect } from '@/lib/lsq/gloses'

/**
 * Direct (étape 1d) : micro → Gladia (texte) → /api/direct/gloses (Claude + lexique filmé) → vidéos enchaînées.
 * Visuel d'abord (§1.5) : chaque état se voit (couleur + icône + texte) ; les mots épelés et les gloses
 * sont affichés sous la vidéo (§1.6).
 */

type EtatMicro = 'arret' | 'connexion' | 'ecoute' | 'fin'

interface Phrase {
  id: number
  texte: string
  statut: 'traduction' | 'prete' | 'erreur'
  resultat?: ResultatDirect
  erreur?: string
}

interface Lecture {
  file: number[]
  enCours: { phraseId: number; index: number } | null
}

type ActionLecture =
  | { type: 'ajouter'; phraseId: number }
  | { type: 'suivant'; longueur: number }
  | { type: 'rejouer'; phraseId: number }
  | { type: 'arreter' }

function reducteurLecture(etat: Lecture, action: ActionLecture): Lecture {
  switch (action.type) {
    case 'ajouter':
      return etat.enCours ? { ...etat, file: [...etat.file, action.phraseId] } : { file: [], enCours: { phraseId: action.phraseId, index: 0 } }
    case 'suivant': {
      if (!etat.enCours) return etat
      if (etat.enCours.index + 1 < action.longueur) return { ...etat, enCours: { ...etat.enCours, index: etat.enCours.index + 1 } }
      const [prochaine, ...reste] = etat.file
      return { file: reste, enCours: prochaine === undefined ? null : { phraseId: prochaine, index: 0 } }
    }
    case 'rejouer':
      return { file: [], enCours: { phraseId: action.phraseId, index: 0 } }
    case 'arreter':
      return { file: [], enCours: null }
  }
}

const DUREE_CARTE_MS = 900 // lettre ou chiffre sans vidéo : affiché en grand
const DELAI_CHARGEMENT_MS = 8000
const VITESSES = [0.75, 1, 1.25, 1.5] as const

/** Regroupe les lettres d'un même mot épelé pour l'affichage sous la vidéo. */
function groupes(elements: ElementAvecVideo[]) {
  const res: { debut: number; fin: number; libelle: string; epele: boolean }[] = []
  elements.forEach((e, i) => {
    const dernier = res[res.length - 1]
    if (e.epele && dernier?.epele && elements[i - 1]?.epele === e.epele && dernier.fin === i - 1) {
      dernier.fin = i
      return
    }
    res.push({ debut: i, fin: i, libelle: e.epele ?? e.glose, epele: Boolean(e.epele) })
  })
  return res
}

function caractere(glose: string) {
  return glose.replace(/^(LETTRE|CHIFFRE)-/, '')
}

export function Direct({ nbSignes, nbLettres }: { nbSignes: number; nbLettres: number }) {
  const [micro, setMicro] = useState<EtatMicro>('arret')
  const [erreur, setErreur] = useState<string | null>(null)
  const [partiel, setPartiel] = useState('')
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [texteSaisi, setTexteSaisi] = useState('')
  const [vitesse, setVitesse] = useState<number>(1)
  const [lecture, dispatch] = useReducer(reducteurLecture, { file: [], enCours: null })

  const videoRef = useRef<HTMLVideoElement>(null)
  const compteur = useRef(0)
  const ressources = useRef<{ ws?: WebSocket; flux?: MediaStream; ctx?: AudioContext; blob?: string }>({})

  const phraseCourante = lecture.enCours ? phrases.find((p) => p.id === lecture.enCours!.phraseId) : undefined
  const elements = phraseCourante?.resultat?.elements ?? []
  const elementCourant = lecture.enCours ? elements[lecture.enCours.index] : undefined
  const derniere = phrases[0]
  const affichee = phraseCourante ?? (derniere?.statut === 'prete' ? derniere : undefined)

  const suivant = useCallback(() => dispatch({ type: 'suivant', longueur: elements.length }), [elements.length])

  // --- Traduction d'une phrase -------------------------------------------------------------
  const traduire = useCallback(async (texte: string) => {
    const id = ++compteur.current
    setPhrases((p) => [{ id, texte, statut: 'traduction' as const }, ...p].slice(0, 30))
    try {
      const rep = await fetch('/api/direct/gloses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texte }),
      })
      const json = (await rep.json().catch(() => null)) as (ResultatDirect & { erreur?: string }) | null
      if (!rep.ok || !json || json.erreur) throw new Error(json?.erreur ?? `Erreur ${rep.status}`)
      setPhrases((p) => p.map((x) => (x.id === id ? { ...x, statut: 'prete', resultat: json } : x)))
      if (json.elements.length) dispatch({ type: 'ajouter', phraseId: id })
    } catch (e) {
      setPhrases((p) => p.map((x) => (x.id === id ? { ...x, statut: 'erreur', erreur: e instanceof Error ? e.message : 'Erreur' } : x)))
    }
  }, [])

  // --- Lecture enchaînée -------------------------------------------------------------------
  useEffect(() => {
    if (!elementCourant) return
    if (!elementCourant.video) {
      const t = setTimeout(suivant, DUREE_CARTE_MS / vitesse)
      return () => clearTimeout(t)
    }
    const v = videoRef.current
    if (!v) return
    const { url, debut_ms } = elementCourant.video
    const demarrer = () => {
      v.playbackRate = vitesse
      v.currentTime = (debut_ms ?? 0) / 1000
      v.play().catch(() => {})
    }
    const garde = setTimeout(suivant, DELAI_CHARGEMENT_MS) // vidéo qui ne charge pas : on passe
    const charge = () => clearTimeout(garde)
    v.addEventListener('playing', charge, { once: true })
    if (v.src !== url) {
      v.src = url
      v.addEventListener('loadedmetadata', demarrer, { once: true })
    } else demarrer()
    return () => {
      clearTimeout(garde)
      v.removeEventListener('playing', charge)
      v.removeEventListener('loadedmetadata', demarrer)
    }
    // `lecture.enCours` change à chaque étape (même glose répétée : on relance la vidéo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lecture.enCours])

  const finSegment = () => {
    const v = videoRef.current
    const fin = elementCourant?.video?.fin_ms
    if (v && fin && v.currentTime * 1000 >= fin) {
      v.pause()
      suivant()
    }
  }

  // --- Micro → Gladia ----------------------------------------------------------------------
  const liberer = useCallback(() => {
    const r = ressources.current
    r.flux?.getTracks().forEach((t) => t.stop())
    r.ctx?.close().catch(() => {})
    if (r.blob) URL.revokeObjectURL(r.blob)
    ressources.current = { ws: r.ws }
  }, [])

  const arreter = useCallback(() => {
    liberer()
    const ws = ressources.current.ws
    if (ws && ws.readyState === WebSocket.OPEN) {
      // On laisse ~3 s à Gladia pour envoyer la dernière phrase.
      ws.send(JSON.stringify({ type: 'stop_recording' }))
      setMicro('fin')
      setTimeout(() => ws.close(), 3000)
    } else setMicro('arret')
    setPartiel('')
  }, [liberer])

  const demarrer = async () => {
    setErreur(null)
    setMicro('connexion')
    try {
      const flux = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      ressources.current.flux = flux

      const rep = await fetch('/api/direct/session', { method: 'POST' })
      const json = (await rep.json().catch(() => null)) as { url?: string; erreur?: string } | null
      if (!rep.ok || !json?.url) throw new Error(json?.erreur ?? 'Transcription indisponible.')

      const ws = new WebSocket(json.url)
      ressources.current.ws = ws
      await new Promise<void>((ok, ko) => {
        ws.onopen = () => ok()
        ws.onerror = () => ko(new Error('Connexion au service de transcription impossible.'))
      })

      const ctx = new AudioContext()
      ressources.current.ctx = ctx
      const blob = URL.createObjectURL(new Blob([CODE_CAPTEUR], { type: 'application/javascript' }))
      ressources.current.blob = blob
      await ctx.audioWorklet.addModule(blob)
      const source = ctx.createMediaStreamSource(flux)
      const capteur = new AudioWorkletNode(ctx, 'capteur-pcm')
      const silence = ctx.createGain()
      silence.gain.value = 0 // le graphe doit aller jusqu'à la sortie pour être traité ; aucun son n'est joué

      const parEnvoi = Math.round(ctx.sampleRate / 10) // ~100 ms d'audio par envoi
      let tampon = new Float32Array(0)
      capteur.port.onmessage = (e: MessageEvent<Float32Array>) => {
        const fusion = new Float32Array(tampon.length + e.data.length)
        fusion.set(tampon)
        fusion.set(e.data, tampon.length)
        tampon = fusion
        if (tampon.length >= parEnvoi && ws.readyState === WebSocket.OPEN) {
          ws.send(versPcm16(tampon, ctx.sampleRate).buffer)
          tampon = new Float32Array(0)
        }
      }
      source.connect(capteur)
      capteur.connect(silence)
      silence.connect(ctx.destination)

      ws.onerror = null
      ws.onmessage = (e) => {
        if (typeof e.data !== 'string') return
        let message: unknown
        try {
          message = JSON.parse(e.data)
        } catch {
          return
        }
        const t = lireTranscription(message)
        if (!t) return
        if (t.final) {
          setPartiel('')
          void traduire(t.texte)
        } else setPartiel(t.texte)
      }
      ws.onclose = () => {
        liberer()
        ressources.current.ws = undefined
        setPartiel('')
        setMicro((m) => {
          if (m === 'ecoute') setErreur('La transcription s’est arrêtée. Appuyez sur « Écouter » pour reprendre.')
          return 'arret'
        })
      }
      setMicro('ecoute')
    } catch (e) {
      liberer()
      ressources.current.ws?.close()
      ressources.current.ws = undefined
      setMicro('arret')
      const refus = e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'SecurityError')
      setErreur(refus ? 'Accès au micro refusé. Autorisez le micro dans les réglages du navigateur.' : e instanceof Error ? e.message : 'Erreur inconnue.')
    }
  }

  useEffect(
    () => () => {
      liberer()
      ressources.current.ws?.close()
    },
    [liberer],
  )

  const envoyerTexte = (e: React.FormEvent) => {
    e.preventDefault()
    const t = texteSaisi.trim()
    if (!t) return
    setTexteSaisi('')
    void traduire(t)
  }

  const groupesAffiches = affichee?.resultat ? groupes(affichee.resultat.elements) : []
  const indexCourant = phraseCourante && lecture.enCours ? lecture.enCours.index : -1

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <section className="space-y-3">
        {/* Scène vidéo */}
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
          <video
            ref={videoRef}
            muted
            playsInline
            preload="auto"
            onTimeUpdate={finSegment}
            onEnded={suivant}
            onError={() => elementCourant?.video && suivant()}
            className={`h-full w-full object-contain ${elementCourant?.video ? '' : 'invisible'}`}
          />
          {elementCourant && !elementCourant.video && (
            <div className="absolute inset-0 grid place-items-center text-white">
              <div className="text-center">
                <p className="text-8xl font-black">{caractere(elementCourant.glose)}</p>
                <p className="mt-2 text-sm text-white/70">Pas encore de vidéo validée pour ce signe</p>
              </div>
            </div>
          )}
          {!elementCourant && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-white/80">
              <p className="text-lg">Les signes s’afficheront ici.</p>
            </div>
          )}
          {elementCourant && (
            <p className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 font-mono text-sm font-bold text-white">
              {elementCourant.epele ? `épelé : ${caractere(elementCourant.glose)}` : elementCourant.glose}
            </p>
          )}
        </div>

        {/* Gloses de la phrase affichée (transparence §1.6) */}
        {affichee?.resultat && (
          <div className="carte space-y-2 p-4" aria-live="polite">
            <p className="text-lg">« {affichee.texte} »</p>
            <ol className="flex flex-wrap gap-2" aria-label="Signes, dans l’ordre">
              {groupesAffiches.map((g) => {
                const actif = indexCourant >= g.debut && indexCourant <= g.fin
                return (
                  <li
                    key={g.debut}
                    className={`rounded-lg border px-2.5 py-1 font-mono text-sm ${
                      actif ? 'border-accent bg-accent text-white' : g.epele ? 'border-attention/50 bg-attention-doux' : 'border-ligne bg-fond'
                    }`}
                  >
                    {g.epele ? (
                      <>
                        <span aria-hidden="true">✋ </span>
                        {[...g.libelle].map((c, k) => (
                          <span key={k} className={actif && indexCourant - g.debut === k ? 'underline decoration-2' : ''}>
                            {c}
                          </span>
                        ))}
                        <span className="sr-only"> (épelé)</span>
                      </>
                    ) : (
                      g.libelle
                    )}
                  </li>
                )
              })}
            </ol>
            <p className="flex flex-wrap gap-x-4 text-xs text-doux">
              <span>
                <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-ligne bg-fond align-middle" /> signe filmé
              </span>
              <span>
                <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-attention/50 bg-attention-doux align-middle" /> mot épelé
              </span>
            </p>
            {affichee.resultat.remarques && <p className="text-sm text-doux">ℹ️ {affichee.resultat.remarques}</p>}
          </div>
        )}

        {/* Commandes */}
        <div className="flex flex-wrap gap-2">
          {micro === 'ecoute' ? (
            <button onClick={arreter} className="bouton bouton-grand flex-1 bg-alerte px-4 text-white">
              <span aria-hidden="true">■</span> Arrêter
            </button>
          ) : (
            <button
              onClick={demarrer}
              disabled={micro === 'connexion' || micro === 'fin'}
              className="bouton bouton-primaire bouton-grand flex-1 px-4"
            >
              <span aria-hidden="true">🎤</span> {micro === 'connexion' ? 'Connexion…' : micro === 'fin' ? 'Dernière phrase…' : 'Écouter'}
            </button>
          )}
          {lecture.enCours && (
            <button onClick={() => dispatch({ type: 'arreter' })} className="bouton bouton-secondaire bouton-grand px-4">
              <span aria-hidden="true">⏹</span> Stop vidéo
            </button>
          )}
          <label className="bouton bouton-secondaire bouton-grand gap-2 px-4">
            <span className="text-sm">Vitesse</span>
            <select value={vitesse} onChange={(e) => setVitesse(Number(e.target.value))} className="bg-transparent font-semibold">
              {VITESSES.map((v) => (
                <option key={v} value={v}>
                  {v}×
                </option>
              ))}
            </select>
          </label>
        </div>

        <div aria-live="polite" className="min-h-6">
          {micro === 'ecoute' && (
            <p className="flex items-center gap-2 font-semibold text-ok">
              <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-ok" aria-hidden="true" />
              À l’écoute{partiel ? ' :' : ''} <span className="font-normal text-encre">{partiel}</span>
            </p>
          )}
        </div>

        {erreur && (
          <p role="alert" className="rounded-lg border border-alerte/40 bg-alerte/10 p-4 text-alerte">
            {erreur}
          </p>
        )}

        <form onSubmit={envoyerTexte} className="flex gap-2">
          <label htmlFor="phrase" className="sr-only">
            Écrire une phrase
          </label>
          <input
            id="phrase"
            value={texteSaisi}
            onChange={(e) => setTexteSaisi(e.target.value)}
            maxLength={500}
            placeholder="Ou écrivez une phrase…"
            className="champ min-h-11 flex-1"
          />
          <button type="submit" className="bouton bouton-secondaire min-h-11 px-4" disabled={!texteSaisi.trim()}>
            Traduire
          </button>
        </form>
      </section>

      <section className="space-y-4">
        {(nbSignes === 0 || nbLettres < 26) && (
          <div className="space-y-1 rounded-2xl border-2 border-attention/30 bg-attention-doux p-4 text-sm">
            <p className="font-bold">
              <span aria-hidden="true">⚠️ </span>Bibliothèque encore petite
            </p>
            <p>
              {nbSignes} signe{nbSignes > 1 ? 's' : ''} validé{nbSignes > 1 ? 's' : ''}, {nbLettres}/26 lettres de l’alphabet. Les mots sans
              signe sont épelés ; une lettre sans vidéo est montrée en grand.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <h2 className="font-semibold">Phrases</h2>
          {phrases.length === 0 && <p className="text-sm text-doux">Appuyez sur « Écouter » et parlez, ou écrivez une phrase.</p>}
          <ul className="space-y-2">
            {phrases.map((p) => (
              <li key={p.id} className="carte space-y-1 p-3">
                <p>{p.texte}</p>
                {p.statut === 'traduction' && <p className="text-sm text-doux">⏳ Remise en ordre…</p>}
                {p.statut === 'erreur' && <p className="text-sm text-alerte">⚠️ {p.erreur}</p>}
                {p.resultat && (
                  <>
                    <p className="font-mono text-xs break-words text-doux">{p.resultat.gloses.join(' ') || '—'}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {p.resultat.mode === 'epellation' && <span className="pastille bg-attention-doux">tout épelé</span>}
                      {p.resultat.epeles.length > 0 && p.resultat.mode === 'claude' && (
                        <span className="pastille bg-attention-doux">
                          {p.resultat.epeles.length} mot{p.resultat.epeles.length > 1 ? 's' : ''} épelé{p.resultat.epeles.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {p.resultat.elements.length > 0 && (
                        <button onClick={() => dispatch({ type: 'rejouer', phraseId: p.id })} className="min-h-11 rounded-lg border border-ligne px-3 text-sm">
                          ↻ Revoir
                        </button>
                      )}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        <p className="rounded-xl border border-ligne bg-carte p-3 text-xs text-doux">
          Aide à la communication, pas une interprétation certifiée. La LSQ a sa propre grammaire : l’ordre des signes est une
          approximation. Pour un contexte médical, juridique ou important, faites appel à un·e interprète professionnel·le. Le son
          du micro est envoyé à Gladia pour la transcription, puis le texte à Anthropic pour la remise en ordre ; rien n’est
          conservé par Entre-Mains.
        </p>
      </section>
    </div>
  )
}
