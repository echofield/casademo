-- ═══════════════════════════════════════════════════════════════
-- Fix Demo Client Seller Assignments
-- Reassign demo clients to ACTUAL authenticated user profiles
-- by matching on first name
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Find actual user profiles and reassign clients
DO $$
DECLARE
  hasael_id UUID;
  hicham_id UUID;
  hamza_id UUID;
  elliott_id UUID;
  helen_id UUID;
  maxime_id UUID;
  raphael_id UUID;
  yassmine_id UUID;
  all_seller_ids UUID[];
  client_rec RECORD;
  idx INT := 0;
  seller_count INT;
BEGIN
  -- Find actual authenticated users by name pattern
  SELECT id INTO hasael_id FROM profiles WHERE full_name ILIKE '%Hasael%' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO hicham_id FROM profiles WHERE full_name ILIKE '%Hicham%' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO hamza_id FROM profiles WHERE full_name ILIKE '%Hamza%' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO elliott_id FROM profiles WHERE full_name ILIKE '%Elliott%' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO helen_id FROM profiles WHERE full_name ILIKE '%Helen%' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO maxime_id FROM profiles WHERE full_name ILIKE '%Maxime%' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO raphael_id FROM profiles WHERE full_name ILIKE '%Rapha%' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO yassmine_id FROM profiles WHERE full_name ILIKE '%Yassmine%' OR full_name ILIKE '%Yasmine%' ORDER BY created_at DESC LIMIT 1;

  -- Build array of found seller IDs (filter out NULLs)
  all_seller_ids := ARRAY[]::UUID[];

  IF hasael_id IS NOT NULL THEN all_seller_ids := array_append(all_seller_ids, hasael_id); END IF;
  IF hicham_id IS NOT NULL THEN all_seller_ids := array_append(all_seller_ids, hicham_id); END IF;
  IF hamza_id IS NOT NULL THEN all_seller_ids := array_append(all_seller_ids, hamza_id); END IF;
  IF elliott_id IS NOT NULL THEN all_seller_ids := array_append(all_seller_ids, elliott_id); END IF;
  IF helen_id IS NOT NULL THEN all_seller_ids := array_append(all_seller_ids, helen_id); END IF;
  IF maxime_id IS NOT NULL THEN all_seller_ids := array_append(all_seller_ids, maxime_id); END IF;
  IF raphael_id IS NOT NULL THEN all_seller_ids := array_append(all_seller_ids, raphael_id); END IF;
  IF yassmine_id IS NOT NULL THEN all_seller_ids := array_append(all_seller_ids, yassmine_id); END IF;

  seller_count := array_length(all_seller_ids, 1);

  RAISE NOTICE 'Found % sellers to assign clients to', seller_count;

  IF seller_count > 0 THEN
    -- Reassign all demo clients round-robin across found sellers
    FOR client_rec IN
      SELECT id FROM clients WHERE is_demo = true ORDER BY id
    LOOP
      UPDATE clients
      SET seller_id = all_seller_ids[(idx % seller_count) + 1],
          updated_at = now()
      WHERE id = client_rec.id;

      idx := idx + 1;
    END LOOP;

    RAISE NOTICE 'Reassigned % demo clients', idx;

    -- Also update purchases to match client seller_id
    UPDATE purchases p
    SET seller_id = c.seller_id
    FROM clients c
    WHERE p.client_id = c.id AND c.is_demo = true;

    -- Ensure all assigned sellers have 'seller' role
    INSERT INTO profiles_roles (user_id, role)
    SELECT unnest(all_seller_ids), 'seller'
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Refresh the recontact_queue view materialization if needed
-- (The view should auto-update, but let's ensure seller_name is correct)
