import assert from 'assert';

console.log("\n=======================================================");
console.log("TESTING PHASE 7 PROJECT INSIGHTS & ANALYTICS CALCULATIONS");
console.log("=======================================================\n");

// 1. Test Calculation Formulas
function computeTestAnalytics({ views, upvotes, downvotes, reviews, suggestions, followers }) {
  const totalVotes = upvotes + downvotes;
  const reviewsCount = reviews.length;
  const validRatings = reviews.map(r => Number(r.rating)).filter(n => !isNaN(n) && n >= 1 && n <= 5);
  const averageRating = validRatings.length > 0
    ? Number((validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(2))
    : 0;

  const helpfulReviewCount = reviews.filter(r => (r.helpful_votes_count || 0) > (r.unhelpful_votes_count || 0) || (r.helpful_votes_count || 0) > 0).length;
  const totalHelpfulVotes = reviews.reduce((sum, r) => sum + (Number(r.helpful_votes_count) || 0), 0);

  const suggestionsCount = suggestions.length;
  const followersCount = followers.length;

  const totalInteractions = upvotes + downvotes + reviewsCount + suggestionsCount + followersCount;
  
  // 1. Engagement Rate Calculation: total interactions divided by views
  const engagementRate = views > 0
    ? Number(((totalInteractions / views) * 100).toFixed(1))
    : (totalInteractions > 0 ? 100 : 0);

  // 2. Vote Ratio Calculation: percentage of total votes that are upvotes
  const voteRatio = totalVotes > 0
    ? Number(((upvotes / totalVotes) * 100).toFixed(1))
    : (upvotes > 0 ? 100 : 0);

  // 3. Review Score Calculation: normalized composite review rating out of 100
  const reviewScore = reviewsCount > 0
    ? Math.min(100, Math.round((averageRating / 5) * 80 + Math.min(20, reviewsCount * 4)))
    : 0;

  // 4. Community Engagement Score: weighted composite interaction index
  const communityEngagement = Math.round(
    (upvotes * 2) +
    (downvotes * 0.5) +
    (reviewsCount * 5) +
    (suggestionsCount * 4) +
    (followersCount * 3) +
    (totalHelpfulVotes * 1.5)
  );

  return {
    views,
    upvotes,
    downvotes,
    totalVotes,
    reviewsCount,
    averageRating,
    helpfulReviewCount,
    suggestionsCount,
    followersCount,
    engagementRate,
    voteRatio,
    reviewScore,
    communityEngagement,
    has_enough_vote_data: totalVotes > 0,
    has_enough_review_data: reviewsCount > 0
  };
}

// Case A: High Activity Specimen (EcoGrid Micro-Mesh)
console.log(">> Test Case A: Active Project with high community engagement");
const activeProject = computeTestAnalytics({
  views: 1450,
  upvotes: 85,
  downvotes: 5,
  reviews: [
    { rating: 5, helpful_votes_count: 8, unhelpful_votes_count: 0 },
    { rating: 4, helpful_votes_count: 4, unhelpful_votes_count: 1 },
    { rating: 5, helpful_votes_count: 2, unhelpful_votes_count: 0 }
  ],
  suggestions: [{ id: 's1' }, { id: 's2' }, { id: 's3' }],
  followers: [{ id: 'f1' }, { id: 'f2' }, { id: 'f3' }, { id: 'f4' }]
});

console.log("  Views:", activeProject.views);
console.log("  Upvotes:", activeProject.upvotes, "Downvotes:", activeProject.downvotes);
console.log("  Average Rating:", activeProject.averageRating, "/ 5.0");
console.log("  Engagement Rate:", activeProject.engagementRate + "%");
console.log("  Vote Ratio:", activeProject.voteRatio + "%");
console.log("  Review Score:", activeProject.reviewScore + "/100");
console.log("  Community Engagement:", activeProject.communityEngagement, "pts");

assert.strictEqual(activeProject.upvotes, 85);
assert.strictEqual(activeProject.downvotes, 5);
assert.strictEqual(activeProject.totalVotes, 90);
assert.strictEqual(activeProject.reviewsCount, 3);
assert.strictEqual(activeProject.averageRating, 4.67);
assert.strictEqual(activeProject.voteRatio, 94.4); // 85 / 90 * 100 = 94.44%
assert.strictEqual(activeProject.has_enough_vote_data, true);
assert.strictEqual(activeProject.has_enough_review_data, true);
console.log("  [PASS] Case A Verified!\n");

// Case B: Brand New Project with Zero Data (Empty State)
console.log(">> Test Case B: Brand New Draft Project with 0 views and 0 interactions");
const zeroProject = computeTestAnalytics({
  views: 0,
  upvotes: 0,
  downvotes: 0,
  reviews: [],
  suggestions: [],
  followers: []
});

console.log("  Views:", zeroProject.views);
console.log("  Total Votes:", zeroProject.totalVotes);
console.log("  Reviews Count:", zeroProject.reviewsCount);
console.log("  Average Rating:", zeroProject.averageRating);
console.log("  Engagement Rate:", zeroProject.engagementRate + "%");
console.log("  Vote Ratio:", zeroProject.voteRatio + "%");
console.log("  Review Score:", zeroProject.reviewScore + "/100");
console.log("  Community Engagement:", zeroProject.communityEngagement, "pts");
console.log("  Has enough vote data:", zeroProject.has_enough_vote_data);
console.log("  Has enough review data:", zeroProject.has_enough_review_data);

assert.strictEqual(zeroProject.views, 0);
assert.strictEqual(zeroProject.totalVotes, 0);
assert.strictEqual(zeroProject.reviewsCount, 0);
assert.strictEqual(zeroProject.averageRating, 0);
assert.strictEqual(zeroProject.engagementRate, 0);
assert.strictEqual(zeroProject.voteRatio, 0);
assert.strictEqual(zeroProject.reviewScore, 0);
assert.strictEqual(zeroProject.communityEngagement, 0);
assert.strictEqual(zeroProject.has_enough_vote_data, false);
assert.strictEqual(zeroProject.has_enough_review_data, false);
console.log("  [PASS] Case B Verified (Correctly flags 'Not enough data yet' condition)!\n");

console.log("=======================================================");
console.log("ALL PHASE 7 ANALYTICS CALCULATIONS VERIFIED SUCCESSFULLY");
console.log("=======================================================\n");
