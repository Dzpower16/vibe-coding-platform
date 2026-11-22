import { NextResponse, type NextRequest } from 'next/server'
import { supabaseServeur } from '@/lib/supabase/server'
import { cheminSur } from '@/lib/redirection'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const suite = cheminSur(searchParams.get('suite'))

  if (code) {
    const supabase = await supabaseServeur()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(suite, origin))
  }
  return NextResponse.redirect(new URL(`/connexion?erreur=lien&suite=${encodeURIComponent(suite)}`, origin))
}
