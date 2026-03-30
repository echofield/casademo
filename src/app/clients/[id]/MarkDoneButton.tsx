'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check } from 'lucide-react'

interface MarkDoneButtonProps {
  clientId: string
  clientName: string
}

export function MarkDoneButton({ clientId, clientName }: MarkDoneButtonProps) {
  const router = useRouter()
  const [isRefreshing, startRefreshTransition] = useTransition()
  const [loading, setLoading] = useState(false)
  const [doneLocked, setDoneLocked] = useState(false)
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  const scheduleRefresh = (delayMs = 200) => {
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

  const handleMarkDone = async () => {
    if (doneLocked) return
    setLoading(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'other',
          comment: 'Follow-up completed',
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to mark as done')
      }

      const payload = await res.json().catch(() => ({}))
      setDoneLocked(true)
      toast.success(payload?.already_done ? `${clientName} already marked done today` : `Follow-up done for ${clientName}`)
      scheduleRefresh()
    } catch (err) {
      toast.error('Could not mark as done')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleMarkDone}
      disabled={loading || doneLocked || isRefreshing}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
    >
      <Check className="h-4 w-4" />
      {doneLocked ? 'Done' : loading ? 'Marking...' : 'Mark as done'}
    </button>
  )
}