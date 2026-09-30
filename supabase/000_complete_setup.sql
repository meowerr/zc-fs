-- ==============================================================================
-- 001_initial_schema.sql
-- ZC Formula Student Telemetry & Project Management Workspace (PitLane)
-- Architecture: PostgreSQL 15+ with Domain Restriction, Strict Typing & Multi-Assignee
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Domain & Enum Definitions
CREATE TYPE user_role AS ENUM ('admin', 'head', 'member', 'pending');
CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_type AS ENUM ('read', 'code', 'design', 'report', 'research', 'other');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'submitted', 'changes_requested', 'approved', 'done');
CREATE TYPE assignee_task_status AS ENUM ('assigned', 'in_progress', 'submitted', 'changes_requested', 'approved');
CREATE TYPE submission_type AS ENUM ('file', 'link', 'note');
CREATE TYPE submission_review_status AS ENUM ('pending', 'approved', 'changes_requested');
CREATE TYPE channel_type AS ENUM ('group', 'heads_only', 'announcements');
CREATE TYPE notification_type AS ENUM (
    'task_assigned', 
    'task_due_soon', 
    'submission_received', 
    'review_result', 
    'mention', 
    'announcement'
);

-- 3. Core Tables

-- Groups (5 official Formula Student Sub-teams)
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    color_accent TEXT DEFAULT '#2F6BFF',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- User Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'pending',
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    status user_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT zewailcity_email_domain CHECK (lower(trim(email)) ~* '^[a-z0-9._%+-]+@zewailcity\.edu\.eg$'),
    CONSTRAINT group_assignment_validity CHECK (
        (role IN ('admin', 'pending')) OR (role IN ('head', 'member') AND group_id IS NOT NULL)
    )
);

-- Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    task_type task_type NOT NULL DEFAULT 'other',
    priority task_priority NOT NULL DEFAULT 'medium',
    status task_status NOT NULL DEFAULT 'todo',
    deadline TIMESTAMPTZ NOT NULL,
    links JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Task Assignees (many-to-many junction with per-assignee status)
CREATE TABLE task_assignees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status assignee_task_status NOT NULL DEFAULT 'assigned',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_task_user UNIQUE (task_id, user_id)
);

-- Task Submissions (tracks multi-version work delivery per engineer/task)
CREATE TABLE task_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    version_number INT NOT NULL DEFAULT 1,
    submission_type submission_type NOT NULL DEFAULT 'link',
    content TEXT NOT NULL, -- File URL or Web link or note content
    notes TEXT,
    review_status submission_review_status NOT NULL DEFAULT 'pending',
    review_feedback TEXT,
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Task Discussion Comments
CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Channels
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    channel_type channel_type NOT NULL DEFAULT 'group',
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE, -- NULL for announcements / heads_only
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT group_channel_binding CHECK (
        (channel_type = 'group' AND group_id IS NOT NULL) OR
        (channel_type IN ('heads_only', 'announcements') AND group_id IS NULL)
    )
);

-- Conversations (1-on-1 Direct Messaging)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    participant_2 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT ordered_participants CHECK (participant_1 < participant_2),
    CONSTRAINT unique_conversation_pair UNIQUE (participant_1, participant_2)
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachment_url TEXT,
    attachment_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT channel_or_conversation CHECK (
        (channel_id IS NOT NULL AND conversation_id IS NULL) OR
        (channel_id IS NULL AND conversation_id IS NOT NULL)
    )
);

-- In-App Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Performance Indexes
CREATE INDEX idx_profiles_role_status ON profiles(role, status);
CREATE INDEX idx_profiles_group ON profiles(group_id);
CREATE INDEX idx_tasks_group_deadline ON tasks(group_id, deadline);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_task_assignees_user ON task_assignees(user_id);
CREATE INDEX idx_task_assignees_task ON task_assignees(task_id);
CREATE INDEX idx_task_submissions_task ON task_submissions(task_id, version_number);
CREATE INDEX idx_task_comments_task ON task_comments(task_id, created_at);
CREATE INDEX idx_messages_channel ON messages(channel_id, created_at);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);

-- 5. Helper Functions for Triggers

-- Check if current authenticated caller is an approved admin
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

-- 6. Trigger: Prevent Privilege Escalation on public.profiles
-- Normal users can update their own full_name, avatar_url, phone.
-- ONLY an active approved Club Admin can alter role, group_id, or status.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If called by an authenticated user (auth.uid() is not null), enforce admin role check
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
        IF (NEW.role IS DISTINCT FROM OLD.role) OR
           (NEW.group_id IS DISTINCT FROM OLD.group_id) OR
           (NEW.status IS DISTINCT FROM OLD.status) THEN
            RAISE EXCEPTION 'Access Denied: Only approved Club Admins can modify role, group assignment, or account status.';
        END IF;
    END IF;
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_privilege_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 7. Trigger: Derived Task Status Rollup from Task Assignees
CREATE OR REPLACE FUNCTION public.sync_task_status_from_assignees()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_task_id UUID;
    total_count INT;
    approved_count INT;
    submitted_count INT;
    in_progress_count INT;
    changes_count INT;
    new_status task_status;
BEGIN
    target_task_id := COALESCE(NEW.task_id, OLD.task_id);
    
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'approved'),
        COUNT(*) FILTER (WHERE status = 'submitted'),
        COUNT(*) FILTER (WHERE status = 'in_progress'),
        COUNT(*) FILTER (WHERE status = 'changes_requested')
    INTO 
        total_count,
        approved_count,
        submitted_count,
        in_progress_count,
        changes_count
    FROM public.task_assignees
    WHERE task_id = target_task_id;

    IF total_count > 0 THEN
        IF changes_count > 0 THEN
            new_status := 'changes_requested';
        ELSIF approved_count = total_count THEN
            new_status := 'approved';
        ELSIF submitted_count > 0 AND in_progress_count = 0 THEN
            new_status := 'submitted';
        ELSIF in_progress_count > 0 OR submitted_count > 0 THEN
            new_status := 'in_progress';
        ELSE
            new_status := 'todo';
        END IF;

        UPDATE public.tasks 
        SET status = new_status, updated_at = timezone('utc'::text, now())
        WHERE id = target_task_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_task_status ON public.task_assignees;
CREATE TRIGGER trg_sync_task_status
    AFTER INSERT OR UPDATE OR DELETE ON public.task_assignees
    FOR EACH ROW EXECUTE FUNCTION public.sync_task_status_from_assignees();

-- 8. University Email Domain Enforcement & User Bootstrap Trigger on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    clean_email TEXT;
BEGIN
    clean_email := lower(trim(NEW.email));

    -- Case-insensitive domain restriction
    IF clean_email NOT LIKE '%@zewailcity.edu.eg' THEN
        RAISE EXCEPTION 'Registration denied: Only @zewailcity.edu.eg email addresses are permitted.';
    END IF;

    -- Every newly registered user enters the pending quarantine state.
    -- First Club Admin is promoted via explicit one-time manual SQL, NOT "first signup wins".
    INSERT INTO public.profiles (id, email, full_name, role, status)
    VALUES (
        NEW.id,
        clean_email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(clean_email, '@', 1)),
        'pending',
        'pending'
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();
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

CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND status = 'approved'
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
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND status = 'approved'
        )
    );

-- Only Admins can modify groups
CREATE POLICY "Admins can manage groups"
    ON groups FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_auth_status()
RETURNS user_status
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT status FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_auth_group()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT group_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Users can view their own profile, or colleagues in their sub-team, or heads/admins
-- Uses non-recursive SECURITY DEFINER helper lookups
CREATE POLICY "View profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
        OR public.is_admin()
        OR (
            public.is_approved_user()
            AND (
                role IN ('admin', 'head')
                OR group_id = public.get_auth_group()
            )
        )
    );

-- Users can update their own profile, Admins can update any profile.
-- Privilege escalation (modifying role, group_id, status) is strictly guarded by 
-- the prevent_profile_privilege_escalation() database trigger.
CREATE POLICY "Update profiles"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR public.is_admin())
    WITH CHECK (id = auth.uid() OR public.is_admin());

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

-- Heads and Admins can assign/unassign members
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

-- Assignees can update their own assignment status (e.g., in_progress, submitted)
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
        OR (
            public.is_approved_user()
            AND (
                channel_type = 'announcements'
                OR (channel_type = 'heads_only' AND public.is_any_head_or_admin())
                OR (channel_type = 'group' AND public.is_member_of_group(group_id))
            )
        )
    );

-- ------------------------------------------------------------------------------
-- CONVERSATIONS & MESSAGES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "View conversations"
    ON conversations FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR (
            public.is_approved_user()
            AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
        )
    );

CREATE POLICY "Create conversations"
    ON conversations FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_approved_user()
        AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    );

CREATE POLICY "View messages"
    ON messages FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR (
            public.is_approved_user()
            AND (
                (
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
            )
        )
    );

CREATE POLICY "Send messages"
    ON messages FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
        AND public.is_approved_user()
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
    USING (user_id = auth.uid() AND public.is_approved_user())
    WITH CHECK (user_id = auth.uid() AND public.is_approved_user());
-- ==============================================================================
-- 003_seed_data.sql
-- ZC Formula Student Telemetry & Project Management Workspace (PitLane)
-- Seeds the 5 Official Sub-Teams, Default Channels, and Initial Data
-- ==============================================================================

-- 1. Insert the 5 Official Formula Student Sub-Teams
INSERT INTO groups (id, name, slug, description, color_accent) VALUES
('11111111-1111-1111-1111-111111111111', 'Technical - Vehicle Dynamics', 'vehicle-dynamics', 'Suspension geometry, steering, kinematics, brakes, tires, chassis integration.', '#2F6BFF'),
('22222222-2222-2222-2222-222222222222', 'Technical - Aerodynamics', 'aerodynamics', 'Front wing, rear wing, undertray/diffuser, sidepods, cooling airflow simulation.', '#22E4F0'),
('33333333-3333-3333-3333-333333333333', 'Technical - Low-Voltage Electronics', 'electronics', 'CAN bus, sensor telemetry, dashboard displays, wiring harness, safety shutdown.', '#FFC53D'),
('44444444-4444-4444-4444-444444444444', 'Technical - Powertrain & Drivetrain', 'powertrain', 'Internal combustion engine / electric motor, transmission, differential, cooling.', '#FF4FA3'),
('55555555-5555-5555-5555-555555555555', 'Operations - Business, Cost & Marketing', 'business-ops', 'Cost report (BOM), business presentation, sponsorship, branding, logistics.', '#B6FF3B')
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    color_accent = EXCLUDED.color_accent;

-- 2. Insert Default Communication Channels
-- Group Channels
INSERT INTO channels (name, slug, channel_type, group_id, description) VALUES
('VD Telemetry & Comms', 'ch-vehicle-dynamics', 'group', '11111111-1111-1111-1111-111111111111', 'Vehicle Dynamics sub-team internal engineering discussions.'),
('Aero CFD & Flight', 'ch-aerodynamics', 'group', '22222222-2222-2222-2222-222222222222', 'Aerodynamics design, CFD simulations, and wing fabrication.'),
('Low-Voltage Systems', 'ch-electronics', 'group', '33333333-3333-3333-3333-333333333333', 'Wiring harness, sensors, CAN bus packet decoding.'),
('Powertrain & Torque', 'ch-powertrain', 'group', '44444444-4444-4444-4444-444444444444', 'Engine tuning, dyno runs, drivetrain CAD modeling.'),
('Operations & Sponsorship', 'ch-business-ops', 'group', '55555555-5555-5555-5555-555555555555', 'BOM cost accounting, sponsor presentations, team logistics.')
ON CONFLICT (slug) DO NOTHING;

-- Cross-Group & Club-Wide Channels
INSERT INTO channels (name, slug, channel_type, group_id, description) VALUES
('Pit Wall (Heads Only)', 'ch-pit-wall-heads', 'heads_only', NULL, 'Cross-group leadership coordination channel for Sub-team Heads and Club Admins.'),
('Mission Control (Announcements)', 'ch-announcements', 'announcements', NULL, 'Official club-wide announcements, competition deadlines, and general updates.')
ON CONFLICT (slug) DO NOTHING;
