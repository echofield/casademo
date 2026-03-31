-- Follow-up reminder notifications (internal seller rhythm)
-- Adds scheduled reminder support and idempotent event keys.

-- 1) Extend notification types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'notification_type'
      AND e.enumlabel = 'visit_thank_you'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'visit_thank_you';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'notification_type'
      AND e.enumlabel = 'purchase_thank_you'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'purchase_thank_you';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'notification_type'
      AND e.enumlabel = 'purchase_check_in'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'purchase_check_in';
  END IF;
END $$;

-- 2) Add scheduling and idempotency columns
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS event_key TEXT;

CREATE INDEX IF NOT EXISTS idx_notifications_due_user
  ON notifications (user_id, read, due_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_event_key
  ON notifications (event_key);

-- 3) Trigger: schedule visit thank-you when a client is created
CREATE OR REPLACE FUNCTION schedule_visit_thank_you_reminder()
RETURNS TRIGGER AS $$
DECLARE
  client_name TEXT;
  created_day_paris DATE;
  eod_due_at TIMESTAMPTZ;
  reminder_key TEXT;
BEGIN
  created_day_paris := (NEW.created_at AT TIME ZONE 'Europe/Paris')::date;
  eod_due_at := (((NEW.created_at AT TIME ZONE 'Europe/Paris')::date + INTERVAL '1 day') - INTERVAL '1 minute')
    AT TIME ZONE 'Europe/Paris';
  reminder_key := 'visit_thank_you:' || NEW.id::text || ':' || created_day_paris::text;

  IF EXISTS (
    SELECT 1
    FROM purchases p
    WHERE p.client_id = NEW.id
      AND (p.created_at AT TIME ZONE 'Europe/Paris')::date = created_day_paris
  ) THEN
    RETURN NEW;
  END IF;

  client_name := trim(both ' ' FROM coalesce(NEW.first_name, '') || ' ' || coalesce(NEW.last_name, ''));
  IF client_name = '' THEN
    client_name := 'Client';
  END IF;

  INSERT INTO notifications (user_id, type, title, message, client_id, due_at, event_key)
  VALUES (
    NEW.seller_id,
    'visit_thank_you',
    'Thank client for visit',
    client_name || ' created today',
    NEW.id,
    eod_due_at,
    reminder_key
  )
  ON CONFLICT (event_key) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_schedule_visit_thank_you_reminder ON clients;
CREATE TRIGGER trg_schedule_visit_thank_you_reminder
AFTER INSERT ON clients
FOR EACH ROW
EXECUTE FUNCTION schedule_visit_thank_you_reminder();

-- 4) Trigger: schedule purchase follow-ups and suppress same-day visit thank-you
CREATE OR REPLACE FUNCTION schedule_purchase_followup_reminders()
RETURNS TRIGGER AS $$
DECLARE
  client_name TEXT;
  purchase_day_paris DATE;
BEGIN
  purchase_day_paris := (NEW.created_at AT TIME ZONE 'Europe/Paris')::date;

  DELETE FROM notifications
  WHERE event_key = ('visit_thank_you:' || NEW.client_id::text || ':' || purchase_day_paris::text);

  SELECT trim(both ' ' FROM coalesce(c.first_name, '') || ' ' || coalesce(c.last_name, ''))
  INTO client_name
  FROM clients c
  WHERE c.id = NEW.client_id;

  IF coalesce(client_name, '') = '' THEN
    client_name := 'Client';
  END IF;

  INSERT INTO notifications (user_id, type, title, message, client_id, due_at, event_key)
  VALUES (
    NEW.seller_id,
    'purchase_thank_you',
    'Thank client for purchase',
    client_name || ' purchased yesterday',
    NEW.client_id,
    NEW.created_at + INTERVAL '24 hours',
    'purchase_thank_you:' || NEW.id::text
  )
  ON CONFLICT (event_key) DO NOTHING;

  INSERT INTO notifications (user_id, type, title, message, client_id, due_at, event_key)
  VALUES (
    NEW.seller_id,
    'purchase_check_in',
    'Check in after purchase',
    '3 days since purchase for ' || client_name,
    NEW.client_id,
    NEW.created_at + INTERVAL '3 days',
    'purchase_check_in:' || NEW.id::text
  )
  ON CONFLICT (event_key) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_schedule_purchase_followup_reminders ON purchases;
CREATE TRIGGER trg_schedule_purchase_followup_reminders
AFTER INSERT ON purchases
FOR EACH ROW
EXECUTE FUNCTION schedule_purchase_followup_reminders();
