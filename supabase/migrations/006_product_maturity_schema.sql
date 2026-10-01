-- ==============================================================================
-- 006_product_maturity_schema.sql
-- ZC Formula Student Telemetry & Project Management Workspace (PitLane)
-- Architecture: Activity / Audit Log, Engineering Document Hub & System Health
-- ==============================================================================

-- 1. Activity / Audit Log Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- 'task', 'submission', 'member', 'group', 'document', 'system'
    entity_id TEXT NOT NULL,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for fast activity queries and timeline lookups
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_group_id ON public.activity_logs (group_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor ON public.activity_logs (actor_id);

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Activity Logs Policies:
-- Club Admin can view all activity logs
-- Approved Members & Heads can view logs where group_id IS NULL (club-wide) OR group_id matches their own group
DROP POLICY IF EXISTS "View activity logs" ON public.activity_logs;
CREATE POLICY "View activity logs"
    ON public.activity_logs FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR (
            public.is_approved_user()
            AND (
                group_id IS NULL
                OR group_id = public.get_auth_group()
            )
        )
    );

-- Insert activity logs: Any approved user can record actions where actor_id is their own id, or Admin can record any
DROP POLICY IF EXISTS "Insert activity logs" ON public.activity_logs;
CREATE POLICY "Insert activity logs"
    ON public.activity_logs FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_approved_user()
        AND (actor_id = auth.uid() OR public.is_admin())
    );

-- Audit logs are strictly immutable: NO UPDATE or DELETE allowed
DROP POLICY IF EXISTS "No update on activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "No delete on activity logs" ON public.activity_logs;


-- 2. Engineering Document Hub Table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE, -- NULL for club-wide docs
    uploader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    file_type TEXT NOT NULL DEFAULT 'other', -- 'cad', 'pdf', 'spreadsheet', 'code', 'archive', 'other'
    category TEXT NOT NULL DEFAULT 'spec', -- 'spec', 'rulebook', 'cad', 'report', 'checklist', 'telemetry'
    version TEXT NOT NULL DEFAULT 'v1.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for document search and filtering
CREATE INDEX IF NOT EXISTS idx_documents_group_id ON public.documents (group_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploader ON public.documents (uploader_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents (category);
CREATE INDEX IF NOT EXISTS idx_documents_created ON public.documents (created_at DESC);

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Document Policies:
-- View documents: Admin can view all; Approved users can view global docs or docs of their own sub-team
DROP POLICY IF EXISTS "View documents" ON public.documents;
CREATE POLICY "View documents"
    ON public.documents FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR (
            public.is_approved_user()
            AND (
                group_id IS NULL
                OR public.is_member_of_group(group_id)
            )
        )
    );

-- Create documents:
-- Admin can create anywhere
-- Approved users can create documents for their own sub-team, or Group Heads / Admins can create global docs
DROP POLICY IF EXISTS "Create documents" ON public.documents;
CREATE POLICY "Create documents"
    ON public.documents FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin()
        OR (
            public.is_approved_user()
            AND (
                (group_id IS NOT NULL AND public.is_member_of_group(group_id))
                OR (group_id IS NULL AND public.is_any_head_or_admin())
            )
        )
    );

-- Update documents: Uploader, Group Head of that sub-team, or Club Admin
DROP POLICY IF EXISTS "Update documents" ON public.documents;
CREATE POLICY "Update documents"
    ON public.documents FOR UPDATE
    TO authenticated
    USING (
        public.is_admin()
        OR uploader_id = auth.uid()
        OR (group_id IS NOT NULL AND public.is_head_of_group(group_id))
    );

-- Delete documents: Uploader, Group Head of that sub-team, or Club Admin
DROP POLICY IF EXISTS "Delete documents" ON public.documents;
CREATE POLICY "Delete documents"
    ON public.documents FOR DELETE
    TO authenticated
    USING (
        public.is_admin()
        OR uploader_id = auth.uid()
        OR (group_id IS NOT NULL AND public.is_head_of_group(group_id))
    );


-- 3. System Health Check RPC (Objective 22)
CREATE OR REPLACE FUNCTION public.system_health_check()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total_profiles INT;
    active_tasks INT;
    total_messages INT;
    server_time TIMESTAMPTZ;
BEGIN
    SELECT count(*) INTO total_profiles FROM public.profiles;
    SELECT count(*) INTO active_tasks FROM public.tasks WHERE status != 'done';
    SELECT count(*) INTO total_messages FROM public.messages;
    server_time := timezone('utc'::text, now());

    RETURN jsonb_build_object(
        'status', 'operational',
        'database', 'connected',
        'server_timestamp', server_time,
        'metrics', jsonb_build_object(
            'total_users', total_profiles,
            'active_tasks', active_tasks,
            'total_messages', total_messages
        )
    );
END;
$$;
