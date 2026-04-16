import Image from 'next/image'
import { CULTURAL_REFERENCES, CULTURE_PIECES } from './data'

interface Props {
  onSelect: (id: string) => void
}

export function CultureReferenceStrip({ onSelect }: Props) {
  return (
    <div>
      {/* Header */}
      <div className="mb-2">
        <p className="label mb-3" style={{ color: 'var(--warmgrey)' }}>
          Reference Field
        </p>
        <h2 className="heading-2 mb-2" style={{ color: 'var(--ink)' }}>
          Cultural Resonances
        </h2>
      </div>
      <p className="body-small mb-8 max-w-lg italic" style={{ color: 'var(--ink-soft)', opacity: 0.65 }}>
        These references constitute a field of resonance, not declared collaborations or claimed influences.
      </p>

      {/* Cards */}
      <div className="grid gap-px md:grid-cols-3" style={{ backgroundColor: 'var(--faint)' }}>
        {CULTURAL_REFERENCES.map((ref) => {
          const linked = CULTURE_PIECES.filter((p) => ref.linkedPieces.includes(p.id))
          return (
            <button
              key={ref.id}
              type="button"
              onClick={() => onSelect(ref.id)}
              className="group flex flex-col text-left"
              style={{ backgroundColor: 'var(--paper)' }}
            >
              {/* Image */}
              <div className="relative aspect-square w-full overflow-hidden bg-bg-soft">
                <Image
                  src={ref.image}
                  alt={`${ref.artist} — ${ref.title}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                {/* Hover hint */}
                <div
                  className="absolute inset-0 flex items-end justify-end p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  style={{ background: 'linear-gradient(to top, rgba(26,26,26,0.2) 0%, transparent 60%)' }}
                >
                  <span
                    className="uppercase tracking-[0.12em]"
                    style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}
                  >
                    Read
                  </span>
                </div>
              </div>

              {/* Text */}
              <div
                className="flex flex-1 flex-col p-6"
                style={{ borderTop: '0.5px solid var(--faint)' }}
              >
                <p className="label mb-1" style={{ color: 'var(--warmgrey)' }}>
                  {ref.field}
                </p>
                <p className="heading-3 mb-0.5" style={{ color: 'var(--ink)' }}>
                  {ref.artist}
                </p>
                <p className="body-small mb-4 italic" style={{ color: 'var(--ink-soft)' }}>
                  {ref.title}
                </p>
                <p className="body-small flex-1" style={{ color: 'var(--ink-soft)', opacity: 0.8 }}>
                  {ref.caption}
                </p>

                {linked.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {linked.map((p) => (
                      <span
                        key={p.id}
                        className="label"
                        style={{
                          color: 'var(--ink-soft)',
                          border: '0.5px solid var(--warmgrey)',
                          padding: '3px 8px',
                          opacity: 0.7,
                        }}
                      >
                        {p.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
