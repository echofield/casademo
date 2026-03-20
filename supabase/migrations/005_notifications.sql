-- ═══════════════════════════════════════════════════════════════
-- NOTIFICATIONS SYSTEM
-- Auto-generated alerts for sellers and supervisors
-- ═══════════════════════════════════════════════════════════════

-- Notification types
CREATE TYPE notification_type AS ENUM (
  'client_overdue',      -- Client needs recontact (auto)
  'tier_upgrade',        -- Client upgraded tier (auto)
  'big_purchase',        -- Purchase above threshold (auto)
  'seller_inactive',     -- Seller hasn't logged contacts (supervisor only)
  'new_client_assigned', -- New client assigned to seller
  'manual'               -- Manual notification
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read = false;

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_own ON notifications FOR ALL USING (
  user_id = auth.uid()
);

-- ═══════════════════════════════════════════════════════════════
-- TRIGGER: Notify on tier upgrade
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION notify_tier_upgrade()
RETURNS TRIGGER AS $$
DECLARE
  client_name TEXT;
BEGIN
  -- Only fire if tier actually changed to a higher tier
  IF OLD.tier IS DISTINCT FROM NEW.tier AND NEW.tier IN ('kaizen', 'idealiste', 'diplomatico', 'grand_prix') THEN
    SELECT first_name || ' ' || last_name INTO client_name FROM clients WHERE id = NEW.id;

    -- Notify the seller
    INSERT INTO notifications (user_id, type, title, message, client_id)
    VALUES (
      NEW.seller_id,
      'tier_upgrade',
      client_name || ' upgraded to ' || NEW.tier,
      'Total spend: €' || NEW.total_spend::TEXT,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_tier_upgrade
AFTER UPDATE ON clients
FOR EACH ROW
WHEN (OLD.tier IS DISTINCT FROM NEW.tier)
EXECUTE FUNCTION notify_tier_upgrade();

-- ═══════════════════════════════════════════════════════════════
-- TRIGGER: Notify on big purchase (>=€5000)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION notify_big_purchase()
RETURNS TRIGGER AS $$
DECLARE
  client_name TEXT;
BEGIN
  IF NEW.amount >= 5000 THEN
    SELECT first_name || ' ' || last_name INTO client_name FROM clients WHERE id = NEW.client_id;

    -- Notify the seller
    INSERT INTO notifications (user_id, type, title, message, client_id)
    VALUES (
      NEW.seller_id,
      'big_purchase',
      'Big purchase: €' || NEW.amount::TEXT,
      client_name || ' - ' || COALESCE(NEW.description, 'No description'),
      NEW.client_id
    );

    -- Also notify all supervisors
    INSERT INTO notifications (user_id, type, title, message, client_id)
    SELECT
      p.id,
      'big_purchase',
      'Big purchase: €' || NEW.amount::TEXT,
      client_name || ' (via ' || (SELECT full_name FROM profiles WHERE id = NEW.seller_id) || ')',
      NEW.client_id
    FROM profiles p
    WHERE p.role = 'supervisor' AND p.id != NEW.seller_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_big_purchase
AFTER INSERT ON purchases
FOR EACH ROW
EXECUTE FUNCTION notify_big_purchase();

-- ═══════════════════════════════════════════════════════════════
-- FUNCTION: Generate overdue notifications (call daily via cron)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION generate_overdue_notifications()
RETURNS INTEGER AS $$
DECLARE
  notified_count INTEGER := 0;
  client_rec RECORD;
BEGIN
  -- Find overdue clients (> 3 days overdue, no notification in last 3 days)
  FOR client_rec IN
    SELECT
      c.id AS client_id,
      c.seller_id,
      c.first_name || ' ' || c.last_name AS client_name,
      (CURRENT_DATE - c.next_recontact_date) AS days_overdue
    FROM clients c
    WHERE c.next_recontact_date < CURRENT_DATE - INTERVAL '3 days'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.client_id = c.id
          AND n.type = 'client_overdue'
          AND n.created_at > now() - INTERVAL '3 days'
      )
  LOOP
    INSERT INTO notifications (user_id, type, title, message, client_id)
    VALUES (
      client_rec.seller_id,
      'client_overdue',
      client_rec.client_name || ' is ' || client_rec.days_overdue || ' days overdue',
      'Please recontact soon',
      client_rec.client_id
    );
    notified_count := notified_count + 1;
  END LOOP;

  RETURN notified_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- FUNCTION: Generate seller inactivity alerts for supervisors
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION generate_seller_inactivity_alerts()
RETURNS INTEGER AS $$
DECLARE
  notified_count INTEGER := 0;
  seller_rec RECORD;
  supervisor_rec RECORD;
BEGIN
  -- Find sellers with no contacts in last 3 days
  FOR seller_rec IN
    SELECT
      p.id AS seller_id,
      p.full_name,
      COALESCE(
        (SELECT MAX(contact_date)::DATE FROM contacts WHERE seller_id = p.id),
        p.created_at::DATE
      ) AS last_contact,
      (SELECT COUNT(*) FROM clients WHERE seller_id = p.id AND next_recontact_date <= CURRENT_DATE) AS overdue_count
    FROM profiles p
    WHERE p.role = 'seller'
      AND p.active = true
      AND NOT EXISTS (
        SELECT 1 FROM contacts c
        WHERE c.seller_id = p.id
          AND c.contact_date > now() - INTERVAL '3 days'
      )
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.type = 'seller_inactive'
          AND n.message LIKE '%' || p.full_name || '%'
          AND n.created_at > now() - INTERVAL '1 day'
      )
  LOOP
    -- Notify all supervisors
    FOR supervisor_rec IN
      SELECT id FROM profiles WHERE role = 'supervisor' AND active = true
    LOOP
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (
        supervisor_rec.id,
        'seller_inactive',
        seller_rec.full_name || ' - No activity in 3+ days',
        seller_rec.overdue_count || ' clients overdue'
      );
      notified_count := notified_count + 1;
    END LOOP;
  END LOOP;

  RETURN notified_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- VIEW: Unread notification count per user
-- ═══════════════════════════════════════════════════════════════

CREATE VIEW notification_counts AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE NOT read) AS unread_count,
  COUNT(*) AS total_count
FROM notifications
GROUP BY user_id;

-- ═══════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════
