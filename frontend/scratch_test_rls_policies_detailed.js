import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

async function testRLSPolicies() {
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);

  // Sign up User A and User B
  const time = Date.now();
  const { data: authA } = await anonClient.auth.signUp({
    email: `rls_a_${time}@test.com`,
    password: 'Password123!',
    options: { data: { full_name: 'Tester A' } }
  });
  const { data: authB } = await anonClient.auth.signUp({
    email: `rls_b_${time}@test.com`,
    password: 'Password123!',
    options: { data: { full_name: 'Tester B' } }
  });

  const clientA = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${authA.session.access_token}` } }
  });
  const clientB = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${authB.session.access_token}` } }
  });

  // Ensure profiles
  const pA = await clientA.from('profiles').upsert([{ id: authA.user.id, full_name: 'Tester A' }]).select();
  const pB = await clientB.from('profiles').upsert([{ id: authB.user.id, full_name: 'Tester B' }]).select();
  console.log('Profiles upserted:', pA.data, pB.data);

  // User A creates project
  const { data: projA, error: pErr } = await clientA.from('projects').insert([{
    user_id: authA.user.id,
    title: 'RLS Test Project',
    description: 'Testing project',
    project_type: 'idea',
    status: 'published'
  }]).select().single();
  console.log('Project created:', projA?.id, pErr);

  // Test project_likes:
  // Let's test insert with clientB
  const likeResB = await clientB.from('project_likes').insert([{
    project_id: projA.id,
    user_id: authB.user.id
  }]).select();
  console.log('User B like insert:', likeResB.error ? likeResB.error : likeResB.data);

  // Let's test reviews:
  // With clientB
  const revResB = await clientB.from('reviews').insert([{
    project_id: projA.id,
    reviewer_id: authB.user.id,
    suggestion: 'Great idea',
    relevance_answer: 'YES',
    is_valid: true
  }]).select();
  console.log('User B review insert:', revResB.error ? revResB.error : revResB.data);

  // Let's test notifications:
  // Can User A insert notification for User A?
  const notifA = await clientA.from('notifications').insert([{
    user_id: authA.user.id,
    title: 'Title',
    message: 'Message',
    type: 'review'
  }]).select();
  console.log('User A notif insert:', notifA.error ? notifA.error : notifA.data);

  // Can User B insert notification for User A?
  const notifB = await clientB.from('notifications').insert([{
    user_id: authA.user.id,
    title: 'Title B',
    message: 'User B notification',
    type: 'review'
  }]).select();
  console.log('User B notif insert for User A:', notifB.error ? notifB.error : notifB.data);

  // Clean up
  await clientA.from('projects').delete().eq('id', projA.id);
}

testRLSPolicies().catch(console.error);
