'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components'

interface Props {
  clientId: string
}

export function ClientActions({ clientId }: Props) {
  const router = useRouter()
  const [showContactModal, setShowContactModal] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [loading, setLoading] = useState(false)

  // Contact form state
  const [contactChannel, setContactChannel] = useState('whatsapp')
  const [contactComment, setContactComment] = useState('')

  // Purchase form state
  const [purchaseAmount, setPurchaseAmount] = useState('')
  const [purchaseDescription, setPurchaseDescription] = useState('')

  const handleLogContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/clients/${clientId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: contactChannel,
          comment: contactComment || null,
        }),
      })

      if (!res.ok) throw new Error('Failed to log contact')

      setShowContactModal(false)
      setContactComment('')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to log contact')
    } finally {
      setLoading(false)
    }
  }

  const handleLogPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/clients/${clientId}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(purchaseAmount),
          description: purchaseDescription || null,
        }),
      })

      if (!res.ok) throw new Error('Failed to log purchase')

      setShowPurchaseModal(false)
      setPurchaseAmount('')
      setPurchaseDescription('')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to log purchase')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex gap-3 mb-6">
        <Button onClick={() => setShowContactModal(true)}>
          Log Contact
        </Button>
        <Button variant="secondary" onClick={() => setShowPurchaseModal(true)}>
          Log Purchase
        </Button>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-ink/20 flex items-center justify-center z-50 p-4">
          <div className="bg-paper border border-grey-light p-6 w-full max-w-md">
            <h3 className="font-serif text-xl mb-4">Log Contact</h3>
            <form onSubmit={handleLogContact}>
              <div className="mb-4">
                <label className="small-caps block mb-2">Channel</label>
                <select
                  value={contactChannel}
                  onChange={(e) => setContactChannel(e.target.value)}
                  className="input-field"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="phone">Phone</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="in_store">In Store</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="small-caps block mb-2">Notes (optional)</label>
                <textarea
                  value={contactComment}
                  onChange={(e) => setContactComment(e.target.value)}
                  className="input-field h-24 resize-none"
                  placeholder="What did you discuss?"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" loading={loading}>
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowContactModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-ink/20 flex items-center justify-center z-50 p-4">
          <div className="bg-paper border border-grey-light p-6 w-full max-w-md">
            <h3 className="font-serif text-xl mb-4">Log Purchase</h3>
            <form onSubmit={handleLogPurchase}>
              <div className="mb-4">
                <label className="small-caps block mb-2">Amount (EUR)</label>
                <input
                  type="number"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  className="input-field"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="small-caps block mb-2">Description (optional)</label>
                <input
                  type="text"
                  value={purchaseDescription}
                  onChange={(e) => setPurchaseDescription(e.target.value)}
                  className="input-field"
                  placeholder="What did they buy?"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" loading={loading}>
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowPurchaseModal(false)}
                >
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
