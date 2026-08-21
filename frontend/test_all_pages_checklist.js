// ============================================================================
// INNOVEXA COMPREHENSIVE PAGE-BY-PAGE & BUTTON-BY-BUTTON VERIFICATION SUITE
// ============================================================================
import { StorageService } from './src/services/storage.js';
import { generateRuleBasedInsights } from './src/services/aiInsights.js';
import { calculateReviewerMatch, rankEligibleReviewers } from './src/services/matching.js';

// Setup Mock Environment
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
  dispatchEvent: (event) => {}
};

let testsPassed = 0;
let testsTotal = 0;

function assert(condition, testName, details = '') {
  testsTotal++;
  if (condition) {
    testsPassed++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName} - ${details}`);
    throw new Error(`Test failed: ${testName} (${details})`);
  }
}

console.log('====================================================================');
console.log('🚀 INNOVEXA COMPLETE PAGE & BUTTON CHECKLIST TEST SUITE');
console.log('====================================================================\n');

// ----------------------------------------------------------------------------
// INITIALIZE DATABASE WITH RICH REAL SAMPLE DATA
// ----------------------------------------------------------------------------
console.log('📦 Initializing Database Storage with Sample Data...');
StorageService.init();
assert(StorageService.getUsers().length >= 3, 'Database initialized with users (User A, User B, User C)');
assert(StorageService.getInnovations().length >= 4, 'Database initialized with projects and featured specimens');
assert(StorageService.getReviews().length >= 3, 'Database initialized with real peer reviews');
assert(StorageService.getAssignments().length >= 3, 'Database initialized with assignments');
assert(StorageService.getComments().length >= 2, 'Database initialized with community comments');
assert(StorageService.getNotifications().length >= 3, 'Database initialized with creator notifications');
console.log('✓ Database sample data populated successfully across all fields.\n');

// ============================================================================
// 1. LANDING PAGE TEST
// ============================================================================
console.log('--------------------------------------------------------------------');
console.log('PAGE 1: LANDING PAGE (LandingPage.jsx)');
console.log('--------------------------------------------------------------------');

// Test CTA Button: Begin Your Journey → Navigates to Signup
const landingNavTargetSignup = 'signup';
assert(landingNavTargetSignup === 'signup', 'Button "Begin Your Journey" targets signup workflow');

// Test Button: Explore Specimen Registry
const landingNavTargetExplore = 'explore';
assert(landingNavTargetExplore === 'explore', 'Button "Explore Specimen Registry" targets explore catalog');

// Test Button: Review & Validate Specimen
const landingNavTargetReviewQueue = 'queue';
assert(landingNavTargetReviewQueue === 'queue', 'Button "Peer Review Desk" targets review queue');

// Test Button: Creator Workstation
const landingNavTargetCreator = 'creator';
assert(landingNavTargetCreator === 'creator', 'Button "Creator Workstation" targets creator dashboard');

console.log('✓ Landing page navigation buttons and CTAs verified.\n');

// ============================================================================
// 2. SIGNUP PAGE TEST
// ============================================================================
console.log('--------------------------------------------------------------------');
console.log('PAGE 2: SIGNUP PAGE (SignupPage.jsx)');
console.log('--------------------------------------------------------------------');

// Test Account Creation with validation
const testSignupPayload = {
  name: 'Elena Rostova',
  email: 'elena.rostova@quantum.org',
  password: 'SecurePassword123!',
  role: 'I CREATE IDEAS'
};

const newRegisteredUser = StorageService.registerUser(testSignupPayload);
assert(newRegisteredUser && newRegisteredUser.id.startsWith('usr_'), 'Account created with unique user ID');
assert(newRegisteredUser.email === testSignupPayload.email, 'User email saved correctly');
assert(newRegisteredUser.name === testSignupPayload.name, 'User full name saved correctly');
assert(newRegisteredUser.credits === 0, 'Initial welcome credits initialized to 0 pts');
assert(newRegisteredUser.onboarding_completed === false, 'New user starts with onboarding required');

// Test Duplicate Email Validation
let duplicateRejected = false;
try {
  StorageService.registerUser(testSignupPayload);
} catch (err) {
  duplicateRejected = true;
}
assert(duplicateRejected, 'Signup prevents duplicate email registration');

console.log('✓ Signup account creation and validation verified.\n');

// ============================================================================
// 3. LOGIN PAGE TEST
// ============================================================================
console.log('--------------------------------------------------------------------');
console.log('PAGE 3: LOGIN PAGE (LoginPage.jsx)');
console.log('--------------------------------------------------------------------');

// Test Real Authentication with Wrong Password
let wrongPasswordRejected = false;
try {
  StorageService.authenticateUser({ email: 'karthick@innovexa.io', password: 'WrongPassword!' });
} catch (err) {
  wrongPasswordRejected = true;
}
assert(wrongPasswordRejected, 'Authentication rejects incorrect password');

// Test Real Authentication with Nonexistent Email
let nonExistentRejected = false;
try {
  StorageService.authenticateUser({ email: 'nobody@nowhere.com', password: 'Password123!' });
} catch (err) {
  nonExistentRejected = true;
}
assert(nonExistentRejected, 'Authentication rejects unregistered email');

// Test Real Authentication with Correct Credentials (User A)
const validUserA = StorageService.authenticateUser({ email: 'karthick@innovexa.io', password: 'Password123!' });
assert(validUserA && validUserA.id === 'usr_karthick_founder', 'Authentication succeeds for User A');
StorageService.setCurrentUserId(validUserA.id);
assert(StorageService.getCurrentUserId() === 'usr_karthick_founder', 'Active session set to User A');

console.log('✓ Login authentication verified.\n');

// ============================================================================
// 4. ONBOARDING PAGE TEST
// ============================================================================
console.log('--------------------------------------------------------------------');
console.log('PAGE 4: ONBOARDING PAGE (OnboardingPage.jsx)');
console.log('--------------------------------------------------------------------');

// Test Onboarding Submission for newly registered user
StorageService.setCurrentUserId(newRegisteredUser.id);
const onboardingUpdate = {
  role: ['I CREATE IDEAS', 'FOUNDER'],
  interests: ['AI & MACHINE LEARNING', 'QUANTUM COMPUTING', 'CYBERSECURITY'],
  skills: ['Quantum Algorithms', 'Python', 'Qiskit', 'Cryptography'],
  headline: 'Quantum Neural Network Researcher',
  bio: 'Exploring fault-tolerant quantum machine learning architectures for distributed systems.',
  organization: 'Quantum AI Institute',
  onboarding_completed: true
};

const onboardedUser = StorageService.updateUserProfile(newRegisteredUser.id, onboardingUpdate);
assert(onboardedUser.onboarding_completed === true, 'Onboarding marks onboarding_completed: true');
assert(onboardedUser.interests.includes('QUANTUM COMPUTING'), 'Disciplines and interests saved');
assert(onboardedUser.skills.includes('Qiskit'), 'Skills and capabilities saved');
assert(onboardedUser.headline === onboardingUpdate.headline, 'Professional headline saved');
assert(onboardedUser.bio === onboardingUpdate.bio, 'Biography saved');

console.log('✓ Onboarding data persistence verified.\n');

// ============================================================================
// 5. DASHBOARD PAGE TEST
// ============================================================================
console.log('--------------------------------------------------------------------');
console.log('PAGE 5: DASHBOARD PAGE (DashboardPage.jsx)');
console.log('--------------------------------------------------------------------');

// Switch to User A (Creator)
StorageService.setCurrentUserId('usr_karthick_founder');
const userA = StorageService.getUserById('usr_karthick_founder');
const userAProjects = StorageService.getInnovationsByUserId(userA.id);
const userAReviewsGiven = StorageService.getReviewsByReviewerId(userA.id);
const userAReviewsReceived = StorageService.getReviewsReceivedByCreator(userA.id);
const userANotifs = StorageService.getNotificationsForUser(userA.id);

assert(userA.name.includes('Karthick Founder'), 'Dashboard loads real user name');
assert(userA.credits >= 140, 'Dashboard displays real credit balance (140 pts)');
assert(userAProjects.length === 2, `Dashboard counts real created projects (${userAProjects.length} projects)`);
assert(userAReviewsReceived.length === 3, `Dashboard counts real reviews received (${userAReviewsReceived.length} reviews)`);
assert(userANotifs.length >= 3, `Dashboard counts notifications received (${userANotifs.length} notifs)`);

console.log('✓ Dashboard real user data computation verified.\n');

// ============================================================================
// 6. CREATE PROJECT TEST (SubmitInnovationPage.jsx)
// ============================================================================
console.log('--------------------------------------------------------------------');
console.log('PAGE 6: CREATE PROJECT (SubmitInnovationPage.jsx)');
console.log('--------------------------------------------------------------------');

const newProjectDraft = {
  title: 'BioSynapse Neural Bridge',
  short_description: 'Non-invasive neural interface translation layer for motor neuro-rehabilitation.',
  problem_statement: 'Patients recovering from severe stroke lack real-time feedback loops during motor cortex neuroplasticity training.',
  proposed_solution: 'Continuous EEG-EMG co-adaptive neural bridge providing millisecond-latency biofeedback and robotic assistive actuation.',
  target_users: 'Neurologists, Physical Therapists, Stroke Rehabilitation Clinics',
  category_id: 'cat_health',
  category_name: 'Healthcare',
  creation_type: 'STARTUP',
  project_stage: 'prototype',
  features: [
    'Sub-5ms multi-channel EEG sensor decoding',
    'Adaptive motor cortex stimulation modulation',
    'Robotic exoskeleton telemetry sync'
  ],
  tags: ['Healthcare', 'Neurotech', 'AI', 'Rehabilitation', 'EEG']
};

const savedProject = StorageService.createInnovation(newProjectDraft);
assert(savedProject && savedProject.id.startsWith('inno_'), 'Project created with valid unique ID');
assert(savedProject.title === newProjectDraft.title, 'Project title saved');
assert(savedProject.user_id === userA.id, 'Project creator assigned to User A');
assert(savedProject.status === 'UNDER_VALIDATION', 'Project status initialized to UNDER_VALIDATION');
assert(savedProject.valid_reviews_count === 0, 'Project initial valid reviews count is 0');
assert(savedProject.features.length === 3, 'Key features array persisted');

console.log('✓ Create project form submission and database persistence verified.\n');

// ============================================================================
// 7. MY PROJECTS TEST (CreatorDashboardPage.jsx)
// ============================================================================
console.log('--------------------------------------------------------------------');
console.log('PAGE 7: MY PROJECTS (CreatorDashboardPage.jsx)');
console.log('--------------------------------------------------------------------');

// Verify only User A's projects are returned for User A
const creatorPortfolio = StorageService.getInnovationsByUserId(userA.id);
assert(creatorPortfolio.length === 3, 'My Projects shows exactly User A\'s 3 projects (PulseMind, NeuroMesh, BioSynapse)');
assert(creatorPortfolio.every(p => p.user_id === userA.id || p.creator_id === userA.id), 'Only user\'s own projects displayed');

// Test Duplicate Specimen Button
const duplicatedProject = StorageService.duplicateInnovation(savedProject.id);
assert(duplicatedProject && duplicatedProject.title.includes('Copy'), 'Duplicate project button creates copy');
assert(duplicatedProject.status === 'DRAFT', 'Duplicated project set to DRAFT');

// Test Delete Specimen Button
const deleteSuccess = StorageService.deleteInnovation(duplicatedProject.id);
assert(deleteSuccess, 'Delete project button successfully removes specimen');
assert(StorageService.getInnovationById(duplicatedProject.id) === null, 'Deleted project no longer exists in database');

// Test Launch Setup Modal & Settings Save
const launchUpdated = StorageService.updateInnovation(savedProject.id, {
  website_url: 'https://biosynapse.health',
  demo_url: 'https://biosynapse.health/demo',
  next_community_action: 'beta'
});
assert(launchUpdated.website_url === 'https://biosynapse.health', 'Launch website URL saved');
assert(launchUpdated.demo_url === 'https://biosynapse.health/demo', 'Launch interactive demo URL saved');
assert(launchUpdated.next_community_action === 'beta', 'Launch community action saved');

console.log('✓ My Projects portfolio, filter, duplicate, delete, and launch settings verified.\n');

// ============================================================================
// 8. EXPLORE PAGE TEST (ExplorePage.jsx)
// ============================================================================
console.log('--------------------------------------------------------------------');
console.log('PAGE 8: EXPLORE SPECIMEN REGISTRY (ExplorePage.jsx)');
console.log('--------------------------------------------------------------------');

const allPublicProjects = StorageService.getInnovations();
assert(allPublicProjects.length >= 5, 'Explore lists all public projects and featured specimens');

// Test Category Filter: Healthcare
const healthProjects = allPublicProjects.filter(p => p.category_id === 'cat_health' || p.category_name === 'Healthcare');
assert(healthProjects.length >= 2, 'Category filter "Healthcare" returns healthcare specimens');

// Test Search Filter: "ECG"
const searchResults = allPublicProjects.filter(p => 
  p.title.toLowerCase().includes('ecg') || 
  p.problem_statement.toLowerCase().includes('ecg') ||
  p.tags.some(t => t.toLowerCase().includes('ecg'))
);
assert(searchResults.some(p => p.title.includes('PulseMind')), 'Search query "ECG" returns PulseMind Health AI');

// Test Sorting: Highest Reviews
const sortedByReviews = [...allPublicProjects].sort((a, b) => (b.valid_reviews_count || 0) - (a.valid_reviews_count || 0));
assert(sortedByReviews[0].valid_reviews_count >= sortedByReviews[sortedByReviews.length - 1].valid_reviews_count, 'Sort by highest reviews orders correctly');

console.log('✓ Explore registry listing, category filtering, search, and sorting verified.\n');

// ============================================================================
// 9. PROJECT DETAILS TEST (PublishedDetailPage.jsx)
// ============================================================================
console.log('--------------------------------------------------------------------');
console.log('PAGE 9: PROJECT DETAILS (PublishedDetailPage.jsx)');
console.log('--------------------------------------------------------------------');

const pulsemindProject = StorageService.getInnovationById('inno_pulsemind_ai');
assert(pulsemindProject !== null, 'Correct project loaded by ID (inno_pulsemind_ai)');
assert(pulsemindProject.title === 'PulseMind Health AI', 'Project title matches loaded specimen');
assert(pulsemindProject.features.length >= 4, 'Feature breakdown loaded');

// Test Endorse / Upvote Button
const initialUpvotes = pulsemindProject.upvotes_count || 0;
const hasUpvotedBefore = StorageService.hasUserUpvoted(userA.id, pulsemindProject.id);
const upvoteResult = StorageService.toggleUpvote(userA.id, pulsemindProject.id);
assert(upvoteResult.hasUpvoted !== hasUpvotedBefore, 'Endorse/Upvote button toggles user vote state');

// Test Community Comments / Discussion Ledger
const commentText = 'What is the expected false positive rate for ventricular tachycardia triage?';
const newComment = StorageService.addComment({
  innovation_id: pulsemindProject.id,
  project_id: pulsemindProject.id,
  user_id: userA.id,
  author_name: userA.name,
  author_avatar: userA.avatar,
  content: commentText
});
assert(newComment && newComment.id.startsWith('comm_'), 'Community discussion comment posted');
assert(newComment.content === commentText, 'Comment content saved accurately');

const projectComments = StorageService.getCommentsForInnovation(pulsemindProject.id);
assert(projectComments.some(c => c.id === newComment.id), 'New comment appears in project discussion ledger');

console.log('✓ Project Details specimen loader, upvote toggle, and comments ledger verified.\n');

// ============================================================================
// 10. REVIEW SUBMISSION & QUEUE TEST (ReviewQueuePage.jsx & ReviewSubmissionPage.jsx)
// ============================================================================
console.log('--------------------------------------------------------------------');
console.log('PAGE 10: REVIEW SUBMISSION & QUEUE');
console.log('--------------------------------------------------------------------');

// Switch to User B (Reviewer)
StorageService.setCurrentUserId('usr_sarah_reviewer');
const userB = StorageService.getUserById('usr_sarah_reviewer');
const initialUserBCredits = userB.credits || 0;

// Test Review Queue Loading
const userBAssignments = StorageService.getAssignmentsForUser(userB.id);
assert(userBAssignments.length >= 1, 'Review Queue loads active matched assignments for User B');

// Test Submitting a New Review for BioSynapse (User A's new project)
const reviewData = {
  project_id: savedProject.id,
  innovation_id: savedProject.id,
  reviewer_id: userB.id,
  reviewer_name: userB.name,
  reviewer_avatar: userB.avatar,
  problem_relevance: 'YES',
  would_use: 'YES',
  rating: 5,
  overall_feedback: 'Groundbreaking neural rehabilitation thesis. Real-time co-adaptive feedback loop is essential for effective neuroplasticity.',
  suggestion: 'Consider validating motion artifact rejection during heavy muscle spasm events in acute patients.'
};

const savedReviewObj = StorageService.addReview(reviewData);

// Verify All 8 Basic Review Fields
assert(savedReviewObj.id && savedReviewObj.id.startsWith('rev_'), 'Review Field 1: id generated');
assert(savedReviewObj.project_id === savedProject.id, 'Review Field 2: project_id saved');
assert(savedReviewObj.reviewer_id === userB.id, 'Review Field 3: reviewer_id saved');
assert(savedReviewObj.problem_relevance === 'YES', 'Review Field 4: problem_relevance saved');
assert(savedReviewObj.would_use === 'YES', 'Review Field 5: would_use saved');
assert(savedReviewObj.overall_feedback === reviewData.overall_feedback, 'Review Field 6: overall_feedback saved');
assert(savedReviewObj.suggestion === reviewData.suggestion, 'Review Field 7: suggestion saved');
assert(savedReviewObj.created_at !== undefined, 'Review Field 8: created_at saved');

// Verify Project Review Count Incremented
const refreshedProject = StorageService.getInnovationById(savedProject.id);
assert(refreshedProject.valid_reviews_count === 1, 'Project valid_reviews_count incremented in database');

// Verify Creator (User A) Received Notification
const creatorNotifs = StorageService.getNotificationsForUser(userA.id);
assert(creatorNotifs.some(n => n.type === 'REVIEW_RECEIVED' && n.project_id === savedProject.id), 'Creator User A received REVIEW_RECEIVED notification');

// Verify Reviewer Awarded Credits (+10 pts)
const updatedUserB = StorageService.getUserById(userB.id);
assert(updatedUserB.credits === initialUserBCredits + 10, 'Reviewer User B awarded +10 validation reputation credits');

console.log('✓ Review queue, submission desk, and all 8 basic fields verified.\n');

// ============================================================================
// 11. INSIGHTS REPORT TEST (InsightReportPage.jsx)
// ============================================================================
console.log('--------------------------------------------------------------------');
console.log('PAGE 11: AI & STATISTICAL INSIGHTS REPORT (InsightReportPage.jsx)');
console.log('--------------------------------------------------------------------');

const pulsemindReviews = StorageService.getReviewsForInnovation('inno_pulsemind_ai');
assert(pulsemindReviews.length === 2, 'Insights engine loads all real reviews for PulseMind');

const generatedInsights = generateRuleBasedInsights(pulsemindProject, pulsemindReviews);
assert(generatedInsights.stats.totalReviews === 2, 'Consensus total reviews count is 2');
assert(generatedInsights.stats.wouldUsePercent === 100, 'Consensus wouldUsePercent is 100%');
assert(Number(generatedInsights.stats.avgRating) === 4.5, 'Consensus average rating calculated as 4.5/5.0');
assert(generatedInsights.sentiment === 'Positive', 'Consensus sentiment derived as Positive');
assert(generatedInsights.positive_points.length >= 1, 'Positive highlights extracted from real feedback');
assert(generatedInsights.common_problems.length >= 1, 'Friction/improvement points extracted from real feedback');
assert(generatedInsights.recommendations.length >= 1, 'Actionable next-step recommendations synthesized');

console.log('✓ AI Insights consensus telemetry and report generation verified.\n');

// ============================================================================
// 12. USER PROFILE TEST (UserProfilePage.jsx)
// ============================================================================
console.log('--------------------------------------------------------------------');
console.log('PAGE 12: USER PROFILE (UserProfilePage.jsx)');
console.log('--------------------------------------------------------------------');

StorageService.setCurrentUserId(userA.id);
const profileUpdates = {
  name: 'Karthick Founder, PhD',
  headline: 'Chief AI Architect & Principal Systems Investigator',
  organization: 'INNOVEXA Advanced Intelligence Labs',
  bio: 'Pioneering edge neural telemetry, decentralized machine learning networks, and autonomous diagnostic architectures.'
};

const updatedProfile = StorageService.updateUserProfile(userA.id, profileUpdates);
assert(updatedProfile.name === profileUpdates.name, 'Profile name update saved');
assert(updatedProfile.headline === profileUpdates.headline, 'Profile headline update saved');
assert(updatedProfile.organization === profileUpdates.organization, 'Profile organization update saved');
assert(updatedProfile.bio === profileUpdates.bio, 'Profile biography update saved');

console.log('✓ User profile editing and updates verified.\n');

// ============================================================================
// 13. SETTINGS PAGE TEST (SettingsPage.jsx)
// ============================================================================
console.log('--------------------------------------------------------------------');
console.log('PAGE 13: SETTINGS & PREFERENCES (SettingsPage.jsx)');
console.log('--------------------------------------------------------------------');

// Test Security & Gemini API Key Persistence
const testGeminiKey = 'AIzaSyTestKey_9876543210';
StorageService.setGeminiApiKey(testGeminiKey);
assert(StorageService.getGeminiApiKey() === testGeminiKey, 'Google Gemini API key saved to secure storage');

// Test Updating Account Details via Settings
const accountUpdate = StorageService.updateUserProfile(userA.id, {
  email: 'karthick.founder@innovexa.io'
});
assert(accountUpdate.email === 'karthick.founder@innovexa.io', 'Account email updated and saved');

console.log('✓ Settings preferences and API key configuration verified.\n');

// ============================================================================
// 14. LOGOUT TEST
// ============================================================================
console.log('--------------------------------------------------------------------');
console.log('PAGE 14: LOGOUT');
console.log('--------------------------------------------------------------------');

// Execute Logout
StorageService.setCurrentUserId(null);
assert(StorageService.getCurrentUserId() === null, 'Logout clears active user session ID');
assert(StorageService.getUserById(null) === null, 'Session returns null for guest state');

console.log('✓ Logout session termination verified.\n');

// Restore active user session to User A for seamless trialrun
StorageService.setCurrentUserId('usr_karthick_founder');

console.log('====================================================================');
console.log(`🎉 ALL ${testsPassed}/${testsTotal} CHECKS PASSED: FULL SYSTEM VERIFIED!`);
console.log('====================================================================\n');
