export type AccessType =
  | 'invitation'
  | 'hospitality'
  | 'concierge-coordination'

export type AccessProvider =
  | 'concierge-layer'
  | 'hospitality-provider'
  | 'event-access-node'

export type ActivationMoment = {
  id: string
  title: string
  venue: string
  dateWindow: string
  category: 'heritage' | 'concierge' | 'selective'
  whyNow: string
  clientAngle: string
  suggestedAction: string
  access: {
    type: AccessType
    provider: AccessProvider
    providerLabel: 'Concierge layer' | 'Hospitality partner' | 'Event access node'
  }
  estimatedPotentialEur: { min: number; max: number }
  /**
   * Named contacts or internal ops notes. NEVER rendered in the UI.
   * Only present for forward ops. Do not surface in any component.
   */
  internalNote?: string
}

export const ACCESS_TYPE_LABEL: Record<AccessType, string> = {
  invitation: 'Invitation',
  hospitality: 'Hospitality',
  'concierge-coordination': 'Concierge coordination',
}

export const ACTIVATION_MOMENTS: ActivationMoment[] = [
  {
    id: 'heritage-roland-garros',
    title: 'Roland-Garros — Quarter Finals',
    venue: 'Stade Roland-Garros, Paris',
    dateWindow: 'Late May – Early June 2026',
    category: 'heritage',
    whyNow:
      'High concentration of top-tier clients and corporate hospitality, on a short, invitation-driven window.',
    clientAngle:
      '3 VIP clients interested in sport and networking, plus 2 Optimisto clients travelling into Paris.',
    suggestedAction:
      'Coordinate a hospitality table for 6 and align transfers with their Paris stay.',
    access: {
      type: 'hospitality',
      provider: 'hospitality-provider',
      providerLabel: 'Hospitality partner',
    },
    estimatedPotentialEur: { min: 4000, max: 12000 },
  },
  {
    id: 'heritage-pfw-ss27',
    title: 'Paris Fashion Week — Women\u2019s Ready-to-Wear',
    venue: 'FHCM venues, Paris',
    dateWindow: 'Late September 2026',
    category: 'heritage',
    whyNow:
      'Top fashion clients concentrate their travel around the week; appointment windows are short.',
    clientAngle:
      'Rainbow and Optimisto clients travelling for the week; 4 names expected from the personal shopper list.',
    suggestedAction:
      'Secure invitation pool and coordinate private showroom visits plus after-show appointments.',
    access: {
      type: 'invitation',
      provider: 'event-access-node',
      providerLabel: 'Event access node',
    },
    estimatedPotentialEur: { min: 8000, max: 30000 },
  },
  {
    id: 'heritage-art-basel-paris',
    title: 'Art Basel Paris',
    venue: 'Grand Palais, Paris',
    dateWindow: 'Mid-October 2026',
    category: 'heritage',
    whyNow:
      'UHNW collectors converge in Paris for the fair; parallel gallery dinners open a narrow activation window.',
    clientAngle:
      'Collectors among Diplomatico and Rainbow tiers; prioritise clients with declared art interest.',
    suggestedAction:
      'Align gifting and private dinner presence with gallery partners; reserve discreet in-store time.',
    access: {
      type: 'invitation',
      provider: 'event-access-node',
      providerLabel: 'Event access node',
    },
    estimatedPotentialEur: { min: 5000, max: 20000 },
  },
  {
    id: 'heritage-prix-de-diane',
    title: 'Prix de Diane',
    venue: 'Hippodrome de Chantilly',
    dateWindow: 'Mid-June 2026',
    category: 'heritage',
    whyNow:
      'Heritage-oriented clients attend as a family tradition; dress and gifting lead times are short.',
    clientAngle:
      'Kaizen and Idealiste clients with declared family moments this spring.',
    suggestedAction:
      'Secure enclosure access and pair with sartorial appointments the week before.',
    access: {
      type: 'hospitality',
      provider: 'hospitality-provider',
      providerLabel: 'Hospitality partner',
    },
    estimatedPotentialEur: { min: 3000, max: 9000 },
  },
  {
    id: 'concierge-cheval-blanc',
    title: 'Cheval Blanc Paris — Private Experience Window',
    venue: 'Cheval Blanc Paris',
    dateWindow: 'Rolling, Spring 2026',
    category: 'concierge',
    whyNow:
      'Palace stay is the 48\u201372h window where international clients are most receptive to brand experience.',
    clientAngle:
      'International Rainbow clients in Paris short stay; 2 names currently flagged by personal shopper.',
    suggestedAction:
      'Coordinate suite preparation and in-stay brief; propose a discreet product presentation.',
    access: {
      type: 'concierge-coordination',
      provider: 'concierge-layer',
      providerLabel: 'Concierge layer',
    },
    estimatedPotentialEur: { min: 6000, max: 18000 },
  },
  {
    id: 'concierge-le-bristol',
    title: 'Le Bristol Paris — Private Dinner Program',
    venue: 'Le Bristol Paris',
    dateWindow: 'Rolling, 2026',
    category: 'concierge',
    whyNow:
      'Paris-based VIPs celebrate milestones here; gifting lead time is short and discreet.',
    clientAngle:
      'Established Paris-based VIPs with known life moments in the next 60 days.',
    suggestedAction:
      'Propose a private dinner with a maison gift placement, aligned with the client\u2019s existing booking.',
    access: {
      type: 'concierge-coordination',
      provider: 'concierge-layer',
      providerLabel: 'Concierge layer',
    },
    estimatedPotentialEur: { min: 3000, max: 10000 },
  },
  {
    id: 'concierge-peninsula',
    title: 'Peninsula Paris — Discreet Hosting Window',
    venue: 'Peninsula Paris',
    dateWindow: 'Ahead of Paris Fashion Week, September 2026',
    category: 'concierge',
    whyNow:
      'Asian UHNW clientele books ahead of Fashion Week; in-suite presentations outperform boutique visits at that window.',
    clientAngle:
      'Asian UHNW visiting clients, typically Diplomatico tier; coordinate via their usual concierge.',
    suggestedAction:
      'Pre-arrival brief plus curated in-suite product presentation aligned with their Paris agenda.',
    access: {
      type: 'concierge-coordination',
      provider: 'concierge-layer',
      providerLabel: 'Concierge layer',
    },
    estimatedPotentialEur: { min: 10000, max: 40000 },
  },
]
