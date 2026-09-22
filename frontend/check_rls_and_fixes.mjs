/**
 * Check actual RLS policies via information_schema
 * and generate SQL fixes for all issues found
 */
import { createClient } from '@supabase/supabase-js';

// Use service role key from .env for admin operations
const SUPABASE_URL = 'https://jeafkfarfkojazznsafj.supabase.co';
// Try anon key first - service role needed for policy inspection
const SUPABASE_ANON_KEY = 'sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkPolicies() {
  console.log('=== CHECKING RLS POLICIES VIA SUPABASE ===\n');
  
  // Login as user A
  const { data: loginA } = await supabase.auth.signInWithPassword({
    email: 'audit_user_a_1787408965101@innovexa-test.ai',
    password: 'TestPass123!'
  });
  
  if (!loginA?.session) {
    console.log('Cannot login as user A');
    return;
  }
  
  const authed = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${loginA.session.access_token}` } }
  });
  
  const userAId = loginA.user.id;
  
  // Try calling an RPC that might give policy info
  // or just test all insert patterns for messages
  
  console.log('Testing all message insert patterns...');
  
  // Pattern 1: full payload
  let { error: e1 } = await authed.from('messages').insert({
    sender_id: userAId,
    receiver_id: '00000000-0000-0000-0000-000000000001', // fake
    content: 'Test'
  });
  console.log('Pattern 1 (fake receiver):', e1?.message || '✅ Success');
  
  // Check if the issue is sending to a non-existent user
  // Get user B's actual ID
  const { data: loginB } = await supabase.auth.signInWithPassword({
    email: 'audit_user_b_1787408965101@innovexa-test.ai', 
    password: 'TestPass123!'
  });
  const userBId = loginB?.user?.id;
  
  // Re-login as A to test B message
  await supabase.auth.signInWithPassword({
    email: 'audit_user_a_1787408965101@innovexa-test.ai',
    password: 'TestPass123!'
  });
  
  const { data: loginA2 } = await supabase.auth.signInWithPassword({
    email: 'audit_user_a_1787408965101@innovexa-test.ai',
    password: 'TestPass123!'
  });
  
  const authed2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${loginA2.session.access_token}` } }
  });

  console.log('\nUser A:', userAId.slice(0,8));
  console.log('User B:', userBId?.slice(0,8));
  
  if (userBId) {
    let { data: msg, error: e2 } = await authed2.from('messages').insert({
      sender_id: userAId,
      receiver_id: userBId,
      content: 'Test from A to B'
    }).select();
    console.log('\nPattern 2 (A→B real IDs):', e2?.message || `✅ Success: ${msg?.[0]?.id?.slice(0,8)}`);
    
    // Try without specifying sender_id at all (let RLS handle it from auth.uid())
    let { data: msg3, error: e3 } = await authed2.from('messages').insert({
      receiver_id: userBId,
      content: 'Test without sender_id'
    }).select();
    console.log('Pattern 3 (no sender_id):', e3?.message || `✅ Success: ${msg3?.[0]?.id?.slice(0,8)}`);
  }
  
  // Generate SQL fix
  console.log('\n=== REQUIRED SQL FIXES ===\n');
  console.log(`
-- FIX 1: Messages RLS - Allow authenticated users to insert messages where they are the sender
-- Run this in Supabase Dashboard > SQL Editor:

-- Drop existing restrictive policies on messages
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.messages;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;

-- Create correct INSERT policy: sender_id must match auth.uid()
CREATE POLICY "Users can send messages as themselves" 
ON public.messages FOR INSERT 
TO authenticated
WITH CHECK (sender_id = auth.uid());

-- Create correct SELECT policy: users can read their own messages
DROP POLICY IF EXISTS "Users can read their messages" ON public.messages;
CREATE POLICY "Users can read their own messages" 
ON public.messages FOR SELECT
TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- FIX 2: projects table - Add missing columns that the frontend expects
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

-- FIX 3: Profile auto-creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, onboarding_completed, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Innovator'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/initials/svg?seed=' || split_part(NEW.email, '@', 1)),
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
`);

  await supabase.auth.signOut();
}

checkPolicies().catch(console.error);
