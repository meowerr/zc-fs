# PROJECT PROGRESS: ZC FORMULA STUDENT WORKSPACE

## Current Status
- **Current Phase:** Phase 0 (Planning & Architecture Approval)
- **Active Task:** Awaiting user review and approval of [PLAN.md](file:///C:/Users/Abdullah/Desktop/zc-fs/PLAN.md)

---

## 1. What's Done
- [x] Initialized project workspace at `C:\Users\Abdullah\Desktop\zc-fs`.
- [x] Researched and verified 100% free-tier limits with zero credit card requirements (Vite + React, Supabase Free Tier, Vercel/Cloudflare Pages, GitHub Actions keep-alive).
- [x] Authored complete [PLAN.md](file:///C:/Users/Abdullah/Desktop/zc-fs/PLAN.md) covering:
  - Free-tier verification & constraints.
  - High-level architecture topology.
  - Complete PostgreSQL data model (10 tables, enums, triggers, ERD diagram).
  - Explicit role and permission matrix across all 4 user roles.
  - Y2K Futurism design system tokens (fonts, colors, surfaces, glassmorphism, responsive navigation).
  - Directory structure and Phase 0-5 checklist.
- [x] Authored [GEMINI.md](file:///C:/Users/Abdullah/Desktop/zc-fs/GEMINI.md) project context and operational conventions.

---

## 2. What's Next (Pending Approval of PLAN.md)
- [ ] **Phase 0 Execution:**
  1. Initialize Vite + React 18 + TypeScript + Tailwind CSS project with PWA setup.
  2. Implement Y2K design tokens and base components (GlassCard, GlossyButton, LedStatusChip, SegmentedGauge).
  3. Write PostgreSQL migration scripts with RLS policies and `@zewailcity.edu.eg` domain constraint.
  4. Write SQL verification suite testing cross-group isolation and unapproved user restrictions.
  5. Seed database with the 5 Formula Student sub-teams and demo accounts.
  6. Create `.env.example`, README.md, and GitHub Actions keep-alive ping script.

---

## 3. Assumptions
1. **Email / Auth Mechanism:** Supabase Auth with Email + Password will be the primary auth method, with a PostgreSQL trigger rejecting any email that does not end in `@zewailcity.edu.eg`. This avoids requiring Google Cloud Console admin rights over the university domain while strictly enforcing the domain.
2. **Database Inactivity Auto-pause:** Free Supabase projects pause after 7 days of inactivity. A lightweight GitHub Action running a REST health check every 72 hours will keep it active indefinitely at zero cost.
3. **Storage Tiering:** Max single-file upload size is capped at 25 MB (safely beneath the Supabase free-tier 50 MB limit) to preserve the 1 GB total storage budget across the 30-100 club members.
4. **PWA Mobile-First Layout:** On screens under 768px, navigation is anchored to a frosted glass bottom tab bar with 48px tap targets. On desktop screens, it expands to a sleek telemetry sidebar.

---

## 4. Known Issues & Blockers
- **None at this stage.** Awaiting user approval of [PLAN.md](file:///C:/Users/Abdullah/Desktop/zc-fs/PLAN.md) to begin Phase 0 implementation.
