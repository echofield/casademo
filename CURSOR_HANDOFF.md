# Casa One — Cursor Handoff

## Project Location
```
C:\Users\echof\Desktop\02_PROJECTS\casa-one
```

## Start Dev
```bash
npm run dev
# → http://localhost:3002
```

## Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Supervisor | marie@casaone.fr | supervisor123 |
| Seller | alice@casaone.fr | seller123 |

---

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS 3.4.17
- **Database:** Supabase (Postgres + Auth + RLS)
- **Motion:** framer-motion (installed)
- **Fonts:** Cormorant Garamond (serif) + Inter (sans)

---

## Post-login information architecture

| Route | Purpose |
|-------|---------|
| `/` | **Home** — overview, stats, “Work the queue” CTA, sections by priority |
| `/queue` | **Focus queue** — one client at a time (`QueueStack` + `FocusedClientCard`) |
| `/clients` | **Portfolio** — search-first **card grid** only (`ClientGridCard`) |
| `/clients/[id]` | **Client 360** — hero, contacts, merged **Activity** timeline, sticky actions on mobile |
| `/dashboard` | **Supervisor** — headline insight + rhythm table + tier / overdue panels |

Nav: **Home**, **Queue**, **Clients**, **Dashboard** (supervisor). Logo → `/`.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout, fonts (bg-bg, text-text)
│   ├── loading.tsx             # Home skeleton (ScreenSkeleton)
│   ├── globals.css             # Tailwind + custom classes
│   ├── page.tsx                # Home overview (not a redirect to /queue)
│   ├── login/
│   │   └── page.tsx            # Intentionally unchanged vs post-login shell
│   ├── queue/
│   │   ├── loading.tsx
│   │   └── page.tsx            # Focus queue
│   ├── clients/
│   │   ├── loading.tsx
│   │   ├── page.tsx            # Card grid only
│   │   ├── AddClientButton.tsx
│   │   ├── AddClientModal.tsx
│   │   ├── ClientListFilters.tsx
│   │   └── [id]/
│   │       ├── loading.tsx
│   │       └── page.tsx        # Hero + timeline + sticky ClientActions
│   ├── dashboard/
│   │   ├── loading.tsx
│   │   └── page.tsx            # Narrative headline + panels
│   └── api/
│       ├── clients/
│       ├── notifications/      # GET/PATCH; expects `notifications` table
│       ├── recontact-queue/
│       ├── dashboard/
│       └── import/
│
├── components/
│   ├── index.ts
│   ├── AppShell.tsx            # bg-bg shell
│   ├── Nav.tsx                 # Home / Queue / Clients / Dashboard
│   ├── LoadingShell.tsx        # loading.tsx chrome
│   ├── ScreenSkeleton.tsx      # Variants: home, queue, clients, clientDetail, dashboard
│   ├── PageHeader.tsx
│   ├── StatCard.tsx
│   ├── TierBadge.tsx
│   ├── ClientGridCard.tsx      # Clients list card
│   ├── ClientRow.tsx           # Legacy (unused on clients page)
│   ├── FocusedClientCard.tsx
│   ├── QueueStack.tsx
│   ├── RecontactQueueSection.tsx
│   ├── RecontactQueueRow.tsx
│   ├── NotificationBell.tsx    # setup_required / fetch_error / empty states
│   └── Button.tsx
│
├── lib/
│   ├── types/
│   │   └── index.ts            # All TypeScript types
│   ├── auth/
│   │   └── index.ts            # Auth helpers (getCurrentUser, requireAuth)
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   └── server.ts           # Server Supabase client
│   └── motion.ts               # NEW - Motion tokens
│
└── middleware.ts               # Auth middleware (protects routes)
```

---

## Color System (tailwind.config.ts)

```
bg:           #F7F4EE    (warm beige - main background)
bg-soft:      #F2EEE7    (slightly darker)
surface:      #FCFAF6    (cards, elevated)

text:         #1C1B19    (primary text)
text-muted:   #6E685F    (secondary)

primary:      #003D2B    (deep green - buttons, accents)
gold:         #A48763    (premium tier highlight)
danger:       #C34747    (overdue, errors)
success:      #2F6B4F    (positive)
```

---

## Typography (globals.css)

| Class | Size | Weight | Use |
|-------|------|--------|-----|
| `.heading-1` | 2.5rem | serif | Page titles |
| `.heading-2` | 1.375rem | sans | Section headers |
| `.body` | 0.95rem | sans | Body text |
| `.body-small` | 0.8125rem | sans | Secondary text |
| `.label` | 0.68rem uppercase | sans | Labels, badges |
| `.metric` | 2rem | sans | Big numbers |

---

## Data Model

### Tiers (by total_spend)
| Tier | Spend Range | Recontact Days |
|------|-------------|----------------|
| rainbow | €0-999 | 60 |
| optimisto | €1,000-2,499 | 45 |
| kaizen | €2,500-9,999 | 30 |
| idealiste | €10,000-16,999 | 21 |
| diplomatico | €17,000-24,999 | 14 |
| grand_prix | €25,000+ | 7 |

### Key Tables
- `profiles` - User accounts (seller/supervisor)
- `clients` - Client records
- `contacts` - Contact history
- `purchases` - Purchase records
- `interests` - Client interests
- `notifications` - In-app alerts (RLS: own rows); triggers on `clients` / `purchases`; optional cron calls generator functions
- View `notification_counts` - Unread/total per user (from `005`)

### Views
- `recontact_queue` - Clients needing contact
- `client_360` - Full client with JSON arrays

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients` | List clients (query: search, tier) |
| POST | `/api/clients` | Create client |
| GET | `/api/clients/[id]` | Client 360 detail |
| PATCH | `/api/clients/[id]` | Update client |
| POST | `/api/clients/[id]/contacts` | Log interaction |
| POST | `/api/clients/[id]/purchases` | Log purchase |
| POST | `/api/clients/[id]/interests` | Add interest |
| GET | `/api/recontact-queue` | Recontact queue |
| GET | `/api/dashboard` | Supervisor metrics |
| GET | `/api/notifications` | User notifications (`setup_required` if table missing) |

---

## Current State

### ✅ Working
- Post-login shell aligned with design tokens (`bg-bg`, `surface`, `text` / `text-muted`)
- Home (`/`) overview + CTA to `/queue`
- Focus queue (`/queue`) with progress strip and refined card / CTAs
- Clients: responsive **card grid** only
- Client 360: hero, activity timeline (contacts + purchases), sticky action bar on small screens
- Supervisor dashboard: **headline insight** first, then mini stats and panels
- Route-level **`loading.tsx`** skeletons per main segment
- Notifications API + types aligned with `005_notifications.sql`; UI shows setup hint only if the table is missing

### ⚠️ Ops / data
- **005** — Core notifications schema, RLS, triggers, generator functions (deployed on your project).
- **006** — Optional hardening in repo: [`supabase/migrations/006_notifications_hardening.sql`](supabase/migrations/006_notifications_hardening.sql) adds indexes, a daily dedupe unique index for `client_overdue`, and restricts `EXECUTE` on `generate_overdue_notifications()` / `generate_seller_inactivity_alerts()` to **`service_role`** (call from cron/Edge with service key, not anon/authenticated). Run this in SQL editor if you have not applied equivalent changes yet.

---

## Design Philosophy

### Core Rule
> If user says "nice animation" → failed
> If user says nothing but keeps using → won

### Perception Stack
1. **Motion** - Damped springs (stiffness: 120, damping: 26)
2. **Hover** - Density shift only (background darken, no transforms)
3. **State** - Tonality not animation (overdue = red accent, premium = gold)
4. **Typography** - Micro-weight transitions (400 → 450 on focus)

### Page goals (implemented direction)
- **Home** — State of portfolio + single obvious next step (`/queue`)
- **Queue** — Exactly who is next and why; call / WhatsApp / full profile
- **Clients** — Scan and search without a dense table
- **Client 360** — Who, value, history, next actions
- **Dashboard** — Pressure and rhythm without BI clutter (lists / bars; no default charts)

---

## Files to Focus On

### Primary surfaces
```
src/app/page.tsx
src/app/queue/page.tsx
src/app/clients/page.tsx
src/app/clients/[id]/page.tsx
src/app/dashboard/page.tsx
src/components/Nav.tsx
src/components/AppShell.tsx
src/components/ScreenSkeleton.tsx
src/components/ClientGridCard.tsx
src/app/globals.css
tailwind.config.ts
```

### Motion System
```
src/lib/motion.ts             # Tokens (springs, easing)
```

---

## Deploy
- **Repo:** https://github.com/echofield/Casa-one.git
- **Vercel:** Auto-deploys on push to main
- **URL:** casa-one-ashen.vercel.app

---

## Quick Commands
```bash
# Dev
npm run dev

# Build (check for errors)
npm run build

# Push to deploy
git add . && git commit -m "message" && git push
```

---

## Supabase
- **URL:** https://tazcgpzlebnwrukxqvif.supabase.co
- **Keys:** In `.env.local`

---

## Follow-ups (optional)

- Apply [`006_notifications_hardening.sql`](supabase/migrations/006_notifications_hardening.sql) on production if indexes / generator `EXECUTE` lockdown are not there yet.
- `AddClientModal` / `ClientCard` / `Button` still mix legacy `ink` aliases in places; align when touching those flows.
- Recharts or extra charts on dashboard only if a specific insight reads better as a single chart than as a list.
