/**
 * INNOVEXA Similarity Engine (Blueprint Section 10)
 * 
 * Formula:
 * Similarity Score = 
 *   30% Category Similarity +
 *   25% Keyword Similarity +
 *   20% Problem Similarity +
 *   15% Feature Similarity +
 *   10% Target User Similarity
 */

// Helper to tokenize text into lowercase words (ignoring common stop words)
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to',
  'for', 'with', 'by', 'about', 'against', 'between', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'from', 'up', 'down', 'of', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any',
  'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should',
  'now', 'an', 'our', 'we', 'they', 'them', 'their', 'this', 'that', 'these', 'those', 'i', 'you'
]);

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

// Calculate Jaccard similarity between two arrays of tokens/strings
function jaccardSimilarity(arrA, arrB) {
  const setA = new Set(arrA.map(s => s.toLowerCase().trim()));
  const setB = new Set(arrB.map(s => s.toLowerCase().trim()));
  if (setA.size === 0 && setB.size === 0) return 0;
  
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount++;
  }
  const unionCount = new Set([...setA, ...setB]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Calculates similarity between a target innovation (or draft) and an existing innovation
 */
export function calculateInnovationSimilarity(target, candidate) {
  // 1. Category Similarity (30%)
  const categoryMatch = (target.category_id && candidate.category_id && target.category_id === candidate.category_id) ||
    (target.category_name && candidate.category_name && target.category_name.toLowerCase() === candidate.category_name.toLowerCase())
    ? 1.0
    : 0.0;

  // 2. Keyword / Tag Similarity (25%)
  const targetKeywords = [
    ...(target.tags || []),
    ...tokenize(target.title || ''),
    ...tokenize(target.short_description || '')
  ];
  const candidateKeywords = [
    ...(candidate.tags || []),
    ...tokenize(candidate.title || ''),
    ...tokenize(candidate.short_description || '')
  ];
  const keywordScore = jaccardSimilarity(targetKeywords, candidateKeywords);

  // 3. Problem Statement Similarity (20%)
  const targetProblemTokens = tokenize(target.problem_statement || target.description || '');
  const candidateProblemTokens = tokenize(candidate.problem_statement || candidate.description || '');
  const problemScore = jaccardSimilarity(targetProblemTokens, candidateProblemTokens);

  // 4. Feature Similarity (15%)
  const targetFeatures = target.features || [];
  const candidateFeatures = candidate.features || [];
  let featureScore = 0;
  if (targetFeatures.length > 0 && candidateFeatures.length > 0) {
    const targetFeatureTokens = targetFeatures.flatMap(f => tokenize(f));
    const candidateFeatureTokens = candidateFeatures.flatMap(f => tokenize(f));
    featureScore = jaccardSimilarity(targetFeatureTokens, candidateFeatureTokens);
  }

  // 5. Target User Similarity (10%)
  const targetUserTokens = tokenize(target.target_users || '');
  const candidateUserTokens = tokenize(candidate.target_users || '');
  const userScore = jaccardSimilarity(targetUserTokens, candidateUserTokens);

  // Weighted total (Blueprint Section 10)
  const weightedScore =
    0.30 * categoryMatch +
    0.25 * keywordScore +
    0.20 * problemScore +
    0.15 * featureScore +
    0.10 * userScore;

  // Percentage integer (0 to 100)
  const similarityPercent = Math.min(99, Math.round(weightedScore * 100));

  // Determine common and differentiation features
  const commonTokens = new Set(
    targetKeywords.filter(k => candidateKeywords.includes(k))
  );

  return {
    similarityScore: similarityPercent,
    breakdown: {
      category: Math.round(categoryMatch * 100),
      keyword: Math.round(keywordScore * 100),
      problem: Math.round(problemScore * 100),
      feature: Math.round(featureScore * 100),
      targetUser: Math.round(userScore * 100)
    },
    commonKeywords: Array.from(commonTokens).slice(0, 5),
  };
}

/**
 * Finds top 3-5 related innovations from the pool for a given draft/submission
 */
export function findRelatedInnovations(draft, allInnovations, limit = 4) {
  if (!allInnovations || allInnovations.length === 0) return [];

  const results = allInnovations
    .filter(candidate => candidate.id !== draft.id) // Exclude self if already exists
    .map(candidate => {
      const { similarityScore, breakdown, commonKeywords } = calculateInnovationSimilarity(draft, candidate);
      return {
        innovation: candidate,
        similarityScore,
        breakdown,
        commonKeywords,
      };
    })
    // Filter out 0% match if there are better candidates, but ensure at least some fallback
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);

  return results;
}
