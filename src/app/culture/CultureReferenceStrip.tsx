import Image from 'next/image'
import { CULTURAL_REFERENCES, CULTURE_PIECES } from './data'

export function CultureReferenceStrip() {
  return (
    <div>
      {/* Section header */}
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <p className="label mb-3" style={{ color: 'var(--warmgrey)' }}>
            Reference Field
          </p>
          <h2 className="heading-2 mb-2" style={{ color: 'var(--ink)' }}>
            Cultural Resonances
          </h2>
        </div>
      </div>
      <p className="body-small mb-8 max-w-lg italic" style={{ color: 'var(--ink-soft)', opacity: 0.65 }}>
        These references constitute a field of resonance, not declared collaborations or claimed influences.
      </p>

      {/* Reference cards */}
      <div className="grid gap-px md:grid-cols-3" style={{ backgroundColor: 'var(--faint)' }}>
        {CULTURAL_REFERENCES.map((ref) => {
          const linked = CULTURE_PIECES.filter((p) => ref.linkedPieces.includes(p.id))
          return (
            <div
              key={ref.id}
              className="flex flex-col"
              style={{ backgroundColor: 'var(--paper)' }}
            >
              {/* Image */}
              <div className="relative aspect-square w-full overflow-hidden bg-bg-soft">
                <Image
                  src={ref.image}
                  alt={`${ref.artist} — ${ref.title}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>

              {/* Text */}
              <div className="flex flex-1 flex-col p-6">
                <p className="label mb-1" style={{ color: 'var(--warmgrey)' }}>
                  {ref.field}
                </p>
                <p className="heading-3 mb-0.5" style={{ color: 'var(--ink)' }}>
                  {ref.artist}
                </p>
                <p
                  className="body-small mb-4 italic"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  {ref.title}
                </p>
                <p className="body-small flex-1" style={{ color: 'var(--ink-soft)', opacity: 0.8 }}>
                  {ref.caption}
                </p>

                {/* Linked pieces */}
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
            </div>
          )
        })}
      </div>
    </div>
  )
}
