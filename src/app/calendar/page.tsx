'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { AddMeetingModal } from './AddMeetingModal'
import { MeetingCompletionSheet } from './MeetingCompletionSheet'

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
  const [completionMeeting, setCompletionMeeting] = useState<MeetingWithDetails | null>(null)

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

  // Meeting click in week view
  const handleMeetingClick = (meeting: MeetingWithDetails) => {
    if (meeting.status === 'scheduled') {
      setCompletionMeeting(meeting)
    }
  }

  return (
    <AppShell userRole={userRole} effectiveRole={effectiveRole} userName={userName}>
      <div className="mx-auto max-w-6xl animate-fade-in">
        {/* Header */}
        <header className="mb-8">
          <p className="label mb-3 text-text-muted">Calendrier</p>
          <h1 className="heading-1 text-text">Rendez-vous</h1>
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
            <p className="text-text-muted">Chargement...</p>
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
          />
        ) : (
          <TeamView
            meetings={meetings}
            onMeetingClick={handleMeetingClick}
          />
        )}

        {/* FAB - Add Meeting Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="
            fixed bottom-24 right-6 md:bottom-8 md:right-8
            w-14 h-14 rounded-full
            bg-[#003D2B] text-white
            shadow-lg hover:bg-[#004D38]
            flex items-center justify-center
            transition-all duration-200
            hover:scale-105
          "
          aria-label="Nouveau rendez-vous"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Add Meeting Modal */}
      <AddMeetingModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateMeeting}
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
