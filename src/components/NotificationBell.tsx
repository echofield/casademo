'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { NotificationRow, NotificationType } from '@/lib/types'

type NotificationsPayload = {
  notifications: NotificationRow[]
  unread_count: number
  setup_required?: boolean
  fetch_error?: boolean
}

// Mock notifications for demo
const DEMO_NOTIFICATIONS: NotificationRow[] = [
  {
    id: 'demo-1',
    user_id: 'demo',
    type: 'client_overdue',
    title: 'Follow up: Marc Dubois',
    message: 'This client is 5 days overdue. Please contact today.',
    client_id: null,
    read: false,
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
  },
  {
    id: 'demo-2',
    user_id: 'demo',
    type: 'client_overdue',
    title: 'Urgent: Sophie Laurent',
    message: 'Grand Prix client - 12 days overdue!',
    client_id: null,
    read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: 'demo-3',
    user_id: 'demo',
    type: 'manual',
    title: 'Reminder from Hicham',
    message: 'Please prioritize your overdue clients today.',
    client_id: null,
    read: false,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
  },
  {
    id: 'demo-4',
    user_id: 'demo',
    type: 'tier_upgrade',
    title: 'Jean-Pierre Martin upgraded to Kaizen',
    message: 'Total spend: €3,500',
    client_id: null,
    read: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    id: 'demo-5',
    user_id: 'demo',
    type: 'big_purchase',
    title: 'Big purchase: €5,200',
    message: 'Claire Moreau - Tennis Club Printed Silk Shirt',
    client_id: null,
    read: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
]

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [setupRequired, setSetupRequired] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) {
        // Use demo notifications as fallback
        setNotifications(DEMO_NOTIFICATIONS)
        setUnreadCount(DEMO_NOTIFICATIONS.filter(n => !n.read).length)
        setInitialLoad(false)
        return
      }
      const data = (await res.json()) as NotificationsPayload

      // If no real notifications, use demo data
      if (!data.notifications || data.notifications.length === 0) {
        setNotifications(DEMO_NOTIFICATIONS)
        setUnreadCount(DEMO_NOTIFICATIONS.filter(n => !n.read).length)
      } else {
        setNotifications(data.notifications)
        setUnreadCount(data.unread_count || 0)
      }
      setSetupRequired(!!data.setup_required)
      setFetchError(false)
    } catch {
      // Use demo notifications on error
      setNotifications(DEMO_NOTIFICATIONS)
      setUnreadCount(DEMO_NOTIFICATIONS.filter(n => !n.read).length)
    } finally {
      setInitialLoad(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

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
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
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
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
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
          <svg className="w-4 h-4 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
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
                <p className="body-small text-danger">Could not load notifications.</p>
                <button
                  type="button"
                  onClick={() => {
                    setFetchError(false)
                    fetchNotifications()
                  }}
                  className="mt-2 text-xs font-medium uppercase tracking-wider text-primary"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <p className="body-small text-text-muted">You&apos;re all caught up.</p>
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
