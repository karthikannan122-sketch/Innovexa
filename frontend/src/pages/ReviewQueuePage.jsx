import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { getCategoryInk, BRAND_COLORS } from '../utils/categoryColors';
import StatusBadge, { StageBadge, FeaturedDemoBadge } from '../components/StatusBadge';
import CountUp from '../components/CountUp';
import { 
  CheckSquare, 
  Clock, 
  ArrowRight, 
  ArrowUpRight, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  HelpCircle,
  Inbox,
  Compass,
  Radio,
  ExternalLink,
  Heart,
  MessageSquare
} from 'lucide-react';

/**
 * ReviewQueuePage — Matched Validator Queue & Reference Discoveries
 */
export default function ReviewQueuePage({ setActiveTab, setSelectedInnoId, setSelectedAssignmentId }) {
  const { currentUser, showToast } = useAuth();
  const [assignments, setAssignments] = useState(() => {
    return currentUser ? (StorageService.getAssignmentsForUser(currentUser.id) || []) : [];
  });
  const [allProjects, setAllProjects] = useState(() => StorageService.getInnovations() || []);
  const [eligibleProjects, setEligibleProjects] = useState(() => {
    const projs = StorageService.getInnovations() || [];
    if (!currentUser) return projs;
    const userReviews = StorageService.getReviewsByReviewerId(currentUser.id) || [];
    const reviewedIds = new Set(userReviews.map(r => r.project_id || r.innovation_id));
    return projs.filter(p => {
      const ownerId = p.user_id || p.creator_id;
      if (ownerId === currentUser.id) return false;
      if (reviewedIds.has(p.id)) return false;
      return true;
    });
  });
  const [referenceInnovations, setReferenceInnovations] = useState(() => {
    const ext = StorageService.getExternalInnovations() || [];
    return ext.slice(0, 4);
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    try {
      const myAssigns = currentUser ? (StorageService.getAssignmentsForUser(currentUser.id) || []) : [];
      setAssignments(myAssigns);

      const timeoutPromise = new Promise(res => setTimeout(() => res([{ data: null }, { data: null }]), 1500));
      const [projRes, extRes] = await Promise.race([
        Promise.all([
          SupabaseService.getProjects(),
          SupabaseService.getExternalInnovations()
        ]),
        timeoutPromise
      ]);

      const projs = projRes?.data || StorageService.getInnovations() || [];
      const allExt = extRes?.data || StorageService.getExternalInnovations() || [];
      setAllProjects(projs);
      setReferenceInnovations(allExt.slice(0, 4));

      if (currentUser) {
        // Collect IDs of projects reviewed by currentUser
        const userReviews = StorageService.getReviewsByReviewerId(currentUser.id) || [];
        const reviewedIds = new Set(userReviews.map(r => r.project_id || r.innovation_id));

        // Eligible = not created by currentUser AND not already reviewed by currentUser
        const eligible = projs.filter(p => {
          const ownerId = p.user_id || p.creator_id;
          if (ownerId === currentUser.id) return false;
          if (reviewedIds.has(p.id)) return false;
          return true;
        });

        setEligibleProjects(eligible);
      } else {
        setEligibleProjects(projs);
      }
    } catch (err) {
      console.warn('Error loading review queue data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener('innovexa:datachange', handler);
    return () => window.removeEventListener('innovexa:datachange', handler);
  }, [currentUser]);

  const handleStartReview = (innoId, assignId) => {
    if (setSelectedInnoId) setSelectedInnoId(innoId);
    if (setSelectedAssignmentId) setSelectedAssignmentId(assignId || null);
    setActiveTab('review_submit');
  };

  if (isLoading && eligibleProjects.length === 0) {
    return (
      <div className="workspace-container" style={{ maxWidth: '1080px', padding: '5rem 0', textAlign: 'center' }}>
        <div className="animate-spin" style={{ width: '38px', height: '38px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--coral)', borderRadius: '50%', margin: '0 auto 1.5rem auto' }} />
        <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.5rem' }}>
          ✦ ACCESSING REVIEW QUEUE
        </div>
        <h3 style={{ fontSize: '1.4rem' }}>Filtering Domain Matched Specimen...</h3>
      </div>
    );
  }

  return (
    <div className="workspace-container" style={{ maxWidth: '1080px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.45rem' }}>
          VALIDATION DESK
        </div>
        <h1 style={{ fontSize: '2.6rem', marginBottom: '0.35rem' }}>
          Matched Review Queue
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem' }}>
          Innovations algorithmically assigned to your domain fluency. Each validated review earns <strong>+10 Reputation Credits</strong>.
        </p>
      </div>

      {/* Queue Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3.5rem' }}>
        {assignments.length > 0 ? (
          assignments.map(assign => {
            const inno = eligibleProjects.find(i => i.id === assign.innovation_id) || allProjects.find(i => i.id === assign.innovation_id) || StorageService.getInnovationById(assign.innovation_id) || {
              id: assign.innovation_id,
              title: assign.title || 'Assigned Innovation',
              short_description: 'Peer validation review requested by network dispatcher.',
              category_name: assign.category_name || 'AI & Intelligence'
            };
            const ink = getCategoryInk(inno.category_id, inno.category_name);

            return (
              <div
                key={assign.id}
                className="editorial-card"
                style={{
                  padding: '2rem',
                  borderLeft: `4px solid ${ink.hex}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1.5rem'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                    <span className={`category-tag ${ink.tagClass}`}>
                      {inno.category_name}
                    </span>
                    <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Match Score: {assign.match_score ? `${Math.round(assign.match_score * 100)}%` : '95%'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.45rem', marginBottom: '0.35rem' }}>{inno.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem' }}>{inno.short_description || inno.description}</p>
                </div>

                <button
                  onClick={() => handleStartReview(inno.id, assign.id)}
                  className="btn btn-coral btn-lg"
                  style={{ whiteSpace: 'nowrap', gap: '0.5rem' }}
                >
                  START REVIEW <ArrowUpRight size={16} />
                </button>
              </div>
            );
          })
        ) : eligibleProjects.length > 0 ? (
          <div>
            <div className="editorial-card" style={{ padding: '2rem', marginBottom: '2rem', backgroundColor: 'var(--bg-cream)' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>Direct assignments queue is clear</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                You have completed all scheduled queue items. Below are open community specimens seeking validator perspective.
              </p>
            </div>

            <div className="editorial-mono-label" style={{ marginBottom: '1.25rem', color: 'var(--coral)' }}>
              OPEN COMMUNITY SPECIMENS SEEKING VALIDATORS:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {eligibleProjects.map(item => {
                const ink = getCategoryInk(item.category_id, item.category_name);
                return (
                  <div
                    key={item.id}
                    className="editorial-card hover-lift"
                    style={{
                      padding: '1.75rem 2rem',
                      borderLeft: `4px solid ${ink.hex}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1.5rem',
                      backgroundColor: 'var(--bg-white)',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ flex: '1 1 500px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                        <span className={`category-tag ${ink.tagClass}`}>
                          {item.category_name || 'Technology'}
                        </span>
                        <StageBadge stage={item.project_stage || 'concept'} />
                        {(item.is_demo || item.is_featured_example) && (
                          <FeaturedDemoBadge type={item.demo_project_type} label={item.demo_badge_label} />
                        )}
                        <span className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--coral)' }}>
                          COMMUNITY SPECIMEN ({item.valid_reviews_count || 0}/10 REVIEWS)
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.35rem', marginBottom: '0.35rem' }}>{item.title}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '0.75rem' }}>
                        {item.short_description || item.description}
                      </p>

                      <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span>Created by <strong>{item.creator_name || 'Innovator'}</strong></span>
                        <span>•</span>
                        <span><Heart size={12} style={{ display: 'inline', verticalAlign: 'middle' }} color="var(--coral)" /> {item.upvotes_count || 0} upvotes</span>
                        <span>•</span>
                        <span><MessageSquare size={12} style={{ display: 'inline', verticalAlign: 'middle' }} color="var(--periwinkle)" /> {item.valid_reviews_count || 0} reviews</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartReview(item.id, null)}
                      className="btn btn-coral"
                      style={{ whiteSpace: 'nowrap', gap: '0.45rem' }}
                    >
                      Start Review <ArrowUpRight size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ================= EXACT REQUIRED EMPTY STATE ================= */
          <div className="editorial-card" style={{ padding: '4.5rem 3rem', textAlign: 'center', backgroundColor: 'var(--bg-white)', borderLeft: '4px solid var(--periwinkle)' }}>
            <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '1.25rem' }}>
              ✦ PEER PERSPECTIVE
            </div>

            <div style={{ lineHeight: 0.98, marginBottom: '1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.8rem, 5.5vw, 4.8rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                YOUR
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.8rem, 5.5vw, 4.8rem)', fontWeight: 800, color: 'var(--periwinkle)', fontStyle: 'italic', margin: '0.2rem 0' }}>
                PERSPECTIVE
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.8rem, 5.5vw, 4.8rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                IS STILL WAITING.
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '520px', margin: '0 auto 2.5rem auto', lineHeight: 1.5 }}>
              Start exploring projects and share your thoughts with innovators.
            </p>

            <button
              onClick={() => setActiveTab('explore')}
              className="btn btn-primary btn-lg"
              style={{ padding: '1rem 2.5rem', gap: '0.5rem' }}
            >
              FIND A PROJECT ↗
            </button>
          </div>
        )}
      </div>

      {/* ================= 2. DISCOVER FOR REFERENCE SECTION ================= */}
      {referenceInnovations.length > 0 && (
        <section style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div className="editorial-mono-label" style={{ color: 'var(--teal)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Radio size={14} /> 02 / DISCOVER FOR REFERENCE
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                Global Research & Frontier Benchmarks
              </h2>
            </div>
            <button onClick={() => setActiveTab('explore')} className="btn btn-ghost btn-sm" style={{ color: 'var(--teal)', fontWeight: 700 }}>
              View Full Directory <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {referenceInnovations.map(ext => (
              <div
                key={ext.id}
                className="editorial-card hover-lift"
                style={{
                  padding: '1.5rem',
                  borderLeft: '4px solid var(--teal)',
                  backgroundColor: 'var(--bg-white)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="category-tag" style={{ fontSize: '0.65rem', backgroundColor: 'rgba(88, 184, 173, 0.12)', color: 'var(--teal)' }}>
                      {ext.category || 'Technology'}
                    </span>
                    <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                      {ext.source_name}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.05rem', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                    {ext.title}
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '1rem' }}>
                    {ext.summary || ext.ai_summary}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    GLOBAL REFERENCE
                  </span>
                  <a
                    href={ext.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.74rem', padding: '0.25rem 0.65rem', color: 'var(--teal)', borderColor: 'var(--teal)' }}
                  >
                    EXPLORE SOURCE <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
