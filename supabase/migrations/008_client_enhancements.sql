-- Client Enhancements Migration
-- Adds: origin, personal_shopper, sizing, conversion attribution, heat score, visits

-- 1. Client Origin (French/Foreign)
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS origin TEXT CHECK (origin IN ('french', 'foreign'));

COMMENT ON COLUMN clients.origin IS 'Client origin: french or foreign';

-- 2. Personal Shopper Status (independent of tier)
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS is_personal_shopper BOOLEAN DEFAULT false;

COMMENT ON COLUMN clients.is_personal_shopper IS 'Personal shopper client - special status independent of spending tier';

-- 3. Client Sizing Table
CREATE TABLE IF NOT EXISTS client_sizing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'chemises', 'pantalons', 'chaussures', 'vestes', etc.
  size TEXT NOT NULL, -- 'M', '40', '42', etc.
  fit_preference TEXT, -- 'slim', 'regular', 'oversized'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, category)
);

-- RLS for client_sizing
ALTER TABLE client_sizing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sizing for accessible clients"
  ON client_sizing FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = client_sizing.client_id
      AND (
        c.seller_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor')
      )
    )
  );

CREATE POLICY "Users can manage sizing for own clients"
  ON client_sizing FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = client_sizing.client_id
      AND (
        c.seller_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor')
      )
    )
  );

-- 4. Conversion Attribution on Purchases
-- Create conversion source enum
DO $$ BEGIN
  CREATE TYPE conversion_source AS ENUM (
    'organic',
    'recontact',
    'campaign',
    'referral'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE purchases
ADD COLUMN IF NOT EXISTS conversion_source conversion_source DEFAULT 'organic';

ALTER TABLE purchases
ADD COLUMN IF NOT EXISTS source_contact_id UUID REFERENCES contacts(id);

COMMENT ON COLUMN purchases.conversion_source IS 'How the purchase was attributed: organic, recontact, campaign, or referral';
COMMENT ON COLUMN purchases.source_contact_id IS 'If recontact, links to the contact that led to this purchase';

-- 5. Heat Score on Clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS heat_score INTEGER DEFAULT 50 CHECK (heat_score >= 0 AND heat_score <= 100);

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS heat_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN clients.heat_score IS 'Client heat score 0-100: how active/warm is this client';
COMMENT ON COLUMN clients.heat_updated_at IS 'When heat score was last recalculated';

-- 6. Visits Table (store visits without purchase)
CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id),
  visit_date TIMESTAMPTZ DEFAULT now(),
  duration_minutes INTEGER,
  tried_products TEXT[], -- products tried during visit
  notes TEXT,
  converted BOOLEAN DEFAULT false, -- did they buy during this visit?
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for visits
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view visits for accessible clients"
  ON visits FOR SELECT
  USING (
    seller_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = visits.client_id
      AND (
        c.seller_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor')
      )
    )
  );

CREATE POLICY "Users can create visits for own clients"
  ON visits FOR INSERT
  WITH CHECK (
    seller_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor')
  );

CREATE POLICY "Users can update own visits"
  ON visits FOR UPDATE
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_sizing_client ON client_sizing(client_id);
CREATE INDEX IF NOT EXISTS idx_visits_client ON visits(client_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_clients_heat_score ON clients(heat_score DESC);
CREATE INDEX IF NOT EXISTS idx_clients_origin ON clients(origin);
CREATE INDEX IF NOT EXISTS idx_clients_personal_shopper ON clients(is_personal_shopper) WHERE is_personal_shopper = true;

-- Update recontact_queue view to include new fields
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
  c.origin,
  c.is_personal_shopper,
  c.heat_score,
  CASE
    WHEN c.next_recontact_date IS NULL THEN 0
    ELSE EXTRACT(DAY FROM now() - c.next_recontact_date)::INTEGER
  END as days_overdue,
  c.seller_id,
  p.full_name as seller_name
FROM clients c
JOIN profiles p ON c.seller_id = p.id
WHERE c.next_recontact_date IS NOT NULL
ORDER BY
  CASE WHEN c.next_recontact_date < now() THEN 0 ELSE 1 END,
  c.next_recontact_date;

-- Grant access to the view
GRANT SELECT ON recontact_queue TO authenticated;

-- Update client_360 view to include new fields
DROP VIEW IF EXISTS client_360;
CREATE VIEW client_360 AS
SELECT
  c.id,
  c.first_name,
  c.last_name,
  c.email,
  c.phone,
  c.seller_id,
  c.tier,
  c.total_spend,
  c.first_contact_date,
  c.last_contact_date,
  c.next_recontact_date,
  c.notes,
  c.origin,
  c.is_personal_shopper,
  c.heat_score,
  c.created_at,
  c.updated_at,
  p.full_name as seller_name,
  (
    SELECT json_agg(json_build_object(
      'id', ci.id,
      'category', ci.category,
      'value', ci.value,
      'detail', ci.detail
    ))
    FROM client_interests ci
    WHERE ci.client_id = c.id
  ) as interests,
  (
    SELECT json_agg(json_build_object(
      'id', ct.id,
      'date', ct.contact_date,
      'channel', ct.channel,
      'comment', ct.comment,
      'seller', sp.full_name
    ) ORDER BY ct.contact_date DESC)
    FROM contacts ct
    JOIN profiles sp ON ct.seller_id = sp.id
    WHERE ct.client_id = c.id
  ) as contact_history,
  (
    SELECT json_agg(json_build_object(
      'id', pu.id,
      'date', pu.purchase_date,
      'amount', pu.amount,
      'description', pu.description,
      'conversion_source', pu.conversion_source
    ) ORDER BY pu.purchase_date DESC)
    FROM purchases pu
    WHERE pu.client_id = c.id
  ) as purchase_history,
  (
    SELECT json_agg(json_build_object(
      'id', cs.id,
      'category', cs.category,
      'size', cs.size,
      'fit_preference', cs.fit_preference,
      'notes', cs.notes
    ))
    FROM client_sizing cs
    WHERE cs.client_id = c.id
  ) as sizing,
  (
    SELECT json_agg(json_build_object(
      'id', v.id,
      'date', v.visit_date,
      'duration_minutes', v.duration_minutes,
      'tried_products', v.tried_products,
      'notes', v.notes,
      'converted', v.converted
    ) ORDER BY v.visit_date DESC)
    FROM visits v
    WHERE v.client_id = c.id
  ) as visit_history
FROM clients c
JOIN profiles p ON c.seller_id = p.id;

GRANT SELECT ON client_360 TO authenticated;

-- Function to recalculate heat score for a client
CREATE OR REPLACE FUNCTION calculate_heat_score(client_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  recency_score INTEGER;
  frequency_score INTEGER;
  monetary_score INTEGER;
  last_activity TIMESTAMPTZ;
  activity_count INTEGER;
  total_spent NUMERIC;
  final_score INTEGER;
BEGIN
  -- Get last activity (contact or purchase)
  SELECT GREATEST(
    COALESCE((SELECT MAX(contact_date) FROM contacts WHERE client_id = client_uuid), '1970-01-01'),
    COALESCE((SELECT MAX(purchase_date) FROM purchases WHERE client_id = client_uuid), '1970-01-01'),
    COALESCE((SELECT MAX(visit_date) FROM visits WHERE client_id = client_uuid), '1970-01-01')
  ) INTO last_activity;

  -- Recency score (40% weight)
  CASE
    WHEN last_activity > now() - interval '7 days' THEN recency_score := 100;
    WHEN last_activity > now() - interval '30 days' THEN recency_score := 80;
    WHEN last_activity > now() - interval '90 days' THEN recency_score := 50;
    WHEN last_activity > now() - interval '180 days' THEN recency_score := 25;
    ELSE recency_score := 0;
  END CASE;

  -- Frequency score (30% weight) - activities in last 12 months
  SELECT COUNT(*) INTO activity_count
  FROM (
    SELECT id FROM contacts WHERE client_id = client_uuid AND contact_date > now() - interval '12 months'
    UNION ALL
    SELECT id FROM purchases WHERE client_id = client_uuid AND purchase_date > now() - interval '12 months'
    UNION ALL
    SELECT id FROM visits WHERE client_id = client_uuid AND visit_date > now() - interval '12 months'
  ) activities;

  CASE
    WHEN activity_count > 12 THEN frequency_score := 100;
    WHEN activity_count > 6 THEN frequency_score := 75;
    WHEN activity_count > 3 THEN frequency_score := 50;
    WHEN activity_count > 1 THEN frequency_score := 25;
    ELSE frequency_score := 0;
  END CASE;

  -- Monetary score (30% weight)
  SELECT total_spend INTO total_spent FROM clients WHERE id = client_uuid;
  CASE
    WHEN total_spent >= 25000 THEN monetary_score := 100;
    WHEN total_spent >= 17000 THEN monetary_score := 85;
    WHEN total_spent >= 10000 THEN monetary_score := 70;
    WHEN total_spent >= 2500 THEN monetary_score := 50;
    WHEN total_spent >= 1000 THEN monetary_score := 30;
    ELSE monetary_score := 10;
  END CASE;

  -- Calculate final score
  final_score := (recency_score * 40 + frequency_score * 30 + monetary_score * 30) / 100;

  -- Update client
  UPDATE clients
  SET heat_score = final_score, heat_updated_at = now()
  WHERE id = client_uuid;

  RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update heat score after contact
CREATE OR REPLACE FUNCTION update_heat_score_on_contact()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_heat_score(NEW.client_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS heat_score_contact_trigger ON contacts;
CREATE TRIGGER heat_score_contact_trigger
AFTER INSERT ON contacts
FOR EACH ROW EXECUTE FUNCTION update_heat_score_on_contact();

-- Trigger to update heat score after purchase
DROP TRIGGER IF EXISTS heat_score_purchase_trigger ON purchases;
CREATE TRIGGER heat_score_purchase_trigger
AFTER INSERT ON purchases
FOR EACH ROW EXECUTE FUNCTION update_heat_score_on_contact();

-- Trigger to update heat score after visit
DROP TRIGGER IF EXISTS heat_score_visit_trigger ON visits;
CREATE TRIGGER heat_score_visit_trigger
AFTER INSERT ON visits
FOR EACH ROW EXECUTE FUNCTION update_heat_score_on_contact();
