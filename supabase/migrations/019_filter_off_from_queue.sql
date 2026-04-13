-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- CASA ONE: Search Optimization + Signal-Aware Recontact Frequency
-- Migration 018
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- PART 1: SEARCH OPTIMIZATION
-- Enable trigram extension for fast fuzzy search on 1,405+ clients
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- PART 2: SIGNAL-AWARE RECONTACT FREQUENCY
-- Locked clients get recontacted more often, Off clients less often
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Trigger: Recalculate next_recontact_date when signal changes
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Update contact trigger to use signal-aware cadence
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Done.
-- Search: trigram indexes enable fast ILIKE queries
-- Recontact: signal now affects cadence (Locked = 2x faster, Off = 3x slower)
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- CASA ONE â€” Migration 019: Filter Off Clients from Queue
--
-- Off (lost) signal = no recontact scheduled. These clients should
-- not appear in the recontact queue at all.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

DROP VIEW IF EXISTS recontact_queue;

CREATE VIEW recontact_queue AS
SELECT
  c.id,
  c.first_name,
  c.last_name,
  c.phone,
  c.email,
  c.tier,
  c.total_spend,
  c.last_contact_date,
  c.next_recontact_date,
  (CURRENT_DATE - c.next_recontact_date) AS days_overdue,
  c.seller_id,
  p.full_name AS seller_name,
  c.seller_signal,
  c.signal_note,
  c.locale,
  c.first_impact,
  c.is_demo
FROM clients c
JOIN profiles p ON c.seller_id = p.id
WHERE c.next_recontact_date <= CURRENT_DATE + INTERVAL '3 days'
  -- Off clients should not appear in the queue
  AND (c.seller_signal IS NULL OR c.seller_signal != 'lost')
ORDER BY
  -- Signal priority: very_hot=0, hot=1, warm=2, null=3, cold=4
  CASE c.seller_signal
    WHEN 'very_hot' THEN 0
    WHEN 'hot' THEN 1
    WHEN 'warm' THEN 2
    WHEN 'cold' THEN 4
    ELSE 3  -- NULL gets middle priority
  END ASC,
  -- Foreign clients get slightly lower urgency (different rhythm)
  CASE c.locale WHEN 'foreign' THEN 1 ELSE 0 END ASC,
  -- Then by days overdue
  (CURRENT_DATE - c.next_recontact_date) DESC,
  -- Then by tier
  CASE c.tier
    WHEN 'grand_prix' THEN 6
    WHEN 'diplomatico' THEN 5
    WHEN 'idealiste' THEN 4
    WHEN 'kaizen' THEN 3
    WHEN 'optimisto' THEN 2
    WHEN 'rainbow' THEN 1
  END DESC;

COMMENT ON VIEW recontact_queue IS
  'Signal-aware recontact queue. Off (lost) clients excluded. Sorted by signal priority, locale, days overdue, tier.';

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Done. Off clients no longer appear in queue.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
