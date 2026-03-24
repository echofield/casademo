'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { ClientSignal, SIGNAL_CONFIG, SIGNAL_ORDER } from '@/lib/types/signal'
import { SignalDiamond } from './SignalDiamond'

interface SignalSetterProps {
  isOpen: boolean
  onClose: () => void
  clientName: string
  currentSignal: ClientSignal | null
  currentNote?: string | null
  onSubmit: (signal: ClientSignal, note: string) => Promise<void>
}

/**
 * SignalSetter — Bottom sheet for setting client signal
 *
 * Shows 5 radio options with diamond glyph, label, and description.
 * Optional note field for context.
 */
export function SignalSetter({
  isOpen,
  onClose,
  clientName,
  currentSignal,
  currentNote,
  onSubmit,
}: SignalSetterProps) {
  const [selectedSignal, setSelectedSignal] = useState<ClientSignal | null>(currentSignal)
  const [note, setNote] = useState(currentNote || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedSignal(currentSignal)
      setNote(currentNote || '')
      setError(null)
    }
  }, [isOpen, currentSignal, currentNote])

  const handleSubmit = async () => {
    if (!selectedSignal) {
      setError('Please select a signal')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onSubmit(selectedSignal, note)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-surface border-t border-[#003D2B]/10 rounded-t-2xl max-h-[85vh] overflow-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-[#003D2B]/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl text-text">Client signal</h2>
            <p className="text-sm text-text-muted">{clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#003D2B]/5 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Signal options */}
        <div className="px-6 py-4 space-y-2">
          {SIGNAL_ORDER.map((signal) => {
            const config = SIGNAL_CONFIG[signal]
            const isSelected = selectedSignal === signal

            return (
              <button
                key={signal}
                type="button"
                onClick={() => setSelectedSignal(signal)}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-lg border transition-all
                  ${isSelected
                    ? `${config.bgClass} ${config.borderClass} border-2`
                    : 'bg-surface border-[#003D2B]/10 hover:bg-bg-soft'
                  }
                `}
              >
                {/* Radio indicator */}
                <div className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  ${isSelected ? 'border-[#003D2B] bg-[#003D2B]' : 'border-[#003D2B]/30'}
                `}>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>

                {/* Diamond glyph */}
                <SignalDiamond signal={signal} size={20} />

                {/* Label and description */}
                <div className="flex-1 text-left">
                  <p className={`font-medium ${isSelected ? config.textClass : 'text-text'}`}>
                    {config.label}
                  </p>
                  <p className="text-sm text-text-muted">
                    {config.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Note field */}
        <div className="px-6 py-4 border-t border-[#003D2B]/10">
          <label className="block text-xs font-medium uppercase tracking-wide text-text-muted mb-2">
            Note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why this signal? (e.g. 'Tried 3 jackets, coming back Friday')"
            rows={2}
            className="w-full px-3 py-2 border border-[#003D2B]/20 rounded bg-surface text-text placeholder:text-text-muted/50 focus:outline-none focus:border-[#003D2B]/40 resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 pb-2">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit button */}
        <div className="px-6 py-4 border-t border-[#003D2B]/10">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !selectedSignal}
            className="w-full py-3 bg-[#003D2B] text-white text-sm font-medium uppercase tracking-wide hover:bg-[#004D38] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </>
  )
}
