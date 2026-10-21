# DESIGN SYSTEM: PITLANE TELEMETRY WORKSPACE

## Brand Identity & Guidelines
For full brand guidelines, typography, lockup usage, clear space, and WCAG AA contrast rules, see **[BRAND.md](file:///C:/Users/Abdullah/Desktop/zc-fs/BRAND.md)**.

---

## Aesthetic Philosophy: Motorsport Cyber-Futurism
PitLane fuses the precision instrumentation of Formula Student motorsport telemetry with clean, aerodynamic cyber-optimism.

- **Surfaces:** Frosted glass cards (`backdrop-blur-md`), 1px borders (`border-white/10` or `border-white/40`), subtle ambient glow shadows.
- **Theming:**
  - **Midnight (Dark):** Brand-ink `#070B0E` and midnight navy `#060B1A` backdrop with high-contrast `#F2F4F7` text.
  - **Chrome (Light):** `#EAF4FF` to `#F8FBFF` backdrop with deep `#0B1B3A` text.
- **Brand Accents:**
  - ZFS Brand Orange (`#E07212`) & Light Mode Orange (`#C2410C`).
  - Electric Blue (`#2F6BFF`), Aqua (`#22E4F0`), Hot Pink (`#FF4FA3`).

---

## Mobile-First PWA Guidelines
- Minimum interactive touch target: **48px × 48px** (strict minimum 44px).
- Bottom navigation bar on mobile viewports (<768px), floating/docked collapsible rail on desktop (>=768px).
- Instant loading: vector-first critical path, bundle budget `< 200 KB` gzipped.
- Status indicators must always be **double-encoded** (color + icon + text label).
