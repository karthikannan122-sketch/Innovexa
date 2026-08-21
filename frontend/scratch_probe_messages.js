import { supabase } from './src/lib/supabase.js';

async function probeColumns() {
  const { data: authA } = await supabase.auth.signInWithPassword({
    email: 'alice.innovator@demo.innovexa.io',
    password: 'DemoPass123!'
  });
  console.log('Alice user id:', authA.user.id);

  // Exact user payload:
  const payload = {
    sender_id: authA.user.id,
    receiver_id: '6c0d1778-7420-4b7f-9a6c-28228b9c1e80',
    content: 'Hello Bob from Alice',
    message_type: 'message'
  };

  const res = await supabase.from('messages').insert(payload).select();
  console.log('Insert with message_type result:', res);
}

probeColumns();
