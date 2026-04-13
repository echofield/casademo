-- ═══════════════════════════════════════════════════════════════════════════
-- CASA ONE: Search Optimization + Signal-Aware Recontact Frequency
-- Migration 018
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: SEARCH OPTIMIZATION
-- Enable trigram extension for fast fuzzy search on 1,405+ clients
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable trigram extension for fast fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN trigram indexes on searchable fields
-- These make ILIKE '%query%' use the index instead of full table scan
CREATE INDEX IF NOT EXISTS idx_clients_search_name
  ON clients USING gin ((first_name || ' ' || last_name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clients_search_email
  ON clients USING gin (email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clients_search_phone
  ON clients USING gin (phone gin_trgm_ops);

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2: SIGNAL-AWARE RECONTACT FREQUENCY
-- Locked clients get recontacted more often, Off clients less often
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to calculate recontact days based on tier + signal + locale
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
  multiplier FLOAT := 1.0;
BEGIN
  -- Base tier cadence
  base_days := CASE p_tier
    WHEN 'grand_prix'   THEN 7
    WHEN 'diplomatico'  THEN 14
    WHEN 'idealiste'    THEN 21
    WHEN 'kaizen'       THEN 30
    WHEN 'optimisto'    THEN 45
    WHEN 'rainbow'      THEN 60
    ELSE 60
  END;

  -- Foreign client multiplier (they're not local, less frequent)
  IF p_is_foreign THEN
    multiplier := multiplier * 2.0;
  END IF;

  -- Signal multiplier
  IF p_signal IS NOT NULL THEN
    multiplier := multiplier * CASE p_signal
      WHEN 'very_hot' THEN 0.5   -- Locked: double frequency
      WHEN 'hot'      THEN 1.0   -- Strong: normal
      WHEN 'warm'     THEN 1.0   -- Open: normal
      WHEN 'cold'     THEN 1.5   -- Low: slower
      WHEN 'lost'     THEN 3.0   -- Off: much slower
    END;
  END IF;

  -- Minimum 3 days, round to integer
  RETURN GREATEST(3, ROUND(base_days * multiplier)::INTEGER);
END;
$$;

COMMENT ON FUNCTION public.get_recontact_days IS
  'Calculates recontact days from tier + signal + locale. Min 3 days.';

-- ═══════════════════════════════════════════════════════════════════════════
-- Trigger: Recalculate next_recontact_date when signal changes
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.recalculate_recontact_on_signal_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  recontact_days INTEGER;
  is_foreign BOOLEAN;
BEGIN
  -- Only fire if signal actually changed
  IF OLD.seller_signal IS DISTINCT FROM NEW.seller_signal THEN
    -- Determine if foreign (locale column or phone prefix check)
    is_foreign := COALESCE(NEW.locale, 'local') = 'foreign';

    recontact_days := public.get_recontact_days(NEW.tier, NEW.seller_signal, is_foreign);

    -- Set next recontact from last contact date (or today if never contacted)
    NEW.next_recontact_date := COALESCE(NEW.last_contact_date, CURRENT_DATE) + recontact_days;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recalculate_recontact_on_signal ON clients;
CREATE TRIGGER recalculate_recontact_on_signal
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_recontact_on_signal_change();

-- ═══════════════════════════════════════════════════════════════════════════
-- Update contact trigger to use signal-aware cadence
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_client_on_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  client_row clients%ROWTYPE;
  recontact_days INTEGER;
  is_foreign BOOLEAN;
BEGIN
  -- Get the client
  SELECT * INTO client_row FROM clients WHERE id = NEW.client_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Determine if foreign
  is_foreign := COALESCE(client_row.locale, 'local') = 'foreign';

  -- Calculate signal-aware recontact days
  recontact_days := public.get_recontact_days(
    client_row.tier,
    client_row.seller_signal,
    is_foreign
  );

  -- Update client dates
  UPDATE clients SET
    last_contact_date = NEW.contact_date,
    next_recontact_date = NEW.contact_date + recontact_days
  WHERE id = NEW.client_id;

  RETURN NEW;
END;
$$;

-- Recreate trigger if needed (ensure it exists)
DROP TRIGGER IF EXISTS update_client_on_contact_trigger ON contacts;
CREATE TRIGGER update_client_on_contact_trigger
  AFTER INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_on_contact();

-- ═══════════════════════════════════════════════════════════════════════════
-- Done.
-- Search: trigram indexes enable fast ILIKE queries
-- Recontact: signal now affects cadence (Locked = 2x faster, Off = 3x slower)
-- ═══════════════════════════════════════════════════════════════════════════
