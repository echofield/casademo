# Casa One — Frontend Handoff

**Copy this entire file into a fresh Claude Code session.**

---

## Project Location

```
C:\Users\echof\Desktop\02_PROJECTS\casa-one
```

## What's Done

### Backend: COMPLETE
- Next.js 14 App Router + TypeScript
- Supabase (PostgreSQL + Auth + RLS)
- All API routes working
- Notifications system ready
- Deployed on Vercel

### Current Frontend: REFERENCE ONLY
The existing pages in `src/app/` work but need redesign. Use as reference for data flow, not UI.

---

## Start Dev Server

```bash
cd C:\Users\echof\Desktop\02_PROJECTS\casa-one
npm run dev
```

Server: http://localhost:3002

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Seller | alice@casaone.fr | seller123 |
| Supervisor | marie@casaone.fr | super123 |

---

## Core Concept

**Casa One** = Clienteling CRM for luxury retail sellers

**Daily Flow:**
1. Seller opens app → sees **Recontact Queue** (who to call today)
2. Seller contacts client → logs it → next recontact date auto-updates
3. Client buys something → seller logs purchase → tier auto-upgrades
4. Supervisor monitors seller activity via dashboard

---

## Data Model

### Tiers (by total_spend)
| Tier | Min Spend | Recontact Interval |
|------|-----------|-------------------|
| rainbow | €0 | 60 days |
| optimisto | €1,000 | 45 days |
| kaizen | €2,500 | 30 days |
| idealiste | €10,000 | 21 days |
| diplomatico | €17,000 | 14 days |
| grand_prix | €25,000 | 7 days |

### RLS (Row Level Security)
- **Sellers**: Only see their own clients
- **Supervisors**: See all clients + all seller activity

---

## API Endpoints

### Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients?search=X&tier=X` | List clients |
| POST | `/api/clients` | Create client |
| GET | `/api/clients/[id]` | Client 360 (full profile) |
| PATCH | `/api/clients/[id]` | Update client |

### Client Actions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/clients/[id]/contacts` | Log contact (channel, comment) |
| POST | `/api/clients/[id]/purchases` | Log purchase (amount, description) |
| POST | `/api/clients/[id]/interests` | Add interest |
| DELETE | `/api/clients/[id]/interests/[iid]` | Remove interest |

### Queue & Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recontact-queue` | Today's recontact list |
| GET | `/api/dashboard` | Supervisor metrics (supervisor only) |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | User's notifications |
| PATCH | `/api/notifications` | Mark as read |

---

## Key Files

### Backend (DO NOT MODIFY)
```
src/lib/supabase/client.ts    → Browser Supabase client
src/lib/supabase/server.ts    → Server Supabase client
src/lib/auth/index.ts         → Auth utilities
src/lib/types/index.ts        → TypeScript types
src/middleware.ts             → Auth middleware
src/app/api/*                 → All API routes
```

### Frontend Reference
```
src/app/page.tsx              → Home (queue)
src/app/clients/page.tsx      → Client list
src/app/clients/[id]/page.tsx → Client detail
src/app/dashboard/page.tsx    → Supervisor dashboard
src/app/login/page.tsx        → Login (working, keep as-is)
src/components/*              → UI components
```

### Styles
```
src/app/globals.css           → Tailwind + custom classes
tailwind.config.ts            → Theme colors
```

---

## Response Shapes

### GET /api/clients/[id] (Client 360)
```typescript
{
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  tier: 'rainbow' | 'optimisto' | 'kaizen' | 'idealiste' | 'diplomatico' | 'grand_prix'
  total_spend: number
  last_contact_date: string | null
  next_recontact_date: string | null
  seller_name: string
  interests: Array<{ id, category, value, detail }>
  contact_history: Array<{ id, date, channel, comment, seller }>
  purchase_history: Array<{ id, date, amount, description }>
}
```

### GET /api/recontact-queue
```typescript
Array<{
  id: string
  first_name: string
  last_name: string
  phone: string | null
  tier: string
  total_spend: number
  last_contact_date: string | null
  next_recontact_date: string | null
  days_overdue: number  // positive = overdue, 0 = due today, negative = upcoming
  seller_name: string
}>
```

### GET /api/notifications
```typescript
{
  notifications: Array<{
    id: string
    type: 'tier_upgrade' | 'big_purchase' | 'client_overdue' | 'seller_inactive'
    title: string
    message: string | null
    client_id: string | null
    read: boolean
    created_at: string
  }>
  unread_count: number
}
```

---

## Pages to Build

### 1. Queue (Main Page) — `/` or `/queue`
Daily action list. Sellers start here every morning.
- Show clients sorted by urgency (days_overdue DESC)
- Quick actions: call, WhatsApp, log contact
- Visual distinction for overdue vs due today vs upcoming

### 2. Clients — `/clients`
Searchable client list with filters.
- Search by name
- Filter by tier
- Add new client
- Click → client detail

### 3. Client Detail — `/clients/[id]`
Full client profile (360 view).
- Header: name, tier, total spend
- Contact info with quick actions
- Log Contact modal
- Log Purchase modal
- Contact history timeline
- Purchase history

### 4. Dashboard — `/dashboard` (Supervisor only)
Seller activity monitoring.
- Contacts per seller this week
- Overdue count per seller
- Status indicators (active/inactive/falling behind)
- Clients by tier

### 5. Notifications
Bell icon in nav with dropdown.
- Unread count badge
- Click to see list
- Mark as read

---

## Existing Components to Reuse or Replace

| Component | Location | Purpose |
|-----------|----------|---------|
| AppShell | `src/components/AppShell.tsx` | Page wrapper with nav |
| Nav | `src/components/Nav.tsx` | Navigation |
| TierBadge | `src/components/TierBadge.tsx` | Colored tier label |
| Button | `src/components/Button.tsx` | Styled button |
| NotificationBell | `src/components/NotificationBell.tsx` | Notification dropdown |

---

## Design Notes

Current theme in `tailwind.config.ts`:
```
paper: #FAF8F2     (background)
ink: #1A1A1A       (text)
green: #003D2C     (primary)
gold: #B8860B      (accent)
grey-light: #E5E5E5
grey-medium: #9CA3AF
```

Current style classes in `globals.css`:
- `.small-caps` — 11px uppercase labels
- `.narrator` — italic serif accent text
- `.btn-primary` — green button
- `.btn-secondary` — outlined button
- `.input-field` — form inputs
- `.card` — white bordered card

---

## Notes

1. **Login page works** — don't touch it unless redesigning
2. **RLS enforced at DB level** — API automatically filters by user
3. **Tier updates automatically** — just POST purchases, triggers handle the rest
4. **Recontact dates update automatically** — just POST contacts

---

## Quick Start

1. Run `npm run dev`
2. Login as alice@casaone.fr / seller123
3. Check `/api/recontact-queue` in browser to see data shape
4. Build new `/queue` page
5. Build new `/clients` page
6. Build new `/clients/[id]` page
7. Build new `/dashboard` page (login as supervisor to test)

---

**Ready to build. The backend is solid — focus on the UI/UX.**
