# Casa One — Technical Roadmap & Architecture

## Overview

Casa One is a luxury CRM for Casablanca retail teams. It enables sellers to manage client relationships, track purchases, and maintain recontact schedules. Supervisors oversee team performance and portfolio health.

---

## Current State (Demo Mode)

### What Works
- ✅ Authentication (Supabase Auth)
- ✅ Role-based access (seller vs supervisor)
- ✅ Client list with tier badges, search, filters
- ✅ Client detail pages with sizing, interests, purchases, contacts
- ✅ Recontact queue (overdue/due today/upcoming)
- ✅ Supervisor dashboard with team analytics
- ✅ Seller portfolio stats (own clients only)
- ✅ Notification bell (demo fallback)
- ✅ PWA installable on mobile

### What's Mock/Demo
- ⚠️ Notifications use frontend fallback (RLS issue with backend)
- ⚠️ Demo clients assigned via migration (not real auth user IDs)
- ⚠️ Progression chart uses hardcoded data

---

## Backend Architecture

### Database (Supabase PostgreSQL)

```
├── profiles          # User profiles (links to auth.users)
├── profiles_roles    # Role assignments (seller, supervisor)
├── clients           # Client records with tier, spend, dates
├── client_sizing     # Size preferences (Tops, Bottoms, Shoes, Outerwear)
├── client_interests  # Interest categories (Products, Collections, Styles, Colors)
├── purchases         # Purchase history with product descriptions
├── contacts          # Contact log (calls, visits, messages)
├── notifications     # System and manual notifications
└── recontact_queue   # VIEW: Computed queue with days_overdue
```

### Key Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `clients` | Core client data | `seller_id`, `tier`, `total_spend`, `next_recontact_date` |
| `purchases` | Transaction history | `amount`, `description`, `purchase_date`, `conversion_source` |
| `contacts` | Interaction log | `contact_type`, `contact_date`, `notes` |
| `notifications` | Alerts system | `user_id`, `type`, `title`, `message`, `read` |

### Row Level Security (RLS)

- **Sellers**: Can only see/edit their own clients
- **Supervisors**: Can see all clients, all sellers
- **Notifications**: `user_id = auth.uid()` — users see only their own

---

## File Structure

```
src/
├── app/
│   ├── page.tsx                    # Home (queue overview + seller stats)
│   ├── queue/page.tsx              # Full recontact queue
│   ├── clients/
│   │   ├── page.tsx                # Client list with filters
│   │   ├── [id]/page.tsx           # Client detail
│   │   ├── AddClientButton.tsx     # Add client trigger
│   │   └── AddClientModal.tsx      # Add client form (with interests)
│   ├── dashboard/page.tsx          # Supervisor dashboard
│   ├── team/page.tsx               # Team management
│   └── api/
│       ├── clients/                # Client CRUD
│       ├── notifications/          # Notification fetch/mark read
│       └── recontact-queue/        # Queue data
├── components/
│   ├── NotificationBell.tsx        # Bell with dropdown (has demo fallback)
│   ├── ClientGridCard.tsx          # Client card in grid
│   ├── FocusedClientCard.tsx       # Queue card with actions
│   ├── QueueStack.tsx              # Swipeable queue
│   ├── TierBadge.tsx               # Tier display
│   └── dashboard/                  # Dashboard components
│       ├── ProgressionChart.tsx    # Contact rate chart
│       ├── SellerActivityRadar.tsx # Radar chart
│       └── ...
├── lib/
│   ├── supabase/server.ts          # Supabase client (uses anon key + RLS)
│   ├── auth.ts                     # Auth helpers
│   └── types.ts                    # TypeScript types
└── supabase/
    └── migrations/                 # Database migrations
        ├── 001_initial_schema.sql
        ├── 005_notifications.sql
        ├── 010_demo_data.sql       # Demo seeding
        └── 012_fix_seller_assignments.sql
```

---

## What Needs Fixing (Production Ready)

### 1. Seller-Client Assignment
**Problem**: Demo clients are assigned to profile IDs that don't match actual authenticated users.

**Fix Required**:
```sql
-- Run in Supabase SQL Editor after real users sign up
-- Reassign clients to actual authenticated seller IDs by name match
UPDATE clients c
SET seller_id = (
  SELECT id FROM profiles
  WHERE full_name ILIKE '%' || 'Hasael' || '%'
  LIMIT 1
)
WHERE c.seller_id IN (SELECT id FROM profiles WHERE full_name = 'Hasael');
```

**Long-term**: When creating real clients, `seller_id` should come from `auth.uid()` for the logged-in seller, or selected by supervisor.

### 2. Notifications RLS
**Problem**: Notifications inserted via SQL don't appear because `auth.uid()` at runtime differs from inserted `user_id`.

**Options**:
1. Use service role key for API (bypasses RLS) — less secure
2. Insert notifications via authenticated API calls only
3. Add RLS policy for service role inserts

**Current Workaround**: Frontend shows demo notifications when backend returns empty.

### 3. Profile Active Status
**Problem**: Some profiles have `active = false`, causing UI to hide data.

**Fix**:
```sql
UPDATE profiles SET active = true WHERE full_name ILIKE '%Hasael%';
```

### 4. Progression Chart Data
**Problem**: Chart shows hardcoded data, not real metrics.

**Fix**: Create API endpoint that calculates monthly contact rates:
```typescript
// /api/dashboard/progression
// Return: [{ month: 'Jan', value: 42, target: 45 }, ...]
```

---

## Future Scope

### Phase 1: Data Integrity
- [ ] Migration to reassign all demo clients to real seller auth IDs
- [ ] Fix notification insertion to use authenticated context
- [ ] Add data validation on client creation

### Phase 2: Real-Time Features
- [ ] WebSocket for live notification updates
- [ ] Real-time queue updates when contacts logged
- [ ] Supervisor sees seller activity in real-time

### Phase 3: Analytics
- [ ] Real progression chart from contact history
- [ ] Conversion tracking (which contacts led to purchases)
- [ ] Seller performance rankings
- [ ] Export reports (PDF/CSV)

### Phase 4: Mobile Experience
- [ ] Push notifications (Firebase/OneSignal)
- [ ] Offline mode with sync
- [ ] Quick actions from lock screen

### Phase 5: Integrations
- [ ] WhatsApp message templates
- [ ] Calendar sync (Google/Outlook)
- [ ] POS integration for automatic purchase logging
- [ ] Email campaign triggers

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # For admin operations
```

---

## Running Locally

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Deploying

```bash
git push origin main
# Vercel auto-deploys from main branch
```

---

## Key Design Decisions

1. **Server Components**: Most pages are server-rendered for SEO and performance
2. **RLS over API checks**: Security at database level, not application
3. **Demo Mode Flag**: `is_demo = true` on clients allows easy demo/production split
4. **Tier Calculation**: Automatic via triggers when purchases added
5. **Recontact Queue**: Database VIEW computes `days_overdue` in real-time

---

## Contact

Project: Casa One CRM for Casablanca
Stack: Next.js 14, Supabase, Tailwind CSS, Recharts
Deployment: Vercel
