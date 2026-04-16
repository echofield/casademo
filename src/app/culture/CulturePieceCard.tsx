import type { CulturePiece } from './data'
import { FadeImage } from './FadeImage'

interface Props {
  piece: CulturePiece
  isSelected: boolean
  onClick: (id: string) => void
}

export function CulturePieceCard({ piece, isSelected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={() => onClick(piece.id)}
      className="group w-full text-left"
      aria-pressed={isSelected}
    >
      <div
        style={{
          border: isSelected ? '1.5px solid var(--ink)' : '1px solid transparent',
          transition: 'border-color 150ms',
        }}
      >
        {/* Image */}
        <div className="relative aspect-square w-full overflow-hidden" style={{ backgroundColor: 'var(--paper-dim)' }}>
          <FadeImage
            src={piece.image}
            alt={piece.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {/* Hover overlay with "Read" hint */}
          {!isSelected && (
            <div
              className="absolute inset-0 flex items-end justify-end p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style={{ background: 'linear-gradient(to top, rgba(26,26,26,0.18) 0%, transparent 60%)' }}
            >
              <span
                className="uppercase tracking-[0.12em]"
                style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}
              >
                Read
              </span>
            </div>
          )}
          {/* Selected indicator */}
          {isSelected && (
            <div className="absolute inset-0 flex items-end justify-end p-3">
              <span
                className="uppercase tracking-[0.12em]"
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  color: 'var(--paper)',
                  backgroundColor: 'var(--ink)',
                  padding: '3px 7px',
                }}
              >
                Open
              </span>
            </div>
          )}
        </div>

        {/* Text */}
        <div className="p-4" style={{ borderTop: '0.5px solid var(--faint)' }}>
          <p
            className="mb-1.5 uppercase tracking-[0.1em]"
            style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--warmgrey)' }}
          >
            {piece.category}
          </p>
          <h3
            className="mb-2 font-sans text-sm font-medium leading-snug"
            style={{ color: 'var(--ink)' }}
          >
            {piece.title}
          </h3>
          <p className="body-small mb-3" style={{ color: 'var(--ink-soft)' }}>
            {piece.descriptor}
          </p>
          <p
            className="body-small italic"
            style={{ color: 'var(--gold)' }}
          >
            {piece.sellerAngle}
          </p>
        </div>
      </div>
    </button>
  )
}
