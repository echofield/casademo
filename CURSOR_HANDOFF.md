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

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout, fonts
│   ├── globals.css             # Tailwind + custom classes
│   ├── page.tsx                # Redirects to /queue
│   ├── login/
│   │   └── page.tsx            # ✅ DONE - Login page (beige bg, green text)
│   ├── queue/
│   │   └── page.tsx            # ⚠️ WIP - Recontact queue
│   ├── clients/
│   │   ├── page.tsx            # ⚠️ NEEDS REDESIGN - Client list
│   │   ├── AddClientButton.tsx
│   │   ├── AddClientModal.tsx
│   │   ├── ClientListFilters.tsx
│   │   └── [id]/
│   │       └── page.tsx        # ⚠️ NEEDS REDESIGN - Client detail
│   ├── dashboard/
│   │   └── page.tsx            # ⚠️ NEEDS REDESIGN - Supervisor dashboard
│   └── api/
│       ├── clients/            # CRUD for clients
│       ├── notifications/      # Notifications (table not created yet)
│       ├── recontact-queue/    # Queue data
│       ├── dashboard/          # Supervisor metrics
│       └── import/             # CSV import
│
├── components/
│   ├── index.ts                # Barrel exports
│   ├── AppShell.tsx            # Main layout wrapper
│   ├── Nav.tsx                 # Navigation bar
│   ├── PageHeader.tsx          # Page title component
│   ├── StatCard.tsx            # Dashboard KPI cards
│   ├── TierBadge.tsx           # Tier label styling
│   ├── ClientRow.tsx           # Table row (old design)
│   ├── FocusedClientCard.tsx   # NEW - Queue card component
│   ├── QueueStack.tsx          # NEW - Queue navigation
│   ├── NotificationBell.tsx    # Bell icon (broken - no table)
│   └── Button.tsx              # Button variants
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
- `notifications` - ⚠️ TABLE NOT CREATED - run migration

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
| GET | `/api/notifications` | User notifications (returns empty - no table) |

---

## Current State

### ✅ Working
- Authentication (login, logout, session)
- Role-based access (RLS)
- All API endpoints
- Login page (redesigned)

### ⚠️ Needs Design Work
- **Queue page** - Has new stack component but feels generic
- **Clients page** - Table layout, not card-based
- **Client detail** - Section-based, not story-based
- **Dashboard** - KPI boxes, not narrative

### ❌ Broken
- Notifications (table doesn't exist in Supabase)
  - Fix: Run `supabase/migrations/005_notifications.sql`

---

## Design Philosophy (NOT YET IMPLEMENTED)

### Core Rule
> If user says "nice animation" → failed
> If user says nothing but keeps using → won

### Perception Stack
1. **Motion** - Damped springs (stiffness: 120, damping: 26)
2. **Hover** - Density shift only (background darken, no transforms)
3. **State** - Tonality not animation (overdue = red accent, premium = gold)
4. **Typography** - Micro-weight transitions (400 → 450 on focus)

### Page Goals
- **Queue** - One client at a time, one action
- **Clients** - Search-first, card grid
- **Client Detail** - Hero card, timeline, sticky action bar
- **Dashboard** - One headline insight, drill-down on tap

---

## Files to Focus On

### For Visual Redesign
```
src/app/globals.css           # Typography, utilities
tailwind.config.ts            # Colors, spacing
src/components/*.tsx          # All components
src/app/queue/page.tsx        # Queue page
src/app/clients/page.tsx      # Clients page
src/app/clients/[id]/page.tsx # Client detail
src/app/dashboard/page.tsx    # Dashboard
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

## What Needs to Happen

1. **Stop** - Don't add more code until visual direction is clear
2. **Design** - Create exact visual specs (spacing, colors, typography)
3. **Implement** - Match specs precisely
4. **Test** - Verify on real data

The current implementation is functional but generic. It needs a visual transformation that creates "interaction credibility" not "interaction richness."
