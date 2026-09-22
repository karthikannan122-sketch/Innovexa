import assert from 'node:assert';
import { SupabaseService } from './src/services/supabaseService.js';
import { StorageService } from './src/services/storage.js';

// Environment-safe storage polyfill for Node test runs
if (typeof globalThis.localStorage === 'undefined') {
  const memoryMap = new Map();
  globalThis.localStorage = {
    getItem: (k) => memoryMap.get(k) || null,
    setItem: (k, v) => memoryMap.set(k, String(v)),
    removeItem: (k) => memoryMap.delete(k),
    clear: () => memoryMap.clear(),
    get length() { return memoryMap.size; },
    key: (i) => Array.from(memoryMap.keys())[i] || null
  };
}

async function runPhase4CommunityTests() {
  console.log('\n=======================================================');
  console.log('  INNOVEXA PHASE 4: COMPLETE COMMUNITY PLATFORM SUITE  ');
  console.log('=======================================================\n');

  // Test User Identities
  const userA = { id: 'a1111111-1111-4111-a111-111111111111', name: 'Dr. Evelyn Vance (User A)' };
  const userB = { id: 'b2222222-2222-4222-b222-222222222222', name: 'Marcus Chen (User B)' };
  const userC = { id: 'c3333333-3333-4333-c333-333333333333', name: 'Elena Rostova (User C)' };

  let createdPost = null;

  try {
    // Step 0: Get available categories
    console.log('-> Step 0: Fetching category from database...');
    const catRes = await SupabaseService.getCategories();
    const categories = catRes.data || [];
    const testCategory = categories[0] || { id: '93fe2938-c843-4fa4-8b01-b07d59990023', name: 'Technology & AI' };
    console.log(`✓ Using Category: "${testCategory.name}" (ID: ${testCategory.id})\n`);

    // Step 1: User A creates a community post
    console.log('-> Step 1: User A creates Community Post...');
    const postPayload = {
      title: 'Architecting Event-Driven Neuromorphic Sensor Meshes for Frontier Edge Compute',
      content: 'We are investigating asynchronous spike-based sensor pipelines with sub-millisecond edge arbitration. How are teams handling backpressure under dense event storms?',
      post_type: 'discussion',
      category_id: testCategory.id,
      category_name: testCategory.name,
      image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
      tags: ['Neuromorphic', 'EdgeComputing', 'SensorMesh', 'Telemetry'],
      user_id: userA.id
    };

    const createRes = await SupabaseService.createCommunityPost(postPayload);
    assert(createRes.data, `Failed to create community post: ${JSON.stringify(createRes.error)}`);
    createdPost = createRes.data;
    console.log(`✓ Post created by User A: "${createdPost.title}" (ID: ${createdPost.id}, Type: ${createdPost.post_type})\n`);

    // Step 2: User B fetches community posts and sees User A's post
    console.log('-> Step 2: User B fetches public posts...');
    const allPostsRes = await SupabaseService.getCommunityPosts();
    assert(Array.isArray(allPostsRes.data), 'Expected getCommunityPosts to return an array');
    const foundPost = allPostsRes.data.find(p => p.id === createdPost.id);
    assert(foundPost, "User A's post should be publicly visible to User B without user filtering");
    console.log(`✓ User B successfully discovered User A's post: "${foundPost.title}"\n`);

    // Step 3: User C submits a top-level comment
    console.log('-> Step 3: User C submits a comment on User A\'s post...');
    const commentCRes = await SupabaseService.createCommunityComment({
      post_id: createdPost.id,
      user_id: userC.id,
      content: 'Have you benchmarked jitter buffers using ring-based atomic lock-free queues?'
    });
    assert(commentCRes.data, `Failed to create comment: ${JSON.stringify(commentCRes.error)}`);
    const commentC = commentCRes.data;
    console.log(`✓ User C posted comment (ID: ${commentC.id}): "${commentC.content}"\n`);

    // Step 4: User A submits a nested reply to User C's comment
    console.log('-> Step 4: User A submits a nested reply to User C...');
    const replyARes = await SupabaseService.createCommunityComment({
      post_id: createdPost.id,
      user_id: userA.id,
      parent_comment_id: commentC.id,
      content: 'Yes! Lock-free ring buffers reduced p99 latency to 42 microseconds.'
    });
    assert(replyARes.data, `Failed to create nested reply: ${JSON.stringify(replyARes.error)}`);
    const replyA = replyARes.data;
    console.log(`✓ User A posted nested reply (ID: ${replyA.id}, parent: ${replyA.parent_comment_id})\n`);

    // Step 5: Verify comments structure
    console.log('-> Step 5: Verify comments and nested reply structure...');
    const commentsRes = await SupabaseService.getCommunityComments(createdPost.id);
    assert(Array.isArray(commentsRes.data), 'Expected array of comments');
    assert(commentsRes.data.length >= 2, `Expected at least 2 comments, got ${commentsRes.data.length}`);
    const rootComments = commentsRes.data.filter(c => !c.parent_comment_id);
    const childReplies = commentsRes.data.filter(c => c.parent_comment_id === commentC.id);
    assert(rootComments.length >= 1, 'Expected at least 1 root comment');
    assert(childReplies.length >= 1, 'Expected at least 1 nested reply');
    console.log(`✓ Verified ${rootComments.length} root comments and ${childReplies.length} nested replies.\n`);

    // Step 6: User B votes 'like' on User A's post
    console.log('-> Step 6: User B votes "like" on User A\'s post...');
    const voteLikeRes = await SupabaseService.voteCommunityPost({
      postId: createdPost.id,
      userId: userB.id,
      voteType: 'like'
    });
    assert(voteLikeRes.data, `Failed to vote like: ${JSON.stringify(voteLikeRes.error)}`);
    console.log(`✓ User B recorded vote: action=${voteLikeRes.data.action}, vote_type=${voteLikeRes.data.vote_type}`);

    const votesAfterLike = await SupabaseService.getCommunityVotes(createdPost.id, userB.id);
    console.log(`✓ Post votes: likes=${votesAfterLike.likes}, dislikes=${votesAfterLike.dislikes}, userB_vote=${votesAfterLike.userVote}`);
    assert(votesAfterLike.likes >= 1, 'Expected likes >= 1');
    assert.strictEqual(votesAfterLike.userVote, 'like', 'Expected userB vote to be like');
    console.log();

    // Step 7: User C votes 'dislike' on User A's post
    console.log('-> Step 7: User C votes "dislike" on User A\'s post...');
    const voteDislikeRes = await SupabaseService.voteCommunityPost({
      postId: createdPost.id,
      userId: userC.id,
      voteType: 'dislike'
    });
    assert(voteDislikeRes.data, `Failed to vote dislike: ${JSON.stringify(voteDislikeRes.error)}`);
    console.log(`✓ User C recorded vote: action=${voteDislikeRes.data.action}, vote_type=${voteDislikeRes.data.vote_type}`);

    const votesAfterC = await SupabaseService.getCommunityVotes(createdPost.id, userC.id);
    console.log(`✓ Post votes: likes=${votesAfterC.likes}, dislikes=${votesAfterC.dislikes}, userC_vote=${votesAfterC.userVote}`);
    assert(votesAfterC.dislikes >= 1, 'Expected dislikes >= 1');
    assert.strictEqual(votesAfterC.userVote, 'dislike', 'Expected userC vote to be dislike');
    console.log();

    // Step 8: User B switches vote from 'like' to 'dislike'
    console.log('-> Step 8: User B switches vote from "like" to "dislike"...');
    const switchVoteRes = await SupabaseService.voteCommunityPost({
      postId: createdPost.id,
      userId: userB.id,
      voteType: 'dislike'
    });
    assert(switchVoteRes.data, `Failed to switch vote: ${JSON.stringify(switchVoteRes.error)}`);
    console.log(`✓ User B vote switched: action=${switchVoteRes.data.action}, vote_type=${switchVoteRes.data.vote_type}`);

    const votesAfterSwitch = await SupabaseService.getCommunityVotes(createdPost.id, userB.id);
    console.log(`✓ Post votes after switch: likes=${votesAfterSwitch.likes}, dislikes=${votesAfterSwitch.dislikes}, userB_vote=${votesAfterSwitch.userVote}`);
    assert.strictEqual(votesAfterSwitch.userVote, 'dislike');
    console.log();

    // Step 9: User B toggles vote off (clicks dislike again)
    console.log('-> Step 9: User B clicks "dislike" again to remove vote (toggle off)...');
    const toggleOffRes = await SupabaseService.voteCommunityPost({
      postId: createdPost.id,
      userId: userB.id,
      voteType: 'dislike'
    });
    assert(toggleOffRes.data, `Failed to toggle vote off: ${JSON.stringify(toggleOffRes.error)}`);
    console.log(`✓ User B vote toggled off: action=${toggleOffRes.data.action}`);

    const votesAfterToggle = await SupabaseService.getCommunityVotes(createdPost.id, userB.id);
    console.log(`✓ Post votes after toggle off: userB_vote=${votesAfterToggle.userVote}`);
    assert.strictEqual(votesAfterToggle.userVote, null, 'Expected userB vote to be null after toggle off');
    console.log();

    // Step 10: Search and Filter verification
    console.log('-> Step 10: Verifying search and category filters...');
    const searchRes = await SupabaseService.getCommunityPosts({ search: 'Neuromorphic' });
    assert(Array.isArray(searchRes.data), 'Expected array');
    const matchSearch = searchRes.data.find(p => p.id === createdPost.id);
    assert(matchSearch, 'Expected search for "Neuromorphic" to return created post');
    console.log(`✓ Search filter successfully matched post "${matchSearch.title}"`);

    const typeRes = await SupabaseService.getCommunityPosts({ post_type: 'DISCUSSION' });
    const matchType = typeRes.data.find(p => p.id === createdPost.id);
    assert(matchType, 'Expected post_type filter to match created post');
    console.log(`✓ Post type filter successfully matched discussion post.`);
    console.log();

    // Step 11: User A updates own post
    console.log('-> Step 11: User A updates own post...');
    const updatedPostRes = await SupabaseService.updateCommunityPost(
      createdPost.id,
      {
        title: 'Architecting Event-Driven Neuromorphic Sensor Meshes [BENCHMARK RESULTS ADDED]',
        post_type: 'question'
      },
      userA.id
    );
    assert(updatedPostRes.data, `Failed to update post: ${JSON.stringify(updatedPostRes.error)}`);
    console.log(`✓ Post updated successfully: "${updatedPostRes.data.title}" (Type: ${updatedPostRes.data.post_type})\n`);

    // Step 12: User B attempts unauthorized edit on User A's post
    console.log('-> Step 12: User B attempts unauthorized edit on User A\'s post...');
    const unauthorizedRes = await SupabaseService.updateCommunityPost(
      createdPost.id,
      { title: 'Hacked title by User B' },
      userB.id
    );
    assert(unauthorizedRes.error, 'Unauthorized edit by User B should be blocked');
    console.log(`✓ Unauthorized edit successfully prevented: ${unauthorizedRes.error.message || unauthorizedRes.error}\n`);

    // Step 13: User A deletes own post
    console.log('-> Step 13: User A deletes own post...');
    const delRes = await SupabaseService.deleteCommunityPost(createdPost.id, userA.id);
    assert(delRes.success, `Failed to delete post: ${JSON.stringify(delRes.error)}`);
    console.log(`✓ Post deleted successfully by User A.`);

    const checkDelRes = await SupabaseService.getCommunityPosts();
    const stillPresent = (checkDelRes.data || []).find(p => p.id === createdPost.id);
    assert(!stillPresent, 'Deleted post should no longer appear in community posts');
    console.log(`✓ Verified post is completely removed from public feed.\n`);

    console.log('=======================================================');
    console.log('  >>> ALL PHASE 4 COMMUNITY PLATFORM TESTS PASSED! <<<  ');
    console.log('=======================================================\n');

  } catch (err) {
    console.error('\n❌ PHASE 4 TEST FAILED:', err);
    if (createdPost?.id) {
      console.log('-> Cleaning up test post...');
      await SupabaseService.deleteCommunityPost(createdPost.id, userA.id).catch(() => {});
    }
    process.exit(1);
  }
}

runPhase4CommunityTests();
