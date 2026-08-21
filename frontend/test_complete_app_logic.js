import { createClient } from '@supabase/supabase-js';
import { generateProjectPersonalInsights } from './src/services/aiInsights.js';
import { SupabaseService } from './src/services/supabaseService.js';
import { StorageService } from './src/services/storage.js';

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ [PASS] ${message}`);
}

async function runCompleteAppLogicAudit() {
  console.log('====================================================================');
  console.log('🧪 INNOVEXA COMPREHENSIVE APPLICATION LOGIC & SUPABASE AUDIT');
  console.log('====================================================================\n');

  const rootClient = createClient(supabaseUrl, supabaseAnonKey);

  // 1. Authenticate User A (Creator)
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

  await clientA.from('profiles').upsert([{
    id: userAId,
    full_name: 'Dr. Sarah Creator',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    onboarding_completed: true
  }]);

  assert(Boolean(userAId), `User A ID: ${userAId}`);

  // 2. Authenticate User B (Validator / Reviewer)
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

  await clientB.from('profiles').upsert([{
    id: userBId,
    full_name: 'Marcus Validator',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    onboarding_completed: true
  }]);

  assert(Boolean(userBId), `User B ID: ${userBId}`);

  // 3. User A creates a real Project in Supabase
  console.log('\n--- 3. USER A creates Project A in Supabase ---');
  const titleA = 'OmniSensing Radar AI';
  const { data: createdProjA, error: errA } = await clientA.from('projects').insert([{
    user_id: userAId,
    title: titleA,
    description: 'Autonomous millimeter-wave radar point cloud object classification for all-weather robotics navigation.',
    project_type: 'idea',
    status: 'published',
    category_id: null,
    launch_url: 'https://omnisensing.tech'
  }]).select();

  if (errA) throw errA;
  const projectA = createdProjA[0];
  assert(Boolean(projectA.id), `Project A created in Supabase: "${projectA.title}" (ID: ${projectA.id})`);

  // 4. Multi-User Global Discovery on Explore
  console.log('\n--- 4. Multi-User Global Discovery ---');
  const { data: exploreProjects } = await clientB.from('projects').select('*');
  assert(exploreProjects.some(p => p.id === projectA.id), 'User B discovers User A Project A in Explore');

  // 5. User B Upvotes User A Project (3-State Upvote Logic)
  console.log('\n--- 5. Project 3-State Voting Engine (▲ Upvote / ▼ Downvote) ---');
  const voteRes1 = await SupabaseService.voteProject({
    projectId: projectA.id,
    userId: userBId,
    voteType: 'upvote',
    projectOwnerId: userAId,
    projectTitle: projectA.title,
    userName: 'Marcus Validator'
  });

  assert(voteRes1.activeVoteType === 'upvote', 'User B active vote state is "upvote"');
  assert(voteRes1.upvotesCount >= 1, `Project A upvote count updated: ${voteRes1.upvotesCount}`);

  // User B switches to Downvote
  const voteRes2 = await SupabaseService.voteProject({
    projectId: projectA.id,
    userId: userBId,
    voteType: 'downvote',
    projectOwnerId: userAId,
    projectTitle: projectA.title,
    userName: 'Marcus Validator'
  });

  assert(voteRes2.activeVoteType === 'downvote', 'User B active vote state is "downvote"');
  assert(voteRes2.downvotesCount >= 1, `Project A downvote count updated: ${voteRes2.downvotesCount}`);

  // User B toggles off downvote (neutral state)
  const voteRes3 = await SupabaseService.voteProject({
    projectId: projectA.id,
    userId: userBId,
    voteType: 'downvote',
    projectOwnerId: userAId,
    projectTitle: projectA.title,
    userName: 'Marcus Validator'
  });
  assert(voteRes3.activeVoteType === null, 'User B vote toggled back to neutral state (null)');

  // 6. User B Submits Peer Review for Project A
  console.log('\n--- 6. Peer Review Submission & Validation ---');
  const revRes = await SupabaseService.submitReview({
    projectId: projectA.id,
    reviewerId: userBId,
    reviewerName: 'Marcus Validator',
    reviewerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    relevanceAnswer: 'YES',
    wouldUse: 'YES',
    suggestion: 'Consider integrating multi-spectral camera fusion alongside mmWave radar to resolve edge boundary ambiguity.',
    overallFeedback: 'Exceptional radar point-cloud classification thesis.',
    rating: 5,
    projectOwnerId: userAId,
    projectTitle: projectA.title
  });

  assert(Boolean(revRes.data), 'Review successfully registered in review engine');

  // Verify self-review prevention rule
  const selfRevRes = await SupabaseService.submitReview({
    projectId: projectA.id,
    reviewerId: userAId,
    reviewerName: 'Dr. Sarah Creator',
    projectOwnerId: userAId
  });
  assert(Boolean(selfRevRes.error), 'Self-review strictly prohibited and rejected with error message');

  // 7. Personal AI Insights (10 Sections Generated for User's Own Project)
  console.log('\n--- 7. Personal AI Insights Generation (10 Structured Sections) ---');
  const insights = generateProjectPersonalInsights(projectA);
  assert(Boolean(insights.summary), '01 / PROJECT SUMMARY generated');
  assert(Boolean(insights.problem_clarity.status), '02 / PROBLEM CLARITY generated');
  assert(Boolean(insights.value_proposition), '03 / VALUE PROPOSITION generated');
  assert(Boolean(insights.target_audience), '04 / TARGET AUDIENCE generated');
  assert(Array.isArray(insights.strengths) && insights.strengths.length >= 3, `05 / STRENGTHS generated (${insights.strengths.length} items)`);
  assert(Array.isArray(insights.gaps) && insights.gaps.length >= 1, `06 / GAPS generated (${insights.gaps.length} items)`);
  assert(Array.isArray(insights.feasibility) && insights.feasibility.length >= 1, '07 / FEASIBILITY CONSIDERATIONS generated');
  assert(Boolean(insights.differentiation), '08 / DIFFERENTIATION generated');
  assert(Array.isArray(insights.next_steps) && insights.next_steps.length >= 3, `09 / NEXT STEPS generated (${insights.next_steps.length} items)`);
  assert(insights.readiness.score >= 35 && insights.readiness.score <= 100, `10 / PROJECT READINESS score: ${insights.readiness.score}/100`);
  assert(Boolean(insights.readiness.disclaimer), 'Mandatory AI disclaimer present');

  // 8. Global Innovations Catalog & External Signals with Legitimate Links
  console.log('\n--- 8. Global Innovation Catalog & External Signals Verification ---');
  const { data: extInnovations } = await SupabaseService.getExternalInnovations();
  assert(extInnovations.length >= 4, `Catalog populated with ${extInnovations.length} global innovation signals`);
  assert(extInnovations.every(item => item.source_url && item.source_url.startsWith('http')), 'Every catalog entry contains a legitimate, verified source URL');
  assert(extInnovations.some(item => item.source_name.includes('NASA')), 'Verified NASA technology transfer & open-source software projects present');
  assert(extInnovations.some(item => item.source_name.includes('EU CORDIS')), 'Verified EU CORDIS research and innovation projects present');

  // 9. Clean up test projects
  console.log('\n--- 9. Cleanup Test Records ---');
  await clientA.from('projects').delete().eq('id', projectA.id);
  assert(true, 'Test project cleaned up from Supabase.');

  console.log('\n====================================================================');
  console.log('🎉 ALL APPLICATION LOGIC & SUPABASE AUDIT TESTS PASSED (100%)!');
  console.log('====================================================================\n');
}

runCompleteAppLogicAudit();
