'use client'

import type { HolisticLandmarker } from '@mediapipe/tasks-vision'

/** WASM copié depuis node_modules au postinstall (scripts/copier-mediapipe.mjs), servi avec un cache d'un an. */
const WASM_BASE = '/mediapipe/wasm'
export const MODELE_HOLISTIC_URL =
  'https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/1/holistic_landmarker.task'

/**
 * Google ne met le modèle (≈ 13,7 Mo) en cache qu'une heure : sans ça, chaque visite le retélécharge.
 * On le garde dans le Cache Storage du navigateur. Changer de modèle = changer de nom de cache.
 */
const CACHE_IA = 'entre-mains-ia-v1'
const TAILLE_MODELE_ESTIMEE = 13_683_609

export type EtatChargementIA =
  | { etape: 'attente' }
  | { etape: 'telechargement'; recu: number; total: number }
  | { etape: 'preparation' }
  | { etape: 'pret' }
  | { etape: 'erreur' }

// ---------------------------------------------------------------------------
// Petit magasin d'état, lu par les composants avec useSyncExternalStore.
// ---------------------------------------------------------------------------
let etat: EtatChargementIA = { etape: 'attente' }
const abonnes = new Set<() => void>()

function publier(e: EtatChargementIA) {
  etat = e
  for (const f of abonnes) f()
}

export function etatChargementIA(): EtatChargementIA {
  return etat
}

export function ecouterChargementIA(f: () => void): () => void {
  abonnes.add(f)
  return () => abonnes.delete(f)
}

// ---------------------------------------------------------------------------
// Téléchargement du modèle avec progression + cache persistant
// ---------------------------------------------------------------------------
async function ouvrirCache(): Promise<Cache | null> {
  try {
    return 'caches' in window ? await caches.open(CACHE_IA) : null
  } catch {
    return null // navigation privée, stockage bloqué…
  }
}

async function lireAvecProgression(reponse: Response): Promise<Uint8Array> {
  const total = Number(reponse.headers.get('content-length')) || TAILLE_MODELE_ESTIMEE
  if (!reponse.body) return new Uint8Array(await reponse.arrayBuffer())
  const lecteur = reponse.body.getReader()
  const morceaux: Uint8Array[] = []
  let recu = 0
  let derniere = 0
  publier({ etape: 'telechargement', recu, total })
  for (;;) {
    const { done, value } = await lecteur.read()
    if (done) break
    morceaux.push(value)
    recu += value.byteLength
    const maintenant = performance.now()
    if (maintenant - derniere > 150) {
      derniere = maintenant
      publier({ etape: 'telechargement', recu, total })
    }
  }
  const octets = new Uint8Array(recu)
  let pos = 0
  for (const m of morceaux) {
    octets.set(m, pos)
    pos += m.byteLength
  }
  return octets
}

let promesseModele: Promise<Uint8Array> | null = null

/** Octets du modèle : depuis le cache s'il y est, sinon téléchargés (avec progression) puis mis en cache. */
function obtenirModele(): Promise<Uint8Array> {
  if (!promesseModele) {
    promesseModele = (async () => {
      const cache = await ouvrirCache()
      const enCache = await cache?.match(MODELE_HOLISTIC_URL).catch(() => undefined)
      if (enCache) return new Uint8Array(await enCache.arrayBuffer())

      const reponse = await fetch(MODELE_HOLISTIC_URL)
      if (!reponse.ok) throw new Error(`modèle introuvable (HTTP ${reponse.status})`)
      const octets = await lireAvecProgression(reponse)
      if (cache) {
        const entetes = { 'content-type': 'application/octet-stream', 'content-length': String(octets.byteLength) }
        // La mise en cache ne doit jamais bloquer ni faire échouer le chargement.
        cache.put(MODELE_HOLISTIC_URL, new Response(octets.slice(), { headers: entetes })).catch(() => {})
      }
      return octets
    })().catch((e) => {
      promesseModele = null
      throw e
    })
  }
  return promesseModele
}

/** Le modèle est-il déjà sur l'appareil ? (pour afficher « instantané » plutôt qu'un téléchargement) */
export async function modeleDejaTelecharge(): Promise<boolean> {
  const cache = await ouvrirCache()
  return !!(await cache?.match(MODELE_HOLISTIC_URL).catch(() => undefined))
}

/**
 * Télécharge le modèle et le moteur en arrière-plan, sans démarrer la détection.
 * À appeler quand on sait que la caméra va servir bientôt (ex. liste des signes à filmer).
 * Respecte le mode « économie de données » du téléphone.
 */
export function prechargerIA(): void {
  const connexion = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (connexion?.saveData) return
  obtenirModele().catch(() => {})
  // Le WASM est servi avec « immutable » : un simple fetch le place dans le cache HTTP.
  fetch(`${WASM_BASE}/vision_wasm_internal.wasm`).catch(() => {})
  fetch(`${WASM_BASE}/vision_wasm_internal.js`).catch(() => {})
}

// ---------------------------------------------------------------------------
// Détecteur
// ---------------------------------------------------------------------------
let promesse: Promise<HolisticLandmarker> | null = null

/** Charge (une seule fois) le HolisticLandmarker : corps 33 + mains 2×21 + visage 478 points. */
export function chargerHolistic(): Promise<HolisticLandmarker> {
  if (!promesse) {
    promesse = (async () => {
      const [{ FilesetResolver, HolisticLandmarker }, modele] = await Promise.all([
        import('@mediapipe/tasks-vision'),
        obtenirModele(),
      ])
      publier({ etape: 'preparation' })
      const fileset = await FilesetResolver.forVisionTasks(WASM_BASE)
      const creer = (delegate: 'GPU' | 'CPU') =>
        HolisticLandmarker.createFromOptions(fileset, {
          // Une copie à chaque essai : MediaPipe peut transférer le tampon.
          baseOptions: { modelAssetBuffer: modele.slice(), delegate },
          runningMode: 'VIDEO',
          outputFaceBlendshapes: false,
          outputPoseSegmentationMasks: false,
        })
      let detecteur: HolisticLandmarker
      try {
        detecteur = await creer('GPU')
      } catch {
        detecteur = await creer('CPU')
      }
      publier({ etape: 'pret' })
      return detecteur
    })().catch((e) => {
      promesse = null
      publier({ etape: 'erreur' })
      throw e
    })
  }
  return promesse
}
