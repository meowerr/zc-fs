# PROMPT: Mobile UI Overhaul for PitLane (zc-fs)

> **How to use:** open the Gemini CLI in the repo root, then send: `Read @MOBILE_UI_IMPROVEMENTS.md and follow it exactly. Start with Phase 0.`
> Everything below the line is written to the agent. The earlier audit-style version of this file is in git history (commit `docs: add mobile UI improvement plan`).

---

## 0. YOUR ROLE

You are a senior front-end engineer fixing the **mobile UI** of **PitLane**, a Vite + React 18 + TypeScript + Tailwind 3.4 PWA for the Zewail City Formula Student team. The owner's complaint: **"the UI is too small on mobile."** An audit of commit `c10c617` confirmed it, and found the cause is systemic, not one bad value. Your job is to fix it in small, verified phases, and **report back to the owner after every phase**.

Work carefully rather than fast. Before editing any file, **read it in full first**. Line numbers below came from `c10c617` and may have drifted: **locate code with `grep`, do not trust line numbers.**

---

## 1. HOUSE RULES (read these before doing anything)

1. Read `GEMINI.md`, `PLAN.md` and the top of `PROGRESS.md` first. Obey them. Relevant rules from `GEMINI.md` that the code currently violates:
   - "Touch targets must be >= 44px (prefer 48px)."
   - Body / forms / chat use **Exo 2**; **Share Tech Mono is only for telemetry, IDs, timestamps.**
   - Initial bundle must stay **under 200KB gzipped**.
2. **Free tier only.** Do not add paid services. Avoid new dependencies; if you think one is needed, stop and ask.
3. **Do not touch** `supabase/`, auth logic (`useAuth`, `AuthScreen` behavior), RLS, or any data hooks. This task is presentation only.
4. **Desktop (≥768px) must look the same unless a step says otherwise.** Make changes mobile-first with `md:` restoring the previous desktop look.
5. Keep the Y2K / cyber-racing look (glass cards, accents, Orbitron headings). You are fixing scale and ergonomics, not redesigning the brand.
6. Keep dark and light themes both working. Keep `prefers-reduced-motion` handling.
7. **Git:** work on branch `feature/mobile-ui-polish` created from `master`. **One commit per phase**, message `mobile(phaseN): <summary>`. **Never push to `master`.** Push the branch after each phase.
8. After each phase, update `PROGRESS.md` using the repo's evidence tags: `[VERIFIED: <command>]` or `[IMPLEMENTED, UNTESTED: <reason>]`. Never claim VERIFIED without running the command.
9. Tailwind note: write arbitrary classes sparingly. Prefer tokens added in `tailwind.config.js`.
10. Windows paths appear in `GEMINI.md`, so the owner may be on Windows. **Do not use `sed`, `xargs` or other Unix-only tools.** Use Node scripts for bulk edits. Put throwaway scripts in a scratch folder outside `src/`, do not commit them.

---

## 2. USE YOUR SKILLS (you have 300+)

At the **start of every phase**:
1. List or search your available skills for the phase topic (e.g. *tailwind, responsive design, mobile UI, accessibility / a11y / WCAG, touch targets, PWA, React components, typography, forms, modals/dialogs, navigation, git workflow, testing/verification, screenshot/browser testing*).
2. Pick the most relevant ones and **actually load and follow them**.
3. **Do not invent skill names.** Only use skills that exist in your list. If none fit, say so and proceed with the instructions here.
4. In every phase report, list **which skills you used and what each contributed**.

Prefer a skill that can run the app in a mobile viewport and screenshot it (browser/Playwright-style) for visual verification. If none exists, verify with the build checks and say that visual checks were not possible.

---

## 3. REPORTING PROTOCOL (mandatory)

After finishing each phase, **stop** and send the owner a report in exactly this format, then **wait for the reply "continue"** (the repo's working agreement is to wait for approval between slices). If the owner says "continue without stopping", keep the same reports but do not wait.

```
## Phase N report: <name>
**Status:** done | partial | blocked
**Summary (max 5 lines):** ...
**Files changed:** path (+added/-removed lines) ...
**Skills used:** name: what it did ...
**Verification:** each command run + result (pass/fail, key numbers)
**Before → after metrics:** (see §4)
**Risks / things to eyeball on a real phone:** ...
**Decisions I made that you may want to override:** ...
**Next phase:** one line
```

Rules for reports: be honest about anything not verified, never hide a failing check, and include the commit hash.

---

## 4. BASELINE METRICS (record in Phase 0, re-measure every phase)

Run these from the repo root. Cross-platform, no Unix tools: save as a scratch script `mobile-metrics.mjs` outside `src/`.

```js
// mobile-metrics.mjs  (run: node mobile-metrics.mjs)
import fs from 'node:fs';
import path from 'node:path';

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    f.isDirectory() ? walk(p, out) : /\.(tsx|ts|css)$/.test(f.name) && out.push(p);
  }
  return out;
}
const files = walk('src');
const count = (re) => files.reduce((n, f) => n + (fs.readFileSync(f, 'utf8').match(re) || []).length, 0);

console.log({
  'text-[8..11px]':      count(/text-\[(8|9|10|11)px\]/g),
  'text-xs (12px)':      count(/\btext-xs\b/g),
  'text-sm+':            count(/\btext-(sm|base|lg)\b/g),
  'w-8/h-8 (32px)':      count(/\b(w|h)-8\b/g),
  'h-9 (36px)':          count(/\bh-9\b/g),
  'vh / min-h-screen':   count(/\b\d+vh\b|min-h-screen|h-screen/g),
  'user-scalable=no':    /user-scalable=no/.test(fs.readFileSync('index.html', 'utf8')) ? 1 : 0,
});
```

**Baseline at `c10c617` (your numbers should match closely):** `text-[11px]` 144, `text-[10px]` 109, `text-[9px]` 25, `text-[8px]` 1 (= 279 total), `text-xs` 243, `text-sm` 51, `text-base` 19, `w-8` 17 / `h-8` 27, `h-9` 14, `user-scalable=no` present.

Also record each phase: `npx tsc --noEmit` result, `npm run build` result and **gzip size** (must stay < 200KB), and `node scripts/verify-suite.mjs` pass count (baseline in `PROGRESS.md`: 41/41).

---

## PHASE 0: Recon & baseline (no source changes)

**Goal:** get a trustworthy baseline and a working branch.

Do:
1. `git checkout master && git pull && git checkout -b feature/mobile-ui-polish`.
2. Read `GEMINI.md`, `PLAN.md`, top of `PROGRESS.md`, `tailwind.config.js`, `src/index.css`, `index.html`, `src/App.tsx`, and every file in `src/components/layout/`.
3. Run `npm ci`, then the baseline metrics script, `npx tsc --noEmit`, `npm run build`, `node scripts/verify-suite.mjs`.
4. List your skills (§2) and name the ones you plan to use per phase.
5. If you can run a browser/screenshot skill: capture Dashboard, Tasks, Chat (open thread), Docs, Team, Auth, and the Task create modal at **360×740, 390×844, 430×932**, dark and light. Save outside `src/` (or note that screenshots are impossible).
6. Confirm the findings in §5 against the actual code. **If something in §5 is wrong or already fixed, say so in your report.**

**Done when:** baseline numbers recorded, branch created, plan confirmed. **Report, then wait.**

---

## 5. WHAT THE AUDIT FOUND (ground truth, confirm in Phase 0)

| # | Finding | Where |
|---|---|---|
| A | 279 uses of 8–11px text; most body text is only 12px; only ~70 places use 14px+ | whole `src/`; worst: `MissionControl.tsx` (49), `StyleGuide.tsx` (48), `AdminApprovalHub.tsx` (35), `TeamDirectory.tsx` (25), `HybridRacingRail.tsx` (19), `TasksHub.tsx` (14) |
| B | Header icon buttons are 32px on mobile (`w-8 h-8 sm:w-10 sm:h-10`) | `TopHeader.tsx` |
| C | Many controls 36px or less: inputs/selects `h-9 text-xs`, `GlossyButton sm` `h-9`, `GhostButton sm` `h-8`, chat composer `h-9`, modal close `w-8 h-8`, filter chips `px-2.5 py-1 text-[11px]` (~26px), auth mode toggle `py-1.5 text-xs` | `GlowInput`, `GlossyButton`, `GhostButton`, `ChatView`, `TasksHub`, `TeamDirectory`, `DocumentHub`, `AuthScreen`, modals |
| D | Zoom disabled: `maximum-scale=1.0, user-scalable=no` | `index.html` |
| E | Inputs are 12px, so iOS auto-zooms on focus (likely why D exists) | `GlowInput`, search/select inputs |
| F | `font-mono` (Share Tech Mono, one weight only, so `font-bold` is faux bold) used for most labels, uppercase, 9–11px | everywhere; the Google Fonts URL in `index.html` loads no weights for it |
| G | `status-bar-style: black-translucent` + `viewport-fit=cover`, but `TopHeader` has no `env(safe-area-inset-top)` padding (`--sat` defined, never used) | `TopHeader.tsx`, `index.css` |
| H | Floating nav pill reaches ≈102px from the bottom on notched iPhones (56px + 12px + ~34px inset) but `<main>` only has `pb-20` (80px) | `GarageDoorNav.tsx`, `AppShell.tsx` |
| I | `100vh` / `min-h-screen` instead of `dvh`: chat (`h-[calc(100vh-9.5rem)]`), auth, modals, search, garage sheet | see grep in §4 |
| J | Desktop-style centered modals with `p-4` + `p-6` padding; `grid-cols-2` / `grid-cols-3` forms on 360px | `TaskCreateModal`, `TaskDetailModal`, `FileUploadModal`, `RoleGuideModal`, `NewDMModal`, `NotificationDrawer`, `GlobalSearchModal` |
| K | Active nav = floating pill → bottom sheet: **two taps to change tab** | `GarageDoorNav.tsx` (legacy `BottomNav.tsx` still exists, labels 10px) |
| L | Dashboard shows up to nine stat tiles, each with 11px label + number + 11px caption | `MissionControl.tsx` |
| M | Tasks filter chips wrap to multiple lines; document/team tab strips scroll with no cue | `TasksHub`, `DocumentHub`, `TeamDirectory` |
| N | Contrast: light placeholder `#94A3B8` on white = **2.56:1**; dark placeholder `#737D89` on `#181E26` = **4.01:1**; light `accent-yellow #B8860B` on white = **3.25:1** | `index.css`, `GlowInput` |
| O | Dead / invalid classes: `xs:` breakpoint is used but never defined; `py-0.2` is not a Tailwind value; no `apple-touch-icon`; static `theme-color`; manifest `background_color` is light while app defaults to dark | `TopHeader`, `GarageDoorNav`, `index.html`, `vite.config.ts` |

---

## PHASE 1: Foundations (config + global CSS only)

**Goal:** put the guardrails in place so later phases are mechanical. No component edits yet.

### 1.1 Remove the zoom lock: `index.html`
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

### 1.2 16px / 44px form controls on mobile: `src/index.css` (inside `@layer base`)
The existing global input rule uses `:not()` chains with high specificity while `select`/`textarea` have low specificity, so a plain rule can lose to `text-xs`. Use `!important` here **on purpose**, and verify with computed style.
```css
@media (max-width: 767px) {
  input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]),
  select,
  textarea {
    font-size: 16px !important; /* prevents iOS focus-zoom */
    min-height: 44px;
  }
  button, [role="button"], a, summary { touch-action: manipulation; }
}
```

### 1.3 Type tokens: `tailwind.config.js` (`theme.extend`)
```js
fontSize: {
  label:    ['0.75rem',  { lineHeight: '1rem',    letterSpacing: '0.04em' }], // 12px floor
  body:     ['0.875rem', { lineHeight: '1.25rem' }],                           // 14px
  'body-lg':['1rem',     { lineHeight: '1.5rem' }],                            // 16px
},
screens: { xs: '420px' }, // makes the existing `xs:` class in TopHeader real
```
Note: adding `screens` in `extend` keeps the defaults; add `xs` only (verify `sm/md/lg` still resolve, since `extend.screens` merges but order matters, so check the build output).

### 1.4 Touch-target utility: `src/index.css`
```css
@layer components {
  .tap-target {
    @apply inline-flex min-h-[44px] min-w-[44px] items-center justify-center;
  }
}
```

### 1.5 Fonts: `index.html`
Keep Orbitron and Exo 2. Share Tech Mono has only a regular weight, so from now on **never use `font-bold` on `font-mono`**. (Phase 2 enforces this.)

**Done when:** `npx tsc --noEmit`, `npm run build` pass; gzip still < 200KB; on a 390px viewport an `<input>` reports computed `font-size: 16px` (check in browser if you can); `sm/md/lg/xl` breakpoints still work. **Commit, update PROGRESS.md, report, wait.**

---

## PHASE 2: Type floor and touch-target sweep

**Goal:** nothing below 12px; reading text 14–16px; every tappable element ≥44px tall on mobile.

### 2.1 Replace tiny text (use a Node script, not sed)
```js
// scratch/codemod-text.mjs   run from repo root: node ../scratch/codemod-text.mjs
import fs from 'node:fs';
import path from 'node:path';
function walk(d, o = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    e.isDirectory() ? walk(p, o) : /\.tsx$/.test(e.name) && o.push(p);
  }
  return o;
}
let total = 0;
for (const f of walk('src')) {
  const s = fs.readFileSync(f, 'utf8');
  const n = s.replace(/text-\[(8|9|10|11)px\]/g, 'text-label');
  if (n !== s) {
    fs.writeFileSync(f, n);
    total += (s.match(/text-\[(8|9|10|11)px\]/g) || []).length;
    console.log('updated', f);
  }
}
console.log('replacements:', total);
```
Then **review the diff file by file**: growing 9→12px will overflow tight badges and tiles. Fix overflows by shortening text, using `truncate`, or dropping decorative elements **on mobile** (`hidden sm:inline`), never by shrinking text again. `StyleGuide.tsx` documents the system, so update its examples deliberately.

### 2.2 Reading text sizes (mobile defaults, desktop keeps the old size)
| Element | Now | Change to |
|---|---|---|
| Task title (`TaskCard`) | `text-xs sm:text-sm` | `text-body-lg sm:text-sm` |
| Task / doc descriptions | `text-xs` | `text-body sm:text-xs` |
| Chat message body (`MessageBubble`) | `text-xs sm:text-sm` | `text-body-lg sm:text-sm` |
| Chat sender / timestamp / role chip | 11 / 9 / 9px | `text-label` |
| Notification rows | 9–10px meta | `text-label` |
| Buttons (`GlossyButton`/`GhostButton`) | `text-xs sm:text-sm` | `text-sm` at all sizes |

### 2.3 Bold on mono
Search for `font-mono` combined with `font-bold`/`font-semibold` and change to `font-medium` or remove emphasis, or move that label to `font-sans`. Informational labels (not IDs/timestamps/counters) should use `font-sans` (Exo 2), per `GEMINI.md`. Avoid `uppercase` on anything longer than ~2 words.

### 2.4 Touch targets
| File | Change |
|---|---|
| `TopHeader.tsx` | search, bell, theme, avatar buttons → `tap-target` (44px) on all sizes. Header stays `h-14` (56px) |
| `GhostButton.tsx` / `GlossyButton.tsx` | `sm` size: add `min-h-[44px] sm:min-h-0` so mobile is 44px, desktop unchanged |
| Modal close buttons (`TaskCreateModal`, `TaskDetailModal`, `FileUploadModal`, `RoleGuideModal`, `NewDMModal`, `NotificationDrawer`, `GarageDoorNav` sheet) | `w-8 h-8` → `tap-target` |
| Filter chips (`TasksHub`, `TeamDirectory`, `DocumentHub`) | `px-3.5 py-2.5 text-label min-h-[40px]` (44px preferred) |
| Chat rows and composer (`ChatView`) | rows `py-3 text-body`; composer input `min-h-[44px]`; send button 44px |
| `AuthScreen` mode toggle | `py-3 text-sm`; "forgot password" and other `text-[10px]` links get `text-label` + `py-2` |
| Anything else with `h-8`, `h-9`, `w-8` on a `<button>` | grep and fix; small icon + padded button is fine (icon 16–20px, hit area 44px) |

**Done when:** metrics script shows `text-[8..11px]` = **0** (outside an allowlist you justify), `user-scalable=no` = 0; `tsc` and `build` pass, gzip < 200KB; `verify-suite.mjs` still passes; screenshots at 390px show no clipped/overflowing text. **Commit, report with before/after metrics, wait.**

---

## PHASE 3: Layout, safe areas, viewport units

### 3.1 Header respects the notch: `TopHeader.tsx`
```tsx
<header className="sticky top-0 z-20 w-full ... pt-[env(safe-area-inset-top)]"
        style={{ paddingLeft: 'var(--rail-offset, 0px)' }}>
  <div className="max-w-7xl mx-auto h-14 sm:h-16 px-[max(0.625rem,env(safe-area-inset-left))] ...">
```
(Keep existing classes; add the safe-area padding. Remember `viewport-fit=cover` is on.)

### 3.2 Content clears the floating nav: `AppShell.tsx`
```tsx
<main className="flex-1 p-3.5 sm:p-5 md:p-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-8 max-w-7xl mx-auto w-full overflow-x-hidden">
```
Apply to the legacy branch too. If Phase 5 changes the nav height, revisit this.

### 3.3 `vh` → `dvh` (Tailwind 3.4 supports these)
| Find | Replace |
|---|---|
| `min-h-screen` (`App.tsx`, `AppShell`, `AuthScreen`, `PendingApprovalView`, `F1HorizontalTransition`) | `min-h-dvh` |
| `h-[calc(100vh-9.5rem)]` (`ChatView`) | `h-[calc(100dvh-9.5rem)]` |
| `max-h-[92vh]`, `[90vh]`, `[85vh]`, `[78vh]`, `[75vh]`, `[50vh]` | same with `dvh` |

Leave the desktop `Sidebar` (`h-[calc(100vh-...)]`) alone.

### 3.4 Auth keyboard fix
`AuthScreen.tsx` wrapper has `overflow-hidden`, which can trap the submit button under the on-screen keyboard on short phones. Make the page scrollable (`overflow-y-auto`) while keeping decorative layers clipped inside their own container.

### 3.5 Install/PWA polish
- `index.html`: add `<link rel="apple-touch-icon" href="/icon-192.png" />`.
- `AppShell.tsx` `toggleTheme` effect: also update the `theme-color` meta:
```tsx
useEffect(() => {
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', isDarkMode ? '#070A0E' : '#F3F6FA');
}, [isDarkMode]);
```
- `vite.config.ts`: `background_color` → `'#070A0E'` (app defaults to dark).
- Remove invalid `py-0.2` (use `py-0.5` or `py-px`).

**Done when:** build/tsc pass; in a 390×844 screenshot nothing is under the status bar area or the nav pill; chat height uses `dvh`. **Commit, report, wait.**

---

## PHASE 4: Modals become sheets; chat composer

### 4.1 Reusable shell: `src/components/common/ModalShell.tsx`
```tsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalShellProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const ModalShell: React.FC<ModalShellProps> = ({ open, title, onClose, children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80"
         role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="w-full md:max-w-lg max-h-[92dvh] md:max-h-[85dvh] flex flex-col rounded-t-2xl md:rounded-2xl
                      bg-cyber-surface border border-cyber-border-strong shadow-cyber-elevated">
        <div className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-cyber-border">
          <h2 className="font-display font-bold text-sm uppercase tracking-wider text-cyber-primary truncate">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="tap-target rounded-lg text-cyber-muted hover:text-cyber-primary">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3">{children}</div>
        {footer && (
          <div className="shrink-0 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-cyber-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
```
Migrate one modal at a time, starting with `TaskCreateModal`, then `FileUploadModal`, `NewDMModal`, `RoleGuideModal`, `TaskDetailModal` (complex: keep its tab logic, just wrap), `NotificationDrawer`. Keep each modal's existing behavior and props. If a modal is too tangled to migrate safely, apply the same classes in place and note it in the report. Do not break any handler.

### 4.2 Form grids on phones
- `TaskCreateModal` `grid-cols-2` fields → `grid-cols-1 sm:grid-cols-2`.
- `TaskDetailModal` `grid-cols-3` → `grid-cols-1 sm:grid-cols-3`.
- `TaskDetailModal` tab strip: `py-3 text-sm`, sticky at the top of the scroll area.

### 4.3 Search modal: `GlobalSearchModal.tsx`
Full width on mobile, `pt-[max(1rem,env(safe-area-inset-top))]`, `max-h-[75dvh]`, results scroll inside, input is 16px (Phase 1 covers it).

### 4.4 Chat: `ChatView.tsx`
- Hide the floating nav pill while a conversation is open on mobile so the composer owns the bottom edge (pass a prop or use a context flag; keep it minimal).
- Composer wrapper: `pb-[env(safe-area-inset-bottom)]`. Replace the single-line `<input>` with an auto-growing `<textarea>`:
```tsx
<textarea
  rows={1}
  value={text}
  onChange={(e) => { setText(e.target.value); e.currentTarget.style.height = 'auto';
                     e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 120) + 'px'; }}
  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !isMobile) { e.preventDefault(); submit(); } }}
  className="flex-1 min-h-[44px] max-h-[120px] px-3 py-2.5 rounded-lg resize-none text-base"
/>
```
(Adapt names `text`, `submit`, `isMobile` to the file's real state; on touch devices Enter should insert a newline and Send button sends.)

**Done when:** build/tsc pass; each migrated modal opens as a bottom sheet at 390px and a centered card at ≥768px; close works via button, Escape and backdrop; the primary action stays visible with the keyboard open; no regression in submit flows (run `verify-suite.mjs`). **Commit, report, wait.**

---

## PHASE 5: Navigation, FABs, scrolling chip rows

### 5.1 Real bottom tab bar + "More"
Today switching tabs takes two taps. Add a mobile tab bar with the 4 primary destinations and a **More** tab that opens the existing garage-door sheet (keep that sheet; it is a good secondary menu). `NavTab` and `getVisibleNavItems(role)` come from `src/config/navigation.ts` (items have `id`, `label`, `icon`, `subtitle`; confirm the exact shape by reading the file).
```tsx
const PRIMARY: NavTab[] = ['dashboard', 'tasks', 'chat', 'docs'];

<nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-cyber-surface/95 backdrop-blur-md border-t border-cyber-border
                pb-[env(safe-area-inset-bottom)]">
  <div className="grid grid-cols-5">
    {items.filter(i => PRIMARY.includes(i.id)).map(i => (
      <button key={i.id} onClick={() => onTabChange(i.id)} aria-current={activeTab === i.id ? 'page' : undefined}
        className={`min-h-[56px] flex flex-col items-center justify-center gap-0.5 text-label
                    ${activeTab === i.id ? 'text-accent-cyan' : 'text-cyber-secondary'}`}>
        <i.icon className="w-6 h-6" />
        <span>{i.label}</span>
      </button>
    ))}
    <button onClick={openMore} className="min-h-[56px] flex flex-col items-center justify-center gap-0.5 text-label text-cyber-secondary">
      <Menu className="w-6 h-6" /><span>More</span>
    </button>
  </div>
</nav>
```
Keep the unread chat badge on the chat tab. Update `AppShell` bottom padding to the new bar height (about 56px + safe area; `pb-[calc(4.5rem+env(safe-area-inset-bottom))]`). Keep `USE_HYBRID_RACING_RAIL` desktop behavior untouched. Raise the existing sheet's tile labels to `text-sm` and subtitles to `text-label`; make the whole sheet header (not only the handle) draggable. Remove or hide the 11px `LIVE` chip on mobile. Keep the old pill behind a constant flag (e.g. `USE_MOBILE_TAB_BAR`) for easy rollback, in line with the repo's existing rollback-flag pattern.

### 5.2 Floating action button for the main create action
On Tasks (New task) and Docs (Upload): a 56px FAB, bottom-right, above the nav:
```tsx
<button className="md:hidden fixed right-4 z-30 w-14 h-14 rounded-2xl bg-accent-cyan text-black shadow-glow-cyan
                   bottom-[calc(4.5rem+env(safe-area-inset-bottom))] flex items-center justify-center" aria-label="New task">
  <Plus className="w-6 h-6" />
</button>
```
Move Export/Import into an overflow menu on mobile.

### 5.3 Single-row scrolling chips
Replace wrapped chip rows (`TasksHub` status filters, `DocumentHub` categories, `TeamDirectory` sub-team filter) with:
```tsx
<div className="-mx-3.5 px-3.5 flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none
                [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-24px),transparent)]">
  {/* chips: shrink-0 snap-start min-h-[44px] px-4 */}
</div>
```
Add `.scrollbar-none { scrollbar-width: none; } .scrollbar-none::-webkit-scrollbar { display: none; }` to `index.css`.

**Done when:** one tap switches among the 4 primary tabs; the More sheet still reaches every destination incl. Admin for admins; badge works; no content hidden behind the bar; desktop unchanged. **Commit, report, wait.**

---

## PHASE 6: Density and contrast

### 6.1 Dashboard (`MissionControl.tsx`)
- On mobile show the **3–4 most important tiles** at large size (number `text-3xl font-display`, label `text-label`), and put the rest behind a "More stats" toggle (or a horizontal `snap-x` carousel). Priority by role, e.g. members: Assigned to me, <72H, Feedback; heads: Pending approval, Reviews, Alerts. Confirm the tile list and role logic by reading the file.
- Hide the second caption line below `sm` (`hidden sm:block`).
- Sub-team card gauge labels → `text-label`.

### 6.2 Cards
- `TaskCard`: cap mobile chips to 1 type badge + deadline; avatars 28px; keep the whole card tappable.
- `DocumentHub`, `TeamDirectory` cards: metadata 12px, title `text-body-lg`, max one badge on mobile.

### 6.3 Contrast fixes (`index.css`, `GlowInput.tsx`)
| Token / class | Now | Make |
|---|---|---|
| light placeholder | `#94A3B8` (2.56:1) | `#64748B` (~4.76:1 on white) |
| dark placeholder | `#737D89` (4.01:1) | `#8A96A4` (~5:1 on `#181E26`) |
| light `--accent-yellow` used as **text** | `#B8860B` (3.25:1) | add `--accent-yellow-text: #8A6508` for text on light surfaces (verify ≥4.5:1), keep `#B8860B` for fills |

Run `node scripts/measure-contrast.mjs` before and after, and include the numbers in the report.

**Done when:** a 390px dashboard shows no more than ~4 prominent tiles initially; no text under 12px; contrast script shows the placeholders ≥4.5:1; build/tsc/verify-suite pass. **Commit, report, wait.**

---

## PHASE 7: Regression guard and wrap-up

### 7.1 `scripts/verify-mobile-ui.mjs` (no dependencies)
```js
import fs from 'node:fs';
import path from 'node:path';

let fail = 0;
const ok = (c, m) => { console.log(`${c ? '  ✅ [PASS]' : '  ❌ [FAIL]'} ${m}`); if (!c) fail++; };

function walk(d, o = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    e.isDirectory() ? walk(p, o) : /\.(tsx|css)$/.test(e.name) && o.push(p);
  }
  return o;
}
const ALLOW = []; // e.g. ['src/components/styleguide/StyleGuide.tsx']  (justify each entry in PROGRESS.md)
const files = walk('src').filter(f => !ALLOW.includes(f.replaceAll('\\', '/')));

const tiny = files.filter(f => /text-\[(8|9|10|11)px\]/.test(fs.readFileSync(f, 'utf8')));
ok(tiny.length === 0, `no text below 12px (${tiny.join(', ') || 'clean'})`);

const html = fs.readFileSync('index.html', 'utf8');
ok(!/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/.test(html), 'pinch-zoom is not disabled');
ok(/apple-touch-icon/.test(html), 'apple-touch-icon present');

const vh = files.filter(f => /\b\d+vh\b|min-h-screen/.test(fs.readFileSync(f, 'utf8')) && !/Sidebar/.test(f));
ok(vh.length === 0, `no vh / min-h-screen outside desktop Sidebar (${vh.join(', ') || 'clean'})`);

const css = fs.readFileSync('src/index.css', 'utf8');
ok(/font-size:\s*16px/.test(css), '16px mobile input rule exists');
ok(/tap-target/.test(css), 'tap-target utility defined');

const header = fs.readFileSync('src/components/layout/TopHeader.tsx', 'utf8');
ok(/safe-area-inset-top/.test(header), 'header handles top safe area');

process.exit(fail ? 1 : 0);
```
Wire it into `scripts/verify-suite.mjs` the same way the other verifiers are included (read how they are called first).

### 7.2 Docs
- `StyleGuide.tsx`: document the type tokens (`label` / `body` / `body-lg`), the `tap-target` utility, `ModalShell`, and the new minimums (12px text floor, 44px targets).
- `GEMINI.md`: add one line each: text never below 12px; inputs 16px on mobile; no `vh`, use `dvh`; no `font-bold` on `font-mono`.
- `PROGRESS.md` and `PLAN.md`: add this work as a completed slice with evidence tags.

### 7.3 Final report and PR
Final report = all phase metrics side by side (baseline vs now), full verification run, list of things the owner must test on a **real phone in the installed PWA** (notch, keyboard, nav, chat composer, modals), and known leftovers. Push the branch and give the owner the PR link: `https://github.com/meowerr/zc-fs/pull/new/feature/mobile-ui-polish`. **Do not merge.**

---

## 6. ACCEPTANCE CHECKLIST (all must be true at the end)

- [ ] No text below 12px; reading text 14–16px on mobile
- [ ] All inputs/selects/textareas 16px on mobile; pinch-zoom works
- [ ] Every button/link/chip/close button ≥44px on mobile
- [ ] Header and bottom nav respect notch / home-indicator insets; nothing hidden behind the nav
- [ ] No `vh` / `min-h-screen` outside the desktop sidebar
- [ ] Modals are bottom sheets on mobile, centered cards on desktop; keyboard never hides the primary action
- [ ] One-tap switching among the 4 main tabs; every destination still reachable
- [ ] Dashboard readable without scrolling through a wall of micro-text
- [ ] Placeholder contrast ≥4.5:1 in both themes
- [ ] `npx tsc --noEmit`, `npm run build` (gzip < 200KB) and `node scripts/verify-suite.mjs` all pass; new `verify-mobile-ui.mjs` passes
- [ ] Desktop (≥768px) layout unchanged
- [ ] Every phase reported; `PROGRESS.md` updated with evidence tags; branch pushed, **not merged**

## 7. IF YOU GET STUCK

- A change breaks a layout and the cause is unclear: revert that file (`git checkout -- <file>`), apply a smaller version, and tell the owner in the report.
- A step conflicts with `GEMINI.md`: follow `GEMINI.md`, and say so.
- You are unsure whether something is in scope: **ask** instead of guessing. Presentation changes only.
- Never mark anything VERIFIED that you did not run.
