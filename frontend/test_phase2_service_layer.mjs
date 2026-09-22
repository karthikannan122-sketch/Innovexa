import assert from 'assert';

console.log('====================================================');
console.log('INNOVEXA PHASE 2: PROJECT MANAGEMENT SERVICE TEST');
console.log('====================================================');

// Mock localStorage for Node environment
const store = new Map();
global.localStorage = {
  getItem: (k) => store.get(k) || null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};
global.window = {
  dispatchEvent: () => {}
};

// Import modules
const { StorageService } = await import('./src/services/storage.js');
const { SupabaseService } = await import('./src/services/supabaseService.js');

async function runTests() {
  const userA = { id: '00000000-0000-0000-0000-000000000001', name: 'User A', full_name: 'User A', email: 'usera@test.com' };
  const userB = { id: '00000000-0000-0000-0000-000000000002', name: 'User B', full_name: 'User B', email: 'userb@test.com' };

  console.log('\n[TEST 1] Project Categories');
  const catRes = await SupabaseService.getCategories();
  assert(catRes.data && catRes.data.length > 0, 'Categories must not be empty');
  console.log(`✓ Fetched ${catRes.data.length} categories:`, catRes.data.map(c => c.name || c.id).slice(0, 5));

  console.log('\n[TEST 2] User A creates Project A (Startup Track, Prototype Stage, Public)');
  const projectAPayload = {
    user_id: userA.id,
    creator_id: userA.id,
    creator_name: userA.name,
    title: 'Quantum Ledger Protocol',
    short_description: 'High-throughput state machine settlement layer.',
    description: 'Detailed protocol specification for zero-knowledge rollups.',
    problem_statement: 'High latency in transaction settlement.',
    proposed_solution: 'ZK-STARK verified execution environment.',
    category_id: catRes.data[0]?.id || 'cat_blockchain',
    category_name: catRes.data[0]?.name || 'Blockchain',
    project_type: 'startup',
    creation_type: 'STARTUP',
    project_stage: 'prototype',
    startup_stage: 'prototype',
    innovation_type: 'technical',
    target_users: 'Blockchain core engineers, financial settlement operators',
    features: ['Sub-second latency', 'High TPS', 'Cryptographic verification'],
    tags: ['zk', 'blockchain', 'scalability'],
    cover_image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200',
    launch_url: 'https://quantumledger.io',
    github_url: 'https://github.com/quantum/protocol',
    demo_url: 'https://demo.quantumledger.io',
    status: 'UNDER_VALIDATION',
    is_public: true
  };

  const createRes = await SupabaseService.createProject(projectAPayload);
  assert(createRes.data && createRes.data.id, 'Project creation must return project with id');
  const projectA = createRes.data;
  console.log('✓ Project A created with ID:', projectA.id);
  console.log('  Title:', projectA.title);
  console.log('  Project Type:', projectA.project_type);
  console.log('  Project Stage:', projectA.project_stage);
  console.log('  Is Public:', projectA.is_public);
  console.log('  Status:', projectA.status);

  console.log('\n[TEST 3] Explore Project Discovery (Public & Published Only)');
  const exploreRes = await SupabaseService.getProjects({ public_only: true });
  assert(exploreRes.data.some(p => p.id === projectA.id), 'Project A must be discovered in public Explore feed');
  console.log('✓ User B successfully discovers Project A in Explore');

  console.log('\n[TEST 4] Project Voting Rules (1 User + 1 Project = 1 Vote)');
  
  // 4a. User B Upvotes
  console.log('  4a. User B clicks Upvote...');
  const upvoteRes = await SupabaseService.voteProject({
    projectId: projectA.id,
    userId: userB.id,
    voteType: 'upvote'
  });
  console.log('  ✓ Upvote recorded:', upvoteRes.data);
  let voteCheck = await SupabaseService.getUserProjectVote(projectA.id, userB.id);
  assert.strictEqual(voteCheck, 'upvote', 'User B vote must be upvote');

  // 4b. User B switches to Downvote
  console.log('  4b. User B clicks Downvote...');
  const downvoteRes = await SupabaseService.voteProject({
    projectId: projectA.id,
    userId: userB.id,
    voteType: 'downvote'
  });
  console.log('  ✓ Vote switched to downvote:', downvoteRes.data);
  voteCheck = await SupabaseService.getUserProjectVote(projectA.id, userB.id);
  assert.strictEqual(voteCheck, 'downvote', 'User B vote must be updated to downvote without duplicates');

  // 4c. User B clicks Downvote again to remove vote
  console.log('  4c. User B clicks Downvote again to toggle off...');
  const removeVoteRes = await SupabaseService.voteProject({
    projectId: projectA.id,
    userId: userB.id,
    voteType: 'downvote'
  });
  console.log('  ✓ Vote removed (toggled off):', removeVoteRes.data);
  voteCheck = await SupabaseService.getUserProjectVote(projectA.id, userB.id);
  assert.strictEqual(voteCheck, null, 'User B vote must be null after removal');

  console.log('\n[TEST 5] Project Follow / Unfollow System (public.project_follows)');
  
  // 5a. User B Follows Project A
  console.log('  5a. User B follows Project A...');
  const followRes1 = await SupabaseService.toggleFollowProject(projectA.id, userB.id);
  console.log('  FollowRes1 result:', followRes1);
  assert.strictEqual(followRes1.isFollowing, true, 'User B should now be following Project A');
  let isFollowed = await SupabaseService.isProjectFollowed(projectA.id, userB.id);
  assert.strictEqual(isFollowed, true, 'isProjectFollowed must return true');
  let followersCount = await SupabaseService.getProjectFollowersCount(projectA.id);
  assert(followersCount >= 1, 'Followers count must be at least 1');
  console.log(`  ✓ Follow verified. Followers count: ${followersCount}`);

  // 5b. User B Unfollows Project A
  console.log('  5b. User B unfollows Project A...');
  const followRes2 = await SupabaseService.toggleFollowProject(projectA.id, userB.id);
  assert.strictEqual(followRes2.isFollowing, false, 'User B should no longer be following Project A');
  isFollowed = await SupabaseService.isProjectFollowed(projectA.id, userB.id);
  assert.strictEqual(isFollowed, false, 'isProjectFollowed must return false');
  console.log('  ✓ Unfollow verified.');

  console.log('\n[TEST 6] Project Suggestions (public.project_suggestions)');
  console.log('  6a. User B submits a suggestion...');
  const sugRes = await SupabaseService.createProjectSuggestion({
    projectId: projectA.id,
    userId: userB.id,
    title: 'Integrate Recursive Proofs',
    content: 'Recursive SNARK composition will reduce proof verification cost on L1 by 40%.',
    suggestionType: 'architecture'
  });
  assert(sugRes.data && sugRes.data.id, 'Suggestion creation must succeed');
  const suggestion = sugRes.data;
  console.log('  ✓ Suggestion created:', suggestion.id, 'Status:', suggestion.status);

  console.log('  6b. User A (Owner) updates suggestion status to accepted...');
  const updateSugRes = await SupabaseService.updateProjectSuggestionStatus(suggestion.id, 'accepted', userA.id);
  assert(updateSugRes.data && updateSugRes.data.status === 'accepted', 'Suggestion status must be accepted');
  console.log('  ✓ Suggestion status updated to:', updateSugRes.data.status);

  console.log('\n[TEST 7] Project Owner Edit vs Non-Owner Restriction');
  
  // 7a. User A updates Project A
  console.log('  7a. User A updates Project A title and stage...');
  const editRes = await SupabaseService.updateProject(projectA.id, {
    title: 'Quantum Ledger Protocol (Mainnet Spec)',
    project_stage: 'launched'
  }, userA.id);
  assert(editRes.data && editRes.data.project_stage === 'launched', 'Owner update must succeed');
  console.log('  ✓ Project updated by Owner. New Title:', editRes.data.title, 'Stage:', editRes.data.project_stage);

  // 7b. User B attempts unauthorized edit
  console.log('  7b. User B attempts unauthorized update...');
  const unauthEditRes = await SupabaseService.updateProject(projectA.id, {
    title: 'Hacked Project Title'
  }, userB.id);
  assert(unauthEditRes.error !== null, 'Non-owner update must be blocked with error');
  console.log('  ✓ Unauthorized update correctly blocked:', unauthEditRes.error?.message || unauthEditRes.error);

  console.log('\n[TEST 8] Project Unpublish (Draft Privacy Rule)');
  console.log('  8a. User A unpublishes Project A (status = DRAFT, is_public = false)...');
  const unpubRes = await SupabaseService.updateProject(projectA.id, {
    status: 'DRAFT',
    is_public: false
  }, userA.id);
  assert(unpubRes.data && unpubRes.data.status === 'DRAFT', 'Project status must be DRAFT');

  console.log('  8b. User B searches public Explore feed...');
  const exploreDraftCheck = await SupabaseService.getProjects({ public_only: true });
  assert(!exploreDraftCheck.data.some(p => p.id === projectA.id), 'Draft project must NOT be visible in public Explore feed');
  console.log('  ✓ Draft privacy verified: Project A is hidden from public Explore.');

  console.log('\n[TEST 9] User A permanently deletes Project A');
  const delRes = await SupabaseService.deleteProject(projectA.id, userA.id);
  assert(!delRes.error, 'Project deletion by owner must succeed');
  const fetchDeleted = await SupabaseService.getProjectById(projectA.id);
  assert(fetchDeleted.data === null || fetchDeleted.error, 'Deleted project must not exist');
  console.log('  ✓ Project deletion verified.');

  console.log('\n====================================================');
  console.log('>>> ALL PHASE 2 PROJECT MANAGEMENT TESTS PASSED! <<<');
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
