'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components'
import { ModalPortal } from '@/components/ModalPortal'
import { PURCHASE_SOURCES, PurchaseSource } from '@/lib/types'

const CONTACT_CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'phone', label: 'Phone' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'E-mail' },
  { value: 'in_store', label: 'In-store' },
  { value: 'other', label: 'Other' },
] as const

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
  const [purchaseSource, setPurchaseSource] = useState<PurchaseSource | ''>('')
  const [purchaseProductName, setPurchaseProductName] = useState('')
  const [purchaseCategory, setPurchaseCategory] = useState('')
  const [purchaseSize, setPurchaseSize] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [purchaseIsGift, setPurchaseIsGift] = useState(false)
  const [purchaseGiftRecipient, setPurchaseGiftRecipient] = useState('')

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
    if (!purchaseSource) {
      setPurchaseError('Select how this sale happened.')
      return
    }

    setLoading(true)

    try {
      const sizeVal = purchaseSize.trim() || null
      let sizeType: string | null = null
      if (sizeVal) {
        if (['S', 'M', 'L', 'XL', 'XXL'].includes(sizeVal.toUpperCase())) sizeType = 'letter'
        else if (/^\d+$/.test(sizeVal)) sizeType = parseInt(sizeVal) >= 38 && parseInt(sizeVal) <= 47 ? 'shoe' : 'number'
      }

      const res = await fetch(`/api/clients/${clientId}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          description: purchaseDescription.trim() || null,
          source: purchaseSource,
          product_name: purchaseProductName.trim() || null,
          product_category: purchaseCategory || null,
          size: sizeVal,
          size_type: sizeType,
          purchase_date: purchaseDate || undefined,
          is_gift: purchaseIsGift,
          gift_recipient: purchaseIsGift ? purchaseGiftRecipient.trim() || null : null,
        }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to save')
      }

      setShowPurchaseModal(false)
      setPurchaseAmount('')
      setPurchaseDescription('')
      setPurchaseSource('')
      setPurchaseProductName('')
      setPurchaseCategory('')
      setPurchaseSize('')
      setPurchaseDate(new Date().toISOString().split('T')[0])
      setPurchaseIsGift(false)
      setPurchaseGiftRecipient('')
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
                <div className="mb-5">
                  <label className="label mb-2 block text-text-muted">How did you reach them?</label>
                  <div className="flex flex-wrap gap-2">
                    {CONTACT_CHANNELS.map((ch) => {
                      const isSelected = contactChannel === ch.value
                      return (
                        <button
                          key={ch.value}
                          type="button"
                          onClick={() => setContactChannel(ch.value)}
                          className={`px-4 py-2.5 text-xs font-medium transition-all duration-200 border ${
                            isSelected
                              ? 'bg-[#003D2B] text-white border-[#003D2B]'
                              : 'bg-transparent text-text-muted border-[rgba(28,27,25,0.12)] hover:border-text hover:text-text'
                          }`}
                        >
                          {ch.label}
                        </button>
                      )
                    })}
                  </div>
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
                  <label className="label mb-2 block text-text-muted">Product name</label>
                  <input
                    type="text"
                    value={purchaseProductName}
                    onChange={(e) => setPurchaseProductName(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Shearling Floral Embroidery Jacket"
                  />
                </div>

                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label mb-2 block text-text-muted">Category</label>
                    <select
                      value={purchaseCategory}
                      onChange={(e) => setPurchaseCategory(e.target.value)}
                      className="input-field"
                    >
                      <option value="">—</option>
                      <option value="jacket">Jacket / Outerwear</option>
                      <option value="trousers">Trousers / Pants</option>
                      <option value="shirt">Shirt / Top</option>
                      <option value="knitwear">Knitwear</option>
                      <option value="shoes">Shoes</option>
                      <option value="accessories">Accessories</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="label mb-2 block text-text-muted">Size</label>
                    <input
                      type="text"
                      value={purchaseSize}
                      onChange={(e) => setPurchaseSize(e.target.value)}
                      className="input-field"
                      placeholder="e.g. M, 48, 42"
                    />
                  </div>
                </div>

                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <div>
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
                  <div>
                    <label className="label mb-2 block text-text-muted">Date</label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="label mb-2 block text-text-muted">How did this sale happen?</label>
                  <div className="flex flex-wrap gap-2">
                    {PURCHASE_SOURCES.map((source) => {
                      const isSelected = purchaseSource === source.value
                      return (
                        <button
                          key={source.value}
                          type="button"
                          onClick={() => setPurchaseSource(source.value)}
                          className={`px-3 py-2 text-xs font-medium transition-all duration-200 border ${
                            isSelected
                              ? source.value === 'casa_one'
                                ? 'bg-[#003D2B] text-white border-[#003D2B]'
                                : 'bg-primary text-white border-primary'
                              : 'bg-transparent text-text-muted border-[rgba(28,27,25,0.12)] hover:border-text hover:text-text'
                          }`}
                          title={source.description}
                        >
                          {source.label}
                        </button>
                      )
                    })}
                  </div>
                  {purchaseSource && (
                    <p className="mt-2 text-xs text-text-muted">
                      {PURCHASE_SOURCES.find(s => s.value === purchaseSource)?.description}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="label mb-2 block text-text-muted">Notes (optional)</label>
                  <input
                    type="text"
                    value={purchaseDescription}
                    onChange={(e) => setPurchaseDescription(e.target.value)}
                    className="input-field"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="mb-6 border-t pt-4" style={{ borderColor: 'rgba(28, 27, 25, 0.06)' }}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={purchaseIsGift}
                      onChange={(e) => setPurchaseIsGift(e.target.checked)}
                      className="rounded"
                    />
                    <span className="label text-text-muted">This is a gift</span>
                  </label>
                  {purchaseIsGift && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={purchaseGiftRecipient}
                        onChange={(e) => setPurchaseGiftRecipient(e.target.value)}
                        className="input-field"
                        placeholder="For whom? e.g. wife, business partner Marc..."
                      />
                    </div>
                  )}
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
