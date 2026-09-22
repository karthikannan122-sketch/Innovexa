import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

console.log("====================================================");
console.log("TESTING REVIEWS TABLE ON LIVE SUPABASE");
console.log("====================================================");

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testReviewsRLS() {
  try {
    // 1. Fetch a project
    const { data: projects, error: pErr } = await supabase
      .from('projects')
      .select('id, title, user_id')
      .limit(1);

    if (pErr || !projects || projects.length === 0) {
      console.error("Could not fetch projects:", pErr);
      return;
    }

    const testProject = projects[0];
    console.log("Project:", testProject.title, "(ID:", testProject.id, "Owner:", testProject.user_id, ")");

    // 2. Query columns on reviews table
    console.log("\n2. Querying reviews table schema...");
    const { data: existingReviews, error: revErr } = await supabase
      .from('reviews')
      .select('*')
      .limit(2);

    if (revErr) {
      console.log("Reviews SELECT error:", revErr.message);
    } else {
      console.log("✓ Reviews SELECT works! Current count:", existingReviews?.length);
      if (existingReviews && existingReviews.length > 0) {
        console.log("Reviews columns:", Object.keys(existingReviews[0]));
      }
    }

    // 3. Try to insert unauthenticated / with anon key
    console.log("\n3. Testing unauthenticated / custom user insert on reviews...");
    const { data: anonInsert, error: anonErr } = await supabase
      .from('reviews')
      .insert({
        project_id: testProject.id,
        user_id: "00000000-0000-0000-0000-000000000001",
        rating: 5,
        content: "Automated probe review."
      })
      .select();

    if (anonErr) {
      console.log("Notice on unauthenticated insert:", anonErr.message);
    } else {
      console.log("✓ Unauthenticated insert succeeded:", anonInsert);
    }

    // 4. Try with authenticated user Bob
    console.log("\n4. Testing with authenticated user Bob...");
    const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
      email: 'bob.evaluator@demo.innovexa.io',
      password: 'DemoPass123!'
    });

    if (authErr) {
      console.log("Sign in error:", authErr.message);
    } else {
      console.log("✓ Authenticated as Bob:", auth.user.id);
      
      const { data: authInsert, error: authInsErr } = await supabase
        .from('reviews')
        .insert({
          project_id: testProject.id,
          user_id: auth.user.id,
          rating: 5,
          content: "Constructive validation review from Bob."
        })
        .select();

      if (authInsErr) {
        console.log("Bob Review INSERT error:", authInsErr);
      } else {
        console.log("✓ Bob Review INSERT succeeded!", authInsert);
        // Clean up
        await supabase.from('reviews').delete().eq('id', authInsert[0].id);
        console.log("✓ Cleaned up probe review.");
      }
    }

    console.log("\n====================================================");
    console.log("PROBE COMPLETE");
    console.log("====================================================");
  } catch (err) {
    console.error("Exception:", err);
  }
}

testReviewsRLS();
