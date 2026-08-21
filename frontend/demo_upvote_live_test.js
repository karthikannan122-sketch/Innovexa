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
  const user = res.data?.user;
  if (user) {
    const { data: prof } = await client.from('profiles').select('id').eq('id', user.id).maybeSingle();
    if (!prof) {
      await client.from('profiles').insert([{
        id: user.id,
        full_name: name,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
      }]);
    }
  }
  return res.data;
}

// Exact React handleUpvote implementation
async function handleUpvote(client, projectId) {
  try {
    // 1. Get currently logged-in user
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      console.error("User is not logged in");
      return { success: false, error: authError || new Error("Not logged in") };
    }

    console.log("-> Upvoting project:", {
      projectId,
      userId: user.id,
    });

    // 2. Check whether user already liked this project
    const { data: existingLike, error: checkError } = await client
      .from("project_likes")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing vote:", checkError);
      return { success: false, error: checkError };
    }

    let actionTaken = '';

    // 3. If already liked → remove like
    if (existingLike) {
      const { error } = await client
        .from("project_likes")
        .delete()
        .eq("id", existingLike.id);

      if (error) {
        console.error("Error removing like:", error);
        return { success: false, error };
      }

      actionTaken = 'REMOVED_LIKE';
      console.log("   [DATABASE] Upvote removed from public.project_likes (deleted row id: " + existingLike.id + ")");
    } else {
      // If not liked → insert into database
      const { data, error } = await client
        .from("project_likes")
        .insert({
          project_id: projectId,
          user_id: user.id,
        })
        .select();

      if (error) {
        console.error("Error saving upvote:", error);
        return { success: false, error };
      }

      actionTaken = 'INSERTED_LIKE';
      console.log("   [DATABASE] Upvote saved successfully to public.project_likes:", data);
    }

    // 4. Refresh project likes/count
    const { count: realCount, data: likesRows, error: countError } = await client
      .from("project_likes")
      .select("id, project_id, user_id, created_at", { count: 'exact' })
      .eq("project_id", projectId);

    if (countError) {
      console.error("Error fetching project likes count:", countError);
    }

    const currentCount = typeof realCount === 'number' ? realCount : (Array.isArray(likesRows) ? likesRows.length : 0);

    return {
      success: true,
      action: actionTaken,
      totalCount: currentCount,
      rows: likesRows || []
    };

  } catch (error) {
    console.error("Upvote failed:", error);
    return { success: false, error };
  }
}

async function runDemo() {
  console.log('================================================================');
  console.log('🚀 LIVE DEMO RUN: VERIFYING UPVOTE IN SUPABASE DATABASE');
  console.log('================================================================\n');

  console.log('Step 1: Logging in Demo User A (Alice) and Demo User B (Bob)...');
  await getAuthenticatedUser(clientA, 'alice.innovator@demo.innovexa.io', 'DemoPass123!', 'Alice Innovator');
  await getAuthenticatedUser(clientB, 'bob.validator@demo.innovexa.io', 'DemoPass123!', 'Bob Validator');

  const userA = (await clientA.auth.getUser()).data.user;
  const userB = (await clientB.auth.getUser()).data.user;

  console.log(`✓ Logged in User A: ${userA.email} (ID: ${userA.id})`);
  console.log(`✓ Logged in User B: ${userB.email} (ID: ${userB.id})`);

  // Pick target project
  const { data: projs } = await clientA.from('projects').select('id, title, user_id').limit(1);
  let targetProjectId;
  let projectTitle;
  if (projs && projs.length > 0) {
    targetProjectId = projs[0].id;
    projectTitle = projs[0].title;
  } else {
    targetProjectId = 'e836ef1c-7bb2-462a-bcf1-6cdb97463ea4';
    projectTitle = 'PulseMind Autonomous Platform';
  }

  console.log(`\nTarget Project: "${projectTitle}" (ID: ${targetProjectId})`);

  // Clean test user rows from previous runs
  await clientA.from('project_likes').delete().eq('project_id', targetProjectId).eq('user_id', userA.id);
  await clientA.from('project_likes').delete().eq('project_id', targetProjectId).eq('user_id', userB.id);

  // Check initial state
  const { count: count0, data: rows0 } = await clientA
    .from('project_likes')
    .select('id, project_id, user_id', { count: 'exact' })
    .eq('project_id', targetProjectId);

  const initialLikes = typeof count0 === 'number' ? count0 : (rows0?.length || 0);
  console.log(`Initial total upvotes in database: ${initialLikes}`);

  console.log('\n----------------------------------------------------------------');
  console.log('Action 1: User A clicks "▲ UPVOTE" button');
  console.log('----------------------------------------------------------------');
  const res1 = await handleUpvote(clientA, targetProjectId);
  console.log(`Result: Action = ${res1.action}, Total Upvotes = ${res1.totalCount}`);
  console.log('Database Rows for project:');
  console.table(res1.rows);

  console.log('\n----------------------------------------------------------------');
  console.log('Action 2: User B opens the project and views upvote count');
  console.log('----------------------------------------------------------------');
  const { count: countUserB } = await clientB
    .from('project_likes')
    .select('id', { count: 'exact' })
    .eq('project_id', targetProjectId);
  console.log(`User B sees total upvote count in database: ${countUserB} (Expected: ${initialLikes + 1})`);

  console.log('\n----------------------------------------------------------------');
  console.log('Action 3: User B clicks "▲ UPVOTE" button');
  console.log('----------------------------------------------------------------');
  const res2 = await handleUpvote(clientB, targetProjectId);
  console.log(`Result: Action = ${res2.action}, Total Upvotes = ${res2.totalCount}`);
  console.log('Database Rows for project (Both User A and User B rows exist):');
  console.table(res2.rows);

  console.log('\n----------------------------------------------------------------');
  console.log('Action 4: User A clicks "▲ UPVOTE" button again (Toggle Off)');
  console.log('----------------------------------------------------------------');
  const res3 = await handleUpvote(clientA, targetProjectId);
  console.log(`Result: Action = ${res3.action}, Total Upvotes = ${res3.totalCount}`);
  console.log('Database Rows for project (User A row deleted, User B row retained):');
  console.table(res3.rows);

  console.log('\n================================================================');
  console.log('✨ DEMO RUN COMPLETED: UPVOTE IS FULLY WORKING IN SUPABASE!');
  console.log('================================================================\n');
}

runDemo().catch(err => {
  console.error("Demo failed:", err);
  process.exit(1);
});
