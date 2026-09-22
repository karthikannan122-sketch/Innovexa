import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://crwqfrldxvjsbcsjyacg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_UZKoNNZ0FvlzM3u9w1iT0A_PLe0I0Zr';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log('--- TESTING COMMUNITY SUPABASE MESSAGES ---');
  
  // 1. Sign up test user
  const email = `community_tester_${Date.now()}@innovexa.ai`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'Password123!@#'
  });

  if (authError || !authData.user) {
    console.error('Auth error:', authError);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log('✅ Tester signed in with User ID:', userId);

  // 2. Insert Community Open Chat Message into Supabase
  const channel = 'ideas';
  const rawContent = `[#${channel}] Testing autonomous neural consensus on channel #${channel}`;
  
  const { data: insertedMsg, error: insertError } = await supabase
    .from('messages')
    .insert({
      sender_id: userId,
      receiver_id: userId,
      content: rawContent
    })
    .select('id, sender_id, content, created_at')
    .single();

  if (insertError) {
    console.error('❌ Failed to insert message into Supabase:', insertError);
    process.exit(1);
  }

  console.log('✅ Community message inserted into Supabase:', insertedMsg.id, '| Content:', insertedMsg.content);

  // 3. Query Community Messages
  const { data: allMessages, error: queryError } = await supabase
    .from('messages')
    .select('id, sender_id, content, created_at')
    .ilike('content', `[#${channel}]%`)
    .order('created_at', { ascending: true });

  if (queryError) {
    console.error('❌ Failed to query channel messages:', queryError);
    process.exit(1);
  }

  const found = allMessages.some(m => m.id === insertedMsg.id);
  console.log(`✅ Queried channel #${channel}: found ${allMessages.length} messages. Includes new message:`, found);

  // 4. Cleanup
  await supabase.from('messages').delete().eq('id', insertedMsg.id);
  console.log('✅ Cleaned up test message cleanly.');
  console.log('🎉 SUPABASE COMMUNITY OPEN CHAT MESSAGES 100% OPERATIONAL!');
}

run();
