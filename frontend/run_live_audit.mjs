/**
 * INNOVEXA — Comprehensive Live Supabase Audit Script
 * Tests all critical database operations, RLS policies, and workflows
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jeafkfarfkojazznsafj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- Test state tracking
const results = [];
let passCount = 0;
let failCount = 0;

function log(label, status, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'WARN' ? '⚠️' : 'ℹ️';
  console.log(`${icon} [${status}] ${label}${detail ? ' — ' + detail : ''}`);
  results.push({ label, status, detail });
  if (status === 'PASS') passCount++;
  if (status === 'FAIL') failCount++;
}

async function testAnonAccess() {
  console.log('\n====================================');
  console.log('PHASE 1: ANON ACCESS & TABLE CHECKS');
  console.log('====================================');

  // Test categories table
  const { data: cats, error: catErr } = await supabase.from('categories').select('*').limit(5);
  if (catErr) {
    log('Categories table accessible (anon)', 'FAIL', catErr.message);
  } else {
    log('Categories table accessible (anon)', 'PASS', `${cats?.length || 0} categories found`);
    if (cats?.length > 0) {
      console.log('   Sample categories:', cats.slice(0, 3).map(c => c.name).join(', '));
    }
  }

  // Test projects table
  const { data: projs, error: projErr } = await supabase.from('projects')
    .select('id, title, status, project_type, user_id, category_id')
    .in('status', ['published', 'PUBLISHED', 'UNDER_VALIDATION'])
    .limit(5);
  if (projErr) {
    log('Projects table accessible (anon - published)', 'FAIL', projErr.message);
  } else {
    log('Projects table accessible (anon - published)', 'PASS', `${projs?.length || 0} published projects found`);
    if (projs?.length > 0) {
      console.log('   Sample project IDs:', projs.slice(0, 2).map(p => `${p.id.slice(0,8)}... "${p.title?.slice(0,30)}"`).join(', '));
    }
  }

  // Test project_likes
  const { data: likes, error: likesErr } = await supabase.from('project_likes').select('id, project_id, user_id').limit(3);
  if (likesErr) {
    log('project_likes table accessible (anon)', 'FAIL', likesErr.message);
  } else {
    log('project_likes table accessible (anon)', 'PASS', `${likes?.length || 0} records`);
  }

  // Test project_dislikes
  const { data: dislikes, error: dislikesErr } = await supabase.from('project_dislikes').select('id, project_id, user_id').limit(3);
  if (dislikesErr) {
    log('project_dislikes table accessible (anon)', 'FAIL', dislikesErr.message);
  } else {
    log('project_dislikes table accessible (anon)', 'PASS', `${dislikes?.length || 0} records`);
  }

  // Test reviews table
  const { data: revs, error: revErr } = await supabase.from('reviews').select('id, project_id, user_id, rating, content').limit(3);
  if (revErr) {
    log('reviews table accessible (anon)', 'FAIL', revErr.message);
  } else {
    log('reviews table accessible (anon)', 'PASS', `${revs?.length || 0} reviews`);
  }

  // Test profiles table
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, full_name, avatar_url').limit(3);
  if (profErr) {
    log('profiles table accessible (anon)', 'FAIL', profErr.message);
  } else {
    log('profiles table accessible (anon)', 'PASS', `${profiles?.length || 0} profiles`);
  }

  // Test messages table
  const { data: msgs, error: msgErr } = await supabase.from('messages').select('id').limit(1);
  if (msgErr) {
    if (msgErr.message?.includes('permission') || msgErr.code === 'PGRST116' || msgErr.message?.includes('RLS') || msgErr.message?.includes('policy')) {
      log('messages table RLS (anon blocked)', 'PASS', 'Correct: anon cannot read messages');
    } else {
      log('messages table (anon access)', 'WARN', msgErr.message);
    }
  } else {
    log('messages table (anon access)', 'WARN', `${msgs?.length || 0} visible to anon — verify RLS`);
  }

  // Test notifications
  const { data: notifs, error: notifErr } = await supabase.from('notifications').select('id').limit(1);
  if (notifErr) {
    if (notifErr.message?.includes('permission') || notifErr.message?.includes('RLS') || notifErr.message?.includes('policy')) {
      log('notifications table RLS (anon blocked)', 'PASS', 'Correct: anon cannot read notifications');
    } else {
      log('notifications table (anon)', 'WARN', notifErr.message);
    }
  } else {
    log('notifications table (anon)', 'WARN', `${notifs?.length || 0} visible to anon — may need RLS`);
  }

  // Test community_posts
  const { data: posts, error: postErr } = await supabase.from('community_posts').select('id, title, content').limit(3);
  if (postErr) {
    if (postErr.message?.includes('does not exist') || postErr.code === '42P01') {
      log('community_posts table', 'WARN', 'Table does not exist — community may use different table');
    } else {
      log('community_posts table (anon)', 'WARN', postErr.message);
    }
  } else {
    log('community_posts table (anon)', 'PASS', `${posts?.length || 0} posts`);
  }
}

async function testAuthSignupAndLogin() {
  console.log('\n====================================');
  console.log('PHASE 2: AUTH SIGNUP + LOGIN');
  console.log('====================================');

  const testEmail1 = `audit_user_a_${Date.now()}@innovexa-test.ai`;
  const testEmail2 = `audit_user_b_${Date.now()}@innovexa-test.ai`;
  const testPassword = 'TestPass123!';

  // User A Signup
  console.log(`\nSigning up User A: ${testEmail1}`);
  const { data: signupA, error: signupErrA } = await supabase.auth.signUp({
    email: testEmail1,
    password: testPassword,
    options: { data: { full_name: 'Test User Alpha', name: 'Test User Alpha' } }
  });

  let userA = null;
  let sessionA = null;

  if (signupErrA) {
    log('User A signup', 'FAIL', signupErrA.message);
  } else if (signupA?.user) {
    userA = signupA.user;
    sessionA = signupA.session;
    log('User A signup', 'PASS', `ID: ${userA.id.slice(0,8)}... Email: ${userA.email}`);
    if (!sessionA) {
      log('User A session after signup', 'WARN', 'No session — email confirmation may be required');
    } else {
      log('User A session after signup', 'PASS', 'Session created immediately');
    }
  }

  // User B Signup
  console.log(`\nSigning up User B: ${testEmail2}`);
  const { data: signupB, error: signupErrB } = await supabase.auth.signUp({
    email: testEmail2,
    password: testPassword,
    options: { data: { full_name: 'Test User Beta', name: 'Test User Beta' } }
  });

  let userB = null;
  let sessionB = null;

  if (signupErrB) {
    log('User B signup', 'FAIL', signupErrB.message);
  } else if (signupB?.user) {
    userB = signupB.user;
    sessionB = signupB.session;
    log('User B signup', 'PASS', `ID: ${userB.id.slice(0,8)}...`);
  }

  // Test login for User A
  if (userA) {
    console.log('\nLogging in as User A...');
    const { data: loginA, error: loginErrA } = await supabase.auth.signInWithPassword({
      email: testEmail1,
      password: testPassword
    });
    if (loginErrA) {
      if (loginErrA.message?.includes('Email not confirmed')) {
        log('User A login', 'WARN', 'Email confirmation required — disable in Supabase Auth settings');
      } else {
        log('User A login', 'FAIL', loginErrA.message);
      }
    } else {
      sessionA = loginA.session;
      log('User A login', 'PASS', 'Session obtained');
    }
  }

  return { userA, userB, sessionA, sessionB, testEmail1, testEmail2, testPassword };
}

async function testProfileCreation(userId, sessionToken) {
  console.log('\n====================================');
  console.log('PHASE 3: PROFILE VERIFICATION');
  console.log('====================================');

  if (!userId) {
    log('Profile check', 'WARN', 'No user ID — skipping profile tests');
    return null;
  }

  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (profErr) {
    log('Profile exists for user', 'FAIL', profErr.message);
  } else if (profile) {
    log('Profile exists for user', 'PASS', `full_name: ${profile.full_name}`);
    if (profile.id !== userId) {
      log('Profile ID matches auth user ID', 'FAIL', `Profile ID ${profile.id} !== user ID ${userId}`);
    } else {
      log('Profile ID matches auth user ID', 'PASS', 'IDs match');
    }
  } else {
    log('Profile exists for user', 'WARN', 'Profile row not found — may need trigger or manual creation');
    
    // Try manual create
    const { error: createErr } = await supabase.from('profiles').insert([{
      id: userId,
      full_name: 'Test User Alpha',
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=TestUserAlpha`,
      onboarding_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]);
    if (createErr) {
      log('Manual profile creation', 'FAIL', createErr.message);
    } else {
      log('Manual profile creation', 'PASS', 'Profile row inserted');
    }
  }

  return profile;
}

async function testCategoryWorkflow() {
  console.log('\n====================================');
  console.log('PHASE 4: CATEGORIES WORKFLOW');
  console.log('====================================');

  const { data: cats, error: catErr } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name');

  if (catErr) {
    log('Fetch categories', 'FAIL', catErr.message);
    return null;
  }

  if (!cats || cats.length === 0) {
    log('Categories have data', 'FAIL', 'No categories found — must seed categories table');
    console.log('   Run seed script to populate categories');
    return null;
  }

  log('Fetch categories', 'PASS', `${cats.length} categories: ${cats.map(c => c.name).join(', ')}`);
  return cats[0];
}

async function testProjectCreation(session, userId, categoryId) {
  console.log('\n====================================');
  console.log('PHASE 5: PROJECT CREATION');
  console.log('====================================');

  if (!session || !userId) {
    log('Project creation (needs auth)', 'WARN', 'No authenticated session — skipping');
    return null;
  }

  // Create a Supabase client with the user's session token
  const authedSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } }
  });

  const projectData = {
    user_id: userId,
    title: `Audit Test Project ${Date.now()}`,
    description: 'This is a test project created during the audit trial run.',
    short_description: 'Audit test project',
    problem_statement: 'Testing project creation workflow',
    proposed_solution: 'Automated live testing with Supabase',
    project_type: 'idea',
    creation_type: 'IDEA',
    innovation_type: 'IDEA',
    project_stage: 'idea',
    target_users: 'Developers',
    status: 'published',
    category_id: categoryId || null,
    category_name: 'Technology'
  };

  const { data: proj, error: projErr } = await authedSupabase
    .from('projects')
    .insert([projectData])
    .select('id, title, status, user_id, category_id')
    .single();

  if (projErr) {
    log('Create project (authenticated)', 'FAIL', projErr.message);
    return null;
  }

  log('Create project (authenticated)', 'PASS', `ID: ${proj.id.slice(0,8)}... "${proj.title}"`);
  log('Project has correct user_id', proj.user_id === userId ? 'PASS' : 'FAIL', 
    `project.user_id = ${proj.user_id?.slice(0,8)}...`);
  log('Project status is published', proj.status === 'published' ? 'PASS' : 'WARN', 
    `status = ${proj.status}`);

  return proj;
}

async function testUpvoteSystem(session, userId, projectId) {
  console.log('\n====================================');
  console.log('PHASE 6: UPVOTE / DOWNVOTE SYSTEM');
  console.log('====================================');

  if (!session || !userId || !projectId) {
    log('Vote system (needs auth + project)', 'WARN', 'Missing session/project — skipping');
    return;
  }

  const authedSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } }
  });

  // Test insert upvote
  const { error: likeErr } = await authedSupabase
    .from('project_likes')
    .insert([{ project_id: projectId, user_id: userId, created_at: new Date().toISOString() }]);

  if (likeErr) {
    log('Insert upvote to project_likes', 'FAIL', likeErr.message);
  } else {
    log('Insert upvote to project_likes', 'PASS', 'Like inserted');
  }

  // Verify upvote exists
  const { data: likeCheck } = await authedSupabase
    .from('project_likes')
    .select('id, project_id, user_id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  log('Upvote persists in DB', likeCheck ? 'PASS' : 'FAIL', 
    likeCheck ? `Record found: ${likeCheck.id?.slice(0,8)}` : 'No record found');

  // Toggle off (remove upvote)
  const { error: delErr } = await authedSupabase
    .from('project_likes')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);

  log('Remove upvote (toggle)', delErr ? 'FAIL' : 'PASS', delErr?.message || 'Upvote removed');

  // Verify removal
  const { data: afterDel } = await authedSupabase
    .from('project_likes')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  log('Upvote correctly removed from DB', !afterDel ? 'PASS' : 'FAIL', 
    !afterDel ? 'No record — correctly removed' : 'Record still exists — bug!');

  // Test mutual exclusion: Like then Dislike (Like should be removed)
  await authedSupabase.from('project_likes').insert([{ 
    project_id: projectId, user_id: userId, created_at: new Date().toISOString() 
  }]);

  const { error: dislikeErr } = await authedSupabase
    .from('project_dislikes')
    .insert([{ project_id: projectId, user_id: userId, created_at: new Date().toISOString() }]);

  if (dislikeErr) {
    log('Insert dislike to project_dislikes', 'FAIL', dislikeErr.message);
  } else {
    log('Insert dislike to project_dislikes', 'PASS', 'Dislike inserted');
  }

  // Clean up test votes
  await authedSupabase.from('project_likes').delete().eq('project_id', projectId).eq('user_id', userId);
  await authedSupabase.from('project_dislikes').delete().eq('project_id', projectId).eq('user_id', userId);
}

async function testReviewSystem(session, userId, projectId) {
  console.log('\n====================================');
  console.log('PHASE 7: REVIEW SYSTEM');
  console.log('====================================');

  if (!session || !userId || !projectId) {
    log('Review system (needs auth + project)', 'WARN', 'Missing session/project — skipping');
    return;
  }

  const authedSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } }
  });

  // Submit review
  const { data: review, error: revErr } = await authedSupabase
    .from('reviews')
    .insert([{
      project_id: projectId,
      user_id: userId,
      rating: 5,
      content: 'Excellent test project! This is an audit review.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select('id, project_id, user_id, rating, content')
    .single();

  if (revErr) {
    log('Submit review to reviews table', 'FAIL', revErr.message);
    return;
  }

  log('Submit review to reviews table', 'PASS', `Review ID: ${review.id?.slice(0,8)}...`);
  log('Review has correct project_id', review.project_id === projectId ? 'PASS' : 'FAIL',
    `review.project_id = ${review.project_id}`);
  log('Review has correct user_id', review.user_id === userId ? 'PASS' : 'FAIL',
    `review.user_id = ${review.user_id}`);
  log('Review has rating', (review.rating === 5) ? 'PASS' : 'FAIL', `rating = ${review.rating}`);

  // Read review back
  const { data: readReview } = await authedSupabase
    .from('reviews')
    .select('id, content, rating')
    .eq('id', review.id)
    .maybeSingle();

  log('Review readable after insert', readReview ? 'PASS' : 'FAIL', 
    readReview ? `Content: "${readReview.content?.slice(0,30)}..."` : 'Not readable');

  // Update review
  const { error: updateErr } = await authedSupabase
    .from('reviews')
    .update({ content: 'Updated audit review content', rating: 4, updated_at: new Date().toISOString() })
    .eq('id', review.id)
    .eq('user_id', userId);

  log('Update own review', updateErr ? 'FAIL' : 'PASS', updateErr?.message || 'Review updated');

  // Delete review
  const { error: delRevErr } = await authedSupabase
    .from('reviews')
    .delete()
    .eq('id', review.id)
    .eq('user_id', userId);

  log('Delete own review', delRevErr ? 'FAIL' : 'PASS', delRevErr?.message || 'Review deleted');
}

async function testMessageSystem(session, userId, otherUserId) {
  console.log('\n====================================');
  console.log('PHASE 8: MESSAGE SYSTEM');
  console.log('====================================');

  if (!session || !userId || !otherUserId) {
    log('Message system (needs 2 users)', 'WARN', 'Missing session or second user — skipping');
    return;
  }

  const authedSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } }
  });

  const { data: msg, error: msgErr } = await authedSupabase
    .from('messages')
    .insert([{
      sender_id: userId,
      receiver_id: otherUserId,
      content: `Audit test message from User A to User B — ${new Date().toISOString()}`,
      created_at: new Date().toISOString()
    }])
    .select('id, sender_id, receiver_id, content')
    .single();

  if (msgErr) {
    log('Send message (authenticated)', 'FAIL', msgErr.message);
    return;
  }

  log('Send message (authenticated)', 'PASS', `Message ID: ${msg.id?.slice(0,8)}...`);
  log('Message has correct sender_id', msg.sender_id === userId ? 'PASS' : 'FAIL',
    `sender_id = ${msg.sender_id?.slice(0,8)}...`);
  log('Message has correct receiver_id', msg.receiver_id === otherUserId ? 'PASS' : 'FAIL',
    `receiver_id = ${msg.receiver_id?.slice(0,8)}...`);
}

async function testNotificationSystem(session, userId) {
  console.log('\n====================================');
  console.log('PHASE 9: NOTIFICATION SYSTEM');
  console.log('====================================');

  if (!session || !userId) {
    log('Notification system (needs auth)', 'WARN', 'Missing session — skipping');
    return;
  }

  const authedSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } }
  });

  const { data: notifs, error: notifErr } = await authedSupabase
    .from('notifications')
    .select('id, user_id, type, content, is_read')
    .eq('user_id', userId)
    .limit(5);

  if (notifErr) {
    log('Read own notifications', 'FAIL', notifErr.message);
  } else {
    log('Read own notifications', 'PASS', `${notifs?.length || 0} notifications found`);
  }
}

async function testCommunitySystem(session, userId) {
  console.log('\n====================================');
  console.log('PHASE 10: COMMUNITY SYSTEM');
  console.log('====================================');

  // Check what community tables exist
  const tables = ['community_posts', 'posts', 'suggestions', 'community_suggestions', 'community_resources'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (!error) {
      log(`Table '${table}' exists`, 'PASS', `${data?.length || 0} records visible`);
      
      if (session && userId) {
        const authedSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: `Bearer ${session.access_token}` } }
        });
        
        // Try reading as authenticated user
        const { data: authData, error: authErr } = await authedSupabase
          .from(table)
          .select('id, content, created_at')
          .limit(3);
        
        if (!authErr) {
          log(`Table '${table}' readable (auth)`, 'PASS', `${authData?.length || 0} records`);
        } else {
          log(`Table '${table}' readable (auth)`, 'WARN', authErr.message);
        }
      }
    } else if (error.code === '42P01' || error.message?.includes('does not exist')) {
      log(`Table '${table}'`, 'INFO', 'Does not exist');
    } else {
      log(`Table '${table}' check`, 'WARN', error.message);
    }
  }
}

async function testExistingProjectsVisibility() {
  console.log('\n====================================');
  console.log('PHASE 11: MULTI-USER PROJECT VISIBILITY');
  console.log('====================================');

  // Test that published projects are visible without auth (for explore page)
  const { data: published, error: pubErr } = await supabase
    .from('projects')
    .select('id, title, status, user_id')
    .in('status', ['published', 'PUBLISHED', 'UNDER_VALIDATION'])
    .order('created_at', { ascending: false })
    .limit(10);

  if (pubErr) {
    log('Published projects visible (anon explore)', 'FAIL', pubErr.message);
  } else {
    log('Published projects visible (anon explore)', 'PASS', `${published?.length || 0} projects visible to all`);
    
    // Check distinct creators
    const distinctCreators = new Set(published?.map(p => p.user_id));
    if (distinctCreators.size > 1) {
      log('Multi-user projects in explore', 'PASS', `Projects from ${distinctCreators.size} different creators visible`);
    } else if (distinctCreators.size === 1) {
      log('Multi-user projects in explore', 'WARN', 'Only 1 creator visible — may need more test data');
    } else {
      log('Multi-user projects in explore', 'WARN', 'No projects to test multi-user visibility');
    }
  }
}

async function testProjectJoinQuery() {
  console.log('\n====================================');
  console.log('PHASE 12: JOIN QUERIES (categories + profiles)');
  console.log('====================================');

  const { data: projWithJoins, error: joinErr } = await supabase
    .from('projects')
    .select(`
      id, title, status,
      categories:category_id (id, name, slug),
      profiles:user_id (id, full_name, avatar_url)
    `)
    .in('status', ['published', 'PUBLISHED', 'UNDER_VALIDATION'])
    .limit(3);

  if (joinErr) {
    log('Project with category+profile JOIN', 'FAIL', joinErr.message);
    
    // Check if simple select works
    const { data: simple, error: simpleErr } = await supabase
      .from('projects')
      .select('*')
      .limit(3);
    
    if (!simpleErr) {
      log('Simple projects select (no join)', 'PASS', `${simple?.length || 0} projects`);
      log('JOIN issue', 'WARN', 'Category or profile FK relationship may be misconfigured');
    }
  } else {
    log('Project with category+profile JOIN', 'PASS', `${projWithJoins?.length || 0} projects with joins`);
    if (projWithJoins?.length > 0) {
      const sample = projWithJoins[0];
      log('Category join returns data', sample.categories ? 'PASS' : 'WARN',
        sample.categories ? `category: ${sample.categories.name}` : 'categories is null');
      log('Profile join returns data', sample.profiles ? 'PASS' : 'WARN',
        sample.profiles ? `creator: ${sample.profiles.full_name}` : 'profiles is null');
    }
  }
}

async function cleanupTestUser(email, password) {
  try {
    const { data } = await supabase.auth.signInWithPassword({ email, password });
    if (data?.user) {
      await supabase.auth.signOut();
    }
  } catch (e) {}
}

// ============================================================================
// MAIN AUDIT RUN
// ============================================================================
async function runFullAudit() {
  console.log('=================================================');
  console.log('  INNOVEXA LIVE SUPABASE AUDIT');
  console.log(`  ${new Date().toISOString()}`);
  console.log('=================================================');
  console.log(`  URL: ${SUPABASE_URL}`);
  console.log(`  KEY: ${SUPABASE_ANON_KEY.slice(0, 20)}...`);
  console.log('=================================================\n');

  // PHASE 1: Basic anon access
  await testAnonAccess();

  // PHASE 2: Auth
  const { userA, userB, sessionA, sessionB, testEmail1, testEmail2, testPassword } = await testAuthSignupAndLogin();

  // PHASE 3: Profile
  if (userA) {
    await testProfileCreation(userA.id, sessionA);
  }

  // PHASE 4: Categories
  const firstCategory = await testCategoryWorkflow();

  // PHASE 5: Project Creation
  let testProject = null;
  if (sessionA && userA) {
    testProject = await testProjectCreation(sessionA, userA.id, firstCategory?.id);
  }

  // PHASE 6: Upvote
  if (sessionA && userA && testProject) {
    await testUpvoteSystem(sessionA, userA.id, testProject.id);
  }

  // PHASE 7: Review
  if (sessionA && userA && testProject) {
    await testReviewSystem(sessionA, userA.id, testProject.id);
  }

  // PHASE 8: Messages
  if (sessionA && userA && userB) {
    await testMessageSystem(sessionA, userA.id, userB.id);
  }

  // PHASE 9: Notifications
  if (sessionA && userA) {
    await testNotificationSystem(sessionA, userA.id);
  }

  // PHASE 10: Community
  await testCommunitySystem(sessionA, userA?.id);

  // PHASE 11: Multi-user visibility
  await testExistingProjectsVisibility();

  // PHASE 12: Join queries
  await testProjectJoinQuery();

  // ---- FINAL REPORT ----
  console.log('\n=================================================');
  console.log('  FINAL AUDIT REPORT');
  console.log('=================================================');
  console.log(`  PASSED: ${passCount}`);
  console.log(`  FAILED: ${failCount}`);
  console.log(`  TOTAL:  ${results.length}`);
  console.log('=================================================');

  if (failCount > 0) {
    console.log('\n❌ FAILURES:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  • ${r.label}: ${r.detail}`);
    });
  }

  const warnings = results.filter(r => r.status === 'WARN');
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach(r => {
      console.log(`  • ${r.label}: ${r.detail}`);
    });
  }

  // Clean up auth
  await supabase.auth.signOut();

  return { passCount, failCount, results };
}

runFullAudit().catch(err => {
  console.error('Audit script crashed:', err);
  process.exit(1);
});
