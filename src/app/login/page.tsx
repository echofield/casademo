'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

type LoginStep = 'credentials' | 'mfa' | 'forgot' | 'forgot-sent'

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
        setError('Email ou mot de passe incorrect')
        setLoading(false)
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
        window.location.replace('/setup-mfa')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
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
        setError('Code invalide. Veuillez reessayer.')
        setMfaCode('')
        setLoading(false)
        return
      }

      // Success - redirect to home
      window.location.replace('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { hd: 'casablancaparis.com' },
        },
      })
      if (oauthError) {
        setError(oauthError.message)
        setLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
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
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
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
                  placeholder="votre@email.com"
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
                Mot de passe oublié ?
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
              {loading ? 'Connexion...' : 'Continuer'}
            </button>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-[#003D2B]/10" />
              <span className="text-[#003D2B]/40 text-xs tracking-wide uppercase">ou</span>
              <div className="flex-1 h-px bg-[#003D2B]/10" />
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="
                w-full mt-6 py-3.5
                bg-white
                border border-[#003D2B]/15
                text-[#003D2B] text-sm tracking-wide
                hover:border-[#003D2B]/30 hover:bg-[#003D2B]/[0.02]
                focus:outline-none focus:ring-2 focus:ring-[#003D2B]/20
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-3
              "
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuer avec Google
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
                Entrez le code Google Authenticator
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
                {loading ? 'Verification...' : 'Verifier'}
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
                Mot de passe oublié
              </h2>
              <p className="text-[#003D2B]/60 text-sm">
                Un lien de réinitialisation sera envoyé à votre email
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
                  placeholder="votre@email.com"
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
                {loading ? 'Envoi...' : 'Envoyer le lien'}
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
              Email envoyé
            </h2>
            <p className="text-[#003D2B]/60 text-sm mb-2">
              Un lien de réinitialisation a été envoyé à
            </p>
            <p className="text-[#003D2B] text-sm font-medium mb-8">
              {email}
            </p>
            <p className="text-[#003D2B]/40 text-xs mb-8">
              Vérifiez votre boîte de réception et vos spams.
            </p>
            <button
              type="button"
              onClick={() => { setStep('credentials'); setError(null) }}
              className="text-[#003D2B]/60 text-sm hover:text-[#003D2B] transition-colors"
            >
              Retour à la connexion
            </button>
          </div>
        )}

        <p className="mt-8 text-center text-[#003D2B]/40 text-xs">
          Portail vendeurs et superviseurs
        </p>
      </div>

      {/* Footer */}
      <footer className="px-8 py-6 text-center">
        <p className="text-[#003D2B]/30 text-xs tracking-wide">
          2026 Casa One. Systeme de clienteling prive.
        </p>
      </footer>
    </main>
  )
}
