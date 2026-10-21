# PROMPT: Mobile UI Round 2 — Fix Regressions, Then Make It Feel Native (PitLane)

> **How to use:** in the Gemini CLI, on branch `feature/mobile-ui-polish`, send:
> `Read @MOBILE_UI_ROUND2.md and follow it exactly. Start with Phase R0.`
> Round 1 (`MOBILE_UI_IMPROVEMENTS.md`, phases 1–6) is already committed. **Finish its Phase 7 only after Round 2**, so the regression guard locks in the final state, not the broken one.

---

## 0. WHY ROUND 2

Round 1 fixed **scale**: text is readable, buttons are tappable. Reviewing real 360px screenshots of the result shows the **structure** is still a desktop page squeezed into a phone. Findings, in priority order:

| # | Problem seen in screenshots | Effect |
|---|---|---|
| 1 | **Bottom tab labels collide**: "Pit Wal" is clipped and touches "Documents" (reads "Pit WalDocuments") on every screen. Labels use `font-display` (Orbitron, very wide) in 5 equal columns | Visible bug on every screen |
| 2 | Dashboard tile headers collide with their tags: "REGISTRATIONSA", "COMPLETEDDONE", "TOTAL TASKS ALL" | Looks broken |
| 3 | Chat composer: placeholder "Transmit message to Pit Wall (Head…" wraps and clips, scrollbar visible in a ~1-line box; "Built for Zewail Formula Team" footer pill wastes ~70px under the composer | Core feature feels cramped |
| 4 | Header shows "Club Adm…" truncated; 4 icon buttons + brand fill the bar | Lost context |
| 5 | **Every screen opens with a hero card** (title + paragraph + 1–3 stacked buttons + stat tiles). On Tasks the first screen shows **zero tasks** | Content below the fold |
| 6 | **Cards inside cards**: `main` padding + outer glass card padding + inner bordered tiles ≈ 30px lost per side on a 360px screen | Wasted width |
| 7 | Search + scope `<select>` + chip row = three stacked rows before the first result | Filtering costs a screen |
| 8 | Dashboard hero has "Admin Command", "Create Task", "Pit Wall Chat" buttons that duplicate the tab bar | Noise |
| 9 | Nothing feels touch-native: no pull-to-refresh, no loading skeletons, no swipe on tasks, filters are chip rows instead of a sheet, no press feedback beyond scale | Feels like a website |
| 10 | Visual hierarchy is flat: everything is a bordered box with uppercase mono 12px text | Nothing stands out |
| 11 | Minor: Tasks FAB covers the first filter chip; More-sheet subtitles truncate ("Review & De…"); Team "VEHICLE-DYNAMICS" chip overflows; Team header pill wraps awkwardly | Polish |

Phase R0 fixes 1–4 and 11. Phases R1–R6 fix 5–10.

---

## 1. RULES (same as Round 1, plus these)

1. Obey `GEMINI.md`, `PLAN.md`. Read every file fully before editing. **Locate code with `grep`; line numbers drift.**
2. **Presentation only.** Don't touch `supabase/`, auth logic, RLS, or data hooks' logic. Hooks may be *read* for names (`useTasks` exposes `loading`; filter state in `TasksHub` is `filter` / `searchQuery`).
3. **No new dependencies.** The bundle is at ~199.7 KB gzip against a hard **200 KB** limit, so there is **~0.3 KB of headroom**. Everything below must be hand-rolled and tiny. After each phase run the build and report the gzip number; if you're over, lazy-load something (e.g. the StyleGuide, legal view, admin hub with `React.lazy`) before adding more.
4. Desktop (≥768px) must look the same unless a step says otherwise. Mobile-first, `md:` restores desktop.
5. Keep the Y2K / cyber-racing identity (glass, accents, Orbitron for **headings**). Calm it down on mobile; don't replace it.
6. Dark + light themes both must work. Respect `prefers-reduced-motion`.
7. Git: continue on `feature/mobile-ui-polish`. One commit per phase: `mobile(R<n>): <summary>`. Push after each. **Never push to `master`. Don't merge.**
8. Update `PROGRESS.md` per phase with evidence tags `[VERIFIED: <cmd>]` / `[IMPLEMENTED, UNTESTED: <why>]`. Never claim VERIFIED without running it. Also **fix the stale "Current Status" header** at the top of `PROGRESS.md`.
9. Windows owner: **no `sed`/`xargs`/Unix-only tools.** Use Node scripts for bulk edits, kept outside `src/` and not committed.
10. **Use your skills** (you have 300+): at the start of each phase search for relevant ones (*mobile UX, responsive layout, touch interaction, gestures, accessibility, Tailwind, React performance, skeleton/loading states, bottom sheets, forms, screenshot/Playwright testing*), load and follow them, **never invent names**, and list what each contributed in the report. Prefer a skill that can screenshot at 360×740 / 390×844 / 430×932 in dark and light; if none exists, say visual checks weren't possible.
11. **Reporting:** after every phase, stop and send this, then wait for "continue" (unless the owner says to continue without stopping):

```
## Phase R<n> report: <name>
**Status:** done | partial | blocked
**Summary (max 5 lines):** ...
**Files changed:** path (+/-)
**Skills used:** name: what it did
**Verification:** each command + result; build gzip KB; verify-suite pass count
**Before → after:** (what the owner will see; screenshots if possible)
**Risks / check on a real phone:** ...
**Decisions you may want to override:** ...
**Next phase:** one line
```

---

## PHASE R0 — Fix the regressions (small, do first)

### R0.1 Tab bar label collision (`GarageDoorNav.tsx`, the 5-tab `grid-cols-5` bar)
Cause: `font-display` (Orbitron is wide) + "Documents" in a ~68px column. Fix all three: body font, short labels, truncation.
```tsx
// label text: use short names in the bar only (keep full names in the More sheet)
const BAR_LABEL: Record<string, string> = { dashboard: 'Control', tasks: 'Tasks', chat: 'Chat', docs: 'Docs' };

<button className="min-h-[56px] min-w-0 flex flex-col items-center justify-center gap-0.5 px-1 ...">
  <Icon className="w-6 h-6 shrink-0" />
  <span className="max-w-full truncate font-sans font-semibold text-label leading-none tracking-normal">
    {BAR_LABEL[item.id] ?? item.label}
  </span>
</button>
```
(Remove `font-display` from the labels. `tracking-normal` overrides the letter-spacing baked into `text-label`.) Verify at **320px** too.

### R0.2 Stat tile header collision (`MissionControl.tsx`, `TasksHub.tsx`, `TeamDirectory.tsx`)
Each tile header must be a flex row with a gap, and the label must be allowed to shrink:
```tsx
<div className="flex items-center justify-between gap-2 min-w-0">
  <span className="min-w-0 truncate text-label font-sans font-semibold uppercase tracking-wide text-cyber-secondary">{label}</span>
  <span className="hidden sm:inline shrink-0 text-label font-mono text-accent-cyan">{tag}</span>
</div>
```
The tag ("ALL", "DONE", "ALERT") just repeats the label, so **hide it below `sm`**.

### R0.3 Chat composer (`ChatView.tsx`)
```tsx
<textarea
  rows={1}
  placeholder="Message…"            // short: never wraps
  className="flex-1 min-h-[44px] max-h-[120px] py-[10px] px-3 resize-none overflow-hidden text-base leading-6"
  onChange={(e) => {
    setText(e.target.value);
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    el.style.overflowY = el.scrollHeight > 120 ? 'auto' : 'hidden';
  }}
/>
```
Also **hide the "Built for Zewail Formula Team" footer** while a chat thread is open on mobile (it already toggles `html[data-hide-mobile-nav]`; reuse that signal or `hidden md:block`). Reset the textarea height to `auto` after sending.

### R0.4 Header context (`TopHeader.tsx`)
Give the group name room: `max-w-[85px]` → `min-w-0 flex-1 truncate`. Reduce right-side buttons to **search, bell, avatar** on mobile; move the **theme toggle into the profile sheet/menu** on mobile (`hidden md:flex` on the header button; add a "Theme" row where the profile opens). Keep desktop unchanged.

### R0.5 Minor
- Tasks FAB (`TasksHub`): give the page `pb-[calc(9rem+env(safe-area-inset-bottom))]` so the last card and the chip row aren't hidden; FAB `bottom-[calc(5rem+env(safe-area-inset-bottom))]`.
- More sheet tiles: subtitle `line-clamp-2` instead of `truncate`, tile `min-h-[72px]`.
- `TeamDirectory`: sub-team chip text `truncate max-w-[9rem]`, header pill → `flex-wrap gap-1`.
- Remove the duplicate `max-h-[78vh] max-h-[78dvh]` in `GarageDoorNav` (keep `dvh`).

**Done when:** at 320 / 360 / 390 / 430 px no label touches another; chat placeholder never wraps; `tsc`, `build` (gzip < 200 KB), `verify-suite.mjs` pass. **Commit, report, wait.**

---

## PHASE R1 — Content-first page headers (the biggest UX win)

**Goal:** the first screen of every page shows *real content*, not a hero.

### R1.1 A compact header component: `src/components/common/PageHeader.tsx`
```tsx
import React from 'react';

interface Props {
  title: string;
  eyebrow?: string;            // small tag e.g. "Race Control HQ", hidden on mobile
  description?: string;        // hidden on mobile
  actions?: React.ReactNode;   // shown inline on ≥ sm; on mobile put primary action in a FAB
  stats?: React.ReactNode;     // see StatStrip
}

export const PageHeader: React.FC<Props> = ({ title, eyebrow, description, actions, stats }) => (
  <header className="mb-3 md:mb-6">
    {eyebrow && <p className="hidden md:block text-label font-mono uppercase text-accent-cyan mb-1">{eyebrow}</p>}
    <div className="flex items-center justify-between gap-3">
      <h1 className="font-display font-black text-xl md:text-3xl uppercase tracking-wide text-cyber-primary truncate">{title}</h1>
      <div className="hidden sm:flex items-center gap-2 shrink-0">{actions}</div>
    </div>
    {description && <p className="hidden md:block mt-2 text-sm text-cyber-secondary max-w-2xl">{description}</p>}
    {stats && <div className="mt-3">{stats}</div>}
  </header>
);
```
Rules: **one-line title (20px, truncated) on mobile; no paragraph; no stacked buttons.** The primary action lives in the FAB (already exists for Tasks/Docs) or the header `actions` on ≥`sm`.

### R1.2 Stats become a one-line strip on mobile: `src/components/common/StatStrip.tsx`
```tsx
export const StatStrip: React.FC<{ items: { label: string; value: number | string; tone?: 'cyan'|'yellow'|'red'|'lime' }[] }> = ({ items }) => (
  <div className="-mx-3.5 px-3.5 flex gap-2 overflow-x-auto snap-x scrollbar-none md:mx-0 md:px-0 md:grid md:grid-cols-4 md:gap-3">
    {items.map((s) => (
      <div key={s.label} className="snap-start shrink-0 min-w-[96px] md:min-w-0 rounded-xl border border-cyber-border bg-cyber-surface-elevated px-3 py-2">
        <div className="font-display font-black text-2xl leading-none text-cyber-primary">{s.value}</div>
        <div className="mt-1 text-label font-sans text-cyber-secondary truncate">{s.label}</div>
      </div>
    ))}
  </div>
);
```
On mobile each stat is ~56px tall with **no caption lines**; on desktop it's the existing grid look (or keep the old tiles at `md:` if you prefer, but don't change desktop without saying so).

### R1.3 Apply to every page
| Page | Mobile first screen should show |
|---|---|
| Dashboard (`MissionControl`) | Title + horizontal `StatStrip` (3–4 role-aware stats) + **"Needs your attention"** list (own overdue / awaiting review) immediately. Delete the 3 hero buttons on mobile (`hidden md:flex`): they duplicate the tab bar |
| Tasks (`TasksHub`) | Title + `StatStrip` + search row + **the first task cards** |
| Docs (`DocumentHub`) | Title + search + first documents |
| Team (`TeamDirectory`) | Title + search + people list; stats become the strip |
| Admin (`AdminApprovalHub`) | Title + the 3 stats strip + tabs + queue |

Zero-state numbers ("0" tiles with "No active deliverables") should not take space: **hide a stat whose value is 0 on mobile**, except the single most important one, or show a one-line summary: "All caught up ✓".

**Done when:** at 390×844, Tasks and Docs show at least **2 task/document items above the fold**; no paragraph descriptions or stacked button columns on mobile; desktop unchanged. Report with before/after screenshots. **Commit, report, wait.**

---

## PHASE R2 — Flatten the containers

**Goal:** reclaim ~30px per side and reduce visual noise on mobile.

1. In `AppShell.tsx` `<main>`: `p-3.5` → `px-3 py-3` on mobile (keep `sm:p-5 md:p-6`).
2. `GlassCard` (`common/GlassCard.tsx`): on mobile, **page-level sections get no outer border/background/padding**; only *items* (a task, a document, a person) are cards. Add a `flat` prop or a utility:
```tsx
// GlassCard.tsx — add variant
flat: 'bg-transparent border-0 shadow-none p-0 md:bg-cyber-surface md:border md:p-5 md:shadow-cyber',
```
and use `variant="flat"` for the page-section wrappers (hero/filters/list containers) in Dashboard, Tasks, Docs, Team, Admin.
3. Remove the decorative `+` corner marks (`.corner-cross::before`) below `md`: they read as stray characters on small screens.
4. Use **one divider style**: item cards `rounded-xl border border-cyber-border bg-cyber-surface`; sections are separated by spacing (`space-y-4`) and a quiet section label, not by more boxes.
5. Section labels: `text-label font-sans font-semibold text-cyber-secondary` (no uppercase mono, no `//` prefix on mobile). Keep Orbitron for page titles only.

**Done when:** content width at 360px ≥ 336px (check by measuring a card's `getBoundingClientRect().width` or screenshot); no nested bordered boxes more than 2 deep. **Commit, report, wait.**

---

## PHASE R3 — Filters become a sheet; lists get touch-native behaviour

### R3.1 One compact toolbar instead of three stacked rows (Tasks, Docs, Team)
Mobile: `[ 🔍 Search…            ] [ ⚙ Filters • 2 ]` on **one row**. Tapping Filters opens a bottom sheet (reuse `ModalShell` from Round 1) with the scope select and the status chips as large 44px options and an **Apply / Reset** footer. Show an active-filter count badge on the button. Keep inline chips/select on `md:`.
```tsx
<div className="flex gap-2 md:hidden">
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search" className="w-full pl-9 pr-3 rounded-lg" />
  </div>
  <button onClick={() => setFiltersOpen(true)} className="tap-target relative px-3 rounded-lg border border-cyber-border" aria-label="Filters">
    <SlidersHorizontal className="w-5 h-5" />
    {activeCount > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-accent-cyan text-black text-[12px] font-bold flex items-center justify-center">{activeCount}</span>}
  </button>
</div>
```
(`SlidersHorizontal` is in `lucide-react`; check it's already in the icons chunk to avoid growing the bundle.) The status quick-filters for Tasks (`all / my_tasks / submitted / in_progress / approved / overdue`) may stay as the **single scrolling chip row** under the toolbar; only the scope select + less-used filters move into the sheet.

### R3.2 Loading skeletons (no spinner-only states)
Hand-rolled, ~15 lines of CSS, reuse the existing `animate-shimmer` keyframes:
```tsx
export const SkeletonCard = () => (
  <div className="rounded-xl border border-cyber-border bg-cyber-surface p-4 space-y-3 relative overflow-hidden" aria-hidden>
    <div className="h-4 w-2/3 rounded bg-cyber-surface-hover" />
    <div className="h-3 w-full rounded bg-cyber-surface-hover" />
    <div className="h-3 w-1/2 rounded bg-cyber-surface-hover" />
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
  </div>
);
```
Show 3 skeletons while `loading` is true (Tasks uses `useTasks().loading`; check the equivalent in Docs/Team hooks), and a meaningful **empty state** otherwise (one sentence + one action, not a big panel).

### R3.3 Pull-to-refresh (hand-rolled, no library)
A small `usePullToRefresh(onRefresh)` hook: listens to `touchstart/move/end` on `window` only when `window.scrollY === 0`; shows an indicator when pulled >64px; calls `onRefresh` (the existing refetch function of the hook, found by reading it; **don't change the hook, just call what it exports**; if there's no refetch export, skip this item and say so). Respect `prefers-reduced-motion`, and ignore the gesture when a modal/sheet is open or while the chat thread is open.

### R3.4 Swipe actions on task cards (optional, only if bundle allows)
Swipe-left reveals one action (e.g. "Open"). Keep it **optional**: if it adds >0.3 KB or any gesture conflict with horizontal chip scrolling, skip it and say why. Never hide the only way to do something behind a swipe.

### R3.5 Press feedback
Every tappable card/row: `active:bg-cyber-surface-hover active:scale-[0.99] transition-transform` (no `hover:`-only styles on touch).

**Done when:** on Tasks, the area above the first card is **title + stat strip + one toolbar row**, nothing else; filter sheet applies/resets correctly; skeletons appear on slow network (throttle in DevTools); build gzip < 200 KB. **Commit, report, wait.**

---

## PHASE R4 — Chat that feels like a messenger

(`ChatView.tsx`, `MessageBubble.tsx`; presentation only. Don't change `useRealtimeChat`.)

1. **Own vs others** must be obvious: own messages right-aligned, filled with a tinted accent (`bg-accent-cyan/15 border-accent-cyan/40`), others left-aligned on a neutral surface. Screenshots show most bubbles with the same white border and weak alignment difference.
2. **Group consecutive messages** from the same sender within ~5 min: show name/avatar once, tighten spacing (`space-y-0.5` inside a group, `space-y-3` between groups), timestamp only on the last bubble of a group.
3. **Date separators** ("Today", "Yesterday", "Mon 20 Oct") as small centered chips.
4. Sender role tags and channel badges: 12px, not uppercase mono.
5. **Auto-scroll** to the newest message on open and on send; if the user has scrolled up, show a "↓ New messages" pill instead of yanking them down.
6. Composer: attach (44px) / textarea / send (44px **icon-only** on mobile, label from `sm:`), `pb-[env(safe-area-inset-bottom)]`. Use `visualViewport` to keep the composer above the on-screen keyboard if the keyboard still covers it:
```tsx
useEffect(() => {
  const vv = window.visualViewport;
  if (!vv) return;
  const onResize = () => document.documentElement.style.setProperty('--kb', `${Math.max(0, window.innerHeight - vv.height - vv.offsetTop)}px`);
  vv.addEventListener('resize', onResize); vv.addEventListener('scroll', onResize);
  return () => { vv.removeEventListener('resize', onResize); vv.removeEventListener('scroll', onResize); };
}, []);
// composer wrapper: style={{ paddingBottom: 'max(env(safe-area-inset-bottom), var(--kb, 0px))' }}
```
7. Channel list (mobile): rows 56px with unread dot, last-message preview (one line, 14px), no 10px section headers.

**Done when:** you can tell sender from receiver at a glance in a screenshot; keyboard (real phone) never covers the composer. **Commit, report, wait.**

---

## PHASE R5 — Navigation & header refinement

1. **Header becomes contextual on mobile:** left = current page title (on inner pages) or brand + group (on Control), right = search + bell + avatar. This removes the duplicate "PITLANE" brand from every screen and gives the group name room.
2. Tab bar: active tab gets a **filled icon + 2px top indicator** (already present) and a soft pill behind the icon; badge for unread chat stays; hide the bar when the keyboard is open (`visualViewport` height < 75% of `window.innerHeight`).
3. `More` sheet: group destinations (Directory, Admin Hub, Profile, Theme, Sign out) as a simple list of 56px rows with icon + title + chevron (a list scans faster than 2-column tiles with truncated subtitles). Show the Admin Hub only for admins (existing role check).
4. **Scroll restoration per tab:** switching tabs and returning should restore scroll position (store `scrollY` per tab in a ref/map; restore after render).
5. Haptic hint where supported: `navigator.vibrate?.(8)` on tab change, FAB press, and pull-to-refresh trigger (wrapped in try/catch, off when `prefers-reduced-motion`).

**Done when:** one tap switches among the 4 primary tabs, scroll position is kept, no duplicate brand header; desktop unchanged. **Commit, report, wait.**

---

## PHASE R6 — Typography & hierarchy pass

Goal: calmer, more scannable, still on-brand.

| Element | Rule |
|---|---|
| Page title | Orbitron, 20px mobile / 30px desktop, **sentence/title case** is fine; uppercase only for ≤2-word titles |
| Section label | Exo 2 semibold 12–13px, `text-cyber-secondary`, no `//`, no tracking-widest |
| Card title | Exo 2 semibold 16px |
| Card body | Exo 2 14px, `text-cyber-secondary`, `line-clamp-2` |
| Metadata (dates, IDs, counts) | Share Tech Mono 12px, **regular weight** (it has no bold) |
| Badges/chips | 12px, one per card on mobile, icon + text (keep the colour-blind double-encoding rule from `GEMINI.md`) |
| Numbers (stats) | Orbitron 24–32px |

Rules: **no `uppercase tracking-widest` on anything longer than two words**; no `font-bold`/`font-black` on `font-mono`. Add one ~35% larger gap between sections than between items, so groups are visible without borders.

Finally, confirm contrast of every text/background pair you changed with `node scripts/measure-contrast.mjs` (add pairs if needed), ≥4.5:1 for text.

**Done when:** a 390px screenshot of each page has a clear 3-level hierarchy (title → section → item) without relying on boxes. **Commit, report, wait.**

---

## PHASE R7 — Finish Round 1's Phase 7 (now with the final state)

Do **Round 1's Phase 7 exactly as written in `MOBILE_UI_IMPROVEMENTS.md`** (verify-mobile-ui.mjs, StyleGuide/GEMINI.md/PROGRESS/PLAN updates, final report, PR link) **plus** these extra guards in `scripts/verify-mobile-ui.mjs`:
```js
// tab bar must not use the wide display font for labels
const nav = fs.readFileSync('src/components/layout/GarageDoorNav.tsx', 'utf8');
ok(!/grid-cols-5[\s\S]{0,1500}font-display/.test(nav), 'tab bar labels do not use font-display');

// no placeholder that is long enough to wrap in the chat composer
const chat = fs.readFileSync('src/components/chat/ChatView.tsx', 'utf8');
ok(!/placeholder=\{?[`"'][^`"']{40,}/.test(chat), 'chat placeholder is short');

// no mono + bold
const monoBold = files.filter(f => /font-mono[^"`']*font-(bold|black)|font-(bold|black)[^"`']*font-mono/.test(fs.readFileSync(f, 'utf8')));
ok(monoBold.length === 0, `no font-bold on font-mono (${monoBold.join(', ') || 'clean'})`);
```
Final report: baseline → Round 1 → Round 2 table, bundle gzip KB, and the list of things the owner must test **on a real phone as an installed PWA** (notch, keyboard, pull-to-refresh, scroll restoration, haptics). Push the branch; give the PR link `https://github.com/meowerr/zc-fs/pull/new/feature/mobile-ui-polish`. **Do not merge.** Tell the owner the branch also contains the earlier brand-integration commits, so the PR will be large.

---

## ACCEPTANCE CHECKLIST

- [ ] No two tab labels ever touch (320–430px); no tile header collides with its tag
- [ ] Chat placeholder never wraps; composer sits above the keyboard; no footer under it
- [ ] First screen of Tasks/Docs/Team shows real items; no hero paragraphs or stacked buttons on mobile
- [ ] Content width ≥ 336px at 360px viewport; ≤ 2 nested bordered boxes
- [ ] Filters in one toolbar row + sheet; skeletons while loading; pull-to-refresh where the hook allows
- [ ] Sender vs receiver obvious; messages grouped; date separators
- [ ] Contextual header; scroll position kept per tab
- [ ] 3-level type hierarchy; no `uppercase tracking-widest` on long labels; no bold mono
- [ ] `tsc`, `build` (**gzip < 200 KB**), `verify-suite.mjs`, `verify-mobile-ui.mjs`, `measure-contrast.mjs` all pass
- [ ] Desktop unchanged; both themes OK; reduced-motion respected
- [ ] Every phase reported; PROGRESS.md updated (including the stale header); branch pushed, **not merged**

## IF YOU GET STUCK

Revert the file (`git checkout -- <file>`), try a smaller change, say so in the report. If a step conflicts with `GEMINI.md`, follow `GEMINI.md` and say so. If you're over the 200 KB bundle limit, **stop and ask** before cutting features. Never mark anything VERIFIED that you did not run.
