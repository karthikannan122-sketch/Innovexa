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

async function diagnose() {
  console.log('Testing Supabase Connection & Schema...');
  
  // 1. Check Categories
  const { data: catData, error: catErr } = await client.from('categories').select('*');
  console.log('Categories:', catData?.length, 'items. Error:', catErr);
  if (catData && catData.length > 0) {
    console.log('Sample category:', catData[0]);
  }

  // 2. Check Profiles
  const { data: profData, error: profErr } = await client.from('profiles').select('*').limit(3);
  console.log('Profiles:', profData?.length, 'items. Error:', profErr);
  if (profData && profData.length > 0) {
    console.log('Sample profile columns:', Object.keys(profData[0]));
    console.log('Sample profile:', profData[0]);
  }

  // 3. Check Projects
  const { data: projData, error: projErr } = await client.from('projects').select('*').limit(3);
  console.log('Projects:', projData?.length, 'items. Error:', projErr);
  if (projData && projData.length > 0) {
    console.log('Sample project columns:', Object.keys(projData[0]));
    console.log('Sample project:', projData[0]);
  }

  // 4. Test Project Types insertion to find allowed check constraint
  // We can try signing in with test user and inserting test project with different types
  const { data: authA } = await client.auth.signInWithPassword({
    email: 'creator.test@innovexa.io',
    password: 'TestPassword123!'
  });

  if (authA?.session) {
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${authA.session.access_token}` } }
    });

    const testTypes = ['idea', 'product', 'startup', 'IDEA', 'PRODUCT', 'STARTUP', 'Idea', 'Product', 'Startup'];
    for (const t of testTypes) {
      const testProj = {
        user_id: authA.user.id,
        title: `Test Type ${t}`,
        description: 'Test Description',
        project_type: t,
        status: 'draft',
        category_id: catData?.[0]?.id || null
      };
      const res = await userClient.from('projects').insert([testProj]).select();
      if (res.error) {
        console.log(`project_type '${t}' failed:`, res.error.message);
      } else {
        console.log(`project_type '${t}' SUCCEEDED! Project ID:`, res.data[0].id);
        // Clean up
        await userClient.from('projects').delete().eq('id', res.data[0].id);
      }
    }

    // Also test statuses:
    const testStatuses = ['draft', 'published', 'DRAFT', 'PUBLISHED', 'under_validation', 'UNDER_VALIDATION'];
    for (const s of testStatuses) {
      const testProj = {
        user_id: authA.user.id,
        title: `Test Status ${s}`,
        description: 'Test Description',
        project_type: 'idea',
        status: s,
        category_id: catData?.[0]?.id || null
      };
      const res = await userClient.from('projects').insert([testProj]).select();
      if (res.error) {
        console.log(`status '${s}' failed:`, res.error.message);
      } else {
        console.log(`status '${s}' SUCCEEDED!`);
        await userClient.from('projects').delete().eq('id', res.data[0].id);
      }
    }
  }

  // 5. Check Reviews
  const { data: revData, error: revErr } = await client.from('reviews').select('*').limit(3);
  console.log('Reviews:', revData?.length, 'items. Error:', revErr);
  if (revData && revData.length > 0) {
    console.log('Sample review columns:', Object.keys(revData[0]));
    console.log('Sample review:', revData[0]);
  }

  // 6. Check Project Likes
  const { data: likeData, error: likeErr } = await client.from('project_likes').select('*').limit(3);
  console.log('Project Likes:', likeData?.length, 'items. Error:', likeErr);

  // 7. Check Notifications
  const { data: notifData, error: notifErr } = await client.from('notifications').select('*').limit(3);
  console.log('Notifications:', notifData?.length, 'items. Error:', notifErr);
  if (notifData && notifData.length > 0) {
    console.log('Sample notif columns:', Object.keys(notifData[0]));
  }
}

diagnose().catch(console.error);
