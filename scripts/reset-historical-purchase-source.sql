-- Casa One: Reset Historical Purchase Sources
-- Run this ONCE to fix imported purchases that defaulted to 'casa_one'
-- Historical sales should be 'walk_in' since they weren't CRM-attributed
-- Going forward, sellers will properly attribute each new purchase

-- Check current distribution (run this first to see the problem)
SELECT source, COUNT(*) as count, SUM(amount) as total_revenue
FROM purchases
GROUP BY source
ORDER BY count DESC;

-- Reset all historical purchases to 'walk_in'
-- Only purchases BEFORE launch date (2026-03-25) are affected
UPDATE purchases
SET source = 'walk_in'
WHERE purchase_date < '2026-03-25';

-- Verify the fix
SELECT source, COUNT(*) as count, SUM(amount) as total_revenue
FROM purchases
GROUP BY source
ORDER BY count DESC;

-- Optional: Check by date range to confirm
SELECT
  CASE
    WHEN purchase_date < '2026-03-25' THEN 'Historical'
    ELSE 'Post-launch'
  END as period,
  source,
  COUNT(*) as count
FROM purchases
GROUP BY 1, source
ORDER BY 1, count DESC;
