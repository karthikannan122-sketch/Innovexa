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

async function testRls() {
  console.log('Testing RLS policies with authenticated users...');
  
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

  // 1. Categories
  const { data: cats, error: catErr } = await userAClient.from('categories').select('*');
  console.log('User A select categories:', cats?.length, 'items. Error:', catErr);

  // 2. User A creates project
  const { data: projA, error: projAErr } = await userAClient.from('projects').insert([{
    user_id: authA.user.id,
    title: 'User A RLS Test Project',
    description: 'Testing RLS',
    project_type: 'idea',
    status: 'published',
    category_id: cats[0].id
  }]).select();
  console.log('User A insert project:', projA?.[0]?.id, 'Error:', projAErr);
  const projId = projA?.[0]?.id;

  // 3. User B reads projects
  const { data: projReadB, error: projReadBErr } = await userBClient.from('projects').select('*');
  console.log('User B select projects:', projReadB?.length, 'items. Error:', projReadBErr);

  // 4. User B creates review for User A's project
  const { data: revB, error: revBErr } = await userBClient.from('reviews').insert([{
    project_id: projId,
    reviewer_id: authB.user.id,
    relevance_answer: 'YES',
    suggestion: 'Very cool approach to decentralized networks.'
  }]).select();
  console.log('User B insert review:', revB, 'Error:', revBErr);

  // 5. User B reads reviews
  const { data: revRead, error: revReadErr } = await userBClient.from('reviews').select('*').eq('project_id', projId);
  console.log('User B select reviews:', revRead?.length, 'Error:', revReadErr);

  // 6. User B likes User A's project
  const { data: likeB, error: likeBErr } = await userBClient.from('project_likes').insert([{
    project_id: projId,
    user_id: authB.user.id
  }]).select();
  console.log('User B insert project_like:', likeB, 'Error:', likeBErr);

  // 7. User B reads project_likes
  const { data: likeRead, error: likeReadErr } = await userBClient.from('project_likes').select('*').eq('project_id', projId);
  console.log('User B select project_likes:', likeRead?.length, 'Error:', likeReadErr);

  // 8. User B unlike User A's project
  const { data: unlikeB, error: unlikeBErr } = await userBClient.from('project_likes').delete().eq('project_id', projId).eq('user_id', authB.user.id);
  console.log('User B delete project_like:', unlikeB, 'Error:', unlikeBErr);

  // 9. Notifications: User A reads own notifications
  const { data: notifsA, error: notifsAErr } = await userAClient.from('notifications').select('*');
  console.log('User A select notifications:', notifsA?.length, 'Error:', notifsAErr);

  // 10. Notification insert for User A (e.g. System or User A creating notification)
  const { data: notifInsA, error: notifInsAErr } = await userAClient.from('notifications').insert([{
    user_id: authA.user.id,
    title: 'Welcome to INNOVEXA',
    message: 'Your account is ready.',
    type: 'welcome',
    is_read: false
  }]).select();
  console.log('User A insert notification for self:', notifInsA, 'Error:', notifInsAErr);

  // 11. Can User B send notification to User A?
  const { data: notifInsB, error: notifInsBErr } = await userBClient.from('notifications').insert([{
    user_id: authA.user.id,
    title: 'New Review',
    message: 'User B reviewed your project',
    type: 'review',
    is_read: false
  }]).select();
  console.log('User B insert notification for User A:', notifInsB, 'Error:', notifInsBErr);

  // Clean up
  if (projId) {
    await userAClient.from('projects').delete().eq('id', projId);
  }
}

testRls().catch(console.error);
