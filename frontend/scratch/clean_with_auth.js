import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jeafkfarfkojazznsafj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf';

function cleanProjectTitle(title) {
  if (!title || typeof title !== 'string') return '';
  return title
    .replace(/[\s_\-–—]+[iI]?[0-9]{10,15}$/, '')
    .trim();
}

async function cleanTitlesAsUsers() {
  const rootClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const testAccounts = [
    { email: 'creator.test@innovexa.io', password: 'TestPassword123!' },
    { email: 'validator.test@innovexa.io', password: 'TestPassword123!' },
    { email: 'test_a@innovexa.internal', password: 'TestPassword123!' },
    { email: 'test_b@innovexa.internal', password: 'TestPassword123!' },
    { email: 'karthick@innovexa.io', password: 'Password123!' }
  ];

  for (const acc of testAccounts) {
    const { data: auth, error: authErr } = await rootClient.auth.signInWithPassword(acc);
    if (auth?.session) {
      console.log(`\nLogged in as ${acc.email} (User ID: ${auth.user.id})`);
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${auth.session.access_token}` } }
      });

      const { data: myProjects } = await userClient
        .from('projects')
        .select('id, title')
        .eq('user_id', auth.user.id);

      console.log(`Found ${myProjects?.length || 0} projects for ${acc.email}:`);
      for (const p of myProjects || []) {
        const cleaned = cleanProjectTitle(p.title);
        if (cleaned !== p.title) {
          console.log(`Updating "${p.title}" -> "${cleaned}"`);
          const { error: updErr } = await userClient
            .from('projects')
            .update({ title: cleaned })
            .eq('id', p.id);
          if (updErr) {
            console.error('Update error:', updErr);
          } else {
            console.log(`✓ Updated successfully!`);
          }
        } else {
          console.log(`Already clean: "${p.title}"`);
        }
      }
    }
  }

  console.log('\n--- VERIFYING ALL SUPABASE PROJECTS NOW ---');
  const { data: allProjs } = await rootClient
    .from('projects')
    .select('id, title, status, user_id')
    .order('created_at', { ascending: false });

  allProjs?.forEach((p, i) => {
    console.log(`[${i+1}] ID: ${p.id} | Title: "${p.title}" | User: ${p.user_id}`);
  });
}

cleanTitlesAsUsers().catch(console.error);
