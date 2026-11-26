export type TypeSigne = 'signe' | 'lettre' | 'chiffre'
export type MainDominante = 'droite' | 'gauche'
export type Identite = 'sourd' | 'malentendant' | 'coda' | 'interprete' | 'autre'
export type StatutEnregistrement = 'en_attente' | 'valide' | 'rejete'

export interface Signe {
  id: number
  glose: string
  mots_fr: string[]
  categorie: string
  type: TypeSigne
  priorite: 1 | 2 | 3
  notes: string | null
  /** Définition courte, texte original Entre-Mains. */
  definition: string | null
  /** Lien vers la page du mot dans un dictionnaire LSQ externe (sens seulement). */
  reference_url: string | null
}

export interface Signeur {
  id: string
  nom_affiche: string
  identite: Identite
  region: string | null
  main_dominante: MainDominante
  role: 'contributeur' | 'validateur' | 'admin'
}

export interface Consentement {
  id: string
  version: string
  nom_signature: string
  portee_application: boolean
  portee_reconnaissance: boolean
  portee_avatar: boolean
  portee_credit_public: boolean
  portee_promotion: boolean
  signe_le: string
  revoque_le: string | null
}

/** Résumé de mes prises par signe, pour la bibliothèque. */
export interface MesPrises {
  [signeId: number]: { total: number; valides: number; refusees?: number; motifRefus?: string | null }
}

export const IDENTITES: { valeur: Identite; libelle: string }[] = [
  { valeur: 'sourd', libelle: 'Sourd·e' },
  { valeur: 'malentendant', libelle: 'Malentendant·e' },
  { valeur: 'coda', libelle: 'CODA (enfant entendant de parents sourds)' },
  { valeur: 'interprete', libelle: 'Interprète LSQ' },
  { valeur: 'autre', libelle: 'Autre' },
]

/** Accord écrit pour une vidéo filmée hors de /tournage (CLAUDE.md §6ter). */
export interface SourceExterne {
  id: string
  titulaire: string
  contact: string | null
  personnes_filmees: string
  url_origine: string | null
  description: string | null
  portee_application: boolean
  portee_reconnaissance: boolean
  portee_commercial: boolean
  credit_public: boolean
  credit_nom: string | null
  mineurs: boolean
  accord_parental: boolean
  preuve_path: string | null
  preuve_note: string | null
  date_accord: string
  revoque_le: string | null
  created_at: string
}

/** Une prise à valider, avec ce qu'il faut pour juger (CLAUDE.md §1.1, étape 1c). */
export interface PriseAValider {
  id: string
  video_url: string | null
  mime: string
  duree_ms: number
  debut_ms: number | null
  fin_ms: number | null
  main_dominante: MainDominante | null
  variante: string | null
  commentaire: string | null
  origine: 'tournage' | 'externe'
  signeur_externe: string | null
  created_at: string
  statut: StatutEnregistrement
  motif_rejet: string | null
  valide_le: string | null
  signe: Pick<Signe, 'id' | 'glose' | 'mots_fr' | 'definition' | 'categorie' | 'reference_url' | 'notes'>
  signeur: { nom_affiche: string; identite: Identite; region: string | null } | null
  /** Nombre de prises déjà validées pour ce signe. */
  deja_valides: number
}
