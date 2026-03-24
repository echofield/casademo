# CASA ONE — Addendum: Interest Filtering & Seller Signal

> **Append this to CLAUDE_CODE_PROMPT.md or feed it as a follow-up prompt.**
> **These two features integrate into the existing Phase 3 execution.**

---

## FEATURE A: CLICKABLE INTERESTS — "Show me everyone who likes X"

### Current State
- `client_interests` table exists with `client_id`, `category`, `value`, `detail`
- `interest_taxonomy` defines categories: fashion, food, art, music, lifestyle with sub-values
- Client detail page shows interest tags as plain text: `"fashion: sneakers"`
- Client list has a dropdown filter by `category` only (not `value`)
- The CSV `interests` column contains raw labels like "RTW"

### What to Build

#### A.1 — Make Interest Tags Clickable Everywhere

Create a reusable component `src/components/InterestTag.tsx`:

```typescript
interface InterestTagProps {
  category: string
  value: string
  detail?: string | null
  clickable?: boolean  // default true
  size?: 'sm' | 'md'
}
```

- Renders as a small pill/chip: `{category}: {value}`
- Color-coded by category:
  ```
  fashion   → bg-[#003D2B]/8 text-[#003D2B]
  food      → bg-amber-50 text-amber-700
  art       → bg-purple-50 text-purple-700
  music     → bg-rose-50 text-rose-700
  lifestyle → bg-sky-50 text-sky-700
  ```
- When `clickable = true` (default): renders as a `<Link>` to `/clients?interest={value}`
- Hover state: slightly deeper bg, cursor pointer
- Tap on mobile → navigates to filtered client list

**Use this component in**:
1. **Client detail page** (`/clients/[id]`) — replace current plain text interest list
2. **Client grid card** (`ClientGridCard.tsx`) — show top 2-3 interest tags below the spend row
3. **Recontact queue cards** (`FocusedClientCard.tsx`) — show interest tags if present

#### A.2 — Upgrade Client List Filter to Value-Level

Currently the interest dropdown filters by `category`. Upgrade to filter by **specific value**:

On `src/app/clients/page.tsx`:
- Change the interest filter query param from `interest` (category) to two levels:
  - `interest_cat` → category filter (fashion, food, art, music, lifestyle)
  - `interest_val` → specific value filter (sneakers, ready_to_wear, etc.)
- When a user clicks an InterestTag anywhere in the app, it navigates to `/clients?interest_val={value}`
- The filter UI should show both levels: a category dropdown that narrows the value dropdown

On `ClientListFilters.tsx`:
- Replace the single interest dropdown with a grouped dropdown using `<optgroup>`:
  ```
  All interests
  ── Fashion ──
    Sneakers
    Ready to Wear
    Silk Shirts
    ...
  ── Food ──
    Japanese
    Italian
    ...
  ```
- When navigated to via `?interest_val=sneakers`, auto-select the matching value

#### A.3 — Interest Count on Tags

When displaying an interest tag on the client detail page, optionally show a count:
- After the label, show `(12)` — the number of other clients with this same interest
- This helps the seller realize "12 of my clients like sneakers — I should alert them all when we get a new drop"

Fetch this count once on the client detail page:
```sql
SELECT value, COUNT(DISTINCT client_id) as client_count
FROM client_interests
WHERE client_id IN (SELECT id FROM clients WHERE seller_id = {auth.uid()})
GROUP BY value
```

#### A.4 — Interest Explorer Page (optional, stretch)

New page `src/app/interests/page.tsx`:
- Shows all interest categories as sections
- Under each category, shows values as tags with client counts
- Clicking any tag → `/clients?interest_val={value}`
- Useful for: "I want to see all my clients who are into watches" in one tap
- Link in nav: "Intérêts" (or accessible from client list page as a sidebar/panel)

---

## FEATURE B: CLIENT SIGNAL — Seller's Read on Purchase Intent

### Naming System: Signal Language

We use **signal language** — borrowed from intelligence/radar. The metaphor is: how strong is the signal from this client? The visual is a **diamond glyph** (losange) in five geometric states. No emoji anywhere.

### The Five Levels

| Enum Value | Label | Glyph | Color | Description |
|------------|-------|-------|-------|-------------|
| `very_hot` | **Locked** | ◆ filled diamond + radiating lines | Red `#A32D2D` on `#FCEBEB` | Decision made. Conversion imminent. |
| `hot` | **Strong** | ◆ filled diamond | Coral `#993C1D` on `#FAECE7` | Clear interest. Active engagement. |
| `warm` | **Open** | ◇◆ half-filled diamond | Amber `#854F0B` on `#FAEEDA` | Receptive but not committed. |
| `cold` | **Low** | ◇ empty diamond outline | Blue `#185FA5` on `#E6F1FB` | Minimal engagement. |
| `lost` | **Off** | ◇̸ dashed diamond + diagonal strike | Gray `#5F5E5A` on neutral bg | Off the radar. No response. |
| `null` | **—** | ○ dotted circle outline | Muted, dashed border | Not assessed yet. Tap to evaluate. |

### Current State
- `heat_score` is an auto-calculated 0-100 integer on the `clients` table
- Triggers recalculate it on every contact/purchase/visit
- `HeatIndicator` component displays it as a bar + label
- **Problem**: sellers can't set it. It's a black box. The seller's gut read is different from a formula.

### Design Philosophy

The auto `heat_score` measures **activity** (when did the client last come in, how much did they spend).
The seller signal measures **intent** (is this client about to buy? are they engaged? or are they gone?).

These are two different signals. Keep both. Signal is primary (seller's read), heat_score is secondary (system metric).

### What to Build

#### B.1 — Database: Add Client Signal

New migration `supabase/migrations/015_client_signal.sql`:

```sql
-- Seller's manual signal assessment of client purchase intent
-- Uses "signal language": Locked > Strong > Open > Low > Off
CREATE TYPE client_signal AS ENUM (
  'very_hot',    -- ◆✦ Locked — Decision made, conversion imminent
  'hot',         -- ◆  Strong — Clear interest, active engagement
  'warm',        -- ◇◆ Open   — Receptive but not committed
  'cold',        -- ◇  Low    — Minimal engagement
  'lost'         -- ◇̸  Off    — Signal lost, no response
);

ALTER TABLE clients ADD COLUMN IF NOT EXISTS seller_signal client_signal;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS signal_note TEXT;          -- Why this signal level?
ALTER TABLE clients ADD COLUMN IF NOT EXISTS signal_updated_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS signal_updated_by UUID REFERENCES profiles(id);

-- Index for filtering by signal
CREATE INDEX IF NOT EXISTS idx_clients_signal ON clients(seller_signal) WHERE seller_signal IS NOT NULL;

COMMENT ON COLUMN clients.seller_signal IS 'Seller manual assessment: Locked/Strong/Open/Low/Off';
COMMENT ON COLUMN clients.signal_note IS 'Short note explaining signal (e.g., "Tried 3 jackets, coming back Friday")';
```

**Default**: `NULL` (not assessed yet). Null = "seller hasn't rated this client yet", which is different from "Low".

#### B.2 — Diamond Glyph Component

Create `src/components/SignalDiamond.tsx`:

A pure SVG inline component that renders the diamond glyph at the correct state. No emoji. Pure geometry.

```typescript
interface SignalDiamondProps {
  signal: ClientSignal | null
  size?: number  // default 14 (px)
}
```

**Glyph rendering by state**:

- **`very_hot` (Locked)**: Filled diamond `<polygon>` + 4 cardinal lines + 4 diagonal lines radiating out. Fill: `#A32D2D`. Lines: same color, 1px stroke, 3px length each.
- **`hot` (Strong)**: Filled diamond only. Fill: `#993C1D`. No rays.
- **`warm` (Open)**: Diamond outline `stroke="#854F0B"` + bottom half filled via `<clipPath>`. Visually reads as "half-committed."
- **`cold` (Low)**: Empty diamond outline only. Stroke: `#185FA5`, 1.5px. No fill.
- **`lost` (Off)**: Dashed diamond outline `stroke-dasharray="2 2"` + diagonal strike line through center. Stroke: `#5F5E5A`.
- **`null`**: Small dotted circle. Stroke: muted, dashed. Invites tap.

#### B.3 — Signal Badge Component

Create `src/components/SignalBadge.tsx`:

```typescript
interface SignalBadgeProps {
  signal: ClientSignal | null
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean  // default true
  onClick?: () => void  // When clickable (to edit)
}
```

Renders as a pill: `[◆ Strong]` — diamond glyph + label text inside a colored pill.

**Badge styles**:
```
very_hot → bg-red-50 text-red-800 border-red-200       label: "Locked"
hot      → bg-orange-50 text-orange-800 border-orange-200   label: "Strong"
warm     → bg-amber-50 text-amber-800 border-amber-200    label: "Open"
cold     → bg-blue-50 text-blue-800 border-blue-200      label: "Low"
lost     → bg-transparent text-gray-500 border-dashed border-gray-300  label: "Off"
null     → bg-transparent text-[#003D2B]/40 border-dashed border-[#003D2B]/20  label: "Evaluate"
```

When `null`, the badge reads "Evaluate" with a dotted border — inviting the seller to tap and set it.

When `onClick` is provided, show a subtle hover state (slightly deeper bg) and `cursor-pointer`.

#### B.4 — Signal Setter UI

When the seller taps the SignalBadge (or an "Evaluate" button), show a **bottom sheet / popover**:

**Title**: "Client signal"
**Subtitle**: "{client first_name} {client last_name}"

**5 options as tappable rows** (radio-style, one selected at a time):

```
◆✦  Locked     "Decision made. Coming back to buy."
◆   Strong     "Clear interest. Tried pieces on."
◇◆  Open       "Receptive. Browsing. Not committed."
◇   Low        "Minimal engagement. Just looking."
◇̸   Off        "No response. Unreachable."
```

Each row shows: the diamond glyph (SVG), the label, and a short description in muted text. The currently selected row has a filled radio indicator.

Below the options:
- **Note** (optional): small textarea, placeholder "Why this signal? (e.g., 'Tried 3 jackets, coming back Friday')"
- **"Confirm"** button

**API**: `PATCH /api/clients/{id}` with body:
```json
{
  "seller_signal": "hot",
  "signal_note": "Tried 3 jackets, coming back Friday",
  "signal_updated_at": "2026-03-24T...",
  "signal_updated_by": "{auth.uid()}"
}
```

#### B.5 — Signal on Client Cards

On `ClientGridCard.tsx`, add the SignalBadge next to the TierBadge:
```
┌─────────────────────────────────────┐
│  Elena Dorsemagen        Optimisto  │
│  +491751604993          ◆ Strong    │
│─────────────────────────────────────│
│  Spend: 2,080€  Last: 21 Nov  ...  │
│  fashion: outerwear · RTW           │  ← interest tags (Feature A)
└─────────────────────────────────────┘
```

The signal is visible at a glance. Sellers scanning their client list can immediately see who's locked and who needs work.

#### B.6 — Signal on Client Detail

On `src/app/clients/[id]/page.tsx`, in the header area next to tier badge:
- Show the SignalBadge (tappable to edit)
- Below it, if `signal_note` exists: show the note in muted italic text
- Show `signal_updated_at` as relative time: "Updated 3 days ago"

**Keep the existing auto `HeatIndicator`** — but visually deprioritize it. The seller signal is the primary read. The auto heat score becomes a secondary "system" metric shown smaller below.

#### B.7 — Filter by Signal on Client List

Add signal as a filter on `ClientListFilters.tsx`:

New dropdown:
```
All signals
◆✦ Locked
◆  Strong
◇◆ Open
◇  Low
◇̸  Off
○  Not assessed
```

Query param: `signal` → filters `clients.seller_signal`

**"Not assessed" is critical**: this lets the seller (or supervisor) see all clients who haven't been signal-rated yet. Coaching tool — supervisor says "you have 200 unrated clients, go through them."

#### B.8 — Signal in Recontact Queue

In the recontact queue (`/queue`), show SignalBadge on each card.

**Smart ordering**: When a seller has 10 overdue recontacts, prioritize by signal:
- `very_hot` (Locked) and `hot` (Strong) clients overdue → show first (most likely to convert)
- `cold` (Low) and `lost` (Off) → show last (less urgency)
- `null` → show in the middle (unknown = could be anything)

Sort priority in the API response:
```typescript
const SIGNAL_PRIORITY: Record<string, number> = {
  very_hot: 0, hot: 1, warm: 2, cold: 4, lost: 5
}
// null gets priority 3 (middle)
```

#### B.9 — Supervisor Signal Dashboard

On the supervisor dashboard (`/dashboard`), add a section:

**"Portfolio signal"**:
- Horizontal stacked bar per seller showing distribution:
  ```
  Elliott:  ████████░░░░░░░░░░░░  42% strong | 28% open | 15% low | 15% not assessed
  Hamza:    ██░░░░░░░░░░░░░░░░░░  8% strong | 12% open | 20% low | 60% not assessed
  ```
- This tells the supervisor: "Hamza hasn't assessed 60% of his clients — he needs to go through them"
- Clickable segments → `/clients?seller={id}&signal={value}`

---

## SIGNAL CONSTANTS — Code Reference

```typescript
// src/lib/types/signal.ts

export type ClientSignal = 'very_hot' | 'hot' | 'warm' | 'cold' | 'lost'

export const SIGNAL_CONFIG: Record<ClientSignal, {
  label: string
  description: string
  bgClass: string
  textClass: string
  borderClass: string
}> = {
  very_hot: {
    label: 'Locked',
    description: 'Decision made. Conversion imminent.',
    bgClass: 'bg-red-50',
    textClass: 'text-red-800',
    borderClass: 'border-red-200',
  },
  hot: {
    label: 'Strong',
    description: 'Clear interest. Active engagement.',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-800',
    borderClass: 'border-orange-200',
  },
  warm: {
    label: 'Open',
    description: 'Receptive but not committed.',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
  },
  cold: {
    label: 'Low',
    description: 'Minimal engagement.',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-800',
    borderClass: 'border-blue-200',
  },
  lost: {
    label: 'Off',
    description: 'Off the radar. No response.',
    bgClass: 'bg-transparent',
    textClass: 'text-gray-500',
    borderClass: 'border-gray-300 border-dashed',
  },
}

export const SIGNAL_ORDER: ClientSignal[] = ['very_hot', 'hot', 'warm', 'cold', 'lost']

export const SIGNAL_PRIORITY: Record<ClientSignal, number> = {
  very_hot: 0, hot: 1, warm: 2, cold: 4, lost: 5,
}
// null signal gets priority 3 in sorting (middle of the pack)
```

### Diamond Glyph SVG Reference

Each glyph is a pure inline SVG. The diamond base shape is always:
`<polygon points="0,-H H,0 0,H -H,0"/>` where H = half-size (e.g., 7 for 14px, 4 for 8px).

**Locked (very_hot)** — filled + 8 radiating lines:
```svg
<svg width="14" height="14" viewBox="-14 -14 28 28">
  <!-- 4 cardinal rays -->
  <line x1="-12" y1="0" x2="-8" y2="0" stroke="#A32D2D" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="8" y1="0" x2="12" y2="0" stroke="#A32D2D" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="0" y1="-12" x2="0" y2="-8" stroke="#A32D2D" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="0" y1="8" x2="0" y2="12" stroke="#A32D2D" stroke-width="1.5" stroke-linecap="round"/>
  <!-- 4 diagonal rays -->
  <line x1="-9" y1="-9" x2="-6" y2="-6" stroke="#A32D2D" stroke-width="1" stroke-linecap="round"/>
  <line x1="6" y1="-6" x2="9" y2="-9" stroke="#A32D2D" stroke-width="1" stroke-linecap="round"/>
  <line x1="-9" y1="9" x2="-6" y2="6" stroke="#A32D2D" stroke-width="1" stroke-linecap="round"/>
  <line x1="6" y1="6" x2="9" y2="9" stroke="#A32D2D" stroke-width="1" stroke-linecap="round"/>
  <!-- Filled diamond -->
  <polygon points="0,-6 6,0 0,6 -6,0" fill="#A32D2D"/>
</svg>
```

**Strong (hot)** — filled diamond only:
```svg
<svg width="14" height="14" viewBox="-8 -8 16 16">
  <polygon points="0,-6 6,0 0,6 -6,0" fill="#993C1D"/>
</svg>
```

**Open (warm)** — outline + bottom half filled:
```svg
<svg width="14" height="14" viewBox="-8 -8 16 16">
  <polygon points="0,-6 6,0 0,6 -6,0" fill="none" stroke="#854F0B" stroke-width="1.5"/>
  <clipPath id="half"><rect x="-6" y="0" width="12" height="6"/></clipPath>
  <polygon points="0,-6 6,0 0,6 -6,0" fill="#854F0B" clip-path="url(#half)"/>
</svg>
```

**Low (cold)** — empty outline:
```svg
<svg width="14" height="14" viewBox="-8 -8 16 16">
  <polygon points="0,-6 6,0 0,6 -6,0" fill="none" stroke="#185FA5" stroke-width="1.5"/>
</svg>
```

**Off (lost)** — dashed outline + diagonal strike:
```svg
<svg width="14" height="14" viewBox="-8 -8 16 16">
  <polygon points="0,-6 6,0 0,6 -6,0" fill="none" stroke="#5F5E5A" stroke-width="1.2" stroke-dasharray="2 2"/>
  <line x1="-4" y1="-4" x2="4" y2="4" stroke="#5F5E5A" stroke-width="1.5" stroke-linecap="round"/>
</svg>
```

**Null (not assessed)** — dotted circle:
```svg
<svg width="14" height="14" viewBox="-8 -8 16 16">
  <circle cx="0" cy="0" r="5" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="1.5 2" opacity="0.3"/>
</svg>
```

---

## UPDATED EXECUTION ORDER

Add to the existing execution order after step 7f:

```
7g. Create InterestTag component → wire into client detail, client card, queue cards
7h. Upgrade client list interest filter to value-level (grouped dropdown)
7i. Create SignalDiamond + SignalBadge components + SignalSetter bottom sheet
7j. Add signal badges to client cards, client detail, queue cards
7k. Add signal filter to client list
7l. Add signal distribution to supervisor dashboard
7m. Smart-order recontact queue by signal priority
```

---

## NEW FILES TO CREATE

```
src/components/InterestTag.tsx
src/components/SignalDiamond.tsx
src/components/SignalBadge.tsx
src/components/SignalSetter.tsx
src/lib/types/signal.ts
supabase/migrations/015_client_signal.sql
```

## FILES TO MODIFY (in addition to existing list)

```
src/components/ClientGridCard.tsx     → add InterestTags + SignalBadge
src/components/FocusedClientCard.tsx   → add InterestTags + SignalBadge
src/app/clients/[id]/page.tsx          → clickable interest tags + editable signal
src/app/clients/page.tsx               → value-level interest filter + signal filter
src/app/clients/ClientListFilters.tsx  → grouped interest dropdown + signal dropdown
src/app/queue/page.tsx                 → signal-priority sorting
src/app/dashboard/page.tsx             → signal distribution per seller
src/app/api/clients/[id]/route.ts      → PATCH support for seller_signal fields
src/lib/types/index.ts                 → export signal types
src/lib/types/database.ts              → signal columns on clients
```

---

## DESIGN NOTES

- **Diamond glyph (losange)**: The base shape for all signal states. Deliberately angular — distinct from tier badges (rounded pills) and format badges (also rounded). Different shape = different information category.
- **No emoji anywhere**. Pure SVG geometry. Scales perfectly, renders crisp at any size.
- **InterestTag**: small, rounded pill, pastel color per category. Feels like a keyword chip. Click = filter.
- **SignalBadge**: slightly larger pill with inline SVG diamond + label text. Click = edit (opens setter).
- **SignalSetter**: bottom sheet on mobile, popover on desktop. 5 radio rows with diamond glyph + label + description. Optional note. Single "Confirm" CTA.
- Both elements should feel lightweight — tags and badges, not heavy UI. They add signal without cluttering the card.
- **Signal + Tier + Interest** together on a client card give the seller everything at a glance: who (name), how valuable (tier), what they like (interests), how close they are to buying (signal).
