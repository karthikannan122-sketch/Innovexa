import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { getCategoryInk, BRAND_COLORS } from '../utils/categoryColors';
import StatusBadge, { StageBadge } from './StatusBadge';
import confetti from 'canvas-confetti';
import { 
  Rocket, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Globe, 
  Play, 
  Code2, 
  Smartphone, 
  Sparkles, 
  Eye, 
  UserPlus, 
  ListPlus, 
  MessageSquare, 
  Mail, 
  Layers,
  X,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

/**
 * LaunchSetupModal — Dedicated Multi-Step Launch Setup Flow
 * 
 * STEP 01: LAUNCH STATUS (Where is your project now? CONCEPT / PROTOTYPE / MVP / BETA / LIVE)
 * STEP 02: DESTINATION (For Beta/Live -> Website, Demo, GitHub, App Stores; For Concept/Prototype/MVP -> Next Community Action)
 * STEP 03: LAUNCH PREVIEW (Full public page preview with dynamic CTA)
 * STEP 04: PUBLISH ("YOUR IDEA IS READY FOR ITS NEXT CONVERSATION." + LAUNCH ON INNOVEXA ↗)
 */
export default function LaunchSetupModal({ isOpen, onClose, innovation, onPublished }) {
  const { currentUser, showToast } = useAuth();
  const [step, setStep] = useState(1);

  // Form states initialized from innovation
  const [stage, setStage] = useState('concept');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [appStoreUrl, setAppStoreUrl] = useState('');
  const [playStoreUrl, setPlayStoreUrl] = useState('');
  const [prototypeUrl, setPrototypeUrl] = useState('');
  const [nextAction, setNextAction] = useState('follow'); // 'follow' | 'waitlist' | 'feedback' | 'contact' | 'prototype'
  const [urlErrors, setUrlErrors] = useState({});

  useEffect(() => {
    if (innovation) {
      const initStage = (innovation.project_stage || (innovation.creation_type === 'PRODUCT' ? 'prototype' : 'concept')).toLowerCase();
      setStage(initStage);
      setWebsiteUrl(innovation.website_url || '');
      setDemoUrl(innovation.demo_url || '');
      setGithubUrl(innovation.github_url || '');
      setAppStoreUrl(innovation.app_store_url || '');
      setPlayStoreUrl(innovation.play_store_url || '');
      setPrototypeUrl(innovation.demo_url || innovation.prototype_url || '');
      setNextAction(innovation.next_community_action || (initStage === 'prototype' ? 'prototype' : 'follow'));
      setStep(1);
      setUrlErrors({});
    }
  }, [innovation, isOpen]);

  if (!isOpen || !innovation) return null;

  const ink = getCategoryInk(innovation.category_id, innovation.category_name);
  const reviews = StorageService.getReviewsForInnovation(innovation.id).filter(r => r.review_status === 'VALID');
  const validationPct = Math.min(100, Math.round(((innovation.valid_reviews_count || reviews.length || 0) / (innovation.validation_target || 10)) * 100));

  const validateUrl = (url) => {
    if (!url || !url.trim()) return true;
    const trimmed = url.trim();
    return /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed);
  };

  const sanitizeUrl = (url) => {
    if (!url || !url.trim()) return '';
    let trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleStep1Next = () => {
    if (!stage) {
      showToast('Please select your current project stage.', 'warning');
      return;
    }
    setStep(2);
  };

  const handleStep2Next = () => {
    const errors = {};
    if (stage === 'beta' || stage === 'live') {
      if (websiteUrl && !validateUrl(websiteUrl)) errors.websiteUrl = 'Please enter a valid website address.';
      if (demoUrl && !validateUrl(demoUrl)) errors.demoUrl = 'Please enter a valid demo address.';
      if (githubUrl && !validateUrl(githubUrl)) errors.githubUrl = 'Please enter a valid GitHub URL.';
      if (appStoreUrl && !validateUrl(appStoreUrl)) errors.appStoreUrl = 'Please enter a valid App Store link.';
      if (playStoreUrl && !validateUrl(playStoreUrl)) errors.playStoreUrl = 'Please enter a valid Play Store link.';
    } else {
      if (nextAction === 'prototype' && prototypeUrl && !validateUrl(prototypeUrl)) {
        errors.prototypeUrl = 'Please enter a valid prototype link (e.g., Figma, Loom).';
      }
    }

    if (Object.keys(errors).length > 0) {
      setUrlErrors(errors);
      showToast('Please correct the highlighted URL formats.', 'warning');
      return;
    }

    setUrlErrors({});
    setStep(3);
  };

  const handlePublishLive = () => {
    const cleanedWebsite = sanitizeUrl(websiteUrl);
    const cleanedDemo = sanitizeUrl(demoUrl);
    const cleanedGithub = sanitizeUrl(githubUrl);
    const cleanedAppStore = sanitizeUrl(appStoreUrl);
    const cleanedPlayStore = sanitizeUrl(playStoreUrl);
    const cleanedPrototype = sanitizeUrl(prototypeUrl);

    const updates = {
      project_stage: stage.toLowerCase(),
      development_stage: stage.toUpperCase(),
      status: 'PUBLISHED',
      launch_status: 'published',
      published_at: new Date().toISOString(),
      website_url: cleanedWebsite || null,
      demo_url: (stage === 'prototype' && cleanedPrototype) ? cleanedPrototype : (cleanedDemo || null),
      github_url: cleanedGithub || null,
      app_store_url: cleanedAppStore || null,
      play_store_url: cleanedPlayStore || null,
      has_live_product: Boolean(stage === 'live' || stage === 'beta' || cleanedWebsite || cleanedDemo),
      next_community_action: nextAction
    };

    const updated = StorageService.updateInnovation(innovation.id, updates);
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#E76F82', '#7186D8', '#9B8AE5', '#69B89A', '#F0A45D']
    });

    showToast(`🎉 "${innovation.title}" is now LIVE on INNOVEXA!`, 'success');
    if (onPublished) onPublished(updated);
    onClose();
  };

  // Helper for preview primary CTA
  const getPrimaryCtaText = () => {
    const s = stage.toLowerCase();
    if (s === 'live') return 'VISIT PRODUCT ↗';
    if (s === 'beta') return 'TRY THE BETA ↗';
    if (s === 'mvp') return 'VIEW DEMO ↗';
    if (s === 'prototype') return (demoUrl || prototypeUrl) ? 'VIEW PROTOTYPE ↗' : 'FOLLOW THE JOURNEY ↗';
    if (nextAction === 'waitlist') return 'JOIN THE WAITLIST ↗';
    if (nextAction === 'feedback') return 'GIVE FEEDBACK ↗';
    if (nextAction === 'contact') return 'CONTACT CREATOR ↗';
    return 'FOLLOW THE JOURNEY ↗';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(20, 20, 26, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="editorial-card"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-white)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        {/* Modal Header with Progress */}
        <div
          style={{
            padding: '1.75rem 2.25rem',
            borderBottom: '1px solid var(--border-hairline)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--bg-cream)'
          }}
        >
          <div>
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.2rem' }}>
              LAUNCH SETUP & CONFIGURATION
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.35rem', fontWeight: 800 }}>
              {step === 1 && 'Step 01 / Where is your project now?'}
              {step === 2 && (stage === 'beta' || stage === 'live' ? 'Step 02 / Where can people try it?' : 'Step 02 / What should the community do next?')}
              {step === 3 && 'Step 03 / Launch Preview'}
              {step === 4 && 'Step 04 / Publish to Directory'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Step Indicators */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {[1, 2, 3, 4].map(s => (
                <div
                  key={s}
                  style={{
                    width: s === step ? '28px' : '10px',
                    height: '6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: s <= step ? 'var(--coral)' : 'rgba(36, 36, 43, 0.15)',
                    transition: 'all 0.25s ease'
                  }}
                />
              ))}
            </div>

            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.4rem', color: 'var(--text-secondary)' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '2.25rem', overflowY: 'auto', flex: 1 }}>
          {/* ================= STEP 01: LAUNCH STATUS ================= */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: '1.75rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  Select the current lifecycle stage of <strong>"{innovation.title}"</strong>. This adapts how visitors interact with your project and which action buttons will be displayed.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem' }}>
                {[
                  {
                    id: 'concept',
                    title: 'CONCEPT & IDEA',
                    desc: 'Early-stage spark or hypothesis seeking community feedback, validation, and early supporters.',
                    icon: '✧',
                    badge: 'No links required',
                    color: 'var(--coral)'
                  },
                  {
                    id: 'prototype',
                    title: 'PROTOTYPE',
                    desc: 'Clickable mockups, wireframes, design prototypes, or experimental proof of concept.',
                    icon: '✦',
                    badge: 'Optional prototype link',
                    color: '#F59E0B'
                  },
                  {
                    id: 'mvp',
                    title: 'MVP (MINIMUM VIABLE PRODUCT)',
                    desc: 'Functional initial build with core features built and ready for targeted demonstration.',
                    icon: '◆',
                    badge: 'Optional demo link',
                    color: '#3B82F6'
                  },
                  {
                    id: 'beta',
                    title: 'BETA / EARLY ACCESS',
                    desc: 'Working test build actively accepting testers, feedback, and early adopters.',
                    icon: '▲',
                    badge: 'Website & App links',
                    color: '#8B5CF6'
                  },
                  {
                    id: 'live',
                    title: 'LIVE PRODUCT',
                    desc: 'Publicly launched service, live web app, or mobile app in production with active users.',
                    icon: '●',
                    badge: 'Full destination links',
                    color: '#10B981'
                  }
                ].map(opt => {
                  const isSelected = stage === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setStage(opt.id)}
                      style={{
                        padding: '1.25rem 1.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${isSelected ? opt.color : 'var(--border-subtle)'}`,
                        backgroundColor: isSelected ? 'var(--bg-cream)' : 'var(--bg-white)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: isSelected ? opt.color : 'var(--bg-cream)',
                            color: isSelected ? '#FFFFFF' : opt.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.1rem',
                            fontWeight: 800
                          }}
                        >
                          {opt.icon}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            {opt.title}
                            <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(36,36,43,0.06)', color: 'var(--text-secondary)' }}>
                              {opt.badge}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            {opt.desc}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: `2px solid ${isSelected ? opt.color : 'var(--border-medium)'}`,
                          backgroundColor: isSelected ? opt.color : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FFFFFF' }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= STEP 02: DESTINATION OR COMMUNITY ACTION ================= */}
          {step === 2 && (
            <div>
              {stage === 'beta' || stage === 'live' ? (
                <div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div className="editorial-mono-label" style={{ color: 'var(--green)', marginBottom: '0.35rem' }}>
                      DESTINATION LINKS (ALL OPTIONAL)
                    </div>
                    <h3 style={{ fontSize: '1.35rem', marginBottom: '0.35rem' }}>Where can people try your product?</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                      Add live destinations where users can visit, test, install, or view source code. Format validation will ensure clean links.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Globe size={14} color="var(--coral)" /> WEBSITE URL
                      </label>
                      <input
                        type="text"
                        value={websiteUrl}
                        onChange={e => {
                          setWebsiteUrl(e.target.value);
                          if (urlErrors.websiteUrl) setUrlErrors(prev => ({ ...prev, websiteUrl: null }));
                        }}
                        placeholder="https://yourproduct.com"
                        className={`form-input ${urlErrors.websiteUrl ? 'error' : ''}`}
                      />
                      {urlErrors.websiteUrl && <div style={{ color: 'var(--red)', fontSize: '0.74rem', marginTop: '0.25rem' }}>{urlErrors.websiteUrl}</div>}
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Play size={14} color="var(--periwinkle)" /> PRODUCT DEMO / WEB APP URL
                      </label>
                      <input
                        type="text"
                        value={demoUrl}
                        onChange={e => {
                          setDemoUrl(e.target.value);
                          if (urlErrors.demoUrl) setUrlErrors(prev => ({ ...prev, demoUrl: null }));
                        }}
                        placeholder="https://app.yourproduct.com or interactive sandbox"
                        className={`form-input ${urlErrors.demoUrl ? 'error' : ''}`}
                      />
                      {urlErrors.demoUrl && <div style={{ color: 'var(--red)', fontSize: '0.74rem', marginTop: '0.25rem' }}>{urlErrors.demoUrl}</div>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Code2 size={14} /> GITHUB REPOSITORY
                        </label>
                        <input
                          type="text"
                          value={githubUrl}
                          onChange={e => {
                            setGithubUrl(e.target.value);
                            if (urlErrors.githubUrl) setUrlErrors(prev => ({ ...prev, githubUrl: null }));
                          }}
                          placeholder="https://github.com/org/repo"
                          className="form-input"
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Smartphone size={14} color="var(--lavender)" /> APP STORE LINK
                        </label>
                        <input
                          type="text"
                          value={appStoreUrl}
                          onChange={e => setAppStoreUrl(e.target.value)}
                          placeholder="https://apps.apple.com/..."
                          className="form-input"
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Smartphone size={14} color="var(--green)" /> PLAY STORE LINK
                        </label>
                        <input
                          type="text"
                          value={playStoreUrl}
                          onChange={e => setPlayStoreUrl(e.target.value)}
                          placeholder="https://play.google.com/store/..."
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.35rem' }}>
                      COMMUNITY CALL TO ACTION
                    </div>
                    <h3 style={{ fontSize: '1.35rem', marginBottom: '0.35rem' }}>What should the community do next?</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                      Since this project is at the <strong>{stage.toUpperCase()}</strong> stage, no live website is required. Choose what visitors should do when viewing your page:
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
                    {[
                      {
                        id: 'follow',
                        title: 'FOLLOW THIS PROJECT',
                        desc: 'Visitors follow your journey and receive updates when you reach new milestones.',
                        icon: UserPlus
                      },
                      {
                        id: 'waitlist',
                        title: 'JOIN THE WAITLIST',
                        desc: 'Collect interested early adopters ready to test the first released build.',
                        icon: ListPlus
                      },
                      {
                        id: 'feedback',
                        title: 'GIVE MORE FEEDBACK',
                        desc: 'Encourage peer reviewers to critique the problem, solution, and roadmap.',
                        icon: MessageSquare
                      },
                      {
                        id: 'contact',
                        title: 'CONTACT THE CREATOR',
                        desc: 'Open direct inquiries for partnerships, co-founders, or design contributions.',
                        icon: Mail
                      },
                      {
                        id: 'prototype',
                        title: 'VIEW PROTOTYPE',
                        desc: 'Direct visitors to an interactive mockup (Figma, Loom, InVision, CodeSandbox).',
                        icon: ExternalLink
                      }
                    ].map(act => {
                      const Icon = act.icon;
                      const isSel = nextAction === act.id;
                      return (
                        <div
                          key={act.id}
                          onClick={() => setNextAction(act.id)}
                          style={{
                            padding: '1.15rem',
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${isSel ? 'var(--coral)' : 'var(--border-subtle)'}`,
                            backgroundColor: isSel ? 'var(--bg-cream)' : 'var(--bg-white)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.92rem' }}>
                              <Icon size={16} color={isSel ? 'var(--coral)' : 'var(--text-secondary)'} />
                              {act.title}
                            </div>
                            <div
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                border: `2px solid ${isSel ? 'var(--coral)' : 'var(--border-medium)'}`,
                                backgroundColor: isSel ? 'var(--coral)' : 'transparent'
                              }}
                            />
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                            {act.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {nextAction === 'prototype' && (
                    <div className="form-group" style={{ backgroundColor: 'var(--bg-cream)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ExternalLink size={14} color="var(--coral)" /> PROTOTYPE / DEMO EMBED URL
                      </label>
                      <input
                        type="text"
                        value={prototypeUrl}
                        onChange={e => {
                          setPrototypeUrl(e.target.value);
                          if (urlErrors.prototypeUrl) setUrlErrors(prev => ({ ...prev, prototypeUrl: null }));
                        }}
                        placeholder="https://figma.com/file/... or loom.com/share/..."
                        className={`form-input ${urlErrors.prototypeUrl ? 'error' : ''}`}
                      />
                      {urlErrors.prototypeUrl && <div style={{ color: 'var(--red)', fontSize: '0.74rem', marginTop: '0.25rem' }}>{urlErrors.prototypeUrl}</div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 03: LAUNCH PREVIEW ================= */}
          {step === 3 && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '0.35rem' }}>
                  STEP 03 / LIVE DIRECTORY PREVIEW
                </div>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.35rem' }}>Here is how your project page will appear</h3>
              </div>

              {/* Realistic Mockup Box */}
              <div
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem',
                  backgroundColor: 'var(--bg-white)',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`category-tag ${ink.tagClass}`}>
                      {innovation.category_name || 'Technology'}
                    </span>
                    <StageBadge stage={stage} />
                  </div>
                  <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    Validation Score: {validationPct}% ({reviews.length} reviews)
                  </span>
                </div>

                <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{innovation.title}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                  {innovation.short_description || innovation.problem_statement?.slice(0, 140)}
                </p>

                {/* Dynamic Primary CTA Banner */}
                <div
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-dark)',
                    color: 'var(--text-inverse)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div className="editorial-mono-label" style={{ color: 'var(--coral)', fontSize: '0.68rem' }}>
                      PUBLIC ACTION BUTTON
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-inverse-muted)' }}>
                      Stage: <strong style={{ color: '#FFFFFF' }}>{stage.toUpperCase()}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-coral"
                    style={{ fontWeight: 800, padding: '0.6rem 1.4rem' }}
                  >
                    {getPrimaryCtaText()}
                  </button>
                </div>

                {/* Available Links Chips */}
                {(websiteUrl || demoUrl || githubUrl || appStoreUrl || playStoreUrl || prototypeUrl) && (
                  <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '1rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span className="editorial-mono-label" style={{ alignSelf: 'center', fontSize: '0.68rem' }}>AVAILABLE LINKS:</span>
                    {websiteUrl && <span className="filter-chip active" style={{ fontSize: '0.72rem' }}>🌐 Website</span>}
                    {demoUrl && <span className="filter-chip active" style={{ fontSize: '0.72rem' }}>▶ Demo</span>}
                    {githubUrl && <span className="filter-chip active" style={{ fontSize: '0.72rem' }}>💻 GitHub</span>}
                    {appStoreUrl && <span className="filter-chip active" style={{ fontSize: '0.72rem' }}>🍏 App Store</span>}
                    {playStoreUrl && <span className="filter-chip active" style={{ fontSize: '0.72rem' }}>🤖 Play Store</span>}
                    {prototypeUrl && <span className="filter-chip active" style={{ fontSize: '0.72rem' }}>🎨 Prototype</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 04: PUBLISH ================= */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(231, 111, 130, 0.12)',
                  color: 'var(--coral)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.75rem auto'
                }}
              >
                <Rocket size={36} />
              </div>

              {/* Exact Prompt Required Statement */}
              <div style={{ lineHeight: 1.05, marginBottom: '1.75rem' }}>
                <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                  YOUR IDEA IS READY
                </div>
                <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 800, color: 'var(--coral)', fontStyle: 'italic', margin: '0.2rem 0' }}>
                  FOR ITS NEXT
                </div>
                <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                  CONVERSATION.
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto 2.5rem auto', lineHeight: 1.5 }}>
                Publishing makes <strong>"{innovation.title}"</strong> visible on the INNOVEXA directory. Innovators, supporters, and reviewers can now interact directly with your specimen.
              </p>

              <button
                onClick={handlePublishLive}
                className="btn btn-coral btn-lg"
                style={{
                  fontSize: '1.15rem',
                  padding: '1rem 2.5rem',
                  gap: '0.6rem',
                  boxShadow: '0 8px 24px rgba(231, 111, 130, 0.35)'
                }}
              >
                LAUNCH ON INNOVEXA ↗
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {step < 4 && (
          <div
            style={{
              padding: '1.25rem 2.25rem',
              borderTop: '1px solid var(--border-hairline)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-cream)'
            }}
          >
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="btn btn-secondary"
                style={{ gap: '0.4rem' }}
              >
                <ArrowLeft size={15} /> Back
              </button>
            ) : (
              <button
                onClick={onClose}
                className="btn btn-ghost"
                style={{ color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
            )}

            {step === 1 && (
              <button
                onClick={handleStep1Next}
                className="btn btn-primary"
                style={{ gap: '0.4rem' }}
              >
                Next Step <ArrowRight size={15} />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleStep2Next}
                className="btn btn-primary"
                style={{ gap: '0.4rem' }}
              >
                Preview Launch <ArrowRight size={15} />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={() => setStep(4)}
                className="btn btn-coral"
                style={{ gap: '0.4rem' }}
              >
                Ready to Publish <Rocket size={15} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
