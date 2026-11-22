import type { HolisticLandmarkerResult, NormalizedLandmark } from '@mediapipe/tasks-vision'

/** Format des positions, version 1 — documenté dans CLAUDE.md §6. */
export interface FramePositions {
  /** ms depuis le début de la vidéo */
  t: number
  corps: number[][] | null
  main_g: number[][] | null
  main_d: number[][] | null
  visage: number[][] | null
}

export interface DocumentPositions {
  version: 1
  modele: string
  largeur: number
  hauteur: number
  miroir: false
  frames: FramePositions[]
}

export const MODELE_POSITIONS = 'mediapipe-holistic/tasks-vision@1.2.3'

const r = (v: number) => Math.round(v * 10000) / 10000

function points(liste: NormalizedLandmark[][] | undefined, avecVisibilite = false): number[][] | null {
  const lm = liste?.[0]
  if (!lm || lm.length === 0) return null
  return lm.map((p) => (avecVisibilite ? [r(p.x), r(p.y), r(p.z), r(p.visibility ?? 0)] : [r(p.x), r(p.y), r(p.z)]))
}

export function compacterFrame(res: HolisticLandmarkerResult, t: number): FramePositions {
  return {
    t: Math.round(t),
    corps: points(res.poseLandmarks, true),
    main_g: points(res.leftHandLandmarks),
    main_d: points(res.rightHandLandmarks),
    visage: points(res.faceLandmarks),
  }
}

/** État du cadrage pour guider la personne qui filme. */
export function etatCadrage(res: HolisticLandmarkerResult | null) {
  const pose = res?.poseLandmarks?.[0]
  // 11 et 12 = épaules dans le modèle de pose MediaPipe
  const epaules =
    !!pose && [11, 12].every((i) => (pose[i]?.visibility ?? 0) > 0.5 && pose[i].x > 0.02 && pose[i].x < 0.98)
  return {
    visage: (res?.faceLandmarks?.[0]?.length ?? 0) > 0,
    epaules,
    mains: (res?.leftHandLandmarks?.[0]?.length ?? 0) + (res?.rightHandLandmarks?.[0]?.length ?? 0) > 0,
  }
}

/**
 * Rognage suggéré : du premier au dernier instant où une main est visible,
 * avec une petite marge. null si aucune main détectée.
 */
export function suggestionRognage(frames: FramePositions[], dureeMs: number) {
  const avecMain = frames.filter((f) => f.main_g || f.main_d)
  if (avecMain.length === 0) return null
  const debut = Math.max(0, avecMain[0].t - 150)
  const fin = Math.min(dureeMs, avecMain[avecMain.length - 1].t + 250)
  return fin > debut ? { debut_ms: Math.round(debut), fin_ms: Math.round(fin) } : null
}

/** JSON → gzip (CompressionStream, Safari 16.4+, Chrome 80+, Firefox 113+). */
export async function compresserPositions(doc: DocumentPositions): Promise<Blob> {
  const flux = new Blob([JSON.stringify(doc)], { type: 'application/json' })
    .stream()
    .pipeThrough(new CompressionStream('gzip'))
  const blob = await new Response(flux).blob()
  return new Blob([blob], { type: 'application/gzip' })
}
