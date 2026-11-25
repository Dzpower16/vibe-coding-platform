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
  signe_le: string
  revoque_le: string | null
}

/** Résumé de mes prises par signe, pour la bibliothèque. */
export interface MesPrises {
  [signeId: number]: { total: number; valides: number }
}

export const IDENTITES: { valeur: Identite; libelle: string }[] = [
  { valeur: 'sourd', libelle: 'Sourd·e' },
  { valeur: 'malentendant', libelle: 'Malentendant·e' },
  { valeur: 'coda', libelle: 'CODA (enfant entendant de parents sourds)' },
  { valeur: 'interprete', libelle: 'Interprète LSQ' },
  { valeur: 'autre', libelle: 'Autre' },
]
