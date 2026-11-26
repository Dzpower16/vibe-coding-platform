import 'server-only'
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'

/**
 * Client du workflow Roboflow « LSQ — Mains, visage et signes Logic » (serveur uniquement).
 *
 * Définition réelle (Roboflow `workflows_get`) : une entrée `image`, aucun paramètre, une étape qui
 * appelle le workflow `lsq-mains-visage-et-signes` (modèle `lsq-mains-visage-et-signes/3`), une sortie
 * `predictions` (détections). Réponse réelle : une entrée par image, dans l'ordre envoyé :
 *   [{ "predictions": { "image": { "width", "height" }, "predictions": [ …détections ] } }]
 *
 * Optimisations : plusieurs images par requête (lots), cache des résultats (une même image n'est
 * jamais renvoyée, appels identiques simultanés fusionnés), respect de `Retry-After` sur 429.
 *
 * ⚠️ Les images partent sur les serveurs de Roboflow (hors Canada). À n'utiliser que sur des images dont
 * le consentement (ou l'accord écrit) couvre la reconnaissance, jamais sur la caméra des personnes qui
 * utilisent « Signer → voix » (promesse : l'image reste sur le téléphone). Voir CLAUDE.md §8ter.
 */

const API_URL = 'https://serverless.roboflow.com'
const ESPACE = 'smiles-workspace-wudvp'
const WORKFLOW = 'lsq-mains-visage-et-signes-logic'
const DELAI_MS = 30_000 // par requête (un lot de 8 images prend ~5 s côté Roboflow)
const TENTATIVES = 3 // 1 essai + 2 reprises
const TAILLE_LOT = 8 // images par requête
const LOTS_EN_PARALLELE = 2
const CACHE_MAX = 256
const CACHE_DUREE_MS = 15 * 60_000
const ATTENTE_MAX_MS = 10_000 // plafond pour Retry-After

export type ImageEntree = { type: 'url'; value: string } | { type: 'base64'; value: string }

export type CodeErreurRoboflow = 'configuration' | 'entree' | 'reseau' | 'http' | 'reponse'

export class ErreurRoboflow extends Error {
  /** Catégorie de l'échec, pour réagir sans analyser le message. */
  code: CodeErreurRoboflow
  /** Statut HTTP renvoyé par Roboflow, s'il y en a un. */
  statut: number | undefined

  constructor(code: CodeErreurRoboflow, message: string, statut?: number) {
    super(message)
    this.name = 'ErreurRoboflow'
    this.code = code
    this.statut = statut
  }
}

/** Une détection : seulement les champs utilisés (pas de polygone `points`, pas d'identifiants internes). */
export interface Detection {
  classe: string
  confiance: number
  /** Centre et taille de la boîte, en pixels de l'image envoyée. */
  x: number
  y: number
  largeur: number
  hauteur: number
}

export type Sortie =
  | { type: 'detections'; image: { largeur: number | null; hauteur: number | null }; detections: Detection[] }
  | { type: 'image'; fichier: string | null }
  | { type: 'valeur'; valeur: string | number | boolean | null }

/** Une entrée par nom de sortie du workflow (les noms viennent de la réponse, pas du code). */
export type ResultatWorkflow = Record<string, Sortie>

export interface OptionsDetection {
  /** Délai par requête (ms). */
  delaiMs?: number
  /** Si le workflow renvoie des images, elles sont écrites ici (sinon ignorées, jamais gardées). */
  dossierImages?: string
  /** Ne garder que les détections au moins aussi sûres (0–1). Appliqué après le cache. */
  confianceMin?: number
  /** `false` pour forcer un nouvel appel (sinon une image déjà analysée n'est pas renvoyée). */
  cache?: boolean
}

const schemaImage = z.discriminatedUnion('type', [
  z.object({ type: z.literal('url'), value: z.string().url().startsWith('https://', 'URL en https:// obligatoire') }),
  z.object({ type: z.literal('base64'), value: z.string().min(1) }),
])

const schemaDetection = z.object({
  class: z.string(),
  confidence: z.number(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
})

const schemaBlocDetections = z.object({
  image: z.object({ width: z.number().nullable().optional(), height: z.number().nullable().optional() }).optional(),
  predictions: z.array(z.unknown()),
})

const schemaImageSortie = z.object({ type: z.literal('base64'), value: z.string() })

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms))
const gigue = (ms: number) => Math.round(ms * (0.75 + Math.random() * 0.5))

// ---------------------------------------------------------------------------
// Cache (par instance serveur) : résultats lus, jamais les images elles-mêmes
// ---------------------------------------------------------------------------
const cache = new Map<string, { expire: number; resultat: ResultatWorkflow }>()
const enCours = new Map<string, Promise<ResultatWorkflow>>()

const cleDe = (image: ImageEntree) => createHash('sha256').update(image.type).update('\0').update(image.value).digest('hex')

function lireCache(cle: string): ResultatWorkflow | undefined {
  const e = cache.get(cle)
  if (!e) return undefined
  if (e.expire < Date.now()) {
    cache.delete(cle)
    return undefined
  }
  cache.delete(cle) // remis en fin de file : le moins récemment utilisé part en premier
  cache.set(cle, e)
  return e.resultat
}

function ecrireCache(cle: string, resultat: ResultatWorkflow) {
  cache.set(cle, { expire: Date.now() + CACHE_DUREE_MS, resultat })
  while (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value as string)
}

// ---------------------------------------------------------------------------
// Lecture d'une réponse
// ---------------------------------------------------------------------------
/** Lit chaque sortie selon sa forme ; les images base64 vont sur disque (ou sont abandonnées), jamais gardées. */
async function lireSorties(brut: unknown, dossierImages?: string): Promise<ResultatWorkflow> {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) {
    throw new ErreurRoboflow('reponse', 'Réponse inattendue : une entrée par image était attendue.')
  }
  const resultat: ResultatWorkflow = {}
  for (const [nom, valeur] of Object.entries(brut as Record<string, unknown>)) {
    const bloc = schemaBlocDetections.safeParse(valeur)
    if (bloc.success) {
      const detections: Detection[] = []
      for (const d of bloc.data.predictions) {
        const p = schemaDetection.safeParse(d)
        if (p.success) {
          const { class: classe, confidence: confiance, x, y, width: largeur, height: hauteur } = p.data
          detections.push({ classe, confiance, x, y, largeur, hauteur })
        }
      }
      resultat[nom] = {
        type: 'detections',
        image: { largeur: bloc.data.image?.width ?? null, hauteur: bloc.data.image?.height ?? null },
        detections,
      }
      continue
    }
    const image = schemaImageSortie.safeParse(valeur)
    if (image.success) {
      let fichier: string | null = null
      if (dossierImages) {
        await mkdir(dossierImages, { recursive: true })
        fichier = join(dossierImages, `${nom}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`)
        await writeFile(fichier, Buffer.from(image.data.value, 'base64'))
      }
      resultat[nom] = { type: 'image', fichier }
      continue
    }
    if (valeur === null || ['string', 'number', 'boolean'].includes(typeof valeur)) {
      resultat[nom] = { type: 'valeur', valeur: valeur as string | number | boolean | null }
    }
    // Toute autre forme est ignorée : on ne garde que ce qu'on sait lire.
  }
  return resultat
}

function filtrer(resultat: ResultatWorkflow, confianceMin?: number): ResultatWorkflow {
  if (confianceMin === undefined) return resultat
  const copie: ResultatWorkflow = {}
  for (const [nom, s] of Object.entries(resultat)) {
    copie[nom] = s.type === 'detections' ? { ...s, detections: s.detections.filter((d) => d.confiance >= confianceMin) } : s
  }
  return copie
}

function valider(image: ImageEntree): ImageEntree {
  const r = schemaImage.safeParse(image)
  if (!r.success) throw new ErreurRoboflow('entree', `Image invalide : ${r.error.issues[0]?.message}`)
  return r.data
}

/** Durée d'attente demandée par Roboflow (secondes ou date HTTP), plafonnée. */
function retryAfter(entete: string | null): number | null {
  if (!entete) return null
  const s = Number(entete)
  const ms = Number.isFinite(s) ? s * 1000 : Date.parse(entete) - Date.now()
  return Number.isFinite(ms) && ms > 0 ? Math.min(ms, ATTENTE_MAX_MS) : null
}

// ---------------------------------------------------------------------------
// Une requête (un lot d'images) avec reprises
// ---------------------------------------------------------------------------
async function executerLot(images: ImageEntree[], options: OptionsDetection): Promise<ResultatWorkflow[]> {
  const cle = process.env.ROBOFLOW_API_KEY
  if (!cle) throw new ErreurRoboflow('configuration', 'ROBOFLOW_API_KEY manquante (voir .env.example).')

  // Le workflow ne déclare aucun paramètre ; une liste d'images = un résultat par image, dans l'ordre.
  const corps = JSON.stringify({ inputs: { image: images.length === 1 ? images[0] : images } })
  let derniere: ErreurRoboflow | null = null
  let attente = 0

  for (let essai = 0; essai < TENTATIVES; essai++) {
    if (essai > 0) await attendre(attente || gigue(500 * 2 ** (essai - 1))) // ~0,5 s puis ~1 s
    attente = 0
    let reponse: Response
    try {
      reponse = await fetch(`${API_URL}/${ESPACE}/workflows/${WORKFLOW}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` },
        body: corps,
        signal: AbortSignal.timeout(options.delaiMs ?? DELAI_MS),
        cache: 'no-store',
      })
    } catch (e) {
      derniere = new ErreurRoboflow('reseau', `Roboflow injoignable : ${e instanceof Error ? e.message : e}`)
      continue
    }
    if (reponse.status === 429 || reponse.status >= 500) {
      attente = retryAfter(reponse.headers.get('retry-after')) ?? 0
      await reponse.body?.cancel().catch(() => {})
      derniere = new ErreurRoboflow('http', `Roboflow indisponible (HTTP ${reponse.status}).`, reponse.status)
      continue
    }
    if (!reponse.ok) {
      // Pas de nouvelle tentative : la requête elle-même est en cause (clé, image…). Message tronqué.
      const detail = (await reponse.text().catch(() => '')).slice(0, 300)
      throw new ErreurRoboflow('http', `Roboflow a refusé la requête (HTTP ${reponse.status}) : ${detail}`, reponse.status)
    }
    const json: unknown = await reponse.json().catch(() => null)
    const liste = json && typeof json === 'object' && 'outputs' in json ? (json as { outputs: unknown }).outputs : json
    if (!Array.isArray(liste) || liste.length !== images.length) {
      throw new ErreurRoboflow(
        'reponse',
        `Réponse inattendue : ${Array.isArray(liste) ? liste.length : 0} résultat(s) pour ${images.length} image(s).`,
      )
    }
    return Promise.all(liste.map((brut) => lireSorties(brut, options.dossierImages)))
  }
  throw derniere ?? new ErreurRoboflow('reseau', 'Échec après plusieurs tentatives.')
}

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------
/**
 * Analyse plusieurs images : regroupées par lots de 8 (2 lots en parallèle), sans renvoyer celles déjà
 * analysées. Le résultat suit l'ordre des images. Une erreur sur un lot fait échouer l'appel.
 * @throws ErreurRoboflow
 */
export async function detecterMainsVisageEtSignesLot(
  images: ImageEntree[],
  options: OptionsDetection = {},
): Promise<ResultatWorkflow[]> {
  const valides = images.map(valider)
  const cles = valides.map(cleDe)
  const avecCache = options.cache !== false

  // Une promesse par image distincte : cache, appel déjà en cours ailleurs, ou envoi par ce lot.
  const promesses = new Map<string, Promise<ResultatWorkflow>>()
  const aEnvoyer: { cle: string; image: ImageEntree; ok: (r: ResultatWorkflow) => void; ko: (e: unknown) => void }[] = []
  cles.forEach((cle, i) => {
    if (promesses.has(cle)) return // doublon dans la même liste
    const enCache = avecCache ? lireCache(cle) : undefined
    const deja = avecCache ? enCours.get(cle) : undefined
    if (enCache) promesses.set(cle, Promise.resolve(enCache))
    else if (deja) promesses.set(cle, deja)
    else {
      let ok!: (r: ResultatWorkflow) => void
      let ko!: (e: unknown) => void
      const p = new Promise<ResultatWorkflow>((res, rej) => ((ok = res), (ko = rej)))
      p.catch(() => {}) // évite un rejet non géré si personne n'attend encore ; l'erreur remonte par Promise.all
      promesses.set(cle, p)
      enCours.set(cle, p)
      aEnvoyer.push({ cle, image: valides[i], ok, ko })
    }
  })

  const lots: (typeof aEnvoyer)[] = []
  for (let k = 0; k < aEnvoyer.length; k += TAILLE_LOT) lots.push(aEnvoyer.slice(k, k + TAILLE_LOT))

  let suivant = 0
  const travailleur = async () => {
    while (suivant < lots.length) {
      const lot = lots[suivant++]
      try {
        const sortie = await executerLot(lot.map((e) => e.image), options)
        lot.forEach((e, j) => {
          ecrireCache(e.cle, sortie[j])
          e.ok(sortie[j])
        })
      } catch (erreur) {
        // Échec : ce lot et ceux pas encore partis échouent (sinon d'autres appels attendraient pour rien).
        for (const reste of [lot, ...lots.splice(suivant)]) reste.forEach((e) => e.ko(erreur))
        throw erreur
      } finally {
        lot.forEach((e) => enCours.delete(e.cle))
      }
    }
  }
  try {
    await Promise.all(Array.from({ length: Math.min(LOTS_EN_PARALLELE, lots.length) }, travailleur))
  } finally {
    for (const e of aEnvoyer) if (enCours.get(e.cle) === promesses.get(e.cle)) enCours.delete(e.cle)
  }
  const resultats = await Promise.all(cles.map((cle) => promesses.get(cle)!))

  return resultats.map((r) => filtrer(r, options.confianceMin))
}

/**
 * Détecte la région des mains, le visage et les signes connus du modèle sur une image.
 * @param image URL https ou contenu base64 (JPEG de préférence, ≤ 640 px de large : plus rapide).
 * @throws ErreurRoboflow (configuration, entrée invalide, réseau, HTTP, réponse illisible)
 */
export async function detecterMainsVisageEtSignes(
  image: ImageEntree,
  options: OptionsDetection = {},
): Promise<ResultatWorkflow> {
  const [resultat] = await detecterMainsVisageEtSignesLot([image], options)
  return resultat
}
