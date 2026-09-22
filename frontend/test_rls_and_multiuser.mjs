import { supabase } from './src/lib/supabase.js';
import { SupabaseService } from './src/services/supabaseService.js';

async function testRLSAndMultiUser() {
  console.log('================================================================');
  console.log('    PHASE 11, 13, 18 — RLS & MULTI-USER END-TO-END VERIFICATION ');
  console.log('================================================================');

  // 1. Create and authenticate User A
  const emailA = `user_a_${Date.now()}@innovexa.ai`;
  const password = 'Password123!@#';
  const { data: authA, error: errA } = await supabase.auth.signUp({
    email: emailA,
    password
  });
  if (errA || !authA.user) {
    console.error('❌ User A auth failed:', errA);
    process.exit(1);
  }
  const userA = authA.user;
  console.log('✅ User A authenticated:', userA.id, `(${emailA})`);

  // Ensure User A profile exists
  await supabase.from('profiles').upsert({
    id: userA.id,
    username: `user_a_${userA.id.slice(0, 6)}`,
    full_name: 'Innovator User A',
    role: 'innovator',
    reputation_points: 100
  });

  // 2. User A creates Project A
  const projectAPayload = {
    user_id: userA.id,
    category_id: '9b4e03a7-8261-4bf2-a2d9-12953a9316ae', // Technology
    title: 'Project A — Decentralized Compute Fabric',
    short_description: 'Peer-to-peer compute scheduler for distributed neural inference.',
    description: 'Full architectural spec for decentralized compute coordination.',
    problem_statement: 'High latency and central cloud costs for deep learning workflows.',
    proposed_solution: 'WASM edge worker network with cryptographic proof of compute.',
    project_type: 'product',
    project_stage: 'prototype',
    status: 'published',
    is_public: true
  };

  console.log('\n2. User A inserting Project A into Supabase public.projects...');
  const resA = await SupabaseService.createProject(projectAPayload, userA);
  if (resA.error || !resA.data?.id) {
    console.error('❌ Project A creation failed:', resA.error);
    process.exit(1);
  }
  const projectAId = resA.data.id;
  console.log('✅ Project A successfully inserted and verified in DB: ID =', projectAId);

  // 3. Verify User A sees Project A in My Projects
  const myProjectsA = await SupabaseService.getUserProjects(userA.id);
  const foundInMyProjectsA = (myProjectsA.data || []).some(p => p.id === projectAId);
  console.log('✅ User A "My Projects" contains Project A:', foundInMyProjectsA);
  if (!foundInMyProjectsA) {
    console.error('❌ Project A missing from User A portfolio!');
    process.exit(1);
  }

  // 4. Create and authenticate User B
  console.log('\n4. Authenticating User B...');
  const emailB = `user_b_${Date.now()}@innovexa.ai`;
  const { data: authB, error: errB } = await supabase.auth.signUp({
    email: emailB,
    password
  });
  if (errB || !authB.user) {
    console.error('❌ User B auth failed:', errB);
    process.exit(1);
  }
  const userB = authB.user;
  console.log('✅ User B authenticated:', userB.id, `(${emailB})`);

  // Ensure User B profile exists
  await supabase.from('profiles').upsert({
    id: userB.id,
    username: `user_b_${userB.id.slice(0, 6)}`,
    full_name: 'Innovator User B',
    role: 'innovator',
    reputation_points: 100
  });

  // 5. Verify User B "My Projects" does NOT contain Project A
  const myProjectsB = await SupabaseService.getUserProjects(userB.id);
  const foundInMyProjectsB = (myProjectsB.data || []).some(p => p.id === projectAId);
  console.log('✅ User B "My Projects" does NOT contain Project A (Is Isolated):', !foundInMyProjectsB);
  if (foundInMyProjectsB) {
    console.error('❌ Multi-tenancy leak: User B saw User A project in My Projects!');
    process.exit(1);
  }

  // 6. Verify User B sees Project A in Explore (public feeds)
  const exploreProjects = await SupabaseService.getProjects({ status: 'published', is_public: true });
  const foundInExplore = (exploreProjects.data || []).some(p => p.id === projectAId);
  console.log('✅ User B sees Project A in Explore public feed:', foundInExplore);
  if (!foundInExplore) {
    console.error('❌ Published Project A not found in Explore feed!');
    process.exit(1);
  }

  // 7. User B creates Project B
  console.log('\n7. User B creating Project B...');
  const projectBPayload = {
    user_id: userB.id,
    category_id: '08cfb680-9f78-437c-8f0b-9290013290d8', // AI
    title: 'Project B — Autonomous Code Synthesis Engine',
    short_description: 'Agentic AI compiler verifying code invariants in real time.',
    description: 'Formal verification agent for multi-modal code generation.',
    problem_statement: 'LLM generated code often introduces subtle boundary regressions.',
    proposed_solution: 'Continuous symbolic execution in sandbox enclaves.',
    project_type: 'idea',
    project_stage: 'concept',
    status: 'published',
    is_public: true
  };

  const resB = await SupabaseService.createProject(projectBPayload, userB);
  if (resB.error || !resB.data?.id) {
    console.error('❌ Project B creation failed:', resB.error);
    process.exit(1);
  }
  const projectBId = resB.data.id;
  console.log('✅ Project B successfully inserted and verified in DB: ID =', projectBId);

  // 8. Verify Explore contains BOTH Project A and Project B
  const updatedExplore = await SupabaseService.getProjects({ status: 'published' });
  const hasA = (updatedExplore.data || []).some(p => p.id === projectAId);
  const hasB = (updatedExplore.data || []).some(p => p.id === projectBId);
  console.log(`✅ Explore feed contains Project A (${hasA}) and Project B (${hasB})`);

  if (!hasA || !hasB) {
    console.error('❌ Explore feed verification failed!');
    process.exit(1);
  }

  // Clean up test rows
  await supabase.from('projects').delete().in('id', [projectAId, projectBId]);
  console.log('\n✅ Cleaned up test records from public.projects.');

  console.log('================================================================');
  console.log('🎉 ALL RLS & MULTI-USER TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================');
  process.exit(0);
}

testRLSAndMultiUser().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
