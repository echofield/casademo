-- ═══════════════════════════════════════════════════════════════
-- CASA ONE — Migration 022: Strip import tags from client notes
-- Removes [import:casablanca-cleanup] and any other [import:*]
-- tags that were left behind after data migration.
-- ═══════════════════════════════════════════════════════════════

-- Strip the exact known tag (with optional surrounding whitespace)
UPDATE clients
SET notes = NULLIF(TRIM(REPLACE(notes, '[import:casablanca-cleanup]', '')), '')
WHERE notes LIKE '%[import:casablanca-cleanup]%';
