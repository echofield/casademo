# DSAR Retention and Deletion Note

## Policy implemented in Batch 5

Casa One implements a DSAR anonymization path (not hard delete) for client records.

## What is removed/anonymized

When a supervisor runs DSAR anonymization via `POST /api/clients/:id/dsar`, the system anonymizes client core personal fields:

- `first_name` -> `Anonymized`
- `last_name` -> `Client`
- `email` -> `null`
- `phone` -> `null`
- `birthday` -> `null`
- `notes` -> `[DSAR_ANONYMIZED]`

The operation is idempotent: repeating the same request does not corrupt data.

## What is retained

Business and operational structure is retained for analytics and operational continuity:

- client record identity (`id`), seller assignment, tier, spend, dates
- contacts, purchases, interests, sizing, meetings/visits relations

## Auditability

Each DSAR action (`export`, `anonymize`) writes an audit event to `public.dsar_audit_log` with:

- action type
- supervisor actor id
- client id
- action timestamp

This provides traceability for compliance review and incident response.
