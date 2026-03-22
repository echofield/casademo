-- Add attribution source to purchases
-- Tracks where the sale originated for analytics

-- Create enum type for source values
DO $$ BEGIN
  CREATE TYPE purchase_source AS ENUM (
    'casa_one',
    'walk_in',
    'instagram',
    'recommendation',
    'existing_client',
    'event',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add source column to purchases (required, default to casa_one for existing records)
ALTER TABLE purchases
ADD COLUMN IF NOT EXISTS source purchase_source NOT NULL DEFAULT 'casa_one';

-- Comment for documentation
COMMENT ON COLUMN purchases.source IS 'Attribution source: where did this sale originate?';
