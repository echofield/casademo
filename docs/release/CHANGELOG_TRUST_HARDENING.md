# Trust Hardening Changelog (Local Only)

## Batch 1
- Enforced inactive-user blocking in auth and SSR/API paths.
- Hardened middleware MFA behavior.
- Removed direct browser write path for seller notifications.

## Batch 2
- Added SQL hardening for active-user RLS enforcement.
- Tightened SECURITY DEFINER revoke/grant behavior and fail-closed assumptions.
- Hardened view access boundaries.
- Fixed `/api/notifications/generate` to remain compatible with hardened privileges:
  - authenticated supervisor manual path
  - service-role cron path with explicit env gating

## Batch 3
- Removed PII logging from API paths.
- Sanitized scripts containing plaintext credentials/unsafe seed auth patterns.
- Replaced isolated sensitive sample data with synthetic fixtures.
- Added minimal security headers.
- Added CI secret scanning workflow.

## Batch 4
- Verification and compliance-surface pass (no broad refactor).

## Batch 5
- Added supervisor-only DSAR export endpoint: `GET /api/clients/[id]/export`.
- Added supervisor-only DSAR anonymization endpoint: `POST /api/clients/[id]/dsar`.
- Added `dsar_audit_log` migration with RLS and supervisor insert/select policies.
- Added retention/deletion note documenting anonymization behavior.

## Current delivery state
- Local-only changes, no commit/push/deploy/remote migration.
- Typecheck/build/tests passing locally at time of packet generation.
