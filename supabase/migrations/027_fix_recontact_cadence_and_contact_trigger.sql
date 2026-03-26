-- ═══════════════════════════════════════════════════════════════
-- CASA ONE — Migration 027: Fix recontact cadence + contact trigger
-- Ensures "mark as done" pushes clients out of queue reliably.
-- ═══════════════════════════════════════════════════════════════

-- Normalize cadence logic (no hidden 3-day fallbacks for warm clients).
-- Expected: optimisto + NULL signal + foreign => 45 days.
CREATE OR REPLACE FUNCTION public.get_recontact_days(
  p_tier client_tier,
  p_signal client_signal DEFAULT NULL,
  p_is_foreign BOOLEAN DEFAULT FALSE
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  base_days INTEGER;
  multiplier NUMERIC := 1.0;
BEGIN
  base_days := CASE p_tier
    WHEN 'grand_prix'   THEN 7
    WHEN 'diplomatico'  THEN 14
    WHEN 'idealiste'    THEN 21
    WHEN 'kaizen'       THEN 30
    WHEN 'optimisto'    THEN 45
    WHEN 'rainbow'      THEN 60
    ELSE 60
  END;

  IF p_signal IS NOT NULL THEN
    multiplier := CASE p_signal
      WHEN 'very_hot' THEN 0.5
      WHEN 'hot'      THEN 1.0
      WHEN 'warm'     THEN 1.0
      WHEN 'cold'     THEN 1.5
      WHEN 'lost'     THEN 3.0
      ELSE 1.0
    END;
  END IF;

  RETURN GREATEST(3, ROUND(base_days * multiplier)::INTEGER);
END;
$$;

COMMENT ON FUNCTION public.get_recontact_days IS
  'Tier + signal cadence. Locale does not reduce cadence. Min 3 days.';

-- Ensure contact trigger updates DATE fields deterministically.
CREATE OR REPLACE FUNCTION public.update_client_on_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  client_row clients%ROWTYPE;
  recontact_days INTEGER;
  is_foreign BOOLEAN;
BEGIN
  SELECT * INTO client_row FROM clients WHERE id = NEW.client_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  is_foreign := COALESCE(client_row.locale, 'local') = 'foreign';
  recontact_days := public.get_recontact_days(
    client_row.tier,
    client_row.seller_signal,
    is_foreign
  );

  UPDATE clients SET
    last_contact_date = NEW.contact_date::DATE,
    next_recontact_date = NEW.contact_date::DATE + recontact_days,
    first_contact_date = COALESCE(first_contact_date, NEW.contact_date::DATE)
  WHERE id = NEW.client_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_client_on_contact_trigger ON contacts;
CREATE TRIGGER update_client_on_contact_trigger
  AFTER INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_on_contact();
