/**
 * INNOVEXA — Post-Repair Live Verification Script
 * Verifies all 8 repair phases against live Supabase.
 * 
 * Usage:
 *   node verify_all_phases_live.mjs
 *
 * Requirements:
 *   - Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
 *   - Two test user accounts with known credentials (edit TEST_USER_A / TEST_USER_B below)
 *   - Run AFTER applying 20260824_innovexa_audit_repair.sql migration
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================
// CONFIG — Edit these before running
// ============================================================
const SUPABASE_URL     = process.env.VITE_SUPABASE_URL     || '';
const SUPABASE_ANON    = process.env.VITE_SUPABASE_ANON_KEY || '';

// Two test users — create them manually in your Supabase Auth dashboard first
const TEST_USER_A = { email: 'test_innovator_a@innovexa.test', password: 'TestPass123!' };
const TEST_USER_B = { email: 'test_reviewer_b@innovexa.test', password: 'TestPass123!' };

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error('\n❌  Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars.');
  console.error('    Create a .env file in the frontend/ directory with these values.');
  process.exit(1);
}

// ============================================================
// HELPERS
// ============================================================
const supabase  = createClient(SUPABASE_URL, SUPABASE_ANON);
const supabaseA = createClient(SUPABASE_URL, SUPABASE_ANON);
const supabaseB = createClient(SUPABASE_URL, SUPABASE_ANON);

let passed = 0;
let failed = 0;
const failures = [];

function ok(label) {
  console.log(`  ✅  ${label}`);
  passed++;
}

function fail(label, detail = '') {
  console.error(`  ❌  ${label}${detail ? ` — ${detail}` : ''}`);
  failed++;
  failures.push({ label, detail });
}

async function signIn(client, creds) {
  const { data, error } = await client.auth.signInWithPassword(creds);
  if (error || !data.session) throw new Error(`Sign-in failed for ${creds.email}: ${error?.message}`);
  return data.user;
}

// ============================================================
// PHASE 1 — Schema Column Verification
// ============================================================
async function phase1_schema() {
  console.log('\n📋  Phase 1 — Schema Column Verification');

  // profiles
  const { data: profileCols } = await supabase
    .from('profiles').select('username, location, website, github_url, linkedin_url, profile_visibility, reputation_points').limit(1);
  const expectedProfileCols = ['username', 'location', 'website', 'github_url', 'linkedin_url', 'profile_visibility', 'reputation_points'];
  if (profileCols !== null) ok('profiles has required columns (username, location, website, github_url, linkedin_url, profile_visibility, reputation_points)');
  else fail('profiles missing required columns', 'Apply migration FIX 1');

  // notifications.link
  const { data: notifCols, error: notifErr } = await supabase
    .from('notifications').select('link').limit(1);
  if (!notifErr) ok('notifications.link column exists');
  else fail('notifications.link column missing', notifErr.message);

  // reviews.overall_feedback + reviewer_id
  const { data: revCols, error: revErr } = await supabase
    .from('reviews').select('reviewer_id, overall_feedback').limit(1);
  if (!revErr) ok('reviews has reviewer_id and overall_feedback columns');
  else fail('reviews column issue', revErr.message);
}

// ============================================================
// PHASE 2 — User A: Auth Signup & Profile Creation
// ============================================================
async function phase2_auth() {
  console.log('\n🔐  Phase 2 — Auth Signup & Profile Creation');

  let userA;
  try {
    // Try sign in first (user may already exist)
    userA = await signIn(supabaseA, TEST_USER_A).catch(async () => {
      // Sign up if not found
      const { data, error } = await supabaseA.auth.signUp({
        email: TEST_USER_A.email,
        password: TEST_USER_A.password,
        options: { data: { full_name: 'Test Innovator A', role: ['innovator'] } }
      });
      if (error) throw error;
      // For email-unconfirmed environments, sign in directly
      return await signIn(supabaseA, TEST_USER_A);
    });
    ok(`User A authenticated: ${userA.email}`);
  } catch (e) {
    fail('User A auth failed', e.message);
    return null;
  }

  // Verify profile was created
  const { data: profile, error: profileErr } = await supabaseA
    .from('profiles')
    .select('id, full_name, role, reputation_points, profile_visibility')
    .eq('id', userA.id)
    .maybeSingle();

  if (!profileErr && profile) {
    ok(`User A profile exists: ${profile.full_name}`);
    if (profile.reputation_points !== null && profile.reputation_points !== undefined)
      ok(`reputation_points populated: ${profile.reputation_points}`);
    else
      fail('reputation_points is null on new profile');
  } else {
    fail('User A profile not found', profileErr?.message);
  }

  return userA;
}

// ============================================================
// PHASE 3 — User A: Project Creation
// ============================================================
async function phase3_project(userA) {
  console.log('\n🚀  Phase 3 — Project Creation (User A)');
  if (!userA) { fail('Skipped — no User A'); return null; }

  // Resolve a real category UUID
  const { data: cats } = await supabaseA.from('categories').select('id, name').limit(1);
  const catId = cats?.[0]?.id;

  const projectPayload = {
    user_id: userA.id,
    category_id: catId || null,
    category_name: cats?.[0]?.name || 'Technology',
    title: `Test Project ${Date.now()}`,
    short_description: 'Automated verification project',
    problem_statement: 'Test problem statement for verification script',
    proposed_solution: 'Automated solution description',
    status: 'UNDER_VALIDATION',
    project_type: 'IDEA'
  };

  const { data: project, error } = await supabaseA
    .from('projects')
    .insert([projectPayload])
    .select()
    .single();

  if (!error && project?.id) {
    ok(`Project created: ${project.id} — "${project.title}"`);
    return project;
  } else {
    fail('Project creation failed', error?.message);
    return null;
  }
}

// ============================================================
// PHASE 4 — User B: Review Submission (reviewer_id fix)
// ============================================================
async function phase4_review(project) {
  console.log('\n📝  Phase 4 — Review Submission (User B → reviewer_id fix)');
  if (!project) { fail('Skipped — no project'); return; }

  let userB;
  try {
    userB = await signIn(supabaseB, TEST_USER_B).catch(async () => {
      const { data, error } = await supabaseB.auth.signUp({
        email: TEST_USER_B.email,
        password: TEST_USER_B.password,
        options: { data: { full_name: 'Test Reviewer B', role: ['reviewer'] } }
      });
      if (error) throw error;
      return await signIn(supabaseB, TEST_USER_B);
    });
    ok(`User B authenticated: ${userB.email}`);
  } catch (e) {
    fail('User B auth failed', e.message);
    return;
  }

  const reviewPayload = {
    project_id: project.id,
    reviewer_id: userB.id,       // FIXED column name
    rating: 4,
    overall_feedback: 'Great project! The solution addresses a real problem.',
    suggestion: 'Consider adding more details',
    content: 'Great project! The solution addresses a real problem.',
    is_public: true
  };

  const { data: review, error } = await supabaseB
    .from('reviews')
    .insert([reviewPayload])
    .select()
    .single();

  if (!error && review?.id) {
    ok(`Review created with reviewer_id: ${review.id}`);
    // Verify unique constraint works (duplicate attempt should fail)
    const { error: dupErr } = await supabaseB.from('reviews').insert([reviewPayload]).select().single();
    if (dupErr) ok('Unique constraint (project_id, reviewer_id) correctly blocked duplicate');
    else fail('Duplicate review was not blocked by unique constraint');
  } else {
    fail('Review creation failed', error?.message);
  }
}

// ============================================================
// PHASE 5 — Notifications: Cross-user INSERT (RLS fix)
// ============================================================
async function phase5_notifications(userA, userB) {
  console.log('\n🔔  Phase 5 — Notifications Cross-User INSERT (RLS fix)');
  if (!userA || !userB) { fail('Skipped — missing users'); return; }

  // User B creates notification for User A (cross-user — tests the fixed RLS)
  const notifPayload = {
    user_id: userA.id,       // recipient = User A
    actor_id: userB.id,      // actor = User B
    type: 'new_review',
    title: 'Verification: New Review Received',
    message: 'Your project received a test review',
    link: '/detail/test',    // tests new link column
    is_read: false
  };

  const { data: notif, error } = await supabaseB
    .from('notifications')
    .insert([notifPayload])
    .select()
    .single();

  if (!error && notif?.id) {
    ok(`Cross-user notification created: ${notif.id}`);
    ok('Notifications RLS allows authenticated cross-user INSERT');
    // Clean up
    await supabaseA.from('notifications').delete().eq('id', notif.id);
  } else {
    fail('Cross-user notification INSERT failed', error?.message);
    fail('Fix: Run 20260824_innovexa_audit_repair.sql migration (FIX 4)');
  }
}

// ============================================================
// PHASE 6 — Community Post: UPPERCASE post_type constraint
// ============================================================
async function phase6_community(userA) {
  console.log('\n💬  Phase 6 — Community Post UPPERCASE post_type');
  if (!userA) { fail('Skipped — no User A'); return; }

  const { data: cats } = await supabaseA.from('categories').select('id').limit(1);

  // Test UPPERCASE (should work)
  const { data: post, error } = await supabaseA
    .from('community_posts')
    .insert([{
      user_id: userA.id,
      category_id: cats?.[0]?.id || null,
      title: 'Verification Test Post (UPPERCASE type)',
      content: 'This tests that DISCUSSION post_type is valid',
      post_type: 'DISCUSSION'
    }])
    .select()
    .single();

  if (!error && post?.id) {
    ok(`Community post with UPPERCASE type created: ${post.id}`);
    // Test lowercase (should also work after migration FIX 5)
    const { data: post2, error: err2 } = await supabaseA
      .from('community_posts')
      .insert([{
        user_id: userA.id,
        category_id: cats?.[0]?.id || null,
        title: 'Verification Test Post (lowercase type)',
        content: 'This tests that lowercase discussion post_type is valid',
        post_type: 'discussion'
      }])
      .select()
      .single();
    if (!err2 && post2?.id) ok('Lowercase post_type also accepted (migration FIX 5 applied)');
    else fail('Lowercase post_type rejected — migration FIX 5 may not be applied yet', err2?.message);
    // Clean up
    await supabaseA.from('community_posts').delete().in('id', [post.id, post2?.id].filter(Boolean));
  } else {
    fail('Community post creation failed', error?.message);
  }
}

// ============================================================
// PHASE 7 — Profile Update: role as array
// ============================================================
async function phase7_profile_update(userA) {
  console.log('\n👤  Phase 7 — Profile Update (role as TEXT[], all columns)');
  if (!userA) { fail('Skipped — no User A'); return; }

  const { error } = await supabaseA
    .from('profiles')
    .update({
      headline: 'Test Innovator — Verification',
      bio: 'Automated test bio',
      organization: 'Test Corp',
      location: 'Test City',
      website: 'https://example.com',
      github_url: 'https://github.com/test',
      linkedin_url: 'https://linkedin.com/in/test',
      role: ['innovator'],
      profile_visibility: 'public',
      onboarding_completed: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', userA.id);

  if (!error) ok('Profile update with all new columns succeeded');
  else fail('Profile update failed', error.message);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  INNOVEXA — Post-Repair Verification Suite  ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`\nSupabase URL: ${SUPABASE_URL}`);

  await phase1_schema();
  const userA = await phase2_auth();
  const project = await phase3_project(userA);
  await phase4_review(project);

  // Re-sign in User B for notification phase
  let userB = null;
  try {
    const { data } = await supabaseB.auth.signInWithPassword(TEST_USER_B);
    userB = data.user;
  } catch {}

  await phase5_notifications(userA, userB);
  await phase6_community(userA);
  await phase7_profile_update(userA);

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n══════════════════════════════════════════════');
  console.log(`\n✅  Passed: ${passed}`);
  console.log(`❌  Failed: ${failed}`);

  if (failures.length > 0) {
    console.log('\nFailed checks:');
    failures.forEach(f => console.log(`  • ${f.label}${f.detail ? ` (${f.detail})` : ''}`));
    console.log('\nRun supabase/migrations/20260824_innovexa_audit_repair.sql and retry.\n');
  } else {
    console.log('\n🎉  All checks passed! INNOVEXA is fully repaired.\n');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('\n💥 Verification script crashed:', e.message);
  process.exit(1);
});
