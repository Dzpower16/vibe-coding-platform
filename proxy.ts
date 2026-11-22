import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ROUTES_PROTEGEES = ['/tournage', '/admin']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(aEcrire, entetes) {
        for (const { name, value } of aEcrire) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of aEcrire) response.cookies.set(name, value, options)
        for (const [nom, valeur] of Object.entries(entetes ?? {})) response.headers.set(nom, valeur)
      },
    },
  })

  // Rafraîchit la session ; ne rien insérer entre createServerClient et getUser.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const chemin = request.nextUrl.pathname
  if (!user && ROUTES_PROTEGEES.some((r) => chemin === r || chemin.startsWith(`${r}/`))) {
    const redirection = request.nextUrl.clone()
    redirection.pathname = '/connexion'
    redirection.search = `?suite=${encodeURIComponent(chemin)}`
    return NextResponse.redirect(redirection)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|mediapipe/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|wasm|task)$).*)'],
}
