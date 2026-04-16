import Image from 'next/image'
import { X } from 'lucide-react'
import type { CulturePiece } from './data'

interface Props {
  piece: CulturePiece
  onClose: () => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-3 uppercase tracking-[0.1em]"
      style={{ fontSize: '0.63rem', fontWeight: 600, color: 'var(--warmgrey)' }}
    >
      {children}
    </p>
  )
}

function Divider() {
  return <div className="my-7" style={{ borderTop: '0.5px solid var(--faint)' }} />
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span style={{ color: 'var(--warmgrey)', flexShrink: 0, paddingTop: '1px' }}>—</span>
          <span className="body-small" style={{ color: 'var(--ink-soft)' }}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function CulturePieceDetail({ piece, onClose }: Props) {
  return (
    <div
      className="mt-px"
      style={{
        border: '1px solid var(--ink)',
        backgroundColor: 'var(--paper)',
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '0.5px solid var(--faint)' }}
      >
        <div className="flex items-center gap-3">
          <p
            className="uppercase tracking-[0.1em]"
            style={{ fontSize: '0.63rem', fontWeight: 600, color: 'var(--warmgrey)' }}
          >
            {piece.category}
          </p>
          <span style={{ color: 'var(--faint)' }}>·</span>
          <p
            className="uppercase tracking-[0.1em]"
            style={{ fontSize: '0.63rem', fontWeight: 600, color: 'var(--ink)' }}
          >
            {piece.title}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center transition-opacity hover:opacity-50"
          aria-label="Close"
        >
          <X className="h-4 w-4" style={{ color: 'var(--ink-soft)' }} />
        </button>
      </div>

      {/* Body */}
      <div className="grid md:grid-cols-[300px_1fr]">
        {/* Image column */}
        <div
          className="relative hidden md:block"
          style={{ borderRight: '0.5px solid var(--faint)', minHeight: '400px' }}
        >
          <Image
            src={piece.image}
            alt={piece.title}
            fill
            sizes="300px"
            className="object-cover"
          />
        </div>

        {/* Content column */}
        <div className="overflow-y-auto p-8 md:p-10" style={{ maxHeight: '680px' }}>

          {/* 1. Overview */}
          <SectionLabel>Overview</SectionLabel>
          <p className="body" style={{ color: 'var(--ink-soft)', lineHeight: '1.65' }}>
            {piece.overview}
          </p>

          <Divider />

          {/* 2. Characteristics */}
          <SectionLabel>Characteristics</SectionLabel>
          <div className="space-y-3">
            {piece.characteristics.map((c) => (
              <div key={c.label} className="flex gap-6">
                <p
                  className="w-28 shrink-0 uppercase tracking-wide"
                  style={{ fontSize: '0.63rem', fontWeight: 600, color: 'var(--warmgrey)', letterSpacing: '0.09em', paddingTop: '1px' }}
                >
                  {c.label}
                </p>
                <p className="body-small flex-1" style={{ color: 'var(--ink-soft)' }}>
                  {c.value}
                </p>
              </div>
            ))}
          </div>

          <Divider />

          {/* 3. Product Advantages */}
          <SectionLabel>Product Advantages</SectionLabel>
          <BulletList items={piece.productAdvantages} />

          <Divider />

          {/* 4. Client Benefits */}
          <SectionLabel>Client Benefits</SectionLabel>
          <BulletList items={piece.clientBenefits} />

          {/* 5. Price Positioning */}
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

          {/* 6. Seller Advice */}
          <SectionLabel>Seller Advice</SectionLabel>
          <p
            className="body-small"
            style={{
              color: 'var(--ink)',
              backgroundColor: 'rgba(27, 67, 50, 0.04)',
              padding: '12px 14px',
              borderLeft: '2px solid var(--primary)',
              lineHeight: '1.65',
            }}
          >
            {piece.sellerAdvice}
          </p>

          <Divider />

          {/* 7. Lecture */}
          <SectionLabel>Lecture</SectionLabel>
          <div className="space-y-4">
            <div>
              <p
                className="mb-1 uppercase tracking-wide"
                style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--warmgrey)', letterSpacing: '0.1em' }}
              >
                Who can wear it
              </p>
              <p className="body-small" style={{ color: 'var(--ink-soft)' }}>
                {piece.whoCanWearIt}
              </p>
            </div>
            <div>
              <p
                className="mb-1 uppercase tracking-wide"
                style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--warmgrey)', letterSpacing: '0.1em' }}
              >
                What to see first
              </p>
              <p className="body-small" style={{ color: 'var(--ink-soft)' }}>
                {piece.firstDetail}
              </p>
            </div>
            <div>
              <p
                className="mb-1 uppercase tracking-wide"
                style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--warmgrey)', letterSpacing: '0.1em' }}
              >
                What not to force
              </p>
              <p className="body-small" style={{ color: 'var(--ink-soft)' }}>
                {piece.doNotForce}
              </p>
            </div>
            <div>
              <p
                className="mb-1 uppercase tracking-wide"
                style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--warmgrey)', letterSpacing: '0.1em' }}
              >
                Cultural resonance
              </p>
              <p className="body-small italic" style={{ color: 'var(--ink-soft)', opacity: 0.75 }}>
                {piece.culturalEcho}
              </p>
            </div>
          </div>

          <Divider />

          {/* 8. Cross-sell */}
          <SectionLabel>Cross-sell</SectionLabel>
          <p className="body-small" style={{ color: 'var(--ink-soft)' }}>
            {piece.crossSell}
          </p>

        </div>
      </div>
    </div>
  )
}
