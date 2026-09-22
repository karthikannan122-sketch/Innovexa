-- ============================================================
-- INNOVEXA DATABASE MIGRATION — BUG FIXES
-- Run this in Supabase Dashboard > SQL Editor
-- Date: 2026-08-22
-- ============================================================

-- ============================================================
-- FIX 1: projects table — Add missing columns
-- The frontend sends these columns but they don't exist in DB
-- ============================================================
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS category_name TEXT,
  ADD COLUMN IF NOT EXISTS problem_statement TEXT,
  ADD COLUMN IF NOT EXISTS proposed_solution TEXT,
  ADD COLUMN IF NOT EXISTS creation_type TEXT,
  ADD COLUMN IF NOT EXISTS innovation_type TEXT,
  ADD COLUMN IF NOT EXISTS project_stage TEXT DEFAULT 'idea',
  ADD COLUMN IF NOT EXISTS target_users TEXT,
  ADD COLUMN IF NOT EXISTS features JSONB,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS images TEXT[],
  ADD COLUMN IF NOT EXISTS cover_image TEXT,
  ADD COLUMN IF NOT EXISTS upvotes_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS downvotes_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dislikes_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valid_reviews_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Backfill category_name from joined categories table
UPDATE public.projects p
SET category_name = c.name
FROM public.categories c
WHERE p.category_id = c.id
  AND (p.category_name IS NULL OR p.category_name = '');

-- ============================================================
-- FIX 2: messages table — Fix RLS policies
-- Current: No INSERT policy exists (or broken policy)
-- Fix: Allow authenticated users to insert messages where they are the sender
-- ============================================================

-- Drop any existing broken INSERT policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'messages' AND schemaname = 'public' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.messages', pol.policyname);
  END LOOP;
END $$;

-- Create correct INSERT policy
CREATE POLICY "Users can send messages as themselves" 
ON public.messages FOR INSERT 
TO authenticated
WITH CHECK (sender_id = auth.uid());

-- Drop any existing SELECT policies if too restrictive
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'messages' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.messages', pol.policyname);
  END LOOP;
END $$;

-- Create correct SELECT policy
CREATE POLICY "Users can read their own messages" 
ON public.messages FOR SELECT
TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Allow users to update their own received messages (mark as read)
DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;
CREATE POLICY "Users can update their received messages"
ON public.messages FOR UPDATE
TO authenticated
USING (receiver_id = auth.uid() OR sender_id = auth.uid());

-- ============================================================
-- FIX 3: profiles table — Auto-create profile on user signup
-- ============================================================

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, onboarding_completed, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name', 
      split_part(NEW.email, '@', 1), 
      'Innovator'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      'https://api.dicebear.com/7.x/initials/svg?seed=' || split_part(NEW.email, '@', 1)
    ),
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create or replace trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- FIX 4: profiles table — Check and add missing columns
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB;

-- ============================================================
-- FIX 5: community_resources table — Create if not exists
-- The community page tries to use this table but it doesn't exist
-- ============================================================
CREATE TABLE IF NOT EXISTS public.community_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  resource_url TEXT,
  resource_type TEXT DEFAULT 'OTHER',
  category_id UUID REFERENCES public.categories(id),
  category_name TEXT,
  tags TEXT[],
  upvotes_count INTEGER DEFAULT 0,
  downvotes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on community_resources
ALTER TABLE public.community_resources ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read community resources
CREATE POLICY "Anyone can read community resources"
ON public.community_resources FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated users to create resources
CREATE POLICY "Authenticated users can create resources"
ON public.community_resources FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to update/delete their own resources
CREATE POLICY "Users can update their own resources"
ON public.community_resources FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own resources"
ON public.community_resources FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================
-- FIX 6: notifications table — Add missing columns
-- Actual columns: id, user_id, message, title, type, is_read, created_at
-- ============================================================
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS actor_id UUID,
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS related_message_id UUID,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- FIX 7: reviews table — ensure RLS allows authenticated insert
-- ============================================================
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'reviews' AND schemaname = 'public' AND cmd = 'INSERT';
  
  IF policy_count = 0 THEN
    EXECUTE 'CREATE POLICY "Users can submit reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
  END IF;
END $$;

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'reviews' AND schemaname = 'public' AND cmd = 'SELECT';
  
  IF policy_count = 0 THEN
    EXECUTE 'CREATE POLICY "Anyone can read reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

-- ============================================================
-- VERIFICATION QUERIES (run to confirm fixes worked)
-- ============================================================

-- Verify projects columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'projects'
ORDER BY ordinal_position;

-- Verify messages RLS policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'messages' AND schemaname = 'public';

-- Verify community_resources table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'community_resources'
ORDER BY ordinal_position;
