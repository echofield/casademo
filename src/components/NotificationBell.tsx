'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { NotificationRow, NotificationType } from '@/lib/types'

type NotificationsPayload = {
  notifications: NotificationRow[]
  unread_count: number
  setup_required?: boolean
  fetch_error?: boolean
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [setupRequired, setSetupRequired] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollFailureCountRef = useRef(0)
  const pollingStoppedRef = useRef(false)

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    pollingStoppedRef.current = true
  }, [])

  const fetchNotifications = useCallback(async (source: 'initial' | 'poll' | 'manual' = 'manual') => {
    if (source === 'poll' && pollingStoppedRef.current) {
      return
    }

    try {
      const res = await fetch('/api/notifications')

      if (res.status === 401) {
        stopPolling()
        setFetchError(true)
        setNotifications([])
        setUnreadCount(0)
        return
      }

      if (!res.ok) {
        throw new Error(`Notification poll failed with status ${res.status}`)
      }

      const data = (await res.json()) as NotificationsPayload

      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
      setSetupRequired(!!data.setup_required)
      setFetchError(false)
      pollFailureCountRef.current = 0
    } catch {
      pollFailureCountRef.current += 1
      setFetchError(true)
      setNotifications([])
      setUnreadCount(0)
      if (pollFailureCountRef.current >= 3) {
        stopPolling()
      }
    } finally {
      setInitialLoad(false)
    }
  }, [stopPolling])

  // Initial fetch + polling fallback (30s)
  useEffect(() => {
    pollingStoppedRef.current = false
    pollFailureCountRef.current = 0

    void fetchNotifications('initial')
    pollIntervalRef.current = setInterval(() => {
      void fetchNotifications('poll')
    }, 30000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      pollingStoppedRef.current = true
    }
  }, [fetchNotifications])

  // Supabase real-time subscription for instant notifications
  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return

      const channel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotif = payload.new as NotificationRow
            setNotifications((prev) => {
              if (prev.some((n) => n.id === newNotif.id)) return prev
              return [newNotif, ...prev].slice(0, 50)
            })
            setUnreadCount((prev) => prev + 1)
          }
        )
        .subscribe()

      channelRef.current = channel
    })

    return () => {
      if (channelRef.current) {
        const supabase = createClient()
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [])

  // Refetch when dropdown opens to ensure fresh data
  useEffect(() => {
    if (isOpen) {
      void fetchNotifications('manual')
    }
  }, [isOpen, fetchNotifications])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAllAsRead = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      })
      const data = await res.json()
      if (data.success === false) {
        // PATCH failed but we got a response; log and show error
        console.warn('[NotificationBell] Mark all read failed:', data.error)
        setFetchError(true)
      } else {
        // Optimistically update UI
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch {
      setFetchError(true)
    }
    setLoading(false)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  }

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'tier_upgrade':
        return (
          <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        )
      case 'big_purchase':
        return (
          <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'client_overdue':
        return (
          <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'seller_inactive':
        return (
          <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-text-muted hover:text-text transition-colors duration-200"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#003D2B] px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-80 border bg-surface shadow-lg"
          style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
        >
          <div
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
          >
            <h3 className="label text-text-muted">Notifications</h3>
            {unreadCount > 0 && !setupRequired && !fetchError && (
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={loading}
                className="text-xs font-medium text-primary transition-colors duration-200 hover:text-primary-soft disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {initialLoad ? (
              <div className="space-y-3 p-4">
                <div className="h-3 w-3/4 animate-pulse rounded bg-bg-soft" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-bg-soft" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-bg-soft" />
              </div>
            ) : setupRequired ? (
              <div className="p-4 text-center">
                <p className="body-small text-text-muted">
                  Notifications need the database migration. Run{' '}
                  <code className="text-xs text-text">005_notifications.sql</code> in Supabase.
                </p>
              </div>
            ) : fetchError ? (
              <div className="p-4 text-center">
                <p className="body-small text-amber-500">Could not load notifications.</p>
                <button
                  type="button"
                  onClick={() => {
                    setFetchError(false)
                    void fetchNotifications('manual')
                  }}
                  className="mt-2 text-xs font-medium uppercase tracking-wider text-primary"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <svg className="w-10 h-10 mx-auto mb-3 text-[#003D2B]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="body-small text-[#003D2B]/40">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className="border-b px-4 py-3 last:border-0"
                  style={
                    !notification.read
                      ? { borderColor: 'rgba(28, 27, 25, 0.06)', backgroundColor: 'rgba(13, 74, 58, 0.06)' }
                      : { borderColor: 'rgba(28, 27, 25, 0.06)' }
                  }
                >
                  {notification.client_id ? (
                    <Link
                      href={`/clients/${notification.client_id}`}
                      onClick={() => setIsOpen(false)}
                      className="block transition-colors duration-200 hover:opacity-85"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getTypeIcon(notification.type)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="table-cell truncate font-medium text-text">{notification.title}</p>
                          {notification.message && (
                            <p className="body-small mt-0.5 truncate text-text-muted">{notification.message}</p>
                          )}
                          <p className="mt-1 text-xs text-text-muted">{formatTime(notification.created_at)}</p>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getTypeIcon(notification.type)}</div>
                      <div className="min-w-0 flex-1">
                        <p className="table-cell truncate font-medium text-text">{notification.title}</p>
                        {notification.message && (
                          <p className="body-small mt-0.5 truncate text-text-muted">{notification.message}</p>
                        )}
                        <p className="mt-1 text-xs text-text-muted">{formatTime(notification.created_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
