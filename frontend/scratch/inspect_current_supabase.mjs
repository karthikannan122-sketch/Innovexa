import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env', 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';

console.log('Target Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectCurrentDatabase() {
  const tables = [
    'profiles',
    'user_private_data',
    'categories',
    'projects',
    'project_votes',
    'project_likes',
    'project_follows',
    'project_suggestions',
    'reviews',
    'review_votes',
    'review_suggestions',
    'community_posts',
    'community_comments',
    'community_votes',
    'messages',
    'notifications',
    'user_interests'
  ];

  console.log('\n--- 1. TABLE EXISTENCE & ROW COUNTS ---');
  for (const t of tables) {
    const { data, count, error } = await supabase.from(t).select('*', { count: 'exact' }).limit(1);
    if (error) {
      console.log(`❌ Table [${t}]: ${error.message} (code: ${error.code})`);
    } else {
      console.log(`✅ Table [${t}]: EXISTS (count: ${count !== null ? count : 'N/A'})`);
      if (data && data.length > 0) {
        console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
      }
    }
  }

  // Check columns for notifications specifically
  console.log('\n--- 2. NOTIFICATIONS COLUMNS TEST ---');
  const notifCols = ['id', 'user_id', 'actor_id', 'type', 'title', 'message', 'project_id', 'related_project_id', 'related_message_id', 'link', 'is_read', 'created_at', 'updated_at'];
  for (const c of notifCols) {
    const { error } = await supabase.from('notifications').select(c).limit(1);
    if (error) {
      console.log(`❌ notifications.${c}: ${error.message}`);
    } else {
      console.log(`✅ notifications.${c}: EXISTS`);
    }
  }

  // Check columns for messages specifically
  console.log('\n--- 3. MESSAGES COLUMNS TEST ---');
  const msgCols = ['id', 'sender_id', 'receiver_id', 'content', 'message_type', 'related_project_id', 'is_read', 'created_at', 'updated_at'];
  for (const c of msgCols) {
    const { error } = await supabase.from('messages').select(c).limit(1);
    if (error) {
      console.log(`❌ messages.${c}: ${error.message}`);
    } else {
      console.log(`✅ messages.${c}: EXISTS`);
    }
  }

  // Check columns for reviews
  console.log('\n--- 4. REVIEWS COLUMNS TEST ---');
  const revCols = ['id', 'project_id', 'user_id', 'rating', 'content', 'title', 'is_public', 'created_at', 'updated_at'];
  for (const c of revCols) {
    const { error } = await supabase.from('reviews').select(c).limit(1);
    if (error) {
      console.log(`❌ reviews.${c}: ${error.message}`);
    } else {
      console.log(`✅ reviews.${c}: EXISTS`);
    }
  }

  // Check columns for project_votes vs project_likes
  console.log('\n--- 5. VOTES / LIKES TEST ---');
  const voteCols = ['id', 'project_id', 'user_id', 'vote_type', 'created_at'];
  for (const c of voteCols) {
    const { error } = await supabase.from('project_votes').select(c).limit(1);
    if (error) {
      console.log(`❌ project_votes.${c}: ${error.message}`);
    } else {
      console.log(`✅ project_votes.${c}: EXISTS`);
    }
  }
}

inspectCurrentDatabase().catch(console.error);
