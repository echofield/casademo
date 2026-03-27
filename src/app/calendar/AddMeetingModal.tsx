'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Search, Store, MapPin, Phone, Video, MessageCircle, Trash2 } from 'lucide-react'
import {
  MeetingFormat,
  MeetingInsert,
  MeetingUpdate,
  MeetingWithDetails,
  MEETING_FORMAT_CONFIG,
  DEFAULT_BOUTIQUE_LOCATION,
  DURATION_PRESETS,
} from '@/lib/types/meetings'
import { TierBadge } from '@/components'

const FORMAT_ICONS = {
  store: Store,
  pin: MapPin,
  phone: Phone,
  video: Video,
  message: MessageCircle,
}

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string | null
  tier: string
}

interface AddMeetingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (meeting: MeetingInsert) => Promise<void>
  preselectedClientId?: string
  mode?: 'create' | 'edit'
  prefillDate?: string
  prefillStartTime?: string
  editMeeting?: MeetingWithDetails
  onUpdate?: (id: string, update: MeetingUpdate) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function AddMeetingModal({
  isOpen,
  onClose,
  onSubmit,
  preselectedClientId,
  mode = 'create',
  prefillDate,
  prefillStartTime,
  editMeeting,
  onUpdate,
  onDelete,
}: AddMeetingModalProps) {
  const isEditMode = mode === 'edit' && editMeeting != null

  const [format, setFormat] = useState<MeetingFormat>('boutique')
  const [clientId, setClientId] = useState<string | null>(preselectedClientId || null)
  const [clientSearch, setClientSearch] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState(() => {
    const now = new Date()
    const minutes = Math.ceil(now.getMinutes() / 30) * 30
    now.setMinutes(minutes, 0, 0)
    if (minutes === 60) now.setHours(now.getHours() + 1)
    return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')
  })
  const [duration, setDuration] = useState(30)
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const submittingRef = useRef(false)

  useEffect(() => {
    async function fetchClients() {
      if (clientSearch.length < 2) {
        setClients([])
        return
      }
      try {
        const res = await fetch('/api/clients?search=' + encodeURIComponent(clientSearch) + '&limit=10')
        if (res.ok) {
          const data = await res.json()
          setClients(data.data || [])
        }
      } catch {
        console.error('Error fetching clients')
      }
    }
    const debounce = setTimeout(fetchClients, 300)
    return () => clearTimeout(debounce)
  }, [clientSearch])

  useEffect(() => {
    if (isEditMode) return
    if (selectedClient) {
      setTitle('Meeting - ' + selectedClient.first_name + ' ' + selectedClient.last_name)
    } else {
      const formatLabel = MEETING_FORMAT_CONFIG[format].label
      setTitle(format === 'boutique' ? 'In-store meeting' : formatLabel)
    }
  }, [selectedClient, format, isEditMode])

  useEffect(() => {
    if (isOpen) {
      setError(null)
      setShowDeleteConfirm(false)

      if (isEditMode && editMeeting) {
        const startDate = new Date(editMeeting.start_time)
        const endDate = new Date(editMeeting.end_time)
        const durationMins = Math.round((endDate.getTime() - startDate.getTime()) / 60000)
        setFormat(editMeeting.format)
        setTitle(editMeeting.title)
        setDate(startDate.toISOString().split('T')[0])
        setStartTime(String(startDate.getHours()).padStart(2, '0') + ':' + String(startDate.getMinutes()).padStart(2, '0'))
        setDuration(durationMins > 0 ? durationMins : 30)
        setLocation(editMeeting.location || '')
        setNotes(editMeeting.description || '')
        setClientId(editMeeting.client_id)
        if (editMeeting.client_id && editMeeting.client_name) {
          const nameParts = editMeeting.client_name.split(' ')
          setSelectedClient({
            id: editMeeting.client_id,
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
            email: null,
            tier: editMeeting.client_tier || 'standard',
          })
        } else {
          setSelectedClient(null)
        }
      } else {
        setFormat('boutique')
        setClientId(preselectedClientId || null)
        setSelectedClient(null)
        setClientSearch('')
        setTitle('')
        setLocation('')
        setNotes('')
        if (prefillDate) {
          setDate(prefillDate)
        } else {
          setDate(new Date().toISOString().split('T')[0])
        }
        if (prefillStartTime) {
          setStartTime(prefillStartTime)
        } else {
          const now = new Date()
          const minutes = Math.ceil(now.getMinutes() / 30) * 30
          now.setMinutes(minutes, 0, 0)
          if (minutes === 60) now.setHours(now.getHours() + 1)
          setStartTime(String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'))
        }
        if (preselectedClientId) {
          fetch('/api/clients/' + preselectedClientId)
            .then(res => res.json())
            .then(data => {
              if (data.data) {
                setSelectedClient(data.data)
                setClientId(data.data.id)
              }
            })
            .catch(console.error)
        }
      }
    }
  }, [isOpen, isEditMode, editMeeting, preselectedClientId, prefillDate, prefillStartTime])

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setClientId(client.id)
    setClientSearch('')
    setShowClientDropdown(false)
  }

  const handleClearClient = () => {
    setSelectedClient(null)
    setClientId(null)
    setClientSearch('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent double-submit (ref is sync, unlike state)
    if (submittingRef.current) return
    submittingRef.current = true

    setLoading(true)
    setError(null)

    if (format === 'external' && !location.trim()) {
      setError('Address is required for external meetings')
      setLoading(false)
      return
    }

    const startDate = new Date(date + 'T' + startTime + ':00')
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000)

    try {
      if (isEditMode && editMeeting && onUpdate) {
        const update: MeetingUpdate = {
          title: title.trim(),
          description: notes.trim() || null,
          format,
          location: format === 'boutique' ? DEFAULT_BOUTIQUE_LOCATION : (location.trim() || null),
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
        }
        await onUpdate(editMeeting.id, update)
      } else {
        const meeting: MeetingInsert = {
          client_id: clientId,
          title: title.trim(),
          description: notes.trim() || null,
          format,
          location: format === 'boutique' ? DEFAULT_BOUTIQUE_LOCATION : (location.trim() || null),
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
        }
        await onSubmit(meeting)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : (isEditMode ? 'Error updating meeting' : 'Error creating meeting'))
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  const handleDelete = async () => {
    if (!editMeeting || !onDelete) return
    setLoading(true)
    setError(null)
    try {
      await onDelete(editMeeting.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting meeting')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-[#F7F4EE] max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl animate-slide-up">
        <div className="sticky top-0 bg-[#F7F4EE] px-6 py-4 border-b border-[#003D2B]/10 flex items-center justify-between">
          <h2 className="font-serif text-xl text-[#003D2B]">{isEditMode ? 'Edit meeting' : 'New meeting'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#003D2B]/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-[#003D2B]/60" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-[#003D2B]/70 text-sm tracking-wide mb-3">Format</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(MEETING_FORMAT_CONFIG) as MeetingFormat[]).map((f) => {
                const config = MEETING_FORMAT_CONFIG[f]
                const Icon = FORMAT_ICONS[config.iconType]
                const isSelected = format === f
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={'px-3 py-2 text-sm rounded-full flex items-center gap-1.5 transition-all ' + (isSelected ? config.bgColor + ' ' + config.textColor + ' ring-2 ring-[#003D2B]/30' : 'bg-white border border-[#003D2B]/10 text-[#003D2B]/60 hover:border-[#003D2B]/30')}
                  >
                    <Icon size={14} strokeWidth={1.5} />
                    <span>{config.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-[#003D2B]/70 text-sm tracking-wide mb-2">Client (optional)</label>
            {selectedClient ? (
              <div className="flex items-center justify-between p-3 bg-white border border-[#003D2B]/10 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-[#003D2B]">{selectedClient.first_name} {selectedClient.last_name}</span>
                  <TierBadge tier={selectedClient.tier as any} />
                </div>
                <button type="button" onClick={handleClearClient} className="text-[#003D2B]/40 hover:text-[#003D2B]/60">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#003D2B]/40" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => { setClientSearch(e.target.value); setShowClientDropdown(true) }}
                  onFocus={() => setShowClientDropdown(true)}
                  placeholder="Search for a client..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#003D2B]/10 text-[#003D2B] text-sm rounded placeholder:text-[#003D2B]/30 focus:outline-none focus:border-[#003D2B]/30"
                />
                {showClientDropdown && clients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#003D2B]/10 rounded shadow-lg max-h-48 overflow-y-auto z-10">
                    <button type="button" onClick={() => { setShowClientDropdown(false); setClientSearch('') }} className="w-full px-4 py-2 text-left text-sm text-[#003D2B]/60 hover:bg-[#003D2B]/5">No client</button>
                    {clients.map((client) => (
                      <button key={client.id} type="button" onClick={() => handleClientSelect(client)} className="w-full px-4 py-2 text-left hover:bg-[#003D2B]/5 flex items-center justify-between">
                        <span className="text-sm text-[#003D2B]">{client.first_name} {client.last_name}</span>
                        <TierBadge tier={client.tier as any} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[#003D2B]/70 text-sm tracking-wide mb-2">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-0 py-3 bg-transparent border-0 border-b border-[#003D2B]/20 text-[#003D2B] text-base placeholder:text-[#003D2B]/30 focus:outline-none focus:border-[#003D2B]/50" placeholder="Meeting title" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#003D2B]/70 text-sm tracking-wide mb-2">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full px-3 py-3 bg-white border border-[#003D2B]/10 text-[#003D2B] text-sm rounded focus:outline-none focus:border-[#003D2B]/30" />
            </div>
            <div>
              <label className="block text-[#003D2B]/70 text-sm tracking-wide mb-2">Start time</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="w-full px-3 py-3 bg-white border border-[#003D2B]/10 text-[#003D2B] text-sm rounded focus:outline-none focus:border-[#003D2B]/30" />
            </div>
          </div>

          <div>
            <label className="block text-[#003D2B]/70 text-sm tracking-wide mb-3">Duration</label>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((preset) => (
                <button key={preset.value} type="button" onClick={() => setDuration(preset.value)} className={'px-4 py-2 text-sm transition-all ' + (duration === preset.value ? 'bg-[#003D2B] text-white' : 'bg-white border border-[#003D2B]/10 text-[#003D2B]/60 hover:border-[#003D2B]/30')}>{preset.label}</button>
              ))}
            </div>
          </div>

          {format === 'external' && (
            <div>
              <label className="block text-[#003D2B]/70 text-sm tracking-wide mb-2">Address *</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required className="w-full px-0 py-3 bg-transparent border-0 border-b border-[#003D2B]/20 text-[#003D2B] text-base placeholder:text-[#003D2B]/30 focus:outline-none focus:border-[#003D2B]/50" placeholder="Meeting address" />
            </div>
          )}

          {format === 'boutique' && (
            <div>
              <label className="block text-[#003D2B]/70 text-sm tracking-wide mb-2">Location</label>
              <p className="text-[#003D2B]/50 text-sm">{DEFAULT_BOUTIQUE_LOCATION}</p>
            </div>
          )}

          <div>
            <label className="block text-[#003D2B]/70 text-sm tracking-wide mb-2">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-3 py-3 bg-white border border-[#003D2B]/10 text-[#003D2B] text-sm rounded resize-none placeholder:text-[#003D2B]/30 focus:outline-none focus:border-[#003D2B]/30" placeholder="Notes for this meeting..." />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="w-full py-4 bg-[#003D2B] border border-[#003D2B] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#004D38] focus:outline-none focus:ring-2 focus:ring-[#003D2B]/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save changes' : 'Create meeting')}
          </button>

          {isEditMode && onDelete && (
            <div className="pt-2 border-t border-[#003D2B]/10">
              {showDeleteConfirm ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#003D2B]/60">Cancel this meeting?</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 text-sm text-[#003D2B]/60 hover:text-[#003D2B]">No</button>
                    <button type="button" onClick={handleDelete} disabled={loading} className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 disabled:opacity-50">Yes, cancel</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 text-sm text-[#003D2B]/40 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                  <span>Cancel meeting</span>
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
