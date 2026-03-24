'use client'

/**
 * InsightCapture - Miroir-style reflection capture
 * Allows learners to capture insights with reflective prompts
 * Casa One aesthetic: minimal modal, warm colors, calm interaction
 */

import { useState, useCallback } from 'react'
import { durations } from '@/lib/motion'

interface InsightCaptureProps {
  moduleId?: string
  onCapture?: (insight: string) => void
  className?: string
}

const REFLECTIVE_PROMPTS = [
  "What did you understand differently today?",
  "What connection did you make with your work?",
  "What surprised you in this module?",
  "How will you apply this tomorrow?",
  "What question remains unanswered?",
  "What deserves to be explored further?",
]

function getPromptOfDay(): string {
  const dayIndex = Math.floor(Date.now() / 86400000) % REFLECTIVE_PROMPTS.length
  return REFLECTIVE_PROMPTS[dayIndex]
}

export function InsightCapture({ moduleId, onCapture, className = '' }: InsightCaptureProps) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const prompt = getPromptOfDay()

  const handleOpen = useCallback(() => {
    setOpen(true)
    setContent('')
    setSaved(false)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    setContent('')
    setSaved(false)
  }, [])

  const handleSave = useCallback(async () => {
    if (!content.trim() || saving) return

    setSaving(true)

    // Simulate save (replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, durations.measured))

    onCapture?.(content.trim())
    setSaved(true)
    setSaving(false)

    // Auto-close after success
    setTimeout(() => {
      handleClose()
    }, durations.contemplative)
  }, [content, saving, onCapture, handleClose])

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className={`text-xs tracking-wider text-text-muted underline underline-offset-2 opacity-60 hover:opacity-100 transition-opacity duration-200 ${className}`}
      >
        Capture an insight
      </button>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(28, 27, 25, 0.15)' }}
      onClick={handleClose}
    >
      <div
        className="bg-surface p-8 max-w-md w-full shadow-card animate-fade-in"
        style={{ border: '1px solid rgba(28, 27, 25, 0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-serif text-xl text-text mb-3">Capture an insight</h3>

        <p className="font-serif text-sm italic text-text-muted mb-4" style={{ lineHeight: 1.5 }}>
          {prompt}
        </p>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What I learned..."
          disabled={saved || saving}
          rows={4}
          className="w-full p-3 text-sm font-serif resize-none focus:outline-none focus:border-primary transition-colors duration-200"
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            border: '1px solid rgba(28, 27, 25, 0.12)',
            color: '#1C1B19',
          }}
        />

        {moduleId && (
          <p className="text-[10px] text-text-muted mt-2 tracking-wide">
            Module: {moduleId}
          </p>
        )}

        <div className="flex gap-3 justify-end mt-5">
          <button
            onClick={handleClose}
            disabled={saving}
            className="text-xs tracking-wider text-text-muted px-4 py-2 hover:text-text transition-colors duration-200"
          >
            Not now
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim() || saved || saving}
            className="text-xs tracking-wider px-4 py-2 transition-all duration-200"
            style={{
              border: '1px solid rgba(13, 74, 58, 0.3)',
              color: saved ? '#2F6B4F' : '#0D4A3A',
              background: saved ? 'rgba(47, 107, 79, 0.08)' : 'transparent',
              opacity: content.trim() && !saving ? 1 : 0.5,
              cursor: content.trim() && !saving ? 'pointer' : 'default',
            }}
          >
            {saving ? '...' : saved ? 'Saved' : 'Capture'}
          </button>
        </div>
      </div>
    </div>
  )
}
