import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

async function main() {
  const client = createClient(supabaseUrl, supabaseAnonKey);
  const { data: authB } = await client.auth.signInWithPassword({
    email: 'validator.test@innovexa.io',
    password: 'TestPassword123!'
  });

  const clientB = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${authB.session.access_token}` } }
  });

  const { data: profs, error } = await clientB.from('profiles').select('*');
  console.log('Profs visible to User B:', profs?.length, 'Error:', error);
  if (profs) console.log(profs);

  // Now User B queries projects with profile and category joins
  const { data: projs, error: errProjs } = await clientB
    .from('projects')
    .select(`
      *,
      profiles:user_id (id, full_name, avatar_url),
      categories:category_id (id, name)
    `)
    .order('created_at', { ascending: false });

  console.log('\n--- Joined Projects for User B ---');
  console.log('Count:', projs?.length, 'Error:', errProjs);
  if (projs) {
    projs.forEach(p => {
      console.log(`- Project "${p.title}" created by:`, p.profiles?.full_name || 'Anonymous Creator', `(user_id: ${p.user_id})`);
    });
  }
}

main();
