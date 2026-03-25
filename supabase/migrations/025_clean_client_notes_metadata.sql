-- ═══════════════════════════════════════════════════════════════
-- CASA ONE — Migration 025: Clean metadata tags from client notes
-- Removes legacy import/system tags from notes so notes stay seller-facing.
-- ═══════════════════════════════════════════════════════════════

UPDATE clients
SET notes = NULLIF(
  TRIM(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(COALESCE(notes, ''), '\s*\[import:[^\]]+\]\s*', ' ', 'gi'),
        '\s*\[ex:[^\]]+\]\s*',
        ' ',
        'gi'
      ),
      '\s*\[no-contact\]\s*',
      ' ',
      'gi'
    )
  ),
  ''
)
WHERE notes ~* '\[(import:[^]]+|ex:[^]]+|no-contact)\]';
