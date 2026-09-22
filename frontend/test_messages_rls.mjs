/**
 * Check messages RLS policy and try alternate insert patterns
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jeafkfarfkojazznsafj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testMessagesRLS() {
  // Login as user A
  const { data: loginA } = await supabase.auth.signInWithPassword({
    email: 'audit_user_a_1787408965101@innovexa-test.ai',
    password: 'TestPass123!'
  });
  
  const userAId = loginA?.user?.id;
  const sessionA = loginA?.session;
  
  // Get user B ID
  const { data: loginB } = await supabase.auth.signInWithPassword({
    email: 'audit_user_b_1787408965101@innovexa-test.ai',
    password: 'TestPass123!'
  });
  const userBId = loginB?.user?.id;
  
  if (!sessionA || !userAId || !userBId) {
    console.log('Cannot login test users. They may have expired.');
    return;
  }
  
  // Re-login as A
  await supabase.auth.signInWithPassword({
    email: 'audit_user_a_1787408965101@innovexa-test.ai',
    password: 'TestPass123!'
  });
  
  const authedA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${sessionA.access_token}` } }
  });
  
  console.log(`User A: ${userAId}`);
  console.log(`User B: ${userBId}`);
  
  // Check messages columns
  const { data: msgRead, error: readErr } = await authedA.from('messages').select('*').limit(5);
  console.log('Read messages:', readErr ? `❌ ${readErr.message}` : `✅ ${msgRead?.length} rows`);
  
  // Try insert from A to B (different users)
  const { data: msg1, error: err1 } = await authedA.from('messages').insert([{
    sender_id: userAId,
    receiver_id: userBId,
    content: 'Test message from A to B'
  }]).select();
  console.log('A->B insert:', err1 ? `❌ ${err1.message}` : `✅ inserted: ${JSON.stringify(msg1)}`);
  
  // Check what columns exist in messages
  if (msgRead?.length > 0 || msg1?.length > 0) {
    const sample = msgRead?.[0] || msg1?.[0];
    console.log('Message columns:', Object.keys(sample || {}));
  }
  
  // Try without message_type (maybe that column doesn't exist)
  const { data: msg2, error: err2 } = await authedA.from('messages').insert([{
    sender_id: userAId,
    receiver_id: userBId,
    content: 'Test message without message_type'
  }]).select();
  console.log('A->B insert (no message_type):', err2 ? `❌ ${err2.message}` : `✅ inserted`);

  // Check messages columns explicitly
  const msgCols = ['id', 'sender_id', 'receiver_id', 'content', 'is_read', 'created_at', 'updated_at', 'message_type'];
  for (const col of msgCols) {
    const { error } = await authedA.from('messages').select(col).limit(1);
    if (error?.message?.includes('does not exist')) {
      console.log(`❌ messages.${col}: DOES NOT EXIST`);
    } else if (!error) {
      console.log(`✅ messages.${col}: EXISTS`);
    } else {
      console.log(`⚠️ messages.${col}: ${error.message}`);
    }
  }
  
  await supabase.auth.signOut();
}

testMessagesRLS().catch(console.error);
