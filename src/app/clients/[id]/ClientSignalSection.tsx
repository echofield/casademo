'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
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
  const [, startRefreshTransition] = useTransition()
  const [showSetter, setShowSetter] = useState(false)
  const [saving, setSaving] = useState(false)
  const [signalState, setSignalState] = useState<ClientSignal | null>(currentSignal)
  const [signalNoteState, setSignalNoteState] = useState<string | null>(signalNote)
  const [signalUpdatedAtState, setSignalUpdatedAtState] = useState<string | null>(signalUpdatedAt)
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setSignalState(currentSignal)
    setSignalNoteState(signalNote)
    setSignalUpdatedAtState(signalUpdatedAt)
  }, [currentSignal, signalNote, signalUpdatedAt])

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  const scheduleRefresh = (delayMs = 500) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    refreshTimeoutRef.current = setTimeout(() => {
      startRefreshTransition(() => {
        router.refresh()
      })
      refreshTimeoutRef.current = null
    }, delayMs)
  }

  const handleSignalSubmit = async (signal: ClientSignal, note: string) => {
    if (saving) return

    setSaving(true)
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

      const normalizedNote = note.trim() || null
      setSignalState(signal)
      setSignalNoteState(normalizedNote)
      setSignalUpdatedAtState(new Date().toISOString())
      setShowSetter(false)
      scheduleRefresh()
    } catch (err) {
      throw err
    } finally {
      setSaving(false)
    }
  }

  // Format relative time
  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return null

    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  return (
    <div className="flex items-center gap-3">
      <SignalBadge
        signal={signalState}
        size="md"
        onClick={canEdit ? () => setShowSetter(true) : undefined}
      />
      {signalNoteState && (
        <p className="max-w-xs truncate text-xs italic text-text-muted" title={signalNoteState}>
          "{signalNoteState}"
        </p>
      )}
      {signalUpdatedAtState && (
        <span className="text-xs text-text-muted/60">
          Maj {formatRelativeTime(signalUpdatedAtState)}
        </span>
      )}

      {canEdit && (
        <SignalSetter
          isOpen={showSetter}
          onClose={() => setShowSetter(false)}
          clientName={clientName}
          currentSignal={signalState}
          currentNote={signalNoteState}
          onSubmit={handleSignalSubmit}
        />
      )}
    </div>
  )
}
