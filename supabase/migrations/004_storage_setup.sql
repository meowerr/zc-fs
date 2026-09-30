-- ==============================================================================
-- 004_storage_setup.sql
-- ZC Formula Student Telemetry & Project Management Workspace (PitLane)
-- Secure Storage Buckets & Row Level Security (RLS) on storage.objects
-- ==============================================================================

-- 1. Create Storage Buckets (25 MB max size to strictly comply with Free Tier)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'task-attachments', 
        'task-attachments', 
        false, 
        26214400, -- 25 MB max per file
        NULL
    ),
    (
        'chat-media', 
        'chat-media', 
        false, 
        26214400, -- 25 MB max per file
        NULL
    )
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

-- Allow authenticated users to view buckets metadata
DROP POLICY IF EXISTS "Authenticated users can select buckets" ON storage.buckets;
CREATE POLICY "Authenticated users can select buckets"
ON storage.buckets FOR SELECT
TO authenticated
USING (true);

-- 2. Helper Security Functions for Storage (SECURITY DEFINER to avoid nested RLS locks)
CREATE OR REPLACE FUNCTION public.can_access_channel_media(channel_id_text text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    chan RECORD;
BEGIN
    SELECT * INTO chan FROM public.channels WHERE id::text = channel_id_text;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    IF public.is_admin() THEN
        RETURN TRUE;
    END IF;

    IF NOT public.is_approved_user() THEN
        RETURN FALSE;
    END IF;

    IF chan.channel_type = 'announcements' THEN
        RETURN TRUE;
    END IF;

    IF chan.channel_type = 'heads_only' THEN
        RETURN public.is_any_head_or_admin();
    END IF;

    IF chan.channel_type = 'group' THEN
        RETURN public.is_member_of_group(chan.group_id);
    END IF;

    RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_upload_channel_media(channel_id_text text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    chan RECORD;
BEGIN
    SELECT * INTO chan FROM public.channels WHERE id::text = channel_id_text;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    IF public.is_admin() THEN
        RETURN TRUE;
    END IF;

    IF NOT public.is_approved_user() THEN
        RETURN FALSE;
    END IF;

    IF chan.channel_type = 'announcements' THEN
        RETURN public.is_any_head_or_admin();
    END IF;

    IF chan.channel_type = 'heads_only' THEN
        RETURN public.is_any_head_or_admin();
    END IF;

    IF chan.channel_type = 'group' THEN
        RETURN public.is_member_of_group(chan.group_id);
    END IF;

    RETURN FALSE;
END;
$$;

-- 3. Clean Up Any Prior Policies on storage.objects
DROP POLICY IF EXISTS "Task attachments view policy" ON storage.objects;
DROP POLICY IF EXISTS "Task attachments upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Chat media view policy" ON storage.objects;
DROP POLICY IF EXISTS "Chat media upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Storage delete policy" ON storage.objects;

-- 4. RLS: Task Attachments Bucket Policies
-- Path format: <group_id>/<optional_subfolder>/<filename>

CREATE POLICY "Task attachments view policy"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'task-attachments'
    AND (
        public.is_admin()
        OR (
            public.is_approved_user()
            AND split_part(name, '/', 1) = public.get_auth_group()::text
        )
    )
);

CREATE POLICY "Task attachments upload policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'task-attachments'
    AND (
        public.is_admin()
        OR (
            public.is_approved_user()
            AND split_part(name, '/', 1) = public.get_auth_group()::text
        )
    )
);

-- 5. RLS: Chat Media Bucket Policies
-- Path formats:
-- Channels: channels/<channel_id>/<filename>
-- Conversations: conversations/<conversation_id>/<filename>

CREATE POLICY "Chat media view policy"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'chat-media'
    AND (
        public.is_admin()
        OR (
            public.is_approved_user()
            AND (
                (
                    split_part(name, '/', 1) = 'channels'
                    AND public.can_access_channel_media(split_part(name, '/', 2))
                )
                OR (
                    split_part(name, '/', 1) = 'conversations'
                    AND EXISTS (
                        SELECT 1 FROM public.conversations conv
                        WHERE conv.id::text = split_part(name, '/', 2)
                          AND (conv.participant_1 = auth.uid() OR conv.participant_2 = auth.uid())
                    )
                )
            )
        )
    )
);

CREATE POLICY "Chat media upload policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'chat-media'
    AND (
        public.is_admin()
        OR (
            public.is_approved_user()
            AND (
                (
                    split_part(name, '/', 1) = 'channels'
                    AND public.can_upload_channel_media(split_part(name, '/', 2))
                )
                OR (
                    split_part(name, '/', 1) = 'conversations'
                    AND EXISTS (
                        SELECT 1 FROM public.conversations conv
                        WHERE conv.id::text = split_part(name, '/', 2)
                          AND (conv.participant_1 = auth.uid() OR conv.participant_2 = auth.uid())
                    )
                )
            )
        )
    )
);

-- 6. Delete Policy
CREATE POLICY "Storage delete policy"
ON storage.objects FOR DELETE
TO authenticated
USING (
    public.is_admin()
    OR (owner = auth.uid() AND public.is_approved_user())
);
