'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import type { CulturePiece } from './data'

interface Props {
  piece: CulturePiece
  onClose: () => void
}

function SectionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="grid gap-8 py-10 md:grid-cols-[180px_1fr]"
      style={{ borderTop: '0.5px solid var(--faint)' }}
    >
      <p
        className="pt-0.5 uppercase tracking-[0.1em]"
        style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--warmgrey)' }}
      >
        {label}
      </p>
      <div>{children}</div>
    </div>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span style={{ color: 'var(--warmgrey)', flexShrink: 0 }}>—</span>
          <span className="body-small" style={{ color: 'var(--ink-soft)' }}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function CulturePieceDetail({ piece, onClose }: Props) {
  const [visible, setVisible] = useState(false)

  // Fade-in on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{
        backgroundColor: 'var(--paper)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'scale(0.995)',
        transition: 'opacity 280ms ease, transform 280ms ease',
      }}
    >
      <div className="mx-auto max-w-5xl px-6 pb-32 pt-10 md:px-16">

        {/* Top bar */}
        <div className="mb-12 flex items-start justify-between">
          <div>
            <p
              className="mb-3 uppercase tracking-[0.14em]"
              style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--warmgrey)' }}
            >
              {piece.category}
            </p>
            <h1 className="heading-1" style={{ color: 'var(--ink)', maxWidth: '520px' }}>
              {piece.title}
            </h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-8 mt-1 flex h-9 w-9 shrink-0 items-center justify-center transition-opacity hover:opacity-40"
            aria-label="Close"
          >
            <X className="h-5 w-5" style={{ color: 'var(--ink)' }} />
          </button>
        </div>

        {/* Hero: image + overview + characteristics */}
        <div className="mb-4 grid gap-12 md:grid-cols-[2fr_3fr]">
          {/* Image */}
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: '3/4' }}>
            <Image
              src={piece.image}
              alt={piece.title}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover"
              priority
            />
          </div>

          {/* Overview + Characteristics */}
          <div className="flex flex-col justify-start pt-2">
            <p
              className="mb-4 uppercase tracking-[0.1em]"
              style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--warmgrey)' }}
            >
              Overview
            </p>
            <p className="body mb-10" style={{ color: 'var(--ink-soft)', lineHeight: '1.7' }}>
              {piece.overview}
            </p>

            <p
              className="mb-5 uppercase tracking-[0.1em]"
              style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--warmgrey)', borderTop: '0.5px solid var(--faint)', paddingTop: '32px' }}
            >
              Characteristics
            </p>
            <div className="space-y-4">
              {piece.characteristics.map((c) => (
                <div key={c.label} className="flex gap-6">
                  <p
                    className="w-28 shrink-0 uppercase tracking-wide"
                    style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--warmgrey)', letterSpacing: '0.09em', paddingTop: '1px' }}
                  >
                    {c.label}
                  </p>
                  <p className="body-small flex-1" style={{ color: 'var(--ink-soft)' }}>
                    {c.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Full-width sections */}

        <SectionRow label="Product Advantages">
          <BulletList items={piece.productAdvantages} />
        </SectionRow>

        <SectionRow label="Client Benefits">
          <BulletList items={piece.clientBenefits} />
        </SectionRow>

        {piece.pricePositioning && (
          <SectionRow label="Price Positioning">
            <p
              className="body-small"
              style={{
                color: 'var(--gold)',
                borderLeft: '2px solid var(--gold)',
                paddingLeft: '14px',
                lineHeight: '1.65',
              }}
            >
              {piece.pricePositioning}
            </p>
          </SectionRow>
        )}

        <SectionRow label="Seller Advice">
          <p
            className="body-small"
            style={{
              color: 'var(--ink)',
              borderLeft: '2px solid var(--primary)',
              paddingLeft: '14px',
              lineHeight: '1.65',
            }}
          >
            {piece.sellerAdvice}
          </p>
        </SectionRow>

        <SectionRow label="Lecture">
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p
                className="mb-2 uppercase tracking-[0.09em]"
                style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--warmgrey)' }}
              >
                Who can wear it
              </p>
              <p className="body-small" style={{ color: 'var(--ink-soft)' }}>
                {piece.whoCanWearIt}
              </p>
            </div>
            <div>
              <p
                className="mb-2 uppercase tracking-[0.09em]"
                style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--warmgrey)' }}
              >
                What to see first
              </p>
              <p className="body-small" style={{ color: 'var(--ink-soft)' }}>
                {piece.firstDetail}
              </p>
            </div>
            <div>
              <p
                className="mb-2 uppercase tracking-[0.09em]"
                style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--warmgrey)' }}
              >
                What not to force
              </p>
              <p className="body-small" style={{ color: 'var(--ink-soft)' }}>
                {piece.doNotForce}
              </p>
            </div>
            <div>
              <p
                className="mb-2 uppercase tracking-[0.09em]"
                style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--warmgrey)' }}
              >
                Cultural resonance
              </p>
              <p className="body-small italic" style={{ color: 'var(--ink-soft)', opacity: 0.75 }}>
                {piece.culturalEcho}
              </p>
            </div>
          </div>
        </SectionRow>

        <SectionRow label="Cross-sell">
          <p className="body-small" style={{ color: 'var(--ink-soft)' }}>
            {piece.crossSell}
          </p>
        </SectionRow>

      </div>
    </div>
  )
}
