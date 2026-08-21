import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ [PASS] ${message}`);
}

async function runEndToEndMultiUserTest() {
  console.log('====================================================================');
  console.log('🧪 MULTI-USER GLOBAL EXPLORE & OWNERSHIP SEPARATION TEST SUITE');
  console.log('====================================================================\n');

  const rootClient = createClient(supabaseUrl, supabaseAnonKey);

  // 1. Authenticate User A (Creator Test)
  console.log('--- 1. Authenticating USER A ---');
  let userAId, tokenA;
  const { data: authA } = await rootClient.auth.signInWithPassword({
    email: 'creator.test@innovexa.io',
    password: 'TestPassword123!'
  });

  if (authA?.session) {
    userAId = authA.user.id;
    tokenA = authA.session.access_token;
  } else {
    const { data: signA } = await rootClient.auth.signUp({
      email: 'creator.test@innovexa.io',
      password: 'TestPassword123!'
    });
    userAId = signA.user.id;
    tokenA = signA.session.access_token;
  }

  const clientA = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${tokenA}` } }
  });

  // Ensure User A profile
  await clientA.from('profiles').upsert([{
    id: userAId,
    full_name: 'Dr. Sarah Creator',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    onboarding_completed: true
  }]);

  assert(Boolean(userAId), `User A authenticated with ID: ${userAId}`);

  // 2. Authenticate User B (Validator Test)
  console.log('\n--- 2. Authenticating USER B ---');
  let userBId, tokenB;
  const { data: authB } = await rootClient.auth.signInWithPassword({
    email: 'validator.test@innovexa.io',
    password: 'TestPassword123!'
  });

  if (authB?.session) {
    userBId = authB.user.id;
    tokenB = authB.session.access_token;
  } else {
    const { data: signB } = await rootClient.auth.signUp({
      email: 'validator.test@innovexa.io',
      password: 'TestPassword123!'
    });
    userBId = signB.user.id;
    tokenB = signB.session.access_token;
  }

  const clientB = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${tokenB}` } }
  });

  // Ensure User B profile
  await clientB.from('profiles').upsert([{
    id: userBId,
    full_name: 'Marcus Validator',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    onboarding_completed: true
  }]);

  assert(Boolean(userBId), `User B authenticated with ID: ${userBId}`);
  assert(userAId !== userBId, 'User A and User B are distinct unique accounts');

  // 3. User A creates Project A
  console.log('\n--- 3. USER A Creates Project A ---');
  const titleA = 'PulseMind Health AI';
  const { data: createdProjA, error: errA } = await clientA.from('projects').insert([{
    user_id: userAId,
    title: titleA,
    description: 'Autonomous multi-modal cardiology ECG triage model.',
    project_type: 'idea',
    status: 'published',
    category_id: '19b552c7-2ed6-44fe-9846-5d1501b1104f', // Healthcare
    launch_url: 'https://pulsemind.health'
  }]).select();

  if (errA) throw errA;
  const projectA = createdProjA[0];
  assert(Boolean(projectA.id), `Project A successfully created in Supabase: "${projectA.title}" (ID: ${projectA.id})`);

  // 4. User B creates Project B
  console.log('\n--- 4. USER B Creates Project B ---');
  const titleB = 'EcoLogix Carbon Ledger';
  const { data: createdProjB, error: errB } = await clientB.from('projects').insert([{
    user_id: userBId,
    title: titleB,
    description: 'Satellite LiDAR remote sensing carbon offset tokenization.',
    project_type: 'product',
    status: 'published',
    category_id: '913ce065-82bd-4101-a508-22bf41eaf0d5', // Environment
    launch_url: 'https://ecologix.green'
  }]).select();

  if (errB) throw errB;
  const projectB = createdProjB[0];
  assert(Boolean(projectB.id), `Project B successfully created in Supabase: "${projectB.title}" (ID: ${projectB.id})`);

  // 5. User A queries "My Projects" (filtered strictly by user_id = userAId)
  console.log('\n--- 5. Testing MY PROJECTS for USER A ---');
  const { data: myProjectsA } = await clientA
    .from('projects')
    .select('*')
    .eq('user_id', userAId)
    .order('created_at', { ascending: false });

  assert(myProjectsA.some(p => p.id === projectA.id), 'User A sees Project A in My Projects');
  assert(!myProjectsA.some(p => p.id === projectB.id), 'User A DOES NOT see User B Project B in My Projects');
  assert(myProjectsA.every(p => p.user_id === userAId), 'All projects in My Projects belong strictly to User A');

  // 6. User B queries "My Projects" (filtered strictly by user_id = userBId)
  console.log('\n--- 6. Testing MY PROJECTS for USER B ---');
  const { data: myProjectsB } = await clientB
    .from('projects')
    .select('*')
    .eq('user_id', userBId)
    .order('created_at', { ascending: false });

  assert(myProjectsB.some(p => p.id === projectB.id), 'User B sees Project B in My Projects');
  assert(!myProjectsB.some(p => p.id === projectA.id), 'User B DOES NOT see User A Project A in My Projects');
  assert(myProjectsB.every(p => p.user_id === userBId), 'All projects in My Projects belong strictly to User B');

  // 7. User A queries "Explore Page" (Global discovery query WITHOUT user_id filter)
  console.log('\n--- 7. Testing EXPLORE Discovery for USER A ---');
  const { data: exploreA, error: expErrA } = await clientA
    .from('projects')
    .select(`
      *,
      profiles:user_id (id, full_name, avatar_url),
      categories:category_id (id, name)
    `)
    .order('created_at', { ascending: false });

  if (expErrA) throw expErrA;
  assert(exploreA.some(p => p.id === projectA.id), 'User A sees own Project A in Explore');
  assert(exploreA.some(p => p.id === projectB.id), 'User A sees USER B Project B in Explore! (Global Discovery Verified)');

  // 8. User B queries "Explore Page" (Global discovery query WITHOUT user_id filter)
  console.log('\n--- 8. Testing EXPLORE Discovery for USER B ---');
  const { data: exploreB, error: expErrB } = await clientB
    .from('projects')
    .select(`
      *,
      profiles:user_id (id, full_name, avatar_url),
      categories:category_id (id, name)
    `)
    .order('created_at', { ascending: false });

  if (expErrB) throw expErrB;
  assert(exploreB.some(p => p.id === projectB.id), 'User B sees own Project B in Explore');
  assert(exploreB.some(p => p.id === projectA.id), 'User B sees USER A Project A in Explore! (Global Discovery Verified)');

  // 9. Multi-User Search across Explore
  console.log('\n--- 9. Testing SEARCH across ALL Users Projects in Explore ---');
  // User B searches for Project A by keyword
  const searchResultsForB = exploreB.filter(p => p.title.toLowerCase().includes(titleA.toLowerCase()));
  assert(searchResultsForB.length === 1 && searchResultsForB[0].id === projectA.id, 'User B can search and find User A project in Explore');

  // User A searches for Project B by keyword
  const searchResultsForA = exploreA.filter(p => p.title.toLowerCase().includes(titleB.toLowerCase()));
  assert(searchResultsForA.length === 1 && searchResultsForA[0].id === projectB.id, 'User A can search and find User B project in Explore');

  // 10. Multi-User Category Filtering across Explore
  console.log('\n--- 10. Testing CATEGORY Filters across ALL Users in Explore ---');
  // User B filters by Healthcare category (Project A)
  const healthProjects = exploreB.filter(p => p.category_id === '19b552c7-2ed6-44fe-9846-5d1501b1104f');
  assert(healthProjects.some(p => p.id === projectA.id), 'Category filter "Healthcare" includes User A project when viewed by User B');

  // User A filters by Environment category (Project B)
  const envProjects = exploreA.filter(p => p.category_id === '913ce065-82bd-4101-a508-22bf41eaf0d5');
  assert(envProjects.some(p => p.id === projectB.id), 'Category filter "Environment" includes User B project when viewed by User A');

  // 11. Project Ownership Protection
  console.log('\n--- 11. Testing PROJECT OWNERSHIP Security ---');
  // User B tries to update User A's project
  const { data: updateByB, error: errUpdateB } = await clientB
    .from('projects')
    .update({ title: 'Hacked by User B' })
    .eq('id', projectA.id)
    .select();

  assert(!updateByB || updateByB.length === 0, 'User B is PROHIBITED from updating User A project (RLS Protected)');

  // User B tries to delete User A's project
  const { data: deleteByB, error: errDelB } = await clientB
    .from('projects')
    .delete()
    .eq('id', projectA.id)
    .select();

  assert(!deleteByB || deleteByB.length === 0, 'User B is PROHIBITED from deleting User A project (RLS Protected)');

  // User A CAN update their own project
  const updatedTitleA = `${titleA} [Updated by Owner]`;
  const { data: updateByA, error: errUpdateA } = await clientA
    .from('projects')
    .update({ title: updatedTitleA })
    .eq('id', projectA.id)
    .select();

  assert(updateByA && updateByA.length > 0 && updateByA[0].title === updatedTitleA, 'Project owner (User A) CAN update own project');

  // 12. Project Owner Deletion Test
  console.log('\n--- 12. Testing Project Owner DELETION ---');
  const { data: deleteByA } = await clientA
    .from('projects')
    .delete()
    .eq('id', projectA.id)
    .select();

  assert(deleteByA && deleteByA.length > 0, 'Project owner (User A) CAN delete own project');

  console.log('\n====================================================================');
  console.log('🎉 ALL MULTI-USER EXPLORE & OWNERSHIP TESTS PASSED (100%)!');
  console.log('====================================================================\n');
}

runEndToEndMultiUserTest();
