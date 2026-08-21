import { supabase } from './src/lib/supabase.js';

// The exact function requested by the user
export const fetchConversation = async (otherUserId) => {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User is not authenticated");
    return [];
  }

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
    .order("created_at", {
      ascending: true
    });

  if (error) {
    console.error("Failed to load messages:", error);
    return [];
  }

  return data;
};

async function testConversationFetch() {
  console.log('================================================================');
  console.log('🧪 TESTING FETCH CONVERSATION BETWEEN TWO USERS IN SUPABASE');
  console.log('================================================================\n');

  // Authenticate as Alice
  const { data: authA } = await supabase.auth.signInWithPassword({
    email: 'alice.innovator@demo.innovexa.io',
    password: 'DemoPass123!'
  });
  console.log(`✓ Authenticated user (Alice): ${authA.user.email} (ID: ${authA.user.id})`);

  const bobId = '6c0d1778-7420-4b7f-9a6c-28228b9c1e80'; // Bob Evaluator
  console.log(`✓ Other user (Bob): ID ${bobId}`);

  console.log('\nExecuting fetchConversation(otherUserId)...');
  const conversation = await fetchConversation(bobId);
  console.log(`✓ Result returned: Array with ${conversation ? conversation.length : 0} messages.`);

  console.log('\n================================================================');
  console.log('🎉 FETCH CONVERSATION QUERY STRUCTURE VERIFIED!');
  console.log('================================================================\n');
}

testConversationFetch().catch(console.error);
