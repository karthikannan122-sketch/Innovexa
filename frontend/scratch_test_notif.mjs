import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://crwqfrldxvjsbcsjyacg.supabase.co';
const SUPABASE_ANON = 'sb_publishable_UZKoNNZ0FvlzM3u9w1iT0A_PLe0I0Zr';

const ts = Date.now();
const emailA = `innovexa.test.a.${ts}@gmail.com`;
const password = 'TestPass123!Secure';

const anon = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });

async function checkNotif() {
  const { data: authA } = await anon.auth.signUp({ email: emailA, password });
  const uidA = authA.user.id;
  const tokA = authA.session.access_token;
  const clientA = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${tokA}` } }
  });

  // Try inserting where user_id = uidA
  const { data: notifOwn, error: errOwn } = await clientA.from('notifications').insert({
    user_id: uidA,
    actor_id: uidA,
    type: 'welcome',
    title: 'Welcome to INNOVEXA',
    message: 'Welcome!'
  }).select();
  console.log('Insert own notification (user_id = auth.uid()):', notifOwn ? 'SUCCESS' : errOwn?.message);

  // Try inserting where actor_id = uidA, user_id = someone else
  const { data: notifOther, error: errOther } = await clientA.from('notifications').insert({
    user_id: '00000000-0000-0000-0000-000000000001',
    actor_id: uidA,
    type: 'alert',
    title: 'Alert',
    message: 'Alert'
  }).select();
  console.log('Insert other notification (actor_id = auth.uid()):', notifOther ? 'SUCCESS' : errOther?.message);
}

checkNotif();
