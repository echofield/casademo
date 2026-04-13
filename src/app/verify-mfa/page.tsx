'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { BackNavButton } from '@/components'

const allowMfaSkip = process.env.NEXT_PUBLIC_ALLOW_MFA_SKIP === 'true'

export default function VerifyMFAPage() {
  const router = useRouter()
  const [factorId, setFactorId] = useState<string | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    async function checkMFA() {
      if (allowMfaSkip) {
        window.location.replace('/')
        return
      }

      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Check MFA status
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totpFactor = factors?.totp?.find(f => f.status === 'verified')

      if (!totpFactor) {
        // No MFA enrolled - redirect to setup
        router.push('/setup-mfa')
        return
      }

      // Check if already at AAL2
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aal?.currentLevel === 'aal2') {
        // Already verified - redirect to home
        router.push('/')
        return
      }

      setFactorId(totpFactor.id)
      setLoading(false)
    }

    checkMFA()
  }, [router])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!factorId || verifyCode.length !== 6) return

    setVerifying(true)
    setError(null)

    const supabase = createClient()

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId
    })

    if (challengeError) {
      setError(challengeError.message)
      setVerifying(false)
      return
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: verifyCode
    })

    if (verifyError) {
      setError('Invalid code. Try again.')
      setVerifyCode('')
      setVerifying(false)
      return
    }

    // Success - redirect to home
    window.location.replace('/')
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F4EE] flex items-center justify-center">
        <p className="text-[#003D2B]/60">Loading...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F7F4EE] flex flex-col">
      <header className="flex items-center px-8 py-6">
        <BackNavButton fallbackHref="/login" label="Back" className="mr-4" />
        <span className="text-[#003D2B]/90 text-sm font-medium tracking-[0.2em] uppercase">
          Casa One
        </span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-[#003D2B] text-3xl mb-2 text-center">
            Verification
          </h1>
          <p className="text-[#003D2B]/60 text-center mb-8">
            Enter your Google Authenticator code
          </p>

          <form onSubmit={handleVerify}>
            <div className="mb-6">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
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
              disabled={verifying || verifyCode.length !== 6}
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
              {verifying ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={handleLogout}
              className="text-[#003D2B]/50 text-sm hover:text-[#003D2B] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
