import { z } from 'zod'

/**
 * Remise en ordre français → gloses LSQ (CLAUDE.md §8). Le prompt système est en deux blocs :
 * le lexique d'abord (stable, mis en cache), puis les règles. La phrase arrive dans le message utilisateur.
 *
 * Les règles d'ordre sont des approximations à faire valider et corriger par des linguistes et
 * locuteur·rice·s sourd·e·s (§8.2) : les modifier ici, avec leurs retours.
 */

export interface EntreeLexique {
  glose: string
  mots_fr: string[]
}

export const schemaReponseGloses = z.object({
  gloses: z.array(z.string()).describe('Gloses dans l’ordre LSQ. Uniquement des gloses du lexique ou DACTYLO:MOT.'),
  epeles: z.array(z.string()).describe('Mots épelés (sans le préfixe DACTYLO:), en majuscules sans accents.'),
  remarques: z.string().optional().describe('Facultatif, une phrase : ambiguïté ou mot omis.'),
})

export type ReponseGloses = z.infer<typeof schemaReponseGloses>

/** Bloc lexique : une ligne par signe, `GLOSE : formes françaises`. Ordre stable (glose) pour le cache. */
export function blocLexique(lexique: readonly EntreeLexique[]): string {
  const lignes = [...lexique]
    .sort((a, b) => a.glose.localeCompare(b.glose))
    .map((e) => `${e.glose} : ${e.mots_fr.join(', ')}`)
  return [
    '<lexique>',
    'Seuls signes filmés et validés par des personnes sourdes. Tu ne peux utiliser AUCUNE autre glose.',
    ...lignes,
    '</lexique>',
  ].join('\n')
}

export const REGLES = `Tu aides une application de communication français → langue des signes québécoise (LSQ).
On te donne une phrase française (transcription de la parole, parfois imparfaite). Tu la transformes en une suite de gloses LSQ que l'application lira en enchaînant des vidéos filmées par des personnes sourdes.

Règles, dans cet ordre de priorité :
1. N'utilise QUE des gloses du <lexique>, écrites exactement comme dans le lexique. Choisis la glose dont les formes françaises correspondent au sens du mot dans la phrase.
2. Un mot porteur de sens sans glose dans le lexique (nom propre, mot absent) devient DACTYLO:MOT, en majuscules sans accents (ex. DACTYLO:MONTREAL). Ajoute ce MOT à "epeles".
3. Omets les mots grammaticaux sans équivalent signé : articles (le, la, un, des…), le verbe « être » comme copule, certaines prépositions. N'épelle jamais un article.
4. Ordre LSQ habituel : repère de temps d'abord (HIER, DEMAIN…), puis thème ou lieu, puis commentaire ou action. Les mots interrogatifs (QUOI, OÙ, QUI, QUAND, COMMENT, POURQUOI, COMBIEN) vont en fin d'énoncé. La négation suit le verbe.
5. Nombres : CHIFFRE-N si cette glose est dans le lexique ; sinon écris CHIFFRE-N quand même, l'application le composera chiffre par chiffre.
6. Ne devine pas : si un passage est inintelligible, omets-le et dis-le en une phrase dans "remarques". Ne crée jamais de glose, même plausible.
7. Ce sont des approximations de la grammaire LSQ (pas d'espace, pas d'expressions du visage) : reste simple et fidèle au sens.

Réponds uniquement avec l'objet JSON demandé.`
