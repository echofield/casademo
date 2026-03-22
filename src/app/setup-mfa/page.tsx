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

      // Check if MFA is already enrolled
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totpFactor = factors?.totp?.find(f => f.status === 'verified')

      if (totpFactor) {
        // Already enrolled, redirect to home
        router.push('/')
        return
      }

      // Enroll new TOTP factor
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Google Authenticator'
      })

      if (error) {
        setError(error.message)
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
    router.push('/')
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
          <p className="text-[#003D2B]/60 text-center mb-8">
            Scannez le QR code avec Google Authenticator
          </p>

          {qrCode && (
            <div className="flex flex-col items-center mb-8">
              <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <img src={qrCode} alt="QR Code MFA" className="w-48 h-48" />
              </div>

              {secret && (
                <div className="text-center">
                  <p className="text-xs text-[#003D2B]/40 mb-1">Ou entrez manuellement:</p>
                  <code className="text-xs bg-[#003D2B]/5 px-3 py-1.5 rounded font-mono text-[#003D2B]/70 select-all">
                    {secret}
                  </code>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleVerify}>
            <div className="mb-6">
              <label className="block text-[#003D2B]/70 text-sm tracking-wide mb-2">
                Code à 6 chiffres
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                className="
                  w-full px-4 py-3 text-center text-2xl tracking-[0.5em]
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
        </div>
      </div>
    </main>
  )
}
