import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { AIService } from '../services/aiService';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getCategoryInk, BRAND_COLORS } from '../utils/categoryColors';
import confetti from 'canvas-confetti';
import { 
  Clock, 
  ArrowLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles,
  HelpCircle,
  SkipForward
} from 'lucide-react';

/**
 * ReviewSubmissionPage — Focused Editorial Review Desk
 * Heading: LOOK. THINK. THEN SAY SOMETHING REAL.
 */
export default function ReviewSubmissionPage({ selectedInnoId, selectedAssignmentId, setActiveTab, setSelectedInnoId }) {
  const { currentUser, showToast } = useAuth();
  const [innovation, setInnovation] = useState(() => {
    if (selectedInnoId) {
      return StorageService.getInnovationById(selectedInnoId) || null;
    }
    const all = StorageService.getInnovations() || [];
    return all.find(i => (i.user_id || i.creator_id) !== currentUser?.id) || all[0] || null;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Review Questions State
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [aiReviewQuestions, setAiReviewQuestions] = useState([]);

  // Anti-Spam Reading Timer
  const [readingSeconds, setReadingSeconds] = useState(0);
  const [isReadingComplete, setIsReadingComplete] = useState(false);
  const timerRef = useRef(null);

  // Structured Review Questions (from prompt)
  const [solvesRealProblem, setSolvesRealProblem] = useState('YES'); // 'YES' | 'MAYBE' | 'NO'
  const [isRelevantToYou, setIsRelevantToYou] = useState('YES'); // 'YES' | 'NO'
  const [rating, setRating] = useState(5);
  const [whatShouldChange, setWhatShouldChange] = useState('');
  const [likedText, setLikedText] = useState('');
  const [alsoUpvote, setAlsoUpvote] = useState(true);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  const [isLoadingProject, setIsLoadingProject] = useState(false);

  const handleGenerateAiQuestions = async () => {
    if (!innovation) return;
    setIsGeneratingQuestions(true);
    try {
      const qs = await AIService.generateReviewQuestions(innovation);
      setAiReviewQuestions(qs || []);
      showToast(`Generated ${qs.length} AI critique guide questions!`, 'success');
    } catch (err) {
      showToast('AI critique generator unavailable.', 'warning');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Fast sync fallback right away
    if (selectedInnoId) {
      const immediate = StorageService.getInnovationById(selectedInnoId);
      if (immediate) setInnovation(immediate);
    }

    const fetchTargetProject = async () => {
      try {
        let inno = null;
        if (selectedInnoId) {
          // Timeout race of 1500ms
          const timeoutPromise = new Promise(res => setTimeout(() => res({ data: null }), 1500));
          const res = await Promise.race([SupabaseService.getProjectById(selectedInnoId), timeoutPromise]);
          inno = res?.data || StorageService.getInnovationById(selectedInnoId);
        }
        if (!inno && currentUser) {
          const assignments = StorageService.getAssignmentsForUser(currentUser.id) || [];
          if (assignments.length > 0) {
            const aId = assignments[0].innovation_id || assignments[0].project_id;
            inno = StorageService.getInnovationById(aId);
          }
        }
        if (!inno) {
          const allInnos = StorageService.getInnovations() || [];
          inno = allInnos.find(i => (i.user_id || i.creator_id) !== currentUser?.id) || allInnos[0];
        }

        if (isMounted && inno) {
          setInnovation(inno);
        }
      } catch (e) {
        console.warn('Error fetching review specimen:', e);
      } finally {
        if (isMounted) setIsLoadingProject(false);
      }
    };

    fetchTargetProject();

    setReadingSeconds(0);
    setIsReadingComplete(false);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setReadingSeconds(prev => {
        if (prev + 1 >= 10) {
          setIsReadingComplete(true);
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedInnoId]);

  if (!innovation && isLoadingProject) {
    return (
      <div className="workspace-container" style={{ padding: '5rem 0', textAlign: 'center' }}>
        <div className="animate-spin" style={{ width: '38px', height: '38px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--coral)', borderRadius: '50%', margin: '0 auto 1.5rem auto' }} />
        <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.5rem' }}>
          ✦ ACCESSING SPECIMEN DOSSIER
        </div>
        <h3 style={{ fontSize: '1.4rem' }}>Preparing Peer Evaluation Gate...</h3>
      </div>
    );
  }

  if (!innovation) {
    return (
      <div className="workspace-container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <div className="editorial-card" style={{ padding: '3.5rem', maxWidth: '580px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>No specimen selected for review desk</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', marginBottom: '1.5rem' }}>
            Please select an innovation from the review queue or explore directory to provide validation feedback.
          </p>
          <button onClick={() => setActiveTab('queue')} className="btn btn-coral">
            ← Open Matched Queue
          </button>
        </div>
      </div>
    );
  }

  const ink = getCategoryInk(innovation.category_id, innovation.category_name);

  // Review Quality Indicator
  const wordCount = (whatShouldChange.trim().split(/\s+/).filter(Boolean).length) + (likedText.trim().split(/\s+/).filter(Boolean).length);
  let qualityLabel = 'Preliminary';
  let qualityColor = 'var(--text-secondary)';
  if (wordCount >= 10) { qualityLabel = 'Constructive'; qualityColor = 'var(--periwinkle)'; }
  if (wordCount >= 25) { qualityLabel = 'In-Depth Validator'; qualityColor = 'var(--green)'; }

  const submitReview = async (projectId, rating, content) => {
    return await SupabaseService.submitReview(projectId, rating, content);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const content = (likedText.trim() ? `${likedText.trim()} — ` : '') + whatShouldChange.trim();
    if (!content.trim()) {
      showToast('Please provide your constructive perspective on what should change.', 'warning');
      return;
    }

    if (!currentUser) {
      showToast('Please sign in to submit a review.', 'warning');
      return;
    }

    if (currentUser.id === innovation.user_id || currentUser.id === innovation.creator_id) {
      showToast('You cannot review your own project.', 'warning');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await submitReview(innovation.id, Number(rating) || 5, content);

      // Sync Upvote / Like in Supabase project_likes table with By Whom info
      if (alsoUpvote || Number(rating) >= 4) {
        try {
          await SupabaseService.voteProject({
            projectId: innovation.id,
            userId: currentUser.id,
            voteType: 'upvote',
            projectOwnerId: innovation.user_id || innovation.creator_id,
            projectTitle: innovation.title,
            userName: currentUser.name || currentUser.full_name || 'Validator',
            userAvatar: currentUser.avatar || currentUser.avatar_url || ''
          });
        } catch (voteErr) {
          console.warn('Auto-upvote on review notice:', voteErr);
        }
      }

      // Mark assignment completed if applicable
      if (selectedAssignmentId) {
        StorageService.updateAssignment(selectedAssignmentId, { assignment_status: 'COMPLETED' });
      }

      setIsSubmittedSuccess(true);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      showToast('+10 Reputation Points Awarded! Review recorded in database.', 'success');
      window.dispatchEvent(new CustomEvent('innovexa:datachange'));
    } catch (err) {
      showToast(err.message || 'Error submitting review.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (window.confirm('Skip this specimen and return to review queue?')) {
      setActiveTab('queue');
    }
  };

  return (
    <div className="workspace-container" style={{ maxWidth: '1100px' }}>
      {/* Top Header & Skip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => setActiveTab('queue')} className="btn btn-secondary btn-sm" style={{ gap: '0.4rem' }}>
          <ArrowLeft size={14} /> Back to Queue
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="mono" style={{ fontSize: '0.74rem', color: isReadingComplete ? 'var(--green)' : 'var(--coral)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={13} /> {isReadingComplete ? 'Reading Gate Cleared' : `Reading: ${15 - readingSeconds}s remaining`}
          </div>
          <button onClick={handleSkip} className="btn btn-ghost btn-sm" style={{ color: 'var(--text-secondary)' }}>
            Skip Specimen <SkipForward size={13} />
          </button>
        </div>
      </div>

      {isSubmittedSuccess ? (
        /* SUCCESS CELEBRATION STATE */
        <div className="editorial-card" style={{ padding: '4.5rem', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(105, 184, 154, 0.15)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <CheckCircle2 size={36} />
          </div>

          <div className="editorial-mono-label" style={{ color: 'var(--green)', marginBottom: '0.5rem' }}>
            VERIFICATION RECORDED IN DATABASE
          </div>

          <h2 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>Thank you for your perspective.</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '540px', margin: '0 auto 2rem auto' }}>
            Your critique has been recorded for <strong>"{innovation.title}"</strong> and +10 reputation points have been credited to your profile.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                sessionStorage.setItem('innovexa_detail_tab', 'FEEDBACK');
                setSelectedInnoId(innovation.id);
                setActiveTab('detail');
              }}
              className="btn btn-coral btn-lg"
              style={{ gap: '0.45rem' }}
            >
              View Project Feedback <ArrowUpRight size={16} />
            </button>
            <button onClick={() => setActiveTab('queue')} className="btn btn-primary btn-lg">
              Next Queued Review →
            </button>
            <button onClick={() => setActiveTab('dashboard')} className="btn btn-secondary btn-lg">
              Return to Dashboard
            </button>
          </div>
        </div>
      ) : (
        /* MAIN REVIEW FORM & SPECIMEN SPLIT */
        <div>
          {/* Header Typographic Statement */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.75rem' }}>
              01 / PEER SCRUTINY DESK
            </div>

            <div style={{ lineHeight: 0.98 }}>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.5rem, 5.5vw, 4.4rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                LOOK.
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.5rem, 5.5vw, 4.4rem)', fontWeight: 800, color: 'var(--coral)', fontStyle: 'italic', margin: '0.2rem 0' }}>
                THINK.
              </div>
              <div className="editorial-sans-bold" style={{ fontSize: 'clamp(1.4rem, 3vw, 2.4rem)', color: 'var(--text-secondary)' }}>
                THEN SAY SOMETHING
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.5rem, 5.5vw, 4.4rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                REAL.
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2.5rem', alignItems: 'flex-start' }}>
            {/* Left: Specimen Information Narrative */}
            <div className="editorial-card" style={{ padding: '2.5rem', borderLeft: `4px solid ${ink.hex}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className={`category-tag ${ink.tagClass}`}>
                  {innovation.category_name}
                </span>
                <span className="editorial-mono-label" style={{ color: 'var(--coral)' }}>
                  SPECIMEN #{innovation.id?.slice(-4)}
                </span>
              </div>

              <h2 style={{ fontSize: '1.85rem', marginBottom: '0.75rem' }}>{innovation.title}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.5, marginBottom: '2rem' }}>
                {innovation.short_description}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                <div>
                  <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.35rem' }}>THE PROBLEM</div>
                  <p style={{ fontSize: '0.94rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {innovation.problem_statement}
                  </p>
                </div>

                <div>
                  <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '0.35rem' }}>PROPOSED SOLUTION</div>
                  <p style={{ fontSize: '0.94rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {innovation.proposed_solution}
                  </p>
                </div>

                <div>
                  <div className="editorial-mono-label" style={{ color: 'var(--lavender)', marginBottom: '0.35rem' }}>TARGET BENEFICIARIES</div>
                  <p style={{ fontSize: '0.94rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {innovation.target_users}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Focused Evaluation Questions Form */}
            <div className="editorial-card" style={{ padding: '2.5rem' }}>
              <form onSubmit={handleSubmitReview}>
                {/* QUESTION 1: DOES THIS SOLVE A REAL PROBLEM? */}
                <div style={{ marginBottom: '2rem' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.75rem' }}>
                    1. DOES THIS SOLVE A REAL PROBLEM?
                  </label>
                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    {['YES', 'MAYBE', 'NOT YET'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSolvesRealProblem(opt)}
                        className={`filter-chip ${solvesRealProblem === opt ? 'active' : ''}`}
                        style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* QUESTION 2: IS THIS RELEVANT TO YOU? */}
                <div style={{ marginBottom: '2rem' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.75rem' }}>
                    2. IS THIS RELEVANT TO YOU OR YOUR DOMAIN?
                  </label>
                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    {['YES', 'NO'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setIsRelevantToYou(opt)}
                        className={`filter-chip ${isRelevantToYou === opt ? 'active' : ''}`}
                        style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* OVERALL RATING */}
                <div style={{ marginBottom: '2rem' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.75rem' }}>
                    3. OVERALL MERIT SCORE (1 to 5)
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        className={`filter-chip ${rating === n ? 'active' : ''}`}
                        style={{ flex: 1, textAlign: 'center', fontWeight: 700 }}
                      >
                        {n} ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI SMART REVIEW QUESTIONS HELPER (FEATURE 4) */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-cream)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    padding: '1.25rem',
                    marginBottom: '1.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span className="editorial-mono-label" style={{ color: 'var(--coral)', fontSize: '0.72rem' }}>
                      ✦ AI CRITIQUE GUIDE & VALIDATION PROMPTS
                    </span>
                    <button
                      type="button"
                      onClick={handleGenerateAiQuestions}
                      disabled={isGeneratingQuestions}
                      className="btn btn-ghost btn-sm"
                      style={{
                        color: 'var(--coral)',
                        fontSize: '0.72rem',
                        padding: '0.15rem 0.5rem',
                        border: '1px solid rgba(231, 111, 130, 0.3)'
                      }}
                    >
                      <Sparkles size={12} /> {isGeneratingQuestions ? 'Generating...' : '✦ Generate Smart Review'}
                    </button>
                  </div>

                  {aiReviewQuestions.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 0.25rem 0' }}>
                        Click any prompt below to inject it into your review notes:
                      </p>
                      {aiReviewQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setWhatShouldChange(prev => prev ? `${prev}\n\n• ${q}\n` : `• ${q}\n`);
                            showToast('Added question prompt to review!', 'info');
                          }}
                          className="btn btn-ghost btn-sm"
                          style={{
                            textAlign: 'left',
                            justifyContent: 'flex-start',
                            backgroundColor: 'var(--bg-white)',
                            border: '1px solid var(--border-hairline)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.45rem 0.75rem',
                            fontSize: '0.8rem',
                            color: 'var(--text-primary)',
                            lineHeight: 1.4
                          }}
                        >
                          <HelpCircle size={13} color="var(--coral)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{q}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Generate contextual evaluation questions tailored specifically for this {innovation.category_name} specimen.
                    </p>
                  )}
                </div>

                {/* QUESTION 3: WHAT SHOULD CHANGE? */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">4. WHAT SHOULD CHANGE?</label>
                    <span className="editorial-mono-label" style={{ color: qualityColor, fontSize: '0.68rem' }}>
                      {qualityLabel} Quality ({wordCount} words)
                    </span>
                  </div>
                  <textarea
                    value={whatShouldChange}
                    onChange={e => setWhatShouldChange(e.target.value)}
                    placeholder="Point out weaknesses, missing friction points, unaddressed competitive realities, or architectural improvements..."
                    className="form-textarea"
                    rows={4}
                    required
                  />
                </div>

                {/* OPTIONAL: WHAT WORKS WELL */}
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">5. WHAT WORKS WELL? (OPTIONAL)</label>
                  <textarea
                    value={likedText}
                    onChange={e => setLikedText(e.target.value)}
                    placeholder="Highlight the most compelling thesis or design choice..."
                    className="form-textarea"
                    rows={2}
                  />
                </div>

                {/* ENDORSE & UPVOTE SPECIMEN IN DATABASE */}
                <div
                  style={{
                    marginBottom: '2rem',
                    padding: '1rem 1.2rem',
                    backgroundColor: alsoUpvote ? 'rgba(231, 111, 130, 0.08)' : 'var(--bg-cream)',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${alsoUpvote ? 'var(--coral)' : 'var(--border-subtle)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                      ▲ Endorse & Upvote Specimen (+1 Like)
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Save your endorsement in the database and display your profile on the supporters list.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlsoUpvote(prev => !prev)}
                    className={`btn btn-sm ${alsoUpvote ? 'btn-coral' : 'btn-secondary'}`}
                    style={{ fontWeight: 700, gap: '0.35rem', whiteSpace: 'nowrap' }}
                  >
                    {alsoUpvote ? '▲ UPVOTING ✓' : '▲ UPVOTE OFF'}
                  </button>
                </div>

                <button
                  type="submit"
                  className="btn btn-coral btn-lg"
                  style={{ width: '100%', gap: '0.5rem' }}
                >
                  SUBMIT VALIDATION FEEDBACK <ArrowUpRight size={17} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
