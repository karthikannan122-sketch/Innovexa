/**
 * test_community_and_insights.js
 * Comprehensive Multi-User Automated Verification Suite for Community Hub, Resources, Unified Voting & Insights Engine
 */

// Polyfill localStorage & window for headless Node.js test execution
if (typeof global !== 'undefined' && typeof global.localStorage === 'undefined') {
  const store = {};
  global.localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}
if (typeof global.window === 'undefined') {
  global.window = {
    dispatchEvent: () => {},
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

const { StorageService } = await import('./src/services/storage.js');

console.log('================================================================');
console.log('🧪 INNOVEXA: COMMUNITY HUB, VOTING & INSIGHTS VERIFICATION SUITE');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

// Initialize storage
StorageService.init();

// Set active user as User A
const userA = 'usr_karthick_founder';
const userB = 'usr_sarah_reviewer';
StorageService.setCurrentUserId(userA);

// ============================================================================
// TEST A: Discussion Creation & Multi-User Polymorphic Voting
// ============================================================================
console.log('----------------------------------------------------------------');
console.log('TEST A: Discussion Creation & Multi-User Polymorphic Voting');
console.log('----------------------------------------------------------------');

const newPost = StorageService.createCommunityPost({
  title: 'Benchmarking Spiking Neural Networks on Microcontrollers',
  content: 'How do you optimize temporal window sizes for continuous biosensor anomaly detection without buffer overflow?',
  post_type: 'QUESTION',
  category_id: 'cat_ai',
  category_name: 'AI & Machine Learning',
  tags: ['Neuromorphic', 'SNN', 'EdgeAI']
});

assert(newPost && newPost.id.startsWith('post_'), 'Discussion successfully created with valid ID');
assert(newPost.post_type === 'QUESTION', 'Post type set to QUESTION correctly');
assert(newPost.upvotes_count === 0, 'Initial upvotes count is 0');

// User B upvotes User A's post
const vote1 = StorageService.toggleVote({
  userId: userB,
  targetType: 'discussion',
  targetId: newPost.id,
  voteType: 'upvote'
});

assert(vote1.activeVoteType === 'upvote', 'User B active vote type is upvote');
assert(vote1.upvotesCount === 1, 'Post upvotes count incremented to 1');

// User B clicks upvote again (toggle removal)
const vote2 = StorageService.toggleVote({
  userId: userB,
  targetType: 'discussion',
  targetId: newPost.id,
  voteType: 'upvote'
});

assert(vote2.activeVoteType === null, 'Clicking upvote again successfully removes the active vote');
assert(vote2.upvotesCount === 0, 'Post upvotes count decremented back to 0');

// User B switches to downvote
const vote3 = StorageService.toggleVote({
  userId: userB,
  targetType: 'discussion',
  targetId: newPost.id,
  voteType: 'downvote'
});

assert(vote3.activeVoteType === 'downvote', 'User B vote successfully switched to downvote');
assert(vote3.downvotesCount === 1, 'Post downvotes count is 1');
assert(vote3.upvotesCount === 0, 'Post upvotes count remains 0 without duplicate records');

// ============================================================================
// TEST B: Threaded Comments & Interaction
// ============================================================================
console.log('\n----------------------------------------------------------------');
console.log('TEST B: Threaded Discussion Comments & Upvoting');
console.log('----------------------------------------------------------------');

// User B posts a reply
StorageService.setCurrentUserId(userB);
const comment1 = StorageService.createCommunityComment({
  post_id: newPost.id,
  content: 'We use dynamic sliding temporal frames with 250ms decay kernels to avoid queue buildup.'
});

assert(comment1 && comment1.id.startsWith('comm_'), 'Reply comment successfully created');
assert(comment1.post_id === newPost.id, 'Comment linked to correct parent discussion');

// Check post comments_count
const updatedPosts = StorageService.getCommunityPosts();
const refetchedPost = updatedPosts.find(p => p.id === newPost.id);
assert(refetchedPost.comments_count >= 1, `Discussion comments_count updated to ${refetchedPost.comments_count}`);

// User A upvotes User B's comment
const commentVote = StorageService.toggleVote({
  userId: userA,
  targetType: 'comment',
  targetId: comment1.id,
  voteType: 'upvote'
});

assert(commentVote.activeVoteType === 'upvote', 'User A successfully upvoted comment');
assert(commentVote.upvotesCount === 1, 'Comment upvotes count incremented to 1');

// ============================================================================
// TEST C: Resource Sharing & Bookmarking
// ============================================================================
console.log('\n----------------------------------------------------------------');
console.log('TEST C: Resource Sharing & Bookmarks');
console.log('----------------------------------------------------------------');

StorageService.setCurrentUserId(userB);
const resource = StorageService.createCommunityResource({
  title: 'MIT-BIH Arrhythmia Database Protocol Spec',
  description: 'Standardized annotations for 48 half-hour excerpts of two-channel ambulatory ECG recordings.',
  resource_url: 'https://physionet.org/content/mitdb/1.0.0/',
  resource_type: 'RESEARCH',
  category_id: 'cat_health',
  category_name: 'Healthcare & Biotech',
  tags: ['Cardiology', 'Benchmark', 'ECG']
});

assert(resource && resource.id.startsWith('res_'), 'Resource successfully published to matrix');
assert(resource.resource_type === 'RESEARCH', 'Resource type registered as RESEARCH');

// User A bookmarks the resource
const isBookmarked = StorageService.toggleResourceBookmark(resource.id, userA);
assert(isBookmarked === true, 'User A bookmarked resource');

const userABookmarks = StorageService.getUserResourceBookmarks(userA);
assert(userABookmarks.includes(resource.id), 'Resource present in User A bookmarks list');

// User A unbookmarks resource
const isUnbookmarked = StorageService.toggleResourceBookmark(resource.id, userA);
assert(isUnbookmarked === false, 'User A toggled bookmark off');

// ============================================================================
// TEST D: Review Quality Scoring & Helpful / Not Helpful Review Voting
// ============================================================================
console.log('\n----------------------------------------------------------------');
console.log('TEST D: Review Quality Signals & Review Helpfulness Voting');
console.log('----------------------------------------------------------------');

const detailedReview = {
  rating: 5,
  overall_feedback: 'Outstanding technical design. The local ONNX inference pipeline handles streaming signal buffers with under 15ms latency on low-cost hardware.',
  suggestion: 'Consider documenting fallback protocols when cellular telemetry fails in remote environments.',
  problem_relevance: 'YES',
  would_use: 'YES'
};

const qualitySignal1 = StorageService.getReviewQuality(detailedReview, 6);
assert(qualitySignal1.label === 'HIGHLY HELPFUL', `Review scored as ${qualitySignal1.label} (Score: ${qualitySignal1.score})`);

const briefReview = {
  rating: 4,
  overall_feedback: 'Looks good.',
  suggestion: '',
  problem_relevance: 'YES',
  would_use: 'YES'
};

const qualitySignal2 = StorageService.getReviewQuality(briefReview, 0);
assert(qualitySignal2.label === 'COMMUNITY FEEDBACK', `Brief review scored as ${qualitySignal2.label}`);

// Review Helpful voting
const existingReviews = StorageService.getReviews();
if (existingReviews.length > 0) {
  const targetReview = existingReviews.find(r => r.id === 'rev_pulsemind_2') || existingReviews[0];
  const revVote = StorageService.toggleVote({
    userId: userA,
    targetType: 'review',
    targetId: targetReview.id,
    voteType: 'upvote'
  });

  assert(revVote.activeVoteType === 'upvote', 'User A voted review helpful');
  assert(revVote.upvotesCount >= 1, `Review helpful votes count is ${revVote.upvotesCount}`);
}

// ============================================================================
// TEST E: User Innovation Insights Aggregator
// ============================================================================
console.log('\n----------------------------------------------------------------');
console.log('TEST E: User Innovation Insights & Consensus Analytics');
console.log('----------------------------------------------------------------');

const insightsUserA = StorageService.getUserInnovationInsights(userA);

assert(insightsUserA !== null, 'Generated innovation insights object');
assert(insightsUserA.activity.projectsCreated > 0, `User A projects created: ${insightsUserA.activity.projectsCreated}`);
assert(insightsUserA.projectPerformance.length > 0, `User A project performance items: ${insightsUserA.projectPerformance.length}`);
assert(['POSITIVE', 'MIXED', 'NEEDS ATTENTION'].includes(insightsUserA.projectPerformance[0].sentiment), `Project sentiment correctly classified as ${insightsUserA.projectPerformance[0].sentiment}`);
assert(insightsUserA.feedbackInsights.topStrengths.length > 0, 'Feedback insights contains identified strengths');
assert(insightsUserA.feedbackInsights.commonConcerns.length > 0, 'Feedback insights contains identified friction points');
assert(typeof insightsUserA.feedbackInsights.recommendedAction === 'string', `Action recommended: "${insightsUserA.feedbackInsights.recommendedAction}"`);

// ============================================================================
// TEST F: Contextual Empty State for New User
// ============================================================================
console.log('\n----------------------------------------------------------------');
console.log('TEST F: Contextual Onboarding & Empty States');
console.log('----------------------------------------------------------------');

const newUserId = 'usr_brand_new_member';
const newInsights = StorageService.getUserInnovationInsights(newUserId);

assert(newInsights.activity.projectsCreated === 0, 'New user has 0 projects');
assert(newInsights.activity.reviewsGiven === 0, 'New user has 0 reviews given');
assert(newInsights.feedbackInsights.totalReviewsReceived === 0, 'New user has 0 reviews received');
assert(newInsights.feedbackInsights.recommendedAction.includes('review'), 'Contextual onboarding guidance provided instead of broken state');

// Summary
console.log('\n================================================================');
console.log(`🏁 TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
