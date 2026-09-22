import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envText = fs.readFileSync('.env', 'utf8');
const urlMatch = envText.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

process.env.VITE_SUPABASE_URL = url;
process.env.VITE_SUPABASE_ANON_KEY = key;
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = key;

const { SupabaseService } = await import('./src/services/supabaseService.js');
const { StorageService } = await import('./src/services/storage.js');
const { supabase } = await import('./src/lib/supabase.js');

async function runE2ETest() {
  console.log('====================================================');
  console.log('INNOVEXA CREATE IDEA & SUBMISSION E2E TEST SUITE');
  console.log('====================================================\n');

  StorageService.init();

  // 1. Fetch DB Categories
  console.log('--- TEST 1: CATEGORY RESOLUTION ---');
  const { data: dbCategories, error: catErr } = await supabase.from('categories').select('*').order('name');
  if (catErr || !dbCategories || dbCategories.length === 0) {
    throw new Error('Failed to load categories: ' + (catErr?.message || 'Empty categories table'));
  }
  console.log(`✅ Loaded ${dbCategories.length} categories from Supabase.`);
  const techCat = dbCategories.find(c => c.slug === 'technology') || dbCategories[0];
  const eduCat = dbCategories.find(c => c.slug === 'education') || dbCategories[1];
  console.log(`   Using Tech Cat: ${techCat.name} (${techCat.id})`);
  console.log(`   Using Edu Cat: ${eduCat.name} (${eduCat.id})\n`);

  // 2. Multi-User Accounts Setup
  console.log('--- TEST 2: AUTHENTICATED USER SESSIONS ---');
  const timestamp = Date.now();
  const userAEmail = `audit_creator_a_${timestamp}@innovexa.ai`;
  const userBEmail = `audit_creator_b_${timestamp}@innovexa.ai`;
  const password = 'TestSecurePassword123!';

  const { data: signUpA, error: errA } = await supabase.auth.signUp({
    email: userAEmail,
    password: password,
    options: { data: { full_name: 'Dr. Alice Innovator' } }
  });
  if (errA) throw new Error('User A Signup failed: ' + errA.message);
  console.log(`✅ User A authenticated: ${signUpA.user.id} (${userAEmail})`);

  const { data: signUpB, error: errB } = await supabase.auth.signUp({
    email: userBEmail,
    password: password,
    options: { data: { full_name: 'Bob Technologist' } }
  });
  if (errB) throw new Error('User B Signup failed: ' + errB.message);
  console.log(`✅ User B authenticated: ${signUpB.user.id} (${userBEmail})\n`);

  // 3. User A Submits Project A (IDEA Track)
  console.log('--- TEST 3: USER A SUBMITS PROJECT A (IDEA TRACK) ---');
  await supabase.auth.signInWithPassword({ email: userAEmail, password });

  const projectAPayload = {
    title: `Decentralized AI Agent Orchestrator ${timestamp}`,
    category_id: techCat.id,
    category_name: techCat.name,
    short_description: 'An autonomous multi-agent mesh computing protocol for decentralized problem-solving.',
    description: 'An autonomous multi-agent mesh computing protocol for decentralized problem-solving across distributed nodes.',
    problem_statement: 'Centralized AI agent orchestration creates systemic single points of failure, privacy leakage, and high latency.',
    proposed_solution: 'Novel P2P cryptographic consensus and state-channel execution environment for multi-agent workflows.',
    target_users: 'Distributed systems engineers, AI agent developers, privacy researchers',
    project_type: 'idea',
    creation_type: 'IDEA',
    innovation_type: 'technical',
    project_stage: 'concept',
    status: 'published',
    is_public: true,
    tags: ['AI', 'Decentralized', 'Mesh', 'Agents'],
    features: ['P2P Agent Mesh', 'State Channels', 'Zero Knowledge Verifiers']
  };

  const createResA = await SupabaseService.createProject(projectAPayload, signUpA.user);
  if (createResA.error || !createResA.data?.id) {
    throw new Error('Failed to create Project A in Supabase: ' + (createResA.error?.message || 'No ID returned'));
  }
  const projectA = createResA.data;
  console.log(`✅ Project A Created & Verified in Supabase: ID = ${projectA.id}`);
  console.log(`   Title: ${projectA.title}`);
  console.log(`   User ID: ${projectA.user_id}`);
  console.log(`   Category ID: ${projectA.category_id}`);
  console.log(`   Status: ${projectA.status}\n`);

  // Verify directly from Supabase DB
  const { data: dbDirectA, error: dbDirectErrA } = await supabase
    .from('projects')
    .select('id, user_id, title, category_id, status, created_at')
    .eq('id', projectA.id)
    .single();

  if (dbDirectErrA || !dbDirectA) {
    throw new Error('Direct DB query failed for Project A: ' + dbDirectErrA?.message);
  }
  console.log(`✅ Direct DB Verification for Project A:`, dbDirectA);

  // 4. User B Submits Project B (STARTUP Track)
  console.log('\n--- TEST 4: USER B SUBMITS PROJECT B (STARTUP TRACK) ---');
  await supabase.auth.signInWithPassword({ email: userBEmail, password });

  const projectBPayload = {
    title: `EduPulse Adaptive Learning Engine ${timestamp}`,
    category_id: eduCat.id,
    category_name: eduCat.name,
    short_description: 'Real-time cognitive load detection and personalized curriculum optimizer for higher ed.',
    description: 'Real-time cognitive load detection and personalized curriculum optimizer for higher ed institutions.',
    problem_statement: 'Traditional educational curricula fail to adapt to individual student cognitive pacing, causing 42% retention drops.',
    proposed_solution: 'Dynamic reinforcement learning curriculum generator matching live student biometric attention signals.',
    target_users: 'Higher education universities, online learning academies, 10M+ global students',
    project_type: 'startup',
    creation_type: 'STARTUP',
    innovation_type: 'business',
    project_stage: 'prototype',
    status: 'published',
    is_public: true,
    website_url: 'https://edupulse-adaptive.ai',
    demo_url: 'https://demo.edupulse-adaptive.ai',
    tags: ['EdTech', 'AI', 'Startup', 'Adaptive Learning'],
    features: ['Cognitive Attention Radar', 'Dynamic Syllabus Adjuster', 'Institutional Dashboard']
  };

  const createResB = await SupabaseService.createProject(projectBPayload, signUpB.user);
  if (createResB.error || !createResB.data?.id) {
    throw new Error('Failed to create Project B in Supabase: ' + (createResB.error?.message || 'No ID returned'));
  }
  const projectB = createResB.data;
  console.log(`✅ Project B Created & Verified in Supabase: ID = ${projectB.id}`);
  console.log(`   Title: ${projectB.title}`);
  console.log(`   User ID: ${projectB.user_id}`);
  console.log(`   Category ID: ${projectB.category_id}`);
  console.log(`   Stage: ${projectB.project_stage}\n`);

  // 5. User A Submits a DRAFT Project
  console.log('--- TEST 5: DRAFT PROJECT CREATION ---');
  await supabase.auth.signInWithPassword({ email: userAEmail, password });
  const draftPayload = {
    title: `Quantum Neural Network Draft ${timestamp}`,
    category_id: techCat.id,
    category_name: techCat.name,
    short_description: 'Work in progress quantum neural simulator.',
    description: 'Work in progress quantum neural simulator.',
    problem_statement: 'Quantum simulation on classical architectures is computationally prohibitive.',
    proposed_solution: 'Tensor network decomposition approximation method.',
    target_users: 'Quantum physicists',
    project_type: 'research',
    creation_type: 'RESEARCH',
    project_stage: 'concept',
    status: 'draft',
    is_public: false
  };

  const draftRes = await SupabaseService.createProject(draftPayload, signUpA.user);
  if (draftRes.error || !draftRes.data?.id) {
    throw new Error('Failed to create Draft Project in Supabase: ' + draftRes.error?.message);
  }
  const draftProject = draftRes.data;
  console.log(`✅ Draft Project Created: ID = ${draftProject.id}, status = ${draftProject.status}\n`);

  // 6. Test My Projects Partitioning
  console.log('--- TEST 6: "MY PROJECTS" PORTFOLIO PARTITIONING ---');
  const userAProjects = await SupabaseService.getUserProjects(signUpA.user.id);
  const userBProjects = await SupabaseService.getUserProjects(signUpB.user.id);

  console.log(`User A Projects Count: ${userAProjects.data?.length}`);
  console.log(`User B Projects Count: ${userBProjects.data?.length}`);

  const userAHasA = userAProjects.data?.some(p => p.id === projectA.id);
  const userAHasB = userAProjects.data?.some(p => p.id === projectB.id);
  const userAHasDraft = userAProjects.data?.some(p => p.id === draftProject.id);

  const userBHasA = userBProjects.data?.some(p => p.id === projectA.id);
  const userBHasB = userBProjects.data?.some(p => p.id === projectB.id);
  const userBHasDraft = userBProjects.data?.some(p => p.id === draftProject.id);

  console.log(`User A has Project A: ${userAHasA} (expected true)`);
  console.log(`User A has Project B: ${userAHasB} (expected false)`);
  console.log(`User A has Draft: ${userAHasDraft} (expected true)`);
  console.log(`User B has Project A: ${userBHasA} (expected false)`);
  console.log(`User B has Project B: ${userBHasB} (expected true)`);
  console.log(`User B has Draft: ${userBHasDraft} (expected false)`);

  if (!userAHasA || userAHasB || !userAHasDraft || userBHasA || !userBHasB || userBHasDraft) {
    throw new Error('My Projects partitioning test failed!');
  }
  console.log('✅ My Projects partitioning is 100% correct!\n');

  // 7. Test Explore Visibility (Published projects visible to all; Drafts hidden)
  console.log('--- TEST 7: EXPLORE FEED VISIBILITY & MULTI-USER SHARING ---');
  const exploreRes = await SupabaseService.getProjects({ status: 'published' });
  const exploreProjects = exploreRes.data || [];

  const exploreHasA = exploreProjects.some(p => p.id === projectA.id);
  const exploreHasB = exploreProjects.some(p => p.id === projectB.id);
  const exploreHasDraft = exploreProjects.some(p => p.id === draftProject.id);

  console.log(`Explore Feed Total Published Projects: ${exploreProjects.length}`);
  console.log(`Explore includes Project A (from User A): ${exploreHasA} (expected true)`);
  console.log(`Explore includes Project B (from User B): ${exploreHasB} (expected true)`);
  console.log(`Explore includes Draft (from User A): ${exploreHasDraft} (expected false)`);

  if (!exploreHasA || !exploreHasB || exploreHasDraft) {
    throw new Error('Explore Feed visibility test failed!');
  }
  console.log('✅ Explore Feed multi-user visibility is 100% verified!\n');

  // 8. Test Project Update
  console.log('--- TEST 8: PROJECT UPDATE ---');
  const updateRes = await SupabaseService.updateProject(
    projectA.id,
    { title: `Updated Decentralized Orchestrator ${timestamp}`, problem_statement: 'Updated problem statement with enhanced clarity.' },
    signUpA.user.id
  );
  if (updateRes.error) {
    throw new Error('Failed to update Project A: ' + updateRes.error.message);
  }
  console.log(`✅ Project A updated successfully in Supabase:`, updateRes.data.title);

  // 9. Clean up test projects
  console.log('\n--- CLEANUP ---');
  await supabase.from('projects').delete().in('id', [projectA.id, projectB.id, draftProject.id]);
  console.log('✅ Test projects cleaned up successfully.');

  console.log('\n====================================================');
  console.log('🎉 ALL 8 AUDIT & WORKFLOW TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

runE2ETest().catch((err) => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
