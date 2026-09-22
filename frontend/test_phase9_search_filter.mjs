// frontend/test_phase9_search_filter.mjs
// Verification suite for Phase 9: Global Search and Filter System

import assert from 'assert';

console.log('================================================================');
console.log('🧪 TESTING PHASE 9: GLOBAL SEARCH AND FILTER SYSTEM');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function testAssert(condition, testName, details = '') {
  if (condition) {
    console.log(`✅ PASS: ${testName} ${details ? '(' + details + ')' : ''}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
    failCount++;
  }
}

// ----------------------------------------------------------------------------
// 1. MOCK DATASETS
// ----------------------------------------------------------------------------
const mockProjects = [
  {
    id: 'proj-001',
    title: 'SolarFlow — Decentralized Microgrid Protocol',
    short_description: 'Peer-to-peer renewable energy trading protocol using smart meters.',
    description: 'Detailed specification for peer-to-peer renewable energy microgrids.',
    problem_statement: 'Centralized grids lose 12% energy in transmission with poor local resilience.',
    proposed_solution: 'Autonomous neighborhood microgrid clusters with sub-second balancing.',
    category_id: 'cat-clean-energy',
    category_name: 'Clean Energy',
    project_type: 'product',
    project_stage: 'prototype',
    innovation_type: 'RADICAL',
    is_public: true,
    status: 'PUBLISHED',
    upvotes_count: 142,
    downvotes_count: 3,
    valid_reviews_count: 24,
    average_rating: 4.85,
    tags: ['solar', 'microgrid', 'p2p', 'clean-energy'],
    created_at: '2026-08-20T10:00:00Z'
  },
  {
    id: 'proj-002',
    title: 'NeuroLens — Wearable Visual Copilot',
    short_description: 'Real-time spatial audio guidance for the visually impaired.',
    description: 'Hardware prototype paired with low-latency edge AI.',
    problem_statement: 'Existing navigation aids fail at dynamic obstacle avoidance.',
    proposed_solution: 'Multi-modal depth sensors generating localized binaural cues.',
    category_id: 'cat-assistive-tech',
    category_name: 'Assistive Tech',
    project_type: 'prototype',
    project_stage: 'mvp',
    innovation_type: 'DISRUPTIVE',
    is_public: true,
    status: 'PUBLISHED',
    upvotes_count: 89,
    downvotes_count: 12,
    valid_reviews_count: 15,
    average_rating: 4.60,
    tags: ['accessibility', 'edge-ai', 'wearable', 'spatial-audio'],
    created_at: '2026-08-21T14:30:00Z'
  },
  {
    id: 'proj-003',
    title: 'BioSieve — Microplastic Filtration Membrane',
    short_description: 'Enzyme-coated biomimetic mesh for municipal water treatment.',
    description: 'Captures and breaks down microplastics below 5 microns.',
    problem_statement: 'Standard sand filters cannot capture nanoparticles and microfibers.',
    proposed_solution: 'Engineered bacterial cellulose membranes with immobilized PETases.',
    category_id: 'cat-biotech',
    category_name: 'Biotechnology',
    project_type: 'research',
    project_stage: 'concept',
    innovation_type: 'ARCHITECTURAL',
    is_public: true,
    status: 'PUBLISHED',
    upvotes_count: 210,
    downvotes_count: 1,
    valid_reviews_count: 38,
    average_rating: 4.95,
    tags: ['biotech', 'water-treatment', 'microplastics', 'enzymes'],
    created_at: '2026-08-22T08:15:00Z'
  },
  {
    id: 'proj-004',
    title: 'FleetPulse — Predictive EV Battery Telematics',
    short_description: 'Battery health prognostics and charging optimization for fleets.',
    description: 'Cloud analytics dashboard analyzing cell degradation waveforms.',
    problem_statement: 'Fleet operators face unexpected battery failures and warranty disputes.',
    proposed_solution: 'Physics-informed machine learning estimating remaining useful life.',
    category_id: 'cat-clean-energy',
    category_name: 'Clean Energy',
    project_type: 'product',
    project_stage: 'growth',
    innovation_type: 'INCREMENTAL',
    is_public: true,
    status: 'PUBLISHED',
    upvotes_count: 55,
    downvotes_count: 18,
    valid_reviews_count: 8,
    average_rating: 4.20,
    tags: ['ev', 'battery', 'telematics', 'ai'],
    created_at: '2026-08-23T11:45:00Z'
  }
];

const mockCommunityPosts = [
  {
    id: 'post-101',
    title: 'How should decentralized microgrids handle localized voltage spikes?',
    content: 'We are testing our MPPT controllers and notice inverter tripping under rapid cloud transients. Looking for recommendations on ultra-capacitor buffering.',
    post_type: 'QUESTION',
    category_id: 'cat-clean-energy',
    category_name: 'Clean Energy',
    upvotes_count: 34,
    comments_count: 14,
    tags: ['microgrid', 'hardware', 'voltage', 'inverters'],
    created_at: '2026-08-20T12:00:00Z'
  },
  {
    id: 'post-102',
    title: 'Open Source PETase Enzyme Expression Protocol Released',
    content: 'We published the plasmid design and expression protocols on GitHub for open peer verification. Feedback on yield optimization is welcome.',
    post_type: 'RESOURCE',
    category_id: 'cat-biotech',
    category_name: 'Biotechnology',
    upvotes_count: 88,
    comments_count: 22,
    tags: ['biotech', 'enzymes', 'open-science', 'protocols'],
    created_at: '2026-08-22T16:00:00Z'
  },
  {
    id: 'post-103',
    title: 'Ethics and Safety of Edge Spatial Audio in High-Traffic Zones',
    content: 'Exploring latency fail-safes when sensory inputs stutter. Join the open debate on redundant haptic fallbacks.',
    post_type: 'DISCUSSION',
    category_id: 'cat-assistive-tech',
    category_name: 'Assistive Tech',
    upvotes_count: 45,
    comments_count: 31,
    tags: ['accessibility', 'safety', 'wearable', 'design'],
    created_at: '2026-08-23T09:00:00Z'
  }
];

// ----------------------------------------------------------------------------
// 2. EXPLORE SEARCH & FILTER SIMULATION FUNCTIONS
// ----------------------------------------------------------------------------
function filterExploreProjects(projects, { search = '', category_id = 'ALL', project_type = 'ALL', project_stage = 'ALL', innovation_type = 'ALL', sortBy = 'NEWEST' }) {
  const q = search.toLowerCase().trim();
  
  let res = projects.filter(item => {
    // 1. Search Query across 5 attributes: title, description, problem statement, solution, tags
    if (q) {
      const title = (item.title || '').toLowerCase();
      const desc = (item.description || item.short_description || '').toLowerCase();
      const prob = (item.problem_statement || '').toLowerCase();
      const sol = (item.proposed_solution || '').toLowerCase();
      const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : (item.tags || '').toLowerCase();

      const matchesSearch = title.includes(q) || desc.includes(q) || prob.includes(q) || sol.includes(q) || tags.includes(q);
      if (!matchesSearch) return false;
    }

    // 2. Category Filter
    if (category_id !== 'ALL' && item.category_id !== category_id) {
      return false;
    }

    // 3. Project Type Filter
    if (project_type !== 'ALL' && (item.project_type || '').toLowerCase() !== project_type.toLowerCase()) {
      return false;
    }

    // 4. Project Stage Filter
    if (project_stage !== 'ALL' && (item.project_stage || '').toLowerCase() !== project_stage.toLowerCase()) {
      return false;
    }

    // 5. Innovation Type Filter
    if (innovation_type !== 'ALL' && (item.innovation_type || '').toLowerCase() !== innovation_type.toLowerCase()) {
      return false;
    }

    return true;
  });

  // Sorting
  const sortMode = sortBy.toUpperCase();
  if (sortMode === 'OLDEST') {
    res.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else if (sortMode === 'MOST_UPVOTED') {
    res.sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0));
  } else if (sortMode === 'MOST_DOWNVOTED') {
    res.sort((a, b) => (b.downvotes_count || 0) - (a.downvotes_count || 0));
  } else if (sortMode === 'MOST_REVIEWED') {
    res.sort((a, b) => (b.valid_reviews_count || 0) - (a.valid_reviews_count || 0));
  } else if (sortMode === 'HIGHEST_RATED') {
    res.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
  } else {
    // NEWEST / LATEST
    res.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  return res;
}

// ----------------------------------------------------------------------------
// 3. COMMUNITY SEARCH & FILTER SIMULATION FUNCTIONS
// ----------------------------------------------------------------------------
function filterCommunityPosts(posts, { search = '', category_id = 'ALL', post_type = 'ALL', sortBy = 'NEWEST' }) {
  const q = search.toLowerCase().trim();

  let res = posts.filter(item => {
    // 1. Search Query: title, content, tags
    if (q) {
      const title = (item.title || '').toLowerCase();
      const content = (item.content || '').toLowerCase();
      const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : (item.tags || '').toLowerCase();

      const matchesSearch = title.includes(q) || content.includes(q) || tags.includes(q);
      if (!matchesSearch) return false;
    }

    // 2. Category Filter
    if (category_id !== 'ALL' && item.category_id !== category_id) {
      return false;
    }

    // 3. Post Type Filter
    if (post_type !== 'ALL' && (item.post_type || '').toUpperCase() !== post_type.toUpperCase()) {
      return false;
    }

    return true;
  });

  // Sorting
  const sortMode = sortBy.toUpperCase();
  if (sortMode === 'OLDEST') {
    res.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else if (sortMode === 'MOST_LIKED' || sortMode === 'MOST_UPVOTED') {
    res.sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0));
  } else if (sortMode === 'MOST_COMMENTED') {
    res.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
  } else {
    // NEWEST / LATEST
    res.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  return res;
}

// ----------------------------------------------------------------------------
// EXECUTE TESTS
// ----------------------------------------------------------------------------
console.log('--- 1. EXPLORE: Multi-field Search Tests ---');

// Search by Title
const searchByTitle = filterExploreProjects(mockProjects, { search: 'SolarFlow' });
testAssert(searchByTitle.length === 1 && searchByTitle[0].id === 'proj-001', 'Search by Title', 'Found SolarFlow');

// Search by Description
const searchByDesc = filterExploreProjects(mockProjects, { search: 'binaural cues' });
testAssert(searchByDesc.length === 1 && searchByDesc[0].id === 'proj-002', 'Search by Description', 'Found NeuroLens');

// Search by Problem Statement
const searchByProb = filterExploreProjects(mockProjects, { search: 'nanoparticles and microfibers' });
testAssert(searchByProb.length === 1 && searchByProb[0].id === 'proj-003', 'Search by Problem Statement', 'Found BioSieve');

// Search by Solution
const searchBySol = filterExploreProjects(mockProjects, { search: 'physics-informed machine learning' });
testAssert(searchBySol.length === 1 && searchBySol[0].id === 'proj-004', 'Search by Proposed Solution', 'Found FleetPulse');

// Search by Tags
const searchByTags = filterExploreProjects(mockProjects, { search: 'p2p' });
testAssert(searchByTags.length === 1 && searchByTags[0].id === 'proj-001', 'Search by Tags', 'Found solar p2p tag');


console.log('\n--- 2. EXPLORE: Multi-dimensional Filter Tests ---');

// Category Filter
const cleanEnergyFilter = filterExploreProjects(mockProjects, { category_id: 'cat-clean-energy' });
testAssert(cleanEnergyFilter.length === 2 && cleanEnergyFilter.every(p => p.category_id === 'cat-clean-energy'), 'Filter by Category', '2 Clean Energy items');

// Project Type Filter
const researchTypeFilter = filterExploreProjects(mockProjects, { project_type: 'research' });
testAssert(researchTypeFilter.length === 1 && researchTypeFilter[0].id === 'proj-003', 'Filter by Project Type', '1 Research project');

// Project Stage Filter
const prototypeStageFilter = filterExploreProjects(mockProjects, { project_stage: 'prototype' });
testAssert(prototypeStageFilter.length === 1 && prototypeStageFilter[0].id === 'proj-001', 'Filter by Project Stage', '1 Prototype stage');

// Innovation Type Filter
const radicalInnoFilter = filterExploreProjects(mockProjects, { innovation_type: 'RADICAL' });
testAssert(radicalInnoFilter.length === 1 && radicalInnoFilter[0].id === 'proj-001', 'Filter by Innovation Type', '1 Radical innovation');


console.log('\n--- 3. EXPLORE: Sorting Mode Tests ---');

// Latest
const sortLatest = filterExploreProjects(mockProjects, { sortBy: 'LATEST' });
testAssert(sortLatest[0].id === 'proj-004' && sortLatest[3].id === 'proj-001', 'Sort: Latest', 'FleetPulse newest, SolarFlow oldest');

// Oldest
const sortOldest = filterExploreProjects(mockProjects, { sortBy: 'OLDEST' });
testAssert(sortOldest[0].id === 'proj-001' && sortOldest[3].id === 'proj-004', 'Sort: Oldest', 'SolarFlow oldest first');

// Most Upvoted
const sortUpvoted = filterExploreProjects(mockProjects, { sortBy: 'MOST_UPVOTED' });
testAssert(sortUpvoted[0].id === 'proj-003' && sortUpvoted[0].upvotes_count === 210, 'Sort: Most Upvoted', 'BioSieve top with 210 upvotes');

// Most Downvoted
const sortDownvoted = filterExploreProjects(mockProjects, { sortBy: 'MOST_DOWNVOTED' });
testAssert(sortDownvoted[0].id === 'proj-004' && sortDownvoted[0].downvotes_count === 18, 'Sort: Most Downvoted', 'FleetPulse top with 18 downvotes');

// Most Reviewed
const sortReviewed = filterExploreProjects(mockProjects, { sortBy: 'MOST_REVIEWED' });
testAssert(sortReviewed[0].id === 'proj-003' && sortReviewed[0].valid_reviews_count === 38, 'Sort: Most Reviewed', 'BioSieve top with 38 reviews');

// Highest Rated
const sortRated = filterExploreProjects(mockProjects, { sortBy: 'HIGHEST_RATED' });
testAssert(sortRated[0].id === 'proj-003' && sortRated[0].average_rating === 4.95, 'Sort: Highest Rated', 'BioSieve top with 4.95 rating');


console.log('\n--- 4. COMMUNITY: Search & Filter Tests ---');

// Search Title
const comSearchTitle = filterCommunityPosts(mockCommunityPosts, { search: 'voltage spikes' });
testAssert(comSearchTitle.length === 1 && comSearchTitle[0].id === 'post-101', 'Community Search by Title', 'Found voltage spikes');

// Search Content
const comSearchContent = filterCommunityPosts(mockCommunityPosts, { search: 'plasmid design' });
testAssert(comSearchContent.length === 1 && comSearchContent[0].id === 'post-102', 'Community Search by Content', 'Found plasmid design');

// Search Tags
const comSearchTags = filterCommunityPosts(mockCommunityPosts, { search: 'safety' });
testAssert(comSearchTags.length === 1 && comSearchTags[0].id === 'post-103', 'Community Search by Tags', 'Found safety tag');

// Filter Category
const comCatFilter = filterCommunityPosts(mockCommunityPosts, { category_id: 'cat-biotech' });
testAssert(comCatFilter.length === 1 && comCatFilter[0].id === 'post-102', 'Community Filter by Category', 'Found Biotech resource');

// Filter Post Type
const comTypeFilter = filterCommunityPosts(mockCommunityPosts, { post_type: 'QUESTION' });
testAssert(comTypeFilter.length === 1 && comTypeFilter[0].id === 'post-101', 'Community Filter by Post Type', 'Found 1 Question');


console.log('\n--- 5. COMMUNITY: Sorting Mode Tests ---');

// Latest
const comLatest = filterCommunityPosts(mockCommunityPosts, { sortBy: 'LATEST' });
testAssert(comLatest[0].id === 'post-103', 'Community Sort: Latest', 'Post 103 newest');

// Oldest
const comOldest = filterCommunityPosts(mockCommunityPosts, { sortBy: 'OLDEST' });
testAssert(comOldest[0].id === 'post-101', 'Community Sort: Oldest', 'Post 101 oldest');

// Most Liked
const comLiked = filterCommunityPosts(mockCommunityPosts, { sortBy: 'MOST_LIKED' });
testAssert(comLiked[0].id === 'post-102' && comLiked[0].upvotes_count === 88, 'Community Sort: Most Liked', 'Post 102 top with 88 likes');

// Most Commented
const comCommented = filterCommunityPosts(mockCommunityPosts, { sortBy: 'MOST_COMMENTED' });
testAssert(comCommented[0].id === 'post-103' && comCommented[0].comments_count === 31, 'Community Sort: Most Commented', 'Post 103 top with 31 comments');


console.log('\n================================================================');
console.log(`🏁 PHASE 9 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
