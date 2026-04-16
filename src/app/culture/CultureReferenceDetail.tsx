'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { CulturalReference } from './data'
import { CULTURE_PIECES } from './data'
import { FadeImage } from './FadeImage'

interface Props {
  reference: CulturalReference
  onClose: () => void
}

export function CultureReferenceDetail({ reference, onClose }: Props) {
  const [visible, setVisible] = useState(false)
  const linked = CULTURE_PIECES.filter((p) => reference.linkedPieces.includes(p.id))

  useEffect(() => {
    let id1: number, id2: number
    id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setVisible(true))
    })
    return () => {
      cancelAnimationFrame(id1)
      cancelAnimationFrame(id2)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const { sheet } = reference

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{
        backgroundColor: 'var(--paper)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'scale(0.993)',
        transition: 'opacity 340ms cubic-bezier(0.16, 1, 0.3, 1), transform 340ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Subtle tonal wash behind the entire sheet */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ backgroundColor: sheet.bgTint }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl px-6 pb-32 pt-10 md:px-16">

        {/* Close */}
        <div className="mb-10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center transition-opacity hover:opacity-40"
            aria-label="Close"
          >
            <X className="h-5 w-5" style={{ color: 'var(--ink)' }} />
          </button>
        </div>

        {/* Field label */}
        <p
          className="mb-5 uppercase tracking-[0.14em]"
          style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--warmgrey)' }}
        >
          {reference.field}
        </p>

        {/* Main title */}
        <h1
          className="heading-display mb-16 uppercase"
          style={{
            color: 'var(--ink)',
            letterSpacing: '0.04em',
            lineHeight: 1.05,
          }}
        >
          {sheet.headline}
        </h1>

        {/* Body: text left, image right */}
        <div className="grid gap-16 md:grid-cols-[3fr_2fr]">

          {/* Text block */}
          <div>
            {/* Main paragraphs */}
            <div className="space-y-6 mb-10">
              {sheet.body.map((para, i) => (
                <p
                  key={i}
                  className="body"
                  style={{ color: 'var(--ink-soft)', lineHeight: '1.75' }}
                >
                  {para}
                </p>
              ))}
            </div>

            {/* Resonance — visually separated, restrained italic */}
            <div
              className="mb-8 space-y-3"
              style={{ borderTop: '0.5px solid var(--faint)', paddingTop: '32px' }}
            >
              {sheet.resonance.map((line, i) => (
                <p
                  key={i}
                  className="body-small italic"
                  style={{ color: 'var(--ink-soft)', opacity: 0.7, lineHeight: '1.7' }}
                >
                  {line}
                </p>
              ))}
            </div>

            {/* Closing signature */}
            <p
              className="body-small"
              style={{
                color: 'var(--gold)',
                borderLeft: '2px solid var(--gold)',
                paddingLeft: '14px',
                lineHeight: '1.65',
              }}
            >
              {sheet.closing}
            </p>

            {/* Linked pieces */}
            {linked.length > 0 && (
              <div
                className="mt-12 pt-8"
                style={{ borderTop: '0.5px solid var(--faint)' }}
              >
                <p
                  className="mb-4 uppercase tracking-[0.1em]"
                  style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--warmgrey)' }}
                >
                  Resonates with
                </p>
                <div className="flex flex-wrap gap-3">
                  {linked.map((p) => (
                    <span
                      key={p.id}
                      className="body-small"
                      style={{
                        color: 'var(--ink-soft)',
                        border: '0.5px solid var(--faint)',
                        padding: '4px 10px',
                      }}
                    >
                      {p.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Image */}
          <div
            className="relative w-full overflow-hidden"
            style={{ aspectRatio: '1 / 1', alignSelf: 'start', backgroundColor: 'var(--paper-dim)' }}
          >
            <FadeImage
              src={reference.image}
              alt={`${reference.artist} — ${reference.title}`}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover"
              priority
            />
          </div>
        </div>

      </div>
    </div>
  )
}
