'use client'

import { useState } from 'react'
import { AddClientModal, type SellerPick } from './AddClientModal'
import { isDemoMode } from '@/lib/demo/config'

interface Props {
  isSupervisor: boolean
  sellers: SellerPick[]
}

export function AddClientButton({ isSupervisor, sellers }: Props) {
  const [showModal, setShowModal] = useState(false)

  if (isDemoMode) {
    return (
      <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-primary">
        Presentation data only
      </div>
    )
  }

  return (
    <>
      <button type="button" onClick={() => setShowModal(true)} className="btn-primary">
        Add client
      </button>

      {showModal && (
        <AddClientModal onClose={() => setShowModal(false)} isSupervisor={isSupervisor} sellers={sellers} />
      )}
    </>
  )
}

