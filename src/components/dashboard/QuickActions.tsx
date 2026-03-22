'use client'

/**
 * QuickActions - Action buttons panel
 * EdTech/Arché style: subtle, instrument-like
 */

import Link from 'next/link'
import { Users, Bell } from 'lucide-react'

interface QuickActionsProps {
  className?: string
}

const actions = [
  { icon: Bell, label: 'Notifications', href: '/notifications', color: '#A38767' },
  { icon: Users, label: 'View team', href: '/team', color: '#1B4332' },
]

export function QuickActions({ className = '' }: QuickActionsProps) {
  return (
    <div
      className={`p-5 relative ${className}`}
      style={{
        background: 'var(--paper)',
        border: '0.5px solid var(--faint)',
        borderRadius: '2px',
      }}
    >
      <span className="label text-text-muted mb-4 block">QUICK ACTIONS</span>

      <div className="space-y-2">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 p-3 transition-all duration-200 group hover:-translate-y-0.5"
            style={{
              border: '0.5px solid var(--faint)',
              borderRadius: '2px',
            }}
          >
            <div
              className="w-8 h-8 flex items-center justify-center transition-colors duration-200"
              style={{
                backgroundColor: `${action.color}08`,
                borderRadius: '2px',
              }}
            >
              <action.icon
                className="w-4 h-4 transition-colors duration-200"
                style={{ color: action.color }}
                strokeWidth={1.5}
              />
            </div>
            <span className="text-sm text-text-soft group-hover:text-text transition-colors duration-200">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
