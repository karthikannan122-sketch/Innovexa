import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jeafkfarfkojazznsafj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectProfiles() {
  const { data: profiles } = await supabase.from('profiles').select('*');
  console.log('Profiles:', profiles);
}

inspectProfiles().catch(console.error);
