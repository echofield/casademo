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
    { href: '/', label: 'Home' },
    { href: '/queue', label: 'Queue' },
    { href: '/clients', label: 'Clients' },
    ...(userRole === 'supervisor' ? [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/formation/analytics', label: 'Formation' },
    ] : []),
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const linkClass = (href: string) =>
    `text-xs font-sans font-medium uppercase tracking-[0.1em] transition-colors duration-200 ${
      isActive(href) ? 'text-text' : 'text-text-muted hover:text-text'
    }`

  return (
    <>
      <nav
        className="sticky top-0 z-40 hidden items-center justify-between border-b px-8 py-4 md:flex"
        style={{
          borderColor: 'var(--faint)',
          backgroundColor: 'rgba(250, 248, 242, 0.88)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Link href="/" className="font-serif text-xl tracking-tight text-primary">
          Casa One
        </Link>

        <div className="flex items-center gap-10">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}

          <div
            className="flex items-center gap-5 pl-8"
            style={{ borderLeft: '0.5px solid var(--faint)' }}
          >
            <NotificationBell />
            <span className="text-xs text-text-muted">{userName}</span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-xs font-medium uppercase tracking-[0.1em] text-text-muted transition-colors duration-200 hover:text-text disabled:opacity-50"
            >
              {loggingOut ? '...' : 'Logout'}
            </button>
          </div>
        </div>
      </nav>

      <nav className="sticky top-0 z-40 border-b bg-bg md:hidden" style={{ borderColor: 'var(--faint)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="font-serif text-lg text-primary">
            Casa One
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="-mr-2 p-2 text-text"
              aria-label="Toggle menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            className="absolute left-0 right-0 top-full z-50 bg-bg"
            style={{ borderBottom: '0.5px solid var(--faint)' }}
          >
            <div className="space-y-4 px-4 py-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block py-2 text-sm font-medium uppercase tracking-[0.08em] transition-colors duration-200 ${
                    isActive(link.href) ? 'text-text' : 'text-text-muted'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4" style={{ borderTop: '0.5px solid var(--faint)' }}>
                <p className="mb-3 text-xs text-text-muted">{userName}</p>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="text-xs font-medium uppercase tracking-[0.08em] text-text-muted transition-colors hover:text-text"
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
