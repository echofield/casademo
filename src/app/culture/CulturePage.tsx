'use client'

import { useState } from 'react'
import { CULTURE_PIECES } from './data'
import { CultureHero } from './CultureHero'
import { CulturePieceCard } from './CulturePieceCard'
import { CulturePieceDetail } from './CulturePieceDetail'
import { CultureReferenceStrip } from './CultureReferenceStrip'
import { LectureBlock } from './LectureBlock'

type Tab = 'pieces' | 'references' | 'lecture'

const TABS: { id: Tab; label: string }[] = [
  { id: 'pieces', label: 'Pieces' },
  { id: 'references', label: 'References' },
  { id: 'lecture', label: 'Lecture' },
]

export function CulturePage() {
  const [activeTab, setActiveTab] = useState<Tab>('pieces')
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null)

  const selectedPiece = CULTURE_PIECES.find((p) => p.id === selectedPieceId) ?? null

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setSelectedPieceId(null)
  }

  return (
    <>
      {/* Full-screen piece detail — rendered outside main container, covers nav */}
      {selectedPiece && (
        <CulturePieceDetail
          piece={selectedPiece}
          onClose={() => setSelectedPieceId(null)}
        />
      )}

      <div className="mx-auto max-w-6xl">
        <CultureHero />

        {/* Tab control */}
        <div
          className="my-8 flex items-center"
          style={{ borderBottom: '0.5px solid var(--faint)' }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className="relative pb-3 pr-8 text-xs font-medium uppercase tracking-[0.12em] transition-colors duration-200"
                style={{ color: isActive ? 'var(--ink)' : 'var(--warmgrey)' }}
              >
                {tab.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-8 h-px"
                    style={{ backgroundColor: 'var(--ink)' }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Pieces tab */}
        {activeTab === 'pieces' && (
          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ backgroundColor: 'var(--faint)' }}>
            {CULTURE_PIECES.map((piece) => (
              <div key={piece.id} style={{ backgroundColor: 'var(--paper)' }}>
                <CulturePieceCard
                  piece={piece}
                  isSelected={selectedPieceId === piece.id}
                  onClick={(id) => setSelectedPieceId(id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* References tab */}
        {activeTab === 'references' && <CultureReferenceStrip />}

        {/* Lecture tab */}
        {activeTab === 'lecture' && (
          <div>
            <div className="mb-8">
              <h2 className="heading-2 mb-2" style={{ color: 'var(--ink)' }}>
                Lecture
              </h2>
              <p className="body-small max-w-lg" style={{ color: 'var(--ink-soft)', opacity: 0.7 }}>
                How to read each piece — its detail, its field, its right moment.
              </p>
            </div>
            <div className="space-y-4">
              {CULTURE_PIECES.map((piece) => (
                <LectureBlock key={piece.id} piece={piece} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
