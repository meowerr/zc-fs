-- ==============================================================================
-- ZC Formula Student Workspace: Task Security & RLS Policy Hardening
-- Migration: 007_task_security_hardening.sql
-- Description:
--   1. Restricts task_assignees UPDATE to 'in_progress' and 'submitted' only,
--      preventing engineers from self-approving deliverables via direct API calls.
--   2. Enforces that task_submissions INSERT must have review_status = 'pending'
--      and reviewed_by IS NULL, and must belong to an assigned engineer or head.
--   3. Restricts direct tasks UPDATE to Admin and Group Head only, ensuring
--      task status rollup is governed strictly by the verified database trigger.
-- ==============================================================================

-- 1. Hardened Assignee Status Progression Policy
DROP POLICY IF EXISTS "Assignees can update own status" ON task_assignees;
CREATE POLICY "Assignees can update own status"
    ON task_assignees FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.id = task_assignees.task_id 
              AND public.is_member_of_group(t.group_id)
        )
    )
    WITH CHECK (
        user_id = auth.uid()
        AND status IN ('in_progress', 'submitted')
    );

-- 2. Hardened Work Submission Creation Policy
DROP POLICY IF EXISTS "Submit work" ON task_submissions;
CREATE POLICY "Submit work"
    ON task_submissions FOR INSERT
    TO authenticated
    WITH CHECK (
        submitted_by = auth.uid()
        AND review_status = 'pending'
        AND reviewed_by IS NULL
        AND EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.id = task_submissions.task_id 
              AND (
                  public.is_admin() 
                  OR public.is_head_of_group(t.group_id)
                  OR EXISTS (
                      SELECT 1 FROM task_assignees ta 
                      WHERE ta.task_id = t.id AND ta.user_id = auth.uid()
                  )
              )
        )
    );

-- 3. Hardened Task Modification Policy (Admin and Group Head only)
DROP POLICY IF EXISTS "Update tasks" ON tasks;
CREATE POLICY "Update tasks"
    ON tasks FOR UPDATE
    TO authenticated
    USING (
        public.is_admin() 
        OR public.is_head_of_group(group_id)
    )
    WITH CHECK (
        public.is_admin() 
        OR public.is_head_of_group(group_id)
    );
