import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

async function runMultiUserSuite() {
  console.log('====================================================================');
  console.log('✦ MULTI-USER PROJECT VISIBILITY & SEPARATION VERIFICATION SUITE');
  console.log('====================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${testName}`);
    }
  }

  const rootClient = createClient(supabaseUrl, supabaseAnonKey);
  const stamp = Date.now();

  // ------------------------------------------------------------------
  // 1. SETUP USER A & USER B
  // ------------------------------------------------------------------
  console.log('STEP 1: CREATING USER A AND USER B ACCOUNTS...');
  const emailA = `user_a_${stamp}@innovexa.internal`;
  const emailB = `user_b_${stamp}@innovexa.internal`;
  const password = 'Password123!MultiUser';

  const { data: authA, error: authAErr } = await rootClient.auth.signUp({
    email: emailA,
    password,
    options: { data: { full_name: 'Dr. Alice Carter' } }
  });
  if (authAErr) throw authAErr;

  const { data: authB, error: authBErr } = await rootClient.auth.signUp({
    email: emailB,
    password,
    options: { data: { full_name: 'Bob Sterling' } }
  });
  if (authBErr) throw authBErr;

  const userAId = authA.user.id;
  const userBId = authB.user.id;
  const clientA = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${authA.session.access_token}` } }
  });
  const clientB = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${authB.session.access_token}` } }
  });

  // Ensure profiles exist
  await clientA.from('profiles').upsert([{ id: userAId, full_name: 'Dr. Alice Carter' }]);
  await clientB.from('profiles').upsert([{ id: userBId, full_name: 'Bob Sterling' }]);

  assert(userAId && userBId && userAId !== userBId, 'Unique User A and User B created');

  // ------------------------------------------------------------------
  // 2. USER A CREATES PROJECT A
  // ------------------------------------------------------------------
  console.log('\nSTEP 2: USER A CREATES PROJECT A...');
  const projectAPayload = {
    user_id: userAId,
    title: `CardioScan AI ${stamp}`,
    description: 'Real-time deep learning ECG telemetry for triage.',
    project_type: 'idea',
    status: 'published'
  };

  const { data: projA, error: errPA } = await clientA
    .from('projects')
    .insert([projectAPayload])
    .select()
    .single();

  assert(!errPA && projA && projA.id, 'Project A created successfully in Supabase');
  assert(projA.user_id === userAId, 'Project A user_id matches User A');

  // Check User A's "My Projects"
  const { data: myProjectsA } = await clientA.from('projects').select('*').eq('user_id', userAId);
  assert(myProjectsA.some(p => p.id === projA.id), 'User A sees Project A in My Projects');

  // Check User B's "My Projects" (Must NOT have Project A)
  const { data: myProjectsBInitial } = await clientB.from('projects').select('*').eq('user_id', userBId);
  assert(!myProjectsBInitial.some(p => p.id === projA.id), 'User B does NOT see Project A in My Projects');

  // ------------------------------------------------------------------
  // 3. USER B OPENS EXPLORE & CREATES PROJECT B
  // ------------------------------------------------------------------
  console.log('\nSTEP 3: USER B OPENS EXPLORE & CREATES PROJECT B...');
  
  // User B queries Explore (no user_id filter)
  const { data: exploreB1 } = await clientB.from('projects').select('*').order('created_at', { ascending: false });
  assert(exploreB1.some(p => p.id === projA.id), "User B SEES User A's Project A in Explore");

  // User B creates Project B
  const projectBPayload = {
    user_id: userBId,
    title: `EcoLogix Fleet Carbon ${stamp}`,
    description: 'Automated Scope 3 emissions audit ledger.',
    project_type: 'product',
    status: 'published'
  };

  const { data: projB, error: errPB } = await clientB
    .from('projects')
    .insert([projectBPayload])
    .select()
    .single();

  assert(!errPB && projB && projB.id, 'Project B created successfully in Supabase');
  assert(projB.user_id === userBId, 'Project B user_id matches User B');

  // Check User B's "My Projects"
  const { data: myProjectsB } = await clientB.from('projects').select('*').eq('user_id', userBId);
  assert(myProjectsB.some(p => p.id === projB.id), 'User B sees Project B in My Projects');
  assert(!myProjectsB.some(p => p.id === projA.id), 'User B My Projects contains only User B projects');

  // Check User A's "My Projects" (Must NOT have Project B)
  const { data: myProjectsA2 } = await clientA.from('projects').select('*').eq('user_id', userAId);
  assert(myProjectsA2.some(p => p.id === projA.id), 'User A My Projects contains Project A');
  assert(!myProjectsA2.some(p => p.id === projB.id), 'User A does NOT see Project B in My Projects');

  // ------------------------------------------------------------------
  // 4. USER A AND USER B OPEN EXPLORE (BOTH SEE A + B)
  // ------------------------------------------------------------------
  console.log('\nSTEP 4: EXPLORE VERIFICATION (USER A & USER B BOTH SEE A + B)...');

  const { data: exploreA } = await clientA.from('projects').select('*').order('created_at', { ascending: false });
  assert(exploreA.some(p => p.id === projA.id), "User A sees Project A in Explore");
  assert(exploreA.some(p => p.id === projB.id), "User A sees Project B in Explore");

  const { data: exploreB } = await clientB.from('projects').select('*').order('created_at', { ascending: false });
  assert(exploreB.some(p => p.id === projA.id), "User B sees Project A in Explore");
  assert(exploreB.some(p => p.id === projB.id), "User B sees Project B in Explore");

  // ------------------------------------------------------------------
  // 5. SECURITY & OWNERSHIP TEST (EDIT / DELETE PERMISSIONS)
  // ------------------------------------------------------------------
  console.log('\nSTEP 5: SECURITY & OWNERSHIP RLS POLICY VERIFICATION...');

  // User A edits Project A (Allowed)
  const { data: aEditA, error: aEditAErr } = await clientA
    .from('projects')
    .update({ title: `CardioScan AI Updated ${stamp}` })
    .eq('id', projA.id)
    .select();
  assert(!aEditAErr && aEditA?.length > 0, 'User A CAN edit Project A (Owner = YES)');

  // User B attempts to edit Project A (Forbidden by RLS)
  const { data: bEditA } = await clientB
    .from('projects')
    .update({ title: 'Hacked by User B' })
    .eq('id', projA.id)
    .select();
  assert(!bEditA || bEditA.length === 0, 'User B CANNOT edit Project A (Owner = NO)');

  // User B edits Project B (Allowed)
  const { data: bEditB, error: bEditBErr } = await clientB
    .from('projects')
    .update({ title: `EcoLogix Fleet Updated ${stamp}` })
    .eq('id', projB.id)
    .select();
  assert(!bEditBErr && bEditB?.length > 0, 'User B CAN edit Project B (Owner = YES)');

  // User A attempts to edit Project B (Forbidden by RLS)
  const { data: aEditB } = await clientA
    .from('projects')
    .update({ title: 'Hacked by User A' })
    .eq('id', projB.id)
    .select();
  assert(!aEditB || aEditB.length === 0, 'User A CANNOT edit Project B (Owner = NO)');

  // User B attempts to delete Project A (Forbidden by RLS)
  const { data: bDeleteA } = await clientB
    .from('projects')
    .delete()
    .eq('id', projA.id)
    .select();
  assert(!bDeleteA || bDeleteA.length === 0, 'User B CANNOT delete Project A (Owner = NO)');

  // User A attempts to delete Project B (Forbidden by RLS)
  const { data: aDeleteB } = await clientA
    .from('projects')
    .delete()
    .eq('id', projB.id)
    .select();
  assert(!aDeleteB || aDeleteB.length === 0, 'User A CANNOT delete Project B (Owner = NO)');

  // User A deletes Project A (Allowed)
  const { data: aDeleteA } = await clientA
    .from('projects')
    .delete()
    .eq('id', projA.id)
    .select();
  assert(aDeleteA && aDeleteA.length > 0, 'User A CAN delete Project A (Owner = YES)');

  // User B deletes Project B (Allowed)
  const { data: bDeleteB } = await clientB
    .from('projects')
    .delete()
    .eq('id', projB.id)
    .select();
  assert(bDeleteB && bDeleteB.length > 0, 'User B CAN delete Project B (Owner = YES)');

  console.log(`\n====================================================================`);
  console.log(`✦ MULTI-USER TEST RESULTS: ${passed}/${total} CHECKS PASSED (${Math.round((passed/total)*100)}%)`);
  console.log(`====================================================================\n`);

  if (passed === total) {
    console.log('🎉 ALL MULTI-USER PROJECT VISIBILITY & SEPARATION CHECKS PASSED!');
    process.exit(0);
  } else {
    console.error('❌ SOME CHECKS FAILED');
    process.exit(1);
  }
}

runMultiUserSuite();
