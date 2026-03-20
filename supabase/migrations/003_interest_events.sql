-- ═══════════════════════════════════════════════════════════════
-- INTEREST EVENTS CALENDAR
-- Hardcoded events tied to interest categories for smart recontact
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE interest_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  value TEXT,  -- NULL = applies to whole category
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  recurrence TEXT CHECK (recurrence IN ('annual', 'quarterly', 'monthly', NULL)),
  notify_days_before INT DEFAULT 7,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_interest_events_date ON interest_events(event_date);
CREATE INDEX idx_interest_events_category ON interest_events(category, value);

-- ═══════════════════════════════════════════════════════════════
-- SEED: Key events by interest category
-- ═══════════════════════════════════════════════════════════════

INSERT INTO interest_events (category, value, event_name, event_date, recurrence, notify_days_before, description) VALUES
-- Fashion
('fashion', 'sneakers', 'Air Jordan Spring Drop', '2025-03-15', 'annual', 7, 'Major sneaker release'),
('fashion', 'sneakers', 'Air Max Day', '2025-03-26', 'annual', 7, 'Nike Air Max anniversary'),
('fashion', 'sneakers', 'Yeezy Day', '2025-08-02', 'annual', 7, 'Adidas Yeezy releases'),
('fashion', 'ready_to_wear', 'Paris Fashion Week SS', '2025-09-23', 'annual', 14, 'Spring/Summer collections'),
('fashion', 'ready_to_wear', 'Paris Fashion Week AW', '2025-02-24', 'annual', 14, 'Autumn/Winter collections'),
('fashion', NULL, 'Soldes Hiver', '2025-01-08', 'annual', 7, 'Winter sales start'),
('fashion', NULL, 'Soldes Ete', '2025-06-25', 'annual', 7, 'Summer sales start'),

-- Food & Wine
('food', 'wine', 'Beaujolais Nouveau', '2025-11-20', 'annual', 7, 'Third Thursday of November'),
('food', 'wine', 'Vinexpo Paris', '2025-02-10', 'annual', 14, 'Major wine trade fair'),
('food', 'wine', 'Fete des Vendanges Montmartre', '2025-10-08', 'annual', 7, 'Paris wine harvest festival'),
('food', 'japanese', 'Japan Expo Paris', '2025-07-10', 'annual', 14, 'Japanese culture festival'),
('food', 'italian', 'Settimana della Cucina Italiana', '2025-11-17', 'annual', 7, 'Italian cuisine week'),

-- Art
('art', 'contemporary', 'FIAC Paris', '2025-10-16', 'annual', 14, 'International contemporary art fair'),
('art', 'contemporary', 'Art Paris', '2025-04-03', 'annual', 14, 'Modern and contemporary art fair'),
('art', 'street_art', 'Urban Art Fair', '2025-04-24', 'annual', 7, 'Street art fair Paris'),
('art', 'photography', 'Paris Photo', '2025-11-06', 'annual', 14, 'Photography art fair'),

-- Music
('music', 'hip_hop', 'Rolling Loud Paris', '2025-07-11', 'annual', 14, 'Major hip-hop festival'),
('music', 'hip_hop', 'Grammys', '2025-02-02', 'annual', 7, 'Awards night'),
('music', 'jazz', 'Jazz a la Villette', '2025-08-28', 'annual', 14, 'Paris jazz festival'),
('music', 'electronic', 'Peacock Society', '2025-07-04', 'annual', 14, 'Electronic music festival Paris'),
('music', 'classical', 'Festival de Saint-Denis', '2025-06-01', 'annual', 14, 'Classical music festival'),

-- Lifestyle
('lifestyle', 'watches', 'Watches & Wonders Geneva', '2025-04-01', 'annual', 21, 'Major watch fair'),
('lifestyle', 'watches', 'LVMH Watch Week', '2025-01-20', 'annual', 14, 'LVMH brands showcase'),
('lifestyle', 'cars', 'Paris Motor Show', '2025-10-14', 'annual', 14, 'Mondial de lAutomobile'),
('lifestyle', 'cars', 'Le Mans 24h', '2025-06-14', 'annual', 7, 'Endurance race'),
('lifestyle', 'travel', 'IFTM Top Resa', '2025-10-01', 'annual', 7, 'Travel trade show Paris'),
('lifestyle', 'fitness', 'Paris Marathon', '2025-04-06', 'annual', 14, 'Marathon de Paris'),
('lifestyle', 'tech', 'VivaTech', '2025-06-11', 'annual', 14, 'Tech startup conference Paris'),

-- Sports (bonus - common client interests)
('sport', 'football', 'Champions League Final', '2025-05-31', 'annual', 14, 'UEFA CL Final'),
('sport', 'football', 'Coupe de France Final', '2025-05-03', 'annual', 7, 'French cup final'),
('sport', 'tennis', 'Roland Garros', '2025-05-25', 'annual', 14, 'French Open'),
('sport', 'rugby', 'Six Nations France', '2025-02-01', 'annual', 7, 'Rugby tournament'),
('sport', 'golf', 'Ryder Cup', '2025-09-26', 'annual', 14, 'Golf team competition');

-- ═══════════════════════════════════════════════════════════════
-- VIEW: Upcoming events with matching client count
-- ═══════════════════════════════════════════════════════════════

CREATE VIEW upcoming_interest_events AS
SELECT
  ie.*,
  (ie.event_date - CURRENT_DATE) AS days_until,
  (
    SELECT COUNT(DISTINCT ci.client_id)
    FROM client_interests ci
    WHERE ci.category = ie.category
    AND (ie.value IS NULL OR ci.value = ie.value)
  ) AS matching_clients
FROM interest_events ie
WHERE ie.event_date >= CURRENT_DATE
  AND ie.event_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY ie.event_date;

-- ═══════════════════════════════════════════════════════════════
-- VIEW: Enhanced recontact queue with event boost
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW recontact_queue_smart AS
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
  -- Event boost: upcoming event matching client interests
  (
    SELECT json_agg(json_build_object(
      'event_name', ie.event_name,
      'event_date', ie.event_date,
      'days_until', (ie.event_date - CURRENT_DATE)
    ))
    FROM interest_events ie
    JOIN client_interests ci ON ci.category = ie.category
      AND (ie.value IS NULL OR ci.value = ie.value)
    WHERE ci.client_id = c.id
      AND ie.event_date >= CURRENT_DATE
      AND ie.event_date <= CURRENT_DATE + ie.notify_days_before
  ) AS upcoming_events,
  -- Priority score: higher = more urgent
  (
    COALESCE(CURRENT_DATE - c.next_recontact_date, 0) * 10  -- overdue days
    + CASE c.tier
        WHEN 'grand_prix' THEN 60
        WHEN 'diplomatico' THEN 50
        WHEN 'idealiste' THEN 40
        WHEN 'kaizen' THEN 30
        WHEN 'optimisto' THEN 20
        WHEN 'rainbow' THEN 10
      END
    + COALESCE((
        SELECT COUNT(*) * 25
        FROM interest_events ie
        JOIN client_interests ci ON ci.category = ie.category
          AND (ie.value IS NULL OR ci.value = ie.value)
        WHERE ci.client_id = c.id
          AND ie.event_date >= CURRENT_DATE
          AND ie.event_date <= CURRENT_DATE + ie.notify_days_before
      ), 0)  -- event boost
  ) AS priority_score
FROM clients c
JOIN profiles p ON c.seller_id = p.id
WHERE c.next_recontact_date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY priority_score DESC;
