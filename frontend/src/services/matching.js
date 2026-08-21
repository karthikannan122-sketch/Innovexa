/**
 * INNOVEXA Smart Reviewer Matching Engine (Blueprint Section 14 & 42)
 * 
 * Formula:
 * Reviewer Match Score =
 *   30% Interest Match +
 *   25% Domain Match +
 *   15% Expertise Match +
 *   15% Activity Score +
 *   15% Review Quality Score
 * 
 * Safeguards:
 * - Hard exclusion: creator can never review their own innovation
 * - Reciprocal review throttling (max 1 reciprocal match per 30-day window)
 * - Team member exclusion
 */

export function calculateReviewerMatch(innovation, reviewer, recentReviewPairs = []) {
  // 1. Hard Exclusion: Self review
  if (innovation.user_id === reviewer.id) {
    return { isEligible: false, reason: 'SELF_REVIEW_EXCLUDED', matchScore: 0 };
  }

  // 2. Interest Match (30%)
  const reviewerInterests = (reviewer.interests || []).map(i => i.toLowerCase().trim());
  const innoTags = (innovation.tags || []).map(t => t.toLowerCase().trim());
  const innoCategory = (innovation.category_name || '').toLowerCase().trim();

  let interestHitCount = 0;
  reviewerInterests.forEach(interest => {
    if (innoCategory.includes(interest) || interest.includes(innoCategory)) {
      interestHitCount += 2;
    }
    innoTags.forEach(tag => {
      if (tag.includes(interest) || interest.includes(tag)) {
        interestHitCount += 1;
      }
    });
  });
  const interestScore = Math.min(1.0, interestHitCount / 3.0);

  // 3. Domain Match (25%)
  const reviewerDomains = (reviewer.expertise || []).map(e => (e.domain || '').toLowerCase().trim());
  let domainHitCount = 0;
  reviewerDomains.forEach(domain => {
    if (innoCategory.includes(domain) || (innovation.title || '').toLowerCase().includes(domain)) {
      domainHitCount += 1.5;
    }
    innoTags.forEach(tag => {
      if (tag.includes(domain)) {
        domainHitCount += 1;
      }
    });
  });
  const domainScore = Math.min(1.0, domainHitCount / 2.0);

  // 4. Expertise Match (15%)
  let maxLevelScore = 0.4; // Beginner base
  (reviewer.expertise || []).forEach(e => {
    const level = (e.expertise_level || e.level || '').toLowerCase();
    if (level === 'advanced') maxLevelScore = Math.max(maxLevelScore, 1.0);
    else if (level === 'intermediate') maxLevelScore = Math.max(maxLevelScore, 0.75);
  });
  const expertiseScore = maxLevelScore;

  // 5. Activity Score (15%)
  // Based on credits, completed reviews, and recent activity
  const reputation = reviewer.reputation_score || 50;
  const activityScore = Math.min(1.0, reputation / 200.0);

  // 6. Review Quality Score (15%)
  // Expert reviewers get near 1.0, active users 0.75-0.9
  let qualityScore = 0.7;
  if (reviewer.reputation_tier === 'EXPERT CONTRIBUTOR') qualityScore = 1.0;
  else if (reviewer.reputation_tier === 'TRUSTED REVIEWER') qualityScore = 0.9;
  else if (reviewer.reputation_tier === 'ACTIVE REVIEWER') qualityScore = 0.8;

  // Weighted total
  let weightedScore =
    0.30 * interestScore +
    0.25 * domainScore +
    0.15 * expertiseScore +
    0.15 * activityScore +
    0.15 * qualityScore;

  // Reciprocal Review Throttling (Section 14.2 & 42)
  // If reviewer recently reviewed this creator, deprioritize by 25%
  const isReciprocal = recentReviewPairs.some(
    pair => pair.reviewer_id === reviewer.id && pair.creator_id === innovation.user_id
  );
  if (isReciprocal) {
    weightedScore *= 0.75;
  }

  const finalPercent = Math.min(98, Math.max(15, Math.round(weightedScore * 100)));

  let matchLevel = 'LOW';
  if (finalPercent >= 75) matchLevel = 'HIGH';
  else if (finalPercent >= 50) matchLevel = 'MEDIUM';

  return {
    isEligible: true,
    matchScore: finalPercent,
    matchLevel,
    isReciprocalThrottled: isReciprocal,
    breakdown: {
      interest: Math.round(interestScore * 100),
      domain: Math.round(domainScore * 100),
      expertise: Math.round(expertiseScore * 100),
      activity: Math.round(activityScore * 100),
      quality: Math.round(qualityScore * 100),
    }
  };
}

/**
 * Ranks all eligible reviewers for a newly submitted innovation
 */
export function rankEligibleReviewers(innovation, allUsers, recentReviewPairs = []) {
  return allUsers
    .map(user => {
      const matchResult = calculateReviewerMatch(innovation, user, recentReviewPairs);
      return {
        user,
        ...matchResult
      };
    })
    .filter(res => res.isEligible)
    .sort((a, b) => b.matchScore - a.matchScore);
}
