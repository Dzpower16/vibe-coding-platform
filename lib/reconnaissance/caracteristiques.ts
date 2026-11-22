/**
 * Reconnaissance de signes isolés (LSQ → français), prototype.
 * Code PUR (aucune API navigateur ni serveur) : utilisé à l'identique par la route
 * /api/reconnaissance/modeles (exemples) et par la page /parler (signe en direct).
 *
 * Méthode : chaque signe devient une suite de LONGUEUR vecteurs (position des poignets par rapport
 * aux épaules + forme de chaque main), puis on compare par DTW (alignement temporel souple)
 * aux exemples enregistrés. Voir CLAUDE.md §8bis.
 */
import type { FramePositions } from '../mediapipe/positions'

/** Nombre de pas de temps après rééchantillonnage. */
export const LONGUEUR = 24
/** Dimensions par main : présence (1) + poignet x,y (2) + 20 points de la main x,y (40). */
const DIM_MAIN = 43
export const DIM = DIM_MAIN * 2

/** Une main est « active » si le poignet est au-dessus de ce niveau (en largeurs d'épaules sous les épaules). */
const NIVEAU_ACTIF = 1.6
const PENALITE_PRESENCE = 4
const POIDS_POSITION = 2
const POIDS_FORME = 1

export interface Repere {
  cx: number
  cy: number
  s: number
}

const REPERE_DEFAUT: Repere = { cx: 0.5, cy: 0.4, s: 0.25 }

/** Repère du corps : milieu des épaules et largeur d'épaules (indices 11 et 12 de la pose MediaPipe). */
export function repereCorps(f: FramePositions): Repere | null {
  const c = f.corps
  const g = c?.[11]
  const d = c?.[12]
  if (!g || !d || (g[3] ?? 0) < 0.5 || (d[3] ?? 0) < 0.5) return null
  const s = Math.hypot(g[0] - d[0], g[1] - d[1])
  if (s < 0.02) return null
  return { cx: (g[0] + d[0]) / 2, cy: (g[1] + d[1]) / 2, s }
}

export function mainActive(main: number[][] | null, rep: Repere): boolean {
  if (!main || main.length < 21) return false
  return (main[0][1] - rep.cy) / rep.s < NIVEAU_ACTIF
}

export function frameActive(f: FramePositions, rep: Repere): boolean {
  return mainActive(f.main_g, rep) || mainActive(f.main_d, rep)
}

/** Repères pour chaque frame (le dernier repère connu est reporté quand le corps n'est pas vu). */
export function reperes(frames: FramePositions[]): Repere[] {
  let dernier: Repere | null = null
  const brut = frames.map((f) => {
    const r = repereCorps(f)
    if (r) dernier = r
    return dernier
  })
  const premier = brut.find((r) => r) ?? REPERE_DEFAUT
  return brut.map((r) => r ?? premier)
}

function vecteur(f: FramePositions, rep: Repere, miroir: boolean): number[] {
  const v: number[] = []
  const sx = miroir ? -1 : 1
  const mains = miroir ? [f.main_d, f.main_g] : [f.main_g, f.main_d]
  for (const main of mains) {
    if (!main || main.length < 21) {
      for (let i = 0; i < DIM_MAIN; i++) v.push(0)
      continue
    }
    const w = main[0]
    v.push(1, (sx * (w[0] - rep.cx)) / rep.s, (w[1] - rep.cy) / rep.s)
    const taille = Math.hypot(main[9][0] - w[0], main[9][1] - w[1]) || 1e-3
    for (let i = 1; i < 21; i++) {
      v.push((sx * (main[i][0] - w[0])) / taille, (main[i][1] - w[1]) / taille)
    }
  }
  return v
}

/**
 * Transforme une suite de frames en empreinte : on garde du premier au dernier instant où une main
 * est active, puis on rééchantillonne à LONGUEUR pas. null si aucune main active.
 */
export function empreinte(frames: FramePositions[], miroir = false): number[][] | null {
  if (frames.length === 0) return null
  const reps = reperes(frames)
  const actifs = frames.map((f, i) => frameActive(f, reps[i]))
  const debut = actifs.indexOf(true)
  const fin = actifs.lastIndexOf(true)
  if (debut < 0) return null

  const seg = frames.slice(debut, fin + 1)
  const segReps = reps.slice(debut, fin + 1)
  const vecs = seg.map((f, i) => vecteur(f, segReps[i], miroir))
  const t0 = seg[0].t
  const t1 = seg[seg.length - 1].t
  const sortie: number[][] = []
  let j = 0
  for (let k = 0; k < LONGUEUR; k++) {
    const t = t1 > t0 ? t0 + ((t1 - t0) * k) / (LONGUEUR - 1) : t0
    while (j < seg.length - 1 && Math.abs(seg[j + 1].t - t) <= Math.abs(seg[j].t - t)) j++
    sortie.push(vecs[j])
  }
  return sortie
}

function distanceFrame(a: number[], b: number[]): number {
  let d = 0
  for (let h = 0; h < 2; h++) {
    const o = h * DIM_MAIN
    if (a[o] !== b[o]) {
      d += PENALITE_PRESENCE
      continue
    }
    if (a[o] === 0) continue
    const dx = a[o + 1] - b[o + 1]
    const dy = a[o + 2] - b[o + 2]
    d += POIDS_POSITION * (dx * dx + dy * dy)
    let forme = 0
    for (let i = o + 3; i < o + DIM_MAIN; i++) {
      const e = a[i] - b[i]
      forme += e * e
    }
    d += (POIDS_FORME * forme) / 20
  }
  return Math.sqrt(d)
}

/** Distance DTW normalisée entre deux empreintes (fenêtre de Sakoe-Chiba). */
export function distanceDTW(a: number[][], b: number[][], fenetre = 6): number {
  const n = a.length
  const m = b.length
  const inf = Number.POSITIVE_INFINITY
  let prec = new Array<number>(m + 1).fill(inf)
  let cour = new Array<number>(m + 1).fill(inf)
  prec[0] = 0
  for (let i = 1; i <= n; i++) {
    cour.fill(inf)
    const jMin = Math.max(1, i - fenetre)
    const jMax = Math.min(m, i + fenetre)
    for (let j = jMin; j <= jMax; j++) {
      const c = distanceFrame(a[i - 1], b[j - 1])
      cour[j] = c + Math.min(prec[j], cour[j - 1], prec[j - 1])
    }
    ;[prec, cour] = [cour, prec]
  }
  return prec[m] / (n + m)
}

export interface ModeleSigne {
  glose: string
  /** mot français prononcé (premier mot de signes.mots_fr) */
  mot: string
  sequence: number[][]
}

export interface Candidat {
  glose: string
  mot: string
  distance: number
}

/**
 * Compare une empreinte (dans les deux orientations, pour les gauchers comme les droitiers)
 * à tous les exemples ; renvoie la meilleure distance par glose, triée.
 */
export function classer(normal: number[][], miroir: number[][], modeles: ModeleSigne[]): Candidat[] {
  const meilleurs = new Map<string, Candidat>()
  for (const m of modeles) {
    const d = Math.min(distanceDTW(normal, m.sequence), distanceDTW(miroir, m.sequence))
    const actuel = meilleurs.get(m.glose)
    if (!actuel || d < actuel.distance) meilleurs.set(m.glose, { glose: m.glose, mot: m.mot, distance: d })
  }
  return [...meilleurs.values()].sort((x, y) => x.distance - y.distance)
}

/** Règle de décision : assez proche ET nettement meilleur que le 2e signe. Sinon on ne dit rien. */
export function decider(candidats: Candidat[], seuil: number, marge = 0.8): Candidat | null {
  const [premier, second] = candidats
  if (!premier || premier.distance > seuil) return null
  if (second && premier.distance / second.distance > marge) return null
  return premier
}

/** Arrondit une empreinte pour l'envoyer au navigateur. */
export function arrondir(seq: number[][]): number[][] {
  return seq.map((v) => v.map((x) => Math.round(x * 1000) / 1000))
}
