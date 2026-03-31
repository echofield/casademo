-- Birthday-based seller reminders
-- Extends existing notification/reminder infrastructure.

-- 1) Add optional birthday on clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS birthday DATE;

-- 2) Extend notification enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'notification_type'
      AND e.enumlabel = 'birthday_follow_up'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'birthday_follow_up';
  END IF;
END $$;

-- Helper: normalize a birthday month/day into a concrete year, clamping day-of-month.
CREATE OR REPLACE FUNCTION birthday_for_year(p_birthday DATE, p_year INT)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  birth_month INT;
  birth_day INT;
  month_days INT;
BEGIN
  birth_month := EXTRACT(MONTH FROM p_birthday)::INT;
  birth_day := EXTRACT(DAY FROM p_birthday)::INT;

  month_days := EXTRACT(DAY FROM (
    date_trunc('month', make_date(p_year, birth_month, 1) + INTERVAL '1 month') - INTERVAL '1 day'
  ))::INT;

  RETURN make_date(p_year, birth_month, LEAST(birth_day, month_days));
END;
$$;

-- Daily generator: one birthday reminder per client/year.
CREATE OR REPLACE FUNCTION generate_birthday_follow_up_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notified_count INTEGER := 0;
  today_paris DATE := (now() AT TIME ZONE 'Europe/Paris')::date;
  current_year INT := EXTRACT(YEAR FROM (now() AT TIME ZONE 'Europe/Paris'))::INT;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, client_id, due_at, event_key)
  SELECT
    c.seller_id,
    'birthday_follow_up',
    CASE
      WHEN c.tier IN ('idealiste', 'diplomatico', 'grand_prix') THEN 'Prepare for client birthday'
      ELSE 'Client birthday today'
    END,
    CASE
      WHEN c.tier IN ('idealiste', 'diplomatico', 'grand_prix') THEN 'Birthday in one month'
      ELSE 'Birthday today'
    END,
    c.id,
    now(),
    'birthday_follow_up:' || c.id::text || ':' || EXTRACT(YEAR FROM c.upcoming_birthday)::INT::text
  FROM (
    SELECT
      cl.id,
      cl.seller_id,
      cl.tier,
      birthday_for_year(
        cl.birthday,
        CASE
          WHEN birthday_for_year(cl.birthday, current_year) < today_paris
            THEN current_year + 1
          ELSE current_year
        END
      ) AS upcoming_birthday
    FROM clients cl
    JOIN profiles p ON p.id = cl.seller_id
    WHERE cl.birthday IS NOT NULL
      AND p.role = 'seller'
      AND p.active = true
  ) c
  WHERE (
    CASE
      WHEN c.tier IN ('idealiste', 'diplomatico', 'grand_prix')
        THEN (c.upcoming_birthday - INTERVAL '1 month')::DATE
      ELSE c.upcoming_birthday
    END
  ) = today_paris
  ON CONFLICT (event_key) DO NOTHING;

  GET DIAGNOSTICS notified_count = ROW_COUNT;
  RETURN notified_count;
END;
$$;
