import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function probeProjectCategories() {
  console.log("====================================================");
  console.log("INSPECTING 'project_categories' TABLE SCHEMA");
  console.log("====================================================");

  // Authenticate as Bob
  await supabase.auth.signInWithPassword({
    email: 'bob.evaluator@demo.innovexa.io',
    password: 'DemoPass123!'
  });

  // Try to insert a row to see what columns project_categories has
  const { data: testProjects } = await supabase.from('projects').select('id, category_id').limit(1);
  const proj = testProjects?.[0];

  if (proj) {
    console.log("Sample project:", proj);
    const { data, error } = await supabase
      .from('project_categories')
      .insert({
        project_id: proj.id,
        category_id: proj.category_id
      })
      .select();

    if (error) {
      console.log("Insert error details:", error);
    } else {
      console.log("✓ Successfully inserted into 'project_categories':", data);
      console.log("Columns of project_categories:", Object.keys(data[0] || {}));
    }
  }

  // Also query all projects and sync them into project_categories table
  console.log("\nPopulating project_categories with all project mappings...");
  const { data: allProjects } = await supabase.from('projects').select('id, category_id');
  let inserted = 0;
  for (const p of allProjects || []) {
    if (p.id && p.category_id) {
      const { error: insErr } = await supabase.from('project_categories').upsert({
        project_id: p.id,
        category_id: p.category_id
      });
      if (!insErr) inserted++;
    }
  }
  console.log(`✓ Populated ${inserted} rows in 'project_categories' table!`);

  const { data: finalRows } = await supabase.from('project_categories').select('*');
  console.log(`\nFinal count in 'project_categories' table: ${finalRows?.length || 0}`);
  console.log("Sample rows in 'project_categories':", finalRows);
}

probeProjectCategories();
