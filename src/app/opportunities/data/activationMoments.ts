import type { ClientTier } from '@/lib/types'

export type MomentBucket = 'existing' | 'acquisition'

export type Touchpoint =
  | 'in-boutique'
  | 'showroom-preview'
  | 'suite-delivery'
  | 'personal-shopper-call'
  | 'private-viewing'

export const TOUCHPOINT_LABEL: Record<Touchpoint, string> = {
  'in-boutique': 'In-boutique',
  'showroom-preview': 'Showroom preview',
  'suite-delivery': 'Suite delivery',
  'personal-shopper-call': 'Personal shopper call',
  'private-viewing': 'Private viewing',
}

export type ExistingPairing = {
  type: 'existing'
  clientIds: string[]
  interestTag: string
}

export type AcquisitionPairing = {
  type: 'acquisition'
  tier: ClientTier
  interestTag: string
  channel: string
}

export type ActivationMoment = {
  id: string
  title: string
  contextLine: string
  dateWindow: string
  bucket: MomentBucket
  pairing: ExistingPairing | AcquisitionPairing
  proposition: string
  touchpoint: Touchpoint
  estimatedPotentialEur: { min: number; max: number }
  /**
   * Named contacts or internal ops notes. NEVER rendered in the UI.
   */
  internalNote?: string
}

export const ACTIVATION_MOMENTS: ActivationMoment[] = [
  {
    id: 'pfw-travel-window',
    title: 'Paris Fashion Week travel window',
    contextLine:
      'Clients with an explicit fashion-week rhythm travel to Paris at the end of September.',
    dateWindow: 'Late September 2026',
    bucket: 'existing',
    pairing: {
      type: 'existing',
      clientIds: ['client-daphne-kim', 'client-ines-keller'],
      interestTag: 'Fashion week',
    },
    proposition:
      'Private in-boutique preview of the season edit, scheduled around their Paris arrival.',
    touchpoint: 'in-boutique',
    estimatedPotentialEur: { min: 3000, max: 9000 },
  },
  {
    id: 'art-basel-paris',
    title: 'Art Basel Paris',
    contextLine:
      'Collectors who follow the Basel calendar converge in Paris for the fair week.',
    dateWindow: 'Mid-October 2026',
    bucket: 'existing',
    pairing: {
      type: 'existing',
      clientIds: ['client-amina-rahal', 'client-valentina-costa'],
      interestTag: 'Art collecting',
    },
    proposition:
      'Curated lookbook delivered to their Paris address the day before the fair opens.',
    touchpoint: 'suite-delivery',
    estimatedPotentialEur: { min: 6000, max: 18000 },
  },
  {
    id: 'monaco-gp',
    title: 'Monaco Grand Prix weekend',
    contextLine:
      'Sana travels to Monaco for the Formula 1 weekend and passes through Paris.',
    dateWindow: 'Late May 2026',
    bucket: 'existing',
    pairing: {
      type: 'existing',
      clientIds: ['client-sana-al-farsi'],
      interestTag: 'Formula 1',
    },
    proposition:
      'Pre-Monaco resort edit pulled and reserved for her Paris stop, with a lighter leather option.',
    touchpoint: 'in-boutique',
    estimatedPotentialEur: { min: 5000, max: 12000 },
  },
  {
    id: 'cannes-festival',
    title: 'Cannes Festival production window',
    contextLine:
      'Leila\u2019s festival calendar generates a tight window for a single decisive fitting.',
    dateWindow: 'Mid-May 2026',
    bucket: 'existing',
    pairing: {
      type: 'existing',
      clientIds: ['client-leila-benhamou'],
      interestTag: 'Festival circuits',
    },
    proposition:
      'Festival-ready accessory capsule held in-boutique for one fitting before her production travel.',
    touchpoint: 'in-boutique',
    estimatedPotentialEur: { min: 2000, max: 6000 },
  },
  {
    id: 'capri-ibiza-season',
    title: 'Capri and Ibiza high season',
    contextLine:
      'Valentina\u2019s Capri summer and Matteo\u2019s Milan-Ibiza stretch both route through Paris first.',
    dateWindow: 'June \u2013 August 2026',
    bucket: 'existing',
    pairing: {
      type: 'existing',
      clientIds: ['client-valentina-costa', 'client-matteo-vieri'],
      interestTag: 'Riviera season',
    },
    proposition:
      'Resort capsule reserved, one hero piece per client, ready when they pass through Paris.',
    touchpoint: 'showroom-preview',
    estimatedPotentialEur: { min: 8000, max: 22000 },
  },
  {
    id: 'diplomatic-calendar',
    title: 'Diplomatic state calendar',
    contextLine:
      'Protocol travel and state dinners concentrate Omar\u2019s and Samir\u2019s wardrobe needs.',
    dateWindow: 'Rolling, 2026',
    bucket: 'existing',
    pairing: {
      type: 'existing',
      clientIds: ['client-omar-haddad', 'client-samir-azoulay'],
      interestTag: 'State protocol',
    },
    proposition:
      'Bespoke ceremony wardrobe plan with matching travel tailoring, delivered to residence.',
    touchpoint: 'suite-delivery',
    estimatedPotentialEur: { min: 10000, max: 30000 },
  },
  {
    id: 'museum-patron-dinners',
    title: 'Museum patron spring dinners',
    contextLine:
      'Elise sits on a museum board and hosts three intimate dinners this spring.',
    dateWindow: 'April \u2013 May 2026',
    bucket: 'existing',
    pairing: {
      type: 'existing',
      clientIds: ['client-elise-fournier'],
      interestTag: 'Museum patron',
    },
    proposition:
      'Evening capsule pulled for the three hosted dinners, shown in one appointment.',
    touchpoint: 'in-boutique',
    estimatedPotentialEur: { min: 2500, max: 6500 },
  },
  {
    id: 'brittany-sailing',
    title: 'Brittany sailing window',
    contextLine:
      'Julien sails in Brittany through the season and prefers video reviews between weekends.',
    dateWindow: 'May \u2013 September 2026',
    bucket: 'existing',
    pairing: {
      type: 'existing',
      clientIds: ['client-julien-delacroix'],
      interestTag: 'Sailing',
    },
    proposition:
      'Resort-tailoring capsule framed as a quarterly video review before the sailing weekends.',
    touchpoint: 'personal-shopper-call',
    estimatedPotentialEur: { min: 3000, max: 8000 },
  },
  {
    id: 'vip-referral',
    title: 'Referral from existing VIPs',
    contextLine:
      'Rainbow clients regularly introduce a trusted friend; a controlled one-to-one window matters more than volume.',
    dateWindow: 'Rolling, 2026',
    bucket: 'acquisition',
    pairing: {
      type: 'acquisition',
      tier: 'diplomatico',
      interestTag: 'Friend-of-friend',
      channel: 'VIP referral',
    },
    proposition:
      'Private one-to-one viewing evening for a single introduced guest, by invitation from the referring client.',
    touchpoint: 'private-viewing',
    estimatedPotentialEur: { min: 4000, max: 12000 },
  },
  {
    id: 'press-reactivation',
    title: 'Fashion-week press reactivation',
    contextLine:
      'Creative directors and stylists reached during a press window convert more cleanly than cold outreach.',
    dateWindow: 'Post-PFW, October 2026',
    bucket: 'acquisition',
    pairing: {
      type: 'acquisition',
      tier: 'optimisto',
      interestTag: 'Creative director',
      channel: 'Press window',
    },
    proposition:
      'Personal-shopper outreach with a tight seasonal edit, keyed to a single editorial window.',
    touchpoint: 'personal-shopper-call',
    estimatedPotentialEur: { min: 1500, max: 5000 },
  },
]
