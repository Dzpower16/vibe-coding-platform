import { gunzipSync } from 'node:zlib'
import { NextResponse } from 'next/server'
import { supabaseServeur } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { arrondir, empreinte, type ModeleSigne } from '@/lib/reconnaissance/caracteristiques'
import type { DocumentPositions } from '@/lib/mediapipe/positions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_EXEMPLES = 400

interface Ligne {
  id: string
  positions_path: string
  signes: { glose: string; mots_fr: string[] } | null
}

/**
 * Exemples de signes pour la reconnaissance (CLAUDE.md §8bis).
 * Seulement : consentement (tournage) ou accord écrit (import externe) non révoqué ET portée
 * « reconnaissance » cochée, et prise validée OU prise de la personne connectée (calibrage personnel).
 * On renvoie des empreintes (mains + poignets), jamais la vidéo ni le visage.
 */
export async function GET() {
  const supabase = await supabaseServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erreur: 'Connexion requise' }, { status: 401 })

  let admin
  try {
    admin = supabaseAdmin()
  } catch {
    return NextResponse.json(
      { erreur: 'SUPABASE_SECRET_KEY manquante dans les variables Vercel.' },
      { status: 500 },
    )
  }

  const [tournage, externes] = await Promise.all([
    admin
      .from('enregistrements')
      .select('id, positions_path, signes!inner(glose, mots_fr), consentements!inner(portee_reconnaissance, revoque_le)')
      .eq('origine', 'tournage')
      .not('positions_path', 'is', null)
      .eq('consentements.portee_reconnaissance', true)
      .is('consentements.revoque_le', null)
      .or(`statut.eq.valide,signeur_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(MAX_EXEMPLES)
      .returns<Ligne[]>(),
    admin
      .from('enregistrements')
      .select('id, positions_path, signes!inner(glose, mots_fr), sources_externes!inner(portee_reconnaissance, revoque_le)')
      .eq('origine', 'externe')
      .not('positions_path', 'is', null)
      .eq('sources_externes.portee_reconnaissance', true)
      .is('sources_externes.revoque_le', null)
      .or(`statut.eq.valide,signeur_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(MAX_EXEMPLES)
      .returns<Ligne[]>(),
  ])

  const error = tournage.error ?? externes.error
  if (error) return NextResponse.json({ erreur: error.message }, { status: 500 })
  const data = [...(tournage.data ?? []), ...(externes.data ?? [])].slice(0, MAX_EXEMPLES)

  const modeles: ModeleSigne[] = []
  const lignes = data ?? []
  for (let i = 0; i < lignes.length; i += 10) {
    const lot = await Promise.all(
      lignes.slice(i, i + 10).map(async (l) => {
        if (!l.signes) return null
        const { data: fichier } = await admin.storage.from('positions-signes').download(l.positions_path)
        if (!fichier) return null
        try {
          const doc = JSON.parse(gunzipSync(Buffer.from(await fichier.arrayBuffer())).toString('utf8')) as DocumentPositions
          const seq = empreinte(doc.frames)
          if (!seq) return null
          return { glose: l.signes.glose, mot: l.signes.mots_fr[0] ?? l.signes.glose.toLowerCase(), sequence: arrondir(seq) }
        } catch {
          return null
        }
      }),
    )
    for (const m of lot) if (m) modeles.push(m)
  }

  return NextResponse.json({ modeles }, { headers: { 'Cache-Control': 'no-store' } })
}
