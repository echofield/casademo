import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/auth/callback', '/reset-password']
const MFA_PATHS = ['/setup-mfa', '/verify-mfa']
const API_AUTH_PATHS = ['/api/auth']
const MFA_SKIP_COOKIE = 'casa_mfa_skipped'
const MFA_SKIP_ENABLED =
  process.env.ALLOW_MFA_SKIP === 'true' ||
  process.env.NEXT_PUBLIC_ALLOW_MFA_SKIP === 'true'
const DEMO_MODE = process.env.NEXT_PUBLIC_CASA_DEMO_MODE === 'true'

export async function middleware(request: NextRequest) {
  if (DEMO_MODE) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname
  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const isMfaPath = MFA_PATHS.some(p => pathname.startsWith(p))
  const isApiAuthPath = API_AUTH_PATHS.some(p => pathname.startsWith(p))
  const isStaticPath = pathname.startsWith('/_next') || pathname.includes('.')

  if (isStaticPath) {
    return supabaseResponse
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (pathname.startsWith('/api') && !isApiAuthPath) {
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
  }

  if (isPublicPath) {
    return supabaseResponse
  }

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (MFA_SKIP_ENABLED) {
    if (isMfaPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

  const isOAuthSession = user.app_metadata?.provider === 'google' ||
    user.app_metadata?.providers?.includes('google')

  if (isOAuthSession) {
    return supabaseResponse
  }

  if (aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2') {
    if (isMfaPath) {
      return supabaseResponse
    }
    const url = request.nextUrl.clone()
    url.pathname = '/verify-mfa'
    return NextResponse.redirect(url)
  }

  if (aal?.nextLevel === 'aal1') {
    const mfaSkipped = request.cookies.get(MFA_SKIP_COOKIE)?.value === '1'

    if (mfaSkipped && !MFA_SKIP_ENABLED) {
      supabaseResponse.cookies.set(MFA_SKIP_COOKIE, '', {
        maxAge: 0,
        path: '/',
      })
    }

    if (MFA_SKIP_ENABLED && mfaSkipped) {
      return supabaseResponse
    }

    if (pathname.startsWith('/setup-mfa')) {
      return supabaseResponse
    }
    const url = request.nextUrl.clone()
    url.pathname = '/setup-mfa'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

