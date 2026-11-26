import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServeur } from '@/lib/supabase/server'
import { chargerLexique, videosPour } from '@/lib/lsq/lexique'
import { ErreurRemiseEnOrdre, remettreEnOrdre } from '@/lib/lsq/claude'
import { epelerTout, planifierLecture, type ResultatDirect } from '@/lib/lsq/gloses'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schemaCorps = z.object({ texte: z.string().trim().min(1).max(500) })

/**
 * Une phrase française → gloses LSQ → vidéos à enchaîner (CLAUDE.md §8).
 * Une phrase finale = un appel. Sans signe validé, ou si la remise en ordre échoue, on épelle les mots
 * (jamais de signe deviné) et on le dit dans `remarques`.
 */
export async function POST(request: Request) {
  const supabase = await supabaseServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erreur: 'Connexion requise' }, { status: 401 })

  const corps = schemaCorps.safeParse(await request.json().catch(() => null))
  if (!corps.success) return NextResponse.json({ erreur: 'Phrase vide ou trop longue (500 caractères max).' }, { status: 400 })
  const { texte } = corps.data

  let lexique
  try {
    lexique = await chargerLexique()
  } catch (e) {
    const manqueCle = e instanceof Error && e.message.includes('SUPABASE_SECRET_KEY')
    return NextResponse.json(
      { erreur: manqueCle ? 'SUPABASE_SECRET_KEY manquante dans les variables Vercel.' : 'Lexique indisponible.' },
      { status: 500 },
    )
  }
  const connues = new Set(lexique.map((s) => s.glose))
  const signes = lexique.filter((s) => s.type === 'signe')

  let proposees: string[]
  let remarques: string | null = null
  let mode: ResultatDirect['mode'] = 'claude'

  if (!signes.length) {
    // Rien à remettre en ordre : seulement l'alphabet et les chiffres. Pas d'appel au modèle.
    proposees = epelerTout(texte)
    mode = 'epellation'
    remarques = 'Aucun signe validé pour l’instant : les mots sont épelés.'
  } else {
    try {
      const reponse = await remettreEnOrdre(texte, lexique)
      proposees = reponse.gloses
      remarques = reponse.remarques?.trim() || null
    } catch (e) {
      proposees = epelerTout(texte)
      mode = 'epellation'
      remarques =
        e instanceof ErreurRemiseEnOrdre && e.code === 'configuration'
          ? `Remise en ordre indisponible (${e.message}) : les mots sont épelés.`
          : 'Remise en ordre indisponible pour cette phrase : les mots sont épelés.'
    }
  }

  // Revalidation systématique contre le lexique (§8.3).
  const plan = planifierLecture(proposees, connues)

  let videos
  try {
    videos = await videosPour(plan.elements.filter((e) => !e.sansVideo).map((e) => e.glose))
  } catch {
    return NextResponse.json({ erreur: 'Vidéos indisponibles.' }, { status: 500 })
  }

  const resultat: ResultatDirect = {
    texte,
    gloses: plan.gloses,
    epeles: plan.epeles,
    corrigees: plan.corrigees,
    remarques,
    mode,
    elements: plan.elements.map((e) => ({ ...e, video: videos.get(e.glose) ?? null })),
  }
  return NextResponse.json(resultat, { headers: { 'Cache-Control': 'no-store' } })
}
