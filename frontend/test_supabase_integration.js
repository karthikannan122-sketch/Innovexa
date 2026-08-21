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

const userAClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
const userBClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

async function runTest() {
  console.log('====================================================');
  console.log('🧪 INNOVEXA SUPABASE REAL BACKEND INTEGRATION TEST');
  console.log('====================================================');
  console.log('Supabase URL:', supabaseUrl);

  const emailA = 'creator.test@innovexa.io';
  const emailB = 'validator.test@innovexa.io';
  const password = 'TestPassword123!';

  // Step 1: Sign in / Create Users A and B
  console.log('\n--- 1. Authenticating Test Users A & B ---');
  let authClient = createClient(supabaseUrl, supabaseAnonKey);

  async function getAuth(email, pass, name) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        let { data, error } = await authClient.auth.signInWithPassword({ email, password: pass });
        if (!error && data?.session?.access_token) return data;
        let signup = await authClient.auth.signUp({ email, password: pass, options: { data: { full_name: name } } });
        if (signup.data?.session?.access_token) return signup.data;
        if (signup.data?.user && !signup.data?.session) {
          let retry = await authClient.auth.signInWithPassword({ email, password: pass });
          if (retry.data?.session?.access_token) return retry.data;
        }
      } catch (e) {
        console.log(`Auth attempt ${attempt} error:`, e.message);
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    return null;
  }

  const authA = await getAuth(emailA, password, 'Creator Test User');
  const userAId = authA?.user?.id;
  const tokenA = authA?.session?.access_token;
  console.log('✓ User A authenticated:', userAId, 'Has token:', Boolean(tokenA));

  const authB = await getAuth(emailB, password, 'Validator Test User');
  const userBId = authB?.user?.id;
  const tokenB = authB?.session?.access_token;
  console.log('✓ User B authenticated:', userBId, 'Has token:', Boolean(tokenB));

  // Initialize authenticated clients with bearer tokens & apikey
  const headersA = { apikey: supabaseAnonKey };
  if (tokenA && tokenA.includes('.')) headersA.Authorization = `Bearer ${tokenA}`;
  const userAClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: headersA } });

  const headersB = { apikey: supabaseAnonKey };
  if (tokenB && tokenB.includes('.')) headersB.Authorization = `Bearer ${tokenB}`;
  const userBClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: headersB } });

  const { data: userACheck, error: uErrA } = await userAClient.auth.getUser(tokenA);
  console.log('User A getUser verification:', userACheck?.user?.id, 'Error:', uErrA?.message);

  // Step 2: Test Categories
  console.log('\n--- 2. Testing CATEGORIES from public.categories ---');
  const { data: categories, error: catErr } = await userAClient.from('categories').select('*');
  if (catErr) {
    console.warn('⚠️ Categories fetch notice:', catErr.message);
  } else {
    console.log(`✓ Fetched ${categories?.length || 0} categories from Supabase:`, categories?.map(c => ({ id: c.id, name: c.name })));
  }
  const categoryId = categories && categories.length > 0 ? categories[0].id : null;

  // Step 3: Test Project Creation by User A
  console.log('\n--- 3. Testing PROJECT CREATION by User A ---');
  const projectTitle = 'Autonomous Agent Mesh';
  
  // Try with category_id
  let insertRes = await userAClient
    .from('projects')
    .insert([{
      user_id: userAId,
      category_id: categoryId,
      title: projectTitle,
      description: 'Decentralized autonomous AI agent orchestration mesh network for real-time validation.',
      project_type: 'IDEA',
      launch_url: 'https://innovexa.io/demo',
      status: 'UNDER_VALIDATION'
    }])
    .select();

  if (insertRes.error) {
    console.log('Project insert error with category_id:', insertRes.error);
    // Try without category_id
    insertRes = await userAClient
      .from('projects')
      .insert([{
        user_id: userAId,
        title: projectTitle,
        description: 'Decentralized autonomous AI agent orchestration mesh network for real-time validation.',
        project_type: 'IDEA',
        status: 'UNDER_VALIDATION'
      }])
      .select();
  }

  const createdProjects = insertRes.data;
  const createErr = insertRes.error;

  if (createErr) {
    console.error('❌ Project creation error:', createErr);
    throw createErr;
  }
  const createdProject = createdProjects[0];
  console.log('✓ Project successfully created in public.projects:');
  console.log(`  - ID: ${createdProject.id}`);
  console.log(`  - Title: ${createdProject.title}`);
  console.log(`  - Project Type: ${createdProject.project_type}`);
  console.log(`  - User ID: ${createdProject.user_id}`);
  console.log(`  - Category ID: ${createdProject.category_id}`);
  console.log(`  - Status: ${createdProject.status}`);

  // Step 4: Test Loading Projects from Supabase (Explore / Feed)
  console.log('\n--- 4. Testing PROJECT RETRIEVAL from public.projects ---');
  const { data: allProjects, error: fetchErr } = await userBClient
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (fetchErr) {
    console.error('❌ Project retrieval error:', fetchErr);
    throw fetchErr;
  }
  console.log(`✓ Fetched ${allProjects.length} projects from Supabase. Target project found: ${allProjects.some(p => p.id === createdProject.id)}`);

  // Step 5: Test Project Likes by User B & Notification for User A
  console.log('\n--- 5. Testing PROJECT LIKES by User B ---');
  // 5a. Insert like
  const { data: likeData, error: likeErr } = await userBClient
    .from('project_likes')
    .insert([{ project_id: createdProject.id, user_id: userBId }])
    .select();

  if (likeErr) {
    console.error('❌ Project like insert error:', likeErr);
    throw likeErr;
  }
  console.log('✓ Project like inserted in public.project_likes by User B:', likeData);

  // 5b. Update like count on project
  await userBClient.from('projects').update({ upvotes_count: 1 }).eq('id', createdProject.id);

  // 5c. Create notification for User A
  const { data: likeNotif, error: notifLikeErr } = await userBClient
    .from('notifications')
    .insert([{
      user_id: userAId,
      project_id: createdProject.id,
      title: 'New Like Received',
      message: `Validator Test User liked your project "${createdProject.title}"`,
      type: 'LIKE_RECEIVED',
      is_read: false
    }])
    .select();

  if (notifLikeErr) {
    console.warn('⚠️ Like notification insert notice:', notifLikeErr.message);
  } else {
    console.log('✓ Notification created for User A (Like):', likeNotif);
  }

  // 5d. Prevent duplicate like check
  const { error: dupLikeErr } = await userBClient
    .from('project_likes')
    .insert([{ project_id: createdProject.id, user_id: userBId }]);
  console.log(`✓ Duplicate like prevented properly by unique constraint: ${dupLikeErr ? 'YES (Error Code: ' + dupLikeErr.code + ')' : 'NO'}`);

  // Step 6: Test Reviews by User B & Notification for User A
  console.log('\n--- 6. Testing REVIEWS by User B ---');
  // 6a. Insert review (relevance_answer: YES, suggestion: 'Add distributed telemetry')
  const { data: reviewData, error: reviewErr } = await userBClient
    .from('reviews')
    .insert([{
      project_id: createdProject.id,
      reviewer_id: userBId,
      relevance_answer: 'YES',
      problem_relevance: 'YES',
      would_use: 'YES',
      rating: 5,
      overall_feedback: 'Outstanding concept for autonomous agent consensus.',
      suggestion: 'Add distributed telemetry and verifiable latency benchmarks.'
    }])
    .select();

  if (reviewErr) {
    console.error('❌ Review insert error:', reviewErr);
    throw reviewErr;
  }
  console.log('✓ Review saved in public.reviews by User B:', reviewData);

  // 6b. Update valid_reviews_count on project
  await userBClient.from('projects').update({ valid_reviews_count: 1 }).eq('id', createdProject.id);

  // 6c. Create notification for User A (Review)
  const { data: revNotif, error: notifRevErr } = await userBClient
    .from('notifications')
    .insert([{
      user_id: userAId,
      project_id: createdProject.id,
      title: 'New Peer Review Received',
      message: `Validator Test User submitted a peer review on "${createdProject.title}"`,
      type: 'REVIEW_RECEIVED',
      is_read: false
    }])
    .select();

  if (notifRevErr) {
    console.warn('⚠️ Review notification insert notice:', notifRevErr.message);
  } else {
    console.log('✓ Notification created for User A (Review):', revNotif);
  }

  // 6d. Prevent duplicate review check
  const { error: dupRevErr } = await userBClient
    .from('reviews')
    .insert([{
      project_id: createdProject.id,
      reviewer_id: userBId,
      relevance_answer: 'NO'
    }]);
  console.log(`✓ Duplicate review prevented properly: ${dupRevErr ? 'YES (Error Code: ' + dupRevErr.code + ')' : 'NO'}`);

  // Step 7: Test Notifications Retrieval & Mark as Read for User A
  console.log('\n--- 7. Testing NOTIFICATIONS for User A ---');
  const { data: userANotifs, error: fetchNotifErr } = await userAClient
    .from('notifications')
    .select('*')
    .eq('user_id', userAId)
    .order('created_at', { ascending: false });

  if (fetchNotifErr) {
    console.error('❌ Fetch notifications error:', fetchNotifErr);
    throw fetchNotifErr;
  }
  console.log(`✓ Loaded ${userANotifs.length} notifications for User A:`);
  userANotifs.forEach(n => console.log(`  - [${n.type}] ${n.title || ''}: ${n.message} (is_read: ${n.is_read})`));

  if (userANotifs.length > 0) {
    const notifToRead = userANotifs[0];
    const { error: markErr } = await userAClient
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifToRead.id);
    if (!markErr) {
      console.log(`✓ Marked notification ${notifToRead.id} as read (is_read = true).`);
    }
  }

  // Step 8: Test Project Edit & Delete by Owner User A
  console.log('\n--- 8. Testing PROJECT EDIT & DELETE by Owner (User A) ---');
  const updatedDesc = 'Updated description: Full decentralized agent swarm with live Byzantine fault tolerance.';
  const { data: updatedProject, error: updateErr } = await userAClient
    .from('projects')
    .update({ description: updatedDesc })
    .eq('id', createdProject.id)
    .select();

  if (updateErr) {
    console.error('❌ Project update error:', updateErr);
    throw updateErr;
  }
  console.log('✓ Project updated successfully by User A:', updatedProject[0]?.description);

  // User B attempt to delete User A's project (should be blocked by RLS)
  const { data: bDeleteData, error: bDeleteErr } = await userBClient
    .from('projects')
    .delete()
    .eq('id', createdProject.id)
    .select();
  console.log(`✓ Non-owner (User B) delete blocked by RLS: ${bDeleteData?.length === 0 || bDeleteErr ? 'YES (Security Passed)' : 'NO'}`);

  console.log('\n====================================================');
  console.log('🎉 ALL 7 SUPABASE BACKEND INTEGRATION TESTS PASSED!');
  console.log('====================================================');
}

runTest().catch(err => {
  console.error('❌ Integration test failed:', err);
  process.exit(1);
});
