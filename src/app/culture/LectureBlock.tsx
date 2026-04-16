import Image from 'next/image'
import type { CulturePiece } from './data'

interface Props {
  piece: CulturePiece
}

interface RowProps {
  label: string
  value: string
  accent?: boolean
}

function LectureRow({ label, value, accent }: RowProps) {
  return (
    <div
      className="flex gap-6 py-4"
      style={{ borderBottom: '0.5px solid var(--faint)' }}
    >
      <p
        className="w-44 shrink-0 pt-0.5 uppercase tracking-wide"
        style={{ fontSize: '0.63rem', fontWeight: 600, color: 'var(--warmgrey)', letterSpacing: '0.1em' }}
      >
        {label}
      </p>
      <p
        className="body-small flex-1"
        style={{ color: accent ? 'var(--gold)' : 'var(--ink-soft)' }}
      >
        {value}
      </p>
    </div>
  )
}

export function LectureBlock({ piece }: Props) {
  return (
    <div style={{ border: '1px solid var(--faint)' }}>
      {/* Header */}
      <div
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: '0.5px solid var(--faint)', backgroundColor: 'rgba(250,248,242,0.6)' }}
      >
        <div className="relative h-10 w-10 shrink-0 overflow-hidden" style={{ border: '0.5px solid var(--faint)' }}>
          <Image
            src={piece.image}
            alt={piece.title}
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
        <div>
          <p className="label" style={{ color: 'var(--warmgrey)' }}>
            {piece.category}
          </p>
          <p className="heading-3" style={{ color: 'var(--ink)' }}>
            {piece.title}
          </p>
        </div>
      </div>

      {/* Rows */}
      <div className="px-6">
        <LectureRow label="Who can wear it" value={piece.whoCanWearIt} />
        <LectureRow label="What to see first" value={piece.firstDetail} />
        <LectureRow label="What not to force" value={piece.doNotForce} />
        <LectureRow label="Cultural resonance" value={piece.culturalEcho} accent />
        <LectureRow label="Pairing" value={piece.crossSell} />
        <div className="flex gap-6 py-4">
          <p
            className="w-44 shrink-0 pt-0.5 uppercase tracking-wide"
            style={{ fontSize: '0.63rem', fontWeight: 600, color: 'var(--warmgrey)', letterSpacing: '0.1em' }}
          >
            The right moment
          </p>
          <p className="body-small flex-1" style={{ color: 'var(--ink-soft)' }}>
            {piece.rightMoment}
          </p>
        </div>
      </div>
    </div>
  )
}
