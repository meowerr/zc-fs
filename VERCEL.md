# VERCEL DEPLOYMENT GUIDE — ZC FORMULA STUDENT PITLANE

This guide provides end-to-end instructions for deploying the **ZC Formula Student Telemetry & Project Management Workspace (PitLane)** to **Vercel Hobby Tier (100% Free, Zero Credit Card Required)**.

---

## 1. Architecture & Deployment Overview

- **Frontend Stack:** Vite 5 + React 18 + TypeScript (Strict Mode) + Tailwind CSS + VitePWA (Workbox).
- **Backend Stack:** Supabase Free Tier (Managed PostgreSQL, GoTrue Auth, Realtime CDC Websockets, S3 Storage).
- **Hosting Tier:** Vercel Hobby ($0.00 / month forever, no credit card needed).
- **Production Asset Footprint:** ~146 KB total gzipped bundle (Main App JS: 32 KB, strictly under the 200 KB mobile budget).
- **Domain Gate:** Strictly restricts account registration to `@zewailcity.edu.eg` at the PostgreSQL trigger level.

```
                      +---------------------------------------+
                      |   Vercel Edge Global CDN (Hobby)      |
                      |  https://zc-fs-pitlane.vercel.app    |
                      +-------------------+-------------------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
                        v                                   v
             [Static Assets & PWA]                 [API & Realtime]
             - HTML / CSS / JS Chunks              - HTTPS REST API
             - sw.js (Service Worker)              - wss:// WebSockets
             - manifest.webmanifest                - Storage File Uploads
                        |                                   |
                        +-----------------+-----------------+
                                          |
                                          v
                      +---------------------------------------+
                      |   Supabase Free Tier (PostgreSQL 15)  |
                      |   - Row Level Security (RLS)          |
                      |   - University Domain Gate Trigger    |
                      |   - Multi-Bucket S3 Storage           |
                      +---------------------------------------+
```

---

## 2. Pre-Deployment Verification Checklist

Before deploying, verify that your local workspace passes all strict checks:

```powershell
# 1. Verify TypeScript strict type check
npx tsc --noEmit

# 2. Build production bundle and audit size budget (< 200 KB)
npm run build

# 3. Verify zero mock data leakage into production assets
node -e "
const fs = require('fs');
const files = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js'));
let leaked = false;
for (const f of files) {
  const content = fs.readFileSync('dist/assets/' + f, 'utf8');
  if (content.includes('Lotus Shark') || content.includes('INITIAL_DEMO_TASKS')) {
    console.error('LEAK FOUND IN: ' + f);
    leaked = true;
  }
}
if (!leaked) console.log('VERIFIED: Zero mock data strings in production build.');
"

# 4. Run automated Slice 6 verification against live Supabase
node scripts/verify-slice-6.mjs
```

---

## 3. Required Environment Variables

When deploying to Vercel, provide the following environment variables:

| Variable Name | Environment | Value Example | Description |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Production, Preview, Development | `https://dbsmcaifczkslfsoeigz.supabase.co` | Your live Supabase project URL (Settings -> API). |
| `VITE_SUPABASE_ANON_KEY` | Production, Preview, Development | `sb_publishable_...` or `eyJhbG...` | Your public Supabase anon key (Settings -> API). |
| `VITE_DEMO_MODE` | Production, Preview | `false` | Disables mock persona switcher and enforces live Supabase. |

> [!IMPORTANT]
> **Never** expose the `service_role` key in Vercel or in frontend environment variables. PitLane uses Row Level Security (RLS) and requires only the public `anon` key.

---

## 4. Deployment Instructions

### Method A: Git Push-to-Deploy (Recommended)

This method connects your GitHub repository to Vercel for automated continuous deployment on every `git push`.

#### Step 1: Push Local Code to GitHub
Ensure all commits are pushed to your remote repository:
```powershell
git push origin master
```

#### Step 2: Import Project into Vercel
1. Navigate to [vercel.com](https://vercel.com) and log in using your **GitHub account**.
2. From the Vercel Dashboard, click **Add New...** -> **Project**.
3. Under **Import Git Repository**, locate your repository (e.g., `zc-fs` or `zc-fs-pitlane`) and click **Import**.

#### Step 3: Configure Build & Output Settings
Vercel automatically detects Vite. Confirm the settings:
- **Framework Preset:** `Vite`
- **Root Directory:** `./`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

#### Step 4: Configure Environment Variables
Expand the **Environment Variables** section and add:
- **Name:** `VITE_SUPABASE_URL`  
  **Value:** `https://dbsmcaifczkslfsoeigz.supabase.co`
- **Name:** `VITE_SUPABASE_ANON_KEY`  
  **Value:** `<your-live-supabase-anon-key>`
- **Name:** `VITE_DEMO_MODE`  
  **Value:** `false`

Ensure all three environments (**Production**, **Preview**, **Development**) are selected for each variable.

#### Step 5: Deploy
Click **Deploy**. Vercel will clone the repository, install dependencies, compile TypeScript, run the Vite build, and deploy to their global Edge CDN. The build takes ~40 seconds.

Once complete, Vercel provides your live URL:
`https://zc-fs-pitlane.vercel.app` (or similar).

---

### Method B: Vercel CLI (Direct Terminal Deployment)

If you prefer deploying directly from PowerShell without GitHub integration:

```powershell
# 1. Install Vercel CLI globally
npm install -g vercel

# 2. Authenticate CLI
vercel login

# 3. Link project
vercel link

# 4. Set environment variables on Vercel
vercel env add VITE_SUPABASE_URL production
# Paste: https://dbsmcaifczkslfsoeigz.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Paste: <your-live-supabase-anon-key>

vercel env add VITE_DEMO_MODE production
# Paste: false

# 5. Deploy directly to production
vercel --prod
```

---

## 5. Critical Post-Deployment Step: Supabase Auth Whitelisting

When users confirm email addresses or authenticate via magic links, Supabase must know your Vercel production domain is safe to redirect to.

### Instructions:
1. Open the [Supabase Dashboard](https://supabase.com/dashboard/project/dbsmcaifczkslfsoeigz).
2. Go to **Authentication** (left sidebar) -> **URL Configuration**.
3. **Site URL:**  
   Set to your primary Vercel production URL:
   ```text
   https://zc-fs-pitlane.vercel.app
   ```
4. **Redirect URLs (Allow List):**  
   Click **Add URL** and add the following wildcard patterns:
   ```text
   https://zc-fs-pitlane.vercel.app/**
   https://*-<your-vercel-team-or-username>.vercel.app/**
   http://localhost:5173/**
   http://localhost:5174/**
   ```
   *(The wildcard pattern `https://*-...vercel.app/**` allows branch preview deployments to authenticate without error).*
5. Click **Save Changes**.

---

## 6. Vercel Configuration Reference (`vercel.json`)

The repository includes a production-tuned `vercel.json` file in the project root:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    {
      "source": "/((?!assets/|favicon\\.ico|icon-.*\\.png|sw\\.js|registerSW\\.js|workbox-.*\\.js|manifest\\.webmanifest).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(sw\\.js|registerSW\\.js|manifest\\.webmanifest)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

### Why this configuration matters:
1. **SPA Rewrites:** Direct deep links (e.g. `/tasks`, `/chat`) rewrite cleanly to `/index.html` instead of returning 404 errors.
2. **Immutable Chunks:** Files inside `/assets/` include content hashes (`index-Ba5rE_LC.js`) and are cached for 1 year (`max-age=31536000, immutable`), reducing egress to zero.
3. **PWA Freshness:** The Service Worker (`sw.js`) and web manifest are set to `must-revalidate` so mobile devices immediately receive code updates on app launch.
4. **Security Hardening:** Enterprise headers prevent clickjacking (`DENY`), MIME sniffing (`nosniff`), and unauthorized sensor access.

---

## 7. Custom Domain Setup (Optional & 100% Free)

If the racing team acquires a custom domain (e.g. `pitlane.zewailcityracing.com` or `racing.zewailcity.edu.eg`):

1. Go to **Project Settings** -> **Domains** in your Vercel Dashboard.
2. Enter your custom domain and click **Add**.
3. In your DNS provider (e.g., Cloudflare, Namecheap, or university IT):
   - Add a `CNAME` record for `pitlane` pointing to `cname.vercel-dns.com`.
4. Vercel automatically provisions and auto-renews a free **Let's Encrypt SSL/TLS certificate**.
5. Update your Supabase **Site URL** to `https://pitlane.zewailcityracing.com`.

---

## 8. Supabase Inactivity Keep-Alive Setup

Supabase Free Tier pauses inactive projects after 7 consecutive days of zero API requests. PitLane includes automated protection:

### Method 1: GitHub Actions Keep-Alive (Pre-configured)
The repository includes `.github/workflows/keep-alive.yml`. Every 72 hours, it performs a lightweight authenticated ping to your Supabase instance:

```yaml
schedule:
  - cron: '0 8 */3 * *'  # Runs at 08:00 UTC every 3 days
```
To enable:
1. On GitHub, go to your repository -> **Settings** -> **Secrets and variables** -> **Actions**.
2. Add Repository Secret:
   - `SUPABASE_URL`: `https://dbsmcaifczkslfsoeigz.supabase.co`
   - `SUPABASE_ANON_KEY`: `<your-supabase-anon-key>`

### Method 2: Free External Cron (Zero Setup)
Alternatively, use [cron-job.org](https://cron-job.org) (100% free, zero credit card):
- **URL:** `https://dbsmcaifczkslfsoeigz.supabase.co/rest/v1/groups?select=id&limit=1`
- **Method:** `GET`
- **Headers:**
  - `apikey`: `<your-supabase-anon-key>`
  - `Authorization`: `Bearer <your-supabase-anon-key>`
- **Schedule:** Once every 2 days.

---

## 9. Live Acceptance & Smoke Testing Checklist

Once deployed on Vercel, perform this 8-point smoke test to confirm end-to-end operation:

1. **Domain Restriction:**
   - Attempt signup with `test@gmail.com` -> System displays red validation error: `"Only @zewailcity.edu.eg email addresses are permitted."`
2. **Real Signup:**
   - Sign up with `newstudent@zewailcity.edu.eg`.
   - Confirmation email sent via Supabase Auth.
3. **Pending Quarantine:**
   - Log in as `newstudent@zewailcity.edu.eg`.
   - App renders the **Pending Approval** telemetry screen.
   - Verify 0 access to tasks, channels, files, or notifications.
4. **Admin Approval:**
   - Log in with `admin_pitlane@zewailcity.edu.eg`.
   - Open **Admin Hub** -> approve `newstudent` into `Technical - Aerodynamics` with role `member`.
5. **Task Lifecycle:**
   - Admin creates a task assigned to `newstudent`.
   - `newstudent` receives in-app audio chime + notification.
   - `newstudent` uploads deliverable attachment (`.pdf`/`.png` up to 25 MB).
   - Admin reviews submission and approves.
6. **Realtime Chat:**
   - Post message in `#ch-aerodynamics` -> received instantly via WebSocket without page refresh.
   - Post direct message from Admin to `newstudent` -> private conversation stream functions.
7. **Cross-Group Isolation:**
   - Verify `newstudent` cannot view `#ch-vehicle-dynamics` or foreign task files.
8. **PWA Mobile Installation:**
   - Open Vercel URL on mobile (iOS Safari: Share -> **Add to Home Screen**; Android Chrome: Menu -> **Install App**).
   - Launch app from home screen. App opens in standalone window with bottom navigation bar and touch targets >= 48px.

---

## 10. Troubleshooting

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **Email confirmation links redirect to `localhost:3000`** | Supabase default Site URL is not updated. | Go to Supabase Dashboard -> Auth -> URL Configuration -> Set **Site URL** to `https://<your-project>.vercel.app`. |
| **404 error when refreshing on `/tasks` or `/chat`** | Missing SPA rewrite rule on Vercel. | Confirm `vercel.json` exists in project root with rewrite rule to `/index.html`. |
| **Storage file upload fails with 403 / RLS error** | User is attempting upload to an unauthorized sub-team folder. | Verify user is approved and uploading to `<user-group-id>/...` path in `task-attachments`. |
| **Realtime messages not updating live** | Supabase Realtime publication disabled for tables. | In Supabase SQL Editor, verify `ALTER PUBLICATION supabase_realtime ADD TABLE messages, notifications;`. |
| **PWA updates not reflecting on mobile** | Service worker cached aggressively. | `vercel.json` headers ensure `sw.js` has `Cache-Control: max-age=0, must-revalidate`. Reopen the PWA. |
