'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Client360 } from '@/lib/types'
import type { PieceMatch, PieceState } from '../data/pieces'
import { PIECE_STATE_LABEL } from '../data/pieces'
import { formatEur } from '../data/aggregate'

interface Props {
  pieces: PieceMatch[]
  clientByPiece: Map<string, Client360>
}

const TIER_LABEL: Record<string, string> = {
  rainbow: 'Rainbow',
  diplomatico: 'Diplomatico',
  grand_prix: 'Grand Prix',
  optimisto: 'Optimisto',
  kaizen: 'Kaizen',
  idealiste: 'Idealiste',
}

const TOUCHPOINT_LABEL: Record<PieceMatch['pairing']['recommendedTouchpoint'], string> = {
  'in-boutique': 'In-boutique',
  'suite-delivery': 'Suite delivery',
  'personal-shopper-call': 'Personal shopper call',
}

function StateBadge({ state }: { state: PieceState }) {
  const color =
    state === 'new' ? 'var(--gold)' : state === 'limited' ? 'var(--ink)' : 'var(--ink-soft)'
  return (
    <span
      className="text-[10px] font-medium uppercase tracking-[0.18em]"
      style={{ color }}
    >
      {PIECE_STATE_LABEL[state]}
    </span>
  )
}

function PieceCard({
  piece,
  client,
  index,
  total,
}: {
  piece: PieceMatch
  client: Client360 | undefined
  index: number
  total: number
}) {
  const ordinal = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`

  return (
    <article
      className="flex flex-col bg-[var(--paper)]"
      style={{ border: '0.5px solid var(--faint)' }}
    >
      <div
        className="relative aspect-[4/5] w-full overflow-hidden"
        style={{ backgroundColor: 'var(--paper-dim)' }}
      >
        <Image
          src={piece.image}
          alt={piece.title}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col gap-5 p-6 md:p-7">
        <div className="flex items-center justify-between gap-4">
          <span
            className="text-[10px] font-medium uppercase tracking-[0.18em] tabular-nums"
            style={{ color: 'var(--warmgrey)' }}
          >
            {ordinal}
          </span>
          <StateBadge state={piece.state} />
        </div>

        <div>
          <p
            className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em]"
            style={{ color: 'var(--warmgrey)' }}
          >
            {piece.category}
          </p>
          <h3
            className="font-serif text-2xl leading-[1.25]"
            style={{ color: 'var(--ink)' }}
          >
            {piece.title}
          </h3>
        </div>

        {client ? (
          <Link
            href={`/clients/${client.id}`}
            className="group inline-flex flex-wrap items-center gap-x-2 gap-y-1"
          >
            <span
              className="text-sm transition-colors group-hover:underline underline-offset-4"
              style={{ color: 'var(--ink)' }}
            >
              {client.first_name} {client.last_name}
            </span>
            <span className="text-xs" style={{ color: 'var(--warmgrey)' }}>·</span>
            <span
              className="text-[11px] font-medium uppercase tracking-[0.12em]"
              style={{ color: 'var(--warmgrey)' }}
            >
              {TIER_LABEL[client.tier] ?? client.tier}
            </span>
          </Link>
        ) : (
          <p className="text-sm italic" style={{ color: 'var(--warmgrey)' }}>
            No paired client available.
          </p>
        )}

        <p
          className="text-[15px] leading-relaxed"
          style={{ color: 'var(--ink)' }}
        >
          {piece.pairing.reason}
        </p>

        {piece.inventoryNote && (
          <p className="text-xs" style={{ color: 'var(--warmgrey)' }}>
            {piece.inventoryNote}
          </p>
        )}

        <div
          className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t pt-5"
          style={{ borderColor: 'var(--faint)' }}
        >
          <div>
            <p
              className="text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ color: 'var(--warmgrey)' }}
            >
              Touchpoint
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--ink)' }}>
              {TOUCHPOINT_LABEL[piece.pairing.recommendedTouchpoint]}
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ color: 'var(--warmgrey)' }}
            >
              Boutique
            </p>
            <p
              className="mt-1 font-serif text-lg"
              style={{ color: 'var(--ink)' }}
            >
              {formatEur(piece.priceEur)}
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}

export function PiecesToMatch({ pieces, clientByPiece }: Props) {
  return (
    <section
      className="border-t pt-14 pb-14 md:pt-16 md:pb-16"
      style={{ borderColor: 'var(--faint)' }}
    >
      <div className="mb-10">
        <p
          className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em]"
          style={{ color: 'var(--warmgrey)' }}
        >
          Product pairings
        </p>
        <h2 className="heading-2 mb-2" style={{ color: 'var(--ink)' }}>
          Pieces to match
        </h2>
        <p
          className="max-w-xl text-sm"
          style={{ color: 'var(--ink-soft)', opacity: 0.78 }}
        >
          Curated piece-to-client pairings. One named client per piece, chosen only when the affinity is explicit.
        </p>
      </div>

      {pieces.length === 0 ? (
        <p className="text-sm italic" style={{ color: 'var(--warmgrey)' }}>
          No pairings ready yet.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {pieces.map((p, i) => (
            <PieceCard
              key={p.id}
              piece={p}
              client={clientByPiece.get(p.id)}
              index={i}
              total={pieces.length}
            />
          ))}
        </div>
      )}
    </section>
  )
}
