export type CulturePiece = {
  id: string
  title: string
  category: string
  image: string
  descriptor: string
  sellerAngle: string
  overview: string
  characteristics: { label: string; value: string }[]
  pricePositioning?: string
  resonanceCulturelle: string
  stylingNotes: string
  // Lecture layer
  whoCanWearIt: string
  firstDetail: string
  doNotForce: string
  culturalEcho: string
  crossSell: string
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
    descriptor: 'A mid-season technical shell carrying an original graphic work developed in-house by the London studio.',
    sellerAngle: 'The graphic is not decorative — it is the piece. Water Atlantis is a house narrative, not a print.',
    overview:
      'Long-sleeve windbreaker built for mid-season transitions. The Water Atlantis illustration is an original work developed by the Casablanca creative studio in London — not a licensed graphic, not a trend reference. Wind protection, inner lining, elastic cuffs and hem, standing collar with drawcord, signature zip closure. A sleeve logo patch completes the construction. The piece sits at the intersection of post-sport elegance and daily contemporary presence.',
    characteristics: [
      { label: 'Construction', value: 'Lightweight technical shell with inner lining. Elastic cuffs and hem, drawcord collar.' },
      { label: 'Closure', value: 'Signature zip closure.' },
      { label: 'Graphic', value: 'Water Atlantis — original illustration developed by the Casablanca studio in London.' },
      { label: 'Detail', value: 'Sleeve logo patch.' },
      { label: 'Function', value: 'Wind protection. Mid-season protective layer.' },
      { label: 'Heritage', value: 'References the iconic tennis warm-up jackets of the 1980s and 1990s.' },
    ],
    pricePositioning:
      '540 € boutique price. Positioned well below comparable statement outerwear from Amiri (approx. 1,000 €) for a piece with equivalent graphic and cultural weight.',
    resonanceCulturelle:
      'The piece operates in the field of movement made visible — rhythm as form, not noise. The Water Atlantis graphic resonates with the same aesthetic territory as post-sport culture: the idea that elegance and velocity are not opposites. No formal connection is claimed.',
    stylingNotes:
      'Reads well over tailoring as well as over technical separates. The graphic is large enough to carry a look on its own — no need to layer heavily. Works with clean trousers or structured denim. Avoid competing graphics.',

    whoCanWearIt:
      'A client who understands that sport heritage can be worn with intention. Someone drawn to the house for its graphic intelligence, not its logo visibility. Works across genders.',
    firstDetail:
      'The Water Atlantis illustration — point to it as original studio work from London. Not a licensed print. A house narrative rendered in graphic form.',
    doNotForce:
      'The sport-heritage connection. Let the client make that reading themselves. If you explain the 80s tennis jacket reference too directly, you reduce the piece.',
    culturalEcho:
      'Movement, pulse, the visual translation of rhythm. The same aesthetic field as house music culture — energy held in a form. A reference field, not a declared influence.',
    crossSell: 'Pairs naturally with Ceinture CC. The belt as the only other visible signal keeps the look controlled.',
    rightMoment:
      'A client looking for a transitional piece that is not a classic coat. Urban use, travel, or any context where the outer layer needs to read as considered, not functional.',
  },
  {
    id: 'belt',
    title: 'Ceinture CC',
    category: 'Leather goods',
    image: '/culture/belt.png',
    descriptor: 'Calfskin or goatskin leather, designed and made in Italy. CC brass buckle, gold or silver plated.',
    sellerAngle: 'A belt that functions as a signature: visible enough to be read, restrained enough not to perform.',
    overview:
      'Designed and produced in Italy in calfskin or goatskin leather. The CC brass buckle — gold or silver plated — provides immediate house recognition without excess. Robust leather construction, resistant buckle. Unisex format. A minimal but unambiguous accessory that transitions across tailoring, denim, and elevated casual. The piece holds its own alongside Saint Laurent, Dior, and Louis Vuitton equivalents while maintaining the distinctive Casablanca restraint.',
    characteristics: [
      { label: 'Material', value: 'Calfskin or goatskin leather.' },
      { label: 'Origin', value: 'Designed and made in Italy.' },
      { label: 'Hardware', value: 'CC brass buckle, gold or silver plated.' },
      { label: 'Format', value: 'Unisex.' },
      { label: 'Construction', value: 'Robust leather, resistant buckle.' },
    ],
    pricePositioning:
      '275 € boutique price. Competitive field: Saint Laurent, Dior, Louis Vuitton, Gucci, Balenciaga. Priced at entry luxury — strong recognition with elegant restraint.',
    resonanceCulturelle:
      'The monogram as a controlled signal. Ornament used with discipline — present but not announced. The CC buckle operates in the same register as the house itself: recognisable without being loud.',
    stylingNotes:
      'Works across tailoring, structured denim, and sophisticated casual. Gold plating suits warmer palettes; silver plating reads cooler and more contemporary. Unisex — pitch it without assumption.',

    whoCanWearIt:
      'Any client who wants house presence in a secondary position — worn, not displayed. Works for clients who prefer not to lead with ready-to-wear branding.',
    firstDetail:
      'The CC buckle — Italian manufacture, brass plated. Point to the weight and quality of the hardware before the logo recognition.',
    doNotForce:
      'The comparison to higher-priced competitors. Let the quality speak. If you reach for the price argument first, you undermine the piece.',
    culturalEcho:
      'Controlled ornament. The monogram as a quiet signal rather than a declaration. The same territory as mid-century design thinking — identity through restraint.',
    crossSell:
      'Natural pairing with the Warped Logo Ripple Windbreaker or any clean Casablanca ready-to-wear. The belt anchors a look where the garment is already speaking.',
    rightMoment:
      'A client who has already selected a ready-to-wear piece and needs the room to be complete. Also effective as a standalone entry-level gift or first-purchase.',
  },
  {
    id: 'eyewear-pilot',
    title: 'Eyewear — Pilot',
    category: 'Eyewear',
    image: '/culture/lunettes-pilot.png',
    descriptor: 'Premium acetate frames in a pilot silhouette with tinted lenses and gold-plated metal details.',
    sellerAngle: 'The frame structures the face and affirms an attitude — identity accessory, not sun protection.',
    overview:
      'Premium acetate construction with gold-plated metal details and signature monogram. Tinted high-quality lenses with full UV 100% protection. The pilot silhouette is drawn from retro-modern design language — simultaneously referencing mid-century aviation eyewear and contemporary sculptural form. Made in Japan or Italy depending on the model. Complete with case, satin pouch, and microfibre cloth. Unisex. Built for the full range from beach to elevated urban use.',
    characteristics: [
      { label: 'Material', value: 'Premium acetate.' },
      { label: 'Hardware', value: 'Gold-plated metal details, signature monogram.' },
      { label: 'Lenses', value: 'Tinted, high-quality. UV 100% protection.' },
      { label: 'Origin', value: 'Made in Japan or Italy (model-dependent).' },
      { label: 'Format', value: 'Unisex.' },
      { label: 'Included', value: 'Case, satin pouch, microfibre cloth.' },
    ],
    resonanceCulturelle:
      'The pilot frame carries a long cultural memory — aviators, post-war modernity, the translation of function into elegance. The house works this silhouette as a geometric assertion of attitude, not nostalgia.',
    stylingNotes:
      'The pilot silhouette is assertive. Works best when the rest of the look is minimal. Pairs well with the Windbreaker for a full house register, or with clean tailoring as the only visible accessory.',

    whoCanWearIt:
      'A client with a strong sense of self who understands that eyewear is the first thing a room reads. Works across ages and genders — pitch on attitude, not demographics.',
    firstDetail:
      'The acetate quality and the weight of the frame. Ask the client to hold it — the material quality is immediately felt.',
    doNotForce:
      'The UV protection angle. It is real but secondary. The client is buying a face accessory, not sunglasses.',
    culturalEcho:
      'Post-war modernity reread through contemporary luxury. The pilot silhouette exists in the same field as mid-century design objects — precise, functional, beautiful.',
    crossSell:
      'The Windbreaker for a full-look house read. The belt for a complete accessories pairing. Both allow the eyewear to lead.',
    rightMoment:
      'Summer-adjacent contexts, travel, or any client already in-store and looking for a final detail to complete a look. Also effective as a gift for clients who are difficult to dress.',
  },
  {
    id: 'eyewear-memphis',
    title: 'Eyewear — Memphis',
    category: 'Eyewear',
    image: '/culture/memphissunglass.png',
    descriptor: 'Sculptural acetate frames drawn from Memphis and retro-modern geometry, with signature monogram details.',
    sellerAngle: 'Not a classic frame — a sculptural object worn on the face. The Memphis silhouette is a position, not a trend.',
    overview:
      'Premium acetate construction with signature monogram and gold-plated metal details. The Memphis-inspired silhouette references 1980s Italian design movement thinking — geometry used as expression, not decoration. Tinted high-quality lenses with UV 100% protection. Made in Japan or Italy depending on the model. Unisex. Comes with case, satin pouch, and microfibre cloth. Positioned at the intersection of eyewear and wearable design object.',
    characteristics: [
      { label: 'Material', value: 'Premium acetate.' },
      { label: 'Hardware', value: 'Gold-plated metal details, signature monogram.' },
      { label: 'Lenses', value: 'Tinted, high-quality. UV 100% protection.' },
      { label: 'Origin', value: 'Made in Japan or Italy (model-dependent).' },
      { label: 'Format', value: 'Unisex.' },
      { label: 'Included', value: 'Case, satin pouch, microfibre cloth.' },
    ],
    resonanceCulturelle:
      'Memphis Group design language: the rejection of pure functionalism in favour of geometry with personality. Form as statement. The house applies this thinking to eyewear — not a trend moment, a design position.',
    stylingNotes:
      'The Memphis frame is already making a statement. Keep the rest of the look quiet. Solid colours, minimal print. This frame leads — let it.',

    whoCanWearIt:
      'A client who already knows what they want and is looking for something that will not be found everywhere. Appreciates design intelligence over logo visibility.',
    firstDetail:
      'The geometry of the frame — point to the specific angles and the way the acetate is cut. This is not a standard shape.',
    doNotForce:
      'The Memphis design reference unless the client is receptive. The frame speaks for itself. The reference is available if they ask.',
    culturalEcho:
      'Memphis Group, 1980s Milan. Geometry as personality. The same aesthetic field as post-modernist design objects and the houses that draw from that period with precision.',
    crossSell:
      'Works well with the Ceinture CC as the only other visible house piece. Two discreet signals rather than a full-look statement.',
    rightMoment:
      'A client who is already familiar with the house and is looking for something beyond ready-to-wear. Also the right piece for a client who wants to be recognised by those who know.',
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
      'Fluid architecture. The album constructs rhythm the way a well-made garment constructs movement — through structure, not speed. A reference field for the house\'s relationship to elegance as something that flows rather than announces.',
    linkedPieces: ['windbreaker', 'eyewear-pilot'],
  },
  {
    id: 'mikedunn',
    image: '/culture/mikedunn.jpg',
    artist: 'Mike Dunn',
    title: 'House Masters',
    field: 'Chicago house / 1980s',
    caption:
      'The origin point of a culture that turned movement into identity and the dancefloor into a form of self-expression. The same post-sport, post-leisure energy that runs through the house\'s ready-to-wear language — not as homage, but as shared aesthetic territory.',
    linkedPieces: ['windbreaker'],
  },
  {
    id: 'letta',
    image: '/culture/letta-mbulu.jpg',
    artist: 'Letta Mbulu',
    title: 'Not Yet Uhuru',
    field: 'Afro-jazz / South Africa',
    caption:
      'Presence held with complete composure. The way Mbulu inhabits a performance — controlled, precise, magnetic — resonates with the house\'s approach to identity through restraint. An aesthetic echo, not a claimed influence.',
    linkedPieces: ['belt', 'eyewear-memphis'],
  },
]
