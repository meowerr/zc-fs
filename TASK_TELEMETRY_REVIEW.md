# Task Telemetry: Code Review (Logic + Web + Mobile)

**Repo:** `meowerr/zc-fs` · **Reviewed at:** `feature/mobile-ui-polish` @ `db40d14` · **Date:** 2026-10-22
**Scope:** `TasksHub.tsx`, `TaskCard.tsx`, `TaskCreateModal.tsx`, `TaskDetailModal.tsx`, `useTasks.ts`, `exportUtils.ts`, plus the shared pieces they use (`PageHeader`, `StatStrip`, `ModalShell`, `GlassCard`, `LedStatusChip`, `usePullToRefresh`, `SkeletonCard`), the task wiring in `App.tsx`, and the task RLS policies / rollup trigger in `supabase/migrations/001–002`.

> **How this was done:** read-only code review. I could **not** run the app, `tsc`, the build or the test suite (npm could not reach its registry from my sandbox), so every finding comes from reading the code. Items marked **(verify)** are inferred from layout arithmetic or browser behaviour and are worth a 30-second check on a device. Line numbers are from `db40d14` and may drift; use `grep`.

---

## 0. Summary

Task Telemetry works on the happy path, but it has **two dead buttons, one destructive-dialog bug, one mobile feature that disappeared in the last refactor, and a list that flashes to skeletons on every change.** Underneath, the status logic has gaps (tasks that never change status, "success" shown when the database refused the change), notifications go to the wrong person, and approval integrity is enforced only by the UI.

| Area | Count | Worst offenders |
|---|---|---|
| 🔴 Broken / dead buttons | 6 | Overview "Submit Work" does nothing; delete dialog Cancel closes everything; exports gone on mobile |
| 🟠 Visual glitches | 9 | List flickers to skeleton on every realtime event; stale status in open modal; tab labels overflow at 360px |
| 🟠 Logic bugs | 10 | Silent RLS failures shown as success; head-submitted work never advances status; notifications sent to the actor |
| 🔴 Security / integrity | 3 | `javascript:` links; members can self-approve via the API |
| 🟡 Accessibility | 5 | Task cards not keyboard-operable |
| 🟡 Performance | 3 | Admin hub pulled into task chunk; realtime reload storm |

---

## 1. 🔴 Buttons that don't work (or do the wrong thing)

### 1.1 "Submit Work Deliverable" on the Overview tab does nothing
`TaskDetailModal.tsx` (~L419–427): the button only calls `setIsSubmittingWork(true)`, but the form it opens is rendered **inside the Submissions tab** (~L447). The user stays on Overview and sees nothing happen. When they later open the Submissions tab, the form is suddenly already open.

```tsx
// Fix: switch tab as well
onClick={() => { setIsSubmittingWork(true); setActiveTab('submissions'); }}
```

### 1.2 Delete confirmation: Cancel closes the whole task, and delete errors are invisible
`TaskDetailModal.tsx`: the outer backdrop has `onClick={onClose}` (~L239). The inner panel stops propagation, but the **delete confirmation overlay is rendered as a sibling inside the outer div** (~L755), so every click in it bubbles to the backdrop:

- **Cancel** → sets `isConfirmingDelete=false` *and* bubbles to `onClose` → the whole task modal closes.
- **Confirm Delete** → starts the async delete *and* bubbles to `onClose` → the modal unmounts immediately, so `deleteError` is never shown. If RLS refuses the delete, the user sees the modal close and the task still there.

```tsx
// Fix: stop propagation on the confirm overlay's root
<div className="fixed inset-0 z-[60] ..." onClick={(e) => e.stopPropagation()}>
```
Better: move the confirm dialog into its own `ModalShell` (z-index above the detail modal).

### 1.3 "Start Task" is shown to everyone and "succeeds" without doing anything
`TaskDetailModal.tsx` (~L408): shown whenever `status === 'todo'`, not gated by `isAssignee || isHeadOrAdmin`. For a non-assignee group member, `useTasks.updateTaskStatus` falls through to a direct `tasks.update(...)`. **Postgres RLS blocks an UPDATE by returning 0 rows, not an error**, so `error` is null, and then `TasksHub` patches the local status anyway (`setSelectedTask(prev => ({...prev, status}))`, ~L358). The UI says "In Progress"; the database still says `todo`. After the next reload it flips back.

```tsx
{task.status === 'todo' && (isAssignee || isHeadOrAdmin) && ( ...Start Task... )}
```
And make the hook detect refusals (see 3.1).

### 1.4 CSV / JSON export is unreachable on phones (and tablet portrait)
`PageHeader.tsx`: the title row is `hidden md:flex`, and the actions container inside it is `hidden sm:flex`, so **actions never render below 768px**. `TasksHub` passes the export buttons (and desktop "Create Task") only through `actions`. `PROGRESS.md` says Phase 5 added a mobile export overflow menu; it was lost in the Round 2 header refactor. The FAB still creates tasks on mobile, but exports have no mobile entry point.
Fix: add an overflow ("⋯") button in the mobile toolbar that opens a small sheet with CSV / JSON, or put export inside the filter sheet.

### 1.5 Create Task: errors hidden, drafts lost, form not reset
`TaskCreateModal.tsx`:
- The error banner is at the **top of the scrolling body** but the submit button is in the **sticky footer**. If the form is scrolled down (assignees/links on a phone), a failed create shows nothing visible, so the button looks dead. Put the error in the footer or `scrollIntoView` it.
- A link typed into the label/URL inputs but not committed with "+ Add Link" is **silently dropped** on submit. Auto-add a pending link on submit, or disable submit with a hint.
- State lives in the always-mounted modal component, so after a successful create the **old title/description/assignees are still there** next time you open it. Reset all state on success (and optionally on close).

### 1.5b Reply / Review / Submit swallow errors and can double-fire
`handleCommentSubmit`, `handleReviewSubmit` catch and only `console.error`. On failure (RLS, offline) the button looks dead. None of these buttons has a pending/disabled state, so a double-tap on "Confirm Submission" creates two submissions (version numbers are computed client-side), and a double-tap on "Reply" posts twice. Add `isSubmitting` state, `disabled`, and visible error text.

### 1.6 Pull-to-refresh can fire by accident
`usePullToRefresh.ts`: `startY` is initialised to `0` and only updated when a touch **starts** at `scrollY === 0`. If a drag starts mid-list and ends at the top, `diff = endY - 0` is large, so refresh triggers. Reset `startY` to `null` on every touchstart, only refresh if it was set, and only treat it as a pull if the finger moved down. Also see 2.1: a refresh currently replaces the whole list with skeletons.

---

## 2. 🟠 Visual glitches

### 2.1 The list flashes to skeletons on every change (high impact)
`TasksHub.tsx` (~L291): `loading ? <SkeletonCard/> : ...`. `useTasks.loadTasksFromSupabase` sets `loading=true` for **every** reload, and a reload is triggered by every realtime event on tasks / assignees / submissions / comments (any team's, for admins), plus after each mutation (see 3.5). So the list blinks to skeletons whenever anyone posts a comment.
```tsx
{loading && tasks.length === 0 ? <SkeletonCard count={3}/> : ...}
```
Use a separate `isInitialLoading` flag in the hook and a small "refreshing" indicator for background reloads.
Also, `loading` starts `false`, so the first paint shows the "NO DELIVERABLES MATCH" empty state for a frame before the skeleton.

### 2.2 The open task modal shows stale data
`TasksHub` stores a **snapshot** (`selectedTask`) instead of an id. Submissions/comments are looked up live, but the header status chip, assignees and deadline stay as they were when opened (only `onUpdateStatus` patches status by hand). After submitting work or a review, the status chip is wrong until you close and reopen.
```tsx
const [selectedTaskId, setSelectedTaskId] = useState<string|null>(null);
const selectedTask = tasks.find(t => t.id === selectedTaskId) ?? null; // always fresh; null if deleted
```
This also removes the hand-patching in `onUpdateStatus` (which is what makes 1.3 look successful).

### 2.3 Deadline label glitches on the card
`TaskCard.tsx` `formatDeadline`: `Math.round(diffHours / 24)` on a negative number gives `OVERDUE -0d` for anything overdue by under 12 hours. And a task due in 20 minutes reads `Due 0h`; one overdue by 24 minutes can show **`Due 0h` inside the red overdue chip** (because `Math.round(-0.4)` is `-0`, which is not `< 0`).
```ts
const mins = Math.round((d.getTime() - now.getTime()) / 60000);
if (mins < 0) { const m = -mins; return m < 60 ? `Overdue ${m}m` : m < 1440 ? `Overdue ${Math.floor(m/60)}h` : `Overdue ${Math.floor(m/1440)}d`; }
return mins < 60 ? `Due ${mins}m` : mins < 1440 ? `Due ${Math.floor(mins/60)}h` : `Due ${Math.floor(mins/1440)}d`;
```

### 2.4 Constant pulsing
Every overdue chip has `animate-pulse`, and `LedStatusChip` pulses dots for `submitted`, `pending`, `high`, `urgent`, `changes_requested`. A list with several of these is a wall of blinking. Reserve motion for at most the single most critical state (or none); the colour + icon already encodes it.

### 2.5 Detail modal tabs don't fit at 360px **(verify)**
Four equal tabs ("OVERVIEW", "SUBMISSIONS (n)", "THREAD (n)", "TIMELINE (n)") with an icon each, 12px uppercase mono, inside a ~320px row (≈77px per tab). "SUBMISSIONS" alone is ~80px before the icon and count, so labels will wrap or overflow. Use short labels, hide icons on mobile, make the row `overflow-x-auto`, or switch to a segmented control with counts as small badges.

### 2.6 Detail modal is a hand-rolled dialog (not `ModalShell`)
Compared to `ModalShell` it lacks: safe-area bottom padding (action buttons sit under the iPhone home indicator), a sticky action footer, and `overscroll-contain`. The Reply input is at the bottom of a `dvh` sheet; iOS doesn't shrink `dvh` for the keyboard, so the input can sit **under the keyboard** **(verify)**. Also the backdrop closes on any click, including a drag that starts in a textarea and ends outside, which loses the draft. Migrate to `ModalShell` (with `headerExtra`/tabs) and use `onMouseDown` target checks for backdrop close.

### 2.7 Thread tab
Comments are in a `max-h-60` inner scroller **inside** the modal's scroller (double scroll on mobile), not scrolled to the newest comment, and show **time only** (no date). After you post, your comment is appended out of view, so Reply looks like it failed. Scroll to bottom on add, remove the inner `max-h`, show date separators.

### 2.8 Mobile card and header details
- `TaskCard` hides the task-type and **group name** on mobile (`hidden sm:...`); admins see only a coloured dot (a `title` tooltip doesn't exist on touch). Show the group name for admins.
- **Priority is never shown on the card** (only in the detail modal), so an `urgent` task looks identical to a `low` one in the list.
- `StatStrip`: the "Total Tasks" item has no `hideZeroOnMobile`, so an empty list shows one lone "0" tile in the corner.
- Small touch targets remain in the detail modal: the Delete button (~28px), submission type toggle (`py-1.5`), text-only "Cancel", "+ Review this deliverable", "Remove" (create modal). The close "X" and delete buttons also lack `aria-label`.
- Assigned-engineers row has no `flex-wrap`, so 4+ assignees overflow on mobile.

### 2.9 Ordering
Tasks come from the DB ordered by `deadline asc`, so **finished tasks with old deadlines sit at the top** above active work. There's no sort control. Default to: overdue → active (by deadline) → in review → approved/done last, and offer "Sort: deadline / priority / newest".

---

## 3. 🟠 Logic bugs

### 3.1 RLS refusals are reported as success
Supabase `update`/`delete` that RLS blocks return **no error and 0 rows**. `updateTaskStatus`, `reviewSubmission` and the assignee updates never check row counts, so the UI proceeds as if they worked and the change vanishes on reload. Chain `.select()` and assert a row came back:
```ts
const { data, error } = await supabase.from('tasks').update({...}).eq('id', id).select('id');
if (error) throw error;
if (!data?.length) throw new Error('You do not have permission to change this task.');
```
And **throw** from the hook so the modal can show it (today `updateTaskStatus` only `console.warn`s).

### 3.2 Work submitted by a head/admin never advances the task
The UI lets heads/admins submit (`isAssignee || isHeadOrAdmin`). In live mode `submitWork` and `reviewSubmission` update `task_assignees` for the submitter; if the submitter isn't an assignee, **0 rows change, the rollup trigger never fires, and the task stays `todo`/`in_progress` forever** even after the submission is approved. Demo mode behaves differently (it sets the whole task's status directly), so demo and live diverge. Either restrict submissions to assignees, or add an assignee row / update `tasks.status` explicitly for non-assignee submitters.

### 3.3 Multi-assignee approval semantics
Review updates only the submitting engineer's assignee row; the DB trigger then rolls up (`changes_requested` if any, `approved` only when all approved). That is a sensible rule, but the UI doesn't explain it, and demo mode sets the whole task to `approved` after one review. Show per-assignee status in the modal ("2 of 3 approved") and make demo mode match the trigger.

### 3.4 Version numbers are computed on the client
`nextVersion = currentSubmissions.length + 1` from local state. Two quick submits (see 1.5b) or two people submitting (heads can) produce duplicate `version_number`s. Compute it in the database (default via sequence/`max()+1` in an RPC or trigger) and add a unique `(task_id, version_number)` constraint.

### 3.5 Realtime reload storm
Four `postgres_changes` listeners each call a full `loadTasksFromSupabase()` (3 queries), and every mutation **also** `await`s a reload, so one action causes 2+ full reloads. Admins get events for all teams. Debounce reloads (~300ms), skip your own echoes, and for comments/submissions patch state from the payload. Also `task_submissions` and `task_comments` are fetched **unfiltered** (RLS limits them, but an admin downloads every submission and comment for every task); fetch them per opened task, or by `task_id in (...)`.

### 3.6 Notifications go to the wrong person
`App.tsx` calls `addNotification(type, title, msg, link)` **without `targetUserId`**, so `recipientId = currentUser.id`: **the person who performed the action**. Creating a task notifies the creator ("New task created for team"); submitting notifies the submitter; approving notifies the reviewer ("Work Approved"). The assignees, the head and the engineer never get anything. Pass recipients: assignee ids on create, the group head(s) on submit, the submission author on review, and the creator on comments.

### 3.7 Create-task side effects
- Assignee insert failure is only `console.warn`ed, so the task is created **without assignees** and the UI says success. Surface the error, or do both inserts in one RPC/transaction.
- Default deadline date uses `toISOString().split('T')[0]` (UTC). Between 00:00 and 03:00 Cairo time the default is a day early. Format the local date instead.
- No check that the deadline is in the future.
- Admins can tick **any** member regardless of the chosen sub-team (`isAdmin || m.group_id === groupId`), and changing the sub-team doesn't clear already-ticked assignees.
- `TaskCreateModal` imports `SUB_TEAMS` from `../admin/AdminApprovalHub`, which just re-exports `lib/constants`. Import from `lib/constants` so the 1,273-line admin hub isn't dragged into the tasks chunk (the bundle has ~0.3 KB of headroom).

### 3.8 Filters
- "My Deliverables" is exclusive: you can't combine it with In Review / Overdue.
- On mobile the filter sheet's **status section duplicates the chip row that is already visible**, and the Filters badge counts both. For non-admins the sheet contains nothing the chip row doesn't, so the button feels pointless. Keep chips for status; keep the sheet for sub-team (admin), sort, and "mine".
- CSV/JSON export ignore the current filter/search (`tasks`, not `filteredTasks`). Say so on the button, or export the filtered view.

### 3.9 Deep links
`initialTaskId` that matches no visible task is never cleared, so the modal will pop open later when the task appears. Clear it if not found after load.

### 3.10 Timeline
The reviewer is shown as the literal string `"Reviewer"`/`"Group Head"` (the query doesn't join the reviewer profile), "Engineers Allocated" is stamped with the task's creation time, and `task.priority.toUpperCase()` / `task.task_type.toUpperCase()` will throw on a null from the DB. Join `reviewer:profiles!reviewed_by(*)` and use optional chaining.

### 3.11 Export quality (`exportUtils.ts`)
- **No UTF-8 BOM**: Excel will garble Arabic names/titles. Prepend `﻿`.
- **CSV injection**: a title like `=HYPERLINK(...)` executes in Excel. Prefix cells starting with `= + - @` with `'`.
- The JSON export dumps whole profile objects (emails, roles) for creators/assignees. Export a reduced shape.
- iOS standalone PWAs often ignore blob `<a download>`; use the Web Share API with a `File` when `navigator.canShare` allows.
- Guard `task.task_type`/`priority` being null.

### 3.12 Minor
- `JSON.parse(localStorage...)` in demo mode is unguarded; a corrupted value crashes the app on load.
- "File" submission type is just a text box (no upload), identical to "note". Remove it or wire it to the existing storage upload.
- Page title for heads is "Pit Wall", which is also the name of the chat. Use "Team Deliverables".

---

## 4. 🔴 Security and integrity

### 4.1 `javascript:` links
Task reference links (`TaskCreateModal` → `TaskDetailModal` `<a href={link.url}>`) and **submission links** (`href={sub.content}` for `type='link'`) are rendered unvalidated. `type="url"` accepts `javascript:alert(1)`, and a member can submit one as a "deliverable URL" that a head/admin then clicks. Whether it executes depends on browser handling of `javascript:` with `target=_blank` **(verify)**, but it should be blocked regardless:
```ts
export const safeHref = (u: string) => { try { const p = new URL(u); return ['http:','https:'].includes(p.protocol) ? p.href : undefined; } catch { return undefined; } };
// <a href={safeHref(link.url)} ...>  and validate on create/submit
```

### 4.2 Members can approve their own work through the API
Approval is enforced in the UI only:
- `"Assignees can update own status"` on `task_assignees` has `WITH CHECK (user_id = auth.uid())` and no status restriction, so an assignee can set their own row to `approved` (the trigger then marks the task approved).
- `"Update tasks"` lets any assignee update **any column** (status, deadline, group_id) of the task.
- `"Submit work"` doesn't constrain `review_status`, so a submission can be inserted already `approved`.
- Any group member (not only assignees) can insert submissions.

Fix in SQL: restrict assignee updates to `in_progress`/`submitted` via `WITH CHECK (status IN ('in_progress','submitted'))`; remove the assignee path from `"Update tasks"` (let the trigger own `tasks.status`); add `WITH CHECK (review_status = 'pending' AND reviewed_by IS NULL)` to submission insert; require assignee membership for inserts. Add cases to `supabase/tests/rls_security_test.sql`.

### 4.3 Delete cascade is fine
Checked: `task_assignees`, `task_submissions` and `task_comments` all reference `tasks(id) ON DELETE CASCADE`, so the confirm text is accurate. The remaining delete problem is the dialog bug in 1.2, which hides failures.

---

## 5. 🟡 Accessibility

- **Task cards aren't keyboard-operable**: `GlassCard onClick` on a `<div>`. No focus, no Enter/Space, no role. Render the card as a `<button>` or add `role="button" tabIndex={0}` + key handler.
- Detail modal: no `aria-labelledby`, no focus trap or focus return, tabs have no `role="tablist"/"tab"/aria-selected`, icon-only buttons (close, delete) have no `aria-label`.
- Status is double-encoded (good), but several chips are 12px with low-contrast muted text.
- Reduce motion is respected globally; the pulsing issue (2.4) is still noisy for everyone else.
- Form labels in the create modal aren't tied to inputs (`htmlFor`/`id`).

---

## 6. Suggested fix order

| # | Fix | Effort | Why first |
|---|---|---|---|
| 1 | 1.1 Submit button switches tab | 5 min | Dead button |
| 2 | 1.2 Delete overlay `stopPropagation` | 5 min | Destructive flow broken, errors hidden |
| 3 | 2.1 Skeleton only when list empty | 10 min | Visible flicker everywhere |
| 4 | 2.2 `selectedTaskId` derived state | 20 min | Stale modal, removes the fake-success patch |
| 5 | 1.3 + 3.1 Gate "Start Task"; detect 0-row updates and throw | 1 h | "Success" that isn't |
| 6 | 1.4 Mobile export entry point | 30 min | Feature vanished |
| 7 | 1.5 / 1.5b Create-modal reset + visible errors + pending states | 1 h | "Buttons don't work" reports |
| 8 | 2.3 deadline labels, 2.4 pulsing, 2.8 priority on card | 1 h | Polish users notice |
| 9 | 4.1 safe hrefs, 3.11 CSV BOM + injection | 1 h | Cheap safety |
| 10 | 3.6 notification recipients | 1–2 h | Core workflow gap |
| 11 | 4.2 RLS hardening + tests | 2 h | Integrity |
| 12 | 3.2/3.4/3.5 status rollup, version numbers, realtime debounce | 0.5–1 day | Correctness at scale |
| 13 | 2.5/2.6 detail modal → `ModalShell`, tabs, keyboard | 0.5 day | Mobile feel, a11y |

---

## 7. Gaps in this review

- Not run on a device or in a browser: layout claims (2.5, 2.6) are from code and arithmetic.
- `tsc`, the build and `scripts/verify-suite.mjs` were not run (no npm registry access from my environment).
- I did not review `TeamDirectory`, chat, documents or admin code, only where they touch tasks.
- RLS findings come from reading the migration SQL, not from a live database; confirm against the deployed policies. The relevant policy names exist in both `supabase/000_complete_setup.sql` and `migrations/002_rls_policies.sql`.
