import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { INITIAL_FEATURED_DEMOS } from '../services/seedData';
import { useAuth } from '../context/AuthContext';
import { getCategoryInk, BRAND_COLORS } from '../utils/categoryColors';
import StatusBadge, { StageBadge, FeaturedDemoBadge } from '../components/StatusBadge';
import CountUp from '../components/CountUp';
import InnovationCore from '../components/three/InnovationCore';
import { 
  Search,
  ArrowUpRight, 
  ArrowRight,
  PlusCircle, 
  Compass, 
  CheckSquare, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Layers,
  Heart,
  MessageSquare,
  Rocket,
  Globe,
  ExternalLink,
  BookOpen,
  Palette,
  FolderKanban,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
  X,
  Check,
  Tag
} from 'lucide-react';

/**
 * DashboardPage — Personalized Editorial Dashboard
 * Renders real user metrics starting at 0 and curated featured demo projects for instant exploration.
 */
export default function DashboardPage({ setActiveTab, setSelectedInnoId, setSelectedAssignmentId, setExploreFilters }) {
  const { currentUser, setIsCommandPaletteOpen } = useAuth();
  const [allInnovations, setAllInnovations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);

  // Dashboard Filter & Sort Controls State
  const [selectedProjectType, setSelectedProjectType] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [hasLaunchLink, setHasLaunchLink] = useState(false);
  const [minLikes, setMinLikes] = useState(0);
  const [minReviews, setMinReviews] = useState(0);
  const [timeframe, setTimeframe] = useState('ALL');

  const filtersPopoverRef = useRef(null);

  // Close filters popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (filtersPopoverRef.current && !filtersPopoverRef.current.contains(e.target)) {
        setIsFiltersOpen(false);
      }
    };
    if (isFiltersOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isFiltersOpen]);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      const [allRes, userRes, catRes] = await Promise.all([
        SupabaseService.getProjects(),
        SupabaseService.getUserProjects(currentUser.id),
        SupabaseService.getCategories()
      ]);

      const innos = allRes.data || [];
      setAllInnovations(innos);

      const cats = catRes.data || [];
      setCategories(cats);

      const userProjects = userRes.data || [];
      setMyProjects(userProjects);

      const userReviews = StorageService.getReviews().filter(r => r.reviewer_id === currentUser.id);
      setMyReviews(userReviews);

      const userAssignments = StorageService.getAssignmentsForUser(currentUser.id);
      setMyAssignments(userAssignments);
    } catch (e) {
      console.warn('Dashboard load error:', e);
    }
  };

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener('innovexa:datachange', handler);
    return () => window.removeEventListener('innovexa:datachange', handler);
  }, [currentUser]);

  // Compute active filter count
  const activeFilterCount = (selectedProjectType !== 'ALL' ? 1 : 0) + 
    (selectedCategory !== 'ALL' ? 1 : 0) + 
    (selectedStatus !== 'ALL' ? 1 : 0) + 
    (sortBy !== 'NEWEST' ? 1 : 0) + 
    (hasLaunchLink ? 1 : 0) + 
    (minLikes > 0 ? 1 : 0) + 
    (minReviews > 0 ? 1 : 0) + 
    (timeframe !== 'ALL' ? 1 : 0);

  const handleClearAllFilters = () => {
    setSelectedProjectType('ALL');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSortBy('NEWEST');
    setHasLaunchLink(false);
    setMinLikes(0);
    setMinReviews(0);
    setTimeframe('ALL');
    setIsFiltersOpen(false);
  };

  const handleApplyToExplore = () => {
    if (setExploreFilters) {
      setExploreFilters({
        search: '',
        category: selectedCategory,
        project_type: selectedProjectType,
        status: selectedStatus,
        sortBy: sortBy,
        hasLaunchLink,
        minLikes,
        minReviews,
        timeframe
      });
    }
    setActiveTab('explore');
    setIsFiltersOpen(false);
  };

  const activeProject = myProjects.length > 0 ? myProjects[0] : null;
  const target = activeProject?.validation_target || 10;
  const currentReviews = activeProject?.valid_reviews_count || 0;
  const progressPercent = Math.min(100, Math.round((currentReviews / target) * 100));

  const otherInnovations = allInnovations.filter(i => (i.user_id !== currentUser?.id && i.creator_id !== currentUser?.id));
  const myProjectsWithInsights = myProjects.filter(p => (p.valid_reviews_count || 0) > 0);

  const isNewUserEmpty = myProjects.length === 0 && myReviews.length === 0;

  // Curated Featured Demo Projects (SmartStudy AI and Canva)
  const demoIdea = allInnovations.find(i => i.id === 'demo_smartstudy_ai') || INITIAL_FEATURED_DEMOS[0];
  const demoProduct = allInnovations.find(i => i.id === 'demo_canva') || INITIAL_FEATURED_DEMOS[1];

  // Selected category object
  const activeCategoryObj = categories.find(c => c.id === selectedCategory);
  const activeCategoryName = activeCategoryObj ? activeCategoryObj.name : selectedCategory;

  // Project Type display labels
  const projectTypeLabels = {
    'idea': 'IDEA',
    'product': 'PRODUCT',
    'startup': 'STARTUP'
  };

  const sortLabels = {
    'NEWEST': 'NEWEST',
    'OLDEST': 'OLDEST',
    'MOST_LIKED': 'MOST LIKED',
    'MOST_REVIEWED': 'MOST REVIEWED',
    'ALPHA_ASC': 'A–Z',
    'ALPHA_DESC': 'Z–A'
  };

  const statusLabels = {
    'published': 'PUBLISHED',
    'draft': 'DRAFT',
    'under_validation': 'VALIDATING'
  };

  const timeframeLabels = {
    '24H': 'TODAY',
    '7D': 'THIS WEEK',
    '30D': 'THIS MONTH'
  };

  return (
    <div className="workspace-container">
      {/* ========================================================================= */}
      {/* COMPACT DASHBOARD FILTER & SORT TOOLBAR (BELOW TOPBAR, ABOVE 01 WORKSPACE) */}
      {/* ========================================================================= */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            padding: '0.75rem 1.15rem',
            backgroundColor: 'var(--bg-white)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {/* Left Quick Filters & Filter Button */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem', flex: 1 }}>
            
            {/* 1. Main FILTERS Button */}
            <div style={{ position: 'relative' }} ref={filtersPopoverRef}>
              <button
                type="button"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className={`btn ${activeFilterCount > 0 ? 'btn-coral' : 'btn-secondary'} btn-sm`}
                style={{
                  height: '38px',
                  padding: '0 0.95rem',
                  gap: '0.45rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <SlidersHorizontal size={14} />
                <span>FILTERS</span>
                {activeFilterCount > 0 && (
                  <span
                    style={{
                      backgroundColor: activeFilterCount > 0 ? '#FFFFFF' : 'var(--coral)',
                      color: activeFilterCount > 0 ? 'var(--coral)' : '#FFFFFF',
                      borderRadius: 'var(--radius-full)',
                      padding: '1px 6px',
                      fontSize: '0.7rem',
                      fontWeight: 800
                    }}
                  >
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown size={13} style={{ transform: isFiltersOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
              </button>

              {/* Filters Dropdown Popover */}
              {isFiltersOpen && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 'calc(100% + 8px)',
                    width: '320px',
                    backgroundColor: 'var(--bg-white)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-modal)',
                    border: '1px solid var(--border-medium)',
                    padding: '1.25rem',
                    zIndex: 1000,
                    animation: 'fadeIn 0.15s ease-out'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '0.5rem' }}>
                    <div className="editorial-mono-label" style={{ fontSize: '0.75rem', color: 'var(--coral)' }}>
                      ⚙ DASHBOARD FILTERS
                    </div>
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllFilters}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.72rem', padding: '2px 6px', color: 'var(--text-secondary)' }}
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    {/* Project Type */}
                    <div>
                      <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.68rem' }}>
                        PROJECT TYPE
                      </label>
                      <select
                        value={selectedProjectType}
                        onChange={e => setSelectedProjectType(e.target.value)}
                        className="form-select"
                        style={{ height: '34px', fontSize: '0.82rem', padding: '0.25rem 0.65rem' }}
                      >
                        <option value="ALL">All Types</option>
                        <option value="idea">Idea</option>
                        <option value="product">Product</option>
                        <option value="startup">Startup</option>
                      </select>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.68rem' }}>
                        CATEGORY
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        className="form-select"
                        style={{ height: '34px', fontSize: '0.82rem', padding: '0.25rem 0.65rem' }}
                      >
                        <option value="ALL">All Categories</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.68rem' }}>
                        STATUS
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={e => setSelectedStatus(e.target.value)}
                        className="form-select"
                        style={{ height: '34px', fontSize: '0.82rem', padding: '0.25rem 0.65rem' }}
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="under_validation">Under Validation</option>
                      </select>
                    </div>

                    {/* Date Created */}
                    <div>
                      <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.68rem' }}>
                        DATE CREATED
                      </label>
                      <select
                        value={timeframe}
                        onChange={e => setTimeframe(e.target.value)}
                        className="form-select"
                        style={{ height: '34px', fontSize: '0.82rem', padding: '0.25rem 0.65rem' }}
                      >
                        <option value="ALL">All Time</option>
                        <option value="24H">Today (Past 24 Hours)</option>
                        <option value="7D">This Week (Past 7 Days)</option>
                        <option value="30D">This Month (Past 30 Days)</option>
                      </select>
                    </div>

                    {/* Has Launch Link Checkbox */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.86rem' }}>
                      <input
                        type="checkbox"
                        checked={hasLaunchLink}
                        onChange={e => setHasLaunchLink(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--coral)', cursor: 'pointer' }}
                      />
                      <span>Has Live Product Link</span>
                    </label>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', borderTop: '1px solid var(--border-hairline)', paddingTop: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={handleClearAllFilters}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, fontSize: '0.78rem' }}
                      >
                        Clear All
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyToExplore}
                        className="btn btn-coral btn-sm"
                        style={{ flex: 1, fontSize: '0.78rem' }}
                      >
                        Apply Filters ↗
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. ALL TYPES Dropdown */}
            <div style={{ position: 'relative', minWidth: '130px' }}>
              <select
                value={selectedProjectType}
                onChange={e => setSelectedProjectType(e.target.value)}
                className="form-select"
                style={{
                  height: '38px',
                  fontSize: '0.78rem',
                  padding: '0.4rem 1.75rem 0.4rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: selectedProjectType !== 'ALL' ? 'var(--bg-cream)' : 'var(--bg-white)',
                  borderColor: selectedProjectType !== 'ALL' ? 'var(--coral)' : 'var(--border-medium)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">ALL TYPES ▾</option>
                <option value="idea">IDEA</option>
                <option value="product">PRODUCT</option>
                <option value="startup">STARTUP</option>
              </select>
            </div>

            {/* 3. CATEGORY Dropdown */}
            <div style={{ position: 'relative', minWidth: '150px' }}>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="form-select"
                style={{
                  height: '38px',
                  fontSize: '0.78rem',
                  padding: '0.4rem 1.75rem 0.4rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: selectedCategory !== 'ALL' ? 'var(--bg-cream)' : 'var(--bg-white)',
                  borderColor: selectedCategory !== 'ALL' ? 'var(--coral)' : 'var(--border-medium)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">CATEGORY ▾</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. SORT Dropdown */}
            <div style={{ position: 'relative', minWidth: '165px' }}>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="form-select"
                style={{
                  height: '38px',
                  fontSize: '0.78rem',
                  padding: '0.4rem 1.75rem 0.4rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: sortBy !== 'NEWEST' ? 'var(--bg-cream)' : 'var(--bg-white)',
                  borderColor: sortBy !== 'NEWEST' ? 'var(--coral)' : 'var(--border-medium)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer'
                }}
              >
                <option value="NEWEST">↕ SORT: NEWEST ▾</option>
                <option value="OLDEST">↕ SORT: OLDEST ▾</option>
                <option value="MOST_LIKED">↕ SORT: MOST LIKED ▾</option>
                <option value="MOST_REVIEWED">↕ SORT: MOST REVIEWED ▾</option>
                <option value="ALPHA_ASC">↕ SORT: A – Z ▾</option>
                <option value="ALPHA_DESC">↕ SORT: Z – A ▾</option>
              </select>
            </div>

          </div>

          {/* Right Action to Open Explore Discovery */}
          <button
            onClick={handleApplyToExplore}
            className="btn btn-ghost btn-sm"
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--coral)',
              gap: '0.35rem'
            }}
          >
            <span>EXPLORE MATRIX</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Active Filter Chips Row */}
        {activeFilterCount > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center', marginTop: '0.65rem' }}>
            {selectedProjectType !== 'ALL' && (
              <span 
                className="category-tag" 
                style={{ backgroundColor: 'var(--bg-cream)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', cursor: 'pointer' }}
                onClick={() => setSelectedProjectType('ALL')}
                title="Remove type filter"
              >
                {projectTypeLabels[selectedProjectType] || selectedProjectType} <X size={12} style={{ marginLeft: '2px' }} />
              </span>
            )}

            {selectedCategory !== 'ALL' && (
              <span 
                className="category-tag" 
                style={{ backgroundColor: 'var(--bg-cream)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', cursor: 'pointer' }}
                onClick={() => setSelectedCategory('ALL')}
                title="Remove category filter"
              >
                {activeCategoryName.toUpperCase()} <X size={12} style={{ marginLeft: '2px' }} />
              </span>
            )}

            {selectedStatus !== 'ALL' && (
              <span 
                className="category-tag" 
                style={{ backgroundColor: 'var(--bg-cream)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', cursor: 'pointer' }}
                onClick={() => setSelectedStatus('ALL')}
                title="Remove status filter"
              >
                STATUS: {statusLabels[selectedStatus] || selectedStatus} <X size={12} style={{ marginLeft: '2px' }} />
              </span>
            )}

            {sortBy !== 'NEWEST' && (
              <span 
                className="category-tag" 
                style={{ backgroundColor: 'var(--bg-cream)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', cursor: 'pointer' }}
                onClick={() => setSortBy('NEWEST')}
                title="Reset sort"
              >
                SORT: {sortLabels[sortBy] || sortBy} <X size={12} style={{ marginLeft: '2px' }} />
              </span>
            )}

            {timeframe !== 'ALL' && (
              <span 
                className="category-tag" 
                style={{ backgroundColor: 'var(--bg-cream)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', cursor: 'pointer' }}
                onClick={() => setTimeframe('ALL')}
                title="Remove date filter"
              >
                {timeframeLabels[timeframe] || timeframe} <X size={12} style={{ marginLeft: '2px' }} />
              </span>
            )}

            {hasLaunchLink && (
              <span 
                className="category-tag" 
                style={{ backgroundColor: 'var(--bg-cream)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', cursor: 'pointer' }}
                onClick={() => setHasLaunchLink(false)}
                title="Remove live link filter"
              >
                HAS LIVE LINK <X size={12} style={{ marginLeft: '2px' }} />
              </span>
            )}

            <button
              type="button"
              onClick={handleClearAllFilters}
              className="btn btn-ghost btn-sm"
              style={{
                color: 'var(--coral)',
                fontWeight: 700,
                fontSize: '0.74rem',
                padding: '0.2rem 0.45rem',
                gap: '0.25rem'
              }}
            >
              <RotateCcw size={11} /> CLEAR ALL
            </button>
          </div>
        )}
      </div>

      {/* 1. TOP WELCOME STATEMENT */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.45rem' }}>
          01 / PERSONALIZED WORKSPACE
        </div>
        <h1 style={{ fontSize: '2.6rem', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
          WELCOME, {currentUser?.name || 'INNOVATOR'}.
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          {isNewUserEmpty 
            ? "Your journey in the innovation ecosystem starts today. Explore curated platform specimens or launch your own."
            : "The network has been moving. Review your active specimens and validator feedback below."}
        </p>
      </div>

      {/* 2. REAL DYNAMIC STATISTICS BAR (START AT REAL 0 VALUES) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.25rem',
          marginBottom: '3rem'
        }}
      >
        <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--coral)' }}>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            <CountUp value={myProjects.length} />
          </div>
          <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
            MY PROJECTS
          </div>
        </div>

        <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--periwinkle)' }}>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--periwinkle)' }}>
            <CountUp value={myReviews.length} />
          </div>
          <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
            REVIEWS GIVEN
          </div>
        </div>

        <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--teal)' }}>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--teal)' }}>
            <CountUp value={currentUser?.credits || 0} />
          </div>
          <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
            REPUTATION SCORE
          </div>
        </div>

        <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--rose-pink)' }}>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--rose-pink)' }}>
            <CountUp value={myProjectsWithInsights.length} />
          </div>
          <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
            INSIGHT REPORTS
          </div>
        </div>
      </div>

      {/* 2.5 QUICK SEARCH & DISCOVERY SPOTLIGHT ON DASHBOARD */}
      <div 
        className="editorial-card"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '3rem',
          backgroundColor: 'var(--bg-white)',
          borderLeft: '4px solid var(--periwinkle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div 
          onClick={() => setIsCommandPaletteOpen(true)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.85rem', 
            flex: 1, 
            minWidth: '280px',
            cursor: 'pointer',
            backgroundColor: 'var(--bg-ivory)',
            padding: '0.65rem 1.15rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            transition: 'border-color 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--coral)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
        >
          <Search size={17} color="var(--coral)" />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', flex: 1 }}>
            Search ideas, projects, products, or categories...
          </span>
          <span className="mono" style={{ fontSize: '0.68rem', backgroundColor: 'var(--bg-cream)', padding: '0.15rem 0.45rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
            Ctrl K
          </span>
        </div>

        {/* Quick Category Discovery Options */}
        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="editorial-mono-label" style={{ fontSize: '0.68rem', marginRight: '0.2rem', color: 'var(--text-secondary)' }}>
            EXPLORE:
          </span>
          {[
            { label: 'Technology', id: '93fe2938-c843-4fa4-8b01-b07d59990023' },
            { label: 'Healthcare', id: '19b552c7-2ed6-44fe-9846-5d1501b1104f' },
            { label: 'Education', id: '9dbbcd45-778e-411c-92cc-debee85d7137' },
            { label: 'Environment', id: '913ce065-82bd-4101-a508-22bf41eaf0d5' }
          ].map((cat) => (
            <button
              key={cat.label}
              onClick={() => {
                if (setExploreFilters) setExploreFilters({ search: '', category: cat.id });
                setActiveTab('explore');
              }}
              className="category-tag"
              style={{ 
                cursor: 'pointer', 
                border: '1px solid var(--border-medium)', 
                backgroundColor: 'var(--bg-cream)',
                fontSize: '0.72rem',
                padding: '0.25rem 0.65rem'
              }}
            >
              {cat.label}
            </button>
          ))}
          <button
            onClick={() => {
              if (setExploreFilters) setExploreFilters({ search: '', category: 'ALL' });
              setActiveTab('explore');
            }}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.76rem', padding: '0.35rem 0.85rem' }}
          >
            All Innovations ↗
          </button>
        </div>
      </div>

      {/* 3. CONDITIONAL BODY: PERSONALIZED EMPTY STATE vs ACTIVE PROJECT */}
      {isNewUserEmpty ? (
        /* ================= NEW USER PERSONALIZED EMPTY STATE ================= */
        <div style={{ marginBottom: '3.5rem' }}>
          {/* Welcome Banner Card */}
          <div
            className="editorial-card"
            style={{
              padding: '3.5rem',
              backgroundColor: 'var(--bg-white)',
              borderLeft: '4px solid var(--coral)',
              marginBottom: '2.5rem'
            }}
          >
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '1rem' }}>
              ✦ GETTING STARTED
            </div>

            <div style={{ lineHeight: 0.98, marginBottom: '1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.4rem, 5vw, 4.2rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                YOU'RE AT
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.4rem, 5vw, 4.2rem)', fontWeight: 800, color: 'var(--coral)', fontStyle: 'italic', margin: '0.2rem 0' }}>
                THE BEGINNING
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.4rem, 5vw, 4.2rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                OF SOMETHING.
              </div>
            </div>

            <p className="editorial-lead" style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '640px' }}>
              Start by sharing an idea, exploring innovations, or giving your perspective to someone else's work.
            </p>
          </div>

          {/* Three Primary Actions: 01 CREATE, 02 EXPLORE, 03 REVIEW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem', marginBottom: '3.5rem' }}>
            {/* 01 CREATE */}
            <div className="editorial-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="editorial-mono-label" style={{ color: 'var(--coral)', fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                  01
                </div>
                <h3 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>CREATE</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.5, marginBottom: '2rem' }}>
                  Share a new idea, product, or startup concept.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('submit')}
                className="btn btn-coral btn-lg"
                style={{ width: '100%', gap: '0.45rem' }}
              >
                CREATE SOMETHING ↗
              </button>
            </div>

            {/* 02 EXPLORE */}
            <div className="editorial-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                  02
                </div>
                <h3 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>EXPLORE</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.5, marginBottom: '2rem' }}>
                  Discover what other innovators are building.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('explore')}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', gap: '0.45rem' }}
              >
                EXPLORE PROJECTS ↗
              </button>
            </div>

            {/* 03 REVIEW */}
            <div className="editorial-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="editorial-mono-label" style={{ color: 'var(--green)', fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                  03
                </div>
                <h3 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>REVIEW</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.5, marginBottom: '2rem' }}>
                  Help improve an innovation with your perspective.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('queue')}
                className="btn btn-secondary btn-lg"
                style={{ width: '100%', gap: '0.45rem' }}
              >
                START REVIEWING ↗
              </button>
            </div>
          </div>

          {/* ================= EXPLORE HOW INNOVEXA WORKS ================= */}
          <div style={{ marginTop: '4rem', paddingTop: '3rem', borderTop: '1px solid var(--border-hairline)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.4rem' }}>
                  PLATFORM DEMONSTRATION CONTENT
                </div>
                <h2 style={{ fontSize: '2.2rem', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                  EXPLORE HOW INNOVEXA WORKS
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '680px', marginTop: '0.4rem', lineHeight: 1.5 }}>
                  Explore these two curated platform reference specimens to see how idea validation and live product destinations work inside INNOVEXA.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="editorial-mono-label" style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', backgroundColor: 'var(--bg-cream)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)' }}>
                  2 FEATURED DEMO SPECIMENS
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
              {/* DEMO 01: SMARTSTUDY AI (Concept Idea) */}
              {demoIdea && (
                <div
                  className="editorial-card"
                  style={{
                    padding: '2.5rem',
                    borderLeft: '5px solid var(--lavender)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--bg-white)',
                    boxShadow: 'var(--shadow-md)',
                    position: 'relative'
                  }}
                >
                  <div>
                    {/* Header Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="editorial-mono-label" style={{ color: 'var(--lavender)', fontSize: '0.9rem', fontWeight: 800 }}>
                          01 /
                        </span>
                        <StageBadge stage="concept" />
                        <span className="category-tag tag-ink-education">Education</span>
                      </div>
                      <FeaturedDemoBadge type="idea_example" label="FEATURED DEMO" />
                    </div>

                    <h3 style={{ fontSize: '1.85rem', marginBottom: '0.4rem', lineHeight: 1.2 }}>
                      {demoIdea.title}
                    </h3>

                    <p style={{ color: 'var(--lavender)', fontFamily: 'var(--font-editorial)', fontStyle: 'italic', fontSize: '1.05rem', marginBottom: '1rem', fontWeight: 600 }}>
                      "{demoIdea.tagline}"
                    </p>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                      {demoIdea.description}
                    </p>

                    {/* Community validation question teaser */}
                    <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                      <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--lavender)', marginBottom: '0.35rem' }}>
                        PRIMARY COMMUNITY QUESTION
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        "Does this solve a study organization problem you personally experience?"
                      </div>
                    </div>
                  </div>

                  <div>
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          setSelectedInnoId(demoIdea.id);
                          setActiveTab('detail');
                        }}
                        className="btn btn-primary"
                        style={{ flex: 1, gap: '0.4rem', justifyContent: 'center' }}
                      >
                        FOLLOW THE JOURNEY ↗
                      </button>

                      <button
                        onClick={() => {
                          setSelectedInnoId(demoIdea.id);
                          setActiveTab('review_submit');
                        }}
                        className="btn btn-secondary"
                        style={{ gap: '0.4rem' }}
                      >
                        GIVE PERSPECTIVE <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* DEMO 02: CANVA (Live Product Example) */}
              {demoProduct && (
                <div
                  className="editorial-card"
                  style={{
                    padding: '2.5rem',
                    borderLeft: '5px solid var(--periwinkle)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--bg-white)',
                    boxShadow: 'var(--shadow-md)',
                    position: 'relative'
                  }}
                >
                  <div>
                    {/* Header Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="editorial-mono-label" style={{ color: 'var(--periwinkle)', fontSize: '0.9rem', fontWeight: 800 }}>
                          02 /
                        </span>
                        <StageBadge stage="live" />
                        <span className="category-tag tag-ink-design">Design</span>
                      </div>
                      <FeaturedDemoBadge type="product_example" label="FEATURED PRODUCT EXAMPLE" />
                    </div>

                    <h3 style={{ fontSize: '1.85rem', marginBottom: '0.4rem', lineHeight: 1.2 }}>
                      {demoProduct.title}
                    </h3>

                    <p style={{ color: 'var(--periwinkle)', fontFamily: 'var(--font-editorial)', fontStyle: 'italic', fontSize: '1.05rem', marginBottom: '1rem', fontWeight: 600 }}>
                      "{demoProduct.tagline}"
                    </p>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                      {demoProduct.description}
                    </p>

                    {/* External Destination Box */}
                    <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--periwinkle)', marginBottom: '0.2rem' }}>
                          LIVE LAUNCH DESTINATION
                        </div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Globe size={13} color="var(--periwinkle)" /> https://www.canva.com
                        </div>
                      </div>
                      <span className="category-tag" style={{ fontSize: '0.66rem', color: '#10B981', borderColor: 'rgba(16,185,129,0.3)' }}>
                        VERIFIED URL
                      </span>
                    </div>
                  </div>

                  <div>
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <a
                        href="https://www.canva.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-coral"
                        style={{ flex: 1, gap: '0.4rem', justifyContent: 'center', textDecoration: 'none', fontWeight: 800 }}
                      >
                        VISIT PRODUCT <ExternalLink size={14} />
                      </a>

                      <button
                        onClick={() => {
                          setSelectedInnoId(demoProduct.id);
                          setActiveTab('detail');
                        }}
                        className="btn btn-secondary"
                        style={{ gap: '0.4rem' }}
                      >
                        INSPECT SPECIMEN <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ================= ACTIVE PROJECT CARD ================= */
        <div style={{ marginBottom: '3.5rem' }}>
          <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.75rem' }}>
            02 / CURRENT FOCUS
          </div>

          {activeProject && (
            <div
              className="editorial-card-dark"
              style={{
                padding: '3rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '3rem',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span className="category-tag tag-ink-ai">
                    {activeProject.category_name}
                  </span>
                  <span className="editorial-mono-label" style={{ color: 'var(--coral)' }}>
                    ACTIVE SPECIMEN v{activeProject.version || 1}.0
                  </span>
                </div>

                <h2 style={{ fontSize: '2.4rem', color: '#FFFFFF', marginBottom: '0.75rem', lineHeight: 1.15 }}>
                  {activeProject.title}
                </h2>
                <p style={{ color: 'var(--text-inverse-muted)', fontSize: '1.05rem', lineHeight: 1.55, marginBottom: '2rem', maxWidth: '520px' }}>
                  {activeProject.short_description}
                </p>

                {/* Progress bar */}
                <div style={{ marginBottom: '2rem', maxWidth: '440px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.45rem', color: 'var(--text-inverse-muted)' }}>
                    <span className="mono">Validation Target</span>
                    <span className="mono" style={{ color: '#FFFFFF', fontWeight: 700 }}>
                      {progressPercent}% ({currentReviews}/{target} reviews)
                    </span>
                  </div>
                  <div className="progress-track progress-track-dark">
                    <div className="progress-fill" style={{ width: `${progressPercent}%`, backgroundColor: 'var(--coral)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setSelectedInnoId(activeProject.id);
                      setActiveTab('detail');
                    }}
                    className="btn btn-coral"
                    style={{ gap: '0.45rem' }}
                  >
                    CONTINUE PROJECT <ArrowUpRight size={16} />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedInnoId(activeProject.id);
                      setActiveTab('insight');
                    }}
                    className="btn btn-secondary"
                    style={{ color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                  >
                    <Sparkles size={14} color="var(--rose-pink)" /> View Insights
                  </button>
                </div>
              </div>

              {/* 3D Specimen preview */}
              <div
                style={{
                  height: '280px',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <InnovationCore height={260} categoryId={activeProject.category_id} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. DISCOVER TRENDING SPECIMENS */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <div className="editorial-mono-label" style={{ color: 'var(--text-secondary)' }}>
              03 / NETWORK SPECIMENS
            </div>
            <h2 style={{ fontSize: '1.85rem' }}>Explore The Ecosystem</h2>
          </div>

          <button onClick={() => setActiveTab('explore')} className="btn btn-secondary btn-sm" style={{ gap: '0.4rem' }}>
            View All Directory <ArrowUpRight size={14} />
          </button>
        </div>

        {otherInnovations.length === 0 ? (
          <div className="editorial-card" style={{ padding: '3.5rem', textAlign: 'center', backgroundColor: 'var(--bg-cream)' }}>
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.5rem' }}>
              COMMUNITY DIRECTORY
            </div>
            <h3 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>THE NETWORK IS JUST BEGINNING.</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
              Be one of the first people to share something worth discussing.
            </p>
            <button onClick={() => setActiveTab('submit')} className="btn btn-coral">
              <PlusCircle size={15} /> CREATE A PROJECT ↗
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {otherInnovations.slice(0, 3).map(item => {
              const ink = getCategoryInk(item.category_id, item.category_name);
              const isDemo = item.is_demo || item.is_featured_example;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedInnoId(item.id);
                    setActiveTab('detail');
                  }}
                  className="editorial-card"
                  style={{
                    padding: '1.75rem',
                    borderLeft: `4px solid ${ink.hex}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        <span className={`category-tag ${ink.tagClass}`}>
                          {item.category_name}
                        </span>
                        <StageBadge stage={item.project_stage || (item.creation_type === 'PRODUCT' ? 'live' : 'concept')} />
                        {isDemo && (
                          <FeaturedDemoBadge type={item.demo_project_type} label={item.demo_badge_label} />
                        )}
                      </div>
                      <span className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--coral)' }}>
                        {item.valid_reviews_count || 0}/10 REVIEWS
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.35rem', marginBottom: '0.45rem' }}>{item.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                      {item.short_description}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span>By {item.creator_name || 'Innovator'}</span>
                    <span className="btn btn-ghost btn-sm" style={{ padding: 0, color: 'var(--coral)' }}>
                      Inspect ↗
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
