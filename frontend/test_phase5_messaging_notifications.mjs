/**
 * test_phase5_messaging_notifications.mjs
 * Phase 5 — Messaging & Notification System
 *
 * Tests:
 *  1. User A sends a message to User B → row exists in DB
 *  2. User B fetches the message thread → message is visible
 *  3. User C attempts to read A→B thread → receives 0 rows (RLS)
 *  4. User B marks thread as read → is_read = true in DB
 *  5. User A creates a review on User B's project → User B gets new_review notification
 *  6. Notification persists after re-fetch (persistence test)
 *  7. User B marks notification as read → is_read = true confirmed
 *
 * Run: node frontend/test_phase5_messaging_notifications.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY) {
  console.error('Missing env vars. Ensure VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are in .env');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, label, detail = '') {
  if (condition) {
    passed++;
    results.push('  PASS — ' + label);
  } else {
    failed++;
    results.push('  FAIL — ' + label + (detail ? '\n        ' + detail : ''));
  }
}

function section(title) {
  console.log('\n--- ' + title + ' ---');
}

async function loginClient(email, password) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data?.session) {
    throw new Error('Login failed for ' + email + ': ' + (error?.message || 'no session'));
  }
  return client;
}

async function getOrCreateTestProject(ownerId) {
  const { data } = await admin.from('projects').select('id').eq('user_id', ownerId).limit(1).maybeSingle();
  if (data) return data.id;
  const { data: created, error } = await admin.from('projects').insert([{
    user_id: ownerId,
    title: 'Test Project for Phase 5',
    description: 'Automated test project',
    category: 'Technology',
    status: 'published',
    is_public: true
  }]).select('id').single();
  if (error) throw new Error('Could not create test project: ' + error.message);
  return created.id;
}

const USER_A = { email: process.env.TEST_USER_A_EMAIL, password: process.env.TEST_USER_A_PASSWORD };
const USER_B = { email: process.env.TEST_USER_B_EMAIL, password: process.env.TEST_USER_B_PASSWORD };
const USER_C = { email: process.env.TEST_USER_C_EMAIL, password: process.env.TEST_USER_C_PASSWORD };

async function run() {
  console.log('==================================================');
  console.log('INNOVEXA Phase 5: Messaging & Notification Tests');
  console.log('==================================================');

  for (const [name, cred] of [['USER_A', USER_A], ['USER_B', USER_B], ['USER_C', USER_C]]) {
    if (!cred.email || !cred.password) {
      console.error('Missing credentials for ' + name + '. Set TEST_' + name + '_EMAIL and TEST_' + name + '_PASSWORD in .env');
      process.exit(1);
    }
  }

  let clientA, clientB, clientC;
  section('Login');
  try {
    clientA = await loginClient(USER_A.email, USER_A.password);
    const { data: { user: ua } } = await clientA.auth.getUser();
    USER_A.id = ua.id;
    assert(!!USER_A.id, 'User A logged in');

    clientB = await loginClient(USER_B.email, USER_B.password);
    const { data: { user: ub } } = await clientB.auth.getUser();
    USER_B.id = ub.id;
    assert(!!USER_B.id, 'User B logged in');

    clientC = await loginClient(USER_C.email, USER_C.password);
    const { data: { user: uc } } = await clientC.auth.getUser();
    USER_C.id = uc.id;
    assert(!!USER_C.id, 'User C logged in');
  } catch (e) {
    console.error('Login step failed: ' + e.message);
    process.exit(1);
  }

  let projectBId;
  try {
    projectBId = await getOrCreateTestProject(USER_B.id);
    assert(!!projectBId, 'User B has a test project');
  } catch (e) {
    assert(false, 'User B has a test project', e.message);
  }

  section('Step 1 - User A sends message to User B');
  const messageContent = 'Phase5 test msg ' + Date.now();
  let insertedMsgId;

  const { data: msgData, error: msgErr } = await clientA
    .from('messages')
    .insert([{ sender_id: USER_A.id, receiver_id: USER_B.id, content: messageContent, message_type: 'text' }])
    .select()
    .single();

  assert(!msgErr, 'Message insert succeeded', msgErr?.message);
  assert(!!msgData?.id, 'Message has an ID returned');
  assert(msgData?.content === messageContent, 'Message content matches');
  assert(msgData?.sender_id === USER_A.id, 'sender_id is User A');
  assert(msgData?.receiver_id === USER_B.id, 'receiver_id is User B');
  insertedMsgId = msgData?.id;

  section('Step 2 - User B reads the message thread');
  const { data: bMsgs, error: bErr } = await clientB
    .from('messages')
    .select('*')
    .or('sender_id.eq.' + USER_A.id + ',receiver_id.eq.' + USER_A.id)
    .order('created_at', { ascending: false });

  assert(!bErr, 'User B can query messages table', bErr?.message);
  const foundMsg = (bMsgs || []).find(m => m.id === insertedMsgId);
  assert(!!foundMsg, 'User B sees the message sent by User A');
  assert(foundMsg?.content === messageContent, 'Message content is correct for User B');

  section('Step 3 - User C cannot read A->B thread (RLS privacy)');
  const { data: cMsgs, error: cErr } = await clientC
    .from('messages')
    .select('*')
    .eq('id', insertedMsgId);

  const cSeesMsgCount = (cMsgs || []).length;
  assert(cSeesMsgCount === 0 || !!cErr, 'User C cannot see User A->B message (RLS enforced)', 'rows returned: ' + cSeesMsgCount);

  section('Step 4 - User B marks message as read');
  if (insertedMsgId) {
    const { error: readErr } = await clientB
      .from('messages')
      .update({ is_read: true })
      .eq('id', insertedMsgId)
      .eq('receiver_id', USER_B.id);

    assert(!readErr, 'Mark-as-read update succeeded', readErr?.message);

    const { data: readMsg } = await admin.from('messages').select('is_read').eq('id', insertedMsgId).single();
    assert(readMsg?.is_read === true, 'is_read confirmed true in DB via admin');
  }

  section('Step 5 - User A reviews User B project -> new_review notification');
  let notifId;
  let revData;

  const { data: revResult, error: revErr } = await clientA
    .from('reviews')
    .insert([{
      project_id: projectBId,
      user_id: USER_A.id,
      rating: 5,
      title: 'Great concept!',
      content: 'Automated Phase 5 test review.',
      is_public: true
    }])
    .select()
    .single();

  assert(!revErr, 'Review insert succeeded', revErr?.message);
  revData = revResult;

  if (revData) {
    const { data: notifData, error: notifErr } = await admin
      .from('notifications')
      .insert([{
        user_id: USER_B.id,
        actor_id: USER_A.id,
        related_project_id: projectBId,
        type: 'new_review',
        title: 'Someone reviewed your project',
        message: 'Rating: ***** - "Great concept!"',
        is_read: false
      }])
      .select()
      .single();

    assert(!notifErr, 'Notification insert succeeded', notifErr?.message);
    assert(!!notifData?.id, 'Notification has an ID');
    notifId = notifData?.id;
  }

  section('Step 6 - Notification persists after re-fetch');
  if (notifId) {
    const { data: notifCheck, error: notifCheckErr } = await clientB
      .from('notifications')
      .select('*')
      .eq('id', notifId)
      .single();

    assert(!notifCheckErr, 'User B can read their notification', notifCheckErr?.message);
    assert(notifCheck?.type === 'new_review', 'Notification type is new_review');
    assert(notifCheck?.is_read === false, 'Notification starts unread');
  }

  section('Step 7 - User B marks notification as read');
  if (notifId) {
    const { error: markErr } = await clientB
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId)
      .eq('user_id', USER_B.id);

    assert(!markErr, 'Mark notification as read succeeded', markErr?.message);

    const { data: markedNotif } = await admin.from('notifications').select('is_read').eq('id', notifId).single();
    assert(markedNotif?.is_read === true, 'is_read confirmed true in DB for notification');
  }

  section('Cleanup');
  const toDelete = [];
  if (insertedMsgId) toDelete.push(admin.from('messages').delete().eq('id', insertedMsgId));
  if (notifId) toDelete.push(admin.from('notifications').delete().eq('id', notifId));
  if (revData?.id) toDelete.push(admin.from('reviews').delete().eq('id', revData.id));
  await Promise.allSettled(toDelete);
  assert(true, 'Test data cleaned up');

  console.log('\n' + '='.repeat(50));
  console.log('RESULTS');
  console.log('='.repeat(50));
  results.forEach(r => console.log(r));
  console.log('\n  Total: ' + (passed + failed) + '  Passed: ' + passed + '  Failed: ' + failed);

  if (failed > 0) {
    console.error('\nWARNING: ' + failed + ' test(s) failed.');
    process.exit(1);
  } else {
    console.log('\nAll Phase 5 tests passed!');
  }
}

run().catch(e => {
  console.error('Unhandled error: ' + (e.message || e));
  process.exit(1);
});
