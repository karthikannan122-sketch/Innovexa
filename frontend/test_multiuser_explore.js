import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

async function runTest() {
  console.log('====================================================');
  console.log('🧪 MULTI-USER RLS & EXPLORE SELECT DIAGNOSTIC');
  console.log('====================================================\n');

  const client = createClient(supabaseUrl, supabaseAnonKey);

  // 1. Sign in User A
  let userAId, tokenA;
  const { data: authA, error: errA } = await client.auth.signInWithPassword({
    email: 'creator.test@innovexa.io',
    password: 'TestPassword123!'
  });

  if (authA?.session) {
    userAId = authA.user.id;
    tokenA = authA.session.access_token;
  } else {
    // Sign up
    const { data: signA } = await client.auth.signUp({
      email: 'creator.test@innovexa.io',
      password: 'TestPassword123!'
    });
    userAId = signA.user.id;
    tokenA = signA.session.access_token;
  }

  // 2. Sign in User B
  let userBId, tokenB;
  const { data: authB, error: errB } = await client.auth.signInWithPassword({
    email: 'validator.test@innovexa.io',
    password: 'TestPassword123!'
  });

  if (authB?.session) {
    userBId = authB.user.id;
    tokenB = authB.session.access_token;
  } else {
    // Sign up
    const { data: signB } = await client.auth.signUp({
      email: 'validator.test@innovexa.io',
      password: 'TestPassword123!'
    });
    userBId = signB.user.id;
    tokenB = signB.session.access_token;
  }

  console.log(`✓ User A ID: ${userAId}`);
  console.log(`✓ User B ID: ${userBId}`);

  const clientA = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${tokenA}` } }
  });

  const clientB = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${tokenB}` } }
  });

  // Ensure profiles exist in public.profiles for FK constraint
  await clientA.from('profiles').upsert([{
    id: userAId,
    full_name: 'Dr. Sarah Creator Test',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    onboarding_completed: true
  }]);

  await clientB.from('profiles').upsert([{
    id: userBId,
    full_name: 'Marcus Validator Test',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    onboarding_completed: true
  }]);

  // 3. User A creates a test project
  const projectTitle = 'Decentralized AI Mesh';
  console.log(`\nStep 1: User A creates project: "${projectTitle}"...`);
  
  const { data: createdProj, error: createErr } = await clientA.from('projects').insert([{
    user_id: userAId,
    title: projectTitle,
    description: 'Autonomous multi-modal edge AI model for multi-lead rhythm triage.',
    project_type: 'idea',
    status: 'published'
  }]).select();

  if (createErr) {
    console.error('❌ User A project create error:', createErr);
    return;
  }
  const projectAId = createdProj[0].id;
  console.log(`✓ Project created by User A! Project ID: ${projectAId}`);

  // 4. User A queries My Projects
  console.log('\nStep 2: User A queries "My Projects" (filtered by user_id = userAId)...');
  const { data: myProjectsA } = await clientA.from('projects').select('*').eq('user_id', userAId);
  console.log(`✓ User A sees ${myProjectsA.length} projects in My Projects (All belonging to User A: ${myProjectsA.every(p => p.user_id === userAId)})`);

  // 5. User B queries "My Projects"
  console.log('\nStep 3: User B queries "My Projects" (filtered by user_id = userBId)...');
  const { data: myProjectsB } = await clientB.from('projects').select('*').eq('user_id', userBId);
  console.log(`✓ User B sees ${myProjectsB.length} projects in My Projects (Does NOT contain User A's project: ${!myProjectsB.some(p => p.id === projectAId)})`);

  // 6. User B queries "Explore Page" (Global SELECT on projects)
  console.log('\nStep 4: User B queries "Explore Page" (All published projects)...');
  const { data: exploreProjectsForB, error: exploreErrB } = await clientB
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  console.log(`Explore query error for User B:`, exploreErrB);
  console.log(`Total projects returned in Explore to User B: ${exploreProjectsForB?.length}`);

  const isUserAProjectVisibleToB = exploreProjectsForB?.some(p => p.id === projectAId);
  console.log(`>>> Is User A's Project (${projectAId}) visible in Explore to User B? >>>`, isUserAProjectVisibleToB ? 'YES! ✅ (Global Explore Works!)' : 'NO! ❌ (Blocked by RLS / Policy)');

  // 7. Check Anonymous Explorer (Guest)
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: exploreAnon } = await anonClient.from('projects').select('*');
  console.log(`\nStep 5: Anonymous Guest queries Explore: ${exploreAnon?.length} projects visible`);

  // 8. Test Ownership Security: Can User B update or delete User A's project?
  console.log('\nStep 6: Testing Project Ownership Protection:');
  const { data: hackUpdate, error: hackErr } = await clientB
    .from('projects')
    .update({ title: 'Hacked by User B' })
    .eq('id', projectAId)
    .select();

  console.log(`Can User B UPDATE User A's project?`, (hackUpdate && hackUpdate.length > 0) ? '❌ SECURITY FLAW: User B updated User A row!' : '✅ PROTECTED: User B cannot update User A row! Error/Result: ' + JSON.stringify(hackErr || hackUpdate));

  const { data: hackDelete, error: hackDelErr } = await clientB
    .from('projects')
    .delete()
    .eq('id', projectAId)
    .select();

  console.log(`Can User B DELETE User A's project?`, (hackDelete && hackDelete.length > 0) ? '❌ SECURITY FLAW: User B deleted User A row!' : '✅ PROTECTED: User B cannot delete User A row! Error/Result: ' + JSON.stringify(hackDelErr || hackDelete));
}

runTest();
