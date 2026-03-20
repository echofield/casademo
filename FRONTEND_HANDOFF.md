# Casa One Frontend Handoff

## Backend Status: COMPLETE

**Server:** `npm run dev` → http://localhost:3002

### Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Supervisor | marie@casaone.fr | supervisor123 |
| Seller | alice@casaone.fr | seller123 |

### API Endpoints (all protected, require auth)
- `GET /api/clients` — List clients
- `POST /api/clients` — Create client
- `GET /api/clients/[id]` — Client 360 (full detail with interests, contacts, purchases)
- `PATCH /api/clients/[id]` — Update client
- `POST /api/clients/[id]/contacts` — Log interaction
- `POST /api/clients/[id]/purchases` — Log purchase
- `POST /api/clients/[id]/interests` — Add interest
- `GET /api/recontact-queue` — Recontact queue (priority sorted)
- `GET /api/dashboard` — Supervisor metrics
- `POST /api/import` — CSV import

### Data Model
- **Tiers**: rainbow → optimisto → kaizen → idealiste → diplomatico → grand_prix
- **Recontact intervals**: 60/45/30/21/14/7 days based on tier
- **RLS**: Sellers see own clients, supervisors see all

---

## Frontend Requirements

### Pages Needed
1. **Recontact Queue** (`/queue`) — Daily action list, sorted by overdue + tier priority
2. **Client List** (`/clients`) — Searchable/filterable list with tier badges
3. **Client 360** (`/clients/[id]`) — Full profile, interests, contact history, purchases
4. **Dashboard** (`/dashboard`) — Supervisor metrics (clients by tier, overdue per seller)

### UI Reference
Fork styling from: `C:\Users\echof\Desktop\02_PROJECTS\arche-paris-ref`

Key patterns:
- Background: `#FAF8F2` (cream/paper)
- Primary: `#003D2C` (dark green)
- Typography: Serif for headings, sans-serif small caps for labels
- Animations: Framer Motion
- Mobile: Drawer navigation

### Existing Setup
- Next.js 14 App Router
- Tailwind CSS configured
- Supabase auth working
- Login page working at `/login`

### Key Files
- `src/lib/supabase/client.ts` — Browser client
- `src/lib/supabase/server.ts` — Server client
- `src/lib/types/index.ts` — All TypeScript types
- `src/middleware.ts` — Auth middleware

---

## Quick Start for Frontend Dev

```bash
cd C:\Users\echof\Desktop\02_PROJECTS\casa-one
npm run dev
# Open http://localhost:3002/login
# Login: alice@casaone.fr / seller123
```

### Supabase
- URL: https://tazcgpzlebnwrukxqvif.supabase.co
- Keys in `.env.local`

---

## Design Notes from arche-paris

```css
/* Colors */
--paper: #FAF8F2;
--ink: #1A1A1A;
--green: #003D2C;
--gold: #B8860B;

/* Typography */
--font-serif: /* elegant serif for titles */
--font-sans: /* clean sans for labels, 11px uppercase, letter-spacing: 0.08em */

/* Buttons */
background: transparent;
border: none;
opacity: 0.5 → 0.8 on hover;
text-transform: uppercase;
letter-spacing: 0.08em;
```
