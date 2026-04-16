import Image from 'next/image'
import type { CulturePiece } from './data'

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
      className="group w-full text-left transition-opacity duration-200"
      aria-pressed={isSelected}
    >
      <div
        className="overflow-hidden"
        style={{
          border: isSelected ? '1.5px solid var(--ink)' : '1px solid var(--faint)',
          transition: 'border-color 200ms',
        }}
      >
        <div className="relative aspect-square w-full overflow-hidden bg-bg-soft">
          <Image
            src={piece.image}
            alt={piece.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
        <div className="p-4">
          <p className="label mb-1.5" style={{ color: 'var(--warmgrey)' }}>
            {piece.category}
          </p>
          <h3 className="heading-3 mb-2 leading-snug" style={{ color: 'var(--ink)' }}>
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
