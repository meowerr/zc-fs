# GEMINI.md: PROJECT RULES, CONVENTIONS & CONTEXT

## Project Identity
- **Project Name:** ZC Formula Student Telemetry & Project Management Workspace (PitLane)
- **Target Organization:** Zewail City Formula Student Racing Team (30–100 active engineering members)
- **Primary Objective:** Deliver a zero-cost, high-performance, mobile-first PWA for task tracking, team communication, and work review across 5 sub-teams.

---

## Non-Negotiable Core Constraints
1. **100% Free Tiers / Zero Credit Card Required:**
   - Never introduce services, libraries, or APIs requiring a credit card or billing account.
   - Verified services: Supabase (Free tier), Vercel Hobby / Cloudflare Pages, GitHub Actions (free tier).
2. **Security & Data Privacy:**
   - Authorization MUST be enforced at the database level via PostgreSQL Row Level Security (RLS). UI gating is only for user convenience.
   - University domain enforcement: Only `@zewailcity.edu.eg` emails can sign up (guaranteed via database triggers).
   - Never commit API keys, service-role keys, or secrets to Git. Always use `.env` and provide a complete `.env.example`.
3. **Mobile-First PWA:**
   - Touch targets must be >= 44px (prefer 48px).
   - Responsive layouts: Bottom navigation bar on mobile (<768px), sidebar on desktop.
   - Fast loading on mobile networks (under 200KB initial gzipped bundle, no heavy assets).
4. **Working Agreement Rules:**
   - Keep [PLAN.md](file:///C:/Users/Abdullah/Desktop/zc-fs/PLAN.md) and [PROGRESS.md](file:///C:/Users/Abdullah/Desktop/zc-fs/PROGRESS.md) constantly updated.
   - Work in small vertical slices, one feature end-to-end at a time.
   - Run, test, verify, and summarize each slice in 5 lines or less, then wait for approval before moving to the next.

---

## Design System: Y2K Futurism
- **Philosophy:** Motorsport telemetry instrumentation meets Frutiger Aero cyber-optimism. Clean, polished, and highly legible.
- **Surfaces:**
  - Frosted glass cards: `backdrop-blur-md`, subtle 1px border (`border-white/40` or `border-white/10`), soft ambient shadow.
  - Light mode ("Chrome"): `#EAF4FF` to `#F8FBFF` backdrop, deep navy `#0B1B3A` text.
  - Dark mode ("Midnight"): `#060B1A` backdrop, crisp `#E8F0FF` text.
- **Accents:**
  - Electric Blue (`#2F6BFF`), Aqua (`#22E4F0`), Hot Pink (`#FF4FA3`).
  - Status Indicators: Lime (`#B6FF3B`) for Approved/Done, Amber (`#FFC53D`) for Due-Soon/In-Review, Red (`#FF4D4D`) for Overdue/Changes-Requested.
  - Double encoding: Every status chip must combine color + icon + text label (accessible for color blindness).
- **Typography:**
  - Headers / Badges / Buttons: `Orbitron` / `Michroma` (wide, futuristic).
  - Body / Forms / Chat: `Exo 2` (clean, highly readable).
  - Telemetry / IDs / Timestamps: `Share Tech Mono` (monospace).

---

## Organization Structure
- **5 Sub-teams:**
  1. `Technical - Vehicle Dynamics`
  2. `Technical - Aerodynamics`
  3. `Technical - Low-Voltage Electronics`
  4. `Technical - Powertrain & Drivetrain`
  5. `Operations - Business, Cost & Marketing`
- **4 Roles:**
  1. `Club Admin`: System overseer, approves registrations, assigns groups & roles, views all sub-teams.
  2. `Group Head`: Full control inside own sub-team only (creates/assigns/reviews tasks), participates in `heads_only` cross-team channel.
  3. `Member`: Belongs to 1 sub-team, views own group's tasks/channels, submits deliverables, chats with teammates.
  4. `Pending`: Newly registered, awaiting Club Admin approval. Zero access to team data.

---

## Coding Standards & Conventions
- **Language & Runtime:** TypeScript (strict mode enabled).
- **Architecture:** Feature-folder or domain-modular structure (`src/components/`, `src/hooks/`, `src/lib/`).
- **State & Data Fetching:** Pure Supabase JS client with typed models, custom React hooks (`useTasks`, `useRealtimeChat`, `useAuth`).
- **Icons:** `lucide-react`.
- **CSS:** Tailwind CSS with custom theme extensions defined in `tailwind.config.js`. Avoid arbitrary unmaintainable styles.
