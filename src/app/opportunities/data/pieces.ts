export type PieceState = 'new' | 'restock' | 'limited'

export const PIECE_STATE_LABEL: Record<PieceState, string> = {
  new: 'New arrival',
  restock: 'Back in stock',
  limited: 'Limited run',
}

export type PieceMatch = {
  id: string
  title: string
  category: string
  image: string
  priceEur: number
  state: PieceState
  inventoryNote?: string
  pairing: {
    clientId: string
    reason: string
    recommendedTouchpoint: 'in-boutique' | 'suite-delivery' | 'personal-shopper-call'
  }
}

/**
 * Curated piece-to-client pairings. Each piece has ONE named recommendation.
 * The match is editorial (a sentence in Casa One voice), never a score or a badge.
 * Clients picked only when their `affinities` or `life_interests` map strictly to the piece.
 */
export const PIECES_TO_MATCH: PieceMatch[] = [
  {
    id: 'windbreaker-nikolai',
    title: 'Warped Logo Ripple Windbreaker',
    category: 'Outerwear',
    image: '/culture/windbreaker.png',
    priceEur: 540,
    state: 'new',
    inventoryNote: 'Full size run, Paris boutique.',
    pairing: {
      clientId: 'client-nikolai-zorin',
      reason:
        'Outerwear sits at the top of his affinities; the Water Atlantis graphic reads as the discreet signal layer for his London returns.',
      recommendedTouchpoint: 'in-boutique',
    },
  },
  {
    id: 'eyewear-memphis-ines',
    title: 'Eyewear Memphis',
    category: 'Eyewear',
    image: '/culture/memphissunglass.png',
    priceEur: 320,
    state: 'new',
    inventoryNote: 'Just landed.',
    pairing: {
      clientId: 'client-ines-keller',
      reason:
        'Graphic identity is her work; Memphis geometry sits in the register she already thinks in — a piece built to restart the conversation.',
      recommendedTouchpoint: 'personal-shopper-call',
    },
  },
  {
    id: 'belt-julien',
    title: 'Ceinture CC',
    category: 'Accessories',
    image: '/culture/belt.png',
    priceEur: 275,
    state: 'restock',
    inventoryNote: 'Black calfskin, gold buckle, full size run.',
    pairing: {
      clientId: 'client-julien-delacroix',
      reason:
        'Accessories are his quiet vocabulary; the CC buckle reads as signal without display, aligned to his board-travel capsule.',
      recommendedTouchpoint: 'suite-delivery',
    },
  },
  {
    id: 'eyewear-pilot-omar',
    title: 'Eyewear Pilot',
    category: 'Eyewear',
    image: '/culture/lunettes-pilot.png',
    priceEur: 380,
    state: 'limited',
    inventoryNote: 'Select drop, two pieces held.',
    pairing: {
      clientId: 'client-omar-haddad',
      reason:
        'The pilot silhouette belongs to his dress register — ambassadorial, composed, correct at ceremony.',
      recommendedTouchpoint: 'suite-delivery',
    },
  },
]
