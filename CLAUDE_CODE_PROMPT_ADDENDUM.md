# CASA ONE — Addendum: Interest Filtering & Seller Temperature

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
- Replace the single interest dropdown with two cascading dropdowns:
  - **Catégorie d'intérêt**: All categories (fashion, food, art, etc.)
  - **Intérêt spécifique**: Values within selected category (or all values if no category selected)
- When navigated to via `?interest_val=sneakers`, auto-select the matching category

Alternatively (simpler and better UX):
- Single dropdown that shows grouped options:
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
- Use `<optgroup>` for grouping

#### A.3 — Interest Count on Tags

When displaying an interest tag on the client detail page, optionally show a count:
- After the label, show `(12)` — the number of other clients with this same interest
- This helps the seller realize "oh, 12 of my clients like sneakers — I should alert them all when we get a new drop"

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

## FEATURE B: SELLER TEMPERATURE — "How hot is this client?"

### Current State
- `heat_score` is an auto-calculated 0-100 integer on the `clients` table
- Triggers recalculate it on every contact/purchase/visit
- `HeatIndicator` component displays: Chaud (≥80) / Tiède (≥60) / Normal (≥40) / Frais (≥20) / Froid (<20)
- **Problem**: sellers can't set it. It's a black box. The seller's gut feeling is different from a formula.

### Design Philosophy

The auto `heat_score` measures **activity** (when did the client last come in, how much did they spend).
The seller temperature measures **intent** (is this client about to buy? are they interested? or are they gone?).

These are two different signals. Keep both.

### What to Build

#### B.1 — Database: Add Seller Temperature

New migration `supabase/migrations/015_seller_temperature.sql`:

```sql
-- Seller's manual temperature assessment of a client
-- This is the seller's gut read, separate from the auto-calculated heat_score
CREATE TYPE client_temperature AS ENUM (
  'very_hot',    -- 🔥 Très chaud — Client is ready to buy, came back, asking for items
  'hot',         -- 🟠 Chaud — Interested, tried things on, engaged conversation
  'warm',        -- 🟡 Tiède — Came in, browsed, polite but non-committal
  'cold',        -- 🔵 Froid — Not engaged, just looking, no real connection
  'lost'         -- ❄️ Perdu — Hasn't returned, unreachable, moved on
);

ALTER TABLE clients ADD COLUMN IF NOT EXISTS seller_temperature client_temperature;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS temperature_note TEXT;       -- Why this temperature?
ALTER TABLE clients ADD COLUMN IF NOT EXISTS temperature_updated_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS temperature_updated_by UUID REFERENCES profiles(id);

-- Index for filtering by temperature
CREATE INDEX IF NOT EXISTS idx_clients_temperature ON clients(seller_temperature) WHERE seller_temperature IS NOT NULL;

COMMENT ON COLUMN clients.seller_temperature IS 'Seller manual assessment of client purchase intent';
COMMENT ON COLUMN clients.temperature_note IS 'Short note explaining the temperature (e.g., "Tried on 3 jackets, coming back Friday")';
```

**Default**: `NULL` (not assessed yet). This is important — a null temperature means "seller hasn't rated this client yet", which is different from "cold".

#### B.2 — Temperature Display Component

Create `src/components/TemperatureBadge.tsx`:

```typescript
interface TemperatureBadgeProps {
  temperature: ClientTemperature | null
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  onClick?: () => void  // When clickable (to edit)
}
```

**Visual design** — compact pill badges:

| Value | Emoji | Label | Colors |
|-------|-------|-------|--------|
| `very_hot` | 🔥 | Très chaud | `bg-red-100 text-red-700 border-red-200` |
| `hot` | 🟠 | Chaud | `bg-orange-100 text-orange-700 border-orange-200` |
| `warm` | 🟡 | Tiède | `bg-yellow-100 text-yellow-700 border-yellow-200` |
| `cold` | 🔵 | Froid | `bg-blue-100 text-blue-700 border-blue-200` |
| `lost` | ❄️ | Perdu | `bg-gray-100 text-gray-500 border-gray-200` |
| `null` | ○ | Non évalué | `bg-transparent text-text-muted border-dashed border-[#003D2B]/20` |

When `null`, show a dotted outline with "Évaluer" text — this invites the seller to tap and set it.

#### B.3 — Temperature Setter UI

When the seller taps the TemperatureBadge (or a "Évaluer" button), show a **bottom sheet / popover**:

**Title**: "Température client"
**Subtitle**: "{client first_name} {client last_name}"

**5 options as tappable rows** (radio-style, one selected at a time):

```
🔥  Très chaud    "Prêt à acheter, revient bientôt"
🟠  Chaud         "Intéressé, a essayé des pièces"  
🟡  Tiède         "A visité, regarde, pas décidé"
🔵  Froid         "Pas engagé, juste de passage"
❄️  Perdu         "Plus de nouvelles, injoignable"
```

Each row shows the emoji, the label, and a short description in muted text.

Below the options:
- **Note** (optional): small textarea, placeholder "Pourquoi cette température ? (ex: 'A essayé 3 vestes, revient vendredi')"
- **"Valider"** button

**API**: `PATCH /api/clients/{id}` with body:
```json
{
  "seller_temperature": "hot",
  "temperature_note": "A essayé 3 vestes, revient vendredi",
  "temperature_updated_at": "2026-03-24T...",
  "temperature_updated_by": "{auth.uid()}"
}
```

#### B.4 — Temperature on Client Cards

On `ClientGridCard.tsx`, add the TemperatureBadge next to the TierBadge:
```
┌─────────────────────────────────────┐
│  Elena Dorsemagen        Optimisto  │
│  +491751604993            🟠 Chaud  │
│─────────────────────────────────────│
│  Spend: 2,080€  Last: 21 Nov  ...  │
│  fashion: outerwear · RTW           │  ← interest tags (Feature A)
└─────────────────────────────────────┘
```

The temperature is visible at a glance. Sellers scanning their client list can immediately see who's hot and who needs attention.

#### B.5 — Temperature on Client Detail

On `src/app/clients/[id]/page.tsx`, in the header area next to tier badge and heat indicator:
- Show the TemperatureBadge (tappable to edit)
- Below it, if `temperature_note` exists: show the note in muted italic text
- Show `temperature_updated_at` as relative time: "Mis à jour il y a 3 jours"

**Keep the existing auto `HeatIndicator`** — but visually deprioritize it. The seller temperature is the primary signal now. The auto heat score becomes a secondary "system" metric shown smaller below.

#### B.6 — Filter by Temperature on Client List

Add temperature as a filter on `ClientListFilters.tsx`:

New dropdown:
```
Toutes températures
🔥 Très chaud
🟠 Chaud
🟡 Tiède
🔵 Froid
❄️ Perdu
○  Non évalué
```

Query param: `temperature` → filters `clients.seller_temperature`

**"Non évalué" is critical**: this lets the seller (or supervisor) see all clients who haven't been temperature-rated yet. This is a coaching tool — the supervisor can say "you have 200 unrated clients, go through them."

#### B.7 — Temperature in Recontact Queue

In the recontact queue (`/queue`), show TemperatureBadge on each card.

**Smart ordering**: When a seller has 10 overdue recontacts, prioritize by temperature:
- `very_hot` and `hot` clients overdue → show first (these are the ones most likely to convert)
- `cold` and `lost` → show last (less urgency, might not even be worth recontacting)
- `null` → show in the middle (unknown = could be anything)

This doesn't change the database query ordering — do it in the API response sorting:
```typescript
const TEMP_PRIORITY: Record<string, number> = {
  very_hot: 0, hot: 1, warm: 2, cold: 4, lost: 5
}
// null gets priority 3 (middle)
```

#### B.8 — Supervisor Temperature Dashboard

On the supervisor dashboard (`/dashboard`), add a section:

**"Température du portefeuille"**:
- Horizontal stacked bar per seller showing distribution:
  ```
  Elliott:  ████████░░░░░░░░░░░░  42% chaud | 28% tiède | 15% froid | 15% non évalué
  Hamza:    ██░░░░░░░░░░░░░░░░░░  8% chaud | 12% tiède | 20% froid | 60% non évalué
  ```
- This tells the supervisor: "Hamza hasn't assessed 60% of his clients — he needs to go through them"
- Clickable segments → `/clients?seller={id}&temperature={value}`

---

## UPDATED EXECUTION ORDER

Add to the existing execution order after step 7f:

```
7g. Create InterestTag component → wire into client detail, client card, queue cards
7h. Upgrade client list interest filter to value-level (grouped dropdown)
7i. Create TemperatureBadge component + TemperatureSetter bottom sheet
7j. Add temperature to client cards, client detail, queue cards
7k. Add temperature filter to client list
7l. Add temperature distribution to supervisor dashboard
7m. Smart-order recontact queue by temperature priority
```

---

## NEW FILES TO CREATE

```
src/components/InterestTag.tsx
src/components/TemperatureBadge.tsx
src/components/TemperatureSetter.tsx
supabase/migrations/015_seller_temperature.sql
```

## FILES TO MODIFY (in addition to existing list)

```
src/components/ClientGridCard.tsx     → add InterestTags + TemperatureBadge
src/components/FocusedClientCard.tsx   → add InterestTags + TemperatureBadge
src/app/clients/[id]/page.tsx          → clickable interest tags + editable temperature
src/app/clients/page.tsx               → value-level interest filter + temperature filter
src/app/clients/ClientListFilters.tsx  → grouped interest dropdown + temperature dropdown
src/app/queue/page.tsx                 → temperature-priority sorting
src/app/dashboard/page.tsx             → temperature distribution per seller
src/app/api/clients/[id]/route.ts      → PATCH support for seller_temperature fields
src/lib/types/index.ts                 → ClientTemperature type + constants
src/lib/types/database.ts              → temperature columns on clients
```

---

## DESIGN NOTES

- **InterestTag**: small, rounded pill, pastel color per category. Feels like a keyword chip. Click = filter.
- **TemperatureBadge**: slightly larger pill with emoji prefix. Click = edit (opens setter).
- **TemperatureSetter**: bottom sheet on mobile, popover on desktop. 5 radio rows with emoji + label + description. Optional note. Single "Valider" CTA.
- Both elements should feel lightweight — tags and badges, not heavy UI. They add signal without cluttering the card.
- **Temperature + Tier + Interest** together on a client card give the seller everything at a glance: who (name), how valuable (tier), what they like (interests), how close they are to buying (temperature).
