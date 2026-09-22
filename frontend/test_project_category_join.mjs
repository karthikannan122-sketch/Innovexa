import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProjectCategoryJoin() {
  console.log("====================================================");
  console.log("TESTING PROJECT CATEGORY JOIN QUERY FROM SUPABASE");
  console.log("====================================================");

  // Authenticate as Bob to ensure full permission
  await supabase.auth.signInWithPassword({
    email: 'bob.evaluator@demo.innovexa.io',
    password: 'DemoPass123!'
  });

  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      categories (
        id,
        name,
        slug
      )
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Query failed:", error);
    return;
  }

  console.log(`✓ Total published projects retrieved: ${data.length}\n`);

  data.forEach((project, idx) => {
    const categoryName = project.categories?.name || "Uncategorized";
    console.log(`[Project #${idx + 1}]`);
    console.log(`  Title:         "${project.title}"`);
    console.log(`  Project ID:    ${project.id}`);
    console.log(`  Category ID:   ${project.category_id}`);
    console.log(`  Category Name: ${categoryName}`);
    console.log(`  Status:        ${project.status}`);
    console.log(`  Created At:    ${project.created_at}`);
    console.log("----------------------------------------------------");
  });
}

testProjectCategoryJoin();
