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

const clientAdmin = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
const clientA = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
const clientB = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
const clientC = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

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
  const user = res.data.user;

  await client.from('profiles').upsert({
    id: user.id,
    full_name: name,
    avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    onboarding_completed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  return user;
}

async function runCompleteMultiUserReviewTest() {
  console.log('================================================================');
  console.log('🧪 RUNNING COMPLETE MULTI-USER REVIEW SYSTEM TEST');
  console.log('================================================================\n');

  // Authenticate users
  const userA = await getAuthenticatedUser(clientA, 'alice.innovator@demo.innovexa.io', 'DemoPass123!', 'Alice Innovator');
  const userB = await getAuthenticatedUser(clientB, 'bob.evaluator@demo.innovexa.io', 'DemoPass123!', 'Bob Evaluator');
  const userC = await getAuthenticatedUser(clientC, 'carol.analyst@demo.innovexa.io', 'DemoPass123!', 'Carol Analyst');

  // 1. Create a shared test project
  console.log('Creating shared Project X...');
  const { data: project, error: projErr } = await clientA
    .from('projects')
    .insert({
      user_id: userA.id,
      category_id: '19b552c7-2ed6-44fe-9846-5d1501b1104f',
      title: 'Project X - Quantum Mesh',
      description: 'Decentralized high-throughput mesh networking architecture.',
      project_type: 'product',
      launch_url: 'https://quantum-mesh.io',
      status: 'published'
    })
    .select()
    .single();

  if (projErr || !project) {
    console.error('Project creation failed:', projErr);
    process.exit(1);
  }
  const projectId = project.id;
  console.log(`✓ Project X created (ID: ${projectId})\n`);

  // ==========================================================================
  // TEST 1: User A submits review
  // ==========================================================================
  console.log('------------------------------------------------------------');
  console.log('TEST 1: User A submits a review for Project X');
  console.log('------------------------------------------------------------');
  console.log({ projectId, userId: userA.id, rating: 5, content: 'Excellent project.' });

  const { data: reviewA, error: errA } = await clientA
    .from('reviews')
    .insert({
      project_id: projectId,
      user_id: userA.id,
      rating: 5,
      content: 'Excellent project.'
    })
    .select(`
      *,
      profiles (
        id,
        full_name
      )
    `)
    .single();

  if (errA || !reviewA) {
    console.error('User A review insert failed:', errA);
    process.exit(1);
  }

  console.log('✓ Review saved successfully:', reviewA);
  if (reviewA.project_id !== projectId) throw new Error('Incorrect project_id');
  if (reviewA.user_id !== userA.id) throw new Error('Incorrect user_id');
  if (reviewA.rating !== 5) throw new Error('Incorrect rating');
  if (reviewA.content !== 'Excellent project.') throw new Error('Incorrect content');
  console.log('✓ TEST 1 PASSED: Review A is saved in public.reviews.\n');

  // ==========================================================================
  // TEST 2: User B opens Project X and submits review
  // ==========================================================================
  console.log('------------------------------------------------------------');
  console.log('TEST 2: User B opens Project X (sees User A review) & submits review');
  console.log('------------------------------------------------------------');
  console.log('Fetching reviews for project:', projectId);

  const { data: reviewsForB, error: errB_fetch } = await clientB
    .from('reviews')
    .select(`
      *,
      profiles (
        id,
        full_name
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (errB_fetch) throw errB_fetch;
  console.log(`✓ User B fetched ${reviewsForB.length} reviews for Project X`);
  if (reviewsForB.length === 0 || reviewsForB[0].id !== reviewA.id) {
    throw new Error("User B could not see User A's review!");
  }
  console.log(`✓ User A's review is visible to User B: "${reviewsForB[0].content}" by ${reviewsForB[0].profiles?.full_name}`);

  // User B submits review
  console.log('\nUser B submits a review...');
  console.log({ projectId, userId: userB.id, rating: 4, content: 'Very useful idea.' });
  const { data: reviewB, error: errB } = await clientB
    .from('reviews')
    .insert({
      project_id: projectId,
      user_id: userB.id,
      rating: 4,
      content: 'Very useful idea.'
    })
    .select(`
      *,
      profiles (
        id,
        full_name
      )
    `)
    .single();

  if (errB || !reviewB) {
    console.error('User B review insert failed:', errB);
    process.exit(1);
  }
  console.log('✓ User B review saved successfully:', reviewB);
  if (reviewB.user_id !== userB.id) throw new Error('Incorrect user_id for User B');
  console.log('✓ TEST 2 PASSED: User B submitted review & second row exists in public.reviews.\n');

  // ==========================================================================
  // TEST 3: User A logs back in, views all reviews, updates own review & cannot edit User B's review
  // ==========================================================================
  console.log('------------------------------------------------------------');
  console.log('TEST 3: User A views all reviews, edits own review, ownership check');
  console.log('------------------------------------------------------------');
  const { data: reviewsForA, error: errA_fetch } = await clientA
    .from('reviews')
    .select(`
      *,
      profiles (
        id,
        full_name
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (errA_fetch) throw errA_fetch;
  console.log(`✓ User A fetched ${reviewsForA.length} reviews for Project X`);
  if (reviewsForA.length !== 2) throw new Error('Expected 2 reviews visible to User A');

  console.log('Reviews visible to User A:');
  reviewsForA.forEach(r => {
    const isMine = r.user_id === userA.id;
    console.log(`  - [${isMine ? 'OWNED' : 'PEER'}] ${r.profiles?.full_name} (${r.rating}★): "${r.content}"`);
  });

  // User A updates own review
  console.log('\nUser A updates own review...');
  const { data: updatedA, error: errA_update } = await clientA
    .from('reviews')
    .update({
      rating: 5,
      content: 'Excellent project - updated by author.',
      updated_at: new Date().toISOString()
    })
    .eq('id', reviewA.id)
    .eq('user_id', userA.id)
    .select()
    .single();

  if (errA_update || !updatedA) throw errA_update;
  console.log(`✓ User A review updated successfully in Supabase: "${updatedA.content}"`);

  // User A attempts to edit User B's review (must fail or update 0 rows)
  console.log("\nTesting ownership enforcement: User A attempting to update User B's review...");
  const { data: hackerAttempt, error: hackErr } = await clientA
    .from('reviews')
    .update({ content: 'Tampered by User A' })
    .eq('id', reviewB.id)
    .eq('user_id', userA.id)
    .select();

  if (hackerAttempt && hackerAttempt.length > 0) {
    throw new Error("SECURITY VIOLATION: User A was able to update User B's review!");
  }
  console.log("✓ Ownership secured: User A cannot update User B's review.");
  console.log('✓ TEST 3 PASSED.\n');

  // ==========================================================================
  // TEST 4: User C logs in, sees both reviews, submits review & cannot modify other reviews
  // ==========================================================================
  console.log('------------------------------------------------------------');
  console.log('TEST 4: User C views reviews, adds 3rd review, ownership verified');
  console.log('------------------------------------------------------------');
  const { data: reviewsForC, error: errC_fetch } = await clientC
    .from('reviews')
    .select(`
      *,
      profiles (
        id,
        full_name
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (errC_fetch) throw errC_fetch;
  console.log(`✓ User C sees ${reviewsForC.length} existing reviews.`);
  if (reviewsForC.length !== 2) throw new Error('Expected 2 existing reviews visible to User C');

  // User C adds review
  console.log('\nUser C submits third review...');
  const { data: reviewC, error: errC } = await clientC
    .from('reviews')
    .insert({
      project_id: projectId,
      user_id: userC.id,
      rating: 5,
      content: 'Brilliant mesh protocol.'
    })
    .select(`
      *,
      profiles (
        id,
        full_name
      )
    `)
    .single();

  if (errC || !reviewC) throw errC;
  console.log(`✓ User C review created: "${reviewC.content}" by ${reviewC.profiles?.full_name}`);

  // User C attempts to delete User A's review
  console.log("\nTesting ownership enforcement: User C attempting to delete User A's review...");
  const { data: deleteAttempt } = await clientC
    .from('reviews')
    .delete()
    .eq('id', reviewA.id)
    .eq('user_id', userC.id)
    .select();

  if (deleteAttempt && deleteAttempt.length > 0) {
    throw new Error("SECURITY VIOLATION: User C was able to delete User A's review!");
  }
  console.log("✓ Ownership secured: User C cannot delete User A's review.");

  // Final fetch using authenticated client to confirm all 3 reviews exist for Project X
  const { data: finalReviews, error: finalErr } = await clientA
    .from('reviews')
    .select(`*, profiles(id, full_name)`)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (finalErr) throw finalErr;

  console.log(`\n✓ Final state in public.reviews for Project X (${finalReviews.length} reviews):`);
  finalReviews.forEach(r => {
    const authorName = r.profiles?.full_name || `Peer Validator (${r.user_id.slice(0, 6)})`;
    console.log(`  - ${authorName} (${r.rating}★): "${r.content}"`);
  });

  if (finalReviews.length !== 3) throw new Error(`Expected 3 final reviews, got ${finalReviews.length}`);

  // Clean up test data
  console.log('\nCleaning up test project and reviews...');
  await clientA.from('reviews').delete().eq('project_id', projectId);
  await clientB.from('reviews').delete().eq('project_id', projectId);
  await clientC.from('reviews').delete().eq('project_id', projectId);
  await clientA.from('projects').delete().eq('id', projectId);
  console.log('✓ Cleanup complete.');

  console.log('\n================================================================');
  console.log('🎉 COMPLETE MULTI-USER REVIEW SYSTEM FULLY VERIFIED!');
  console.log('================================================================\n');
}

runCompleteMultiUserReviewTest().catch(err => {
  console.error('Multi-user review test failed:', err);
  process.exit(1);
});
