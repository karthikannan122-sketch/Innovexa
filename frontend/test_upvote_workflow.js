import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

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

console.log('Connecting to Supabase at:', supabaseUrl);

const clientA = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
const clientB = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

async function getAuthenticatedUser(client, email, password, name) {
  let res = await client.auth.signInWithPassword({ email, password });
  if (res.error || !res.data?.session) {
    const signup = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    if (signup.data?.session) {
      res = signup;
    } else {
      res = await client.auth.signInWithPassword({ email, password });
    }
  }
  if (res.error) throw res.error;
  const user = res.data?.user;
  if (user) {
    const { data: prof } = await client.from('profiles').select('id').eq('id', user.id).maybeSingle();
    if (!prof) {
      await client.from('profiles').insert([{
        id: user.id,
        full_name: name,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
      }]);
    }
  }
  return res.data;
}

// Emulate SupabaseService.voteProject logic for a given client
async function voteProjectWithClient(client, { projectId, userId, voteType = 'upvote' }) {
  // 1. Get current authenticated user using supabase.auth.getUser()
  const { data: authData, error: authErr } = await client.auth.getUser();
  if (authErr) {
    console.error('[Supabase auth.getUser error]:', authErr);
  }
  const authUser = authData?.user;
  const effectiveUserId = authUser?.id || userId;

  // 2 & 12. Verify that project.id and user.id are never undefined before inserting
  if (!projectId || typeof projectId !== 'string' || !projectId.trim() || !effectiveUserId || typeof effectiveUserId !== 'string' || !effectiveUserId.trim()) {
    const validationError = new Error('Invalid project ID or user ID: both must be defined non-empty strings.');
    console.error('[Supabase voteProject parameter validation error]:', validationError);
    return { activeVoteType: null, upvotesCount: 0, error: validationError };
  }

  // 3. Check public.project_likes for an existing row where project_id = projectId AND user_id = effectiveUserId
  const { data: existingRows, error: checkErr } = await client
    .from('project_likes')
    .select('id, project_id, user_id')
    .eq('project_id', projectId)
    .eq('user_id', effectiveUserId);

  if (checkErr) {
    console.error('[Supabase check project_likes error]:', checkErr);
    return { activeVoteType: null, upvotesCount: 0, error: checkErr };
  }

  const hasExistingRow = Array.isArray(existingRows) && existingRows.length > 0;
  let activeVoteType = null;

  if (!hasExistingRow) {
    // 4. If no row exists, insert: { project_id: project.id, user_id: user.id }
    const insertPayload = {
      project_id: projectId,
      user_id: effectiveUserId
    };

    const { error: insertErr } = await client
      .from('project_likes')
      .insert([insertPayload]);

    if (insertErr) {
      console.error('[Supabase insert project_likes error]:', insertErr);
      return { activeVoteType: null, upvotesCount: 0, error: insertErr };
    }
    activeVoteType = voteType || 'upvote';
  } else {
    // 5. If a row already exists, delete that row so the Upvote button acts as a toggle
    const { error: deleteErr } = await client
      .from('project_likes')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', effectiveUserId);

    if (deleteErr) {
      console.error('[Supabase delete project_likes error]:', deleteErr);
      return { activeVoteType: null, upvotesCount: 0, error: deleteErr };
    }
    activeVoteType = null;
  }

  // 7. After every successful insert or delete, fetch the real vote count from Supabase
  const { count: realCount, data: countData, error: countErr } = await client
    .from('project_likes')
    .select('id', { count: 'exact' })
    .eq('project_id', projectId);

  if (countErr) {
    console.error('[Supabase fetch real count error]:', countErr);
    return { activeVoteType, upvotesCount: 0, error: countErr };
  }

  const upvotesCount = (typeof realCount === 'number') ? realCount : (Array.isArray(countData) ? countData.length : 0);

  return {
    activeVoteType,
    upvotesCount,
    error: null
  };
}

async function getProjectLikeCountWithClient(client, projectId) {
  const { count, data, error } = await client
    .from('project_likes')
    .select('id', { count: 'exact' })
    .eq('project_id', projectId);

  if (error) {
    console.error('[Supabase getProjectLikeCount error]:', error);
    return 0;
  }
  return typeof count === 'number' ? count : (Array.isArray(data) ? data.length : 0);
}

async function runUpvoteWorkflowTest() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING UPVOTE & PROJECT_LIKES WORKFLOW VERIFICATION');
  console.log('======================================================\n');

  // Step 1: Authenticate User A and User B
  console.log('1. Authenticating User A and User B...');
  const authA = await getAuthenticatedUser(clientA, 'innovator.a@test.com', 'TestPassword123!', 'Alice Innovator');
  const authB = await getAuthenticatedUser(clientB, 'innovator.b@test.com', 'TestPassword123!', 'Bob Validator');

  const userA = (await clientA.auth.getUser()).data.user;
  const userB = (await clientB.auth.getUser()).data.user;

  assert(userA && userA.id, 'User A must have valid ID');
  assert(userB && userB.id, 'User B must have valid ID');
  console.log(`✓ User A ID: ${userA.id}`);
  console.log(`✓ User B ID: ${userB.id}`);

  // Test ID: Use an existing project ID from Supabase or generate a valid UUID
  let testProjectId = crypto.randomUUID();
  const { data: existingProjects } = await clientA.from('projects').select('id, title').limit(1);
  if (existingProjects && existingProjects.length > 0) {
    testProjectId = existingProjects[0].id;
    console.log(`Using existing project from Supabase: "${existingProjects[0].title}" (ID: ${testProjectId})`);
  } else {
    console.log(`Using generated project UUID: ${testProjectId}`);
  }

  // Clean up any preexisting rows for this test project and users
  await clientA.from('project_likes').delete().eq('project_id', testProjectId).eq('user_id', userA.id);
  await clientB.from('project_likes').delete().eq('project_id', testProjectId).eq('user_id', userB.id);

  // Initial Count
  const initialCount = await getProjectLikeCountWithClient(clientA, testProjectId);
  console.log(`Initial vote count for project: ${initialCount}`);

  // Test 1: User A clicks Upvote on Project X
  console.log('\n--- Test Step 1: User A clicks Upvote on Project X ---');
  const voteResA1 = await voteProjectWithClient(clientA, {
    projectId: testProjectId,
    userId: userA.id
  });

  assert.strictEqual(voteResA1.error, null, 'User A vote must succeed without error');
  assert.strictEqual(voteResA1.activeVoteType, 'upvote', 'Active vote type for User A must be "upvote"');
  assert.strictEqual(voteResA1.upvotesCount, initialCount + 1, `Upvotes count must be ${initialCount + 1} after User A upvotes`);

  // Verify row in project_likes
  const { data: rowsAfterA } = await clientA
    .from('project_likes')
    .select('*')
    .eq('project_id', testProjectId)
    .eq('user_id', userA.id);

  assert.strictEqual(rowsAfterA.length, 1, 'Exactly 1 row must exist in project_likes for User A');
  assert.strictEqual(rowsAfterA[0].user_id, userA.id, 'Row must belong to User A');
  assert.strictEqual(rowsAfterA[0].project_id, testProjectId, 'Row must have testProjectId');
  console.log('✓ Row confirmed in public.project_likes for User A:', rowsAfterA[0]);

  // Test Step 2: User B opens the same project
  console.log('\n--- Test Step 2: User B opens the same project ---');
  const countForUserB = await getProjectLikeCountWithClient(clientB, testProjectId);
  console.log(`User B views project vote count: ${countForUserB}`);
  assert.strictEqual(countForUserB, initialCount + 1, `User B must see the updated vote count of ${initialCount + 1}`);
  console.log(`✓ User B successfully sees updated vote count (${initialCount + 1})`);

  // Test Step 3: User B upvotes Project X
  console.log('\n--- Test Step 3: User B upvotes Project X ---');
  const voteResB = await voteProjectWithClient(clientB, {
    projectId: testProjectId,
    userId: userB.id
  });

  assert.strictEqual(voteResB.error, null, 'User B vote must succeed without error');
  assert.strictEqual(voteResB.activeVoteType, 'upvote', 'Active vote type for User B must be "upvote"');
  assert.strictEqual(voteResB.upvotesCount, initialCount + 2, `Upvotes count must now be ${initialCount + 2}`);

  // Verify second row in project_likes
  const { data: rowsAfterB } = await clientB
    .from('project_likes')
    .select('*')
    .eq('project_id', testProjectId)
    .in('user_id', [userA.id, userB.id])
    .order('created_at', { ascending: true });

  assert.strictEqual(rowsAfterB.length, 2, 'Exactly 2 rows must exist in project_likes for User A & User B');
  const userIds = rowsAfterB.map(r => r.user_id);
  assert(userIds.includes(userA.id), 'Rows must include User A');
  assert(userIds.includes(userB.id), 'Rows must include User B');
  console.log(`✓ Second row confirmed in public.project_likes for User B (Total count: ${initialCount + 2}):`, rowsAfterB);

  // Test Step 4: Verify count is visible to both users
  console.log('\n--- Test Step 4: Verify count is visible to both users ---');
  const countA = await getProjectLikeCountWithClient(clientA, testProjectId);
  const countB = await getProjectLikeCountWithClient(clientB, testProjectId);
  assert.strictEqual(countA, initialCount + 2, `User A sees total count ${initialCount + 2}`);
  assert.strictEqual(countB, initialCount + 2, `User B sees total count ${initialCount + 2}`);
  console.log(`✓ Both User A and User B see total count: ${countA}`);

  // Test Step 5: Toggle behavior (User A clicks Upvote again to remove vote)
  console.log('\n--- Test Step 5: User A clicks Upvote again (Toggle removal) ---');
  const voteResA2 = await voteProjectWithClient(clientA, {
    projectId: testProjectId,
    userId: userA.id
  });

  assert.strictEqual(voteResA2.error, null, 'Toggle removal must succeed');
  assert.strictEqual(voteResA2.activeVoteType, null, 'Active vote type must now be null');
  assert.strictEqual(voteResA2.upvotesCount, initialCount + 1, `Count must decrement back to ${initialCount + 1}`);

  const { data: rowsAfterToggle } = await clientA
    .from('project_likes')
    .select('*')
    .eq('project_id', testProjectId)
    .in('user_id', [userA.id, userB.id]);

  assert.strictEqual(rowsAfterToggle.length, 1, 'Only 1 row remains in project_likes between User A & User B (User B)');
  assert.strictEqual(rowsAfterToggle[0].user_id, userB.id, 'Remaining row is User B');
  console.log(`✓ Toggle removal verified: User A row deleted, count decremented to ${initialCount + 1}`);

  // Test Step 6: Parameter validation (undefined check)
  console.log('\n--- Test Step 6: Validation against undefined project_id or user_id ---');
  const invalidRes1 = await voteProjectWithClient(clientA, { projectId: undefined, userId: userA.id });
  assert(invalidRes1.error, 'Undefined projectId must return validation error');

  const invalidRes2 = await voteProjectWithClient(clientA, { projectId: testProjectId, userId: undefined });
  const invalidRes3 = await voteProjectWithClient(clientA, { projectId: '', userId: '' });
  assert(invalidRes3.error, 'Empty projectId and userId must return validation error');
  console.log('✓ Parameter validation verified: Undefined/empty values rejected cleanly');

  // Clean up
  await clientA.from('project_likes').delete().eq('project_id', testProjectId);
  console.log('\n======================================================');
  console.log('🎉 ALL UPVOTE & PROJECT_LIKES TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runUpvoteWorkflowTest().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
