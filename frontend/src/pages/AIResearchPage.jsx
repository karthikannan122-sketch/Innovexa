import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { AIResearchService } from '../services/aiResearchService';
import { getCategoryInk, BRAND_COLORS } from '../utils/categoryColors';
import confetti from 'canvas-confetti';
import { 
  BrainCircuit, 
  Sparkles, 
  ExternalLink, 
  BookOpen, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  ArrowUpRight, 
  Star, 
  Search, 
  Layers, 
  Rocket, 
  Activity, 
  ShieldCheck, 
  UserCheck, 
  FileText, 
  Trash2, 
  Compass, 
  Clock, 
  HelpCircle,
  FolderKanban,
  Check,
  X
} from 'lucide-react';

export default function AIResearchPage({ setActiveTab, setSelectedInnoId, initialProjectId }) {
  const { currentUser, showToast } = useAuth();

  // Navigation & View State
  const [activeTab, setPageTab] = useState('ACTIVE_RESEARCH'); // 'ACTIVE_RESEARCH' | 'SAVED_ARCHIVE'
  const [userProjects, setUserProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '');
  
  // Custom Research Input
  const [customTitle, setCustomTitle] = useState('');
  const [customProblem, setCustomProblem] = useState('');
  const [customCategory, setCustomCategory] = useState('Technology & Software');

  // Active Research Report
  const [isGenerating, setIsGenerating] = useState(false);
  const [researchReport, setResearchReport] = useState(null);

  // Human Evaluation Form State
  const [verdict, setVerdict] = useState('VALIDATED_HIGH_POTENTIAL');
  const [feasibilityScore, setFeasibilityScore] = useState(4);
  const [noveltyScore, setNoveltyScore] = useState(4);
  const [openSourceScore, setOpenSourceScore] = useState(5);
  const [futureUtilityScore, setFutureUtilityScore] = useState(4);
  const [humanCritique, setHumanCritique] = useState('');
  const [futureActionPlan, setFutureActionPlan] = useState('');
  const [isSubmittingEval, setIsSubmittingEval] = useState(false);
  const [evaluationSuccess, setEvaluationSuccess] = useState(false);

  // Archive & Filter State
  const [savedEvaluations, setSavedEvaluations] = useState([]);
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveCategory, setArchiveCategory] = useState('ALL');

  // Load Projects & Saved Evaluations
  useEffect(() => {
    const loadData = async () => {
      try {
        const [projsRes, userProjsRes] = await Promise.all([
          SupabaseService.getProjects(),
          currentUser?.id ? SupabaseService.getUserProjects(currentUser.id) : Promise.resolve({ data: [] })
        ]);
        const myProjs = userProjsRes.data || (currentUser?.id ? StorageService.getInnovationsByUserId(currentUser.id) : []) || [];
        const platformProjs = projsRes.data || StorageService.getInnovations() || [];
        const combined = [...myProjs, ...platformProjs.filter(p => !myProjs.some(m => m.id === p.id))];
        setUserProjects(combined);

        if (initialProjectId) {
          const match = combined.find(p => p.id === initialProjectId);
          if (match) {
            handleSelectProject(match);
          }
        }
      } catch (e) {
        setUserProjects(StorageService.getInnovations() || []);
      }
    };
    loadData();
    loadEvaluations();
  }, [currentUser?.id, initialProjectId]);

  const loadEvaluations = () => {
    const evals = AIResearchService.getSavedEvaluations();
    setSavedEvaluations(evals);
  };

  // Select existing project to populate research fields
  const handleSelectProject = (project) => {
    if (!project) {
      setSelectedProjectId('');
      return;
    }
    setSelectedProjectId(project.id);
    setCustomTitle(project.title || '');
    setCustomProblem(project.problem_statement || project.description || '');
    setCustomCategory(project.category_name || 'Technology & Software');
  };

  // Run AI Research & Open Source Stack Generation
  const handleGenerateResearch = async () => {
    if (!customTitle.trim()) {
      showToast('Please enter an innovation title or select a project.', 'error');
      return;
    }

    setIsGenerating(true);
    setEvaluationSuccess(false);
    setResearchReport(null);

    try {
      const res = await AIResearchService.generateResearch({
        title: customTitle,
        problemStatement: customProblem,
        category: customCategory
      });

      if (res.success && res.data) {
        setResearchReport(res.data);
        showToast('AI Research & Open Source foundations synthesized!', 'success');
      } else {
        showToast('Unable to synthesize research. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Error generating AI research:', err);
      showToast('Error synthesizing research.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit Human Evaluation Form
  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    if (!researchReport) return;

    setIsSubmittingEval(true);
    try {
      const evaluationPayload = {
        research_id: researchReport.research_id,
        project_id: selectedProjectId || null,
        project_title: researchReport.title,
        evaluator_id: currentUser?.id || 'evaluator_guest',
        evaluator_name: currentUser?.full_name || currentUser?.username || 'Community Validator',
        evaluator_avatar: currentUser?.avatar_url || '',
        category: researchReport.category,
        verdict,
        feasibility_score: feasibilityScore,
        novelty_score: noveltyScore,
        open_source_grounding_score: openSourceScore,
        future_utility_score: futureUtilityScore,
        human_critique_notes: humanCritique,
        future_action_plan: futureActionPlan,
        research_brief: researchReport
      };

      const res = await AIResearchService.saveHumanEvaluation(evaluationPayload);
      if (res.success) {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
        showToast('Human research evaluation archived for future exploration!', 'success');
        setEvaluationSuccess(true);
        loadEvaluations();
      } else {
        showToast('Could not save evaluation: ' + res.error, 'error');
      }
    } catch (err) {
      showToast('Failed to save evaluation.', 'error');
    } finally {
      setIsSubmittingEval(false);
    }
  };

  // Sprout New Idea: pre-fill Create Idea form from evaluated research
  const handleSproutNewProject = (report) => {
    const r = report || researchReport;
    if (!r) return;

    // Store sprout payload in localStorage for SubmitInnovationPage hydration
    const sproutDraft = {
      title: r.title ? `${r.title} (Open Specimen)` : 'New Open Source Specimen',
      problem_statement: r.problem_framing || r.executive_summary || '',
      proposed_solution: r.novel_ideas_and_hypotheses?.[0]?.description || '',
      category_name: r.category || 'Technology',
      tags_text: 'OpenSource, AI-Research, ' + (r.category || 'Tech'),
      features: (r.novel_ideas_and_hypotheses || []).map(h => h.title).slice(0, 3),
      sprouted_from_research: true
    };

    localStorage.setItem('innovexa_project_create_draft_v4', JSON.stringify({
      creationTrack: 'IDEA',
      formData: sproutDraft,
      updatedAt: Date.now()
    }));

    showToast('Sprouting new project specimen from evaluated research...', 'success');
    if (setActiveTab) {
      setActiveTab('submit');
    }
  };

  // Delete saved evaluation
  const handleDeleteEvaluation = (evalId) => {
    if (window.confirm('Delete this human research evaluation from archive?')) {
      AIResearchService.deleteEvaluation(evalId);
      loadEvaluations();
      showToast('Research evaluation removed from archive.', 'info');
    }
  };

  const filteredArchive = savedEvaluations.filter(e => {
    const matchCat = archiveCategory === 'ALL' || e.category === archiveCategory;
    const q = archiveSearch.toLowerCase().trim();
    const matchQ = !q || (e.project_title || '').toLowerCase().includes(q) || (e.human_critique_notes || '').toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <div className="workspace-container" style={{ maxWidth: '1160px', paddingBottom: '5rem' }}>
      
      {/* 1. EDITORIAL HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.45rem' }}>
            ✦ AI RESEARCH & OPEN INTELLIGENCE DESK
          </div>
          <h1 style={{ fontSize: '2.6rem', marginBottom: '0.4rem', letterSpacing: '-0.03em' }}>
            Open Source Research & Human Evaluation
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', maxWidth: '780px' }}>
            Synthesize open-source foundations (GitHub, arXiv, Hugging Face), evaluate breakthrough technical feasibility with human judgment, and preserve actionable blueprints for future innovation.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-white)', padding: '0.35rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-hairline)' }}>
          <button
            onClick={() => setPageTab('ACTIVE_RESEARCH')}
            className={`btn btn-sm ${activeTab === 'ACTIVE_RESEARCH' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-pill)', gap: '0.4rem' }}
          >
            <Sparkles size={14} /> Research Studio
          </button>
          <button
            onClick={() => setPageTab('SAVED_ARCHIVE')}
            className={`btn btn-sm ${activeTab === 'SAVED_ARCHIVE' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-pill)', gap: '0.4rem' }}
          >
            <BookOpen size={14} /> Research Archive ({savedEvaluations.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACTIVE RESEARCH STUDIO & HUMAN EVALUATION */}
      {/* ========================================================================= */}
      {activeTab === 'ACTIVE_RESEARCH' && (
        <div>
          {/* Research Configuration Card */}
          <div className="editorial-card" style={{ padding: '2rem', marginBottom: '2.5rem', backgroundColor: 'var(--bg-white)', borderLeft: '4px solid var(--coral)' }}>
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.85rem' }}>
              STEP 1: SELECT SPECIMEN OR ENTER RESEARCH HYPOTHESIS
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  Choose from Existing Projects
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    const found = userProjects.find(p => p.id === e.target.value);
                    handleSelectProject(found);
                  }}
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  <option value="">-- Custom Hypothesis / Unlisted Topic --</option>
                  {userProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.project_type || 'idea'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  Innovation Specimen / Topic Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Decentralized Multi-Agent State Machine Protocol"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  Domain Category
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  <option value="Technology & Software">Technology & Software</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                  <option value="Sustainability & Climate">Sustainability & Climate</option>
                  <option value="Education & Knowledge">Education & Knowledge</option>
                  <option value="Decentralized Systems & Web3">Decentralized Systems & Web3</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                Problem Statement & Technical Intent
              </label>
              <textarea
                rows={2}
                placeholder="Detail the core friction, bottleneck, or technological hypothesis you want to explore..."
                value={customProblem}
                onChange={(e) => setCustomProblem(e.target.value)}
                className="form-input"
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <button
              onClick={handleGenerateResearch}
              disabled={isGenerating || !customTitle.trim()}
              className="btn btn-coral btn-lg"
              style={{ gap: '0.5rem', width: '100%', justifyContent: 'center' }}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  Synthesizing Open Source Foundations & Research Hypotheses...
                </>
              ) : (
                <>
                  <BrainCircuit size={18} /> Synthesize AI Research & Open Source Stack ✦
                </>
              )}
            </button>
          </div>

          {/* Research Results Display */}
          {researchReport && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              
              {/* Executive Research Brief */}
              <div className="editorial-card" style={{ padding: '2.5rem', backgroundColor: 'var(--bg-white)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <span className="status-pill status-pill-primary" style={{ marginBottom: '0.6rem', display: 'inline-block' }}>
                      {researchReport.category}
                    </span>
                    <h2 style={{ fontSize: '2.1rem', marginBottom: '0.35rem' }}>
                      {researchReport.title}
                    </h2>
                    <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      RESEARCH ID: {researchReport.research_id} • GENERATED: {new Date(researchReport.generated_at).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSproutNewProject(researchReport)}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '0.45rem', color: 'var(--coral)' }}
                  >
                    <PlusCircle size={15} /> Sprout Into Project Specimen
                  </button>
                </div>

                <div style={{ backgroundColor: 'var(--bg-ivory)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--periwinkle)', marginBottom: '2rem' }}>
                  <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '0.4rem' }}>
                    EXECUTIVE RESEARCH BRIEF
                  </div>
                  <p style={{ fontSize: '1.02rem', lineHeight: '1.6', margin: 0, color: 'var(--text-primary)' }}>
                    {researchReport.executive_summary}
                  </p>
                </div>

                {/* Open Source Foundations Grid */}
                <div style={{ marginBottom: '2.5rem' }}>
                  <div className="editorial-mono-label" style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    OPEN SOURCE FOUNDATIONS & REFERENCE REPOSITORIES
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {researchReport.open_source_stack.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="editorial-card"
                        style={{
                          padding: '1.25rem',
                          textDecoration: 'none',
                          color: 'inherit',
                          backgroundColor: 'var(--bg-white)',
                          border: '1px solid var(--border-hairline)',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--coral)', textTransform: 'uppercase' }}>
                              {src.type.replace('_', ' ')}
                            </span>
                            <span className="mono" style={{ fontSize: '0.72rem', backgroundColor: 'var(--bg-ivory)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                              {src.stars}
                            </span>
                          </div>
                          <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {src.name} <ExternalLink size={13} color="var(--text-secondary)" />
                          </h4>
                          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.45', marginBottom: '0.75rem' }}>
                            {src.description}
                          </p>
                        </div>
                        <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--teal)' }}>
                          License: {src.license} ↗
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Breakthrough Hypotheses Grid */}
                <div style={{ marginBottom: '2.5rem' }}>
                  <div className="editorial-mono-label" style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    UNEXPLORED BREAKTHROUGH HYPOTHESES & IDEA DIRECTIONS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {researchReport.novel_ideas_and_hypotheses.map((hyp, i) => (
                      <div
                        key={hyp.id || i}
                        style={{
                          padding: '1.5rem',
                          backgroundColor: 'var(--bg-ivory)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                            {hyp.title}
                          </h3>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <span className="mono" style={{ fontSize: '0.72rem', backgroundColor: 'var(--coral)', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-pill)', fontWeight: 600 }}>
                              {hyp.novelty}
                            </span>
                            <span className="mono" style={{ fontSize: '0.72rem', backgroundColor: 'var(--bg-white)', color: 'var(--text-secondary)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)' }}>
                              FEASIBILITY: {hyp.feasibility}
                            </span>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.96rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '0.85rem' }}>
                          {hyp.description}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span className="editorial-mono-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            SUGGESTED STACK:
                          </span>
                          {hyp.suggested_stack.map((st, idx) => (
                            <span key={idx} className="mono" style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-white)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-hairline)' }}>
                              {st}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Architecture Matrix */}
                <div>
                  <div className="editorial-mono-label" style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    RECOMMENDED ARCHITECTURAL BLUEPRINT
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                    {Object.entries(researchReport.technical_architecture).map(([layer, desc], idx) => (
                      <div key={idx} style={{ padding: '1.25rem', backgroundColor: 'var(--bg-white)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)' }}>
                        <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--coral)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                          {layer.replace(/_/g, ' ')}
                        </div>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.45', margin: 0 }}>
                          {desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ================================================================= */}
              {/* STEP 2: HUMAN-IN-THE-LOOP EVALUATION FORM */}
              {/* ================================================================= */}
              <div className="editorial-card" style={{ padding: '2.5rem', backgroundColor: 'var(--bg-white)', border: '2px solid var(--coral)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.35rem' }}>
                      STEP 2: HUMAN-IN-THE-LOOP EVALUATION FORM
                    </div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
                      Evaluate & Archive Research Specimen
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem' }}>
                      Apply human domain critique and future roadmap scoring before archiving this intelligence artifact.
                    </p>
                  </div>

                  {evaluationSuccess && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--green)', fontWeight: 600 }}>
                      <CheckCircle2 size={18} /> Evaluation Saved to Archive!
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmitEvaluation}>
                  {/* Verdict Radio Pills */}
                  <div style={{ marginBottom: '2rem' }}>
                    <label className="form-label" style={{ fontSize: '0.88rem', marginBottom: '0.6rem' }}>
                      Human Validation Verdict *
                    </label>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {[
                        { id: 'VALIDATED_HIGH_POTENTIAL', label: '✦ High Breakthrough Potential', color: 'var(--green)' },
                        { id: 'FEASIBLE_WITH_MODS', label: '✓ Feasible with Modifications', color: 'var(--coral)' },
                        { id: 'THEORETICAL_ONLY', label: '⚡ Theoretical / Requires Lab Bench', color: 'var(--periwinkle)' },
                        { id: 'NEEDS_REFINEMENT', label: '⚠ Needs Significant Refinement', color: 'var(--text-secondary)' }
                      ].map(v => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setVerdict(v.id)}
                          className={`btn btn-sm ${verdict === v.id ? 'btn-primary' : 'btn-secondary'}`}
                          style={{
                            borderColor: verdict === v.id ? v.color : 'var(--border-subtle)',
                            backgroundColor: verdict === v.id ? 'var(--ink-navy)' : 'var(--bg-white)',
                            color: verdict === v.id ? '#FFFFFF' : 'var(--text-primary)'
                          }}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scoring Sliders */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem', backgroundColor: 'var(--bg-ivory)', padding: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span className="mono" style={{ fontSize: '0.8rem' }}>TECHNICAL FEASIBILITY</span>
                        <span className="mono" style={{ fontWeight: 800 }}>{feasibilityScore} / 5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={feasibilityScore}
                        onChange={(e) => setFeasibilityScore(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--coral)' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span className="mono" style={{ fontSize: '0.8rem' }}>NOVELTY & BREAKTHROUGH</span>
                        <span className="mono" style={{ fontWeight: 800 }}>{noveltyScore} / 5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={noveltyScore}
                        onChange={(e) => setNoveltyScore(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--coral)' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span className="mono" style={{ fontSize: '0.8rem' }}>OPEN SOURCE GROUNDING</span>
                        <span className="mono" style={{ fontWeight: 800 }}>{openSourceScore} / 5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={openSourceScore}
                        onChange={(e) => setOpenSourceScore(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--coral)' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span className="mono" style={{ fontSize: '0.8rem' }}>FUTURE UTILITY SCORE</span>
                        <span className="mono" style={{ fontWeight: 800 }}>{futureUtilityScore} / 5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={futureUtilityScore}
                        onChange={(e) => setFutureUtilityScore(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--coral)' }}
                      />
                    </div>
                  </div>

                  {/* Human Critique & Action Plan Textareas */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                        Human Domain Critique & Edge Cases *
                      </label>
                      <textarea
                        rows={4}
                        required
                        placeholder="Detail critical caveats, operational challenges, security concerns, or domain realities that the AI may have overlooked..."
                        value={humanCritique}
                        onChange={(e) => setHumanCritique(e.target.value)}
                        className="form-input"
                        style={{ width: '100%', resize: 'vertical' }}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                        Future Implementation Roadmap & Action Steps
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Outline concrete recommendations for future developers, researchers, or founders exploring this idea..."
                        value={futureActionPlan}
                        onChange={(e) => setFutureActionPlan(e.target.value)}
                        className="form-input"
                        style={{ width: '100%', resize: 'vertical' }}
                      />
                    </div>
                  </div>

                  {/* Form Submission Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleSproutNewProject(researchReport)}
                      className="btn btn-secondary"
                      style={{ gap: '0.45rem', color: 'var(--coral)' }}
                    >
                      <Rocket size={15} /> Sprout Project Specimen
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmittingEval || !humanCritique.trim()}
                      className="btn btn-coral"
                      style={{ gap: '0.45rem' }}
                    >
                      {isSubmittingEval ? (
                        <>Saving Evaluation...</>
                      ) : (
                        <>
                          <CheckCircle2 size={16} /> Save Human Evaluation & Archive ✦
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RESEARCH ARCHIVE & EXPLORER */}
      {/* ========================================================================= */}
      {activeTab === 'SAVED_ARCHIVE' && (
        <div>
          {/* Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '420px', backgroundColor: 'var(--bg-white)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hairline)' }}>
              <Search size={16} color="var(--text-secondary)" />
              <input
                type="text"
                placeholder="Search archived research evaluations..."
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.92rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['ALL', 'Technology & Software', 'Artificial Intelligence', 'Healthcare & Life Sciences', 'Sustainability & Climate', 'Decentralized Systems & Web3'].map(c => (
                <button
                  key={c}
                  onClick={() => setArchiveCategory(c)}
                  className={`btn btn-sm ${archiveCategory === c ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.78rem' }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Archived Evaluations List */}
          {filteredArchive.length === 0 ? (
            <div className="editorial-card" style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--bg-white)' }}>
              <Compass size={36} color="var(--text-secondary)" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>No Research Evaluations Found</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Run research in the studio and submit a human evaluation form to archive intelligence reports.
              </p>
              <button onClick={() => setPageTab('ACTIVE_RESEARCH')} className="btn btn-coral">
                <Sparkles size={15} /> Open Research Studio
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {filteredArchive.map(item => (
                <div key={item.id} className="editorial-card" style={{ padding: '2rem', backgroundColor: 'var(--bg-white)', border: '1px solid var(--border-hairline)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.45rem' }}>
                        <span className="status-pill status-pill-primary">
                          {item.category}
                        </span>
                        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--coral)', fontWeight: 600 }}>
                          VERDICT: {item.verdict.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.6rem', marginBottom: '0.2rem' }}>
                        {item.project_title}
                      </h3>
                      <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        EVALUATED BY {item.evaluator_name.toUpperCase()} • {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => handleSproutNewProject(item.research_brief)}
                        className="btn btn-coral btn-sm"
                        style={{ gap: '0.4rem' }}
                      >
                        <Rocket size={14} /> Sprout Project
                      </button>
                      <button
                        onClick={() => handleDeleteEvaluation(item.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--red)' }}
                        title="Delete Evaluation"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Scores Grid */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem', backgroundColor: 'var(--bg-ivory)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)' }}>
                    <span className="mono" style={{ fontSize: '0.78rem' }}>FEASIBILITY: <strong>{item.feasibility_score}/5</strong></span>
                    <span className="mono" style={{ opacity: 0.3 }}>|</span>
                    <span className="mono" style={{ fontSize: '0.78rem' }}>NOVELTY: <strong>{item.novelty_score}/5</strong></span>
                    <span className="mono" style={{ opacity: 0.3 }}>|</span>
                    <span className="mono" style={{ fontSize: '0.78rem' }}>OPEN SOURCE: <strong>{item.open_source_grounding_score}/5</strong></span>
                    <span className="mono" style={{ opacity: 0.3 }}>|</span>
                    <span className="mono" style={{ fontSize: '0.78rem' }}>FUTURE UTILITY: <strong>{item.future_utility_score}/5</strong></span>
                  </div>

                  {/* Human Critique */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div className="editorial-mono-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                      HUMAN DOMAIN CRITIQUE & CAVEATS
                    </div>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.5', margin: 0 }}>
                      {item.human_critique_notes}
                    </p>
                  </div>

                  {/* Future Action Plan */}
                  {item.future_action_plan && (
                    <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '0.75rem' }}>
                      <div className="editorial-mono-label" style={{ fontSize: '0.7rem', color: 'var(--coral)', marginBottom: '0.3rem' }}>
                        FUTURE ACTION PLAN & NEXT STEPS
                      </div>
                      <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.45', margin: 0 }}>
                        {item.future_action_plan}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
