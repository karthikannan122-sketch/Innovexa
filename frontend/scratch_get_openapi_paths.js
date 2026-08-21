import fs from 'fs';
import path from 'path';

let supabaseUrl = 'https://jeafkfarfkojazznsafj.supabase.co';
let supabaseAnonKey = 'sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf';

try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) {
      if (k.trim() === 'VITE_SUPABASE_URL') supabaseUrl = v.trim();
      if (k.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = v.trim();
    }
  });
} catch (e) {}

async function fetchOpenApi() {
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': supabaseAnonKey
    }
  });

  const schema = await res.json();
  console.log('OpenAPI paths:', Object.keys(schema.paths || {}));
  for (const [p, def] of Object.entries(schema.paths || {})) {
    if (p === '/') continue;
    console.log(`Path ${p}:`);
    const postParams = def.post?.parameters || [];
    const getParams = def.get?.parameters || [];
    console.log('  GET params/columns:', getParams.map(x => x.name).filter(x => !x.startsWith('select') && !x.startsWith('order') && !x.startsWith('limit') && !x.startsWith('offset') && !x.startsWith('on_conflict')));
    const schemaRef = def.post?.parameters?.find(x => x.schema)?.schema;
    console.log('  Schema ref:', schemaRef);
  }
}

fetchOpenApi().catch(console.error);
