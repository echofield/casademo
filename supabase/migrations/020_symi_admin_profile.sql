-- ═══════════════════════════════════════════════════════════════
-- CASA ONE — Migration 020: Create SYMI Admin Profile
-- Observer account for system monitoring (invisible to sellers)
-- ═══════════════════════════════════════════════════════════════

-- Create profile for SYMI admin if auth user exists but profile doesn't
INSERT INTO profiles (id, email, full_name, role, active)
SELECT id, email, 'SYMI Observer', 'supervisor', true
FROM auth.users
WHERE email = 'contact@symi.io'
ON CONFLICT (id) DO UPDATE SET
  role = 'supervisor',
  full_name = 'SYMI Observer',
  active = true;

-- ═══════════════════════════════════════════════════════════════
-- Done. SYMI admin profile created as invisible supervisor.
-- ═══════════════════════════════════════════════════════════════
