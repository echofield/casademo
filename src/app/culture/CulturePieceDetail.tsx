import Image from 'next/image'
import { X } from 'lucide-react'
import type { CulturePiece } from './data'

interface Props {
  piece: CulturePiece
  onClose: () => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="label mb-2" style={{ color: 'var(--warmgrey)' }}>
      {children}
    </p>
  )
}

function Divider() {
  return <div className="my-6" style={{ borderTop: '0.5px solid var(--faint)' }} />
}

export function CulturePieceDetail({ piece, onClose }: Props) {
  return (
    <div
      className="mt-6"
      style={{
        border: '1px solid var(--faint)',
        backgroundColor: 'var(--paper)',
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '0.5px solid var(--faint)' }}
      >
        <div className="flex items-center gap-3">
          <p className="label" style={{ color: 'var(--warmgrey)' }}>
            {piece.category}
          </p>
          <span style={{ color: 'var(--faint)' }}>·</span>
          <p className="label" style={{ color: 'var(--ink)' }}>
            {piece.title}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center transition-colors hover:opacity-60"
          aria-label="Close detail"
        >
          <X className="h-4 w-4" style={{ color: 'var(--ink-soft)' }} />
        </button>
      </div>

      {/* Body */}
      <div className="grid gap-0 md:grid-cols-[320px_1fr]">
        {/* Image column */}
        <div
          className="relative min-h-[320px]"
          style={{ borderRight: '0.5px solid var(--faint)' }}
        >
          <Image
            src={piece.image}
            alt={piece.title}
            fill
            sizes="320px"
            className="object-cover"
          />
        </div>

        {/* Content column */}
        <div className="overflow-y-auto p-8" style={{ maxHeight: '600px' }}>
          {/* Overview */}
          <SectionLabel>Overview</SectionLabel>
          <p className="body" style={{ color: 'var(--ink-soft)' }}>
            {piece.overview}
          </p>

          <Divider />

          {/* Characteristics */}
          <SectionLabel>Construction & Materials</SectionLabel>
          <div className="space-y-3">
            {piece.characteristics.map((c) => (
              <div key={c.label} className="flex gap-4">
                <p
                  className="body-small w-32 shrink-0 font-medium uppercase tracking-wide"
                  style={{ color: 'var(--warmgrey)', fontSize: '0.65rem', letterSpacing: '0.1em' }}
                >
                  {c.label}
                </p>
                <p className="body-small" style={{ color: 'var(--ink-soft)' }}>
                  {c.value}
                </p>
              </div>
            ))}
          </div>

          {/* Price positioning */}
          {piece.pricePositioning && (
            <>
              <Divider />
              <SectionLabel>Price Positioning</SectionLabel>
              <p
                className="body-small"
                style={{
                  color: 'var(--gold)',
                  backgroundColor: 'rgba(163, 135, 103, 0.06)',
                  padding: '12px 14px',
                  borderLeft: '2px solid var(--gold)',
                }}
              >
                {piece.pricePositioning}
              </p>
            </>
          )}

          <Divider />

          {/* Resonance culturelle */}
          <SectionLabel>Cultural Resonance</SectionLabel>
          <p
            className="body-small italic"
            style={{ color: 'var(--ink-soft)', opacity: 0.75 }}
          >
            {piece.resonanceCulturelle}
          </p>

          <Divider />

          {/* Styling notes */}
          <SectionLabel>Silhouette & Occasion</SectionLabel>
          <p className="body-small" style={{ color: 'var(--ink-soft)' }}>
            {piece.stylingNotes}
          </p>
        </div>
      </div>
    </div>
  )
}
