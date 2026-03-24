'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SetupMFAPage() {
  const router = useRouter()
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    async function enrollMFA() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: factors } = await supabase.auth.mfa.listFactors()
      const verifiedFactor = factors?.totp?.find(f => f.status === 'verified')

      if (verifiedFactor) {
        router.push('/')
        return
      }

      // Clean up ALL unverified TOTP factors (must complete before enrolling)
      const allTotp = (factors?.totp || []) as Array<{ id: string; status: string; friendly_name?: string }>
      const unverified = allTotp.filter(f => f.status !== 'verified')

      if (unverified.length > 0) {
        console.log('[MFA Setup] Cleaning up', unverified.length, 'unverified factors')
        // Unenroll all unverified factors and wait for all to complete
        const unenrollResults = await Promise.all(
          unverified.map(f => supabase.auth.mfa.unenroll({ factorId: f.id }))
        )

        // Check if any unenroll failed
        const failedUnenrolls = unenrollResults.filter(r => r.error)
        if (failedUnenrolls.length > 0) {
          console.error('[MFA Setup] Some unenrolls failed:', failedUnenrolls.map(r => r.error?.message))
        }

        // Re-fetch factors to confirm cleanup worked
        const { data: refreshedFactors } = await supabase.auth.mfa.listFactors()
        const stillUnverified = (refreshedFactors?.totp || []).filter(f => f.status !== 'verified')
        if (stillUnverified.length > 0) {
          console.warn('[MFA Setup] Still have', stillUnverified.length, 'unverified factors after cleanup')
        }
      }

      // Enroll a fresh TOTP factor
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `Casa One ${Date.now()}`
      })

      // If enrollment fails due to existing factor, try one more cleanup and retry
      if (enrollError?.message?.includes('already exists')) {
        console.log('[MFA Setup] Factor exists error, attempting aggressive cleanup')
        console.log('[MFA Setup] All factors:', JSON.stringify(retryFactors?.totp || []))

        // Fetch factors again and force-remove any with our friendly name
        const { data: retryFactors } = await supabase.auth.mfa.listFactors()
        const existingCasaOne = (retryFactors?.totp || []).filter(
          (f) => f.friendly_name === 'Casa One'
        )

        for (const f of existingCasaOne) {
          const { error: unenrollErr } = await supabase.auth.mfa.unenroll({ factorId: f.id })
          if (unenrollErr) {
            console.error('[MFA Setup] Failed to unenroll factor', f.id, ':', unenrollErr.message)
          }
        }

        // Small delay to let Supabase process the unenrollment
        await new Promise(resolve => setTimeout(resolve, 500))

        // Retry enrollment
        const { data: retryData, error: retryError } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: `Casa One ${Date.now()}`
        })

        if (retryError) {
          console.error('[MFA Setup] Retry enrollment failed:', retryError.message)
          setError(retryError.message)
          setLoading(false)
          return
        }

        setQrCode(retryData.totp.qr_code)
        setSecret(retryData.totp.secret)
        setFactorId(retryData.id)
        setLoading(false)
        return
      }

      if (enrollError) {
        console.error('[MFA Setup] Enrollment error:', enrollError.message)
        setError(enrollError.message)
        setLoading(false)
        return
      }

      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)
      setFactorId(data.id)
      setLoading(false)
    }

    enrollMFA()
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
      setError('Code invalide. Réessayez.')
      setVerifying(false)
      return
    }

    // Success - redirect to home
    window.location.replace('/')
  }

  async function handleSkip() {
    const supabase = createClient()
    // Remove any unverified factor so middleware won't loop back here
    if (factorId) {
      await supabase.auth.mfa.unenroll({ factorId })
    }
    // Set a cookie so middleware knows user chose to skip
    document.cookie = 'casa_mfa_skipped=1; path=/; max-age=604800'
    window.location.replace('/')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F4EE] flex items-center justify-center">
        <p className="text-[#003D2B]/60">Chargement...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F7F4EE] flex flex-col">
      <header className="flex items-center justify-between px-8 py-6">
        <span className="text-[#003D2B]/90 text-sm font-medium tracking-[0.2em] uppercase">
          Casa One
        </span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-[#003D2B] text-3xl mb-2 text-center">
            Sécuriser votre compte
          </h1>
          <p className="text-[#003D2B]/60 text-center mb-2">
            Scannez le QR code avec Google Authenticator
          </p>
          <p className="text-[#003D2B]/40 text-xs text-center mb-8">
            Ouvrez l&apos;app Google Authenticator &gt; appuyez sur &quot;+&quot; &gt; Scanner un QR code
          </p>

          {error && !qrCode && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-center">
              <p className="text-sm text-red-700 mb-2">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-xs text-red-600 underline"
              >
                Réessayer
              </button>
            </div>
          )}

          {qrCode && (
            <div className="flex flex-col items-center mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm mb-5 border border-[#003D2B]/10">
                <img
                  src={qrCode}
                  alt="QR Code pour Google Authenticator"
                  className="w-56 h-56"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              {secret && (
                <div className="text-center w-full">
                  <p className="text-xs text-[#003D2B]/40 mb-2">Ou entrez ce code manuellement :</p>
                  <div className="bg-[#003D2B]/5 px-4 py-2.5 rounded border border-[#003D2B]/10">
                    <code className="text-sm font-mono text-[#003D2B] select-all tracking-wide break-all">
                      {secret}
                    </code>
                  </div>
                </div>
              )}
            </div>
          )}

          {qrCode && (
            <form onSubmit={handleVerify}>
              <div className="mb-6">
                <label className="block text-[#003D2B]/70 text-sm tracking-wide mb-2">
                  Entrez le code à 6 chiffres affiché dans l&apos;app
                </label>
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
                {verifying ? 'Vérification...' : 'Activer'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={handleSkip}
              className="text-[#003D2B]/40 text-xs hover:text-[#003D2B]/60 transition-colors"
            >
              Configurer plus tard
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
