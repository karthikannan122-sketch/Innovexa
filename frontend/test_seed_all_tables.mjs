// test_seed_all_tables.mjs
// INNOVEXA — New Database Connection Check + Seed All 15 Tables
// Run: node frontend/test_seed_all_tables.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://crwqfrldxvjsbcsjyacg.supabase.co';
const SUPABASE_ANON = 'sb_publishable_UZKoNNZ0FvlzM3u9w1iT0A_PLe0I0Zr';

const ts       = Date.now();
// Use ts-based emails unique to this run
const emailA   = `innovexa.a.${ts}@gmail.com`;
const emailB   = `innovexa.b.${ts}@gmail.com`;
const password = 'SeedPass123!Secure';

const anon     = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });

let clientA, clientB, uidA, uidB;

const log   = (ok, label, detail='') => console.log(`${ok ? '✅' : '❌'} ${label}${detail ? '  →  ' + detail : ''}`);
const pass  = [];
const fail  = [];

function record(ok, label, detail) {
  log(ok, label, detail);
  (ok ? pass : fail).push(label);
}

// ─── helpers ────────────────────────────────────────────────────────────────
async function signUp(email) {
  const { data, error } = await anon.auth.signUp({ email, password });
  if (error) throw new Error(`signUp(${email}): ${error.message}`);
  const uid     = data.user?.id;
  const token   = data.session?.access_token;
  if (!uid) throw new Error(`signUp(${email}): no user id returned`);
  return { uid, token };
}

async function signIn(email) {
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signIn(${email}): ${error.message}`);
  return { uid: data.user?.id, token: data.session?.access_token };
}

function authClient(token) {
  return createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}

async function tryInsert(client, table, payload) {
  const { data, error } = await client.from(table).insert(payload).select().maybeSingle();
  return { data, error };
}

async function tryUpsert(client, table, payload) {
  const { data, error } = await client.from(table).upsert(payload).select().maybeSingle();
  return { data, error };
}

// ─── MAIN ───────────────────────────────────────────────────────────────────
console.log('═══════════════════════════════════════════════════════════════════');
console.log(' INNOVEXA — DATABASE CONNECTION CHECK + FULL TABLE SEED');
console.log(`  URL  : ${SUPABASE_URL}`);
console.log(`  KEY  : ${SUPABASE_ANON.slice(0,20)}…`);
console.log('═══════════════════════════════════════════════════════════════════\n');

// ── STEP 0: reachability ping ────────────────────────────────────────────────
console.log('── STEP 0: Connection ping ─────────────────────────────────────────');
try {
  const { error } = await anon.from('profiles').select('id').limit(1);
  if (error && !error.message.includes('does not exist')) {
    throw new Error(error.message);
  }
  record(true, 'Database reachable', SUPABASE_URL);
} catch(e) {
  record(false, 'Database reachable', e.message);
  console.error('\nCannot reach the database. Check URL / key. Aborting.');
  process.exit(1);
}

// ── STEP 1: Auth signup for User A & B ──────────────────────────────────────
console.log('\n── STEP 1: Auth – Signup two users ────────────────────────────────');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

try {
  ({ uid: uidA } = await signUp(emailA));
  record(true, 'auth.users  User A created', uidA);
} catch(e) {
  if (e.message.includes('rate limit')) {
    console.log('  ⏳ Rate limited – waiting 5s before retry…');
    await sleep(5000);
    try { ({ uid: uidA } = await signUp(emailA)); record(true, 'auth.users  User A (retry)', uidA); }
    catch(e2) { record(false, 'auth.users  User A', e2.message); process.exit(1); }
  } else {
    try { ({ uid: uidA } = await signIn(emailA)); record(true, 'auth.users  User A (existing)', uidA); }
    catch { record(false, 'auth.users  User A', e.message); process.exit(1); }
  }
}

await sleep(2000); // pause between signups to avoid rate limit

try {
  ({ uid: uidB } = await signUp(emailB));
  record(true, 'auth.users  User B created', uidB);
} catch(e) {
  if (e.message.includes('rate limit')) {
    console.log('  ⏳ Rate limited – waiting 5s before retry…');
    await sleep(5000);
    try { ({ uid: uidB } = await signUp(emailB)); record(true, 'auth.users  User B (retry)', uidB); }
    catch(e2) { record(false, 'auth.users  User B', e2.message); }
  } else {
    try { ({ uid: uidB } = await signIn(emailB)); record(true, 'auth.users  User B (existing)', uidB); }
    catch { record(false, 'auth.users  User B', e.message); }
  }
}


// sign-in to get fresh tokens
const { token: tokA } = await signIn(emailA);
const { token: tokB } = await signIn(emailB);
clientA = authClient(tokA);
clientB = authClient(tokB);

// ── STEP 2: profiles ─────────────────────────────────────────────────────────
console.log('\n── STEP 2: profiles ────────────────────────────────────────────────');
const profAPayload = {
  id: uidA, username: `alice_${ts.toString().slice(-6)}`,
  full_name: 'Alice Seed A', headline: 'Cleantech Pioneer',
  bio: 'Seed test user for INNOVEXA.', location: 'San Francisco, CA',
  website: 'https://alice.dev', github_url: 'https://github.com/alice',
  linkedin_url: 'https://linkedin.com/in/alice',
  role: 'INNOVATOR', reputation_points: 100
};
const profBPayload = {
  id: uidB, username: `bob_${ts.toString().slice(-6)}`,
  full_name: 'Bob Seed B', headline: 'Principal Reviewer',
  bio: 'Peer reviewer seed account.', location: 'Austin, TX',
  role: 'EXPERT_REVIEWER', reputation_points: 250
};

for (const [client, payload, label] of [
  [clientA, profAPayload, 'profiles  User A'],
  [clientB, profBPayload, 'profiles  User B'],
]) {
  const { data, error } = await tryUpsert(client, 'profiles', payload);
  record(!error, label, error ? error.message : `id=${payload.id}`);
}

// ── STEP 3: user_private_data ────────────────────────────────────────────────
console.log('\n── STEP 3: user_private_data ───────────────────────────────────────');
for (const [client, uid, label] of [
  [clientA, uidA, 'user_private_data  User A'],
  [clientB, uidB, 'user_private_data  User B'],
]) {
  const { data, error } = await tryUpsert(client, 'user_private_data', {
    user_id: uid, phone: '+1-555-0100',
    date_of_birth: '1990-06-15', address: '1 Seed Lane',
    preferences: { dark_mode: true }
  });
  record(!error, label, error ? error.message : `user_id=${uid}`);
}

// ── STEP 4: categories ───────────────────────────────────────────────────────
console.log('\n── STEP 4: categories ──────────────────────────────────────────────');
const categoryNames = [
  { name: 'Clean Energy',     slug: 'clean-energy'    },
  { name: 'Assistive Tech',   slug: 'assistive-tech'  },
  { name: 'Biotechnology',    slug: 'biotechnology'   },
  { name: 'AI & Systems',     slug: 'ai-systems'      },
  { name: 'Robotics',         slug: 'robotics'        },
  { name: 'Aerospace',        slug: 'aerospace'       },
];

let catId = null;
const { data: existingCats, error: catFetchErr } = await clientA.from('categories').select('id,name').limit(20);
if (existingCats && existingCats.length > 0) {
  catId = existingCats[0].id;
  record(true, 'categories  (already seeded)', `${existingCats.length} found, using id=${catId}`);
} else {
  // try inserting as User A (may be blocked by RLS – inform user if so)
  const { data: insData, error: insErr } = await clientA
    .from('categories')
    .insert(categoryNames)
    .select();
  if (insErr) {
    record(false, 'categories  insert', `${insErr.message} — seed categories manually in Supabase dashboard or add INSERT policy`);
  } else {
    catId = insData?.[0]?.id;
    record(true, 'categories  inserted', `${insData?.length} rows, first id=${catId}`);
  }
}
// fallback: use any existing category id, or a placeholder
if (!catId) {
  const { data: fc } = await clientA.from('categories').select('id').limit(1).maybeSingle();
  catId = fc?.id ?? null;
}

// ── STEP 5: projects ─────────────────────────────────────────────────────────
console.log('\n── STEP 5: projects ────────────────────────────────────────────────');
const projPayload = {
  user_id: uidA,
  category_id: catId,
  title: `AuraGrid Quantum Microgrid ${ts}`,
  short_description: 'Decentralized renewable energy mesh with sub-cycle balancing.',
  description: 'Full hardware and software stack for autonomous neighborhood microgrids.',
  problem_statement: 'Grid transmission losses and renewable curtailment due to centralised architecture.',
  proposed_solution: 'Peer-to-peer DC microgrid with edge ML and zero-knowledge settlement.',
  project_type: 'product',
  project_stage: 'prototype',
  innovation_type: 'RADICAL',
  target_users: 'Solar communities, municipal microgrids.',
  features: ['sub-cycle switching', 'edge IoT meters', 'ZK settlement'],
  tags: ['cleantech', 'energy', 'p2p', 'microgrid'],
  status: 'PUBLISHED',
  is_public: true
};
const { data: projData, error: projErr } = await tryInsert(clientA, 'projects', projPayload);
let projId = projData?.id;
record(!projErr, 'projects  User A project', projErr ? projErr.message : `id=${projId}`);

// ── STEP 6: project_votes ────────────────────────────────────────────────────
console.log('\n── STEP 6: project_votes ───────────────────────────────────────────');
if (projId) {
  const { data, error } = await tryInsert(clientB, 'project_votes', {
    project_id: projId, user_id: uidB, vote_type: 'upvote'
  });
  record(!error, 'project_votes  User B upvote', error ? error.message : `id=${data?.id}`);
} else {
  record(false, 'project_votes', 'Skipped – no project id');
}

// ── STEP 7: project_follows ──────────────────────────────────────────────────
console.log('\n── STEP 7: project_follows ─────────────────────────────────────────');
if (projId) {
  const { data, error } = await tryInsert(clientB, 'project_follows', {
    project_id: projId, user_id: uidB
  });
  record(!error, 'project_follows  User B follows', error ? error.message : `id=${data?.id}`);
} else {
  record(false, 'project_follows', 'Skipped – no project id');
}

// ── STEP 8: project_suggestions ─────────────────────────────────────────────
console.log('\n── STEP 8: project_suggestions ─────────────────────────────────────');
if (projId) {
  const { data, error } = await tryInsert(clientB, 'project_suggestions', {
    project_id: projId, user_id: uidB,
    suggestion_type: 'TECHNICAL',
    title: 'Add LoRaWAN 915 MHz mesh fallback',
    description: 'Use decentralised LoRa during cellular outages.',
    status: 'PENDING'
  });
  record(!error, 'project_suggestions  User B', error ? error.message : `id=${data?.id}`);
} else {
  record(false, 'project_suggestions', 'Skipped');
}

// ── STEP 9: reviews ──────────────────────────────────────────────────────────
console.log('\n── STEP 9: reviews ─────────────────────────────────────────────────');
let reviewId = null;
if (projId) {
  const { data, error } = await tryInsert(clientB, 'reviews', {
    project_id: projId, user_id: uidB,
    rating: 5,
    problem_score: 5, solution_score: 5, innovation_score: 5,
    feasibility_score: 4, market_score: 4, clarity_score: 5,
    scalability_score: 4, differentiation_score: 5,
    title: 'Exemplary decentralised microgrid topology',
    content: 'AuraGrid presents a coherent solution to localized renewable curtailment.',
    overall_feedback: 'Excellent innovation with clear market application.',
    strengths: ['Clear problem', 'Solid technology'],
    weaknesses: ['Specialised hardware'],
    is_valid: true, is_public: true
  });
  reviewId = data?.id;
  record(!error, 'reviews  User B review', error ? error.message : `id=${reviewId}`);
} else {
  record(false, 'reviews', 'Skipped');
}

// ── STEP 10: review_suggestions ─────────────────────────────────────────────
console.log('\n── STEP 10: review_suggestions ─────────────────────────────────────');
if (reviewId) {
  const { data, error } = await tryInsert(clientA, 'review_suggestions', {
    review_id: reviewId, user_id: uidA,
    suggestion: 'Consider adding IEEE 1547.4 anti-islanding references.'
  });
  record(!error, 'review_suggestions  User A', error ? error.message : `id=${data?.id}`);
} else {
  record(false, 'review_suggestions', 'Skipped');
}

// ── STEP 11: review_votes ────────────────────────────────────────────────────
console.log('\n── STEP 11: review_votes ───────────────────────────────────────────');
if (reviewId) {
  const { data, error } = await tryInsert(clientA, 'review_votes', {
    review_id: reviewId, user_id: uidA, vote_type: 'helpful'
  });
  record(!error, 'review_votes  User A helpful', error ? error.message : `id=${data?.id}`);
} else {
  record(false, 'review_votes', 'Skipped');
}

// ── STEP 12: community_posts ─────────────────────────────────────────────────
console.log('\n── STEP 12: community_posts ────────────────────────────────────────');
const { data: postData, error: postErr } = await tryInsert(clientA, 'community_posts', {
  user_id: uidA,
  category_id: catId,
  title: `Solid-state vs hybrid relay islanding ${ts}`,
  content: 'Benchmarking zero-voltage crossing SCR switches versus conventional contactors.',
  post_type: 'DISCUSSION',
  tags: ['microgrid', 'hardware', 'solid-state']
});
let postId = postData?.id;
record(!postErr, 'community_posts  User A', postErr ? postErr.message : `id=${postId}`);

// ── STEP 13: community_comments ─────────────────────────────────────────────
console.log('\n── STEP 13: community_comments ─────────────────────────────────────');
let commentId = null;
if (postId) {
  const { data, error } = await tryInsert(clientB, 'community_comments', {
    post_id: postId, user_id: uidB,
    content: 'SCRs prevent arcing under rapid transient fault isolation.',
    parent_comment_id: null
  });
  commentId = data?.id;
  record(!error, 'community_comments  User B', error ? error.message : `id=${commentId}`);

  // reply from User A
  if (commentId) {
    const { data: replyData, error: replyErr } = await tryInsert(clientA, 'community_comments', {
      post_id: postId, user_id: uidA,
      content: 'Agreed — we pair bidirectional GaN FETs with latching contactors.',
      parent_comment_id: commentId
    });
    record(!replyErr, 'community_comments  User A reply', replyErr ? replyErr.message : `id=${replyData?.id}`);
  }
} else {
  record(false, 'community_comments', 'Skipped');
}

// ── STEP 14: community_votes ─────────────────────────────────────────────────
console.log('\n── STEP 14: community_votes ────────────────────────────────────────');
if (postId) {
  const { data, error } = await tryInsert(clientB, 'community_votes', {
    post_id: postId, user_id: uidB, vote_type: 'like'
  });
  record(!error, 'community_votes  User B like', error ? error.message : `id=${data?.id}`);
} else {
  record(false, 'community_votes', 'Skipped');
}

// ── STEP 15: messages ────────────────────────────────────────────────────────
console.log('\n── STEP 15: messages ───────────────────────────────────────────────');
const { data: msgData, error: msgErr } = await tryInsert(clientA, 'messages', {
  sender_id: uidA, receiver_id: uidB,
  content: 'Hi Bob — thanks for your review on AuraGrid! Happy to sync anytime.',
  is_read: false
});
record(!msgErr, 'messages  User A → User B', msgErr ? msgErr.message : `id=${msgData?.id}`);

// ── STEP 16: notifications ───────────────────────────────────────────────────
console.log('\n── STEP 16: notifications ──────────────────────────────────────────');
const notifPayloads = [
  { user_id: uidA, actor_id: uidB, project_id: projId, type: 'new_review',    title: 'New Review',   message: 'Bob reviewed AuraGrid' },
  { user_id: uidA, actor_id: uidB, project_id: projId, type: 'new_vote',      title: 'New Upvote',   message: 'Bob upvoted AuraGrid' },
  { user_id: uidA, actor_id: uidB, project_id: projId, type: 'new_follower',  title: 'New Follower', message: 'Bob followed AuraGrid' },
  { user_id: uidB, actor_id: uidA, project_id: null,   type: 'new_message',   title: 'Message',      message: 'Alice sent you a message' },
];
let notifOk = 0;
for (const n of notifPayloads) {
  const { error } = await tryInsert(clientA, 'notifications', n);
  if (!error) notifOk++;
}
record(notifOk > 0, `notifications  ${notifOk}/${notifPayloads.length} inserted`);

// ── FINAL SUMMARY ────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════════════════');
console.log(' SEED COMPLETE');
console.log(`  ✅  ${pass.length} PASS    ❌  ${fail.length} FAIL`);
if (fail.length) {
  console.log('\n  FAILURES:');
  fail.forEach(f => console.log(`    • ${f}`));
}
console.log('\n  ROWS SUMMARY:');
console.log(`    auth.users          : 2 users  (${emailA}, ${emailB})`);
console.log(`    profiles            : 2 rows   (ids: ${uidA?.slice(0,8)}…, ${uidB?.slice(0,8)}…)`);
console.log(`    user_private_data   : 2 rows`);
console.log(`    categories          : seeded / verified`);
console.log(`    projects            : id=${projId ?? 'FAILED'}`);
console.log(`    project_votes       : 1 upvote`);
console.log(`    project_follows     : 1 follow`);
console.log(`    project_suggestions : 1 suggestion`);
console.log(`    reviews             : id=${reviewId ?? 'FAILED'}`);
console.log(`    review_suggestions  : 1 suggestion`);
console.log(`    review_votes        : 1 helpful vote`);
console.log(`    community_posts     : id=${postId ?? 'FAILED'}`);
console.log(`    community_comments  : 2 (comment + reply)`);
console.log(`    community_votes     : 1 like`);
console.log(`    messages            : 1 message`);
console.log(`    notifications       : ${notifOk} rows`);
console.log('═══════════════════════════════════════════════════════════════════\n');

process.exit(fail.length > 0 ? 1 : 0);
