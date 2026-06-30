# 1e — Secret Themes Iteration

> Cyberpunk and Lord of the Rings themes, toggled by right-clicking the theme button in the header.
> Both sit on top of the existing dark/light system — they are "secret" themes activated out-of-band.

---

## How themes work

| File | Role |
|---|---|
| `src/app/globals.css` | CSS variables per theme, visual effects, keyframes |
| `src/components/layout/ThemeProvider.tsx` | React context; holds `theme` state, `toggleTheme`, `cycleSecretTheme` |
| `src/components/layout/Header.tsx` | Theme button UI; left-click = `toggleTheme`, right-click = `cycleSecretTheme` |
| `src/app/layout.tsx` | Inline `<script>` — sets `data-theme` on `<html>` before hydration (no flash) |

The active theme is stored in `localStorage` under key `tp_theme` and reflected as `data-theme="<value>"` on the `<html>` element.

### Theme type

```ts
// src/components/layout/ThemeProvider.tsx
export type Theme = 'dark' | 'light' | 'cyberpunk' | 'lotr'
```

### Cycle behaviour

| User action | Result |
|---|---|
| Left-click theme button (in dark) | → light |
| Left-click theme button (in light) | → dark |
| Left-click theme button (in cyberpunk or lotr) | → dark (exit secret theme) |
| **Right-click theme button** | cycles: dark/light → cyberpunk → lotr → dark |

---

## Cyberpunk theme

**Activated by:** first right-click on the theme button from any base theme.

### Color palette

```css
[data-theme="cyberpunk"] {
  --bg:     #07040f;
  --card:   #0e0a1c;
  --pnl:    #160f28;
  --trk:    #1d1535;
  --hdr:    rgba(7,4,15,.88);
  --bd:     rgba(0,255,245,.18);
  --tx:     #e2f0ff;
  --txs:    #85c8ff;
  --txm:    #4d7aa0;
  --pnlt:   #e2f0ff;
  --pnls:   #7ab4e8;
  --shadow: rgba(0,255,245,.3);

  /* Neon accent overrides */
  --green:   #b8ff00;
  --teal:    #00fff5;   /* primary neon cyan */
  --sky:     #bf5fff;
  --orange:  #ff6d00;
  --red:     #ff0066;
  --yellow:  #ffe600;
  --emerald: #00ff88;
}
```

### Visual effects

| Effect | Implementation |
|---|---|
| Scanlines | `body::before` — `repeating-linear-gradient` horizontal 1px lines |
| Neon heading glow | `h1, h2` → `text-shadow` with `rgba(0,255,245,...)` |
| Neon scrollbar | `::-webkit-scrollbar-thumb` → `#00fff5` + glow |
| Body background | `radial-gradient` purple/cyan bleed |
| Logo glitch | `.tp-logo-mark` → `cpGlitch` keyframe (translate + `hue-rotate`) |
| Active nav pill | `.tp-nav-active` → `#00fff5` background + cyan box-shadow |

### Keyframes

```css
@keyframes cpGlitch {
  0%, 88%, 100% { transform: translate(0,0); filter: none; }
  90%  { transform: translate(-3px,1px); filter: hue-rotate(90deg); }
  92%  { transform: translate(3px,-1px); filter: hue-rotate(-90deg) brightness(1.4); }
  94%  { transform: translate(-1px,0); filter: none; }
  96%  { transform: translate(2px,1px); filter: hue-rotate(180deg); }
  98%  { transform: translate(0,0); filter: none; }
}

@keyframes cpNeonPulse {
  0%, 100% { box-shadow: 0 0 8px rgba(0,255,245,.4), 0 0 24px rgba(0,255,245,.15); }
  50%       { box-shadow: 0 0 16px rgba(0,255,245,.7), 0 0 48px rgba(0,255,245,.25), 0 0 80px rgba(0,255,245,.08); }
}
```

### Font

**Orbitron** (Google Fonts) replaces Bricolage Grotesque for display text and the logo wordmark.

Added to the shared `@import` in `globals.css`:

```
&family=Orbitron:wght@400;700;900
```

CSS overrides:

```css
[data-theme="cyberpunk"] h1,
[data-theme="cyberpunk"] h2 {
  font-family: 'Orbitron', sans-serif !important;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

[data-theme="cyberpunk"] .tp-logo-text {
  font-family: 'Orbitron', sans-serif !important;
  letter-spacing: 0.1em;
  font-size: 17px !important; /* Orbitron is wider than Bricolage */
}
```

### Header button

- Icon: `<Zap />` (Lucide)
- Border: `1px solid #00fff5`
- Background: `rgba(0,255,245,.12)`
- Color: `#00fff5`
- Box-shadow: `0 0 12px rgba(0,255,245,.4), 0 0 28px rgba(0,255,245,.15)`

---

## Lord of the Rings theme

**Activated by:** second right-click (from cyberpunk).

Palette draws from Middle-earth: One Ring gold, Mordor crimson, Shire green, Rivendell teal, parchment text.
Font: **Cinzel** (Google Fonts) replaces Bricolage Grotesque for display text.

### Color palette

```css
[data-theme="lotr"] {
  --bg:     #0c0905;
  --card:   #141009;
  --pnl:    #1a1508;
  --trk:    #221c0b;
  --hdr:    rgba(12,9,5,.88);
  --bd:     rgba(201,168,76,.18);
  --tx:     #e8e0c8;
  --txs:    #c4b490;
  --txm:    #7a6a4a;
  --pnlt:   #e8e0c8;
  --pnls:   #b09a6a;
  --shadow: rgba(0,0,0,.85);

  /* Middle-earth accent overrides */
  --green:   #4a7c3f;   /* Shire green */
  --teal:    #2a6b6e;   /* Rivendell teal */
  --sky:     #c9a84c;   /* One Ring gold — primary accent */
  --orange:  #c17f24;   /* Rohan amber */
  --red:     #8b1a1a;   /* Mordor red */
  --yellow:  #f0d060;   /* Galadriel's light */
  --emerald: #3a7a5a;   /* Fangorn deep green */
}
```

### Visual effects

| Effect | Implementation |
|---|---|
| Fires of Mordor atmosphere | `body` → three layered `radial-gradient`s (crimson bottom, gold top-right, green bottom-left) |
| Torch flicker vignette | `body::before` — dark radial vignette animated with `lotrTorchFlicker` |
| Cinzel headings | `h1, h2` → `font-family: 'Cinzel'` + golden `text-shadow` |
| Cinzel logo | `.tp-logo-text` → `font-family: 'Cinzel'` + wider `letter-spacing` |
| Logo ring glow | `.tp-logo-mark` → `lotrLogoGlow` (`drop-shadow` pulse in One Ring gold) |
| Active nav pill | `.tp-nav-active` → `#c9a84c` background + golden box-shadow |
| Golden scrollbar | `::-webkit-scrollbar-thumb` → `#c9a84c` + glow |

### Keyframes

```css
@keyframes lotrLogoGlow {
  0%, 100% { filter: drop-shadow(0 0 5px rgba(201,168,76,.5)); }
  50%       { filter: drop-shadow(0 0 12px rgba(201,168,76,.85)) drop-shadow(0 0 26px rgba(201,168,76,.35)); }
}

@keyframes lotrTorchFlicker {
  0%, 100%  { opacity: .88; }
  14%       { opacity: .68; }
  28%       { opacity: .82; }
  42%       { opacity: .60; }
  56%       { opacity: .78; }
  70%       { opacity: .52; }
  84%       { opacity: .75; }
}

@keyframes lotrElfShimmer {
  0%        { transform: translateX(-130%) skewX(-14deg); opacity: 0; }
  4%        { opacity: .55; }
  55%, 100% { transform: translateX(230%) skewX(-14deg); opacity: 0; }
}
```

### Header button

- Icon: `<ScrollText />` (Lucide)
- Border: `1px solid #c9a84c`
- Background: `rgba(201,168,76,.12)`
- Color: `#c9a84c`
- Box-shadow: `0 0 12px rgba(201,168,76,.45), 0 0 28px rgba(201,168,76,.18)`

### Font

Cinzel is added to the shared Google Fonts import in `globals.css`:

```
&family=Cinzel:wght@400;700;900
```

The CSS variable override in `[data-theme="lotr"]` only covers elements targeted by CSS class/selector. Inline `style` props hardcoding `Bricolage Grotesque` (e.g. the logo span) are overridden via the `.tp-logo-text` class selector.

---

## How to add a new theme

### 1. Add the name to the Theme type

```ts
// src/components/layout/ThemeProvider.tsx
export type Theme = 'dark' | 'light' | 'cyberpunk' | 'lotr' | 'YOUR_THEME'
```

### 2. Add it to the secret cycle (optional)

If it should be reachable by right-clicking the theme button, extend `cycleSecretTheme`:

```ts
function cycleSecretTheme() {
  if (theme === 'cyberpunk') { apply('lotr') }
  else if (theme === 'lotr') { apply('YOUR_THEME') }
  else if (theme === 'YOUR_THEME') { apply('dark') }
  else { apply('cyberpunk') }
}
```

If it should be a left-click base theme instead, add it to `toggleTheme` alongside `dark`/`light`.

### 3. Add CSS variables in globals.css

Copy the dark theme block as a starting point and adjust every token:

```css
[data-theme="your-theme"] {
  /* Surface colours */
  --bg:     #...;
  --card:   #...;
  --pnl:    #...;
  --trk:    #...;
  --hdr:    rgba(...,.88);
  --bd:     rgba(...,.18);

  /* Text */
  --tx:     #...;
  --txs:    #...;
  --txm:    #...;
  --pnlt:   #...;
  --pnls:   #...;

  --shadow: rgba(0,0,0,.xx);

  /* Brand accent overrides — only if you want to change them */
  --green:   #...;
  --teal:    #...;
  --sky:     #...;
  --orange:  #...;
  --red:     #...;
  --yellow:  #...;
  --emerald: #...;
}
```

The ambient background orbs (`AmbientBackground.tsx`) use `var(--green)`, `var(--sky)`, and `var(--yellow)` — overriding those three changes the orb colors automatically.

### 4. Add visual effects

After the variable block, add any `[data-theme="your-theme"]` selectors for:

| What | Selector |
|---|---|
| Body atmosphere | `[data-theme="your-theme"] body { background: ... }` |
| Body overlay | `[data-theme="your-theme"] body::before { content: ''; ... }` |
| Heading style | `[data-theme="your-theme"] h1, h2 { ... }` |
| Logo mark | `[data-theme="your-theme"] .tp-logo-mark { animation: ... }` |
| Logo text | `[data-theme="your-theme"] .tp-logo-text { font-family: ... }` |
| Active nav pill | `[data-theme="your-theme"] .tp-nav-active { background: ... !important; ... }` |
| Scrollbar | `[data-theme="your-theme"] ::-webkit-scrollbar-thumb { ... }` |

Add any new `@keyframes` needed at the bottom of the themes section (before the brand defaults block).

### 5. Update the Header button

In `src/components/layout/Header.tsx`, extend the three ternary chains in the theme button:

```tsx
// Icon
{theme === 'cyberpunk'   ? <Zap size={16} />        :
 theme === 'lotr'        ? <ScrollText size={16} />  :
 theme === 'your-theme'  ? <YourIcon size={16} />    :
 theme === 'dark'        ? <Sun size={16} />          :
                           <Moon size={16} />}

// Border
border:
  theme === 'cyberpunk'  ? '1px solid #00fff5'  :
  theme === 'lotr'       ? '1px solid #c9a84c'  :
  theme === 'your-theme' ? '1px solid #ACCENT'  :
  '1px solid var(--bd)',

// (same pattern for background, color, boxShadow)
```

Also update `aria-label` to describe the new theme.

### 6. Update the pre-hydration script in layout.tsx

Add your theme name to the chain so localStorage → `data-theme` resolves correctly before React mounts (eliminates flash):

```ts
// src/app/layout.tsx
__html: `(function(){try{var t=localStorage.getItem('tp_theme');
  document.documentElement.dataset.theme=
    (t==='light')?'light':
    (t==='cyberpunk')?'cyberpunk':
    (t==='lotr')?'lotr':
    (t==='your-theme')?'your-theme':
    'dark';
}catch(e){}})();`
```

### 7. Load any extra fonts

If the theme needs a custom typeface, add it to the `@import url(...)` at the top of `globals.css`. Keep all fonts in the single import call to avoid extra network round-trips:

```
@import url('https://fonts.googleapis.com/css2?...&family=YourFont:wght@400;700&display=swap');
```

Then override the CSS variable in your theme block:

```css
[data-theme="your-theme"] .tp-logo-text,
[data-theme="your-theme"] h1,
[data-theme="your-theme"] h2 {
  font-family: 'YourFont', fallback, serif !important;
}
```

> Note: Tailwind v4's `@theme` block compiles `--font-display` statically, so switching the display font at runtime requires targeting elements directly with CSS selectors rather than relying on the Tailwind utility class.

> Tip: Wide or condensed fonts (Orbitron, Cinzel) may need a `font-size` tweak on `.tp-logo-text` since the header logo has a fixed visual weight. Orbitron uses `17px !important` vs the default `20px` to stay balanced.

### Checklist

- [ ] `Theme` union type updated
- [ ] `cycleSecretTheme` (or `toggleTheme`) extended
- [ ] `[data-theme="your-theme"]` CSS variables block added
- [ ] Visual effects / keyframes added
- [ ] Header button: icon, border, background, color, boxShadow, aria-label
- [ ] Pre-hydration script in `layout.tsx` updated
- [ ] New fonts added to Google Fonts import (if needed)
- [ ] Tested: persists on reload, no flash, reduced-motion respected
