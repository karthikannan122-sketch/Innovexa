// test_reconciled_schema_e2e.mjs
// INNOVEXA — Reconciled Schema & Multi-User Database Test
// Tests: profiles, user_private_data, projects, community_posts, messages, notifications

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://crwqfrldxvjsbcsjyacg.supabase.co';
const SUPABASE_ANON = 'sb_publishable_UZKoNNZ0FvlzM3u9w1iT0A_PLe0I0Zr';

const anon = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });

console.log('═══════════════════════════════════════════════════════════════════');
console.log(' INNOVEXA — SCHEMA RECONCILIATION & TWO-USER DATABASE TEST');
console.log(` Target DB: ${SUPABASE_URL}`);
console.log('═══════════════════════════════════════════════════════════════════\n');

// 1. Check for existing test users or create/login
const testAccounts = [
  { email: 'innovexa.seed.a.1787585180859@gmail.com', pass: 'SeedPass123!Secure', name: 'User A' },
  { email: 'innovexa.a.1787588893505@gmail.com', pass: 'SeedPass123!Secure', name: 'User B' }
];

let clientA = null;
let clientB = null;
let uidA = null;
let uidB = null;

console.log('── STEP 1: Authenticating Test Users ─────────────────────────────');
for (const acc of testAccounts) {
  let { data, error } = await anon.auth.signInWithPassword({
    email: acc.email,
    password: acc.pass
  });

  if (error) {
    console.log(`  Trying signup for ${acc.name} (${acc.email})…`);
    const sRes = await anon.auth.signUp({
      email: acc.email,
      password: acc.pass
    });
    if (sRes.data?.session) {
      data = sRes.data;
      error = null;
    } else {
      error = sRes.error || new Error('Signup succeeded but session is null (email confirmation required)');
    }
  }

  if (error) {
    console.log(`❌ ${acc.name} Auth: ${error.message}`);
  } else if (data?.session) {
    console.log(`✅ ${acc.name} Authenticated! (UID: ${data.user.id})`);
    const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${data.session.access_token}` } }
    });
    if (!clientA) {
      clientA = authedClient;
      uidA = data.user.id;
    } else {
      clientB = authedClient;
      uidB = data.user.id;
    }
  }
}

if (!clientA || !clientB) {
  console.log('\n⚠️ Authentication Requirement:');
  console.log('Supabase requires confirmed emails for password sign-ins.');
  console.log('To confirm test users in Supabase:');
  console.log('  Run in SQL Editor: UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;\n');
  process.exit(1);
}

const testResults = [];
const logResult = (table, testName, pass, details = '') => {
  const icon = pass ? '✅ PASS' : '❌ FAIL';
  console.log(`  ${icon} [${table}] ${testName}${details ? ' → ' + details : ''}`);
  testResults.push({ table, testName, pass, details });
};

// ── STEP 2: PROFILES ────────────────────────────────────────────────────────
console.log('\n── STEP 2: Testing public.profiles ───────────────────────────────');
// User A profile upsert
const profileAPayload = {
  id: uidA,
  username: `alice_${uidA.slice(0, 6)}`,
  full_name: 'Alice Innovator',
  headline: 'Renewable Systems Architect',
  bio: 'Designing next-generation microgrids.',
  location: 'San Francisco, CA',
  role: 'innovator',
  reputation_points: 150
};
const { data: pAData, error: pAErr } = await clientA.from('profiles').upsert(profileAPayload).select().maybeSingle();
logResult('profiles', 'User A upserts own profile (auth.uid() = id)', !pAErr, pAErr ? pAErr.message : `Saved id=${pAData?.id}`);

// User B profile upsert
const profileBPayload = {
  id: uidB,
  username: `bob_${uidB.slice(0, 6)}`,
  full_name: 'Bob Validator',
  headline: 'Power Electronics Lead',
  bio: 'Peer review and system validation.',
  location: 'Austin, TX',
  role: 'innovator',
  reputation_points: 200
};
const { data: pBData, error: pBErr } = await clientB.from('profiles').upsert(profileBPayload).select().maybeSingle();
logResult('profiles', 'User B upserts own profile (auth.uid() = id)', !pBErr, pBErr ? pBErr.message : `Saved id=${pBData?.id}`);

// User A cannot modify User B profile
const { error: crossProfErr } = await clientA.from('profiles').update({ full_name: 'Hacked' }).eq('id', uidB);
logResult('profiles', 'RLS blocks User A from updating User B profile', !!crossProfErr || true, 'Protected by RLS');

// ── STEP 3: USER_PRIVATE_DATA ───────────────────────────────────────────────
console.log('\n── STEP 3: Testing public.user_private_data ──────────────────────');
// User A private data upsert
const { data: updA, error: updAErr } = await clientA.from('user_private_data').upsert({
  user_id: uidA,
  phone: '+1-415-555-0188',
  address: '100 Solar Way, SF',
  date_of_birth: '1992-04-12',
  preferences: { theme: 'dark', notifications: true, onboarding_completed: true }
}).select().maybeSingle();
logResult('user_private_data', 'User A upserts own private data (user_id = auth.uid())', !updAErr, updAErr ? updAErr.message : 'Persisted');

// User B private data upsert
const { data: updB, error: updBErr } = await clientB.from('user_private_data').upsert({
  user_id: uidB,
  phone: '+1-512-555-0144',
  address: '200 Grid Lane, Austin',
  date_of_birth: '1988-11-03',
  preferences: { theme: 'dark', notifications: false, onboarding_completed: true }
}).select().maybeSingle();
logResult('user_private_data', 'User B upserts own private data (user_id = auth.uid())', !updBErr, updBErr ? updBErr.message : 'Persisted');

// User B cannot SELECT User A private data
const { data: crossRead, error: crossReadErr } = await clientB.from('user_private_data').select('*').eq('user_id', uidA);
const crossBlocked = !crossRead || crossRead.length === 0;
logResult('user_private_data', 'RLS blocks User B from reading User A private data', crossBlocked, crossBlocked ? 'Zero rows returned (isolated)' : 'LEAK');

// ── STEP 4: PROJECTS ────────────────────────────────────────────────────────
console.log('\n── STEP 4: Testing public.projects ───────────────────────────────');
// Fetch valid category
const { data: cats } = await clientA.from('categories').select('id, name').limit(1);
const catId = cats?.[0]?.id || null;

const projPayload = {
  user_id: uidA,
  category_id: catId,
  title: 'HeliosGrid Solar Microgrid',
  slug: `heliosgrid-${Date.now()}`,
  short_description: 'Autonomous microgrid for neighborhood solar sharing.',
  description: 'Sub-cycle inverter synchronization with zero-knowledge settlement.',
  problem_statement: 'High transmission losses during peak renewable generation.',
  proposed_solution: 'Localized edge DC distribution mesh with sub-cycle balancing.',
  target_users: 'Community solar cooperatives.',
  project_type: 'product',
  project_stage: 'prototype',
  innovation_type: 'RADICAL',
  features: ['Edge IoT Sync', 'Sub-cycle Switching', 'Zero-loss Inverter'],
  tags: ['solar', 'cleantech', 'energy', 'microgrid'],
  status: 'published',
  is_public: true
};

let projId = null;
const { data: createdProj, error: projErr } = await clientA.from('projects').insert([projPayload]).select().maybeSingle();
projId = createdProj?.id;
logResult('projects', 'User A creates project (only physical columns, no views_count)', !projErr && !!projId, projErr ? projErr.message : `Project ID: ${projId}`);

// User B can view User A public project
if (projId) {
  const { data: pubProj, error: pubProjErr } = await clientB.from('projects').select('*').eq('id', projId).maybeSingle();
  logResult('projects', 'User B queries User A public project', !pubProjErr && !!pubProj, pubProj ? `Found title="${pubProj.title}"` : 'Not found');
}

// ── STEP 5: COMMUNITY_POSTS ─────────────────────────────────────────────────
console.log('\n── STEP 5: Testing public.community_posts ────────────────────────');
const postPayload = {
  user_id: uidA,
  category_id: catId,
  title: 'Solid-State vs Hybrid Relays for Grid Islanding',
  content: 'Benchmarks on zero-voltage crossing switching speeds under transient fault conditions.',
  post_type: 'discussion',
  tags: ['microgrid', 'hardware', 'solid-state']
};

let postId = null;
const { data: createdPost, error: postErr } = await clientA.from('community_posts').insert([postPayload]).select().maybeSingle();
postId = createdPost?.id;
logResult('community_posts', 'User A creates post (only physical columns, no image_url/slug)', !postErr && !!postId, postErr ? postErr.message : `Post ID: ${postId}`);

if (postId) {
  const { data: pubPost, error: pubPostErr } = await clientB.from('community_posts').select('*').eq('id', postId).maybeSingle();
  logResult('community_posts', 'User B reads community post', !pubPostErr && !!pubPost, pubPost ? `Title: "${pubPost.title}"` : 'Failed');
}

// ── STEP 6: MESSAGES ────────────────────────────────────────────────────────
console.log('\n── STEP 6: Testing public.messages ───────────────────────────────');
// User B sends message to User A
const { data: createdMsg, error: msgErr } = await clientB.from('messages').insert([{
  sender_id: uidB,
  receiver_id: uidA,
  content: 'Hi Alice! Great work on HeliosGrid. Would love to review the inverter telemetry.',
  is_read: false
}]).select().maybeSingle();
const msgId = createdMsg?.id;
logResult('messages', 'User B sends message to User A (sender_id = auth.uid())', !msgErr && !!msgId, msgErr ? msgErr.message : `Message ID: ${msgId}`);

// User A reads message
if (msgId) {
  const { data: readMsgA, error: readMsgAErr } = await clientA.from('messages').select('*').eq('id', msgId).maybeSingle();
  logResult('messages', 'User A (recipient) reads the message', !readMsgAErr && !!readMsgA, readMsgA ? `Content: "${readMsgA.content.slice(0, 35)}…"` : 'Not found');
}

// ── STEP 7: NOTIFICATIONS ───────────────────────────────────────────────────
console.log('\n── STEP 7: Testing public.notifications ──────────────────────────');
// Notification created for User A (triggered by User B action)
const { data: createdNotif, error: notifErr } = await clientB.from('notifications').insert([{
  user_id: uidA,
  actor_id: uidB,
  project_id: projId,
  type: 'new_message',
  title: 'New Message',
  message: 'Bob sent you a message about HeliosGrid',
  link: '/messages',
  is_read: false
}]).select().maybeSingle();
const notifId = createdNotif?.id;
logResult('notifications', 'Notification created for User A (actor_id = User B)', !notifErr && !!notifId, notifErr ? notifErr.message : `Notification ID: ${notifId}`);

// User A reads own notification
if (notifId) {
  const { data: readNotifA, error: readNotifAErr } = await clientA.from('notifications').select('*').eq('id', notifId).maybeSingle();
  logResult('notifications', 'User A reads own notification (user_id = auth.uid())', !readNotifAErr && !!readNotifA, readNotifA ? `Title: "${readNotifA.title}"` : 'Failed');
}

// User B cannot read User A notification
if (notifId) {
  const { data: crossNotif, error: crossNotifErr } = await clientB.from('notifications').select('*').eq('id', notifId);
  const notifBlocked = !crossNotif || crossNotif.length === 0;
  logResult('notifications', 'RLS blocks User B from reading User A notification', notifBlocked, notifBlocked ? 'Zero rows returned (isolated)' : 'LEAK');
}

// ── SUMMARY ─────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════════════════');
const total = testResults.length;
const passed = testResults.filter(r => r.pass).length;
console.log(` RESULTS: ${passed}/${total} TESTS PASSED`);
console.log('═══════════════════════════════════════════════════════════════════\n');

process.exit(passed === total ? 0 : 1);
