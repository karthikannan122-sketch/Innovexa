import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://crwqfrldxvjsbcsjyacg.supabase.co";
const supabaseAnonKey = "sb_publishable_UZKoNNZ0FvlzM3u9w1iT0A_PLe0I0Zr";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("====================================================");
console.log("LIVE TEST: CREATE IDEA PAGE CATEGORY & INSERT FLOW");
console.log("====================================================");

async function testCreateIdeaFlow() {
  // 1. Authenticate user
  console.log("[Step 1] Authenticating user...");
  const testEmail = `innovator_test_${Date.now()}@innovexa.io`;
  const testPass = 'DemoPass123!';
  const { data: authData, error: aErr } = await supabase.auth.signUp({
    email: testEmail,
    password: testPass,
    options: {
      data: {
        full_name: 'Idea Creator',
        username: `creator_${Date.now().toString().slice(-4)}`
      }
    }
  });
  if (aErr) {
    console.error("Auth failed:", aErr);
    return;
  }
  const user = authData.user;
  console.log(`✓ Authenticated as: ${user.email} (ID: ${user.id})`);

  // 2. Load categories from Supabase (as done on Create Idea page mount)
  console.log("\n[Step 2] Loading categories from Supabase...");
  const { data: categories, error: cErr } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (cErr) {
    console.error("Categories fetch failed:", cErr);
    return;
  }
  console.log(`✓ Loaded ${categories.length} categories from Supabase.`);
  const selectedCategory = categories.find(c => c.slug === 'artificial-intelligence') || categories[0];
  const selectedCategoryId = selectedCategory.id;
  console.log(`✓ User selects category: "${selectedCategory.name}" (ID: ${selectedCategoryId})`);

  // 3. User inputs title, description, projectType
  const title = `AeroSense LiDAR Platform ${Date.now().toString().slice(-4)}`;
  const description = "Next-generation solid-state LiDAR perception system for urban delivery drones with real-time obstacle avoidance.";
  const projectType = "idea";

  console.log("\n[Step 3] Inserting project into Supabase...");
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      category_id: selectedCategoryId || null,
      title: title.trim(),
      description: description.trim(),
      project_type: projectType,
      status: "published"
    })
    .select(`
      *,
      categories (
        id,
        name,
        slug
      )
    `)
    .single();

  if (error) {
    console.error("Project creation failed:", error);
    return;
  }

  console.log("\n[Step 4] Project created successfully in Supabase:");
  console.log("  - Project ID:     ", data.id);
  console.log("  - User ID:        ", data.user_id);
  console.log("  - Title:          ", data.title);
  console.log("  - Project Type:   ", data.project_type);
  console.log("  - Status:         ", data.status);
  console.log("  - Category ID:    ", data.category_id);
  console.log("  - Category Name:  ", data.categories?.name || "Uncategorized");
  console.log("  - Created At:     ", data.created_at);

  console.log("\n====================================================");
  console.log("✓ TEST PASSED: CREATE IDEA PAGE FLOW FULLY FUNCTIONAL");
  console.log("====================================================");
}

testCreateIdeaFlow();
