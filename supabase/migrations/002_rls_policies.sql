-- ==============================================================================
-- 002_rls_policies.sql
-- ZC Formula Student Telemetry & Project Management Workspace (PitLane)
-- Strict Row Level Security Policies (Enforced at Database Engine Level)
-- ==============================================================================

-- 1. Helper Security Functions (STABLE, SECURITY DEFINER)

CREATE OR REPLACE FUNCTION public.current_profile()
RETURNS TABLE (
    user_id UUID,
    role user_role,
    group_id UUID,
    status user_status
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id, role, group_id, status 
    FROM public.profiles 
    WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_head_of_group(target_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
          AND role = 'head' 
          AND status = 'approved' 
          AND group_id = target_group_id
    );
$$;

CREATE OR REPLACE FUNCTION public.is_member_of_group(target_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
          AND status = 'approved' 
          AND group_id = target_group_id
    );
$$;

CREATE OR REPLACE FUNCTION public.is_any_head_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
          AND status = 'approved' 
          AND role IN ('admin', 'head')
    );
$$;

-- 2. Enable RLS on ALL Tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- GROUPS POLICIES
-- ------------------------------------------------------------------------------
-- Anyone approved can view groups
CREATE POLICY "Approved users can view groups"
    ON groups FOR SELECT
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'approved')
    );

-- Only Admin can insert/update/delete groups
CREATE POLICY "Admins can manage groups"
    ON groups FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Users can view their own profile regardless of approval status
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Approved users can view approved team members (same group, or heads/admin)
CREATE POLICY "Approved users can view teammates"
    ON profiles FOR SELECT
    TO authenticated
    USING (
        status = 'approved' AND EXISTS (
            SELECT 1 FROM public.profiles my_prof
            WHERE my_prof.id = auth.uid() 
              AND my_prof.status = 'approved'
              AND (
                  my_prof.role = 'admin'
                  OR my_prof.role = 'head'
                  OR my_prof.group_id = profiles.group_id
                  OR profiles.role IN ('admin', 'head')
              )
        )
    );

-- Users can update basic details of their own profile (name, avatar, phone)
CREATE POLICY "Users can update own basic profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() 
        AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Cannot elevate role
        AND status = (SELECT status FROM public.profiles WHERE id = auth.uid()) -- Cannot self-approve
    );

-- Admins can update any profile (assign group, change role, approve/reject)
CREATE POLICY "Admins can update any profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- TASKS POLICIES
-- ------------------------------------------------------------------------------
-- View tasks: Admin can view all; Members & Heads can view only their own group's tasks
CREATE POLICY "View tasks scoped to group"
    ON tasks FOR SELECT
    TO authenticated
    USING (
        public.is_admin() OR public.is_member_of_group(group_id)
    );

-- Create tasks: Admin can create anywhere; Heads can create ONLY in their own group
CREATE POLICY "Create tasks"
    ON tasks FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin() OR public.is_head_of_group(group_id)
    );

-- Update tasks: Admin can update all; Heads can update in own group; Assignees can update status
CREATE POLICY "Update tasks"
    ON tasks FOR UPDATE
    TO authenticated
    USING (
        public.is_admin() 
        OR public.is_head_of_group(group_id)
        OR (
            public.is_member_of_group(group_id) 
            AND EXISTS (SELECT 1 FROM task_assignees WHERE task_id = tasks.id AND user_id = auth.uid())
        )
    );

-- Delete tasks: Admin or Group Head of that group
CREATE POLICY "Delete tasks"
    ON tasks FOR DELETE
    TO authenticated
    USING (
        public.is_admin() OR public.is_head_of_group(group_id)
    );

-- ------------------------------------------------------------------------------
-- TASK ASSIGNEES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "View task assignees"
    ON task_assignees FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.id = task_assignees.task_id 
              AND (public.is_admin() OR public.is_member_of_group(t.group_id))
        )
    );

CREATE POLICY "Manage task assignees"
    ON task_assignees FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.id = task_assignees.task_id 
              AND (public.is_admin() OR public.is_head_of_group(t.group_id))
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.id = task_assignees.task_id 
              AND (public.is_admin() OR public.is_head_of_group(t.group_id))
        )
    );

-- ------------------------------------------------------------------------------
-- TASK SUBMISSIONS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "View submissions"
    ON task_submissions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.id = task_submissions.task_id 
              AND (public.is_admin() OR public.is_member_of_group(t.group_id))
        )
    );

CREATE POLICY "Submit work"
    ON task_submissions FOR INSERT
    TO authenticated
    WITH CHECK (
        submitted_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.id = task_submissions.task_id 
              AND (public.is_admin() OR public.is_member_of_group(t.group_id))
        )
    );

CREATE POLICY "Review submissions"
    ON task_submissions FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.id = task_submissions.task_id 
              AND (public.is_admin() OR public.is_head_of_group(t.group_id))
        )
    );

-- ------------------------------------------------------------------------------
-- TASK COMMENTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "View task comments"
    ON task_comments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.id = task_comments.task_id 
              AND (public.is_admin() OR public.is_member_of_group(t.group_id))
        )
    );

CREATE POLICY "Add task comments"
    ON task_comments FOR INSERT
    TO authenticated
    WITH CHECK (
        author_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.id = task_comments.task_id 
              AND (public.is_admin() OR public.is_member_of_group(t.group_id))
        )
    );

-- ------------------------------------------------------------------------------
-- CHANNELS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "View channels"
    ON channels FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR channel_type = 'announcements'
        OR (channel_type = 'heads_only' AND public.is_any_head_or_admin())
        OR (channel_type = 'group' AND public.is_member_of_group(group_id))
    );

-- ------------------------------------------------------------------------------
-- CONVERSATIONS & MESSAGES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "View conversations"
    ON conversations FOR SELECT
    TO authenticated
    USING (
        participant_1 = auth.uid() OR participant_2 = auth.uid() OR public.is_admin()
    );

CREATE POLICY "Create conversations"
    ON conversations FOR INSERT
    TO authenticated
    WITH CHECK (
        (participant_1 = auth.uid() OR participant_2 = auth.uid())
        AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved')
    );

CREATE POLICY "View messages"
    ON messages FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR (
            channel_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM channels c 
                WHERE c.id = messages.channel_id 
                  AND (
                      c.channel_type = 'announcements'
                      OR (c.channel_type = 'heads_only' AND public.is_any_head_or_admin())
                      OR (c.channel_type = 'group' AND public.is_member_of_group(c.group_id))
                  )
            )
        )
        OR (
            conversation_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM conversations conv
                WHERE conv.id = messages.conversation_id
                  AND (conv.participant_1 = auth.uid() OR conv.participant_2 = auth.uid())
            )
        )
    );

CREATE POLICY "Send messages"
    ON messages FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
        AND (
            public.is_admin()
            OR (
                channel_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM channels c 
                    WHERE c.id = messages.channel_id 
                      AND (
                          (c.channel_type = 'announcements' AND public.is_any_head_or_admin())
                          OR (c.channel_type = 'heads_only' AND public.is_any_head_or_admin())
                          OR (c.channel_type = 'group' AND public.is_member_of_group(c.group_id))
                      )
                )
            )
            OR (
                conversation_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM conversations conv
                    WHERE conv.id = messages.conversation_id
                      AND (conv.participant_1 = auth.uid() OR conv.participant_2 = auth.uid())
                )
            )
        )
    );

-- ------------------------------------------------------------------------------
-- NOTIFICATIONS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Manage own notifications"
    ON notifications FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
