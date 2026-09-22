import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://crwqfrldxvjsbcsjyacg.supabase.co';
const SUPABASE_ANON = 'sb_publishable_UZKoNNZ0FvlzM3u9w1iT0A_PLe0I0Zr';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });

async function testCols() {
  const { error: err1 } = await supabase.from('profiles').select('organization').limit(1);
  console.log('profiles.organization:', err1 ? `❌ ${err1.message}` : '✅ EXISTS');

  const { error: err2 } = await supabase.from('user_private_data').select('date_of_birth').limit(1);
  console.log('user_private_data.date_of_birth:', err2 ? `❌ ${err2.message}` : '✅ EXISTS');

  const { error: err3 } = await supabase.from('projects').select('upvotes_count').limit(1);
  console.log('projects.upvotes_count:', err3 ? `❌ ${err3.message}` : '✅ EXISTS');
}

testCols();
