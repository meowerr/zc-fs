# ZC Formula Student Telemetry & Project Management Workspace (PitLane)

A high-performance, zero-cost, mobile-first Progressive Web Application (PWA) built for the **Zewail City Formula Student Racing Team**. Designed with a **Y2K Futurism** visual identity combining motorsport instrumentation and cyber-optimism.

---

## 🏎️ Key Features

- **100% Free Tiers & Zero Card Required:** Built to run permanently at zero cost using Supabase Free Tier, Vercel/Cloudflare Pages, and GitHub Actions.
- **University Email Domain Enforcement:** Hardened at the database engine level—only `@zewailcity.edu.eg` accounts can register.
- **Role-Based Row Level Security (RLS):** Strict PostgreSQL data isolation between the 5 official sub-teams (`Vehicle Dynamics`, `Aerodynamics`, `Low-Voltage Electronics`, `Powertrain`, and `Business & Operations`).
- **Motorsport Telemetry UI:** Frosted glass panels, segmented LED gauges, LED status chips (dual-encoded for colorblind accessibility), and responsive navigation (mobile bottom nav + desktop sidebar).
- **Automated Keep-Alive:** Scheduled GitHub Actions cron ping preventing free-tier database hibernation.

---

## 🛠️ Tech Stack

- **Frontend:** Vite, React 18, TypeScript, Tailwind CSS, `vite-plugin-pwa` (Workbox)
- **Icons & Typography:** Lucide React, Google Fonts (`Orbitron`, `Exo 2`, `Share Tech Mono`)
- **Backend / Database:** Supabase Free Tier (PostgreSQL 15, GoTrue Auth, Realtime, Storage)
- **CI/CD & Keep-Alive:** GitHub Actions, Vercel / Cloudflare Pages

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install
```bash
git clone <repo-url>
cd zc-fs
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project dashboard.

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser or phone.

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## 🗄️ Database Setup (Supabase)

To set up your free Supabase instance without any credit card:
1. Create a free account at [supabase.com](https://supabase.com).
2. Create a new free project in your preferred region.
3. Open the **SQL Editor** in the Supabase Dashboard.
4. Execute the migration scripts in numerical sequence:
   - `supabase/migrations/001_initial_schema.sql` (Tables, enums, triggers, domain constraint)
   - `supabase/migrations/002_rls_policies.sql` (Declarative Row Level Security policies)
   - `supabase/migrations/003_seed_data.sql` (5 sub-teams & channels seed)
   - `supabase/migrations/005_google_auth.sql` (Strict domain trigger & OAuth name extraction)
   - `supabase/migrations/006_product_maturity_schema.sql` (Audit logging & system health schema)
5. Run the verification test suite in SQL Editor to confirm isolation:
   - `supabase/tests/rls_security_test.sql`

---

## 🔐 Authentication & Domain Security

PitLane enforces strict server-side identity protection for the Zewail City racing organization:

1. **Google OAuth ("Continue with Google"):**
   - Members sign in with their `@zewailcity.edu.eg` Google account via standard OAuth 2.0 with PKCE authorization code grant.
   - The `hd: 'zewailcity.edu.eg'` parameter provides a smooth UX hint in Google's account chooser, while PostgreSQL database triggers strictly enforce server-side validation.
   - Non-university accounts (e.g. `@gmail.com`) or spoofed domain variants are blocked by the database trigger before committing to `auth.users`, leaving zero orphan accounts.
2. **Account Linking & Role Preservation:**
   - When an existing email/password user signs in with their matching Google account, Supabase automatically links the identities without altering their `profiles` row, preserving their assigned role, sub-team, and approval status.
3. **Pending Quarantine Flow:**
   - Newly authenticated Google users enter a quarantined `pending` state with zero access to sub-team tasks, documents, or chat until approved and assigned to a sub-team roster by the Club Admin.
4. **Feature Flags:**
   - `VITE_GOOGLE_AUTH_ENABLED` (`true` by default): Controls the visibility of the "Continue with Google" action.
   - `VITE_AUTH_EMAIL_ENABLED` (`true` by default): Allows secondary email/password login, enabling zero-downtime pilot transition before disabling legacy email passwords.

---

## 🌐 Free Deployment (Vercel or Cloudflare Pages)

### Deploying to Vercel (Hobby Tier - Free, No Card)
1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
3. Import the `zc-fs` repository.
4. Add the environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**.

### Activating the Keep-Alive Automation
In your GitHub repository settings:
1. Navigate to **Settings** > **Secrets and variables** > **Actions**.
2. Add Repository Secrets:
   - `SUPABASE_URL`: Your Supabase Project URL.
   - `SUPABASE_ANON_KEY`: Your Supabase Anonymous Key.
3. The `.github/workflows/keep-alive.yml` workflow will now ping your Supabase instance every 72 hours, ensuring it never pauses.
