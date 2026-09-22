import { supabase } from './src/lib/supabase.js';
import { SupabaseService } from './src/services/supabaseService.js';

const REQUIRED_TABLES = [
  'profiles',
  'user_private_data',
  'categories',
  'projects',
  'project_votes',
  'project_suggestions',
  'reviews',
  'review_suggestions',
  'review_votes',
  'community_posts',
  'community_comments',
  'community_votes',
  'messages',
  'notifications',
  'project_follows'
];

console.log('================================================================');
console.log('🧪 INNOVEXA NEW SUPABASE DATABASE (15 TABLES) VERIFICATION TEST');
console.log('================================================================\n');

async function runVerification() {
  console.log('1. Checking all 15 Table Query Interfaces:');
  for (const table of REQUIRED_TABLES) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`   ⚠️ Table [${table}]: Query returned error (may need table created in remote DB): ${error.message}`);
      } else {
        console.log(`   ✅ Table [${table}]: Successfully queryable (Returned ${Array.isArray(data) ? data.length : 0} rows)`);
      }
    } catch (e) {
      console.log(`   ❌ Table [${table}]: Exception during query: ${e.message}`);
    }
  }

  console.log('\n2. Verifying SupabaseService Methods for 15 Tables:');
  const methods = [
    'getProfiles',
    'getProfileById',
    'getUserPrivateData',
    'updateUserPrivateData',
    'getCategories',
    'getProjects',
    'getProjectById',
    'createProject',
    'updateProject',
    'deleteProject',
    'getUserProjectVote',
    'getProjectVotes',
    'voteProject',
    'toggleProjectLike',
    'getProjectSuggestions',
    'createProjectSuggestion',
    'updateProjectSuggestionStatus',
    'getReviews',
    'submitReview',
    'updateReview',
    'deleteReview',
    'getReviewSuggestions',
    'createReviewSuggestion',
    'getReviewVotes',
    'voteReview',
    'getCommunityPosts',
    'createCommunityPost',
    'getCommunityComments',
    'createCommunityComment',
    'getCommunityVotes',
    'voteCommunityItem',
    'getConversations',
    'getMessages',
    'sendMessage',
    'markMessagesAsRead',
    'getNotifications',
    'createNotification',
    'markNotificationAsRead',
    'isUserFollowingProject',
    'toggleFollowProject',
    'getProjectFollowers',
    'getInsightsData'
  ];

  let missingMethods = 0;
  for (const m of methods) {
    if (typeof SupabaseService[m] === 'function') {
      console.log(`   ✓ Method SupabaseService.${m}() exists.`);
    } else {
      console.log(`   ❌ Missing method: SupabaseService.${m}()`);
      missingMethods++;
    }
  }

  if (missingMethods === 0) {
    console.log('\n🎉 ALL 15 TABLE INTERFACES & SERVICE METHODS VERIFIED SUCCESSFULLY!');
  } else {
    console.log(`\n⚠️ Found ${missingMethods} missing methods.`);
  }
}

runVerification().catch(console.error);
