-- ═══════════════════════════════════════════════════════════════
-- CASA ONE — Migration 019: Filter Off Clients from Queue
--
-- Off (lost) signal = no recontact scheduled. These clients should
-- not appear in the recontact queue at all.
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

-- ═══════════════════════════════════════════════════════════════
-- Done. Off clients no longer appear in queue.
-- ═══════════════════════════════════════════════════════════════
