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

const client = createClient(supabaseUrl, supabaseAnonKey);

async function testTables() {
  const { data: authA } = await client.auth.signInWithPassword({
    email: 'creator.test@innovexa.io',
    password: 'TestPassword123!'
  });

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${authA.session.access_token}` } }
  });

  console.log('\n--- 1. PROFILES TABLE ---');
  // Try inserting / updating profile
  const { data: prof, error: profErr } = await userClient.from('profiles').select('*').eq('id', authA.user.id);
  console.log('Profile:', prof, 'Error:', profErr);
  if (prof && prof.length === 0) {
    // Insert profile
    const { data: profIns, error: profInsErr } = await userClient.from('profiles').insert([{
      id: authA.user.id,
      full_name: 'Creator Test User'
    }]).select();
    console.log('Profile insert result:', profIns, 'Error:', profInsErr);
  }

  console.log('\n--- 2. CATEGORIES TABLE ---');
  const { data: cats, error: catErr } = await userClient.from('categories').select('*');
  console.log('Categories:', cats);

  console.log('\n--- 3. PROJECTS TABLE ---');
  // Insert project
  const { data: proj, error: projErr } = await userClient.from('projects').insert([{
    user_id: authA.user.id,
    title: 'Test Project',
    description: 'Test Description',
    project_type: 'idea',
    status: 'published',
    category_id: cats?.[0]?.id || null
  }]).select();
  console.log('Project insert:', proj, 'Error:', projErr);
  const projId = proj?.[0]?.id;

  console.log('\n--- 4. REVIEWS TABLE COLUMN PROBING ---');
  // Let's test individual column select on reviews:
  // In PostgREST: /reviews?select=col_name
  // If column exists, status 200 (data: []). If not, error PGRST204 (Could not find column)
  const candidateReviewCols = [
    'id', 'project_id', 'user_id', 'reviewer_id', 'rating', 'feedback', 'comment', 'content',
    'review', 'notes', 'suggestion', 'suggestions', 'relevance', 'problem_relevance',
    'relevance_answer', 'would_use', 'pros', 'cons', 'status', 'created_at', 'updated_at',
    'overall_feedback', 'score', 'verdict', 'is_valid', 'validation_status'
  ];
  const existingReviewCols = [];
  for (const c of candidateReviewCols) {
    const { data, error } = await userClient.from('reviews').select(c).limit(1);
    if (!error) {
      existingReviewCols.push(c);
    }
  }
  console.log('Confirmed REVIEWS columns in Supabase:', existingReviewCols);

  console.log('\n--- 5. PROJECT_LIKES TABLE COLUMN PROBING ---');
  const candidateLikeCols = [
    'id', 'project_id', 'user_id', 'created_at', 'updated_at'
  ];
  const existingLikeCols = [];
  for (const c of candidateLikeCols) {
    const { data, error } = await userClient.from('project_likes').select(c).limit(1);
    if (!error) {
      existingLikeCols.push(c);
    }
  }
  console.log('Confirmed PROJECT_LIKES columns in Supabase:', existingLikeCols);

  console.log('\n--- 6. NOTIFICATIONS TABLE COLUMN PROBING ---');
  const candidateNotifCols = [
    'id', 'user_id', 'title', 'message', 'content', 'type', 'read', 'is_read',
    'project_id', 'link', 'data', 'created_at', 'updated_at'
  ];
  const existingNotifCols = [];
  for (const c of candidateNotifCols) {
    const { data, error } = await userClient.from('notifications').select(c).limit(1);
    if (!error) {
      existingNotifCols.push(c);
    }
  }
  console.log('Confirmed NOTIFICATIONS columns in Supabase:', existingNotifCols);

  console.log('\n--- 7. PROFILES TABLE COLUMN PROBING ---');
  const candidateProfCols = [
    'id', 'full_name', 'name', 'avatar_url', 'avatar', 'bio', 'headline',
    'organization', 'role', 'interests', 'skills', 'preferred_domains',
    'credits', 'reputation_score', 'reputation_tier', 'onboarding_completed',
    'email', 'created_at', 'updated_at'
  ];
  const existingProfCols = [];
  for (const c of candidateProfCols) {
    const { data, error } = await userClient.from('profiles').select(c).limit(1);
    if (!error) {
      existingProfCols.push(c);
    }
  }
  console.log('Confirmed PROFILES columns in Supabase:', existingProfCols);

  console.log('\n--- 8. PROJECTS TABLE COLUMN PROBING ---');
  const candidateProjCols = [
    'id', 'user_id', 'creator_id', 'title', 'short_description', 'description',
    'problem_statement', 'proposed_solution', 'target_users', 'features', 'tags',
    'images', 'cover_image', 'launch_url', 'website_url', 'demo_url', 'github_url',
    'app_store_url', 'play_store_url', 'has_live_product', 'next_community_action',
    'project_type', 'creation_type', 'innovation_type', 'project_stage', 'development_stage',
    'status', 'launch_status', 'validation_target', 'valid_reviews_count', 'upvotes_count',
    'comments_count', 'version', 'published_at', 'category_id', 'category_name',
    'created_at', 'updated_at'
  ];
  const existingProjCols = [];
  for (const c of candidateProjCols) {
    const { data, error } = await userClient.from('projects').select(c).limit(1);
    if (!error) {
      existingProjCols.push(c);
    }
  }
  console.log('Confirmed PROJECTS columns in Supabase:', existingProjCols);

  // Clean up test project
  if (projId) {
    await userClient.from('projects').delete().eq('id', projId);
  }
}

testTables().catch(console.error);
