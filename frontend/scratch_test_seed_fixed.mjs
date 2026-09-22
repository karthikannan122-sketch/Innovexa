import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://crwqfrldxvjsbcsjyacg.supabase.co';
const SUPABASE_ANON = 'sb_publishable_UZKoNNZ0FvlzM3u9w1iT0A_PLe0I0Zr';

const ts = Date.now();
const emailA = `innovexa.test.a.${ts}@gmail.com`;
const emailB = `innovexa.test.b.${ts}@gmail.com`;
const password = 'TestPass123!Secure';

const anon = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });

async function run() {
  console.log('1. Signing up User A and B...');
  const { data: authA, error: errA } = await anon.auth.signUp({ email: emailA, password });
  if (errA) throw errA;
  const uidA = authA.user.id;
  const tokA = authA.session.access_token;
  console.log('   User A created:', uidA);

  const { data: authB, error: errB } = await anon.auth.signUp({ email: emailB, password });
  if (errB) throw errB;
  const uidB = authB.user.id;
  const tokB = authB.session.access_token;
  console.log('   User B created:', uidB);

  const clientA = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${tokA}` } }
  });
  const clientB = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${tokB}` } }
  });

  console.log('2. Inserting profiles with role="innovator"...');
  const { data: pA, error: epA } = await clientA.from('profiles').upsert({
    id: uidA,
    username: `alice_${ts.toString().slice(-6)}`,
    full_name: 'Alice Seed A',
    role: 'innovator',
    reputation_points: 100
  }).select();
  console.log('   Profile A result:', pA ? 'SUCCESS' : epA?.message);

  const { data: pB, error: epB } = await clientB.from('profiles').upsert({
    id: uidB,
    username: `bob_${ts.toString().slice(-6)}`,
    full_name: 'Bob Seed B',
    role: 'innovator',
    reputation_points: 200
  }).select();
  console.log('   Profile B result:', pB ? 'SUCCESS' : epB?.message);

  console.log('3. Inserting project with status="published"...');
  const { data: cats } = await clientA.from('categories').select('id').limit(1);
  const catId = cats[0].id;

  const { data: proj, error: projErr } = await clientA.from('projects').insert({
    user_id: uidA,
    category_id: catId,
    title: `AuraGrid Microgrid ${ts}`,
    short_description: 'Decentralized renewable energy mesh.',
    description: 'Full stack for autonomous microgrids.',
    problem_statement: 'Grid transmission losses.',
    proposed_solution: 'P2P DC microgrid.',
    project_type: 'product',
    project_stage: 'prototype',
    status: 'published',
    is_public: true
  }).select().single();
  console.log('   Project insert result:', proj ? `SUCCESS (id=${proj.id})` : projErr?.message);

  if (proj?.id) {
    console.log('4. User B upvoting User A project...');
    const { data: vote, error: voteErr } = await clientB.from('project_votes').insert({
      project_id: proj.id,
      user_id: uidB,
      vote_type: 'upvote'
    }).select().single();
    console.log('   Project vote result:', vote ? 'SUCCESS' : voteErr?.message);

    console.log('5. User B reviewing User A project...');
    const { data: rev, error: revErr } = await clientB.from('reviews').insert({
      project_id: proj.id,
      user_id: uidB,
      rating: 5,
      title: 'Great innovation!',
      content: 'Solid architecture and clear problem solving.',
      is_public: true
    }).select().single();
    console.log('   Review result:', rev ? `SUCCESS (id=${rev.id})` : revErr?.message);
  }

  console.log('6. Inserting community_post with post_type="discussion"...');
  const { data: post, error: postErr } = await clientA.from('community_posts').insert({
    user_id: uidA,
    category_id: catId,
    title: `Discussion test ${ts}`,
    content: 'Testing discussion post type.',
    post_type: 'discussion',
    is_public: true
  }).select().single();
  console.log('   Community post result:', post ? `SUCCESS (id=${post.id})` : postErr?.message);

  if (post?.id) {
    console.log('7. User B commenting on community post...');
    const { data: comm, error: commErr } = await clientB.from('community_comments').insert({
      post_id: post.id,
      user_id: uidB,
      content: 'Great discussion topic!'
    }).select().single();
    console.log('   Community comment result:', comm ? 'SUCCESS' : commErr?.message);
  }

  console.log('8. User A sending message to User B...');
  const { data: msg, error: msgErr } = await clientA.from('messages').insert({
    sender_id: uidA,
    receiver_id: uidB,
    content: 'Hello Bob!'
  }).select().single();
  console.log('   Message result:', msg ? 'SUCCESS' : msgErr?.message);

  console.log('9. Creating notification for User B...');
  const { data: notif, error: notifErr } = await clientA.from('notifications').insert({
    user_id: uidB,
    actor_id: uidA,
    type: 'new_message',
    title: 'New message from Alice',
    message: 'Hello Bob!'
  }).select().single();
  console.log('   Notification result:', notif ? 'SUCCESS' : notifErr?.message);

  console.log('\n🎉 ALL CORE WORKFLOWS TESTED!');
}

run().catch(console.error);
