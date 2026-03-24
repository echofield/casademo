'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  clientId: string
  initialNotes: string | null
  canEdit: boolean
}

export function ClientLifeNotes({ clientId, initialNotes, canEdit }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(initialNotes || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ life_notes: notes.trim() || null }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setEditing(false)
      router.refresh()
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  if (!canEdit && !initialNotes) return null

  return (
    <div className="mt-4 border-t pt-4" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
      <p className="label mb-2 text-text-muted">PERSONAL NOTES</p>
      {editing ? (
        <div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-field h-24 w-full resize-none"
            placeholder="Vintage watch collector. Goes to Japan 2x per year. F1 fan..."
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="label px-3 py-1.5 bg-primary text-white text-xs"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setNotes(initialNotes || '') }}
              className="label px-3 py-1.5 text-text-muted text-xs hover:text-text"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          {initialNotes ? (
            <p className="body-small text-text-muted italic whitespace-pre-wrap">&ldquo;{initialNotes}&rdquo;</p>
          ) : null}
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="label mt-2 text-primary text-xs hover:text-primary-soft"
            >
              {initialNotes ? 'Edit notes' : '+ Add life notes'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
