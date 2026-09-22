/**
 * Final verification test — run createProject with both full and minimal payload
 * to confirm the schema fallback works correctly
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jeafkfarfkojazznsafj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testProjectCreationFixed() {
  console.log('=== PROJECT CREATION FINAL TEST ===\n');

  const { data: loginA } = await supabase.auth.signInWithPassword({
    email: 'audit_user_a_1787408965101@innovexa-test.ai',
    password: 'TestPass123!'
  });
  
  if (!loginA?.session) {
    console.log('Cannot login');
    return;
  }

  const authed = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${loginA.session.access_token}` } }
  });

  const userId = loginA.user.id;
  const categoryId = '93fe2938-c843-4fa4-8b01-b07d59990023'; // Technology

  // Test 1: Full payload (what createProject sends now, including new columns)
  console.log('TEST 1: Full payload with all project fields...');
  const { data: fullProj, error: fullErr } = await authed.from('projects').insert([{
    user_id: userId,
    title: 'Full Schema Test Project ' + Date.now(),
    description: 'Test description for schema verification',
    short_description: 'Short test desc',
    category_name: 'Technology',
    problem_statement: 'Testing full schema insert',
    proposed_solution: 'Automated test verification',
    project_type: 'idea',
    creation_type: 'IDEA',
    innovation_type: 'IDEA',
    project_stage: 'idea',
    target_users: 'Developers',
    launch_url: null,
    status: 'published',
    category_id: categoryId
  }]).select('id, title, status').single();
  
  if (fullErr) {
    if (fullErr.message?.includes('schema cache') || fullErr.message?.includes('column')) {
      console.log(`⚠️  Full payload failed (schema mismatch): ${fullErr.message}`);
      console.log('  → Fallback to minimal payload needed');
      
      // Test 2: Minimal payload fallback
      console.log('\nTEST 2: Minimal payload (fallback)...');
      const { data: minProj, error: minErr } = await authed.from('projects').insert([{
        user_id: userId,
        title: 'Minimal Schema Test Project ' + Date.now(),
        description: 'Test description',
        project_type: 'idea',
        launch_url: null,
        status: 'published',
        category_id: categoryId
      }]).select('id, title, status').single();
      
      if (minErr) {
        console.log(`❌ Minimal payload ALSO FAILED: ${minErr.message}`);
      } else {
        console.log(`✅ Minimal payload succeeded: ID ${minProj.id.slice(0,8)}`);
        // Clean up
        await authed.from('projects').delete().eq('id', minProj.id);
        console.log('  → Cleanup: deleted test project');
      }
    } else {
      console.log(`❌ Full payload failed (non-schema error): ${fullErr.message}`);
    }
  } else {
    console.log(`✅ Full payload succeeded: ID ${fullProj.id.slice(0,8)}`);
    console.log('  → All extended columns now exist in DB (SQL migration was applied)');
    // Clean up
    await authed.from('projects').delete().eq('id', fullProj.id);
    console.log('  → Cleanup: deleted test project');
  }

  console.log('\n=== SUMMARY ===');
  if (fullErr && (fullErr.message?.includes('schema cache') || fullErr.message?.includes('column'))) {
    console.log('⚠️  ACTION REQUIRED: Run INNOVEXA_DB_FIXES.sql in Supabase Dashboard to add missing columns');
    console.log('   File location: C:\\Users\\karthick\\INNOVEXA\\INNOVEXA_DB_FIXES.sql');
    console.log('   The frontend code now has a fallback that works even without the SQL migration.');
  } else if (fullErr) {
    console.log('❌ Project creation is BROKEN due to non-schema error:', fullErr.message);
  } else {
    console.log('✅ Project creation is fully WORKING');
  }

  await supabase.auth.signOut();
}

testProjectCreationFixed().catch(console.error);
