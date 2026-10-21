# ZFS PitLane Brand Identity Guide (BRAND.md)

This document establishes the official visual and typographic guidelines for **Zewail Formula Team (ZFS)** within the **PitLane** Telemetry and Project Management Workspace.

---

## 1. Brand Hierarchy & Product Architecture
- **Organization Identity:** **Zewail Formula Team (ZFS)** — Formula Student engineering racing team at Zewail City of Science and Technology.
- **Product Name:** **PitLane** — High-performance, zero-cost telemetry instrumentation, task management, and telemetry command console for ZFS.
- **Copy Standard:** `"PITLANE // ZFS Team Workspace"`
- **Domain Gate:** Exclusively for `@zewailcity.edu.eg` authorized engineering members.

---

## 2. Logo Lockups & Vector Assets

All vector marks reside in [`src/assets/brand/`](file:///C:/Users/Abdullah/Desktop/zc-fs/src/assets/brand/) and are rendered via the [`ZfsLogo`](file:///C:/Users/Abdullah/Desktop/zc-fs/src/components/brand/ZfsLogo.tsx) component.

| Variant | Filename | Primary Use Cases | Minimum Render Size |
| :--- | :--- | :--- | :--- |
| **Full Lockup** | `ZfsFullLogo.svg` | Auth Screen, Splash, About modal, Welcome hero | Height: `80px` / Width: `150px` |
| **Horizontal Compact** | `ZfsHorizontalLogo.svg` | Expanded Desktop Navigation Rail, Top Header Bar | Height: `32px` / Width: `80px` |
| **Monogram** | `ZfsMonogram.svg` | Collapsed Desktop Rail, Favicon, PWA App Icons, Sheet headers | Height: `16px` / Width: `24px` |
| **Light-Mode Full** | `ZfsLightModeLogo.svg` | Print exports, high-contrast light backgrounds | Height: `80px` / Width: `150px` |

---

## 3. Clear Space & Minimum Sizes

### Clear Space
To preserve visual impact and hierarchy, maintain clear space around any ZFS mark equal to at least **0.5× the height of the central octagonal duct** ($H_{duct}$):
$$\text{Clear Space} \ge 0.5 \times H_{\text{duct}}$$
No text, navigation tabs, status badges, or decorative borders may intrude into this perimeter.

### Minimum Sizes
- **Monogram:** Never render below `16px` width (standard micro-favicon). Recommended mobile touch-tile size: `32px` to `48px`.
- **Horizontal Compact:** Minimum height `28px` to ensure the custom italic "ZFS" wordmark maintains stroke definition.
- **Full Lockup:** Minimum width `160px` to guarantee legibility of the sub-mark `"ZEWAIL FORMULA TEAM"`.

---

## 4. Official Color Palette & Brand Tokens

Sampled from the official ZFS identity assets and adjusted for WCAG 2.1 Level AA compliance.

| Token | Hex Value | Role & Usage |
| :--- | :--- | :--- |
| `brand-orange` | `#E07212` | Primary brand accent, glowing duct, primary buttons, active telemetry highlights. |
| `orange-hover` | `#ED7D0D` | Hover state for interactive brand-orange surfaces. |
| `orange-pressed`| `#C6620A` | Active / pressed state for primary controls. |
| `orange-soft`   | `rgba(224, 114, 18, 0.12)` | Subtle tinted container surfaces, active item badges. |
| `orange-glow`   | `rgba(224, 114, 18, 0.35)` | Halo filter and status glows on midnight backdrops. |
| `light-orange`  | `#C2410C` | Deep high-contrast orange for text, icons, and links in Light Mode. |
| `brand-ink`     | `#070B0E` | Deep obsidian backdrop (sampled from source slide), high-contrast button text. |
| `brand-white`   | `#F2F4F7` | Aerodynamic car outline, primary high-legibility headings on dark mode. |

---

## 5. WCAG AA Accessibility & Contrast Matrix

> [!IMPORTANT]
> **Hard Rule on Brand Orange:**
> White text (`#FFFFFF`) on Brand Orange (`#E07212`) provides a contrast ratio of **3.18:1**, which **FAILS WCAG AA** for normal text.
> Always use **Brand Ink (`#070B0E`)** text on Brand Orange buttons to achieve **5.23:1 (PASS AA)**.

| Pairing | Foreground | Background | Contrast Ratio | WCAG AA Status |
| :--- | :--- | :--- | :--- | :--- |
| **Dark Theme Button** | `#070B0E` (Brand Ink) | `#E07212` (Brand Orange) | **5.23 : 1** | ✅ **PASS** (Normal & Large Text) |
| **Dark Theme Body** | `#F2F4F7` (Brand White)| `#070B0E` (Brand Ink) | **17.84 : 1** | ✅ **PASS** (Enhanced AAA) |
| **Light Theme Text** | `#C2410C` (Light Orange)| `#FFFFFF` (Pure White) | **5.53 : 1** | ✅ **PASS** (Normal Text AA) |
| **Light Theme Chrome**| `#C2410C` (Light Orange)| `#F8FBFF` (Chrome Surface)| **5.39 : 1** | ✅ **PASS** (Normal Text AA) |
| **Focus Rings** | `#E07212` (Brand Orange)| `#070B0E` (Brand Ink) | **5.23 : 1** | ✅ **PASS** (UI Component $\ge 3:1$) |
| *Prohibited Pair* | `#FFFFFF` (White) | `#E07212` (Brand Orange) | *3.18 : 1* | ❌ **FAIL** (Do NOT use) |

---

## 6. Allowed Backgrounds

1. **Midnight Dark (Default / Recommended):**
   - Brand Ink canvas: `#070B0E`
   - Midnight Navy canvas: `#060B1A`
   - Cyber Frosted Glass: `rgba(13, 21, 38, 0.85)` with `backdrop-blur-md`
2. **Chrome Light:**
   - Pure White canvas: `#FFFFFF`
   - Frosted Chrome surface: `#EAF4FF` to `#F8FBFF`
   - Use `theme="light"` on [`ZfsLogo`](file:///C:/Users/Abdullah/Desktop/zc-fs/src/components/brand/ZfsLogo.tsx) to automatically render the brand-ink body and high-contrast orange duct.
3. **Forbidden Backgrounds:**
   - Never place the logo on competing bright colors (e.g., pure red, yellow, electric blue).
   - Never place the dark-mode logo on light gray or mid-tone backgrounds without a protective glass container.

---

## 7. Brand "Don'ts" & Guardrails

- ❌ **Do NOT retype "ZFS" with a font:** The custom italic wordmark is proprietary traced geometry with custom speed slants.
- ❌ **Do NOT stretch, skew, or distort the aspect ratio:** Always preserve SVG `viewBox` coordinates.
- ❌ **Do NOT place white text on brand-orange buttons:** Always use `text-[#070B0E]`.
- ❌ **Do NOT leave slide artifacts:** Unrelated captions (e.g. `"03 / INTEGRATED DUCT"`) or slide bracket frames must never appear in production assets.
- ❌ **Do NOT use color as the sole indicator:** All status indicators must pair color with an icon and clear text label.
