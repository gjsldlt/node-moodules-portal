# Node-ifications Page — Implementation Spec

**Route:** `/node-ifications`
**File:** `src/app/node-ifications/page.tsx`

---

## Summary

Build the Node-ifications page (`/node-ifications`) — the team hub for announcements and per-user reminders. The page has two tabs (Announcements, Reminders), a hero section with live stats, full CRUD via Server Actions, and per-user reminder tick state backed by both localStorage and the `reminder_completions` table. The audience is front-end developers; every state transition must animate, every list mutation must feel alive.

---

## Assumptions & Design Notes

- The `announcements` table has no `accent_color` column per the schema. Accent color is derived deterministically from the announcement's `emoji` field using the brand palette hash pattern (same as avatar generation).
- The pinned announcement (or most recent if none pinned) is the featured card.
- Hero stat panel "X teammates checked in this week" refers to `mood_submissions` for the current ISO week.
- The `reminder_completions` insert validates `nickname` matches `created_by` server-side. No session auth exists — this is consistent with the existing nickname pattern.
- ⚠️ `src/lib/supabase/types.ts` must be extended with `announcements`, `reminders`, and `reminder_completions` table shapes before typing Supabase calls.
- Fetch the 20 most recent announcements, ordered by `created_at DESC`. Cap `reminder_completions` fetch at `.limit(500)`.

---

## Data Model Extensions

Add to `src/lib/supabase/types.ts`:

```ts
announcements:
  Row: { id: string, title: string, body: string | null, emoji: string | null,
         created_by: string, pinned: boolean, created_at: string }
  Insert: { id?: string, title: string, body?: string | null, emoji?: string | null,
            created_by: string, pinned?: boolean, created_at?: string }
  Update: { pinned?: boolean }

reminders:
  Row: { id: string, title: string, created_by: string, resolved: boolean,
         due_date: string | null, created_at: string }
  Insert: { id?: string, title: string, created_by: string, resolved?: boolean,
            due_date?: string | null, created_at?: string }
  Update: { resolved?: boolean }

reminder_completions:
  Row: { id: string, reminder_id: string, nickname: string, completed_at: string }
  Insert: { id?: string, reminder_id: string, nickname: string, completed_at?: string }
  Update: never
```

---

## 1. Page Architecture — Server/Client Boundary

```
src/app/node-ifications/page.tsx          [Server Component]
  │  Fetches: announcements, reminders, reminder_completions, mood check-in count
  │  Passes data as props to client subtree
  │
  ├── <NodeificationsHero />               [Server Component]
  │     Props: openReminderCount, checkedInThisWeek
  │
  └── <NodeificationsClient />             [Client Component — "use client"]
        Props: initialAnnouncements, initialReminders, initialCompletions, nickname
        │  Owns: activeTab, all optimistic state
        │
        ├── <TabToggle />                  [Client Component]
        │
        ├── [tab === 'announcements']
        │   ├── <FeaturedAnnouncementCard />   [Client Component]
        │   ├── <AnnouncementList />            [Client Component — uses auto-animate]
        │   └── <AddAnnouncementForm />         [Client Component]
        │
        └── [tab === 'reminders']
            ├── <ReminderList />               [Client Component — uses auto-animate]
            ├── <CompletedReminders />         [Client Component — accordion]
            └── <AddReminderForm />            [Client Component]

Shared across both tabs:
  <Toast />                                [Client Component — AnimatePresence]
```

The `Header` and `AmbientBackground` are already rendered by the root layout. The page does not re-render them.

---

## 2. Component Breakdown

### `src/app/node-ifications/page.tsx` — Server Component

Fetches all initial data in one parallel pass. Renders `NodeificationsHero` (static, SSR) and passes all fetched data to `NodeificationsClient`. The nickname is client-only (localStorage) — the page does not need it server-side.

Props passed down: `initialAnnouncements`, `initialReminders`, `initialCompletions`, `weeklyCheckinCount`.

---

### `src/components/node-ifications/NodeificationsHero.tsx` — Server Component

Props:
```
openReminderCount: number     // count of non-resolved reminders
weeklyCheckinCount: number    // mood submissions this ISO week
```

Renders:
- Date label: ISO week range formatted "Jun 23 – Jun 27", teal `#0097a9`, uppercase, `letter-spacing: .06em`, `font-weight: 700`, `font-size: 14px`
- `h1`: "Node-ifications 📣" — Bricolage Grotesque 800, `clamp(30px, 5vw, 46px)`, `line-height: 1.04`, `letter-spacing: -0.025em`. The 📣 emoji has `display: inline-block; animation: tpBob 3s ease-in-out infinite` via CSS.
- Subtitle: "News, nudges, and team reminders — all in one place." — `var(--txs)`, 16px, max-width 52ch
- Hero stat panel (inverted): `background: var(--pnl)`, `color: var(--pnlt)`, `border-radius: 26px`, `padding: 14px 20px`, `box-shadow: 0 22px 44px -26px var(--shadow)`, two chips side by side:
  - Left chip: "X open reminders" — number Bricolage 800 32px, label Hanken 600 12px `var(--pnls)`
  - Right chip: live pulse dot (CSS `tpPulse` keyframe on a pseudo-element) + "X checked in this week"

Pure server HTML — no client JS. `tpBob` and `tpPulse` are CSS keyframes already in `globals.css`.

---

### `src/components/node-ifications/NodeificationsClient.tsx` — Client Component

Props:
```
initialAnnouncements: AnnouncementRow[]
initialReminders:     ReminderRow[]
initialCompletions:   CompletionRow[]
weeklyCheckinCount:   number
```

State:
- `activeTab: 'announcements' | 'reminders'` — `useState`
- `announcements` — `useOptimistic` seeded from `initialAnnouncements`
- `reminders` — `useOptimistic` seeded from `initialReminders`
- `completions` — `useOptimistic` seeded from `initialCompletions`
- `submittingIds: Set<string>` — tracks in-flight reminder toggle IDs (prevents double-tap)
- `toast: { message: string; id: number } | null` — `useState`

Reads `nickname` via `useNickname()`.

Featured announcement: `announcements.find(a => a.pinned) ?? announcements[0] ?? null`. Rest passed to `AnnouncementList`.

Active reminders: those where current user has no completion entry. Completed: those with a matching completion.

Renders: `TabToggle`, tab content with `AnimatePresence mode="wait"`, and `Toast`.

---

### `src/components/node-ifications/TabToggle.tsx` — Client Component

Props: `activeTab: 'announcements' | 'reminders'`, `onTabChange: (tab) => void`

Two pill buttons. Active pill uses Framer Motion `layoutId="tab-pill"` to slide the fill between tabs:
- `transition: { type: 'spring', stiffness: 400, damping: 35 }`
- `useReducedMotion()`: skip `layoutId`, use instant opacity/class toggle instead.

Active state: `background: var(--tx)`, `color: var(--bg)`. Inactive: transparent bg, `color: var(--txs)`.

---

### `src/components/node-ifications/FeaturedAnnouncementCard.tsx` — Client Component

Props: `announcement: AnnouncementRow`, `nickname: string | null`, `onDelete: (id: string) => void`

Renders:
- Full-width card, `border-radius: 26px`, `padding: 24px`
- Gradient bg: `linear-gradient(135deg, {accentColor}33, {accentColor}11)` via `getAnnouncementAccentColor(announcement.emoji)`
- `tpSheen` shimmer overlay: absolutely-positioned, `aria-hidden: true`, CSS keyframe (not Framer Motion):
  - `background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)`, `width: 60%`, `height: 100%`, `pointer-events: none`
  - CSS: `animation: tpSheen 5.5s ease-in-out 1s infinite`
- "PINNED" badge if `announcement.pinned`: `background: rgba(255,255,255,0.22)`, white text, uppercase pill, `font-size: 11px`, `font-weight: 700`
- Emoji (30px) + title (Bricolage 700, 20px) + body (Hanken 400, 14px, `opacity: 0.92`) + byline "by {created_by}" + relative time `var(--txm)` 12px
- Delete button: only renders when `nickname === announcement.created_by`. Inline confirm: first click → "Sure?", second click → `onDelete`. Reverts after 3s if not confirmed. Local state `confirmingDelete: boolean`.

Entrance: Framer Motion `itemVariants`, `delay: 0`.

---

### `src/components/node-ifications/AnnouncementList.tsx` — Client Component

Props: `announcements: AnnouncementRow[]` (excludes featured), `nickname: string | null`, `onDelete: (id: string) => void`

Uses `@formkit/auto-animate` on the `ul` ref.

Each item:
- `display: flex`, `gap: 14px`, `padding: 16px 0`
- Separator: `border-bottom: 1px solid var(--bd)` except last item
- Icon bg: 38×38px, `border-radius: 12px`, `background: {accentColor}22`, emoji 20px centered
- Right: title (Hanken 700, 15px), body (Hanken 400, 13px, `var(--txs)`, clamp 2 lines), time (Hanken 500, 12px, `var(--txm)`)
- Delete button (creator-only): same inline confirm pattern

New optimistic items: `tpPop` Framer Motion entrance. Initial load: container/item stagger `tpFadeUp` variants.

Empty state: "🗒️ No announcements yet — be the first!" centered, `var(--txs)`.

---

### `src/components/node-ifications/AddAnnouncementForm.tsx` — Client Component

Props: `nickname: string | null`, `onAdd: (announcement: AnnouncementRow) => void`

State: `emoji`, `title`, `body`, `submitting`, `error` — all local.

If `nickname` is null: shows "Set a nickname first to post." — no inputs rendered.

Renders (when nickname present):
- Header "📣 New Announcement" — Bricolage 700, 16px
- Emoji picker: 6 presets (`📢 🎉 ⚠️ 🔥 ✅ 💡`), pill buttons. Selected: `background: var(--trk)`, `border: 1.5px solid var(--bd)` + subtle spring scale. Fallback text input for custom emoji (max 2 chars, shown below presets).
- Title input: `placeholder="Announcement title…"`, `maxLength={80}`, required. `border-radius: 14px`, `padding: 13px 15px`, `border: 1.5px solid var(--bd)`, focus → `border-color: var(--teal)`.
- Body textarea: `placeholder="More details (optional)…"`, `maxLength={240}`, `rows={3}`, same styling.
- Submit button: pill, `background: var(--green)` `#86bc25`, `color: white`, `font-weight: 800`, full width. Disabled when title empty or submitting.
- On submit: calls `addAnnouncement`, calls `onAdd`, fires toast "Announcement posted! 📣", resets form.

---

### `src/components/node-ifications/ReminderList.tsx` — Client Component

Props: `reminders: ReminderRow[]` (active only), `completions: CompletionRow[]`, `nickname: string | null`, `onToggle: (reminderId: string, done: boolean) => void`, `onResolve: (reminderId: string) => void`, `submittingIds: Set<string>`

Uses `@formkit/auto-animate` on the `ul` ref.

Each item row:
- `display: flex`, `align-items: center`, `gap: 14px`, `padding: 14px 0`, `min-height: 44px`
- Checkbox: 24×24px `border-radius: 8px`. Unchecked: `border: 2px solid var(--teal)`, transparent bg. Checked: `background: var(--teal)`, white `✓` centered.
  - Tick animation: Framer Motion `motion.span`, `animate={{ scale: [1, 1.25, 1] }}`, `transition: { duration: 0.35, ease: [0.2, 0.8, 0.3, 1.3] }` — this matches `tpPop`.
  - Row bg: `motion.div`, `animate={{ backgroundColor: done ? 'var(--trk)' : 'transparent' }}`, `transition: { duration: 0.2 }`.
  - Confetti on tick: `confetti({ particleCount: 60, spread: 80, origin: { y: elementY }, colors: ['#86bc25','#0097a9','#62b5e5','#da291c','#ed8b00','#ffcd00'] })`.
  - `useReducedMotion()`: skip scale spring and confetti; use opacity toggle only.
  - Disabled when `submittingIds.has(reminder.id)` (prevents double-tap).
- Title: Hanken 600, 15px. On complete: `text-decoration: line-through`, `color: var(--txm)`, CSS `transition: 0.2s`.
- Due date chip (if `due_date`): pill `background: var(--trk)`, `font-size: 12px`, formatted "Jun 30". If past due: `background: rgba(218,41,28,0.15)`, `color: var(--red)` `#da291c`.
- "Resolve for everyone" button: only when `nickname === reminder.created_by`. Inline confirm pattern. On confirm: `onResolve(reminder.id)`.

Empty state: "✅ All clear! No reminders." centered, `var(--txs)`.

---

### `src/components/node-ifications/CompletedReminders.tsx` — Client Component

Props: `completed: ReminderRow[]`, `completions: CompletionRow[]`, `nickname: string | null`, `onUntick: (reminderId: string) => void`

Local state: `expanded: boolean` (default `false`).

Header: "X done" count badge (`background: rgba(134,188,37,0.15)`, `color: #86bc25`, pill, Hanken 700 12px) + chevron that rotates 180° on expand:
- `motion.svg`, `animate={{ rotate: expanded ? 180 : 0 }}`, duration 0.25s.
- `useReducedMotion()`: skip rotation.

Content: Framer Motion `AnimatePresence`:
- `motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.2, 0.7, 0.3, 1] }}`
- `useReducedMotion()`: instant show/hide (skip height animation).

Shows completed reminder rows (faded, strikethrough). Each row has "Untick" button → `onUntick`.

Empty when expanded: "Nothing done yet — get cracking!" `var(--txs)`.

---

### `src/components/node-ifications/AddReminderForm.tsx` — Client Component

Props: `nickname: string | null`, `onAdd: (reminder: ReminderRow) => void`

State: `title`, `dueDate`, `submitting`, `error` — all local.

Renders inline below the reminder list:
- Title input (required) + optional `type="date"` input (styled with `border-radius: 14px`, `padding: 13px 15px`)
- Submit button: pill, `background: var(--green)`, full width
- On submit: calls `addReminder`, `onAdd` callback, toast "Reminder added ✅", reset form
- New item enters with `tpPop` via `AnimatePresence` on the parent list container

---

### `src/components/node-ifications/Toast.tsx` — Client Component

Props: `message: string | null`, `onDismiss: () => void`

Uses `AnimatePresence`. Renders when `message !== null`:
- `position: fixed`, `left: 50%`, `bottom: 26px`, `z-index: 50`
- Pill: `background: var(--pnl)`, `color: var(--pnlt)`, `padding: 14px 22px`, `border-radius: 999px`, `font-weight: 700`, `font-size: 14.5px`, `box-shadow: 0 20px 40px -16px var(--shadow)`, `border: 1px solid var(--bd)`
- Framer Motion: `initial: { opacity: 0, y: 24, x: '-50%' }`, `animate: { opacity: 1, y: 0, x: '-50%' }`, `exit: { opacity: 0, y: 24, x: '-50%' }`, `transition: { duration: 0.35, ease: [0.2, 0.8, 0.3, 1.2] }` (matches `tpToast`)
- Auto-dismiss after 3000ms via `useEffect`
- `useReducedMotion()`: `y: 0` in all variants (opacity only)

---

## 3. Data Flow

### Initial page load

```
browser GET /node-ifications
  → page.tsx (RSC) runs Promise.all([
      announcements: order created_at DESC, limit 20
      reminders: eq resolved false, order created_at DESC
      reminder_completions: limit 500
      mood_submissions: count where week_number = currentIsoWeek AND year = currentYear
    ])
  → page.tsx renders <NodeificationsHero> (static HTML) + <NodeificationsClient> (serialized props)
  → client hydrates; NodeificationsClient reads nickname from useNickname() (localStorage context)
```

### Add announcement

```
form submit → addAnnouncement({ title, body, emoji, nickname })
  → Server Action validates, inserts, returns AnnouncementRow
  → onAdd callback → useOptimistic prepend → tpPop entrance → toast
  → revalidatePath('/node-ifications') inside action (next nav will re-sync)
```

### Delete announcement

```
"Sure?" confirm → deleteAnnouncement({ id, nickname })
  → Server Action: fetches row, asserts row.created_by === nickname (case-insensitive)
  → deletes row
  → optimistic remove (auto-animate handles exit)
```

### Tick reminder

```
checkbox click (not in submittingIds)
  → add reminderId to submittingIds
  → localStorage write tp_rem_<nick>
  → toggleReminderCompletion({ reminderId, nickname, done })
  → if done=true: UPSERT reminder_completions
  → if done=false: DELETE reminder_completions WHERE reminder_id=? AND nickname=?
  → optimistic update completions state; confetti + spring animation fires
  → on error: revert optimistic, toast "Something went wrong"
  → remove reminderId from submittingIds
```

### Resolve reminder (creator)

```
"Sure?" confirm → resolveReminder({ id, nickname })
  → Server Action: fetches reminder, asserts created_by === nickname
  → UPDATE reminders SET resolved=true WHERE id=?
  → optimistic remove from reminders list
```

---

## 4. Server Actions

**File:** `src/app/node-ifications/actions.ts` — `'use server'` at top.

All actions call `revalidatePath('/node-ifications')` on success.
Authorization note: since there is no session auth, the server validates `nickname === created_by` from the DB row. A user who spoofs another's nickname in localStorage could bypass this. This is a known limitation of the nickname-only identity model, accepted by design.

| Action | Input | Operations | Returns |
|---|---|---|---|
| `addAnnouncement` | `{ title, body?, emoji?, nickname }` | Validate lengths; insert announcements; return row | `{ data: AnnouncementRow } \| { error: string }` |
| `deleteAnnouncement` | `{ id, nickname }` | Fetch row; assert created_by match; delete | `{ success: true } \| { error: string }` |
| `addReminder` | `{ title, dueDate?, nickname }` | Validate; insert reminders; return row | `{ data: ReminderRow } \| { error: string }` |
| `toggleReminderCompletion` | `{ reminderId, nickname, done }` | done=true: UPSERT completions; done=false: DELETE completions | `{ success: true } \| { error: string }` |
| `resolveReminder` | `{ id, nickname }` | Fetch reminder; assert created_by match; UPDATE resolved=true | `{ success: true } \| { error: string }` |

---

## 5. Animation Spec

### Hero section entrance
- Framer Motion `motion.section`, `variants: containerVariants`, `initial: 'hidden'`, `animate: 'visible'`
- Children: `motion.div` with `variants: itemVariants`
- `staggerChildren: 0.08`
- `itemVariants.hidden: { opacity: 0, y: 22, scale: 0.985 }`, `visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.2, 0.7, 0.3, 1] } }`
- `useReducedMotion()`: `y: 0, scale: 1` in hidden (opacity only)

### Tab toggle pill
- `layoutId="tab-pill"` on active pill bg
- `transition: { type: 'spring', stiffness: 400, damping: 35 }`
- `useReducedMotion()`: disable layoutId, instant class swap

### Announcement cards entrance
- Container: `motion.div` with `containerVariants` (stagger 0.08s)
- Items: `motion.div` with `itemVariants`
- New optimistic items: `motion.li` with `popVariants`

### tpSheen on featured card
Pure CSS keyframe on absolutely-positioned overlay — no Framer Motion (runs indefinitely without JS cost):
```css
@keyframes tpSheen {
  0%, 100% { transform: translateX(-120%) }
  50% { transform: translateX(220%) }
}
/* applied: animation: tpSheen 5.5s ease-in-out 1s infinite */
```

### Reminder checkbox tick
- `motion.span` for checkbox: `animate={{ scale: [1, 1.25, 1] }}`, `transition: { duration: 0.35, ease: [0.2, 0.8, 0.3, 1.3] }`
- Row: `motion.div animate={{ backgroundColor: ... }} transition={{ duration: 0.2 }}`
- Confetti: `confetti({ particleCount: 60, spread: 80, origin: { y }, colors: [...] })`
- `useReducedMotion()`: skip scale spring and confetti

### Completed accordion
- `AnimatePresence` + `motion.div` height animation
- `initial: { height: 0, opacity: 0 }`, `animate: { height: 'auto', opacity: 1 }`, `exit: { height: 0, opacity: 0 }`, `transition: { duration: 0.3, ease: [0.2, 0.7, 0.3, 1] }`
- Chevron: `motion.svg animate={{ rotate: expanded ? 180 : 0 }}`, duration 0.25s
- `useReducedMotion()`: instant show/hide

### Tab content switch
- `AnimatePresence mode="wait"` wrapping tab content
- Each tab: `motion.div key={activeTab}`, `initial: { opacity: 0, y: 10 }`, `animate: { opacity: 1, y: 0 }`, `exit: { opacity: 0, y: -10 }`, `transition: { duration: 0.2 }`
- `useReducedMotion()`: y: 0, opacity-only crossfade

### Toast
- `AnimatePresence` + `motion.div` per Toast spec above

### Auto-animate on lists
- `useAutoAnimate` on `ul` refs in `AnnouncementList` and `ReminderList`
- Do NOT combine with Framer Motion `AnimatePresence` on the same container (they conflict)

---

## 6. Responsive Layout

### Hero section
- **Mobile (base):** Single column — date label, h1, subtitle, stat panel stacked.
- **md (768px+):** `display: flex`, `flex-wrap: wrap`, `align-items: flex-end`, `justify-content: space-between`, `gap: 20px`. Text left (`flex: 1`), stat panel right.
- Stat panel: two chips side by side at all breakpoints.

### Tabs
- Tab toggle: `flex: 1` pills on mobile (full width), `width: auto` inline on md+.

### Announcements tab
- **Mobile:** Single column. Featured → list → add form.
- **md+:** `display: flex`, `flex-wrap: wrap`, `gap: 20px`. Left col: featured + list (`flex: 1.7`). Right col: add form (`flex: 1`).

### Reminders tab
- **Mobile:** Single column. Active list → add form → completed accordion.
- **md+:** `display: flex`, `flex-wrap: wrap`, `gap: 20px`. Left col: active reminders + add form (`flex: 1.5`). Right col: completed accordion (`flex: 1`).

### Main content area
`max-width: 1180px`, `margin: 0 auto`, `padding: clamp(20px,4vw,40px) clamp(16px,4vw,40px) 64px`

### Touch targets
All interactive elements minimum 44px height via `min-height: 44px` or padding.

---

## 7. State Inventory

All state lives in `NodeificationsClient` unless noted.

| State | Type | Owner | How updated |
|---|---|---|---|
| `activeTab` | `'announcements' \| 'reminders'` | `NodeificationsClient` | Tab toggle click |
| `announcements` | `AnnouncementRow[]` | `NodeificationsClient` via `useOptimistic` | add/delete actions |
| `reminders` | `ReminderRow[]` | `NodeificationsClient` via `useOptimistic` | add/resolve actions |
| `completions` | `CompletionRow[]` | `NodeificationsClient` via `useOptimistic` | toggle action |
| `submittingIds` | `Set<string>` | `NodeificationsClient` | Add on tick start, remove on settle |
| `toast` | `{ message: string; id: number } \| null` | `NodeificationsClient` | Action callbacks; auto-clear 3s |
| `confirmingDelete` | `boolean` | `FeaturedAnnouncementCard` local | Button clicks; auto-reverts 3s |
| `confirmingDelete` | `boolean` | Each `AnnouncementList` item local | Same |
| `confirmingResolve` | `boolean` | Each `ReminderList` item local | Same |
| `formEmoji` | `string` | `AddAnnouncementForm` local | Emoji picker |
| `formTitle` | `string` | `AddAnnouncementForm` local | Input change |
| `formBody` | `string` | `AddAnnouncementForm` local | Textarea change |
| `submitting` | `boolean` | `AddAnnouncementForm` local | Action in-flight |
| `formTitle` | `string` | `AddReminderForm` local | Input change |
| `formDueDate` | `string` | `AddReminderForm` local | Date input |
| `submitting` | `boolean` | `AddReminderForm` local | Action in-flight |
| `expanded` | `boolean` | `CompletedReminders` local | Accordion toggle |

**`useOptimistic` pattern:**
1. Call `setOptimistic` with predicted new state immediately.
2. `await` Server Action.
3. On error: revert optimistic state; show error toast.
4. On success: `revalidatePath` inside action syncs canonical state on next navigation.

---

## 8. Ordered Developer Task List

### Task 1 — Extend Supabase types
**File:** `src/lib/supabase/types.ts`

Add `announcements`, `reminders`, `reminder_completions` table shapes to `Database['public']['Tables']`. Add `AnnouncementRow`, `ReminderRow`, `CompletionRow` type aliases to `src/types/index.ts`.

Acceptance: `npx tsc --noEmit` passes with no `any` introduced.

---

### Task 2 — Add helper: accent color from emoji
**File:** `src/lib/identity.ts`

Export `getAnnouncementAccentColor(emoji: string | null): string` — returns one of the 6 brand accent colors by hashing the emoji string via djb2 (same logic as avatar color). If null/empty, returns `#0097a9` teal as default.

---

### Task 3 — Server Actions file
**File:** `src/app/node-ifications/actions.ts`

Implement `addAnnouncement`, `deleteAnnouncement`, `addReminder`, `toggleReminderCompletion`, `resolveReminder` per spec. Each calls `revalidatePath('/node-ifications')` on success.

---

### Task 4 — Page RSC with data fetching
**File:** `src/app/node-ifications/page.tsx`

Replace stub. Parallel fetch via `Promise.all`. Compute `openReminderCount`. Use `getISOWeek`/`getISOWeekYear` from `src/lib/week.ts` for mood count query.

---

### Task 5 — NodeificationsHero component
**File:** `src/components/node-ifications/NodeificationsHero.tsx`

Server Component. Date label, h1, subtitle, inverted stat panel. CSS keyframe animations only (`tpBob` on emoji, `tpPulse` on live dot).

---

### Task 6 — Toast component
**File:** `src/components/node-ifications/Toast.tsx`

`AnimatePresence`, `tpToast` variant, `useEffect` auto-dismiss at 3000ms. `useReducedMotion()` guard.

---

### Task 7 — TabToggle component
**File:** `src/components/node-ifications/TabToggle.tsx`

`layoutId="tab-pill"` spring animation. `useReducedMotion()` guard (instant toggle when true).

---

### Task 8 — AddAnnouncementForm component
**File:** `src/components/node-ifications/AddAnnouncementForm.tsx`

Emoji picker + title + body. Wired to `addAnnouncement` Server Action. Nil-nickname guard.

---

### Task 9 — FeaturedAnnouncementCard component
**File:** `src/components/node-ifications/FeaturedAnnouncementCard.tsx`

Gradient bg from `getAnnouncementAccentColor`. CSS `tpSheen` overlay. PINNED badge. Inline-confirm delete (creator-only). `tpFadeUp` entrance.

---

### Task 10 — AnnouncementList component
**File:** `src/components/node-ifications/AnnouncementList.tsx`

`useAutoAnimate` on `ul`. Staggered `tpFadeUp` on initial load. `tpPop` on new optimistic items. Creator-gated delete with inline confirm. Empty state.

---

### Task 11 — AddReminderForm component
**File:** `src/components/node-ifications/AddReminderForm.tsx`

Title + optional due date. Wired to `addReminder` Server Action. `tpPop` on new item via parent `AnimatePresence`.

---

### Task 12 — ReminderList component
**File:** `src/components/node-ifications/ReminderList.tsx`

`useAutoAnimate` on `ul`. Checkbox tick: Framer Motion spring + confetti + row bg transition. Due date chips with past-due red. Creator-gated inline resolve confirm. `submittingIds` guard prevents double-tap. Empty state.

---

### Task 13 — CompletedReminders component
**File:** `src/components/node-ifications/CompletedReminders.tsx`

Collapsed by default. `AnimatePresence` height accordion. Rotating chevron. Untick button. Empty state.

---

### Task 14 — NodeificationsClient component
**File:** `src/components/node-ifications/NodeificationsClient.tsx`

Wire all children. `useOptimistic` for announcements/reminders/completions. Active/completed split. `submittingIds` Set. `AnimatePresence mode="wait"` for tab switch. Featured announcement selection. Toast management. `nickname` from `useNickname()` passed to all children.

---

### Task 15 — Responsive layout pass
**Files:** `NodeificationsClient.tsx`, `NodeificationsHero.tsx`

Apply Section 6 grid/flex rules via Tailwind breakpoint classes.

---

### Task 16 — Integration smoke test

`npx tsc --noEmit` + `npm run lint` pass. Load page in dev server. Verify: hero renders, tabs switch (animated), add announcement works, tick reminder fires confetti, toast appears/dismisses, theme toggle works, mobile layout correct.

---

## Edge Cases & Risks

- **Empty states:** All list components must render their empty states (no announcements, no reminders, nothing done).
- **No nickname:** All mutation forms show "Set a nickname first to post." Add/edit/delete/tick buttons hidden.
- **Race conditions on tick:** `submittingIds` Set prevents a second tap while a completion action is in-flight. Disable checkbox visually during in-flight.
- **Featured card deletion:** After optimistic remove of featured card, recalculate featured from remaining list before action settles; revert if action fails.
- **Authorization spoofing:** Nickname spoofing via localStorage is a known accepted limitation of the identity model. Document in `actions.ts` comment.
- **Realtime:** Not in scope for v1. Users see other users' additions on next navigation. Supabase Realtime can be added in a future iteration.

---

## Files to Create / Modify

**New:**
- `src/app/node-ifications/actions.ts`
- `src/components/node-ifications/NodeificationsHero.tsx`
- `src/components/node-ifications/NodeificationsClient.tsx`
- `src/components/node-ifications/TabToggle.tsx`
- `src/components/node-ifications/FeaturedAnnouncementCard.tsx`
- `src/components/node-ifications/AnnouncementList.tsx`
- `src/components/node-ifications/AddAnnouncementForm.tsx`
- `src/components/node-ifications/ReminderList.tsx`
- `src/components/node-ifications/CompletedReminders.tsx`
- `src/components/node-ifications/AddReminderForm.tsx`
- `src/components/node-ifications/Toast.tsx`

**Modify:**
- `src/app/node-ifications/page.tsx` — replace stub with full RSC
- `src/lib/supabase/types.ts` — add three table shapes
- `src/lib/identity.ts` — add `getAnnouncementAccentColor`
- `src/types/index.ts` — add `AnnouncementRow`, `ReminderRow`, `CompletionRow` type aliases
