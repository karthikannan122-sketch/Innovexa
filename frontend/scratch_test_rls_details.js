import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

let supabaseUrl = 'https://jeafkfarfkojazznsafj.supabase.co';
let supabaseAnonKey = 'sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf';

try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) {
      if (k.trim() === 'VITE_SUPABASE_URL') supabaseUrl = v.trim();
      if (k.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = v.trim();
    }
  });
} catch (e) {}

const client = createClient(supabaseUrl, supabaseAnonKey);

async function testRlsDetails() {
  const { data: authA } = await client.auth.signInWithPassword({
    email: 'creator.test@innovexa.io',
    password: 'TestPassword123!'
  });
  const { data: authB } = await client.auth.signInWithPassword({
    email: 'validator.test@innovexa.io',
    password: 'TestPassword123!'
  });

  const userAClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${authA.session.access_token}` } }
  });
  const userBClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${authB.session.access_token}` } }
  });

  // Ensure Profile rows exist in public.profiles for both User A and User B
  const { data: profA } = await userAClient.from('profiles').upsert({
    id: authA.user.id,
    full_name: 'Creator Test User',
    onboarding_completed: true
  }).select();
  console.log('Profile A upsert:', profA);

  const { data: profB } = await userBClient.from('profiles').upsert({
    id: authB.user.id,
    full_name: 'Validator Test User',
    onboarding_completed: true
  }).select();
  console.log('Profile B upsert:', profB);

  // User A creates project
  const { data: projA } = await userAClient.from('projects').insert([{
    user_id: authA.user.id,
    title: 'Testing Project for RLS Details',
    description: 'Testing description',
    project_type: 'idea',
    status: 'published'
  }]).select();
  const projId = projA[0].id;
  console.log('Created project:', projId);

  // Test User A liking own project or User B liking User A project
  console.log('\n--- Testing project_likes insert ---');
  // With User B (user_id: authB.user.id)
  const resLikeB = await userBClient.from('project_likes').insert([{
    project_id: projId,
    user_id: authB.user.id
  }]).select();
  console.log('User B like result:', resLikeB);

  // With User A (user_id: authA.user.id)
  const resLikeA = await userAClient.from('project_likes').insert([{
    project_id: projId,
    user_id: authA.user.id
  }]).select();
  console.log('User A like result:', resLikeA);

  // Test User B reviewing project
  console.log('\n--- Testing reviews insert ---');
  const resRevB = await userBClient.from('reviews').insert([{
    project_id: projId,
    reviewer_id: authB.user.id,
    relevance_answer: 'YES',
    suggestion: 'Test suggestion',
    is_valid: true
  }]).select();
  console.log('User B review result (with is_valid):', resRevB);

  // Try without is_valid
  const resRevB2 = await userBClient.from('reviews').insert([{
    project_id: projId,
    reviewer_id: authB.user.id,
    relevance_answer: 'YES',
    suggestion: 'Test suggestion 2'
  }]).select();
  console.log('User B review result 2:', resRevB2);

  // Test User A reviewing project
  const resRevA = await userAClient.from('reviews').insert([{
    project_id: projId,
    reviewer_id: authA.user.id,
    relevance_answer: 'YES',
    suggestion: 'Self review test'
  }]).select();
  console.log('User A (owner) review result:', resRevA);

  // Test notifications
  console.log('\n--- Testing notifications insert ---');
  const resNotifA = await userAClient.from('notifications').insert([{
    user_id: authA.user.id,
    title: 'Test Title',
    message: 'Test Message',
    type: 'review',
    is_read: false
  }]).select();
  console.log('User A insert notification for A:', resNotifA);

  const resNotifB = await userBClient.from('notifications').insert([{
    user_id: authB.user.id,
    title: 'Test Title B',
    message: 'Test Message B',
    type: 'review',
    is_read: false
  }]).select();
  console.log('User B insert notification for B:', resNotifB);

  // Clean up
  await userAClient.from('projects').delete().eq('id', projId);
}

testRlsDetails().catch(console.error);
