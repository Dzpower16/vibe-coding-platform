import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServeur } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Ouvre une session de transcription Gladia (API live v2, CLAUDE.md §4).
 * La clé reste sur le serveur ; le navigateur ne reçoit que l'URL WebSocket temporaire de la session
 * et y envoie l'audio PCM 16 kHz mono 16 bits.
 */
const GLADIA_LIVE = 'https://api.gladia.io/v2/live'

const schemaSession = z.object({ id: z.string(), url: z.string().startsWith('wss://') })

export async function POST() {
  const supabase = await supabaseServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erreur: 'Connexion requise' }, { status: 401 })

  const cle = process.env.GLADIA_API_KEY
  if (!cle) return NextResponse.json({ erreur: 'GLADIA_API_KEY manquante dans les variables Vercel.' }, { status: 500 })

  let reponse: Response
  try {
    reponse = await fetch(GLADIA_LIVE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Gladia-Key': cle },
      body: JSON.stringify({
        encoding: 'wav/pcm',
        sample_rate: 16000,
        bit_depth: 16,
        channels: 1,
        language_config: { languages: ['fr'], code_switching: false },
        // Fin de phrase après ~0,8 s de silence ; une phrase finale = un appel de remise en ordre (§8.4).
        endpointing: 0.8,
        maximum_duration_without_endpointing: 20,
        messages_config: { receive_partial_transcripts: true, receive_final_transcripts: true },
      }),
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ erreur: 'Service de transcription injoignable.' }, { status: 502 })
  }

  if (!reponse.ok) {
    const statut = reponse.status === 401 || reponse.status === 403 ? 'Clé GLADIA_API_KEY refusée.' : `Transcription indisponible (HTTP ${reponse.status}).`
    return NextResponse.json({ erreur: statut }, { status: 502 })
  }
  const session = schemaSession.safeParse(await reponse.json().catch(() => null))
  if (!session.success) return NextResponse.json({ erreur: 'Réponse inattendue du service de transcription.' }, { status: 502 })

  return NextResponse.json({ url: session.data.url }, { headers: { 'Cache-Control': 'no-store' } })
}
