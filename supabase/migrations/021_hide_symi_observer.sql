-- ═══════════════════════════════════════════════════════════════
-- CASA ONE — Migration 021: Hide SYMI Observer from directories
-- Keep observer access while removing profile list visibility.
-- ═══════════════════════════════════════════════════════════════

UPDATE profiles
SET active = false
WHERE email = 'contact@symi.io';

