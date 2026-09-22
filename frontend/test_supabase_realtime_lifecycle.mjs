import { SupabaseService } from './src/services/supabaseService.js';
import { supabase } from './src/lib/supabase.js';

async function runRealtimeLifecycleTest() {
  console.log('=== RUNNING SUPABASE REALTIME LIFECYCLE TEST ===\n');

  const projectId = 'test-proj-f7556de4-1b31-4a88-a48e-f6f8d0317a08';
  const userId = 'test-user-12345';
  const postId = 'test-post-67890';

  console.log('1. Initial channels count:', supabase.getChannels().length);

  // Test 1: subscribeToProjectReviews
  console.log('2. Testing subscribeToProjectReviews...');
  let reviewEvents = 0;
  const unsubReviews1 = SupabaseService.subscribeToProjectReviews(projectId, () => { reviewEvents++; });
  console.log('   Channels after subscribe 1:', supabase.getChannels().length);

  // Test 2: Rapid remount / duplicate subscription to the SAME channel
  console.log('3. Testing duplicate subscribeToProjectReviews without crash...');
  const unsubReviews2 = SupabaseService.subscribeToProjectReviews(projectId, () => { reviewEvents++; });
  console.log('   Channels after duplicate subscribe:', supabase.getChannels().length);

  // Test 3: Other channels
  console.log('4. Testing subscribeToProjectLikes, Messages, Notifications, CommunityPosts, CommunityComments...');
  const unsubLikes = SupabaseService.subscribeToProjectLikes(projectId, () => {});
  const unsubMsgs = SupabaseService.subscribeToMessages(userId, () => {});
  const unsubNotifs = SupabaseService.subscribeToNotifications(userId, () => {});
  const unsubPosts = SupabaseService.subscribeToCommunityPosts(() => {});
  const unsubComments = SupabaseService.subscribeToCommunityComments(postId, () => {});

  console.log('   Total active channels:', supabase.getChannels().length);

  // Test 4: Clean unsubscription
  console.log('5. Testing cleanup handlers...');
  unsubReviews1();
  unsubReviews2();
  unsubLikes();
  unsubMsgs();
  unsubNotifs();
  unsubPosts();
  unsubComments();

  console.log('   Channels after all cleanups:', supabase.getChannels().length);

  console.log('\n=== REALTIME LIFECYCLE TEST COMPLETED SUCCESSFULLY! ===');
  process.exit(0);
}

runRealtimeLifecycleTest().catch(err => {
  console.error('Realtime test failed with error:', err);
  process.exit(1);
});
