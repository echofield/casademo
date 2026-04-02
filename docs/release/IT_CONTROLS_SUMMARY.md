# IT Controls Summary (Current Local Hardened State)

This summary is intentionally concise and client-safe.

## Access control and identity
- Role-based access boundaries enforced for seller vs supervisor paths.
- Inactive users are blocked in both app-level auth checks and database-level policy conditions.
- MFA flow handling hardened in middleware path.

## Data protection and DSAR
- Structured client data stored in database tables (not hardcoded static config).
- DSAR export endpoint (JSON): `GET /api/clients/[id]/export` (supervisor-only).
- DSAR anonymization endpoint: `POST /api/clients/[id]/dsar` (supervisor-only, idempotent).
- DSAR actions logged in `public.dsar_audit_log` with actor, client, action, timestamp.

## Security hygiene
- PII logging removed from API paths reviewed in hardening batches.
- Scripted plaintext credentials and unsafe seed auth patterns sanitized.
- Security headers added in Next.js config.
- CI secret scanning workflow added.

## Operational note
- This is a technical-control baseline.
- Final GDPR posture also depends on customer governance artifacts (RoPA, DPA, retention policy, DSAR SOP, incident process).
