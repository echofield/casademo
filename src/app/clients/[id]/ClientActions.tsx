'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components'
import { ModalPortal } from '@/components/ModalPortal'
import { PURCHASE_SOURCES, PurchaseSource, SizeSystem } from '@/lib/types'
import { getSizeValues, getSupportedSizeSystems } from '@/lib/config/sizeSystem'

const CONTACT_CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'phone', label: 'Phone' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'E-mail' },
  { value: 'in_store', label: 'In-store' },
  { value: 'other', label: 'Other' },
] as const

const PURCHASE_CATEGORY_TO_SIZE_CATEGORY: Record<string, string> = {
  jacket: 'jackets',
  trousers: 'pants',
  shirt: 'shirts',
  knitwear: 'knitwear',
  shoes: 'shoes',
  accessories: 'accessories',
}
// Context memory keys
const STORAGE_KEY_CHANNEL = 'casa-one:last-contact-channel'
const STORAGE_KEY_PURCHASE_SOURCE = 'casa-one:last-purchase-source'

function getStoredChannel(): string {
  if (typeof window === 'undefined') return 'whatsapp'
  return localStorage.getItem(STORAGE_KEY_CHANNEL) || 'whatsapp'
}

function getStoredPurchaseSource(): PurchaseSource | '' {
  if (typeof window === 'undefined') return ''
  const stored = localStorage.getItem(STORAGE_KEY_PURCHASE_SOURCE)
  return (stored as PurchaseSource) || ''
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback

  const error =
    'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : fallback

  const details =
    'details' in payload && payload.details && typeof payload.details === 'object'
      ? (payload.details as { fieldErrors?: Record<string, string[] | undefined>; formErrors?: string[] })
      : null

  const fieldError = details?.fieldErrors
    ? Object.values(details.fieldErrors).flat().find((message): message is string => typeof message === 'string' && message.length > 0)
    : null

  if (fieldError) return fieldError

  const formError = details?.formErrors?.find((message): message is string => typeof message === 'string' && message.length > 0)
  return formError || error
}

interface Props {
  clientId: string
}

export function ClientActions({ clientId }: Props) {
  const router = useRouter()
  const [isRefreshing, startRefreshTransition] = useTransition()
  const [showContactModal, setShowContactModal] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [contactError, setContactError] = useState<string | null>(null)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)

  // Context memory: remember last-used values
  const [contactChannel, setContactChannel] = useState('whatsapp')
  const [contactComment, setContactComment] = useState('')

  const [purchaseAmount, setPurchaseAmount] = useState('')
  const [purchaseDescription, setPurchaseDescription] = useState('')
  const [purchaseSource, setPurchaseSource] = useState<PurchaseSource | ''>('')
  const [purchaseProductName, setPurchaseProductName] = useState('')
  const [purchaseCategory, setPurchaseCategory] = useState('')
  const [purchaseSizeSystem, setPurchaseSizeSystem] = useState<SizeSystem | null>(null)
  const [purchaseSize, setPurchaseSize] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [purchaseIsGift, setPurchaseIsGift] = useState(false)
  const [purchaseGiftRecipient, setPurchaseGiftRecipient] = useState('')
  const mappedPurchaseSizeCategory = purchaseCategory
    ? PURCHASE_CATEGORY_TO_SIZE_CATEGORY[purchaseCategory] ?? null
    : null
  const purchaseSupportedSizeSystems = mappedPurchaseSizeCategory
    ? getSupportedSizeSystems(mappedPurchaseSizeCategory)
    : []
  const resolvedPurchaseSizeSystem =
    purchaseSizeSystem && purchaseSupportedSizeSystems.includes(purchaseSizeSystem)
      ? purchaseSizeSystem
      : (purchaseSupportedSizeSystems[0] ?? null)
  const structuredPurchaseSizes =
    mappedPurchaseSizeCategory && resolvedPurchaseSizeSystem
      ? getSizeValues(mappedPurchaseSizeCategory, resolvedPurchaseSizeSystem)
      : []


  const [contactInfo, setContactInfo] = useState<string | null>(null)

  // Subtle confirmation states
  const [contactSuccess, setContactSuccess] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)

  // Refs to prevent double-submit (sync check, no state delay)
  const submittingContactRef = useRef(false)
  const submittingPurchaseRef = useRef(false)
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load remembered values on mount
  useEffect(() => {
    setContactChannel(getStoredChannel())
    setPurchaseSource(getStoredPurchaseSource())

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  const scheduleRefresh = (delayMs = 200) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    refreshTimeoutRef.current = setTimeout(() => {
      startRefreshTransition(() => {
        router.refresh()
      })
      refreshTimeoutRef.current = null
    }, delayMs)
  }

  const resetPurchaseForm = () => {
    setPurchaseAmount('')
    setPurchaseDescription('')
    setPurchaseProductName('')
    setPurchaseCategory('')
    setPurchaseSizeSystem(null)
    setPurchaseSize('')
    setPurchaseDate(new Date().toISOString().split('T')[0])
    setPurchaseIsGift(false)
    setPurchaseGiftRecipient('')
  }

  const handleLogContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submittingContactRef.current) return
    submittingContactRef.current = true

    setContactError(null)
    setContactInfo(null)

    // Remember the channel for next time
    localStorage.setItem(STORAGE_KEY_CHANNEL, contactChannel)

    // Optimistic close: modal closes immediately, feels instant
    const channelToSend = contactChannel
    const commentToSend = contactComment || null
    setShowContactModal(false)
    setContactComment('')
    setLoading(true)

    try {
      const res = await fetch(`/api/clients/${clientId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: channelToSend,
          comment: commentToSend,
        }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to save')
      }

      const data = await res.json()

      // Handle idempotency: API returns already_done if contact was already logged today
      if (data.already_done) {
        // Brief subtle indication - already logged is fine, not an error
        setContactSuccess(true)
        setTimeout(() => setContactSuccess(false), 1500)
      } else {
        // Show subtle success confirmation on button
        setContactSuccess(true)
        setTimeout(() => setContactSuccess(false), 1500)
      }

      scheduleRefresh()
    } catch (err) {
      // Error after optimistic close - show brief error state
      setContactError(err instanceof Error ? err.message : 'Error saving contact')
      setTimeout(() => setContactError(null), 3000)
    } finally {
      setLoading(false)
      submittingContactRef.current = false
    }
  }

  const handleLogPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submittingPurchaseRef.current) return
    submittingPurchaseRef.current = true

    setPurchaseError(null)
    const amount = parseFloat(purchaseAmount.replace(',', '.'))
    if (Number.isNaN(amount) || amount <= 0) {
      setPurchaseError('Enter a valid amount')
      submittingPurchaseRef.current = false
      return
    }

    if (purchaseSource) {
      localStorage.setItem(STORAGE_KEY_PURCHASE_SOURCE, purchaseSource)
    }

    const sizeVal = purchaseSize.trim() || null
    let sizeType: string | null = null

    if (sizeVal && mappedPurchaseSizeCategory) {
      if (mappedPurchaseSizeCategory === 'shoes' || mappedPurchaseSizeCategory === 'sneakers') {
        sizeType = 'shoe'
      } else if (resolvedPurchaseSizeSystem === 'INTL') {
        sizeType = 'letter'
      } else {
        sizeType = 'number'
      }
    } else if (sizeVal) {
      const normalized = sizeVal.toUpperCase()
      if (['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].includes(normalized)) {
        sizeType = 'letter'
      } else if (/^\d+$/.test(sizeVal)) {
        const numericSize = parseInt(sizeVal, 10)
        sizeType = (numericSize >= 3 && numericSize <= 15) || (numericSize >= 38 && numericSize <= 47)
          ? 'shoe'
          : 'number'
      }
    }

    const payload = {
      amount,
      description: purchaseDescription.trim() || null,
      source: purchaseSource || undefined,
      product_name: purchaseProductName.trim() || null,
      product_category: purchaseCategory || null,
      size: sizeVal,
      size_type: sizeType,
      purchase_date: purchaseDate || undefined,
      is_gift: purchaseIsGift,
      gift_recipient: purchaseIsGift ? purchaseGiftRecipient.trim() || null : null,
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/clients/${clientId}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(getErrorMessage(payload, 'Failed to save purchase'))
      }

      setPurchaseSuccess(true)
      setTimeout(() => setPurchaseSuccess(false), 1500)
      resetPurchaseForm()
      setShowPurchaseModal(false)
      scheduleRefresh()
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : 'Error saving purchase')
    } finally {
      setLoading(false)
      submittingPurchaseRef.current = false
    }
  }

  return (
    <>
      <div id="vendor-actions" className="flex flex-wrap gap-2 md:gap-3">
        <div className="relative">
          <Button
            type="button"
            onClick={() => { setContactError(null); setShowContactModal(true) }}
            disabled={loading || isRefreshing}
            className={contactSuccess ? 'ring-2 ring-emerald-400/50' : ''}
          >
            {contactSuccess ? (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Logged
              </span>
            ) : (
              'Log a contact'
            )}
          </Button>
          {contactError && (
            <p className="absolute top-full left-0 mt-1 text-xs text-danger whitespace-nowrap">{contactError}</p>
          )}
        </div>
        <div className="relative">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setPurchaseError(null)
              setShowPurchaseModal(true)
            }}
            disabled={loading || isRefreshing}
            className={purchaseSuccess ? 'ring-2 ring-emerald-400/50' : ''}
          >
            {purchaseSuccess ? (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Added
              </span>
            ) : (
              'Add a purchase'
            )}
          </Button>
          {purchaseError && (
            <p className="absolute top-full left-0 mt-1 text-xs text-danger whitespace-nowrap">{purchaseError}</p>
          )}
        </div>
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
                {contactInfo && <p className="body-small mb-4 text-amber-700">{contactInfo}</p>}

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" loading={loading} disabled={!!contactInfo}>
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
                      onChange={(e) => {
                        const nextCategory = e.target.value
                        setPurchaseCategory(nextCategory)
                        setPurchaseSize('')

                        const mappedCategory = PURCHASE_CATEGORY_TO_SIZE_CATEGORY[nextCategory]
                        if (!mappedCategory) {
                          setPurchaseSizeSystem(null)
                          return
                        }

                        const systems = getSupportedSizeSystems(mappedCategory)
                        setPurchaseSizeSystem(systems[0] ?? null)
                      }}
                      className="input-field"
                    >
                      <option value="">-</option>
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
                    <label className="label mb-2 block text-text-muted">
                      Size
                      {mappedPurchaseSizeCategory && resolvedPurchaseSizeSystem && (
                        <span className="ml-1.5 text-text-muted/70">({resolvedPurchaseSizeSystem})</span>
                      )}
                    </label>

                    {mappedPurchaseSizeCategory && structuredPurchaseSizes.length > 0 ? (
                      <div className="space-y-2">
                        {purchaseSupportedSizeSystems.length > 1 && (
                          <div className="flex flex-wrap gap-1.5">
                            {purchaseSupportedSizeSystems.map((system) => {
                              const isSelected = resolvedPurchaseSizeSystem === system
                              return (
                                <button
                                  key={system}
                                  type="button"
                                  onClick={() => {
                                    setPurchaseSizeSystem(system)
                                    setPurchaseSize('')
                                  }}
                                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
                                    isSelected
                                      ? 'border-[#003D2B] bg-[#003D2B] text-white'
                                      : 'border-[rgba(28,27,25,0.18)] text-text-muted hover:border-text hover:text-text'
                                  }`}

                                >
                                  {system}
                                </button>
                              )
                            })}
                          </div>
                        )}
                        <select
                          value={purchaseSize}
                          onChange={(e) => setPurchaseSize(e.target.value)}
                          className="input-field"
                        >
                          <option value="">Select size...</option>
                          {structuredPurchaseSizes.map((sizeValue) => (
                            <option key={sizeValue} value={sizeValue}>{sizeValue}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={purchaseSize}
                        onChange={(e) => setPurchaseSize(e.target.value)}
                        className="input-field"
                        placeholder="e.g. M, 48, 42"
                      />
                    )}
                  </div>
                </div>

                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label mb-2 block text-text-muted">Amount (EUR)</label>
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
                  <label className="label mb-2 block text-text-muted">How did this sale happen? <span className="text-text-muted/70">(optional)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {PURCHASE_SOURCES.map((source) => {
                      const isSelected = purchaseSource === source.value
                      return (
                        <button
                          key={source.value}
                          type="button"
                          onClick={() => setPurchaseSource(current => current === source.value ? '' : source.value)}
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
                  {!purchaseSource && (
                    <p className="mt-2 text-xs text-text-muted">
                      Leave empty if you only need to confirm the payment amount. It will be saved as other.
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
