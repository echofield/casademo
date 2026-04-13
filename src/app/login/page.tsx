'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import { isDemoMode } from '@/lib/demo/config'

const allowMfaSkip = true

type LoginStep = 'credentials' | 'mfa' | 'forgot' | 'forgot-sent'

/**
 * Prefetch critical routes and warm up serverless functions.
 * Fires in background before redirect - gives a head start on cold starts.
 */
function prefetchCriticalRoutes() {
  ['/', '/queue', '/clients', '/calendar', '/dashboard', '/team'].forEach((href) => {
    const prefetchLink = document.createElement('link')
    prefetchLink.rel = 'prefetch'
    prefetchLink.href = href
    prefetchLink.as = 'document'
    document.head.appendChild(prefetchLink)
  })

  fetch('/api/recontact-queue', { method: 'GET', credentials: 'include' }).catch(() => {})
  fetch('/api/contacts/recent', { method: 'GET', credentials: 'include' }).catch(() => {})
  fetch('/api/notifications?limit=5', { method: 'GET', credentials: 'include' }).catch(() => {})

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  fetch(`/api/meetings?start=${today.toISOString()}&end=${tomorrow.toISOString()}`, {
    method: 'GET',
    credentials: 'include',
  }).catch(() => {})
}

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  function enterDemo(mode: 'supervisor' | 'seller') {
    document.cookie = mode === 'seller'
      ? 'casa_view_mode=seller; path=/; max-age=31536000'
      : 'casa_view_mode=; path=/; max-age=0'
    window.location.replace('/')
  }

  if (isDemoMode) {
    return (
      <main className="min-h-screen bg-[#F7F4EE] flex flex-col">
        <header className="flex items-center justify-between px-8 py-6">
          <span className="text-[#003D2B]/90 text-sm font-medium tracking-[0.2em] uppercase">
            Casa One
          </span>
          <span className="rounded-full border border-[#003D2B]/10 bg-[#003D2B]/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#003D2B]">
            Presentation mode
          </span>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
          <div className="text-center mb-12 max-w-2xl">
            <h1 className="font-serif text-[#003D2B] text-5xl md:text-6xl tracking-tight mb-4">
              Casa One
            </h1>
            <p className="text-[#003D2B]/60 text-lg tracking-wide">
              Luxury clienteling, queue intelligence, and supervisor visibility in one presentation-ready environment.
            </p>
          </div>

          <div className="w-full max-w-3xl border border-[#003D2B]/10 bg-white/70 p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.18em] text-[#003D2B]/50 mb-2">Enter demo</p>
            <h2 className="font-serif text-3xl text-[#003D2B] mb-3">Choose the presentation angle</h2>
            <p className="text-[#003D2B]/60 text-sm leading-6 mb-8">
              Supervisor view shows global visibility, team rhythm, conversion, and cross-seller prioritization. Seller view narrows the experience to one active book of business and execution queue.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => enterDemo('supervisor')}
                className="border border-[#003D2B] bg-[#003D2B] px-6 py-5 text-left text-white transition-colors hover:bg-[#004D38]"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-white/70">Boardroom</p>
                <p className="mt-2 font-serif text-2xl">Supervisor</p>
                <p className="mt-2 text-sm text-white/80">Team dashboard, workload visibility, conversion, and cross-seller prioritization.</p>
              </button>
              <button
                type="button"
                onClick={() => enterDemo('seller')}
                className="border border-[#003D2B]/15 bg-white px-6 py-5 text-left text-[#003D2B] transition-colors hover:bg-[#003D2B]/5"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-[#003D2B]/50">Execution</p>
                <p className="mt-2 font-serif text-2xl">Seller</p>
                <p className="mt-2 text-sm text-[#003D2B]/70">Queue-first workflow, client profiles, meetings, and recontact cadence.</p>
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  async function handleCredentialsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      if (allowMfaSkip) {
        const secureSuffix = window.location.protocol === 'https:' ? '; Secure' : ''
        document.cookie = `casa_mfa_skipped=1; path=/; max-age=604800; SameSite=Lax${secureSuffix}`
        setRedirecting(true)
        prefetchCriticalRoutes()
        await new Promise(resolve => setTimeout(resolve, 180))
        window.location.replace('/')
        return
      }

      // Check if user has MFA enrolled
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totpFactor = factors?.totp?.find(f => f.status === 'verified')

      if (totpFactor) {
        // User has MFA - show verification step
        setFactorId(totpFactor.id)
        setStep('mfa')
        setLoading(false)
      } else {
        // No MFA enrolled - redirect to setup
        // Prefetch setup page
        const prefetchLink = document.createElement('link')
        prefetchLink.rel = 'prefetch'
        prefetchLink.href = '/setup-mfa'
        prefetchLink.as = 'document'
        document.head.appendChild(prefetchLink)
        window.location.replace('/setup-mfa')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  async function handleMfaSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!factorId || mfaCode.length !== 6) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Challenge the factor
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      })

      if (challengeError) {
        setError(challengeError.message)
        setLoading(false)
        return
      }

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: mfaCode,
      })

      if (verifyError) {
        setError('Invalid code. Please try again.')
        setMfaCode('')
        setLoading(false)
        return
      }

      setRedirecting(true)
      prefetchCriticalRoutes()
      await new Promise(resolve => setTimeout(resolve, 180))
      window.location.replace('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/reset-password` }
      )
      if (resetError) {
        setError(resetError.message)
        setLoading(false)
        return
      }
      setStep('forgot-sent')
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  function handleBackToCredentials() {
    setStep('credentials')
    setMfaCode('')
    setFactorId(null)
    setError(null)
    // Sign out to clear the partial session
    const supabase = createClient()
    supabase.auth.signOut()
  }

  if (redirecting) {
    return (
      <main className="min-h-screen bg-[#F7F4EE] flex flex-col">
        <header className="flex items-center justify-between px-8 py-6">
          <span className="text-[#003D2B]/90 text-sm font-medium tracking-[0.2em] uppercase">
            Casa One
          </span>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 pb-20">
          <div className="w-full max-w-md border border-[#003D2B]/10 bg-white/75 p-8 text-center">
            <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-[#003D2B]/45">Opening workspace</p>
            <h2 className="mb-3 font-serif text-3xl text-[#003D2B]">Preparing your day</h2>
            <p className="mb-6 text-sm text-[#003D2B]/60">Queue, meetings, notifications, and client context are warming up.</p>
            <div className="h-[2px] w-full bg-[#003D2B]/8">
              <div className="h-full w-2/3 animate-pulse bg-[#003D2B]" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F7F4EE] flex flex-col">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-8 py-6">
        <span className="text-[#003D2B]/90 text-sm font-medium tracking-[0.2em] uppercase">
          Casa One
        </span>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        {/* Brand */}
        <div className="text-center mb-16">
          <h1 className="font-serif text-[#003D2B] text-5xl md:text-6xl tracking-tight mb-4">
            Casa One
          </h1>
          <p className="text-[#003D2B]/60 text-lg tracking-wide">
            One Client. One Experience.
          </p>
        </div>

        {/* Step 1: Credentials Form */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="w-full max-w-sm">
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-[#003D2B]/70 text-sm tracking-wide mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="
                    w-full px-0 py-3
                    bg-transparent
                    border-0 border-b border-[#003D2B]/20
                    text-[#003D2B] text-base
                    placeholder:text-[#003D2B]/30
                    focus:outline-none focus:border-[#003D2B]/50
                    transition-colors duration-200
                  "
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-[#003D2B]/70 text-sm tracking-wide mb-2"
                >
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="
                    w-full px-0 py-3
                    bg-transparent
                    border-0 border-b border-[#003D2B]/20
                    text-[#003D2B] text-base
                    placeholder:text-[#003D2B]/30
                    focus:outline-none focus:border-[#003D2B]/50
                    transition-colors duration-200
                  "
                  placeholder="Mot de passe"
                />
              </div>
            </div>

            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={() => { setStep('forgot'); setError(null) }}
                className="text-[#003D2B]/50 text-xs tracking-wide hover:text-[#003D2B] transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full mt-10 py-4
                bg-[#003D2B]
                border border-[#003D2B]
                text-white text-sm tracking-[0.15em] uppercase
                hover:bg-[#004D38]
                focus:outline-none focus:ring-2 focus:ring-[#003D2B]/50
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {loading ? 'Signing in...' : 'Continuer'}
            </button>

          </form>
        )}

        {/* Step 2: MFA Verification */}
        {step === 'mfa' && (
          <div className="w-full max-w-sm">
            <button
              type="button"
              onClick={handleBackToCredentials}
              className="flex items-center gap-2 text-[#003D2B]/60 text-sm mb-8 hover:text-[#003D2B] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>

            <div className="text-center mb-8">
              <h2 className="font-serif text-[#003D2B] text-2xl mb-2">
                Verification
              </h2>
              <p className="text-[#003D2B]/60 text-sm">
                Enter your Google Authenticator code
              </p>
            </div>

            <form onSubmit={handleMfaSubmit}>
              <div className="mb-6">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  className="
                    w-full px-4 py-4 text-center text-2xl tracking-[0.5em]
                    bg-white border border-[#003D2B]/20
                    text-[#003D2B]
                    placeholder:text-[#003D2B]/30
                    focus:outline-none focus:border-[#003D2B]/50
                    transition-colors duration-200
                  "
                  placeholder="000000"
                  autoComplete="one-time-code"
                />
              </div>

              {error && (
                <p className="mb-4 text-sm text-red-600 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || mfaCode.length !== 6}
                className="
                  w-full py-4
                  bg-[#003D2B] border border-[#003D2B]
                  text-white text-sm tracking-[0.15em] uppercase
                  hover:bg-[#004D38]
                  focus:outline-none focus:ring-2 focus:ring-[#003D2B]/50
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {loading ? 'Verifying...' : 'Verifier'}
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Forgot password form */}
        {step === 'forgot' && (
          <div className="w-full max-w-sm">
            <button
              type="button"
              onClick={() => { setStep('credentials'); setError(null) }}
              className="flex items-center gap-2 text-[#003D2B]/60 text-sm mb-8 hover:text-[#003D2B] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>

            <div className="text-center mb-8">
              <h2 className="font-serif text-[#003D2B] text-2xl mb-2">
                Mot de passe oublie
              </h2>
              <p className="text-[#003D2B]/60 text-sm">
                A reset link will be sent to your email
              </p>
            </div>

            <form onSubmit={handleForgotPassword}>
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  className="
                    w-full px-0 py-3
                    bg-transparent
                    border-0 border-b border-[#003D2B]/20
                    text-[#003D2B] text-base
                    placeholder:text-[#003D2B]/30
                    focus:outline-none focus:border-[#003D2B]/50
                    transition-colors duration-200
                  "
                  placeholder="your@email.com"
                />
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="
                  w-full mt-10 py-4
                  bg-[#003D2B] border border-[#003D2B]
                  text-white text-sm tracking-[0.15em] uppercase
                  hover:bg-[#004D38]
                  focus:outline-none focus:ring-2 focus:ring-[#003D2B]/50
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          </div>
        )}

        {/* Step 4: Forgot password confirmation */}
        {step === 'forgot-sent' && (
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#003D2B]/5 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#003D2B]/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="font-serif text-[#003D2B] text-2xl mb-2">
              Email sent
            </h2>
            <p className="text-[#003D2B]/60 text-sm mb-2">
              A reset link has been sent to
            </p>
            <p className="text-[#003D2B] text-sm font-medium mb-8">
              {email}
            </p>
            <p className="text-[#003D2B]/40 text-xs mb-8">
              Check your inbox and spam folder.
            </p>
            <button
              type="button"
              onClick={() => { setStep('credentials'); setError(null) }}
              className="text-[#003D2B]/60 text-sm hover:text-[#003D2B] transition-colors"
            >
              Back to login
            </button>
          </div>
        )}

        <p className="mt-8 text-center text-[#003D2B]/40 text-xs">
          Seller and supervisor portal
        </p>
      </div>

      {/* Footer */}
      <footer className="px-8 py-6 text-center">
        <p className="text-[#003D2B]/30 text-xs tracking-wide">
          2026 Casa One. Private clienteling system.
        </p>
      </footer>
    </main>
  )
}



