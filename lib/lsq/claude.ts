import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { blocLexique, REGLES, schemaReponseGloses, type EntreeLexique, type ReponseGloses } from '@/lib/lsq/prompt'

/**
 * Appel à Claude pour la remise en ordre (CLAUDE.md §4, §8). Serveur uniquement.
 * - effort « low » pour la latence ; pas de préremplissage, pas de budget de réflexion.
 * - sortie structurée (JSON validé par zod), revalidée ensuite contre le lexique (lib/lsq/gloses.ts).
 * - repli serveur en cas de refus (`fallbacks: "default"`) : une phrase banale ne doit pas rester sans réponse.
 */

const MODELE_DEFAUT = 'claude-opus-5-5'

let client: Anthropic | null = null

export class ErreurRemiseEnOrdre extends Error {
  constructor(
    message: string,
    readonly code: 'configuration' | 'refus' | 'reponse' | 'api',
  ) {
    super(message)
    this.name = 'ErreurRemiseEnOrdre'
  }
}

export async function remettreEnOrdre(texte: string, lexique: readonly EntreeLexique[]): Promise<ReponseGloses> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ErreurRemiseEnOrdre('ANTHROPIC_API_KEY manquante dans les variables Vercel.', 'configuration')
  }
  client ??= new Anthropic({ timeout: 30_000, maxRetries: 1 })

  let reponse
  try {
    reponse = await client.beta.messages.parse({
      model: process.env.CLAUDE_MODEL || MODELE_DEFAUT,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: betaZodOutputFormat(schemaReponseGloses) },
      system: [
        // Lexique en tête : préfixe stable, réutilisé par le cache de prompt d'une phrase à l'autre (§8.4).
        { type: 'text', text: blocLexique(lexique) },
        { type: 'text', text: REGLES, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content: `<phrase>${texte}</phrase>` }],
    })
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      throw new ErreurRemiseEnOrdre('Clé ANTHROPIC_API_KEY refusée.', 'configuration')
    }
    if (e instanceof Anthropic.RateLimitError) {
      throw new ErreurRemiseEnOrdre('Trop de demandes à la fois. Réessayez dans un instant.', 'api')
    }
    if (e instanceof Anthropic.APIError) {
      throw new ErreurRemiseEnOrdre(`Service de remise en ordre indisponible (HTTP ${e.status ?? '?'}).`, 'api')
    }
    throw new ErreurRemiseEnOrdre('Service de remise en ordre injoignable.', 'api')
  }

  if (reponse.stop_reason === 'refusal') {
    throw new ErreurRemiseEnOrdre('Cette phrase n’a pas pu être traitée.', 'refus')
  }
  if (!reponse.parsed_output) {
    throw new ErreurRemiseEnOrdre('Réponse illisible du service de remise en ordre.', 'reponse')
  }
  return reponse.parsed_output
}
