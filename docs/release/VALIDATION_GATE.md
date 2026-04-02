# Validation Gate

Use this gate before any push/deploy/migration.

## 1) Seller visibility boundaries
- Flow: Login as active non-supervisor seller, open seller client list and client detail pages.
- Expected: only seller-owned client scope visible.
- Failure signal: seller sees other sellers' clients.
- Impact: user-visible and blocking.

## 2) Supervisor visibility boundaries
- Flow: Login as active supervisor (Hasael acceptable as supervisor), open same pages.
- Expected: cross-seller visibility available by supervisor role.
- Failure signal: missing expected cross-seller records.
- Impact: user-visible and blocking.

## 3) `recontact_queue` / `client_360` / `notification_counts`
- Flow: open corresponding dashboard areas and compare expected counts.
- Expected: counts and scoped records remain coherent after hardening.
- Failure signal: empty, inflated, or cross-scope leakage counts.
- Impact: user-visible; blocking if leakage/wrong workflow.

## 4) `/api/notifications/generate` execution paths
- Manual path expected: supervisor auth required, user-session execution.
- Cron path expected: valid cron secret + service role env required.
- Failure signal: manual path unauthorized for supervisor OR cron path succeeds with missing/invalid env.
- Impact: mixed (user-visible for manual; silent operational risk for cron).

## 5) `send_notification` behavior after hardening
- Flow: trigger notify seller action from UI.
- Expected: notification is generated and visible in intended queue/list.
- Failure signal: silent failure or permission error.
- Impact: user-visible and blocking for daily ops.

## 6) Stale-session inactive-user blocking
- Flow: deactivate user in DB, keep session, attempt API/page access.
- Expected: access denied consistently.
- Failure signal: deactivated account still reads/writes.
- Impact: high severity, may be partially silent.

## 7) DSAR export
- Flow: supervisor calls `GET /api/clients/[id]/export`.
- Expected: structured JSON payload with core sections; audit row written.
- Failure signal: missing sections, wrong scope, missing audit write.
- Impact: user-visible for endpoint errors; silent if audit missing.

## 8) DSAR anonymization
- Flow: supervisor calls `POST /api/clients/[id]/dsar` twice.
- Expected: first call anonymizes fields; second call succeeds idempotently; audit rows written.
- Failure signal: partial anonymization, non-idempotent behavior, missing audit.
- Impact: user-visible and compliance-blocking.
