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
} from '@/lib/types/meetings'
import { CalendarNav } from './CalendarNav'
import { AgendaView } from './AgendaView'
import { WeekView } from './WeekView'
import { TeamView } from './TeamView'

// Dynamic imports for modals - not needed in initial bundle
const AddMeetingModal = dynamic(() => import('./AddMeetingModal').then(mod => ({ default: mod.AddMeetingModal })), { ssr: false })
const MeetingCompletionSheet = dynamic(() => import('./MeetingCompletionSheet').then(mod => ({ default: mod.MeetingCompletionSheet })), { ssr: false })

type CalendarView = 'agenda' | 'week' | 'team'

const VIEW_MODE_COOKIE = 'casa_view_mode'

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
  const [view, setView] = useState<CalendarView>('agenda')
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

          // If supervisor, fetch sellers list
          if (role === 'supervisor') {
            const { data: sellersData } = await supabase
              .from('profiles')
              .select('id, full_name')
              .eq('role', 'seller')
            if (sellersData) {
              setSellers(sellersData.map(s => ({ id: s.id, name: s.full_name || 'Unknown' })))
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
      const { start, end } = getWeekBounds(weekStart)
      // For team view, supervisors fetch all sellers' meetings
      const url = view === 'team' && effectiveRole === 'supervisor'
        ? `/api/meetings?start=${start.toISOString()}&end=${end.toISOString()}`
        : `/api/meetings?start=${start.toISOString()}&end=${end.toISOString()}`
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

  return (
    <AppShell userRole={userRole} effectiveRole={effectiveRole} userName={userName}>
      <div className="mx-auto max-w-6xl animate-fade-in pb-24">
        {/* Header */}
        <header className="mb-8">
          <p className="label mb-3 text-text-muted">Calendar</p>
          <h1 className="heading-1 text-text">Meetings</h1>
        </header>

        {/* Navigation */}
        <CalendarNav
          weekStart={weekStart}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onToday={handleToday}
          view={view}
          onViewChange={setView}
          showTeamView={effectiveRole === 'supervisor'}
        />

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-text-muted">Loading...</p>
          </div>
        ) : view === 'agenda' ? (
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

        {/* FAB - Add Meeting Button */}
        <button
          onClick={handleOpenCreateModal}
          className="
            fixed bottom-24 right-6 md:bottom-8 md:right-8
            w-14 h-14 rounded-full
            bg-[#003D2B] text-white
            shadow-lg hover:bg-[#004D38]
            flex items-center justify-center
            transition-all duration-200
            hover:scale-105
          "
          aria-label="New meeting"
        >
          <Plus className="w-6 h-6" />
        </button>
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
