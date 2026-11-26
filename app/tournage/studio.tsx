'use client'

import { useEffect, useRef, useState } from 'react'
import type { HolisticLandmarker } from '@mediapipe/tasks-vision'
import { supabaseNavigateur } from '@/lib/supabase/client'
import { chargerHolistic } from '@/lib/mediapipe/holistic'
import { dessinerSquelette } from '@/lib/mediapipe/dessin'
import { ChargementIA } from '@/components/chargement-ia'
import {
  MODELE_POSITIONS,
  compacterFrame,
  compresserPositions,
  etatCadrage,
  suggestionRognage,
  type FramePositions,
} from '@/lib/mediapipe/positions'
import { nomCategorie } from '@/lib/categories'
import type { MainDominante, Signe } from '@/lib/types'

type Phase = 'chargement' | 'erreur' | 'pret' | 'compte' | 'enregistrement' | 'revue' | 'envoi' | 'envoye'

interface Prise {
  blob: Blob
  url: string
  mime: string
  dureeMs: number
  frames: FramePositions[]
  largeur: number
  hauteur: number
  fps: number | null
  rognage: { debut_ms: number; fin_ms: number } | null
}

const DUREE_MAX_MS = 8000
/** Arrêt automatique : mains invisibles pendant ce délai après avoir été vues. */
const DELAI_MAINS_BAISSEES_MS = 1200
const MIMES = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']

function choisirMime(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  return MIMES.find((m) => MediaRecorder.isTypeSupported(m)) ?? ''
}

function messageErreur(e: unknown): string {
  const nom = e instanceof DOMException ? e.name : ''
  if (nom === 'NotAllowedError') return 'Accès à la caméra refusé. Autorisez la caméra pour ce site dans le navigateur, puis rechargez la page.'
  if (nom === 'NotFoundError' || nom === 'OverconstrainedError') return 'Aucune caméra trouvée sur cet appareil.'
  if (nom === 'NotReadableError') return 'La caméra est déjà utilisée par une autre application.'
  const texte = e instanceof Error ? e.message : String(e)
  return `Le studio n’a pas pu démarrer : ${texte}`
}

export function Studio({
  signe,
  userId,
  consentementId,
  mainDominante,
  nbPrises,
  onEnvoye,
  onSuivant,
  onFermer,
}: {
  signe: Signe
  userId: string
  consentementId: string
  mainDominante: MainDominante
  nbPrises: number
  onEnvoye: () => void
  onSuivant: () => void
  onFermer: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const holisticRef = useRef<HolisticLandmarker | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const framesRef = useRef<FramePositions[]>([])
  const debutRef = useRef(0)
  const dureeRef = useRef(0)
  const enregistreRef = useRef(false)
  const annuleRef = useRef(false)
  const mainsVuesRef = useRef(false)
  const derniereMainRef = useRef(0)
  const autoStopRef = useRef(true)
  const minuteursRef = useRef<number[]>([])
  const arreterRef = useRef<() => void>(() => {})

  const [phase, setPhase] = useState<Phase>('chargement')
  const [erreur, setErreur] = useState<string | null>(null)
  const [cadrage, setCadrage] = useState({ visage: false, epaules: false, mains: false })
  const [compte, setCompte] = useState(3)
  const [ecoule, setEcoule] = useState(0)
  const [prise, setPrise] = useState<Prise | null>(null)
  const [variante, setVariante] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [etapeEnvoi, setEtapeEnvoi] = useState('')
  const [autoStop, setAutoStop] = useState(true)

  // Changement de signe : on revient à l'état « prêt » (motif « ajuster l'état quand une prop change »).
  const [signeVu, setSigneVu] = useState(signe.id)
  if (signeVu !== signe.id) {
    setSigneVu(signe.id)
    setPrise(null)
    setVariante('')
    setCommentaire('')
    setErreur(null)
    setPhase((p) => (p === 'chargement' || p === 'erreur' ? p : 'pret'))
  }

  function viderMinuteurs() {
    for (const id of minuteursRef.current) {
      clearTimeout(id)
      clearInterval(id)
    }
    minuteursRef.current = []
  }

  // Si on change de signe en plein enregistrement, la prise est abandonnée.
  useEffect(() => {
    return () => {
      viderMinuteurs()
      if (recorderRef.current?.state === 'recording') {
        annuleRef.current = true
        enregistreRef.current = false
        recorderRef.current.stop()
      }
    }
  }, [signe.id])

  useEffect(() => {
    autoStopRef.current = autoStop
  }, [autoStop])

  // Libère l'URL de la prise précédente.
  useEffect(() => {
    return () => {
      if (prise) URL.revokeObjectURL(prise.url)
    }
  }, [prise])

  // Caméra + détection, une seule fois pour toute la session de tournage.
  useEffect(() => {
    let arrete = false
    let raf = 0
    let dernierTemps = -1
    let derniereMaj = 0

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

      if (enregistreRef.current) {
        const t = maintenant - debutRef.current
        const frame = compacterFrame(res, t)
        framesRef.current.push(frame)
        if (frame.main_g || frame.main_d) {
          mainsVuesRef.current = true
          derniereMainRef.current = maintenant
        } else if (
          autoStopRef.current &&
          mainsVuesRef.current &&
          t > 800 &&
          maintenant - derniereMainRef.current > DELAI_MAINS_BAISSEES_MS
        ) {
          arreterRef.current()
        }
      }

      if (maintenant - derniereMaj > 250) {
        derniereMaj = maintenant
        const etat = etatCadrage(res)
        setCadrage((p) => (p.visage === etat.visage && p.epaules === etat.epaules && p.mains === etat.mains ? p : etat))
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
        setErreur(messageErreur(e))
        setPhase('erreur')
      }
    })()

    return () => {
      arrete = true
      cancelAnimationFrame(raf)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  function demarrer() {
    if (phase !== 'pret' && phase !== 'envoye') return
    setPrise(null)
    setErreur(null)
    setPhase('compte')
    setCompte(3)
    let n = 3
    const id = window.setInterval(() => {
      n--
      if (n > 0) setCompte(n)
      else {
        clearInterval(id)
        lancerEnregistrement()
      }
    }, 800)
    minuteursRef.current.push(id)
  }

  function lancerEnregistrement() {
    const stream = streamRef.current
    if (!stream) return
    const mime = choisirMime()
    let rec: MediaRecorder
    try {
      rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: 2_500_000 })
    } catch (e) {
      setErreur(`Enregistrement vidéo impossible dans ce navigateur : ${e instanceof Error ? e.message : e}`)
      setPhase('pret')
      return
    }
    chunksRef.current = []
    framesRef.current = []
    annuleRef.current = false
    mainsVuesRef.current = false

    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    rec.onstart = () => {
      debutRef.current = performance.now()
      enregistreRef.current = true
      setEcoule(0)
      setPhase('enregistrement')
      const tic = window.setInterval(() => setEcoule(performance.now() - debutRef.current), 100)
      const fin = window.setTimeout(() => arreterRef.current(), DUREE_MAX_MS)
      minuteursRef.current.push(tic, fin)
    }
    rec.onstop = () => finaliser(rec.mimeType || mime || 'video/webm')
    recorderRef.current = rec
    rec.start(250)
  }

  function arreter() {
    const rec = recorderRef.current
    if (!rec || rec.state !== 'recording') return
    enregistreRef.current = false
    dureeRef.current = Math.round(performance.now() - debutRef.current)
    viderMinuteurs()
    rec.stop()
  }

  useEffect(() => {
    arreterRef.current = arreter
  })

  function finaliser(mime: string) {
    if (annuleRef.current) return
    const video = videoRef.current
    const duree = dureeRef.current
    const typeBase = mime.startsWith('video/mp4') ? 'video/mp4' : 'video/webm'
    const blob = new Blob(chunksRef.current, { type: typeBase })
    const frames = framesRef.current.filter((f) => f.t >= 0 && f.t <= duree)
    const fps = streamRef.current?.getVideoTracks()[0]?.getSettings().frameRate ?? null
    setPrise({
      blob,
      url: URL.createObjectURL(blob),
      mime: typeBase,
      dureeMs: duree,
      frames,
      largeur: video?.videoWidth ?? 0,
      hauteur: video?.videoHeight ?? 0,
      fps,
      rognage: suggestionRognage(frames, duree),
    })
    setPhase('revue')
  }

  async function envoyer() {
    if (!prise) return
    const supabase = supabaseNavigateur()
    const id = crypto.randomUUID()
    const ext = prise.mime === 'video/mp4' ? 'mp4' : 'webm'
    const dossier = `${userId}/${signe.glose}`
    const videoPath = `${dossier}/${id}.${ext}`
    const positionsPath = `${dossier}/${id}.json.gz`
    setPhase('envoi')
    setErreur(null)

    try {
      setEtapeEnvoi('Compression des positions…')
      const gz = await compresserPositions({
        version: 1,
        modele: MODELE_POSITIONS,
        largeur: prise.largeur,
        hauteur: prise.hauteur,
        miroir: false,
        frames: prise.frames,
      })

      setEtapeEnvoi('Envoi de la vidéo…')
      const v = await supabase.storage.from('videos-signes').upload(videoPath, prise.blob, { contentType: prise.mime })
      if (v.error) throw new Error(`vidéo : ${v.error.message}`)

      setEtapeEnvoi('Envoi des positions…')
      const p = await supabase.storage.from('positions-signes').upload(positionsPath, gz, { contentType: 'application/gzip' })
      if (p.error) {
        await supabase.storage.from('videos-signes').remove([videoPath])
        throw new Error(`positions : ${p.error.message}`)
      }

      setEtapeEnvoi('Enregistrement…')
      const { error } = await supabase.from('enregistrements').insert({
        id,
        signe_id: signe.id,
        signeur_id: userId,
        consentement_id: consentementId,
        video_path: videoPath,
        positions_path: positionsPath,
        mime: prise.mime,
        duree_ms: prise.dureeMs,
        largeur: prise.largeur,
        hauteur: prise.hauteur,
        fps: prise.fps,
        nb_frames_positions: prise.frames.length,
        debut_ms: prise.rognage?.debut_ms ?? null,
        fin_ms: prise.rognage?.fin_ms ?? null,
        main_dominante: mainDominante,
        variante: variante.trim() || null,
        commentaire: commentaire.trim() || null,
      })
      if (error) {
        await Promise.all([
          supabase.storage.from('videos-signes').remove([videoPath]),
          supabase.storage.from('positions-signes').remove([positionsPath]),
        ])
        throw new Error(error.message)
      }

      setPhase('envoye')
      setPrise(null)
      setVariante('')
      setCommentaire('')
      onEnvoye()
    } catch (e) {
      setErreur(`L’envoi a échoué (${e instanceof Error ? e.message : e}). Vous pouvez réessayer.`)
      setPhase('revue')
    }
  }

  function recommencer() {
    setPrise(null)
    setPhase('pret')
  }

  const sansMains = prise && !prise.frames.some((f) => f.main_g || f.main_d)
  const peuDePositions = prise && prise.dureeMs > 0 && prise.frames.length / (prise.dureeMs / 1000) < 8
  const enDirect = phase !== 'revue' && phase !== 'envoi'

  return (
    <div className="space-y-4 rounded-2xl border border-ligne bg-carte p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-doux">
            {nomCategorie(signe.categorie)} · {'★'.repeat(4 - signe.priorite)}
          </p>
          <h2 className="break-words text-3xl font-bold sm:text-4xl">{signe.glose}</h2>
          <p className="text-lg text-doux">{signe.mots_fr.join(', ')}</p>
          {signe.definition && <p className="mt-1 max-w-prose">{signe.definition}</p>}
          {signe.notes && <p className="text-sm italic text-doux">Sens : {signe.notes}</p>}
          {signe.reference_url && (
            <p className="mt-1 text-sm">
              <a
                href={signe.reference_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1 font-medium text-accent underline"
              >
                📖 Vérifier le sens dans Mon dictionnaire LSQ
                <span className="sr-only"> (nouvel onglet)</span>
              </a>
              <span className="block text-doux">Signez comme vous le faites : votre variante est bienvenue.</span>
            </p>
          )}
          {nbPrises > 0 && <p className="mt-1 text-sm text-ok">✓ Vous avez déjà {nbPrises} prise{nbPrises > 1 ? 's' : ''} de ce signe.</p>}
        </div>
        <button onClick={onFermer} className="min-h-11 shrink-0 rounded-lg px-3 text-doux underline lg:hidden">
          ← Liste
        </button>
      </header>

      {/* Aperçu caméra (miroir) — gardé monté pour conserver la caméra */}
      <div className={enDirect ? 'space-y-2' : 'hidden'}>
        <div className="relative min-h-64 overflow-hidden rounded-xl bg-black">
          <video ref={videoRef} muted playsInline className="miroir block h-auto w-full" />
          <canvas ref={canvasRef} className="miroir pointer-events-none absolute inset-0 h-full w-full" />

          {phase === 'chargement' && <ChargementIA />}
          {phase === 'compte' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30" role="status" aria-live="assertive">
              <span className="text-[10rem] font-black leading-none text-white drop-shadow-lg">{compte}</span>
            </div>
          )}
          {phase === 'enregistrement' && (
            <>
              <div className="pointer-events-none absolute inset-0 rounded-xl border-8 border-alerte" />
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-alerte px-3 py-1 font-bold text-white" role="status">
                <span className="size-3 animate-pulse rounded-full bg-white" /> ENREGISTREMENT
              </div>
              <div className="absolute inset-x-0 bottom-0 h-3 bg-black/40">
                <div className="h-full bg-alerte" style={{ width: `${Math.min(100, (ecoule / DUREE_MAX_MS) * 100)}%` }} />
              </div>
            </>
          )}
          {phase === 'envoye' && (
            <div className="absolute inset-x-0 top-0 bg-ok p-3 text-center text-lg font-bold text-white" role="status">
              ✅ Prise envoyée, merci ! Elle sera vérifiée avant d’être utilisée.
            </div>
          )}
        </div>

        {phase !== 'chargement' && phase !== 'erreur' && (
          <ul className="flex flex-wrap gap-2" aria-label="Cadrage">
            {(
              [
                ['visage', 'Visage'],
                ['epaules', 'Épaules'],
                ['mains', 'Mains'],
              ] as const
            ).map(([cle, libelle]) => (
              <li
                key={cle}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${cadrage[cle] ? 'bg-ok/15 text-ok' : 'bg-ligne text-doux'}`}
              >
                {cadrage[cle] ? '✓' : '○'} {libelle}
              </li>
            ))}
          </ul>
        )}
      </div>

      {phase === 'erreur' && (
        <p role="alert" className="rounded-lg border border-alerte/40 bg-alerte/10 p-4 text-alerte">
          {erreur}
        </p>
      )}

      {(phase === 'pret' || phase === 'envoye') && (
        <div className="space-y-3">
          <p className="text-doux">
            Cadrez <strong>tête, épaules et mains</strong>. Après le compte à rebours, faites le signe une fois,
            en <strong>commençant et finissant les mains baissées</strong>.
          </p>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" className="size-5" checked={autoStop} onChange={(e) => setAutoStop(e.target.checked)} />
            Arrêt automatique quand mes mains redescendent
          </label>
          {erreur && <p role="alert" className="text-alerte">{erreur}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={demarrer}
              className="min-h-14 flex-1 rounded-xl bg-alerte px-6 text-xl font-bold text-white hover:opacity-90"
            >
              ● {phase === 'envoye' ? 'Filmer une autre prise' : 'Filmer'}
            </button>
            {phase === 'envoye' && (
              <button onClick={onSuivant} className="min-h-14 flex-1 rounded-xl bg-accent px-6 text-xl font-bold text-white hover:bg-accent-fort">
                Signe suivant →
              </button>
            )}
          </div>
        </div>
      )}

      {phase === 'enregistrement' && (
        <button onClick={arreter} className="min-h-14 w-full rounded-xl bg-encre px-6 text-xl font-bold text-white">
          ■ Arrêter ({(ecoule / 1000).toFixed(1)} s)
        </button>
      )}

      {(phase === 'revue' || phase === 'envoi') && prise && (
        <div className="space-y-3">
          <video src={prise.url} controls autoPlay loop muted playsInline className="block h-auto w-full rounded-xl bg-black" />
          <p className="text-sm text-doux">
            Voici votre signe tel que les autres le verront (non inversé). Durée {(prise.dureeMs / 1000).toFixed(1)} s ·{' '}
            {prise.frames.length} positions.
          </p>
          {sansMains && (
            <p role="alert" className="rounded-lg bg-attention/10 p-3 text-attention">
              ⚠️ Les mains n’ont pas été détectées. Vérifiez la lumière et le cadrage, puis recommencez si besoin.
            </p>
          )}
          {peuDePositions && !sansMains && (
            <p className="rounded-lg bg-attention/10 p-3 text-sm text-attention">
              Peu de positions enregistrées (appareil lent). La vidéo reste utilisable.
            </p>
          )}
          <details className="rounded-lg border border-ligne p-3">
            <summary className="min-h-8 cursor-pointer font-medium">Ajouter une précision (facultatif)</summary>
            <div className="mt-3 space-y-3">
              <label className="block space-y-1">
                <span className="text-sm font-medium">Variante (ex. régionale)</span>
                <input
                  maxLength={120}
                  value={variante}
                  onChange={(e) => setVariante(e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-ligne px-3"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Commentaire pour la validation</span>
                <textarea
                  maxLength={1000}
                  rows={2}
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  className="w-full rounded-lg border border-ligne p-3"
                />
              </label>
            </div>
          </details>
          {erreur && <p role="alert" className="text-alerte">{erreur}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={recommencer}
              disabled={phase === 'envoi'}
              className="min-h-14 flex-1 rounded-xl border-2 border-encre px-6 text-xl font-bold disabled:opacity-50"
            >
              ↺ Recommencer
            </button>
            <button
              onClick={envoyer}
              disabled={phase === 'envoi'}
              className="min-h-14 flex-1 rounded-xl bg-ok px-6 text-xl font-bold text-white disabled:opacity-70"
            >
              {phase === 'envoi' ? etapeEnvoi : '✓ Envoyer cette prise'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
