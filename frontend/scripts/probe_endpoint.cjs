const https = require('https');
const url = require('url');

const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || 'YOUR_SUPABASE_SERVICE_ROLE';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const u = url.parse(SUPABASE_URL + path);
    const opts = {
      method,
      hostname: u.hostname,
      port: 443,
      path: u.path,
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    if (body) opts.headers['Content-Length'] = Buffer.byteLength(body);
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function probe() {
  const paths = [
    '/api/pg-meta/default/query',
    '/rest/v1/rpc/exec_sql',
    '/rest/v1/rpc/pg_execute_sql',
    '/pg/v1/query',
    '/sql',
    '/api/pg/query'
  ];
  const sampleQuery = JSON.stringify({ query: 'SELECT 1 as x;' });
  for (const p of paths) {
    try {
      const r = await request('POST', p, sampleQuery);
      const head = r.body.slice(0, 300).replace(/\n/g, ' ');
      console.log(`POST ${p} -> ${r.status} | ${head}`);
    } catch (e) {
      console.log(`POST ${p} -> ERROR ${String(e)}`);
    }
  }
}

probe();
