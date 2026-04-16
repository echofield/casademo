'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from './NotificationBell'
import { SystemHelper } from './SystemHelper'
import { isDemoMode } from '@/lib/demo/config'

interface NavProps {
  userRole: 'seller' | 'supervisor'
  effectiveRole: 'seller' | 'supervisor'
  userName: string
}

function hasInAppBackHistory(): boolean {
  if (typeof window === 'undefined') return false
  if (window.history.length <= 1) return false
  if (!document.referrer) return false

  try {
    const referrerUrl = new URL(document.referrer)
    return referrerUrl.origin === window.location.origin
  } catch {
    return false
  }
}

export function Nav({ userRole, effectiveRole, userName }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [canGoBack, setCanGoBack] = useState(false)

  const canSwitch = userRole === 'supervisor'
  const viewingAsSeller = canSwitch && effectiveRole === 'seller'
  const backFallbackHref = effectiveRole === 'supervisor' ? '/dashboard' : '/clients'

  useEffect(() => {
    setCanGoBack(hasInAppBackHistory())
  }, [pathname])

  const handleBack = () => {
    if (hasInAppBackHistory()) {
      router.back()
      return
    }

    router.push(backFallbackHref)
  }

  const handleForward = () => {
    router.forward()
  }

  const toggleViewMode = () => {
    if (viewingAsSeller) {
      document.cookie = 'casa_view_mode=; path=/; max-age=0'
    } else {
      document.cookie = 'casa_view_mode=seller; path=/; max-age=31536000'
    }
    router.refresh()
  }

  const links = [
    { href: '/', label: 'Home' },
    { href: '/queue', label: 'Queue' },
    { href: '/clients', label: 'Clients' },
    { href: '/calendar', label: 'Calendar' },
    { href: '/culture', label: 'Culture' },
    ...(effectiveRole === 'supervisor'
      ? [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/team', label: 'Team' },
        ]
      : []),
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    if (isDemoMode) {
      document.cookie = 'casa_view_mode=; path=/; max-age=0'
      router.push('/login')
      return
    }

    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const linkClass = (href: string) =>
    `text-xs font-sans font-medium uppercase tracking-[0.1em] transition-colors duration-200 ${
      isActive(href) ? 'text-text' : 'text-text-muted hover:text-text'
    }`

  const historyControls = (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleBack}
        title="Back"
        aria-label="Go back"
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
          canGoBack ? 'text-text hover:bg-bg-soft' : 'text-text-muted hover:text-text'
        }`}
        style={{ borderColor: 'var(--faint)' }}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={handleForward}
        title="Forward"
        aria-label="Go forward"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border text-text-muted transition-colors hover:bg-bg-soft hover:text-text"
        style={{ borderColor: 'var(--faint)' }}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )

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
        <div className="flex items-center gap-3">
          {historyControls}
          <div className="flex items-center gap-2">
            <Link href="/" className="font-serif text-xl tracking-tight text-primary">
              Casa One
            </Link>
            {isDemoMode && (
              <span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-primary">
                Presentation
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-10">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={`${linkClass(link.href)} active:opacity-70`}>
              {link.label}
            </Link>
          ))}

          <div className="flex items-center gap-5 pl-8" style={{ borderLeft: '0.5px solid var(--faint)' }}>
            <SystemHelper role={effectiveRole} pathname={pathname} />
            <NotificationBell />
            {canSwitch && (
              <button
                type="button"
                onClick={toggleViewMode}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors duration-200 ${
                  viewingAsSeller ? 'bg-primary/10 text-primary' : 'bg-gold/10 text-gold'
                }`}
                title={viewingAsSeller ? 'Switch to supervisor view' : 'Switch to seller view'}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: viewingAsSeller ? 'var(--primary)' : 'var(--gold)' }}
                />
                {viewingAsSeller ? 'Seller' : 'Supervisor'}
              </button>
            )}
            <span className="text-xs text-text-muted">{userName}</span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-xs font-medium uppercase tracking-[0.1em] text-text-muted transition-colors duration-200 hover:text-text disabled:opacity-50"
            >
              {loggingOut ? '...' : isDemoMode ? 'Exit' : 'Logout'}
            </button>
          </div>
        </div>
      </nav>

      <nav className="sticky top-0 z-40 border-b bg-bg md:hidden" style={{ borderColor: 'var(--faint)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {historyControls}
            <div className="flex items-center gap-2">
              <Link href="/" className="font-serif text-lg text-primary">
                Casa One
              </Link>
              {isDemoMode && (
                <span className="rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-primary">
                  Demo
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SystemHelper role={effectiveRole} pathname={pathname} />
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
          <div className="absolute left-0 right-0 top-full z-50 bg-bg" style={{ borderBottom: '0.5px solid var(--faint)' }}>
            <div className="space-y-4 px-4 py-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block py-2 text-sm font-medium uppercase tracking-[0.08em] transition-colors duration-200 active:opacity-70 ${
                    isActive(link.href) ? 'text-text' : 'text-text-muted'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4" style={{ borderTop: '0.5px solid var(--faint)' }}>
                <p className="mb-3 text-xs text-text-muted">{userName}</p>
                {canSwitch && (
                  <button
                    type="button"
                    onClick={() => {
                      toggleViewMode()
                      setMobileOpen(false)
                    }}
                    className={`mb-3 flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider ${
                      viewingAsSeller ? 'bg-primary/10 text-primary' : 'bg-gold/10 text-gold'
                    }`}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: viewingAsSeller ? 'var(--primary)' : 'var(--gold)' }}
                    />
                    {viewingAsSeller ? 'Mode Seller' : 'Mode Supervisor'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="text-xs font-medium uppercase tracking-[0.08em] text-text-muted transition-colors hover:text-text"
                >
                  {loggingOut ? 'Logging out...' : isDemoMode ? 'Exit demo' : 'Logout'}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}

