/**
 * Audio du micro → PCM 16 bits mono 16 kHz (format attendu par Gladia, CLAUDE.md §4). Code pur.
 * Les navigateurs captent en général à 44,1 ou 48 kHz : on réduit par moyenne de chaque fenêtre
 * (filtre passe-bas simple, suffisant pour la parole).
 */
export const FREQUENCE_CIBLE = 16_000

export function versPcm16(entree: Float32Array, frequenceSource: number, frequenceCible = FREQUENCE_CIBLE): Int16Array {
  const rapport = frequenceSource / frequenceCible
  const longueur = Math.floor(entree.length / rapport)
  const sortie = new Int16Array(longueur)
  for (let i = 0; i < longueur; i++) {
    const debut = Math.floor(i * rapport)
    const fin = Math.max(debut + 1, Math.min(entree.length, Math.floor((i + 1) * rapport)))
    let somme = 0
    for (let j = debut; j < fin; j++) somme += entree[j]
    const v = Math.max(-1, Math.min(1, somme / (fin - debut)))
    sortie[i] = v < 0 ? v * 0x8000 : v * 0x7fff
  }
  return sortie
}

/** Code du processeur AudioWorklet (chargé depuis une URL blob : pas de fichier externe). */
export const CODE_CAPTEUR = `
class CapteurPcm extends AudioWorkletProcessor {
  process(entrees) {
    const canal = entrees[0] && entrees[0][0]
    if (canal) this.port.postMessage(canal.slice(0))
    return true
  }
}
registerProcessor('capteur-pcm', CapteurPcm)
`

/**
 * Message reçu de Gladia (API live v2) → texte transcrit, ou null s'il ne s'agit pas d'une transcription.
 * Lecture défensive : on ne garde que `type`, `data.is_final` et `data.utterance.text`.
 */
export function lireTranscription(brut: unknown): { texte: string; final: boolean } | null {
  if (!brut || typeof brut !== 'object') return null
  const m = brut as { type?: unknown; data?: { is_final?: unknown; utterance?: { text?: unknown } } }
  if (m.type !== 'transcript') return null
  const texte = m.data?.utterance?.text
  if (typeof texte !== 'string' || !texte.trim()) return null
  return { texte: texte.trim(), final: m.data?.is_final === true }
}
