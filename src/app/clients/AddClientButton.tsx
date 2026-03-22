'use client'

import { useState } from 'react'
import { AddClientModal, type SellerPick } from './AddClientModal'

interface Props {
  isSupervisor: boolean
  sellers: SellerPick[]
}

export function AddClientButton({ isSupervisor, sellers }: Props) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="btn-primary"
      >
        Add client
      </button>

      {showModal && (
        <AddClientModal
          onClose={() => setShowModal(false)}
          isSupervisor={isSupervisor}
          sellers={sellers}
        />
      )}
    </>
  )
}
