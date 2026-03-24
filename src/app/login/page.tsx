'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

type LoginStep = 'credentials' | 'mfa'

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
