import { supabase } from './src/lib/supabase.js';
import { SupabaseService } from './src/services/supabaseService.js';

async function testReviewAndUpvote() {
  console.log('Testing review and upvote against live Supabase...');

  // 1. Sign in as Bob (evaluator)
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'bob.evaluator@demo.innovexa.io',
    password: 'DemoPass123!'
  });
  if (authErr) throw authErr;
  console.log(`✓ Signed in as Bob: ${auth.user.id}`);

  // 2. Fetch a project
  const { data: projs, error: pErr } = await SupabaseService.getProjects();
  if (pErr || !projs || projs.length === 0) throw new Error('No projects found');
  const targetProject = projs[0];
  console.log(`✓ Target Project: "${targetProject.title}" (ID: ${targetProject.id})`);

  // 3. Test Upvote via SupabaseService.voteProject
  console.log('\n--- Testing voteProject ---');
  const voteRes = await SupabaseService.voteProject({
    projectId: targetProject.id,
    userId: auth.user.id,
    voteType: 'upvote',
    projectOwnerId: targetProject.user_id,
    projectTitle: targetProject.title,
    userName: 'Bob Evaluator'
  });
  console.log('voteProject result:', voteRes);

  // 4. Test submitReview via SupabaseService.submitReview
  console.log('\n--- Testing submitReview ---');
  try {
    const revRes = await SupabaseService.submitReview(
      targetProject.id,
      5,
      'Live test review from Bob: outstanding architecture and clean execution.'
    );
    console.log('submitReview result:', revRes);
  } catch (err) {
    console.error('submitReview ERROR:', err);
  }
}

testReviewAndUpvote().catch(console.error);
