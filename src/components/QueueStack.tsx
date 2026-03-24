'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FocusedClientCard } from './FocusedClientCard'
import { transitions } from '@/lib/motion'
import type { ClientTier, ClientSignal, InterestItem } from '@/lib/types'

type QueueFilter = 'all' | 'overdue' | 'today' | 'upcoming'

interface QueueClient {
  id: string
  first_name: string
  last_name: string
  tier: ClientTier
  phone: string | null
  total_spend: number
  days_overdue: number | null
  seller_id: string
  seller_name: string
  lastContactLabel: string
  nextContactLabel: string
  seller_signal?: ClientSignal | null
  signal_note?: string | null
  interests?: InterestItem[] | null
  locale?: string | null
}

interface Props {
  clients: QueueClient[]
  overdueCount: number
  totalCount: number
  userRole?: 'seller' | 'supervisor'
  currentUserId?: string
  filter?: QueueFilter
}

function getClientStatus(daysOverdue: number | null): QueueFilter {
  if (daysOverdue === null) return 'upcoming'
  if (daysOverdue > 0) return 'overdue'
  if (daysOverdue === 0) return 'today'
  return 'upcoming'
}

export function QueueStack({ clients, overdueCount, totalCount, userRole = 'seller', currentUserId, filter = 'all' }: Props) {
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
  const progressPct = ((currentIndex + 1) / clients.length) * 100

  return (
    <div>
      <p className="label mb-3 text-text-muted">Focus queue</p>
      <div className="mb-6">
        <h1 className="mb-2 font-serif text-3xl tracking-tight text-text md:text-4xl">
          {overdueCount > 0 ? (
            <><span className="text-danger">{overdueCount}</span> need attention now</>
          ) : (
            <>{totalCount} in the queue</>
          )}
        </h1>
        <p className="body-small text-text-muted">
          Client {currentIndex + 1} of {clients.length}
          {remaining > 0 && ` . ${remaining} after this`}
        </p>
        <div className="mt-4 h-1 w-full overflow-hidden bg-bg-soft" style={{ borderRadius: 1 }} role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={clients.length}>
          <div className="h-full bg-primary transition-all duration-300 ease-out" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {filter !== 'all' && (
        <div className="mb-4 flex gap-2">
          {(['all', 'overdue', 'today', 'upcoming'] as QueueFilter[]).map((f) => {
            const count = f === 'all' ? clients.length : clients.filter(c => getClientStatus(c.days_overdue) === f).length
            const isActive = f === filter
            return (
              <a key={f} href={f === 'all' ? '/queue' : `/queue?status=${f}`} className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${isActive ? 'bg-primary text-white' : 'bg-bg-soft text-text-muted hover:text-text'}`}>
                {f === 'all' ? 'All' : f === 'overdue' ? 'Overdue' : f === 'today' ? 'Today' : 'Upcoming'}
                <span className="ml-1 opacity-60">{count}</span>
              </a>
            )
          })}
        </div>
      )}

      <p className="label mb-3 text-text-muted">Now</p>

      <AnimatePresence mode="wait">
        <motion.div key={current.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={transitions.enter}>
          <FocusedClientCard client={current} userRole={userRole} currentUserId={currentUserId} />
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-between">
        <button type="button" onClick={goPrev} disabled={currentIndex === 0} className="label px-2 py-2 text-text-muted transition-colors duration-200 hover:text-text disabled:opacity-30">Previous</button>
        <div className="flex gap-1">
          {clients.slice(0, 10).map((_, idx) => (
            <button key={idx} onClick={() => setCurrentIndex(idx)} className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-primary' : 'bg-text/10'}`} />
          ))}
          {clients.length > 10 && <span className="text-xs text-text-muted ml-1">+{clients.length - 10}</span>}
        </div>
        <button type="button" onClick={goNext} disabled={currentIndex >= clients.length - 1} className="label px-2 py-2 text-text-muted transition-colors duration-200 hover:text-text disabled:opacity-30">Next</button>
      </div>

      {nextClients.length > 0 && (
        <div className="mt-10 border-t pt-8" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
          <p className="label mb-4 text-text-muted">Coming up</p>
          <div className="space-y-1">
            {nextClients.map((client) => {
              const isOverdue = (client.days_overdue ?? 0) > 0
              return (
                <button type="button" key={client.id} onClick={() => setCurrentIndex(clients.indexOf(client))} className="w-full py-3 text-left transition-colors duration-200 hover:bg-bg-soft">
                  <span className="body text-text">{client.first_name} {client.last_name}</span>
                  {isOverdue && <span className="body-small ml-2 text-danger">+{client.days_overdue}d</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-text-muted">Arrow keys . j / k</p>
    </div>
  )
}