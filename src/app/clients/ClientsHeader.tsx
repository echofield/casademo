'use client'

import { useState } from 'react'
import { AddClientModal } from './AddClientModal'

interface Props {
  count: number
}

export function ClientsHeader({ count }: Props) {
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="mb-2">Clients</h1>
          <p className="text-ink/60">
            {count} client{count !== 1 ? 's' : ''} total
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          + Add Client
        </button>
      </header>

      {showAddModal && (
        <AddClientModal onClose={() => setShowAddModal(false)} />
      )}
    </>
  )
}
