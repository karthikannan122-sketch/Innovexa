import { SupabaseService } from './src/services/supabaseService.js';
import { supabase } from './src/lib/supabase.js';

async function testProjectCreationAndPortfolio() {
  console.log('================================================================');
  console.log('   TESTING PROJECT CREATION & MY PROJECTS PORTFOLIO SYNC       ');
  console.log('================================================================');

  // 1. Authenticate user
  const email = `creator_test_${Date.now()}@innovexa.ai`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'Password123!@#'
  });

  if (authError || !authData.user) {
    console.error('❌ Auth error:', authError);
    process.exit(1);
  }

  const user = authData.user;
  console.log('✅ Authenticated test creator in Supabase:', user.id);

  // 2. Create a DRAFT project
  console.log('\n2. Creating Draft Project...');
  const draftPayload = {
    user_id: user.id,
    title: 'Synthetic Bio Sensor Matrix',
    short_description: 'Self-calibrating molecular sensor array for rapid pathogen screening.',
    problem_statement: 'Centralized lab PCR tests take 24-48 hours for pathogen sequencing.',
    proposed_solution: 'Microfluidic bioluminescent chip with edge tensor processing.',
    target_users: 'Diagnostic clinics & field epidemiologists',
    project_type: 'research',
    project_stage: 'concept',
    status: 'draft',
    is_public: false,
    asDraftOnly: true
  };

  const draftRes = await SupabaseService.createProject(draftPayload, user);
  if (draftRes.error || !draftRes.data?.id) {
    console.error('❌ Draft creation failed:', draftRes.error);
    process.exit(1);
  }
  console.log('✅ Draft Project successfully created in Supabase: ID =', draftRes.data.id, `(status: ${draftRes.data.status})`);

  // 3. Create a PUBLISHED project
  console.log('\n3. Creating Published Project...');
  const pubPayload = {
    user_id: user.id,
    title: 'Quantum Mesh Key Exchange',
    short_description: 'Post-quantum deterministic key exchange network for edge nodes.',
    problem_statement: 'Legacy RSA/ECC encryption will become vulnerable to Shor algorithm.',
    proposed_solution: 'Lattice-based ML-KEM consensus layer with hardware enclave integration.',
    target_users: 'Security engineers & defense contractors',
    project_type: 'idea',
    project_stage: 'prototype',
    status: 'published',
    is_public: true,
    asDraftOnly: false
  };

  const pubRes = await SupabaseService.createProject(pubPayload, user);
  if (pubRes.error || !pubRes.data?.id) {
    console.error('❌ Published project creation failed:', pubRes.error);
    process.exit(1);
  }
  console.log('✅ Published Project successfully created in Supabase: ID =', pubRes.data.id, `(status: ${pubRes.data.status})`);

  // 4. Query user's portfolio via getUserProjects (used by My Projects page)
  console.log('\n4. Verifying Creator Portfolio (My Projects)...');
  const portfolioRes = await SupabaseService.getUserProjects(user.id);
  if (portfolioRes.error) {
    console.error('❌ getUserProjects error:', portfolioRes.error);
    process.exit(1);
  }

  const myProjects = portfolioRes.data || [];
  console.log(`✅ Retrieved ${myProjects.length} projects in user portfolio:`);
  myProjects.forEach(p => {
    console.log(`   - [${p.status.toUpperCase()}] ${p.title} (ID: ${p.id})`);
  });

  const hasDraft = myProjects.some(p => p.id === draftRes.data.id);
  const hasPublished = myProjects.some(p => p.id === pubRes.data.id);

  if (!hasDraft || !hasPublished) {
    console.error('❌ Portfolio verification failed: missing projects!');
    process.exit(1);
  }

  console.log('✅ Both Draft and Published projects are 100% verified in user portfolio!');

  // Cleanup
  await supabase.from('projects').delete().eq('user_id', user.id);
  console.log('\n✅ Cleaned up test data.');
  console.log('================================================================');
  console.log('🎉 PROJECT CREATION & PORTFOLIO VERIFIED WITH 100% SUCCESS!');
  console.log('================================================================');
  process.exit(0);
}

testProjectCreationAndPortfolio().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
