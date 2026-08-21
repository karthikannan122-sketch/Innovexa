import { supabase } from './src/lib/supabase.js';

async function testExploreQuery() {
  console.log('Testing Supabase projects with categories query with auth...');
  const login = await supabase.auth.signInWithPassword({
    email: 'alice.innovator@demo.innovexa.io',
    password: 'DemoPass123!'
  });

  const { data: projects, error } = await supabase
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

  if (error) {
    console.error("Explore query error:", error);
    return;
  }

  console.log(`Found ${projects.length} published projects:\n`);
  projects.forEach((project) => {
    console.log(`Project: ${project.title}`);
    console.log(`Category: ${project.categories?.name || "Uncategorized"}\n`);
  });
}

testExploreQuery();
