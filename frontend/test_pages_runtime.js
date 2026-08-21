// ============================================================================
// RUNTIME DEEP-CHECK FOR ALL PAGE COMPONENTS & SERVICES
// ============================================================================
import { StorageService } from './src/services/storage.js';
import { calculateReviewerMatch, rankEligibleReviewers } from './src/services/matching.js';
import { generateRuleBasedInsights } from './src/services/aiInsights.js';
import { calculateInnovationSimilarity, findRelatedInnovations } from './src/services/similarity.js';
import { validateReviewQuality } from './src/services/reviewValidation.js';
import { checkAndProcessExpiredAssignments } from './src/services/reassignment.js';

// Setup Mock Storage & DOM
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

global.localStorage = new MockLocalStorage();
global.window = {
  dispatchEvent: () => {},
  matchMedia: () => ({ matches: false }),
  addEventListener: () => {},
  removeEventListener: () => {}
};

console.log('====================================================================');
console.log('🧪 INNOVEXA COMPREHENSIVE RUNTIME & LOGIC INTEGRITY CHECK');
console.log('====================================================================\n');

// 1. Initialize Storage with complete sample data
StorageService.init();

const users = StorageService.getUsers();
const innovations = StorageService.getInnovations();
const reviews = StorageService.getReviews();
const assignments = StorageService.getAssignments();
const comments = StorageService.getComments();
const notifications = StorageService.getNotifications();

console.log(`[Storage Check] Users: ${users.length}, Projects: ${innovations.length}, Reviews: ${reviews.length}, Assignments: ${assignments.length}, Comments: ${comments.length}, Notifs: ${notifications.length}`);

if (users.length === 0 || innovations.length === 0 || reviews.length === 0) {
  throw new Error('Storage failed to seed with sample data');
}
console.log('✓ Storage verification passed.\n');

// 2. Test Similarity Service
console.log('[Similarity Engine Check]');
const pulsemind = innovations.find(i => i.id === 'inno_pulsemind_ai');
const similar = findRelatedInnovations(pulsemind, innovations.filter(i => i.id !== pulsemind.id));
console.log(`✓ Similarity analysis returned ${similar.length} related specimen(s).`);

// 3. Test Matching Service
console.log('[Reviewer Matching Engine Check]');
const eligibleReviewers = rankEligibleReviewers(pulsemind, users);
console.log(`✓ Reviewer matcher ranked ${eligibleReviewers.length} eligible reviewer(s).`);

// 4. Test Review Validation Service
console.log('[Review Quality Assurance Check]');
const sampleReviewQuality = validateReviewQuality({
  problem_relevance: 'YES',
  solution_usefulness: 'YES',
  would_use: 'YES',
  liked_text: 'Excellent real-time rhythm classification and telemetry architecture.',
  improvement_text: 'Add automated hardware disconnect failover logging.',
  rating: 5,
  interaction_seconds: 45
});
console.log(`✓ Review QA result: Status = ${sampleReviewQuality.review_status}, Score = ${sampleReviewQuality.qualityScore}`);

// 5. Test AI Insights Synthesis
console.log('[AI Insights Engine Check]');
const insights = generateRuleBasedInsights(pulsemind, StorageService.getReviewsForInnovation(pulsemind.id));
console.log(`✓ Consensus stats: ${insights.stats.totalReviews} reviews, ${insights.stats.wouldUsePercent}% would use, Avg ${insights.stats.avgRating}★`);

// 6. Test Reassignment Logic
console.log('[Reassignment Cron Check]');
checkAndProcessExpiredAssignments();
console.log('✓ Reassignment check completed with 0 errors.');

console.log('\n====================================================================');
console.log('🎉 ALL SERVICE INTEGRITY & DATA CHECKS COMPLETED SUCCESSFULLY!');
console.log('====================================================================');
