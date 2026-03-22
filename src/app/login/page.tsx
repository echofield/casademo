'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleMicrosoftLogin() {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'email profile',
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setLoading(false)
    }
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

        {/* Microsoft Login */}
        <div className="w-full max-w-sm">
          {error && (
            <p className="mb-4 text-sm text-red-600 text-center">{error}</p>
          )}

          <button
            onClick={handleMicrosoftLogin}
            disabled={loading}
            className="
              w-full py-4 px-6
              bg-[#003D2B]
              border border-[#003D2B]
              text-white text-sm tracking-[0.1em]
              hover:bg-[#004D38]
              focus:outline-none focus:ring-2 focus:ring-[#003D2B]/50
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-3
            "
          >
            {/* Microsoft Logo */}
            <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
              <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
            </svg>
            {loading ? 'Connexion...' : 'Se connecter avec Microsoft'}
          </button>

          <p className="mt-6 text-center text-[#003D2B]/40 text-xs">
            Utilisez votre compte Microsoft professionnel
          </p>
        </div>
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
