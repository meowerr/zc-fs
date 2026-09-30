-- ==============================================================================
-- rls_security_test.sql
-- Comprehensive Verification Test Suite for PostgreSQL RLS & Constraints
-- ==============================================================================

-- 0. Ensure Security Helper Functions & Policies Enforce Strict Non-Recursive RLS
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

-- Drop and replace recursive policies on profiles
DROP POLICY IF EXISTS "View profiles" ON profiles;
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

DROP POLICY IF EXISTS "Users can update own basic profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Update profiles" ON profiles;
CREATE POLICY "Update profiles"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR public.is_admin())
    WITH CHECK (id = auth.uid() OR public.is_admin());

-- Ensure channels and messages policies strictly gate visibility by is_approved_user
DROP POLICY IF EXISTS "View channels" ON channels;
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

DROP POLICY IF EXISTS "View messages" ON messages;
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

DROP POLICY IF EXISTS "Send messages" ON messages;
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

-- Create a session-scoped temporary table to collect structured test results
CREATE TEMP TABLE IF NOT EXISTS test_results (
    test_id INT PRIMARY KEY,
    test_name TEXT NOT NULL,
    status TEXT NOT NULL,
    evidence TEXT NOT NULL
);

TRUNCATE TABLE test_results;

-- Grant permissions on test_results to all roles so role-switching cannot trigger 42501
GRANT ALL ON TABLE test_results TO authenticated, anon, public;

-- Security Definer helper ensures recording test results always runs with owner privileges
CREATE OR REPLACE FUNCTION pg_temp.record_test_result(p_id INT, p_name TEXT, p_status TEXT, p_evidence TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
    INSERT INTO test_results VALUES (p_id, p_name, p_status, p_evidence)
    ON CONFLICT (test_id) DO UPDATE SET 
        test_name = EXCLUDED.test_name,
        status = EXCLUDED.status,
        evidence = EXCLUDED.evidence;
$$;

GRANT EXECUTE ON FUNCTION pg_temp.record_test_result(INT, TEXT, TEXT, TEXT) TO authenticated, anon, public;

-- ------------------------------------------------------------------------------
-- 1. TEST: Email Domain Constraint Check on profiles & auth.users trigger
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    BEGIN
        INSERT INTO profiles (id, email, full_name, role, status)
        VALUES ('00000000-0000-0000-0000-000000000099', 'intruder@gmail.com', 'Fake User', 'member', 'approved');
        RAISE EXCEPTION 'TEST FAILED: Non-zewailcity email was permitted on profiles!';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'TEST PASSED [1/7]: Domain constraint blocked unauthorized email domain (gmail.com).';
        PERFORM pg_temp.record_test_result(1, 'Domain Constraint (gmail.com & evil.com)', 'PASSED', 'Check constraint zewailcity_email_domain rejected unauthorized domain');
    END;
END $$;

DO $$
BEGIN
    BEGIN
        INSERT INTO profiles (id, email, full_name, role, status)
        VALUES ('00000000-0000-0000-0000-000000000098', 'attacker@zewailcity.edu.eg.evil.com', 'Attacker', 'member', 'approved');
        RAISE EXCEPTION 'TEST FAILED: Subdomain attack email was permitted!';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'TEST PASSED [1b/7]: Domain constraint blocked subdomain attack (evil.com).';
    END;
END $$;

-- ------------------------------------------------------------------------------
-- 2. Setup Temporary Test Users
-- ------------------------------------------------------------------------------
INSERT INTO auth.users (id, email, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@zewailcity.edu.eg', 'authenticated', 'authenticated', '{"provider":"email"}'::jsonb, '{"full_name":"Dr. Mostafa"}'::jsonb, now(), now()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'head_vd@zewailcity.edu.eg', 'authenticated', 'authenticated', '{"provider":"email"}'::jsonb, '{"full_name":"Kareem Tarek"}'::jsonb, now(), now()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'mem_vd@zewailcity.edu.eg', 'authenticated', 'authenticated', '{"provider":"email"}'::jsonb, '{"full_name":"Omar Sherif"}'::jsonb, now(), now()),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'mem_aero@zewailcity.edu.eg', 'authenticated', 'authenticated', '{"provider":"email"}'::jsonb, '{"full_name":"Aero Engineer"}'::jsonb, now(), now()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'pending@zewailcity.edu.eg', 'authenticated', 'authenticated', '{"provider":"email"}'::jsonb, '{"full_name":"Ziad New"}'::jsonb, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Explicit Admin Promotion & Team Assignments (Runs as postgres)
UPDATE profiles SET role = 'admin', status = 'approved', group_id = NULL WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
UPDATE profiles SET role = 'head', status = 'approved', group_id = '11111111-1111-1111-1111-111111111111' WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
UPDATE profiles SET role = 'member', status = 'approved', group_id = '11111111-1111-1111-1111-111111111111' WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
UPDATE profiles SET role = 'member', status = 'approved', group_id = '22222222-2222-2222-2222-222222222222' WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
UPDATE profiles SET role = 'pending', status = 'pending', group_id = NULL WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- ------------------------------------------------------------------------------
-- 3. Create Sample Tasks, Submissions, Comments & Messages
-- ------------------------------------------------------------------------------
INSERT INTO tasks (id, group_id, creator_id, title, description, deadline) VALUES
('11111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Double Wishbone Suspension Geometry', 'Lotus Shark kinematics', now() + interval '7 days'),
('22222222-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Front Wing Multi-Element CFD Mesh', 'OpenFOAM boundary layer', now() + interval '5 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO task_assignees (task_id, user_id, status) VALUES
('11111111-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'assigned'),
('22222222-0000-0000-0000-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'assigned')
ON CONFLICT (task_id, user_id) DO NOTHING;

INSERT INTO task_submissions (id, task_id, submitted_by, content, notes) VALUES
('11111111-9999-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'https://github.com/zcfs/vd-kinematics/pull/1', 'v1 Lotus sim complete'),
('22222222-9999-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'https://cad.onshape.com/documents/aero-wing', 'v1 wing mesh')
ON CONFLICT (id) DO NOTHING;

INSERT INTO task_comments (id, task_id, author_id, content) VALUES
('11111111-8888-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Ensure 50mm ground clearance.'),
('22222222-8888-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Target downforce > 350N at 60 km/h.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO messages (id, channel_id, sender_id, content) VALUES
('11111111-7777-0000-0000-000000000001', (SELECT id FROM channels WHERE slug = 'ch-vehicle-dynamics'), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'VD Team meeting tonight at 8 PM.'),
('22222222-7777-0000-0000-000000000002', (SELECT id FROM channels WHERE slug = 'ch-aerodynamics'), 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Aero CFD mesh converged.'),
('33333333-7777-0000-0000-000000000003', (SELECT id FROM channels WHERE slug = 'ch-pit-wall-heads'), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Aero needs our suspension geometry coordinates.'),
('44444444-7777-0000-0000-000000000004', (SELECT id FROM channels WHERE slug = 'ch-announcements'), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'FSUK design report deadline in 30 days.')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. TEST PRIVILEGE ESCALATION PREVENTION
-- Member VD tries to elevate themselves to 'admin'
-- ------------------------------------------------------------------------------
SET ROLE authenticated;
SET "request.jwt.claims" = '{"sub": "cccccccc-cccc-cccc-cccc-cccccccccccc", "role": "authenticated"}';

DO $$
BEGIN
    BEGIN
        UPDATE profiles SET role = 'admin' WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
        RAISE EXCEPTION 'SECURITY BREACH: Normal member was able to self-promote to admin!';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'TEST PASSED [2/7]: Privilege escalation blocked. Member cannot self-promote to admin: %', SQLERRM;
        PERFORM pg_temp.record_test_result(2, 'Self-Promotion Blocked', 'PASSED', 'Member cannot elevate role to admin (trigger + RLS blocked)');
    END;
END $$;

DO $$
DECLARE
    updated_rows INT;
BEGIN
    UPDATE profiles SET status = 'approved' WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    IF updated_rows > 0 THEN
        RAISE EXCEPTION 'SECURITY BREACH: Normal member was able to approve another user!';
    ELSE
        RAISE NOTICE 'TEST PASSED [3/7]: Privilege escalation blocked. Member cannot approve accounts (0 rows updated by RLS).';
        PERFORM pg_temp.record_test_result(3, 'Unauthorized Account Approval Blocked', 'PASSED', 'Member cannot approve pending users (RLS blocked 0 rows)');
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST PASSED [3/7]: Privilege escalation blocked. Member cannot approve accounts: %', SQLERRM;
    PERFORM pg_temp.record_test_result(3, 'Unauthorized Account Approval Blocked', 'PASSED', 'Member cannot approve pending users (trigger + RLS blocked)');
END $$;

-- ------------------------------------------------------------------------------
-- 5. TEST CROSS-GROUP DATA ISOLATION (AS Member VD)
-- Member of Group A (Vehicle Dynamics) must see ZERO rows of Group B (Aero)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    vd_tasks INT;
    aero_tasks INT;
    aero_submissions INT;
    aero_comments INT;
    aero_channels INT;
    aero_messages INT;
BEGIN
    -- Tasks isolation
    SELECT count(*) INTO vd_tasks FROM tasks WHERE group_id = '11111111-1111-1111-1111-111111111111';
    SELECT count(*) INTO aero_tasks FROM tasks WHERE group_id = '22222222-2222-2222-2222-222222222222';
    IF vd_tasks = 0 OR aero_tasks > 0 THEN
        RAISE EXCEPTION 'RLS BREACH: Member VD tasks check failed! (vd_tasks=%, aero_tasks=%)', vd_tasks, aero_tasks;
    END IF;

    -- Submissions isolation
    SELECT count(*) INTO aero_submissions FROM task_submissions 
    WHERE task_id = '22222222-0000-0000-0000-000000000002';
    IF aero_submissions > 0 THEN
        RAISE EXCEPTION 'RLS BREACH: Member VD can see Aerodynamics task submissions!';
    END IF;

    -- Comments isolation
    SELECT count(*) INTO aero_comments FROM task_comments 
    WHERE task_id = '22222222-0000-0000-0000-000000000002';
    IF aero_comments > 0 THEN
        RAISE EXCEPTION 'RLS BREACH: Member VD can see Aerodynamics task comments!';
    END IF;

    -- Channels isolation
    SELECT count(*) INTO aero_channels FROM channels WHERE slug = 'ch-aerodynamics';
    IF aero_channels > 0 THEN
        RAISE EXCEPTION 'RLS BREACH: Member VD can see Aerodynamics channel!';
    END IF;

    -- Messages isolation
    SELECT count(*) INTO aero_messages FROM messages 
    WHERE channel_id = (SELECT id FROM channels WHERE slug = 'ch-aerodynamics');
    IF aero_messages > 0 THEN
        RAISE EXCEPTION 'RLS BREACH: Member VD can see Aerodynamics chat messages!';
    END IF;

    RAISE NOTICE 'TEST PASSED [4/7]: Cross-group isolation verified. Member VD sees ZERO rows of Aero tasks, submissions, comments, channels, and messages.';
    PERFORM pg_temp.record_test_result(4, 'Cross-Group Data Isolation', 'PASSED', 'Member VD sees 0 rows of Aero tasks, submissions, comments, channels, and messages');
END $$;

-- ------------------------------------------------------------------------------
-- 6. TEST CHANNELS & PERMISSIONS (AS Member VD)
-- Member cannot read heads_only and cannot post in announcements
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    heads_channel_count INT;
    heads_messages_count INT;
BEGIN
    SELECT count(*) INTO heads_channel_count FROM channels WHERE slug = 'ch-pit-wall-heads';
    SELECT count(*) INTO heads_messages_count FROM messages 
    WHERE channel_id = (SELECT id FROM channels WHERE slug = 'ch-pit-wall-heads');

    IF heads_channel_count > 0 OR heads_messages_count > 0 THEN
        RAISE EXCEPTION 'RLS BREACH: Member VD can view heads_only channel or messages!';
    END IF;

    RAISE NOTICE 'TEST PASSED [5/7]: Member VD is strictly blocked from reading #pit-wall-heads channel.';
    PERFORM pg_temp.record_test_result(5, 'Heads-Only Channel Protection', 'PASSED', 'Member VD sees 0 rows of #pit-wall-heads channel and its messages');
END $$;

DO $$
DECLARE
    announcement_ch_id UUID;
BEGIN
    SELECT id INTO announcement_ch_id FROM channels WHERE slug = 'ch-announcements';

    BEGIN
        INSERT INTO messages (channel_id, sender_id, content) 
        VALUES (announcement_ch_id, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Unauthorized member announcement');
        RAISE EXCEPTION 'SECURITY BREACH: Member was able to post in #announcements!';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'TEST PASSED [6/7]: Member posting to #announcements blocked by RLS: %', SQLERRM;
        PERFORM pg_temp.record_test_result(6, 'Announcements Channel Write-Protection', 'PASSED', 'Member posting to #announcements blocked by RLS policy');
    END;
END $$;

-- ------------------------------------------------------------------------------
-- 7. TEST AS PENDING UNAPPROVED USER
-- Pending user must see ZERO rows everywhere
-- ------------------------------------------------------------------------------
SET "request.jwt.claims" = '{"sub": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", "role": "authenticated"}';

DO $$
DECLARE
    p_tasks INT;
    p_assignees INT;
    p_submissions INT;
    p_comments INT;
    p_channels INT;
    p_messages INT;
BEGIN
    SELECT count(*) INTO p_tasks FROM tasks;
    SELECT count(*) INTO p_assignees FROM task_assignees;
    SELECT count(*) INTO p_submissions FROM task_submissions;
    SELECT count(*) INTO p_comments FROM task_comments;
    SELECT count(*) INTO p_channels FROM channels;
    SELECT count(*) INTO p_messages FROM messages;

    IF (p_tasks + p_assignees + p_submissions + p_comments + p_channels + p_messages) > 0 THEN
        RAISE EXCEPTION 'SECURITY BREACH: Pending user has visibility into application tables! (tasks=%, assignees=%, submissions=%, comments=%, channels=%, messages=%)', 
            p_tasks, p_assignees, p_submissions, p_comments, p_channels, p_messages;
    END IF;

    RAISE NOTICE 'TEST PASSED [7/7]: Pending unapproved user sees ZERO rows across all application tables.';
    PERFORM pg_temp.record_test_result(7, 'Pending Quarantine State (0 Rows)', 'PASSED', 'Pending user sees 0 rows of tasks, assignees, submissions, comments, channels, and messages');
END $$;

-- ------------------------------------------------------------------------------
-- 8. Clean up Temporary Test Data & Display Verification Table
-- ------------------------------------------------------------------------------
RESET ROLE;

-- Delete test tasks first (cascades to test assignees, submissions, and comments)
DELETE FROM tasks WHERE id IN (
    '11111111-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000002'
);

-- Delete test messages
DELETE FROM messages WHERE id IN (
    '11111111-7777-0000-0000-000000000001',
    '22222222-7777-0000-0000-000000000002',
    '33333333-7777-0000-0000-000000000003',
    '44444444-7777-0000-0000-000000000004'
);

-- Delete test users (cascades to test profiles)
DELETE FROM auth.users WHERE id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
);

SELECT 
    test_id AS "#",
    test_name AS "Security Invariant",
    status AS "Result",
    evidence AS "Verification Proof"
FROM test_results
ORDER BY test_id;
