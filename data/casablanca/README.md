# Casablanca Cleanup -> Casa One backend

This folder intentionally contains **sanitized fixture data only**.

## Data-handling rules

1. Do not commit real client exports to the repository.
2. Keep production CSV/report files outside git (for example in a local private path).
3. Set `CASABLANCA_CSV` to an absolute path when importing real data.

## One-time setup (Supabase)

1. Create seller profiles:

```bash
npm run seed:casablanca-team
```

Passwords are now read from env vars (`CASABLANCA_PASSWORD_*`) and are not stored in this repo.

2. Dry-run import (validates CSV + seller coverage, no writes):

```bash
npm run import:casablanca:dry
```

3. Import clients:

```bash
npm run import:casablanca
```

## Files in this folder

| File | Purpose |
|------|---------|
| `clients_clean.csv` | Synthetic fixture rows for local test import plumbing |
| `cleanup_report.txt` | Synthetic fixture summary |

## Supervisor UI import

Supervisors can upload a CSV via **POST `/api/import`** (multipart `file`).
Rows are normalized through the same import pipeline.
