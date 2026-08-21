import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jeafkfarfkojazznsafj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectProjectTitles() {
  console.log('--- FETCHING ALL PROJECTS FROM SUPABASE ---');
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, created_at, user_id, status')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return;
  }

  console.log(`Found ${data.length} projects in Supabase:`);
  data.forEach((p, idx) => {
    console.log(`[${idx + 1}] ID: ${p.id} | Title: "${p.title}" | Status: ${p.status}`);
  });
}

inspectProjectTitles().catch(console.error);
