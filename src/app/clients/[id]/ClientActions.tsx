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
        throw new Error(j.error || 'Échec de l’enregistrement')
      }

      setShowContactModal(false)
      setContactComment('')
      router.refresh()
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleLogPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    setPurchaseError(null)
    const amount = parseFloat(purchaseAmount.replace(',', '.'))
    if (Number.isNaN(amount) || amount <= 0) {
      setPurchaseError('Indiquez un montant valide (€).')
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
        }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Échec de l’enregistrement')
      }

      setShowPurchaseModal(false)
      setPurchaseAmount('')
      setPurchaseDescription('')
      router.refresh()
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div id="vendor-actions" className="flex flex-wrap gap-2 md:gap-3">
        <Button type="button" onClick={() => { setContactError(null); setShowContactModal(true) }}>
          Enregistrer un contact
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setPurchaseError(null)
            setShowPurchaseModal(true)
          }}
        >
          Ajouter un achat
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
                Enregistrer un contact
              </h3>
              <form onSubmit={handleLogContact}>
                <div className="mb-4">
                  <label className="label mb-2 block text-text-muted">Canal</label>
                  <select
                    value={contactChannel}
                    onChange={(e) => setContactChannel(e.target.value)}
                    className="input-field"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="phone">Téléphone</option>
                    <option value="sms">SMS</option>
                    <option value="email">E-mail</option>
                    <option value="in_store">Boutique</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="label mb-2 block text-text-muted">Notes (optionnel)</label>
                  <textarea
                    value={contactComment}
                    onChange={(e) => setContactComment(e.target.value)}
                    className="input-field h-24 resize-none"
                    placeholder="Résumé de l’échange…"
                  />
                </div>

                {contactError && <p className="body-small mb-4 text-danger">{contactError}</p>}

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" loading={loading}>
                    Enregistrer
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowContactModal(false)}>
                    Annuler
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
                Ajouter un achat
              </h3>
              <p className="body-small mb-4 text-text-muted">
                Le montant est ajouté au total client et peut faire évoluer le palier.
              </p>
              <form onSubmit={handleLogPurchase}>
                <div className="mb-4">
                  <label className="label mb-2 block text-text-muted">Montant (€)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    className="input-field"
                    placeholder="ex. 450"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="label mb-2 block text-text-muted">Libellé (recommandé)</label>
                  <input
                    type="text"
                    value={purchaseDescription}
                    onChange={(e) => setPurchaseDescription(e.target.value)}
                    className="input-field"
                    placeholder="ex. Chemise en soie"
                  />
                </div>

                {purchaseError && <p className="body-small mb-4 text-danger">{purchaseError}</p>}

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" loading={loading}>
                    Enregistrer l’achat
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowPurchaseModal(false)}>
                    Annuler
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
