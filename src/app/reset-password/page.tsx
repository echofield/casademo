'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      setDone(true)
      setTimeout(() => {
        window.location.replace('/login')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F4EE] flex flex-col">
      <header className="flex items-center justify-between px-8 py-6">
        <span className="text-[#003D2B]/90 text-sm font-medium tracking-[0.2em] uppercase">
          Casa One
        </span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="text-center mb-16">
          <h1 className="font-serif text-[#003D2B] text-5xl md:text-6xl tracking-tight mb-4">
            Casa One
          </h1>
        </div>

        {done ? (
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#003D2B]/5 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#003D2B]/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="font-serif text-[#003D2B] text-2xl mb-2">
              Password updated
            </h2>
            <p className="text-[#003D2B]/60 text-sm">
              Redirecting to login...
            </p>
          </div>
        ) : !sessionReady ? (
          <div className="w-full max-w-sm text-center">
            <h2 className="font-serif text-[#003D2B] text-2xl mb-4">
              Loading...
            </h2>
            <p className="text-[#003D2B]/60 text-sm">
              Verifying reset link
            </p>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <h2 className="font-serif text-[#003D2B] text-2xl mb-2">
                New password
              </h2>
              <p className="text-[#003D2B]/60 text-sm">
                Choose a secure password
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="new-password" className="block text-[#003D2B]/70 text-sm tracking-wide mb-2">
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    minLength={8}
                    autoComplete="new-password"
                    className="
                      w-full px-0 py-3
                      bg-transparent
                      border-0 border-b border-[#003D2B]/20
                      text-[#003D2B] text-base
                      placeholder:text-[#003D2B]/30
                      focus:outline-none focus:border-[#003D2B]/50
                      transition-colors duration-200
                    "
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-[#003D2B]/70 text-sm tracking-wide mb-2">
                    Confirm password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="
                      w-full px-0 py-3
                      bg-transparent
                      border-0 border-b border-[#003D2B]/20
                      text-[#003D2B] text-base
                      placeholder:text-[#003D2B]/30
                      focus:outline-none focus:border-[#003D2B]/50
                      transition-colors duration-200
                    "
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || password.length < 8}
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
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          </div>
        )}
      </div>

      <footer className="px-8 py-6 text-center">
        <p className="text-[#003D2B]/30 text-xs tracking-wide">
          2026 Casa One. Systeme de clienteling prive.
        </p>
      </footer>
    </main>
  )
}
