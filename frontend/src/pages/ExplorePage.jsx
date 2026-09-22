import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { AIService } from '../services/aiService';
import { useAuth } from '../context/AuthContext';
import { getCategoryInk } from '../utils/categoryColors';
import { StageBadge, FeaturedDemoBadge } from '../components/StatusBadge';
import { 
  Search, 
  X,
  SlidersHorizontal, 
  ArrowUpRight, 
  Heart, 
  MessageSquare, 
  Sparkles, 
  Clock, 
  PlusCircle, 
  ExternalLink, 
  ChevronDown, 
  RotateCcw, 
  Check, 
  Globe, 
  Radio, 
  Flame, 
  Bookmark, 
  Share2, 
  Cpu, 
  Layers 
} from 'lucide-react';

/**
 * ExplorePage — Complete Innovation Discovery Engine
 * Displays both INNOVEXA Community Projects and verified Global External Discoveries
 * with personalized curation, trend signals, unified filtering, and source transparency.
 */
export default function ExplorePage({ setActiveTab, setSelectedInnoId, exploreFilters, setExploreFilters }) {
  const { currentUser } = useAuth();
  
  // Initialize with local cache for zero-latency, flash-free initial render
  const [communityProjects, setCommunityProjects] = useState(() => StorageService.getInnovations() || []);
  const [externalInnovations, setExternalInnovations] = useState(() => StorageService.getExternalInnovations() || []);
  const [categories, setCategories] = useState(() => StorageService.getCategories() || []);
  const [isLoading, setIsLoading] = useState(false);

  // Selected External Discovery for Detail Modal
  const [selectedExternalItem, setSelectedExternalItem] = useState(null);
  const [hasLikedExternal, setHasLikedExternal] = useState({});

  // Primary Filter State
  const [searchQuery, setSearchQuery] = useState(exploreFilters?.search || '');
  const [contentType, setContentType] = useState('ALL'); // 'ALL' | 'COMMUNITY' | 'EXTERNAL'
  const [selectedCategory, setSelectedCategory] = useState(exploreFilters?.category || 'ALL');
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [selectedProjectType, setSelectedProjectType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  useEffect(() => {
    if (exploreFilters) {
      if (exploreFilters.search !== undefined) setSearchQuery(exploreFilters.search);
      if (exploreFilters.category !== undefined) setSelectedCategory(exploreFilters.category);
    }
  }, [exploreFilters]);

  // Advanced "More Filters" State
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [hasLaunchLink, setHasLaunchLink] = useState(false);
  const [minLikes, setMinLikes] = useState(0);
  const [minReviews, setMinReviews] = useState(0);
  const [timeframe, setTimeframe] = useState('ALL'); // 'ALL' | '24H' | '7D' | '30D' | '90D'

  const moreFiltersRef = useRef(null);

  // Close "More Filters" popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (moreFiltersRef.current && !moreFiltersRef.current.contains(e.target)) {
        setIsMoreFiltersOpen(false);
      }
    };
    if (isMoreFiltersOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isMoreFiltersOpen]);

  const loadData = async (silent = false) => {
    if (!silent && communityProjects.length === 0) setIsLoading(true);
    try {
      const [projRes, extRes, catRes] = await Promise.all([
        SupabaseService.getProjects(),
        SupabaseService.getExternalInnovations(),
        SupabaseService.getCategories()
      ]);
      if (projRes.data && Array.isArray(projRes.data)) {
        setCommunityProjects(projRes.data);
      }
      if (extRes.data && Array.isArray(extRes.data)) {
        setExternalInnovations(extRes.data);
      }
      if (catRes.data && Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      }
    } catch (e) {
      console.warn('Error loading explore data:', e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const handler = () => loadData(true);
    window.addEventListener('innovexa:datachange', handler);
    return () => window.removeEventListener('innovexa:datachange', handler);
  }, []);

  // Compute active advanced filters count
  const activeAdvancedCount = (hasLaunchLink ? 1 : 0) + 
    (minLikes > 0 ? 1 : 0) + 
    (minReviews > 0 ? 1 : 0) + 
    (timeframe !== 'ALL' ? 1 : 0);

  // Count total active filters
  const isAnyFilterActive = searchQuery.trim() !== '' || 
    contentType !== 'ALL' ||
    selectedCategory !== 'ALL' || 
    selectedSource !== 'ALL' ||
    selectedProjectType !== 'ALL' || 
    selectedStatus !== 'ALL' || 
    sortBy !== 'NEWEST' || 
    activeAdvancedCount > 0;

  // Clear all filters handler
  const handleClearAll = () => {
    setSearchQuery('');
    setContentType('ALL');
    setSelectedCategory('ALL');
    setSelectedSource('ALL');
    setSelectedProjectType('ALL');
    setSelectedStatus('ALL');
    setSortBy('NEWEST');
    setHasLaunchLink(false);
    setMinLikes(0);
    setMinReviews(0);
    setTimeframe('ALL');
    setIsMoreFiltersOpen(false);
  };

  // Reset only advanced filters
  const handleResetAdvanced = () => {
    setHasLaunchLink(false);
    setMinLikes(0);
    setMinReviews(0);
    setTimeframe('ALL');
  };

  const handleOpenProject = (id) => {
    if (typeof setSelectedInnoId === 'function') setSelectedInnoId(id);
    if (typeof setActiveTab === 'function') setActiveTab('detail');
  };

  const handleOpenExternal = (item) => {
    setSelectedExternalItem(item);
  };

  const handleLikeExternal = async (e, item) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (!item?.id) return;
    const itemId = item.id;
    const isCurrentlyLiked = Boolean(hasLikedExternal[itemId]);
    const nextLiked = !isCurrentlyLiked;
    
    // 1. Instant optimistic UI update (0ms press latency)
    setHasLikedExternal(prev => ({ ...prev, [itemId]: nextLiked }));
    setExternalInnovations(prev => prev.map(ext => ext.id === itemId ? {
      ...ext,
      likes_count: Math.max(0, (ext.likes_count || 0) + (nextLiked ? 1 : -1))
    } : ext));

    if (selectedExternalItem?.id === itemId) {
      setSelectedExternalItem(prev => prev ? {
        ...prev,
        likes_count: Math.max(0, (prev.likes_count || 0) + (nextLiked ? 1 : -1))
      } : prev);
    }

    try {
      await SupabaseService.likeExternalInnovation(itemId);
      if (nextLiked && typeof showToast === 'function') {
        showToast('Appreciated discovery signal!', 'success');
      }
    } catch (err) {
      console.warn('Error recording appreciation:', err);
    }
  };

  // Extract unique external sources for the filter dropdown
  const availableSources = useMemo(() => {
    return Array.from(new Set(externalInnovations.map(e => e.source_name).filter(Boolean)));
  }, [externalInnovations]);

  // ---------------------------------------------------------------------------
  // FILTERING LOGIC: COMMUNITY PROJECTS (Memoized for instantaneous response)
  // ---------------------------------------------------------------------------
  const filteredCommunity = useMemo(() => {
    if (contentType === 'EXTERNAL') return [];
    const q = searchQuery.toLowerCase().trim();
    const now = Date.now();
    const timeframeMs = timeframe === '24H' ? 24 * 60 * 60 * 1000
      : timeframe === '7D' ? 7 * 24 * 60 * 60 * 1000
      : timeframe === '30D' ? 30 * 24 * 60 * 60 * 1000
      : timeframe === '90D' ? 90 * 24 * 60 * 60 * 1000
      : 0;

    return communityProjects.filter(item => {
      // Search Query
      if (q) {
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

      // Category Filter
      if (selectedCategory !== 'ALL') {
        const matchesCategory = item.category_id === selectedCategory || 
          item.category_name?.toLowerCase() === selectedCategory.toLowerCase() ||
          (Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase() === selectedCategory.toLowerCase()));
        if (!matchesCategory) return false;
      }

      // Source Filter
      if (selectedSource !== 'ALL' && selectedSource !== 'COMMUNITY') {
        return false;
      }

      // Project Type Filter
      if (selectedProjectType !== 'ALL') {
        const itemType = (item.project_type || item.creation_type || '').toLowerCase();
        if (itemType !== selectedProjectType.toLowerCase()) return false;
      }

      // Status Filter
      if (selectedStatus !== 'ALL') {
        const itemStatus = (item.status || '').toLowerCase();
        const itemLaunch = (item.launch_status || '').toLowerCase();
        if (selectedStatus === 'published') {
          const isPub = itemStatus === 'published' || itemStatus === 'live' || itemLaunch === 'published';
          if (!isPub) return false;
        } else if (selectedStatus === 'draft') {
          const isDraft = itemStatus === 'draft' || itemLaunch === 'draft';
          if (!isDraft) return false;
        } else if (selectedStatus === 'under_validation') {
          const isVal = itemStatus === 'under_validation' || itemLaunch === 'validating' || (itemStatus === 'published' && (item.valid_reviews_count || 0) < (item.validation_target || 10));
          if (!isVal) return false;
        }
      }

      // Advanced Filter: Has Launch Link
      if (hasLaunchLink) {
        const hasLink = Boolean(item.launch_url || item.demo_url || item.has_live_product);
        if (!hasLink) return false;
      }

      // Advanced Filter: Minimum Likes
      if (minLikes > 0 && (item.upvotes_count || 0) < minLikes) return false;

      // Advanced Filter: Minimum Reviews
      if (minReviews > 0 && (item.valid_reviews_count || 0) < minReviews) return false;

      // Advanced Filter: Timeframe
      if (timeframeMs > 0) {
        const createdDate = new Date(item.created_at || 0).getTime();
        if (now - createdDate > timeframeMs) return false;
      }

      return true;
    });
  }, [communityProjects, contentType, searchQuery, selectedCategory, selectedSource, selectedProjectType, selectedStatus, hasLaunchLink, minLikes, minReviews, timeframe]);

  // ---------------------------------------------------------------------------
  // FILTERING LOGIC: EXTERNAL DISCOVERIES (Memoized for instantaneous response)
  // ---------------------------------------------------------------------------
  const filteredExternal = useMemo(() => {
    if (contentType === 'COMMUNITY') return [];
    const q = searchQuery.toLowerCase().trim();
    const now = Date.now();
    const timeframeMs = timeframe === '24H' ? 24 * 60 * 60 * 1000
      : timeframe === '7D' ? 7 * 24 * 60 * 60 * 1000
      : timeframe === '30D' ? 30 * 24 * 60 * 60 * 1000
      : timeframe === '90D' ? 90 * 24 * 60 * 60 * 1000
      : 0;

    const catObj = selectedCategory !== 'ALL' ? categories.find(c => c.id === selectedCategory) : null;
    const targetCatName = catObj ? catObj.name.toLowerCase() : selectedCategory.toLowerCase();

    return externalInnovations.filter(item => {
      // Search Query
      if (q) {
        const title = (item.title || '').toLowerCase();
        const summary = (item.summary || item.ai_summary || '').toLowerCase();
        const cat = (item.category || '').toLowerCase();
        const src = (item.source_name || '').toLowerCase();
        const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : '';

        const matchesSearch = title.includes(q) || 
          summary.includes(q) || 
          cat.includes(q) || 
          src.includes(q) || 
          tags.includes(q);

        if (!matchesSearch) return false;
      }

      // Category Filter
      if (selectedCategory !== 'ALL') {
        const itemCat = (item.category || '').toLowerCase();
        const tags = Array.isArray(item.tags) ? item.tags.map(t => t.toLowerCase()) : [];

        const matchesCat = itemCat.includes(targetCatName) || 
          targetCatName.includes(itemCat) || 
          tags.some(t => t.includes(targetCatName) || targetCatName.includes(t));
        if (!matchesCat) return false;
      }

      // Source Filter
      if (selectedSource !== 'ALL') {
        if (selectedSource === 'COMMUNITY') return false;
        if (selectedSource !== 'EXTERNAL' && item.source_name !== selectedSource) return false;
      }

      // Advanced Filter: Minimum Likes
      if (minLikes > 0 && (item.likes_count || 0) < minLikes) return false;

      // Advanced Filter: Timeframe
      if (timeframeMs > 0) {
        const dateVal = new Date(item.published_at || item.discovered_at || 0).getTime();
        if (now - dateVal > timeframeMs) return false;
      }

      return true;
    });
  }, [externalInnovations, contentType, searchQuery, selectedCategory, selectedSource, minLikes, timeframe, categories]);

  // ---------------------------------------------------------------------------
  // SORTING LOGIC: Memoized for instant updates
  // ---------------------------------------------------------------------------
  const sortedCommunity = useMemo(() => {
    return [...filteredCommunity].sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return new Date(b.created_at || b.published_at || 0).getTime() - new Date(a.created_at || a.published_at || 0).getTime();
      }
      if (sortBy === 'OLDEST') {
        return new Date(a.created_at || a.published_at || 0).getTime() - new Date(b.created_at || b.published_at || 0).getTime();
      }
      if (sortBy === 'MOST_LIKED') {
        return (b.upvotes_count || b.likes_count || 0) - (a.upvotes_count || a.likes_count || 0);
      }
      if (sortBy === 'MOST_REVIEWED') {
        return (b.valid_reviews_count || 0) - (a.valid_reviews_count || 0);
      }
      if (sortBy === 'TRENDING') {
        const scoreA = (a.upvotes_count || a.likes_count || 0) * 2 + (a.valid_reviews_count || 0) * 3 + (a.views_count || 0);
        const scoreB = (b.upvotes_count || b.likes_count || 0) * 2 + (b.valid_reviews_count || 0) * 3 + (b.views_count || 0);
        return scoreB - scoreA;
      }
      if (sortBy === 'ALPHA_ASC') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'ALPHA_DESC') {
        return (b.title || '').localeCompare(a.title || '');
      }
      return 0;
    });
  }, [filteredCommunity, sortBy]);

  const sortedExternal = useMemo(() => {
    return [...filteredExternal].sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return new Date(b.published_at || b.discovered_at || 0).getTime() - new Date(a.published_at || a.discovered_at || 0).getTime();
      }
      if (sortBy === 'OLDEST') {
        return new Date(a.published_at || a.discovered_at || 0).getTime() - new Date(b.published_at || b.discovered_at || 0).getTime();
      }
      if (sortBy === 'MOST_LIKED') {
        return (b.likes_count || 0) - (a.likes_count || 0);
      }
      if (sortBy === 'ALPHA_ASC') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'ALPHA_DESC') {
        return (b.title || '').localeCompare(a.title || '');
      }
      return 0;
    });
  }, [filteredExternal, sortBy]);

  const totalResultsCount = sortedCommunity.length + sortedExternal.length;
  const totalDatabaseCount = communityProjects.length + externalInnovations.length;

  // Personalized Curated List memoized
  const curatedList = useMemo(() => {
    if (isAnyFilterActive || !currentUser || (communityProjects.length === 0 && externalInnovations.length === 0)) {
      return [];
    }
    const userInterests = (currentUser.interests || []).map(i => String(i).toLowerCase());
    if (userInterests.length === 0) return [];

    const matchingCommunity = communityProjects.filter(p => {
      if (p.user_id === currentUser.id) return false;
      const cat = (p.category_name || '').toLowerCase();
      return userInterests.some(i => cat.includes(i) || i.includes(cat));
    });

    const matchingExternal = externalInnovations.filter(e => {
      const cat = (e.category || '').toLowerCase();
      const tags = (e.tags || []).map(t => t.toLowerCase());
      return userInterests.some(i => cat.includes(i) || tags.some(t => t.includes(i)));
    });

    return [...matchingCommunity.slice(0, 2), ...matchingExternal.slice(0, 2)];
  }, [isAnyFilterActive, currentUser, communityProjects, externalInnovations]);

  // Find category display name for active chip
  const activeCategoryObj = categories.find(c => c.id === selectedCategory);
  const activeCategoryName = activeCategoryObj ? activeCategoryObj.name : selectedCategory;

  // Labels
  const contentTypeLabels = {
    'ALL': 'All Innovations',
    'COMMUNITY': 'Community Projects',
    'EXTERNAL': 'External Discoveries'
  };

  const sortLabels = {
    'NEWEST': 'Newest First',
    'OLDEST': 'Oldest First',
    'TRENDING': 'Trending Velocity',
    'MOST_LIKED': 'Most Appreciated',
    'MOST_REVIEWED': 'Most Reviewed',
    'ALPHA_ASC': 'A–Z',
    'ALPHA_DESC': 'Z–A'
  };

  const timeframeLabels = {
    '24H': 'Past 24 Hours',
    '7D': 'Past 7 Days',
    '30D': 'Past 30 Days',
    '90D': 'Past 90 Days'
  };

  return (
    <div className="workspace-container">
      {/* 1. EDITORIAL HERO HEADER */}
      <section style={{ marginBottom: '3rem' }}>
        <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Radio size={14} className="animate-pulse" /> INNOVATION DISCOVERY ENGINE
        </div>

        <div style={{ lineHeight: 0.98, marginBottom: '1.75rem' }}>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3rem, 6.5vw, 5.2rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
            EXPLORE
          </div>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3rem, 6.5vw, 5.2rem)', fontWeight: 800, color: 'var(--coral)', fontStyle: 'italic', margin: '0.2rem 0' }}>
            FRONTIER HORIZONS.
          </div>
          <div className="editorial-sans-bold" style={{ fontSize: 'clamp(1.6rem, 3.4vw, 2.8rem)', color: 'var(--text-secondary)' }}>
            COMMUNITY SPECIMENS &
          </div>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.8rem, 6vw, 4.8rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
            GLOBAL BREAKTHROUGHS.
          </div>
        </div>

        <p className="editorial-lead" style={{ maxWidth: '640px', color: 'var(--text-secondary)' }}>
          Discover user-crafted hypotheses undergoing active peer validation alongside real-time frontier innovations curated from leading global research institutes, labs, and technology wires.
        </p>
      </section>

      {/* 2. UNIFIED SEARCH + FILTER + SORT TOOLBAR */}
      <div 
        className="editorial-card" 
        style={{ 
          padding: '1.5rem', 
          marginBottom: '1.5rem', 
          backgroundColor: 'var(--bg-white)', 
          borderLeft: '4px solid var(--coral)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Top Search Bar with Icon and Clear Button */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search 
              size={18} 
              color="var(--text-secondary)" 
              style={{ position: 'absolute', left: '1.15rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search across community projects, external research breakthroughs, AI tags, creators..."
              className="form-input"
              style={{ 
                paddingLeft: '2.85rem', 
                paddingRight: searchQuery ? '2.75rem' : '1rem',
                borderRadius: 'var(--radius-sm)',
                height: '46px',
                fontSize: '0.95rem',
                backgroundColor: 'var(--bg-ivory)',
                borderColor: 'var(--border-subtle)'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                title="Clear search"
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Domain Filter Buttons */}
          <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.35rem', scrollbarWidth: 'none', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`btn btn-sm ${selectedCategory === 'ALL' ? 'btn-coral' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)', padding: '0.3rem 0.85rem', fontSize: '0.78rem', whiteSpace: 'nowrap', fontWeight: 600 }}
            >
              All Domains ({totalDatabaseCount})
            </button>
            {categories.map(cat => {
              const isSelected = selectedCategory === cat.id || selectedCategory.toLowerCase() === cat.name.toLowerCase();
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? 'ALL' : cat.id)}
                  className={`btn btn-sm ${isSelected ? 'btn-coral' : 'btn-secondary'}`}
                  style={{ borderRadius: 'var(--radius-full)', padding: '0.3rem 0.85rem', fontSize: '0.78rem', whiteSpace: 'nowrap', fontWeight: isSelected ? 700 : 500 }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Primary Filters & Sorting Horizontal Toolbar */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              gap: '0.75rem',
              justifyContent: 'space-between'
            }}
          >
            {/* Left Filter Dropdowns */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', flex: 1 }}>
              
              {/* Content Type Filter */}
              <div style={{ position: 'relative', minWidth: '160px' }}>
                <select
                  value={contentType}
                  onChange={e => setContentType(e.target.value)}
                  className="form-select"
                  style={{
                    height: '40px',
                    fontSize: '0.85rem',
                    padding: '0.45rem 2rem 0.45rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: contentType !== 'ALL' ? 'var(--bg-cream)' : 'var(--bg-white)',
                    borderColor: contentType !== 'ALL' ? 'var(--coral)' : 'var(--border-medium)',
                    fontWeight: contentType !== 'ALL' ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">All Discoveries ({totalDatabaseCount})</option>
                  <option value="COMMUNITY">Community ({communityProjects.length})</option>
                  <option value="EXTERNAL">External Signals ({externalInnovations.length})</option>
                </select>
              </div>

              {/* Category Dropdown */}
              <div style={{ position: 'relative', minWidth: '155px' }}>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="form-select"
                  style={{
                    height: '40px',
                    fontSize: '0.85rem',
                    padding: '0.45rem 2rem 0.45rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: selectedCategory !== 'ALL' ? 'var(--bg-cream)' : 'var(--bg-white)',
                    borderColor: selectedCategory !== 'ALL' ? 'var(--coral)' : 'var(--border-medium)',
                    fontWeight: selectedCategory !== 'ALL' ? 600 : 500,
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="Robotics">Robotics</option>
                  <option value="Space Technology">Space Technology</option>
                  <option value="Sustainability">Sustainability</option>
                  <option value="FinTech">FinTech</option>
                </select>
              </div>

              {/* Source Dropdown */}
              <div style={{ position: 'relative', minWidth: '150px' }}>
                <select
                  value={selectedSource}
                  onChange={e => setSelectedSource(e.target.value)}
                  className="form-select"
                  style={{
                    height: '40px',
                    fontSize: '0.85rem',
                    padding: '0.45rem 2rem 0.45rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: selectedSource !== 'ALL' ? 'var(--bg-cream)' : 'var(--bg-white)',
                    borderColor: selectedSource !== 'ALL' ? 'var(--coral)' : 'var(--border-medium)',
                    fontWeight: selectedSource !== 'ALL' ? 600 : 500,
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">All Sources</option>
                  <option value="COMMUNITY">INNOVEXA Community</option>
                  <option value="EXTERNAL">External Technology Wires</option>
                  {availableSources.map(src => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Right Side: Sort Dropdown & More Filters Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              
              {/* Sort Dropdown */}
              <div style={{ position: 'relative', minWidth: '160px' }}>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="form-select"
                  style={{
                    height: '40px',
                    fontSize: '0.85rem',
                    padding: '0.45rem 2rem 0.45rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: sortBy !== 'NEWEST' ? 'var(--bg-cream)' : 'var(--bg-white)',
                    borderColor: sortBy !== 'NEWEST' ? 'var(--coral)' : 'var(--border-medium)',
                    fontWeight: sortBy !== 'NEWEST' ? 600 : 500,
                    cursor: 'pointer'
                  }}
                >
                  <option value="NEWEST">Sort: Newest First</option>
                  <option value="TRENDING">Sort: Trending Velocity</option>
                  <option value="MOST_LIKED">Sort: Most Appreciated</option>
                  <option value="MOST_REVIEWED">Sort: Most Reviewed</option>
                  <option value="OLDEST">Sort: Oldest First</option>
                  <option value="ALPHA_ASC">Sort: A–Z</option>
                </select>
              </div>

              {/* More Filters Toggle Button & Popover */}
              <div style={{ position: 'relative' }} ref={moreFiltersRef}>
                <button
                  type="button"
                  onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
                  className={`btn ${activeAdvancedCount > 0 ? 'btn-coral' : 'btn-secondary'} btn-sm`}
                  style={{
                    height: '40px',
                    padding: '0 1rem',
                    gap: '0.45rem',
                    fontWeight: 600,
                    fontSize: '0.84rem'
                  }}
                >
                  <SlidersHorizontal size={14} />
                  <span>More Filters</span>
                  {activeAdvancedCount > 0 && (
                    <span 
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: 'var(--coral)',
                        borderRadius: 'var(--radius-full)',
                        padding: '1px 6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        marginLeft: '0.2rem'
                      }}
                    >
                      {activeAdvancedCount}
                    </span>
                  )}
                  <ChevronDown size={14} style={{ transform: isMoreFiltersOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                </button>

                {/* More Filters Dropdown Popover */}
                {isMoreFiltersOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      width: '320px',
                      backgroundColor: 'var(--bg-white)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-modal)',
                      border: '1px solid var(--border-medium)',
                      padding: '1.25rem',
                      zIndex: 100,
                      animation: 'fadeIn 0.15s ease-out'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '0.5rem' }}>
                      <div className="editorial-mono-label" style={{ fontSize: '0.75rem', color: 'var(--coral)' }}>
                        ⚙ ADVANCED MATRIX FILTERS
                      </div>
                      {activeAdvancedCount > 0 && (
                        <button
                          type="button"
                          onClick={handleResetAdvanced}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.72rem', padding: '2px 6px', color: 'var(--text-secondary)' }}
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Has Launch Link Checkbox */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                        <input
                          type="checkbox"
                          checked={hasLaunchLink}
                          onChange={e => setHasLaunchLink(e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--coral)', cursor: 'pointer' }}
                        />
                        <span>Has Live Product / Demo Link</span>
                      </label>

                      {/* Minimum Likes Select */}
                      <div>
                        <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.68rem' }}>
                          MINIMUM LIKES / UPVOTES
                        </label>
                        <select
                          value={minLikes}
                          onChange={e => setMinLikes(Number(e.target.value))}
                          className="form-select"
                          style={{ height: '34px', fontSize: '0.82rem', padding: '0.25rem 0.65rem' }}
                        >
                          <option value={0}>Any Likes</option>
                          <option value={5}>5+ Likes</option>
                          <option value={15}>15+ Likes</option>
                          <option value={30}>30+ Likes</option>
                        </select>
                      </div>

                      {/* Timeframe Select */}
                      <div>
                        <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.68rem' }}>
                          PUBLICATION / DISCOVERY TIMEFRAME
                        </label>
                        <select
                          value={timeframe}
                          onChange={e => setTimeframe(e.target.value)}
                          className="form-select"
                          style={{ height: '34px', fontSize: '0.82rem', padding: '0.25rem 0.65rem' }}
                        >
                          <option value="ALL">All Time</option>
                          <option value="24H">Past 24 Hours</option>
                          <option value="7D">Past 7 Days</option>
                          <option value="30D">Past 30 Days</option>
                          <option value="90D">Past 90 Days</option>
                        </select>
                      </div>

                      {/* Apply Actions */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-hairline)', paddingTop: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={() => setIsMoreFiltersOpen(false)}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1 }}
                        >
                          Apply Filter Matrix
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* 3. ACTIVE FILTER CHIPS & RESULT COUNTS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
        
        {/* Results Counter */}
        <div className="editorial-mono-label" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
          {totalResultsCount === totalDatabaseCount ? (
            <span>{totalDatabaseCount} DISCOVERIES AVAILABLE ({communityProjects.length} COMMUNITY • {externalInnovations.length} EXTERNAL)</span>
          ) : (
            <span>
              SHOWING <strong style={{ color: 'var(--coral)' }}>{totalResultsCount}</strong> MATCHING DISCOVERIES ({sortedCommunity.length} COMMUNITY • {sortedExternal.length} EXTERNAL)
            </span>
          )}
        </div>

        {/* Active Filter Chips */}
        {isAnyFilterActive && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
            
            {/* Content Type Chip */}
            {contentType !== 'ALL' && (
              <span 
                className="category-tag" 
                style={{ backgroundColor: 'var(--bg-cream)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', cursor: 'pointer' }}
                onClick={() => setContentType('ALL')}
                title="Reset content type"
              >
                Type: {contentTypeLabels[contentType]} <X size={12} style={{ marginLeft: '2px' }} />
              </span>
            )}

            {/* Search Chip */}
            {searchQuery.trim() && (
              <span 
                className="category-tag" 
                style={{ backgroundColor: 'var(--bg-cream)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', cursor: 'pointer' }}
                onClick={() => setSearchQuery('')}
                title="Remove search query"
              >
                Search: "{searchQuery}" <X size={12} style={{ marginLeft: '2px' }} />
              </span>
            )}

            {/* Category Chip */}
            {selectedCategory !== 'ALL' && (
              <span 
                className="category-tag" 
                style={{ backgroundColor: 'var(--bg-cream)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', cursor: 'pointer' }}
                onClick={() => setSelectedCategory('ALL')}
                title="Clear category filter"
              >
                Category: {activeCategoryName} <X size={12} style={{ marginLeft: '2px' }} />
              </span>
            )}

            {/* Source Chip */}
            {selectedSource !== 'ALL' && (
              <span 
                className="category-tag" 
                style={{ backgroundColor: 'var(--bg-cream)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', cursor: 'pointer' }}
                onClick={() => setSelectedSource('ALL')}
                title="Clear source filter"
              >
                Source: {selectedSource} <X size={12} style={{ marginLeft: '2px' }} />
              </span>
            )}

            {/* Sort Chip */}
            {sortBy !== 'NEWEST' && (
              <span 
                className="category-tag" 
                style={{ backgroundColor: 'var(--bg-cream)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', cursor: 'pointer' }}
                onClick={() => setSortBy('NEWEST')}
                title="Reset sort"
              >
                Sort: {sortLabels[sortBy] || sortBy} <X size={12} style={{ marginLeft: '2px' }} />
              </span>
            )}

            {/* Clear All Button */}
            <button
              type="button"
              onClick={handleClearAll}
              className="btn btn-ghost btn-sm"
              style={{
                color: 'var(--coral)',
                fontWeight: 700,
                fontSize: '0.78rem',
                padding: '0.2rem 0.5rem',
                gap: '0.25rem'
              }}
            >
              <RotateCcw size={12} /> Clear All
            </button>

          </div>
        )}

      </div>

      {/* ================= 4. CURATED FOR YOU (AI PERSONALIZED HYBRID DISCOVERY) ================= */}
      {curatedList.length > 0 && (
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <Sparkles size={18} color="var(--coral)" />
              <span className="editorial-mono-label" style={{ color: 'var(--coral)', fontSize: '0.8rem' }}>
                ✦ CURATED FOR YOU / PERSONALIZED DISCOVERY MATRIX
              </span>
            </div>
            <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Synthesized from your validator profile interests & focus domains
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {curatedList.map(item => {
              const isExt = Boolean(item.is_external || item.source_name);
              const ink = getCategoryInk(item.category_id || 'cat_ai', item.category_name || item.category);

              return (
                <div
                  key={item.id}
                  onClick={() => isExt ? handleOpenExternal(item) : handleOpenProject(item.id)}
                  className="editorial-card hover-lift"
                  style={{
                    padding: '1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderLeft: `4px solid ${isExt ? 'var(--teal)' : 'var(--coral)'}`,
                    backgroundColor: 'var(--bg-white)',
                    position: 'relative'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                      <span className={`category-tag ${ink.tagClass}`} style={{ fontSize: '0.65rem' }}>
                        {item.category_name || item.category || 'Technology'}
                      </span>
                      <span
                        className="mono"
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          color: isExt ? 'var(--teal)' : 'var(--coral)',
                          backgroundColor: isExt ? 'rgba(88, 184, 173, 0.1)' : 'rgba(231, 111, 130, 0.1)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-full)'
                        }}
                      >
                        {isExt ? 'GLOBAL SIGNAL' : 'COMMUNITY SPECIMEN'}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.15rem', marginBottom: '0.35rem', lineHeight: 1.25 }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '0.75rem' }}>
                      {item.summary || item.short_description || item.description}
                    </p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', borderTop: '1px solid var(--border-hairline)', paddingTop: '0.75rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        {isExt ? `Source: ${item.source_name}` : `Created by ${item.creator_name || 'Community Innovator'}`}
                      </span>
                      <span style={{ color: isExt ? 'var(--teal)' : 'var(--coral)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        Inspect <ArrowUpRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= 5. EMPTY SEARCH / FILTER STATE ================= */}
      {totalResultsCount === 0 && (
        <div
          className="editorial-card"
          style={{
            padding: '4.5rem 3rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-white)',
            borderLeft: '4px solid var(--periwinkle)'
          }}
        >
          <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '1.25rem' }}>
            ✦ DISCOVERY RESULTS
          </div>

          <div style={{ lineHeight: 0.98, marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.5rem, 5.5vw, 4.2rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
              NO MATCHING
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.5rem, 5.5vw, 4.2rem)', fontWeight: 800, color: 'var(--coral)', fontStyle: 'italic', margin: '0.2rem 0' }}>
              INNOVATIONS
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.5rem, 5.5vw, 4.2rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
              DISCOVERED.
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '540px', margin: '0 auto 2rem auto', lineHeight: 1.5 }}>
            No specimens or external signals matched your current search keywords and filter criteria. Try adjusting your query or resetting all filters.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleClearAll}
              className="btn btn-coral btn-lg"
              style={{ padding: '0.85rem 2rem', gap: '0.5rem' }}
            >
              <RotateCcw size={16} /> Reset All Filters
            </button>
            <button
              onClick={() => setActiveTab('submit')}
              className="btn btn-secondary btn-lg"
              style={{ padding: '0.85rem 2rem', gap: '0.5rem' }}
            >
              <PlusCircle size={16} /> Submit Community Specimen ↗
            </button>
          </div>
        </div>
      )}

      {/* ================= 6. COMMUNITY INNOVATIONS SECTION ================= */}
      {sortedCommunity.length > 0 && (
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.25rem' }}>
                COMMUNITY INNOVATIONS
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                Peer-Validated Community Hypotheses
              </h2>
            </div>
            <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {sortedCommunity.length} COMMUNITY SPECIMEN{sortedCommunity.length === 1 ? '' : 'S'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
            {sortedCommunity.map((item, idx) => {
              const ink = getCategoryInk(item.category_id, item.category_name);
              const isLargeSpan = idx === 0 && sortedCommunity.length > 2 && !isAnyFilterActive;

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenProject(item.id)}
                  className="editorial-card hover-lift"
                  style={{
                    gridColumn: isLargeSpan ? 'span 2' : 'span 1',
                    padding: '2rem',
                    borderLeft: `4px solid ${ink.hex || 'var(--coral)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: 'var(--bg-white)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className={`category-tag ${ink.tagClass}`}>
                          {item.category_name || 'Technology'}
                        </span>
                        <StageBadge stage={item.project_stage || (item.creation_type === 'PRODUCT' ? 'prototype' : 'idea')} />
                        {(item.is_demo || item.is_featured_example) && (
                          <FeaturedDemoBadge type={item.demo_project_type} label={item.demo_badge_label} />
                        )}
                      </div>
                      <span className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--coral)', fontWeight: 700 }}>
                        COMMUNITY SPECIMEN
                      </span>
                    </div>

                    <h3 style={{ fontSize: isLargeSpan ? '1.75rem' : '1.35rem', marginBottom: '0.65rem', lineHeight: 1.15 }}>
                      {item.title}
                    </h3>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.55, marginBottom: '1.5rem' }}>
                      {item.short_description || item.description}
                    </p>
                  </div>

                  <div>
                    <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      Created by <strong style={{ color: 'var(--text-primary)' }}>{item.creator_name || 'Community Innovator'}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Heart size={13} color="var(--coral)" /> {item.upvotes_count || 0}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <MessageSquare size={13} color="var(--periwinkle)" /> {item.valid_reviews_count || 0} reviews
                        </span>
                        {Boolean(item.launch_url || item.demo_url) && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--teal)' }} title="Has live link">
                            <ExternalLink size={12} /> Live
                          </span>
                        )}
                      </div>

                      <span className="btn btn-ghost btn-sm" style={{ color: 'var(--coral)', fontWeight: 700, padding: 0 }}>
                        Inspect Specification <ArrowUpRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= 7. GLOBAL INNOVATION SIGNALS (DISCOVERED INNOVATIONS) ================= */}
      {sortedExternal.length > 0 && (
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div className="editorial-mono-label" style={{ color: 'var(--teal)', marginBottom: '0.25rem' }}>
                GLOBAL INNOVATION SIGNALS
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                Discovered Breakthroughs & Frontier Research
              </h2>
            </div>
            <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {sortedExternal.length} EXTERNAL DISCOVERY SIGNALS
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
            {sortedExternal.map((item, idx) => {
              const isLargeSpan = idx === 0 && sortedExternal.length > 2 && !isAnyFilterActive;
              const isLiked = Boolean(hasLikedExternal[item.id]);

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenExternal(item)}
                  className="editorial-card hover-lift"
                  style={{
                    gridColumn: isLargeSpan ? 'span 2' : 'span 1',
                    padding: '2rem',
                    borderLeft: '4px solid var(--teal)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: 'var(--bg-white)',
                    position: 'relative'
                  }}
                >
                  <div>
                    {/* Header Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span 
                          className="category-tag"
                          style={{
                            backgroundColor: 'rgba(88, 184, 173, 0.12)',
                            color: 'var(--teal)',
                            borderColor: 'rgba(88, 184, 173, 0.3)',
                            fontWeight: 700
                          }}
                        >
                          {item.category || 'Technology'}
                        </span>
                        <span 
                          className="mono" 
                          style={{ 
                            fontSize: '0.68rem', 
                            color: 'var(--text-secondary)',
                            backgroundColor: 'var(--bg-cream)',
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          Source: {item.source_name}
                        </span>
                      </div>

                      <span 
                        className="editorial-mono-label" 
                        style={{ 
                          fontSize: '0.68rem', 
                          color: 'var(--teal)', 
                          fontWeight: 800,
                          backgroundColor: 'rgba(88, 184, 173, 0.08)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        🌐 GLOBAL DISCOVERY
                      </span>
                    </div>

                    {/* Title */}
                    <h3 style={{ fontSize: isLargeSpan ? '1.75rem' : '1.35rem', marginBottom: '0.65rem', lineHeight: 1.2 }}>
                      {item.title}
                    </h3>

                    {/* AI Summary */}
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.55, marginBottom: '1.25rem' }}>
                      {item.summary || item.ai_summary}
                    </p>

                    {/* AI Tags */}
                    {Array.isArray(item.tags) && item.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.5rem' }}>
                        {item.tags.slice(0, 4).map(tag => (
                          <span 
                            key={tag}
                            className="mono"
                            style={{
                              fontSize: '0.7rem',
                              backgroundColor: 'var(--bg-cream)',
                              color: 'var(--text-secondary)',
                              padding: '2px 7px',
                              borderRadius: 'var(--radius-sm)'
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    {/* Bottom Metadata & Direct Original Link */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        <button
                          type="button"
                          onClick={(e) => handleLikeExternal(e, item)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: isLiked ? 'var(--coral)' : 'var(--text-secondary)',
                            fontWeight: isLiked ? 700 : 500
                          }}
                          title="Appreciate discovery signal"
                        >
                          <Heart size={14} fill={isLiked ? 'var(--coral)' : 'none'} color={isLiked ? 'var(--coral)' : 'currentColor'} /> 
                          {item.likes_count || 0}
                        </button>

                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem' }}>
                          <Clock size={12} /> {new Date(item.published_at || item.discovered_at).toLocaleDateString()}
                        </span>
                      </div>

                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="btn btn-secondary btn-sm"
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.35rem 0.75rem',
                          color: 'var(--teal)',
                          borderColor: 'var(--teal)',
                          fontWeight: 700,
                          gap: '0.35rem'
                        }}
                      >
                        Read Original <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= 8. EXTERNAL DISCOVERY DETAIL MODAL ================= */}
      {selectedExternalItem && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 20, 24, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setSelectedExternalItem(null)}
        >
          <div 
            className="editorial-card"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-white)',
              padding: '2.5rem',
              borderLeft: '5px solid var(--teal)',
              position: 'relative',
              boxShadow: 'var(--shadow-modal)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedExternalItem(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: '6px',
                borderRadius: '50%'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <X size={20} />
            </button>

            {/* Modal Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <span className="editorial-mono-label" style={{ color: 'var(--teal)', fontSize: '0.74rem' }}>
                🌐 GLOBAL INNOVATION SIGNAL
              </span>
              <span className="category-tag" style={{ backgroundColor: 'rgba(88, 184, 173, 0.12)', color: 'var(--teal)' }}>
                {selectedExternalItem.category || 'Technology'}
              </span>
            </div>

            {/* Title */}
            <h2 style={{ fontSize: '1.85rem', lineHeight: 1.2, marginBottom: '1.25rem' }}>
              {selectedExternalItem.title}
            </h2>

            {/* Executive Synthesis Summary */}
            <div 
              style={{
                backgroundColor: 'var(--bg-cream)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.5rem',
                borderLeft: '3px solid var(--periwinkle)'
              }}
            >
              <div className="editorial-mono-label" style={{ fontSize: '0.7rem', color: 'var(--periwinkle)', marginBottom: '0.5rem' }}>
                ✦ EXECUTIVE SYNTHESIS SUMMARY
              </div>
              <p style={{ fontSize: '1.02rem', lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>
                {selectedExternalItem.summary || selectedExternalItem.ai_summary}
              </p>
            </div>

            {/* Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
              <div style={{ backgroundColor: 'var(--bg-ivory)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div className="editorial-mono-label" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                  ORIGINAL SOURCE
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {selectedExternalItem.source_name}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-ivory)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div className="editorial-mono-label" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                  PUBLISHED DATE
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  {new Date(selectedExternalItem.published_at || selectedExternalItem.discovered_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-ivory)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div className="editorial-mono-label" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                  COMMUNITY APPRECIATION
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--coral)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Heart size={14} fill="var(--coral)" /> {selectedExternalItem.likes_count || 0} endorsements
                </div>
              </div>
            </div>

            {/* Tags */}
            {Array.isArray(selectedExternalItem.tags) && selectedExternalItem.tags.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  AI TOPIC TAXONOMY
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {selectedExternalItem.tags.map(tag => (
                    <span 
                      key={tag}
                      className="category-tag"
                      style={{ backgroundColor: 'var(--bg-white)', borderColor: 'var(--border-medium)' }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <button
                type="button"
                onClick={(e) => handleLikeExternal(e, selectedExternalItem)}
                className="btn btn-secondary btn-md"
                style={{ gap: '0.45rem' }}
              >
                <Heart size={16} fill={hasLikedExternal[selectedExternalItem.id] ? 'var(--coral)' : 'none'} color={hasLikedExternal[selectedExternalItem.id] ? 'var(--coral)' : 'currentColor'} />
                Appreciate Signal
              </button>

              <a
                href={selectedExternalItem.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-coral btn-md"
                style={{ padding: '0.75rem 1.75rem', gap: '0.5rem' }}
              >
                Read Full Paper / Article at Source <ExternalLink size={16} />
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
