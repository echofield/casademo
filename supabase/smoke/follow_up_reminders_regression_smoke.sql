-- Regression smoke for follow-up reminders (028 + 029 baseline-safe)
-- Run in Supabase SQL editor. It writes only inside a transaction and rolls back.

BEGIN;

CREATE TEMP TABLE smoke_results (
  step TEXT NOT NULL,
  pass BOOLEAN NOT NULL,
  details TEXT NOT NULL
);

DO $$
DECLARE
  v_seller_id UUID;
  v_client_visit_only UUID;
  v_client_with_purchase UUID;
  v_purchase_id UUID;
  v_purchase_at TIMESTAMPTZ := TIMESTAMPTZ '2026-03-10 10:15:00+01';

  v_visit_key_visit_only TEXT;
  v_visit_key_purchase_client TEXT;
  v_purchase_thank_key TEXT;
  v_purchase_check_key TEXT;

  v_visit_due TIMESTAMPTZ;
  v_purchase_thank_due TIMESTAMPTZ;
  v_purchase_check_due TIMESTAMPTZ;

  v_count_before INT;
  v_count_after INT;
BEGIN
  SELECT p.id
  INTO v_seller_id
  FROM profiles p
  WHERE p.role = 'seller'
    AND p.active = true
  ORDER BY p.created_at ASC
  LIMIT 1;

  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'Smoke prerequisites missing: no active seller profile found.';
  END IF;

  -- Scenario 1: new client + no same-day purchase => visit_thank_you at end of day.
  INSERT INTO clients (first_name, last_name, seller_id, created_at)
  VALUES ('Smoke', 'VisitOnly', v_seller_id, now())
  RETURNING id INTO v_client_visit_only;

  v_visit_key_visit_only :=
    'visit_thank_you:' || v_client_visit_only::TEXT || ':' || ((now() AT TIME ZONE 'Europe/Paris')::DATE)::TEXT;

  SELECT n.due_at
  INTO v_visit_due
  FROM notifications n
  WHERE n.event_key = v_visit_key_visit_only
  ORDER BY n.created_at DESC
  LIMIT 1;

  INSERT INTO smoke_results(step, pass, details)
  VALUES (
    'S1 visit_thank_you created',
    v_visit_due IS NOT NULL,
    FORMAT('event_key=%s due_at=%s', v_visit_key_visit_only, COALESCE(v_visit_due::TEXT, 'NULL'))
  );

  INSERT INTO smoke_results(step, pass, details)
  VALUES (
    'S1 visit_thank_you due at Paris end-of-day',
    v_visit_due IS NOT NULL
      AND EXTRACT(HOUR FROM (v_visit_due AT TIME ZONE 'Europe/Paris')) = 23
      AND EXTRACT(MINUTE FROM (v_visit_due AT TIME ZONE 'Europe/Paris')) = 59,
    FORMAT('paris_due=%s', COALESCE((v_visit_due AT TIME ZONE 'Europe/Paris')::TEXT, 'NULL'))
  );

  -- Scenario 2 + 3: same-day purchase suppresses visit and schedules +24h / +3d.
  INSERT INTO clients (first_name, last_name, seller_id, created_at)
  VALUES ('Smoke', 'PurchaseDay', v_seller_id, v_purchase_at)
  RETURNING id INTO v_client_with_purchase;

  INSERT INTO purchases (client_id, seller_id, amount, description, purchase_date, created_at)
  VALUES (v_client_with_purchase, v_seller_id, 1200, 'Smoke purchase', v_purchase_at::DATE, v_purchase_at)
  RETURNING id INTO v_purchase_id;

  v_visit_key_purchase_client :=
    'visit_thank_you:' || v_client_with_purchase::TEXT || ':' || ((v_purchase_at AT TIME ZONE 'Europe/Paris')::DATE)::TEXT;
  v_purchase_thank_key := 'purchase_thank_you:' || v_purchase_id::TEXT;
  v_purchase_check_key := 'purchase_check_in:' || v_purchase_id::TEXT;

  INSERT INTO smoke_results(step, pass, details)
  VALUES (
    'S2 same-day purchase suppresses visit_thank_you',
    NOT EXISTS (SELECT 1 FROM notifications WHERE event_key = v_visit_key_purchase_client),
    FORMAT('visit_key=%s', v_visit_key_purchase_client)
  );

  SELECT n.due_at
  INTO v_purchase_thank_due
  FROM notifications n
  WHERE n.event_key = v_purchase_thank_key
  LIMIT 1;

  SELECT n.due_at
  INTO v_purchase_check_due
  FROM notifications n
  WHERE n.event_key = v_purchase_check_key
  LIMIT 1;

  INSERT INTO smoke_results(step, pass, details)
  VALUES (
    'S3 purchase_thank_you exact +24h',
    v_purchase_thank_due = v_purchase_at + INTERVAL '24 hours',
    FORMAT('expected=%s actual=%s', (v_purchase_at + INTERVAL '24 hours')::TEXT, COALESCE(v_purchase_thank_due::TEXT, 'NULL'))
  );

  INSERT INTO smoke_results(step, pass, details)
  VALUES (
    'S3 purchase_check_in exact +3d',
    v_purchase_check_due = v_purchase_at + INTERVAL '3 days',
    FORMAT('expected=%s actual=%s', (v_purchase_at + INTERVAL '3 days')::TEXT, COALESCE(v_purchase_check_due::TEXT, 'NULL'))
  );

  -- Scenario 4: idempotency guard via event_key uniqueness.
  SELECT COUNT(*) INTO v_count_before FROM notifications WHERE event_key = v_purchase_thank_key;

  INSERT INTO notifications (user_id, type, title, message, client_id, due_at, event_key)
  VALUES (
    v_seller_id,
    'purchase_thank_you',
    'duplicate-attempt',
    'duplicate-attempt',
    v_client_with_purchase,
    v_purchase_at + INTERVAL '24 hours',
    v_purchase_thank_key
  )
  ON CONFLICT (event_key) DO NOTHING;

  SELECT COUNT(*) INTO v_count_after FROM notifications WHERE event_key = v_purchase_thank_key;

  INSERT INTO smoke_results(step, pass, details)
  VALUES (
    'S4 duplicate reminder prevented by event_key',
    v_count_before = 1 AND v_count_after = 1,
    FORMAT('before=%s after=%s key=%s', v_count_before, v_count_after, v_purchase_thank_key)
  );
END $$;

SELECT * FROM smoke_results ORDER BY step;
SELECT CASE WHEN BOOL_AND(pass) THEN 'PASS' ELSE 'FAIL' END AS overall_result FROM smoke_results;

ROLLBACK;
