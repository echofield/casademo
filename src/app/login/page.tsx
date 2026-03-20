'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const fd = new FormData(form)
    const emailValue = String(fd.get('email') ?? '').trim()
    const passwordValue = String(fd.get('password') ?? '')

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: emailValue,
        password: passwordValue,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      await supabase.auth.getSession()
      window.location.replace('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
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
        <span className="text-[#003D2B]/50 text-sm">
          English
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

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
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
                Password
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
                placeholder="Enter password"
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
            {loading ? 'Entering...' : 'Enter'}
          </button>

          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-[#003D2B]/40 text-sm hover:text-[#003D2B]/70 transition-colors"
            >
              Forgot password
            </button>
          </div>
        </form>
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
