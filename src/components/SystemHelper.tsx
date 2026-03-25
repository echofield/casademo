'use client'

import { useMemo, useRef, useState, useEffect } from 'react'

type Role = 'seller' | 'supervisor'

interface SystemHelperProps {
  role: Role
  pathname: string
}

interface SystemContext {
  what: string
  actions: string[]
  tip?: string
}

function getPageKey(pathname: string): 'clients' | 'client_detail' | 'queue' | 'dashboard' | 'team' | 'notifications' | 'calendar' | 'other' {
  if (pathname.startsWith('/clients/')) return 'client_detail'
  if (pathname.startsWith('/clients')) return 'clients'
  if (pathname.startsWith('/queue')) return 'queue'
  if (pathname.startsWith('/dashboard')) return 'dashboard'
  if (pathname.startsWith('/team')) return 'team'
  if (pathname.startsWith('/calendar')) return 'calendar'
  if (pathname.startsWith('/notifications')) return 'notifications'
  return 'other'
}

function getContext(role: Role, pathname: string): SystemContext {
  const page = getPageKey(pathname)

  if (page === 'clients') {
    return role === 'supervisor'
      ? {
          what: 'You are managing client distribution.',
          actions: [
            'Assign clients to sellers',
            'Open priority clients from notifications',
            'Balance workload across sellers',
          ],
          tip: 'Visibility of ownership reduces response delay.',
        }
      : {
          what: 'You are managing your client portfolio.',
          actions: [
            'Open a client and act now',
            'Use notifications to prioritize',
            'Track recent interactions before outreach',
          ],
          tip: 'Recent activity usually signals better conversion timing.',
        }
  }

  if (page === 'client_detail') {
    return role === 'supervisor'
      ? {
          what: 'You are reviewing one client memory surface.',
          actions: [
            'Confirm assigned seller',
            'Align profile quality and next step',
            'Trigger a seller reminder if needed',
          ],
          tip: 'Keep notes clean and action-oriented.',
        }
      : {
          what: 'You are operating one client profile.',
          actions: [
            'Review context before outreach',
            'Log contact and update affinity signals',
            'Set the next follow-up clearly',
          ],
          tip: 'Fast updates keep the profile reliable.',
        }
  }

  if (page === 'queue') {
    return {
      what: 'This queue is your action engine.',
      actions: [
        'Start with highest overdue clients',
        'Log contact immediately after action',
        'Mark done only when follow-up is set',
      ],
      tip: 'Speed of execution compounds.',
    }
  }

  if (page === 'dashboard') {
    return role === 'supervisor'
      ? {
          what: 'You are monitoring team and portfolio momentum.',
          actions: [
            'Use tier and seller segmentation controls',
            'Identify inactivity and overdue risk',
            'Trigger targeted notifications',
          ],
          tip: 'Operational clarity beats analytics overload.',
        }
      : {
          what: 'You are viewing portfolio performance.',
          actions: [
            'Check priority signals',
            'Return to queue for execution',
            'Focus on current high-value opportunities',
          ],
        }
  }

  if (page === 'team') {
    return {
      what: 'You are managing seller execution quality.',
      actions: [
        'Review workload and activity rhythm',
        'Spot blockers early',
        'Rebalance ownership when needed',
      ],
      tip: 'Balanced distribution improves response time.',
    }
  }

  if (page === 'calendar') {
    return {
      what: 'This calendar aligns execution with timing.',
      actions: [
        'Review today and upcoming meetings',
        'Open client before each appointment',
        'Log outcomes right after interaction',
      ],
    }
  }

  if (page === 'notifications') {
    return {
      what: 'Notifications are direct action triggers.',
      actions: [
        'Open the linked client',
        'Act now and update status',
        'Clear only after handling',
      ],
      tip: 'Fast response protects conversion.',
    }
  }

  return {
    what: 'This screen supports your daily operating flow.',
    actions: [
      'Identify the next concrete action',
      'Update client memory after each interaction',
      'Use notifications to stay in rhythm',
    ],
  }
}

export function SystemHelper({ role, pathname }: SystemHelperProps) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [statusLine, setStatusLine] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const context = useMemo(() => getContext(role, pathname), [role, pathname])

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname, role])

  useEffect(() => {
    if (!open) return
    const pageText = document.body?.innerText || ''
    if (pathname.startsWith('/clients') && pageText.includes('No clients match your filters')) {
      setStatusLine('No clients visible yet — assign or import to activate this flow.')
      return
    }
    if (pageText.includes('No notifications yet')) {
      setStatusLine('No active alerts right now.')
      return
    }
    if (role === 'supervisor' && pageText.includes('Team is up to date')) {
      setStatusLine('No pending action right now — system is in a calm state.')
      return
    }
    setStatusLine(null)
  }, [open, pathname, role])

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="System"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative p-2 text-text-muted hover:text-text transition-colors duration-150"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="4.5" y="4.5" width="15" height="15" rx="1.5" strokeWidth="1.2" />
          <path d="M8 9.5H16" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M8 12.5H14" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M8 15.5H12" strokeWidth="1.2" strokeLinecap="round" />
        </svg>

        {hovered && !open && (
          <div
            className="absolute right-0 top-full mt-2 px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-text-muted border bg-surface"
            style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
          >
            System
          </div>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[320px] border bg-surface p-4 shadow-sm z-50"
          style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
        >
          <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted mb-3">System</p>
          <p className="text-sm text-text mb-3">{context.what}</p>
          <div className="space-y-1.5">
            {context.actions.slice(0, 3).map((action) => (
              <p key={action} className="text-xs text-text-muted">
                • {action}
              </p>
            ))}
          </div>
          {context.tip && (
            <p className="text-xs text-text-muted mt-3 pt-3" style={{ borderTop: '0.5px solid var(--faint)' }}>
              Tip: {context.tip}
            </p>
          )}
          {statusLine && (
            <p className="text-xs text-text-muted mt-2">{statusLine}</p>
          )}
        </div>
      )}
    </div>
  )
}
