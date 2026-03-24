'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SignalBadge, SignalSetter } from '@/components'
import type { ClientSignal } from '@/lib/types'

interface ClientSignalSectionProps {
  clientId: string
  clientName: string
  currentSignal: ClientSignal | null
  signalNote: string | null
  signalUpdatedAt: string | null
  canEdit: boolean
}

export function ClientSignalSection({
  clientId,
  clientName,
  currentSignal,
  signalNote,
  signalUpdatedAt,
  canEdit,
}: ClientSignalSectionProps) {
  const router = useRouter()
  const [showSetter, setShowSetter] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignalSubmit = async (signal: ClientSignal, note: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_signal: signal,
          signal_note: note || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update signal')
      }

      // Refresh the page to show updated data
      router.refresh()
    } catch (err) {
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Format relative time
  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return null

    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "aujourd'hui"
    if (diffDays === 1) return 'hier'
    if (diffDays < 7) return `il y a ${diffDays} jours`
    if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`
    return `il y a ${Math.floor(diffDays / 30)} mois`
  }

  return (
    <div className="flex items-center gap-3">
      <SignalBadge
        signal={currentSignal}
        size="md"
        onClick={canEdit ? () => setShowSetter(true) : undefined}
      />
      {signalNote && (
        <p className="text-xs text-text-muted italic max-w-xs truncate" title={signalNote}>
          "{signalNote}"
        </p>
      )}
      {signalUpdatedAt && (
        <span className="text-xs text-text-muted/60">
          Maj {formatRelativeTime(signalUpdatedAt)}
        </span>
      )}

      {canEdit && (
        <SignalSetter
          isOpen={showSetter}
          onClose={() => setShowSetter(false)}
          clientName={clientName}
          currentSignal={currentSignal}
          currentNote={signalNote}
          onSubmit={handleSignalSubmit}
        />
      )}
    </div>
  )
}
