# Moood Page — Architect Plan

> `/moood` — Daily mood check-in, word of the day, mood graph, and animated word cloud.

---

## 1. What We're Building

| Feature | Description |
|---|---|
| **Mood board** | User picks one of 5 emoji moods per day. Collected and shown in team pulse. |
| **Word of the Day (WotD)** | User adds one word per day (Mon–Fri). Aggregated into an animated word cloud. |
| **Mood graph** | Team average mood over time. Filterable by date, day-of-week view, and weekly view. |
| **Word cloud** | All team words in selected period, sized by frequency, animated on render + filter change. |
| **Edit rules** | Users can change today's mood/WotD anytime during the current week. Past weeks are locked. |

---

## 2. Database Changes

### New table: `mood_entries`
Per-day mood — replaces the weekly `mood_submissions` pattern for this page's data.

```sql
CREATE TABLE mood_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname      text NOT NULL REFERENCES users(nickname),
  entry_date    date NOT NULL,
  score         int NOT NULL CHECK (score BETWEEN 1 AND 5),
  mood_key      text NOT NULL,          -- great | good | okay | meh | rough
  submitted_at  timestamptz DEFAULT now(),
  UNIQUE (nickname, entry_date)
);
```

### New table: `daily_words`
One word per user per day.

```sql
CREATE TABLE daily_words (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname      text NOT NULL REFERENCES users(nickname),
  word          text NOT NULL,
  entry_date    date NOT NULL,
  submitted_at  timestamptz DEFAULT now(),
  UNIQUE (nickname, entry_date)
);
```

### RLS
- `SELECT`: open to anon
- `INSERT`/`UPDATE`: server-side via Server Actions only (nickname must match session)
- Edit allowed only when `entry_date >= date_trunc('week', now())` (ISO Monday of current week)

---

## 3. Page Layout

### Desktop (1180px max-width)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HEADER (sticky)                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  HERO ROW                                                                   │
│  Date label (green) · Greeting h1 · Team check-in stat panel (inverted)    │
├──────────────────────────────────┬──────────────────────────────────────────┤
│  MOOD CHECK-IN CARD (flex 1.4)   │  WORD OF THE DAY CARD (flex 1)          │
│  - Day tabs Mon–Fri              │  - Day tabs Mon–Fri                     │
│  - 5 emoji mood buttons          │  - Single word text input               │
│  - Submitted state (bob emoji)   │  - This week's word chips               │
│  - Edit button (current week)    │  - Lock icon if past week               │
├──────────────────────────────────┴──────────────────────────────────────────┤
│  FILTER BAR  [ Today ] [ This Week ] [ By Day ▾ ] [ Date range ]           │
├──────────────────────────────────┬──────────────────────────────────────────┤
│  MOOD GRAPH (flex 2)             │  TEAM PULSE STATS (flex 1)              │
│  - Recharts BarChart             │  - Avg score big number                 │
│  - Color-coded bars per mood     │  - Emoji distribution bars              │
│  - X: date / day label           │  - Live pulse dot                       │
│  - Y: avg score 1–5              │  - 6-week trend bars                    │
│  - Tooltip: emoji + label        │                                         │
├──────────────────────────────────┴──────────────────────────────────────────┤
│  WORD CLOUD (full width)                                                    │
│  - Animated on mount + filter change                                        │
│  - Size by frequency                                                        │
│  - Click word to filter                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mobile
All sections stack vertically. Mood check-in first (above fold). Filter bar is a horizontal scroll strip.

---

## 4. Component Tree

```
src/app/moood/
  page.tsx                        # Server Component — fetches initial data, renders layout

src/components/moood/
  MooodClient.tsx                 # "use client" — owns filter state, passes to children
  MoodCheckin.tsx                 # Day-tab selector + 5 emoji buttons + submit
  MoodSubmittedState.tsx          # Post-submit card: bobbing emoji + "Change" button
  WordOfDay.tsx                   # Daily word input + this-week chip row
  MoodFilterBar.tsx               # Filter controls: today / week / by-day / range
  MoodGraph.tsx                   # Recharts BarChart or LineChart + filter awareness
  WordCloud.tsx                   # Animated word cloud with Framer Motion
  TeamPulseStats.tsx              # Avg score, distribution bars, trend mini-bars
  MoodDayTabs.tsx                 # Shared Mon–Fri tab strip used by checkin + WotD

src/app/moood/actions.ts          # Server Actions: submitMood, editMood, submitWord, editWord
```

---

## 5. Data Fetching Strategy

`page.tsx` (Server Component) fetches:
1. `mood_entries` for current week (all users) → team pulse + my today's mood
2. `daily_words` for current week (all users) → word cloud initial data
3. `mood_entries` for last 6 weeks (aggregate by week) → trend bars

Client side (via Server Actions on filter change):
- Filter bar change triggers re-fetch of `mood_entries` / `daily_words` for new range

---

## 6. Mood Check-in Component

### States
| State | Trigger | UI |
|---|---|---|
| Empty | No submission for today | 5 emoji buttons + optional word input + submit CTA |
| Submitted | After submit | Bobbing emoji + mood label + "Change pulse" button |
| Past day (same week) | Viewing Mon–Thu on Friday | Read-only submitted card or edit if submitted |
| Past week | Any day last week | Read-only lock overlay |

### Day Tabs (Mon–Fri)
- Default to today's tab
- Past days of current week: editable if submitted, otherwise empty (can backfill)
- Past week's days: read-only (locked)
- Future days: disabled

### Mood options
```ts
const MOODS = [
  { key: 'great', emoji: '😄', label: 'Great', color: '#86bc25', score: 5 },
  { key: 'good',  emoji: '🙂', label: 'Good',  color: '#0097a9', score: 4 },
  { key: 'okay',  emoji: '😐', label: 'Okay',  color: '#ffcd00', score: 3 },
  { key: 'meh',   emoji: '😕', label: 'Meh',   color: '#ed8b00', score: 2 },
  { key: 'rough', emoji: '😣', label: 'Rough', color: '#da291c', score: 1 },
]
```

### Submit flow
1. User selects emoji → button highlights (border + scale up)
2. User clicks "Submit my pulse" → Server Action `submitMood(date, moodKey, score)`
3. On success: confetti burst + toast + transition to `MoodSubmittedState` (`tpPop`)
4. `localStorage` caches today's submission so SSR hydration is instant

---

## 7. Word of the Day Component

### Rules
- One word per user per day
- Can edit today's word (current week only)
- Chips show all words the user submitted this week
- Input: single-word validation (no spaces, max 20 chars)

### UI
- Input with placeholder "Your word for today…"
- Below: row of chip pills for Mon–Fri (greyed out if not submitted, colored if submitted)
- Edit: click chip or use input (prefilled) when on editable day

---

## 8. Filter Bar

```
[ Today ] [ This Week ] [ By Day ▾ Mon Tue Wed Thu Fri ] [ ↔ Date Range ]
```

- Active filter = filled pill (dark bg)
- "By Day" expands to show day-of-week sub-tabs (shows all Mondays across weeks, etc.)
- "Date Range" opens a date picker (calendar inline or popover)
- Filter state lives in `MooodClient.tsx` and is passed down to both `MoodGraph` and `WordCloud`

---

## 9. Mood Graph

### Chart library: Recharts `BarChart`

**For "Today" / "By Day" view:**
- X-axis: hours (8am–6pm) or user list
- Y-axis: mood score 1–5
- Each bar colored by mood key

**For "This Week" view:**
- X-axis: Mon / Tue / Wed / Thu / Fri
- Y-axis: team average score 1–5
- Bar color: gradient from rough (red) → great (green) based on value
- Tooltip: average score + emoji + count of submissions

**For "By Day of week" view:**
- X-axis: last 8 occurrences of that weekday
- Shows trend over time for e.g. all Mondays

### Animation
- `animationBegin={0}` `animationDuration={800}` on Recharts bars
- Re-mount chart (key on filter) to replay animation

---

## 10. Word Cloud

### Implementation
No external word-cloud library — build with Framer Motion for full animation control.

```
Algorithm:
1. Count word frequencies from filtered daily_words
2. Sort by frequency descending
3. Spiral-place words (Archimedean spiral) in a fixed-height container
4. Map frequency → font-size: clamp(14px, freq * 8px, 64px)
5. Map word → color from brand palette (hash-based, deterministic)
```

### Animations
- **On mount / filter change**: staggered `tpPop` entrance — words scale 0→1 with spring, stagger 0.04s per word
- **Hover**: scale 1.12 + brightness increase
- **Click**: filter the graph below by that word

### Word sizing
```ts
const maxFreq = words[0].count
const minSize = 14, maxSize = 64
const size = (word.count / maxFreq) * (maxSize - minSize) + minSize
```

### Reduced motion fallback
- `useReducedMotion()` → skip stagger, instant opacity only

---

## 11. Team Pulse Stats

Same structure as the Home dashboard `📊 Team pulse` card:
- Big `Bricolage Grotesque` average score number
- Live pulse dot (teal, `tpPulse` animation)
- Distribution bars per mood key (`tpGrowX` animation)
- 6-week mini trend bars at bottom

Updates reactively when filter changes (scoped to filtered date range).

---

## 12. Server Actions

```ts
// src/app/moood/actions.ts

export async function submitMood(data: {
  nickname: string
  entry_date: string   // ISO date "2026-06-26"
  score: number
  mood_key: string
}): Promise<{ error?: string }>

export async function submitWord(data: {
  nickname: string
  entry_date: string
  word: string
}): Promise<{ error?: string }>

// Both upsert on (nickname, entry_date) UNIQUE constraint
// Both validate: entry_date >= ISO Monday of current week (no past-week edits)
```

---

## 13. LocalStorage Keys (New)

| Key | Value |
|---|---|
| `tp_mood_<nick>_<date>` | `{ mood_key, score }` — per-day cache |
| `tp_word_<nick>_<date>` | `string` — cached WotD |

---

## 14. Migration File

```
supabase/migrations/20260626_mood_entries_daily_words.sql
```

Contents:
- CREATE TABLE `mood_entries`
- CREATE TABLE `daily_words`
- RLS: SELECT open; INSERT/UPDATE/DELETE → deny (handled server-side)
- Index: `mood_entries(entry_date)`, `daily_words(entry_date)`

Update `src/lib/supabase/types.ts` with new table types.

---

## 15. Framer Motion Variants Reference

```tsx
// Word cloud word entrance
const wordVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.04, duration: 0.45, ease: [0.2, 0.8, 0.3, 1.3] }
  })
}

// Filter change re-animation: wrap cloud in AnimatePresence with key={filterKey}
```

---

## 16. Implementation Order (Developer Tasks)

1. **DB migration** — create `mood_entries` + `daily_words` + types
2. **Server Actions** — `submitMood`, `submitWord` (upsert + date guard)
3. **MoodDayTabs** — Mon–Fri tab strip, today highlighted, past-week disabled
4. **MoodCheckin** — emoji buttons, submission states, confetti
5. **WordOfDay** — input + chip row + lock for past week
6. **MooodClient** — filter state, fetch on filter change, data wiring
7. **TeamPulseStats** — distribution bars + trend, wired to filter
8. **MoodGraph** — Recharts bar chart, all three filter views
9. **WordCloud** — spiral layout + Framer Motion stagger entrance
10. **MoodFilterBar** — filter pills + day-of-week expand + date range
11. **page.tsx** — Server Component data fetch + layout
12. **Polish** — reduced motion, mobile layout, dark/light theme tokens

---

## 17. Open Questions

- **Word cloud layout algorithm**: Use CSS `flexWrap` with random rotations (simpler, good enough) or implement Archimedean spiral (more authentic cloud look). Recommend flex-wrap with slight rotation for v1.
- **Word of the day limit**: Single word only, or allow a short phrase (2–3 words)? CLAUDE.md says "a word" — enforce single token.
- **Back-fill moods**: Can a user submit a mood for last Tuesday (current week) on Friday? Yes — day tabs support back-fill within the current week.
- **Graph data refresh**: Poll on focus or use Supabase Realtime subscription? Use focus-refetch via `visibilitychange` for simplicity; Realtime only for live count badge.
