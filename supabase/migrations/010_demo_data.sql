-- Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
-- CASA ONE Ã¢â‚¬â€ Demo Data Enhancement Migration
-- Restricts sellers to 8 real team members
-- Populates sizing, interests, and purchases with Casablanca data
-- Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â

-- Ã¢â€â‚¬Ã¢â€â‚¬ STEP 1: Update seller names to match real team Ã¢â€â‚¬Ã¢â€â‚¬
-- The 8 real sellers: Hicham, Hamza, Elliott, Helen, Maxime, RaphaÃƒÂ«l, Yassmine, Hasael

-- First, get current seller IDs and update their names
DO $$
DECLARE
  seller_ids UUID[];
  real_names TEXT[] := ARRAY['Hicham', 'Hamza', 'Elliott', 'Helen', 'Maxime', 'RaphaÃƒÂ«l', 'Yassmine', 'Hasael'];
  i INT;
BEGIN
  -- Get all seller IDs (limit to 8)
  SELECT ARRAY(
    SELECT id FROM profiles
    WHERE role = 'seller' AND active = true
    ORDER BY created_at
    LIMIT 8
  ) INTO seller_ids;

  -- Update each seller with a real name
  FOR i IN 1..LEAST(array_length(seller_ids, 1), 8) LOOP
    UPDATE profiles
    SET full_name = real_names[i],
        updated_at = now()
    WHERE id = seller_ids[i];
  END LOOP;

  -- Mark any excess sellers as inactive
  UPDATE profiles
  SET active = false
  WHERE role = 'seller'
    AND id NOT IN (SELECT unnest(seller_ids[1:8]));
END $$;

-- Ã¢â€â‚¬Ã¢â€â‚¬ STEP 2: Reassign demo clients evenly across 8 sellers Ã¢â€â‚¬Ã¢â€â‚¬
DO $$
DECLARE
  seller_ids UUID[];
  client_rec RECORD;
  idx INT := 0;
  seller_count INT;
BEGIN
  -- Get active seller IDs
  SELECT ARRAY(
    SELECT id FROM profiles
    WHERE role = 'seller' AND active = true
    ORDER BY full_name
  ) INTO seller_ids;

  seller_count := array_length(seller_ids, 1);

  IF seller_count > 0 THEN
    -- Reassign each demo client round-robin
    FOR client_rec IN
      SELECT id FROM clients WHERE is_demo = true ORDER BY id
    LOOP
      UPDATE clients
      SET seller_id = seller_ids[(idx % seller_count) + 1],
          updated_at = now()
      WHERE id = client_rec.id;
      idx := idx + 1;
    END LOOP;
  END IF;
END $$;

-- Ã¢â€â‚¬Ã¢â€â‚¬ STEP 3: Clear existing demo sizing/interests/purchases Ã¢â€â‚¬Ã¢â€â‚¬
DELETE FROM client_sizing WHERE client_id IN (SELECT id FROM clients WHERE is_demo = true);
DELETE FROM client_interests WHERE client_id IN (SELECT id FROM clients WHERE is_demo = true);
DELETE FROM purchases WHERE client_id IN (SELECT id FROM clients WHERE is_demo = true);

-- Ã¢â€â‚¬Ã¢â€â‚¬ STEP 4: Add sizing data for demo clients Ã¢â€â‚¬Ã¢â€â‚¬
-- Dual format for shoes (EU/US), letter sizes for clothing

DO $$
DECLARE
  client_rec RECORD;
  tops_sizes TEXT[] := ARRAY['S', 'M', 'L', 'XL'];
  bottoms_sizes TEXT[] := ARRAY['S', 'M', 'L', 'XL', '46', '48', '50', '52'];
  shoe_sizes TEXT[] := ARRAY['40 / US 7', '41 / US 8', '42 / US 9', '43 / US 10', '44 / US 11', '45 / US 12'];
  fits TEXT[] := ARRAY['Slim', 'Regular', 'Relaxed'];
  random_idx INT;
BEGIN
  FOR client_rec IN SELECT id FROM clients WHERE is_demo = true LOOP
    -- Tops sizing (90% of clients)
    IF random() < 0.9 THEN
      INSERT INTO client_sizing (client_id, category, size, fit_preference)
      VALUES (
        client_rec.id,
        'Tops',
        tops_sizes[1 + floor(random() * array_length(tops_sizes, 1))::int],
        fits[1 + floor(random() * array_length(fits, 1))::int]
      )
      ON CONFLICT (client_id, category) DO NOTHING;
    END IF;

    -- Bottoms sizing (80% of clients)
    IF random() < 0.8 THEN
      INSERT INTO client_sizing (client_id, category, size, fit_preference)
      VALUES (
        client_rec.id,
        'Bottoms',
        bottoms_sizes[1 + floor(random() * array_length(bottoms_sizes, 1))::int],
        fits[1 + floor(random() * array_length(fits, 1))::int]
      )
      ON CONFLICT (client_id, category) DO NOTHING;
    END IF;

    -- Shoes sizing (70% of clients) - Dual format
    IF random() < 0.7 THEN
      INSERT INTO client_sizing (client_id, category, size, fit_preference)
      VALUES (
        client_rec.id,
        'Shoes',
        shoe_sizes[1 + floor(random() * array_length(shoe_sizes, 1))::int],
        NULL
      )
      ON CONFLICT (client_id, category) DO NOTHING;
    END IF;

    -- Outerwear sizing (50% of clients)
    IF random() < 0.5 THEN
      INSERT INTO client_sizing (client_id, category, size, fit_preference)
      VALUES (
        client_rec.id,
        'Outerwear',
        tops_sizes[1 + floor(random() * array_length(tops_sizes, 1))::int],
        fits[1 + floor(random() * array_length(fits, 1))::int]
      )
      ON CONFLICT (client_id, category) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Ã¢â€â‚¬Ã¢â€â‚¬ STEP 5: Add interests aligned with Casablanca collections Ã¢â€â‚¬Ã¢â€â‚¬

DO $$
DECLARE
  client_rec RECORD;
  product_values TEXT[] := ARRAY['Silk shirts', 'T-shirts', 'Knitwear', 'Shorts', 'Tracksuits', 'Sneakers', 'Accessories', 'Trousers'];
  collection_values TEXT[] := ARRAY['Tennis Club', 'Maison De RÃƒÂªve', 'Gradient Wave', 'Monogram', 'Sunset Landscape'];
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

-- Ã¢â€â‚¬Ã¢â€â‚¬ STEP 6: Add purchase history with real Casablanca products Ã¢â€â‚¬Ã¢â€â‚¬

DO $$
DECLARE
  client_rec RECORD;
  seller_id UUID;
  product_catalog TEXT[][] := ARRAY[
    -- Silk shirts (Ã¢â€šÂ¬450-650)
    ARRAY['Gradient Wave Silk Shirt', '550'],
    ARRAY['Tennis Club Printed Silk Shirt', '580'],
    ARRAY['Maison De RÃƒÂªve Silk Shirt', '520'],
    ARRAY['Monogram Silk Shirt (black)', '495'],
    ARRAY['Sunset Landscape Silk Shirt', '550'],
    -- T-shirts (Ã¢â€šÂ¬150-250)
    ARRAY['Casa Logo Classic T-Shirt', '185'],
    ARRAY['Tennis Club Graphic Tee', '195'],
    ARRAY['Gradient Logo T-Shirt', '175'],
    ARRAY['Minimal Crest T-Shirt', '165'],
    -- Knitwear (Ã¢â€šÂ¬350-500)
    ARRAY['Gradient Crochet Shirt', '425'],
    ARRAY['Stripe Knitted Shirt', '395'],
    ARRAY['BouclÃƒÂ© Knit Short Sleeve', '450'],
    ARRAY['Crochet Shorts Gradient', '380'],
    -- Shorts/Trousers (Ã¢â€šÂ¬300-450)
    ARRAY['Silk Printed Shorts', '350'],
    ARRAY['Tailored Relaxed Trousers', '420'],
    ARRAY['Tennis Shorts Classic', '295'],
    ARRAY['Monogram Track Pants', '385'],
    -- Outerwear (Ã¢â€šÂ¬500-800)
    ARRAY['Casa Track Jacket', '650'],
    ARRAY['Monogram Zip Jacket', '595'],
    ARRAY['Full Tracksuit Set (green)', '750'],
    ARRAY['Luxury Hoodie Casa Logo', '485'],
    -- Footwear (Ã¢â€šÂ¬450-650)
    ARRAY['Casablanca Court Sneakers', '550'],
    ARRAY['Tennis Leather Sneakers', '495'],
    ARRAY['Leather Loafers Casablanca', '580'],
    ARRAY['Casa Logo Slides', '295'],
    -- Accessories (Ã¢â€šÂ¬150-300)
    ARRAY['Silk Scarf Printed', '265'],
    ARRAY['Casa Tennis Cap', '185']
  ];
  sizes TEXT[] := ARRAY['S', 'M', 'L', 'XL', '42', '43', '44'];
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
      purchase_date := CURRENT_DATE - (floor(random() * 180)::int); -- Random date in last 6 months

      INSERT INTO purchases (client_id, seller_id, amount, description, purchase_date, conversion_source)
      VALUES (
        client_rec.id,
        seller_id,
        product_catalog[product_idx][2]::numeric,
        product_catalog[product_idx][1] || ' Ã¢â‚¬â€ ' || sizes[1 + floor(random() * array_length(sizes, 1))::int],
        purchase_date,
        (ARRAY['organic', 'recontact', 'campaign'])[1 + floor(random() * 3)::int]::conversion_source
      );
    END LOOP;
  END LOOP;
END $$;

-- Ã¢â€â‚¬Ã¢â€â‚¬ STEP 7: Recalculate tier and total_spend for all demo clients Ã¢â€â‚¬Ã¢â€â‚¬
-- The trigger should handle this, but let's ensure consistency

UPDATE clients c
SET
  total_spend = COALESCE((
    SELECT SUM(amount) FROM purchases WHERE client_id = c.id
  ), 0),
  tier = (
    CASE
      WHEN COALESCE((SELECT SUM(amount) FROM purchases WHERE client_id = c.id), 0) >= 25000 THEN 'grand_prix'
      WHEN COALESCE((SELECT SUM(amount) FROM purchases WHERE client_id = c.id), 0) >= 17000 THEN 'diplomatico'
      WHEN COALESCE((SELECT SUM(amount) FROM purchases WHERE client_id = c.id), 0) >= 10000 THEN 'idealiste'
      WHEN COALESCE((SELECT SUM(amount) FROM purchases WHERE client_id = c.id), 0) >= 2500 THEN 'kaizen'
      WHEN COALESCE((SELECT SUM(amount) FROM purchases WHERE client_id = c.id), 0) >= 1000 THEN 'optimisto'
      ELSE 'rainbow'
    END
  )::client_tier,
  updated_at = now()
WHERE is_demo = true;

-- Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
-- VERIFICATION QUERIES (run after migration to check results)
-- Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
/*
-- Check seller distribution
SELECT full_name,
  (SELECT COUNT(*) FROM clients WHERE seller_id = p.id AND is_demo = true) as client_count
FROM profiles p
WHERE role = 'seller' AND active = true
ORDER BY full_name;

-- Check sizing distribution
SELECT category, COUNT(*) FROM client_sizing
WHERE client_id IN (SELECT id FROM clients WHERE is_demo = true)
GROUP BY category;

-- Check interests distribution
SELECT category, value, COUNT(*) FROM client_interests
WHERE client_id IN (SELECT id FROM clients WHERE is_demo = true)
GROUP BY category, value
ORDER BY category, COUNT(*) DESC;

-- Check purchase count by tier
SELECT c.tier, COUNT(DISTINCT c.id) as clients, COUNT(p.id) as purchases
FROM clients c
LEFT JOIN purchases p ON p.client_id = c.id
WHERE c.is_demo = true
GROUP BY c.tier
ORDER BY c.tier;

-- Sample product names
SELECT description, amount FROM purchases
WHERE client_id IN (SELECT id FROM clients WHERE is_demo = true)
ORDER BY random() LIMIT 20;
*/
