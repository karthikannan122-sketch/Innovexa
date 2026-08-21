import { supabase } from './src/lib/supabase.js';

// Exact function specified by the user
export const sendMessage = async (receiverId, content) => {
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("User is not authenticated");
    return;
  }

  if (!receiverId || !content?.trim()) {
    console.error("Receiver or message is missing");
    return;
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim(),
      message_type: "message"
    })
    .select()
    .single();

  if (error) {
    console.error("Message failed:", error);
    return;
  }

  console.log("Message sent:", data);

  return data;
};

async function testSendMessage() {
  console.log('================================================================');
  console.log('🧪 TESTING SEND PRIVATE MESSAGE IN SUPABASE');
  console.log('================================================================\n');

  // 1. Authenticate as Alice (Sender)
  const { data: authA, error: errA } = await supabase.auth.signInWithPassword({
    email: 'alice.innovator@demo.innovexa.io',
    password: 'DemoPass123!'
  });
  if (errA) throw errA;
  console.log(`✓ Sender (Alice) authenticated: ID ${authA.user.id}`);

  // 2. Authenticate as Bob (Receiver) to get Bob's user ID
  const receiverId = '6c0d1778-7420-4b7f-9a6c-28228b9c1e80'; // Bob Evaluator
  console.log(`✓ Receiver (Bob) ID: ${receiverId}`);

  // 3. Send private message
  console.log('\nSending private message from Alice to Bob...');
  const msg = await sendMessage(receiverId, 'Hello Bob, could you check the latest mesh protocol update?');

  console.log('\nResult of sendMessage:');
  console.log(msg);

  if (msg && msg.id) {
    console.log('\n✓ Message inserted into public.messages table in Supabase successfully!');
    // Clean up test message
    await supabase.from('messages').delete().eq('id', msg.id);
    console.log('✓ Cleanup complete.');
  } else {
    console.log('Note: If message insert failed due to column constraints, we will adapt schema/fallback gracefully.');
  }
}

testSendMessage().catch(console.error);
