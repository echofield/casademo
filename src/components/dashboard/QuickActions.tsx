'use client'

/**
 * QuickActions - Action buttons panel
 * EdTech/Arché style: subtle, instrument-like
 */

import Link from 'next/link'
import { FileText, Users, Bell, Calendar } from 'lucide-react'

interface QuickActionsProps {
  className?: string
}

const actions = [
  { icon: FileText, label: 'Générer rapport', href: '#', color: '#0D4A3A' },
  { icon: Users, label: 'Voir équipe', href: '/clients', color: '#2F6B4F' },
  { icon: Bell, label: 'Notifications', href: '#', color: '#A48763' },
  { icon: Calendar, label: 'Planning', href: '/queue', color: '#6E685F' },
]

export function QuickActions({ className = '' }: QuickActionsProps) {
  return (
    <div
      className={`p-5 ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(252,250,246,0.98) 0%, rgba(247,244,238,0.95) 100%)',
        border: '1px solid rgba(28, 27, 25, 0.06)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <span className="label text-text-muted mb-4 block">ACTIONS RAPIDES</span>

      <div className="space-y-2">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 p-3 transition-all duration-200 hover:bg-bg-soft group"
            style={{ border: '1px solid rgba(28, 27, 25, 0.04)' }}
          >
            <div
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-200"
              style={{ backgroundColor: `${action.color}08` }}
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
