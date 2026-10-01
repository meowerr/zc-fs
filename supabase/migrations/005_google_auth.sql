-- ==============================================================================
-- 005_google_auth.sql
-- ZC Formula Student Telemetry & Project Management Workspace (PitLane)
-- Purpose: Google OAuth Domain Enforcement & Safe Full Name Extraction
-- Run this migration in the Supabase SQL Editor.
-- ==============================================================================

-- 1. Upgrade handle_new_user_registration with strict regex domain check
-- and multi-source name extraction (full_name OR name OR email local-part)
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    clean_email TEXT;
    extracted_name TEXT;
    extracted_avatar TEXT;
BEGIN
    clean_email := lower(trim(NEW.email));

    -- Server-side domain restriction: strict, case-insensitive, and spoof-proof.
    -- Allows: student.2023001@zewailcity.edu.eg, Student@ZewailCity.EDU.EG
    -- Rejects: NULL emails, malicious prefixes, double-@, and domain spoofing like attacker@zewailcity.edu.eg.evil.com or x@evilzewailcity.edu.eg
    IF clean_email IS NULL OR clean_email !~* '^[a-z0-9._%+-]+@zewailcity\.edu\.eg$' THEN
        RAISE EXCEPTION 'Registration denied: Only @zewailcity.edu.eg email addresses are permitted.';
    END IF;

    -- Extract full name safely from Google OIDC ('name') or Supabase metadata ('full_name'),
    -- falling back to the email local part. Null-safe and empty-string safe.
    extracted_name := COALESCE(
        NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
        NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
        split_part(clean_email, '@', 1)
    );

    -- Extract avatar safely if provided by Google or metadata
    extracted_avatar := COALESCE(
        NULLIF(trim(NEW.raw_user_meta_data->>'avatar_url'), ''),
        NULLIF(trim(NEW.raw_user_meta_data->>'picture'), '')
    );

    -- Every newly registered user enters the pending quarantine state.
    -- Existing profiles (e.g. linked accounts) are untouched via ON CONFLICT (id) DO NOTHING.
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role, status)
    VALUES (
        NEW.id,
        clean_email,
        extracted_name,
        extracted_avatar,
        'pending',
        'pending'
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- 2. Ensure trigger is attached AFTER INSERT on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();
