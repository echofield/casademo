-- ═══════════════════════════════════════════════════════════════
-- CASA ONE — Migration 015: Client Signal
-- Seller's manual assessment of purchase intent
-- Uses "signal language": Locked > Strong > Open > Low > Off
-- ═══════════════════════════════════════════════════════════════

-- ── ENUM: Client Signal ──
CREATE TYPE client_signal AS ENUM (
  'very_hot',    -- ◆✦ Locked — Decision made, conversion imminent
  'hot',         -- ◆  Strong — Clear interest, active engagement
  'warm',        -- ◇◆ Open   — Receptive but not committed
  'cold',        -- ◇  Low    — Minimal engagement
  'lost'         -- ◇̸  Off    — Signal lost, no response
);

-- ── Add signal columns to clients ──
ALTER TABLE clients ADD COLUMN IF NOT EXISTS seller_signal client_signal;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS signal_note TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS signal_updated_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS signal_updated_by UUID REFERENCES profiles(id);

-- ── Index for filtering by signal ──
CREATE INDEX IF NOT EXISTS idx_clients_signal ON clients(seller_signal) WHERE seller_signal IS NOT NULL;

-- ── Comments for documentation ──
COMMENT ON COLUMN clients.seller_signal IS 'Seller manual assessment: Locked/Strong/Open/Low/Off';
COMMENT ON COLUMN clients.signal_note IS 'Short note explaining signal (e.g., "Tried 3 jackets, coming back Friday")';
COMMENT ON COLUMN clients.signal_updated_at IS 'When the signal was last updated';
COMMENT ON COLUMN clients.signal_updated_by IS 'Which seller last updated the signal';

-- ═══════════════════════════════════════════════════════════════
-- Update recontact_queue view with signal priority
-- ═══════════════════════════════════════════════════════════════

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
  c.is_demo
FROM clients c
JOIN profiles p ON c.seller_id = p.id
WHERE c.next_recontact_date <= CURRENT_DATE + INTERVAL '3 days'
ORDER BY
  -- Signal priority: very_hot=0, hot=1, warm=2, null=3, cold=4, lost=5
  CASE c.seller_signal
    WHEN 'very_hot' THEN 0
    WHEN 'hot' THEN 1
    WHEN 'warm' THEN 2
    WHEN 'cold' THEN 4
    WHEN 'lost' THEN 5
    ELSE 3  -- NULL gets middle priority
  END ASC,
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

-- ═══════════════════════════════════════════════════════════════
-- Done. Signal columns added to clients table.
-- ═══════════════════════════════════════════════════════════════
