import { supabase } from './src/lib/supabase.js';

async function auditSupabaseAndModules() {
  console.log('================================================================');
  console.log('🔍 PHASE 1 & 2: COMPLETE SUPABASE & DATABASE SCHEMA AUDIT');
  console.log('================================================================\n');

  // Check Supabase Config
  const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env?.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env?.VITE_SUPABASE_ANON_KEY;
  console.log('Supabase Configuration:');
  console.log('  - Supabase URL Present:', Boolean(supabaseUrl));
  console.log('  - Supabase Anon Key Present:', Boolean(supabaseKey));

  // Tables to inspect
  const tables = [
    { name: 'categories', requiredCols: ['id', 'name', 'slug'] },
    { name: 'profiles', requiredCols: ['id', 'full_name', 'avatar_url'] },
    { name: 'projects', requiredCols: ['id', 'user_id', 'category_id', 'title', 'description', 'project_type', 'launch_url', 'status'] },
    { name: 'reviews', requiredCols: ['id', 'project_id', 'user_id', 'rating', 'content'] },
    { name: 'project_likes', requiredCols: ['id', 'project_id', 'user_id'] },
    { name: 'messages', requiredCols: ['id', 'sender_id', 'receiver_id', 'content', 'message_type'] },
    { name: 'notifications', requiredCols: ['id', 'user_id', 'type', 'title', 'message'] },
    { name: 'community_posts', requiredCols: ['id', 'user_id', 'content', 'post_type'] }
  ];

  console.log('\n--- Auditing Supabase Tables ---');
  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t.name).select('*').limit(1);
      if (error) {
        console.log(`❌ Table [${t.name}]: Error - ${error.message} (Code: ${error.code})`);
      } else {
        console.log(`✅ Table [${t.name}]: Accessible. Rows exist: ${data?.length > 0 ? 'Yes' : '0 rows'}`);
        if (data && data[0]) {
          const presentCols = Object.keys(data[0]);
          const missing = t.requiredCols.filter(c => !presentCols.includes(c));
          if (missing.length > 0) {
            console.log(`   ⚠️ Missing expected columns: ${missing.join(', ')}`);
          } else {
            console.log(`   ✓ All required columns present: ${t.requiredCols.join(', ')}`);
          }
        }
      }
    } catch (err) {
      console.log(`❌ Table [${t.name}]: Exception - ${err.message}`);
    }
  }

  // Categories check
  console.log('\n--- Checking Categories Table Rows ---');
  const { data: categories, error: catErr } = await supabase.from('categories').select('*');
  if (catErr) {
    console.error('Error fetching categories:', catErr);
  } else {
    console.log(`✅ Retrieved ${categories.length} categories from public.categories:`);
    categories.slice(0, 5).forEach(c => console.log(`   - ${c.name} (${c.id}) [slug: ${c.slug}]`));
  }

  console.log('\n================================================================');
  console.log('✅ SCHEMA & CONNECTION AUDIT COMPLETED');
  console.log('================================================================\n');
}

auditSupabaseAndModules().catch(console.error);
