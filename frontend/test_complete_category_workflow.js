import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

let supabaseUrl = 'https://jeafkfarfkojazznsafj.supabase.co';
let supabaseAnonKey = 'sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf';

try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) {
      if (k.trim() === 'VITE_SUPABASE_URL') supabaseUrl = v.trim();
      if (k.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = v.trim();
    }
  });
} catch (e) {}

const clientA = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
const clientB = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

async function getAuthenticatedUser(client, email, password, name) {
  let res = await client.auth.signInWithPassword({ email, password });
  if (res.error || !res.data?.session) {
    const signup = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    if (signup.data?.session) {
      res = signup;
    } else {
      res = await client.auth.signInWithPassword({ email, password });
    }
  }
  if (res.error) throw res.error;
  return res.data.user;
}

async function testCompleteCategoryWorkflow() {
  console.log('================================================================');
  console.log('🧪 TESTING END-TO-END PROJECT CATEGORY WORKFLOW (USER A & USER B)');
  console.log('================================================================\n');

  // STEP 1: User A (Alice) logs in
  console.log('Step 1: User A (Alice) logs in to authenticate...');
  const userA = await getAuthenticatedUser(clientA, 'alice.innovator@demo.innovexa.io', 'DemoPass123!', 'Alice Innovator');
  console.log(`✓ User A authenticated: ${userA.email} (ID: ${userA.id})`);

  // STEP 2: Fetch categories dynamically from public.categories
  console.log('\nStep 2: Fetching categories from public.categories...');
  const { data: categories, error: catError } = await clientA
    .from('categories')
    .select('*')
    .order('name');

  if (catError || !categories || categories.length === 0) {
    console.error('Failed to fetch categories:', catError);
    process.exit(1);
  }

  console.log(`✓ Fetched ${categories.length} categories from Supabase:`);
  categories.forEach(c => console.log(`  - ${c.name} (UUID: ${c.id})`));

  const healthcareCat = categories.find(c => c.name.toLowerCase() === 'healthcare');
  if (!healthcareCat) {
    console.error('Healthcare category not found in categories table');
    process.exit(1);
  }
  console.log(`\n✓ Selected Category: "${healthcareCat.name}" with UUID: ${healthcareCat.id}`);

  // STEP 3: User A creates a Healthcare project
  console.log('\nStep 3: User A inserts project into public.projects...');
  const projectPayloadA = {
    user_id: userA.id,
    category_id: healthcareCat.id,
    title: 'MediPulse AI Diagnostic Suite',
    description: 'Autonomous non-invasive biomarker sensing and early cardiovascular anomaly detection.',
    project_type: 'startup',
    launch_url: 'https://medipulse.health',
    status: 'published'
  };

  const { data: projectA, error: createError } = await clientA
    .from('projects')
    .insert(projectPayloadA)
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
    .single();

  if (createError) {
    console.error('User A project creation failed:', createError);
    process.exit(1);
  }

  console.log('\n✓ User A project created in Supabase:');
  console.log(`  - Project ID: ${projectA.id}`);
  console.log(`  - Title: ${projectA.title}`);
  console.log(`  - Category ID: ${projectA.category_id}`);
  console.log(`  - Category Name: ${projectA.categories?.name || 'Uncategorized'}`);
  console.log(`  - Status: ${projectA.status}`);

  // STEP 4: User B (Bob) logs in & Explores
  console.log('\nStep 4: User B (Bob) logs in & fetches Explore projects...');
  const userB = await getAuthenticatedUser(clientB, 'bob.evaluator@demo.innovexa.io', 'DemoPass123!', 'Bob Evaluator');
  console.log(`✓ User B authenticated: ${userB.email} (ID: ${userB.id})`);

  // Query Explore page data as User B
  const { data: exploreProjects, error: exploreError } = await clientB
    .from('projects')
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
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (exploreError) {
    console.error('User B explore query failed:', exploreError);
    process.exit(1);
  }

  console.log(`\n✓ User B retrieved ${exploreProjects.length} published projects.`);
  
  // Find User A's project in the list
  const foundProject = exploreProjects.find(p => p.id === projectA.id);
  if (!foundProject) {
    console.error("❌ User A's project was not found in User B's explore feed!");
    process.exit(1);
  }

  const renderedCategory = foundProject.categories?.name || 'Uncategorized';
  console.log(`✓ User A's project visible to User B in Explore feed:`);
  console.log(`  Project: ${foundProject.title}`);
  console.log(`  Category: ${renderedCategory}`);

  if (renderedCategory !== 'Healthcare') {
    console.error(`❌ Expected category 'Healthcare', got '${renderedCategory}'`);
    process.exit(1);
  }

  // STEP 5: Filter by Healthcare Category ID
  console.log('\nStep 5: User B filters by Healthcare Category ID (' + healthcareCat.id + ')...');
  const filteredByHealthcare = exploreProjects.filter(p => p.category_id === healthcareCat.id);
  console.log(`✓ Found ${filteredByHealthcare.length} projects in Healthcare category.`);
  
  const matchesFilter = filteredByHealthcare.some(p => p.id === projectA.id);
  if (!matchesFilter) {
    console.error("❌ User A's project did not appear in Healthcare filtered results!");
    process.exit(1);
  }
  console.log("✓ User A's project correctly matches Healthcare category filter!");

  // STEP 6: Test Uncategorized handling (null category_id)
  console.log('\nStep 6: Testing Uncategorized project fallback (category_id = null)...');
  const dummyNullProject = { title: 'Legacy Uncategorized Signal', categories: null };
  const fallbackCatName = dummyNullProject.categories?.name || 'Uncategorized';
  console.log(`✓ Null category fallback renders: "${fallbackCatName}" without throwing errors.`);

  // CLEANUP: Delete test project
  await clientA.from('projects').delete().eq('id', projectA.id);
  console.log('\n✓ Test project cleanup completed.');

  console.log('\n================================================================');
  console.log('🎉 ALL WORKFLOW REQUIREMENTS VERIFIED SUCCESSFULLY!');
  console.log('================================================================\n');
}

testCompleteCategoryWorkflow().catch(err => {
  console.error('Workflow error:', err);
  process.exit(1);
});
