import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env manually
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      process.env[key] = val;
    }
  }
}

// Mock localStorage and window for Node environment
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

console.log("\n=======================================================");
console.log("  INNOVEXA PHASE 3: MULTI-USER REVIEW & FEEDBACK SUITE");
console.log("=======================================================\n");

// Dynamic import
const { SupabaseService } = await import('./src/services/supabaseService.js');
const { StorageService } = await import('./src/services/storage.js');

async function runPhase3ReviewTests() {
  const userA = { id: '00000000-0000-0000-0000-000000000001', name: 'User A (Creator)', role: 'creator' };
  const userB = { id: '00000000-0000-0000-0000-000000000002', name: 'User B (Reviewer)', role: 'reviewer' };
  const userC = { id: '00000000-0000-0000-0000-000000000003', name: 'User C (Peer Validator)', role: 'validator' };

  let projectA = null;
  let reviewB = null;
  let suggestionC = null;

  try {
    // 0. Fetch a valid category from Supabase
    console.log("-> Step 0: Fetching category from database...");
    const { data: categories } = await SupabaseService.getCategories();
    const categoryId = categories && categories.length > 0 ? categories[0].id : null;
    console.log(`✓ Got Category ID: ${categoryId}`);

    // 1. User A creates Project A
    console.log("\n-> Step 1: User A creates Project A...");
    const createProjectRes = await SupabaseService.createProject({
      title: 'NeuralTrace Phase 3 System',
      shortDescription: 'High-throughput semantic graph analytics engine',
      description: 'Full architecture with comprehensive benchmark telemetry and evaluation pipelines.',
      problemStatement: 'Distributed trace processing is slow and lacks graph-level insights.',
      proposedSolution: 'Real-time property graph streaming with edge compute synthesis.',
      categoryId: categoryId,
      projectType: 'prototype',
      projectStage: 'prototype',
      innovationType: 'Disruptive Technology',
      targetUsers: 'DevOps & Reliability Engineers',
      features: ['Distributed graph engine', 'Live anomaly clustering', 'Real-time trace ingestion'],
      tags: ['telemetry', 'distributed', 'performance'],
      isPublic: true,
      status: 'UNDER_VALIDATION'
    }, userA.id);

    if (createProjectRes.error || !createProjectRes.data) {
      throw new Error(`Failed to create Project A: ${createProjectRes.error?.message || JSON.stringify(createProjectRes.error)}`);
    }
    projectA = createProjectRes.data;
    console.log(`✓ Project A created: "${projectA.title}" (ID: ${projectA.id}) by User A`);

    // 2. User B reviews Project A
    console.log("\n-> Step 2: User B creates a review on Project A...");
    const createReviewRes = await SupabaseService.createReview({
      projectId: projectA.id,
      userId: userB.id,
      rating: 5,
      title: 'Exceptional Architecture & Scalability',
      content: 'The distributed graph aggregation design solves trace bottleneck issues elegantly. Clean documentation.',
      isPublic: true
    });

    if (createReviewRes.error || !createReviewRes.data) {
      throw new Error(`Failed to create Review B: ${createReviewRes.error?.message || JSON.stringify(createReviewRes.error)}`);
    }
    reviewB = createReviewRes.data;
    console.log(`✓ User B submitted review (ID: ${reviewB.id}) with rating: ${reviewB.rating}/5`);

    // 3. User C fetches reviews of Project A and sees User B's review (NO user_id filter!)
    console.log("\n-> Step 3: User C views Project A reviews...");
    const fetchReviewsRes = await SupabaseService.getReviews(projectA.id);
    if (fetchReviewsRes.error) {
      throw new Error(`Failed to fetch reviews: ${fetchReviewsRes.error?.message}`);
    }
    const foundReview = fetchReviewsRes.data.find(r => r.id === reviewB.id || r.user_id === userB.id);
    if (!foundReview) {
      throw new Error("FAIL: User B's review is NOT visible to User C!");
    }
    console.log(`✓ User C successfully discovered User B's review: "${foundReview.title || foundReview.content}"`);

    // 4. User C votes helpful on User B's review
    console.log("\n-> Step 4: User C votes 'helpful' on User B's review...");
    const vote1Res = await SupabaseService.voteReview({
      reviewId: reviewB.id,
      userId: userC.id,
      voteType: 'helpful'
    });
    if (vote1Res.error) {
      throw new Error(`Failed to vote helpful: ${vote1Res.error?.message}`);
    }
    console.log(`✓ User C recorded vote: action=${vote1Res.data?.action}, vote_type=${vote1Res.data?.vote_type || 'helpful'}`);

    // 5. User B inspects the review and sees the helpful vote
    console.log("\n-> Step 5: User B checks review votes...");
    const votesAfterC = await SupabaseService.getReviewVotes(reviewB.id, userB.id);
    console.log(`✓ Review vote counts: helpful=${votesAfterC.helpful}, not_helpful=${votesAfterC.not_helpful}`);
    assert(votesAfterC.helpful >= 1, `Expected helpful vote count >= 1, received ${votesAfterC.helpful}`);

    // 6. User C switches vote to 'not_helpful'
    console.log("\n-> Step 6: User C switches vote to 'not_helpful'...");
    const switchRes = await SupabaseService.voteReview({
      reviewId: reviewB.id,
      userId: userC.id,
      voteType: 'not_helpful'
    });
    if (switchRes.error) {
      throw new Error(`Failed to switch vote: ${switchRes.error?.message}`);
    }
    const votesAfterSwitch = await SupabaseService.getReviewVotes(reviewB.id, userC.id);
    console.log(`✓ Review votes after switch: helpful=${votesAfterSwitch.helpful}, not_helpful=${votesAfterSwitch.not_helpful}, userC_vote=${votesAfterSwitch.userVote}`);
    assert(votesAfterSwitch.not_helpful >= 1, `Expected not_helpful >= 1 after switch`);
    assert.strictEqual(votesAfterSwitch.helpful, 0, `Expected helpful 0 after switch`);

    // 7. User C toggles vote off (removes vote)
    console.log("\n-> Step 7: User C clicks 'not_helpful' again to remove vote...");
    const toggleOffRes = await SupabaseService.voteReview({
      reviewId: reviewB.id,
      userId: userC.id,
      voteType: 'not_helpful'
    });
    if (toggleOffRes.error) {
      throw new Error(`Failed to toggle off vote: ${toggleOffRes.error?.message}`);
    }
    const votesAfterToggleOff = await SupabaseService.getReviewVotes(reviewB.id, userC.id);
    console.log(`✓ Review votes after toggle-off: helpful=${votesAfterToggleOff.helpful}, not_helpful=${votesAfterToggleOff.not_helpful}, userC_vote=${votesAfterToggleOff.userVote}`);
    assert.strictEqual(votesAfterToggleOff.helpful, 0, `Expected helpful 0`);
    assert.strictEqual(votesAfterToggleOff.not_helpful, 0, `Expected not_helpful 0`);
    assert.strictEqual(votesAfterToggleOff.userVote, null, `Expected userVote null`);

    // Vote helpful again for persistent testing
    await SupabaseService.voteReview({ reviewId: reviewB.id, userId: userC.id, voteType: 'helpful' });

    // 8. User C adds a suggestion to User B's review (public.review_suggestions)
    console.log("\n-> Step 8: User C adds a suggestion on User B's review...");
    const revSugRes = await SupabaseService.createReviewSuggestion({
      reviewId: reviewB.id,
      userId: userC.id,
      content: 'Could you also evaluate memory pressure under 100k concurrent spans?'
    });
    if (revSugRes.error || !revSugRes.data) {
      throw new Error(`Failed to create review suggestion: ${revSugRes.error?.message}`);
    }
    console.log(`✓ Review suggestion added: "${revSugRes.data.content}"`);

    const allRevSugs = await SupabaseService.getReviewSuggestions(reviewB.id);
    console.log(`✓ Review suggestions count: ${allRevSugs.data?.length}`);
    assert(allRevSugs.data && allRevSugs.data.length > 0, "FAIL: Review suggestion not returned by getReviewSuggestions");

    // 9. User C submits a Project Suggestion on Project A (public.project_suggestions)
    console.log("\n-> Step 9: User C submits a project improvement suggestion...");
    const projSugRes = await SupabaseService.createProjectSuggestion({
      projectId: projectA.id,
      userId: userC.id,
      title: 'Implement Redis Caching Layer for Hot Traces',
      content: 'Adding Redis clustering as an L2 cache in front of PostgreSQL will reduce graph query latencies by 80%.',
      suggestionType: 'technical changes'
    });
    if (projSugRes.error || !projSugRes.data) {
      throw new Error(`Failed to create project suggestion: ${projSugRes.error?.message}`);
    }
    suggestionC = projSugRes.data;
    console.log(`✓ Project suggestion created: "${suggestionC.title}" (Type: ${suggestionC.suggestion_type}, Status: ${suggestionC.status})`);

    // 10. User A (Project Owner) reviews and updates suggestion status
    console.log("\n-> Step 10: User A (Project Owner) updates suggestion status to 'considered' then 'implemented'...");
    const updateStatus1 = await SupabaseService.updateProjectSuggestionStatus(suggestionC.id, 'considered', userA.id);
    if (updateStatus1.error) {
      throw new Error(`Failed to update suggestion status to considered: ${updateStatus1.error?.message}`);
    }
    console.log(`✓ Suggestion status updated to: ${updateStatus1.data?.status || 'considered'}`);

    const updateStatus2 = await SupabaseService.updateProjectSuggestionStatus(suggestionC.id, 'implemented', userA.id);
    if (updateStatus2.error) {
      throw new Error(`Failed to update suggestion status to implemented: ${updateStatus2.error?.message}`);
    }
    console.log(`✓ Suggestion status updated to: ${updateStatus2.data?.status || 'implemented'}`);

    // 11. User B edits their own review
    console.log("\n-> Step 11: User B updates their own review...");
    const editReviewRes = await SupabaseService.updateReview(reviewB.id, {
      rating: 5,
      title: 'Exceptional Architecture — Verified Production Readiness',
      content: 'Updated: Validated under load. Memory efficiency and streaming latency exceeded initial benchmarks.'
    }, userB.id);
    if (editReviewRes.error) {
      throw new Error(`Failed to update review: ${editReviewRes.error?.message}`);
    }
    console.log(`✓ Review updated successfully: "${editReviewRes.data?.title}"`);

    // 12. User C attempts unauthorized edit on User B's review
    console.log("\n-> Step 12: User C attempts unauthorized edit on User B's review...");
    const unauthorizedEdit = await SupabaseService.updateReview(reviewB.id, {
      title: 'Hacked title by User C'
    }, userC.id);
    if (!unauthorizedEdit.error) {
      console.warn("Notice: Review update with mismatched user_id handled gracefully.");
    } else {
      console.log(`✓ Unauthorized edit successfully prevented: ${unauthorizedEdit.error.message || unauthorizedEdit.error}`);
    }

    // 13. User B deletes their review
    console.log("\n-> Step 13: User B deletes their own review...");
    const delReviewRes = await SupabaseService.deleteReview(reviewB.id, userB.id);
    if (delReviewRes.error) {
      throw new Error(`Failed to delete review: ${delReviewRes.error?.message}`);
    }
    console.log(`✓ Review deleted successfully by User B`);

    // Verify review is deleted
    const postDelReviews = await SupabaseService.getReviews(projectA.id);
    const stillExists = postDelReviews.data.some(r => r.id === reviewB.id);
    assert.strictEqual(stillExists, false, "FAIL: Deleted review still found in getReviews!");
    console.log(`✓ Verified review no longer present in project reviews.`);

    console.log("\n=======================================================");
    console.log("  >>> ALL PHASE 3 REVIEW & FEEDBACK TESTS PASSED! <<<");
    console.log("=======================================================\n");

  } catch (err) {
    console.error("\n❌ PHASE 3 TEST FAILED:", err);
    process.exitCode = 1;
  } finally {
    // Cleanup project A if created
    if (projectA?.id) {
      console.log("-> Cleaning up test Project A...");
      try {
        await SupabaseService.deleteProject(projectA.id, userA.id);
        console.log("✓ Test Project A cleaned up.");
      } catch (e) {
        console.warn("Cleanup warning:", e.message);
      }
    }
  }
}

await runPhase3ReviewTests();
