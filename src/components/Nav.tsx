'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from './NotificationBell'

interface NavProps {
  userRole: 'seller' | 'supervisor'
  userName: string
}

export function Nav({ userRole, userName }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const links = [
    { href: '/', label: 'Queue' },
    { href: '/clients', label: 'Clients' },
    ...(userRole === 'supervisor' ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
  ]

  const isActive = (href: string) => pathname === href

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop Nav */}
      <nav
        className="hidden md:flex items-center justify-between px-8 py-4 bg-bg/80 backdrop-blur-sm sticky top-0 z-40"
        style={{ borderBottom: '1px solid rgba(28, 27, 25, 0.08)' }}
      >
        <Link href="/queue" className="font-serif text-xl text-primary tracking-tight">
          Casa One
        </Link>

        <div className="flex items-center gap-10">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`
                text-xs font-sans font-medium uppercase tracking-[0.1em]
                transition-colors duration-200
                ${isActive(link.href)
                  ? 'text-text'
                  : 'text-text-muted hover:text-text'
                }
              `}
            >
              {link.label}
            </Link>
          ))}

          <div
            className="flex items-center gap-5 pl-8"
            style={{ borderLeft: '1px solid rgba(28, 27, 25, 0.08)' }}
          >
            <NotificationBell />

            <span className="text-xs text-text-muted">{userName}</span>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-xs font-medium uppercase tracking-[0.1em] text-text-muted hover:text-text transition-colors duration-200 disabled:opacity-50"
            >
              {loggingOut ? '...' : 'Logout'}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <nav className="md:hidden sticky top-0 z-40 bg-bg">
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(28, 27, 25, 0.08)' }}
        >
          <Link href="/queue" className="font-serif text-lg text-primary">
            Casa One
          </Link>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 -mr-2 text-text"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div
            className="absolute top-full left-0 right-0 bg-bg z-50"
            style={{ borderBottom: '1px solid rgba(28, 27, 25, 0.08)' }}
          >
            <div className="px-4 py-4 space-y-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    block text-sm font-medium uppercase tracking-[0.08em] py-2
                    transition-colors duration-200
                    ${isActive(link.href) ? 'text-text' : 'text-text-muted'}
                  `}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-4" style={{ borderTop: '1px solid rgba(28, 27, 25, 0.08)' }}>
                <p className="text-xs text-text-muted mb-3">{userName}</p>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="text-xs font-medium uppercase tracking-[0.08em] text-text-muted hover:text-text transition-colors"
                >
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
