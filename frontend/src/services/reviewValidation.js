/**
 * INNOVEXA Review Validation & Anti-Spam Gate (Sections 17, 18, 41)
 * 
 * Rules:
 * 1. Required structured questions: 4/4 answered
 * 2. Minimum written response length: ≥ 15 words
 * 3. Minimum interaction time: ≥ 20 seconds
 * 4. Duplicate similarity ceiling: < 85%
 * 5. Burst-submission spam trigger: > 3 reviews in 60s
 * 6. Quality scoring: 30% Completion + 30% Meaningful Text + 20% Uniqueness + 20% Consistency
 */

function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

// Simple Levenshtein or token-overlap ratio for duplicate detection
function textSimilarityRatio(textA, textB) {
  if (!textA || !textB) return 0;
  const wordsA = new Set(textA.toLowerCase().split(/\s+/));
  const wordsB = new Set(textB.toLowerCase().split(/\s+/));
  let matchCount = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) matchCount++;
  }
  const maxLen = Math.max(wordsA.size, wordsB.size);
  return maxLen === 0 ? 0 : matchCount / maxLen;
}

export function validateReviewSubmission({
  problem_relevance,
  solution_usefulness,
  would_use,
  rating,
  liked_text = '',
  improvement_text = '',
  feature_request = '',
  interaction_seconds = 0,
  reviewer_id,
  user_past_reviews = []
}) {
  const issues = [];

  // 1. Check 4/4 structured fields
  const hasRelevance = Boolean(problem_relevance);
  const hasUsefulness = Boolean(solution_usefulness);
  const hasWouldUse = Boolean(would_use);
  const hasRating = Boolean(rating && rating >= 1 && rating <= 5);
  const structuredComplete = hasRelevance && hasUsefulness && hasWouldUse && hasRating;

  if (!structuredComplete) {
    issues.push('All 4 structured questions (Problem, Solution, Would Use, Rating) must be answered.');
  }

  // 2. Minimum written length (≥ 15 words across inputs)
  const combinedText = `${liked_text} ${improvement_text} ${feature_request}`.trim();
  const wordCount = countWords(combinedText);
  const meetsWordCount = wordCount >= 15;

  if (!meetsWordCount) {
    issues.push(`Written feedback must be at least 15 words (currently ${wordCount} words).`);
  }

  // 3. Check for single repeated character or repeated word spam
  const words = combinedText.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const isRepetitive = words.length > 10 && (uniqueWords.size / words.length) < 0.35;
  if (isRepetitive) {
    issues.push('Feedback contains repetitive or gibberish words.');
  }

  // 4. Minimum interaction time (≥ 20 seconds)
  const meetsTime = interaction_seconds >= 20;
  if (!meetsTime) {
    issues.push(`Minimum interaction time is 20s to ensure genuine review (elapsed: ${Math.round(interaction_seconds)}s).`);
  }

  // 5. Burst submission check (> 3 reviews within last 60 seconds)
  const now = Date.now();
  const recentReviewsIn60s = user_past_reviews.filter(r => {
    const revTime = new Date(r.created_at).getTime();
    return (now - revTime) < 60 * 1000;
  });
  const isBurstSpam = recentReviewsIn60s.length >= 3;
  if (isBurstSpam) {
    issues.push('Rate limit: More than 3 reviews submitted within 60 seconds.');
  }

  // 6. Duplicate text similarity check against user past reviews (< 85%)
  let maxDuplicateRatio = 0;
  for (const pastRev of user_past_reviews) {
    const pastText = `${pastRev.liked_text || ''} ${pastRev.improvement_text || ''} ${pastRev.feature_request || ''}`.trim();
    const ratio = textSimilarityRatio(combinedText, pastText);
    if (ratio > maxDuplicateRatio) maxDuplicateRatio = ratio;
  }
  const isDuplicate = maxDuplicateRatio >= 0.85;
  if (isDuplicate) {
    issues.push('Feedback text is more than 85% identical to another review you previously submitted.');
  }

  // 7. Calculate Consistency Score
  // e.g. 5-star rating with would_use = 'NO' and only negative text is inconsistent
  let consistencyScore = 1.0;
  if (rating >= 4 && would_use === 'NO') consistencyScore -= 0.3;
  if (rating <= 2 && would_use === 'YES') consistencyScore -= 0.3;
  if (rating === 5 && problem_relevance === 'NO') consistencyScore -= 0.4;
  consistencyScore = Math.max(0.2, consistencyScore);

  // 8. Calculate Overall Quality Score (Section 18)
  // 30% Completion + 30% Meaningful Text + 20% Uniqueness + 20% Consistency
  const completionScore = structuredComplete ? 1.0 : 0.4;
  const textScore = Math.min(1.0, wordCount / 40.0); // full marks for 40+ words
  const uniquenessScore = isDuplicate ? 0.2 : (1.0 - maxDuplicateRatio);
  
  const overallQuality = Math.round(
    (0.30 * completionScore +
     0.30 * textScore +
     0.20 * uniquenessScore +
     0.20 * consistencyScore) * 100
  );

  // 9. Determine Review Status
  let review_status = 'VALID';
  if (isBurstSpam || isRepetitive || isDuplicate) {
    review_status = 'FLAGGED_SPAM';
  } else if (!structuredComplete || !meetsWordCount || !meetsTime) {
    review_status = 'LOW_QUALITY';
  }

  return {
    isValid: review_status === 'VALID',
    review_status,
    quality_score: overallQuality,
    wordCount,
    interaction_seconds: Math.round(interaction_seconds),
    issues,
    breakdown: {
      completion: Math.round(completionScore * 100),
      meaningfulText: Math.round(textScore * 100),
      uniqueness: Math.round(uniquenessScore * 100),
      consistency: Math.round(consistencyScore * 100),
    }
  };
}

export const validateReviewQuality = validateReviewSubmission;
