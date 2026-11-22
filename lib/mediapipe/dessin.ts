import { HolisticLandmarker, type HolisticLandmarkerResult } from '@mediapipe/tasks-vision'

/** Dessine un squelette léger (corps du haut, mains, contour du visage) sur un canvas 2D. */
export function dessinerSquelette(ctx: CanvasRenderingContext2D, res: HolisticLandmarkerResult) {
  const { width: w, height: h } = ctx.canvas
  ctx.clearRect(0, 0, w, h)
  ctx.lineCap = 'round'

  const relier = (pts: { x: number; y: number }[] | undefined, liens: { start: number; end: number }[], couleur: string, epaisseur: number) => {
    if (!pts?.length) return
    ctx.strokeStyle = couleur
    ctx.lineWidth = epaisseur
    ctx.beginPath()
    for (const { start, end } of liens) {
      const a = pts[start]
      const b = pts[end]
      if (!a || !b) continue
      ctx.moveTo(a.x * w, a.y * h)
      ctx.lineTo(b.x * w, b.y * h)
    }
    ctx.stroke()
  }

  // Corps : seulement le haut (indices 0 à 24), les jambes sont hors cadre.
  const liensHaut = HolisticLandmarker.POSE_CONNECTIONS.filter((c) => c.start <= 24 && c.end <= 24 && c.start >= 11 && c.end >= 11)
  relier(res.poseLandmarks?.[0], liensHaut, 'rgba(255,255,255,0.85)', 4)
  relier(res.faceLandmarks?.[0], HolisticLandmarker.FACE_LANDMARKS_FACE_OVAL, 'rgba(250,204,21,0.9)', 2)
  relier(res.faceLandmarks?.[0], HolisticLandmarker.FACE_LANDMARKS_LIPS, 'rgba(250,204,21,0.9)', 2)
  relier(res.leftHandLandmarks?.[0], HolisticLandmarker.HAND_CONNECTIONS, 'rgba(56,189,248,0.95)', 3)
  relier(res.rightHandLandmarks?.[0], HolisticLandmarker.HAND_CONNECTIONS, 'rgba(244,114,182,0.95)', 3)
}
