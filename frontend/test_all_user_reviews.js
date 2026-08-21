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

  // Ensure profile row exists in public.profiles
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

async function testAllUserReviews() {
  console.log('================================================================');
  console.log('🧪 TESTING FETCHING REVIEWS FROM ALL USERS (PROJECT: BAYMAX)');
  console.log('================================================================\n');

  // 1. Authenticate three different users
  console.log('1. Authenticating Users A, B, and C...');
  const userA = await getAuthenticatedUser(clientA, 'alice.innovator@demo.innovexa.io', 'DemoPass123!', 'User A (Alice)');
  const userB = await getAuthenticatedUser(clientB, 'bob.evaluator@demo.innovexa.io', 'DemoPass123!', 'User B (Bob)');
  const userC = await getAuthenticatedUser(clientC, 'carol.analyst@demo.innovexa.io', 'DemoPass123!', 'User C (Carol)');

  console.log(`✓ User A authenticated: ${userA.email} (ID: ${userA.id})`);
  console.log(`✓ User B authenticated: ${userB.email} (ID: ${userB.id})`);
  console.log(`✓ User C authenticated: ${userC.email} (ID: ${userC.id})`);

  // 2. Create test project: BAYMAX
  console.log('\n2. Creating test project: "BAYMAX"...');
  const { data: project, error: projErr } = await clientA
    .from('projects')
    .insert({
      user_id: userA.id,
      category_id: '19b552c7-2ed6-44fe-9846-5d1501b1104f', // Healthcare
      title: 'BAYMAX Healthcare Assistant',
      description: 'Personal companion robot with autonomous diagnostic sensing and clinical triage capabilities.',
      project_type: 'product',
      launch_url: 'https://baymax.health',
      status: 'published'
    })
    .select()
    .single();

  if (projErr || !project) {
    console.error('Failed to create test project:', projErr);
    process.exit(1);
  }
  console.log(`✓ Project BAYMAX created with ID: ${project.id}`);

  // 3. User A submits review: 5 stars, "Very useful idea"
  console.log('\n3. User A submits review...');
  const { data: revA, error: errA } = await clientA
    .from('reviews')
    .insert({
      project_id: project.id,
      user_id: userA.id,
      rating: 5,
      content: 'Very useful idea'
    })
    .select()
    .single();
  if (errA) throw errA;
  console.log(`✓ User A review inserted: Rating ${revA.rating} ★ - "${revA.content}"`);

  // 4. User B submits review: 4 stars, "Good concept"
  console.log('\n4. User B submits review...');
  const { data: revB, error: errB } = await clientB
    .from('reviews')
    .insert({
      project_id: project.id,
      user_id: userB.id,
      rating: 4,
      content: 'Good concept'
    })
    .select()
    .single();
  if (errB) throw errB;
  console.log(`✓ User B review inserted: Rating ${revB.rating} ★ - "${revB.content}"`);

  // 5. User C submits review: 5 stars, "Excellent innovation"
  console.log('\n5. User C submits review...');
  const { data: revC, error: errC } = await clientC
    .from('reviews')
    .insert({
      project_id: project.id,
      user_id: userC.id,
      rating: 5,
      content: 'Excellent innovation'
    })
    .select()
    .single();
  if (errC) throw errC;
  console.log(`✓ User C review inserted: Rating ${revC.rating} ★ - "${revC.content}"`);

  // 6. Execute query to fetch ALL reviews for BAYMAX (using clientB to verify no user_id filtering)
  console.log('\n6. Fetching all reviews for BAYMAX using clientB...');
  const { data: reviews, error: fetchError } = await clientB
    .from("reviews")
    .select(`
      *,
      profiles (
        id,
        full_name
      )
    `)
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  if (fetchError) {
    console.error('Fetch reviews error:', fetchError);
    process.exit(1);
  }

  console.log(`\n✓ Retrieved ${reviews.length} reviews for project BAYMAX:`);
  console.log('------------------------------------------------------------');
  console.log(`PROJECT: ${project.title}\n`);

  reviews.forEach((r) => {
    const reviewer = r.profiles?.full_name || 'Anonymous Validator';
    const stars = '⭐'.repeat(r.rating || 5);
    console.log(`${reviewer} → ${stars}`);
    console.log(`"${r.content}"\n`);
  });

  // Verify all 3 reviews exist
  if (reviews.length !== 3) {
    throw new Error(`Expected 3 reviews, but got ${reviews.length}!`);
  }

  const reviewAuthors = reviews.map(r => r.user_id);
  if (!reviewAuthors.includes(userA.id)) throw new Error("Missing User A's review");
  if (!reviewAuthors.includes(userB.id)) throw new Error("Missing User B's review");
  if (!reviewAuthors.includes(userC.id)) throw new Error("Missing User C's review");

  console.log('✓ All three reviews from User A, User B, and User C appeared successfully!');

  // Cleanup test rows
  console.log('\nCleaning up test project and reviews...');
  await clientAdmin.from('reviews').delete().eq('project_id', project.id);
  await clientAdmin.from('projects').delete().eq('id', project.id);
  console.log('✓ Cleanup complete.');

  console.log('\n================================================================');
  console.log('🎉 ALL REVIEWS FROM MULTIPLE USERS FETCHED AND VERIFIED!');
  console.log('================================================================\n');
}

testAllUserReviews().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
