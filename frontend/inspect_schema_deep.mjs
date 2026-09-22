/**
 * Deep schema discovery — check actual columns in projects, messages, notifications tables
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jeafkfarfkojazznsafj.supabase.co',
  'sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf'
);

async function inspectSchema() {
  console.log('=== SCHEMA INSPECTION ===\n');

  // Get projects columns via insert of empty object (will show allowed columns in error)
  // Instead use a dummy select to get column names
  const tables = ['projects', 'messages', 'notifications', 'reviews', 'community_posts', 'profiles'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      const cols = data && data.length > 0 ? Object.keys(data[0]) : [];
      if (cols.length > 0) {
        console.log(`✅ ${table} columns: ${cols.join(', ')}`);
      } else {
        // Table exists but no rows - try to get column names via OpenAPI schema approach
        console.log(`ℹ️  ${table}: exists but no rows (trying to get schema...)`);
        
        // Try inserting invalid data to get column list from error
        const { error: insertErr } = await supabase.from(table).insert([{ _fake_col: true }]).select();
        if (insertErr) {
          console.log(`   Schema hint from error: ${insertErr.message}`);
        }
      }
    }
  }

  console.log('\n=== CHECKING projects SPECIFIC COLUMNS ===');
  // Try a select of all known potential columns
  const projCols = ['id', 'user_id', 'title', 'description', 'short_description', 'category_name', 
    'category_id', 'problem_statement', 'proposed_solution', 'project_type', 'creation_type', 
    'innovation_type', 'project_stage', 'target_users', 'launch_url', 'status', 'features', 
    'tags', 'images', 'cover_image', 'upvotes_count', 'downvotes_count', 'valid_reviews_count',
    'created_at', 'updated_at'];
  
  for (const col of projCols) {
    const { data, error } = await supabase.from('projects').select(col).limit(1);
    if (error) {
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.log(`❌ projects.${col}: DOES NOT EXIST`);
      } else {
        console.log(`⚠️  projects.${col}: ${error.message}`);
      }
    } else {
      console.log(`✅ projects.${col}: EXISTS`);
    }
  }

  console.log('\n=== CHECKING messages SPECIFIC COLUMNS ===');
  const msgCols = ['id', 'sender_id', 'receiver_id', 'content', 'created_at', 'updated_at', 
    'read', 'is_read', 'thread_id', 'conversation_id'];
  
  for (const col of msgCols) {
    const { data, error } = await supabase.from('messages').select(col).limit(1);
    if (error) {
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.log(`❌ messages.${col}: DOES NOT EXIST`);
      } else {
        console.log(`⚠️  messages.${col}: ${error.message}`);
      }
    } else {
      console.log(`✅ messages.${col}: EXISTS`);
    }
  }

  console.log('\n=== CHECKING notifications SPECIFIC COLUMNS ===');
  const notifCols = ['id', 'user_id', 'content', 'message', 'title', 'body', 'type', 
    'is_read', 'read', 'created_at', 'data', 'link', 'actor_id'];
  
  for (const col of notifCols) {
    const { data, error } = await supabase.from('notifications').select(col).limit(1);
    if (error) {
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.log(`❌ notifications.${col}: DOES NOT EXIST`);
      } else {
        console.log(`⚠️  notifications.${col}: ${error.message}`);
      }
    } else {
      console.log(`✅ notifications.${col}: EXISTS`);
    }
  }

  console.log('\n=== RLS POLICIES CHECK (messages) ===');
  // Sign in as test user and check if we can insert
  const { data: loginData } = await supabase.auth.signInWithPassword({
    email: 'audit_user_a_1787408965101@innovexa-test.ai',
    password: 'TestPass123!'
  });
  
  if (loginData?.session) {
    const authed = createClient('https://jeafkfarfkojazznsafj.supabase.co', 'sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf', {
      global: { headers: { Authorization: `Bearer ${loginData.session.access_token}` } }
    });
    
    console.log('Logged in as:', loginData.user?.email);
    
    // Try to read messages
    const { data: msgs, error: readErr } = await authed.from('messages').select('*').limit(5);
    console.log('Read messages (auth):', readErr ? `❌ ${readErr.message}` : `✅ ${msgs?.length} rows`);
    
    // Try to insert message to self
    const selfMsg = await authed.from('messages').insert([{
      sender_id: loginData.user.id,
      receiver_id: loginData.user.id,
      content: 'Test self-message',
      created_at: new Date().toISOString()
    }]).select();
    console.log('Insert self-message:', selfMsg.error ? `❌ ${selfMsg.error.message}` : `✅ inserted`);
    
    // Check RLS policies on messages via system tables (not accessible via anon)
    console.log('\nUser ID:', loginData.user.id);
    
    // Also check projects insert without category_name
    const { data: projData, error: projErr } = await authed.from('projects').insert([{
      user_id: loginData.user.id,
      title: 'Schema Test Project ' + Date.now(),
      description: 'Schema test',
      short_description: 'Schema test',
      problem_statement: 'Schema test problem',
      proposed_solution: 'Schema test solution',
      project_type: 'idea',
      creation_type: 'IDEA',
      innovation_type: 'IDEA',
      project_stage: 'idea',
      target_users: 'Developers',
      status: 'published',
      category_id: '93fe2938-c843-4fa4-8b01-b07d59990023'
    }]).select('id, title, status').single();
    
    if (projErr) {
      console.log('Project insert (no category_name):', `❌ ${projErr.message}`);
    } else {
      console.log('Project insert (no category_name):', `✅ ID: ${projData.id.slice(0,8)}`);
      // Clean up
      await authed.from('projects').delete().eq('id', projData.id);
    }
    
    await supabase.auth.signOut();
  }
}

inspectSchema().catch(console.error);
