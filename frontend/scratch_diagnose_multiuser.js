import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

async function diagnose() {
  console.log('=== MULTI-USER SUPABASE DIAGNOSTIC ===\n');

  const rootClient = createClient(supabaseUrl, supabaseAnonKey);

  // 1. Sign in or sign up User A and User B
  const emailA = `test_a_${Date.now()}@innovexa.internal`;
  const emailB = `test_b_${Date.now()}@innovexa.internal`;
  const password = 'Password123!Test';

  console.log('1. Creating Test User A and User B...');
  const { data: authA, error: errA } = await rootClient.auth.signUp({
    email: emailA,
    password: password,
    options: { data: { full_name: 'Tester Alpha' } }
  });

  const { data: authB, error: errB } = await rootClient.auth.signUp({
    email: emailB,
    password: password,
    options: { data: { full_name: 'Tester Beta' } }
  });

  if (!authA?.session || !authB?.session) {
    console.error('Failed auth setup:', { errA, errB });
    return;
  }

  const tokenA = authA.session.access_token;
  const userAId = authA.user.id;
  const tokenB = authB.session.access_token;
  const userBId = authB.user.id;

  console.log(`User A ID: ${userAId}`);
  console.log(`User B ID: ${userBId}`);

  // Create authenticated clients
  const clientA = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${tokenA}` } }
  });

  const clientB = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${tokenB}` } }
  });

  // Ensure profiles exist for both users
  console.log('\n1b. Creating profiles for User A and User B...');
  const { error: profAErr } = await clientA.from('profiles').upsert([{
    id: userAId,
    full_name: 'Tester Alpha',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=TesterAlpha'
  }]);
  if (profAErr) console.error('Profile A create error:', profAErr);

  const { error: profBErr } = await clientB.from('profiles').upsert([{
    id: userBId,
    full_name: 'Tester Beta',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=TesterBeta'
  }]);
  if (profBErr) console.error('Profile B create error:', profBErr);

  // 2. User A creates a project
  console.log('\n2. User A inserting project into Supabase...');
  const { data: projA, error: projAErr } = await clientA
    .from('projects')
    .insert([{
      user_id: userAId,
      title: 'Alpha MultiUser Test Project',
      description: 'A test project created by User A to test visibility for User B.',
      project_type: 'idea',
      status: 'published'
    }])
    .select()
    .single();

  if (projAErr) {
    console.error('User A project insert failed:', projAErr);
    return;
  }
  console.log('Project created successfully by User A:', { id: projA.id, title: projA.title, status: projA.status, user_id: projA.user_id });

  // 3. User B queries projects table directly
  console.log('\n3. User B querying public.projects...');
  const { data: bRawProjects, error: bRawErr } = await clientB
    .from('projects')
    .select('*');

  console.log(`User B raw select returned ${bRawProjects?.length || 0} projects. Error:`, bRawErr);
  const foundInRaw = bRawProjects?.some(p => p.id === projA.id);
  console.log(`Did User B find User A's project in raw select? ${foundInRaw ? '✅ YES' : '❌ NO'}`);

  // 4. User B queries with join on profiles & categories (as used in supabaseService.js)
  console.log('\n4. User B querying with join on profiles & categories (supabaseService.getProjects query)...');
  const { data: bJoinedProjects, error: bJoinErr } = await clientB
    .from('projects')
    .select(`
      *,
      profiles:user_id (id, full_name, avatar_url),
      categories:category_id (id, name)
    `);

  console.log(`User B joined select returned ${bJoinedProjects?.length || 0} projects. Error:`, bJoinErr);
  const foundInJoin = bJoinedProjects?.some(p => p.id === projA.id);
  console.log(`Did User B find User A's project in joined select? ${foundInJoin ? '✅ YES' : '❌ NO'}`);

  // 5. Test My Projects query for User B
  console.log('\n5. User B querying My Projects (.eq("user_id", userBId))...');
  const { data: bMyProjects, error: bMyErr } = await clientB
    .from('projects')
    .select('*')
    .eq('user_id', userBId);
  console.log(`User B My Projects returned ${bMyProjects?.length || 0} projects (Expected: 0).`);

  // 6. Test My Projects query for User A
  console.log('\n6. User A querying My Projects (.eq("user_id", userAId))...');
  const { data: aMyProjects, error: aMyErr } = await clientA
    .from('projects')
    .select('*')
    .eq('user_id', userAId);
  console.log(`User A My Projects returned ${aMyProjects?.length || 0} projects (Expected: 1).`);

  // 7. Cleanup
  console.log('\n7. Cleaning up test project...');
  await clientA.from('projects').delete().eq('id', projA.id);
  console.log('Done.');
}

diagnose();
