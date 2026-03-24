'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { MeetingWithDetails, MeetingUpdate } from '@/lib/types/meetings'
import Link from 'next/link'

interface MeetingCompletionSheetProps {
  meeting: MeetingWithDetails | null
  onClose: () => void
  onSubmit: (meetingId: string, update: MeetingUpdate) => Promise<void>
}

export function MeetingCompletionSheet({
  meeting,
  onClose,
  onSubmit,
}: MeetingCompletionSheetProps) {
  const [purchased, setPurchased] = useState(false)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)

  if (!meeting) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit(meeting.id, {
        status: 'completed',
        outcome_purchased: purchased,
        outcome_notes: notes.trim() || null,
      })
      setCompleted(true)
    } catch (err) {
      console.error('Error completing meeting:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-md bg-[#F7F4EE] rounded-t-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#003D2B]/10 flex items-center justify-between">
          <h2 className="font-serif text-xl text-[#003D2B]">
            {completed ? 'Rendez-vous termine' : 'Marquer comme termine'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#003D2B]/5 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[#003D2B]/60" />
          </button>
        </div>

        {completed ? (
          <div className="p-6 text-center">
            <div className="text-4xl mb-4">
              {purchased ? '' : ''}
            </div>
            <p className="font-serif text-xl text-[#003D2B] mb-2">
              {purchased ? 'Achat enregistre !' : 'Rendez-vous termine'}
            </p>

            {purchased && meeting.client_id && (
              <div className="mt-6">
                <Link
                  href={`/clients/${meeting.client_id}`}
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#003D2B] text-white text-sm tracking-wide uppercase hover:bg-[#004D38] transition-colors"
                >
                  Ajouter l&apos;achat au profil
                </Link>
              </div>
            )}

            <button
              onClick={onClose}
              className="mt-4 text-sm text-[#003D2B]/60 hover:text-[#003D2B]"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Meeting info */}
            <div className="text-center pb-4 border-b border-[#003D2B]/10">
              <p className="text-sm text-[#003D2B]/60 mb-1">{meeting.title}</p>
              {meeting.client_name && (
                <p className="font-serif text-lg text-[#003D2B]">{meeting.client_name}</p>
              )}
            </div>

            {/* Purchased toggle */}
            <div>
              <label className="block text-[#003D2B]/70 text-sm tracking-wide mb-3">
                Le client a-t-il achete ?
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPurchased(true)}
                  className={`
                    flex-1 py-3 text-sm font-medium uppercase tracking-wide transition-all
                    ${purchased
                      ? 'bg-green-600 text-white'
                      : 'bg-white border border-[#003D2B]/10 text-[#003D2B]/60 hover:border-[#003D2B]/30'
                    }
                  `}
                >
                  Oui
                </button>
                <button
                  type="button"
                  onClick={() => setPurchased(false)}
                  className={`
                    flex-1 py-3 text-sm font-medium uppercase tracking-wide transition-all
                    ${!purchased
                      ? 'bg-[#003D2B] text-white'
                      : 'bg-white border border-[#003D2B]/10 text-[#003D2B]/60 hover:border-[#003D2B]/30'
                    }
                  `}
                >
                  Non
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[#003D2B]/70 text-sm tracking-wide mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="
                  w-full px-3 py-3
                  bg-white border border-[#003D2B]/10
                  text-[#003D2B] text-sm rounded resize-none
                  placeholder:text-[#003D2B]/30
                  focus:outline-none focus:border-[#003D2B]/30
                "
                placeholder="Qu'est-ce qui s'est passe ? Produits essayes ?"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full py-4
                bg-[#003D2B] border border-[#003D2B]
                text-white text-sm tracking-[0.15em] uppercase
                hover:bg-[#004D38]
                focus:outline-none focus:ring-2 focus:ring-[#003D2B]/50
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {loading ? 'Enregistrement...' : 'Valider'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
