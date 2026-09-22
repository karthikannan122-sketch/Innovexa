import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("====================================================");
console.log("LIVE TRIAL: SUPABASE REVIEW PERSISTENCE VERIFICATION");
console.log("====================================================");

async function runReviewLiveTrial() {
  try {
    // 1. Authenticate with Supabase
    console.log("\n[Step 1] Authenticating as Bob Evaluator...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'bob.evaluator@demo.innovexa.io',
      password: 'DemoPass123!'
    });

    if (authError || !authData?.user) {
      console.error("Authentication failed:", authError);
      return;
    }
    const user = authData.user;
    console.log(`✓ Authenticated successfully! User ID: ${user.id} (${user.email})`);

    // 2. Fetch a project to review
    console.log("\n[Step 2] Finding an active specimen / project...");
    const { data: projects, error: pErr } = await supabase
      .from('projects')
      .select('id, title, user_id, status')
      .neq('user_id', user.id) // Ensure Bob doesn't review his own project
      .limit(1);

    if (pErr || !projects || projects.length === 0) {
      console.error("No valid project found:", pErr);
      return;
    }

    const project = projects[0];
    console.log(`✓ Target Project: "${project.title}" (ID: ${project.id}) Owner: ${project.user_id}`);

    // 3. Submit a review with rating and content
    console.log("\n[Step 3] Submitting review via Supabase insert...");
    const reviewPayload = {
      project_id: project.id,
      user_id: user.id,
      rating: 5,
      content: "Superb architecture and execution. The point-cloud radar integration delivers high precision for edge robotics."
    };

    const { data: createdReview, error: insertError } = await supabase
      .from("reviews")
      .insert([reviewPayload])
      .select(`
        *,
        profiles (
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    let activeReview = createdReview;
    if (insertError) {
      if (insertError.code === '23505' || insertError.message?.includes('duplicate key') || insertError.message?.includes('unique constraint')) {
        console.log("Notice: Review already exists for this user-project, performing in-place update...");
        const { data: updatedReview, error: updateErr } = await supabase
          .from("reviews")
          .update({
            rating: reviewPayload.rating,
            content: reviewPayload.content,
            updated_at: new Date().toISOString()
          })
          .eq("project_id", project.id)
          .eq("user_id", user.id)
          .select(`
            *,
            profiles (
              id,
              full_name,
              avatar_url
            )
          `)
          .single();

        if (updateErr) {
          console.error("Review update failed:", updateErr);
          return;
        }
        activeReview = updatedReview;
        console.log("✓ Review updated in-place successfully!");
      } else {
        console.error("Review insertion failed:", insertError);
        return;
      }
    } else {
      console.log("✓ New review created in Supabase successfully!");
    }

    console.log("\n[Step 4] Live Row in Supabase 'reviews' table:");
    console.dir(activeReview, { depth: null });

    // 5. Query public reviews for this project to verify it appears in the feed
    console.log("\n[Step 5] Fetching all public reviews for this project from Supabase...");
    const { data: allProjectReviews, error: getErr } = await supabase
      .from('reviews')
      .select(`
        id,
        project_id,
        user_id,
        rating,
        content,
        created_at,
        profiles (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });

    if (getErr) {
      console.error("Failed to query reviews:", getErr);
      return;
    }

    console.log(`✓ Total reviews found in Supabase for this project: ${allProjectReviews.length}`);
    allProjectReviews.forEach((rev, idx) => {
      console.log(`\nReview #${idx + 1}:`);
      console.log(`  - Review ID:   ${rev.id}`);
      console.log(`  - Reviewer ID: ${rev.user_id}`);
      console.log(`  - Reviewer:    ${rev.profiles?.full_name || 'Community Validator'}`);
      console.log(`  - Rating:      ${'★'.repeat(rev.rating)} (${rev.rating}/5)`);
      console.log(`  - Feedback:    "${rev.content}"`);
      console.log(`  - Created At:  ${rev.created_at}`);
    });

    console.log("\n====================================================");
    console.log("✓ VERIFICATION PASSED: REVIEWS ARE PERSISTED IN SUPABASE!");
    console.log("====================================================");
  } catch (err) {
    console.error("Unexpected exception:", err);
  }
}

runReviewLiveTrial();
