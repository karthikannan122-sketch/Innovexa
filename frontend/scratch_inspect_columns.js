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

async function inspectColumns() {
  const { data: authA } = await client.auth.signInWithPassword({
    email: 'creator.test@innovexa.io',
    password: 'TestPassword123!'
  });

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${authA.session.access_token}` } }
  });

  // Test inserting a full project row to see all accepted column names
  console.log('Testing project columns...');
  const testProject = {
    user_id: authA.user.id,
    title: 'Test Project Title',
    description: 'Test project description',
    project_type: 'idea',
    status: 'published',
    launch_url: 'https://example.com'
  };

  const { data: projInsert, error: projErr } = await userClient.from('projects').insert([testProject]).select();
  if (projErr) {
    console.error('Project insert error:', projErr);
  } else {
    console.log('Projects table columns returned on insert:');
    console.log(Object.keys(projInsert[0]));
    console.log('Sample project row:', projInsert[0]);
    await userClient.from('projects').delete().eq('id', projInsert[0].id);
  }

  // Test categories table
  console.log('\nTesting categories table...');
  const { data: catList, error: catListErr } = await client.from('categories').select('*');
  console.log('Categories list:', catList, 'Error:', catListErr);

  // Test profile columns
  console.log('\nTesting profile columns...');
  const { data: profData, error: profErr } = await userClient.from('profiles').select('*').eq('id', authA.user.id);
  console.log('Profile select result:', profData, 'Error:', profErr);

  // Test review columns
  console.log('\nTesting review columns...');
  const { data: testProj2 } = await userClient.from('projects').insert([{
    user_id: authA.user.id,
    title: 'Project for Review Test',
    description: 'Desc',
    project_type: 'idea',
    status: 'published'
  }]).select();

  if (testProj2 && testProj2[0]) {
    const projId = testProj2[0].id;
    // Sign in user B
    const { data: authB } = await client.auth.signInWithPassword({
      email: 'validator.test@innovexa.io',
      password: 'TestPassword123!'
    });
    const userBClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${authB.session.access_token}` } }
    });

    const testReview = {
      project_id: projId,
      reviewer_id: authB.user.id,
      rating: 5,
      overall_feedback: 'Great project',
      suggestion: 'Add more features',
      relevance_answer: 'YES',
      problem_relevance: 'YES',
      would_use: 'YES'
    };

    const { data: revInsert, error: revErr } = await userBClient.from('reviews').insert([testReview]).select();
    if (revErr) {
      console.error('Review insert error:', revErr);
      // Try with subset of columns
      const testReview2 = {
        project_id: projId,
        reviewer_id: authB.user.id,
        rating: 5,
        overall_feedback: 'Great project',
        suggestion: 'Add more features'
      };
      const { data: revInsert2, error: revErr2 } = await userBClient.from('reviews').insert([testReview2]).select();
      console.log('Review insert 2 result:', revInsert2, 'Error:', revErr2);
      if (revInsert2) {
        console.log('Review columns in DB:', Object.keys(revInsert2[0]));
      }
    } else {
      console.log('Review columns in DB:', Object.keys(revInsert[0]));
      console.log('Sample review row:', revInsert[0]);
    }

    // Test project likes
    console.log('\nTesting project_likes columns...');
    const { data: likeInsert, error: likeErr } = await userBClient.from('project_likes').insert([{
      project_id: projId,
      user_id: authB.user.id
    }]).select();
    console.log('Project like insert:', likeInsert, 'Error:', likeErr);

    // Test notifications
    console.log('\nTesting notifications columns...');
    const { data: notifInsert, error: notifErr } = await userBClient.from('notifications').insert([{
      user_id: authA.user.id,
      title: 'Test Notification',
      message: 'Someone reviewed your project',
      type: 'review',
      project_id: projId,
      is_read: false
    }]).select();
    console.log('Notification insert:', notifInsert, 'Error:', notifErr);
    if (notifInsert) {
      console.log('Notification columns in DB:', Object.keys(notifInsert[0]));
    }

    // Clean up
    await userClient.from('projects').delete().eq('id', projId);
  }
}

inspectColumns().catch(console.error);
