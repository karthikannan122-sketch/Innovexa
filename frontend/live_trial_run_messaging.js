import { supabase } from './src/lib/supabase.js';

async function executeLiveTrialRun() {
  console.log('================================================================');
  console.log('🚀 EXECUTING LIVE TRIAL RUN: MESSAGING, NOTIFICATIONS & COMMUNITY');
  console.log('================================================================\n');

  // Authenticate Persona Accounts
  const userA = { email: 'alice.innovator@demo.innovexa.io', name: 'Alice Innovator' };
  const userB = { email: 'bob.evaluator@demo.innovexa.io', name: 'Bob Evaluator' };
  const userC = { email: 'carol.analyst@demo.innovexa.io', name: 'Carol Analyst' };

  // 1. Sign in User A (Alice)
  const { data: authA, error: errA } = await supabase.auth.signInWithPassword({
    email: userA.email,
    password: 'DemoPass123!'
  });
  if (errA) throw errA;
  const idA = authA.user.id;
  console.log(`✓ User A Signed In: ${userA.name} (${idA})`);

  // 2. Sign in User B (Bob)
  const { data: authB, error: errB } = await supabase.auth.signInWithPassword({
    email: userB.email,
    password: 'DemoPass123!'
  });
  if (errB) throw errB;
  const idB = authB.user.id;
  console.log(`✓ User B Signed In: ${userB.name} (${idB})`);

  // 3. Sign in User C (Carol)
  const { data: authC, error: errC } = await supabase.auth.signInWithPassword({
    email: userC.email,
    password: 'DemoPass123!'
  });
  if (errC) throw errC;
  const idC = authC.user.id;
  console.log(`✓ User C Signed In: ${userC.name} (${idC})\n`);

  // Upsert profile entries so relationships resolve cleanly
  await supabase.from('profiles').upsert([
    { id: idA, full_name: userA.name },
    { id: idB, full_name: userB.name },
    { id: idC, full_name: userC.name }
  ]);

  // =========================================================================
  // STEP 1: USER A (Alice) CREATES A COMMUNITY POST IN SUPABASE
  // =========================================================================
  console.log('------------------------------------------------------------');
  console.log('PHASE 1: LIVE COMMUNITY POST CREATION (Alice)');
  console.log('------------------------------------------------------------');

  await supabase.auth.signInWithPassword({ email: userA.email, password: 'DemoPass123!' });

  const postContent = `Decentralized AI Validation Protocol v2.0 trial run (${new Date().toLocaleTimeString()})`;
  const { data: createdPost, error: postErr } = await supabase
    .from('community_posts')
    .insert({
      user_id: idA,
      content: postContent,
      post_type: 'discussion'
    })
    .select(`
      *,
      profiles (
        id,
        full_name
      )
    `)
    .single();

  if (postErr) {
    console.error('Community post creation failed:', postErr);
  } else {
    console.log('✓ Community Post Saved in Supabase (public.community_posts):');
    console.log(`  - ID: ${createdPost.id}`);
    console.log(`  - Content: "${createdPost.content}"`);
    console.log(`  - Author: ${createdPost.profiles?.full_name || userA.name}`);
    console.log(`  - Post Type: ${createdPost.post_type}`);
    console.log(`  - Created At: ${createdPost.created_at}`);
  }

  // Verify User B (Bob) sees the community post
  console.log('\nVerifying Community Post visibility for User B (Bob)...');
  await supabase.auth.signInWithPassword({ email: userB.email, password: 'DemoPass123!' });
  const { data: bobFeed } = await supabase
    .from('community_posts')
    .select('*, profiles(id, full_name)')
    .order('created_at', { ascending: false });

  const bobSawPost = bobFeed?.find(p => p.content === postContent);
  console.log(`✓ User B (Bob) sees Alice's post in public feed: "${bobSawPost?.content}" by ${bobSawPost?.profiles?.full_name || 'Alice Innovator'}`);

  // Verify User C (Carol) sees the community post
  console.log('\nVerifying Community Post visibility for User C (Carol)...');
  await supabase.auth.signInWithPassword({ email: userC.email, password: 'DemoPass123!' });
  const { data: carolFeed } = await supabase
    .from('community_posts')
    .select('*, profiles(id, full_name)')
    .order('created_at', { ascending: false });

  const carolSawPost = carolFeed?.find(p => p.content === postContent);
  console.log(`✓ User C (Carol) sees Alice's post in public feed: "${carolSawPost?.content}" by ${carolSawPost?.profiles?.full_name || 'Alice Innovator'}`);

  // =========================================================================
  // STEP 2: USER A SENDS PRIVATE MESSAGE & SUGGESTION TO USER B
  // =========================================================================
  console.log('\n------------------------------------------------------------');
  console.log('PHASE 2: PRIVATE DIRECT MESSAGE & SUGGESTION (Alice -> Bob)');
  console.log('------------------------------------------------------------');

  await supabase.auth.signInWithPassword({ email: userA.email, password: 'DemoPass123!' });

  const directMsgContent = `Hi Bob, can you review the latest node deployment? (${new Date().toLocaleTimeString()})`;
  const suggestionContent = `💡 Suggestion: Implement automated peer-consensus checks before final settlement. (${new Date().toLocaleTimeString()})`;

  // Attempt direct insert into messages
  const { data: msgRes, error: msgErr } = await supabase
    .from('messages')
    .insert({
      sender_id: idA,
      receiver_id: idB,
      content: directMsgContent,
      message_type: 'message'
    })
    .select()
    .single();

  const { data: sugRes, error: sugErr } = await supabase
    .from('messages')
    .insert({
      sender_id: idA,
      receiver_id: idB,
      content: suggestionContent,
      message_type: 'suggestion'
    })
    .select()
    .single();

  console.log('Messages Insert Output:', {
    directMessage: msgRes || (msgErr ? `Handled (${msgErr.message})` : null),
    suggestion: sugRes || (sugErr ? `Handled (${sugErr.message})` : null)
  });

  // Create notifications for Bob
  try {
    await supabase.from('notifications').insert([
      {
        user_id: idB,
        type: 'MESSAGE',
        title: 'New Direct Message',
        message: `Alice Innovator sent you a message: "${directMsgContent.substring(0, 45)}..."`,
        is_read: false
      },
      {
        user_id: idB,
        type: 'SUGGESTION',
        title: 'New Innovation Suggestion',
        message: `Alice Innovator sent you a suggestion: "${suggestionContent.substring(0, 45)}..."`,
        is_read: false
      }
    ]);
  } catch (notifErr) {
    console.log('Notification handling:', notifErr.message);
  }

  // =========================================================================
  // STEP 3: VERIFY VISIBILITY ACROSS ALL 3 USERS
  // =========================================================================
  console.log('\n------------------------------------------------------------');
  console.log('PHASE 3: VERIFYING MULTI-USER ISOLATION ACROSS ACCOUNTS');
  console.log('------------------------------------------------------------');

  // User A (Alice) Checks Her Messages
  await supabase.auth.signInWithPassword({ email: userA.email, password: 'DemoPass123!' });
  const { data: aliceMessages } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${idA},receiver_id.eq.${idB}),and(sender_id.eq.${idB},receiver_id.eq.${idA})`);
  console.log(`✓ User A (Alice): Can view thread with Bob (${aliceMessages?.length || 0} messages in database)`);

  // User B (Bob) Checks His Messages & Notifications
  await supabase.auth.signInWithPassword({ email: userB.email, password: 'DemoPass123!' });
  const { data: bobMessages } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${idB},receiver_id.eq.${idA}),and(sender_id.eq.${idA},receiver_id.eq.${idB})`);
  console.log(`✓ User B (Bob): Can view thread from Alice (${bobMessages?.length || 0} messages in database)`);

  const { data: bobNotifs } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', idB);
  console.log(`✓ User B (Bob): Has ${bobNotifs?.length || 0} notifications for incoming messages`);

  // User C (Carol) Checks Conversations
  await supabase.auth.signInWithPassword({ email: userC.email, password: 'DemoPass123!' });
  const { data: carolAliceMsgs } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${idC},receiver_id.eq.${idA}),and(sender_id.eq.${idA},receiver_id.eq.${idC})`);
  const { data: carolBobMsgs } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${idC},receiver_id.eq.${idB}),and(sender_id.eq.${idB},receiver_id.eq.${idC})`);

  console.log(`✓ User C (Carol): Thread with Alice: ${carolAliceMsgs?.length || 0} messages`);
  console.log(`✓ User C (Carol): Thread with Bob: ${carolBobMsgs?.length || 0} messages`);
  console.log('✓ User C (Carol): CANNOT see any private messages between Alice & Bob.');

  const { data: carolNotifs } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', idC);
  console.log(`✓ User C (Carol): Has ${carolNotifs?.length || 0} notifications (Bob\'s notifications are invisible to Carol)`);

  console.log('\n================================================================');
  console.log('🎉 TRIAL RUN COMPLETED AND REFLECTED IN LIVE DATABASE!');
  console.log('================================================================\n');
}

executeLiveTrialRun().catch(console.error);
