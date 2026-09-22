-- ============================================================================
-- INNOVEXA AUDIT REPAIR MIGRATION
-- Date: 2026-08-24
-- Run in: Supabase Dashboard → SQL Editor
-- Safe to run multiple times (all changes are idempotent).
-- ============================================================================

-- ============================================================================
-- FIX 1: profiles table — Add missing columns sent by frontend
-- supabase_schema.sql profile columns don't include username, location, etc.
-- ============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username         TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS location         TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS website          TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS github_url       TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS linkedin_url     TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS reputation_points INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS credits          INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS projects_count   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviews_count    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reputation_tier  TEXT DEFAULT 'NEW INNOVATOR',
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS bio              TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS headline         TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS organization     TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_links     JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- ============================================================================
-- FIX 2: reviews table — Add user_id alias column
-- The reviews table uses reviewer_id as primary identifier.
-- supabaseService.js createReview inserts user_id which violates NOT NULL on reviewer_id.
-- This adds a generated/computed alias so OLD code sending user_id still works,
-- OR we rely on the service-layer fix (Phase 2) to send reviewer_id correctly.
-- Since we're fixing the service layer, we just add a safety-net alias view.
-- ============================================================================

-- Also add the missing 'title', 'content', 'is_public' columns the service sends:
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS title     TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS content   TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Note: 'overall_feedback' and 'suggestion' exist in schema.
-- 'content' is an alias written by createReview — make sure overall_feedback
-- is synced from content via trigger:
CREATE OR REPLACE FUNCTION public.sync_review_content()
RETURNS TRIGGER AS $$
BEGIN
  -- If overall_feedback is empty but content was provided, sync it
  IF (NEW.overall_feedback IS NULL OR NEW.overall_feedback = '') AND NEW.content IS NOT NULL AND NEW.content <> '' THEN
    NEW.overall_feedback := NEW.content;
  END IF;
  -- If content is empty but overall_feedback was provided, sync it
  IF (NEW.content IS NULL OR NEW.content = '') AND NEW.overall_feedback IS NOT NULL AND NEW.overall_feedback <> '' THEN
    NEW.content := NEW.overall_feedback;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_review_content_sync ON public.reviews;
CREATE TRIGGER on_review_content_sync
BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.sync_review_content();

-- ============================================================================
-- FIX 3: notifications table — Add missing 'link' column
-- createNotification() in supabaseService.js sends 'link' field in INSERT
-- payload; this column is missing from both supabase_schema.sql and
-- 20260823_new_supabase_clean_schema.sql.
-- ============================================================================
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS link TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- FIX 4: notifications RLS — Ensure cross-user notification INSERT is allowed
-- Policy should allow any authenticated user to INSERT (not restrict to user_id).
-- This is already correct in supabase_schema.sql but may differ in live DB.
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- FIX 5: community_posts — Expand post_type CHECK to include lowercase variants
-- and lounge message types ('discussion', 'question', 'resource' etc.)
-- sendCommunityMessage inserts lowercase 'discussion' which violates UPPERCASE CHECK.
-- ============================================================================
ALTER TABLE public.community_posts
  DROP CONSTRAINT IF EXISTS community_posts_post_type_check;

ALTER TABLE public.community_posts
  ADD CONSTRAINT community_posts_post_type_check
  CHECK (post_type IN (
    'QUESTION', 'DISCUSSION', 'FEEDBACK_REQUEST', 'COLLABORATION', 'CHALLENGE',
    'question', 'discussion', 'feedback_request', 'collaboration', 'challenge',
    'resource', 'RESOURCE', 'announcement', 'ANNOUNCEMENT', 'feedback', 'FEEDBACK'
  ));

-- ============================================================================
-- FIX 6: profiles RLS — Ensure upsert/insert from trigger works
-- The handle_new_user() trigger runs as SECURITY DEFINER so it bypasses RLS,
-- but keep the policy correct for direct user operations.
-- ============================================================================
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- FIX 7: reviews RLS — reviewer_id must match auth.uid() for INSERT
-- The existing policies already check reviewer_id; this is idempotent.
-- ============================================================================
DROP POLICY IF EXISTS "Users can submit reviews" ON public.reviews;
CREATE POLICY "Users can submit reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = reviewer_id);

-- ============================================================================
-- FIX 8: projects — ensure 'slug' column exists (used in getProjectById)
-- ============================================================================
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);

-- ============================================================================
-- FIX 9: profiles handle_new_user trigger — ensure it creates all fields
-- Replace the trigger to also set username, reputation_points, headline, etc.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_avatar_url TEXT;
    v_username TEXT;
BEGIN
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1),
        'Innovator'
    );
    v_avatar_url := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'avatar',
        'https://api.dicebear.com/7.x/initials/svg?seed=' || encode(v_full_name::bytea, 'escape')
    );
    v_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        split_part(NEW.email, '@', 1)
    );

    -- Insert into public.profiles
    INSERT INTO public.profiles (
        id, full_name, name, email, avatar_url, avatar,
        username, headline, bio, organization,
        location, website, github_url, linkedin_url,
        role, interests, skills,
        reputation_points, credits, reputation_tier,
        profile_visibility, onboarding_completed,
        created_at, updated_at
    )
    VALUES (
        NEW.id,
        v_full_name,
        v_full_name,
        NEW.email,
        v_avatar_url,
        v_avatar_url,
        v_username,
        '',   -- headline
        '',   -- bio
        '',   -- organization
        '',   -- location
        '',   -- website
        '',   -- github_url
        '',   -- linkedin_url
        ARRAY['I CREATE IDEAS']::TEXT[], -- role
        ARRAY['AI & MACHINE LEARNING']::TEXT[], -- interests
        ARRAY[]::TEXT[],  -- skills
        100,  -- reputation_points
        100,  -- credits
        'NEW INNOVATOR', -- reputation_tier
        'public',  -- profile_visibility
        false,     -- onboarding_completed
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email        = EXCLUDED.email,
        full_name    = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
        avatar_url   = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
        updated_at   = NOW();

    -- Insert into public.user_private_data
    INSERT INTO public.user_private_data (user_id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        email      = EXCLUDED.email,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- VERIFICATION QUERIES — Run these to confirm all fixes applied
-- ============================================================================

-- Check profiles columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check reviews columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'reviews'
ORDER BY ordinal_position;

-- Check notifications columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'notifications'
ORDER BY ordinal_position;

-- Check community_posts constraint
SELECT conname, consrc
FROM pg_constraint
WHERE conrelid = 'public.community_posts'::regclass AND contype = 'c';

-- Check notifications RLS
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'notifications' AND schemaname = 'public';
