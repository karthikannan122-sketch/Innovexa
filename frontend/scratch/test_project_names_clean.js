import { createClient } from '@supabase/supabase-js';
import { cleanProjectTitle } from '../src/utils/textUtils.js';
import { SupabaseService } from '../src/services/supabaseService.js';
import { StorageService } from '../src/services/storage.js';

const SUPABASE_URL = 'https://jeafkfarfkojazznsafj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf';

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ [PASS] ${message}`);
}

async function testProjectNameSanitization() {
  console.log('====================================================================');
  console.log('🧪 INNOVEXA PROJECT NAME SANITIZATION & INTEGRITY AUDIT');
  console.log('====================================================================\n');

  // Test 1: cleanProjectTitle regex logic unit tests
  console.log('--- Test 1: cleanProjectTitle Unit Tests ---');
  assert(cleanProjectTitle('OmniSensing Radar AI 1787216104625') === 'OmniSensing Radar AI', 'Removes 13-digit timestamp suffix');
  assert(cleanProjectTitle('OmniSensing Radar AI i787215990984') === 'OmniSensing Radar AI', 'Removes i-prefixed timestamp suffix');
  assert(cleanProjectTitle('OmniSensing Radar AI I787215796097') === 'OmniSensing Radar AI', 'Removes I-prefixed timestamp suffix');
  assert(cleanProjectTitle('EcoLogix Carbon Ledger _1787214569696') === 'EcoLogix Carbon Ledger', 'Removes underscore-separated timestamp');
  assert(cleanProjectTitle('EcoLogix Carbon Ledger -1787214569696') === 'EcoLogix Carbon Ledger', 'Removes hyphen-separated timestamp');
  assert(cleanProjectTitle('Industry 4.0 Platform') === 'Industry 4.0 Platform', 'Preserves legitimate version numbers like 4.0');
  assert(cleanProjectTitle('AI 2.0 Assistant') === 'AI 2.0 Assistant', 'Preserves AI 2.0');
  assert(cleanProjectTitle('3D Medical Imaging Mesh') === '3D Medical Imaging Mesh', 'Preserves 3D leading numbers');
  assert(cleanProjectTitle('Web3 Storage Layer') === 'Web3 Storage Layer', 'Preserves Web3 numbers');
  assert(cleanProjectTitle('Project 42 Alpha') === 'Project 42 Alpha', 'Preserves short numbers inside text');
  assert(cleanProjectTitle('OmniSensing Radar AI') === 'OmniSensing Radar AI', 'Preserves pure alphanumeric titles');

  // Test 2: Verify Supabase database state
  console.log('\n--- Test 2: Fetch and verify all Supabase projects are clean ---');
  const { data: projects, error } = await SupabaseService.getProjects();
  assert(!error, 'SupabaseService.getProjects() returned without error');
  assert(projects && projects.length > 0, `Fetched ${projects?.length} projects from Supabase`);

  projects.forEach((p, idx) => {
    const title = p.title;
    const hasGeneratedTimestampSuffix = /[\s_\-–—]+[iI]?[0-9]{10,15}$/.test(title);
    assert(!hasGeneratedTimestampSuffix, `[#${idx + 1}] Project Title is clean: "${title}" (ID: ${p.id})`);
  });

  // Test 3: Test project creation and ensure title is never suffixed
  console.log('\n--- Test 3: Test createProject with and without accidental suffixes ---');
  const mockUser = {
    id: '2350f787-7cc2-4245-9036-a29d0d80824e',
    name: 'Dr. Sarah Creator'
  };

  const testTitle = 'BioTelemetry Neural Monitor';
  const createdLocal = StorageService.createInnovation({
    title: `${testTitle} 1787216104625`,
    description: 'Neural monitor test innovation',
    creation_type: 'PRODUCT',
    category_id: '19b552c7-2ed6-44fe-9846-5d1501b1104f'
  });

  assert(createdLocal.title === testTitle, `StorageService stored clean title: "${createdLocal.title}"`);
  
  const fetchedInno = StorageService.getInnovationById(createdLocal.id);
  assert(fetchedInno.title === testTitle, `StorageService fetched clean title: "${fetchedInno.title}"`);

  console.log('\n====================================================================');
  console.log('✅ ALL PROJECT NAME INTEGRITY & DISPLAY AUDITS PASSED WITH ZERO ERRORS!');
  console.log('====================================================================\n');
}

testProjectNameSanitization().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
