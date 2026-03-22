'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components'
import { ModalPortal } from '@/components/ModalPortal'

interface Props {
  clientId: string
}

export function ClientActions({ clientId }: Props) {
  const router = useRouter()
  const [showContactModal, setShowContactModal] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [contactError, setContactError] = useState<string | null>(null)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)

  const [contactChannel, setContactChannel] = useState('whatsapp')
  const [contactComment, setContactComment] = useState('')

  const [purchaseAmount, setPurchaseAmount] = useState('')
  const [purchaseDescription, setPurchaseDescription] = useState('')
  const [purchaseSource, setPurchaseSource] = useState('casa_one')

  const handleLogContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setContactError(null)
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

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to save')
      }

      setShowContactModal(false)
      setContactComment('')
      router.refresh()
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    setPurchaseError(null)
    const amount = parseFloat(purchaseAmount.replace(',', '.'))
    if (Number.isNaN(amount) || amount <= 0) {
      setPurchaseError('Enter a valid amount (€).')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/clients/${clientId}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          description: purchaseDescription.trim() || null,
          source: purchaseSource,
        }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to save')
      }

      setShowPurchaseModal(false)
      setPurchaseAmount('')
      setPurchaseDescription('')
      setPurchaseSource('casa_one')
      router.refresh()
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div id="vendor-actions" className="flex flex-wrap gap-2 md:gap-3">
        <Button type="button" onClick={() => { setContactError(null); setShowContactModal(true) }}>
          Log a contact
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setPurchaseError(null)
            setShowPurchaseModal(true)
          }}
        >
          Add a purchase
        </Button>
      </div>

      {showContactModal && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/40 p-4 py-10"
            onClick={() => setShowContactModal(false)}
            onKeyDown={(e) => e.key === 'Escape' && setShowContactModal(false)}
            role="presentation"
          >
            <div
              className="my-auto w-full max-w-md border bg-surface p-6 shadow-lg"
              style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="contact-modal-title"
            >
              <h3 id="contact-modal-title" className="mb-4 font-serif text-xl text-text">
                Log a contact
              </h3>
              <form onSubmit={handleLogContact}>
                <div className="mb-4">
                  <label className="label mb-2 block text-text-muted">Channel</label>
                  <select
                    value={contactChannel}
                    onChange={(e) => setContactChannel(e.target.value)}
                    className="input-field"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="phone">Phone</option>
                    <option value="sms">SMS</option>
                    <option value="email">E-mail</option>
                    <option value="in_store">In-store</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="label mb-2 block text-text-muted">Notes (optional)</label>
                  <textarea
                    value={contactComment}
                    onChange={(e) => setContactComment(e.target.value)}
                    className="input-field h-24 resize-none"
                    placeholder="Summary of the exchange..."
                  />
                </div>

                {contactError && <p className="body-small mb-4 text-danger">{contactError}</p>}

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" loading={loading}>
                    Save
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowContactModal(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {showPurchaseModal && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/40 p-4 py-10"
            onClick={() => setShowPurchaseModal(false)}
            role="presentation"
          >
            <div
              className="my-auto w-full max-w-md border bg-surface p-6 shadow-lg"
              style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="purchase-modal-title"
            >
              <h3 id="purchase-modal-title" className="mb-2 font-serif text-xl text-text">
                Add a purchase
              </h3>
              <p className="body-small mb-4 text-text-muted">
                The amount is added to the client total and may update their tier.
              </p>
              <form onSubmit={handleLogPurchase}>
                <div className="mb-4">
                  <label className="label mb-2 block text-text-muted">Amount (€)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    className="input-field"
                    placeholder="e.g. 450"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="label mb-2 block text-text-muted">Source (required)</label>
                  <select
                    value={purchaseSource}
                    onChange={(e) => setPurchaseSource(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="casa_one">Casa One</option>
                    <option value="walk_in">Walk-in</option>
                    <option value="instagram">Instagram</option>
                    <option value="recommendation">Recommendation</option>
                    <option value="existing_client">Existing client</option>
                    <option value="event">Event</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="label mb-2 block text-text-muted">Description (recommended)</label>
                  <input
                    type="text"
                    value={purchaseDescription}
                    onChange={(e) => setPurchaseDescription(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Silk shirt"
                  />
                </div>

                {purchaseError && <p className="body-small mb-4 text-danger">{purchaseError}</p>}

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" loading={loading}>
                    Save purchase
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowPurchaseModal(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  )
}
