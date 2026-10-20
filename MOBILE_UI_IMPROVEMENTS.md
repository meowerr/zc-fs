# PitLane Mobile UI Improvement Plan

**Repo:** `meowerr/zc-fs` · **Reviewed at commit:** `c10c617` · **Date:** 2026-10-20
**Focus:** Mobile (phones, ~320–430px wide). Your instinct is right: the UI is too small on mobile. It is not one bad value but a pattern that runs through the whole codebase, and it comes from three causes working together: tiny type, undersized touch targets, and a font choice that makes small text harder to read.

---

## 1. Summary

| Area | What the code shows | Severity |
|---|---|---|
| Type scale | **279** uses of 8–11px text (`text-[11px]` ×144, `text-[10px]` ×109, `text-[9px]` ×25, `text-[8px]` ×1). Even "normal" text is mostly `text-xs` (12px, ×243). Only 51 `text-sm` and 19 `text-base` exist. | 🔴 High |
| Touch targets | Header icon buttons are `w-8 h-8` (32px) on mobile. Many controls are `h-9` (36px), `h-8`, or `py-1` chips (~26px). Guideline minimum is 44px (Apple) / 48dp (Material). | 🔴 High |
| Viewport lock | `index.html` sets `maximum-scale=1.0, user-scalable=no`. Users cannot pinch-zoom to compensate for small text. Fails WCAG 1.4.4. | 🔴 High |
| Fonts | `font-mono` (Share Tech Mono) is used for most labels, uppercase and letter-spaced, at 9–11px. That font ships a single weight, so every `font-bold` is a browser-faked bold. | 🟠 Medium-High |
| Layout/safe areas | Header ignores the top safe area; `100vh`/`min-h-screen` used instead of `dvh`; bottom padding too small for the floating nav pill on notched phones. | 🟠 Medium-High |
| Modals | Centered desktop-style modals with big padding. Waste width on a phone, no sheet behavior. | 🟠 Medium |
| Density | Dashboard and cards pack many tiny labels per screen. | 🟠 Medium |
| Polish | Dead classes, missing `apple-touch-icon`, static `theme-color`, contrast of placeholders. | 🟡 Low |

---

## 2. Quick wins (do these first, about half a day)

These give the biggest visible improvement for the least work.

### 2.1 Remove the zoom lock (`index.html`)
```html
<!-- Before -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />

<!-- After -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```
The lock was most likely added to stop iOS Safari from zooming into inputs on focus. That zoom happens because inputs are `text-xs` (12px); iOS auto-zooms any input under 16px. Fix the cause (see 2.2) and the lock is no longer needed.

### 2.2 Make all form controls 16px on mobile
Affected: `GlowInput.tsx` (`text-xs sm:text-sm`), the chat composer input (`h-9 ... text-xs sm:text-sm`), the search/select in `TasksHub.tsx`, `DocumentHub.tsx`, `TeamDirectory.tsx` (`h-9 ... text-xs`).

Simplest global fix in `src/index.css` inside `@layer base`:
```css
@media (max-width: 767px) {
  input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]),
  select,
  textarea {
    font-size: 16px;
    min-height: 44px;
  }
}
```
Then delete the per-component `h-9` on inputs/selects so they do not fight the rule.

### 2.3 Introduce a mobile type floor
Add semantic sizes to `tailwind.config.js` instead of hard-coding px values everywhere:
```js
theme: { extend: { fontSize: {
  'label':  ['12px', { lineHeight: '16px', letterSpacing: '0.04em' }], // was 9–11px
  'body':   ['14px', { lineHeight: '20px' }],                           // was 12px
  'body-lg':['16px', { lineHeight: '24px' }],
}}}
```
Rules to adopt:
- **Nothing below 12px**, ever. Replace every `text-[8px|9px|10px|11px]` with `text-label` (12px).
- **Reading text (task titles, descriptions, chat messages, notifications) is 14–16px** on mobile.
- Use `sm:` to step *down* for desktop where you want density, not the other way round. Today the code is "small by default, `sm:text-sm` to enlarge", which is backwards for a mobile-first PWA.

A one-off codemod gets you most of the way:
```bash
# review the diff before committing
grep -rlE 'text-\[(8|9|10|11)px\]' src | xargs sed -i -E 's/text-\[(8|9|10|11)px\]/text-label/g'
```
Heaviest files to review afterwards: `MissionControl.tsx` (49), `StyleGuide.tsx` (48), `AdminApprovalHub.tsx` (35), `TeamDirectory.tsx` (25), `HybridRacingRail.tsx` (19), `TasksHub.tsx` (14).

### 2.4 Enforce 44px touch targets
Add a utility and use it on every tappable element:
```css
/* index.css */
@layer components {
  .tap-target { @apply min-h-[44px] min-w-[44px] inline-flex items-center justify-center; }
}
```
Concrete fixes:

| File | Current | Change to |
|---|---|---|
| `TopHeader.tsx` search / bell / theme buttons | `w-8 h-8 sm:w-10 sm:h-10` | `w-11 h-11` (44px) at all sizes |
| `TopHeader.tsx` avatar button | `p-0.5 sm:p-1` | `min-w-11 min-h-11` |
| `GhostButton.tsx` `sm` | `h-8` | `min-h-[44px]` on mobile |
| `GlossyButton.tsx` `sm` | `h-9` | `min-h-[44px]` on mobile |
| Modal close buttons (`TaskCreateModal`, `TaskDetailModal`, `FileUploadModal`) | `w-8 h-8` | `w-11 h-11` |
| Filter chips (`TasksHub.tsx` ~L315, `TeamDirectory.tsx`) | `px-2.5 py-1 text-[11px]` (~26px tall) | `px-3.5 py-2.5 text-xs`, min-h 40–44px |
| Chat channel/DM rows (`ChatView.tsx`) | `px-2.5 py-1.5 text-xs` | `py-3 text-sm` |
| Chat composer input | `h-9` | `min-h-[44px]` |
| `GarageDoorNav.tsx` header close | `w-8 h-8` | `w-11 h-11` |
| Auth mode toggle (`AuthScreen.tsx` ~L220) | `py-1.5 text-xs` | `py-3 text-sm` |
| "Forgot password" / small text links | `text-[10px]` | `text-xs` with `py-2` padding to enlarge hit area |

If you want the icon visually small but the hit area big, keep the icon at 16–20px and pad the button.

---

## 3. Typography and fonts

### 3.1 Mono-everywhere hurts small-size legibility
`font-mono` (Share Tech Mono) is applied to almost all labels, badges, subtitles and metadata, usually `uppercase tracking-wider` at 9–11px. That is the least legible combination possible on a phone.

- **Recommendation:** keep Orbitron for headings and big numbers, **Exo 2 for all readable text**, and Share Tech Mono only for short codes (IDs, timestamps, counters) at ≥12px. Don't uppercase sentences or subtitles.
- **Fake bold:** the Google Fonts URL in `index.html` loads `Share+Tech+Mono` with no weights; that family only has regular. Every `font-mono font-bold` is browser-synthesised bold, which smears at small sizes. Use `font-medium`/regular on mono, or switch those labels to Exo 2 where real weights exist.
- Consider `font-display` (Orbitron) only at ≥14px; it is wide and low x-height.

### 3.2 Respect user font settings
Sizes are in `px` via Tailwind arbitrary values, so they will not follow the user's OS text-size preference. Using `rem` (Tailwind's default `text-xs/sm/base`, or the tokens in 2.3 defined in `rem`) fixes this and, combined with removing the zoom lock, is the accessible answer to "too small".

### 3.3 Contrast (measured, so worth fixing along with size)
Computed with the standard WCAG formula:

| Pair | Ratio | Note |
|---|---|---|
| Light placeholder `#94A3B8` on `#FFFFFF` | **2.56:1** | Fails. Raise to about `#64748B`. |
| Dark placeholder `#737D89` on `#181E26` | **4.01:1** | Just under 4.5. Lighten to about `#8A96A4`. |
| Light `accent-yellow #B8860B` on white | **3.25:1** | Fails for small text. Use a darker amber for text, keep this for fills. |
| Light muted `#64748B` on white | 4.76:1 | Passes, but not at 9–10px, where perceived contrast is lower. |

Your `scripts/measure-contrast.mjs` is the right place to lock these in.

---

## 4. Layout, safe areas, viewport units

### 4.1 Header sits under the status bar in the installed PWA
`index.html` uses `apple-mobile-web-app-status-bar-style: black-translucent` and `viewport-fit=cover`, which means web content draws *under* the iOS status bar/notch. `TopHeader.tsx` is `sticky top-0 h-14` with **no top safe-area padding**; `--sat` is defined in `index.css` but never used. Result: header content collides with the notch/clock in standalone mode.
```tsx
// TopHeader.tsx
<header className="sticky top-0 z-20 ... pt-[env(safe-area-inset-top)]">
  <div className="... h-14 ...">
```
Also respect left/right insets in landscape: `pl-[max(0.625rem,env(safe-area-inset-left))]`.

### 4.2 Content is hidden behind the floating nav pill
The closed `GarageDoorNav` pill is `min-h-[56px]`, sits `bottom-3` (12px) and adds `env(safe-area-inset-bottom)` (~34px on iPhones with a home indicator), so it reaches about **102px** from the bottom. `AppShell.tsx` gives `<main>` only `pb-20` (**80px**). The last ~20px of every screen sits under the pill.
```tsx
<main className="... pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-8">
```

### 4.3 Replace `vh` / `min-h-screen` with dynamic viewport units
On mobile browsers `100vh` is taller than the visible area (URL bar) and ignores the keyboard. Tailwind 3.4 (you are on `^3.4.17`) supports `dvh`.

| File | Current | Change |
|---|---|---|
| `ChatView.tsx` L124 | `h-[calc(100vh-9.5rem)]` | `h-[calc(100dvh-9.5rem)]` |
| `AuthScreen.tsx`, `PendingApprovalView.tsx`, `App.tsx`, `AppShell.tsx` | `min-h-screen` | `min-h-dvh` |
| `GarageDoorNav.tsx` L220, L270 | `max-h-[78vh]`, `max-h-[50vh]` | `dvh` equivalents |
| `GlobalSearchModal.tsx` L210 | `max-h-[75vh]` | `max-h-[75dvh]` (so results stay visible with the keyboard open) |
| `TaskDetailModal.tsx`, `RoleGuideModal.tsx`, `NotificationDrawer.tsx` | `vh` | `dvh` |

### 4.4 Chat screen specifically
- The chat height is a magic-number calc that has to leave room for header + the pill. With the pill fixed over the composer area, the send box is at risk of being covered. **Hide the floating nav while a conversation is open on mobile** (back button already exists) so the composer owns the bottom edge, with `pb-[env(safe-area-inset-bottom)]`.
- Make the composer a `textarea` that grows to ~4 lines, 16px text, 44px min height, and a 44px send button.
- Message bubbles: 12px body (`text-xs sm:text-sm`) → 15px. Timestamp is `text-[9px]` and sender label 11px → both 12px.

---

## 5. Navigation

The active mobile nav is the "Garage Door": a floating pill that opens a bottom sheet. It looks distinctive, and the sheet itself is good (2-col grid, `min-h-[64px]` tiles, drag-to-dismiss). The cost is **every tab switch takes two taps** (open sheet, pick tab) and the current destination is shown but not the alternatives.

Recommendations, in order of impact:
1. **Add a real bottom tab bar for the 4 primary destinations** (e.g. Control, Tasks, Pit Wall, Docs) with 24px icons and 12px labels in 56–64px-tall targets, plus a "More" tab that opens your existing garage-door sheet for Team/Admin/profile. Keep the garage-door styling for the sheet, it is a good fit for a secondary menu. (`BottomNav.tsx` already exists as the rollback target and shows the structure, but its labels are `text-[10px]`, so raise those too.)
2. If you keep the pill as the only nav, make the whole sheet header and handle area the drag target (currently only the handle strip has touch handlers) and add a swipe-up gesture on the pill itself.
3. Inside the pill, the `LIVE` chip (11px) and 32px chevron are decorative. Drop `LIVE` on mobile to reclaim width for a larger label.
4. Sheet tile subtitles are `text-[11px]` → 12px, labels `text-xs` → `text-sm`.

---

## 6. Modals → bottom sheets / full-screen on mobile

`TaskCreateModal`, `TaskDetailModal`, `FileUploadModal`, `RoleGuideModal`, `NewDMModal`, `NotificationDrawer` are centered desktop-style cards. On a 360px phone, `p-4` outer + `p-6` inner padding eat ~80px of width, and `TaskCreateModal` also uses `my-8`.

- Make modals full-height sheets below `md:` (`fixed inset-x-0 bottom-0 top-12 rounded-t-2xl md:static md:...`) with a sticky footer for the primary action and `pb-[env(safe-area-inset-bottom)]`.
- `TaskCreateModal.tsx` L200 and L237 use `grid-cols-2` for date/priority/type fields; inside the padded card each column is ~140px. Stack to `grid-cols-1 sm:grid-cols-2`.
- `TaskDetailModal.tsx` L457 uses `grid-cols-3` on mobile; make it `grid-cols-1 sm:grid-cols-3` or a horizontal scroller.
- `TaskDetailModal` tab strip (3 tabs, `py-1.5 text-xs`) → `py-3 text-sm`, sticky at top of the scroll area.
- `GlobalSearchModal`: pad `pt-16` → `pt-[max(1rem,env(safe-area-inset-top))]` on mobile and let it go full-width, and keep results above the keyboard (see 4.3).
- `NotificationDrawer`: on mobile make it a full-width sheet from the bottom; rows have 9–10px timestamps and 16px icons, so raise to 12px and 20px.

---

## 7. Screen-by-screen notes

### Dashboard: `MissionControl.tsx`
- Up to nine stat tiles in `grid-cols-2`, each with a 11px label, a number and an 11px caption, repeated (a lot of near-duplicate text lines like "No active deliverables"/"On schedule"). On a phone that is a wall of micro-text.
- Show **3–4 priority tiles** big (number 28–32px, label 12–13px) and move the rest into an expandable "More stats" row, or a horizontal scroll-snap carousel.
- Drop the second caption line on mobile; the label and number already carry the meaning.
- Sub-team cards (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) already stack well; raise their 10px gauge labels to 12px.

### Tasks: `TasksHub.tsx` / `TaskCard.tsx`
- Card title is `text-xs sm:text-sm` → 15–16px on mobile; description 14px.
- Type badge `text-[9px]`, deadline/attachment `text-[10px]`, avatar chips `w-5 h-5 text-[9px]`: enlarge to 12px text, 28px avatars, and cap what is shown (e.g. 1 badge + deadline, rest in the detail view).
- The filter chip row is `flex-wrap` with 26px chips: change to a single horizontally scrolling row (`overflow-x-auto snap-x`, edge fade) with 40–44px chips, so it does not eat three lines of screen.
- Search + group select (`h-9 text-xs`) → 44px / 16px (see 2.2). Stack them full-width on mobile.
- Header action buttons (Export, Import, New) are `flex-wrap`; make **New task a floating action button** (56px, above the nav pill) and move export/import into an overflow menu.

### Chat: `ChatView.tsx`
See 4.4. Also the channel list uses 10px section headers and 12px rows; bump to 12px/14px and raise row height to 48px.

### Documents: `DocumentHub.tsx`
- The category tab strip scrolls horizontally with no visual cue; add edge fades and bigger chips.
- Card metadata at 10–11px → 12px; filename/title → 15px.
- Upload action → FAB as above.

### Team: `TeamDirectory.tsx`
- Sub-team filter is `grid-cols-2 sm:grid-cols-3 md:grid-cols-6` with 9–11px labels. Make it a horizontal chip scroller or keep the grid but with 12px labels and 48px-tall tiles.
- Person cards: role/badge pills at 9–10px → 12px; keep to one badge on mobile.

### Auth: `AuthScreen.tsx`
- Primary buttons are already 48px, good. Raise the mode toggle, labels (`text-xs uppercase`) and the `text-[10px]` links as in 2.4.
- Use `min-h-dvh` and make sure the form scrolls with the keyboard open (`overflow-y-auto`, not `overflow-hidden` on the wrapper at L109, which can trap the submit button under the keyboard on short screens).

### Header: `TopHeader.tsx`
- Brand "PitLane" `text-xs`, group name `text-[11px]` truncated to 85px. Use `text-sm` for the brand and let the group name use the available width.
- Consider moving the theme toggle into the profile sheet to free room for 44px primary actions (search, notifications, avatar).

---

## 8. Small bugs and polish found along the way

- **Dead class:** `TopHeader.tsx` uses `hidden xs:inline-block` for the `FS-2026` badge, but `tailwind.config.js` defines no `xs` screen, so it never shows. Either add `screens: { xs: '420px' }` or remove it.
- **Invalid utilities:** `py-0.2` (in `TopHeader.tsx`, `GarageDoorNav.tsx`) is not in Tailwind's spacing scale, so it does nothing.
- **No `apple-touch-icon`:** `index.html` has none, so iOS home-screen installs get a screenshot-style icon. Add `<link rel="apple-touch-icon" href="/icon-192.png">` (ideally a 180×180).
- **`theme-color` is static** (`#0B1B3A`) while the app defaults to dark `#070A0E` and has a light mode. Update the meta tag from `toggleTheme` in `AppShell.tsx`, and align `manifest.background_color` (currently light `#EAF4FF`, which flashes white on a dark-default app at launch).
- **Pinch/double-tap:** after removing the zoom lock, add `touch-action: manipulation` on buttons/inputs to avoid the 300ms double-tap delay without disabling zoom.
- **Active feedback:** many controls rely on `hover:` styles, which are sticky/absent on touch. Ensure each tappable element has an `active:` state (some already use `active:scale-95`, add it consistently).
- **Scrollbars:** the custom 6px scrollbar CSS is irrelevant on phones; fine, but make sure horizontal scrollers (`DocumentHub`, `TeamDirectory`, `TasksHub` after change) add `scrollbar-width: none` for a clean look.
- **Reduced motion** is already handled globally in `index.css`. Good, keep it.

---

## 9. Suggested rollout

| Phase | Work | Effort | Outcome |
|---|---|---|---|
| 1 | Sections 2.1–2.4: viewport, 16px inputs, type floor codemod, 44px targets | ½–1 day | App no longer feels tiny; zoom works |
| 2 | Section 4: safe areas, `dvh`, bottom padding, chat composer | ½ day | No clipped header/footer, keyboard-safe |
| 3 | Section 6: modals → sheets; section 7 Tasks/Chat/Auth | 1–2 days | Core workflows comfortable one-handed |
| 4 | Section 5: tab bar + "More" sheet; FABs | 1 day | One-tap navigation |
| 5 | Section 7 Dashboard/Docs/Team density, section 3 font rebalancing, section 8 polish | 1–2 days | Cohesive, readable system |

### How to verify
- Test on a real phone in the installed PWA (notch, home indicator, keyboard), not only DevTools. Use widths **360, 390, 430px**.
- Chrome DevTools → Lighthouse → Accessibility, and check for "Tap targets are not sized appropriately" and "Does not use legible font sizes".
- Extend `scripts/verify-slice-5-responsive.mjs` (you already have it) with checks that fail on `text-[8-11px]`, `user-scalable=no`, and interactive elements below 44px at a 390px viewport so this does not regress.
- Add the type tokens and `tap-target` utility to `StyleGuide.tsx` so the design system documents the new minimums.

---

*Findings are from reading the source at commit `c10c617`; I did not run the app on a device, so a few items (notably 4.1, 4.2 and the chat composer overlap in 4.4) are derived from the code and are worth confirming on a real phone.*
