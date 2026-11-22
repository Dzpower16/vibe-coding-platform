'use client'

import type { HolisticLandmarker } from '@mediapipe/tasks-vision'

/** WASM copié depuis node_modules au postinstall (scripts/copier-mediapipe.mjs). */
const WASM_BASE = '/mediapipe/wasm'
export const MODELE_HOLISTIC_URL =
  'https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/1/holistic_landmarker.task'

let promesse: Promise<HolisticLandmarker> | null = null

/** Charge (une seule fois) le HolisticLandmarker : corps 33 + mains 2×21 + visage 478 points. */
export function chargerHolistic(): Promise<HolisticLandmarker> {
  if (!promesse) {
    promesse = (async () => {
      const { FilesetResolver, HolisticLandmarker } = await import('@mediapipe/tasks-vision')
      const fileset = await FilesetResolver.forVisionTasks(WASM_BASE)
      const creer = (delegate: 'GPU' | 'CPU') =>
        HolisticLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODELE_HOLISTIC_URL, delegate },
          runningMode: 'VIDEO',
          outputFaceBlendshapes: false,
          outputPoseSegmentationMasks: false,
        })
      try {
        return await creer('GPU')
      } catch {
        return await creer('CPU')
      }
    })().catch((e) => {
      promesse = null
      throw e
    })
  }
  return promesse
}
