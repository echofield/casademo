-- ═══════════════════════════════════════════════════════════════
-- NOTIFICATIONS HARDENING (indexes, dedupe, generator EXECUTE)
-- Run after 005_notifications.sql (or equivalent manual deploy).
-- ═══════════════════════════════════════════════════════════════

-- Supporting index for seller inactivity / contact recency scans
CREATE INDEX IF NOT EXISTS idx_contacts_seller_date
  ON contacts (seller_id, contact_date DESC);

-- Speed lookups by client + type + recency (dedupe checks, UI deep links)
CREATE INDEX IF NOT EXISTS idx_notifications_client_type_created
  ON notifications (client_id, type, created_at DESC);

-- At most one client_overdue notification per recipient + client + UTC day
-- (reduces duplicates if generate_overdue_notifications() is run more than once)
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_client_overdue_daily
  ON notifications (
    user_id,
    client_id,
    ((created_at AT TIME ZONE 'UTC')::date)
  )
  WHERE type = 'client_overdue';

-- Cron / maintenance only: do not allow authenticated API users to invoke generators.
-- Triggers (notify_*) are unchanged — they are not revoked from PUBLIC here.
REVOKE ALL ON FUNCTION public.generate_overdue_notifications() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_overdue_notifications() TO service_role;

REVOKE ALL ON FUNCTION public.generate_seller_inactivity_alerts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_seller_inactivity_alerts() TO service_role;
