# SECURITY & ROLE-SCOPE AUTHORIZATION AUDIT (PITLANE)

**Zewail City Formula Student Telemetry & Project Management Workspace**  
**Audit Date:** September 30, 2026  
**Security Standard:** Zero-Trust Database-Enforced Row Level Security (RLS) & Domain Quarantine

---

## 1. Executive Summary & Audit Scope

A comprehensive security audit of the role, permission, and authorization architecture was performed. The primary objective is to verify that **UI state never dictates authorization** and that all boundaries are strictly enforced at the PostgreSQL database engine level via Row Level Security (RLS) policies and security triggers.

### Roles & System Identities
1. **Club Admin (`admin`):** Full overseer across all 5 sub-teams, manages user approvals, group assignments, and system-level configuration.
2. **Group Head (`head`):** Sub-team leader with full write/assignment/review authority strictly scoped to their own sub-team; authorized for the cross-team `#ch-pit-wall-heads` channel.
3. **Member (`member`):** Engineering contributor belonging to exactly 1 sub-team; authorized only for their own sub-team's tasks, submissions, discussions, group channel, and shared storage folder.
4. **Pending (`pending`):** Newly registered account awaiting Club Admin approval; strictly quarantined with zero access to any telemetry, CAD files, communication channels, or team data.

---

## 2. Definitive Role & Permission Matrix

| Area / Action | Admin | Head (Lead) | Member (Eng) | Pending (Quarantine) | Enforcement Level | Database Policy / Trigger Mechanism |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **View own profile** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | Database RLS | `profiles` SELECT: `id = auth.uid()` |
| **Edit own profile** *(name, phone, avatar)* | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | Database RLS | `profiles` UPDATE: `id = auth.uid()` |
| **View users / directory** | ✅ All | ✅ Own Group + Heads/Admins | ✅ Own Group + Heads/Admins | ❌ None (0 rows) | Database RLS | `profiles` SELECT scoped by `get_auth_group()` & `is_approved_user()` |
| **Approve pending users** | ✅ Yes | ❌ **BLOCKED** | ❌ **BLOCKED** | ❌ **BLOCKED** | Database Trigger | `prevent_profile_privilege_escalation()` strictly requires `public.is_admin()` |
| **Change user roles** | ✅ Yes | ❌ **BLOCKED** | ❌ **BLOCKED** | ❌ **BLOCKED** | Database Trigger | `prevent_profile_privilege_escalation()` strictly requires `public.is_admin()` |
| **Change user groups** | ✅ Yes | ❌ **BLOCKED** | ❌ **BLOCKED** | ❌ **BLOCKED** | Database Trigger | `prevent_profile_privilege_escalation()` strictly requires `public.is_admin()` |
| **Create tasks** | ✅ Any Group | ✅ Own Group Only | ❌ **BLOCKED** | ❌ **BLOCKED** | Database RLS | `tasks` INSERT: `public.is_admin() OR public.is_head_of_group(group_id)` |
| **Assign tasks to members** | ✅ Any Group | ✅ Own Group Only | ❌ **BLOCKED** | ❌ **BLOCKED** | Database RLS | `task_assignees` INSERT/UPDATE: `public.is_admin() OR public.is_head_of_group(t.group_id)` |
| **View tasks** | ✅ All Groups | ✅ Own Group Only | ✅ Own Group Only | ❌ None (0 rows) | Database RLS | `tasks` SELECT: `public.is_admin() OR public.is_member_of_group(group_id)` |
| **Edit task details** | ✅ All Groups | ✅ Own Group Only | ❌ **BLOCKED** | ❌ **BLOCKED** | Database RLS | `tasks` UPDATE: `public.is_admin() OR public.is_head_of_group(group_id)` |
| **Update task assignment status** | ✅ Yes | ✅ If Assigned | ✅ If Assigned | ❌ **BLOCKED** | Database RLS | `task_assignees` UPDATE: `user_id = auth.uid() AND is_member_of_group()` |
| **Submit work deliverables** | ✅ Yes | ✅ If Assigned | ✅ If Assigned | ❌ **BLOCKED** | Database RLS | `task_submissions` INSERT: `submitted_by = auth.uid() AND is_member_of_group()` |
| **Review submissions** | ✅ All Groups | ✅ Own Group Only | ❌ **BLOCKED** | ❌ **BLOCKED** | Database RLS | `task_submissions` UPDATE: `public.is_admin() OR public.is_head_of_group(t.group_id)` |
| **Comment on tasks** | ✅ All Groups | ✅ Own Group Only | ✅ Own Group Only | ❌ **BLOCKED** | Database RLS | `task_comments` INSERT: `author_id = auth.uid() AND is_member_of_group()` |
| **View group channels** | ✅ All Channels | ✅ Own Group Only | ✅ Own Group Only | ❌ None (0 rows) | Database RLS | `channels` SELECT: `c.group_id = get_auth_group()` |
| **Post to Announcements** | ✅ Yes | ✅ Yes | ❌ **BLOCKED** (Read-Only) | ❌ **BLOCKED** | Database RLS | `messages` INSERT: `c.channel_type = 'announcements' AND is_any_head_or_admin()` |
| **Read/Post Heads-Only channel** | ✅ Yes | ✅ Yes | ❌ **BLOCKED** (0 rows) | ❌ **BLOCKED** | Database RLS | `channels` & `messages`: `c.channel_type = 'heads_only' AND is_any_head_or_admin()` |
| **Send Direct Messages (1:1)** | ✅ Any Member | ✅ Any Member | ✅ Approved Members | ❌ **BLOCKED** | Database RLS | `conversations` & `messages` INSERT/SELECT require `is_approved_user()` |
| **Upload files (Storage)** | ✅ All Folders | ✅ Own Group Folder | ✅ Own Group Folder | ❌ **BLOCKED** | Database RLS | `storage.objects` INSERT: `split_part(name, '/', 1) = get_auth_group()::text` |
| **Delete files (Storage)** | ✅ Any File | ✅ Own Files Only | ✅ Own Files Only | ❌ **BLOCKED** | Database RLS | `storage.objects` DELETE: `owner = auth.uid() OR is_admin()` |
| **View notifications** | ✅ Own Only | ✅ Own Only | ✅ Own Only | ❌ None | Database RLS | `notifications` SELECT: `user_id = auth.uid() AND is_approved_user()` |
| **Manage club settings & groups** | ✅ Yes | ❌ **BLOCKED** | ❌ **BLOCKED** | ❌ **BLOCKED** | Database RLS | `groups` ALL: `public.is_admin()` |

---

## 3. Persona Switcher Audit & Root Cause Analysis

### Identified Vulnerabilities
1. **Prototype Role Switcher Toolbar:**
   - In `src/components/dashboard/MissionControlDemo.tsx`, a prototype component rendered a `"Live Role Persona:"` toolbar with interactive buttons (`admin`, `head`, `member`, `pending`).
   - Clicking these buttons invoked `onChangeRole` -> `switchDemoPersona`, mutating React state `currentUser` and persisting to `localStorage.getItem('zcfs_demo_user')`.
2. **Pending Gateway Bypass Shortcut:**
   - In `src/components/auth/PendingApprovalView.tsx`, an `onSwitchToAdmin` button was rendered, allowing pending users in dev mode to jump straight to the Admin Hub.
3. **Login Screen Quick Persona Buttons:**
   - In `src/components/auth/AuthScreen.tsx`, mock accounts were listed under `"Instant Demo Personas"`.

### Remediation Protocol
- **Completely remove all persona-switching code:**
  - Delete `switchDemoPersona`, `onSelectDemoPersona`, and `onSwitchToAdmin` from all components and hooks.
  - Delete all reads/writes to `localStorage.getItem('zcfs_demo_user')`.
  - Replace `MissionControlDemo.tsx` with production `MissionControl.tsx` that computes telemetry metrics directly from live Supabase hooks (`useTasks`, `useRealtimeChat`).
  - Ensure `currentUser` is exclusively derived from `supabase.auth.getSession()` and `public.profiles`.

---

## 4. Privilege Escalation & Security Boundary Defense

### A. Database Trigger: `prevent_profile_privilege_escalation()`
PostgreSQL trigger `trg_prevent_privilege_escalation` executes `BEFORE UPDATE` on `public.profiles`:
```sql
IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    IF (NEW.role IS DISTINCT FROM OLD.role) OR
       (NEW.group_id IS DISTINCT FROM OLD.group_id) OR
       (NEW.status IS DISTINCT FROM OLD.status) THEN
        RAISE EXCEPTION 'Access Denied: Only approved Club Admins can modify role, group assignment, or account status.';
    END IF;
END IF;
```
Even if a malicious user alters client state or issues a direct Supabase REST request:
```js
await supabase.from('profiles').update({ role: 'admin' }).eq('id', myId);
```
The database engine intercepts and aborts the transaction with an uncatchable exception.

### B. University Email Domain Enforcement
Registration is restricted at both the frontend and PostgreSQL schema levels:
```sql
CONSTRAINT zewailcity_email_domain CHECK (lower(trim(email)) ~* '^[a-z0-9._%+-]+@zewailcity\.edu\.eg$')
```

---

## 5. Storage Security & Cross-Group Quarantine

1. **Bucket `task-attachments`:**
   - Uploads and reads enforce path scoping: `<group_id>/<filename>`.
   - `split_part(name, '/', 1) = public.get_auth_group()::text`.
   - An approved member of Vehicle Dynamics attempting to download or upload into the Aerodynamics folder is rejected by storage RLS.
2. **Bucket `chat-media`:**
   - Path format: `channels/<channel_id>/<filename>` and `conversations/<conversation_id>/<filename>`.
   - Helper functions `can_access_channel_media()` and `can_upload_channel_media()` verify the caller's membership in the channel before permitting read/write.
   - Heads-Only media is quarantined to `is_any_head_or_admin()`.

---

## 6. Verification & Automated Test Results

Every security boundary is audited via automated live test scripts executed against the production Supabase instance (`https://dbsmcaifczkslfsoeigz.supabase.co`):

- `supabase/tests/rls_security_test.sql` (7 SQL security tests)
- `scripts/verify-slice-2.mjs` (Auth, pending quarantine, self-promotion block)
- `scripts/verify-slice-3.mjs` (Tasks, multi-assignees, review workflow)
- `scripts/verify-slice-4.mjs` (Channels, heads-only, DMs, realtime)
- `scripts/verify-slice-5.mjs` (Storage uploads, folder isolation, signed URLs)
- `scripts/verify-slice-6.mjs` (Notifications, PWA policies, bundle budget)
- `scripts/verify-security-audit.mjs` (Full negative privilege escalation & cross-role matrix tests)
