import { supabase } from './src/lib/supabase.js';

async function inspectProjectsSchema() {
  console.log('--- Inspecting public.projects in live Supabase ---');
  const { data, error } = await supabase.from('projects').select('*').limit(5);

  if (error) {
    console.error('Error fetching projects:', error);
    return;
  }

  console.log(`Retrieved ${data?.length || 0} projects from live database.`);
  if (data && data.length > 0) {
    console.log('Columns present in first row:');
    console.log(Object.keys(data[0]));
    console.log('\nSample Project 1:', {
      id: data[0].id,
      title: data[0].title,
      category_id: data[0].category_id,
      problem_statement: data[0].problem_statement,
      proposed_solution: data[0].proposed_solution,
      target_users: data[0].target_users,
      short_description: data[0].short_description,
      description: data[0].description,
      project_type: data[0].project_type,
      launch_url: data[0].launch_url
    });
  }

  // Fetch all projects to inspect completeness
  const { data: allProjects } = await supabase.from('projects').select('*');
  console.log(`\nTotal projects in Supabase: ${allProjects?.length || 0}`);
  allProjects?.forEach((p, idx) => {
    console.log(`[${idx + 1}] ID: ${p.id} | Title: "${p.title}" | Problem: ${Boolean(p.problem_statement)} | Solution: ${Boolean(p.proposed_solution)} | TargetUsers: ${Boolean(p.target_users)}`);
  });
}

inspectProjectsSchema().catch(console.error);
