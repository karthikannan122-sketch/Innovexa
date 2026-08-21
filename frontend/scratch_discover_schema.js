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

async function discover() {
  const tables = ['profiles', 'categories', 'projects', 'reviews', 'project_likes', 'likes', 'upvotes', 'notifications', 'comments', 'user_interests'];
  
  for (const t of tables) {
    const { data, error } = await client.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table '${t}': Error:`, error.message, 'code:', error.code);
    } else {
      console.log(`Table '${t}': EXISTS. Rows: ${data?.length}. Columns:`, data?.[0] ? Object.keys(data[0]) : '(empty table - querying rpc or test insert)');
    }
  }

  // Check what columns are in reviews by testing inserts with single columns or querying
  const { data: authA } = await client.auth.signInWithPassword({
    email: 'creator.test@innovexa.io',
    password: 'TestPassword123!'
  });
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${authA.session.access_token}` } }
  });

  // Let's create a test project
  const { data: testProj } = await userClient.from('projects').insert([{
    user_id: authA.user.id,
    title: 'Discovery Project',
    description: 'Discovery Description',
    project_type: 'idea',
    status: 'published'
  }]).select();

  const projId = testProj?.[0]?.id;
  console.log('Created test project:', projId);

  // Test reviews table columns
  const possibleReviewCols = [
    'rating', 'feedback', 'comment', 'content', 'review', 'score', 'notes',
    'suggestion', 'pros', 'cons', 'created_at', 'updated_at', 'status',
    'relevance', 'problem_relevance', 'would_use', 'relevance_answer'
  ];

  for (const col of possibleReviewCols) {
    const testObj = { project_id: projId, user_id: authA.user.id };
    testObj[col] = (col === 'rating' || col === 'score') ? 5 : 'test value';
    const res = await userClient.from('reviews').insert([testObj]).select();
    if (res.error) {
      if (res.error.message.includes('Could not find')) {
        // column doesn't exist
      } else {
        console.log(`Reviews column '${col}': possible error ->`, res.error.message);
      }
    } else {
      console.log(`Reviews column '${col}' WORKED! Returned row:`, res.data[0]);
      await userClient.from('reviews').delete().eq('id', res.data[0].id);
    }
  }

  // Try reviews with reviewer_id vs user_id
  for (const userCol of ['user_id', 'reviewer_id']) {
    for (const col of ['feedback', 'comment', 'content', 'review', 'rating']) {
      const testObj = { project_id: projId };
      testObj[userCol] = authA.user.id;
      testObj[col] = col === 'rating' ? 5 : 'test text';
      const res = await userClient.from('reviews').insert([testObj]).select();
      if (res.error) {
        if (!res.error.message.includes('Could not find')) {
          console.log(`Reviews (${userCol}, ${col}):`, res.error.message);
        }
      } else {
        console.log(`Reviews (${userCol}, ${col}) WORKED! Columns:`, Object.keys(res.data[0]));
        await userClient.from('reviews').delete().eq('id', res.data[0].id);
      }
    }
  }

  // Test notifications columns
  const possibleNotifCols = ['user_id', 'title', 'message', 'content', 'type', 'read', 'is_read', 'link', 'data', 'created_at'];
  for (const col of ['message', 'content', 'title', 'type', 'read', 'is_read']) {
    const testObj = { user_id: authA.user.id, [col]: (col.includes('read') ? false : 'test') };
    const res = await userClient.from('notifications').insert([testObj]).select();
    if (res.error) {
      if (!res.error.message.includes('Could not find')) {
        console.log(`Notifications (${col}):`, res.error.message);
      }
    } else {
      console.log(`Notifications (${col}) WORKED! Columns:`, Object.keys(res.data[0]));
      await userClient.from('notifications').delete().eq('id', res.data[0].id);
    }
  }

  // Test project_likes columns & RLS
  const { data: likeCols, error: likeError } = await userClient.from('project_likes').insert([{
    project_id: projId,
    user_id: authA.user.id
  }]).select();
  console.log('Project likes insert with authA:', likeCols, 'Error:', likeError);

  if (projId) {
    await userClient.from('projects').delete().eq('id', projId);
  }
}

discover().catch(console.error);
