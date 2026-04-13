-- Add is_demo column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

-- Mark all existing clients as NOT demo (hidden in demo mode)
UPDATE clients SET is_demo = false WHERE is_demo IS NULL;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_clients_is_demo ON clients(is_demo);
