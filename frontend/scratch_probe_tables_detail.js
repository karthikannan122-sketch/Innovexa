import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

async function probe() {
  const client = createClient(supabaseUrl, supabaseAnonKey);
  const { data: authA } = await client.auth.signInWithPassword({
    email: 'creator.test@innovexa.io',
    password: 'TestPassword123!'
  });

  const { data: authB } = await client.auth.signInWithPassword({
    email: 'validator.test@innovexa.io',
    password: 'TestPassword123!'
  });

  const userClientA = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${authA.session.access_token}` } }
  });
  const userClientB = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${authB.session.access_token}` } }
  });

  // Create Project A
  const { data: p } = await userClientA.from('projects').insert([{
    user_id: authA.user.id,
    title: 'Probe Test Project',
    description: 'Testing',
    project_type: 'idea',
    status: 'published'
  }]).select();
  const projId = p[0].id;
  console.log('Created project:', projId);

  // Probe reviews RLS
  // Let's test inserting reviews with different fields
  const reviewVariations = [
    { project_id: projId, reviewer_id: authB.user.id },
    { project_id: projId, reviewer_id: authB.user.id, suggestion: 'Test' },
    { project_id: projId, reviewer_id: authB.user.id, suggestion: 'Test', relevance_answer: 'YES' },
    { project_id: projId, reviewer_id: authB.user.id, suggestion: 'Test', relevance_answer: 'yes' },
    { project_id: projId, reviewer_id: authB.user.id, suggestion: 'Test', relevance_answer: 'YES', is_valid: true },
    { project_id: projId, reviewer_id: authB.user.id, suggestion: 'Test', relevance_answer: 'YES', is_valid: false },
  ];

  for (let i = 0; i < reviewVariations.length; i++) {
    const res = await userClientB.from('reviews').insert([reviewVariations[i]]).select();
    console.log(`Review variation ${i}:`, res.error ? res.error.message : 'SUCCESS: ' + JSON.stringify(res.data));
  }

  // Probe project_likes RLS
  const likeVariations = [
    { project_id: projId, user_id: authB.user.id },
    { project_id: projId, user_id: authA.user.id }
  ];
  for (let i = 0; i < likeVariations.length; i++) {
    const res = await userClientB.from('project_likes').insert([likeVariations[i]]).select();
    console.log(`Like variation ${i}:`, res.error ? res.error.message : 'SUCCESS: ' + JSON.stringify(res.data));
  }

  // Probe notifications RLS
  const notifVariations = [
    { user_id: authA.user.id, message: 'test', type: 'test' },
    { user_id: authA.user.id, title: 't', message: 'test', type: 'test', is_read: false },
    { user_id: authB.user.id, title: 't', message: 'test', type: 'test', is_read: false }
  ];
  for (let i = 0; i < notifVariations.length; i++) {
    const res = await userClientB.from('notifications').insert([notifVariations[i]]).select();
    console.log(`Notif variation ${i}:`, res.error ? res.error.message : 'SUCCESS: ' + JSON.stringify(res.data));
  }

  await userClientA.from('projects').delete().eq('id', projId);
}

probe().catch(console.error);
