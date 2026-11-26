/**
 * Gloses LSQ → éléments à lire (CLAUDE.md §7, §8.3). Code pur, partagé serveur / navigateur.
 *
 * On ne fait jamais confiance à la sortie du modèle : chaque glose est revalidée contre le lexique
 * (signes filmés ET validés). Une glose inconnue est épelée ; un nombre sans signe dédié est
 * composé chiffre par chiffre. On n'invente jamais un signe (§1.3).
 */

export type TypeElement = 'signe' | 'lettre' | 'chiffre'

export interface ElementLecture {
  /** Glose du signe à montrer (`MAISON`, `LETTRE-M`, `CHIFFRE-3`). */
  glose: string
  type: TypeElement
  /** Mot épelé auquel appartient cette lettre ou ce chiffre (transparence §1.6). */
  epele?: string
  /** Aucune vidéo validée pour cette lettre/ce chiffre : on montre le caractère en grand. */
  sansVideo?: boolean
}

export interface PlanLecture {
  /** Gloses retenues après revalidation (une entrée par signe ou par mot épelé `DACTYLO:…`). */
  gloses: string[]
  elements: ElementLecture[]
  /** Mots épelés (affichés comme tels). */
  epeles: string[]
  /** Gloses proposées par le modèle mais absentes du lexique (remplacées par l'épellation). */
  corrigees: string[]
}

/** Majuscules ASCII sans accents (épellation, comparaison) : « Montréal » → « MONTREAL ». */
export function sansAccents(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/gi, 'OE')
    .replace(/æ/gi, 'AE')
    .toUpperCase()
}

/** Normalise une glose : majuscules ASCII, chiffres et tirets seulement. */
export function normaliserGlose(glose: string): string {
  return sansAccents(glose.trim())
    .replace(/[\s_]+/g, '-')
    .replace(/[^A-Z0-9:-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const PREFIXE_DACTYLO = 'DACTYLO:'

/** Lettres et chiffres d'un mot à épeler (le reste — tirets, apostrophes — est ignoré). */
function caracteresAEpeler(mot: string): string[] {
  return [...sansAccents(mot)].filter((c) => /[A-Z0-9]/.test(c))
}

function epeler(mot: string, lexique: ReadonlySet<string>): ElementLecture[] {
  const affiche = sansAccents(mot).replace(/[^A-Z0-9-]/g, '')
  return caracteresAEpeler(mot).map((c) => {
    const estChiffre = /\d/.test(c)
    const glose = estChiffre ? `CHIFFRE-${c}` : `LETTRE-${c}`
    return {
      glose,
      type: estChiffre ? 'chiffre' : 'lettre',
      epele: affiche,
      ...(lexique.has(glose) ? {} : { sansVideo: true }),
    } satisfies ElementLecture
  })
}

/**
 * Transforme la sortie du modèle en suite d'éléments lisibles, en ne gardant que des signes du lexique.
 * @param proposees gloses brutes du modèle (`MAISON`, `DACTYLO:MONTREAL`, `CHIFFRE-25`…)
 * @param lexique gloses ayant au moins une vidéo validée et un consentement actif
 */
export function planifierLecture(proposees: readonly string[], lexique: ReadonlySet<string>): PlanLecture {
  const plan: PlanLecture = { gloses: [], elements: [], epeles: [], corrigees: [] }

  const ajouterEpellation = (mot: string) => {
    const elements = epeler(mot, lexique)
    if (!elements.length) return
    const affiche = elements[0].epele!
    plan.gloses.push(`${PREFIXE_DACTYLO}${affiche}`)
    plan.epeles.push(affiche)
    plan.elements.push(...elements)
  }

  for (const brute of proposees) {
    if (typeof brute !== 'string') continue
    const haut = brute.trim().toUpperCase()

    if (haut.startsWith(PREFIXE_DACTYLO)) {
      ajouterEpellation(brute.trim().slice(PREFIXE_DACTYLO.length))
      continue
    }

    const glose = normaliserGlose(brute)
    if (!glose) continue

    if (lexique.has(glose)) {
      const type: TypeElement = glose.startsWith('LETTRE-') ? 'lettre' : glose.startsWith('CHIFFRE-') ? 'chiffre' : 'signe'
      plan.gloses.push(glose)
      plan.elements.push({ glose, type })
      continue
    }

    // Nombre sans signe dédié filmé : chiffre par chiffre (§7).
    const nombre = /^(?:CHIFFRE-)?(\d+)$/.exec(glose)
    if (nombre) {
      for (const chiffre of nombre[1]) {
        const g = `CHIFFRE-${chiffre}`
        plan.gloses.push(g)
        plan.elements.push({ glose: g, type: 'chiffre', ...(lexique.has(g) ? {} : { sansVideo: true }) })
      }
      if (nombre[1].length > 1 || !lexique.has(`CHIFFRE-${nombre[1]}`)) plan.corrigees.push(glose)
      continue
    }

    // Glose inconnue : jamais montrée comme un signe ; on l'épelle (§8.3).
    plan.corrigees.push(glose)
    ajouterEpellation(glose.replace(/-/g, ' '))
  }

  return plan
}

/**
 * Sans signe validé, ou sans modèle de langue disponible : on épelle chaque mot dans l'ordre français.
 * Les mots grammaticaux très courants sont omis (comme le ferait la remise en ordre, §8.1).
 */
const MOTS_GRAMMATICAUX = new Set([
  'LE', 'LA', 'LES', 'L', 'UN', 'UNE', 'DES', 'DU', 'DE', 'D', 'AU', 'AUX', 'ET', 'EST', 'SONT', 'A',
])

export function epelerTout(texte: string): string[] {
  return texte
    .split(/[\s,.;:!?«»"()\-–—’']+/)
    .map((m) => m.trim())
    .filter((m) => m && !MOTS_GRAMMATICAUX.has(sansAccents(m)))
    .map((m) => (/^\d+$/.test(m) ? `CHIFFRE-${m}` : `${PREFIXE_DACTYLO}${m}`))
}

/** Réponse de `/api/direct/gloses`, lue par la page du direct. */
export interface ElementAvecVideo extends ElementLecture {
  video: { url: string; debut_ms: number | null; fin_ms: number | null } | null
}

export interface ResultatDirect {
  texte: string
  gloses: string[]
  epeles: string[]
  corrigees: string[]
  remarques: string | null
  elements: ElementAvecVideo[]
  /** `claude` : remise en ordre LSQ ; `epellation` : aucun signe validé ou service indisponible, tout est épelé. */
  mode: 'claude' | 'epellation'
}
