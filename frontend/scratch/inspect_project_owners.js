import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jeafkfarfkojazznsafj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectProjectOwners() {
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, user_id, status');

  console.log('Project owners:', projects);
}

inspectProjectOwners().catch(console.error);
