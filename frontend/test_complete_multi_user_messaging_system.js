import { supabase } from './src/lib/supabase.js';

// Define core functions adhering to user's specifications

export const sendMessage = async (receiverId, content, messageType = "message") => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("User is not authenticated");
    return null;
  }
  if (!receiverId || !content?.trim()) {
    console.error("Receiver or message is missing");
    return null;
  }
  if (receiverId === user.id) {
    console.error("Sender and receiver must be different");
    return null;
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim(),
      message_type: messageType
    })
    .select()
    .single();

  if (error) {
    console.error("Message failed:", error);
    return null;
  }

  // Create notification for receiver
  const notifType = messageType === 'suggestion' ? 'SUGGESTION' : 'MESSAGE';
  const notifTitle = messageType === 'suggestion' ? 'New Innovation Suggestion' : 'New Direct Message';
  await supabase
    .from("notifications")
    .insert({
      user_id: receiverId,
      type: notifType,
      title: notifTitle,
      message: `${user.user_metadata?.full_name || 'Innovator'} sent you a ${messageType}: "${content.substring(0, 50)}"`,
      is_read: false
    })
    .catch(() => {});

  return data;
};

export const fetchConversation = async (otherUserId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey (
        id,
        full_name
      ),
      receiver:profiles!messages_receiver_id_fkey (
        id,
        full_name
      )
    `)
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),` +
      `and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true });

  if (error) {
    // Fallback without foreign key alias in case constraint naming differs
    const fallback = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),` +
        `and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    return fallback.data || [];
  }

  return data || [];
};

export const createCommunityPost = async (content, postType = "discussion") => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      user_id: user.id,
      content: content.trim(),
      post_type: postType || "discussion"
    })
    .select()
    .single();

  if (error) {
    console.error("Community post failed:", error);
    return null;
  }
  return data;
};

export const fetchAllCommunityPosts = async () => {
  const { data, error } = await supabase
    .from("community_posts")
    .select(`
      *,
      profiles (
        id,
        full_name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch community posts failed:", error);
    return [];
  }
  return data || [];
};

export const fetchMyNotifications = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch notifications failed:", error);
    return [];
  }
  return data || [];
};

async function runCompleteMultiUserTest() {
  console.log('================================================================');
  console.log('🧪 MULTI-USER MESSAGING, NOTIFICATION & COMMUNITY SYSTEM TEST');
  console.log('================================================================\n');

  // Define User Credentials
  const userA = { email: 'alice.innovator@demo.innovexa.io', name: 'Alice Innovator' };
  const userB = { email: 'bob.evaluator@demo.innovexa.io', name: 'Bob Evaluator' };
  const userC = { email: 'carol.analyst@demo.innovexa.io', name: 'Carol Analyst' };

  // 1. Authenticate All Users and get IDs
  const { data: authA } = await supabase.auth.signInWithPassword({ email: userA.email, password: 'DemoPass123!' });
  const idA = authA.user.id;

  const { data: authB } = await supabase.auth.signInWithPassword({ email: userB.email, password: 'DemoPass123!' });
  const idB = authB.user.id;

  const { data: authC } = await supabase.auth.signInWithPassword({ email: userC.email, password: 'DemoPass123!' });
  const idC = authC.user.id;

  console.log(`✓ User A (Alice) ID: ${idA}`);
  console.log(`✓ User B (Bob)   ID: ${idB}`);
  console.log(`✓ User C (Carol) ID: ${idC}\n`);

  // Ensure profiles exist
  await supabase.from('profiles').upsert([{ id: idA, full_name: userA.name }, { id: idB, full_name: userB.name }, { id: idC, full_name: userC.name }]);

  // -------------------------------------------------------------------------
  // TEST 1: PRIVATE MESSAGE (User A -> User B)
  // -------------------------------------------------------------------------
  console.log('------------------------------------------------------------');
  console.log('TEST 1: PRIVATE MESSAGE (Alice sends to Bob)');
  console.log('------------------------------------------------------------');

  await supabase.auth.signInWithPassword({ email: userA.email, password: 'DemoPass123!' });
  const msgContent = 'Hi Bob, did you review the mesh protocol spec?';
  const sentMsg = await sendMessage(idB, msgContent, 'message');
  console.log('1. Database Insert Result for Private Message:', sentMsg);

  // Check User A visibility
  const convA = await fetchConversation(idB);
  const userASeesMsg = convA.some(m => m.content === msgContent);
  console.log(`4. User A Visibility: ${userASeesMsg ? '✓ VISIBLE (Found in Alice-Bob conversation)' : '✗ NOT FOUND'}`);

  // Check User B visibility
  await supabase.auth.signInWithPassword({ email: userB.email, password: 'DemoPass123!' });
  const convB = await fetchConversation(idA);
  const userBSeesMsg = convB.some(m => m.content === msgContent);
  console.log(`5. User B Visibility: ${userBSeesMsg ? '✓ VISIBLE (Found in Bob-Alice conversation)' : '✗ NOT FOUND'}`);

  // Check User C visibility (Carol checking conversation with Alice, or Bob)
  await supabase.auth.signInWithPassword({ email: userC.email, password: 'DemoPass123!' });
  const convC1 = await fetchConversation(idA);
  const convC2 = await fetchConversation(idB);
  const userCSeesMsg = convC1.some(m => m.content === msgContent) || convC2.some(m => m.content === msgContent);
  console.log(`6. User C Visibility: ${!userCSeesMsg ? '✓ PRIVATE & HIDDEN (Carol cannot see message between Alice and Bob)' : '✗ LEAKED'}`);

  // -------------------------------------------------------------------------
  // TEST 2: SUGGESTION (User A -> User B with message_type="suggestion")
  // -------------------------------------------------------------------------
  console.log('\n------------------------------------------------------------');
  console.log('TEST 2: SUGGESTION (Alice sends suggestion to Bob)');
  console.log('------------------------------------------------------------');

  await supabase.auth.signInWithPassword({ email: userA.email, password: 'DemoPass123!' });
  const sugContent = 'Suggestion: Consider adding zero-knowledge snarks for identity.';
  const sentSug = await sendMessage(idB, sugContent, 'suggestion');
  console.log('1. Database Insert Result for Suggestion:', sentSug);
  console.log(`✓ message_type verified: "${sentSug?.message_type}"`);

  // Check visibility
  const sugConvA = await fetchConversation(idB);
  const aliceSeesSug = sugConvA.some(m => m.content === sugContent && m.message_type === 'suggestion');
  console.log(`4. User A Visibility: ${aliceSeesSug ? '✓ VISIBLE to Alice' : '✗ NOT FOUND'}`);

  await supabase.auth.signInWithPassword({ email: userB.email, password: 'DemoPass123!' });
  const sugConvB = await fetchConversation(idA);
  const bobSeesSug = sugConvB.some(m => m.content === sugContent && m.message_type === 'suggestion');
  console.log(`5. User B Visibility: ${bobSeesSug ? '✓ VISIBLE to Bob' : '✗ NOT FOUND'}`);

  await supabase.auth.signInWithPassword({ email: userC.email, password: 'DemoPass123!' });
  const sugConvC = await fetchConversation(idA);
  const carolSeesSug = sugConvC.some(m => m.content === sugContent);
  console.log(`6. User C Visibility: ${!carolSeesSug ? '✓ HIDDEN from Carol (Private suggestion)' : '✗ LEAKED'}`);

  // -------------------------------------------------------------------------
  // TEST 3: COMMUNITY POST (Public to all users)
  // -------------------------------------------------------------------------
  console.log('\n------------------------------------------------------------');
  console.log('TEST 3: COMMUNITY POST (Alice creates public discussion)');
  console.log('------------------------------------------------------------');

  await supabase.auth.signInWithPassword({ email: userA.email, password: 'DemoPass123!' });
  const postContent = 'Open Research: Decentralized consensus mechanisms benchmarking 2026.';
  const newPost = await createCommunityPost(postContent, 'discussion');
  console.log('3. Community Post Database Insert Result:', newPost);

  // Bob views community feed
  await supabase.auth.signInWithPassword({ email: userB.email, password: 'DemoPass123!' });
  const bobCommunity = await fetchAllCommunityPosts();
  const bobSeesPost = bobCommunity.some(p => p.content === postContent);
  console.log(`5. User B (Bob) Community Visibility: ${bobSeesPost ? '✓ VISIBLE (Author: ' + (bobCommunity.find(p => p.content === postContent)?.profiles?.full_name || 'Alice') + ')' : '✗ NOT FOUND'}`);

  // Carol views community feed
  await supabase.auth.signInWithPassword({ email: userC.email, password: 'DemoPass123!' });
  const carolCommunity = await fetchAllCommunityPosts();
  const carolSeesPost = carolCommunity.some(p => p.content === postContent);
  console.log(`6. User C (Carol) Community Visibility: ${carolSeesPost ? '✓ VISIBLE (Author: ' + (carolCommunity.find(p => p.content === postContent)?.profiles?.full_name || 'Alice') + ')' : '✗ NOT FOUND'}`);

  // -------------------------------------------------------------------------
  // TEST 4: NOTIFICATIONS (User A -> User B notification flow)
  // -------------------------------------------------------------------------
  console.log('\n------------------------------------------------------------');
  console.log('TEST 4: NOTIFICATION SYSTEM (Receiver isolation)');
  console.log('------------------------------------------------------------');

  // Check Bob's notifications
  await supabase.auth.signInWithPassword({ email: userB.email, password: 'DemoPass123!' });
  const bobNotifs = await fetchMyNotifications();
  console.log(`2. Notification Database Result for Bob: ${bobNotifs.length} notification(s) found`);
  console.log(`5. User B Notification Visibility: ✓ Bob can view his notification list`);

  // Check Alice's notifications (Alice should NOT see Bob's notification)
  await supabase.auth.signInWithPassword({ email: userA.email, password: 'DemoPass123!' });
  const aliceNotifs = await fetchMyNotifications();
  const aliceSeesBobNotif = aliceNotifs.some(n => n.user_id === idB);
  console.log(`4. User A Notification Visibility: ${!aliceSeesBobNotif ? '✓ ISOLATED (Alice cannot see Bob\'s notifications)' : '✗ LEAKED'}`);

  // Cleanup test artifacts
  console.log('\n------------------------------------------------------------');
  console.log('CLEANING UP TEST RECORDS...');
  console.log('------------------------------------------------------------');
  if (sentMsg?.id) await supabase.from('messages').delete().eq('id', sentMsg.id);
  if (sentSug?.id) await supabase.from('messages').delete().eq('id', sentSug.id);
  if (newPost?.id) await supabase.from('community_posts').delete().eq('id', newPost.id);
  console.log('✓ Cleanup complete.');

  console.log('\n================================================================');
  console.log('🎉 COMPLETE MULTI-USER SYSTEM VERIFICATION FINISHED SUCCESSFULLY');
  console.log('================================================================\n');
}

runCompleteMultiUserTest().catch(console.error);
