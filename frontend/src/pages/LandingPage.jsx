import React, { useState, useEffect } from 'react';
import LandingHero3D from '../components/LandingHero3D';
import CountUp from '../components/CountUp';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { getCategoryInk } from '../utils/categoryColors';
import { 
  ArrowRight, 
  ArrowUpRight, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Users, 
  Compass, 
  PlusCircle, 
  CheckSquare,
  Clock,
  Lightbulb,
  Zap,
  Globe,
  Star,
  ChevronRight,
  Activity,
  Radio
} from 'lucide-react';

export default function LandingPage({ setActiveTab, setSelectedInnoId }) {
  const { currentUser } = useAuth();
  const [innovations, setInnovations] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    try {
      const innos = StorageService.getInnovations() || [];
      const revs = StorageService.getReviews() || [];
      setInnovations(innos);
      setReviews(revs);
    } catch (e) {
      console.warn('Error loading landing data:', e);
    }
  }, []);

  const handleMakeItYours = () => {
    if (currentUser) {
      if (currentUser.onboarding_completed) {
        if (setActiveTab) setActiveTab('dashboard');
      } else {
        if (setActiveTab) setActiveTab('onboarding');
      }
    } else {
      if (setActiveTab) setActiveTab('signup');
    }
  };

  const handleSignIn = () => {
    if (setActiveTab) setActiveTab('login');
  };

  const handleSelectModule = (moduleId) => {
    if (!setActiveTab) return;
    if (!currentUser) {
      setActiveTab('signup');
      return;
    }
    if (moduleId === 'IDEA') setActiveTab('submit');
    else if (moduleId === 'PRODUCT') setActiveTab('explore');
    else if (moduleId === 'STARTUP') setActiveTab('creator');
    else if (moduleId === 'COMMUNITY') setActiveTab('queue');
    else if (moduleId === 'INSIGHTS') setActiveTab('insights');
    else setActiveTab('explore');
  };

  const activeCount = Math.max(innovations.length, 17);
  const reviewCount = Math.max(reviews.length, 4);

  return (
    <div style={{ position: 'relative', overflowX: 'hidden', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>

      {/* ========================================================================= */}
      {/* 1. HERO SECTION (01 / POSSIBILITY IN MOTION) */}
      {/* ========================================================================= */}
      <section style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', padding: '3.5rem 0 4.5rem 0' }}>
        <div className="workspace-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '3.5rem', alignItems: 'center' }}>
            
            {/* Left Column: Typographic Masterpiece */}
            <div>
              <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--coral)', display: 'inline-block' }} />
                01 / POSSIBILITY IN MOTION
              </div>

              {/* Exact Line Breaks & Font Contrasts from Reference Image */}
              <div style={{ marginBottom: '1.75rem', lineHeight: 0.94 }}>
                <div style={{ 
                  fontFamily: 'var(--font-editorial)', 
                  fontSize: 'clamp(4rem, 8.2vw, 6.8rem)', 
                  fontWeight: 800, 
                  color: 'var(--text-primary)', 
                  letterSpacing: '-0.04em',
                  textTransform: 'uppercase'
                }}>
                  IDEAS
                </div>
                
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.85rem', flexWrap: 'wrap', margin: '0.35rem 0' }}>
                  <span style={{ 
                    fontFamily: 'var(--font-ui)', 
                    fontWeight: 800, 
                    fontSize: 'clamp(1.5rem, 3.2vw, 2.6rem)', 
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase'
                  }}>
                    WERE NEVER MEANT TO
                  </span>
                </div>
                
                <div style={{ 
                  fontFamily: 'var(--font-editorial)', 
                  fontSize: 'clamp(3.8rem, 7.2vw, 6.2rem)', 
                  fontWeight: 400, 
                  color: 'var(--coral)', 
                  fontStyle: 'italic', 
                  letterSpacing: '-0.035em'
                }}>
                  stay still.
                </div>
              </div>

              <p className="editorial-lead" style={{ maxWidth: '520px', marginBottom: '2.25rem', color: 'var(--text-primary)', fontSize: '1.18rem', lineHeight: 1.6 }}>
                A premium innovation ecosystem where raw sparks become tested products, sharp minds critique assumptions, and breakthroughs find momentum.
              </p>

              {/* CTA Buttons */}
              <div style={{ display: 'flex', gap: '1.15rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2.75rem' }}>
                <button
                  onClick={handleMakeItYours}
                  className="btn btn-coral btn-lg"
                  style={{ gap: '0.65rem', padding: '0.9rem 2rem', fontSize: '0.95rem', fontWeight: 700 }}
                >
                  MAKE IT YOURS. <ArrowUpRight size={17} />
                </button>

                {!currentUser && (
                  <button
                    onClick={handleSignIn}
                    className="btn btn-secondary btn-lg"
                    style={{ padding: '0.9rem 1.75rem', fontSize: '0.95rem', fontWeight: 600 }}
                  >
                    SIGN IN ↗
                  </button>
                )}
              </div>

              {/* Statistics Ribbon from Reference Screenshot */}
              <div style={{ display: 'flex', gap: '2.75rem', borderTop: '1px solid var(--border-hairline)', paddingTop: '1.5rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                    <CountUp value={activeCount} />
                  </div>
                  <div className="editorial-mono-label" style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', marginTop: '0.35rem', letterSpacing: '0.08em' }}>
                    ACTIVE INNOVATIONS
                  </div>
                </div>

                <div>
                  <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.2rem', fontWeight: 800, color: 'var(--periwinkle)', lineHeight: 1 }}>
                    <CountUp value={reviewCount} />
                  </div>
                  <div className="editorial-mono-label" style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', marginTop: '0.35rem', letterSpacing: '0.08em' }}>
                    PEER REVIEWS
                  </div>
                </div>

                <div>
                  <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.2rem', fontWeight: 800, color: 'var(--green)', lineHeight: 1 }}>
                    100%
                  </div>
                  <div className="editorial-mono-label" style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', marginTop: '0.35rem', letterSpacing: '0.08em' }}>
                    CONSENSUS INTEGRITY
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Central Floating 3D Innovation Core Visual Card */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'relative',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '24px',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-lg)',
                  overflow: 'hidden',
                  padding: '1.5rem 1.5rem 0.5rem 1.5rem'
                }}
              >
                {/* Monospace Indicator Badge (as shown in reference image) */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                  <span className="editorial-mono-label" style={{ fontSize: '0.64rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
                    INTERACTIVE 3D ECOSYSTEM • MOUSE PARALLAX
                  </span>
                </div>

                {/* 3D Innovation Core Component */}
                <div style={{ minHeight: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LandingHero3D height={490} onSelectModule={handleSelectModule} />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 1.5 TELEMETRY MARQUEE TICKER STRIP */}
      {/* ========================================================================= */}
      <div 
        style={{ 
          borderTop: '1px solid var(--border-hairline)', 
          borderBottom: '1px solid var(--border-hairline)', 
          backgroundColor: 'var(--bg-secondary)',
          padding: '0.85rem 0',
          overflow: 'hidden'
        }}
      >
        <div style={{ 
          display: 'flex', 
          gap: '3rem', 
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)'
        }}>
          <span>✦ CROSS-DISCIPLINARY VALIDATION</span>
          <span style={{ color: 'var(--coral)' }}>•</span>
          <span>ZERO BOT REVIEWS</span>
          <span style={{ color: 'var(--periwinkle)' }}>•</span>
          <span>100% COMMUNITY CONSENSUS</span>
          <span style={{ color: 'var(--teal)' }}>•</span>
          <span>AI FEASIBILITY TELEMETRY</span>
          <span style={{ color: 'var(--lavender)' }}>•</span>
          <span>VERIFIED PROOF OF CONCEPT</span>
          <span style={{ color: 'var(--apricot)' }}>•</span>
          <span>REAL-TIME PEER SCRUTINY</span>
          <span style={{ color: 'var(--coral)' }}>•</span>
          <span>AUTHENTIC FOUNDER SIGNALS</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SECTION 01 — THE PROBLEM & THE SPARK */}
      {/* ========================================================================= */}
      <section style={{ padding: '7rem 0', borderTop: '1px solid var(--border-hairline)', backgroundColor: 'var(--bg-tertiary)' }}>
        <div className="workspace-container">
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '1.25rem' }}>
              01 / THE SILENT SPARK
            </div>

            <div style={{ lineHeight: 0.96, marginBottom: '2.5rem' }}>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3.2rem, 6.8vw, 5.6rem)', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                SOME
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3.4rem, 7.2vw, 6rem)', fontWeight: 400, color: 'var(--coral)', fontStyle: 'italic', margin: '0.2rem 0' }}>
                ideas
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 'clamp(1.8rem, 3.8vw, 3.2rem)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                NEVER FIND
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3.2rem, 6.8vw, 5.6rem)', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                THEIR PEOPLE.
              </div>
            </div>

            <p className="editorial-lead" style={{ fontSize: '1.28rem', lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: '3.5rem', maxWidth: '820px' }}>
              Brilliant concepts die in silence not because they lack value, but because they never collide with the right perspective at the right time. Traditional incubators are gatekept; open forums are noisy and superficial. INNOVEXA creates structured, high-signal peer collision.
            </p>

            {/* 3 Comparison Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div className="editorial-card" style={{ padding: '2rem', backgroundColor: 'var(--bg-secondary)', borderTop: '3px solid var(--coral)' }}>
                <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--coral)', marginBottom: '0.75rem' }}>
                  01.A / THE FORUM TRAP
                </div>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>Noisy Popularity Contests</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.55 }}>
                  Public upvote boards reward meme hooks and superficial marketing over deep technical merit and defensive market architecture.
                </p>
              </div>

              <div className="editorial-card" style={{ padding: '2rem', backgroundColor: 'var(--bg-secondary)', borderTop: '3px solid var(--periwinkle)' }}>
                <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--periwinkle)', marginBottom: '0.75rem' }}>
                  01.B / THE ACCELERATOR WALL
                </div>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>Gatekept Networks</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.55 }}>
                  Traditional venture funds reject unconventional hypotheses before testing them with actual practitioners who understand the domain.
                </p>
              </div>

              <div className="editorial-card" style={{ padding: '2rem', backgroundColor: 'var(--bg-secondary)', borderTop: '3px solid var(--teal)' }}>
                <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--teal)', marginBottom: '0.75rem' }}>
                  01.C / THE INNOVEXA ENGINE
                </div>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>Structured Peer Collision</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.55 }}>
                  Anonymous, rubric-driven evaluations matched to verified specialists in AI, systems, product strategy, and health sciences.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION 02 — THE CONNECTION & VALIDATION PROTOCOL */}
      {/* ========================================================================= */}
      <section style={{ padding: '7rem 0', borderTop: '1px solid var(--border-hairline)', backgroundColor: 'var(--bg-primary)' }}>
        <div className="workspace-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '4rem', alignItems: 'center' }}>
            
            <div>
              <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '1.25rem' }}>
                02 / THE CONNECTION
              </div>

              <div style={{ lineHeight: 0.96, marginBottom: '2rem' }}>
                <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.8rem, 5.8vw, 4.8rem)', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  THE RIGHT
                </div>
                <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3.2rem, 6.5vw, 5.4rem)', fontWeight: 400, color: 'var(--periwinkle)', fontStyle: 'italic' }}>
                  perspective
                </div>
                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 'clamp(1.6rem, 3.4vw, 2.8rem)', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0.35rem 0' }}>
                  CAN CHANGE
                </div>
                <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.8rem, 5.8vw, 4.8rem)', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  EVERYTHING.
                </div>
              </div>

              <p className="editorial-lead" style={{ fontSize: '1.18rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                When founders connect with domain specialists, blind spots become roadmaps. Our algorithm routes your innovation directly to validators whose fluency matches your problem space.
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="category-tag tag-ink-ai">AI & Intelligence</span>
                <span className="category-tag tag-ink-product">Product Systems</span>
                <span className="category-tag tag-ink-environment">Sustainability</span>
                <span className="category-tag tag-ink-health">Healthcare</span>
              </div>
            </div>

            {/* Right Card: Validation Engine Showcase */}
            <div className="editorial-card" style={{ padding: '2.5rem', backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid var(--periwinkle)', boxShadow: 'var(--shadow-md)' }}>
              <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '1rem', letterSpacing: '0.1em' }}>
                EVALUATION PROTOCOL
              </div>
              <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem', lineHeight: 1.2 }}>Matched Peer Scrutiny</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                No shallow likes or empty hype. Reviewers complete structured 5-dimension rubrics, backed by anti-spam reading gates and depth heuristics.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { num: '01', title: 'Problem Clarity', desc: 'Is the pain point real, urgent, and quantifiable?' },
                  { num: '02', title: 'Solution Feasibility', desc: 'Can this actually be engineered with present technologies?' },
                  { num: '03', title: 'Market Defensibility', desc: 'What prevents incumbents from copying this tomorrow?' },
                  { num: '04', title: 'Consensus Scoring', desc: 'Unbiased statistical aggregation with outlier filtering.' }
                ].map((item) => (
                  <div key={item.num} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', borderTop: '1px solid var(--border-hairline)', paddingTop: '0.75rem' }}>
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--periwinkle)', fontWeight: 700 }}>{item.num}</span>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>{item.title}</h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION 03 — LIVE NETWORK SPECIMENS */}
      {/* ========================================================================= */}
      <section style={{ padding: '7rem 0', borderTop: '1px solid var(--border-hairline)', backgroundColor: 'var(--bg-tertiary)' }}>
        <div className="workspace-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <div className="editorial-mono-label" style={{ color: 'var(--teal)', marginBottom: '0.75rem' }}>
                03 / SPECIMENS IN MOTION
              </div>
              <h2 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', textTransform: 'uppercase', lineHeight: 1.05 }}>
                Live Ecosystem Directory
              </h2>
            </div>

            <button
              onClick={() => setActiveTab && setActiveTab('explore')}
              className="btn btn-secondary"
              style={{ gap: '0.45rem' }}
            >
              EXPLORE FULL DIRECTORY <ArrowUpRight size={15} />
            </button>
          </div>

          {/* Specimens Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
            {(innovations.length > 0 ? innovations.slice(0, 3) : [
              { id: '1', title: 'SmartStudy AI', category_name: 'Education', short_description: 'Autonomous adaptive tutoring engine diagnosing high-school STEM comprehension gaps.', valid_reviews_count: 8 },
              { id: '2', title: 'Canva Design OS', category_name: 'Technology', short_description: 'Browser-native collaborative visual composition canvas for non-designer creators.', valid_reviews_count: 10 },
              { id: '3', title: 'Aura Health Core', category_name: 'Healthcare', short_description: 'Decentralized cryptographic biometric ledger for preventative health intelligence.', valid_reviews_count: 5 }
            ]).map((item) => {
              const ink = getCategoryInk(item.category_id, item.category_name);
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (setSelectedInnoId) setSelectedInnoId(item.id);
                    if (setActiveTab) setActiveTab('detail');
                  }}
                  className="editorial-card"
                  style={{
                    padding: '2rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderLeft: `4px solid ${ink.hex}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span className={`category-tag ${ink.tagClass}`}>
                        {item.category_name || 'Innovation'}
                      </span>
                      <span className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--coral)' }}>
                        {item.valid_reviews_count || 0}/10 REVIEWS
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.45rem', marginBottom: '0.65rem', lineHeight: 1.2 }}>
                      {item.title}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.55, marginBottom: '1.5rem' }}>
                      {item.short_description || item.tagline}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Peer Validation Active</span>
                    <span className="btn btn-ghost btn-sm" style={{ padding: 0, color: 'var(--coral)', gap: '0.25rem' }}>
                      Inspect Specimen <ArrowUpRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECTION 04 — VALIDATION & AI FEASIBILITY INTELLIGENCE */}
      {/* ========================================================================= */}
      <section style={{ padding: '7rem 0', borderTop: '1px solid var(--border-hairline)', backgroundColor: 'var(--bg-primary)' }}>
        <div className="workspace-container">
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <div className="editorial-mono-label" style={{ color: 'var(--lavender)', marginBottom: '1.25rem' }}>
              04 / MACHINE SYNTHESIS
            </div>

            <div style={{ lineHeight: 0.96, marginBottom: '2.5rem' }}>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.6rem, 5.2vw, 4.4rem)', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                DON'T JUST ASK IF THEY
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3.2rem, 6.5vw, 5.4rem)', fontWeight: 400, color: 'var(--lavender)', fontStyle: 'italic', margin: '0.2rem 0' }}>
                like it.
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 'clamp(1.8rem, 3.8vw, 3.2rem)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                ASK IF IT
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.6rem, 5.2vw, 4.4rem)', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                MATTERS.
              </div>
            </div>

            <p className="editorial-lead" style={{ fontSize: '1.28rem', lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: '3.5rem' }}>
              Validation is not about flattery. It is about discovering whether a real user will care, whether the technical thesis holds water, and what must be improved before writing a single line of production code.
            </p>

            {/* AI Feasibility Radar Simulated Card */}
            <div className="editorial-card" style={{ padding: '2.5rem', backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid var(--lavender)', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div className="editorial-mono-label" style={{ color: 'var(--lavender)', fontSize: '0.7rem' }}>
                    AUTOMATED FEASIBILITY SYNTHESIS
                  </div>
                  <h3 style={{ fontSize: '1.5rem' }}>Algorithmic Consensus Breakdown</h3>
                </div>
                <span className="badge badge-indigo">GEMINI INTELLIGENCE ENGINE</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                    <span>Technical Feasibility</span>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--teal)' }}>94%</span>
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: '94%', backgroundColor: 'var(--teal)' }} /></div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                    <span>Market Differentiation</span>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--coral)' }}>89%</span>
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: '89%', backgroundColor: 'var(--coral)' }} /></div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                    <span>Community Consensus</span>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--lavender)' }}>96%</span>
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: '96%', backgroundColor: 'var(--lavender)' }} /></div>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, borderTop: '1px solid var(--border-hairline)', paddingTop: '1.25rem' }}>
                "The core hypothesis demonstrates outstanding architectural rigor. Primary challenge identified across 8 peer reviews is customer acquisition in enterprise channels; recommendation is starting with a developer-first open-source core."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SECTION 05 — FOUNDER & VALIDATOR PERSPECTIVES */}
      {/* ========================================================================= */}
      <section style={{ padding: '7rem 0', borderTop: '1px solid var(--border-hairline)', backgroundColor: 'var(--bg-tertiary)' }}>
        <div className="workspace-container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3.5rem auto' }}>
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.75rem' }}>
              05 / FOUNDER & VALIDATOR PERSPECTIVES
            </div>
            <h2 style={{ fontSize: 'clamp(2.2rem, 4.8vw, 3.6rem)', textTransform: 'uppercase', lineHeight: 1.1 }}>
              Honest Critique. Not Empty Hype.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem' }}>
            {[
              {
                quote: "INNOVEXA gave my health-tech concept the structured validation it needed. Three weeks in, I had 12 peer reviews and a clear pivot direction that saved months of engineering.",
                author: "Priya Sharma",
                role: "Founder, HealthOS",
                badge: "Health Sciences Fellow"
              },
              {
                quote: "The peer review rubric is unlike anything I've used. Real critiques, not empty stars. Our AI architecture thesis is ten times sharper because of the honest community scrutiny.",
                author: "Marcus Okonkwo",
                role: "Lead Architect, FinStack",
                badge: "Distributed Systems"
              },
              {
                quote: "Instead of generic launch boards, I launched on INNOVEXA. Gathered 40 waitlist signups and three early pilot customers in the first week.",
                author: "Yuki Tanaka",
                role: "Co-Founder, EduFlow",
                badge: "Adaptive Learning"
              }
            ].map((t, idx) => (
              <div
                key={idx}
                className="editorial-card"
                style={{
                  padding: '2.25rem',
                  backgroundColor: 'var(--bg-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '1.25rem', color: 'var(--apricot)' }}>
                    {[...Array(5)].map((_, i) => <Star key={i} size={15} fill="currentColor" />)}
                  </div>
                  <p style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.2rem', lineHeight: 1.45, color: 'var(--text-primary)', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                    "{t.quote}"
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{t.author}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.role}</div>
                  <span className="editorial-mono-label" style={{ fontSize: '0.62rem', color: 'var(--coral)', marginTop: '0.35rem', display: 'inline-block' }}>
                    {t.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FINAL SECTION — YOUR TURN */}
      {/* ========================================================================= */}
      <section style={{ padding: '8rem 0', borderTop: '1px solid var(--border-hairline)', backgroundColor: 'var(--bg-primary)', textAlign: 'center' }}>
        <div className="workspace-container" style={{ maxWidth: '860px' }}>
          <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '1.25rem' }}>
            BEGIN / 06
          </div>

          <div style={{ lineHeight: 0.98, marginBottom: '2.5rem' }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3rem, 6.5vw, 5.2rem)', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
              YOUR TURN.
            </div>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 'clamp(1.8rem, 3.8vw, 3.2rem)', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0.35rem 0' }}>
              WHAT WILL
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3.6rem, 7.5vw, 6.2rem)', fontWeight: 400, color: 'var(--coral)', fontStyle: 'italic' }}>
              you
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3rem, 6.5vw, 5.2rem)', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
              MOVE FORWARD?
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '560px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
            The network is open. Submit your thesis, gather validator consensus, and turn raw sparks into enduring products.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleMakeItYours}
              className="btn btn-coral btn-lg"
              style={{ padding: '1.15rem 3rem', fontSize: '1.05rem', gap: '0.65rem' }}
            >
              MAKE IT YOURS. <ArrowUpRight size={18} />
            </button>
            <button
              onClick={() => setActiveTab && setActiveTab('explore')}
              className="btn btn-secondary btn-lg"
              style={{ padding: '1.15rem 2.5rem', fontSize: '1.05rem' }}
            >
              EXPLORE DIRECTORY ↗
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. EDITORIAL FOOTER */}
      {/* ========================================================================= */}
      <footer style={{ borderTop: '1px solid var(--border-hairline)', backgroundColor: 'var(--bg-secondary)', padding: '4rem 0 2rem 0' }}>
        <div className="workspace-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '3rem', marginBottom: '3.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontFamily: 'var(--font-editorial)', fontWeight: 800, fontSize: '1.45rem', color: 'var(--text-primary)' }}>
                  ✦ INNOVEXA
                </span>
              </div>
              <div className="editorial-mono-label" style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                THE INNOVATION NETWORK
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '280px' }}>
                A premium editorial ecosystem where hypotheses become tested products through structured peer review.
              </p>
            </div>

            <div>
              <div className="editorial-mono-label" style={{ fontSize: '0.7rem', color: 'var(--coral)', marginBottom: '1rem' }}>
                DIRECTORY
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
                <span onClick={() => setActiveTab && setActiveTab('explore')} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>Explore Frontier</span>
                <span onClick={() => setActiveTab && setActiveTab('submit')} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>Propose Specimen</span>
                <span onClick={() => setActiveTab && setActiveTab('queue')} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>Review Queue</span>
                <span onClick={() => setActiveTab && setActiveTab('community')} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>Community Matrix</span>
              </div>
            </div>

            <div>
              <div className="editorial-mono-label" style={{ fontSize: '0.7rem', color: 'var(--periwinkle)', marginBottom: '1rem' }}>
                METHODOLOGY
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>5-Dimension Rubric</span>
                <span style={{ color: 'var(--text-secondary)' }}>Anti-Bias Timer Gates</span>
                <span style={{ color: 'var(--text-secondary)' }}>AI Feasibility Radar</span>
                <span style={{ color: 'var(--text-secondary)' }}>Verifiable Proofs</span>
              </div>
            </div>

            <div>
              <div className="editorial-mono-label" style={{ fontSize: '0.7rem', color: 'var(--teal)', marginBottom: '1rem' }}>
                NETWORK STATUS
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Operational</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Decentralized peer validation cluster online.
              </p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span className="mono">© 2026 INNOVEXA INC. ALL RIGHTS RESERVED.</span>
            <span className="mono">PREMIUM EDITORIAL DESIGN v3.0</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
