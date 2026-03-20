# Casablanca cleanup → Casa One backend

Source export from `casblanca/cleanup_output/` (client names, spend, sellers, tiers).

## One-time setup (Supabase)

1. **Create seller profiles** (14 names that appear in the CSV):

   ```bash
   npm run seed:casablanca-team
   ```

   Password for new accounts defaults to `casablanca-seller` — change in Supabase Auth after first login.

2. **Dry-run import** (validates CSV + seller coverage, no writes):

   ```bash
   npm run import:casablanca:dry
   ```

3. **Import clients** (use an empty DB or expect skips for existing email/phone):

   ```bash
   npm run import:casablanca
   ```

   The script prints **pre** stats (row counts, spend sum, tier distribution vs cleanup report) and **post** checks (tagged client count + sum `total_spend`).

## Files

| File | Purpose |
|------|---------|
| `clients_clean.csv` | Master client rows (from cleanup pipeline) |
| `cleanup_report.txt` | Row counts / tier distribution reference |

**Row count:** The bundled CSV has **1405** lines; one line is an empty junk row (no seller). The importer prepares **1404** clients; tier totals match `cleanup_report.txt` within that row.

## Alternate CSV path

Set `CASABLANCA_CSV` to an absolute path if the file lives outside this folder.

## Supervisor UI import

Supervisors can also upload the same CSV via **POST `/api/import`** (multipart `file`). Rows are normalized the same way (`#N/A` names, `tier`, `purchase_history` → purchase description).

Imported rows are tagged in `notes` with `[import:casablanca-cleanup]` for verification and optional cleanup.
