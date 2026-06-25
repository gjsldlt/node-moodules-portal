# Node Moodus — CLAUDE.md

> Team hub for FED × GenAI × Mobile devs. Announcements, reminders, weekly mood pulse, shoutouts, and catchup games — all in one animated portal.

---

## Project Overview

**Portal name:** Node Moodus (a play on `node_modules`)

A team portal that acts as a central hub for:
- **Announcements & Reminders** — team-wide broadcasts and tickable to-dos
- **Weekly Mood/Pulse** — anonymous-ish weekly sentiment tracker with visualizations
- **Shaw-rawt (Shoutouts)** — peer-to-peer kudos and recognition
- **Games** — quick games to run during weekly catchups (trivia, quizzes, challenges)
- **Home Dashboard** — overview of all the above with quick-nav links and live icebreaker spinner

No traditional login. Users identify by **nickname**, stored in `localStorage`. Cross-device nickname handoff is handled with a confirmation flow.

---

## Design Reference

**Design files are in `.claude/design-brief/`:**
| File | Page |
|---|---|
| `Node Moodus.html` | Master reference — full interactive prototype |
| `Mood.dc.html` | Weekly Mood/Pulse page |
| `Noode-ifications.dc.html` | Reminders & Announcements page |
| `Shaw-rawt.dc.html` | Shoutouts page |
| `Home.dc.html` | Home dashboard screenshot |
| `*.png` | Visual reference screenshots |

**Always open and read the relevant `.dc.html` file before designing or implementing any page.** These files contain the complete component structure, interaction logic, animation timings, and CSS variable system.

---

## Design System

### Color Palette

All colors must be defined as CSS custom properties and Tailwind tokens. **Never hardcode hex values in components.**

#### CSS Variables (Dark theme — default)
```css
--bg:      #0e0e12   /* Page background */
--card:    #191920   /* Card surface */
--pnl:     #20202a   /* Panel / stat block */
--trk:     #26262e   /* Track / tint bg / icon bg */
--hdr:     rgba(14,14,18,.72)   /* Sticky header (with blur) */
--bd:      rgba(255,255,255,.08) /* Borders */
--tx:      #f3f2ee   /* Text primary */
--txs:     #b8b3a8   /* Text secondary */
--txm:     #7c776e   /* Text muted */
--pnlt:    #f3f2ee   /* Panel text */
--pnls:    #9a958c   /* Panel secondary text */
--shadow:  rgba(0,0,0,.6) /* Box shadow color */
```

#### CSS Variables (Light theme)
```css
--bg:      #f5f4ef
--card:    #ffffff
--pnl:     #16130f
--trk:     #f0efe9
--hdr:     rgba(245,244,239,.72)
--bd:      rgba(20,18,15,.08)
--tx:      #16130f
--txs:     #5c574e
--txm:     #a39e94
--pnlt:    #ffffff
--pnls:    #b9b4a8
--shadow:  rgba(20,18,15,.45)
```

#### Brand / Accent Colors
```
#86bc25   green    — great mood, completions, primary CTA, logo dot 1
#0097a9   teal     — live indicators, secondary CTA, logo dot 2
#62b5e5   sky      — gradients, games banner, link accents
#ed8b00   orange   — meh mood, warnings, logo dot 3
#da291c   red      — rough mood, errors, logo dot 4
#ffcd00   yellow   — okay mood, highlights
#009a44   emerald  — supplemental green
```

These 6 colors are also the **confetti palette** on celebration moments.

### Typography

```
Display face:  Bricolage Grotesque — opsz 12–96, weights 500/600/700/800
               Used for: h1, h2, large numbers, logo wordmark
               Key: font-size clamp(30px,5vw,46px), line-height 1.04, letter-spacing -.025em

Body face:     Hanken Grotesk — weights 400/500/600/700/800
               Used for: all body text, labels, buttons, inputs
```

Google Fonts import:
```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

### Spacing & Shape

| Token | Value | Usage |
|---|---|---|
| Card radius | 26px | All card surfaces |
| Button (pill) | 999px | Nav active pill, CTA buttons |
| Input radius | 14–15px | Text inputs |
| Icon bg radius | 12–15px | Emoji/icon containers |
| Avatar radius | 50% | User avatars |
| Card padding | 24px | Standard card interior |
| Card shadow | `0 22px 46px -32px var(--shadow)` | Standard card |
| Panel shadow | `0 22px 44px -26px var(--shadow)` | Hero stat panels |

### Logo Mark
4 overlapping circles in a 38×38px cluster:
- `#86bc25` — 18px, top-left (static)
- `#0097a9` — 15px, top-right (bobs)
- `#ed8b00` — 16px, bottom-center (bobs, offset)
- `#da291c` — 12px, bottom-right (static)

---

## Animation System

All animations live in Framer Motion (component-level) and CSS keyframes (ambient/background). Use the Framer Motion variants below for implementation; match the timings exactly to the design reference.

### Named Keyframes (from design reference)

| Name | Duration | Use |
|---|---|---|
| `tpFloat` | 19–27s infinite ease-in-out | Ambient background orbs |
| `tpFadeUp` | 0.6s cubic-bezier(.2,.7,.3,1) | Section/card page entrance |
| `tpPop` | 0.45s cubic-bezier(.2,.8,.3,1.3) | Element pop-in (submitted state, toast) |
| `tpWave` | 2.6s ease-in-out 1s infinite | Waving hand emoji |
| `tpBob` | 3–3.4s ease-in-out infinite | Logo dots, emoji float |
| `tpPulse` | 2s ease-out infinite | Live indicator dot ring |
| `tpSheen` | 5.5s ease-in-out 1s infinite | Shimmer pass on featured card |
| `tpSpin` | 0.6s cubic-bezier(.3,.9,.3,1) | Spin-on-click (dice, refresh) |
| `tpToast` | 0.35s cubic-bezier(.2,.8,.3,1.2) | Toast notification entrance |
| `tpGrowX` | transition .6s cubic-bezier(.2,.7,.3,1) | Progress bar fill |
| `tpWordIn` | scale .6→1 | Word tag entrance on mood submit |

### Framer Motion Conventions

```tsx
// Page section entrance — stagger children
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 22, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.2, 0.7, 0.3, 1] } }
}

// Pop-in (submitted state, dialog entrance)
const popVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.2, 0.8, 0.3, 1.3] } }
}
```

**Reduced motion:** every animated component must check `useReducedMotion()` and disable or soften animation. This is non-negotiable.

### Motion Toolkit

| Need | Library |
|---|---|
| Component enter/exit, layout, gestures | Framer Motion (default for everything) |
| Scroll-driven reveals | Framer Motion scroll hooks; GSAP ScrollTrigger for complex sequences |
| Smooth scrolling | Lenis |
| List add/remove/reorder | `@formkit/auto-animate` |
| Celebration moments (mood submit, reminder complete, game win) | `canvas-confetti` with palette `#86bc25 #0097a9 #62b5e5 #da291c #ed8b00 #ffcd00` |
| Success/empty states | `lottie-react` |
| Ambient background blobs | CSS keyframes (`tpFloat`) — not JS |

**Default toolkit per page:** Framer Motion + Auto-Animate + Lenis. Reach for GSAP/Lottie only when a surface specifically justifies it.

---

## Design Principles

The audience is a team of **front-end and mobile developers** — they will notice everything. Design must be:

- **Motion-forward but purposeful.** Every state change, list mutation, and route transition should animate. Nothing moves for decoration alone — motion must guide attention or signal state.
- **Eye-catching at first glance.** Strong typographic hierarchy (`Bricolage Grotesque` for display, `Hanken Grotesk` for body). One bold signature element per page (e.g., the ambient background orbs, the confetti burst, the live pulse dot).
- **Device-agnostic / mobile-first.** Tap targets ≥ 44px. Gesture-first. Fluid layouts with `clamp()`. The team uses phones and desktops equally — neither is second-class.
- **Dark by default, light supported.** All colors via CSS variables. Theme toggle persisted in `localStorage` under `tp_theme`.
- **Attention-retaining.** Scroll-triggered reveals, micro-interactions on hover/tap, celebratory confetti at key moments.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animation | Framer Motion (primary), Lenis, canvas-confetti |
| Database | Supabase (Postgres + RLS) |
| Realtime | Supabase Realtime (games, live pulse count) |
| Auth | None — nickname-based identity |
| Icons | Lucide React |
| Charts/Viz | Recharts or Nivo (mood trend chart) |

**Default to Server Components.** Add `"use client"` only for interactivity, browser APIs, or animation libraries.

---

## User Identity System

### localStorage Keys
| Key | Value |
|---|---|
| `tp_nickname` | String — current user's nickname |
| `tp_theme` | `'dark'` or `'light'` |
| `tp_mood_<nick>` | `{ key, word }` — this week's mood submission |
| `tp_rem_<nick>` | `{ [reminderId]: boolean }` — reminder tick state |
| `tp_team_dist` | `{ dist, base }` — cached team mood distribution |
| `tp_known_users` | Array of `{ nickname, color, emoji }` |

### Nickname Identity Flow

**First visit (no `tp_nickname` in localStorage):**
1. Show onboarding overlay (full-screen, blurred backdrop, `tpPop` entrance)
2. Step 1 — Enter nickname (min 2 chars). On submit:
   - Check Supabase `users` table for existing nickname (case-insensitive)
   - **Not found** → create user, save to localStorage, show confetti + toast "You're in, [name]! [emoji]"
   - **Found** → go to Step 2
3. Step 2 — Confirmation: "Wait — is this you?" Show the existing user's avatar + nickname
   - **Yes** → load user data, save to localStorage, toast "Welcome back, [name]!"
   - **No** → back to Step 1 with error "That name's taken — pick another?"

**Returning visit (same device):** Read `tp_nickname` from localStorage silently. No prompt.

**Switch user:** "⇄" button in header clears `tp_nickname` and shows onboarding overlay again.

### Avatar Generation
Each nickname gets a deterministic color and emoji via a hash function:
```
PALETTE = ['#86bc25','#0097a9','#62b5e5','#da291c','#ed8b00','#009a44']
EMOJIS  = ['🦊','🐼','🐯','🦄','🐙','🐵','🦁','🐨','🐸','🐳','🦉','🐝']
color   = PALETTE[hash(nickname) % 6]
emoji   = EMOJIS[hash(nickname) % 12]
```

---

## Pages

### 1. Home (`/`)
Reference: `Node Moodus.html`, screenshots `01-dash.png`, `02-dash.png`

- **Header:** sticky, blurred glass (`backdrop-filter: blur(14px)`), contains logo, nav pill (active = filled pill), theme toggle, user avatar chip with switch button
- **Hero section:** date label (`#86bc25`, uppercase), greeting h1 with waving hand emoji, team check-in stat panel (dark on light, light on dark — inverted)
- **Announcements card** (flex 1.7): featured announcement with sheen shimmer, list below with emoji icons
- **Mood check-in card** (flex 1): emoji mood buttons + optional word input, or submitted state with bob animation
- **Reminders card:** tickable list with accent-colored checkboxes
- **Team Pulse card:** live average score, emoji distribution bars, 6-week trend mini-chart
- **Icebreaker banner:** teal-to-sky gradient, spin-again button with dice emoji, dev-culture questions
- **Quick links grid:** auto-fit cards (min 230px) to all sections, `tpFadeUp` with staggered delay

### 2. Reminders & Announcements (`/reminders`)
Reference: `Noode-ifications.dc.html`, screenshots `02-noode.png`

- Two tabs: **Announcements** and **Reminders**
- Any team member can add (no admin gate)
- Reminders: per-user tick stored in `tp_rem_<nick>` / Supabase `reminder_completions`
- Tick animation: spring scale + checkmark draw; confetti on completing a reminder
- Announcements support emoji + short markdown-lite body text
- Featured announcement slot with sheen shimmer

### 3. Weekly Mood/Pulse (`/mood`)
Reference: `Mood.dc.html`, screenshots `mood.png`, `mood2.png`

- One submission per user per ISO week (keyed by `week_number + year`)
- **Mood scale:** 5 emoji buttons — 😄 Great (5, `#86bc25`), 🙂 Good (4, `#0097a9`), 😐 Okay (3, `#ffcd00`), 😕 Meh (2, `#ed8b00`), 😣 Rough (1, `#da291c`)
- Optional word/note input
- Submit → confetti + toast + transition to submitted state (`tpPop`)
- Team results: emoji distribution bars with `tpGrowX`, average score in `Bricolage Grotesque` 42px, 6-week trend bars
- Allow editing within the same week

### 4. Shaw-rawt (`/shawrawt`)
Reference: `Shaw-rawt.dc.html`, screenshots `01-shaw.png`, `02-shaw.png`

- Peer-to-peer shoutouts / kudos
- Any member can give a shoutout to another teammate with a message and emoji tag
- Shoutouts displayed as a card feed with animated entrance
- Reaction support (emoji reactions from teammates)
- Leaderboard / "most appreciated" view

### 5. Games (`/games`)
- Game cards grid with available game types
- **Game types to scaffold:** Trivia Quiz, Emoji Guessing, Quick Poll/Vote
- Persistent leaderboard ranked by points, animated rank changes
- Suggest-a-game flow
- Real-time sessions via Supabase Realtime
- Celebration confetti + sound on correct answer / win

---

## Database Schema (Supabase)

### `users`
| column | type | notes |
|---|---|---|
| id | uuid PK | auto-generated |
| nickname | text UNIQUE | case-insensitive unique |
| avatar_color | text | hex from PALETTE |
| avatar_emoji | text | from EMOJIS array |
| created_at | timestamptz | |
| last_seen_at | timestamptz | updated on each session |

### `announcements`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| title | text | |
| body | text | |
| emoji | text | |
| created_by | text | FK → users.nickname |
| pinned | boolean | default false |
| created_at | timestamptz | |

### `reminders`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| title | text | |
| created_by | text | FK → users.nickname |
| resolved | boolean | creator can mark resolved |
| due_date | date | optional |
| created_at | timestamptz | |

### `reminder_completions`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| reminder_id | uuid | FK → reminders.id |
| nickname | text | FK → users.nickname |
| completed_at | timestamptz | |
| UNIQUE | (reminder_id, nickname) | one tick per user per reminder |

### `mood_submissions`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| nickname | text | FK → users.nickname |
| week_number | int | ISO week (1–53) |
| year | int | |
| score | int | 1–5 |
| mood_key | text | great/good/okay/meh/rough |
| note | text | optional |
| public_name | boolean | show nickname on team view? |
| submitted_at | timestamptz | |
| UNIQUE | (nickname, week_number, year) | one per user per week |

### `shoutouts`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| from_nickname | text | FK → users.nickname |
| to_nickname | text | FK → users.nickname |
| message | text | |
| tag | text | emoji tag label (e.g. "🔥 Crushing it") |
| created_at | timestamptz | |

### `shoutout_reactions`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| shoutout_id | uuid | FK → shoutouts.id |
| nickname | text | FK → users.nickname |
| emoji | text | |
| UNIQUE | (shoutout_id, nickname, emoji) | |

### `games`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| description | text | |
| type | text | trivia / poll / emoji_guess |
| suggested_by | text | FK → users.nickname |
| active | boolean | |
| created_at | timestamptz | |

### `game_scores`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| game_id | uuid | FK → games.id |
| nickname | text | FK → users.nickname |
| score | int | |
| played_at | timestamptz | |

### RLS Policies
- All tables: `SELECT` is open (anon role).
- `INSERT`/`UPDATE`: server-side validation in Next.js Server Actions only. The `nickname` in the request must match `tp_nickname` in the session. **Never rely on client-side checks for authorization.**
- Never expose the Supabase service role key to the browser.

---

## Project Structure

```
src/
  app/
    layout.tsx             # Root layout: Lenis, NicknameGate, theme provider
    page.tsx               # Home dashboard
    reminders/page.tsx
    mood/page.tsx
    shawrawt/page.tsx
    games/
      page.tsx
      [id]/page.tsx        # Individual game session
  components/
    ui/                    # shadcn/ui primitives (do not modify)
    layout/
      Header.tsx           # Sticky nav header with avatar chip
      NicknameGate.tsx     # Onboarding overlay (steps: name → confirm)
      AmbientBackground.tsx # Fixed floating orbs (CSS animation, no JS)
      ThemeProvider.tsx    # CSS variable switcher
    home/
    reminders/
    mood/
    shawrawt/
    games/
    motion/
      FadeUp.tsx           # Wrapper: Framer Motion tpFadeUp variant
      PopIn.tsx            # Wrapper: tpPop variant
      ReducedMotionProvider.tsx
  lib/
    supabase/
      client.ts            # Browser client (anon key only)
      server.ts            # Server client (service role, server-only)
      types.ts             # Generated DB types (npx supabase gen types)
    identity.ts            # localStorage read/write, hash fn, avatar gen
    week.ts                # ISO week number utils
    utils.ts               # cn(), clamp helpers
  hooks/
    useNickname.ts         # Current user from localStorage + context
    useMoodWeek.ts         # Current week's mood state
    useTheme.ts            # Dark/light toggle, persisted
  types/
    index.ts               # Shared TS interfaces
```

---

## Agent Workflow

Always follow this sequence:

1. **Architect** (`/architect`) — plan the feature, produce a spec with motion, responsive, and RLS details. No code written here.
2. **Developer** (`/developer`) — implement from spec, task by task.
3. **Reviewer** (`/code-review`) — review the diff; developer resolves each flagged item.

**Never skip the architect step** for anything spanning more than one file or component.

When starting a new page or feature, the architect agent must read the relevant `.dc.html` design file first.

---

## Development Commands

```bash
npm install
npm run dev                        # Next.js dev server

npx tsc --noEmit                   # Type check
npm run lint                       # ESLint

# Supabase
npx supabase start                 # Local Supabase stack
npx supabase db reset              # Reset + reseed
npx supabase gen types typescript --local > src/lib/supabase/types.ts
```

---

## Conventions

- **No hardcoded colors.** All palette values in `tailwind.config.ts` and CSS custom properties in `globals.css`.
- **No `any`.** Use generated Supabase types; derive from them rather than restating.
- **Mobile-first Tailwind.** Write base styles for mobile, use `sm:`/`md:`/`lg:` for larger.
- **Server Components by default.** `"use client"` is the exception.
- **Every animation needs a `prefers-reduced-motion` fallback** via `useReducedMotion()` from Framer Motion.
- **Nickname is the user identity.** Never build a flow that requires email or password.
- **Mutations via Server Actions only.** Never expose the service role key to the client.
- **Comments only when the WHY is non-obvious.**
- **Design files are the source of truth for UI.** Before implementing any component, open the corresponding `.dc.html` file and match it exactly — spacing, radius, shadow, animation timing.
