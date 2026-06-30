# Iteration 1C — Page & Content Loader Animations

## Goal
Provide visual feedback during every moment of waiting: route navigations and in-page data fetches alike. Two categories cover all cases.

---

## Category 1 — Route-Change Loaders

### 1a. Navigation Progress Bar (`PageTransitionBar`)
- Fixed 3px bar at top of viewport (`z-index: 1000`, above header)
- Color: teal → green gradient (`#0097a9` → `#86bc25`) with teal glow
- State machine: `idle → loading → completing → idle`
  - Detects navigation intent via `window click` capture on `<a>` elements
  - Detects route resolve via `usePathname()` change
  - Simulates progress: 0 → 75% while loading, 75 → 100% on resolve
- Invisible to `prefers-reduced-motion` users (returns null)
- Added to `src/app/layout.tsx` inside body

### 1b. Page Entrance Animation (`app/template.tsx`)
- Next.js `template.tsx` remounts on **every** navigation (unlike `layout.tsx`)
- Wraps children in `motion.div` — fade + translate up from y:12px, scale 0.985→1
- Duration: 0.45s, easing `[0.2, 0.7, 0.3, 1]` (matches `tpFadeUp`)
- Reduced motion: 0.15s opacity-only fade, no translate/scale
- No exit animation (relies on loading skeleton swapping in via Suspense)

### 1c. Skeleton Screens (`loading.tsx` per route)
Next.js shows `loading.tsx` instantly via Suspense while the page's SSR data loads.
Each skeleton mirrors the real page's approximate layout using `SkeletonBlock`.

| Route | Skeleton shape |
|---|---|
| `/` | Hero (2 lines) + 2 card blocks |
| `/moood` | Hero + checkin card + filter bar + graph/stats row + word cloud |
| `/node-ifications` | Hero stats + tab bar + 2-column announcements/reminders |
| `/shawrawt` | Hero + 3 shoutout card rows |
| `/games` | Hero + 2×3 game card grid |

---

## Category 2 — In-Page Content Loaders

### 2a. MooodClient Filter Overlay (upgraded)
- **Before:** plain semi-transparent div with no visual spinner — invisible to users
- **After:** `AnimatePresence` fade-in/fade-out overlay + centered rotating ring spinner
  - Spinner: 28px circle, `borderTopColor: var(--teal)`, `rotate: 0→360` infinite via Framer Motion
  - Overlay fades in at 0.2s, fades out at 0.2s
  - Spinner skipped for `prefers-reduced-motion`

### 2b. NodeificationsClient Tab Transitions
- Already implemented with `AnimatePresence mode="wait"` + `motion.div key={activeTab}`
- No changes needed — ✅ complete

---

## Shared Primitive

### `SkeletonBlock` (`src/components/motion/SkeletonBlock.tsx`)
```
props: width, height, radius, className, style
```
- Background: `var(--trk)` with `skeletonShimmer` gradient sweep animation
- CSS keyframe `skeletonShimmer` added to `globals.css`
- `prefers-reduced-motion`: static `var(--trk)` fill, no animation
- Used in all `loading.tsx` skeleton screens

---

## Files Created / Modified

| File | Action |
|---|---|
| `src/components/motion/SkeletonBlock.tsx` | ✨ new |
| `src/components/layout/PageTransitionBar.tsx` | ✨ new |
| `src/app/template.tsx` | ✨ new |
| `src/app/loading.tsx` | ✨ new |
| `src/app/moood/loading.tsx` | ✨ new |
| `src/app/node-ifications/loading.tsx` | ✨ new |
| `src/app/shawrawt/loading.tsx` | ✨ new |
| `src/app/games/loading.tsx` | ✨ new |
| `src/app/globals.css` | updated — `skeletonShimmer` keyframe |
| `src/app/layout.tsx` | updated — `<PageTransitionBar />` |
| `src/components/moood/MooodClient.tsx` | updated — spinner overlay |
