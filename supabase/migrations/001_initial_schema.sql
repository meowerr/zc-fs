-- ==============================================================================
-- 001_initial_schema.sql
-- ZC Formula Student Telemetry & Project Management Workspace (PitLane)
-- Architecture: PostgreSQL 15+ with Domain Restriction & Strict Typing
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
    CONSTRAINT zewailcity_email_domain CHECK (email ~* '^[A-Za-z0-9._%+-]+@zewailcity\.edu\.eg$'),
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

-- Task Assignees (many-to-many junction)
CREATE TABLE task_assignees (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (task_id, user_id)
);

-- Task Submissions (tracks multi-version work delivery)
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

-- Communication Channels
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    channel_type channel_type NOT NULL,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT group_channel_binding CHECK (
        (channel_type = 'group' AND group_id IS NOT NULL) OR
        (channel_type IN ('heads_only', 'announcements') AND group_id IS NULL)
    )
);

-- Direct Message Conversations (Scoped pairs)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    participant_2 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_conversation_pair UNIQUE (participant_1, participant_2),
    CONSTRAINT participant_ordering CHECK (participant_1 < participant_2)
);

-- Messages (Channel or DM)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT message_target_exclusive CHECK (
        (channel_id IS NOT NULL AND conversation_id IS NULL) OR
        (channel_id IS NULL AND conversation_id IS NOT NULL)
    )
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Indexes for Rapid Querying
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_group_role ON profiles(group_id, role, status);
CREATE INDEX idx_tasks_group_deadline ON tasks(group_id, deadline);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_task_assignees_user ON task_assignees(user_id);
CREATE INDEX idx_task_submissions_task ON task_submissions(task_id, version_number);
CREATE INDEX idx_task_comments_task ON task_comments(task_id, created_at);
CREATE INDEX idx_messages_channel ON messages(channel_id, created_at);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);

-- 5. University Email Domain Enforcement Trigger on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_domain TEXT;
    first_admin_exists BOOLEAN;
BEGIN
    -- Check university domain
    user_domain := split_part(NEW.email, '@', 2);
    IF LOWER(user_domain) <> 'zewailcity.edu.eg' THEN
        RAISE EXCEPTION 'Registration denied: Only @zewailcity.edu.eg email addresses are permitted.';
    END IF;

    -- Check if this is the very first user (auto-seed as Admin for local/fresh bootstrap)
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') INTO first_admin_exists;

    IF NOT first_admin_exists THEN
        INSERT INTO public.profiles (id, email, full_name, role, status)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
            'admin',
            'approved'
        );
    ELSE
        INSERT INTO public.profiles (id, email, full_name, role, status)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
            'pending',
            'pending'
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();
