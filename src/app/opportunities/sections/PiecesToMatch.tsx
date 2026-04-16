'use client'

import Link from 'next/link'
import type { Client360 } from '@/lib/types'
import type { PieceMatch, PieceSizeCategory, PieceState } from '../data/pieces'
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

function resolveSizeLabel(
  client: Client360 | undefined,
  sizeCategory: PieceSizeCategory,
): string | null {
  if (!client || !sizeCategory) return null
  const known = client.known_sizes?.find((k) => k.category === sizeCategory)
  if (!known?.size) return null
  const prefix = known.size_type && known.size_type !== 'INTL' ? `${known.size_type} ` : ''
  return `Size ${prefix}${known.size}`
}

function StateTag({ state }: { state: PieceState }) {
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

function PieceRow({
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
  const sizeLabel = resolveSizeLabel(client, piece.sizeCategory)

  return (
    <article
      className="grid grid-cols-1 gap-8 py-9 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_auto]"
    >
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <span
            className="text-[10px] font-medium uppercase tracking-[0.18em] tabular-nums"
            style={{ color: 'var(--warmgrey)' }}
          >
            {ordinal}
          </span>
          <div className="md:hidden">
            <StateTag state={piece.state} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="font-serif text-2xl leading-[1.2]" style={{ color: 'var(--ink)' }}>
            {piece.title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span
              className="text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ color: 'var(--warmgrey)' }}
            >
              {piece.category}
            </span>
            {sizeLabel && (
              <>
                <span className="text-xs" style={{ color: 'var(--warmgrey)' }}>·</span>
                <span
                  className="text-[10px] font-medium uppercase tracking-[0.14em]"
                  style={{ color: 'var(--warmgrey)' }}
                >
                  {sizeLabel}
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-sm" style={{ color: 'var(--ink-soft)' }}>
            {piece.materialNote}
          </p>
        </div>

        {client ? (
          <div
            className="flex flex-col gap-2 border-l-2 pl-4"
            style={{ borderColor: 'var(--gold)' }}
          >
            <p
              className="text-[10px] font-medium uppercase tracking-[0.18em]"
              style={{ color: 'var(--warmgrey)' }}
            >
              For
            </p>
            <Link
              href={`/clients/${client.id}`}
              className="group inline-flex flex-wrap items-baseline gap-x-2 gap-y-1"
            >
              <span
                className="font-serif text-base leading-tight transition-colors group-hover:underline underline-offset-4"
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
          </div>
        ) : (
          <p className="text-sm italic" style={{ color: 'var(--warmgrey)' }}>
            No paired client resolved.
          </p>
        )}

        <p className="text-[15px] leading-relaxed" style={{ color: 'var(--ink)' }}>
          {piece.pairing.reason}
        </p>

        {piece.inventoryNote && (
          <p className="text-xs" style={{ color: 'var(--warmgrey)' }}>
            {piece.inventoryNote}
          </p>
        )}
      </div>

      <div className="flex flex-row items-start justify-between gap-6 md:flex-col md:items-end md:justify-start md:text-right">
        <div className="hidden md:block">
          <StateTag state={piece.state} />
        </div>

        <div className="md:mt-6">
          <p
            className="text-[10px] font-medium uppercase tracking-[0.14em]"
            style={{ color: 'var(--warmgrey)' }}
          >
            Boutique
          </p>
          <p
            className="mt-1 font-serif text-xl"
            style={{ color: 'var(--ink)' }}
          >
            {formatEur(piece.priceEur)}
          </p>
        </div>

        <div className="md:mt-4">
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
          Pulled from the live catalog, matched against a named client’s affinity and known size. One pairing per piece.
        </p>
      </div>

      {pieces.length === 0 ? (
        <p className="text-sm italic" style={{ color: 'var(--warmgrey)' }}>
          No pairings ready yet.
        </p>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--faint)' }}>
          {pieces.map((p, i) => (
            <div
              key={p.id}
              style={{ borderTop: i === 0 ? 'none' : '0.5px solid var(--faint)' }}
            >
              <PieceRow
                piece={p}
                client={clientByPiece.get(p.id)}
                index={i}
                total={pieces.length}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
