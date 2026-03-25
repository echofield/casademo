-- ═══════════════════════════════════════════════════════════════
-- CASA ONE — Client Intelligence Model
-- Adds brand affinity, structured product preferences,
-- expanded lifestyle taxonomy, soft delete, and dedupe index
-- ═══════════════════════════════════════════════════════════════

-- ── 1. CLIENT BRAND AFFINITY (1:1 with clients) ──

CREATE TABLE IF NOT EXISTS client_brand_affinity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  familiarity TEXT CHECK (familiarity IN ('new', 'aware', 'regular', 'loyal', 'vip')),
  sensitivity TEXT CHECK (sensitivity IN ('price_sensitive', 'value_driven', 'exclusivity_driven')),
  purchase_behavior TEXT CHECK (purchase_behavior IN ('occasional', 'seasonal', 'frequent', 'collector')),
  contact_preference TEXT CHECK (contact_preference IN ('passive', 'reactive', 'proactive')),
  channel TEXT CHECK (channel IN ('in_store', 'online', 'mixed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id)
);

ALTER TABLE client_brand_affinity ENABLE ROW LEVEL SECURITY;

CREATE POLICY brand_affinity_seller ON client_brand_affinity FOR ALL USING (
  EXISTS (SELECT 1 FROM clients WHERE id = client_id AND seller_id = auth.uid())
);

CREATE POLICY brand_affinity_supervisor ON client_brand_affinity FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor')
);

CREATE TRIGGER trg_brand_affinity_updated_at
BEFORE UPDATE ON client_brand_affinity
FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── 2. FASHION INTEREST SIGNAL on clients ──

ALTER TABLE clients ADD COLUMN IF NOT EXISTS interest_in_fashion TEXT
  CHECK (interest_in_fashion IN ('low', 'medium', 'high'));

COMMENT ON COLUMN clients.interest_in_fashion IS 'Meta-signal for targeting: how interested is this client in fashion. Not a preference — a signal.';


-- ── 3. SIZE SYSTEM on client_sizing ──

ALTER TABLE client_sizing ADD COLUMN IF NOT EXISTS size_system TEXT
  DEFAULT 'INTL' CHECK (size_system IN ('EU', 'US', 'UK', 'INTL'));


-- ── 4. SOFT DELETE on client_interests ──

ALTER TABLE client_interests ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE client_interests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_interests_not_deleted
  ON client_interests(client_id) WHERE is_deleted = false;


-- ── 5. UNIQUE PARTIAL INDEX — prevent duplicate active interests ──

CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_client_interest
  ON client_interests (client_id, domain, category, value)
  WHERE is_deleted = false;


-- ── 6. RENAME domain fashion → product ──

UPDATE client_interests SET domain = 'product' WHERE domain = 'fashion';
UPDATE interest_taxonomy SET domain = 'product' WHERE domain = 'fashion';


-- ── 7. EXPANDED LIFESTYLE TAXONOMY ──
-- Promote existing sub-values to top-level categories and add new ones.
-- Domain stays 'life' in DB, UI shows "Lifestyle & Interests".

INSERT INTO interest_taxonomy (category, value, display_label, sort_order, domain) VALUES
  -- Culture
  ('culture', 'theater', 'Theater', 1, 'life'),
  ('culture', 'museums', 'Museums', 2, 'life'),
  ('culture', 'literature', 'Literature', 3, 'life'),
  ('culture', 'history', 'History', 4, 'life'),
  ('culture', 'philosophy', 'Philosophy', 5, 'life'),
  -- Nightlife
  ('nightlife', 'clubs', 'Clubs', 1, 'life'),
  ('nightlife', 'bars', 'Bars', 2, 'life'),
  ('nightlife', 'live_music', 'Live Music', 3, 'life'),
  ('nightlife', 'private_events', 'Private Events', 4, 'life'),
  -- Wellness
  ('wellness', 'yoga', 'Yoga', 1, 'life'),
  ('wellness', 'meditation', 'Meditation', 2, 'life'),
  ('wellness', 'spa', 'Spa', 3, 'life'),
  ('wellness', 'nutrition', 'Nutrition', 4, 'life'),
  -- Technology
  ('technology', 'gadgets', 'Gadgets', 1, 'life'),
  ('technology', 'ai', 'AI', 2, 'life'),
  ('technology', 'crypto', 'Crypto', 3, 'life'),
  ('technology', 'startups', 'Startups', 4, 'life'),
  -- Cars (promote from lifestyle sub-value)
  ('cars', 'classic_cars', 'Classic Cars', 1, 'life'),
  ('cars', 'supercars', 'Supercars', 2, 'life'),
  ('cars', 'electric', 'Electric', 3, 'life'),
  ('cars', 'motorsport', 'Motorsport', 4, 'life'),
  -- Watches (promote from lifestyle sub-value)
  ('watches', 'vintage', 'Vintage', 1, 'life'),
  ('watches', 'luxury', 'Luxury', 2, 'life'),
  ('watches', 'sport_watches', 'Sport Watches', 3, 'life'),
  ('watches', 'independent', 'Independent', 4, 'life'),
  -- Books
  ('books', 'fiction', 'Fiction', 1, 'life'),
  ('books', 'non_fiction', 'Non-fiction', 2, 'life'),
  ('books', 'business_books', 'Business', 3, 'life'),
  ('books', 'art_books', 'Art Books', 4, 'life'),
  -- Cinema
  ('cinema', 'auteur', 'Auteur', 1, 'life'),
  ('cinema', 'blockbuster', 'Blockbuster', 2, 'life'),
  ('cinema', 'documentary', 'Documentary', 3, 'life'),
  ('cinema', 'series', 'Series', 4, 'life'),
  -- Business
  ('business', 'entrepreneurship', 'Entrepreneurship', 1, 'life'),
  ('business', 'finance', 'Finance', 2, 'life'),
  ('business', 'real_estate', 'Real Estate', 3, 'life'),
  ('business', 'investing', 'Investing', 4, 'life'),
  -- Travel (promote from lifestyle sub-value)
  ('travel', 'city_breaks', 'City Breaks', 1, 'life'),
  ('travel', 'beach', 'Beach', 2, 'life'),
  ('travel', 'adventure', 'Adventure', 3, 'life'),
  ('travel', 'luxury_hotels', 'Luxury Hotels', 4, 'life'),
  ('travel', 'cultural_trips', 'Cultural Trips', 5, 'life'),
  -- Design (promote from lifestyle sub-value)
  ('design', 'interior', 'Interior', 1, 'life'),
  ('design', 'furniture', 'Furniture', 2, 'life'),
  ('design', 'graphic', 'Graphic', 3, 'life'),
  ('design', 'product_design', 'Product Design', 4, 'life'),
  -- Extra sport values
  ('sport', 'padel', 'Padel', 7, 'life'),
  ('sport', 'boxing', 'Boxing', 8, 'life'),
  ('sport', 'running', 'Running', 9, 'life'),
  ('sport', 'golf', 'Golf', 10, 'life'),
  ('sport', 'yoga_sport', 'Yoga', 11, 'life'),
  ('sport', 'swimming', 'Swimming', 12, 'life'),
  ('sport', 'cycling', 'Cycling', 13, 'life'),
  ('sport', 'basketball', 'Basketball', 14, 'life')
ON CONFLICT (category, value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  domain = EXCLUDED.domain,
  sort_order = EXCLUDED.sort_order;


-- ── 8. PRODUCT PREFERENCE TAXONOMY ──
-- These use domain = 'product' (formerly 'fashion').

INSERT INTO interest_taxonomy (category, value, display_label, sort_order, domain) VALUES
  -- Fit preferences
  ('fit', 'slim', 'Slim', 1, 'product'),
  ('fit', 'regular', 'Regular', 2, 'product'),
  ('fit', 'relaxed', 'Relaxed', 3, 'product'),
  ('fit', 'oversized', 'Oversized', 4, 'product'),
  -- Materials
  ('materials', 'cotton', 'Cotton', 1, 'product'),
  ('materials', 'linen', 'Linen', 2, 'product'),
  ('materials', 'cashmere', 'Cashmere', 3, 'product'),
  ('materials', 'silk', 'Silk', 4, 'product'),
  ('materials', 'wool', 'Wool', 5, 'product'),
  ('materials', 'leather', 'Leather', 6, 'product'),
  ('materials', 'denim', 'Denim', 7, 'product'),
  ('materials', 'synthetic', 'Synthetic', 8, 'product'),
  -- Avoided items
  ('avoided', 'logos', 'Logos', 1, 'product'),
  ('avoided', 'leather_avoided', 'Leather', 2, 'product'),
  ('avoided', 'synthetic_avoided', 'Synthetic', 3, 'product'),
  ('avoided', 'animal_products', 'Animal Products', 4, 'product'),
  ('avoided', 'bright_colors', 'Bright Colors', 5, 'product'),
  ('avoided', 'prints', 'Prints', 6, 'product'),
  -- Additional product categories (extend existing 'products' category)
  ('products', 'tailoring', 'Tailoring', 10, 'product'),
  ('products', 'denim_products', 'Denim', 11, 'product'),
  ('products', 'bags', 'Bags', 12, 'product'),
  ('products', 'jewellery', 'Jewellery', 13, 'product'),
  ('products', 'swimwear', 'Swimwear', 14, 'product'),
  -- Additional colors
  ('colors', 'cream', 'Cream', 8, 'product'),
  ('colors', 'brown', 'Brown', 9, 'product'),
  ('colors', 'grey', 'Grey', 10, 'product'),
  ('colors', 'pink', 'Pink', 11, 'product'),
  ('colors', 'beige', 'Beige', 12, 'product'),
  ('colors', 'khaki', 'Khaki', 13, 'product'),
  ('colors', 'burgundy', 'Burgundy', 14, 'product')
ON CONFLICT (category, value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  domain = EXCLUDED.domain,
  sort_order = EXCLUDED.sort_order;


-- ═══════════════════════════════════════════════════════════════
-- DONE. Client intelligence model is ready.
-- ═══════════════════════════════════════════════════════════════
