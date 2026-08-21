import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { findRelatedInnovations } from '../services/similarity';
import { getCategoryInk, BRAND_COLORS } from '../utils/categoryColors';
import { cleanProjectTitle } from '../utils/textUtils';
import InnovationCore from '../components/three/InnovationCore';
import StatusBadge, { StageBadge } from '../components/StatusBadge';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Search, 
  ShieldCheck, 
  ExternalLink, 
  Save,
  RotateCcw,
  AlertCircle,
  Lightbulb,
  Box,
  Rocket,
  Plus,
  Trash2,
  Globe,
  Play,
  Code2,
  Smartphone,
  Check,
  CheckCircle
} from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { AIService } from '../services/aiService';
import { ProblemDetectionAgent, InnovationResearchAgent } from '../services/aiAgents';

const DRAFT_STORAGE_KEY = 'innovexa_project_create_draft_v4';

/**
 * SubmitInnovationPage — Unified Project Creation Studio
 * Tracks: 1. NEW IDEA | 2. NEW PRODUCT | 3. NEW STARTUP
 * Multi-step Workflow:
 *   STEP 01: Overview, Domain & Problem Statement
 *   STEP 02: Solution Thesis, Target Audience/Market, Stage & Links
 *   STEP 03: Complete Review/Confirmation, Collision Scan & Final Supabase Creation
 */
export default function SubmitInnovationPage({ setActiveTab, setSelectedInnoId, selectedInnoId }) {
  const { currentUser, showToast } = useAuth();
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [creationTrack, setCreationTrack] = useState('STARTUP'); // 'IDEA' | 'PRODUCT' | 'STARTUP'
  const [step, setStep] = useState(1);

  // Single Unified Form State across All Steps & Tracks
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    problem_statement: '',
    proposed_solution: '',
    target_users: '',
    short_description: '',
    tags_text: '',
    cover_image: '',
    features: [''],
    has_live_product: false,
    website_url: '',
    demo_url: '',
    github_url: '',
    app_store_url: '',
    play_store_url: '',
    startup_stage: 'idea' // 'idea' | 'prototype' | 'mvp' | 'beta' | 'live'
  });

  const updateFormField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // AI Feature States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [aiSuggestedTags, setAiSuggestedTags] = useState([]);
  const [isImprovingDesc, setIsImprovingDesc] = useState(false);
  const [aiDescComparison, setAiDescComparison] = useState(null);

  // AI Intelligence Layer Agent States
  const [isAnalyzingProblem, setIsAnalyzingProblem] = useState(false);
  const [problemAgentResult, setProblemAgentResult] = useState(null);
  const [isResearching, setIsResearching] = useState(false);
  const [researchAgentResult, setResearchAgentResult] = useState(null);
  const [showResearchModal, setShowResearchModal] = useState(false);

  // Step 3 Similarity Scanner state
  const [similarInnovations, setSimilarInnovations] = useState([]);
  const [hasDraftRecovered, setHasDraftRecovered] = useState(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Fetch categories from Supabase on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const { data: categories, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) {
        console.error("Failed to fetch categories:", error);
        return;
      }

      if (categories && categories.length > 0) {
        setCategories(categories);
        setSelectedCategoryId(prev => prev || categories[0].id);
        setFormData(prev => ({
          ...prev,
          category_id: prev.category_id && categories.some(c => c.id === prev.category_id) ? prev.category_id : categories[0].id
        }));
      }
    };

    fetchCategories();
  }, []);

  // Pre-populate fields if editing an existing project
  useEffect(() => {
    if (!selectedInnoId) return;
    const loadEditingProject = async () => {
      let p = StorageService.getInnovationById(selectedInnoId);
      if (!p) {
        const res = await SupabaseService.getProjectById(selectedInnoId);
        p = res.data;
      }
      if (p) {
        const track = (p.project_type || p.creation_type || 'STARTUP').toUpperCase();
        setCreationTrack(track === 'PRODUCT' ? 'PRODUCT' : (track === 'IDEA' ? 'IDEA' : 'STARTUP'));
        setFormData({
          title: p.title || '',
          category_id: p.category_id || categories[0]?.id || '93fe2938-c843-4fa4-8b01-b07d59990023',
          problem_statement: p.problem_statement || '',
          proposed_solution: p.proposed_solution || '',
          target_users: p.target_users || '',
          short_description: p.short_description || p.description || '',
          tags_text: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
          cover_image: p.cover_image || '',
          features: Array.isArray(p.features) && p.features.length > 0 ? p.features : [''],
          has_live_product: Boolean(p.has_live_product || p.website_url || p.demo_url),
          website_url: p.website_url || p.launch_url || '',
          demo_url: p.demo_url || '',
          github_url: p.github_url || '',
          app_store_url: p.app_store_url || '',
          play_store_url: p.play_store_url || '',
          startup_stage: (p.project_stage || 'idea').toLowerCase()
        });
      }
    };
    loadEditingProject();
  }, [selectedInnoId]);

  // Load saved draft on mount (if not editing an existing project)
  useEffect(() => {
    if (selectedInnoId) return;
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const d = JSON.parse(savedDraft);
        if (d.creationTrack) setCreationTrack(d.creationTrack);
        if (d.formData) {
          setFormData(prev => ({
            ...prev,
            ...d.formData
          }));
          setHasDraftRecovered(true);
        }
      }
    } catch (e) {
      console.warn('Draft parse error:', e);
    }
  }, [selectedInnoId]);

  // Autosave draft whenever formData or creationTrack changes
  useEffect(() => {
    if (selectedInnoId) return;
    const draft = {
      creationTrack,
      formData,
      updatedAt: Date.now()
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setIsSavedRecently(true);
    const timer = setTimeout(() => setIsSavedRecently(false), 1800);
    return () => clearTimeout(timer);
  }, [creationTrack, formData, selectedInnoId]);

  // AI Handlers
  const handleAnalyzeWithAI = async () => {
    if (!formData.title.trim() && !formData.problem_statement.trim()) {
      showToast('Please enter a project title or problem statement first.', 'warning');
      return;
    }
    setIsAnalyzing(true);
    showToast('AI is evaluating project clarity and innovation readiness...', 'info');
    try {
      const res = await AIService.analyzeIdea({
        title: formData.title.trim(),
        description: formData.short_description || formData.problem_statement,
        problem_statement: formData.problem_statement,
        proposed_solution: formData.proposed_solution,
        target_users: formData.target_users,
        project_type: creationTrack,
        launch_url: formData.website_url || formData.demo_url
      }, categories);
      setAiAnalysis(res);
      showToast('AI analysis completed!', 'success');
    } catch (err) {
      console.warn('AI analysis error:', err);
      showToast('AI analysis temporarily unavailable.', 'warning');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateTags = async () => {
    if (!formData.title.trim() && !formData.problem_statement.trim()) {
      showToast('Please enter a title or description first.', 'warning');
      return;
    }
    setIsGeneratingTags(true);
    try {
      const catObj = categories.find(c => c.id === formData.category_id);
      const tags = await AIService.generateTags({
        title: formData.title.trim(),
        description: formData.short_description || formData.problem_statement,
        category_name: catObj?.name
      });
      setAiSuggestedTags(tags);
      showToast(`Generated ${tags.length} smart tags!`, 'success');
    } catch (err) {
      showToast('Tag generation unavailable.', 'warning');
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const handleAddTag = (tag) => {
    const current = formData.tags_text.split(',').map(t => t.trim()).filter(Boolean);
    if (!current.includes(tag)) {
      const updated = [...current, tag].join(', ');
      updateFormField('tags_text', updated);
    }
  };

  // AI Feature 1: Problem Detection Agent Handler
  const handleAnalyzeProblemAgent = async () => {
    if (!formData.title.trim() && !formData.problem_statement.trim()) {
      showToast('Please enter a project title or problem statement first.', 'warning');
      return;
    }
    setIsAnalyzingProblem(true);
    showToast('Problem Detection Agent analyzing clarity & suitability...', 'info');
    try {
      const catObj = categories.find(c => c.id === formData.category_id);
      const res = await ProblemDetectionAgent.analyze({
        title: formData.title.trim(),
        problemStatement: formData.problem_statement.trim(),
        proposedSolution: formData.proposed_solution.trim(),
        targetUsers: formData.target_users.trim(),
        category: catObj?.name || 'Technology',
        description: formData.short_description.trim()
      });

      if (res.success && res.data) {
        setProblemAgentResult(res.data);
        showToast('Problem analysis completed!', 'success');
      } else {
        showToast(res.error || 'Unable to complete problem analysis.', 'warning');
      }
    } catch (err) {
      console.warn('Problem Detection Agent error:', err);
      showToast('Problem Detection Agent temporarily unavailable.', 'warning');
    } finally {
      setIsAnalyzingProblem(false);
    }
  };

  // AI Feature 2: Innovation Research Agent Handler
  const handleRunResearchAgent = async () => {
    if (!formData.title.trim() && !formData.problem_statement.trim()) {
      showToast('Please provide a title or problem statement to research.', 'warning');
      return;
    }
    setIsResearching(true);
    setShowResearchModal(true);
    try {
      const catObj = categories.find(c => c.id === formData.category_id);
      const tagsList = formData.tags_text.split(',').map(t => t.trim()).filter(Boolean);
      const res = await InnovationResearchAgent.research({
        title: formData.title.trim(),
        problemStatement: formData.problem_statement.trim(),
        description: formData.short_description.trim(),
        category: catObj?.name || 'Technology',
        tags: tagsList,
        proposedSolution: formData.proposed_solution.trim()
      });

      if (res.success && res.data) {
        setResearchAgentResult(res.data);
      } else {
        showToast('Unable to complete innovation research.', 'warning');
      }
    } catch (err) {
      console.warn('Innovation Research Agent error:', err);
    } finally {
      setIsResearching(false);
    }
  };

  const handleSaveDraftManual = () => {
    if (!formData.title.trim()) {
      showToast('Please provide at least a project title before saving.', 'warning');
      return;
    }
    const draft = {
      creationTrack,
      formData,
      updatedAt: Date.now()
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    showToast('Draft successfully saved to local storage.', 'success');
  };

  const handleClearDraft = () => {
    if (window.confirm('Discard current draft and start fresh?')) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setFormData({
        title: '',
        category_id: categories[0]?.id || '93fe2938-c843-4fa4-8b01-b07d59990023',
        problem_statement: '',
        proposed_solution: '',
        target_users: '',
        short_description: '',
        tags_text: '',
        cover_image: '',
        features: [''],
        has_live_product: false,
        website_url: '',
        demo_url: '',
        github_url: '',
        app_store_url: '',
        play_store_url: '',
        startup_stage: 'idea'
      });
      setStep(1);
      setHasDraftRecovered(false);
      showToast('Draft cleared.', 'info');
    }
  };

  // Feature list handlers for Product track
  const handleAddFeature = () => {
    updateFormField('features', [...formData.features, '']);
  };

  const handleUpdateFeature = (index, value) => {
    const updated = [...formData.features];
    updated[index] = value;
    updateFormField('features', updated);
  };

  const handleRemoveFeature = (index) => {
    if (formData.features.length <= 1) {
      updateFormField('features', ['']);
      return;
    }
    updateFormField('features', formData.features.filter((_, i) => i !== index));
  };

  // Step 1 Validation & Next
  const handleProceedToStep2 = (e) => {
    if (e) e.preventDefault();
    if (!formData.title.trim()) {
      showToast(`Please enter a title for your ${creationTrack.toLowerCase()}.`, 'warning');
      return;
    }
    if (!formData.problem_statement.trim() || formData.problem_statement.trim().length < 15) {
      showToast('Please describe the problem in at least 15 characters.', 'warning');
      return;
    }
    setStep(2);
  };

  // Step 2 Validation & Next -> Moves to Step 3 (Review & Confirmation)
  const handleProceedToStep3 = (e) => {
    if (e) e.preventDefault();

    if (creationTrack === 'IDEA') {
      if (!formData.proposed_solution.trim()) {
        showToast('Please outline your proposed solution.', 'warning');
        return;
      }
      if (!formData.target_users.trim()) {
        showToast('Please specify the target users or beneficiaries.', 'warning');
        return;
      }
    } else if (creationTrack === 'PRODUCT') {
      if (!formData.short_description.trim() && !formData.proposed_solution.trim()) {
        showToast('Please provide a description or elevator pitch for your product.', 'warning');
        return;
      }
      if (!formData.target_users.trim()) {
        showToast('Please specify the target users or customers.', 'warning');
        return;
      }
    } else if (creationTrack === 'STARTUP') {
      if (!formData.proposed_solution.trim()) {
        showToast('Please provide your startup solution & value proposition.', 'warning');
        return;
      }
      if (!formData.target_users.trim()) {
        showToast('Please specify your target market or addressable audience.', 'warning');
        return;
      }
      if (!formData.startup_stage) {
        showToast('Please select your current startup stage.', 'warning');
        return;
      }
    }

    // Run similarity check in background for Step 3 review
    const currentDraft = {
      title: formData.title,
      category_id: formData.category_id,
      short_description: formData.short_description || formData.proposed_solution.slice(0, 140) || formData.problem_statement.slice(0, 140),
      problem_statement: formData.problem_statement,
      proposed_solution: formData.proposed_solution,
      target_users: formData.target_users,
      tags: formData.tags_text.split(',').map(t => t.trim()).filter(Boolean)
    };
    const existingInnovations = StorageService.getInnovations();
    const rankedSimilar = findRelatedInnovations(currentDraft, existingInnovations, 3);
    setSimilarInnovations(rankedSimilar);

    setStep(3);
  };

  // Final Submit to Supabase / Save Draft
  const handleFinalSubmit = async (asDraftOnly = false) => {
    // 1. Verify authenticated user
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const effectiveUser = authData?.user || currentUser;

    if (!effectiveUser || !effectiveUser.id) {
      showToast('Please sign in to create a startup.', 'warning');
      return;
    }

    // 2. Validate essential fields
    if (!formData.title.trim()) {
      showToast('Please enter a project title.', 'warning');
      setStep(1);
      return;
    }
    if (!formData.problem_statement.trim() || formData.problem_statement.trim().length < 15) {
      showToast('Please describe the problem in at least 15 characters.', 'warning');
      setStep(1);
      return;
    }
    if (creationTrack === 'STARTUP' && (!formData.proposed_solution.trim() || !formData.target_users.trim())) {
      showToast('Please provide your startup solution and target market.', 'warning');
      setStep(2);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    const catObj = categories.find(c => c.id === formData.category_id);
    let finalStage = 'idea';
    if (creationTrack === 'PRODUCT') {
      finalStage = formData.has_live_product ? 'live' : 'prototype';
    } else if (creationTrack === 'STARTUP') {
      finalStage = (formData.startup_stage || 'idea').toLowerCase();
    }

    const cleanFeatures = formData.features.map(f => f.trim()).filter(Boolean);
    const desc = (formData.short_description.trim() || formData.proposed_solution.trim() || formData.problem_statement.trim() || formData.title.trim());
    const launchUrl = (formData.website_url.trim() || formData.demo_url.trim() || null);

    // Exact lowercase PostgreSQL check constraint value: 'idea' | 'product' | 'startup'
    const dbProjectType = creationTrack.toLowerCase();

    const projectPayload = {
      title: cleanProjectTitle(formData.title.trim()),
      category_id: formData.category_id,
      category_name: catObj?.name || 'Technology',
      short_description: desc,
      description: desc,
      problem_statement: formData.problem_statement.trim(),
      proposed_solution: formData.proposed_solution.trim() || (creationTrack === 'PRODUCT' ? formData.short_description.trim() : ''),
      target_users: formData.target_users.trim(),
      project_type: dbProjectType,
      creation_type: creationTrack,
      innovation_type: creationTrack,
      project_stage: finalStage,
      status: asDraftOnly ? 'draft' : 'published',
      launch_url: launchUrl,
      website_url: formData.website_url.trim() || null,
      demo_url: formData.demo_url.trim() || null,
      github_url: formData.github_url.trim() || null,
      app_store_url: formData.app_store_url.trim() || null,
      play_store_url: formData.play_store_url.trim() || null,
      has_live_product: Boolean(formData.has_live_product || formData.website_url || formData.demo_url),
      features: cleanFeatures,
      tags: formData.tags_text.split(',').map(s => s.trim()).filter(Boolean),
      cover_image: formData.cover_image.trim() || null,
      asDraftOnly
    };

    try {
      let savedProject = null;

      if (selectedInnoId) {
        const updateRes = await SupabaseService.updateProject(selectedInnoId, projectPayload, effectiveUser.id);
        savedProject = updateRes.data;
        if (updateRes.error) {
          console.error("Project update failed:", updateRes.error);
          showToast(updateRes.error.message || 'Failed to update project.', 'error');
          setIsSubmitting(false);
          return;
        }
      } else {
        // Direct single-operation frontend insert to Supabase projects table
        const selectedCategoryId = formData.category_id || selectedCategoryId;
        const projectType = (formData.projectType || creationTrack).toLowerCase();
        const projectDesc = formData.description || desc;
        const projectLaunchUrl = formData.launchUrl || launchUrl;
        const projectStatus = asDraftOnly ? "draft" : "published";

        // 1. Validate category_id is a valid UUID
        const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        if (!selectedCategoryId || !isUUID(selectedCategoryId)) {
          console.error("Project creation failed - invalid category_id:", selectedCategoryId);
          showToast('Please select a valid domain category.', 'error');
          setIsSubmitting(false);
          return;
        }

        // 2. Validate project_type constraint: idea | product | startup
        const allowedProjectTypes = ['idea', 'product', 'startup'];
        if (!allowedProjectTypes.includes(projectType)) {
          console.error("Project creation failed - invalid project_type:", projectType);
          showToast(`Invalid project type '${projectType}'. Must be idea, product, or startup.`, 'error');
          setIsSubmitting(false);
          return;
        }

        // 3. Validate status constraint: draft | review | published
        const allowedStatuses = ['draft', 'review', 'published'];
        if (!allowedStatuses.includes(projectStatus)) {
          console.error("Project creation failed - invalid status:", projectStatus);
          showToast(`Invalid project status '${projectStatus}'. Must be draft, review, or published.`, 'error');
          setIsSubmitting(false);
          return;
        }

        const { data: project, error } = await supabase
          .from("projects")
          .insert({
            user_id: effectiveUser.id,
            category_id: selectedCategoryId,
            title: cleanProjectTitle(formData.title.trim()),
            description: projectDesc,
            project_type: projectType,
            launch_url: projectLaunchUrl || null,
            status: projectStatus
          })
          .select(`
            *,
            categories (
              id,
              name,
              slug
            ),
            profiles (
              id,
              full_name,
              avatar_url
            )
          `)
          .single();

        if (error) {
          console.error("Project creation failed:", error);
          showToast(error.message || 'Failed to save project. Please try again.', 'error');
          setIsSubmitting(false);
          return;
        }

        console.log("Project created successfully:", project);
        savedProject = project;

        // Cache item with rich UI metadata for 0ms rendering
        const fullCachedItem = {
          ...projectPayload,
          ...project,
          id: project.id,
          project_id: project.id,
          user_id: effectiveUser.id,
          creator_id: effectiveUser.id,
          creator_name: effectiveUser.name || effectiveUser.full_name || 'Innovator',
          creator_avatar: effectiveUser.avatar || effectiveUser.avatar_url || '',
          category_name: project.categories?.name || catObj?.name || 'Uncategorized'
        };
        StorageService.addInnovation(fullCachedItem);
        window.dispatchEvent(new CustomEvent('innovexa:datachange'));
      }

      localStorage.removeItem(DRAFT_STORAGE_KEY);
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });

      if (asDraftOnly) {
        showToast(`"${formData.title}" saved as draft in your portfolio.`, 'info');
        setActiveTab('creator');
      } else {
        showToast(`"${formData.title}" ${selectedInnoId ? 'updated successfully' : 'registered into community validation desk'}!`, 'success');
        const targetId = savedProject?.id || selectedInnoId;
        if (targetId) {
          setSelectedInnoId(targetId);
          setActiveTab('detail');
        } else {
          setActiveTab('explore');
        }
      }
    } catch (err) {
      console.error('Startup creation failed:', err);
      showToast(err.message || 'Unexpected error saving project.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ink = getCategoryInk(formData.category_id);
  const selectedCategoryObj = categories.find(c => c.id === formData.category_id);

  return (
    <div className="workspace-container" style={{ maxWidth: '1200px' }}>
      {/* 2-Column Split Studio Layout */}
      <div
        className="editorial-card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 400px) 1fr',
          backgroundColor: 'var(--bg-white)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* LEFT COLUMN: Track Selector & Live 3D Specimen Core */}
        <div
          style={{
            backgroundColor: 'var(--bg-dark)',
            color: 'var(--text-inverse)',
            padding: '3.5rem 2.75rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRight: '1px solid var(--border-dark)'
          }}
        >
          <div>
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '1.25rem' }}>
              02 / CREATION STUDIO
            </div>

            <div style={{ lineHeight: 1.05, marginBottom: '1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.2rem, 3.8vw, 2.9rem)', color: '#FFFFFF', fontWeight: 800 }}>
                START WITH
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.2rem, 3.8vw, 2.9rem)', color: '#FFFFFF', fontWeight: 800 }}>
                THE THING
              </div>
              <div className="editorial-sans-bold" style={{ fontSize: 'clamp(1.2rem, 2.2vw, 1.6rem)', color: 'var(--text-inverse-muted)', margin: '0.2rem 0' }}>
                YOU CAN'T STOP
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.3rem, 4vw, 3rem)', color: 'var(--coral)', fontStyle: 'italic' }}>
                thinking about.
              </div>
            </div>

            <p style={{ color: 'var(--text-inverse-muted)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '2rem' }}>
              {creationTrack === 'IDEA' && 'Raw sparks belong here. You do not need a live product or demo link—just describe the problem and solution hypothesis.'}
              {creationTrack === 'PRODUCT' && 'Have an app, tool, or prototype? Document key features and showcase your product with or without live links.'}
              {creationTrack === 'STARTUP' && 'Building an early-stage venture? Outline the market opportunity, solution, and current stage from idea to live.'}
            </p>

            {/* 3-Way Track Switcher */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '1.5rem' }}>
              <div className="editorial-mono-label" style={{ color: 'var(--text-inverse-muted)', fontSize: '0.68rem' }}>
                CHOOSE CREATION TRACK:
              </div>
              {[
                { id: 'STARTUP', label: '1. NEW STARTUP', desc: 'Market & Stage (Idea to Live)', icon: Rocket, color: 'var(--apricot)' },
                { id: 'PRODUCT', label: '2. NEW PRODUCT', desc: 'Features & Demo (Optional links)', icon: Box, color: 'var(--periwinkle)' },
                { id: 'IDEA', label: '3. NEW IDEA', desc: 'Concept / Hypothesis (No link needed)', icon: Lightbulb, color: 'var(--coral)' }
              ].map(t => {
                const Icon = t.icon;
                const isSelected = creationTrack === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setCreationTrack(t.id);
                    }}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                      border: `1px solid ${isSelected ? t.color : 'rgba(255, 255, 255, 0.1)'}`,
                      color: isSelected ? '#FFFFFF' : 'var(--text-inverse-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={18} color={t.color} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{t.label}</div>
                      <div style={{ fontSize: '0.72rem', opacity: 0.75 }}>{t.desc}</div>
                    </div>
                    {isSelected && <Check size={14} color={t.color} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3D Glowing Specimen Engine */}
          <div style={{ margin: '1rem 0', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <InnovationCore
              height={200}
              modelType={creationTrack === 'IDEA' ? 'SPARK' : 'STRUCTURE'}
              category={formData.category_id}
              accentColor={BRAND_COLORS.coral}
            />
          </div>

          {/* Autosave Status Indicator */}
          <div style={{ borderTop: '1px solid var(--border-dark)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: '0.72rem', color: isSavedRecently ? 'var(--green)' : 'var(--text-inverse-muted)' }}>
              {isSavedRecently ? '● Autosaved to storage' : 'Draft active'}
            </span>
            {hasDraftRecovered && (
              <button
                type="button"
                onClick={handleClearDraft}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--red)', fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
              >
                Clear Draft
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Multi-Step Form */}
        <div style={{ padding: '3.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Top Step Progress Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div className="editorial-mono-label" style={{ color: 'var(--coral)' }}>
              {creationTrack} TRACK / STEP 0{step} OF 03 / {
                step === 1 ? 'OVERVIEW & PROBLEM' :
                step === 2 ? (creationTrack === 'STARTUP' ? 'SOLUTION & MARKET' : creationTrack === 'PRODUCT' ? 'FEATURES & AUDIENCE' : 'SOLUTION & BENEFICIARIES') :
                'REVIEW & SUBMISSION'
              }
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                type="button"
                onClick={handleAnalyzeWithAI}
                disabled={isAnalyzing}
                className="btn btn-ghost btn-sm"
                style={{
                  color: 'var(--coral)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  gap: '0.35rem',
                  border: '1px solid rgba(231, 111, 130, 0.3)',
                  backgroundColor: 'rgba(231, 111, 130, 0.05)',
                  padding: '0.25rem 0.65rem'
                }}
              >
                <Sparkles size={13} />
                <span>{isAnalyzing ? 'ANALYZING...' : '✦ ANALYZE WITH AI'}</span>
              </button>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {[1, 2, 3].map(s => (
                  <div
                    key={s}
                    style={{
                      width: '42px',
                      height: '4px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: step >= s ? 'var(--coral)' : 'rgba(36, 36, 43, 0.12)',
                      transition: 'background-color 0.2s ease'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ================= STEP 01: OVERVIEW & PROBLEM STATEMENT ================= */}
          {step === 1 && (
            <form onSubmit={handleProceedToStep2}>
              <div style={{ marginBottom: '2rem' }}>
                <div className="editorial-mono-label" style={{ color: 'var(--lavender)', marginBottom: '0.35rem' }}>STEP 01</div>
                <h2 style={{ fontSize: '1.85rem' }}>
                  {creationTrack === 'IDEA' && 'What problem are you noticing?'}
                  {creationTrack === 'PRODUCT' && 'Tell us about your product.'}
                  {creationTrack === 'STARTUP' && 'What is your venture concept?'}
                </h2>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {creationTrack === 'IDEA' ? 'IDEA TITLE / PROJECT NAME' : creationTrack === 'PRODUCT' ? 'PRODUCT NAME' : 'STARTUP NAME'}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => updateFormField('title', e.target.value)}
                  placeholder={creationTrack === 'IDEA' ? 'e.g. AI Autonomous Study Companion' : creationTrack === 'PRODUCT' ? 'e.g. StudyPulse Studio' : 'e.g. NovaLearn Inc.'}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">DISCIPLINE / DOMAIN CATEGORY</label>
                <select
                  value={selectedCategoryId || formData.category_id || ''}
                  onChange={(e) => {
                    setSelectedCategoryId(e.target.value);
                    updateFormField('category_id', e.target.value);
                  }}
                  className="form-select"
                  required
                >
                  <option value="">Select Category</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    {creationTrack === 'IDEA' ? 'PROBLEM STATEMENT' : creationTrack === 'PRODUCT' ? 'PROBLEM SOLVED BY THIS PRODUCT' : 'PROBLEM BEING SOLVED'}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {/* Problem Detection Agent Trigger */}
                    <button
                      type="button"
                      onClick={handleAnalyzeProblemAgent}
                      disabled={isAnalyzingProblem || (!formData.title.trim() && !formData.problem_statement.trim())}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--coral)', fontSize: '0.74rem', padding: '0.2rem 0.6rem', gap: '0.3rem', fontWeight: 700 }}
                    >
                      <Sparkles size={12} /> {isAnalyzingProblem ? 'ANALYZING PROBLEM...' : '✦ ANALYZE PROBLEM'}
                    </button>

                    {/* Innovation Research Agent Trigger */}
                    <button
                      type="button"
                      onClick={handleRunResearchAgent}
                      disabled={isResearching || (!formData.title.trim() && !formData.problem_statement.trim())}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--periwinkle)', fontSize: '0.74rem', padding: '0.2rem 0.6rem', gap: '0.3rem', fontWeight: 700 }}
                    >
                      <Search size={12} /> {isResearching ? 'RESEARCHING...' : '✦ RESEARCH INNOVATION'}
                    </button>

                    <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {formData.problem_statement.length} chars (min 15)
                    </span>
                  </div>
                </div>
                <textarea
                  value={formData.problem_statement}
                  onChange={e => updateFormField('problem_statement', e.target.value)}
                  placeholder="Describe the painful reality, user friction, or market gap in vivid detail..."
                  className="form-textarea"
                  rows={4}
                  required
                />
              </div>

              {/* ================= AI FEATURE 1: PROBLEM DETECTION AGENT RESULTS CARD ================= */}
              {problemAgentResult && (
                <div
                  className="editorial-card"
                  style={{
                    backgroundColor: 'var(--bg-white)',
                    borderLeft: '4px solid var(--coral)',
                    padding: '1.75rem',
                    marginBottom: '1.75rem',
                    animation: 'fadeIn 0.25s ease-out'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span className="editorial-mono-label" style={{ color: 'var(--coral)' }}>
                        ✦ PROBLEM DETECTION AGENT
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: problemAgentResult.clarity_score >= 70 ? 'rgba(105, 184, 154, 0.15)' : 'rgba(231, 111, 130, 0.15)',
                        color: problemAgentResult.clarity_score >= 70 ? 'var(--green)' : 'var(--coral)'
                      }}>
                        {problemAgentResult.clarity_score >= 70 ? 'CLEAR & ACTIONABLE' : 'NEEDS REFINEMENT'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="mono" style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--coral)' }}>
                        CLARITY: {problemAgentResult.clarity_score}%
                      </div>
                    </div>
                  </div>

                  {/* Summary & Target Users */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                      <div className="editorial-mono-label" style={{ fontSize: '0.68rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                        IDENTIFIED PROBLEM
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.45 }}>
                        {problemAgentResult.problem_summary}
                      </p>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                      <div className="editorial-mono-label" style={{ fontSize: '0.68rem', marginBottom: '0.35rem', color: 'var(--teal)' }}>
                        TARGET USERS
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.45 }}>
                        {problemAgentResult.identified_target_users}
                      </p>
                    </div>
                  </div>

                  {/* Core Challenges & Weaknesses */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <div className="editorial-mono-label" style={{ fontSize: '0.68rem', marginBottom: '0.5rem', color: 'var(--coral)' }}>
                        CORE CHALLENGES IDENTIFIED
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {(problemAgentResult.core_challenges || []).map((ch, idx) => (
                          <li key={idx} style={{ fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                            {ch}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="editorial-mono-label" style={{ fontSize: '0.68rem', marginBottom: '0.5rem', color: 'var(--lavender)' }}>
                        AREAS TO IMPROVE & MISSING INFO
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {(problemAgentResult.missing_information || []).map((m, idx) => (
                          <li key={idx} style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* AI Recommendations */}
                  {problemAgentResult.suggestions_for_improvement?.length > 0 && (
                    <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', backgroundColor: 'rgba(231, 111, 130, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(231, 111, 130, 0.3)' }}>
                      <div className="editorial-mono-label" style={{ fontSize: '0.68rem', marginBottom: '0.4rem', color: 'var(--coral)' }}>
                        AI RECOMMENDATIONS
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {problemAgentResult.suggestions_for_improvement.map((sug, idx) => (
                          <div key={idx} style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                            • {sug}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Improved Problem Statement Box */}
                  <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-cream)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
                    <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--coral)', marginBottom: '0.5rem' }}>
                      SUGGESTED IMPROVED PROBLEM STATEMENT
                    </div>
                    <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
                      "{problemAgentResult.suggested_improved_statement}"
                    </p>
                  </div>

                  {/* Non-Destructive Decision Controls */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-hairline)', paddingTop: '1rem' }}>
                    <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {problemAgentResult.disclaimer}
                    </span>

                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          updateFormField('problem_statement', problemAgentResult.suggested_improved_statement);
                          setProblemAgentResult(null);
                          showToast('Applied AI improved problem statement!', 'success');
                        }}
                        className="btn btn-coral btn-sm"
                        style={{ gap: '0.4rem', fontWeight: 700 }}
                      >
                        <Check size={14} /> APPLY SUGGESTION
                      </button>
                      <button
                        type="button"
                        onClick={() => setProblemAgentResult(null)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontWeight: 600 }}
                      >
                        KEEP MY VERSION
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
                <button type="button" onClick={handleSaveDraftManual} className="btn btn-secondary">
                  <Save size={15} /> SAVE DRAFT
                </button>
                <button type="submit" className="btn btn-primary btn-lg" style={{ gap: '0.5rem' }}>
                  NEXT STEP <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 02: TRACK SPECIFIC DETAILS ================= */}
          {step === 2 && (
            <form onSubmit={handleProceedToStep3}>
              <div style={{ marginBottom: '2rem' }}>
                <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '0.35rem' }}>STEP 02</div>
                <h2 style={{ fontSize: '1.85rem' }}>
                  {creationTrack === 'IDEA' && 'Solution hypothesis & target users'}
                  {creationTrack === 'PRODUCT' && 'Key features & beneficiaries'}
                  {creationTrack === 'STARTUP' && 'Solution thesis, stage & market'}
                </h2>
              </div>

              {/* STARTUP TRACK STEP 2 */}
              {creationTrack === 'STARTUP' && (
                <>
                  <div className="form-group">
                    <label className="form-label">STARTUP SOLUTION & VALUE PROPOSITION</label>
                    <textarea
                      value={formData.proposed_solution}
                      onChange={e => updateFormField('proposed_solution', e.target.value)}
                      placeholder="Describe your proprietary solution, secret sauce, or market thesis..."
                      className="form-textarea"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">TARGET MARKET / TOTAL ADDRESSABLE AUDIENCE</label>
                    <input
                      type="text"
                      value={formData.target_users}
                      onChange={e => updateFormField('target_users', e.target.value)}
                      placeholder="e.g. US Higher Education institutions ($40B market)"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">CURRENT STARTUP STAGE</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.65rem' }}>
                      {[
                        { id: 'idea', label: 'IDEA', color: 'var(--coral)' },
                        { id: 'prototype', label: 'PROTOTYPE', color: '#F59E0B' },
                        { id: 'mvp', label: 'MVP', color: '#3B82F6' },
                        { id: 'beta', label: 'BETA', color: '#8B5CF6' },
                        { id: 'live', label: 'LIVE', color: '#10B981' }
                      ].map(st => {
                        const isSel = formData.startup_stage === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => updateFormField('startup_stage', st.id)}
                            style={{
                              padding: '0.85rem 0.5rem',
                              borderRadius: 'var(--radius-md)',
                              border: `2px solid ${isSel ? st.color : 'var(--border-subtle)'}`,
                              backgroundColor: isSel ? 'var(--bg-cream)' : 'var(--bg-white)',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              color: isSel ? st.color : 'var(--text-primary)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-cream)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                    <div className="editorial-mono-label" style={{ color: 'var(--green)', fontSize: '0.72rem' }}>OPTIONAL STARTUP LINKS</div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label"><Globe size={13} /> WEBSITE</label>
                      <input
                        type="text"
                        value={formData.website_url}
                        onChange={e => updateFormField('website_url', e.target.value)}
                        placeholder="https://startup.com"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label"><Play size={13} /> PRODUCT DEMO</label>
                      <input
                        type="text"
                        value={formData.demo_url}
                        onChange={e => updateFormField('demo_url', e.target.value)}
                        placeholder="https://demo.startup.com"
                        className="form-input"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* IDEA TRACK STEP 2 */}
              {creationTrack === 'IDEA' && (
                <>
                  <div className="form-group">
                    <label className="form-label">PROPOSED SOLUTION</label>
                    <textarea
                      value={formData.proposed_solution}
                      onChange={e => updateFormField('proposed_solution', e.target.value)}
                      placeholder="Explain how your proposed idea tackles the problem and what makes the approach unique..."
                      className="form-textarea"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">TARGET USERS & BENEFICIARIES</label>
                    <input
                      type="text"
                      value={formData.target_users}
                      onChange={e => updateFormField('target_users', e.target.value)}
                      placeholder="e.g. Remote engineering students, researchers, early adopters"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">ONE-SENTENCE ELEVATOR SUMMARY</label>
                    <input
                      type="text"
                      value={formData.short_description}
                      onChange={e => updateFormField('short_description', e.target.value)}
                      placeholder="e.g. Autonomous study companion coordinating peer groups and tailored review sessions."
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>TAGS / TOPICS (COMMA SEPARATED)</label>
                      <button
                        type="button"
                        onClick={handleGenerateTags}
                        disabled={isGeneratingTags}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--periwinkle)', fontSize: '0.72rem', padding: '0.1rem 0.4rem', gap: '0.25rem' }}
                      >
                        <Sparkles size={11} /> {isGeneratingTags ? 'Generating...' : '✦ Generate Tags'}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.tags_text}
                      onChange={e => updateFormField('tags_text', e.target.value)}
                      placeholder="e.g. Education, AI, LLM, Peer Learning"
                      className="form-input"
                    />
                  </div>
                </>
              )}

              {/* PRODUCT TRACK STEP 2 */}
              {creationTrack === 'PRODUCT' && (
                <>
                  <div className="form-group">
                    <label className="form-label">PRODUCT DESCRIPTION / ELEVATOR PITCH</label>
                    <textarea
                      value={formData.short_description}
                      onChange={e => updateFormField('short_description', e.target.value)}
                      placeholder="Summarize what your product does and the core value it delivers..."
                      className="form-textarea"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>KEY PRODUCT FEATURES</label>
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--coral)', gap: '0.2rem', padding: '0.15rem 0.5rem' }}
                      >
                        <Plus size={13} /> Add Feature
                      </button>
                    </div>
                    {formData.features.map((feat, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                          type="text"
                          value={feat}
                          onChange={e => handleUpdateFeature(idx, e.target.value)}
                          placeholder={`Feature ${idx + 1} (e.g. Real-time collaborative canvas)`}
                          className="form-input"
                        />
                        {formData.features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(idx)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="form-group">
                    <label className="form-label">TARGET USERS / CUSTOMERS</label>
                    <input
                      type="text"
                      value={formData.target_users}
                      onChange={e => updateFormField('target_users', e.target.value)}
                      placeholder="e.g. B2B design teams, freelance developers"
                      className="form-input"
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-cream)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                    <div className="editorial-mono-label" style={{ color: 'var(--green)', fontSize: '0.72rem' }}>OPTIONAL PRODUCT ACCESS LINKS</div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label"><Globe size={13} /> WEBSITE URL</label>
                      <input
                        type="text"
                        value={formData.website_url}
                        onChange={e => updateFormField('website_url', e.target.value)}
                        placeholder="https://yourproduct.com"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label"><Play size={13} /> LIVE WEB DEMO URL</label>
                      <input
                        type="text"
                        value={formData.demo_url}
                        onChange={e => updateFormField('demo_url', e.target.value)}
                        placeholder="https://app.yourproduct.com"
                        className="form-input"
                      />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
                <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">
                  <ArrowLeft size={15} /> Back
                </button>
                <button type="submit" className="btn btn-primary btn-lg" style={{ gap: '0.5rem' }}>
                  NEXT STEP <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 03: COMPLETE REVIEW & CONFIRMATION ================= */}
          {step === 3 && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="editorial-mono-label" style={{ color: 'var(--green)', marginBottom: '0.35rem' }}>
                  STEP 03 / REVIEW & SUBMISSION
                </div>
                <h2 style={{ fontSize: '1.85rem' }}>
                  {creationTrack === 'STARTUP' ? 'Verify & Launch Your Startup' : creationTrack === 'PRODUCT' ? 'Review & Launch Product' : 'Review & Publish Idea'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                  Review all details below before registering into the community validation network.
                </p>
              </div>

              {/* Complete Confirmation / Review Card */}
              <div
                className="editorial-card"
                style={{
                  backgroundColor: 'var(--bg-cream)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem'
                }}
              >
                {/* Header Row: Title, Category, Stage */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1rem' }}>
                  <div>
                    <div className="editorial-mono-label" style={{ color: 'var(--coral)', fontSize: '0.7rem' }}>
                      {creationTrack === 'STARTUP' ? 'STARTUP TITLE' : 'PROJECT TITLE'}
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {formData.title || '(No title entered)'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(36, 36, 43, 0.08)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)'
                      }}
                    >
                      {selectedCategoryObj?.name || 'Technology'}
                    </span>

                    <span
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(231, 111, 130, 0.15)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: 'var(--coral)'
                      }}
                    >
                      {creationTrack === 'STARTUP' ? `STAGE: ${(formData.startup_stage || 'idea').toUpperCase()}` : creationTrack}
                    </span>
                  </div>
                </div>

                {/* Problem Statement */}
                <div>
                  <div className="editorial-mono-label" style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginBottom: '0.3rem' }}>
                    PROBLEM STATEMENT
                  </div>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                    {formData.problem_statement || '(No problem statement provided)'}
                  </p>
                </div>

                {/* Proposed Solution / Value Proposition */}
                <div>
                  <div className="editorial-mono-label" style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginBottom: '0.3rem' }}>
                    {creationTrack === 'STARTUP' ? 'SOLUTION & VALUE PROPOSITION' : 'PROPOSED SOLUTION'}
                  </div>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                    {formData.proposed_solution || formData.short_description || '(No solution provided)'}
                  </p>
                </div>

                {/* Target Audience & URLs Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', borderTop: '1px solid var(--border-hairline)', paddingTop: '1rem' }}>
                  <div>
                    <div className="editorial-mono-label" style={{ color: 'var(--teal)', fontSize: '0.68rem', marginBottom: '0.25rem' }}>
                      TARGET USERS / MARKET
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formData.target_users || 'General / Not specified'}
                    </div>
                  </div>

                  <div>
                    <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', fontSize: '0.68rem', marginBottom: '0.25rem' }}>
                      LAUNCH / WEBSITE URL
                    </div>
                    <div style={{ fontSize: '0.88rem', color: formData.website_url ? 'var(--coral)' : 'var(--text-secondary)', fontWeight: formData.website_url ? 600 : 400 }}>
                      {formData.website_url || 'None (Concept phase)'}
                    </div>
                  </div>

                  <div>
                    <div className="editorial-mono-label" style={{ color: 'var(--lavender)', fontSize: '0.68rem', marginBottom: '0.25rem' }}>
                      PRODUCT DEMO URL
                    </div>
                    <div style={{ fontSize: '0.88rem', color: formData.demo_url ? 'var(--periwinkle)' : 'var(--text-secondary)', fontWeight: formData.demo_url ? 600 : 400 }}>
                      {formData.demo_url || 'None'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Novelty / Similarity Scan Summary */}
              <div style={{ marginBottom: '2rem' }}>
                <div className="editorial-mono-label" style={{ color: 'var(--green)', marginBottom: '0.5rem', fontSize: '0.72rem' }}>
                  NETWORK NOVELTY & COLLISION SCAN:
                </div>
                {similarInnovations.length === 0 ? (
                  <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--bg-cream)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ShieldCheck size={18} color="var(--green)" />
                    <span style={{ fontSize: '0.86rem' }}>
                      No direct collisions found. High novelty potential in domain "{selectedCategoryObj?.name || 'Technology'}".
                    </span>
                  </div>
                ) : (
                  similarInnovations.slice(0, 2).map(sim => (
                    <div
                      key={sim.id}
                      style={{
                        padding: '0.85rem 1.25rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-cream)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.88rem' }}>{sim.title}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{sim.short_description}</div>
                      </div>
                      <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--coral)', fontWeight: 700 }}>
                        {Math.round(sim.similarityScore * 100)}% Match
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Submission Controls: Back, Save Draft, Final Submit */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <button type="button" onClick={() => setStep(2)} className="btn btn-secondary">
                  <ArrowLeft size={15} /> Back to Edit
                </button>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => handleFinalSubmit(true)}
                    disabled={isSubmitting}
                    className="btn btn-secondary"
                    style={{ gap: '0.4rem', opacity: isSubmitting ? 0.7 : 1 }}
                  >
                    <Save size={15} /> {isSubmitting ? 'SAVING...' : 'SAVE AS DRAFT'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFinalSubmit(false)}
                    disabled={isSubmitting}
                    className="btn btn-coral btn-lg"
                    style={{ gap: '0.5rem', fontWeight: 800, opacity: isSubmitting ? 0.7 : 1 }}
                  >
                    {isSubmitting ? 'CREATING STARTUP...' : (creationTrack === 'STARTUP' ? 'CREATE STARTUP ↗' : 'SUBMIT FOR VALIDATION')} 
                    <CheckCircle2 size={17} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= AI ANALYSIS & READINESS DRAWER MODAL ================= */}
      {aiAnalysis && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}
        >
          <div
            className="editorial-card"
            style={{
              backgroundColor: 'var(--bg-white)',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2.5rem',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-subtle)',
              position: 'relative'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Sparkles size={20} color="var(--coral)" />
                <span className="editorial-mono-label" style={{ color: 'var(--coral)', fontSize: '0.85rem' }}>
                  AI INNOVATION EVALUATOR & READINESS BREAKDOWN
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAiAnalysis(null)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.85rem' }}
              >
                ✕ Close
              </button>
            </div>

            {/* Overall Readiness Score Hero */}
            <div
              style={{
                backgroundColor: 'var(--bg-dark)',
                color: '#FFFFFF',
                padding: '1.75rem',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.5rem',
                marginBottom: '1.75rem'
              }}
            >
              <div>
                <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.25rem' }}>
                  OVERALL PROJECT READINESS SCORE
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-inverse-muted)' }}>
                  {formData.title || 'Untitled Specimen'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '0.35rem' }}>
                  {aiAnalysis.summary}
                </div>
              </div>

              <div style={{ textAlign: 'right', minWidth: '130px' }}>
                <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '3.4rem', fontWeight: 800, color: 'var(--coral)', lineHeight: 1 }}>
                  {aiAnalysis.readiness_score?.total || 75}
                  <span style={{ fontSize: '1.5rem', color: 'rgba(255, 255, 255, 0.4)' }}>/100</span>
                </div>
                <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--green)' }}>
                  ● {aiAnalysis.readiness_score?.total >= 75 ? 'VALIDATION READY' : 'REFINEMENT ADVISED'}
                </div>
              </div>
            </div>

            {/* 6-Factor Transparent Breakdown Grid */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div className="editorial-mono-label" style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.72rem' }}>
                TRANSPARENT 6-FACTOR READINESS SCORING:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {[
                  { name: 'Problem Clarity', score: aiAnalysis.readiness_score?.breakdown?.problem_clarity || 18, max: 20 },
                  { name: 'Solution Clarity', score: aiAnalysis.readiness_score?.breakdown?.solution_clarity || 17, max: 20 },
                  { name: 'Target Audience', score: aiAnalysis.readiness_score?.breakdown?.target_audience || 13, max: 15 },
                  { name: 'Implementation', score: aiAnalysis.readiness_score?.breakdown?.implementation_details || 12, max: 15 },
                  { name: 'Uniqueness', score: aiAnalysis.readiness_score?.breakdown?.uniqueness || 12, max: 15 },
                  { name: 'Completeness', score: aiAnalysis.readiness_score?.breakdown?.completeness || 14, max: 15 }
                ].map((factor, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-cream)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      <span>{factor.name}</span>
                      <span className="mono" style={{ color: 'var(--coral)' }}>{factor.score}/{factor.max}</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${(factor.score / factor.max) * 100}%`, height: '100%', backgroundColor: 'var(--coral)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Category with User Confirmation Option */}
            {aiAnalysis.suggested_category && (
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(231, 111, 130, 0.06)',
                  border: '1px solid rgba(231, 111, 130, 0.2)',
                  marginBottom: '1.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div className="editorial-mono-label" style={{ color: 'var(--coral)', fontSize: '0.72rem' }}>
                    SUGGESTED DISCIPLINE CATEGORY
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {aiAnalysis.suggested_category.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {aiAnalysis.suggested_category.reason}
                  </div>
                </div>

                {categories.some(c => c.name.toLowerCase() === aiAnalysis.suggested_category.name?.toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => {
                      const matched = categories.find(c => c.name.toLowerCase() === aiAnalysis.suggested_category.name?.toLowerCase());
                      if (matched) {
                        updateFormField('category_id', matched.id);
                        showToast(`Category updated to "${matched.name}"`, 'success');
                      }
                    }}
                    className="btn btn-coral btn-sm"
                    style={{ fontSize: '0.78rem' }}
                  >
                    <Check size={13} /> Accept Suggestion
                  </button>
                )}
              </div>
            )}

            {/* Strengths & Potential Gaps 2-Column Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
              <div style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', backgroundColor: '#F0FAF5', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="editorial-mono-label" style={{ color: 'var(--green)', marginBottom: '0.5rem', fontSize: '0.72rem' }}>
                  ✦ KEY STRENGTHS
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {(aiAnalysis.key_strengths || []).map((s, idx) => (
                    <li key={idx} style={{ marginBottom: '0.35rem' }}>{s}</li>
                  ))}
                </ul>
              </div>

              <div style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', backgroundColor: '#FEF3F2', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div className="editorial-mono-label" style={{ color: 'var(--red)', marginBottom: '0.5rem', fontSize: '0.72rem' }}>
                  ⚠ POTENTIAL GAPS / RISKS
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {(aiAnalysis.potential_gaps || []).map((g, idx) => (
                    <li key={idx} style={{ marginBottom: '0.35rem' }}>{g}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Improvement Recommendations */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div className="editorial-mono-label" style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.72rem' }}>
                ✦ ACTIONABLE IMPROVEMENT SUGGESTIONS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {(aiAnalysis.improvement_suggestions || []).map((sug, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-cream)',
                      fontSize: '0.86rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem'
                    }}
                  >
                    <span className="mono" style={{ fontWeight: 800, color: 'var(--coral)', fontSize: '0.8rem' }}>0{idx + 1}.</span>
                    <span>{sug}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setAiAnalysis(null)}
                className="btn btn-secondary btn-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= AI FEATURE 2: INNOVATION RESEARCH AGENT MODAL ================= */}
      {showResearchModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(23, 23, 28, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}
        >
          <div
            className="editorial-card"
            style={{
              backgroundColor: 'var(--bg-white)',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '840px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2.5rem',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Search size={20} color="var(--periwinkle)" />
                <span className="editorial-mono-label" style={{ color: 'var(--periwinkle)', fontSize: '0.85rem' }}>
                  INNOVATION RESEARCH AGENT
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowResearchModal(false)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.85rem' }}
              >
                ✕ Close
              </button>
            </div>

            {isResearching ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--periwinkle)', borderRadius: '50%', margin: '0 auto 1rem auto' }} />
                <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '0.35rem' }}>
                  SCANNING GLOBAL KNOWLEDGE BASES
                </div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.35rem' }}>Synthesizing Technical & Discovery Directions...</h3>
                <p style={{ fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto' }}>
                  Retrieving related innovation areas, recommended technologies, verified open datasets, and implementation vectors.
                </p>
              </div>
            ) : researchAgentResult ? (
              <div>
                {/* Related Areas */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div className="editorial-mono-label" style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.72rem' }}>
                    RELATED INNOVATION AREAS
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {(researchAgentResult.related_areas || []).map((area, i) => (
                      <span key={i} className="filter-chip active" style={{ fontSize: '0.78rem' }}>
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recommended Tech & Architectures Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div className="editorial-card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-cream)', borderLeft: '4px solid var(--periwinkle)' }}>
                    <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '0.65rem', fontSize: '0.72rem' }}>
                      RECOMMENDED TECHNOLOGIES
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {(researchAgentResult.recommended_technologies || []).map((t, i) => (
                        <li key={i} style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="editorial-card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-cream)', borderLeft: '4px solid var(--teal)' }}>
                    <div className="editorial-mono-label" style={{ color: 'var(--teal)', marginBottom: '0.65rem', fontSize: '0.72rem' }}>
                      SUGGESTED ARCHITECTURES
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {(researchAgentResult.suggested_architectures || []).map((a, i) => (
                        <li key={i} style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Verified Datasets & Open Resources */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.65rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={14} /> VERIFIED DATASETS & OPEN RESOURCES
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {(researchAgentResult.verified_references || []).map((ref, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '1rem 1.25rem',
                          backgroundColor: 'var(--bg-white)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.75rem'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.92rem', display: 'block', marginBottom: '0.15rem' }}>
                            {ref.title}
                          </strong>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {ref.description}
                          </span>
                        </div>
                        {ref.url && (
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.76rem', gap: '0.35rem', textDecoration: 'none', color: 'var(--coral)', fontWeight: 700 }}
                          >
                            Explore Source <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Opportunities & Challenges */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div>
                    <div className="editorial-mono-label" style={{ color: 'var(--green)', marginBottom: '0.5rem', fontSize: '0.72rem' }}>
                      INNOVATION OPPORTUNITIES
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {(researchAgentResult.opportunities || []).map((opp, i) => (
                        <li key={i} style={{ fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{opp}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.5rem', fontSize: '0.72rem' }}>
                      IMPLEMENTATION CHALLENGES
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {(researchAgentResult.implementation_challenges || []).map((ch, i) => (
                        <li key={i} style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{ch}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowResearchModal(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
