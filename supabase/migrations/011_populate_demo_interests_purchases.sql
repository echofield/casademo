-- ═══════════════════════════════════════════════════════════════
-- CASA ONE — Populate Demo Interests & Purchases
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Clear existing demo interests and purchases first
DELETE FROM client_interests WHERE client_id IN (SELECT id FROM clients WHERE is_demo = true);
DELETE FROM purchases WHERE client_id IN (SELECT id FROM clients WHERE is_demo = true);

-- ── STEP 1: Add interests for all demo clients ──

DO $$
DECLARE
  client_rec RECORD;
  product_values TEXT[] := ARRAY['Silk shirts', 'T-shirts', 'Knitwear', 'Shorts', 'Tracksuits', 'Sneakers', 'Accessories', 'Trousers'];
  collection_values TEXT[] := ARRAY['Tennis Club', 'Maison De Reve', 'Gradient Wave', 'Monogram', 'Sunset Landscape'];
  style_values TEXT[] := ARRAY['Printed', 'Crochet', 'Knitted', 'Tailored', 'Graphic'];
  color_values TEXT[] := ARRAY['Green', 'Gold', 'Navy', 'White', 'Multicolor', 'Black'];
  occasion_values TEXT[] := ARRAY['Resort', 'Leisure', 'Evening', 'Travel'];
BEGIN
  FOR client_rec IN SELECT id FROM clients WHERE is_demo = true LOOP
    -- Product interest (every client)
    INSERT INTO client_interests (client_id, category, value, detail)
    VALUES (
      client_rec.id,
      'Products',
      product_values[1 + floor(random() * array_length(product_values, 1))::int],
      CASE WHEN random() < 0.3 THEN 'Prefers seasonal releases' ELSE NULL END
    );

    -- Collection interest (70% of clients)
    IF random() < 0.7 THEN
      INSERT INTO client_interests (client_id, category, value, detail)
      VALUES (
        client_rec.id,
        'Collections',
        collection_values[1 + floor(random() * array_length(collection_values, 1))::int],
        CASE WHEN random() < 0.2 THEN 'Full collection enthusiast' ELSE NULL END
      );
    END IF;

    -- Style interest (60% of clients)
    IF random() < 0.6 THEN
      INSERT INTO client_interests (client_id, category, value, detail)
      VALUES (
        client_rec.id,
        'Styles',
        style_values[1 + floor(random() * array_length(style_values, 1))::int],
        NULL
      );
    END IF;

    -- Color preference (50% of clients)
    IF random() < 0.5 THEN
      INSERT INTO client_interests (client_id, category, value, detail)
      VALUES (
        client_rec.id,
        'Colors',
        color_values[1 + floor(random() * array_length(color_values, 1))::int],
        NULL
      );
    END IF;

    -- Occasion (40% of clients)
    IF random() < 0.4 THEN
      INSERT INTO client_interests (client_id, category, value, detail)
      VALUES (
        client_rec.id,
        'Occasions',
        occasion_values[1 + floor(random() * array_length(occasion_values, 1))::int],
        NULL
      );
    END IF;
  END LOOP;
END $$;

-- ── STEP 2: Add purchase history with Casablanca products ──

DO $$
DECLARE
  client_rec RECORD;
  seller_id UUID;
  product_catalog TEXT[][] := ARRAY[
    ARRAY['Gradient Wave Silk Shirt', '550'],
    ARRAY['Tennis Club Printed Silk Shirt', '580'],
    ARRAY['Maison De Reve Silk Shirt', '520'],
    ARRAY['Monogram Silk Shirt', '495'],
    ARRAY['Sunset Landscape Silk Shirt', '550'],
    ARRAY['Casa Logo Classic T-Shirt', '185'],
    ARRAY['Tennis Club Graphic Tee', '195'],
    ARRAY['Gradient Logo T-Shirt', '175'],
    ARRAY['Minimal Crest T-Shirt', '165'],
    ARRAY['Gradient Crochet Shirt', '425'],
    ARRAY['Stripe Knitted Shirt', '395'],
    ARRAY['Boucle Knit Short Sleeve', '450'],
    ARRAY['Crochet Shorts Gradient', '380'],
    ARRAY['Silk Printed Shorts', '350'],
    ARRAY['Tailored Relaxed Trousers', '420'],
    ARRAY['Tennis Shorts Classic', '295'],
    ARRAY['Monogram Track Pants', '385'],
    ARRAY['Casa Track Jacket', '650'],
    ARRAY['Monogram Zip Jacket', '595'],
    ARRAY['Full Tracksuit Set', '750'],
    ARRAY['Luxury Hoodie Casa Logo', '485'],
    ARRAY['Casablanca Court Sneakers', '550'],
    ARRAY['Tennis Leather Sneakers', '495'],
    ARRAY['Leather Loafers Casablanca', '580'],
    ARRAY['Casa Logo Slides', '295'],
    ARRAY['Silk Scarf Printed', '265'],
    ARRAY['Casa Tennis Cap', '185']
  ];
  sizes TEXT[] := ARRAY['S', 'M', 'L', 'XL', '42', '43', '44'];
  sources TEXT[] := ARRAY['organic', 'recontact', 'campaign'];
  product_idx INT;
  purchase_count INT;
  purchase_date DATE;
  i INT;
BEGIN
  FOR client_rec IN
    SELECT c.id, c.seller_id, c.tier
    FROM clients c
    WHERE c.is_demo = true
  LOOP
    seller_id := client_rec.seller_id;

    -- Determine number of purchases based on tier
    purchase_count := CASE client_rec.tier
      WHEN 'grand_prix' THEN 8 + floor(random() * 5)::int
      WHEN 'diplomatico' THEN 5 + floor(random() * 4)::int
      WHEN 'idealiste' THEN 3 + floor(random() * 3)::int
      WHEN 'kaizen' THEN 2 + floor(random() * 2)::int
      WHEN 'optimisto' THEN 1 + floor(random() * 2)::int
      ELSE floor(random() * 2)::int
    END;

    FOR i IN 1..purchase_count LOOP
      product_idx := 1 + floor(random() * array_length(product_catalog, 1))::int;
      purchase_date := CURRENT_DATE - (floor(random() * 180)::int);

      INSERT INTO purchases (client_id, seller_id, amount, description, purchase_date, source)
      VALUES (
        client_rec.id,
        seller_id,
        product_catalog[product_idx][2]::numeric,
        product_catalog[product_idx][1] || ' - ' || sizes[1 + floor(random() * array_length(sizes, 1))::int],
        purchase_date,
        sources[1 + floor(random() * 3)::int]
      );
    END LOOP;
  END LOOP;
END $$;

-- ── STEP 3: Recalculate total_spend for all demo clients ──

UPDATE clients c
SET
  total_spend = COALESCE((
    SELECT SUM(amount) FROM purchases WHERE client_id = c.id
  ), 0),
  updated_at = now()
WHERE is_demo = true;

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION (run these to check)
-- ═══════════════════════════════════════════════════════════════

-- Check interests count
SELECT 'Interests count:', COUNT(*) FROM client_interests WHERE client_id IN (SELECT id FROM clients WHERE is_demo = true);

-- Check purchases count
SELECT 'Purchases count:', COUNT(*) FROM purchases WHERE client_id IN (SELECT id FROM clients WHERE is_demo = true);

-- Sample interests
SELECT c.first_name, c.last_name, ci.category, ci.value
FROM client_interests ci
JOIN clients c ON c.id = ci.client_id
WHERE c.is_demo = true
ORDER BY random()
LIMIT 10;

-- Sample purchases
SELECT c.first_name, c.last_name, p.description, p.amount, p.purchase_date
FROM purchases p
JOIN clients c ON c.id = p.client_id
WHERE c.is_demo = true
ORDER BY random()
LIMIT 10;
