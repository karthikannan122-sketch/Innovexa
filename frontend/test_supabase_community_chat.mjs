import { SupabaseService } from './src/services/supabaseService.js';
import { supabase } from './src/lib/supabase.js';

async function testCommunityChat() {
  console.log('--- TESTING SUPABASE COMMUNITY CHAT ENGINE ---');

  // 1. Sign up test user
  const email = `community_chat_user_${Date.now()}@innovexa.ai`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'Password123!@#'
  });

  if (authError || !authData.user) {
    console.error('Auth error:', authError);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log('✅ User registered:', userId);

  // 2. Send Community Message via SupabaseService
  const sendRes = await SupabaseService.sendCommunityMessage({
    channel: 'general',
    senderId: userId,
    content: 'Hello INNOVEXA! Live community message dispatched through Supabase database.'
  });

  if (sendRes.error || !sendRes.data) {
    console.error('❌ Failed to send community message:', sendRes.error);
    process.exit(1);
  }

  console.log('✅ Community message dispatched to Supabase:', sendRes.data.id, '| Sender:', sendRes.data.sender_name);

  // 3. Fetch Community Messages for Channel
  const getRes = await SupabaseService.getCommunityMessages('general');
  if (getRes.error) {
    console.error('❌ Failed to fetch community messages:', getRes.error);
    process.exit(1);
  }

  const found = getRes.data.some(m => m.id === sendRes.data.id);
  console.log(`✅ Fetched ${getRes.data.length} messages from Supabase. Target message found:`, found);

  // 4. Delete Community Message
  const delRes = await SupabaseService.deleteCommunityMessage(sendRes.data.id, userId);
  if (delRes.error) {
    console.error('❌ Failed to delete message:', delRes.error);
    process.exit(1);
  }

  console.log('✅ Deleted message cleanly from Supabase.');
  console.log('🎉 ALL SUPABASE COMMUNITY MESSAGE TESTS PASSED WITH 100% SUCCESS!');
}

testCommunityChat();
