'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FocusedClientCard } from './FocusedClientCard'
import { transitions } from '@/lib/motion'
import type { ClientTier } from '@/lib/types'

interface QueueClient {
  id: string
  first_name: string
  last_name: string
  tier: ClientTier
  phone: string | null
  total_spend: number
  days_overdue: number | null
  lastContactLabel: string
  nextContactLabel: string
}

interface Props {
  clients: QueueClient[]
  overdueCount: number
  totalCount: number
}

export function QueueStack({ clients, overdueCount, totalCount }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goNext = useCallback(() => {
    if (currentIndex < clients.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }, [currentIndex, clients.length])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }, [currentIndex])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'j') {
        goNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'k') {
        goPrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goNext, goPrev])

  if (clients.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-serif text-2xl text-text mb-2">All caught up</p>
        <p className="text-text-muted">No clients need attention right now</p>
      </div>
    )
  }

  const current = clients[currentIndex]
  const remaining = clients.length - currentIndex - 1
  const nextClients = clients.slice(currentIndex + 1, currentIndex + 4)

  return (
    <div>
      {/* Headline */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl text-text tracking-tight mb-2">
          {overdueCount > 0 ? (
            <>
              <span className="text-danger">{overdueCount}</span> clients need attention
            </>
          ) : (
            <>{totalCount} clients to contact</>
          )}
        </h1>
        <p className="text-text-muted">
          {currentIndex + 1} of {clients.length}
          {remaining > 0 && ` · ${remaining} remaining`}
        </p>
      </div>

      {/* Current client card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={transitions.enter}
        >
          <FocusedClientCard client={current} />
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="px-4 py-2 text-sm text-text-muted disabled:opacity-30 transition-opacity hover:text-text"
        >
          Previous
        </button>

        <div className="flex gap-1">
          {clients.slice(0, 10).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentIndex ? 'bg-primary' : 'bg-text/10'
              }`}
            />
          ))}
          {clients.length > 10 && (
            <span className="text-xs text-text-muted ml-1">+{clients.length - 10}</span>
          )}
        </div>

        <button
          onClick={goNext}
          disabled={currentIndex >= clients.length - 1}
          className="px-4 py-2 text-sm text-text-muted disabled:opacity-30 transition-opacity hover:text-text"
        >
          Next
        </button>
      </div>

      {/* Preview of next clients */}
      {nextClients.length > 0 && (
        <div className="mt-10 pt-8 border-t border-text/5">
          <p className="text-xs uppercase tracking-wider text-text-muted mb-4">Coming up</p>
          <div className="space-y-2">
            {nextClients.map((client) => {
              const isOverdue = (client.days_overdue ?? 0) > 0
              return (
                <button
                  key={client.id}
                  onClick={() => setCurrentIndex(clients.indexOf(client))}
                  className="w-full text-left py-3 px-4 -mx-4 hover:bg-text/3 transition-colors"
                >
                  <span className="text-text">
                    {client.first_name} {client.last_name}
                  </span>
                  {isOverdue && (
                    <span className="text-danger text-sm ml-2">
                      +{client.days_overdue}d
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Keyboard hint */}
      <p className="text-center text-xs text-text-muted/50 mt-8">
        Use arrow keys to navigate
      </p>
    </div>
  )
}
