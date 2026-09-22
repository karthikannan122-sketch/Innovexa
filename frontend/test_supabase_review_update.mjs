import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testReviewUpdateTrial() {
  console.log("====================================================");
  console.log("TESTING RE-REVIEW / IN-PLACE UPDATE IN SUPABASE");
  console.log("====================================================");

  // Authenticate as Bob
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'bob.evaluator@demo.innovexa.io',
    password: 'DemoPass123!'
  });
  const user = authData.user;
  const projectId = 'e836ef1c-7bb2-462a-bcf1-6cdb97463ea4';

  console.log(`Updating existing review for project ${projectId} by user ${user.id}...`);

  const updatedContent = "Updated Evaluation: Verified multi-layer radar filtering with 99.4% accuracy across edge nodes.";
  const { data: updateList, error } = await supabase
    .from('reviews')
    .update({
      rating: 5,
      content: updatedContent,
      updated_at: new Date().toISOString()
    })
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .select(`
      id,
      project_id,
      user_id,
      rating,
      content,
      updated_at
    `);

  if (error) {
    console.error("Update failed:", error);
  } else {
    console.log("✓ Successfully updated live review in Supabase:", updateList);
  }
}

testReviewUpdateTrial();
