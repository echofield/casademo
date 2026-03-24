-- ═══════════════════════════════════════════════════════════════
-- CASA ONE — Purchase Product Details + Derived Sizing
-- Adds structured product data to purchases table
-- Creates a view that derives known sizes from purchase history
-- ═══════════════════════════════════════════════════════════════

-- Add structured product columns
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS product_category TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS size_type TEXT;

COMMENT ON COLUMN purchases.product_name IS 'Structured product name (e.g., "Shearling Floral Embroidery Jacket")';
COMMENT ON COLUMN purchases.product_category IS 'Product type: jacket, trousers, shirt, shoes, accessories, knitwear, other';
COMMENT ON COLUMN purchases.size IS 'Size the client purchased in (e.g., "M", "48", "42")';
COMMENT ON COLUMN purchases.size_type IS 'Size system: letter (S/M/L/XL), number (40-56), shoe (38-47)';

CREATE INDEX IF NOT EXISTS idx_purchases_category ON purchases(product_category) WHERE product_category IS NOT NULL;

-- Derived sizing: latest size per product category, per client
CREATE OR REPLACE VIEW client_known_sizes AS
SELECT DISTINCT ON (p.client_id, p.product_category)
  p.client_id,
  p.product_category AS category,
  p.size,
  p.size_type,
  p.product_name AS last_product,
  p.purchase_date AS last_purchase_date
FROM purchases p
WHERE p.size IS NOT NULL AND p.product_category IS NOT NULL
ORDER BY p.client_id, p.product_category, p.purchase_date DESC;

-- ═══════════════════════════════════════════════════════════════
-- Backfill demo data from existing descriptions
-- Demo descriptions have format: "Product Name - Size"
-- ═══════════════════════════════════════════════════════════════

UPDATE purchases
SET
  product_name = CASE
    WHEN description LIKE '%-%' THEN TRIM(SPLIT_PART(description, ' - ', 1))
    ELSE description
  END,
  size = CASE
    WHEN description LIKE '%-%' THEN TRIM(SPLIT_PART(description, ' - ', 2))
    ELSE NULL
  END,
  size_type = CASE
    WHEN TRIM(SPLIT_PART(description, ' - ', 2)) IN ('S', 'M', 'L', 'XL', 'XXL') THEN 'letter'
    WHEN TRIM(SPLIT_PART(description, ' - ', 2)) ~ '^\d+$' THEN
      CASE
        WHEN TRIM(SPLIT_PART(description, ' - ', 2))::int BETWEEN 38 AND 47 THEN 'shoe'
        ELSE 'number'
      END
    ELSE NULL
  END,
  product_category = CASE
    WHEN description ILIKE '%jacket%' OR description ILIKE '%hoodie%' THEN 'jacket'
    WHEN description ILIKE '%shirt%' OR description ILIKE '%tee%' OR description ILIKE '%t-shirt%' THEN 'shirt'
    WHEN description ILIKE '%trouser%' OR description ILIKE '%pants%' OR description ILIKE '%shorts%' THEN 'trousers'
    WHEN description ILIKE '%sneaker%' OR description ILIKE '%loafer%' OR description ILIKE '%slide%' THEN 'shoes'
    WHEN description ILIKE '%scarf%' OR description ILIKE '%cap%' THEN 'accessories'
    WHEN description ILIKE '%knit%' OR description ILIKE '%crochet%' OR description ILIKE '%boucle%' THEN 'knitwear'
    WHEN description ILIKE '%track%' THEN 'jacket'
    ELSE 'other'
  END
WHERE description IS NOT NULL
  AND product_name IS NULL
  AND client_id IN (SELECT id FROM clients WHERE is_demo = true);
