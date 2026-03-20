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
      <nav className="hidden md:flex items-center justify-between px-8 py-4 border-b border-grey-light">
        <Link href="/queue" className="font-serif text-xl text-green">
          Casa One
        </Link>

        <div className="flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`
                small-caps transition-opacity duration-300
                ${isActive(link.href) ? 'opacity-100' : 'opacity-50 hover:opacity-80'}
              `}
            >
              {link.label}
            </Link>
          ))}

          <div className="flex items-center gap-4 pl-8 border-l border-grey-light">
            <NotificationBell />
            <span className="text-xs text-ink/50">{userName}</span>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="small-caps opacity-50 hover:opacity-80 transition-opacity"
            >
              {loggingOut ? '...' : 'Logout'}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <nav className="md:hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-grey-light">
          <Link href="/queue" className="font-serif text-lg text-green">
            Casa One
          </Link>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 -mr-2"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="absolute top-14 left-0 right-0 bg-paper border-b border-grey-light z-50">
            <div className="px-4 py-4 space-y-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    block small-caps py-2 transition-opacity
                    ${isActive(link.href) ? 'opacity-100' : 'opacity-50'}
                  `}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-4 border-t border-grey-light">
                <p className="text-xs text-ink/50 mb-2">{userName}</p>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="small-caps opacity-50 hover:opacity-80"
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
