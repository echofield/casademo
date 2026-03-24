# CASA ONE — Production Upgrade Prompt for Claude Code

> **Run from**: `C:\Users\echof\Desktop\02_PROJECTS\casa-one`
> **Stack**: Next.js 14, Supabase (PostgreSQL + Auth), Tailwind CSS, Vercel
> **Repo**: https://github.com/echofield/Casa-one.git

---

## CONTEXT

Casa One is a luxury clienteling CRM for Casablanca Paris retail sellers. It's currently in demo mode with fake data and placeholder passwords. We are transitioning to **full production**:

- Real client data from `data/casablanca/clients_clean.csv` (1,405 clients)
- Real seller passwords (I will provide them — see SELLER_CREDENTIALS section)
- Google Authenticator 2FA enforced on every login
- Per-seller calendar with client meeting scheduling (100% Supabase, no external API)
- Flag any seller missing real email or phone to the supervisor (me)

The existing codebase already has: Supabase Auth, RLS, profiles/roles, a CSV import pipeline, a `/setup-mfa` page with TOTP enrollment, and full client CRUD.

**Architecture rule**: The calendar is hardcoded in Supabase. No Google Calendar API, no external sync. The CRM is the single source of truth. Sellers live inside the app on the boutique floor — they don't need events mirrored elsewhere.

---

## PHASE 1: REAL DATA & AUTH HARDENING

### 1.1 — Seller Credentials (replace placeholders)

Update `scripts/seed-casablanca-team.ts`. Replace all `password: 'casablanca-seller'` and `password: 'casablanca-supervisor'` with real credentials.

**SELLER_CREDENTIALS** — I will fill these in before running the script:

```typescript
const SUPERVISORS = [
  { email: 'REAL_EMAIL', full_name: 'Hasael Moussa', password: 'REAL_PASSWORD' },
  { email: 'REAL_EMAIL', full_name: 'Hicham EL Himar', password: 'REAL_PASSWORD' },
]

const CASABLANCA_TEAM = [
  { email: 'REAL_EMAIL', full_name: 'Elliott Nowack', password: 'REAL_PASSWORD' },
  { email: 'REAL_EMAIL', full_name: 'Hamza Said', password: 'REAL_PASSWORD' },
  { email: 'REAL_EMAIL', full_name: 'Helen Kidane', password: 'REAL_PASSWORD' },
  { email: 'REAL_EMAIL', full_name: 'Maxime Hudzevych', password: 'REAL_PASSWORD' },
  { email: 'REAL_EMAIL', full_name: 'Raphael Rivera', password: 'REAL_PASSWORD' },
  { email: 'REAL_EMAIL', full_name: 'Ryan Jackson', password: 'REAL_PASSWORD' },
  { email: 'REAL_EMAIL', full_name: 'Yassmine Moutaouakil', password: 'REAL_PASSWORD' },
]
```

**After I fill in real emails/passwords**, run:
```bash
npm run seed:casablanca-team
```

Then create a script `scripts/update-passwords.ts` that reads the same credential array and calls:
```typescript
await supabase.auth.admin.updateUserById(userId, { password: realPassword })
```
This handles cases where users already exist from demo seeding but need the real password.

Add to package.json: `"update:passwords": "npx tsx scripts/update-passwords.ts"`

### 1.2 — Import Real Client Data

The import pipeline already exists. After seeding team, run:
```bash
npm run import:casablanca:dry   # verify first
npm run import:casablanca       # then import
```

Before import, add a pre-import cleanup step: delete all rows in `clients` where `is_demo = true` or where `notes ILIKE '%demo%'`. Also cascade-delete related `purchases`, `contacts`, `client_interests`, `client_sizing` rows for demo clients.

Create `scripts/clean-demo-data.ts` and add to package.json: `"clean:demo": "npx tsx scripts/clean-demo-data.ts"`

### 1.3 — Contact Data Validation & Flagging

Create `scripts/validate-seller-contacts.ts` that:
1. Queries all profiles where `role = 'seller'`
2. Checks each profile has a **real email** (not `@casaone.fr` placeholder) and a **phone number**
3. For any seller missing real email or phone:
   - Inserts a notification into the `notifications` table addressed to all supervisors
   - Notification type: `'system'`, title: `'Données vendeur incomplètes'`
   - Message: `'{seller_name} n'a pas de {email|téléphone} renseigné'`
4. Prints a summary report to console

Add columns to `profiles` if not present (new migration `013_profile_contact_fields.sql`):
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personal_email TEXT;
```

Add to package.json: `"validate:contacts": "npx tsx scripts/validate-seller-contacts.ts"`

---

## PHASE 2: GOOGLE AUTHENTICATOR 2FA (TOTP) — ENFORCED

### Current state
- `/setup-mfa` page exists with QR code enrollment + 6-digit verification
- Login page (`/login`) does email+password only, no MFA challenge step
- No enforcement — users can skip MFA entirely

### What to build

#### 2.1 — Login Flow with MFA Challenge

Modify `/login/page.tsx` to be a **two-step flow**:

**Step 1**: Email + Password → `signInWithPassword()`
**Step 2**: If user has TOTP enrolled → show 6-digit code input, call `mfa.challenge()` + `mfa.verify()`

```typescript
// After successful password sign-in:
const { data: factors } = await supabase.auth.mfa.listFactors()
const totpFactor = factors?.totp?.find(f => f.status === 'verified')

if (totpFactor) {
  // Show TOTP input step (don't redirect yet)
  setMfaStep(true)
  setFactorId(totpFactor.id)
} else {
  // No MFA enrolled → redirect to /setup-mfa (forced enrollment)
  window.location.replace('/setup-mfa')
}
```

The login page should have two visual states:
- **State 1**: Email + password form (current design, unchanged)
- **State 2**: 6-digit TOTP input with "Code Google Authenticator" label, a back arrow to return to step 1

Keep the exact same design language: `bg-[#F7F4EE]`, `text-[#003D2B]`, serif headings, underline inputs.

#### 2.2 — Enforce MFA in Middleware

Update `src/middleware.ts`:
- After getting the user session, check MFA assurance level
- If user is authenticated but AAL is `aal1` (password only, no MFA verified this session):
  - Check if they have a verified TOTP factor → redirect to `/verify-mfa`
  - If no factor enrolled → redirect to `/setup-mfa`
- Exempt paths: `/login`, `/setup-mfa`, `/verify-mfa`, `/auth/callback`, `/api/auth/*`

```typescript
const { data: { user } } = await supabase.auth.getUser()
if (user) {
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2') {
    // Has MFA enrolled but hasn't verified this session
    if (!request.nextUrl.pathname.startsWith('/verify-mfa') &&
        !request.nextUrl.pathname.startsWith('/setup-mfa') &&
        !request.nextUrl.pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/verify-mfa', request.url))
    }
  }
}
```

#### 2.3 — Create `/verify-mfa` Page

New page `src/app/verify-mfa/page.tsx`:
- Shows only the 6-digit input (no QR code — user already enrolled)
- Same design language as `/setup-mfa` but simpler
- Header: "Vérification" / subtitle: "Entrez le code Google Authenticator"
- On success → `window.location.replace('/')`
- "Déconnexion" link at bottom that signs out and redirects to `/login`

---

## PHASE 3: SELLER CALENDAR & CLIENT MEETINGS

### 3.1 — Database Schema

Create migration `supabase/migrations/014_calendar_meetings.sql`:

```sql
-- Meeting format: where and how the rendez-vous happens
-- This is the core distinction for retail sellers
CREATE TYPE meeting_format AS ENUM (
  'boutique',      -- Physical, in-store at Casablanca (DEFAULT — 80%+ of all RDVs)
  'external',      -- Physical, outside the boutique (client's office, hotel, event)
  'call',          -- Phone call
  'video',         -- Video call (Zoom, FaceTime, WhatsApp video)
  'whatsapp'       -- WhatsApp text/voice message exchange (not a "meeting" but a touchpoint)
);

-- Meeting status
CREATE TYPE meeting_status AS ENUM (
  'scheduled',     -- Future, confirmed
  'completed',     -- Took place
  'cancelled',     -- Cancelled (by seller or client)
  'no_show'        -- Client didn't show up
);

-- Meetings / appointments table
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

  -- What
  title TEXT NOT NULL,
  description TEXT,

  -- Where & How (the key retail distinction)
  format meeting_format NOT NULL DEFAULT 'boutique',
  location TEXT,  -- Auto-filled for 'boutique', free text for 'external'

  -- When
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,

  -- Status & Outcome
  status meeting_status NOT NULL DEFAULT 'scheduled',
  outcome_notes TEXT,        -- What happened? What did client try on? Purchase?
  outcome_purchased BOOLEAN DEFAULT FALSE,  -- Quick flag: did this RDV convert?

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Indexes
CREATE INDEX idx_meetings_seller ON meetings(seller_id);
CREATE INDEX idx_meetings_client ON meetings(client_id);
CREATE INDEX idx_meetings_start ON meetings(start_time);
CREATE INDEX idx_meetings_status ON meetings(status) WHERE status = 'scheduled';

-- RLS: sellers see own, supervisors see all
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sellers_own_meetings" ON meetings
  FOR ALL USING (
    seller_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

-- Updated_at trigger (reuse existing function)
CREATE TRIGGER meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Default boutique location constant (used in app code, not DB)
-- "Casablanca Paris — 271 Rue du Faubourg Saint-Honoré"
```

### 3.2 — Meeting API Routes

Create `src/app/api/meetings/route.ts`:

**GET** — List meetings for authenticated seller (or all for supervisor)
- Query params: `start` (ISO), `end` (ISO), `seller_id` (supervisor only), `client_id`
- Joins: client `first_name + last_name`, seller `full_name`
- Default range: current week (Monday 00:00 → Sunday 23:59, Europe/Paris)
- Returns: `{ data: Meeting[], count: number }`

**POST** — Create meeting
- Body: `{ client_id?, title, description?, format, start_time, end_time, location? }`
- `seller_id` = `auth.uid()` automatically (supervisor can set `seller_id` to assign)
- If `format === 'boutique'` and no location → auto-fill `"Casablanca Paris — Faubourg Saint-Honoré"`
- If `format === 'external'` → `location` is required (return 400 if missing)
- Returns created meeting with joined client/seller names

Create `src/app/api/meetings/[id]/route.ts`:

**GET** — Single meeting with full detail
**PATCH** — Update meeting (status, time, notes, outcome)
  - When status changes to `'completed'`, prompt for `outcome_notes` in the UI
  - When `outcome_purchased = true`, optionally link to a new purchase creation
**DELETE** — Soft delete: set `status = 'cancelled'`, never hard delete

### 3.3 — Calendar Page: `src/app/calendar/page.tsx`

Server component that fetches current week's meetings.

**Layout — Mobile First** (sellers are on the floor with phones):

**Default view: Agenda (list)** — This is the primary view on mobile.
- Today's meetings at the top, visually prominent
- Tomorrow and rest of week below
- Each meeting card shows:
  - Time range (e.g., "14:00 – 14:45")
  - Format badge: pill with icon + label
    - 🏪 `En boutique` (green bg)
    - 📍 `Extérieur` (blue bg) + location text
    - 📞 `Appel` (orange bg)
    - 📹 `Vidéo` (purple bg)
    - 💬 `WhatsApp` (teal bg)
  - Client name (tappable → client detail page), or "Sans client" if no client linked
  - Status dot: green = scheduled, grey = completed, red = cancelled, amber = no show
- Quick action: tap a scheduled meeting → bottom sheet with "Marquer terminé" / "Client absent" / "Annuler" / "Modifier"

**Week view** (toggle, better on tablet/desktop):
- 7-column grid (Lun–Dim), time slots 08:00–20:00
- Meetings as colored blocks (color = format)
- Current time indicator (red line)

**Navigation**:
- `< Sem. précédente` | `Aujourd'hui` | `Sem. suivante >`
- Toggle: "Agenda" | "Semaine"

### 3.4 — Add Meeting Modal: `src/app/calendar/AddMeetingModal.tsx`

Triggered by a floating "+" button (bottom right, fixed, `bg-[#003D2B]` circle).

**Fields in order**:

1. **Format** (most important — shown first as segmented pills):
   - `En boutique` (default, pre-selected)
   - `Extérieur`
   - `Appel`
   - `Vidéo`
   - `WhatsApp`

2. **Client** (optional): searchable dropdown from seller's client list
   - Type-ahead: searches by first_name, last_name, email
   - Shows tier badge next to each result
   - "Sans client" option always visible at top

3. **Titre**: text input
   - Auto-filled when client selected: `"RDV — {first_name} {last_name}"`
   - Auto-filled when no client: `"RDV boutique"` / `"Appel"` / etc. based on format
   - Editable

4. **Date**: date picker (defaults to today)

5. **Heure début**: time picker (defaults to next round 30min slot)

6. **Durée**: segmented quick-select: `15min` | `30min` (default) | `45min` | `1h` | `Personnalisé`
   - End time auto-computed from start + duration

7. **Lieu** (conditional):
   - If format = `boutique` → pre-filled "Casablanca — Faubourg Saint-Honoré", greyed out, not editable
   - If format = `external` → free text input, **required**, placeholder "Adresse du rendez-vous"
   - If format = `call`/`video`/`whatsapp` → hidden

8. **Notes** (optional): textarea, placeholder "Notes pour ce rendez-vous..."

**Submit button**: "Créer le rendez-vous"

**Design**: Full-screen modal on mobile (slide up from bottom). Same Casa One aesthetic.

### 3.5 — Meeting Completion Flow

When a seller taps "Marquer terminé" on a meeting:

Show a **completion sheet** with:
1. **Le client a-t-il acheté ?** → Toggle (Oui/Non)
2. **Notes** → textarea ("Qu'est-ce qui s'est passé ? Produits essayés ?")
3. **"Valider"** button

This writes:
- `status = 'completed'`
- `outcome_purchased = true/false`
- `outcome_notes = "..."`

If `outcome_purchased = true`, show a toast: "Ajouter l'achat au profil client ?" with a link to the client's purchase log.

### 3.6 — Client Detail Integration

On `src/app/clients/[id]/page.tsx`, add a section **"Rendez-vous"** between contacts and purchases:

- **Prochain RDV**: Next scheduled meeting (if any), with format badge and date
- **Historique**: Last 5 meetings with this client, showing date + format + status + outcome
- **"Planifier un RDV"** button → opens AddMeetingModal with `client_id` pre-filled

### 3.7 — Supervisor Calendar View

On the supervisor dashboard or a separate `/calendar?view=team` route:
- Show all sellers' meetings for the week in a grouped view
- Group by seller name
- Color-code by format
- Useful metric at top: "X rendez-vous cette semaine · Y en boutique · Z en attente"
- This helps supervisors see who's busy and who needs coaching

### 3.8 — Home Page Integration

On the home page (`src/app/page.tsx`), add below the recontact queue:

**"Aujourd'hui"** section:
- List of today's meetings (compact cards)
- "Aucun rendez-vous aujourd'hui" empty state
- Quick-add button

---

## EXECUTION ORDER

```
1. Update seed script with real credentials placeholder structure
2. Create migrations: 013_profile_contact_fields, 014_calendar_meetings
3. Create scripts: clean-demo-data, update-passwords, validate-seller-contacts
4. Update package.json with all new scripts
5. Implement 2FA enforcement:
   a. Modify /login for two-step flow
   b. Create /verify-mfa page
   c. Update middleware for AAL2 enforcement
6. Build meetings API (CRUD routes)
7. Build calendar UI:
   a. Calendar page with agenda + week views
   b. AddMeetingModal
   c. Meeting completion flow
   d. Client detail integration
   e. Home page "today" section
   f. Supervisor team view
8. Test full flow: login → 2FA → home → calendar → create meeting → complete meeting
```

---

## DESIGN RULES

- **Colors**: `bg-[#F7F4EE]` (cream), `text-[#003D2B]` (forest green), accents at various opacities
- **Typography**: serif for headings (`font-serif`), sans for body
- **Inputs**: borderless with bottom underline, `border-b border-[#003D2B]/20`
- **Buttons**: solid `bg-[#003D2B]` with tracking, uppercase small text
- **Cards**: white bg, minimal shadow, no border-radius (or very slight)
- **Badges (format)**: small rounded pills with icon + label, color per format
- **Mobile-first**: everything must work on iPhone (sellers use phones in-store on the floor)
- **Language**: French for all UI text
- **Empty states**: always a message + CTA, never a blank screen

### Format Badge Colors
```
boutique  → bg-[#003D2B]/10 text-[#003D2B]   (green, home turf)
external  → bg-blue-50 text-blue-700
call      → bg-orange-50 text-orange-700
video     → bg-purple-50 text-purple-700
whatsapp  → bg-teal-50 text-teal-700
```

---

## FILES TO CREATE

```
scripts/update-passwords.ts
scripts/clean-demo-data.ts
scripts/validate-seller-contacts.ts
supabase/migrations/013_profile_contact_fields.sql
supabase/migrations/014_calendar_meetings.sql
src/app/verify-mfa/page.tsx
src/app/calendar/page.tsx
src/app/calendar/AddMeetingModal.tsx
src/app/calendar/MeetingCard.tsx
src/app/calendar/AgendaView.tsx
src/app/calendar/WeekView.tsx
src/app/calendar/CalendarNav.tsx
src/app/calendar/MeetingCompletionSheet.tsx
src/app/calendar/FormatBadge.tsx
src/app/api/meetings/route.ts
src/app/api/meetings/[id]/route.ts
src/lib/types/meetings.ts
```

## FILES TO MODIFY

```
scripts/seed-casablanca-team.ts       → real credential placeholders
src/app/login/page.tsx                → two-step MFA flow
src/middleware.ts                      → enforce AAL2
src/app/page.tsx                       → add "Aujourd'hui" meetings section
src/app/clients/[id]/page.tsx          → add "Rendez-vous" section
src/components/BottomNav.tsx (or nav)  → add Calendrier link
src/app/dashboard/page.tsx             → supervisor meeting overview
src/lib/types/index.ts                 → export meeting types
src/lib/types/database.ts             → meetings table types
package.json                           → new scripts
```

## NO NEW DEPENDENCIES

Everything is built with the existing stack: Next.js, Supabase, Tailwind, Lucide icons, Framer Motion.
Zero external API. Zero new npm packages.
