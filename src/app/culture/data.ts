export type CulturePiece = {
  id: string
  title: string
  category: string
  image: string
  descriptor: string
  sellerAngle: string
  overview: string
  characteristics: { label: string; value: string }[]
  productAdvantages: string[]
  clientBenefits: string[]
  pricePositioning?: string
  sellerAdvice: string
  resonanceCulturelle: string
  crossSell: string
  // Lecture layer
  whoCanWearIt: string
  firstDetail: string
  doNotForce: string
  culturalEcho: string
  rightMoment: string
}

export type CulturalReference = {
  id: string
  image: string
  artist: string
  title: string
  field: string
  caption: string
  linkedPieces: string[]
}

export const CULTURE_PIECES: CulturePiece[] = [
  {
    id: 'windbreaker',
    title: 'Warped Logo Ripple Windbreaker',
    category: 'Ready-to-wear',
    image: '/culture/windbreaker.png',
    descriptor: 'Mid-season windbreaker. Water Atlantis graphic — original work by the Casablanca London studio.',
    sellerAngle: 'The graphic is the piece. Water Atlantis is a house narrative, not a print.',
    overview:
      'Long-sleeve windbreaker for mid-season use. The Water Atlantis illustration was developed by the Casablanca creative studio in London — not a licensed graphic. Wind protection, inner lining, elastic cuffs and hem, standing collar with drawcord, signature zip closure, sleeve logo patch. References the tennis warm-up silhouette of the 1980s and 1990s, reread through the house lens.',
    characteristics: [
      { label: 'Construction', value: 'Lightweight technical shell, inner lining. Elastic cuffs and hem, drawcord collar.' },
      { label: 'Closure', value: 'Signature zip.' },
      { label: 'Graphic', value: 'Water Atlantis — original illustration, Casablanca studio London.' },
      { label: 'Detail', value: 'Sleeve logo patch.' },
      { label: 'Function', value: 'Wind protection, mid-season layer.' },
    ],
    productAdvantages: [
      'Original graphic developed in-house — not licensed, not a trend reference.',
      'Lightweight enough for daily wear, structured enough to read as outerwear.',
      'Wind protection and inner lining without added bulk.',
      'Versatile silhouette — works over tailoring and over technical separates.',
    ],
    clientBenefits: [
      'A statement piece that does not require a full house look to land.',
      'Immediate recognition within the house community without visible branding at rest.',
      'Practical mid-season function. No trade-off with presence.',
      'Priced below comparable graphic outerwear from Amiri or similar at equivalent cultural weight.',
    ],
    pricePositioning:
      '540 € boutique. Comparable statement outerwear from Amiri: approx. 1,000 €. Strong value position for a piece with original graphic work and technical construction.',
    sellerAdvice:
      'Lead with the Water Atlantis graphic — its origin, the studio, the intention behind it. The technical construction supports that reading, but does not lead it. If the client asks about the silhouette reference, offer the tennis warm-up heritage. If not, let them make that connection themselves.',
    resonanceCulturelle:
      'Movement made visible. The Water Atlantis graphic sits in the aesthetic field of rhythm translated into form — pulse, wave, energy held in a surface. A reference field, not a declared influence.',
    crossSell: 'Ceinture CC as the only additional signal — keeps the look controlled.',
    whoCanWearIt:
      'A client drawn to the house for its graphic intelligence rather than its logo visibility. Worn with intention. Works across genders.',
    firstDetail: 'The Water Atlantis illustration. Original studio work from London — not a licensed print.',
    doNotForce:
      'The sport-heritage connection. Let the client make that reading. Explaining the 80s tennis jacket reference too directly reduces the piece.',
    culturalEcho: 'Rhythm as form. Post-sport culture — the idea that elegance and velocity are not opposites. A reference field.',
    rightMoment:
      'A client looking for a transitional layer that is not a classic coat. Urban, travel, or any context where the outer piece needs to read as considered.',
  },
  {
    id: 'belt',
    title: 'Ceinture CC',
    category: 'Leather goods',
    image: '/culture/belt.png',
    descriptor: 'Calfskin or goatskin. Designed and made in Italy. CC brass buckle, gold or silver plated.',
    sellerAngle: 'Visible enough to be read. Restrained enough not to perform.',
    overview:
      'Designed and produced in Italy in calfskin or goatskin leather. CC brass buckle, gold or silver plated. Robust construction, resistant hardware. Unisex. Sits alongside Saint Laurent, Dior, and Vuitton equivalents in terms of recognition — at a more accessible price point and with the distinctive Casablanca restraint.',
    characteristics: [
      { label: 'Material', value: 'Calfskin or goatskin leather.' },
      { label: 'Origin', value: 'Designed and made in Italy.' },
      { label: 'Hardware', value: 'CC brass buckle, gold or silver plated.' },
      { label: 'Format', value: 'Unisex.' },
      { label: 'Construction', value: 'Robust leather, resistant buckle.' },
    ],
    productAdvantages: [
      'Immediate house recognition in a single accessory.',
      'Italian manufacture — quality felt in the leather and hardware.',
      'Two hardware finishes (gold, silver) to suit different palettes.',
      'Unisex format — no gendering required in the approach.',
    ],
    clientBenefits: [
      'House presence without a full ready-to-wear look.',
      'Works across tailoring, denim, and elevated casual — no context restriction.',
      'Entry luxury price point. Strong recognition, no excess.',
      'Durable construction. A piece that holds.',
    ],
    pricePositioning:
      '275 € boutique. Competitive field: Saint Laurent, Dior, Louis Vuitton, Gucci, Balenciaga. Priced at entry luxury with equivalent recognition. Strong argument for a first Casablanca purchase.',
    sellerAdvice:
      'Show the hardware first. The weight and finish of the CC buckle makes the case before the logo does. Gold plating for warmer wardrobes; silver for cooler, more contemporary palettes. Do not reach for the competitor comparison — let the client bring it if they want to.',
    resonanceCulturelle:
      'The monogram as a controlled signal. Ornament with discipline — present but not announced. The CC buckle operates in the same register as the house: recognisable without being loud.',
    crossSell:
      'Pairs with any Casablanca ready-to-wear. Most effective alongside the Windbreaker — the belt as the only other visible signal.',
    whoCanWearIt:
      'Any client who wants house presence in a secondary position. Works especially well for clients who prefer not to lead with ready-to-wear branding.',
    firstDetail: 'The CC buckle. Italian manufacture, brass plated. Point to the hardware before the monogram.',
    doNotForce:
      'The competitor comparison. Let the quality speak. If you reach for the price argument first, you undermine the piece.',
    culturalEcho: 'Controlled ornament. Identity through restraint. The monogram as a quiet signal rather than a declaration.',
    rightMoment:
      'A client who has already selected a ready-to-wear piece. Also effective as a first purchase or standalone gift.',
  },
  {
    id: 'eyewear-pilot',
    title: 'Eyewear Pilot',
    category: 'Eyewear',
    image: '/culture/lunettes-pilot.png',
    descriptor: 'Premium acetate, pilot silhouette. Gold-plated details, signature monogram, UV 100%.',
    sellerAngle: 'The frame structures the face and asserts an attitude. Not sun protection — an identity accessory.',
    overview:
      'Premium acetate with gold-plated metal details and signature monogram. Tinted lenses, UV 100% protection. Pilot silhouette drawn from mid-century design vocabulary and reread through the house. Made in Japan or Italy depending on the model. Comes with case, satin pouch, microfibre cloth. Unisex.',
    characteristics: [
      { label: 'Material', value: 'Premium acetate.' },
      { label: 'Hardware', value: 'Gold-plated metal details, signature monogram.' },
      { label: 'Lenses', value: 'Tinted, UV 100%.' },
      { label: 'Origin', value: 'Japan or Italy (model-dependent).' },
      { label: 'Format', value: 'Unisex.' },
      { label: 'Included', value: 'Case, satin pouch, microfibre cloth.' },
    ],
    productAdvantages: [
      'Acetate quality felt immediately on handling — weight and finish are the argument.',
      'UV 100% protection without compromise on the aesthetic.',
      'Full accessories presentation: case, satin pouch, microfibre cloth.',
      'Two origins (Japan / Italy) — both carry manufacturing credibility.',
    ],
    clientBenefits: [
      'A face accessory that reads as a considered choice, not a logo item.',
      'Unisex format — no assumption required in the pitch.',
      'Effective from beach to urban — no context restriction.',
      'House presence in a single piece, without a full wardrobe commitment.',
    ],
    sellerAdvice:
      'Ask the client to hold the frame. The acetate quality and hardware weight make the case before any product explanation. Lead with the material experience, not the UV spec. Pitch on attitude — what the frame does to the face — not on function.',
    resonanceCulturelle:
      'The pilot silhouette carries a long design memory — aviation, post-war modernity, function resolved into form. The house rereads it as a geometric assertion of attitude, not nostalgia.',
    crossSell:
      'Windbreaker for a full-look house read. Ceinture CC for a complete accessories pairing. Both allow the eyewear to lead.',
    whoCanWearIt:
      'A client who understands that eyewear is the first thing a room reads. Works across ages and genders — pitch on attitude.',
    firstDetail: 'The acetate quality and the frame weight. Ask them to hold it.',
    doNotForce:
      'The UV protection angle. Real, but secondary. The client is buying a face accessory.',
    culturalEcho: 'Post-war modernity — function resolved into elegance. Precise, considered, durable.',
    rightMoment:
      'Summer-adjacent, travel, or a client in-store looking for a final detail. Also effective as a gift for clients who are difficult to dress.',
  },
  {
    id: 'eyewear-memphis',
    title: 'Eyewear Memphis',
    category: 'Eyewear',
    image: '/culture/memphissunglass.png',
    descriptor: 'Sculptural acetate frames. Memphis design language, signature monogram, UV 100%.',
    sellerAngle: 'Not a classic frame. A sculptural object worn on the face. The Memphis silhouette is a position.',
    overview:
      'Premium acetate with gold-plated details and signature monogram. Silhouette drawn from Memphis Group design thinking — geometry as expression, not decoration. Tinted lenses, UV 100% protection. Made in Japan or Italy depending on the model. Includes case, satin pouch, microfibre cloth. Unisex.',
    characteristics: [
      { label: 'Material', value: 'Premium acetate.' },
      { label: 'Hardware', value: 'Gold-plated metal details, signature monogram.' },
      { label: 'Lenses', value: 'Tinted, UV 100%.' },
      { label: 'Origin', value: 'Japan or Italy (model-dependent).' },
      { label: 'Format', value: 'Unisex.' },
      { label: 'Included', value: 'Case, satin pouch, microfibre cloth.' },
    ],
    productAdvantages: [
      'Distinct silhouette — not available in comparable form elsewhere.',
      'Design intelligence over logo visibility.',
      'Acetate quality and UV 100% without aesthetic compromise.',
      'Full accessories presentation: case, satin pouch, microfibre cloth.',
    ],
    clientBenefits: [
      'Recognisable within design-literate circles without requiring explanation.',
      'A single piece that defines a look — no supporting elements needed.',
      'Unisex format. No gendering required in the approach.',
      'House presence for clients who prefer not to wear ready-to-wear branding.',
    ],
    sellerAdvice:
      'Let the client discover the silhouette. Point to the specific geometry of the frame — the cut of the acetate, the angles. If they ask about the design reference, offer Memphis Group. If not, the frame speaks without it. Do not open with the design history.',
    resonanceCulturelle:
      'Memphis Group, 1980s Milan. Geometry as personality — the rejection of pure functionalism in favour of form with character. The house applies this thinking to eyewear as a design position, not a trend reference.',
    crossSell:
      'Ceinture CC as the only other visible house piece — two discreet signals rather than a full-look statement.',
    whoCanWearIt:
      'A client who knows what they want and is looking for something not found everywhere. Values design intelligence over logo legibility.',
    firstDetail: 'The geometry of the frame — the specific angles, the way the acetate is cut. Not a standard shape.',
    doNotForce:
      'The Memphis reference unless the client is receptive. The frame makes its own case.',
    culturalEcho: 'Memphis Group. 1980s Milan. Geometry as personality. Form that does not explain itself.',
    rightMoment:
      'A client already familiar with the house, looking beyond ready-to-wear. Or a client who wants to be recognised by those who know.',
  },
]

export const CULTURAL_REFERENCES: CulturalReference[] = [
  {
    id: 'cortex',
    image: '/culture/cortex-troupeau-bleu.jpg',
    artist: 'Cortex',
    title: 'Troupeau Bleu',
    field: 'Jazz-funk / Paris, 1975',
    caption:
      'Rhythm built through structure, not speed. The same quality the house brings to its graphic work — precision that creates its own momentum.',
    linkedPieces: ['windbreaker', 'eyewear-pilot'],
  },
  {
    id: 'mikedunn',
    image: '/culture/mikedunn.jpg',
    artist: 'Mike Dunn',
    title: 'House Masters',
    field: 'Chicago house / 1980s',
    caption:
      'The dancefloor as a site of self-expression. Post-sport, post-leisure — the same energy the house channels in its ready-to-wear language.',
    linkedPieces: ['windbreaker'],
  },
  {
    id: 'letta',
    image: '/culture/letta-mbulu.jpg',
    artist: 'Letta Mbulu',
    title: 'Not Yet Uhuru',
    field: 'Afro-jazz / South Africa',
    caption:
      'Presence held with composure. Controlled, precise, magnetic — the same register the house occupies: identity through restraint.',
    linkedPieces: ['belt', 'eyewear-memphis'],
  },
]
