import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

console.log("====================================================");
console.log("COMPLETE STEP 8 E2E WORKFLOW TEST");
console.log("====================================================");

async function runFullWorkflowTest() {
  // Client for User A (Alice / Innovator)
  const supabaseA = createClient(supabaseUrl, supabaseAnonKey);
  
  // 1. User A Login
  console.log("\n[Step 1] User A Login...");
  const { data: authA, error: aErr } = await supabaseA.auth.signInWithPassword({
    email: 'alice.innovator@demo.innovexa.io',
    password: 'DemoPass123!'
  });

  if (aErr) {
    console.error("User A auth failed:", aErr);
    return;
  }
  const userA = authA.user;
  console.log(`✓ User A logged in: ${userA.email} (ID: ${userA.id})`);

  // 2. Fetch Categories from public.categories
  console.log("\n[Step 2] User A fetches categories from public.categories...");
  const { data: categories, error: catErr } = await supabaseA
    .from("categories")
    .select("id, name, slug, description")
    .order("name");

  if (catErr) {
    console.error("Category fetch failed:", catErr);
    return;
  }

  console.log(`✓ Retrieved ${categories.length} categories from public.categories:`);
  categories.forEach((cat, idx) => console.log(`   ${idx + 1}. [${cat.id}] ${cat.name}`));

  // 3. User A selects Healthcare category
  const healthcareCategory = categories.find(c => c.name.toLowerCase().includes('healthcare') || c.slug === 'healthcare');
  if (!healthcareCategory) {
    console.error("Healthcare category not found in categories table!");
    return;
  }
  const selectedCategoryId = healthcareCategory.id;
  console.log(`\n[Step 3] User A selects Category: "${healthcareCategory.name}"`);
  console.log(`   Selected Category UUID: ${selectedCategoryId}`);

  // 4. User A enters project details and submits
  const projectTitle = `CardioPulse AI Telemetry ${Date.now().toString().slice(-4)}`;
  const projectDesc = "Continuous non-invasive cardiac biomarker sensing for remote patient telemetry.";
  const projectType = "idea";

  console.log("\n[Step 4] User A submits project to public.projects...");
  const { data: projectA, error: insErr } = await supabaseA
    .from("projects")
    .insert({
      user_id: userA.id,
      category_id: selectedCategoryId || null,
      title: projectTitle.trim(),
      description: projectDesc.trim(),
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

  if (insErr) {
    console.error("Project insert failed:", insErr);
    return;
  }

  console.log("✓ Project created successfully in public.projects:");
  console.log(`   - Project ID:       ${projectA.id}`);
  console.log(`   - Title:            "${projectA.title}"`);
  console.log(`   - Category ID in DB: ${projectA.category_id}`);
  console.log(`   - Joined Cat Name:  "${projectA.categories?.name}"`);

  // Verify category_id matches Healthcare UUID
  if (projectA.category_id !== healthcareCategory.id) {
    console.error(`❌ Category ID mismatch! Expected ${healthcareCategory.id}, got ${projectA.category_id}`);
    return;
  }
  console.log("✓ VERIFIED: public.projects.category_id === healthcareCategory.id");

  // 5. User B Login
  console.log("\n[Step 5] User B Login...");
  const supabaseB = createClient(supabaseUrl, supabaseAnonKey);
  const { data: authB, error: bErr } = await supabaseB.auth.signInWithPassword({
    email: 'bob.evaluator@demo.innovexa.io',
    password: 'DemoPass123!'
  });

  if (bErr) {
    console.error("User B auth failed:", bErr);
    return;
  }
  const userB = authB.user;
  console.log(`✓ User B logged in: ${userB.email} (ID: ${userB.id})`);

  // 6. User B Opens Explore Page (fetches all published projects without user_id filtering)
  console.log("\n[Step 6] User B fetches Explore feed (all published projects)...");
  const { data: exploreData, error: expErr } = await supabaseB
    .from("projects")
    .select(`
      *,
      categories (
        id,
        name,
        slug
      ),
      profiles (
        id,
        full_name
      )
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (expErr) {
    console.error("Explore fetch failed for User B:", expErr);
    return;
  }

  console.log(`✓ User B received ${exploreData.length} published projects.`);

  // Find User A's project in User B's feed
  const foundInFeed = exploreData.find(p => p.id === projectA.id);
  if (!foundInFeed) {
    console.error("❌ User B could not find User A's project in the explore feed!");
    return;
  }

  const displayedCategoryName = foundInFeed.categories?.name || "Uncategorized";
  console.log("\n[Step 7] User B verifies User A's project:");
  console.log(`   - Project Title:     "${foundInFeed.title}"`);
  console.log(`   - Creator:           ${foundInFeed.profiles?.full_name || 'Community Innovator'} (${foundInFeed.user_id})`);
  console.log(`   - Displayed Category: [${displayedCategoryName}]`);

  if (displayedCategoryName === "Healthcare" && foundInFeed.category_id === healthcareCategory.id) {
    console.log("\n====================================================");
    console.log("✓ SUCCESS: USER B SEES USER A's PROJECT WITH HEALTHCARE CATEGORY!");
    console.log("====================================================");
  } else {
    console.error("❌ Failed category check for User B.");
  }
}

runFullWorkflowTest();
