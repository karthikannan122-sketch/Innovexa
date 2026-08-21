import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

async function testJoin() {
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);

  console.log('Testing simple select:');
  const { data: simple, error: simpleErr } = await anonClient.from('projects').select('*');
  console.log('Simple count:', simple?.length, 'Error:', simpleErr);

  console.log('\nTesting joined select (profiles & categories):');
  const { data: joined, error: joinedErr } = await anonClient
    .from('projects')
    .select(`
      *,
      profiles:user_id (id, full_name, avatar_url),
      categories:category_id (id, name)
    `);
  console.log('Joined count:', joined?.length, 'Error:', joinedErr);

  console.log('\nAll projects found:');
  joined?.forEach(p => {
    console.log(`- [${p.id}] ${p.title} (User: ${p.user_id}, Status: ${p.status}, Cat: ${p.categories?.name || p.category_id}, Profile: ${p.profiles?.full_name || 'NO PROFILE'})`);
  });
}

testJoin();
