# Iteration 4 — Games Library

## Goal
Replace the `/games` `UnderConstruction` placeholder with a real page: a game library grid plus a fully interactive **Wheel of Names** as the default, always-visible feature.

---

## Page Layout

```
/games
├── Hero section  (page title, subtitle, live member count)
├── Wheel of Names widget  (featured — always visible)
│   ├── WheelCanvas         (canvas spin animation)
│   └── ParticipantSidebar  (list with remove / restore controls)
└── Game Library grid
    ├── GameCard × N  (future games — "coming soon" state)
    └── SuggestGameCard
```

**Desktop (≥ md):** Wheel widget is split side-by-side — canvas (flex 2) left, participants (flex 1) right.
**Mobile:** Canvas on top, participants collapsible list below (default collapsed; tap to expand).

---

## Wheel of Names

### Behaviour

1. **Load:** fetch all rows from `users` table (nickname + avatar_color + avatar_emoji). This becomes the initial participant pool.
2. **Participant list:** every registered user appears as an avatar chip with a `✕` remove button. Removed participants are shown greyed-out with a `↩` restore button.
3. **Spin:** clicking "Spin" randomly selects one name from the **active** pool (participants minus excluded). The wheel animates with multiple full rotations before settling on the winner segment.
4. **Winner reveal:** a `WinnerModal` pops in (`tpPop`) with confetti burst. Shows the winner's avatar + nickname. Two actions:
   - **"Exclude from next spin"** — adds winner to the excluded set; closes modal.
   - **"Keep in pool"** — just closes modal.
5. **Reset pool:** a "Reset all" button (bottom of participant sidebar) clears the excluded set and restores all removed participants.

### State (inside `WheelOfNames`)

```ts
type WheelState = {
  participants: User[]          // full list from server
  removed: Set<string>          // nicknames manually removed before spin
  excluded: Set<string>         // nicknames excluded after winning
  isSpinning: boolean
  winner: User | null
}

// Active pool = participants where !removed.has(n) && !excluded.has(n)
```

> `removed` = user-initiated hide (before any spin).  
> `excluded` = post-win automatic exclusion.  
> Keeping them separate lets "Reset all" clearly mean "restore everyone."

### Spin algorithm

```ts
function pickWinner(activePool: User[], targetRotation: number): User {
  // 1. Pick a random index
  const idx = Math.floor(Math.random() * activePool.length)
  // 2. Compute final rotation so the winning segment lands at top-dead-center
  // 3. Store in ref so WheelCanvas animates to that angle
  return activePool[idx]
}
```

The canvas animates the wheel to `baseRotation + 5–8 full spins + winnerOffset` using `requestAnimationFrame` with an ease-out curve (cubic `t => 1 - (1-t)^3`). Duration: **3.5 s**. On `prefers-reduced-motion`, skip animation and just flash the result immediately (200 ms fade-in).

---

## WheelCanvas

- `<canvas>` element, sized `min(parent-width, 360px)` square, auto-redrawn on resize via `ResizeObserver`.
- Draws N pie segments, cycling through brand accent colors: `['#86bc25','#0097a9','#62b5e5','#da291c','#ed8b00','#ffcd00','#009a44']`.
- Each segment shows the user's avatar emoji in the center of the arc + truncated nickname along the arc edge.
- A fixed pointer/needle SVG sits above the canvas at 12 o'clock (not part of the canvas — positioned with CSS `absolute`).
- Spin state is driven by a `rotation` ref updated each rAF tick; the canvas redraws on every tick.

---

## Component Tree

```
src/components/games/
├── GamesLibraryPage.tsx      "use client" — root client wrapper, owns WheelState
├── GamesHero.tsx              server-safe, static
├── WheelOfNames.tsx          "use client" — layout shell (side-by-side / stacked)
├── WheelCanvas.tsx           "use client" — canvas draw + spin rAF loop
├── ParticipantSidebar.tsx    "use client" — list, remove/restore, reset
├── WinnerModal.tsx           "use client" — AnimatePresence overlay + confetti
├── GameCard.tsx               server-safe, static card
└── SuggestGameCard.tsx        static CTA card
```

`src/app/games/page.tsx` → Server Component. Fetches `users` from Supabase, passes as `initialUsers` prop to `GamesLibraryPage`.

---

## Data Fetching

```ts
// src/app/games/page.tsx  (Server Component)
import { createServerClient } from '@/lib/supabase/server'
import GamesLibraryPage from '@/components/games/GamesLibraryPage'

export default async function GamesPage() {
  const supabase = createServerClient()
  const { data: users } = await supabase
    .from('users')
    .select('nickname, avatar_color, avatar_emoji')
    .order('created_at', { ascending: true })

  return <GamesLibraryPage initialUsers={users ?? []} />
}
```

No real-time subscription needed for the wheel (member list doesn't need live updates during a spin session).

---

## Game Library Cards

Each `GameCard` gets:
- `title`, `description`, `emoji`, `comingSoon: boolean`
- A teal "Live" dot when `!comingSoon`; a grey "Soon" badge when `comingSoon`
- `tpFadeUp` entrance with stagger via Framer Motion

**Initial cards:**
| Emoji | Title | Status |
|---|---|---|
| 🎡 | Wheel of Names | Live (links to wheel widget above via scroll) |
| 🧠 | Trivia Quiz | Coming soon |
| 🤔 | Emoji Guessing | Coming soon |
| 🗳️ | Quick Poll | Coming soon |

The grid uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`, `gap-4`, `auto-rows-fr`.

---

## Animation Checklist

| Moment | Animation |
|---|---|
| Page entrance | `tpFadeUp` stagger on hero + wheel widget + game cards |
| Wheel spinning | rAF ease-out rotation, 3.5 s, no Framer Motion (canvas) |
| Winner reveal | `tpPop` via Framer Motion (`AnimatePresence`) |
| Confetti | `canvas-confetti` with brand palette |
| Participant remove/restore | `@formkit/auto-animate` on the list container |
| Reduced motion | Skip wheel animation, skip card stagger, instant winner reveal |

---

## Accessibility

- `<canvas>` gets `role="img"` and `aria-label="Spinning wheel with N participants"`, updated before spin.
- Spin button is a `<button>` (not `<div>`); disabled + `aria-busy="true"` while spinning.
- Winner modal is a proper `role="dialog"` with `aria-modal="true"` and focus trap.
- Participant list items: remove button has `aria-label="Remove [nickname] from wheel"`.

---

## Files to Create / Modify

| File | Action |
|---|---|
| `src/app/games/page.tsx` | Rewrite — server component, fetch users, render `GamesLibraryPage` |
| `src/components/games/GamesLibraryPage.tsx` | Create |
| `src/components/games/GamesHero.tsx` | Create |
| `src/components/games/WheelOfNames.tsx` | Create |
| `src/components/games/WheelCanvas.tsx` | Create |
| `src/components/games/ParticipantSidebar.tsx` | Create |
| `src/components/games/WinnerModal.tsx` | Create |
| `src/components/games/GameCard.tsx` | Create |
| `src/components/games/SuggestGameCard.tsx` | Create |

No new Supabase tables or migrations needed for this iteration. The existing `users` table supplies the member list.

---

## Out of Scope (future iterations)

- Real-time updates to the participant pool during a session
- Persisting "spin history" to Supabase
- Individual game session pages (`/games/[id]`)
- Sound effects on spin / winner reveal
- Suggest-a-game form (card is static CTA for now)
