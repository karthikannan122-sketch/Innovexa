import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { generateFeedbackInsights, generateProjectPersonalInsights } from '../services/aiInsights';
import { TrendAnalysisAgent } from '../services/aiAgents';
import { getCategoryInk, BRAND_COLORS } from '../utils/categoryColors';
import StatusBadge, { StageBadge } from '../components/StatusBadge';
import CountUp from '../components/CountUp';
import { 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Heart, 
  MessageSquare, 
  ThumbsUp, 
  Share2, 
  Users, 
  ArrowUpRight, 
  PlusCircle, 
  Compass, 
  Radio, 
  Layers, 
  Activity, 
  Award, 
  Lightbulb, 
  Globe, 
  Flame, 
  RotateCcw,
  BrainCircuit,
  Wrench,
  Rocket,
  Target,
  ShieldAlert,
  Zap,
  FolderKanban,
  Check,
  TrendingDown,
  LineChart,
  AlertCircle
} from 'lucide-react';

/**
 * InsightsPage — Real-Time Personal Project AI Insights, Readiness & Platform Telemetry
 */
export default function InsightsPage({ setActiveTab, setSelectedInnoId, selectedInnoId }) {
  const { currentUser } = useAuth();
  const [insightsData, setInsightsData] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(selectedInnoId || null);
  const [activeProjectInsights, setActiveProjectInsights] = useState(null);
  const [activeProjectReviews, setActiveProjectReviews] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [scopeFilter, setScopeFilter] = useState('MY_PROJECTS'); // 'MY_PROJECTS' | 'ALL_RESOURCES'
  const [trendAgentResult, setTrendAgentResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const insightsCacheRef = useRef(new Map());
  const reqCountRef = useRef(0);
  const activeProjectIdRef = useRef(activeProjectId);
  activeProjectIdRef.current = activeProjectId;

  const loadData = async (isInitial = false) => {
    if (isInitial) {
      setIsLoading(true);
    }
    setLoadError(null);
    try {
      // 1. Fetch user projects and all platform resources in parallel
      const [userProjsRes, allProjsRes, revsRes] = await Promise.all([
        currentUser?.id ? SupabaseService.getUserProjects(currentUser.id) : Promise.resolve({ data: [] }),
        SupabaseService.getProjects(),
        SupabaseService.getReviews()
      ]);

      const myProjs = userProjsRes.data || (currentUser?.id ? StorageService.getInnovationsByUserId(currentUser.id) : []) || [];
      const allProjs = allProjsRes.data || StorageService.getInnovations() || [];

      setUserProjects(myProjs);
      setAllProjects(allProjs);

      if (myProjs.length === 0) {
        setScopeFilter('ALL_RESOURCES');
      }

      // 2. Determine target project for deep AI insight view
      const combined = [...myProjs, ...allProjs.filter(p => !myProjs.some(m => m.id === p.id))];
      let targetProj = null;
      if (selectedInnoId) {
        targetProj = combined.find(p => p.id === selectedInnoId);
      }
      if (!targetProj && activeProjectIdRef.current) {
        targetProj = combined.find(p => p.id === activeProjectIdRef.current);
      }
      if (!targetProj) {
        targetProj = myProjs.length > 0 ? myProjs[0] : (allProjs.length > 0 ? allProjs[0] : null);
      }

      if (targetProj) {
        setActiveProjectId(targetProj.id);
        if (insightsCacheRef.current.has(targetProj.id)) {
          const cached = insightsCacheRef.current.get(targetProj.id);
          setActiveProjectReviews(cached.reviews || []);
          setActiveProjectInsights(cached.insights || null);
        } else {
          const pRevsRes = await SupabaseService.getReviews(targetProj.id);
          const pReviews = pRevsRes.data || StorageService.getReviewsForInnovation(targetProj.id) || [];
          setActiveProjectReviews(pReviews);

          const pInsights = await generateFeedbackInsights(targetProj, pReviews);
          insightsCacheRef.current.set(targetProj.id, { reviews: pReviews, insights: pInsights });
          setActiveProjectInsights(pInsights);
        }
      } else {
        setActiveProjectInsights(null);
        setActiveProjectReviews([]);
      }

      // 3. Fetch global telemetry & personal scorecard data
      const data = await SupabaseService.getInsightsData(currentUser?.id);
      setInsightsData(data);

      // 4. AI Feature 5: Trend Analysis Agent Execution
      const allRevs = revsRes.data || StorageService.getReviews() || [];
      const allLikes = StorageService.getVotes().filter(v => v.target_type === 'project' && v.vote_type === 'upvote');
      const trendRes = await TrendAnalysisAgent.analyze({
        projects: allProjs,
        reviews: allRevs,
        likes: allLikes,
        categories: StorageService.getCategories()
      });
      if (trendRes.success && trendRes.data) {
        setTrendAgentResult(trendRes.data);
      }
    } catch (err) {
      console.error('[InsightsPage loadData error]:', err);
      setLoadError('Unable to load latest telemetry. Displaying cached insights.');
      const fallback = StorageService.getUserInnovationInsights(currentUser?.id);
      setInsightsData({
        personal: {
          hasPersonalProjects: (fallback?.activity?.projectsCreated || 0) > 0,
          projectsCreated: fallback?.activity?.projectsCreated || 0,
          reviewsReceived: fallback?.feedbackInsights?.totalReviewsReceived || 0,
          reviewsGiven: fallback?.activity?.reviewsGiven || 0,
          likesReceived: 0,
          dislikesReceived: 0,
          helpfulVotesReceived: fallback?.activity?.helpfulVotesReceived || 0,
          resourcesShared: fallback?.activity?.resourcesShared || 0,
          discussionsStarted: fallback?.activity?.discussionsStarted || 0,
          mostReviewedProject: null,
          mostLikedProject: null,
          categoryDistribution: [],
          projectPerformance: fallback?.projectPerformance || [],
          feedbackInsights: fallback?.feedbackInsights || {
            totalReviewsReceived: 0,
            topStrengths: [],
            commonConcerns: [],
            recommendedAction: 'Invite community members to review your specimen.'
          },
          communityImpact: fallback?.communityImpact || {
            reviewsReceived: 0,
            helpfulVotes: 0,
            resourcesShared: 0,
            discussionParticipation: 0
          }
        },
        platform: {
          totalProjects: StorageService.getInnovations().length,
          totalReviews: StorageService.getReviews().length,
          totalLikes: 0,
          totalCategories: 6,
          popularCategories: [],
          trendingProjects: StorageService.getInnovations().slice(0, 4),
          recentlyAddedProjects: StorageService.getInnovations().slice(0, 4),
          mostReviewedProjects: StorageService.getInnovations().slice(0, 4),
          communityVelocityScore: 100
        }
      });
    } finally {
      if (isInitial) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData(true);
    const handler = () => loadData(false);
    window.addEventListener('innovexa:datachange', handler);
    return () => window.removeEventListener('innovexa:datachange', handler);
  }, [currentUser?.id]);

  useEffect(() => {
    if (selectedInnoId && selectedInnoId !== activeProjectId) {
      setActiveProjectId(selectedInnoId);
    }
  }, [selectedInnoId]);

  const handleSelectProject = async (proj, forceRefresh = false) => {
    if (!proj) return;
    setActiveProjectId(proj.id);
    if (setSelectedInnoId && selectedInnoId !== proj.id) {
      setSelectedInnoId(proj.id);
    }

    if (!forceRefresh && insightsCacheRef.current.has(proj.id)) {
      const cached = insightsCacheRef.current.get(proj.id);
      setActiveProjectReviews(cached.reviews || []);
      setActiveProjectInsights(cached.insights || null);
      return;
    }

    const currentReq = ++reqCountRef.current;
    const revsRes = await SupabaseService.getReviews(proj.id);
    if (currentReq !== reqCountRef.current) return;
    const pReviews = revsRes.data || StorageService.getReviewsForInnovation(proj.id) || [];
    setActiveProjectReviews(pReviews);
    const pInsights = await generateFeedbackInsights(proj, pReviews, forceRefresh);
    if (currentReq !== reqCountRef.current) return;
    insightsCacheRef.current.set(proj.id, { reviews: pReviews, insights: pInsights });
    setActiveProjectInsights(pInsights);
  };

  const personal = insightsData?.personal || {};
  const platform = insightsData?.platform || {};

  const activity = {
    projectsCreated: userProjects.length || personal.projectsCreated || 0,
    reviewsGiven: personal.reviewsGiven || 0,
    resourcesShared: personal.resourcesShared || 0,
    discussionsStarted: personal.discussionsStarted || 0,
    helpfulVotesReceived: personal.helpfulVotesReceived || 0
  };

  const projectPerformance = personal.projectPerformance || [];
  const popularCategories = platform.popularCategories || [];
  const trendingProjects = platform.trendingProjects || [];
  const hasPersonalProjects = userProjects.length > 0;

  const currentPool = (scopeFilter === 'MY_PROJECTS' && hasPersonalProjects) ? userProjects : (allProjects.length > 0 ? allProjects : userProjects);
  const currentProject = currentPool.find(p => p.id === activeProjectId) || currentPool[0] || userProjects[0] || allProjects[0];
  const isCurrentProjectMine = currentUser && currentProject && (currentProject.user_id === currentUser.id || currentProject.creator_id === currentUser.id);
  const currentInk = currentProject ? getCategoryInk(currentProject.category_id, currentProject.category_name) : null;
  const readiness = activeProjectInsights?.readiness || { score: 70, max_score: 100, disclaimer: 'AI-generated estimate based on the information currently provided.' };

  return (
    <div className="workspace-container">
      {/* 1. EDITORIAL HERO HEADER */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <BrainCircuit size={15} /> PERSONAL AI INSIGHTS & READINESS
        </div>

        <div style={{ lineHeight: 0.98, marginBottom: '1.25rem' }}>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.8rem, 6vw, 4.8rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
            AI INSIGHTS & READINESS
          </div>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.8rem, 6vw, 4.8rem)', fontWeight: 800, color: 'var(--coral)', fontStyle: 'italic', margin: '0.2rem 0' }}>
            BASED ON YOUR PROJECT.
          </div>
          <div className="editorial-sans-bold" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 2rem)', color: 'var(--text-secondary)' }}>
            STRATEGIC EVALUATION, PROBLEM FIT & VALIDATED ACTION ROADMAP.
          </div>
        </div>

        <p className="editorial-lead" style={{ maxWidth: '720px', color: 'var(--text-secondary)' }}>
          Review personalized AI insights, problem clarity benchmarks, value proposition strengths, identified gaps, feasibility vectors, and next milestones generated specifically for your innovation specimen.
        </p>

        {loadError && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1.25rem', backgroundColor: 'rgba(231, 111, 130, 0.1)', borderLeft: '3px solid var(--coral)', color: 'var(--coral)', fontSize: '0.88rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{loadError}</span>
            <button onClick={loadData} className="btn btn-secondary btn-sm" style={{ gap: '0.35rem' }}>
              <RotateCcw size={12} /> Retry Sync
            </button>
          </div>
        )}
      </section>

      {/* 2. PROJECT & RESOURCE SELECTOR */}
      {currentPool.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ padding: '1.25rem 1.5rem', backgroundColor: 'var(--bg-white)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hairline)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {hasPersonalProjects && (
                  <button
                    onClick={() => setScopeFilter('MY_PROJECTS')}
                    className={`btn btn-sm ${scopeFilter === 'MY_PROJECTS' ? 'btn-coral' : 'btn-secondary'}`}
                    style={{ fontSize: '0.78rem', fontWeight: 700 }}
                  >
                    ★ My Projects ({userProjects.length})
                  </button>
                )}
                <button
                  onClick={() => setScopeFilter('ALL_RESOURCES')}
                  className={`btn btn-sm ${scopeFilter === 'ALL_RESOURCES' ? 'btn-coral' : 'btn-secondary'}`}
                  style={{ fontSize: '0.78rem', fontWeight: 700 }}
                >
                  ✦ All Catalog Resources ({allProjects.length})
                </button>
              </div>

              <span className="editorial-mono-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {isCurrentProjectMine ? 'SHOWING YOUR PROJECT' : 'SHOWING PLATFORM RESOURCE'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {currentPool.slice(0, 8).map(p => {
                const isActive = p.id === currentProject?.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProject(p)}
                    className={`btn btn-sm ${isActive ? 'btn-coral' : 'btn-secondary'}`}
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: isActive ? 700 : 500,
                      padding: '0.35rem 0.9rem'
                    }}
                  >
                    {p.title}
                  </button>
                );
              })}

              {currentPool.length > 8 && (
                <select
                  value={currentProject?.id || ''}
                  onChange={e => {
                    const found = currentPool.find(p => p.id === e.target.value);
                    if (found) handleSelectProject(found);
                  }}
                  className="form-select"
                  style={{ height: '32px', fontSize: '0.8rem', padding: '0.2rem 1.5rem 0.2rem 0.6rem', fontWeight: 600 }}
                >
                  {currentPool.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 3. PRIMARY EVALUATION CARD (DYNAMICALLY GENERATED FOR SELECTED SPECIMEN) */}
      {currentProject && !activeProjectInsights ? (
        <section style={{ marginBottom: '3.5rem' }}>
          <div
            className="editorial-card"
            style={{
              padding: '3.5rem 2rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-white)',
              borderLeft: `5px solid ${currentInk?.hex || 'var(--coral)'}`
            }}
          >
            <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--coral)', borderRadius: '50%', margin: '0 auto 1rem auto' }} />
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.5rem' }}>
              ✦ AI INNOVATION ANALYST
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.35rem' }}>
              ANALYZING "{currentProject.title.toUpperCase()}"...
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '480px', margin: '0 auto' }}>
              Synthesizing dynamic AI insights based on actual problem formulation, technical features, and validation criteria.
            </p>
          </div>
        </section>
      ) : null}

      {currentProject && activeProjectInsights ? (
        <section style={{ marginBottom: '3.5rem' }}>
          <div
            className="editorial-card"
            style={{
              padding: '2.5rem',
              backgroundColor: 'var(--bg-white)',
              borderLeft: `5px solid ${currentInk?.hex || 'var(--coral)'}`,
              marginBottom: '2rem'
            }}
          >
            {/* Top Specimen Banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
                  <span className={`category-tag ${currentInk?.tagClass}`}>
                    {currentProject.category_name || 'Technology'}
                  </span>
                  <StageBadge stage={currentProject.project_stage || (currentProject.creation_type === 'PRODUCT' ? 'prototype' : 'idea')} />
                  <StatusBadge status={currentProject.status} />
                  <span className="mono" style={{ fontSize: '0.74rem', color: isCurrentProjectMine ? 'var(--coral)' : 'var(--teal)', fontWeight: 700 }}>
                    {isCurrentProjectMine ? '★ YOUR PROJECT SPECIMEN' : '✦ PLATFORM RESOURCE'}
                  </span>
                </div>

                <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.15 }}>
                  {currentProject.title}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '680px', lineHeight: 1.5 }}>
                  {currentProject.short_description || currentProject.description}
                </p>
              </div>

              {/* Readiness Score Gauge */}
              <div
                style={{
                  backgroundColor: 'var(--bg-cream)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem 1.75rem',
                  textAlign: 'center',
                  minWidth: '180px'
                }}
              >
                <div className="editorial-mono-label" style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  PROJECT READINESS
                </div>
                <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.8rem', fontWeight: 800, color: 'var(--coral)', lineHeight: 1 }}>
                  <CountUp value={readiness.score || 72} />
                  <span style={{ fontSize: '1.4rem', color: 'var(--text-secondary)' }}>/100</span>
                </div>
                <div className="mono" style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--green)', marginTop: '0.35rem' }}>
                  ★ AI ESTIMATE
                </div>
              </div>
            </div>

            {/* 10-POINT AI INSIGHTS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              
              {/* 1. Problem Clarity */}
              <div className="editorial-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-cream)', borderLeft: '4px solid var(--coral)' }}>
                <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>PROBLEM CLARITY</span>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: activeProjectInsights.problem_clarity?.status === 'CLEAR' ? 'rgba(105, 184, 154, 0.15)' : 'rgba(231, 111, 130, 0.15)',
                    color: activeProjectInsights.problem_clarity?.status === 'CLEAR' ? 'var(--green)' : 'var(--coral)'
                  }}>
                    {activeProjectInsights.problem_clarity?.status || 'CLEAR'}
                  </span>
                </div>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                  {activeProjectInsights.problem_clarity?.analysis || 'The problem space is clearly identifiable for initial peer validation.'}
                </p>
                {currentProject.problem_statement && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-hairline)', fontSize: '0.84rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    "{currentProject.problem_statement.slice(0, 140)}{currentProject.problem_statement.length > 140 ? '...' : ''}"
                  </div>
                )}
              </div>

              {/* 2. Value Proposition */}
              <div className="editorial-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-cream)', borderLeft: '4px solid var(--periwinkle)' }}>
                <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '0.5rem' }}>
                  VALUE PROPOSITION
                </div>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                  {activeProjectInsights.value_proposition || 'Delivers a targeted solution to streamline workflows and deliver measurable efficiency for practitioners.'}
                </p>
              </div>

              {/* 3. Target Audience */}
              <div className="editorial-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-cream)', borderLeft: '4px solid var(--teal)' }}>
                <div className="editorial-mono-label" style={{ color: 'var(--teal)', marginBottom: '0.5rem' }}>
                  TARGET AUDIENCE
                </div>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                  {activeProjectInsights.target_audience || 'Professionals, developers, and practitioners seeking domain optimization.'}
                </p>
              </div>

              {/* 4. Strategic Differentiation */}
              <div className="editorial-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-cream)', borderLeft: '4px solid var(--green)' }}>
                <div className="editorial-mono-label" style={{ color: 'var(--green)', marginBottom: '0.5rem' }}>
                  STRATEGIC DIFFERENTIATION
                </div>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                  {activeProjectInsights.differentiation || 'Focus on specialized workflow depth rather than broad feature parity to build a defensible niche.'}
                </p>
              </div>

              {/* 5. Key Strengths */}
              <div className="editorial-card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-white)', borderLeft: '4px solid var(--green)' }}>
                <div className="editorial-mono-label" style={{ color: 'var(--green)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={14} /> DOMAIN STRENGTHS ({activeProjectInsights.strengths?.length || 0})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(activeProjectInsights.strengths || []).map((str, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--green)', fontWeight: 800 }}>✓</span>
                      <span style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>{str}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Improvement Gaps */}
              <div className="editorial-card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-white)', borderLeft: '4px solid var(--coral)' }}>
                <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertCircle size={14} /> ACTIONABLE GAPS ({activeProjectInsights.gaps?.length || 0})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(activeProjectInsights.gaps || []).map((gap, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--coral)', fontWeight: 800 }}>!</span>
                      <span style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>{gap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. Actionable Next Milestones */}
              <div className="editorial-card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-white)', borderLeft: '4px solid var(--periwinkle)', gridColumn: '1 / -1' }}>
                <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={14} /> RECOMMENDED ROADMAP & NEXT MILESTONES
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  {(activeProjectInsights.next_steps || activeProjectInsights.recommendations || []).map((step, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '1rem 1.25rem',
                        backgroundColor: 'var(--bg-cream)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-hairline)',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-start'
                      }}
                    >
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--periwinkle)',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        flexShrink: 0
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom Actions Bar */}
            <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <Heart size={13} color="var(--coral)" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem' }} />
                  <strong>{currentProject.upvotes_count || 0}</strong> Supporters
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <MessageSquare size={13} color="var(--periwinkle)" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem' }} />
                  <strong>{activeProjectReviews.length}</strong> Peer Reviews
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setSelectedInnoId(currentProject.id);
                    setActiveTab('detail');
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  View Specimen Detail
                </button>
                <button
                  onClick={() => {
                    setSelectedInnoId(currentProject.id);
                    setActiveTab('insight');
                  }}
                  className="btn btn-coral btn-sm"
                  style={{ gap: '0.4rem', fontWeight: 700 }}
                >
                  <BrainCircuit size={14} /> Full AI Deep-Dive Report <ArrowUpRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* 4. ONBOARDING PROMPT (When user has zero personal specimens) */}
      {!hasPersonalProjects && (
        <div 
          className="editorial-card"
          style={{
            padding: '2.5rem 2rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-white)',
            borderLeft: '4px solid var(--coral)',
            marginBottom: '3.5rem'
          }}
        >
          <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.5rem' }}>
            ✦ WANT TAILORED INSIGHTS FOR YOUR OWN IDEA?
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Submit Your Innovation Specimen
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', maxWidth: '580px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
            Submit an innovation specimen to automatically generate tailored AI insights, problem clarity benchmarks, strategic differentiation, and readiness scoring based directly on your project.
          </p>
          <button
            onClick={() => setActiveTab('submit')}
            className="btn btn-coral"
            style={{ gap: '0.5rem' }}
          >
            <PlusCircle size={15} /> Submit Innovation Specimen ↗
          </button>
        </div>
      )}

      {/* 5. YOUR INNOVATION ACTIVITY SCORECARD */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.75rem' }}>
          YOUR INNOVATION ACTIVITY
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.25rem'
        }}>
          <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--coral)', backgroundColor: 'var(--bg-white)' }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--coral)' }}>
              <CountUp value={activity.projectsCreated} />
            </div>
            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Specimens Created</div>
          </div>

          <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--periwinkle)', backgroundColor: 'var(--bg-white)' }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--periwinkle)' }}>
              <CountUp value={activity.reviewsGiven} />
            </div>
            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Reviews Contributed</div>
          </div>

          <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--teal)', backgroundColor: 'var(--bg-white)' }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--teal)' }}>
              <CountUp value={activity.resourcesShared} />
            </div>
            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Resources Shared</div>
          </div>

          <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--lavender)', backgroundColor: 'var(--bg-white)' }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--lavender)' }}>
              <CountUp value={activity.discussionsStarted} />
            </div>
            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Discussions Launched</div>
          </div>

          <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--green)', backgroundColor: 'var(--bg-white)' }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--green)' }}>
              <CountUp value={activity.helpfulVotesReceived} />
            </div>
            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Helpful Votes Earned</div>
          </div>
        </div>
      </section>

      {/* 6. ALL MY PROJECTS PERFORMANCE MATRIX (If user has multiple projects) */}
      {userProjects.length > 1 && (
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.25rem' }}>
                PORTFOLIO MATRIX
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                All Your Projects Performance
              </h2>
            </div>
            <span className="mono" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              {userProjects.length} ACTIVE SPECIMENS
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {userProjects.map(p => {
              const ink = getCategoryInk(p.category_id, p.category_name);
              const isSelected = p.id === currentProject?.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectProject(p)}
                  className="editorial-card hover-lift"
                  style={{
                    padding: '1.75rem',
                    borderLeft: `4px solid ${ink.hex || 'var(--coral)'}`,
                    backgroundColor: isSelected ? 'rgba(231, 111, 130, 0.04)' : 'var(--bg-white)',
                    border: isSelected ? '2px solid var(--coral)' : '1px solid var(--border-hairline)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className={`category-tag ${ink.tagClass}`} style={{ fontSize: '0.65rem' }}>
                        {p.category_name || 'Technology'}
                      </span>
                      {isSelected && (
                        <span className="editorial-mono-label" style={{ color: 'var(--coral)', fontSize: '0.68rem', fontWeight: 800 }}>
                          ✓ CURRENTLY INSPECTING
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>{p.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.45, marginBottom: '1rem' }}>
                      {p.short_description || p.description?.slice(0, 100)}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--coral)', fontWeight: 700 }}>
                      <Heart size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {p.upvotes_count || 0}
                    </span>
                    <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      Inspect Insights ↗
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 7. GLOBAL PLATFORM & COMMUNITY TELEMETRY */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div className="editorial-mono-label" style={{ color: 'var(--teal)', marginBottom: '0.25rem' }}>
              NETWORK TELEMETRY
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              Live Platform Consensus Ledger
            </h2>
          </div>
          <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Radio size={12} className="animate-pulse" /> SYNCHRONIZED ACROSS NETWORK
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem'
        }}>
          <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--teal)', backgroundColor: 'var(--bg-white)' }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--teal)' }}>
              <CountUp value={platform.totalProjects || 0} />
            </div>
            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Active Network Hypotheses</div>
          </div>

          <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--periwinkle)', backgroundColor: 'var(--bg-white)' }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--periwinkle)' }}>
              <CountUp value={platform.totalReviews || 0} />
            </div>
            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Peer Reviews Contributed</div>
          </div>

          <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--coral)', backgroundColor: 'var(--bg-white)' }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--coral)' }}>
              <CountUp value={platform.totalLikes || 0} />
            </div>
            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Positive Endorsements</div>
          </div>

          <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--green)', backgroundColor: 'var(--bg-white)' }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--green)' }}>
              <CountUp value={popularCategories.length || 6} />
            </div>
            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Innovation Sectors</div>
          </div>
        </div>

        {/* AI Feature 5: Trend Analysis Agent Deep Insights Section */}
        {trendAgentResult && trendAgentResult.hasData && (
          <div
            className="editorial-card"
            style={{
              backgroundColor: 'var(--bg-white)',
              borderLeft: '4px solid var(--periwinkle)',
              padding: '2rem',
              marginTop: '1.75rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} color="var(--periwinkle)" />
                <span className="editorial-mono-label" style={{ color: 'var(--periwinkle)' }}>
                  ✦ AI TREND ANALYSIS AGENT
                </span>
              </div>
              <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {trendAgentResult.total_projects_analyzed} PROJECTS & {trendAgentResult.total_reviews_analyzed} REVIEWS ANALYZED
              </span>
            </div>

            {/* Grid of Trend Insights */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem', marginBottom: '1.75rem' }}>
              {/* Trending Categories */}
              <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--coral)', marginBottom: '0.85rem' }}>
                  TOP TRENDING CATEGORIES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {(trendAgentResult.trending_categories || []).map((cat, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                        <span>{cat.name}</span>
                        <span className="mono" style={{ color: 'var(--coral)' }}>{cat.count} innovations ({cat.velocity_score}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${cat.velocity_score}%`, height: '100%', backgroundColor: 'var(--coral)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Most Discussed Topics / Real Keywords */}
              <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--teal)', marginBottom: '0.85rem' }}>
                  MOST DISCUSSED TOPICS & KEYWORDS
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {(trendAgentResult.most_discussed_topics || []).map((t, i) => (
                    <span
                      key={i}
                      className="filter-chip active"
                      style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <span>{t.topic}</span>
                      <span className="mono" style={{ fontSize: '0.68rem', opacity: 0.8, backgroundColor: 'rgba(255,255,255,0.2)', padding: '1px 5px', borderRadius: '10px' }}>
                        {t.frequency}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Emerging Opportunities */}
            <div>
              <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--green)', marginBottom: '0.65rem' }}>
                EMERGING OPPORTUNITIES & CROSS-SECTOR CONVERGENCE (AI ANALYSIS)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {(trendAgentResult.emerging_opportunities || []).map((opp, i) => (
                  <div key={i} style={{ fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <Sparkles size={14} color="var(--green)" style={{ flexShrink: 0, marginTop: '3px' }} />
                    <span>{opp}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              <span className="mono">{trendAgentResult.disclaimer}</span>
              <span className="mono" style={{ color: 'var(--green)' }}>● REALTIME LEDGER AGGREGATED</span>
            </div>
          </div>
        )}
      </section>

      {/* 8. TRENDING NETWORK INNOVATIONS */}
      {trendingProjects.length > 0 && (
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Flame size={13} /> TRENDING INNOVATIONS
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                High-Momentum Community Hypotheses
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('explore')}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.35rem' }}
            >
              Explore All {platform.totalProjects || 0} Innovations <ArrowUpRight size={13} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {trendingProjects.slice(0, 3).map(p => {
              const ink = getCategoryInk(p.category_id, p.category_name);
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedInnoId(p.id);
                    setActiveTab('detail');
                  }}
                  className="editorial-card hover-lift"
                  style={{
                    padding: '1.75rem',
                    borderLeft: `4px solid ${ink.hex || 'var(--coral)'}`,
                    backgroundColor: 'var(--bg-white)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span className={`category-tag ${ink.tagClass}`} style={{ fontSize: '0.65rem' }}>
                        {p.category_name}
                      </span>
                      <span className="editorial-mono-label" style={{ fontSize: '0.65rem', color: 'var(--coral)', fontWeight: 700 }}>
                        ★ POPULAR
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.45rem', lineHeight: 1.25 }}>
                      {p.title}
                    </h3>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                      {p.short_description || p.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: '0.85rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Heart size={12} color="var(--coral)" /> {p.upvotes_count || 0}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MessageSquare size={12} color="var(--periwinkle)" /> {p.reviews_count || 0} reviews
                      </span>
                    </div>

                    <span className="mono" style={{ color: 'var(--coral)', fontWeight: 700, fontSize: '0.75rem' }}>
                      Inspect ↗
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 9. POPULAR DOMAIN CATEGORIES */}
      {popularCategories.length > 0 && (
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '0.25rem' }}>
                DOMAIN TAXONOMY
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                Popular Innovation Sectors
              </h2>
            </div>
            <span className="mono" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              {popularCategories.length} ACTIVE DOMAINS
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {popularCategories.map(cat => {
              const ink = getCategoryInk(null, cat.name);
              return (
                <div
                  key={cat.name}
                  className="editorial-card hover-lift"
                  style={{
                    padding: '1.5rem',
                    backgroundColor: 'var(--bg-white)',
                    borderLeft: `4px solid ${ink.hex || 'var(--periwinkle)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div className="editorial-mono-label" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      SECTOR
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      {cat.name}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: '0.75rem' }}>
                    <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {cat.count} Specimen{cat.count === 1 ? '' : 's'}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: ink.hex || 'var(--periwinkle)' }}>
                      {cat.percentage}% share
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 10. COMMUNITY IMPACT LEDGER */}
      <section style={{ marginBottom: '3rem' }}>
        <div className="editorial-mono-label" style={{ color: 'var(--teal)', marginBottom: '0.5rem' }}>
          COMMUNITY IMPACT LEDGER
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1.5rem' }}>
          Your Collective Platform Footprint
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--periwinkle)', backgroundColor: 'var(--bg-white)' }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--periwinkle)' }}>
              <CountUp value={personal.reviewsReceived || 0} />
            </div>
            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Reviews Received</div>
          </div>

          <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--coral)', backgroundColor: 'var(--bg-white)' }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--coral)' }}>
              <CountUp value={activity.helpfulVotesReceived || 0} />
            </div>
            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Helpful Votes Earned</div>
          </div>

          <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--teal)', backgroundColor: 'var(--bg-white)' }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--teal)' }}>
              <CountUp value={activity.resourcesShared || 0} />
            </div>
            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Resources Shared</div>
          </div>

          <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--green)', backgroundColor: 'var(--bg-white)' }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--green)' }}>
              <CountUp value={activity.discussionsStarted || 0} />
            </div>
            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Community Replies</div>
          </div>
        </div>
      </section>
    </div>
  );
}

