import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function testThreeUserVisibilityMatrix() {
  console.log('================================================================');
  console.log('   INNOVEXA — THREE-USER PROJECT VISIBILITY MATRIX TEST         ');
  console.log('================================================================');

  const now = Date.now();
  const password = 'Password123!@#';

  // 1. Create separate authenticated clients for User A, User B, and User C
  console.log('\n1. Creating 3 distinct authenticated client sessions in Supabase...');

  const clientA = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const clientB = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const clientC = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

  const emailA = `vis_user_a_${now}@innovexa.ai`;
  const emailB = `vis_user_b_${now}@innovexa.ai`;
  const emailC = `vis_user_c_${now}@innovexa.ai`;

  const [authResA, authResB, authResC] = await Promise.all([
    clientA.auth.signUp({ email: emailA, password }),
    clientB.auth.signUp({ email: emailB, password }),
    clientC.auth.signUp({ email: emailC, password })
  ]);

  const userA = authResA.data.user;
  const userB = authResB.data.user;
  const userC = authResC.data.user;

  console.log('✅ User A authenticated:', userA.id);
  console.log('✅ User B authenticated:', userB.id);
  console.log('✅ User C authenticated:', userC.id);

  // Seed profiles
  await Promise.all([
    clientA.from('profiles').upsert({ id: userA.id, username: `user_a_${now}`, full_name: 'Alice Innovator', role: 'innovator', reputation_points: 100 }),
    clientB.from('profiles').upsert({ id: userB.id, username: `user_b_${now}`, full_name: 'Bob Innovator', role: 'innovator', reputation_points: 100 }),
    clientC.from('profiles').upsert({ id: userC.id, username: `user_c_${now}`, full_name: 'Charlie Reviewer', role: 'reviewer', reputation_points: 100 })
  ]);

  const catUUID = '9b4e03a7-8261-4bf2-a2d9-12953a9316ae'; // Technology

  // 2. User A creates:
  //    - Project A (PUBLISHED)
  //    - Draft A (DRAFT)
  console.log('\n2. User A creating Project A (published) and Draft A (draft)...');

  const projectAPayload = {
    user_id: userA.id,
    category_id: catUUID,
    title: `Project A Matrix (${now})`,
    short_description: 'Published project created by User A.',
    description: 'Full description for Project A.',
    problem_statement: 'High latency data transmission in decentralized systems.',
    proposed_solution: 'Custom UDP multiplexing protocol with fountain coding.',
    project_type: 'idea',
    project_stage: 'prototype',
    status: 'published',
    is_public: true
  };

  const draftAPayload = {
    user_id: userA.id,
    category_id: catUUID,
    title: `Draft A Matrix (${now})`,
    short_description: 'Draft work-in-progress by User A.',
    description: 'Work in progress draft.',
    problem_statement: 'Unsolved edge synchronization friction.',
    proposed_solution: 'Drafting candidate algorithms.',
    project_type: 'research',
    project_stage: 'concept',
    status: 'draft',
    is_public: false
  };

  const { data: projectA, error: errProjA } = await clientA.from('projects').insert([projectAPayload]).select().single();
  const { data: draftA, error: errDraftA } = await clientA.from('projects').insert([draftAPayload]).select().single();

  if (errProjA || !projectA || errDraftA || !draftA) {
    console.error('❌ Failed to insert User A projects:', { errProjA, errDraftA });
    process.exit(1);
  }

  const projectAId = projectA.id;
  const draftAId = draftA.id;
  console.log('✅ Project A (Published) created in Supabase: ID =', projectAId);
  console.log('✅ Draft A (Draft) created in Supabase: ID =', draftAId);

  // 3. User B logs in and opens Explore & My Projects
  console.log('\n3. Verifying User B views:');
  const { data: exploreForB } = await clientB.from('projects').select('*').eq('status', 'published');
  const { data: myProjectsForB } = await clientB.from('projects').select('*').eq('user_id', userB.id);

  const bSeesProjectAInExplore = (exploreForB || []).some(p => p.id === projectAId);
  const bSeesDraftAInExplore = (exploreForB || []).some(p => p.id === draftAId);
  const bMyProjectsCount = (myProjectsForB || []).length;

  console.log('   - User B sees Project A in Explore:', bSeesProjectAInExplore, bSeesProjectAInExplore ? '✅' : '❌');
  console.log('   - User B does NOT see Draft A in Explore:', !bSeesDraftAInExplore, !bSeesDraftAInExplore ? '✅' : '❌');
  console.log(`   - User B "My Projects" count: ${bMyProjectsCount} (Expected: 0)`, bMyProjectsCount === 0 ? '✅' : '❌');

  if (!bSeesProjectAInExplore || bSeesDraftAInExplore || bMyProjectsCount !== 0) {
    console.error('❌ User B visibility check failed!');
    process.exit(1);
  }

  // 4. User C logs in and opens Explore & My Projects
  console.log('\n4. Verifying User C views:');
  const { data: exploreForC } = await clientC.from('projects').select('*').eq('status', 'published');
  const { data: myProjectsForC } = await clientC.from('projects').select('*').eq('user_id', userC.id);

  const cSeesProjectAInExplore = (exploreForC || []).some(p => p.id === projectAId);
  const cSeesDraftAInExplore = (exploreForC || []).some(p => p.id === draftAId);
  const cMyProjectsCount = (myProjectsForC || []).length;

  console.log('   - User C sees Project A in Explore:', cSeesProjectAInExplore, cSeesProjectAInExplore ? '✅' : '❌');
  console.log('   - User C does NOT see Draft A in Explore:', !cSeesDraftAInExplore, !cSeesDraftAInExplore ? '✅' : '❌');
  console.log(`   - User C "My Projects" count: ${cMyProjectsCount} (Expected: 0)`, cMyProjectsCount === 0 ? '✅' : '❌');

  if (!cSeesProjectAInExplore || cSeesDraftAInExplore || cMyProjectsCount !== 0) {
    console.error('❌ User C visibility check failed!');
    process.exit(1);
  }

  // 5. User B creates Project B (PUBLISHED)
  console.log('\n5. User B creating Project B (published)...');
  const projectBPayload = {
    user_id: userB.id,
    category_id: '08cfb680-9f78-437c-8f0b-9290013290d8', // AI
    title: `Project B Matrix (${now})`,
    short_description: 'Published project created by User B.',
    description: 'Full description for Project B.',
    problem_statement: 'High memory consumption in attention matrix caching.',
    proposed_solution: 'Quantized linear attention with dynamic memory pruning.',
    project_type: 'product',
    project_stage: 'prototype',
    status: 'published',
    is_public: true
  };

  const { data: projectB, error: errProjB } = await clientB.from('projects').insert([projectBPayload]).select().single();
  if (errProjB || !projectB) {
    console.error('❌ Failed to create Project B:', errProjB);
    process.exit(1);
  }
  const projectBId = projectB.id;
  console.log('✅ Project B (Published) created in Supabase: ID =', projectBId);

  // 6. User A inspects Explore & My Projects
  console.log('\n6. Verifying User A views after Project B is created:');
  const { data: exploreForA } = await clientA.from('projects').select('*').eq('status', 'published');
  const { data: myProjectsForA } = await clientA.from('projects').select('*').eq('user_id', userA.id);

  const aSeesProjectBInExplore = (exploreForA || []).some(p => p.id === projectBId);
  const aSeesProjectAInExplore = (exploreForA || []).some(p => p.id === projectAId);
  const aMyProjectsList = myProjectsForA || [];
  const aHasProjectAInMyProjects = aMyProjectsList.some(p => p.id === projectAId);
  const aHasDraftAInMyProjects = aMyProjectsList.some(p => p.id === draftAId);
  const aHasProjectBInMyProjects = aMyProjectsList.some(p => p.id === projectBId);

  console.log('   - User A sees Project B in Explore:', aSeesProjectBInExplore, aSeesProjectBInExplore ? '✅' : '❌');
  console.log('   - User A sees Project A in Explore:', aSeesProjectAInExplore, aSeesProjectAInExplore ? '✅' : '❌');
  console.log('   - User A "My Projects" contains Project A:', aHasProjectAInMyProjects, aHasProjectAInMyProjects ? '✅' : '❌');
  console.log('   - User A "My Projects" contains Draft A:', aHasDraftAInMyProjects, aHasDraftAInMyProjects ? '✅' : '❌');
  console.log('   - User A "My Projects" does NOT contain Project B:', !aHasProjectBInMyProjects, !aHasProjectBInMyProjects ? '✅' : '❌');

  if (!aSeesProjectBInExplore || !aHasProjectAInMyProjects || !aHasDraftAInMyProjects || aHasProjectBInMyProjects) {
    console.error('❌ User A visibility matrix check failed!');
    process.exit(1);
  }

  // 7. Cleanup
  await clientA.from('projects').delete().in('id', [projectAId, draftAId]);
  await clientB.from('projects').delete().eq('id', projectBId);
  console.log('\n✅ Cleaned up all test records from public.projects.');

  console.log('================================================================');
  console.log('🎉 THREE-USER VISIBILITY MATRIX VERIFIED WITH 100% SUCCESS!    ');
  console.log('================================================================');
  process.exit(0);
}

testThreeUserVisibilityMatrix().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
