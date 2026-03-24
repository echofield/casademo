-- ═══════════════════════════════════════════════════════════════
-- CASA ONE — Migration 018: Client Locale, First Impact, Gift Purchases
-- 
-- 1. Locale: local vs foreign — affects recontact cadence
-- 2. First impact: how the client entered (high vs progressive)
-- 3. Gift fields on purchases: optional, zero-friction
-- 4. Updated recontact queue with locale-aware cadence
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Client locale ──
ALTER TABLE clients ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'local';
COMMENT ON COLUMN clients.locale IS 'local = lives nearby, foreign = visitor/tourist/international';

CREATE INDEX IF NOT EXISTS idx_clients_locale ON clients(locale);

-- ── 2. First impact (entry profile) ──
-- Derived from first purchase amount relative to tier thresholds.
-- flash_entry  = first purchase >= 2500€ (jumped to kaizen+ on day one)
-- strong_entry = first purchase >= 1000€ 
-- progressive  = first purchase < 1000€ (standard growth path)
-- unknown      = no purchase history yet
ALTER TABLE clients ADD COLUMN IF NOT EXISTS first_impact TEXT NOT NULL DEFAULT 'unknown';
COMMENT ON COLUMN clients.first_impact IS 'Entry profile: flash_entry (>=2500€ first buy), strong_entry (>=1000€), progressive (<1000€), unknown';

-- ── 3. Gift fields on purchases (all optional) ──
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS is_gift BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS gift_recipient TEXT;
COMMENT ON COLUMN purchases.is_gift IS 'Whether this purchase was a gift for someone else';
COMMENT ON COLUMN purchases.gift_recipient IS 'Who the gift is for (name or relation, e.g. "wife", "business partner Marc")';

-- ── 4. Backfill first_impact from existing demo purchase data ──
-- Uses the earliest purchase per client to determine entry profile
WITH first_purchases AS (
  SELECT DISTINCT ON (client_id)
    client_id,
    amount
  FROM purchases
  ORDER BY client_id, purchase_date ASC, created_at ASC
)
UPDATE clients c
SET first_impact = CASE
  WHEN fp.amount >= 2500 THEN 'flash_entry'
  WHEN fp.amount >= 1000 THEN 'strong_entry'
  ELSE 'progressive'
END
FROM first_purchases fp
WHERE fp.client_id = c.id
  AND c.is_demo = true;

-- Randomly assign some demo clients as foreign
UPDATE clients
SET locale = 'foreign'
WHERE is_demo = true
  AND id IN (
    SELECT id FROM clients WHERE is_demo = true ORDER BY RANDOM() LIMIT 8
  );

-- ── 5. Recontact cadence taxonomy ──
-- Local clients: standard tier-based cadence (existing TIER_RECONTACT_DAYS)
-- Foreign clients: 2x the cadence (contact less frequently but more strategically)
-- This is reflected in the updated recontact_queue view below.

-- ── 6. Update recontact_queue view with locale awareness ──
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
ORDER BY
  -- Signal priority: very_hot=0, hot=1, warm=2, null=3, cold=4, lost=5
  CASE c.seller_signal
    WHEN 'very_hot' THEN 0
    WHEN 'hot' THEN 1
    WHEN 'warm' THEN 2
    WHEN 'cold' THEN 4
    WHEN 'lost' THEN 5
    ELSE 3
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

-- ═══════════════════════════════════════════════════════════════
-- Done.
-- ═══════════════════════════════════════════════════════════════
