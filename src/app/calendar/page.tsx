'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components'
import {
  MeetingWithDetails,
  MeetingInsert,
  MeetingUpdate,
  getWeekBounds,
  groupMeetingsForSurface,
} from '@/lib/types/meetings'
import { CalendarNav } from './CalendarNav'
import { AgendaView } from './AgendaView'
import { WeekView } from './WeekView'
import { TeamView } from './TeamView'

// Dynamic imports for modals - not needed in initial bundle
const AddMeetingModal = dynamic(() => import('./AddMeetingModal').then(mod => ({ default: mod.AddMeetingModal })), { ssr: false })
const MeetingCompletionSheet = dynamic(() => import('./MeetingCompletionSheet').then(mod => ({ default: mod.MeetingCompletionSheet })), { ssr: false })

type CalendarView = 'list' | 'week' | 'team'

const VIEW_MODE_COOKIE = 'casa_view_mode'

function normalizeSellerOptions(
  rows: Array<{ id: string; full_name: string | null; email?: string | null; active?: boolean | null }>
): Array<{ id: string; name: string }> {
  const uniqueById = new Map<string, { id: string; name: string }>()

  rows.forEach((row) => {
    if (row.active === false) return
    const name = row.full_name?.trim()
    if (!row.id || !name) return
    if (!uniqueById.has(row.id)) {
      uniqueById.set(row.id, { id: row.id, name })
    }
  })

  const exactNameSeen = new Set<string>()
  const deduped = Array.from(uniqueById.values()).filter((seller) => {
    const key = seller.name.toLowerCase()
    if (exactNameSeen.has(key)) return false
    exactNameSeen.add(key)
    return true
  })

  const longNamesByFirstToken = new Set(
    deduped
      .filter((seller) => seller.name.includes(' '))
      .map((seller) => seller.name.split(/\s+/)[0].toLowerCase())
  )

  return deduped
    .filter((seller) => {
      const parts = seller.name.split(/\s+/)
      return !(parts.length === 1 && longNamesByFirstToken.has(parts[0].toLowerCase()))
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function computeEffectiveRole(profileRole: 'seller' | 'supervisor'): 'seller' | 'supervisor' {
  if (profileRole !== 'supervisor') return profileRole
  return getCookieValue(VIEW_MODE_COOKIE) === 'seller' ? 'seller' : 'supervisor'
}

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>('list')
  const [weekStart, setWeekStart] = useState(() => getWeekBounds().start)
  const [meetings, setMeetings] = useState<MeetingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'seller' | 'supervisor'>('seller')
  const [effectiveRole, setEffectiveRole] = useState<'seller' | 'supervisor'>('seller')
  const [userName, setUserName] = useState('')

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [modalPrefill, setModalPrefill] = useState<{
    date?: string
    startTime?: string
    meeting?: MeetingWithDetails
  }>({})
  const [completionMeeting, setCompletionMeeting] = useState<MeetingWithDetails | null>(null)

  // Sellers list for supervisor filter
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([])

  // Fetch user info
  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single()

        if (profile) {
          const role = profile.role as 'seller' | 'supervisor'
          setUserRole(role)
          setEffectiveRole(computeEffectiveRole(role))
          setUserName(profile.full_name || '')

          // If supervisor, fetch active team list
          if (role === 'supervisor') {
            const { data: sellersData } = await supabase
              .from('profiles')
              .select('id, full_name, email, active')
              .in('role', ['seller', 'supervisor'])
              .eq('active', true)
            if (sellersData) {
              setSellers(normalizeSellerOptions(sellersData))
            }
          }
        }
      }
    }
    fetchUser()
  }, [])

  // Fetch meetings for current week
  const fetchMeetings = useCallback(async () => {
    setLoading(true)
    try {
      const bounds = view === 'list' ? getWeekBounds() : getWeekBounds(weekStart)
      const url = `/api/meetings?start=${bounds.start.toISOString()}&end=${bounds.end.toISOString()}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setMeetings(data.data || [])
      }
    } catch (err) {
      console.error('Error fetching meetings:', err)
    } finally {
      setLoading(false)
    }
  }, [weekStart, view, effectiveRole])

  useEffect(() => {
    fetchMeetings()
  }, [fetchMeetings])

  // Navigation handlers
  const handlePrevWeek = () => {
    const newStart = new Date(weekStart)
    newStart.setDate(newStart.getDate() - 7)
    setWeekStart(newStart)
  }

  const handleNextWeek = () => {
    const newStart = new Date(weekStart)
    newStart.setDate(newStart.getDate() + 7)
    setWeekStart(newStart)
  }

  const handleToday = () => {
    setWeekStart(getWeekBounds().start)
  }

  // Meeting actions
  const handleMeetingAction = async (
    action: 'complete' | 'no_show' | 'cancel' | 'edit',
    meeting: MeetingWithDetails
  ) => {
    if (action === 'edit') {
      handleMeetingClick(meeting)
      return
    }

    if (action === 'complete') {
      setCompletionMeeting(meeting)
      return
    }

    if (action === 'cancel' || action === 'no_show') {
      const status = action === 'cancel' ? 'cancelled' : 'no_show'
      try {
        const res = await fetch(`/api/meetings/${meeting.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })

        if (res.ok) {
          fetchMeetings()
        }
      } catch (err) {
        console.error('Error updating meeting:', err)
      }
    }
  }

  // Create meeting
  const handleCreateMeeting = async (meeting: MeetingInsert) => {
    const res = await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meeting),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to create meeting')
    }

    fetchMeetings()
  }

  // Complete meeting
  const handleCompleteMeeting = async (meetingId: string, update: MeetingUpdate) => {
    const res = await fetch(`/api/meetings/${meetingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })

    if (!res.ok) {
      throw new Error('Failed to complete meeting')
    }

    fetchMeetings()
  }

  // Meeting click in week view - open edit modal
  const handleMeetingClick = (meeting: MeetingWithDetails) => {
    setModalMode('edit')
    setModalPrefill({ meeting })
    setShowAddModal(true)
  }

  // Empty slot click - open create modal with prefilled date/time
  const handleEmptySlotClick = (date: Date, hour: number) => {
    const dateStr = date.toISOString().split('T')[0]
    const timeStr = String(hour).padStart(2, '0') + ':00'
    setModalMode('create')
    setModalPrefill({ date: dateStr, startTime: timeStr })
    setShowAddModal(true)
  }

  // Open create modal (from FAB)
  const handleOpenCreateModal = () => {
    setModalMode('create')
    setModalPrefill({})
    setShowAddModal(true)
  }

  const meetingBuckets = groupMeetingsForSurface(meetings)
  const upcomingThisWeek =
    meetingBuckets.today.length +
    meetingBuckets.tomorrow.length +
    meetingBuckets.laterThisWeek.length
  const summaryBits = [
    meetingBuckets.today.length > 0 ? `${meetingBuckets.today.length} today` : null,
    upcomingThisWeek > 0 ? `${upcomingThisWeek} this week` : null,
    meetingBuckets.missed.length > 0 ? `${meetingBuckets.missed.length} to reschedule` : null,
  ].filter(Boolean)

  return (
    <AppShell userRole={userRole} effectiveRole={effectiveRole} userName={userName}>
      <div className="mx-auto max-w-6xl animate-fade-in pb-10">
        <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label mb-3 text-text-muted">Meetings</p>
            <h1 className="heading-1 text-text">Meetings</h1>
            {view === 'list' && summaryBits.length > 0 && (
              <p className="mt-2 text-sm text-text-muted">
                {summaryBits.join(' · ')}
              </p>
            )}
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 self-start bg-[#003D2B] px-5 py-3 text-xs font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#004D38]"
          >
            <Plus className="h-4 w-4" />
            Add meeting
          </button>
        </header>

        <CalendarNav
          weekStart={weekStart}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onToday={handleToday}
          view={view}
          onViewChange={setView}
          showTeamView={effectiveRole === 'supervisor'}
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-text-muted">Loading...</p>
          </div>
        ) : view === 'list' ? (
          <AgendaView
            meetings={meetings}
            onAction={handleMeetingAction}
          />
        ) : view === 'week' ? (
          <WeekView
            meetings={meetings}
            weekStart={weekStart}
            onMeetingClick={handleMeetingClick}
            onEmptySlotClick={handleEmptySlotClick}
            isSupervisor={effectiveRole === 'supervisor'}
            sellers={sellers}
          />
        ) : (
          <TeamView
            meetings={meetings}
            onMeetingClick={handleMeetingClick}
          />
        )}
      </div>

      {/* Add Meeting Modal */}
      <AddMeetingModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateMeeting}
        mode={modalMode}
        prefillDate={modalPrefill.date}
        prefillStartTime={modalPrefill.startTime}
        editMeeting={modalPrefill.meeting}
        onUpdate={async (id, update) => {
          const previousMeetings = meetings
          setMeetings(prev => prev.map(m =>
            m.id === id ? { ...m, ...update } as MeetingWithDetails : m
          ))
          try {
            const res = await fetch('/api/meetings/' + id, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(update),
            })
            if (!res.ok) {
              setMeetings(previousMeetings)
              throw new Error('Failed to update meeting')
            }
            fetchMeetings()
          } catch (err) {
            setMeetings(previousMeetings)
            throw err
          }
        }}
        onDelete={async (id) => {
          const previousMeetings = meetings
          setMeetings(prev => prev.filter(m => m.id !== id))
          try {
            const res = await fetch('/api/meetings/' + id, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'cancelled' }),
            })
            if (!res.ok) {
              setMeetings(previousMeetings)
              throw new Error('Failed to delete meeting')
            }
          } catch (err) {
            setMeetings(previousMeetings)
            throw err
          }
        }}
      />

      {/* Completion Sheet */}
      <MeetingCompletionSheet
        meeting={completionMeeting}
        onClose={() => setCompletionMeeting(null)}
        onSubmit={handleCompleteMeeting}
      />
    </AppShell>
  )
}
