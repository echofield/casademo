'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

type RouteWarmupProps = {
  effectiveRole: 'seller' | 'supervisor'
}

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

export function RouteWarmup({ effectiveRole }: RouteWarmupProps) {
  const router = useRouter()

  useEffect(() => {
    const idleWindow = window as IdleWindow
    let cancelled = false
    const routes = effectiveRole === 'supervisor'
      ? ['/', '/queue', '/clients', '/calendar', '/dashboard', '/team']
      : ['/', '/queue', '/clients', '/calendar']

    const runWarmup = () => {
      routes.forEach((route, index) => {
        window.setTimeout(() => {
          if (!cancelled) {
            router.prefetch(route)
          }
        }, index * 120)
      })

      fetch('/api/notifications?limit=5', { credentials: 'include' }).catch(() => {})
      fetch('/api/contacts/recent', { credentials: 'include' }).catch(() => {})
    }

    if (typeof idleWindow.requestIdleCallback === 'function') {
      const idleId = idleWindow.requestIdleCallback(runWarmup, { timeout: 900 })
      return () => {
        cancelled = true
        if (typeof idleWindow.cancelIdleCallback === 'function') {
          idleWindow.cancelIdleCallback(idleId)
        }
      }
    }

    const timeoutId = window.setTimeout(runWarmup, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [effectiveRole, router])

  return null
}
