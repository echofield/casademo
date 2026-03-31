'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FocusedClientCard } from './FocusedClientCard'
import { transitions } from '@/lib/motion'
import type { ClientTier, ClientSignal, InterestItem } from '@/lib/types'
import {
  HIGH_SPEND_THRESHOLD,
  matchesFocusContactFilter,
  matchesFocusSignalBucket,
  matchesFocusValueFilter,
  sortClientsForFocus,
  type FocusContactFilter,
  type FocusSignalBucket,
  type FocusValueFilter,
  type QueueMode,
} from '@/lib/queueFocus'

type QueueFilter = 'all' | 'overdue' | 'today' | 'upcoming'

interface QueueClient {
  id: string
  first_name: string
  last_name: string
  tier: ClientTier
  phone: string | null
  total_spend: number
  days_overdue: number | null
  last_contact_date?: string | null
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
  remainingWorkloadCount?: number
}

function getClientStatus(daysOverdue: number | null): QueueFilter {
  if (daysOverdue === null) return 'upcoming'
  if (daysOverdue > 0) return 'overdue'
  if (daysOverdue === 0) return 'today'
  return 'upcoming'
}

export function QueueStack({
  clients,
  overdueCount,
  totalCount,
  userRole = 'seller',
  currentUserId,
  filter = 'all',
  remainingWorkloadCount,
}: Props) {
  const [sourceClients, setSourceClients] = useState(clients)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [liveRemainingCount, setLiveRemainingCount] = useState(
    remainingWorkloadCount ?? clients.length
  )
  const [queueMode, setQueueMode] = useState<QueueMode>('all')
  const [signalBucket, setSignalBucket] = useState<FocusSignalBucket>('all')
  const [valueFilter, setValueFilter] = useState<FocusValueFilter>('all')
  const [contactFilter, setContactFilter] = useState<FocusContactFilter>('phone_ready')
  const activeClientIdRef = useRef<string | null>(clients[0]?.id ?? null)

  const filteredClients = sourceClients.filter((client) => {
    if (queueMode !== 'focus') return true

    return matchesFocusSignalBucket(client.seller_signal ?? null, signalBucket)
      && matchesFocusValueFilter(client.total_spend || 0, valueFilter)
      && matchesFocusContactFilter(client.phone, contactFilter)
  })

  const queueClients = queueMode === 'focus'
    ? sortClientsForFocus(filteredClients)
    : filteredClients

  useEffect(() => {
    activeClientIdRef.current = queueClients[currentIndex]?.id ?? null
  }, [queueClients, currentIndex])

  useEffect(() => {
    setSourceClients(clients)
    setLiveRemainingCount(remainingWorkloadCount ?? clients.length)
  }, [clients, remainingWorkloadCount])

  useEffect(() => {
    if (queueClients.length === 0) {
      setCurrentIndex(0)
      return
    }

    const activeClientId = activeClientIdRef.current
    if (!activeClientId) {
      setCurrentIndex((currentValue) => Math.min(currentValue, queueClients.length - 1))
      return
    }

    const nextIndex = queueClients.findIndex((client) => client.id === activeClientId)
    if (nextIndex >= 0) {
      setCurrentIndex(nextIndex)
      return
    }

    setCurrentIndex((currentValue) => Math.min(currentValue, queueClients.length - 1))
  }, [queueClients])

  const goNext = useCallback(() => {
    if (currentIndex < queueClients.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }, [currentIndex, queueClients.length])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
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

  const renderModeSwitch = () => (
    <div className="mb-4 flex gap-2">
      {(['all', 'focus'] as QueueMode[]).map((mode) => {
        const isActive = queueMode === mode
        return (
          <button
            key={mode}
            type="button"
            onClick={() => setQueueMode(mode)}
            className={`px-3 py-2 text-xs uppercase tracking-wider transition-colors ${isActive ? 'bg-primary text-white' : 'bg-bg-soft text-text-muted hover:text-text'}`}
          >
            {mode === 'all' ? 'All' : 'Focus'}
          </button>
        )
      })}
    </div>
  )

  const renderFocusFilters = () => {
    if (queueMode !== 'focus') return null

    return (
      <div className="mb-6 flex flex-wrap gap-2">
        {(['all', 'locked', 'strong', 'other'] as FocusSignalBucket[]).map((bucket) => {
          const isActive = signalBucket === bucket
          const label = bucket === 'all' ? 'All signals' : bucket === 'locked' ? 'Locked-in' : bucket === 'strong' ? 'Strong' : 'Other'
          return (
            <button
              key={bucket}
              type="button"
              onClick={() => setSignalBucket(bucket)}
              className={`px-3 py-2 text-xs uppercase tracking-wider transition-colors ${isActive ? 'bg-primary text-white' : 'bg-bg-soft text-text-muted hover:text-text'}`}
            >
              {label}
            </button>
          )
        })}
        {(['all', 'high_spend'] as FocusValueFilter[]).map((level) => {
          const isActive = valueFilter === level
          return (
            <button
              key={level}
              type="button"
              onClick={() => setValueFilter(level)}
              className={`px-3 py-2 text-xs uppercase tracking-wider transition-colors ${isActive ? 'bg-primary text-white' : 'bg-bg-soft text-text-muted hover:text-text'}`}
            >
              {level === 'all' ? 'All values' : `High spend ${HIGH_SPEND_THRESHOLD.toLocaleString('en-US')}+`}
            </button>
          )
        })}
        {(['phone_ready', 'not_enough_info'] as FocusContactFilter[]).map((state) => {
          const isActive = contactFilter === state
          return (
            <button
              key={state}
              type="button"
              onClick={() => setContactFilter(state)}
              className={`px-3 py-2 text-xs uppercase tracking-wider transition-colors ${isActive ? 'bg-primary text-white' : 'bg-bg-soft text-text-muted hover:text-text'}`}
            >
              {state === 'phone_ready' ? 'Actionable (Phone)' : 'Not enough info'}
            </button>
          )
        })}
      </div>
    )
  }

  if (sourceClients.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="mb-2 font-serif text-2xl text-text">All caught up</p>
        <p className="text-text-muted">No clients need attention right now</p>
      </div>
    )
  }

  if (queueClients.length === 0) {
    return (
      <div>
        <p className="label mb-3 text-text-muted">Focus queue</p>
        {renderModeSwitch()}
        {renderFocusFilters()}
        <div className="py-20 text-center">
          <p className="mb-2 font-serif text-2xl text-text">No clients match these filters</p>
          <p className="mb-6 text-text-muted">Reset to All or widen Focus filters.</p>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setQueueMode('all')
                setSignalBucket('all')
                setValueFilter('all')
                setContactFilter('phone_ready')
              }}
              className="px-4 py-2 text-xs uppercase tracking-wider bg-primary text-white transition-colors"
            >
              Reset to All
            </button>
            <button
              type="button"
              onClick={() => {
                setSignalBucket('all')
                setValueFilter('all')
                setContactFilter('phone_ready')
              }}
              className="px-4 py-2 text-xs uppercase tracking-wider bg-bg-soft text-text-muted transition-colors hover:text-text"
            >
              Clear Focus filters
            </button>
          </div>
        </div>
      </div>
    )
  }

  const safeCurrentIndex = Math.min(currentIndex, queueClients.length - 1)
  const current = queueClients[safeCurrentIndex]
  const remaining = queueClients.length - safeCurrentIndex - 1
  const nextClients = queueClients.slice(safeCurrentIndex + 1, safeCurrentIndex + 4)
  const progressPct = ((safeCurrentIndex + 1) / queueClients.length) * 100
  const visibleOverdueCount = queueClients.filter((item) => (item.days_overdue ?? 0) > 0).length
  const isSellerWorkloadView = typeof remainingWorkloadCount === 'number'
  const headlineCount = isSellerWorkloadView ? liveRemainingCount : queueClients.length
  const headlineLabel =
    headlineCount === 1
      ? isSellerWorkloadView
        ? 'client left this cycle'
        : 'client in the queue'
      : isSellerWorkloadView
        ? 'clients left this cycle'
        : 'clients in the queue'

  const handleMarkedDone = (clientId: string, remainingCount?: number) => {
    setSourceClients((prev) => {
      const next = prev.filter((client) => client.id !== clientId)
      if (next.length === prev.length) return prev

      setLiveRemainingCount((currentValue) =>
        typeof remainingCount === 'number'
          ? remainingCount
          : Math.max((isSellerWorkloadView ? currentValue : prev.length) - 1, 0)
      )
      return next
    })
  }

  return (
    <div>
      <p className="label mb-3 text-text-muted">Focus queue</p>
      {renderModeSwitch()}
      {renderFocusFilters()}

      <div className="mb-6">
        <h1 className="mb-2 font-serif text-3xl tracking-tight text-text md:text-4xl">
          <span className={isSellerWorkloadView && headlineCount > 0 ? 'text-primary' : 'text-text'}>
            {headlineCount}
          </span>{' '}
          {headlineLabel}
        </h1>
        <p className="body-small text-text-muted">
          {visibleOverdueCount > 0
            ? `${visibleOverdueCount} overdue`
            : 'Everything else is scheduled ahead'}
          {' · '}
          Client {safeCurrentIndex + 1} of {queueClients.length}
          {remaining > 0 && ` · ${remaining} after this`}
          {queueMode === 'focus' && ' · ranked for opportunity first'}
        </p>
        <div
          className="mt-4 h-1 w-full overflow-hidden bg-bg-soft"
          style={{ borderRadius: 1 }}
          role="progressbar"
          aria-valuenow={safeCurrentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={queueClients.length}
        >
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {filter !== 'all' && (
        <div className="mb-4 flex gap-2">
          {(['all', 'overdue', 'today', 'upcoming'] as QueueFilter[]).map((statusFilter) => {
            const count = statusFilter === 'all' ? queueClients.length : queueClients.filter((client) => getClientStatus(client.days_overdue) === statusFilter).length
            const isActive = statusFilter === filter
            return (
              <a
                key={statusFilter}
                href={statusFilter === 'all' ? '/queue' : `/queue?status=${statusFilter}`}
                className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${isActive ? 'bg-primary text-white' : 'bg-bg-soft text-text-muted hover:text-text'}`}
              >
                {statusFilter === 'all' ? 'All' : statusFilter === 'overdue' ? 'Overdue' : statusFilter === 'today' ? 'Today' : 'Upcoming'}
                <span className="ml-1 opacity-60">{count}</span>
              </a>
            )
          })}
        </div>
      )}

      <p className="label mb-3 text-text-muted">Now</p>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={transitions.enter}
        >
          <FocusedClientCard
            client={current}
            userRole={userRole}
            currentUserId={currentUserId}
            onMarkedDone={handleMarkedDone}
          />
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          disabled={safeCurrentIndex === 0}
          className="label px-2 py-2 text-text-muted transition-colors duration-200 hover:text-text disabled:opacity-30"
        >
          Previous
        </button>
        <div className="flex gap-1">
          {queueClients.slice(0, 10).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 w-2 rounded-full transition-colors ${idx === safeCurrentIndex ? 'bg-primary' : 'bg-text/10'}`}
            />
          ))}
          {queueClients.length > 10 && <span className="ml-1 text-xs text-text-muted">+{queueClients.length - 10}</span>}
        </div>
        <button
          type="button"
          onClick={goNext}
          disabled={safeCurrentIndex >= queueClients.length - 1}
          className="label px-2 py-2 text-text-muted transition-colors duration-200 hover:text-text disabled:opacity-30"
        >
          Next
        </button>
      </div>

      {nextClients.length > 0 && (
        <div className="mt-10 border-t pt-8" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
          <p className="label mb-4 text-text-muted">Coming up</p>
          <div className="space-y-1">
            {nextClients.map((client) => {
              const isOverdue = (client.days_overdue ?? 0) > 0
              return (
                <button
                  type="button"
                  key={client.id}
                  onClick={() => setCurrentIndex(queueClients.indexOf(client))}
                  className="w-full py-3 text-left transition-colors duration-200 hover:bg-bg-soft"
                >
                  <span className="body text-text">
                    {client.first_name} {client.last_name}
                  </span>
                  {isOverdue && <span className="body-small ml-2 text-danger">+{client.days_overdue}d</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-text-muted">Arrow keys · j / k</p>
    </div>
  )
}
