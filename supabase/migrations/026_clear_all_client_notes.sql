-- ═══════════════════════════════════════════════════════════════
-- CASA ONE — Migration 026: Normalize empty client notes to NULL
-- Keeps real notes intact; only blank/whitespace notes become NULL.
-- ═══════════════════════════════════════════════════════════════

UPDATE clients
SET notes = NULL
WHERE notes IS NOT NULL
  AND BTRIM(notes) = '';
