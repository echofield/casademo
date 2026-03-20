# Casa One Frontend Build Prompt

**Copy this entire file into a fresh Claude Code session or Cursor.**

---

## Mission

Build the frontend pages for Casa One — a boutique clienteling CRM for luxury retail sellers. The backend (Next.js API routes + Supabase) is complete. You need to create the UI pages.

---

## Project Location

```
C:\Users\echof\Desktop\02_PROJECTS\casa-one
```

## Start Dev Server

```bash
cd C:\Users\echof\Desktop\02_PROJECTS\casa-one
npm run dev
```

Server runs on http://localhost:3002 (or next available port)

## Test Login

- **Email:** `alice@casaone.fr`
- **Password:** `seller123`

---

## Pages to Build

### 1. `/queue` — Recontact Queue (MAIN PAGE)

The daily action list. Sellers start here every morning.

**Data source:** `recontact_queue_smart` view (or API: `GET /api/recontact-queue`)

**Display:**
- List of clients needing contact, sorted by `priority_score` DESC
- Each card shows:
  - Client name, tier badge (colored)
  - Days overdue (red if > 0)
  - Last contact date
  - Phone (click to call)
  - `upcoming_events` if any (highlighted — e.g., "Champions League in 5 days")
- Quick action: "Log Contact" button → opens modal

**Tier colors:**
- rainbow: `#9CA3AF` (gray)
- optimisto: `#10B981` (green)
- kaizen: `#3B82F6` (blue)
- idealiste: `#8B5CF6` (purple)
- diplomatico: `#F59E0B` (amber)
- grand_prix: `#EF4444` (red/gold)

### 2. `/clients` — Client List

Searchable list of all clients.

**Data source:** `GET /api/clients?search=X&tier=X`

**Features:**
- Search bar (searches name)
- Tier filter dropdown
- Click row → goes to `/clients/[id]`

### 3. `/clients/[id]` — Client 360

Full client profile.

**Data source:** `GET /api/clients/[id]` (returns client_360 view data)

**Sections:**
- Header: Name, tier badge, total spend
- Contact info: Phone, email
- Interests (tags)
- Contact history (timeline)
- Purchase history (table)
- Actions: "Log Contact", "Add Purchase", "Add Interest"

### 4. `/dashboard` — Supervisor Dashboard (supervisor role only)

**Data source:** `GET /api/dashboard`

**Metrics:**
- Clients by tier (bar chart or cards)
- Overdue recontacts per seller
- This week's revenue
- Upcoming events affecting clients

---

## UI Style Reference

Fork from: `C:\Users\echof\Desktop\02_PROJECTS\arche-paris-ref`

**Key patterns:**

```css
/* Colors */
--paper: #FAF8F2;      /* Background */
--ink: #1A1A1A;        /* Text */
--green: #003D2C;      /* Primary/Accent */
--gold: #B8860B;       /* Highlight */

/* Typography */
font-family: system-ui, -apple-system, sans-serif;
/* Headings: larger, elegant */
/* Labels: 11px uppercase, letter-spacing: 0.08em */

/* Buttons */
background: transparent;
border: none;
opacity: 0.5;
transition: opacity 0.3s;
/* hover: opacity 0.8 */
text-transform: uppercase;
letter-spacing: 0.08em;
```

**Mobile-first:** Drawer navigation on mobile, horizontal nav on desktop.

---

## Existing Files (DO NOT MODIFY unless needed)

- `src/lib/supabase/client.ts` — Browser Supabase client
- `src/lib/supabase/server.ts` — Server Supabase client
- `src/lib/types/index.ts` — TypeScript types
- `src/middleware.ts` — Auth middleware
- `src/app/api/*` — All API routes (complete)
- `src/app/login/page.tsx` — Login page (complete)

---

## API Endpoints Available

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients` | List clients (query: `search`, `tier`, `seller_id`) |
| POST | `/api/clients` | Create client |
| GET | `/api/clients/[id]` | Client 360 detail |
| PATCH | `/api/clients/[id]` | Update client |
| POST | `/api/clients/[id]/contacts` | Log interaction |
| POST | `/api/clients/[id]/purchases` | Log purchase |
| POST | `/api/clients/[id]/interests` | Add interest |
| DELETE | `/api/clients/[id]/interests/[iid]` | Remove interest |
| PATCH | `/api/clients/[id]/reassign` | Reassign to seller (supervisor) |
| GET | `/api/recontact-queue` | Recontact queue |
| GET | `/api/dashboard` | Supervisor metrics |
| POST | `/api/import` | CSV import |

---

## Data Model Summary

**Tiers** (by total_spend):
- rainbow: €0-999
- optimisto: €1,000-2,499
- kaizen: €2,500-9,999
- idealiste: €10,000-16,999
- diplomatico: €17,000-24,999
- grand_prix: €25,000+

**Recontact intervals** (days after last contact):
- grand_prix: 7 days
- diplomatico: 14 days
- idealiste: 21 days
- kaizen: 30 days
- optimisto: 45 days
- rainbow: 60 days

**Interest categories:** fashion, food, art, music, lifestyle, sport

---

## Database Views

- `recontact_queue` — Basic queue
- `recontact_queue_smart` — With priority_score and upcoming_events
- `client_360` — Full client with interests, contacts, purchases as JSON
- `upcoming_interest_events` — Events in next 30 days

---

## Quick Start Tasks

1. Create `/queue` page with recontact list
2. Create "Log Contact" modal (POST to `/api/clients/[id]/contacts`)
3. Create `/clients` list page
4. Create `/clients/[id]` detail page
5. Create `/dashboard` for supervisors
6. Add navigation component (shared layout)

---

## Notes

- RLS is enabled: sellers see only their clients, supervisors see all
- The home page (`/`) already redirects to `/queue`
- Framer Motion is NOT installed — use CSS transitions or install it if needed
- Tailwind CSS is configured and ready

---

## Go!

Start with `/queue` — it's the most important page. Sellers will use this every day.
