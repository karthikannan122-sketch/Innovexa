import { supabase } from './src/lib/supabase.js';

// The exact function requested by the user
const submitReview = async (projectId, rating, content) => {
  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError);
      throw new Error("You must be signed in to submit a review.");
    }

    if (!projectId) {
      throw new Error("Project ID is missing.");
    }

    if (!content?.trim()) {
      throw new Error("Review content cannot be empty.");
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        project_id: projectId,
        user_id: user.id,
        rating: rating,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Review insert failed:", error);
      throw error;
    }

    console.log("Review saved successfully:", data);

    return data;
  } catch (error) {
    console.error("Submit review error:", error);
    throw error;
  }
};

async function testReviewSubmission() {
  console.log('================================================================');
  console.log('🧪 TESTING REVIEW INSERTION WITH AUTHENTICATED USER IN SUPABASE');
  console.log('================================================================\n');

  // 1. Sign in as Bob (Reviewer)
  console.log('1. Authenticating as Bob...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'bob.evaluator@demo.innovexa.io',
    password: 'DemoPass123!'
  });

  if (authError || !authData?.user) {
    console.error('Bob login failed:', authError);
    process.exit(1);
  }

  const user = authData.user;
  console.log(`✓ Authenticated: ${user.email} (ID: ${user.id})`);

  // 2. Fetch a project to review
  console.log('\n2. Fetching project to review...');
  const { data: projects, error: projError } = await supabase
    .from('projects')
    .select('id, title, user_id')
    .limit(1);

  if (projError || !projects || projects.length === 0) {
    console.error('Failed to get project:', projError);
    process.exit(1);
  }

  const targetProject = projects[0];
  console.log(`✓ Target Project: "${targetProject.title}" (ID: ${targetProject.id})`);

  // 3. Execute submitReview
  console.log('\n3. Executing submitReview(projectId, rating, content)...');
  const reviewData = await submitReview(
    targetProject.id,
    5,
    'Exceptional concept and clear architectural execution. Verified through Antigravity validation flow.'
  );

  console.log('\n✓ Review verified:');
  console.log(`  - Review ID: ${reviewData.id}`);
  console.log(`  - Project ID: ${reviewData.project_id}`);
  console.log(`  - User ID (auth.uid): ${reviewData.user_id}`);
  console.log(`  - Rating: ${reviewData.rating}`);
  console.log(`  - Content: ${reviewData.content}`);

  // Assertions
  if (!reviewData.id) throw new Error('Missing review ID');
  if (reviewData.user_id !== user.id) throw new Error(`User ID mismatch: expected ${user.id}, got ${reviewData.user_id}`);
  if (reviewData.project_id !== targetProject.id) throw new Error(`Project ID mismatch: expected ${targetProject.id}, got ${reviewData.project_id}`);
  if (reviewData.rating !== 5) throw new Error(`Rating mismatch: expected 5, got ${reviewData.rating}`);

  // 4. Query reviews to verify fetch
  console.log('\n4. Querying reviews table to confirm persistence in Supabase...');
  const { data: fetchedReviews, error: fetchErr } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', reviewData.id);

  if (fetchErr || !fetchedReviews || fetchedReviews.length === 0) {
    throw new Error('Review could not be queried back from Supabase!');
  }
  console.log(`✓ Persisted review confirmed in database.`);

  // Cleanup test review
  await supabase.from('reviews').delete().eq('id', reviewData.id);
  console.log('\n✓ Test review cleanup complete.');

  console.log('\n================================================================');
  console.log('🎉 REVIEW INSERTION TEST PASSED SUCCESSFULLY!');
  console.log('================================================================\n');
}

testReviewSubmission().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
