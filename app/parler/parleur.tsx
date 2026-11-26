'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { HolisticLandmarker } from '@mediapipe/tasks-vision'
import { chargerHolistic } from '@/lib/mediapipe/holistic'
import { dessinerSquelette } from '@/lib/mediapipe/dessin'
import { ChargementIA } from '@/components/chargement-ia'
import { compacterFrame, type FramePositions } from '@/lib/mediapipe/positions'
import {
  classer,
  decider,
  empreinte,
  frameActive,
  repereCorps,
  type Candidat,
  type ModeleSigne,
  type Repere,
} from '@/lib/reconnaissance/caracteristiques'

type Phase = 'chargement' | 'pret' | 'ecoute' | 'erreur'
type Resultat = { type: 'mot'; candidat: Candidat } | { type: 'incertain' } | null

/** Fin du signe : plus aucune main active pendant ce délai. */
const SILENCE_MS = 450
const DUREE_MAX_MS = 4000
const DUREE_MIN_MS = 250
const TAMPON = 8

function choisirVoix(): SpeechSynthesisVoice | null {
  const voix = window.speechSynthesis?.getVoices() ?? []
  return (
    voix.find((v) => v.lang.toLowerCase().startsWith('fr-ca')) ??
    voix.find((v) => v.lang.toLowerCase().startsWith('fr')) ??
    null
  )
}

function dire(texte: string) {
  const synth = window.speechSynthesis
  if (!synth) return
  synth.cancel()
  const u = new SpeechSynthesisUtterance(texte)
  u.lang = 'fr-CA'
  const v = choisirVoix()
  if (v) u.voice = v
  synth.speak(u)
}

export function Parleur() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const holisticRef = useRef<HolisticLandmarker | null>(null)
  const modelesRef = useRef<ModeleSigne[]>([])
  const ecouteRef = useRef(false)
  const voixRef = useRef(true)
  const seuilRef = useRef(0.6)

  const [phase, setPhase] = useState<Phase>('chargement')
  const [erreur, setErreur] = useState<string | null>(null)
  const [modeles, setModeles] = useState<ModeleSigne[] | null>(null)
  const [enSigne, setEnSigne] = useState(false)
  const [resultat, setResultat] = useState<Resultat>(null)
  const [candidats, setCandidats] = useState<Candidat[]>([])
  const [phrase, setPhrase] = useState<string[]>([])
  const [voix, setVoix] = useState(true)
  const [seuil, setSeuil] = useState(0.6)

  useEffect(() => {
    voixRef.current = voix
  }, [voix])
  useEffect(() => {
    seuilRef.current = seuil
  }, [seuil])

  // Exemples de signes (empreintes) depuis le serveur.
  useEffect(() => {
    let annule = false
    fetch('/api/reconnaissance/modeles', { cache: 'no-store' })
      .then(async (r) => {
        const corps = (await r.json()) as { modeles?: ModeleSigne[]; erreur?: string }
        if (!r.ok) throw new Error(corps.erreur ?? `erreur ${r.status}`)
        return corps.modeles ?? []
      })
      .then((m) => {
        if (annule) return
        modelesRef.current = m
        setModeles(m)
      })
      .catch((e) => {
        if (annule) return
        setErreur(`Les exemples de signes n’ont pas pu être chargés : ${e instanceof Error ? e.message : e}`)
        setModeles([])
      })
    return () => {
      annule = true
    }
  }, [])

  // Caméra + détection + découpage des signes.
  useEffect(() => {
    let arrete = false
    let raf = 0
    let dernierTemps = -1
    let repere: Repere | null = null
    const tampon: FramePositions[] = []
    let segment: FramePositions[] = []
    let signeEnCours = false
    let actifsConsecutifs = 0
    let debutSigne = 0
    let derniereActivite = 0

    function analyser(frames: FramePositions[]) {
      const normal = empreinte(frames)
      const miroir = empreinte(frames, true)
      if (!normal || !miroir || modelesRef.current.length === 0) return
      const c = classer(normal, miroir, modelesRef.current)
      setCandidats(c.slice(0, 3))
      const choix = decider(c, seuilRef.current)
      if (choix) {
        setResultat({ type: 'mot', candidat: choix })
        setPhrase((p) => [...p, choix.mot].slice(-12))
        if (voixRef.current) dire(choix.mot)
      } else {
        setResultat({ type: 'incertain' })
      }
    }

    function boucle() {
      raf = requestAnimationFrame(boucle)
      const video = videoRef.current
      const canvas = canvasRef.current
      const holistic = holisticRef.current
      if (!video || !canvas || !holistic || video.readyState < 2 || video.currentTime === dernierTemps) return
      dernierTemps = video.currentTime

      const maintenant = performance.now()
      const res = holistic.detectForVideo(video, maintenant)
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
      }
      const ctx = canvas.getContext('2d')
      if (ctx) dessinerSquelette(ctx, res)

      if (!ecouteRef.current) return
      const f = compacterFrame(res, maintenant)
      repere = repereCorps(f) ?? repere
      const actif = repere ? frameActive(f, repere) : !!(f.main_g || f.main_d)

      tampon.push(f)
      if (tampon.length > TAMPON) tampon.shift()

      if (!signeEnCours) {
        actifsConsecutifs = actif ? actifsConsecutifs + 1 : 0
        if (actifsConsecutifs >= 2) {
          signeEnCours = true
          segment = [...tampon]
          debutSigne = maintenant
          derniereActivite = maintenant
          setEnSigne(true)
        }
        return
      }

      segment.push(f)
      if (actif) derniereActivite = maintenant
      if (maintenant - derniereActivite > SILENCE_MS || maintenant - debutSigne > DUREE_MAX_MS) {
        signeEnCours = false
        actifsConsecutifs = 0
        setEnSigne(false)
        const duree = derniereActivite - debutSigne
        const frames = segment
        segment = []
        if (duree >= DUREE_MIN_MS) analyser(frames)
      }
    }

    ;(async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('caméra non disponible dans ce navigateur (une connexion HTTPS est requise).')
        }
        const [stream, holistic] = await Promise.all([
          navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
          }),
          chargerHolistic(),
        ])
        if (arrete) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        holisticRef.current = holistic
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        setPhase((p) => (p === 'chargement' ? 'pret' : p))
        boucle()
      } catch (e) {
        if (arrete) return
        const nom = e instanceof DOMException ? e.name : ''
        setErreur(
          nom === 'NotAllowedError'
            ? 'Accès à la caméra refusé. Autorisez la caméra pour ce site, puis rechargez la page.'
            : `La caméra n’a pas pu démarrer : ${e instanceof Error ? e.message : e}`,
        )
        setPhase('erreur')
      }
    })()

    return () => {
      arrete = true
      cancelAnimationFrame(raf)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      window.speechSynthesis?.cancel()
    }
  }, [])

  function commencer() {
    // Sur iPhone, la voix doit être « débloquée » par un geste de l'utilisateur.
    const synth = window.speechSynthesis
    if (synth) {
      const u = new SpeechSynthesisUtterance(' ')
      u.volume = 0
      synth.speak(u)
    }
    ecouteRef.current = true
    setPhase('ecoute')
  }

  function pause() {
    ecouteRef.current = false
    setEnSigne(false)
    setPhase('pret')
  }

  const signesConnus = useMemo(() => {
    const compte = new Map<string, number>()
    for (const m of modeles ?? []) compte.set(m.glose, (compte.get(m.glose) ?? 0) + 1)
    return [...compte.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [modeles])

  const aucunExemple = modeles !== null && modeles.length === 0

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <section className="space-y-3">
        <div className="relative min-h-64 overflow-hidden rounded-2xl bg-black">
          <video ref={videoRef} muted playsInline className="miroir block h-auto w-full" />
          <canvas ref={canvasRef} className="miroir pointer-events-none absolute inset-0 h-full w-full" />
          {phase === 'chargement' && <ChargementIA />}
          {phase === 'ecoute' && (
            <div
              className={`absolute left-3 top-3 rounded-full px-3 py-1 font-bold text-white ${enSigne ? 'bg-alerte' : 'bg-ok'}`}
              role="status"
              aria-live="polite"
            >
              {enSigne ? '✋ Signe en cours…' : '👀 J’observe'}
            </div>
          )}
        </div>

        {phase === 'erreur' && (
          <p role="alert" className="rounded-lg border border-alerte/40 bg-alerte/10 p-4 text-alerte">
            {erreur}
          </p>
        )}

        {(phase === 'pret' || phase === 'ecoute') && (
          <div className="flex flex-wrap gap-2">
            {phase === 'pret' ? (
              <button
                onClick={commencer}
                disabled={aucunExemple}
                className="min-h-14 flex-1 rounded-xl bg-ok px-6 text-xl font-bold text-white disabled:opacity-50"
              >
                ▶ Commencer
              </button>
            ) : (
              <button onClick={pause} className="min-h-14 flex-1 rounded-xl bg-encre px-6 text-xl font-bold text-white">
                ⏸ Pause
              </button>
            )}
            <button
              onClick={() => setVoix((v) => !v)}
              aria-pressed={voix}
              className="min-h-14 rounded-xl border-2 border-encre px-4 text-lg font-semibold"
            >
              {voix ? '🔊 Voix activée' : '🔇 Voix coupée'}
            </button>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="rounded-2xl border border-ligne bg-carte p-5 text-center" aria-live="assertive">
          {resultat?.type === 'mot' ? (
            <>
              <p className="text-6xl font-black break-words">{resultat.candidat.mot}</p>
              <p className="mt-1 text-sm text-doux">{resultat.candidat.glose}</p>
            </>
          ) : resultat?.type === 'incertain' ? (
            <>
              <p className="text-6xl font-black text-doux">?</p>
              <p className="mt-1 text-sm text-doux">Signe pas reconnu avec assez de certitude : rien n’a été dit.</p>
            </>
          ) : (
            <p className="text-lg text-doux">Faites un signe : le mot s’affiche ici et le téléphone le dit à voix haute.</p>
          )}
        </div>

        {phrase.length > 0 && (
          <div className="space-y-2 rounded-2xl border border-ligne bg-carte p-4">
            <p className="text-xl">{phrase.join(' ')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => dire(phrase.join(' '))}
                className="min-h-11 rounded-lg bg-accent px-4 font-semibold text-white hover:bg-accent-fort"
              >
                🔊 Redire la phrase
              </button>
              <button onClick={() => setPhrase([])} className="min-h-11 rounded-lg border border-ligne px-4">
                Effacer
              </button>
            </div>
          </div>
        )}

        {aucunExemple && !erreur && (
          <div className="space-y-2 rounded-2xl bg-attention/10 p-4 text-attention">
            <p className="font-semibold">Aucun exemple de signe pour l’instant.</p>
            <p>
              Filmez quelques signes dans la{' '}
              <Link href="/tournage" className="underline">
                bibliothèque
              </Link>{' '}
              (5 prises par signe), en cochant dans le consentement la case qui autorise la reconnaissance. Vos propres
              prises servent tout de suite ; celles des autres, après validation.
            </p>
          </div>
        )}
        {erreur && phase !== 'erreur' && (
          <p role="alert" className="rounded-lg bg-alerte/10 p-3 text-alerte">
            {erreur}
          </p>
        )}

        <details className="rounded-2xl border border-ligne bg-carte p-4">
          <summary className="min-h-8 cursor-pointer font-medium">Réglages et détails</summary>
          <div className="mt-3 space-y-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium">
                Exigence : {seuil <= 0.45 ? 'stricte' : seuil >= 0.9 ? 'souple' : 'normale'} ({seuil.toFixed(2)})
              </span>
              <input
                type="range"
                min={0.3}
                max={1.2}
                step={0.05}
                value={seuil}
                onChange={(e) => setSeuil(Number(e.target.value))}
                className="w-full"
              />
              <span className="block text-xs text-doux">Plus strict = moins d’erreurs, mais plus de « ? ».</span>
            </label>
            {candidats.length > 0 && (
              <div>
                <p className="text-sm font-medium">Dernier signe : signes les plus proches</p>
                <ol className="text-sm">
                  {candidats.map((c) => (
                    <li key={c.glose}>
                      {c.glose} — distance {c.distance.toFixed(3)}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">
                Signes connus ({signesConnus.length}) — {modeles?.length ?? 0} exemples
              </p>
              <p className="text-sm text-doux">
                {signesConnus.map(([g, n]) => `${g} ×${n}`).join(' · ') || '—'}
              </p>
            </div>
          </div>
        </details>

        <p className="text-xs text-doux">
          Prototype : reconnaît des signes isolés à partir des exemples filmés. Ne remplace pas un·e interprète.
        </p>
      </section>
    </div>
  )
}
