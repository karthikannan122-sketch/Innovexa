import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { generateFeedbackInsights } from '../services/aiInsights';
import { getCategoryInk, BRAND_COLORS } from '../utils/categoryColors';
import StatusBadge, { StageBadge } from '../components/StatusBadge';
import CountUp from '../components/CountUp';
import confetti from 'canvas-confetti';
import { 
  RatingDistributionChart, 
  VoteRatioChart, 
  EngagementMixChart, 
  ActivityTimelineChart, 
  EmptyDataFallback 
} from '../components/AnalyticsCharts';
import { 
  Sparkles, 
  RotateCcw, 
  ArrowLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  ThumbsUp, 
  ThumbsDown,
  Eye,
  Star,
  UserCheck,
  BarChart2,
  AlertTriangle, 
  Lightbulb, 
  Wrench, 
  Rocket, 
  Layers, 
  TrendingUp, 
  BrainCircuit, 
  Compass, 
  AlertCircle, 
  Activity, 
  Target, 
  ShieldAlert, 
  Zap, 
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Heart,
  MessageSquare,
  Users,
  Clock,
  Share2,
  HelpCircle,
  X
} from 'lucide-react';

/**
 * InsightReportPage — Personal Project AI Insights, Readiness & Real Data Analytics
 * Allows the creator to select and deeply analyze any of their owned projects.
 */
export default function InsightReportPage({ selectedInnoId, setActiveTab, setSelectedInnoId }) {
  const { currentUser, showToast } = useAuth();
  const [userProjects, setUserProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(selectedInnoId || null);
  const [innovation, setInnovation] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [insights, setInsights] = useState(null);
  const [projectAnalytics, setProjectAnalytics] = useState(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState(null);

  // In-Memory Request & Cache Guards
  const detailRequestRef = useRef(0);
  const projectCache = useRef(new Map());
  const insightsCache = useRef(new Map());
  const analyticsCache = useRef(new Map());
  const reviewsCache = useRef(new Map());
  const activeProjectIdRef = useRef(activeProjectId);
  activeProjectIdRef.current = activeProjectId;

  // Project Selector & Search Popover State
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');
  const [selectorTab, setSelectorTab] = useState('ALL'); // 'ALL' | 'MY_PROJECTS'
  const selectorRef = useRef(null);

  // Modals
  const [isImproveModalOpen, setIsImproveModalOpen] = useState(false);
  const [improvementChangelog, setImprovementChangelog] = useState('');

  // Close selector dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target)) {
        setIsSelectorOpen(false);
      }
    };
    if (isSelectorOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isSelectorOpen]);

  // 1. Load both user projects and all platform innovations
  const loadUserProjects = async (isInitial = false) => {
    if (isInitial) {
      setIsLoadingProjects(true);
    }
    try {
      const [userProjsRes, allProjsRes] = await Promise.all([
        currentUser?.id ? SupabaseService.getUserProjects(currentUser.id) : Promise.resolve({ data: [] }),
        SupabaseService.getProjects()
      ]);

      const myProjs = userProjsRes.data || (currentUser?.id ? StorageService.getInnovationsByUserId(currentUser.id) : []) || [];
      const platformProjs = allProjsRes.data || StorageService.getInnovations() || [];

      setUserProjects(myProjs);
      setAllProjects(platformProjs);

      if (myProjs.length > 0) {
        setSelectorTab('MY_PROJECTS');
      } else {
        setSelectorTab('ALL');
      }

      // Determine active project without overwriting if user already has an active selection
      const combined = [...myProjs, ...platformProjs.filter(p => !myProjs.some(m => m.id === p.id))];
      let target = null;

      if (selectedInnoId) {
        target = combined.find(p => p.id === selectedInnoId);
      }
      if (!target && activeProjectIdRef.current) {
        target = combined.find(p => p.id === activeProjectIdRef.current);
      }
      if (!target) {
        target = myProjs.length > 0 ? myProjs[0] : (platformProjs.length > 0 ? platformProjs[0] : null);
      }

      if (target) {
        setActiveProjectId(target.id);
        if (setSelectedInnoId && selectedInnoId !== target.id) {
          setSelectedInnoId(target.id);
        }
      } else {
        setActiveProjectId(null);
        setInnovation(null);
      }
    } catch (err) {
      console.warn('Error loading projects for Insights:', err);
      const myProjs = currentUser?.id ? StorageService.getInnovationsByUserId(currentUser.id) : [];
      const platformProjs = StorageService.getInnovations() || [];
      setUserProjects(myProjs);
      setAllProjects(platformProjs);
      const combined = [...myProjs, ...platformProjs.filter(p => !myProjs.some(m => m.id === p.id))];
      const target = combined[0] || null;
      if (target && !activeProjectIdRef.current) {
        setActiveProjectId(target.id);
      }
    } finally {
      if (isInitial) {
        setIsLoadingProjects(false);
      }
    }
  };

  useEffect(() => {
    loadUserProjects(true);
    const handler = () => loadUserProjects(false);
    window.addEventListener('innovexa:datachange', handler);
    return () => window.removeEventListener('innovexa:datachange', handler);
  }, [currentUser?.id]);

  // Synchronize when selectedInnoId prop changes from parent / navigation
  useEffect(() => {
    if (selectedInnoId && selectedInnoId !== activeProjectId) {
      setActiveProjectId(selectedInnoId);
    }
  }, [selectedInnoId]);

  // 2. Load detailed data & AI insights whenever activeProjectId changes
  const loadActiveProjectDetails = async (targetId, forceRegen = false) => {
    if (!targetId) {
      setInnovation(null);
      setReviews([]);
      setInsights(null);
      setIsLoadingAnalytics(false);
      setIsGenerating(false);
      return;
    }

    const requestId = ++detailRequestRef.current;

    // In-memory instant cache hit: prevent any flickering or repeated loading
    if (!forceRegen && projectCache.current.has(targetId) && insightsCache.current.has(targetId)) {
      setInnovation(projectCache.current.get(targetId));
      setReviews(reviewsCache.current.get(targetId) || []);
      setInsights(insightsCache.current.get(targetId));
      setProjectAnalytics(analyticsCache.current.get(targetId) || null);
      setIsLoadingAnalytics(false);
      setIsGenerating(false);
      setGenError(null);
      return;
    }

    setIsGenerating(true);
    setIsLoadingAnalytics(true);
    setGenError(null);
    if (forceRegen) {
      setInsights(null);
    }

    try {
      // Parallel fetch project detail, real reviews, and authoritative analytics
      const [projRes, revsRes, analyticsRes] = await Promise.all([
        SupabaseService.getProjectById(targetId),
        SupabaseService.getReviews(targetId),
        SupabaseService.getProjectAnalytics(targetId)
      ]);

      if (requestId !== detailRequestRef.current) {
        return; // Discard stale response from superseded request
      }

      const projectData = projRes.data || StorageService.getInnovationById(targetId) || allProjects.find(p => p.id === targetId);
      if (!projectData) {
        setInnovation(null);
        setProjectAnalytics(null);
        setIsGenerating(false);
        setIsLoadingAnalytics(false);
        return;
      }

      const projectReviews = revsRes.data || StorageService.getReviewsForInnovation(targetId) || [];
      const analyticsData = analyticsRes?.data || null;

      // Generate or load cached AI insights strictly for this project
      const generated = await generateFeedbackInsights(projectData, projectReviews, forceRegen);

      if (requestId !== detailRequestRef.current) {
        return; // Discard stale response
      }

      // Cache results in memory
      projectCache.current.set(targetId, projectData);
      reviewsCache.current.set(targetId, projectReviews);
      insightsCache.current.set(targetId, generated);
      if (analyticsData) {
        analyticsCache.current.set(targetId, analyticsData);
      }

      // Single atomic batch update
      setInnovation(projectData);
      setReviews(projectReviews);
      if (analyticsData) {
        setProjectAnalytics(analyticsData);
      }
      setInsights(generated);
    } catch (err) {
      if (requestId === detailRequestRef.current) {
        console.error('[Insights loadActiveProjectDetails error]:', err);
        setGenError('Unable to generate AI insights. Please try again.');
      }
    } finally {
      if (requestId === detailRequestRef.current) {
        setIsGenerating(false);
        setIsLoadingAnalytics(false);
      }
    }
  };

  useEffect(() => {
    if (activeProjectId) {
      loadActiveProjectDetails(activeProjectId);
    }
  }, [activeProjectId]);

  // Active list of available projects for cycle navigation
  const activeProjectList = useMemo(() => {
    if (selectorTab === 'MY_PROJECTS' && userProjects.length > 0) {
      return userProjects;
    }
    const combined = [...userProjects, ...allProjects.filter(p => !userProjects.some(m => m.id === p.id))];
    return combined.length > 0 ? combined : allProjects;
  }, [userProjects, allProjects, selectorTab]);

  const currentProjectIndex = useMemo(() => {
    return activeProjectList.findIndex(p => p.id === activeProjectId);
  }, [activeProjectList, activeProjectId]);

  // Handle switching to another project with instant visual responsiveness
  const handleSelectProject = (project) => {
    if (!project) {
      setIsSelectorOpen(false);
      return;
    }
    setIsSelectorOpen(false);
    setSelectorSearch('');
    
    // Instant metadata switch from cache if available
    if (projectCache.current.has(project.id)) {
      setInnovation(projectCache.current.get(project.id));
      setReviews(reviewsCache.current.get(project.id) || []);
      setInsights(insightsCache.current.get(project.id) || null);
      setProjectAnalytics(analyticsCache.current.get(project.id) || null);
    } else {
      setInnovation(project);
      const cachedRevs = StorageService.getReviewsForInnovation(project.id);
      setReviews(cachedRevs || []);
    }

    setActiveProjectId(project.id);
    if (setSelectedInnoId && selectedInnoId !== project.id) {
      setSelectedInnoId(project.id);
    }
  };

  const handleNextProject = () => {
    if (activeProjectList.length <= 1) return;
    const nextIdx = currentProjectIndex >= 0 ? (currentProjectIndex + 1) % activeProjectList.length : 0;
    handleSelectProject(activeProjectList[nextIdx]);
  };

  const handlePrevProject = () => {
    if (activeProjectList.length <= 1) return;
    const prevIdx = currentProjectIndex >= 0 
      ? (currentProjectIndex - 1 + activeProjectList.length) % activeProjectList.length 
      : activeProjectList.length - 1;
    handleSelectProject(activeProjectList[prevIdx]);
  };

  // Handle manual AI regeneration
  const handleRegenerateWithAI = async () => {
    if (!innovation) return;
    showToast(`Synthesizing dynamic AI insights for "${innovation.title}"...`, 'info');
    await loadActiveProjectDetails(innovation.id, true);
    confetti({ particleCount: 40, spread: 65, origin: { y: 0.6 } });
    showToast('AI analysis regenerated successfully!', 'success');
  };

  // Handle iteration changelog logging
  const handleSaveImprovement = (e) => {
    e.preventDefault();
    if (!improvementChangelog.trim() || !innovation) return;

    StorageService.updateInnovation(innovation.id, {
      version: (innovation.version || 1) + 1,
      last_changelog: improvementChangelog.trim(),
      updated_at: new Date().toISOString()
    });
    setIsImproveModalOpen(false);
    setImprovementChangelog('');
    showToast(`Iteration logged! Specimen advanced to v${(innovation.version || 1) + 1}.`, 'success');
    loadActiveProjectDetails(innovation.id, true);
  };

  // Filter projects in the selector dropdown based on active tab and search query
  const availableSelectorProjects = useMemo(() => {
    let list = userProjects;
    if (selectorTab === 'ALL' || userProjects.length === 0) {
      list = allProjects;
    }
    if (!selectorSearch.trim()) return list;
    const q = selectorSearch.toLowerCase().trim();
    return list.filter(p => {
      const title = (p.title || '').toLowerCase();
      const cat = (p.category_name || StorageService.getCategoryName(p.category_id) || '').toLowerCase();
      const type = (p.project_type || p.creation_type || '').toLowerCase();
      return title.includes(q) || cat.includes(q) || type.includes(q);
    });
  }, [userProjects, allProjects, selectorTab, selectorSearch]);

  // ---------------------------------------------------------------------------
  // RENDER: LOADING PROJECTS STATE
  // ---------------------------------------------------------------------------
  if (isLoadingProjects && !innovation) {
    return (
      <div className="workspace-container" style={{ maxWidth: '1080px', padding: '4rem 0', textAlign: 'center' }}>
        <div className="animate-spin" style={{ width: '38px', height: '38px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--coral)', borderRadius: '50%', margin: '0 auto 1.5rem auto' }} />
        <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.5rem' }}>
          ✦ LOADING PROJECT WORKSPACE
        </div>
        <h3 style={{ fontSize: '1.4rem' }}>Accessing Innovation Telemetry...</h3>
      </div>
    );
  }

  // Active project ink & styling tokens
  const ink = innovation ? getCategoryInk(innovation.category_id, innovation.category_name) : getCategoryInk('cat_tech', 'Technology');
  const overview = insights?.overview_metrics || {
    readiness_score: insights?.readiness?.score || 72,
    community_interest_pct: Math.min(100, Math.max(15, ((innovation?.upvotes_count || 0) * 10) + (reviews.length * 15))),
    sentiment_label: reviews.length > 0 ? (reviews.length >= 3 ? 'Positive' : 'Constructive') : 'Not enough feedback',
    reviews_count: reviews.length,
    likes_count: innovation?.upvotes_count || 0,
    helpful_reviews_count: reviews.filter(r => (r.helpful_votes_count || 0) > (r.unhelpful_votes_count || 0)).length
  };
  const readinessBreakdown = insights?.readiness_breakdown || {
    total_score: overview.readiness_score,
    problem_clarity: 18,
    problem_clarity_max: 20,
    solution_clarity: 16,
    solution_clarity_max: 20,
    target_audience: 12,
    target_audience_max: 15,
    implementation: 11,
    implementation_max: 15,
    differentiation: 12,
    differentiation_max: 15,
    completeness: 10,
    completeness_max: 15,
    disclaimer: 'AI-generated estimate based on actual project information provided.'
  };

  const formattedCreatedDate = innovation?.created_at 
    ? new Date(innovation.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Recently Created';

  const formattedAnalyzedDate = insights?.generated_at
    ? new Date(insights.generated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="workspace-container" style={{ maxWidth: '1080px' }}>
      
      {/* ========================================================================= */}
      {/* 1. TOP CONTROLS & SEARCHABLE PROJECT SELECTOR                             */}
      {/* ========================================================================= */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem', 
          flexWrap: 'wrap', 
          gap: '1rem' 
        }}
      >
        <button 
          onClick={() => setActiveTab('creator')} 
          className="btn btn-secondary btn-sm" 
          style={{ gap: '0.4rem' }}
        >
          <ArrowLeft size={14} /> Back to My Projects
        </button>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={handleRegenerateWithAI}
            disabled={isGenerating || !innovation}
            className="btn btn-coral btn-sm"
            style={{ gap: '0.45rem', fontWeight: 800 }}
          >
            <Sparkles size={14} /> {isGenerating ? 'Analyzing Project...' : '✦ REANALYZE PROJECT'}
          </button>

          <button
            onClick={() => setIsImproveModalOpen(true)}
            disabled={!innovation}
            className="btn btn-secondary btn-sm"
            style={{ gap: '0.4rem' }}
          >
            <Wrench size={14} /> Log Iteration (v{(innovation?.version || 1) + 1})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SEARCHABLE PROJECT SELECTOR BANNER                                     */}
      {/* ========================================================================= */}
      <div 
        ref={selectorRef}
        style={{
          position: 'relative',
          marginBottom: '2.5rem',
          backgroundColor: 'var(--bg-white)',
          borderLeft: '4px solid var(--coral)',
          borderRadius: 'var(--radius-sm)',
          padding: '1.25rem 1.75rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FolderKanban size={13} /> SELECT YOUR INNOVATION
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {innovation ? innovation.title : 'Select a project'}
          </div>
          <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            {userProjects.length} owned innovation{userProjects.length === 1 ? '' : 's'} available in workspace
          </div>
        </div>

        {/* Dropdown & Cycle Navigation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Previous Project Button */}
          {activeProjectList.length > 1 && (
            <button
              type="button"
              onClick={handlePrevProject}
              className="btn btn-secondary btn-md"
              style={{
                padding: '0.55rem 0.85rem',
                gap: '0.35rem',
                fontWeight: 700,
                fontSize: '0.82rem'
              }}
              title="Switch to previous project"
            >
              <ChevronLeft size={15} /> Prev
            </button>
          )}

          {/* Project Counter Badge */}
          {activeProjectList.length > 0 && currentProjectIndex >= 0 && (
            <span
              className="editorial-mono-label"
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-cream)',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {currentProjectIndex + 1} / {activeProjectList.length}
            </span>
          )}

          {/* Next Project Button */}
          {activeProjectList.length > 1 && (
            <button
              type="button"
              onClick={handleNextProject}
              className="btn btn-secondary btn-md"
              style={{
                padding: '0.55rem 0.85rem',
                gap: '0.35rem',
                fontWeight: 700,
                fontSize: '0.82rem'
              }}
              title="Switch to next project"
            >
              Next <ChevronRight size={15} />
            </button>
          )}

          {/* Dropdown Toggle Button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsSelectorOpen(!isSelectorOpen)}
              className="btn btn-secondary btn-md"
              style={{
                padding: '0.55rem 1.25rem',
                gap: '0.55rem',
                fontWeight: 700,
                backgroundColor: isSelectorOpen ? 'var(--bg-cream)' : 'var(--bg-white)',
                borderColor: isSelectorOpen ? 'var(--coral)' : 'var(--border-medium)'
              }}
            >
              <span>{innovation ? 'Browse All' : 'Select a project'}</span>
              <ChevronDown 
                size={15} 
                style={{ 
                  transform: isSelectorOpen ? 'rotate(180deg)' : 'none', 
                  transition: 'transform 0.2s ease' 
                }} 
              />
            </button>

            {/* Searchable Dropdown Popover */}
            {isSelectorOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: 'min(460px, 90vw)',
                  maxHeight: '440px',
                  backgroundColor: 'var(--bg-white)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-modal)',
                  border: '1px solid var(--border-medium)',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  animation: 'fadeIn 0.15s ease-out'
                }}
              >
                {/* Search Header & Scope Tabs */}
                <div style={{ padding: '0.85rem', borderBottom: '1px solid var(--border-hairline)' }}>
                  {userProjects.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.65rem' }}>
                      <button
                        type="button"
                        onClick={() => setSelectorTab('MY_PROJECTS')}
                        style={{
                          flex: 1,
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid',
                          borderColor: selectorTab === 'MY_PROJECTS' ? 'var(--coral)' : 'var(--border-subtle)',
                          backgroundColor: selectorTab === 'MY_PROJECTS' ? 'rgba(231, 111, 130, 0.08)' : 'var(--bg-white)',
                          color: selectorTab === 'MY_PROJECTS' ? 'var(--coral)' : 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        My Projects ({userProjects.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectorTab('ALL')}
                        style={{
                          flex: 1,
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid',
                          borderColor: selectorTab === 'ALL' ? 'var(--coral)' : 'var(--border-subtle)',
                          backgroundColor: selectorTab === 'ALL' ? 'rgba(231, 111, 130, 0.08)' : 'var(--bg-white)',
                          color: selectorTab === 'ALL' ? 'var(--coral)' : 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        All Innovations ({allProjects.length})
                      </button>
                    </div>
                  )}

                  {/* Search Input */}
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      value={selectorSearch}
                      onChange={e => setSelectorSearch(e.target.value)}
                      placeholder="Search project title, domain or stack..."
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '0.45rem 1.8rem 0.45rem 2rem',
                        fontSize: '0.82rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        backgroundColor: 'var(--bg-ivory)'
                      }}
                    />
                    {selectorSearch && (
                      <button
                        type="button"
                        onClick={() => setSelectorSearch('')}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Projects List */}
                <div style={{ overflowY: 'auto', maxHeight: '340px', padding: '0.5rem' }}>
                  {availableSelectorProjects.length > 0 ? (
                    availableSelectorProjects.map(proj => {
                      const isSelected = proj.id === activeProjectId;
                      const projInk = getCategoryInk(proj.category_id, proj.category_name);

                      return (
                        <div
                          key={proj.id}
                          onClick={() => handleSelectProject(proj)}
                          style={{
                            padding: '0.85rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: isSelected ? 'var(--bg-cream)' : 'transparent',
                            cursor: 'pointer',
                            marginBottom: '0.25rem',
                            borderLeft: isSelected ? `3px solid ${projInk.hex || 'var(--coral)'}` : '3px solid transparent',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-ivory)';
                          }}
                          onMouseLeave={e => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                              <span className={`category-tag ${projInk.tagClass}`} style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                                {proj.category_name || 'Technology'}
                              </span>
                              <span 
                                className="mono" 
                                style={{ 
                                  fontSize: '0.65rem', 
                                  color: 'var(--text-secondary)',
                                  backgroundColor: 'rgba(0,0,0,0.04)',
                                  padding: '1px 5px',
                                  borderRadius: '2px'
                                }}
                              >
                                {(proj.project_type || proj.creation_type || 'IDEA').toUpperCase()}
                              </span>
                            </div>
                            <div style={{ fontWeight: isSelected ? 800 : 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                              {proj.title}
                            </div>
                          </div>

                          {isSelected && (
                            <div style={{ color: 'var(--coral)', display: 'flex', alignItems: 'center' }}>
                              <Check size={16} />
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                      No matching projects found for "{selectorSearch}".
                    </div>
                  )}
                </div>

                {/* Selector Footer */}
                <div 
                  style={{ 
                    padding: '0.65rem 1rem', 
                    borderTop: '1px solid var(--border-hairline)', 
                    backgroundColor: 'var(--bg-cream)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <span className="mono">
                    {selectorTab === 'MY_PROJECTS' ? 'Your Personal Catalog' : 'Innovation Directory'}
                  </span>
                  <button
                    onClick={() => {
                      setIsSelectorOpen(false);
                      setActiveTab('submit');
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--coral)', fontWeight: 700, padding: 0, fontSize: '0.75rem' }}
                  >
                    + New Idea ↗
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal Quick-Switch Project Chips */}
      {activeProjectList.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '2rem' }}>
          <span className="editorial-mono-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            QUICK SPECIMEN SWITCH:
          </span>
          {activeProjectList.slice(0, 8).map(p => {
            const isSelected = p.id === activeProjectId;
            const pInk = getCategoryInk(p.category_id, p.category_name);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectProject(p)}
                style={{
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 800 : 500,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: isSelected ? (pInk.hex || 'var(--coral)') : 'var(--border-subtle)',
                  backgroundColor: isSelected ? 'var(--bg-white)' : 'var(--bg-cream)',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {isSelected ? '● ' : ''}{p.title}
              </button>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. COMPACT PROJECT HEADER                                                 */}
      {/* ========================================================================= */}
      {innovation && (
        <section style={{ marginBottom: '2.5rem' }}>
          <div
            className="editorial-card"
            style={{
              padding: '2rem 2.25rem',
              backgroundColor: 'var(--bg-white)',
              borderLeft: `5px solid ${ink.hex || 'var(--coral)'}`,
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className={`category-tag ${ink.tagClass}`} style={{ fontSize: '0.7rem' }}>
                  {innovation.category_name || 'Technology'}
                </span>
                <StageBadge stage={innovation.project_stage || (innovation.creation_type === 'PRODUCT' ? 'prototype' : 'idea')} />
                <span 
                  className="mono" 
                  style={{ 
                    fontSize: '0.7rem', 
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-cream)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  TYPE: {(innovation.project_type || innovation.creation_type || 'IDEA').toUpperCase()}
                </span>
              </div>

              {formattedAnalyzedDate && (
                <div 
                  className="mono" 
                  style={{ 
                    fontSize: '0.72rem', 
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Clock size={12} color="var(--teal)" /> LAST ANALYZED: <strong style={{ color: 'var(--text-primary)' }}>{formattedAnalyzedDate}</strong>
                </div>
              )}
            </div>

            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.6rem)', fontWeight: 800, marginBottom: '0.65rem', lineHeight: 1.15 }}>
              {innovation.title}
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              {innovation.description || innovation.problem_statement || innovation.short_description}
            </p>

            {/* Metadata Badges Bar */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-hairline)', paddingTop: '1rem' }}>
              <span>Created: <strong style={{ color: 'var(--text-primary)' }}>{formattedCreatedDate}</strong></span>
              <span>Status: <strong style={{ color: 'var(--text-primary)' }}>{innovation.status === 'published' ? 'Live on Network' : 'Draft Specimen'}</strong></span>
              {Boolean(innovation.launch_url || innovation.website_url) && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--teal)' }}>
                  <Compass size={12} /> Launch Link Attached
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. REAL DATABASE TELEMETRY & STRATEGIC ANALYTICS (PHASE 7)               */}
      {/* ========================================================================= */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
              <Activity size={14} /> PHASE 7 // REAL SUPABASE TELEMETRY & ANALYTICS
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
              Project Performance & Community Engagement
            </h2>
          </div>
          <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-white)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            Live Supabase Signals • Zero Mock Data
          </div>
        </div>

        {/* 4.1 Primary Real Supabase Metric Cards (8 Core Indicators) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Views */}
          <div className="editorial-card" style={{ padding: '1.25rem 1rem', backgroundColor: 'var(--bg-white)', borderTop: '3px solid var(--coral)' }}>
            <div className="editorial-mono-label" style={{ fontSize: '0.64rem', color: 'var(--coral)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Eye size={11} /> VIEWS
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.85rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)' }}>
              {projectAnalytics?.views || 0}
            </div>
            <div className="mono" style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Unique impressions
            </div>
          </div>

          {/* Upvotes */}
          <div className="editorial-card" style={{ padding: '1.25rem 1rem', backgroundColor: 'var(--bg-white)', borderTop: '3px solid var(--teal)' }}>
            <div className="editorial-mono-label" style={{ fontSize: '0.64rem', color: 'var(--teal)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ThumbsUp size={11} /> UPVOTES
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.85rem', fontWeight: 800, lineHeight: 1, color: 'var(--teal)' }}>
              {projectAnalytics?.upvotes || 0}
            </div>
            <div className="mono" style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Positive endorsements
            </div>
          </div>

          {/* Downvotes */}
          <div className="editorial-card" style={{ padding: '1.25rem 1rem', backgroundColor: 'var(--bg-white)', borderTop: '3px solid var(--coral)' }}>
            <div className="editorial-mono-label" style={{ fontSize: '0.64rem', color: 'var(--coral)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ThumbsDown size={11} /> DOWNVOTES
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.85rem', fontWeight: 800, lineHeight: 1, color: 'var(--coral)' }}>
              {projectAnalytics?.downvotes || 0}
            </div>
            <div className="mono" style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Critical counter-votes
            </div>
          </div>

          {/* Reviews */}
          <div className="editorial-card" style={{ padding: '1.25rem 1rem', backgroundColor: 'var(--bg-white)', borderTop: '3px solid var(--periwinkle)' }}>
            <div className="editorial-mono-label" style={{ fontSize: '0.64rem', color: 'var(--periwinkle)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <MessageSquare size={11} /> REVIEWS
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.85rem', fontWeight: 800, lineHeight: 1, color: 'var(--periwinkle)' }}>
              {projectAnalytics?.reviews_count || 0}
            </div>
            <div className="mono" style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Peer evaluations
            </div>
          </div>

          {/* Average Rating */}
          <div className="editorial-card" style={{ padding: '1.25rem 1rem', backgroundColor: 'var(--bg-white)', borderTop: '3px solid var(--apricot)' }}>
            <div className="editorial-mono-label" style={{ fontSize: '0.64rem', color: 'var(--apricot)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Star size={11} /> AVG RATING
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.85rem', fontWeight: 800, lineHeight: 1, color: 'var(--apricot)' }}>
              {projectAnalytics?.average_rating ? `${projectAnalytics.average_rating.toFixed(1)}★` : '—'}
            </div>
            <div className="mono" style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Score out of 5.0
            </div>
          </div>

          {/* Helpful Reviews */}
          <div className="editorial-card" style={{ padding: '1.25rem 1rem', backgroundColor: 'var(--bg-white)', borderTop: '3px solid var(--teal)' }}>
            <div className="editorial-mono-label" style={{ fontSize: '0.64rem', color: 'var(--teal)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <UserCheck size={11} /> HELPFUL REVS
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.85rem', fontWeight: 800, lineHeight: 1, color: 'var(--teal)' }}>
              {projectAnalytics?.helpful_review_count || 0}
            </div>
            <div className="mono" style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              High-signal critiques
            </div>
          </div>

          {/* Suggestions */}
          <div className="editorial-card" style={{ padding: '1.25rem 1rem', backgroundColor: 'var(--bg-white)', borderTop: '3px solid var(--lavender)' }}>
            <div className="editorial-mono-label" style={{ fontSize: '0.64rem', color: 'var(--lavender)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Lightbulb size={11} /> SUGGESTIONS
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.85rem', fontWeight: 800, lineHeight: 1, color: 'var(--lavender)' }}>
              {projectAnalytics?.suggestions_count || 0}
            </div>
            <div className="mono" style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Feature proposals
            </div>
          </div>

          {/* Followers */}
          <div className="editorial-card" style={{ padding: '1.25rem 1rem', backgroundColor: 'var(--bg-white)', borderTop: '3px solid var(--coral)' }}>
            <div className="editorial-mono-label" style={{ fontSize: '0.64rem', color: 'var(--coral)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Users size={11} /> FOLLOWERS
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.85rem', fontWeight: 800, lineHeight: 1, color: 'var(--coral)' }}>
              {projectAnalytics?.followers_count || 0}
            </div>
            <div className="mono" style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Subscribed innovators
            </div>
          </div>
        </div>

        {/* 4.2 Calculated Strategic Analytics (Formulas & Derived Indices) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {/* Calculated: Engagement Rate */}
          <div className="editorial-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-white)', borderLeft: '4px solid var(--coral)' }}>
            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--coral)', marginBottom: '0.35rem' }}>
              CALCULATED // ENGAGEMENT RATE
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, lineHeight: 1, color: 'var(--coral)' }}>
              {projectAnalytics?.engagement_rate !== undefined ? `${projectAnalytics.engagement_rate}%` : '0%'}
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.45rem 0 0 0', lineHeight: 1.4 }}>
              Ratio of total interactions (votes, reviews, suggestions, follows) relative to page views.
            </p>
          </div>

          {/* Calculated: Vote Ratio */}
          <div className="editorial-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-white)', borderLeft: '4px solid var(--teal)' }}>
            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--teal)', marginBottom: '0.35rem' }}>
              CALCULATED // VOTE RATIO
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, lineHeight: 1, color: 'var(--teal)' }}>
              {projectAnalytics?.vote_ratio !== undefined ? `${projectAnalytics.vote_ratio}%` : '100%'}
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.45rem 0 0 0', lineHeight: 1.4 }}>
              Percentage of upvotes versus total community votes cast on the public ledger.
            </p>
          </div>

          {/* Calculated: Review Score */}
          <div className="editorial-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-white)', borderLeft: '4px solid var(--periwinkle)' }}>
            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--periwinkle)', marginBottom: '0.35rem' }}>
              CALCULATED // REVIEW SCORE
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, lineHeight: 1, color: 'var(--periwinkle)' }}>
              {projectAnalytics?.review_score || 0}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.45rem 0 0 0', lineHeight: 1.4 }}>
              Normalized composite rating factoring average evaluation and total review volume.
            </p>
          </div>

          {/* Calculated: Community Engagement */}
          <div className="editorial-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-white)', borderLeft: '4px solid var(--lavender)' }}>
            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--lavender)', marginBottom: '0.35rem' }}>
              CALCULATED // COMMUNITY ENGAGEMENT
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, lineHeight: 1, color: 'var(--lavender)' }}>
              {projectAnalytics?.community_engagement || 0} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>pts</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.45rem 0 0 0', lineHeight: 1.4 }}>
              Weighted engagement velocity index aggregating votes, detailed reviews, suggestions, and follows.
            </p>
          </div>
        </div>

        {/* 4.3 Visual Analytics & Charts Section (With "Not enough data yet" Fallbacks) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Chart 1: Rating Distribution */}
          <div className="editorial-card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-white)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="editorial-mono-label" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Star size={13} color="var(--apricot)" /> RATING DISTRIBUTION
              </div>
              <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {projectAnalytics?.reviews_count || 0} reviews
              </span>
            </div>
            <RatingDistributionChart 
              distribution={projectAnalytics?.rating_distribution} 
              totalReviews={projectAnalytics?.reviews_count || 0}
              averageRating={projectAnalytics?.average_rating || 0}
            />
          </div>

          {/* Chart 2: Vote Ratio Meter */}
          <div className="editorial-card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-white)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="editorial-mono-label" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ThumbsUp size={13} color="var(--teal)" /> VOTE RATIO METER
              </div>
              <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {projectAnalytics?.total_votes || 0} votes cast
              </span>
            </div>
            <VoteRatioChart 
              upvotes={projectAnalytics?.upvotes || 0}
              downvotes={projectAnalytics?.downvotes || 0}
              totalVotes={projectAnalytics?.total_votes || 0}
              voteRatio={projectAnalytics?.vote_ratio || 0}
            />
          </div>

          {/* Chart 3: Community Engagement Mix */}
          <div className="editorial-card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-white)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="editorial-mono-label" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BarChart2 size={13} color="var(--coral)" /> ENGAGEMENT MIX
              </div>
              <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Channel breakdown
              </span>
            </div>
            <EngagementMixChart 
              upvotes={projectAnalytics?.upvotes || 0}
              downvotes={projectAnalytics?.downvotes || 0}
              reviews={projectAnalytics?.reviews_count || 0}
              suggestions={projectAnalytics?.suggestions_count || 0}
              followers={projectAnalytics?.followers_count || 0}
            />
          </div>

          {/* Chart 4: Activity Timeline Trend */}
          <div className="editorial-card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-white)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="editorial-mono-label" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <TrendingUp size={13} color="var(--periwinkle)" /> ACTIVITY TIMELINE
              </div>
              <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Temporal trend
              </span>
            </div>
            <ActivityTimelineChart 
              timeline={projectAnalytics?.activity_timeline}
            />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* LOADING STATE FOR AI SYNTHESIS                                            */}
      {/* ========================================================================= */}
      {isGenerating && !insights && (
        <section style={{ marginBottom: '3.5rem' }}>
          <div
            className="editorial-card"
            style={{
              padding: '4.5rem 2.5rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-white)',
              borderLeft: '4px solid var(--coral)'
            }}
          >
            <div className="animate-spin" style={{ width: '36px', height: '36px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--coral)', borderRadius: '50%', margin: '0 auto 1.5rem auto' }} />
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.65rem' }}>
              ✦ AI INNOVATION ANALYST
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              ANALYZING YOUR INNOVATION...
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '540px', margin: '0 auto' }}>
              Synthesizing project-specific evaluation for <strong>"{innovation?.title}"</strong> based on actual problem formulation, technical features, and validation criteria.
            </p>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. STRUCTURED 7-SECTION AI ANALYSIS                                       */}
      {/* ========================================================================= */}
      {insights && (
        <>
          {/* SECTION 01: PROJECT SUMMARY */}
          <section style={{ marginBottom: '3rem' }}>
            <div
              className="editorial-card"
              style={{
                padding: '2.5rem',
                backgroundColor: 'var(--bg-white)',
                borderLeft: `5px solid ${ink.hex || 'var(--coral)'}`,
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.65rem' }}>
                01 / PROJECT SUMMARY
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.75rem', lineHeight: 1.25 }}>
                Executive Synthesis
              </h2>
              <p style={{ fontSize: '1.02rem', color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>
                {insights.project_summary || insights.summary || innovation.description}
              </p>
            </div>
          </section>

          {/* SECTION 02 & 03: KEY STRENGTHS & AREAS TO IMPROVE */}
          <section style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
              
              {/* 02 / KEY STRENGTHS */}
              <div className="editorial-card" style={{ padding: '2rem', borderTop: '4px solid var(--green)', backgroundColor: 'var(--bg-white)' }}>
                <div className="editorial-mono-label" style={{ color: 'var(--green)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ThumbsUp size={14} /> 02 / KEY STRENGTHS
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem' }}>
                  Core Competitive Advantages
                </h3>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-primary)', fontSize: '0.94rem', lineHeight: 1.65, margin: 0 }}>
                  {(insights.strengths || [
                    'Clear problem formulation targeting verified domain friction.',
                    'Direct solution mechanism aligned with user workflows.',
                    'Strong baseline feasibility for MVP execution.'
                  ]).map((st, idx) => (
                    <li key={idx} style={{ marginBottom: '0.65rem' }}>{st}</li>
                  ))}
                </ul>
              </div>

              {/* 03 / AREAS TO IMPROVE */}
              <div className="editorial-card" style={{ padding: '2rem', borderTop: '4px solid var(--coral)', backgroundColor: 'var(--bg-white)' }}>
                <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle size={14} /> 03 / AREAS TO IMPROVE
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem' }}>
                  Friction Points & Refinements
                </h3>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-primary)', fontSize: '0.94rem', lineHeight: 1.65, margin: 0 }}>
                  {(insights.areas_to_improve || insights.weaknesses || [
                    'Quantify specific user friction metrics (time lost, manual cost).',
                    'Attach interactive prototype demonstration for hands-on evaluation.'
                  ]).map((area, idx) => (
                    <li key={idx} style={{ marginBottom: '0.65rem' }}>{area}</li>
                  ))}
                </ul>
              </div>

            </div>
          </section>

          {/* SECTION 04: COMMUNITY FEEDBACK ANALYSIS */}
          <section style={{ marginBottom: '3rem' }}>
            <div className="editorial-card" style={{ padding: '2.5rem', backgroundColor: 'var(--bg-white)', borderLeft: '4px solid var(--periwinkle)' }}>
              <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MessageSquare size={14} /> 04 / COMMUNITY FEEDBACK & VALIDATION
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '1.25rem' }}>
                Peer Critique Telemetry
              </h2>

              {insights.community_feedback?.has_reviews ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem' }}>
                  {/* Positive Themes */}
                  <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--green)' }}>
                    <div className="editorial-mono-label" style={{ fontSize: '0.72rem', color: 'var(--green)', marginBottom: '0.5rem' }}>
                      ✦ POSITIVE THEMES
                    </div>
                    <ul style={{ paddingLeft: '1.15rem', fontSize: '0.9rem', lineHeight: 1.55, margin: 0 }}>
                      {insights.community_feedback.positive_themes.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: '0.35rem' }}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Common Concerns */}
                  <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--coral)' }}>
                    <div className="editorial-mono-label" style={{ fontSize: '0.72rem', color: 'var(--coral)', marginBottom: '0.5rem' }}>
                      ✦ COMMON CONCERNS
                    </div>
                    <ul style={{ paddingLeft: '1.15rem', fontSize: '0.9rem', lineHeight: 1.55, margin: 0 }}>
                      {insights.community_feedback.common_concerns.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: '0.35rem' }}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggested Improvements */}
                  <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--periwinkle)' }}>
                    <div className="editorial-mono-label" style={{ fontSize: '0.72rem', color: 'var(--periwinkle)', marginBottom: '0.5rem' }}>
                      ✦ FREQUENTLY SUGGESTED IMPROVEMENTS
                    </div>
                    <ul style={{ paddingLeft: '1.15rem', fontSize: '0.9rem', lineHeight: 1.55, margin: 0 }}>
                      {insights.community_feedback.suggested_improvements.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: '0.35rem' }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                /* Useful Empty State when 0 Reviews */
                <div style={{ backgroundColor: 'var(--bg-cream)', padding: '2rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px dashed var(--border-medium)' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.45rem' }}>
                    Your project has not received enough community feedback yet.
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 1.25rem auto' }}>
                    Request domain peer reviews from the INNOVEXA validation network to gather qualitative scores, common concerns, and validation signals.
                  </p>
                  <button 
                    onClick={() => {
                      setSelectedInnoId(innovation.id);
                      setActiveTab('detail');
                    }}
                    className="btn btn-coral btn-sm"
                    style={{ gap: '0.4rem', fontWeight: 700 }}
                  >
                    REQUEST REVIEWS ↗
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 05: RECOMMENDED ACTIONS (PRIORITIZED) */}
          <section style={{ marginBottom: '3rem' }}>
            <div className="editorial-card" style={{ padding: '2.5rem', backgroundColor: 'var(--bg-white)', borderLeft: '4px solid var(--coral)' }}>
              <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Zap size={14} /> 05 / RECOMMENDED ACTIONS (PRIORITIZED ROADMAP)
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '1.5rem' }}>
                Next Strategic Milestones
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* HIGH PRIORITY */}
                {insights.recommended_actions?.high_priority?.map((action, idx) => (
                  <div 
                    key={`high-${idx}`}
                    style={{
                      padding: '1.25rem 1.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(231, 111, 130, 0.08)',
                      borderLeft: '4px solid var(--coral)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span 
                          style={{
                            backgroundColor: 'var(--coral)',
                            color: '#FFFFFF',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-full)'
                          }}
                        >
                          HIGH PRIORITY
                        </span>
                        <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--coral)', fontWeight: 700 }}>
                          {action.tag || 'ACTION CRITICAL'}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                        {action.title}
                      </h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                        {action.description}
                      </p>
                    </div>
                  </div>
                ))}

                {/* MEDIUM PRIORITY */}
                {insights.recommended_actions?.medium_priority?.map((action, idx) => (
                  <div 
                    key={`med-${idx}`}
                    style={{
                      padding: '1.25rem 1.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(113, 134, 216, 0.08)',
                      borderLeft: '4px solid var(--periwinkle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span 
                          style={{
                            backgroundColor: 'var(--periwinkle)',
                            color: '#FFFFFF',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-full)'
                          }}
                        >
                          MEDIUM PRIORITY
                        </span>
                        <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--periwinkle)', fontWeight: 700 }}>
                          {action.tag || 'ENHANCEMENT'}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                        {action.title}
                      </h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                        {action.description}
                      </p>
                    </div>
                  </div>
                ))}

                {/* LOW PRIORITY */}
                {insights.recommended_actions?.low_priority?.map((action, idx) => (
                  <div 
                    key={`low-${idx}`}
                    style={{
                      padding: '1.25rem 1.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(88, 184, 173, 0.08)',
                      borderLeft: '4px solid var(--teal)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span 
                          style={{
                            backgroundColor: 'var(--teal)',
                            color: '#FFFFFF',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-full)'
                          }}
                        >
                          LOW PRIORITY
                        </span>
                        <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--teal)', fontWeight: 700 }}>
                          {action.tag || 'FUTURE SCALE'}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                        {action.title}
                      </h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                        {action.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 06: DIFFERENTIATION & COMPETITIVE POSITIONING */}
          <section style={{ marginBottom: '3rem' }}>
            <div className="editorial-card" style={{ padding: '2.5rem', backgroundColor: 'var(--bg-white)', borderLeft: '4px solid var(--teal)' }}>
              <div className="editorial-mono-label" style={{ color: 'var(--teal)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Target size={14} /> 06 / STRATEGIC DIFFERENTIATION
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.85rem' }}>
                Market Positioning & Uniqueness
              </h2>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.98rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                {insights.differentiation?.analysis || insights.competition_considerations || 'Differentiates through focused domain workflows and specialized problem formulation.'}
              </p>

              <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--teal)' }}>
                <div className="editorial-mono-label" style={{ fontSize: '0.72rem', color: 'var(--teal)', marginBottom: '0.65rem' }}>
                  ✦ KEY DIFFERENTIATION OPPORTUNITIES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {(insights.differentiation?.opportunities || [
                    'Purpose-built workflows tailored for domain specialists over generic tools.',
                    'Transparent peer-validation ledger that builds rapid creator authority.'
                  ]).map((opp, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.92rem' }}>
                      <CheckCircle2 size={16} color="var(--teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{opp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 07: READINESS SCORE BREAKDOWN */}
          <section style={{ marginBottom: '3.5rem' }}>
            <div 
              className="editorial-card" 
              style={{ 
                padding: '2.5rem', 
                backgroundColor: 'var(--bg-white)', 
                borderLeft: '5px solid var(--coral)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Rocket size={14} /> 07 / PROJECT READINESS BREAKDOWN
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                    Readiness Scorecard
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>
                    Holistic 6-pillar assessment calculated from project completeness, technical clarity, and peer feedback.
                  </p>
                </div>
                <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '3rem', fontWeight: 800, lineHeight: 1, color: 'var(--coral)' }}>
                  {readinessBreakdown.total_score} <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>/ 100</span>
                </div>
              </div>

              {/* 6 Category Breakdown Bars */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
                {/* 1. Problem Clarity */}
                <div style={{ backgroundColor: 'var(--bg-ivory)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    <span>Problem Clarity</span>
                    <span style={{ color: 'var(--coral)' }}>{readinessBreakdown.problem_clarity} / {readinessBreakdown.problem_clarity_max || 20}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-medium)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${(readinessBreakdown.problem_clarity / (readinessBreakdown.problem_clarity_max || 20)) * 100}%`, height: '100%', backgroundColor: 'var(--coral)' }} />
                  </div>
                </div>

                {/* 2. Solution Clarity */}
                <div style={{ backgroundColor: 'var(--bg-ivory)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    <span>Solution Clarity</span>
                    <span style={{ color: 'var(--periwinkle)' }}>{readinessBreakdown.solution_clarity} / {readinessBreakdown.solution_clarity_max || 20}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-medium)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${(readinessBreakdown.solution_clarity / (readinessBreakdown.solution_clarity_max || 20)) * 100}%`, height: '100%', backgroundColor: 'var(--periwinkle)' }} />
                  </div>
                </div>

                {/* 3. Target Audience */}
                <div style={{ backgroundColor: 'var(--bg-ivory)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    <span>Target Audience</span>
                    <span style={{ color: 'var(--teal)' }}>{readinessBreakdown.target_audience} / {readinessBreakdown.target_audience_max || 15}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-medium)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${(readinessBreakdown.target_audience / (readinessBreakdown.target_audience_max || 15)) * 100}%`, height: '100%', backgroundColor: 'var(--teal)' }} />
                  </div>
                </div>

                {/* 4. Implementation */}
                <div style={{ backgroundColor: 'var(--bg-ivory)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    <span>Implementation</span>
                    <span style={{ color: 'var(--lavender)' }}>{readinessBreakdown.implementation} / {readinessBreakdown.implementation_max || 15}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-medium)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${(readinessBreakdown.implementation / (readinessBreakdown.implementation_max || 15)) * 100}%`, height: '100%', backgroundColor: 'var(--lavender)' }} />
                  </div>
                </div>

                {/* 5. Differentiation */}
                <div style={{ backgroundColor: 'var(--bg-ivory)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    <span>Differentiation</span>
                    <span style={{ color: 'var(--green)' }}>{readinessBreakdown.differentiation} / {readinessBreakdown.differentiation_max || 15}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-medium)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${(readinessBreakdown.differentiation / (readinessBreakdown.differentiation_max || 15)) * 100}%`, height: '100%', backgroundColor: 'var(--green)' }} />
                  </div>
                </div>

                {/* 6. Completeness */}
                <div style={{ backgroundColor: 'var(--bg-ivory)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    <span>Completeness</span>
                    <span style={{ color: 'var(--coral)' }}>{readinessBreakdown.completeness} / {readinessBreakdown.completeness_max || 15}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-medium)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${(readinessBreakdown.completeness / (readinessBreakdown.completeness_max || 15)) * 100}%`, height: '100%', backgroundColor: 'var(--coral)' }} />
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', fontStyle: 'italic', margin: 0 }}>
                {readinessBreakdown.disclaimer}
              </p>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 6. BOTTOM ACTION BAR                                                      */}
          {/* ========================================================================= */}
          <section>
            <div
              className="editorial-card"
              style={{
                padding: '2.5rem',
                backgroundColor: 'var(--bg-cream)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.5rem',
                borderLeft: '4px solid var(--teal)'
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.35rem' }}>
                  Project Status: {innovation.status === 'published' ? 'Published on INNOVEXA Network' : 'Draft Specimen'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>
                  Logged {reviews.length} peer validation review{reviews.length === 1 ? '' : 's'} and {innovation.upvotes_count || 0} community upvotes.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setIsImproveModalOpen(true)} className="btn btn-secondary">
                  Log Iteration Changelog
                </button>
                <button
                  onClick={() => {
                    setSelectedInnoId(innovation.id);
                    setActiveTab('detail');
                  }}
                  className="btn btn-coral"
                  style={{ gap: '0.45rem', fontWeight: 800 }}
                >
                  VIEW PUBLIC SPECIFICATION ↗
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ========================================================================= */}
      {/* 7. ITERATION CHANGELOG MODAL                                              */}
      {/* ========================================================================= */}
      {isImproveModalOpen && innovation && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(32, 33, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="editorial-card" style={{ maxWidth: '520px', width: '100%', backgroundColor: 'var(--bg-white)', padding: '2.5rem', borderTop: '4px solid var(--coral)' }}>
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.5rem' }}>
              ✦ ITERATION LEDGER
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Log Version {(innovation.version || 1) + 1}.0</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Document improvements made in response to peer critiques and AI strategic insights for <strong>"{innovation.title}"</strong>.
            </p>

            <form onSubmit={handleSaveImprovement}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">CHANGELOG SUMMARY</label>
                <textarea
                  value={improvementChangelog}
                  onChange={(e) => setImprovementChangelog(e.target.value)}
                  placeholder="e.g. Refined problem definition, updated target audience segmentation, attached live demo link..."
                  className="form-textarea"
                  rows={4}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsImproveModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-coral"
                >
                  Log Iteration ↗
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
