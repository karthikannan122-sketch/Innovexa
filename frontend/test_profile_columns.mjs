/**
 * Quick test to verify what columns profiles table actually has
 * and whether profile creation works after our fixes
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jeafkfarfkojazznsafj.supabase.co',
  'sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf'
);

async function testProfileColumns() {
  console.log('=== PROFILES COLUMN CHECK ===\n');

  const { data: loginA } = await supabase.auth.signInWithPassword({
    email: 'audit_user_a_1787408965101@innovexa-test.ai',
    password: 'TestPass123!'
  });

  const authed = createClient('https://jeafkfarfkojazznsafj.supabase.co', 'sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf', {
    global: { headers: { Authorization: `Bearer ${loginA?.session?.access_token}` } }
  });

  const userId = loginA?.user?.id;
  console.log('User ID:', userId);

  // Check what columns profiles has
  const profileCols = [
    'id', 'full_name', 'avatar_url', 'bio', 'organization', 'onboarding_completed',
    'website', 'social_links', 'created_at', 'updated_at', 'location', 'username'
  ];
  
  console.log('\nChecking profile column existence:');
  for (const col of profileCols) {
    const { error } = await authed.from('profiles').select(col).eq('id', userId).limit(1);
    if (error?.message?.includes('does not exist')) {
      console.log(`❌ profiles.${col}: DOES NOT EXIST`);
    } else if (!error) {
      console.log(`✅ profiles.${col}: EXISTS`);
    } else {
      console.log(`⚠️ profiles.${col}: ${error.message}`);
    }
  }

  // Try creating a profile with minimal data (what AuthContext sends)
  const { data: profile, error: upsertErr } = await authed.from('profiles').upsert([{
    id: userId,
    full_name: 'Test User Alpha Updated',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=TestUserAlpha',
    onboarding_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }]).select().maybeSingle();
  
  if (upsertErr) {
    console.log('\n❌ Profile upsert failed:', upsertErr.message);
  } else {
    console.log('\n✅ Profile upsert succeeded:', profile?.id?.slice(0,8));
  }
  
  // Try with bio + organization (these are what AuthContext sends)
  const { error: fullUpsertErr } = await authed.from('profiles').upsert([{
    id: userId,
    full_name: 'Test User Alpha',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=TestUserAlpha',
    bio: 'Test bio',
    organization: 'Test Org',
    onboarding_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }]).select();
  
  if (fullUpsertErr) {
    console.log('❌ Full profile upsert (with bio+org) failed:', fullUpsertErr.message);
    if (fullUpsertErr.message?.includes('organization')) {
      console.log('  → "organization" column does not exist in profiles table!');
    }
    if (fullUpsertErr.message?.includes('bio')) {
      console.log('  → "bio" column does not exist in profiles table!');
    }
  } else {
    console.log('✅ Full profile upsert (with bio+org) succeeded');
  }
  
  await supabase.auth.signOut();
}

testProfileColumns().catch(console.error);
