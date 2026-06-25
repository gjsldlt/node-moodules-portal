# Spec: Iteration 1b — Nickname Identity & Login

## Summary

This iteration replaces the `NicknameGate` stub with the full two-step onboarding flow, wires up the `users` Supabase table, and establishes the `NicknameContext` + `useNickname` hook that the rest of the app will consume for the current user identity. When complete, a visitor without a stored nickname is shown a full-screen overlay, picks or claims a nickname, and lands in the app with confetti and a toast. A returning visitor on the same device passes through silently. The Header's existing `⇄` switch button is rewired to trigger the context rather than reloading the page.

---

## Assumptions & Open Questions

- The `server.ts` Supabase client uses the **service role key**. The `resolveNickname` server action runs under this key, which means RLS is effectively bypassed server-side. The RLS policies specified below are still created for defence-in-depth (future direct client access, Supabase Studio safety), but runtime enforcement for this action is the server action's own validation logic.
- `LocalUser` in `src/types/index.ts` currently stores `color` and `emoji`. The Supabase `users` table uses `avatar_color` and `avatar_emoji`. The server action will map between these on the way in and out. No rename of `LocalUser` is required — it stays as-is.
- `canvas-confetti` is already installed. `focus-trap-react` must be added.
- ⚠️ **Blocking assumption:** The `Database` type in `src/lib/supabase/types.ts` is currently a placeholder. After the migration runs, `npx supabase gen types typescript --local` must be re-run. Task 2 (migration) and Task 6 (type regen) are sequenced accordingly.
- The `Header` currently reads `localStorage` directly in its own `useEffect`. After this iteration, it reads from `NicknameContext` instead.
- Focus trap implementation: use `focus-trap-react` (not native `<dialog>`) to avoid Next.js hydration issues.

---

## Data Model

### Migration file: `supabase/migrations/<timestamp>_create_users.sql`

```sql
create extension if not exists citext;

create table public.users (
  id            uuid primary key default gen_random_uuid(),
  nickname      citext unique not null,
  avatar_color  text not null,
  avatar_emoji  text not null,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  constraint nickname_length check (char_length(nickname) between 2 and 30),
  constraint nickname_chars  check (nickname ~ '^[a-zA-Z0-9 \-]+$')
);

create index users_nickname_lower_idx on public.users (nickname);

alter table public.users enable row level security;

-- SELECT: anyone can read
create policy "users_select_open"
  on public.users for select
  to anon
  using (true);

-- INSERT: anyone can create
create policy "users_insert_open"
  on public.users for insert
  to anon
  with check (true);

-- UPDATE: only last_seen_at can change; nickname and avatar fields are locked
create policy "users_update_last_seen_only"
  on public.users for update
  to anon
  using (true)
  with check (
    avatar_color = (select avatar_color from public.users where id = users.id) and
    avatar_emoji = (select avatar_emoji from public.users where id = users.id) and
    nickname     = (select nickname     from public.users where id = users.id)
  );
```

Using `citext` gives case-insensitive equality checks without needing `lower()` in queries. The `unique` constraint on a `citext` column is already case-insensitive.

---

## API / Server Contracts

### Server Action: `resolveNickname`

**File:** `src/app/actions/nickname.ts`

**Directive:** `'use server'`

**Output type** (add to `src/types/index.ts`):
```typescript
export type NicknameResolveResult =
  | { status: 'created'; user: LocalUser }
  | { status: 'exists';  user: LocalUser }
  | { status: 'error';   message: string }
```

**Validation (in order):**
1. Trim. If < 2 chars: `{ status: 'error', message: 'Nickname must be at least 2 characters.' }`
2. If > 30 chars: `{ status: 'error', message: 'Nickname must be 30 characters or fewer.' }`
3. If not `/^[a-zA-Z0-9 \-]+$/`: `{ status: 'error', message: 'Only letters, numbers, spaces, and hyphens allowed.' }`

**Flow:**
1. Query `select * from users where nickname = $1` (citext handles case-insensitivity).
2. **Not found:** compute `getAvatar(trimmedNickname)`. INSERT row. Map to `LocalUser`. Return `{ status: 'created', user }`.
3. **Found:** UPDATE `last_seen_at = now()`. Map to `LocalUser`. Return `{ status: 'exists', user }`.
4. **Supabase error:** `console.error(error)`, return `{ status: 'error', message: 'Something went wrong. Try again.' }`.

Never throws. All paths return a `NicknameResolveResult`.

---

## Component Architecture

```
RootLayout (Server Component)
  └── NicknameProvider (Client Component — owns all nickname state)
        ├── [children — entire app tree]
        └── Overlay (rendered inside NicknameProvider when showGate=true)
              ├── StepName    (step 1 — internal component)
              └── StepConfirm (step 2 — internal component)

Header (Client Component — reads from NicknameContext via useNickname())
```

**Context shape:**
```typescript
interface NicknameContextValue {
  nickname: string | null
  triggerSwitch: () => void
}
```

**`NicknameProvider` state:**
- `nickname: string | null | undefined` — `undefined` = hydration pending, `null` = absent, `string` = resolved
- `showGate: boolean`
- `step: 'name' | 'confirm'`
- `pendingUser: LocalUser | null`
- `isSubmitting: boolean`
- `stepNameError: string | null`
- `toastMessage: string | null`

**On mount (returning user):** `storageGet(STORAGE_KEYS.NICKNAME)` → if found, set `nickname`, fire background `resolveNickname` via `startTransition` to update `last_seen_at`.

---

## Motion & Interaction

All animations use Framer Motion. `useReducedMotion()` is called at the top of `NicknameProvider`. `shouldReduce` propagates to all variants.

### Backdrop
```
Enter: opacity 0 → 1, 0.3s ease-out
Exit:  opacity 1 → 0, 0.25s ease-in
```

### Overlay Card (tpPop timing)
```
Enter: opacity 0 → 1, scale 0.85 → 1, 0.45s ease [0.2, 0.8, 0.3, 1.3]
Exit:  opacity 1 → 0, scale 1 → 0.9, 0.25s ease [0.4, 0, 1, 1]
Reduced motion: opacity only, no scale
```

### Step Transition
```
Step 1 exit:   x: 0 → -24, opacity 1 → 0, 0.22s ease-in
Step 2 enter:  x: 24 → 0,  opacity 0 → 1, 0.28s ease-out
(reversed when going back)
AnimatePresence mode="wait" keyed on `step`
Reduced motion: opacity only, no x
```

### Avatar bob (Step 2)
```
CSS: animation: tpBob 3s ease-in-out infinite
Reduced motion: no animation class
```

### Logo dots in card header
```
dot 1: tpBob 3s ease-in-out infinite
dot 2: tpBob 3s ease-in-out infinite 0.3s
dot 3: tpBob 3s ease-in-out infinite 0.6s
Reduced motion: remove animations
```

### Confetti (new user only)
```javascript
canvas-confetti({
  particleCount: 120,
  spread: 80,
  origin: { y: 0.6 },
  colors: ['#86bc25', '#0097a9', '#62b5e5', '#da291c', '#ed8b00', '#ffcd00'],
})
```
Fires on `created` path only. Still fires when `prefers-reduced-motion` is on.

### Toast
```
Fixed: bottom-center (left: 50%, transform: translateX(-50%), bottom: 26px)
Enter: CSS tpToast 0.35s cubic-bezier(.2,.8,.3,1.2) both
Exit: Framer Motion opacity 1→0, y 0→12, 0.2s
Auto-dismiss: 3000ms
Rendered inside NicknameProvider (survives overlay unmount)
```

Toast copy:
- Created: `"You're in, [nickname]! [emoji]"`
- Exists + confirmed: `"Welcome back, [nickname]! [emoji]"`

### Submit button hover
```
Framer Motion whileHover={{ y: shouldReduce ? 0 : -2 }}, 0.15s ease
```

### Input focus ring
```
border-color → var(--teal) on focus-visible
```

---

## Responsive Behavior

| Breakpoint | Overlay card | Buttons |
|---|---|---|
| Base (< 640px) | `width: calc(100vw - 48px)` | Full-width, height ≥ 44px |
| sm (≥ 640px) | `max-width: 430px` | Full-width within card |

Backdrop: `position: fixed; inset: 0`. Centered via flex on the backdrop div.

Test matrix: 375px + 1280px viewports, with and without `prefers-reduced-motion: reduce`.

---

## Accessibility

- Overlay `div`: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="gate-heading"`
- Step heading: `id="gate-heading"` (changes per step)
- Input: `<label htmlFor="nickname-input">` (sr-only), `<input id="nickname-input" aria-describedby="nickname-error">`, `<span id="nickname-error" role="alert">` (only rendered when error present)
- Focus trap: `focus-trap-react` `<FocusTrap>` wrapping the card. `focusTrapOptions={{ initialFocus: '#nickname-input' }}` for Step 1; "Yes" button `ref` for Step 2.
- On close: focus returns to `document.body` (FocusTrap default).

---

## Developer Tasks

### Task 1 — Add `NicknameResolveResult` to `src/types/index.ts`

Add the union type below `LocalUser`. No other changes.

Acceptance: `NicknameResolveResult` resolves in any `src/` file without TS errors.

---

### Task 2 — Write and apply users table migration

**File:** `supabase/migrations/<timestamp>_create_users.sql`

Use exact DDL from Data Model section. Run `npx supabase db reset` to verify. Run `npx supabase gen types typescript --local > src/lib/supabase/types.ts`.

Acceptance: `src/lib/supabase/types.ts` contains `users` row/insert/update shapes. `npx tsc --noEmit` passes.

---

### Task 3 — Create `src/app/actions/nickname.ts`

`'use server'` directive. Import server Supabase client, `getAvatar` from `identity.ts`, types from `types/index.ts`.

Implement `resolveNickname(nickname: string): Promise<NicknameResolveResult>` per spec. Use generated `Database` types for Supabase calls.

Acceptance:
- Empty string → `{ status: 'error' }`
- New nickname → row inserted, `{ status: 'created', user }` with correct avatar
- Same nickname again → `last_seen_at` updated, `{ status: 'exists', user }`
- Never throws

---

### Task 4 — Install `focus-trap-react`

```bash
npm install focus-trap-react
npm install -D @types/focus-trap-react
```

Acceptance: `npm run build` succeeds.

---

### Task 5 — Rewrite `src/components/layout/NicknameGate.tsx`

Replace the entire file. Exports: `NicknameContext`, `NicknameProvider`.

**`NicknameProvider`:**
- Owns all state listed in Component Architecture
- On mount: reads `STORAGE_KEYS.NICKNAME` from localStorage. Found → set `nickname`, background `resolveNickname` via `startTransition`. Not found → set `showGate = true`.
- `triggerSwitch()`: `storageClear()`, reset state, `showGate = true`.
- Renders children always. Renders overlay via `AnimatePresence` when `showGate`.
- Renders toast via `AnimatePresence`.

**Overlay structure:**
```tsx
<AnimatePresence>
  {showGate && (
    <motion.div /* backdrop */>
      <FocusTrap focusTrapOptions={{ initialFocus: step === 'name' ? '#nickname-input' : undefined }}>
        <motion.div role="dialog" aria-modal="true" aria-labelledby="gate-heading" /* card */>
          {/* 3 bobbing logo dots */}
          <AnimatePresence mode="wait">
            {step === 'name'    && <StepName    key="name"    ... />}
            {step === 'confirm' && <StepConfirm key="confirm" ... />}
          </AnimatePresence>
        </motion.div>
      </FocusTrap>
    </motion.div>
  )}
</AnimatePresence>
```

**`StepName` (internal):** heading (id="gate-heading"), sr-only label, input, error span, submit button. Slide animation variants. Enter key submits.

**`StepConfirm` (internal):** heading (id="gate-heading"), avatar circle (tpBob), nickname display, "Yes, that's me" + "No, pick another" buttons.

**State transitions in NicknameProvider on server action result:**
- `created`: write to localStorage (`NICKNAME` + `KNOWN_USERS`), `confetti()`, set `toastMessage`, `nickname`, `showGate = false`
- `exists`: set `pendingUser`, `step = 'confirm'`
- `error`: set `stepNameError`
- Step 2 "Yes": write to localStorage, set `toastMessage`, `nickname`, `showGate = false`
- Step 2 "No": `step = 'name'`, `pendingUser = null`, `stepNameError = "That name's taken — pick another?"`

**`KNOWN_USERS` update:** `storageGet<LocalUser[]>(STORAGE_KEYS.KNOWN_USERS) ?? []`, push if not already present (case-insensitive), write back.

Acceptance:
- First visit: overlay appears, confetti fires on new nickname, overlay closes
- Return visit: no overlay, `nickname` set from localStorage
- Collision: Step 2 appears, "Yes" confirms, "No" returns with error
- `useReducedMotion()` true: opacity-only transitions
- Focus trapped in overlay while open
- `aria-labelledby` references step heading

---

### Task 6 — Create `src/hooks/useNickname.ts`

```typescript
export function useNickname(): { nickname: string | null; triggerSwitch: () => void }
```

Reads `NicknameContext`. Throws if called outside `NicknameProvider`.

Acceptance: works in any Client Component descendant of `NicknameProvider`. TypeScript clean.

---

### Task 7 — Update `src/components/layout/Header.tsx`

- Remove local `useState`/`useEffect` for nickname
- Replace with `const { nickname, triggerSwitch } = useNickname()`
- Wire `⇄` button `onClick` to `triggerSwitch`
- Remove `storageClear` import and `handleSwitch` function

Acceptance: nickname shows without flash, `⇄` opens overlay without page reload, no `window.location.reload()` remains.

---

### Task 8 — Update `src/app/layout.tsx`

Replace `<NicknameGate>` with `<NicknameProvider>`. Update import.

Acceptance: `npm run build` passes. First-visit flow works end to end.

---

### Task 9 — Smoke test (manual)

1. Clear `tp_*` keys → overlay → new nickname → confetti → toast → closes → Header shows nickname
2. Reload → no overlay → nickname in Header
3. `⇄` → overlay → same nickname → Step 2 → "Yes" → closes → toast "Welcome back"
4. `⇄` → same nickname → Step 2 → "No" → Step 1 with error
5. `prefers-reduced-motion: reduce` in DevTools → repeat step 1 → confetti fires, opacity-only transitions
6. 375px viewport → card fits within screen, all buttons ≥ 44px

---

## Risks & Edge Cases

**Double submit:** `isSubmitting = true` from the moment the server action is called until result handled. Submit button disabled during this window.

**localStorage unavailable:** `storageGet`/`storageSet` swallow errors silently. Consequence: gate re-appears on next load. Acceptable — no auth token is at risk.

**`citext` unavailable:** If the migration fails, fall back to `text` + unique index on `lower(nickname)` + explicit `lower()` in the query.

**Existing `'guest'` nickname from stub:** Any user who ran the stub will have `tp_nickname = '"guest"'` in localStorage. `storageGet<string>` parses this to `"guest"`. The background `resolveNickname('guest')` will create a real row for them. Inform the team.

**Multi-tab conflict:** If the user switches in one tab, other tabs still hold the old nickname in memory. No cross-tab sync in this iteration — address with `storage` event listener in a future pass.

**`KNOWN_USERS` null-coalesce:** `storageGet<LocalUser[]>(STORAGE_KEYS.KNOWN_USERS)` returns `null` if absent. Must null-coalesce to `[]` before pushing.
