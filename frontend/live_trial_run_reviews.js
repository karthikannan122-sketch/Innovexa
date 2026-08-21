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

async function runLiveTrialRun() {
  console.log('========================================================================');
  console.log('🚀 LIVE TRIAL RUN: MULTI-USER REVIEW SUBMISSION & CROSS-USER REFLECTION');
  console.log('========================================================================\n');

  // 1. Authenticate 3 distinct users
  console.log('Step 1: Authenticating distinct user accounts...');
  const userA = await getAuthenticatedUser(clientA, 'alice.innovator@demo.innovexa.io', 'DemoPass123!', 'Alice Innovator');
  const userB = await getAuthenticatedUser(clientB, 'bob.evaluator@demo.innovexa.io', 'DemoPass123!', 'Bob Evaluator');
  const userC = await getAuthenticatedUser(clientC, 'carol.analyst@demo.innovexa.io', 'DemoPass123!', 'Carol Analyst');

  console.log(`✓ User A: ${userA.email} (UUID: ${userA.id})`);
  console.log(`✓ User B: ${userB.email} (UUID: ${userB.id})`);
  console.log(`✓ User C: ${userC.email} (UUID: ${userC.id})`);

  // Target project in database: "line by line"
  const projectId = 'e836ef1c-7bb2-462a-bcf1-6cdb97463ea4';
  const { data: projectData } = await clientA
    .from('projects')
    .select('id, title, categories(name)')
    .eq('id', projectId)
    .single();

  console.log(`\nTarget Project: "${projectData.title}" (ID: ${projectId}) | Category: ${projectData.categories?.name || 'Education'}\n`);

  // Clean prior test reviews on this project to demonstrate a clean trial
  console.log('Resetting test reviews on project...');
  await clientA.from('reviews').delete().eq('project_id', projectId);
  await clientB.from('reviews').delete().eq('project_id', projectId);
  await clientC.from('reviews').delete().eq('project_id', projectId);
  console.log('✓ Project reviews cleared for clean trial demonstration.\n');

  // ==========================================================================
  // PHASE 1: User A submits review
  // ==========================================================================
  console.log('------------------------------------------------------------------------');
  console.log('PHASE 1: USER A (Alice) SUBMITS REVIEW');
  console.log('------------------------------------------------------------------------');
  console.log({
    projectId,
    userId: userA.id,
    rating: 5,
    content: 'Brilliant educational platform with intuitive step-by-step guidance.'
  });

  const { data: revA, error: errA } = await clientA
    .from('reviews')
    .insert({
      project_id: projectId,
      user_id: userA.id,
      rating: 5,
      content: 'Brilliant educational platform with intuitive step-by-step guidance.'
    })
    .select(`
      *,
      profiles (
        id,
        full_name
      )
    `)
    .single();

  if (errA || !revA) {
    console.error('User A review insertion failed:', errA);
    process.exit(1);
  }
  console.log('✓ Review saved in Supabase database:');
  console.log(`  - Review ID: ${revA.id}`);
  console.log(`  - Project ID: ${revA.project_id}`);
  console.log(`  - User ID: ${revA.user_id}`);
  console.log(`  - Rating: ${revA.rating} ★`);
  console.log(`  - Content: "${revA.content}"`);
  console.log(`  - Created At: ${revA.created_at}\n`);

  // ==========================================================================
  // PHASE 2: User B opens Project & sees User A's review, then submits review
  // ==========================================================================
  console.log('------------------------------------------------------------------------');
  console.log('PHASE 2: USER B (Bob) OPENS THE SAME PROJECT (CROSS-USER VISIBILITY)');
  console.log('------------------------------------------------------------------------');
  console.log(`Querying Supabase as User B: SELECT * FROM reviews WHERE project_id = '${projectId}'`);

  const { data: reviewsSeenByB, error: errB_get } = await clientB
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

  if (errB_get) throw errB_get;

  console.log(`✓ User B sees ${reviewsSeenByB.length} review(s) in Supabase:`);
  reviewsSeenByB.forEach((r, idx) => {
    console.log(`  [${idx + 1}] Reviewer UUID: ${r.user_id} (${r.rating}★) → "${r.content}"`);
  });

  if (reviewsSeenByB.length !== 1 || reviewsSeenByB[0].id !== revA.id) {
    throw new Error('User B could not see User A\'s review!');
  }
  console.log('✓ Cross-user visibility confirmed: User B can see User A\'s review in database.');

  console.log('\nUser B now writes and submits a review...');
  console.log({
    projectId,
    userId: userB.id,
    rating: 4,
    content: 'Great interactive approach. Consider adding more automated practice problems.'
  });

  const { data: revB, error: errB } = await clientB
    .from('reviews')
    .insert({
      project_id: projectId,
      user_id: userB.id,
      rating: 4,
      content: 'Great interactive approach. Consider adding more automated practice problems.'
    })
    .select(`
      *,
      profiles (
        id,
        full_name
      )
    `)
    .single();

  if (errB || !revB) {
    console.error('User B review insertion failed:', errB);
    process.exit(1);
  }
  console.log('✓ User B review saved in Supabase database:');
  console.log(`  - Review ID: ${revB.id}`);
  console.log(`  - Project ID: ${revB.project_id}`);
  console.log(`  - User ID: ${revB.user_id}`);
  console.log(`  - Rating: ${revB.rating} ★`);
  console.log(`  - Content: "${revB.content}"\n`);

  // ==========================================================================
  // PHASE 3: User C opens Project, sees BOTH reviews, and submits a 3rd review
  // ==========================================================================
  console.log('------------------------------------------------------------------------');
  console.log('PHASE 3: USER C (Carol) OPENS THE SAME PROJECT (MULTI-USER REFLECTION)');
  console.log('------------------------------------------------------------------------');
  console.log(`Querying Supabase as User C: SELECT * FROM reviews WHERE project_id = '${projectId}'`);

  const { data: reviewsSeenByC, error: errC_get } = await clientC
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

  if (errC_get) throw errC_get;

  console.log(`✓ User C sees ${reviewsSeenByC.length} review(s) in Supabase:`);
  reviewsSeenByC.forEach((r, idx) => {
    console.log(`  [${idx + 1}] Reviewer UUID: ${r.user_id} (${r.rating}★) → "${r.content}"`);
  });

  if (reviewsSeenByC.length !== 2) {
    throw new Error('User C did not see both User A and User B reviews!');
  }
  console.log('✓ Multi-user reflection confirmed: User C sees both prior reviews.');

  console.log('\nUser C now writes and submits a 3rd review...');
  console.log({
    projectId,
    userId: userC.id,
    rating: 5,
    content: 'High value for autonomous learning and mastery tracking.'
  });

  const { data: revC, error: errC } = await clientC
    .from('reviews')
    .insert({
      project_id: projectId,
      user_id: userC.id,
      rating: 5,
      content: 'High value for autonomous learning and mastery tracking.'
    })
    .select(`
      *,
      profiles (
        id,
        full_name
      )
    `)
    .single();

  if (errC || !revC) {
    console.error('User C review insertion failed:', errC);
    process.exit(1);
  }
  console.log('✓ User C review saved in Supabase database:');
  console.log(`  - Review ID: ${revC.id}`);
  console.log(`  - Project ID: ${revC.project_id}`);
  console.log(`  - User ID: ${revC.user_id}`);
  console.log(`  - Rating: ${revC.rating} ★`);
  console.log(`  - Content: "${revC.content}"\n`);

  // ==========================================================================
  // PHASE 4: Verification from All 3 User Sessions
  // ==========================================================================
  console.log('------------------------------------------------------------------------');
  console.log('PHASE 4: FINAL CROSS-USER VERIFICATION (ALICE, BOB, AND CAROL)');
  console.log('------------------------------------------------------------------------');

  const [resA, resB, resC] = await Promise.all([
    clientA.from('reviews').select('id, user_id, rating, content, created_at').eq('project_id', projectId).order('created_at', { ascending: false }),
    clientB.from('reviews').select('id, user_id, rating, content, created_at').eq('project_id', projectId).order('created_at', { ascending: false }),
    clientC.from('reviews').select('id, user_id, rating, content, created_at').eq('project_id', projectId).order('created_at', { ascending: false })
  ]);

  console.log(`✓ Alice sees: ${resA.data.length} reviews`);
  console.log(`✓ Bob sees:   ${resB.data.length} reviews`);
  console.log(`✓ Carol sees: ${resC.data.length} reviews`);

  if (resA.data.length !== 3 || resB.data.length !== 3 || resC.data.length !== 3) {
    throw new Error('Mismatch in review count across user sessions!');
  }

  console.log('\n========================================================================');
  console.log('📊 LIVE DATABASE STATE: public.reviews for Project "line by line":');
  console.log('========================================================================');
  resA.data.forEach((r, i) => {
    let authorName = 'Carol Analyst (User C)';
    if (r.user_id === userA.id) authorName = 'Alice Innovator (User A)';
    if (r.user_id === userB.id) authorName = 'Bob Evaluator (User B)';
    console.log(`[Review ${i + 1}] ID: ${r.id}`);
    console.log(`  Author:   ${authorName} (UUID: ${r.user_id})`);
    console.log(`  Rating:   ${r.rating} ★`);
    console.log(`  Content:  "${r.content}"`);
    console.log(`  Saved At: ${r.created_at}`);
    console.log('------------------------------------------------------------------------');
  });

  console.log('\n========================================================================');
  console.log('🎉 LIVE TRIAL RUN COMPLETED WITH 100% SUCCESS!');
  console.log('========================================================================\n');
}

runLiveTrialRun().catch(err => {
  console.error('Live trial run error:', err);
  process.exit(1);
});
