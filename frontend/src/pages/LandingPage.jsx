import React, { useState } from 'react';
import LandingHero3D from '../components/LandingHero3D';
import TransitionCurtain from '../components/TransitionCurtain';
import CountUp from '../components/CountUp';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { getCategoryInk, BRAND_COLORS } from '../utils/categoryColors';
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
  Filter,
  Lightbulb,
  Zap,
  Globe,
  Quote
} from 'lucide-react';

/**
 * LandingPage — Editorial Innovation Platform Experience
 */
export default function LandingPage({ setActiveTab, setSelectedInnoId }) {
  const { currentUser } = useAuth();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTitle, setTransitionTitle] = useState('ENTERING THE NETWORK...');

  const innovations = StorageService.getInnovations();
  const reviews = StorageService.getReviews();

  // MAKE IT YOURS / BEGIN YOUR JOURNEY Navigation Action
  const handleMakeItYours = () => {
    if (currentUser) {
      if (currentUser.onboarding_completed) {
        setActiveTab('dashboard');
      } else {
        setActiveTab('onboarding');
      }
    } else {
      setActiveTab('signup');
    }
  };

  const handleSignIn = () => {
    setActiveTab('login');
  };

  const handleSelectModule = (moduleId) => {
    if (!currentUser) {
      setActiveTab('signup');
      return;
    }
    if (moduleId === 'IDEA') setActiveTab('submit');
    else if (moduleId === 'PRODUCT') setActiveTab('explore');
    else if (moduleId === 'STARTUP') setActiveTab('creator');
    else if (moduleId === 'COMMUNITY') setActiveTab('queue');
    else if (moduleId === 'INSIGHTS') setActiveTab('insight');
  };

  return (
    <div style={{ position: 'relative', overflowX: 'hidden', backgroundColor: 'var(--bg-ivory)' }}>
      <TransitionCurtain isActive={isTransitioning} title={transitionTitle} />

      {/* 1. HERO SECTION: "IDEAS WERE NEVER MEANT TO stay still." */}
      <section style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', padding: '3.5rem 0 4.5rem 0' }}>
        <div className="workspace-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '3.5rem', alignItems: 'center' }}>
            {/* Left Column: Typographic Masterpiece */}
            <div>
              <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '1.25rem' }}>
                01 / POSSIBILITY IN MOTION
              </div>

              {/* Exact Line Breaks & Font Contrasts from Prompt */}
              <div style={{ marginBottom: '1.75rem', lineHeight: 0.96 }}>
                <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3.8rem, 7.8vw, 6.4rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
                  IDEAS
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.85rem', flexWrap: 'wrap', margin: '0.4rem 0' }}>
                  <span className="editorial-sans-bold" style={{ fontSize: 'clamp(1.4rem, 2.8vw, 2.3rem)', color: 'var(--text-secondary)' }}>
                    WERE NEVER
                  </span>
                  <span className="editorial-sans-bold" style={{ fontSize: 'clamp(1.4rem, 2.8vw, 2.3rem)', color: 'var(--text-secondary)' }}>
                    MEANT TO
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3.4rem, 6.8vw, 5.6rem)', fontWeight: 800, color: 'var(--coral)', fontStyle: 'italic', letterSpacing: '-0.035em' }}>
                  stay still.
                </div>
              </div>

              <p className="editorial-lead" style={{ maxWidth: '520px', marginBottom: '2rem', color: 'var(--text-primary)', fontSize: '1.25rem' }}>
                A premium innovation ecosystem where raw sparks become tested products, sharp minds critique assumptions, and breakthroughs find momentum.
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2.5rem' }}>
                <button
                  onClick={handleMakeItYours}
                  className="btn btn-coral btn-lg"
                  style={{ gap: '0.65rem' }}
                >
                  MAKE IT YOURS. <ArrowUpRight size={18} />
                </button>

                {!currentUser && (
                  <button
                    onClick={handleSignIn}
                    className="btn btn-secondary btn-lg"
                  >
                    SIGN IN ↗
                  </button>
                )}
              </div>

              {/* Statistics Ribbon */}
              <div style={{ display: 'flex', gap: '2.5rem', borderTop: '1px solid var(--border-hairline)', paddingTop: '1.5rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    <CountUp value={innovations.length} />
                  </div>
                  <div className="editorial-mono-label" style={{ fontSize: '0.68rem' }}>Active Innovations</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--periwinkle)' }}>
                    <CountUp value={reviews.length} />
                  </div>
                  <div className="editorial-mono-label" style={{ fontSize: '0.68rem' }}>Peer Reviews</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--green)' }}>
                    100%
                  </div>
                  <div className="editorial-mono-label" style={{ fontSize: '0.68rem' }}>Consensus Integrity</div>
                </div>
              </div>
            </div>

            {/* Right Column: Central Floating 3D Innovation Core Visual */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'relative',
                  backgroundColor: 'var(--bg-white)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-md)',
                  overflow: 'hidden'
                }}
              >
                <LandingHero3D height={520} onSelectModule={handleSelectModule} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION 01 — THE PROBLEM */}
      <section style={{ padding: '6rem 0', borderTop: '1px solid var(--border-hairline)', backgroundColor: 'var(--bg-cream)' }}>
        <div className="workspace-container">
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '1.25rem' }}>
              01 / THE PROBLEM
            </div>

            <div style={{ lineHeight: 0.98, marginBottom: '2.5rem' }}>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3rem, 6.2vw, 5.2rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                SOME
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3rem, 6.2vw, 5.2rem)', fontWeight: 800, color: 'var(--coral)', fontStyle: 'italic' }}>
                IDEAS
              </div>
              <div className="editorial-sans-bold" style={{ fontSize: 'clamp(1.8rem, 3.8vw, 3.2rem)', color: 'var(--text-secondary)', margin: '0.35rem 0' }}>
                NEVER FIND
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3rem, 6.2vw, 5.2rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                THEIR PEOPLE.
              </div>
            </div>

            <p className="editorial-lead" style={{ fontSize: '1.35rem', lineHeight: 1.5, color: 'var(--text-primary)', marginBottom: '2rem' }}>
              Brilliant concepts die in silence not because they lack value, but because they never collide with the right perspective at the right time. Traditional incubators are gatekept; open forums are noisy. INNOVEXA creates structured, high-signal peer collision.
            </p>
          </div>
        </div>
      </section>

      {/* 3. SECTION 02 — THE CONNECTION */}
      <section style={{ padding: '6rem 0', borderTop: '1px solid var(--border-hairline)', backgroundColor: 'var(--bg-ivory)' }}>
        <div className="workspace-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '4rem', alignItems: 'center' }}>
            <div>
              <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '1.25rem' }}>
                02 / THE CONNECTION
              </div>

              <div style={{ lineHeight: 0.98, marginBottom: '2rem' }}>
                <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.8rem, 5.5vw, 4.6rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                  THE RIGHT
                </div>
                <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3.2rem, 6.2vw, 5rem)', fontWeight: 800, color: 'var(--periwinkle)', fontStyle: 'italic' }}>
                  PERSPECTIVE
                </div>
                <div className="editorial-sans-bold" style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.8rem)', color: 'var(--text-secondary)', margin: '0.35rem 0' }}>
                  CAN CHANGE
                </div>
                <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.8rem, 5.5vw, 4.6rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                  EVERYTHING.
                </div>
              </div>

              <p className="editorial-lead" style={{ fontSize: '1.15rem', lineHeight: 1.55, color: 'var(--text-secondary)' }}>
                When founders connect with domain specialists, blind spots become roadmaps. Our algorithm routes your innovation directly to validators whose fluency matches your problem space.
              </p>
            </div>

            <div className="editorial-card" style={{ padding: '3rem', backgroundColor: 'var(--bg-white)', borderLeft: '4px solid var(--periwinkle)' }}>
              <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '1rem' }}>
                VALIDATION ENGINE
              </div>
              <h3 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>Matched Peer Scrutiny</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                No shallow likes or empty hype. Reviewers complete structured 5-dimension rubrics, backed by anti-spam reading gates and depth heuristics.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="category-tag tag-ink-ai">AI & Intelligence</span>
                <span className="category-tag tag-ink-product">Product Systems</span>
                <span className="category-tag tag-ink-environment">Sustainability</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION 03 — VALIDATION */}
      <section style={{ padding: '6rem 0', borderTop: '1px solid var(--border-hairline)', backgroundColor: 'var(--bg-cream)' }}>
        <div className="workspace-container">
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="editorial-mono-label" style={{ color: 'var(--lavender)', marginBottom: '1.25rem' }}>
              03 / VALIDATION
            </div>

            <div style={{ lineHeight: 0.98, marginBottom: '2.5rem' }}>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.5rem, 5vw, 4.2rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                DON'T ASK IF THEY
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: 800, color: 'var(--lavender)', fontStyle: 'italic', margin: '0.35rem 0' }}>
                LIKE IT.
              </div>
              <div className="editorial-sans-bold" style={{ fontSize: 'clamp(1.8rem, 3.8vw, 3.2rem)', color: 'var(--text-secondary)' }}>
                ASK IF IT
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                MATTERS.
              </div>
            </div>

            <p className="editorial-lead" style={{ fontSize: '1.35rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
              Validation is not about flattery. It is about discovering whether a real user will care, whether the technical thesis holds water, and what must be improved before writing a single line of production code.
            </p>
          </div>
        </div>
      </section>

      {/* 5. SECTION 04 — FEEDBACK */}
      <section style={{ padding: '6rem 0', borderTop: '1px solid var(--border-hairline)', backgroundColor: 'var(--bg-ivory)' }}>
        <div className="workspace-container">
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="editorial-mono-label" style={{ color: 'var(--rose-pink)', marginBottom: '1.25rem' }}>
              04 / FEEDBACK
            </div>

            <div style={{ lineHeight: 1.05, marginBottom: '2.5rem' }}>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.6rem, 5vw, 4.2rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                A THOUGHT.
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.6rem, 5vw, 4.2rem)', fontWeight: 800, color: 'var(--rose-pink)', fontStyle: 'italic' }}>
                A RESPONSE.
              </div>
              <div className="editorial-sans-bold" style={{ fontSize: 'clamp(2.2rem, 4.4vw, 3.6rem)', color: 'var(--text-primary)', margin: '0.35rem 0' }}>
                A BETTER VERSION.
              </div>
            </div>

            <p className="editorial-lead" style={{ fontSize: '1.35rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
              Each iteration is synthesized into structured AI insight reports, highlighting core strengths, primary friction points, and community consensus to guide your launch.
            </p>
          </div>
        </div>
      </section>

      {/* 6. FINAL SECTION — YOUR TURN */}
      <section style={{ padding: '7rem 0', borderTop: '1px solid var(--border-hairline)', backgroundColor: 'var(--bg-white)', textAlign: 'center' }}>
        <div className="workspace-container" style={{ maxWidth: '820px' }}>
          <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '1.25rem' }}>
            BEGIN / 05
          </div>

          <div style={{ lineHeight: 1.02, marginBottom: '2.5rem' }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.8rem, 5.5vw, 4.4rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
              YOUR TURN.
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.8rem, 5.5vw, 4.4rem)', color: 'var(--text-secondary)' }}>
              WHAT WILL
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3.4rem, 6.8vw, 5.4rem)', fontWeight: 800, color: 'var(--coral)', fontStyle: 'italic' }}>
              YOU
            </div>
            <div className="editorial-sans-bold" style={{ fontSize: 'clamp(2.2rem, 4.4vw, 3.6rem)', color: 'var(--text-primary)', margin: '0.35rem 0' }}>
              MOVE FORWARD?
            </div>
          </div>

          <button
            onClick={handleMakeItYours}
            className="btn btn-coral btn-lg"
            style={{ padding: '1.15rem 3rem', fontSize: '1.15rem', gap: '0.75rem' }}
          >
            MAKE IT YOURS. <ArrowUpRight size={20} />
          </button>
        </div>
      </section>
    </div>
  );
}
