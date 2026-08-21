import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

async function checkRLS() {
  console.log('=== CHECKING RLS AND PROJECT VISIBILITY ===\n');

  const anonClient = createClient(supabaseUrl, supabaseAnonKey);

  // Check anon select on projects
  console.log('1. Anonymous query to public.projects:');
  const { data: anonProj, error: anonErr } = await anonClient
    .from('projects')
    .select('id, title, status, user_id, created_at');
  console.log(`Anon query returned ${anonProj?.length || 0} projects. Error:`, anonErr);
  if (anonProj && anonProj.length > 0) {
    console.log('Sample anon projects:', anonProj.slice(0, 3));
  }

  // Create User A
  const emailA = `test_a_${Date.now()}@innovexa.internal`;
  const password = 'Password123!Test';
  const { data: authA } = await anonClient.auth.signUp({
    email: emailA,
    password: password,
    options: { data: { full_name: 'User A' } }
  });
  const tokenA = authA.session.access_token;
  const userAId = authA.user.id;

  // Create User B
  const emailB = `test_b_${Date.now()}@innovexa.internal`;
  const { data: authB } = await anonClient.auth.signUp({
    email: emailB,
    password: password,
    options: { data: { full_name: 'User B' } }
  });
  const tokenB = authB.session.access_token;
  const userBId = authB.user.id;

  const clientA = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${tokenA}` } }
  });
  const clientB = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${tokenB}` } }
  });

  // Ensure profiles
  await clientA.from('profiles').upsert([{ id: userAId, full_name: 'User A' }]);
  await clientB.from('profiles').upsert([{ id: userBId, full_name: 'User B' }]);

  // User A creates Project A (published)
  console.log('\n2. User A creating Project A (status: published)...');
  const { data: projA, error: errPA } = await clientA
    .from('projects')
    .insert([{
      user_id: userAId,
      title: 'Project Alpha Published',
      description: 'Project Alpha by User A',
      project_type: 'idea',
      status: 'published'
    }])
    .select()
    .single();
  console.log('Project A created:', projA?.id, 'Error:', errPA);

  // User A creates Project A Draft (status: draft)
  console.log('\n3. User A creating Project A Draft (status: draft)...');
  const { data: projADraft, error: errPADraft } = await clientA
    .from('projects')
    .insert([{
      user_id: userAId,
      title: 'Project Alpha Draft',
      description: 'Project Alpha Draft by User A',
      project_type: 'idea',
      status: 'draft'
    }])
    .select()
    .single();
  console.log('Project A Draft created:', projADraft?.id, 'Error:', errPADraft);

  // User B queries all projects
  console.log('\n4. User B queries all projects:');
  const { data: bProjects, error: bErr } = await clientB
    .from('projects')
    .select('id, title, status, user_id');
  console.log(`User B query returned ${bProjects?.length || 0} projects. Error:`, bErr);
  console.log('Projects visible to User B:', bProjects?.map(p => ({ title: p.title, status: p.status, ownedByA: p.user_id === userAId })));

  // Can User B update Project A?
  console.log('\n5. Can User B update Project A?');
  const { data: bUpdateData, error: bUpdateErr } = await clientB
    .from('projects')
    .update({ title: 'Hacked by B' })
    .eq('id', projA.id)
    .select();
  console.log('User B update result:', { bUpdateData, bUpdateErr });

  // Can User B delete Project A?
  console.log('\n6. Can User B delete Project A?');
  const { data: bDeleteData, error: bDeleteErr } = await clientB
    .from('projects')
    .delete()
    .eq('id', projA.id)
    .select();
  console.log('User B delete result:', { bDeleteData, bDeleteErr });

  // Clean up
  if (projA) await clientA.from('projects').delete().eq('id', projA.id);
  if (projADraft) await clientA.from('projects').delete().eq('id', projADraft.id);
  console.log('\nCleaned up.');
}

checkRLS();
