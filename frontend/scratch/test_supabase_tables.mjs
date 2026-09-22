import { supabase } from '../src/lib/supabase.js';

console.log('Testing Supabase Connection and Table Verification...');

const tables = [
  'profiles',
  'categories',
  'projects',
  'reviews',
  'review_assignments',
  'project_categories',
  'comments',
  'notifications',
  'upvotes',
  'messages',
  'user_private_data',
  'external_innovations',
  'community_posts',
  'community_comments',
  'community_resources',
  'resource_bookmarks',
  'votes',
  'related_feedback',
  'user_roles'
];

async function checkAll() {
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`  ❌ [${table.padEnd(22)}] Error: ${error.message} (code: ${error.code})`);
      } else {
        console.log(`  ✅ [${table.padEnd(22)}] Accessible (Row count: ${count ?? 0})`);
      }
    } catch (e) {
      console.log(`  ⚠️ [${table.padEnd(22)}] Exception: ${e.message}`);
    }
  }
}

checkAll();
