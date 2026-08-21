import { supabase } from './src/lib/supabase.js';

async function probeMessagesCols() {
  const { data: authA } = await supabase.auth.signInWithPassword({
    email: 'alice.innovator@demo.innovexa.io',
    password: 'DemoPass123!'
  });

  // Try different fields on messages
  const attempts = [
    { sender_id: authA.user.id, receiver_id: '6c0d1778-7420-4b7f-9a6c-28228b9c1e80', content: 'hello' },
    { sender_id: authA.user.id, receiver_id: '6c0d1778-7420-4b7f-9a6c-28228b9c1e80', content: 'hello', message_type: 'message', is_read: false },
    { sender_id: authA.user.id, receiver_id: '6c0d1778-7420-4b7f-9a6c-28228b9c1e80', content: 'hello', message_type: 'suggestion', is_read: false },
    { sender_id: authA.user.id, receiver_id: '6c0d1778-7420-4b7f-9a6c-28228b9c1e80', content: 'hello', is_read: false },
    { sender_id: authA.user.id, receiver_id: authA.user.id, content: 'self msg' }
  ];

  for (let i = 0; i < attempts.length; i++) {
    const res = await supabase.from('messages').insert(attempts[i]).select();
    console.log(`Attempt ${i + 1}:`, res.error?.message || 'SUCCESS');
  }
}

probeMessagesCols();
