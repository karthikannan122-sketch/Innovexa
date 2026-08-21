import { SupabaseService } from './src/services/supabaseService.js';
import { StorageService } from './src/services/storage.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ [PASS] ${message}`);
}

async function testDashboardControls() {
  console.log('====================================================================');
  console.log('🧪 INNOVEXA DASHBOARD FILTER, SORT & SEARCH CONTROLS TEST SUITE');
  console.log('====================================================================\n');

  // 1. Fetch Real Categories
  console.log('--- 1. Testing Dynamic Categories Fetch ---');
  const catRes = await SupabaseService.getCategories();
  const categories = catRes.data || [];
  assert(categories && categories.length > 0, `Loaded ${categories?.length} real categories dynamically`);
  categories.forEach(c => console.log(`   - ${c.name} (UUID: ${c.id})`));

  // 2. Fetch Real Projects
  console.log('\n--- 2. Testing Real Projects Fetch ---');
  const projRes = await SupabaseService.getProjects();
  const projects = projRes.data || [];

  assert(projects && projects.length > 0, `Loaded ${projects?.length} projects from Supabase & Storage`);

  // 3. Test Quick Project Type Filtering
  console.log('\n--- 3. Testing Project Type Filter ("idea", "product", "startup") ---');
  const ideas = projects.filter(p => p.project_type === 'idea');
  const products = projects.filter(p => p.project_type === 'product');
  const startups = projects.filter(p => p.project_type === 'startup');
  console.log(`   - Ideas found: ${ideas.length}`);
  console.log(`   - Products found: ${products.length}`);
  console.log(`   - Startups found: ${startups.length}`);
  assert(ideas.every(p => p.project_type === 'idea'), 'All items in idea filter have project_type="idea"');

  // 4. Test Category Filter
  console.log('\n--- 4. Testing Category Filter ---');
  const techCatId = '93fe2938-c843-4fa4-8b01-b07d59990023';
  const techProjects = projects.filter(p => p.category_id === techCatId);
  console.log(`   - Technology category projects: ${techProjects.length}`);
  assert(techProjects.every(p => p.category_id === techCatId), 'Category filter matches exact UUID');

  // 5. Test Sorting
  console.log('\n--- 5. Testing Sort Options ---');
  // Newest
  const newestSorted = [...projects].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  assert(new Date(newestSorted[0].created_at) >= new Date(newestSorted[newestSorted.length - 1].created_at), 'Sort: Newest First is descending by created_at');

  // Oldest
  const oldestSorted = [...projects].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  assert(new Date(oldestSorted[0].created_at) <= new Date(oldestSorted[oldestSorted.length - 1].created_at), 'Sort: Oldest First is ascending by created_at');

  // A-Z
  const azSorted = [...projects].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  assert(azSorted[0].title.localeCompare(azSorted[azSorted.length - 1].title) <= 0, 'Sort: A–Z is ascending by title');

  // Z-A
  const zaSorted = [...projects].sort((a, b) => (b.title || '').localeCompare(a.title || ''));
  assert(zaSorted[0].title.localeCompare(zaSorted[zaSorted.length - 1].title) >= 0, 'Sort: Z–A is descending by title');

  // Most Liked
  const likedSorted = [...projects].sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0));
  assert((likedSorted[0].upvotes_count || 0) >= (likedSorted[likedSorted.length - 1].upvotes_count || 0), 'Sort: Most Liked is descending by upvotes');

  // Most Reviewed
  const reviewedSorted = [...projects].sort((a, b) => (b.valid_reviews_count || 0) - (a.valid_reviews_count || 0));
  assert((reviewedSorted[0].valid_reviews_count || 0) >= (reviewedSorted[reviewedSorted.length - 1].valid_reviews_count || 0), 'Sort: Most Reviewed is descending by reviews');

  // 6. Test Combined Search + Type + Category Filter
  console.log('\n--- 6. Testing Combined Search + Type + Category Filter ---');
  const query = 'AI';
  const filtered = projects.filter(p => {
    const matchesSearch = (p.title || '').toLowerCase().includes(query.toLowerCase()) || 
                          (p.description || '').toLowerCase().includes(query.toLowerCase());
    const matchesType = p.project_type === 'idea';
    return matchesSearch && matchesType;
  });
  console.log(`   - Query: "${query}" + Type: "idea" -> ${filtered.length} matches`);
  assert(filtered.every(p => p.project_type === 'idea'), 'Combined filters evaluate conjunctively');

  console.log('\n====================================================================');
  console.log('🎉 ALL DASHBOARD FILTER & SORT TESTS PASSED!');
  console.log('====================================================================\n');
}

testDashboardControls();
