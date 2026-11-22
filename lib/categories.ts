// GÉNÉRÉ par scripts/generer-seed.mjs — ne pas éditer à la main.
export const CATEGORIES = [
  {
    "id": "alphabet",
    "nom": "Alphabet (dactylologie)"
  },
  {
    "id": "chiffres",
    "nom": "Chiffres"
  },
  {
    "id": "salutations",
    "nom": "Salutations et politesse"
  },
  {
    "id": "questions",
    "nom": "Questions"
  },
  {
    "id": "personnes",
    "nom": "Pronoms et personnes"
  },
  {
    "id": "famille",
    "nom": "Famille"
  },
  {
    "id": "communication",
    "nom": "Surdité et communication"
  },
  {
    "id": "temps",
    "nom": "Temps et calendrier"
  },
  {
    "id": "verbes",
    "nom": "Verbes courants"
  },
  {
    "id": "emotions",
    "nom": "Émotions et états"
  },
  {
    "id": "qualites",
    "nom": "Qualités et descriptions"
  },
  {
    "id": "liens",
    "nom": "Quantités, liens et lieux relatifs"
  },
  {
    "id": "nourriture",
    "nom": "Nourriture et repas"
  },
  {
    "id": "maison",
    "nom": "Maison et objets"
  },
  {
    "id": "lieux",
    "nom": "Lieux"
  },
  {
    "id": "transport",
    "nom": "Transport"
  },
  {
    "id": "sante",
    "nom": "Santé et corps"
  },
  {
    "id": "argent",
    "nom": "Argent et achats"
  },
  {
    "id": "meteo",
    "nom": "Météo et nature"
  },
  {
    "id": "animaux",
    "nom": "Animaux"
  },
  {
    "id": "couleurs",
    "nom": "Couleurs"
  },
  {
    "id": "ecole-travail",
    "nom": "École et travail"
  },
  {
    "id": "loisirs",
    "nom": "Loisirs et vie sociale"
  }
] as const

export function nomCategorie(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.nom ?? id
}
