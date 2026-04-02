# Migration Runbook (Planned, Not Executed)

This runbook defines execution order for when release is approved.
No remote migration has been applied at packet creation time.

## Prechecks
1. Confirm branch and commit are frozen for release candidate.
2. Confirm Vercel target is staging (not production).
3. Confirm Supabase project reference points to staging.
4. Back up staging database snapshot.
5. Verify required env vars for notification generation and auth paths.

## Migration order
1. Apply existing hardening migration(s) in sequence.
2. Apply `supabase/migrations/031_dsar_audit_log.sql`.
3. Validate policy creation and grants.

## Post-migration SQL checks
1. Confirm `public.dsar_audit_log` exists.
2. Confirm RLS enabled on `public.dsar_audit_log`.
3. Confirm supervisor insert/select policies exist.
4. Confirm grants: `authenticated` select/insert and `service_role` operational access.

## Runtime checks after migration
1. Supervisor can export client via `/api/clients/[id]/export`.
2. Supervisor can anonymize client via `/api/clients/[id]/dsar`.
3. Non-supervisor receives 403 on both endpoints.
4. Audit row written for export and anonymize actions.

## Rollback strategy
- If migration fails before completion: rollback transaction and investigate.
- If endpoint behavior regresses after migration: stop rollout, revert deploy to last stable version, then restore DB backup if needed.
