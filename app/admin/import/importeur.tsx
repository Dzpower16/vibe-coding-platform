'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabaseNavigateur } from '@/lib/supabase/client'
import { chargerHolistic } from '@/lib/mediapipe/holistic'
import {
  MODELE_POSITIONS,
  compacterFrame,
  compresserPositions,
  suggestionRognage,
  type FramePositions,
} from '@/lib/mediapipe/positions'
import type { Signe, SourceExterne } from '@/lib/types'

type Statut = 'attente' | 'traitement' | 'envoye' | 'erreur'

interface Segment {
  cle: string
  signe: Signe
  debut: number // secondes
  fin: number
  signeurExterne: string
  statut: Statut
  message?: string
}

const DUREE_MAX_S = 15
const MIMES = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']

const normaliser = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`

type VideoAvecCapture = HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream }

function capturer(video: VideoAvecCapture): MediaStream | null {
  const flux = video.captureStream?.() ?? video.mozCaptureStream?.() ?? null
  return flux ? new MediaStream(flux.getVideoTracks()) : null
}

function attendre(video: HTMLVideoElement, evenement: 'seeked' | 'loadeddata') {
  return new Promise<void>((ok) => video.addEventListener(evenement, () => ok(), { once: true }))
}

export function Importeur({ userId, sources, signes }: { userId: string; sources: SourceExterne[]; signes: Signe[] }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [sourceId, setSourceId] = useState(sources[0]?.id ?? '')
  const [fichier, setFichier] = useState<File | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [debut, setDebut] = useState<number | null>(null)
  const [fin, setFin] = useState<number | null>(null)
  const [recherche, setRecherche] = useState('')
  const [signe, setSigne] = useState<Signe | null>(null)
  const [signeurExterne, setSigneurExterne] = useState(sources[0]?.personnes_filmees ?? '')
  const [segments, setSegments] = useState<Segment[]>([])
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const source = sources.find((s) => s.id === sourceId)
  const captureDispo = typeof window !== 'undefined' && 'captureStream' in HTMLMediaElement.prototype

  // Libère l'URL locale de la vidéo quand elle change ou quand on quitte la page.
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])

  function choisirFichier(f: File | null) {
    setFichier(f)
    setUrl(f ? URL.createObjectURL(f) : null)
    setSegments([])
    setDebut(null)
    setFin(null)
  }

  const resultats = useMemo(() => {
    const q = normaliser(recherche.trim())
    if (!q) return []
    return signes
      .filter((s) => normaliser(s.glose).includes(q) || s.mots_fr.some((m) => normaliser(m).includes(q)))
      .slice(0, 8)
  }, [recherche, signes])

  const temps = () => videoRef.current?.currentTime ?? 0
  const segmentValide = signe && debut !== null && fin !== null && fin > debut && fin - debut <= DUREE_MAX_S

  function ajouterSegment() {
    if (!segmentValide || !signe || debut === null || fin === null) return
    setSegments((l) => [
      ...l,
      { cle: crypto.randomUUID(), signe, debut, fin, signeurExterne: signeurExterne.trim(), statut: 'attente' },
    ])
    setSigne(null)
    setRecherche('')
    setDebut(fin)
    setFin(null)
  }

  function majSegment(cle: string, maj: Partial<Segment>) {
    setSegments((l) => l.map((s) => (s.cle === cle ? { ...s, ...maj } : s)))
  }

  /** Rejoue le segment en temps réel : enregistre la vidéo du segment et calcule les positions. */
  async function decouper(seg: Segment) {
    const video = videoRef.current as VideoAvecCapture | null
    if (!video) throw new Error('vidéo absente')
    const holistic = await chargerHolistic()
    video.pause()
    video.muted = true
    video.currentTime = seg.debut
    await attendre(video, 'seeked')
    // Préchauffage : la toute première analyse peut prendre plusieurs secondes (compilation GPU).
    holistic.detectForVideo(video, performance.now())
    holistic.detectForVideo(video, performance.now())

    const flux = capturer(video)
    if (!flux) throw new Error('ce navigateur ne permet pas de découper la vidéo (utilisez Chrome ou Edge)')
    const mime = MIMES.find((m) => MediaRecorder.isTypeSupported(m)) ?? ''
    const rec = new MediaRecorder(flux, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: 2_500_000 })
    const morceaux: Blob[] = []
    rec.ondataavailable = (e) => e.data.size > 0 && morceaux.push(e.data)
    const fini = new Promise<void>((ok) => (rec.onstop = () => ok()))

    const frames: FramePositions[] = []
    let dernier = -1
    let raf = 0
    const arreter = () => {
      video.pause()
      if (rec.state === 'recording') rec.stop()
    }
    const boucle = () => {
      if (video.currentTime >= seg.fin || video.ended) {
        arreter()
        return
      }
      raf = requestAnimationFrame(boucle)
      if (video.currentTime === dernier || video.readyState < 2) return
      dernier = video.currentTime
      const res = holistic.detectForVideo(video, performance.now())
      frames.push(compacterFrame(res, (video.currentTime - seg.debut) * 1000))
    }

    rec.start(250)
    await video.play()
    raf = requestAnimationFrame(boucle)
    // Arrêt de secours si la boucle prend du retard.
    const minuteur = window.setTimeout(arreter, (seg.fin - seg.debut) * 1000 + 100)
    await fini
    window.clearTimeout(minuteur)
    cancelAnimationFrame(raf)

    const typeBase = (rec.mimeType || mime).startsWith('video/mp4') ? 'video/mp4' : 'video/webm'
    const dureeMs = Math.round((seg.fin - seg.debut) * 1000)
    return {
      blob: new Blob(morceaux, { type: typeBase }),
      mime: typeBase,
      dureeMs,
      frames: frames.filter((f) => f.t >= 0 && f.t <= dureeMs),
      largeur: video.videoWidth,
      hauteur: video.videoHeight,
    }
  }

  async function envoyer(seg: Segment) {
    const supabase = supabaseNavigateur()
    const id = crypto.randomUUID()
    const clip = await decouper(seg)
    const ext = clip.mime === 'video/mp4' ? 'mp4' : 'webm'
    const dossier = `${userId}/${seg.signe.glose}`
    const videoPath = `${dossier}/${id}.${ext}`
    const positionsPath = `${dossier}/${id}.json.gz`
    const gz = await compresserPositions({
      version: 1,
      modele: MODELE_POSITIONS,
      largeur: clip.largeur,
      hauteur: clip.hauteur,
      miroir: false,
      frames: clip.frames,
    })

    const v = await supabase.storage.from('videos-signes').upload(videoPath, clip.blob, { contentType: clip.mime })
    if (v.error) throw new Error(`vidéo : ${v.error.message}`)
    const p = await supabase.storage.from('positions-signes').upload(positionsPath, gz, { contentType: 'application/gzip' })
    if (p.error) {
      await supabase.storage.from('videos-signes').remove([videoPath])
      throw new Error(`positions : ${p.error.message}`)
    }
    const rognage = suggestionRognage(clip.frames, clip.dureeMs)
    const { error } = await supabase.from('enregistrements').insert({
      id,
      signe_id: seg.signe.id,
      signeur_id: userId,
      origine: 'externe',
      source_externe_id: sourceId,
      signeur_externe: seg.signeurExterne || null,
      video_path: videoPath,
      positions_path: positionsPath,
      mime: clip.mime,
      duree_ms: clip.dureeMs,
      largeur: clip.largeur,
      hauteur: clip.hauteur,
      nb_frames_positions: clip.frames.length,
      debut_ms: rognage?.debut_ms ?? null,
      fin_ms: rognage?.fin_ms ?? null,
      source_debut_ms: Math.round(seg.debut * 1000),
      source_fin_ms: Math.round(seg.fin * 1000),
      commentaire: fichier ? `Import : ${fichier.name}` : null,
    })
    if (error) {
      await Promise.all([
        supabase.storage.from('videos-signes').remove([videoPath]),
        supabase.storage.from('positions-signes').remove([positionsPath]),
      ])
      throw new Error(error.message)
    }
    return clip.frames.some((f) => f.main_g || f.main_d)
  }

  async function toutEnvoyer() {
    setEnCours(true)
    setErreur(null)
    for (const seg of segments.filter((s) => s.statut === 'attente' || s.statut === 'erreur')) {
      majSegment(seg.cle, { statut: 'traitement', message: undefined })
      try {
        const avecMains = await envoyer(seg)
        majSegment(seg.cle, { statut: 'envoye', message: avecMains ? undefined : 'Envoyé, mais aucune main détectée.' })
      } catch (e) {
        majSegment(seg.cle, { statut: 'erreur', message: e instanceof Error ? e.message : String(e) })
      }
    }
    setEnCours(false)
  }

  const champ = 'w-full min-h-11 rounded-lg border border-ligne bg-carte px-3'
  const aEnvoyer = segments.filter((s) => s.statut === 'attente' || s.statut === 'erreur').length

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <section className="space-y-4 rounded-2xl border border-ligne bg-carte p-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">1. Accord écrit</span>
          <select
            value={sourceId}
            disabled={enCours}
            onChange={(e) => {
              setSourceId(e.target.value)
              setSigneurExterne(sources.find((s) => s.id === e.target.value)?.personnes_filmees ?? '')
            }}
            className={champ}
          >
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.titulaire} ({[s.portee_application && 'application', s.portee_reconnaissance && 'IA'].filter(Boolean).join(', ')})
              </option>
            ))}
          </select>
          {source && <span className="block text-xs text-doux">Personnes filmées : {source.personnes_filmees}</span>}
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">2. Fichier vidéo (fourni par le ou la titulaire)</span>
          <input type="file" accept="video/*" disabled={enCours} onChange={(e) => choisirFichier(e.target.files?.[0] ?? null)} className="block w-full text-sm" />
        </label>

        {!captureDispo && (
          <p role="alert" className="rounded-lg bg-attention/10 p-3 text-sm text-attention">
            Ce navigateur ne sait pas découper une vidéo. Utilisez Chrome ou Edge sur ordinateur.
          </p>
        )}

        {url && (
          <>
            <video ref={videoRef} src={url} controls playsInline className="block h-auto w-full rounded-xl bg-black" />
            <div className="space-y-3">
              <p className="text-sm font-medium">3. Marquez un signe : mettez la vidéo au bon moment, puis</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setDebut(temps())} className="min-h-11 rounded-lg border-2 border-encre px-4 font-semibold">
                  Début ici {debut !== null && `(${fmt(debut)})`}
                </button>
                <button type="button" onClick={() => setFin(temps())} className="min-h-11 rounded-lg border-2 border-encre px-4 font-semibold">
                  Fin ici {fin !== null && `(${fmt(fin)})`}
                </button>
              </div>
              {debut !== null && fin !== null && fin - debut > DUREE_MAX_S && (
                <p className="text-sm text-alerte">Un segment dure au plus {DUREE_MAX_S} secondes.</p>
              )}
              <div className="space-y-1">
                <input
                  type="search"
                  placeholder="🔎 Quel signe ? (mot ou glose)"
                  aria-label="Chercher le signe"
                  value={recherche}
                  onChange={(e) => {
                    setRecherche(e.target.value)
                    setSigne(null)
                  }}
                  className={champ}
                />
                {resultats.length > 0 && !signe && (
                  <ul className="max-h-56 overflow-y-auto rounded-lg border border-ligne">
                    {resultats.map((s) => (
                      <li key={s.id}>
                        <button type="button" onClick={() => setSigne(s)} className="w-full px-3 py-2 text-left hover:bg-fond">
                          <span className="font-bold">{s.glose}</span> <span className="text-sm text-doux">{s.mots_fr.join(', ')}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {signe && (
                  <p className="rounded-lg bg-accent/10 p-2 text-sm">
                    <strong>{signe.glose}</strong> — {signe.definition}
                  </p>
                )}
              </div>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Personne qui signe dans ce segment</span>
                <input value={signeurExterne} onChange={(e) => setSigneurExterne(e.target.value)} className={champ} />
              </label>
              <button
                type="button"
                disabled={!segmentValide || enCours}
                onClick={ajouterSegment}
                className="min-h-12 w-full rounded-lg bg-accent px-4 font-semibold text-white hover:bg-accent-fort disabled:opacity-50"
              >
                + Ajouter ce segment
              </button>
            </div>
          </>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-ligne bg-carte p-4">
        <h2 className="text-lg font-bold">Segments ({segments.length})</h2>
        {segments.length === 0 ? (
          <p className="text-sm text-doux">Marquez le début et la fin d’un signe, choisissez le signe, puis ajoutez-le.</p>
        ) : (
          <ul className="space-y-2">
            {segments.map((s) => (
              <li key={s.cle} className="flex items-start justify-between gap-2 rounded-lg border border-ligne p-3">
                <div className="min-w-0">
                  <p className="font-bold">{s.signe.glose}</p>
                  <p className="text-xs text-doux">
                    {fmt(s.debut)} → {fmt(s.fin)} · {s.signeurExterne || 'signeur·euse non précisé·e'}
                  </p>
                  {s.message && <p className={`text-xs ${s.statut === 'erreur' ? 'text-alerte' : 'text-attention'}`}>{s.message}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2 text-xs font-semibold ${
                      s.statut === 'envoye' ? 'bg-ok/15 text-ok' : s.statut === 'erreur' ? 'bg-alerte/15 text-alerte' : s.statut === 'traitement' ? 'bg-accent/15 text-accent' : 'bg-ligne text-doux'
                    }`}
                  >
                    {{ attente: 'À envoyer', traitement: 'En cours…', envoye: 'Envoyé', erreur: 'Erreur' }[s.statut]}
                  </span>
                  {s.statut === 'attente' && !enCours && (
                    <button onClick={() => setSegments((l) => l.filter((x) => x.cle !== s.cle))} className="min-h-9 px-2 text-sm text-doux underline" aria-label={`Retirer ${s.signe.glose}`}>
                      Retirer
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {erreur && <p role="alert" className="text-alerte">{erreur}</p>}
        <button
          disabled={aEnvoyer === 0 || enCours || !captureDispo}
          onClick={toutEnvoyer}
          className="min-h-12 w-full rounded-lg bg-ok px-4 font-semibold text-white disabled:opacity-50"
        >
          {enCours ? 'Découpage et envoi… (la vidéo se rejoue)' : `Découper et envoyer ${aEnvoyer} segment${aEnvoyer > 1 ? 's' : ''}`}
        </button>
        <p className="text-xs text-doux">
          Chaque segment est rejoué en temps réel pour enregistrer le clip et calculer les mouvements des mains. Gardez
          l’onglet ouvert pendant l’envoi.
        </p>
      </section>
    </div>
  )
}
