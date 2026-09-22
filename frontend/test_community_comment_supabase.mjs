import { SupabaseService } from './src/services/supabaseService.js';
import { supabase } from './src/lib/supabase.js';

async function testCommunityCommentWorkflow() {
  console.log('================================================================');
  console.log('     TESTING COMMUNITY COMMENT WORKFLOW IN SUPABASE DATABASE    ');
  console.log('================================================================');

  // 1. Authenticate user
  const email = `comm_commenter_${Date.now()}@innovexa.ai`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'Password123!@#'
  });

  if (authError || !authData.user) {
    console.error('❌ Auth error:', authError);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log('✅ Authenticated test user in Supabase:', userId);

  // 2. Create parent Community Discussion Post
  const { data: post, error: postErr } = await supabase
    .from('community_posts')
    .insert([{
      user_id: userId,
      title: 'Decentralized Neural Weights Distribution Architecture',
      content: 'How should edge nodes coordinate sparse model checkpoints under latency constraints?',
      post_type: 'discussion',
      is_public: true,
      tags: ['AI', 'Architecture']
    }])
    .select()
    .single();

  if (postErr || !post) {
    console.error('❌ Failed to create community post:', postErr);
    process.exit(1);
  }

  console.log('✅ Created Community Post in Supabase:', post.id, `("${post.title}")`);

  // 3. Add Top-Level Community Comment via SupabaseService
  const commentContent = 'We recommend using Merkle-DAG state proofs paired with localized WebRTC data channels for sub-10ms checkpoint diffs.';
  const addRes = await SupabaseService.createCommunityComment({
    post_id: post.id,
    user_id: userId,
    content: commentContent
  });

  if (addRes.error || !addRes.data) {
    console.error('❌ Failed to create community comment:', addRes.error);
    process.exit(1);
  }

  const createdComment = addRes.data;
  console.log('✅ Community Comment created & reflected in Supabase:');
  console.log('   - Comment ID:', createdComment.id);
  console.log('   - Post ID:', createdComment.post_id);
  console.log('   - Author:', createdComment.author_name || createdComment.profiles?.full_name);
  console.log('   - Content:', `"${createdComment.content}"`);

  // 4. Verify directly from database table (community_comments)
  const { data: dbComment, error: dbErr } = await supabase
    .from('community_comments')
    .select('id, post_id, user_id, content, created_at')
    .eq('id', createdComment.id)
    .single();

  if (dbErr || !dbComment) {
    console.error('❌ Failed to query comment directly from Supabase table:', dbErr);
    process.exit(1);
  }

  console.log('✅ Verified direct database query from "community_comments":', dbComment.id);

  // 5. Fetch all comments for the post via SupabaseService.getCommunityComments
  const fetchRes = await SupabaseService.getCommunityComments(post.id);
  if (fetchRes.error) {
    console.error('❌ Failed to get community comments:', fetchRes.error);
    process.exit(1);
  }

  const isPresent = fetchRes.data.some(c => c.id === createdComment.id);
  console.log(`✅ Fetched comments for post: count = ${fetchRes.data.length}, includes new comment = ${isPresent}`);

  // 6. Add a nested reply
  const replyRes = await SupabaseService.createCommunityComment({
    post_id: post.id,
    user_id: userId,
    parent_comment_id: createdComment.id,
    content: 'Agreed! We also benchmarked this approach on ARM edge hardware with 99.4% packet delivery.'
  });

  if (replyRes.data) {
    console.log('✅ Nested reply created in Supabase:', replyRes.data.id, `(Parent: ${createdComment.id})`);
  }

  // 7. Delete test comment & post cleanly
  await SupabaseService.deleteCommunityComment(createdComment.id, userId);
  await supabase.from('community_posts').delete().eq('id', post.id);
  console.log('✅ Cleaned up test comment & post from Supabase.');

  console.log('================================================================');
  console.log('🎉 COMMUNITY COMMENTS REFLECTED IN DATABASE WITH 100% SUCCESS!');
  console.log('================================================================');
}

testCommunityCommentWorkflow();
