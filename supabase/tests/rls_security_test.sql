-- ==============================================================================
-- rls_security_test.sql
-- Verification test suite for PostgreSQL Row Level Security (RLS) & Constraints
-- ==============================================================================

BEGIN;

-- 1. TEST: Email Domain Constraint Check on profiles
DO $$
BEGIN
    BEGIN
        INSERT INTO profiles (id, email, full_name, role, status)
        VALUES ('00000000-0000-0000-0000-000000000099', 'intruder@gmail.com', 'Fake User', 'member', 'approved');
        RAISE EXCEPTION 'TEST FAILED: Non-zewailcity email was permitted!';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'TEST PASSED: Domain constraint blocked unauthorized email domain (gmail.com).';
    END;
END $$;

-- 2. Create Temporary Test Users in auth.users & profiles
-- Admin: admin@zewailcity.edu.eg
-- Head VD: head_vd@zewailcity.edu.eg (Group 1: Vehicle Dynamics)
-- Member VD: mem_vd@zewailcity.edu.eg (Group 1: Vehicle Dynamics)
-- Member Aero: mem_aero@zewailcity.edu.eg (Group 2: Aerodynamics)
-- Pending User: pending@zewailcity.edu.eg

INSERT INTO auth.users (id, email) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@zewailcity.edu.eg'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'head_vd@zewailcity.edu.eg'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'mem_vd@zewailcity.edu.eg'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'mem_aero@zewailcity.edu.eg'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'pending@zewailcity.edu.eg')
ON CONFLICT (id) DO NOTHING;

-- Update/Setup their profile roles and groups
UPDATE profiles SET role = 'admin', status = 'approved', group_id = NULL WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
UPDATE profiles SET role = 'head', status = 'approved', group_id = '11111111-1111-1111-1111-111111111111' WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
UPDATE profiles SET role = 'member', status = 'approved', group_id = '11111111-1111-1111-1111-111111111111' WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
UPDATE profiles SET role = 'member', status = 'approved', group_id = '22222222-2222-2222-2222-222222222222' WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
UPDATE profiles SET role = 'pending', status = 'pending', group_id = NULL WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- 3. Create Sample Tasks
-- Task 1: in Group 1 (Vehicle Dynamics)
-- Task 2: in Group 2 (Aerodynamics)
INSERT INTO tasks (id, group_id, creator_id, title, description, deadline) VALUES
('11111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Design Double Wishbone Suspension Geometry', 'Full kinematics simulation in Lotus Shark', now() + interval '7 days'),
('22222222-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Front Wing Multi-Element CFD Mesh', 'Run 20m/s boundary layer analysis', now() + interval '5 days');

-- 4. TEST RLS AS Member VD (cccccccc-cccc-cccc-cccc-cccccccccccc)
-- Should see Task 1, but NOT Task 2!
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "cccccccc-cccc-cccc-cccc-cccccccccccc", "role": "authenticated"}';

DO $$
DECLARE
    task_count INT;
    other_task_count INT;
BEGIN
    SELECT count(*) INTO task_count FROM tasks WHERE group_id = '11111111-1111-1111-1111-111111111111';
    IF task_count = 0 THEN
        RAISE EXCEPTION 'TEST FAILED: Member VD cannot see own group tasks!';
    END IF;

    SELECT count(*) INTO other_task_count FROM tasks WHERE group_id = '22222222-2222-2222-2222-222222222222';
    IF other_task_count > 0 THEN
        RAISE EXCEPTION 'SECURITY BREACH: Member VD can see tasks belonging to Aerodynamics!';
    END IF;

    RAISE NOTICE 'TEST PASSED: Member VD can only see own group tasks and is blocked from other groups.';
END $$;

-- 5. TEST CHANNEL ACCESS AS Member VD
-- Should be able to see Group 1 channel and Announcements, but NOT Heads-Only or Aero channel!
DO $$
DECLARE
    heads_channel_count INT;
    aero_channel_count INT;
BEGIN
    SELECT count(*) INTO heads_channel_count FROM channels WHERE slug = 'ch-pit-wall-heads';
    IF heads_channel_count > 0 THEN
        RAISE EXCEPTION 'SECURITY BREACH: Normal Member can see Heads-Only channel!';
    END IF;

    SELECT count(*) INTO aero_channel_count FROM channels WHERE slug = 'ch-aerodynamics';
    IF aero_channel_count > 0 THEN
        RAISE EXCEPTION 'SECURITY BREACH: Member VD can see Aerodynamics channel!';
    END IF;

    RAISE NOTICE 'TEST PASSED: Member VD is blocked from Heads-Only and other sub-teams channels.';
END $$;

-- 6. TEST AS Pending User (eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee)
-- Should see 0 tasks and 0 channels
SET LOCAL "request.jwt.claims" = '{"sub": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", "role": "authenticated"}';

DO $$
DECLARE
    p_tasks INT;
    p_channels INT;
BEGIN
    SELECT count(*) INTO p_tasks FROM tasks;
    SELECT count(*) INTO p_channels FROM channels;

    IF p_tasks > 0 OR p_channels > 0 THEN
        RAISE EXCEPTION 'SECURITY BREACH: Pending unapproved user can see application data!';
    END IF;

    RAISE NOTICE 'TEST PASSED: Pending user has zero visibility into tasks and channels.';
END $$;

-- Rollback test transaction so clean state is preserved
ROLLBACK;
