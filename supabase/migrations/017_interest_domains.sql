-- ═══════════════════════════════════════════════════════════════
-- CASA ONE — Interest Domains (Fashion + Life)
-- Adds domain column, normalizes existing data, adds life taxonomy
-- ═══════════════════════════════════════════════════════════════

-- Part 1: Add domain column to both tables
ALTER TABLE client_interests ADD COLUMN IF NOT EXISTS domain TEXT NOT NULL DEFAULT 'fashion';
ALTER TABLE interest_taxonomy ADD COLUMN IF NOT EXISTS domain TEXT NOT NULL DEFAULT 'fashion';

CREATE INDEX IF NOT EXISTS idx_interests_domain ON client_interests(domain);

COMMENT ON COLUMN client_interests.domain IS 'fashion = brand/product preferences, life = personal interests';

-- Part 2: Normalize existing demo data categories to lowercase slug format
UPDATE client_interests SET category = 'products'    WHERE category = 'Products';
UPDATE client_interests SET category = 'collections'  WHERE category = 'Collections';
UPDATE client_interests SET category = 'styles'       WHERE category = 'Styles';
UPDATE client_interests SET category = 'colors'       WHERE category = 'Colors';
UPDATE client_interests SET category = 'occasions'    WHERE category = 'Occasions';
UPDATE client_interests SET category = 'lifestyle', domain = 'life' WHERE category = 'Lifestyle';

-- Normalize values to slug format (underscored lowercase)
UPDATE client_interests SET value = LOWER(REPLACE(REPLACE(value, ' ', '_'), '-', '_'))
WHERE value ~ '[A-Z ]';

-- Part 3: Add fashion sub-categories to taxonomy (not present yet)
INSERT INTO interest_taxonomy (category, value, display_label, sort_order, domain) VALUES
  ('products', 'silk_shirts', 'Silk Shirts', 1, 'fashion'),
  ('products', 't_shirts', 'T-shirts', 2, 'fashion'),
  ('products', 'knitwear', 'Knitwear', 3, 'fashion'),
  ('products', 'shorts', 'Shorts', 4, 'fashion'),
  ('products', 'tracksuits', 'Tracksuits', 5, 'fashion'),
  ('products', 'sneakers', 'Sneakers', 6, 'fashion'),
  ('products', 'accessories', 'Accessories', 7, 'fashion'),
  ('products', 'trousers', 'Trousers', 8, 'fashion'),
  ('products', 'outerwear', 'Outerwear', 9, 'fashion'),
  ('collections', 'tennis_club', 'Tennis Club', 1, 'fashion'),
  ('collections', 'maison_de_rêve', 'Maison De Rêve', 2, 'fashion'),
  ('collections', 'gradient_wave', 'Gradient Wave', 3, 'fashion'),
  ('collections', 'monogram', 'Monogram', 4, 'fashion'),
  ('collections', 'sunset_landscape', 'Sunset Landscape', 5, 'fashion'),
  ('styles', 'printed', 'Printed', 1, 'fashion'),
  ('styles', 'crochet', 'Crochet', 2, 'fashion'),
  ('styles', 'knitted', 'Knitted', 3, 'fashion'),
  ('styles', 'tailored', 'Tailored', 4, 'fashion'),
  ('styles', 'graphic', 'Graphic', 5, 'fashion'),
  ('styles', 'relaxed', 'Relaxed', 6, 'fashion'),
  ('colors', 'green', 'Green', 1, 'fashion'),
  ('colors', 'gold', 'Gold', 2, 'fashion'),
  ('colors', 'navy', 'Navy', 3, 'fashion'),
  ('colors', 'white', 'White', 4, 'fashion'),
  ('colors', 'multicolor', 'Multicolor', 5, 'fashion'),
  ('colors', 'black', 'Black', 6, 'fashion'),
  ('colors', 'red', 'Red', 7, 'fashion'),
  ('occasions', 'resort', 'Resort', 1, 'fashion'),
  ('occasions', 'leisure', 'Leisure', 2, 'fashion'),
  ('occasions', 'evening', 'Evening', 3, 'fashion'),
  ('occasions', 'travel', 'Travel', 4, 'fashion'),
  ('occasions', 'sport', 'Sport', 5, 'fashion')
ON CONFLICT (category, value) DO UPDATE SET domain = EXCLUDED.domain;

-- Update existing taxonomy rows with domain = 'fashion' (the old seed data)
UPDATE interest_taxonomy SET domain = 'fashion' WHERE domain IS NULL OR domain = 'fashion';

-- Mark life categories in existing taxonomy
UPDATE interest_taxonomy SET domain = 'life'
WHERE category IN ('food', 'art', 'music', 'lifestyle')
  AND value NOT IN ('tennis', 'golf', 'motorsport', 'yachting');

-- Part 4: Insert life interest taxonomy
INSERT INTO interest_taxonomy (category, value, display_label, sort_order, domain) VALUES
  -- Food & Drink
  ('food', 'japanese', 'Japanese', 1, 'life'),
  ('food', 'italian', 'Italian', 2, 'life'),
  ('food', 'french', 'French', 3, 'life'),
  ('food', 'moroccan', 'Moroccan', 4, 'life'),
  ('food', 'wine', 'Wine', 5, 'life'),
  ('food', 'cocktails', 'Cocktails', 6, 'life'),
  ('food', 'coffee', 'Coffee', 7, 'life'),
  -- Art & Culture
  ('art', 'contemporary', 'Contemporary', 1, 'life'),
  ('art', 'street_art', 'Street Art', 2, 'life'),
  ('art', 'photography', 'Photography', 3, 'life'),
  ('art', 'cinema', 'Cinema', 4, 'life'),
  ('art', 'architecture', 'Architecture', 5, 'life'),
  -- Music
  ('music', 'hip_hop', 'Hip Hop', 1, 'life'),
  ('music', 'jazz', 'Jazz', 2, 'life'),
  ('music', 'electronic', 'Electronic', 3, 'life'),
  ('music', 'classical', 'Classical', 4, 'life'),
  ('music', 'rnb', 'R&B', 5, 'life'),
  -- Sport & Movement
  ('sport', 'football', 'Football', 1, 'life'),
  ('sport', 'tennis', 'Tennis', 2, 'life'),
  ('sport', 'motorsport', 'Motorsport', 3, 'life'),
  ('sport', 'fitness', 'Fitness', 4, 'life'),
  ('sport', 'surf', 'Surf', 5, 'life'),
  ('sport', 'ski', 'Ski', 6, 'life'),
  -- Lifestyle & Objects
  ('lifestyle', 'travel', 'Travel', 1, 'life'),
  ('lifestyle', 'watches', 'Watches', 2, 'life'),
  ('lifestyle', 'cars', 'Cars', 3, 'life'),
  ('lifestyle', 'tech', 'Tech', 4, 'life'),
  ('lifestyle', 'design', 'Design', 5, 'life'),
  ('lifestyle', 'gaming', 'Gaming', 6, 'life')
ON CONFLICT (category, value) DO UPDATE SET domain = EXCLUDED.domain, display_label = EXCLUDED.display_label;

-- Part 5: Add life_notes to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS life_notes TEXT;
COMMENT ON COLUMN clients.life_notes IS 'Freeform notes about client as a person (hobbies, travel habits, family, etc.)';
