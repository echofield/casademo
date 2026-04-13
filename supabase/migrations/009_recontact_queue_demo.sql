-- Add is_demo column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

-- Mark all existing clients as NOT demo (hidden in demo mode)
UPDATE clients SET is_demo = false WHERE is_demo IS NULL;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_clients_is_demo ON clients(is_demo);

-- Update recontact_queue view to include is_demo column
DROP VIEW IF EXISTS recontact_queue;

CREATE VIEW recontact_queue AS
SELECT
  c.id,
  c.first_name,
  c.last_name,
  c.email,
  c.phone,
  c.tier,
  c.total_spend,
  c.seller_id,
  p.full_name AS seller_name,
  c.last_contact_date,
  c.next_recontact_date,
  c.is_demo,
  CASE
    WHEN c.next_recontact_date IS NULL THEN 0
    ELSE (CURRENT_DATE - c.next_recontact_date)::int
  END AS days_overdue
FROM clients c
JOIN profiles p ON p.id = c.seller_id
WHERE c.next_recontact_date IS NOT NULL
ORDER BY days_overdue DESC;
