'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check } from 'lucide-react'

interface MarkDoneButtonProps {
  clientId: string
  clientName: string
}

export function MarkDoneButton({ clientId, clientName }: MarkDoneButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleMarkDone = async () => {
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

      toast.success(`Follow-up done for ${clientName}`)
      router.refresh()
    } catch (err) {
      toast.error('Could not mark as done')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleMarkDone}
      disabled={loading}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
    >
      <Check className="h-4 w-4" />
      {loading ? 'Marking...' : 'Mark as done'}
    </button>
  )
}
