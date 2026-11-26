import 'server-only'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'

/**
 * Client du workflow Roboflow « LSQ — Mains, visage et signes Logic » (serveur uniquement).
 *
 * Définition réelle (Roboflow `workflows_get`) : une entrée `image`, aucun paramètre, une étape qui
 * appelle le workflow `lsq-mains-visage-et-signes` (modèle `lsq-mains-visage-et-signes/3`), une sortie
 * `predictions` (détections). Réponse réelle (`workflows_run`) :
 *   [{ "predictions": { "image": { "width", "height" }, "predictions": [ …détections ] } }]
 *
 * ⚠️ Les images partent sur les serveurs de Roboflow (hors Canada). À n'utiliser que sur des images dont
 * le consentement (ou l'accord écrit) couvre la reconnaissance, jamais sur la caméra des personnes qui
 * utilisent « Signer → voix » (promesse : l'image reste sur le téléphone). Voir CLAUDE.md §8ter.
 */

const API_URL = 'https://serverless.roboflow.com'
const ESPACE = 'smiles-workspace-wudvp'
const WORKFLOW = 'lsq-mains-visage-et-signes-logic'
const DELAI_MS = 20_000
const TENTATIVES = 3 // 1 essai + 2 reprises

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
        fichier = join(dossierImages, `${nom}-${Date.now()}.jpg`)
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

/**
 * Détecte la région des mains, le visage et les signes connus du modèle sur une image.
 *
 * @param image URL https ou contenu base64 (JPEG/PNG).
 * @param options.dossierImages Si le workflow renvoie des images, elles sont écrites ici (sinon ignorées).
 * @throws ErreurRoboflow (configuration, entrée invalide, réseau, HTTP, réponse illisible)
 */
export async function detecterMainsVisageEtSignes(
  image: ImageEntree,
  options: { delaiMs?: number; dossierImages?: string } = {},
): Promise<ResultatWorkflow> {
  const cle = process.env.ROBOFLOW_API_KEY
  if (!cle) throw new ErreurRoboflow('configuration', 'ROBOFLOW_API_KEY manquante (voir .env.example).')
  const entree = schemaImage.safeParse(image)
  if (!entree.success) throw new ErreurRoboflow('entree', `Image invalide : ${entree.error.issues[0]?.message}`)

  const corps = JSON.stringify({ inputs: { image: entree.data } }) // le workflow ne déclare aucun paramètre
  let derniere: ErreurRoboflow | null = null

  for (let essai = 0; essai < TENTATIVES; essai++) {
    if (essai > 0) await attendre(500 * 2 ** (essai - 1)) // 0,5 s puis 1 s
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
    if (!Array.isArray(liste) || liste.length === 0) {
      throw new ErreurRoboflow('reponse', 'Réponse inattendue : liste de résultats vide ou absente.')
    }
    return lireSorties(liste[0], options.dossierImages)
  }
  throw derniere ?? new ErreurRoboflow('reseau', 'Échec après plusieurs tentatives.')
}
