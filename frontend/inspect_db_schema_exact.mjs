import { supabase } from './src/lib/supabase.js';

async function inspectSchema() {
  console.log('=== 1. CHECKING TABLES IN SUPABASE ===');

  // Check projects table columns by doing a select limit 1 or empty
  const { data: projectsSample, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .limit(1);

  if (projectsError) {
    console.error('❌ Error fetching projects:', projectsError);
  } else {
    console.log('✅ projects table accessible! Rows found:', projectsSample?.length);
    if (projectsSample && projectsSample.length > 0) {
      console.log('Columns in projects table:');
      console.log(Object.keys(projectsSample[0]));
      console.log('Sample project:', projectsSample[0]);
    } else {
      console.log('projects table is currently empty.');
    }
  }

  // Check profiles table
  const { data: profilesSample, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError);
  } else {
    console.log('✅ profiles table columns:');
    if (profilesSample && profilesSample.length > 0) {
      console.log(Object.keys(profilesSample[0]));
      console.log('Sample profile:', profilesSample[0]);
    }
  }

  // Check categories table
  const { data: categoriesSample, error: categoriesError } = await supabase
    .from('categories')
    .select('*');
  if (categoriesError) {
    console.error('❌ Error fetching categories:', categoriesError);
  } else {
    console.log(`✅ categories table: found ${categoriesSample?.length} categories:`);
    console.log(categoriesSample);
  }

  // Check if project_categories table exists
  const { data: projCatSample, error: projCatError } = await supabase
    .from('project_categories')
    .select('*')
    .limit(1);
  if (projCatError) {
    console.log('ℹ️ project_categories table:', projCatError.message || projCatError);
  } else {
    console.log('✅ project_categories table EXISTS:', projCatSample);
  }
}

inspectSchema().catch(console.error);
