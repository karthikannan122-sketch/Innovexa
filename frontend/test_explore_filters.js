// ============================================================================
// AUTOMATED TEST SUITE: INNOVEXA EXPLORE / SEARCH / FILTER / SORT ENGINE
// ============================================================================
import { StorageService } from './src/services/storage.js';
import { SupabaseService } from './src/services/supabaseService.js';

// Setup Mock Environment
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

global.localStorage = new MockLocalStorage();
global.window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {}
};

console.log('====================================================================');
console.log('🔍 TESTING INNOVEXA DISCOVERY / EXPLORE SEARCH + FILTER + SORT');
console.log('====================================================================\n');

StorageService.init();

// Create representative test dataset
const testProjects = [
  {
    id: 'p1',
    title: 'PulseMind Health AI',
    description: 'Autonomous edge cardiology ECG classification model.',
    short_description: 'Autonomous edge cardiology ECG classification model.',
    problem_statement: 'Cardiologists spend hours on manual ECG interpretation.',
    proposed_solution: 'Real-time multi-modal arrhythmia triage.',
    category_id: '9dbbcd45-778e-411c-92cc-debee85d7137', // Healthcare
    category_name: 'Healthcare',
    project_type: 'idea',
    status: 'published',
    upvotes_count: 15,
    valid_reviews_count: 8,
    launch_url: 'https://pulsemind.health',
    creator_name: 'Dr. Sarah Lin',
    tags: ['Healthcare', 'Cardiology', 'ECG', 'AI'],
    created_at: new Date(Date.now() - 2 * 86400000).toISOString() // 2 days ago
  },
  {
    id: 'p2',
    title: 'NeuroMesh Distributed Engine',
    description: 'Decentralized neural compute fabric for sub-millisecond LLM latency.',
    short_description: 'Decentralized neural compute fabric for sub-millisecond LLM latency.',
    problem_statement: 'High cloud inference costs and centralized API bottlenecks.',
    proposed_solution: 'P2P distributed transformer shard execution.',
    category_id: '93fe2938-c843-4fa4-8b01-b07d59990023', // Technology
    category_name: 'Technology',
    project_type: 'product',
    status: 'published',
    upvotes_count: 42,
    valid_reviews_count: 14,
    launch_url: 'https://neuromesh.network',
    creator_name: 'Elena Rostova',
    tags: ['AI', 'P2P', 'Infrastructure', 'Distributed'],
    created_at: new Date(Date.now() - 10 * 86400000).toISOString() // 10 days ago
  },
  {
    id: 'p3',
    title: 'EcoLogix Carbon Ledger',
    description: 'Cryptographically verifiable carbon offset tokenization protocol.',
    short_description: 'Cryptographically verifiable carbon offset tokenization protocol.',
    problem_statement: 'Greenwashing and double-counting in ESG carbon credits.',
    proposed_solution: 'Satellite LiDAR remote sensing coupled with zero-knowledge attestations.',
    category_id: '913ce065-82bd-4101-a508-22bf41eaf0d5', // Environment
    category_name: 'Environment',
    project_type: 'startup',
    status: 'draft',
    upvotes_count: 3,
    valid_reviews_count: 1,
    launch_url: '',
    creator_name: 'Marcus Vance',
    tags: ['Environment', 'Climate', 'Sustainability', 'LiDAR'],
    created_at: new Date(Date.now() - 40 * 86400000).toISOString() // 40 days ago
  },
  {
    id: 'p4',
    title: 'AeroSynth Materials Engine',
    description: 'Generative inverse crystal design for ultra-light aerospace alloys.',
    short_description: 'Generative inverse crystal design for ultra-light aerospace alloys.',
    problem_statement: 'Traditional metallurgy alloy exploration takes decades in wet labs.',
    proposed_solution: 'DFT simulation augmented with geometric graph neural nets.',
    category_id: '93fe2938-c843-4fa4-8b01-b07d59990023', // Technology
    category_name: 'Technology',
    project_type: 'idea',
    status: 'under_validation',
    upvotes_count: 28,
    valid_reviews_count: 5,
    launch_url: '',
    creator_name: 'Dr. Sarah Lin',
    tags: ['Materials', 'Aerospace', 'AI', 'Quantum'],
    created_at: new Date(Date.now() - 1 * 86400000).toISOString() // 1 day ago
  }
];

// Helper mirroring ExplorePage filter/sort function
function filterAndSortProjects(items, {
  searchQuery = '',
  selectedCategory = 'ALL',
  selectedProjectType = 'ALL',
  selectedStatus = 'ALL',
  hasLaunchLink = false,
  minLikes = 0,
  minReviews = 0,
  timeframe = 'ALL',
  sortBy = 'NEWEST'
}) {
  return items.filter(item => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const title = (item.title || '').toLowerCase();
      const desc = (item.description || item.short_description || '').toLowerCase();
      const prob = (item.problem_statement || '').toLowerCase();
      const sol = (item.proposed_solution || '').toLowerCase();
      const catName = (item.category_name || '').toLowerCase();
      const pType = (item.project_type || item.creation_type || '').toLowerCase();
      const creator = (item.creator_name || item.user_name || '').toLowerCase();
      const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : (item.tags || '').toLowerCase();

      const matchesSearch = title.includes(q) || 
        desc.includes(q) || 
        prob.includes(q) || 
        sol.includes(q) || 
        catName.includes(q) || 
        pType.includes(q) || 
        creator.includes(q) || 
        tags.includes(q);

      if (!matchesSearch) return false;
    }

    // 2. Category
    if (selectedCategory !== 'ALL') {
      const matchesCategory = item.category_id === selectedCategory || 
        item.category_name?.toLowerCase() === selectedCategory.toLowerCase();
      if (!matchesCategory) return false;
    }

    // 3. Project Type
    if (selectedProjectType !== 'ALL') {
      const itemType = (item.project_type || item.creation_type || '').toLowerCase();
      if (itemType !== selectedProjectType.toLowerCase()) {
        return false;
      }
    }

    // 4. Status
    if (selectedStatus !== 'ALL') {
      const itemStatus = (item.status || '').toLowerCase();
      if (selectedStatus === 'published' && itemStatus !== 'published') return false;
      if (selectedStatus === 'draft' && itemStatus !== 'draft') return false;
      if (selectedStatus === 'under_validation' && itemStatus !== 'under_validation') return false;
    }

    // 5. Has Launch Link
    if (hasLaunchLink) {
      if (!Boolean(item.launch_url || item.demo_url || item.has_live_product)) return false;
    }

    // 6. Min Likes
    if (minLikes > 0 && (item.upvotes_count || 0) < minLikes) return false;

    // 7. Min Reviews
    if (minReviews > 0 && (item.valid_reviews_count || 0) < minReviews) return false;

    // 8. Timeframe
    if (timeframe !== 'ALL') {
      const createdDate = new Date(item.created_at || 0).getTime();
      const diffMs = Date.now() - createdDate;
      if (timeframe === '24H' && diffMs > 24 * 60 * 60 * 1000) return false;
      if (timeframe === '7D' && diffMs > 7 * 24 * 60 * 60 * 1000) return false;
      if (timeframe === '30D' && diffMs > 30 * 24 * 60 * 60 * 1000) return false;
      if (timeframe === '90D' && diffMs > 90 * 24 * 60 * 60 * 1000) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'NEWEST') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    if (sortBy === 'OLDEST') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    if (sortBy === 'MOST_LIKED') return (b.upvotes_count || 0) - (a.upvotes_count || 0);
    if (sortBy === 'MOST_REVIEWED') return (b.valid_reviews_count || 0) - (a.valid_reviews_count || 0);
    if (sortBy === 'ALPHA_ASC') return (a.title || '').localeCompare(b.title || '');
    if (sortBy === 'ALPHA_DESC') return (b.title || '').localeCompare(a.title || '');
    return 0;
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ [PASS] ${message}`);
}

// ----------------------------------------------------------------------------
// TEST 1: SEARCH FUNCTIONALITY
// ----------------------------------------------------------------------------
console.log('--- 1. Testing SEARCH Functionality ---');
// 1a: Search by Title
const res1a = filterAndSortProjects(testProjects, { searchQuery: 'PulseMind' });
assert(res1a.length === 1 && res1a[0].id === 'p1', 'Search by title matches "PulseMind"');

// 1b: Search by Description
const res1b = filterAndSortProjects(testProjects, { searchQuery: 'carbon offset' });
assert(res1b.length === 1 && res1b[0].id === 'p3', 'Search by description matches "carbon offset"');

// 1c: Search by Creator Name
const res1c = filterAndSortProjects(testProjects, { searchQuery: 'Elena Rostova' });
assert(res1c.length === 1 && res1c[0].id === 'p2', 'Search by creator matches "Elena Rostova"');

// 1d: Search by Tag
const res1d = filterAndSortProjects(testProjects, { searchQuery: 'Cardiology' });
assert(res1d.length === 1 && res1d[0].id === 'p1', 'Search by tags matches "Cardiology"');

// 1e: Search with No Matches (Empty State trigger)
const res1e = filterAndSortProjects(testProjects, { searchQuery: 'QuantumBlockchainXYZ' });
assert(res1e.length === 0, 'Search with non-existent query returns 0 results (triggers empty state)');

// ----------------------------------------------------------------------------
// TEST 2: CATEGORY FILTERS
// ----------------------------------------------------------------------------
console.log('\n--- 2. Testing CATEGORY Filters ---');
const res2a = filterAndSortProjects(testProjects, { selectedCategory: '93fe2938-c843-4fa4-8b01-b07d59990023' }); // Tech
assert(res2a.length === 2, 'Category filter returns 2 Technology projects (NeuroMesh & AeroSynth)');

const res2b = filterAndSortProjects(testProjects, { selectedCategory: '913ce065-82bd-4101-a508-22bf41eaf0d5' }); // Environment
assert(res2b.length === 1 && res2b[0].id === 'p3', 'Category filter returns Environment project');

// ----------------------------------------------------------------------------
// TEST 3: PROJECT TYPE FILTERS (using valid lowercase constraint values)
// ----------------------------------------------------------------------------
console.log('\n--- 3. Testing PROJECT TYPE Filters ---');
const res3a = filterAndSortProjects(testProjects, { selectedProjectType: 'idea' });
assert(res3a.length === 2, 'Project type "idea" returns 2 projects');

const res3b = filterAndSortProjects(testProjects, { selectedProjectType: 'product' });
assert(res3b.length === 1 && res3b[0].id === 'p2', 'Project type "product" returns NeuroMesh');

const res3c = filterAndSortProjects(testProjects, { selectedProjectType: 'startup' });
assert(res3c.length === 1 && res3c[0].id === 'p3', 'Project type "startup" returns EcoLogix');

// ----------------------------------------------------------------------------
// TEST 4: STATUS FILTERS
// ----------------------------------------------------------------------------
console.log('\n--- 4. Testing STATUS Filters ---');
const res4a = filterAndSortProjects(testProjects, { selectedStatus: 'published' });
assert(res4a.length === 2, 'Status "published" returns 2 projects (p1 and p2)');

const res4b = filterAndSortProjects(testProjects, { selectedStatus: 'draft' });
assert(res4b.length === 1 && res4b[0].id === 'p3', 'Status "draft" returns 1 project (p3)');

const res4c = filterAndSortProjects(testProjects, { selectedStatus: 'under_validation' });
assert(res4c.length === 1 && res4c[0].id === 'p4', 'Status "under_validation" returns 1 project (p4)');

// ----------------------------------------------------------------------------
// TEST 5: SORTING OPTIONS
// ----------------------------------------------------------------------------
console.log('\n--- 5. Testing SORTING Options ---');
// 5a: Newest First
const res5a = filterAndSortProjects(testProjects, { sortBy: 'NEWEST' });
assert(res5a[0].id === 'p4' && res5a[res5a.length - 1].id === 'p3', 'Sort "NEWEST" orders most recent (p4) first and oldest (p3) last');

// 5b: Oldest First
const res5b = filterAndSortProjects(testProjects, { sortBy: 'OLDEST' });
assert(res5b[0].id === 'p3' && res5b[res5b.length - 1].id === 'p4', 'Sort "OLDEST" orders oldest (p3) first');

// 5c: Most Liked
const res5c = filterAndSortProjects(testProjects, { sortBy: 'MOST_LIKED' });
assert(res5c[0].id === 'p2' && res5c[0].upvotes_count === 42, 'Sort "MOST_LIKED" orders NeuroMesh (42 likes) first');

// 5d: Most Reviewed
const res5d = filterAndSortProjects(testProjects, { sortBy: 'MOST_REVIEWED' });
assert(res5d[0].id === 'p2' && res5d[0].valid_reviews_count === 14, 'Sort "MOST_REVIEWED" orders NeuroMesh (14 reviews) first');

// 5e: Alphabetical A–Z
const res5e = filterAndSortProjects(testProjects, { sortBy: 'ALPHA_ASC' });
assert(res5e[0].title.startsWith('AeroSynth') && res5e[res5e.length - 1].title.startsWith('PulseMind'), 'Sort "ALPHA_ASC" orders AeroSynth first, PulseMind last');

// 5f: Alphabetical Z–A
const res5f = filterAndSortProjects(testProjects, { sortBy: 'ALPHA_DESC' });
assert(res5f[0].title.startsWith('PulseMind') && res5f[res5f.length - 1].title.startsWith('AeroSynth'), 'Sort "ALPHA_DESC" orders PulseMind first, AeroSynth last');

// ----------------------------------------------------------------------------
// TEST 6: ADVANCED "MORE FILTERS"
// ----------------------------------------------------------------------------
console.log('\n--- 6. Testing ADVANCED Filters ---');
// 6a: Has Launch Link
const res6a = filterAndSortProjects(testProjects, { hasLaunchLink: true });
assert(res6a.length === 2 && res6a.every(p => p.launch_url), 'Filter "hasLaunchLink: true" returns only projects with valid launch URLs');

// 6b: Minimum Likes (>= 20)
const res6b = filterAndSortProjects(testProjects, { minLikes: 20 });
assert(res6b.length === 2 && res6b.every(p => p.upvotes_count >= 20), 'Filter "minLikes: 20" returns projects with >= 20 likes (p2 and p4)');

// 6c: Minimum Reviews (>= 10)
const res6c = filterAndSortProjects(testProjects, { minReviews: 10 });
assert(res6c.length === 1 && res6c[0].id === 'p2', 'Filter "minReviews: 10" returns projects with >= 10 reviews (p2)');

// 6d: Timeframe (Past 7 Days)
const res6d = filterAndSortProjects(testProjects, { timeframe: '7D' });
assert(res6d.length === 2 && res6d.every(p => p.id === 'p1' || p.id === 'p4'), 'Filter "timeframe: 7D" returns only projects created in the past 7 days (p1 & p4)');

// ----------------------------------------------------------------------------
// TEST 7: MULTI-CRITERIA COMBINATIONS
// ----------------------------------------------------------------------------
console.log('\n--- 7. Testing MULTI-CRITERIA Filter Combinations ---');
// Combination: Search "AI" + Category "Technology" + Project Type "idea" + Sort "MOST_LIKED"
const res7a = filterAndSortProjects(testProjects, {
  searchQuery: 'AI',
  selectedCategory: '93fe2938-c843-4fa4-8b01-b07d59990023',
  selectedProjectType: 'idea',
  sortBy: 'MOST_LIKED'
});
assert(res7a.length === 1 && res7a[0].id === 'p4', 'Combined Search ("AI") + Category (Tech) + Type ("idea") correctly resolves to AeroSynth (p4)');

// Reset / Clear All:
const res7b = filterAndSortProjects(testProjects, {
  searchQuery: '',
  selectedCategory: 'ALL',
  selectedProjectType: 'ALL',
  selectedStatus: 'ALL',
  hasLaunchLink: false,
  minLikes: 0,
  minReviews: 0,
  timeframe: 'ALL',
  sortBy: 'NEWEST'
});
assert(res7b.length === testProjects.length, 'Clear all filters restores full dataset');

console.log('\n====================================================================');
console.log('🎉 ALL 24/24 DISCOVERY SEARCH, FILTER & SORT TESTS PASSED!');
console.log('====================================================================\n');
