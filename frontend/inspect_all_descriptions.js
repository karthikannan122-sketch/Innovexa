import { supabase } from './src/lib/supabase.js';

async function inspectAllDescriptions() {
  const { data } = await supabase.from('projects').select('*');
  console.log('--- Inspecting all 14 Project Descriptions ---');
  data?.forEach((p, idx) => {
    console.log(`\n========================================`);
    console.log(`[${idx + 1}] ID: ${p.id}`);
    console.log(`TITLE: "${p.title}"`);
    console.log(`PROJECT TYPE: "${p.project_type}"`);
    console.log(`STATUS: "${p.status}"`);
    console.log(`DESCRIPTION:\n${p.description}`);
  });
}

inspectAllDescriptions().catch(console.error);
