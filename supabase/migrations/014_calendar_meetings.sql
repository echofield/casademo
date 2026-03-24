-- Migration: 014_calendar_meetings.sql
-- Creates the meetings/calendar system for seller appointments

-- Meeting format: where and how the rendez-vous happens
CREATE TYPE meeting_format AS ENUM (
  'boutique',
  'external',
  'call',
  'video',
  'whatsapp'
);

-- Meeting status
CREATE TYPE meeting_status AS ENUM (
  'scheduled',
  'completed',
  'cancelled',
  'no_show'
);

-- ── Idempotent trigger function ──
-- Drop and recreate to avoid signature/schema issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Meetings / appointments table
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

  -- What
  title TEXT NOT NULL,
  description TEXT,

  -- Where & How
  format meeting_format NOT NULL DEFAULT 'boutique',
  location TEXT,

  -- When
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,

  -- Status & Outcome
  status meeting_status NOT NULL DEFAULT 'scheduled',
  outcome_notes TEXT,
  outcome_purchased BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meetings_seller ON meetings(seller_id);
CREATE INDEX IF NOT EXISTS idx_meetings_client ON meetings(client_id);
CREATE INDEX IF NOT EXISTS idx_meetings_start ON meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_meetings_seller_date ON meetings(seller_id, start_time);

-- RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meetings_select_policy" ON meetings
  FOR SELECT USING (
    seller_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

CREATE POLICY "meetings_insert_policy" ON meetings
  FOR INSERT WITH CHECK (
    seller_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

CREATE POLICY "meetings_update_policy" ON meetings
  FOR UPDATE USING (
    seller_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

CREATE POLICY "meetings_delete_policy" ON meetings
  FOR DELETE USING (
    seller_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

-- Trigger — uses the function we just created/replaced above
DROP TRIGGER IF EXISTS meetings_updated_at ON meetings;
CREATE TRIGGER meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE meetings IS 'Seller meetings/appointments with clients';
COMMENT ON COLUMN meetings.format IS 'Where: boutique (default), external, call, video, whatsapp';
COMMENT ON COLUMN meetings.outcome_purchased IS 'Quick flag: did this meeting result in a purchase';
