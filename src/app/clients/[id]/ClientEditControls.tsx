'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components'

export interface SellerOption {
  id: string
  full_name: string
}

interface Props {
  clientId: string
  currentUserId: string
  userRole: 'seller' | 'supervisor'
  sellerId: string
  sellerName: string
  initial: {
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    notes: string | null
  }
  /** Active sellers for reassignment (supervisor only) */
  sellerOptions?: SellerOption[]
}

export function ClientEditControls({
  clientId,
  currentUserId,
  userRole,
  sellerId,
  sellerName,
  initial,
  sellerOptions = [],
}: Props) {
  const router = useRouter()
  const canEdit =
    userRole === 'supervisor' || sellerId === currentUserId

  const [showEdit, setShowEdit] = useState(false)
  const [showReassign, setShowReassign] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState(initial.first_name)
  const [lastName, setLastName] = useState(initial.last_name)
  const [email, setEmail] = useState(initial.email ?? '')
  const [phone, setPhone] = useState(initial.phone ?? '')
  const [notes, setNotes] = useState(initial.notes ?? '')

  const [newSellerId, setNewSellerId] = useState('')

  const openEdit = () => {
    setFirstName(initial.first_name)
    setLastName(initial.last_name)
    setEmail(initial.email ?? '')
    setPhone(initial.phone ?? '')
    setNotes(initial.notes ?? '')
    setError(null)
    setShowEdit(true)
  }

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          notes: notes.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Update failed')
      setShowEdit(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  const submitReassign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSellerId) {
      setError('Choose a seller')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/reassign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_seller_id: newSellerId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Reassign failed')
      setShowReassign(false)
      setNewSellerId('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reassign failed')
    } finally {
      setLoading(false)
    }
  }

  if (!canEdit) {
    return null
  }

  const otherSellers = sellerOptions.filter((s) => s.id !== sellerId)

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-6">
        {canEdit && (
          <Button variant="secondary" onClick={openEdit}>
            Edit client
          </Button>
        )}
        {userRole === 'supervisor' && otherSellers.length > 0 && (
          <Button
            variant="secondary"
            onClick={() => {
              setError(null)
              setNewSellerId('')
              setShowReassign(true)
            }}
          >
            Assign to seller
          </Button>
        )}
      </div>

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto border bg-surface p-6"
            style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
          >
            <h3 className="font-serif text-xl mb-4">Edit client</h3>
            <form onSubmit={submitEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="small-caps block mb-1">First name</label>
                  <input
                    className="input-field"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="small-caps block mb-1">Last name</label>
                  <input
                    className="input-field"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="small-caps block mb-1">Phone</label>
                <input
                  className="input-field"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 …"
                />
              </div>
              <div>
                <label className="small-caps block mb-1">Email</label>
                <input
                  className="input-field"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="small-caps block mb-1">Notes</label>
                <textarea
                  className="input-field h-24 resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3">
                <Button type="submit" loading={loading}>
                  Save
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowEdit(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReassign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
          <div className="w-full max-w-md border bg-surface p-6" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
            <h3 className="font-serif text-xl mb-2">Assign to another seller</h3>
            <p className="body-small mb-4 text-text-muted">
              Current: <span className="text-text">{sellerName}</span>. Only supervisors can move a
              client when a seller leaves.
            </p>
            <form onSubmit={submitReassign} className="space-y-4">
              <div>
                <label className="small-caps block mb-1">New seller</label>
                <select
                  className="input-field"
                  value={newSellerId}
                  onChange={(e) => setNewSellerId(e.target.value)}
                  required
                >
                  <option value="">Select…</option>
                  {otherSellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3">
                <Button type="submit" loading={loading}>
                  Confirm
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowReassign(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
