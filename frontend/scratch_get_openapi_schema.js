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
  console.log('OpenAPI definitions (tables in Supabase):', Object.keys(schema.definitions || {}));

  for (const [tableName, tableDef] of Object.entries(schema.definitions || {})) {
    console.log(`\n=== TABLE: ${tableName} ===`);
    console.log('Properties (columns & types):');
    for (const [colName, colDef] of Object.entries(tableDef.properties || {})) {
      console.log(`  - ${colName}: ${colDef.type} ${colDef.format ? `(${colDef.format})` : ''} ${colDef.description || ''}`);
    }
    if (tableDef.required) {
      console.log('  Required fields:', tableDef.required);
    }
  }
}

fetchOpenApi().catch(console.error);
