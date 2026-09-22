const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || 'YOUR_SUPABASE_SERVICE_ROLE';

/**
 * Split migration SQL into executable statements.
 * Handles:
 *   - DO $$ ... $$; blocks (multi-statement)
 *   - CREATE TABLE ... ;
 *   - ALTER TABLE ... ;
 *   - Comments and empty lines are skipped.
 */
function splitStatements(sql) {
  const statements = [];
  let i = 0;
  let current = '';
  const len = sql.length;

  while (i < len) {
    // Skip comment lines (-- ... \n)
    if (sql[i] === '-' && sql[i + 1] === '-') {
      while (i < len && sql[i] !== '\n') i++;
      if (i < len && sql[i] === '\n') i++;
      continue;
    }

    // Skip whitespace between statements
    if (!current && (sql[i] === ' ' || sql[i] === '\t' || sql[i] === '\n' || sql[i] === '\r')) {
      i++;
      continue;
    }

    // Detect DO $$ block (start)
    if (current.length < 20 && sql.slice(i, i + 3).toUpperCase() === 'DO ' ||
        (!current && sql[i] === 'D' && sql.slice(i, i + 2) === 'DO')) {
      // Consume until matching END $$;
      current += sql[i++];
      // Find $$
      const idx = sql.indexOf('$$', i);
      if (idx === -1) {
        current += sql.slice(i);
        break;
      }
      // Found first $$ — now find the closing END $$;
      const endMarker = 'END $$;';
      const endIdx = sql.indexOf(endMarker, idx + 2);
      if (endIdx === -1) {
        current += sql.slice(i);
        break;
      }
      current += sql.slice(i, endIdx + endMarker.length);
      i = endIdx + endMarker.length;
      statements.push(current.trim());
      current = '';
      continue;
    }

    // Regular statement terminated by ';'
    if (sql[i] === ';') {
      current += ';';
      if (current.trim().length > 0) {
        statements.push(current.trim());
      }
      current = '';
      i++;
      continue;
    }

    current += sql[i++];
  }

  if (current.trim().length > 0) {
    statements.push(current.trim());
  }

  return statements;
}

// Main
async function main() {
  const sql = fs.readFileSync(
    require('path').join(__dirname, '..', '..', 'supabase', 'migrations', '20260821_add_missing_tables_and_columns.sql'),
    'utf8'
  );
  const stmts = splitStatements(sql);
  console.log(`Split migration into ${stmts.length} statements.`);
  stmts.forEach((s, idx) => {
    const head = s.replace(/\s+/g, ' ').slice(0, 80);
    console.log(`  [${idx + 1}] ${head}...`);
  });

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  // Execute statements one by one via a wrapper RPC. If that fails, fall back to
  // calling each insert/select by hand via the rest API — but for DDL we must use
  // the SQL endpoint directly via fetch. Supabase REST SQL endpoint requires posting
  // to /rest/v1/rpc/pg_execute_sql or the dashboard SQL endpoint. Use fetch.
  const sqlEndpoint = `${SUPABASE_URL}/rest/v1/rpc/pg_execute_sql`;

  // Helper to run raw SQL via Supabase REST SQL endpoint exposed by pgsql.
  // Supabase provides the `pg_sleep` and similar via SQL but for arbitrary DDL
  // we use `pg_catalog.pg_exec` — actually the Supabase REST API only exposes
  // tables/views/functions by default. So we use the `rest` SQL endpoint via
  // the Dashboard-like route.
  //
  // Instead, because of the above, we call each DDL statement via a temporary
  // `plpgsql` function. Shortcut: call the statements through the supabase-js
  // `rpc` if there is a pre-existing sql runner; otherwise, POST to the SQL
  // Editor endpoint using the service role as a Bearer token. Supabase exposes
  // `/rest/v1/rpc/exec_sql` if the `pg_net` or similar extension is enabled.
  //
  // As a reliable fallback, post raw SQL to the Supabase SQL API endpoint used
  // by the dashboard: POST /api/pg-meta/default/query with service role bearer.
  async function runSqlViaDashboard(rawSql) {
    const endpoint = `${SUPABASE_URL}/api/pg-meta/default/query`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ query: rawSql })
    });
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return { ok: res.ok, status: res.status, json };
    } catch {
      return { ok: res.ok, status: res.status, text };
    }
  }

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;
  const failures = [];

  for (let idx = 0; idx < stmts.length; idx++) {
    const stmt = stmts[idx];
    process.stdout.write(`[${idx + 1}/${stmts.length}] `);
    try {
      const r = await runSqlViaDashboard(stmt);
      if (r.ok) {
        successCount++;
        process.stdout.write('OK\n');
      } else {
        const msg = (r.json && (r.json.error || r.json.message || JSON.stringify(r.json).slice(0, 200))) ||
                    (r.text && r.text.slice(0, 200)) ||
                    `HTTP ${r.status}`;
        // Treat "already exists" / "relation exists" / "policy already exists" / "column exists"
        // type messages as soft warnings (skip).
        const lower = String(msg).toLowerCase();
        if (lower.includes('already exists') ||
            lower.includes('duplicate key') ||
            lower.includes('relation') && lower.includes('exists') ||
            lower.includes('column') && lower.includes('exists') ||
            lower.includes('constraint') && lower.includes('exists') ||
            lower.includes('policy') && lower.includes('exists') ||
            lower.includes('permission denied') && lower.includes('skip') ||
            r.status === 409) {
          skipCount++;
          process.stdout.write(`SKIP (${msg.split('\n')[0].slice(0, 120)})\n`);
        } else {
          failCount++;
          failures.push({ idx: idx + 1, stmt: stmt.slice(0, 200), error: msg });
          process.stdout.write(`FAIL (${msg.split('\n')[0].slice(0, 150)})\n`);
        }
      }
    } catch (e) {
      failCount++;
      failures.push({ idx: idx + 1, stmt: stmt.slice(0, 200), error: String(e).slice(0, 200) });
      process.stdout.write(`EXCEPTION: ${String(e).slice(0, 120)}\n`);
    }
  }

  console.log('');
  console.log('=====================================');
  console.log(`Migration complete: ${successCount} OK, ${skipCount} SKIP, ${failCount} FAIL`);
  console.log('=====================================');
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(f => {
      console.log(`  #${f.idx}: ${f.error}`);
      console.log(`    stmt: ${f.stmt}`);
    });
    process.exitCode = 1;
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
