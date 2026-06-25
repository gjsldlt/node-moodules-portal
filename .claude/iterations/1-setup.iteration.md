# Iteration 1: Project Setup — Developer Spec

## Summary

Bootstrap the Node Moodus portal from a bare repository (only `.gitignore`, `LICENSE`, `README.md`, and `.claude/`) into a fully runnable Next.js 15 App Router application. This iteration produces no user-visible features — its output is the complete structural foundation: package installation, design system tokens, all route stubs, localStorage utilities, admin auth plumbing, root layout scaffolding, and Supabase client wiring. Every subsequent iteration assumes this foundation exists.

---

## Assumptions & Open Questions

- The project uses `npm` (the `.gitignore` already has `/node_modules`). No Yarn or pnpm.
- Next.js 15 ships with Turbopack as the default dev bundler. The spec assumes `--turbopack` in `dev`. If the team has a Turbopack-incompatible plugin, fall back to `next dev` without it.
- Tailwind CSS v4 uses the `@tailwindcss/postcss` plugin and `@import "tailwindcss"` in CSS (no `tailwind.config.ts` required, but a config file is still produced for extending theme tokens). Confirm Tailwind v4 is stable/available at install time — if not, fall back to v3.4 (adjust accordingly).
- shadcn/ui's CLI targets Tailwind v4 in its `canary` path. Use `npx shadcn@canary init` if Tailwind v4 support is not yet in the stable release. The developer must verify this at the time of setup.
- `@supabase/ssr` replaces `@supabase/auth-helpers-nextjs`. Use `@supabase/ssr` throughout.
- Admin auth uses a single shared password — no per-user admin accounts. This is intentional and appropriate for an internal team tool with a small, trusted audience.
- ⚠️ The admin cookie token value: the spec uses a signed/hashed comparison (not raw password storage in the cookie). See Admin Auth section for the contract.
- Lenis v1.x (the standalone `lenis` package, not the GSAP plugin version). Confirm the package name at install time — it was briefly published as `@studio-freight/lenis` and later as `lenis`.
- `canvas-confetti` types are in `@types/canvas-confetti`. Include it as a dev dependency.
- The `NEXT_PUBLIC_` prefix on Supabase URL and anon key is intentional and correct — these are safe to expose to the browser. The service role key must never have the `NEXT_PUBLIC_` prefix.
- ⚠️ Supabase project does not exist yet. The developer must create one (or use the existing one if already provisioned) and obtain the three env var values before running the app. The schema migration is a separate iteration.

---

## Component Architecture

### Route Tree

```
src/app/
  layout.tsx                   # Root layout (Server Component shell)
  page.tsx                     # / — Home dashboard stub
  node-ifications/
    page.tsx                   # /node-ifications stub
  moood/
    page.tsx                   # /moood stub
  shawrawt/
    page.tsx                   # /shawrawt stub
  games/
    page.tsx                   # /games stub
    [id]/
      page.tsx                 # /games/[id] stub
  admin/
    layout.tsx                 # Admin layout (Server Component — verifies cookie)
    page.tsx                   # /admin stub
    login/
      page.tsx                 # /admin/login — login form
```

### Component Tree

All components are Server Components by default. Client Components are isolated to the smallest possible leaf.

```
RootLayout (SC)
  ThemeScript (inline <script> — runs before paint, no flash)
  ThemeProvider (CC — "use client", reads/writes tp_theme, applies data-theme)
  LenisProvider (CC — "use client", wraps children with smooth scroll)
  AmbientBackground (SC — renders fixed-position div, pure CSS animation)
  NicknameGate (CC — "use client", reads tp_nickname, renders modal or children)
    Header (CC — "use client", reads nickname/theme from context)
    {children}
```

The `ThemeScript` is a tiny inline `<script>` tag injected into `<head>` (not a React component with `"use client"`) — it reads `localStorage.tp_theme` synchronously and sets `document.documentElement.dataset.theme` before React hydrates. This eliminates the flash of wrong theme on first paint.

### Admin Layout

```
AdminLayout (SC)
  reads cookies() — if tp_admin_token absent/invalid, redirect to /admin/login
  {children}
```

The admin login page is a plain Server Component with a `<form>` that submits to a Server Action. No JavaScript required for the basic flow.

---

## Package Installation

### Exact install commands (run in order)

**Step 1 — Scaffold Next.js**
```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --no-import-alias \
  --turbopack
```

This produces `src/app/`, `tsconfig.json` (strict defaults), `.eslintrc.json`, `postcss.config.mjs`, `tailwind.config.ts`, and the initial `globals.css`.

**Step 2 — Initialize shadcn/ui**
```bash
npx shadcn@latest init
```
When prompted: style = Default, base color = Neutral, CSS variables = yes. This adds `src/components/ui/` and updates `globals.css` and `tailwind.config.ts`.

**Step 3 — Runtime dependencies**
```bash
npm install \
  framer-motion \
  lenis \
  @formkit/auto-animate \
  canvas-confetti \
  lottie-react \
  @supabase/supabase-js \
  @supabase/ssr \
  lucide-react \
  recharts \
  server-only
```

Justifications:
- `framer-motion` — primary animation library for all component-level transitions
- `lenis` — smooth/inertia scrolling wrapper for the root layout
- `@formkit/auto-animate` — zero-config list mutations (reminders, shoutout feed)
- `canvas-confetti` — celebration moments on mood submit, reminder completion, game wins
- `lottie-react` — designer-authored animations for success/empty states
- `@supabase/supabase-js` — Supabase data client
- `@supabase/ssr` — Next.js SSR-aware Supabase client (replaces deprecated auth-helpers)
- `lucide-react` — icon library (tree-shakeable, consistent with shadcn/ui)
- `recharts` — mood trend chart (SVG-based, composable, React-native)
- `server-only` — import guard that throws at build time if a server-only module is imported on the client

**Step 4 — Dev dependencies**
```bash
npm install -D @types/canvas-confetti
```

---

## Global CSS / Design System

### File: `src/app/globals.css`

The developer must replace the shadcn-generated `globals.css` entirely with the design system. Structure:

**1. Font import**
```css
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap');
```

**2. Tailwind directives** (Tailwind v4 syntax)
```css
@import "tailwindcss";
```

**3. CSS custom properties — dark theme (default, applied to `:root` and `[data-theme="dark"]`)**

| Property | Value |
|---|---|
| `--bg` | `#0e0e12` |
| `--card` | `#191920` |
| `--pnl` | `#20202a` |
| `--trk` | `#26262e` |
| `--hdr` | `rgba(14,14,18,.72)` |
| `--bd` | `rgba(255,255,255,.08)` |
| `--tx` | `#f3f2ee` |
| `--txs` | `#b8b3a8` |
| `--txm` | `#7c776e` |
| `--pnlt` | `#f3f2ee` |
| `--pnls` | `#9a958c` |
| `--shadow` | `rgba(0,0,0,.6)` |

**4. CSS custom properties — light theme (applied to `[data-theme="light"]`)**

| Property | Value |
|---|---|
| `--bg` | `#f5f4ef` |
| `--card` | `#ffffff` |
| `--pnl` | `#16130f` |
| `--trk` | `#f0efe9` |
| `--hdr` | `rgba(245,244,239,.72)` |
| `--bd` | `rgba(20,18,15,.08)` |
| `--tx` | `#16130f` |
| `--txs` | `#5c574e` |
| `--txm` | `#a39e94` |
| `--pnlt` | `#ffffff` |
| `--pnls` | `#b9b4a8` |
| `--shadow` | `rgba(20,18,15,.45)` |

**5. Brand/accent colors as CSS properties (on `:root`, theme-invariant)**

| Property | Value |
|---|---|
| `--green` | `#86bc25` |
| `--teal` | `#0097a9` |
| `--sky` | `#62b5e5` |
| `--orange` | `#ed8b00` |
| `--red` | `#da291c` |
| `--yellow` | `#ffcd00` |
| `--emerald` | `#009a44` |

**6. Global resets and base styles**
```css
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--bg);
  color: var(--tx);
  font-family: 'Hanken Grotesk', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  transition: background 0.4s ease, color 0.4s ease;
}
input { font-family: inherit; }
input::placeholder { color: var(--txm); }
```

**7. Named keyframes — exact timings from design reference**

| Keyframe | Spec |
|---|---|
| `tpFloat` | `0%,100% { transform: translate(0,0) scale(1) } 33% { transform: translate(34px,-26px) scale(1.06) } 66% { transform: translate(-22px,20px) scale(.96) }` |
| `tpFadeUp` | `from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: none }` |
| `tpPop` | `from { opacity: 0; transform: scale(.85) } to { opacity: 1; transform: scale(1) }` |
| `tpWave` | `0%,60%,100% { transform: rotate(0) } 10% { transform: rotate(16deg) } 20% { transform: rotate(-10deg) } 30% { transform: rotate(16deg) } 40% { transform: rotate(-6deg) } 50% { transform: rotate(10deg) }` |
| `tpBob` | `0%,100% { transform: translateY(0) } 50% { transform: translateY(-7px) }` |
| `tpPulse` | `0% { transform: scale(.7); opacity: .7 } 70%,100% { transform: scale(2.4); opacity: 0 }` |
| `tpToast` | `from { opacity: 0; transform: translate(-50%,24px) } to { opacity: 1; transform: translate(-50%,0) }` |
| `tpSpin` | `from { transform: rotate(0) } to { transform: rotate(360deg) }` |
| `tpSheen` | `0% { transform: translateX(-120%) } 60%,100% { transform: translateX(220%) }` |
| `tpGrowX` | `from { transform: scaleX(0) } to { transform: scaleX(1) }` |
| `tpGrowY` | `from { transform: scaleY(0) } to { transform: scaleY(1) }` |

**8. Reduced motion overrides**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### File: `tailwind.config.ts`

Extend the Tailwind theme to map CSS variables as Tailwind color tokens, and add the typography families as Tailwind font families. This enables using `text-tx`, `bg-card`, `font-display`, etc. in JSX without hardcoding values.

```
theme.extend.colors:
  bg: "var(--bg)"
  card: "var(--card)"
  pnl: "var(--pnl)"
  trk: "var(--trk)"
  bd: "var(--bd)"
  tx: "var(--tx)"
  txs: "var(--txs)"
  txm: "var(--txm)"
  pnlt: "var(--pnlt)"
  pnls: "var(--pnls)"
  green: "var(--green)"
  teal: "var(--teal)"
  sky-brand: "var(--sky)"       # avoid collision with Tailwind's built-in 'sky'
  orange: "var(--orange)"
  red-brand: "var(--red)"       # avoid collision with 'red'
  yellow-brand: "var(--yellow)"
  emerald-brand: "var(--emerald)"

theme.extend.fontFamily:
  display: ["Bricolage Grotesque", "sans-serif"]
  body: ["Hanken Grotesk", "system-ui", "sans-serif"]

theme.extend.borderRadius:
  card: "26px"
  pill: "999px"
  icon: "14px"
```

---

## localStorage Utilities

### File: `src/lib/storage.ts`

All localStorage keys as string constants. Type-safe generic helpers with SSR guard.

**Key constants:**
```
STORAGE_KEYS = {
  NICKNAME:     'tp_nickname',
  THEME:        'tp_theme',
  MOOD:         (nick: string) => `tp_mood_${nick}`,
  REMINDERS:    (nick: string) => `tp_rem_${nick}`,
  TEAM_DIST:    'tp_team_dist',
  KNOWN_USERS:  'tp_known_users',
}
```

Note: `tp_admin_token` is intentionally absent — the admin token lives in an httpOnly cookie, never in localStorage.

**Helper signatures:**
```
storageGet<T>(key: string): T | null
  — returns null on SSR or if key absent; parses JSON

storageSet<T>(key: string, value: T): void
  — no-op on SSR; serializes JSON

storageRemove(key: string): void
  — no-op on SSR

storageClear(): void
  — clears all tp_* keys (used on user switch)
```

### File: `src/lib/identity.ts`

Avatar generation and nickname helpers.

**Constants:**
```
AVATAR_PALETTE = ['#86bc25','#0097a9','#62b5e5','#da291c','#ed8b00','#009a44']
AVATAR_EMOJIS  = ['🦊','🐼','🐯','🦄','🐙','🐵','🦁','🐨','🐸','🐳','🦉','🐝']
```

**Function signatures:**
```
hashNickname(nickname: string): number
  — deterministic hash (djb2), returns a non-negative integer

getAvatarColor(nickname: string): string
  — AVATAR_PALETTE[hashNickname(nickname) % 6]

getAvatarEmoji(nickname: string): string
  — AVATAR_EMOJIS[hashNickname(nickname) % 12]

getAvatar(nickname: string): { color: string; emoji: string }

normalizeNickname(nickname: string): string
  — lowercase + trim, for case-insensitive comparison
```

### File: `src/lib/week.ts`

ISO week number utilities — plain arithmetic, no external date library.

**Function signatures:**
```
getISOWeek(date?: Date): { week: number; year: number }
  — returns ISO week number (1–53) and the ISO week-year

getMoodWeekKey(nickname: string, date?: Date): string
  — returns `${nickname}_${year}_W${week}`
```

### File: `src/types/index.ts`

```typescript
interface LocalUser {
  nickname: string
  color: string
  emoji: string
}

interface LocalMoodEntry {
  key: 'great' | 'good' | 'okay' | 'meh' | 'rough'
  word: string | null
  week: number
  year: number
}

type LocalReminderState = Record<string, boolean>   // reminderId → ticked

interface LocalTeamDist {
  dist: Record<string, number>   // mood key → count
  base: number                   // week number this was fetched for
}
```

---

## Admin Auth

### Contract

- `ADMIN_PASSWORD` — checked only in the Server Action, never leaves the server
- `ADMIN_SESSION_TOKEN` — a static random string (generate once, store in env); set as the cookie value on login, compared by middleware

On successful login, the Server Action:
1. Compares submitted password with `process.env.ADMIN_PASSWORD` using Node's `crypto.timingSafeEqual`.
2. If valid, sets `process.env.ADMIN_SESSION_TOKEN` as the value of an httpOnly, Secure, SameSite=Strict cookie named `tp_admin_token` with a 24-hour max age.
3. Redirects to `/admin`.

Middleware and admin layout compare the cookie value to `process.env.ADMIN_SESSION_TOKEN` — no crypto needed in those layers.

### Files involved in admin auth

| File | Role |
|---|---|
| `src/middleware.ts` | Edge-compatible route guard — string cookie comparison only |
| `src/app/admin/login/page.tsx` | Server Component, renders login form |
| `src/app/admin/login/actions.ts` | Server Action: `loginAdmin(formData)` |
| `src/app/admin/layout.tsx` | Server layout: re-verifies cookie, redirects if invalid |
| `src/app/admin/page.tsx` | Admin dashboard stub |

The login form submits to `actions.ts` via `action={loginAdmin}`. No client-side JavaScript required for the basic flow.

---

## Root Layout

### File: `src/app/layout.tsx` (Server Component)

1. Sets `<html lang="en">` — no `data-theme` server-side (the `ThemeScript` inline script handles it).
2. Includes Google Fonts `<link>` preconnect tags in `<head>`.
3. Inserts the `ThemeScript` inline `<script>` as the first child of `<body>` — before React rendering.
4. Wraps children in `LenisProvider` → `ThemeProvider` → `NicknameGate`.
5. Renders `AmbientBackground` as a fixed background layer.
6. Renders `Header`.

**ThemeScript content** (render as `<script dangerouslySetInnerHTML>` — must execute before paint):
```js
(function(){
  try {
    var t = localStorage.getItem('tp_theme');
    document.documentElement.dataset.theme = (t === 'light') ? 'light' : 'dark';
  } catch(e) {}
})();
```

Do NOT use Next.js `<Script strategy="lazyOnload">` for this — it must be blocking.

### File: `src/components/layout/AmbientBackground.tsx` (Server Component)

Fixed-position `<div aria-hidden="true">` with `pointer-events: none; z-index: 0; overflow: hidden` containing three orb divs. Pure CSS `tpFloat` animation — no JavaScript.

| Orb | Position | Size | Color | Opacity | Duration |
|---|---|---|---|---|---|
| 1 | `top: -120px; left: -80px` | `440×440px` | `#86bc25` radial gradient | `.34` | `19s normal` |
| 2 | `top: 120px; right: -140px` | `480×480px` | `#62b5e5` radial gradient | `.32` | `23s reverse` |
| 3 | `bottom: -160px; left: 34%` | `460×460px` | `#ffcd00` radial gradient | `.26` | `27s normal` |

Each orb: `radial-gradient(circle at 30% 30%, <color>, transparent)` + `filter: blur(8px)`.

### File: `src/components/layout/Header.tsx` (Client Component)

Sticky glass header — stub in this iteration with placeholder values.

Structure:
- **Logo mark**: 38×38px container with 4 positioned circles — `#86bc25` 18px top-left, `#0097a9` 15px top-right (tpBob animation), `#ed8b00` 16px bottom-center (tpBob, 0.4s delay), `#da291c` 12px bottom-right
- **Wordmark**: "Node Moodus" — Bricolage Grotesque 800 20px, `-0.02em` tracking
- **Nav**: 5 pills (Home, Reminders, Mood, Shaw-rawt, Games). Active = `bg-tx text-bg`. Inactive = `text-txs`
- **Theme toggle**: 38×38px circle button
- **Avatar chip**: pill with 34×34px avatar circle, nickname, `⇄` switch button

Header style: `background: var(--hdr); backdrop-filter: blur(14px); border-bottom: 1px solid var(--bd); position: sticky; top: 0; z-index: 50`.

### File: `src/components/layout/ThemeProvider.tsx` (Client Component)

On mount: reads `tp_theme` from localStorage, applies `document.documentElement.dataset.theme`. Exports `useTheme()` hook with `{ theme, toggleTheme }`.

### File: `src/components/layout/LenisProvider.tsx` (Client Component)

Initializes Lenis on mount, drives the RAF loop, cleans up on unmount. No visual output.

### File: `src/components/layout/NicknameGate.tsx` (Client Component)

On mount: reads `tp_nickname` from localStorage. If present → renders `{children}`. If absent → renders children plus a placeholder modal overlay (full-screen, blurred backdrop, CSS `tpPop` animation) with text "Choose a nickname — coming soon" and a dismiss button that sets a temp nickname. Full onboarding flow is a later iteration.

### File: `src/components/motion/ReducedMotionProvider.tsx`

Stub file — re-exports `useReducedMotion` from `framer-motion` and documents the convention: every animated Client Component must call `useReducedMotion()` and disable or soften motion when it returns `true`.

---

## Supabase Client Setup

### File: `src/lib/supabase/client.ts`

Browser-side client using `createBrowserClient` from `@supabase/ssr`. Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Safe to import in Client Components.

### File: `src/lib/supabase/server.ts`

Server-side client using `createServerClient` from `@supabase/ssr` with cookie handling via `cookies()` from `next/headers`. Reads `SUPABASE_SERVICE_ROLE_KEY`. Must include `import 'server-only'` as the first import — this causes a build error if imported on the client. Only import in Server Components, Server Actions, and Route Handlers.

### File: `src/lib/supabase/types.ts`

```typescript
// Placeholder — replace with: npx supabase gen types typescript --local > src/lib/supabase/types.ts
export type Database = Record<string, never>
```

---

## Environment Variables

### `.env.local` (not committed)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Admin auth
ADMIN_PASSWORD=<choose-a-strong-password>
ADMIN_SESSION_TOKEN=<generate-a-random-32+-char-string>
```

### `.env.example` (committed)

Same keys with placeholder values and comments. Commit to repo so new contributors know what vars are needed.

---

## Motion & Interaction

Minimal in this iteration. Conventions established here apply to all future iterations.

- **AmbientBackground**: CSS `tpFloat` keyframe only. No JavaScript.
- **Logo bob**: CSS `tpBob` on teal and orange logo circles.
- **NicknameGate overlay**: CSS `tpPop` animation on modal card. Replaced with Framer Motion `popVariants` in Iteration 2.
- **Reduced motion**: global CSS override in `globals.css` handles CSS animations. Framer Motion components added later must additionally call `useReducedMotion()`.

---

## Responsive Behavior

| Breakpoint | Header nav | Main padding |
|---|---|---|
| base (mobile) | `overflow-x: auto`, all items visible | `clamp(20px, 4vw, 40px)` |
| `md` (768px) | fully visible, no scroll | same |
| `lg` (1024px) | same | same |

Breakpoint-specific layout handling is a concern for feature iterations.

---

## Data Flow — Storage Layer

Theme and identity bootstrap sequence:

1. Browser requests any page.
2. Next.js server renders the Server Component shell. `ThemeScript` inline `<script>` is included in HTML.
3. Browser receives HTML. `ThemeScript` executes synchronously, reads `localStorage.tp_theme`, sets `document.documentElement.dataset.theme`. No flash.
4. React hydrates. `ThemeProvider` mounts, reads the same key, provides context.
5. `NicknameGate` mounts, reads `localStorage.tp_nickname`. If present → renders children. If absent → renders gate overlay.
6. All subsequent reads of theme and nickname go through context / hook layer.

---

## Developer Tasks

**Task 1 — Scaffold Next.js 15**
Files: root directory, `package.json`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `.eslintrc.json`, `postcss.config.mjs`, `tailwind.config.ts`, `src/app/globals.css`

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --turbopack
```

Acceptance: `npm run dev` starts without errors. `http://localhost:3000` shows the default Next.js page. `npx tsc --noEmit` passes. `npm run lint` passes.

---

**Task 2 — Initialize shadcn/ui**
Files: `src/components/ui/` (generated), `globals.css` (updated), `tailwind.config.ts` (updated), `components.json`

```bash
npx shadcn@latest init
```
Style = Default, base color = Neutral, CSS variables = yes.

Acceptance: `components.json` exists. `src/components/ui/` exists. `npm run dev` starts cleanly.

---

**Task 3 — Install runtime and dev packages**
Files: `package.json`, `node_modules/`

Run the install commands from the Package Installation section.

Acceptance: `npm ls framer-motion lenis @formkit/auto-animate canvas-confetti lottie-react @supabase/supabase-js @supabase/ssr lucide-react recharts server-only` all resolve. No peer-dependency errors.

---

**Task 4 — Design system: globals.css and tailwind.config.ts**
Files: `src/app/globals.css`, `tailwind.config.ts`

Replace `globals.css` with the full design system: font import, Tailwind directives, dark theme CSS variables on `:root`, light theme on `[data-theme="light"]`, brand accent variables, global resets, all named keyframes, and the `prefers-reduced-motion` override.

Extend `tailwind.config.ts` with color tokens, font families, and border radius tokens.

Acceptance: `npm run dev` starts. DevTools shows `--bg`, `--tx` on `:root`. Adding `data-theme="light"` to `<html>` changes variable values. Tailwind class `text-tx` resolves to `var(--tx)`.

---

**Task 5 — Route stubs**
Files: `src/app/reminders/page.tsx`, `src/app/mood/page.tsx`, `src/app/shawrawt/page.tsx`, `src/app/games/page.tsx`, `src/app/games/[id]/page.tsx`, `src/app/admin/page.tsx`, `src/app/admin/layout.tsx`, `src/app/admin/login/page.tsx`

Each stub: Server Component rendering `<h1>` with the page name. The admin layout passes children through with `{/* TODO: Task 10 adds cookie guard */}`. The `/games/[id]` page accepts `params: { id: string }`.

Acceptance: All 8 routes return HTTP 200. No TypeScript errors.

---

**Task 6 — localStorage utilities**
Files: `src/lib/storage.ts`, `src/types/index.ts`

Implement `STORAGE_KEYS`, `storageGet`, `storageSet`, `storageRemove`, `storageClear` as specified. Implement the four shared TypeScript interfaces in `src/types/index.ts`.

Acceptance: `storageSet('tp_test', { x: 1 })` then `storageGet('tp_test')` returns `{ x: 1 }` in browser console. Calling either in a Node environment does not throw. `npx tsc --noEmit` passes.

---

**Task 7 — Identity and week utilities**
Files: `src/lib/identity.ts`, `src/lib/week.ts`

Implement `hashNickname`, `getAvatarColor`, `getAvatarEmoji`, `getAvatar`, `normalizeNickname` in `identity.ts`. Implement `getISOWeek` and `getMoodWeekKey` in `week.ts`.

Acceptance: `getAvatarColor('alice')` always returns the same hex. `getISOWeek(new Date('2026-01-01'))` returns `{ week: 1, year: 2026 }`. `npx tsc --noEmit` passes.

---

**Task 8 — Supabase client setup**
Files: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/types.ts`, `.env.local`, `.env.example`

Create `.env.local` with all five env vars (developer fills actual values). Create `.env.example` with placeholders. Implement browser and server clients as specified, with `import 'server-only'` in `server.ts`.

Acceptance: `npx tsc --noEmit` passes. Importing `server.ts` in a `"use client"` file produces a build error (verify manually, then revert). `npm run dev` starts without Supabase errors.

---

**Task 9 — Root layout components**
Files: `src/app/layout.tsx`, `src/components/layout/AmbientBackground.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/ThemeProvider.tsx`, `src/components/layout/LenisProvider.tsx`, `src/components/layout/NicknameGate.tsx`, `src/components/motion/ReducedMotionProvider.tsx`

Implement all components as specified. `ThemeScript` inline `<script>` goes into `layout.tsx`. All Client Components have `"use client"` as their first line. `AmbientBackground` is a Server Component (no directive).

Acceptance: `npm run dev` shows ambient orbs animating, sticky glass header with logo mark, teal and orange logo circles bobbing. Toggling `data-theme` in DevTools switches colors. No console errors. Empty localStorage shows the placeholder gate overlay.

---

**Task 10 — Admin auth**
Files: `src/middleware.ts`, `src/app/admin/login/actions.ts`, `src/app/admin/login/page.tsx` (update), `src/app/admin/layout.tsx` (update)

Implement `loginAdmin` Server Action: reads `ADMIN_PASSWORD` and `ADMIN_SESSION_TOKEN` from env, uses `crypto.timingSafeEqual` to compare password, sets `tp_admin_token` httpOnly cookie, redirects to `/admin`.

Implement `src/middleware.ts`: matches `/admin` and `/admin/:path*` (excludes `/admin/login`), reads `tp_admin_token` cookie, compares to `ADMIN_SESSION_TOKEN`, redirects to `/admin/login` if invalid.

Update `src/app/admin/layout.tsx` to also verify the cookie server-side (belt-and-suspenders).

Acceptance: `/admin` without cookie → redirect to `/admin/login`. Wrong password → form re-renders with error. Correct password → redirects to `/admin` and renders. Clearing cookies → back to login. `ADMIN_PASSWORD` does not appear in any client bundle.

---

**Task 11 — Final verification**
Files: none new

1. `npx tsc --noEmit` — zero errors
2. `npm run lint` — zero errors
3. `npm run build` — successful production build
4. All routes (`/`, `/reminders`, `/mood`, `/shawrawt`, `/games`, `/games/test-id`, `/admin/login`, `/admin`) return 200 or expected redirects
5. Search `src/` for `#` — hardcoded hex values only allowed in `globals.css`, `tailwind.config.ts`, and `identity.ts` `AVATAR_PALETTE`

---

## Risks & Edge Cases

**Tailwind v4 + shadcn/ui compatibility.** If `npx shadcn@latest init` fails, try `npx shadcn@canary init`. If still broken, fall back to Tailwind v3.4 (change `@import "tailwindcss"` to `@tailwind base/components/utilities`).

**Lenis package name.** May be `lenis` or `@studio-freight/lenis`. Check npm registry at install time. API is identical.

**ThemeScript and CSP.** If a Content Security Policy is added later, the inline `<script>` will need a nonce or hash. Flag for security iteration.

**Admin session token rotation.** Changing `ADMIN_SESSION_TOKEN` immediately invalidates all admin sessions. Document this in `.env.example`.

**SSR + localStorage.** Every component that reads `localStorage` must guard against `typeof window === 'undefined'`. The `storageGet` helper handles this — establish a code review convention that no direct `localStorage` access is ever written outside this helper.

**`server-only` in middleware.** The middleware runs in the Edge runtime. Never import `src/lib/supabase/server.ts` from middleware — the `server-only` guard will fail at runtime. The middleware's admin check is a plain string comparison.

**Google Fonts in production.** The `@import url(...)` is a separate network request. Consider self-hosting via `next/font/google` in a later iteration to improve LCP.

**No `.env.local` in CI.** The Next.js build fails if `NEXT_PUBLIC_SUPABASE_URL` is absent. Add placeholder values to the CI environment, or make the Supabase client instantiation lazy (wrap in a function, not a module-level call) to allow builds without a live project.

**`data-theme` default.** If `localStorage` is empty, `ThemeScript` expression `(t === 'light') ? 'light' : 'dark'` correctly defaults to dark. Any non-"light" value resolves to dark.
