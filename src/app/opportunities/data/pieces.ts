export type PieceState = 'new' | 'restock' | 'limited'

export const PIECE_STATE_LABEL: Record<PieceState, string> = {
  new: 'New arrival',
  restock: 'Back in stock',
  limited: 'Limited run',
}

/**
 * Maps to KnownSizeItem.category values used in the demo roster
 * (`tops`, `bottoms`, `outerwear`, `shoes`). `null` for accessories / OSFA.
 */
export type PieceSizeCategory = 'tops' | 'bottoms' | 'outerwear' | 'shoes' | null

export type PieceMatch = {
  id: string
  /** Product name as it appears in the catalog / purchase history. */
  title: string
  /** Category as seen on the client 360 purchase rows (jacket, knitwear, accessories, etc.). */
  category: string
  /** Used to look up the paired client's known size. null = no size applicable. */
  sizeCategory: PieceSizeCategory
  /** One-line material / construction note — the kind a seller would use in a message. */
  materialNote: string
  priceEur: number
  state: PieceState
  /** Optional inventory brief — size run, hold count, etc. */
  inventoryNote?: string
  pairing: {
    clientId: string
    /** One-sentence rationale in Casa One voice — not a score, not marketing. */
    reason: string
    recommendedTouchpoint: 'in-boutique' | 'suite-delivery' | 'personal-shopper-call'
  }
}

/**
 * Hand-curated piece-to-client pairings, using real catalog names from the demo
 * affinity library. Each piece targets ONE named client whose affinity AND
 * (where applicable) known size match. Product-first framing, not a recommender.
 */
export const PIECES_TO_MATCH: PieceMatch[] = [
  {
    id: 'cashmere-wrap-coat-nikolai',
    title: 'Cashmere wrap coat',
    category: 'Outerwear',
    sizeCategory: 'outerwear',
    materialNote: 'Double-face cashmere, long line, belted.',
    priceEur: 2800,
    state: 'restock',
    inventoryNote: 'Back in his size for the first time since autumn.',
    pairing: {
      clientId: 'client-nikolai-zorin',
      reason:
        'Outerwear sits at the top of his affinities; the long line reads as his discreet-signal layer for London returns.',
      recommendedTouchpoint: 'personal-shopper-call',
    },
  },
  {
    id: 'travel-wool-blazer-julien',
    title: 'Travel wool blazer',
    category: 'Tailoring',
    sizeCategory: 'outerwear',
    materialNote: 'Wrinkle-resistant tropical wool, soft shoulder.',
    priceEur: 1900,
    state: 'new',
    inventoryNote: 'Full size run available.',
    pairing: {
      clientId: 'client-julien-delacroix',
      reason:
        'Aligned with the board-travel capsule he approved last quarter. Wrinkle-resistant sits cleanly with his WhatsApp cadence.',
      recommendedTouchpoint: 'personal-shopper-call',
    },
  },
  {
    id: 'pool-to-dinner-knit-polo-sana',
    title: 'Pool-to-dinner knit polo',
    category: 'Knitwear',
    sizeCategory: 'tops',
    materialNote: 'Fine-gauge Mediterranean knit, open collar.',
    priceEur: 640,
    state: 'new',
    inventoryNote: 'Paired cleanly with last month\u2019s leather order.',
    pairing: {
      clientId: 'client-sana-al-farsi',
      reason:
        'Resort layer for her Dubai\u2013Paris shuttle, reads well against the cocoa leather she already owns.',
      recommendedTouchpoint: 'in-boutique',
    },
  },
  {
    id: 'satin-shawl-jacket-elise',
    title: 'Satin shawl jacket',
    category: 'Evening',
    sizeCategory: 'outerwear',
    materialNote: 'Silk satin lapel, compact cut.',
    priceEur: 2400,
    state: 'new',
    inventoryNote: 'One piece held in her size.',
    pairing: {
      clientId: 'client-elise-fournier',
      reason:
        'Covers her three hosted museum dinners in one appointment, with the shift-to-supper register she asks for.',
      recommendedTouchpoint: 'in-boutique',
    },
  },
  {
    id: 'fine-leather-belt-ines',
    title: 'Fine leather belt',
    category: 'Accessories',
    sizeCategory: null,
    materialNote: 'Hand-finished calfskin, brushed brass buckle.',
    priceEur: 320,
    state: 'new',
    inventoryNote: 'One memorable hero piece \u2014 the trigger for her next Paris visit.',
    pairing: {
      clientId: 'client-ines-keller',
      reason:
        'Dormant but aesthetically aligned; a single accessory is the discreet reactivation signal her profile responds to.',
      recommendedTouchpoint: 'personal-shopper-call',
    },
  },
  {
    id: 'polished-calf-loafer-gabriel',
    title: 'Polished calf loafer',
    category: 'Footwear',
    sizeCategory: 'shoes',
    materialNote: 'Polished calf, apron toe, leather sole.',
    priceEur: 780,
    state: 'restock',
    inventoryNote: 'His size returning after a six-week gap.',
    pairing: {
      clientId: 'client-gabriel-saad',
      reason:
        'Footwear sits in his affinity set; the polished finish matches the steel sports register he already owns on wrist and watch.',
      recommendedTouchpoint: 'in-boutique',
    },
  },
]
