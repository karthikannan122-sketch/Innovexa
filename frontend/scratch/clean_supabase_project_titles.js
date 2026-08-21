import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jeafkfarfkojazznsafj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function cleanProjectTitle(title) {
  if (!title || typeof title !== 'string') return '';
  return title
    .replace(/[\s_\-–—]+[iI]?[0-9]{10,15}$/, '')
    .trim();
}

async function cleanExistingSupabaseTitles() {
  console.log('--- FETCHING PROJECTS TO CLEAN ACCIDENTAL SUFFIXES ---');
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, title, user_id');

  if (error) {
    console.error('Error fetching projects:', error);
    return;
  }

  console.log(`Found ${projects.length} projects in Supabase.`);
  for (const p of projects) {
    const cleaned = cleanProjectTitle(p.title);
    if (cleaned !== p.title) {
      console.log(`Updating Project [${p.id}]: "${p.title}" -> "${cleaned}"`);
      const { error: updateError } = await supabase
        .from('projects')
        .update({ title: cleaned })
        .eq('id', p.id);

      if (updateError) {
        console.warn(`Update error for ${p.id}:`, updateError.message);
      } else {
        console.log(`✓ Successfully cleaned title for [${p.id}]`);
      }
    } else {
      console.log(`Project [${p.id}] already clean: "${p.title}"`);
    }
  }

  console.log('\n--- VERIFYING SUPABASE DATABASE STATE AFTER CLEANUP ---');
  const { data: updatedProjects } = await supabase
    .from('projects')
    .select('id, title, created_at, status')
    .order('created_at', { ascending: false });

  updatedProjects.forEach((p, idx) => {
    console.log(`[${idx + 1}] ID: ${p.id} | Title: "${p.title}" | Status: ${p.status}`);
  });
}

cleanExistingSupabaseTitles().catch(console.error);
