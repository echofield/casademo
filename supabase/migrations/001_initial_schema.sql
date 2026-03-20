-- ═══════════════════════════════════════════════════════════════
-- CASA ONE — Supabase Migration
-- Boutique Clienteling CRM · SYMI Intelligence
-- Run this in Supabase SQL Editor or as a migration file
-- ═══════════════════════════════════════════════════════════════

-- ── EXTENSIONS ──
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── ENUMS ──
CREATE TYPE user_role AS ENUM ('seller', 'supervisor');
CREATE TYPE contact_channel AS ENUM ('whatsapp', 'sms', 'phone', 'email', 'in_store', 'other');
CREATE TYPE client_tier AS ENUM ('rainbow', 'optimisto', 'kaizen', 'idealiste', 'diplomatico', 'grand_prix');

-- ── PROFILES (extends auth.users) ──
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'seller',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'seller')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── CLIENTS ──
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  seller_id UUID NOT NULL REFERENCES profiles(id),
  tier client_tier DEFAULT 'rainbow',
  total_spend NUMERIC(12,2) DEFAULT 0,
  first_contact_date DATE,
  last_contact_date DATE,
  next_recontact_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clients_seller ON clients(seller_id);
CREATE INDEX idx_clients_tier ON clients(tier);
CREATE INDEX idx_clients_recontact ON clients(next_recontact_date);
CREATE INDEX idx_clients_search ON clients USING gin(
  (first_name || ' ' || last_name) gin_trgm_ops
);

-- ── CLIENT INTERESTS ──
CREATE TABLE client_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_interests_client ON client_interests(client_id);

-- ── CONTACTS (interaction log) ──
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id),
  channel contact_channel NOT NULL,
  contact_date TIMESTAMPTZ DEFAULT now(),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contacts_client ON contacts(client_id);
CREATE INDEX idx_contacts_seller ON contacts(seller_id);
CREATE INDEX idx_contacts_date ON contacts(contact_date DESC);

-- ── PURCHASES ──
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id),
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  purchase_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_purchases_client ON purchases(client_id);

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- ── Auto-compute tier on purchase ──
CREATE OR REPLACE FUNCTION compute_client_tier()
RETURNS TRIGGER AS $$
DECLARE
  spend NUMERIC;
  new_tier client_tier;
  target_client_id UUID;
BEGIN
  -- Handle DELETE case
  target_client_id := COALESCE(NEW.client_id, OLD.client_id);

  SELECT COALESCE(SUM(amount), 0) INTO spend
  FROM purchases WHERE client_id = target_client_id;

  new_tier := CASE
    WHEN spend >= 25000 THEN 'grand_prix'
    WHEN spend >= 17000 THEN 'diplomatico'
    WHEN spend >= 10000 THEN 'idealiste'
    WHEN spend >= 2500  THEN 'kaizen'
    WHEN spend >= 1000  THEN 'optimisto'
    ELSE 'rainbow'
  END;

  UPDATE clients SET
    tier = new_tier,
    total_spend = spend,
    updated_at = now()
  WHERE id = target_client_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_compute_tier
AFTER INSERT OR UPDATE OR DELETE ON purchases
FOR EACH ROW EXECUTE FUNCTION compute_client_tier();

-- ── Auto-update recontact schedule ──
CREATE OR REPLACE FUNCTION update_recontact_schedule()
RETURNS TRIGGER AS $$
DECLARE
  t client_tier;
  days_interval INT;
BEGIN
  SELECT tier INTO t FROM clients WHERE id = NEW.client_id;

  days_interval := CASE t
    WHEN 'grand_prix'   THEN 7
    WHEN 'diplomatico'  THEN 14
    WHEN 'idealiste'    THEN 21
    WHEN 'kaizen'       THEN 30
    WHEN 'optimisto'    THEN 45
    WHEN 'rainbow'      THEN 60
  END;

  UPDATE clients SET
    last_contact_date = NEW.contact_date::DATE,
    next_recontact_date = NEW.contact_date::DATE + days_interval,
    first_contact_date = COALESCE(first_contact_date, NEW.contact_date::DATE),
    updated_at = now()
  WHERE id = NEW.client_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_recontact
AFTER INSERT ON contacts
FOR EACH ROW EXECUTE FUNCTION update_recontact_schedule();

-- ── Auto-update updated_at ──
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_interests ENABLE ROW LEVEL SECURITY;

-- Profiles: users see own, supervisors see all
CREATE POLICY profiles_own ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY profiles_supervisor ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor')
);

-- Clients: sellers see own, supervisors see all
CREATE POLICY clients_seller ON clients FOR ALL USING (
  seller_id = auth.uid()
) WITH CHECK (seller_id = auth.uid());

CREATE POLICY clients_supervisor ON clients FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor')
);

-- Contacts: sellers see own client contacts, supervisors see all
CREATE POLICY contacts_seller ON contacts FOR ALL USING (
  seller_id = auth.uid()
) WITH CHECK (seller_id = auth.uid());

CREATE POLICY contacts_supervisor ON contacts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor')
);

-- Purchases: same pattern
CREATE POLICY purchases_seller ON purchases FOR ALL USING (
  seller_id = auth.uid()
) WITH CHECK (seller_id = auth.uid());

CREATE POLICY purchases_supervisor ON purchases FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor')
);

-- Client interests: through client ownership
CREATE POLICY interests_seller ON client_interests FOR ALL USING (
  EXISTS (SELECT 1 FROM clients WHERE id = client_id AND seller_id = auth.uid())
);

CREATE POLICY interests_supervisor ON client_interests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor')
);

-- ═══════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════

-- Recontact queue — the operational heartbeat
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
  p.full_name AS seller_name
FROM clients c
JOIN profiles p ON c.seller_id = p.id
WHERE c.next_recontact_date <= CURRENT_DATE + INTERVAL '3 days'
ORDER BY
  (CURRENT_DATE - c.next_recontact_date) DESC,
  CASE c.tier
    WHEN 'grand_prix' THEN 6
    WHEN 'diplomatico' THEN 5
    WHEN 'idealiste' THEN 4
    WHEN 'kaizen' THEN 3
    WHEN 'optimisto' THEN 2
    WHEN 'rainbow' THEN 1
  END DESC;

-- Client 360 view
CREATE VIEW client_360 AS
SELECT
  c.*,
  p.full_name AS seller_name,
  (
    SELECT json_agg(json_build_object(
      'id', ci.id, 'category', ci.category, 'value', ci.value, 'detail', ci.detail
    ))
    FROM client_interests ci WHERE ci.client_id = c.id
  ) AS interests,
  (
    SELECT json_agg(json_build_object(
      'id', co.id, 'date', co.contact_date, 'channel', co.channel,
      'comment', co.comment, 'seller', ps.full_name
    ) ORDER BY co.contact_date DESC)
    FROM contacts co
    JOIN profiles ps ON co.seller_id = ps.id
    WHERE co.client_id = c.id
  ) AS contact_history,
  (
    SELECT json_agg(json_build_object(
      'id', pu.id, 'date', pu.purchase_date, 'amount', pu.amount,
      'description', pu.description
    ) ORDER BY pu.purchase_date DESC)
    FROM purchases pu WHERE pu.client_id = c.id
  ) AS purchase_history
FROM clients c
JOIN profiles p ON c.seller_id = p.id;

-- ═══════════════════════════════════════════════════════════════
-- INTEREST TAXONOMY (reference config)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE interest_taxonomy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  display_label TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  UNIQUE(category, value)
);

INSERT INTO interest_taxonomy (category, value, display_label, sort_order) VALUES
  ('fashion', 'sneakers', 'Sneakers', 1),
  ('fashion', 'ready_to_wear', 'Ready to Wear', 2),
  ('fashion', 'silk_shirts', 'Silk Shirts', 3),
  ('fashion', 'accessories', 'Accessories', 4),
  ('fashion', 'denim', 'Denim', 5),
  ('fashion', 'outerwear', 'Outerwear', 6),
  ('food', 'japanese', 'Japanese', 1),
  ('food', 'italian', 'Italian', 2),
  ('food', 'french', 'French', 3),
  ('food', 'wine', 'Wine', 4),
  ('food', 'cocktails', 'Cocktails', 5),
  ('art', 'contemporary', 'Contemporary', 1),
  ('art', 'street_art', 'Street Art', 2),
  ('art', 'photography', 'Photography', 3),
  ('music', 'hip_hop', 'Hip Hop', 1),
  ('music', 'jazz', 'Jazz', 2),
  ('music', 'electronic', 'Electronic', 3),
  ('music', 'classical', 'Classical', 4),
  ('lifestyle', 'travel', 'Travel', 1),
  ('lifestyle', 'fitness', 'Fitness', 2),
  ('lifestyle', 'cars', 'Cars', 3),
  ('lifestyle', 'watches', 'Watches', 4),
  ('lifestyle', 'tech', 'Tech', 5);

-- ═══════════════════════════════════════════════════════════════
-- DONE. Casa One database is ready.
-- ═══════════════════════════════════════════════════════════════
