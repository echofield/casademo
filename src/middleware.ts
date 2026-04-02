import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Paths that don't require authentication or MFA
const PUBLIC_PATHS = ['/login', '/auth/callback', '/reset-password']
const MFA_PATHS = ['/setup-mfa', '/verify-mfa']
const API_AUTH_PATHS = ['/api/auth']
const MFA_SKIP_COOKIE = 'casa_mfa_skipped'
const MFA_SKIP_ENABLED = process.env.NODE_ENV !== 'production' && process.env.ALLOW_MFA_SKIP === 'true'

export async function middleware(request: NextRequest) {
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

  // Check if this is a public path
  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const isMfaPath = MFA_PATHS.some(p => pathname.startsWith(p))
  const isApiAuthPath = API_AUTH_PATHS.some(p => pathname.startsWith(p))
  const isStaticPath = pathname.startsWith('/_next') ||
    pathname.includes('.') // Static files like .svg, .png, etc.

  // Skip middleware for static assets
  if (isStaticPath) {
    return supabaseResponse
  }

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect API routes (except auth routes)
  if (pathname.startsWith('/api') && !isApiAuthPath) {
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
  }

  // Allow public paths without auth
  if (isPublicPath) {
    return supabaseResponse
  }

  // If no user, redirect to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Check MFA assurance level for authenticated users
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

  const isOAuthSession = user.app_metadata?.provider === 'google' ||
    user.app_metadata?.providers?.includes('google')

  // OAuth users (Google) skip MFA - Google handles its own security
  if (isOAuthSession) {
    return supabaseResponse
  }

  // If user has MFA enrolled (nextLevel is aal2) but hasn't verified this session (currentLevel is aal1)
  if (aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2') {
    if (isMfaPath) {
      return supabaseResponse
    }
    const url = request.nextUrl.clone()
    url.pathname = '/verify-mfa'
    return NextResponse.redirect(url)
  }

  // If user doesn't have MFA enrolled at all (nextLevel is aal1)
  if (aal?.nextLevel === 'aal1') {
    const mfaSkipped = request.cookies.get(MFA_SKIP_COOKIE)?.value === '1'

    // Ignore stale skip cookies unless explicitly enabled in non-production environments
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

  // User is authenticated and has verified MFA (aal2)
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
