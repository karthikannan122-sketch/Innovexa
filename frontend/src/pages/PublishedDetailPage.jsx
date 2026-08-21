import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { AIService } from '../services/aiService';
import { SolutionComparisonAgent, CommunityFeedbackAgent, InnovationResearchAgent } from '../services/aiAgents';
import { useAuth } from '../context/AuthContext';
import { getCategoryInk, BRAND_COLORS } from '../utils/categoryColors';
import StatusBadge, { StageBadge, FeaturedDemoBadge } from '../components/StatusBadge';
import LaunchSetupModal from '../components/LaunchSetupModal';
import CountUp from '../components/CountUp';
import InnovationCore from '../components/three/InnovationCore';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, 
  ThumbsUp, 
  ThumbsDown,
  Heart,
  ExternalLink, 
  Code2, 
  Globe, 
  Play, 
  Smartphone,
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Sparkles,
  ArrowUpRight,
  GitBranch,
  Layers,
  History,
  Rocket,
  UserPlus,
  ListPlus,
  Mail,
  Edit3,
  Trash2,
  Check,
  HelpCircle,
  Copy,
  Search,
  ShieldCheck,
  Scale
} from 'lucide-react';

/**
 * PublishedDetailPage — Adaptive Editorial Project & Launch Specimen Page
 * Adapts Primary Action & Interface based on project_stage (IDEA, PROTOTYPE, MVP, BETA, LIVE)
 * Seamlessly handles curated platform demo specimens and real Supabase projects.
 */
export default function PublishedDetailPage({ selectedInnoId, setActiveTab, setSelectedInnoId, setSelectedRecipientId }) {
  const { currentUser, showToast } = useAuth();
  const [innovation, setInnovation] = useState(() => {
    return selectedInnoId ? StorageService.getInnovationById(selectedInnoId) : null;
  });
  const [allProjects, setAllProjects] = useState([]);
  const [similarProjects, setSimilarProjects] = useState([]);
  const [reviews, setReviews] = useState(() => {
    return selectedInnoId ? StorageService.getReviewsForInnovation(selectedInnoId) : [];
  });
  const [comments, setComments] = useState(() => {
    return selectedInnoId ? StorageService.getCommentsForInnovation(selectedInnoId) : [];
  });
  const [newCommentText, setNewCommentText] = useState('');
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [activeUserVote, setActiveUserVote] = useState(null); // 'upvote' | 'downvote' | null
  const [projectVotes, setProjectVotes] = useState({ upvotes: 0, downvotes: 0 });
  const [projectLikes, setProjectLikes] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [activeProjectTab, setActiveProjectTab] = useState(() => {
    const savedTab = sessionStorage.getItem('innovexa_detail_tab');
    if (savedTab) {
      sessionStorage.removeItem('innovexa_detail_tab');
      return savedTab;
    }
    return 'OVERVIEW';
  });
  const [reviewSort, setReviewSort] = useState('MOST_HELPFUL');
  const [reviewVotes, setReviewVotes] = useState({});
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editContent, setEditContent] = useState('');
  const [isSavingReviewEdit, setIsSavingReviewEdit] = useState(false);

  // AI Feature States
  const [isAiImproveModalOpen, setIsAiImproveModalOpen] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [aiImprovementPlan, setAiImprovementPlan] = useState(null);

  // AI Intelligence Layer Agents States
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [feedbackAgentResult, setFeedbackAgentResult] = useState(null);
  const [isAnalyzingFeedback, setIsAnalyzingFeedback] = useState(false);
  const [specimenResearchResult, setSpecimenResearchResult] = useState(null);
  const [isResearchingSpecimen, setIsResearchingSpecimen] = useState(false);
  const [showSpecimenResearchModal, setShowSpecimenResearchModal] = useState(false);

  // Interactive quick questionnaire for idea/specimen
  const [q1, setQ1] = useState('YES'); // Is this related to your interests / problem?
  const [q2, setQ2] = useState('YES'); // Would you use this?
  const [q3, setQ3] = useState('Core Architecture');
  const [q4, setQ4] = useState(''); // Suggestion
  const [questionnaireSubmitted, setQuestionnaireSubmitted] = useState(false);

  // Modals
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [isImproveModalOpen, setIsImproveModalOpen] = useState(false);
  const [improvementChangelog, setImprovementChangelog] = useState('');

  const loadData = async () => {
    try {
      let targetId = selectedInnoId;
      let inno = targetId ? StorageService.getInnovationById(targetId) : null;
      if (inno && !innovation) {
        setInnovation(inno);
      }

      // Parallel Supabase queries
      const [projRes, allRes, revsRes] = await Promise.all([
        targetId ? SupabaseService.getProjectById(targetId) : Promise.resolve({ data: null }),
        SupabaseService.getProjects(),
        targetId ? SupabaseService.getReviews(targetId) : Promise.resolve({ data: [] })
      ]);

      const allInnos = allRes.data || StorageService.getInnovations() || [];
      setAllProjects(allInnos);

      inno = projRes.data || inno || allInnos.find(i => i.id === targetId) || allInnos[0];
      if (!inno) return;

      setInnovation(inno);
      if (setSelectedInnoId && inno.id !== selectedInnoId) {
        setSelectedInnoId(inno.id);
      }

      const similar = AIService.findSimilarProjects(inno, allInnos);
      setSimilarProjects(similar);
      const rawReviews = revsRes.data || StorageService.getReviewsForInnovation(inno.id) || [];
      const enrichedReviews = rawReviews.map(r => {
        const voteStats = StorageService.getVotesForTarget('review', r.id);
        return {
          ...r,
          helpful_votes_count: Math.max(r.helpful_votes_count || 0, voteStats.upvotes || 0),
          unhelpful_votes_count: Math.max(r.unhelpful_votes_count || 0, voteStats.downvotes || 0)
        };
      });

      setReviews(enrichedReviews);
      setComments(StorageService.getCommentsForInnovation(inno.id) || []);

      // Fetch real project vote counts and like list from Supabase for all users
      const [voteStats, likesList] = await Promise.all([
        SupabaseService.getProjectVotes(inno.id),
        SupabaseService.getProjectLikes(inno.id)
      ]);
      setProjectVotes(voteStats || { upvotes: 0, downvotes: 0 });
      setProjectLikes(likesList || []);
      setInnovation(prev => prev ? { ...prev, upvotes_count: voteStats?.upvotes ?? prev.upvotes_count } : prev);

      if (currentUser) {
        const [userLiked, userVote, userReviewed] = await Promise.all([
          SupabaseService.hasUserLikedProject(inno.id, currentUser.id),
          SupabaseService.getUserProjectVote(inno.id, currentUser.id),
          SupabaseService.hasUserReviewedProject(inno.id, currentUser.id)
        ]);

        setHasUpvoted(Boolean(userLiked));
        setActiveUserVote(userVote);
        setQuestionnaireSubmitted(Boolean(userReviewed));

        const votes = StorageService.getVotes();
        const voteMap = {};
        votes.forEach(v => {
          if (v.user_id === currentUser.id && v.target_type === 'review') {
            voteMap[v.target_id] = v.vote_type;
          }
        });
        setReviewVotes(voteMap);
      } else {
        setHasUpvoted(false);
        setActiveUserVote(null);
      }
    } catch (err) {
      console.error('[PublishedDetail] Error loading published detail data:', err);
    }
  };

  const handleVoteReview = async (e, reviewId, voteType) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast('Please sign in to vote on review helpfulness.', 'info');
      return;
    }
    const res = await SupabaseService.toggleVote({
      userId: currentUser.id,
      targetType: 'review',
      targetId: reviewId,
      voteType
    });
    if (res) {
      setReviewVotes(prev => ({
        ...prev,
        [reviewId]: res.activeVoteType
      }));
      setReviews(prev => prev.map(r => r.id === reviewId ? {
        ...r,
        helpful_votes_count: res.upvotesCount,
        unhelpful_votes_count: res.downvotesCount
      } : r));
    }
  };

  const handleStartEditReview = (r) => {
    setEditingReviewId(r.id);
    setEditRating(Number(r.rating) || 5);
    setEditContent(r.content || r.suggestion || r.overall_feedback || '');
  };

  const handleCancelEditReview = () => {
    setEditingReviewId(null);
    setEditContent('');
  };

  const handleSaveEditReview = async (reviewId) => {
    if (!editContent.trim()) {
      showToast('Review content cannot be empty.', 'warning');
      return;
    }
    setIsSavingReviewEdit(true);
    try {
      const { error } = await SupabaseService.updateReview(reviewId, {
        rating: editRating,
        content: editContent.trim()
      });
      if (error) {
        showToast(error.message || 'Failed to update review.', 'error');
        return;
      }
      showToast('Your review has been updated in Supabase!', 'success');
      setEditingReviewId(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Error updating review.', 'error');
    } finally {
      setIsSavingReviewEdit(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review from Supabase?')) {
      return;
    }
    try {
      const { error } = await SupabaseService.deleteReview(reviewId);
      if (error) {
        showToast(error.message || 'Failed to delete review.', 'error');
        return;
      }
      showToast('Your review was deleted from Supabase.', 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Error deleting review.', 'error');
    }
  };

  const handleOpenAiImprovement = async () => {
    setIsAiImproveModalOpen(true);
    if (!aiImprovementPlan && innovation) {
      setIsGeneratingPlan(true);
      try {
        const plan = await AIService.generateImprovementPlan(innovation, reviews);
        setAiImprovementPlan(plan);
      } catch (err) {
        console.warn('Improvement plan error:', err);
      } finally {
        setIsGeneratingPlan(false);
      }
    }
  };

  // AI Feature 3: Existing Solution Comparison Agent Handler
  const handleCompareExistingSolutions = async () => {
    if (!innovation) return;
    setActiveProjectTab('COMPARISON');
    setIsComparing(true);
    showToast('Comparing with existing verified solutions...', 'info');
    try {
      const globalCat = StorageService.getGlobalInnovations() || [];
      const res = await SolutionComparisonAgent.compare(innovation, allProjects, globalCat);
      if (res.success && res.data) {
        setComparisonResult(res.data);
      }
    } catch (err) {
      console.warn('Solution comparison error:', err);
    } finally {
      setIsComparing(false);
    }
  };

  // AI Feature 2: Innovation Research Agent for Specimen Detail
  const handleResearchSpecimen = async () => {
    if (!innovation) return;
    setIsResearchingSpecimen(true);
    setShowSpecimenResearchModal(true);
    try {
      const tagsList = Array.isArray(innovation.tags) ? innovation.tags : (innovation.tags || '').split(',').map(t => t.trim());
      const res = await InnovationResearchAgent.research({
        title: innovation.title,
        problemStatement: innovation.problem_statement || innovation.description,
        description: innovation.short_description || innovation.description,
        category: innovation.category_name,
        tags: tagsList,
        proposedSolution: innovation.proposed_solution || ''
      });
      if (res.success && res.data) {
        setSpecimenResearchResult(res.data);
      }
    } catch (err) {
      console.warn('Specimen research error:', err);
    } finally {
      setIsResearchingSpecimen(false);
    }
  };

  // AI Feature 4: Community Feedback Agent Auto-Analysis
  useEffect(() => {
    if (!innovation) return;
    setIsAnalyzingFeedback(true);
    CommunityFeedbackAgent.analyze(innovation.id, reviews, innovation.title)
      .then(res => {
        if (res.success && res.data) {
          setFeedbackAgentResult(res.data);
        }
      })
      .catch(e => console.warn('Community Feedback Agent analysis error:', e))
      .finally(() => setIsAnalyzingFeedback(false));
  }, [innovation?.id, reviews?.length]);

  useEffect(() => {
    const requestedTab = sessionStorage.getItem('innovexa_detail_tab');
    if (requestedTab) {
      setActiveProjectTab(requestedTab);
      sessionStorage.removeItem('innovexa_detail_tab');
    }
    loadData();

    if (!selectedInnoId) return;

    // Realtime subscriptions for this project
    const unsubReviews = SupabaseService.subscribeToProjectReviews(selectedInnoId, () => {
      loadData();
    });

    const unsubLikes = SupabaseService.subscribeToProjectLikes(selectedInnoId, () => {
      loadData();
    });

    const handler = () => loadData();
    window.addEventListener('innovexa:datachange', handler);

    return () => {
      unsubReviews();
      unsubLikes();
      window.removeEventListener('innovexa:datachange', handler);
    };
  }, [selectedInnoId, currentUser]);

  if (!innovation) {
    return (
      <div className="workspace-container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h3>No project selected</h3>
        <button onClick={() => setActiveTab('explore')} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Directory
        </button>
      </div>
    );
  }

  const isOwner = currentUser && (innovation.user_id === currentUser.id || innovation.creator_id === currentUser.id);
  const isDemo = innovation.is_demo || innovation.is_featured_example;
  const ink = getCategoryInk(innovation.category_id, innovation.category_name);
  const stage = (innovation.project_stage || (innovation.creation_type === 'PRODUCT' ? 'prototype' : 'idea')).toLowerCase();
  const validationPct = Math.min(100, Math.round(((innovation.valid_reviews_count || reviews.length || 0) / (innovation.validation_target || 10)) * 100));

  const fetchProjectLikes = async () => {
    if (!innovation?.id) return;
    const targetId = innovation.id;
    try {
      const [votes, likes, userLiked] = await Promise.all([
        SupabaseService.getProjectVotes(targetId),
        SupabaseService.getProjectLikes(targetId),
        currentUser ? SupabaseService.hasUserLikedProject(targetId, currentUser.id) : false
      ]);
      setProjectVotes(votes || { upvotes: 0, downvotes: 0 });
      setProjectLikes(likes || []);
      setHasUpvoted(Boolean(userLiked));
      setActiveUserVote(userLiked ? 'upvote' : null);
      setInnovation(prev => prev ? { ...prev, upvotes_count: votes?.upvotes ?? prev.upvotes_count } : prev);
      StorageService.updateInnovation(targetId, { upvotes_count: votes?.upvotes || 0 });
    } catch (e) {
      console.error("Error fetching project likes:", e);
    }
  };

  const handleUpvote = async (projectId) => {
    try {
      // Get currently logged-in user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("User is not logged in");
        showToast('Please sign in to vote on projects.', 'warning');
        return;
      }

      console.log("Upvoting project:", {
        projectId,
        userId: user.id,
      });

      // Check whether user already liked this project
      const { data: existingLike, error: checkError } = await supabase
        .from("project_likes")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing vote:", checkError);
        return;
      }

      // If already liked → remove like
      if (existingLike) {
        const { error } = await supabase
          .from("project_likes")
          .delete()
          .eq("id", existingLike.id);

        if (error) {
          console.error("Error removing like:", error);
          return;
        }

        console.log("Upvote removed");
        showToast('Vote removed.', 'info');
      } else {
        // If not liked → insert into database
        const { data, error } = await supabase
          .from("project_likes")
          .insert({
            project_id: projectId,
            user_id: user.id,
          })
          .select();

        if (error) {
          console.error("Error saving upvote:", error);
          return;
        }

        console.log("Upvote saved successfully:", data);
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
        showToast('▲ Upvoted project! Stored in database.', 'success');

        const projectOwnerId = innovation?.user_id || innovation?.creator_id;
        if (projectOwnerId && projectOwnerId !== user.id) {
          SupabaseService.createNotification({
            userId: projectOwnerId,
            type: 'like',
            title: 'Project Upvoted',
            message: `${currentUser?.name || user.user_metadata?.full_name || 'An innovator'} upvoted your project "${innovation?.title || 'Untitled'}".`,
            projectId: projectId
          }).catch(err => console.error("Error creating like notification:", err));
        }
      }

      // Refresh project likes/count here
      await fetchProjectLikes();

    } catch (error) {
      console.error("Upvote failed:", error);
    }
  };

  const handleVoteProject = async (voteType = 'upvote') => {
    if (voteType === 'upvote') {
      return handleUpvote(innovation?.id);
    }
  };

  const handleToggleUpvote = () => handleUpvote(innovation?.id);

  const handleDeleteProject = async () => {
    if (window.confirm(`Permanently delete project "${innovation.title}"?`)) {
      const { error } = await SupabaseService.deleteProject(innovation.id, currentUser?.id);
      if (error) {
        showToast(error.message || 'Error deleting project', 'error');
        return;
      }
      showToast('Project deleted.', 'info');
      setActiveTab('creator');
    }
  };

  const handleEditProject = () => {
    setSelectedInnoId(innovation.id);
    setActiveTab('submit');
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentUser) return;

    StorageService.addComment({
      innovation_id: innovation.id,
      user_id: currentUser.id,
      author_name: currentUser.name,
      author_avatar: currentUser.avatar,
      content: newCommentText.trim()
    });

    setNewCommentText('');
    showToast('Comment published to project ledger.', 'success');
  };

  const handleSaveImprovement = async (e) => {
    e.preventDefault();
    if (!improvementChangelog.trim()) return;

    const updates = {
      version: (innovation.version || 1) + 1,
      last_changelog: improvementChangelog.trim(),
      status: 'UNDER_VALIDATION',
      launch_status: 'improving',
      updated_at: new Date().toISOString()
    };

    await SupabaseService.updateProject(innovation.id, updates, currentUser?.id);

    setImprovementChangelog('');
    setIsImproveModalOpen(false);
    showToast(`Version ${((innovation.version || 1) + 1)}.0 logged! Ready for new peer feedback.`, 'success');
    loadData();
  };

  const handleSubmitQuickPerspective = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please sign in to submit a review.', 'warning');
      return;
    }

    if (isOwner) {
      showToast('You cannot review your own project.', 'warning');
      return;
    }

    if (isSubmittingReview) return;
    setIsSubmittingReview(true);

    try {
      const reviewContent = `Problem Relevance: ${q1}. Would Use: ${q2}.${q3 ? ` Focus: ${q3}.` : ''}${q4 ? ` Improvement: ${q4.trim()}` : ''}`;
      await SupabaseService.submitReview(innovation.id, 5, reviewContent);

      setQuestionnaireSubmitted(true);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      showToast('Review submitted and saved in Supabase reviews table!', 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Error submitting review.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Adaptive Primary CTA execution
  const handlePrimaryCtaClick = () => {
    if (stage === 'live' && (innovation.website_url || innovation.demo_url)) {
      window.open(innovation.website_url || innovation.demo_url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (stage === 'beta' && (innovation.demo_url || innovation.website_url)) {
      window.open(innovation.demo_url || innovation.website_url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (stage === 'mvp' && (innovation.demo_url || innovation.website_url)) {
      window.open(innovation.demo_url || innovation.website_url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (stage === 'prototype' && innovation.demo_url) {
      window.open(innovation.demo_url, '_blank', 'noopener,noreferrer');
      return;
    }

    // Community Actions Fallback for Idea / Concept / Waitlist
    if (innovation.next_community_action === 'waitlist' || stage === 'idea' || stage === 'concept') {
      setIsWaitlisted(true);
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
      showToast(`🎉 You are following "${innovation.title}" and on the early access journey!`, 'success');
      return;
    }

    if (innovation.next_community_action === 'feedback') {
      setSelectedInnoId(innovation.id);
      setActiveTab('review_submit');
      return;
    }

    if (innovation.next_community_action === 'contact') {
      const creatorId = innovation.user_id || innovation.creator_id;
      if (creatorId && currentUser && creatorId !== currentUser.id) {
        SupabaseService.sendMessage({
          senderId: currentUser.id,
          receiverId: creatorId,
          content: `Hi! I found your project "${innovation.title}" on INNOVEXA and would love to connect.`,
          senderName: currentUser.name || currentUser.full_name || 'Innovator',
          senderAvatar: currentUser.avatar || currentUser.avatar_url || '',
          receiverName: innovation.creator_name || 'Innovator',
          receiverAvatar: innovation.creator_avatar || ''
        });
      }
      setActiveTab('messages');
      return;
    }

    // Default: Follow project
    setIsFollowing(!isFollowing);
    if (!isFollowing) {
      showToast(`Following ${innovation.title}! You will be notified of new milestones.`, 'success');
    }
  };

  const getPrimaryCtaLabel = () => {
    if (stage === 'live' && (innovation.website_url || innovation.demo_url)) return 'VISIT PRODUCT ↗';
    if (stage === 'beta' && (innovation.demo_url || innovation.website_url)) return 'TRY THE BETA ↗';
    if (stage === 'mvp' && (innovation.demo_url || innovation.website_url)) return 'VIEW DEMO ↗';
    if (stage === 'prototype') return innovation.demo_url ? 'VIEW PROTOTYPE ↗' : (isFollowing ? 'FOLLOWING ✓' : 'FOLLOW THE JOURNEY ↗');
    if (innovation.next_community_action === 'waitlist') return isWaitlisted ? 'ON WAITLIST ✓' : 'JOIN THE WAITLIST ↗';
    if (innovation.next_community_action === 'feedback') return 'GIVE YOUR PERSPECTIVE ↗';
    if (innovation.next_community_action === 'contact') return 'CONTACT CREATOR ↗';
    return isFollowing ? 'FOLLOWING ✓' : 'FOLLOW THE JOURNEY ↗';
  };

  const hasAnyExternalLink = Boolean(
    innovation.website_url || 
    innovation.demo_url || 
    innovation.github_url || 
    innovation.app_store_url || 
    innovation.play_store_url
  );

  return (
    <div className="workspace-container" style={{ maxWidth: '1180px' }}>
      {/* Top Breadcrumb & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button onClick={() => setActiveTab('explore')} className="btn btn-secondary btn-sm" style={{ gap: '0.4rem' }}>
          <ArrowLeft size={14} /> Back to Directory
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span className={`category-tag ${ink.tagClass}`}>
            {innovation.categories?.name || innovation.category_name || "Uncategorized"}
          </span>
          <StageBadge stage={stage} />
          {isDemo && (
            <FeaturedDemoBadge type={innovation.demo_project_type} label={innovation.demo_badge_label} />
          )}
          <StatusBadge status={innovation.status} />
        </div>
      </div>

      {/* Subtle Demo Clarification Notice Bar */}
      {isDemo && (
        <div
          style={{
            backgroundColor: innovation.id === 'demo_canva' ? 'rgba(113, 134, 216, 0.08)' : 'rgba(155, 138, 229, 0.08)',
            border: `1px solid ${innovation.id === 'demo_canva' ? 'rgba(113, 134, 216, 0.3)' : 'rgba(155, 138, 229, 0.3)'}`,
            padding: '0.9rem 1.4rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.86rem' }}>
            <Sparkles size={16} color={innovation.id === 'demo_canva' ? 'var(--periwinkle)' : 'var(--lavender)'} />
            <span>
              <strong>{innovation.id === 'demo_canva' ? 'FEATURED PRODUCT EXAMPLE:' : 'FEATURED DEMO SPECIMEN:'}</strong>{' '}
              {innovation.id === 'demo_canva'
                ? 'Canva is used as an example of a live digital product with external destinations and launch presentation.'
                : 'SmartStudy AI demonstrates early-stage concept validation and community feedback workflow.'}
            </span>
          </div>

          {innovation.id === 'demo_canva' ? (
            <a
              href="https://www.canva.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-coral btn-sm"
              style={{ textDecoration: 'none', fontWeight: 700, gap: '0.35rem' }}
            >
              Visit Official Website <ExternalLink size={12} />
            </a>
          ) : (
            <button
              onClick={() => {
                setSelectedInnoId(innovation.id);
                setActiveTab('review_submit');
              }}
              className="btn btn-primary btn-sm"
              style={{ gap: '0.35rem' }}
            >
              Give Validation Feedback ↗
            </button>
          )}
        </div>
      )}

      {/* Main Project Header Statement */}
      <div style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ flex: '1 1 580px' }}>
            <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', lineHeight: 1.08, marginBottom: '0.75rem' }}>
              {innovation.title}
            </h1>
            <p className="editorial-lead" style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '1.25rem' }}>
              {innovation.short_description || innovation.problem_statement?.slice(0, 160)}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.86rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <img src={innovation.creator_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} alt="" style={{ width: '26px', height: '26px', borderRadius: '50%' }} />
              <span>Created by <strong>{innovation.creator_name || 'Innovator'}</strong></span>
              {(innovation.user_id || innovation.creator_id) && (innovation.user_id || innovation.creator_id) !== currentUser?.id && (
                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) {
                      showToast('Please sign in to message creators.', 'info');
                      return;
                    }
                    const creatorId = innovation.user_id || innovation.creator_id;
                    if (setSelectedRecipientId) setSelectedRecipientId(creatorId);
                    setActiveTab('messages');
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--coral)', padding: '2px 8px', fontSize: '0.74rem', gap: '0.25rem' }}
                >
                  <MessageSquare size={12} /> Message Creator
                </button>
              )}
              <span>•</span>
              <span className="mono">v{innovation.version || 1}.0</span>
              {innovation.published_at && (
                <>
                  <span>•</span>
                  <span className="mono" style={{ color: 'var(--green)' }}>Launched {new Date(innovation.published_at).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>

          {/* Action Button Strip */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* 3-State Project Upvote & Downvote Button Group */}
            <div style={{ display: 'inline-flex', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
              <button
                onClick={() => handleUpvote(innovation.id)}
                className={`btn btn-sm ${activeUserVote === 'upvote' ? 'btn-coral' : 'btn-secondary'}`}
                style={{ borderRadius: 0, border: 'none', borderRight: '1px solid var(--border-subtle)', gap: '0.35rem', fontWeight: 700 }}
                title="Upvote Project"
              >
                ▲ UPVOTE ({projectVotes.upvotes || innovation.upvotes_count || 0})
              </button>
              <button
                onClick={() => handleVoteProject('downvote')}
                className={`btn btn-sm ${activeUserVote === 'downvote' ? 'btn-secondary active-downvote' : 'btn-secondary'}`}
                style={{ borderRadius: 0, border: 'none', gap: '0.35rem', color: activeUserVote === 'downvote' ? 'var(--coral)' : 'inherit', fontWeight: 700 }}
                title="Downvote Project"
              >
                ▼ ({projectVotes.downvotes || innovation.downvotes_count || 0})
              </button>
            </div>

            {projectLikes.length > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.76rem', color: 'var(--text-secondary)', padding: '0.2rem 0.5rem', backgroundColor: 'var(--bg-cream)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex' }}>
                  {projectLikes.slice(0, 3).map((like, i) => (
                    <img
                      key={like.user_id || i}
                      src={like.user_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(like.user_name || 'User')}`}
                      alt={like.user_name}
                      title={`Upvoted by ${like.user_name || 'Innovator'}`}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        marginLeft: i > 0 ? '-5px' : 0,
                        border: '1.5px solid var(--bg-white)',
                        backgroundColor: 'var(--coral)'
                      }}
                    />
                  ))}
                </div>
                <span>
                  Upvoted by <strong>{projectLikes[0]?.user_name || 'Innovator'}</strong>
                  {projectLikes.length > 1 ? ` +${projectLikes.length - 1}` : ''}
                </span>
              </div>
            )}

            {/* AI Existing Solution Comparison Agent Button */}
            <button
              onClick={handleCompareExistingSolutions}
              className="btn btn-secondary"
              style={{
                gap: '0.45rem',
                border: '1px solid rgba(113, 134, 216, 0.4)',
                color: 'var(--periwinkle)',
                fontWeight: 700
              }}
            >
              <Scale size={15} color="var(--periwinkle)" /> ✦ COMPARE SOLUTIONS
            </button>

            {/* AI Innovation Research Agent Button */}
            <button
              onClick={handleResearchSpecimen}
              className="btn btn-secondary"
              style={{
                gap: '0.45rem',
                border: '1px solid rgba(105, 184, 154, 0.4)',
                color: 'var(--green)',
                fontWeight: 700
              }}
            >
              <Search size={15} color="var(--green)" /> ✦ RESEARCH
            </button>

            {/* AI Project Improvement Assistant Button */}
            <button
              onClick={handleOpenAiImprovement}
              className="btn btn-secondary"
              style={{
                gap: '0.45rem',
                border: '1px solid rgba(231, 111, 130, 0.4)',
                color: 'var(--coral)',
                fontWeight: 700
              }}
            >
              <Sparkles size={15} color="var(--coral)" /> ✦ IMPROVE THIS IDEA
            </button>

            {/* If Creator: Edit & Delete */}
            {isOwner && (
              <>
                <button
                  onClick={handleEditProject}
                  className="btn btn-secondary"
                  style={{ gap: '0.4rem' }}
                  title="Edit Project"
                >
                  <Edit3 size={15} /> Edit
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="btn btn-secondary"
                  style={{ gap: '0.4rem', color: 'var(--coral)' }}
                  title="Delete Project"
                >
                  <Trash2 size={15} /> Delete
                </button>
              </>
            )}

            {/* If Creator: Launch Setup Trigger */}
            {isOwner && (
              <button
                onClick={() => setIsLaunchModalOpen(true)}
                className="btn btn-coral"
                style={{ gap: '0.45rem', fontWeight: 800 }}
              >
                <Rocket size={16} /> {innovation.status === 'PUBLISHED' ? 'UPDATE LAUNCH SETUP ↗' : 'LAUNCH PROJECT ↗'}
              </button>
            )}

            {/* Primary Adaptive Community Action CTA */}
            {stage === 'live' && innovation.website_url ? (
              <a
                href={innovation.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-coral"
                style={{ gap: '0.45rem', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              >
                VISIT PRODUCT <ExternalLink size={15} />
              </a>
            ) : (
              <button
                onClick={handlePrimaryCtaClick}
                className="btn btn-primary"
                style={{ gap: '0.45rem', fontWeight: 800 }}
              >
                {getPrimaryCtaLabel()}
              </button>
            )}

            {/* Review Desk Button */}
            {!isOwner && (
              <button
                onClick={() => {
                  setSelectedInnoId(innovation.id);
                  setActiveTab('review_submit');
                }}
                className="btn btn-secondary"
                style={{ gap: '0.45rem' }}
              >
                Full Review Desk <ArrowUpRight size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Clean Resource Links Bar (Only rendered when URLs exist - NO BROKEN OR EMPTY BUTTONS) */}
        {hasAnyExternalLink && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap', backgroundColor: 'var(--bg-cream)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)' }}>
            <span className="editorial-mono-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              ACCESSIBLE DESTINATIONS:
            </span>

            {innovation.website_url && (
              <a
                href={innovation.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="filter-chip active"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none', fontSize: '0.76rem' }}
              >
                <Globe size={13} /> Visit Official Website <ExternalLink size={11} />
              </a>
            )}

            {innovation.demo_url && innovation.demo_url !== innovation.website_url && (
              <a
                href={innovation.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="filter-chip active"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none', fontSize: '0.76rem' }}
              >
                <Play size={13} /> Open Demo <ExternalLink size={11} />
              </a>
            )}

            {innovation.github_url && (
              <a
                href={innovation.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="filter-chip active"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none', fontSize: '0.76rem' }}
              >
                <Code2 size={13} /> GitHub Code <ExternalLink size={11} />
              </a>
            )}

            {innovation.app_store_url && (
              <a
                href={innovation.app_store_url}
                target="_blank"
                rel="noopener noreferrer"
                className="filter-chip active"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none', fontSize: '0.76rem' }}
              >
                <Smartphone size={13} /> App Store <ExternalLink size={11} />
              </a>
            )}

            {innovation.play_store_url && (
              <a
                href={innovation.play_store_url}
                target="_blank"
                rel="noopener noreferrer"
                className="filter-chip active"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none', fontSize: '0.76rem' }}
              >
                <Smartphone size={13} /> Google Play <ExternalLink size={11} />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Project Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        {['OVERVIEW', 'COMPARISON', 'FEEDBACK', 'INSIGHTS', 'IMPROVEMENTS', 'LAUNCH'].map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveProjectTab(tab);
              if (tab === 'COMPARISON' && !comparisonResult) {
                handleCompareExistingSolutions();
              }
            }}
            style={{
              padding: '0.65rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: '2px solid',
              borderColor: activeProjectTab === tab ? 'var(--coral)' : 'transparent',
              color: activeProjectTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '0.78rem',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab === 'FEEDBACK' ? `FEEDBACK (${reviews.length})` : tab === 'COMPARISON' ? 'COMPARISON' : tab}
          </button>
        ))}
      </div>

      {/* ================= AI FEATURE 3: EXISTING SOLUTION COMPARISON TAB ================= */}
      {activeProjectTab === 'COMPARISON' && (
        <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
          {isComparing ? (
            <div className="editorial-card" style={{ padding: '4rem', textAlign: 'center' }}>
              <div className="animate-spin" style={{ width: '36px', height: '36px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--periwinkle)', borderRadius: '50%', margin: '0 auto 1.25rem auto' }} />
              <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '0.35rem' }}>
                EXISTING SOLUTION COMPARISON AGENT
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>Comparing Against Verified Database Solutions...</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '500px', margin: '0 auto' }}>
                Calculating semantic overlap, category affinity, strategic architectural differences, and competitive edges.
              </p>
            </div>
          ) : comparisonResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              {/* Header Hero Banner */}
              <div
                className="editorial-card"
                style={{
                  backgroundColor: 'var(--bg-dark)',
                  color: '#FFFFFF',
                  padding: '2.5rem',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '2rem'
                }}
              >
                <div style={{ flex: '1 1 480px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                    <Scale size={18} color="var(--periwinkle)" />
                    <span className="editorial-mono-label" style={{ color: 'var(--periwinkle)' }}>
                      EXISTING SOLUTION COMPARISON AGENT
                    </span>
                  </div>
                  <h2 style={{ fontSize: '2.2rem', color: '#FFFFFF', lineHeight: 1.15, marginBottom: '0.75rem' }}>
                    Cross-Registry Differential Analysis
                  </h2>
                  <p style={{ color: 'var(--text-inverse-muted)', fontSize: '0.94rem', margin: 0, lineHeight: 1.5 }}>
                    Evaluating "{innovation.title}" against verified public innovations and global catalog records.
                  </p>
                  <div className="mono" style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.75rem' }}>
                    ✦ {comparisonResult.disclaimer}
                  </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: '160px' }}>
                  <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '0.35rem' }}>
                    OVERALL SIMILARITY ESTIMATE
                  </div>
                  <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '3.6rem', fontWeight: 800, color: 'var(--periwinkle)', lineHeight: 1 }}>
                    {comparisonResult.similarity_score}%
                  </div>
                  <div className="editorial-mono-label" style={{ fontSize: '0.7rem', color: 'var(--green)', marginTop: '0.25rem' }}>
                    ● {comparisonResult.similarity_score < 60 ? 'HIGHLY DIFFERENTIATED' : 'MODERATE OVERLAP'}
                  </div>
                </div>
              </div>

              {/* Matched Real Solutions */}
              <div>
                <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.85rem' }}>
                  VERIFIED SIMILAR SOLUTIONS IDENTIFIED ({comparisonResult.similar_solutions?.length || 0})
                </div>

                {comparisonResult.similar_solutions?.length === 0 ? (
                  <div className="editorial-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No sufficiently similar verified solutions found in current database records.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                    {comparisonResult.similar_solutions.map(sol => (
                      <div
                        key={sol.id}
                        className="editorial-card"
                        style={{
                          padding: '1.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          borderLeft: '4px solid var(--periwinkle)',
                          backgroundColor: 'var(--bg-white)'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <span className="editorial-mono-label" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                              SOURCE: {sol.source}
                            </span>
                            <span
                              className="mono"
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                color: 'var(--periwinkle)',
                                backgroundColor: 'rgba(113, 134, 216, 0.1)',
                                padding: '0.15rem 0.5rem',
                                borderRadius: 'var(--radius-full)'
                              }}
                            >
                              {sol.similarity_percentage}% SIMILAR
                            </span>
                          </div>

                          <h4 style={{ fontSize: '1.2rem', marginBottom: '0.45rem' }}>{sol.name}</h4>
                          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '0.85rem' }}>
                            {sol.short_description}
                          </p>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '0.85rem', backgroundColor: 'var(--bg-cream)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                            "{sol.similarity_reason}"
                          </div>

                          {sol.live_url && (
                            <a
                              href={sol.live_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', textDecoration: 'none', gap: '0.35rem', color: 'var(--coral)', fontWeight: 700 }}
                            >
                              Inspect Source <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Side-by-Side Problem Comparison Box */}
              {comparisonResult.side_by_side && (
                <div className="editorial-card" style={{ padding: '2rem', backgroundColor: 'var(--bg-cream)' }}>
                  <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '1rem' }}>
                    SIDE-BY-SIDE PROBLEM COMPARISON
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ backgroundColor: 'var(--bg-white)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--coral)', marginBottom: '0.35rem' }}>
                        CURRENT PROJECT: {comparisonResult.side_by_side.current_project?.title}
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                        {comparisonResult.side_by_side.current_project?.problem}
                      </p>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-white)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--periwinkle)', marginBottom: '0.35rem' }}>
                        MATCHED SOLUTION: {comparisonResult.side_by_side.matched_solution?.title}
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                        {comparisonResult.side_by_side.matched_solution?.problem}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Unique Differences & Competitive Advantages */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
                {/* Unique Differences */}
                <div className="editorial-card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-white)' }}>
                  <div className="editorial-mono-label" style={{ color: 'var(--teal)', marginBottom: '1rem' }}>
                    UNIQUE DIFFERENTIATING FACTORS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {comparisonResult.unique_differences?.features?.map((f, i) => (
                      <div key={i} style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                        • <strong>Feature Vector:</strong> {f}
                      </div>
                    ))}
                    {comparisonResult.unique_differences?.technology?.map((t, i) => (
                      <div key={i} style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                        • <strong>Technology Stack:</strong> {t}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Competitive Advantages & Opportunities */}
                <div className="editorial-card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-white)' }}>
                  <div className="editorial-mono-label" style={{ color: 'var(--green)', marginBottom: '1rem' }}>
                    COMPETITIVE ADVANTAGES & OPPORTUNITIES
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {comparisonResult.competitive_advantages?.map((adv, i) => (
                      <div key={i} style={{ fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <CheckCircle2 size={16} color="var(--green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{adv}</span>
                      </div>
                    ))}
                    {comparisonResult.missing_opportunities?.map((opp, i) => (
                      <div key={i} style={{ fontSize: '0.88rem', color: 'var(--coral)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <Sparkles size={16} color="var(--coral)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{opp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="editorial-card" style={{ padding: '3.5rem', textAlign: 'center' }}>
              <Scale size={32} color="var(--periwinkle)" style={{ margin: '0 auto 1rem auto' }} />
              <h3>Execute Solution Differential Scan</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto 1.5rem auto' }}>
                Run the Existing Solution Comparison Agent against real Supabase database projects and global innovation records.
              </p>
              <button onClick={handleCompareExistingSolutions} className="btn btn-primary" style={{ gap: '0.45rem' }}>
                <Scale size={15} /> RUN COMPARISON NOW
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= OVERVIEW TAB ================= */}
      {activeProjectTab === 'OVERVIEW' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'flex-start' }}>
          {/* Left Column: Narrative Specification */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <div>
              <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.5rem' }}>
                01 / THE PROBLEM
              </div>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                {innovation.problem_statement || 'No detailed problem statement provided.'}
              </p>
            </div>

            <div>
              <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '0.5rem' }}>
                02 / TARGET BENEFICIARY & AUDIENCE
              </div>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                {innovation.target_users || 'General technology adopters, builders, and enthusiasts.'}
              </p>
            </div>

            <div>
              <div className="editorial-mono-label" style={{ color: 'var(--lavender)', marginBottom: '0.5rem' }}>
                03 / PROPOSED SOLUTION & ARCHITECTURE
              </div>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                {innovation.proposed_solution || innovation.short_description || 'Solution details documented in technical spec.'}
              </p>
            </div>

            {/* Quick Community Validation Review Section */}
            <div
              style={{
                backgroundColor: 'var(--bg-white)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div className="editorial-mono-label" style={{ color: 'var(--lavender)', marginBottom: '0.5rem' }}>
                04 / VALIDATION PERSPECTIVE & REVIEW
              </div>
              <h3 style={{ fontSize: '1.35rem', marginBottom: '1.25rem' }}>
                Quick Community Review & Feedback
              </h3>

              {isOwner ? (
                <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1.25rem', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>You are the creator of this project.</span>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem' }}>
                    View all peer reviews and community feedback received on the <strong>FEEDBACK ({reviews.length})</strong> tab above.
                  </p>
                </div>
              ) : questionnaireSubmitted ? (
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '1.25rem', borderRadius: 'var(--radius-md)', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={18} />
                  <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>✓ You have submitted your review for this project. Thank you for validating!</span>
                </div>
              ) : (
                <form onSubmit={handleSubmitQuickPerspective} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Q1: Relevance to interests */}
                  <div>
                    <label style={{ fontSize: '0.88rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                      1. Is this related to your interests / a problem you experience?
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['YES', 'MAYBE', 'NO'].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setQ1(opt)}
                          className={`filter-chip ${q1 === opt ? 'active' : ''}`}
                          style={{ padding: '0.4rem 1rem' }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q2: Would use */}
                  <div>
                    <label style={{ fontSize: '0.88rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                      2. Would you use or support a project like this?
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['YES', 'MAYBE', 'NO'].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setQ2(opt)}
                          className={`filter-chip ${q2 === opt ? 'active' : ''}`}
                          style={{ padding: '0.4rem 1rem' }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q3: Suggestion */}
                  <div>
                    <label style={{ fontSize: '0.88rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                      3. Optional suggestion for improvement
                    </label>
                    <textarea
                      value={q4}
                      onChange={e => setQ4(e.target.value)}
                      placeholder="What should the creator improve or consider next?"
                      className="form-textarea"
                      rows={3}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="btn btn-coral"
                    style={{ alignSelf: 'flex-start', marginTop: '0.5rem', opacity: isSubmittingReview ? 0.7 : 1 }}
                  >
                    {isSubmittingReview ? 'Submitting Review...' : 'Submit Review ↗'}
                  </button>
                </form>
              )}
            </div>

            {/* Key Features List if present */}
            {innovation.features && innovation.features.length > 0 && (
              <div>
                <div className="editorial-mono-label" style={{ color: 'var(--green)', marginBottom: '0.75rem' }}>
                  {innovation.id === 'demo_smartstudy_ai' ? '05' : '04'} / KEY FEATURES & CAPABILITIES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {innovation.features.map((feat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.94rem' }}>
                      <CheckCircle2 size={16} color="var(--green)" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags Pill Group */}
            {innovation.tags && innovation.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {innovation.tags.map((t, idx) => (
                  <span key={idx} className="filter-chip" style={{ fontSize: '0.74rem' }}>
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Community Discussion Ledger */}
            <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '2rem' }}>
              <div className="editorial-mono-label" style={{ marginBottom: '1rem' }}>
                COMMUNITY DISCUSSION ({comments.length})
              </div>

              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  placeholder="Leave an inquiry or feedback note..."
                  className="form-input"
                />
                <button type="submit" className="btn btn-secondary">
                  <Send size={14} /> Post
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {comments.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>No comments recorded yet. Be the first to start the conversation!</div>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="editorial-card" style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <strong style={{ fontSize: '0.88rem' }}>{c.author_name || 'Community Member'}</strong>
                        <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                          {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{c.content}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Validation Statistics Card & 3D Specimen */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Overview Statistics Card */}
            <div className="editorial-card" style={{ padding: '2rem' }}>
              <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '1.25rem' }}>
                VALIDATION SCORECARD
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--coral)' }}>
                    {validationPct}%
                  </div>
                  <div className="editorial-mono-label" style={{ fontSize: '0.66rem' }}>Validation Target</div>
                </div>

                <div>
                  <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--periwinkle)' }}>
                    {reviews.length}
                  </div>
                  <div className="editorial-mono-label" style={{ fontSize: '0.66rem' }}>Critique Logs</div>
                </div>

                <div>
                  <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--green)' }}>
                    {innovation.upvotes_count || 0}
                  </div>
                  <div className="editorial-mono-label" style={{ fontSize: '0.66rem' }}>Supporters</div>
                </div>

                <div>
                  <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--apricot)' }}>
                    v{innovation.version || 1}.0
                  </div>
                  <div className="editorial-mono-label" style={{ fontSize: '0.66rem' }}>Version Iteration</div>
                </div>
              </div>

              <div className="progress-track" style={{ height: '8px', marginBottom: '1.25rem' }}>
                <div className="progress-fill" style={{ width: `${validationPct}%`, backgroundColor: 'var(--coral)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <button
                  onClick={() => {
                    setSelectedInnoId(innovation.id);
                    setActiveTab('insight');
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', gap: '0.5rem' }}
                >
                  Inspect Full AI Synthesis <ArrowUpRight size={15} />
                </button>

                {isOwner && (
                  <button
                    onClick={() => setIsImproveModalOpen(true)}
                    className="btn btn-secondary"
                    style={{ width: '100%', gap: '0.5rem' }}
                  >
                    <Edit3 size={15} /> Log Version Improvement
                  </button>
                )}
              </div>
            </div>

            {/* 3D Specimen Canvas */}
            <div className="editorial-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="editorial-mono-label" style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', alignSelf: 'flex-start' }}>
                SPECIMEN GEOMETRY
              </div>
              <InnovationCore
                height={220}
                modelType={stage === 'live' || stage === 'mvp' ? 'STRUCTURE' : 'SPARK'}
                category={innovation.category_id}
                accentColor={ink.hex}
              />
            </div>
          </div>

          {/* ================= SIMILAR INNOVATIONS SECTION (AI FEATURE 3) ================= */}
          {similarProjects.length > 0 && (
            <div style={{ gridColumn: '1 / -1', marginTop: '1rem', borderTop: '1px solid var(--border-hairline)', paddingTop: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.25rem' }}>
                    ✦ AI CROSS-SPECIMEN MATCHING
                  </div>
                  <h3 style={{ fontSize: '1.65rem' }}>SIMILAR INNOVATIONS</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                    Real projects in the INNOVEXA registry sharing domain affinity, taxonomy tags, and problem space.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {similarProjects.map(sim => {
                  const simInk = getCategoryInk(sim.category_id, sim.category_name);
                  return (
                    <div
                      key={sim.id}
                      onClick={() => {
                        setSelectedInnoId(sim.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="editorial-card hover-lift"
                      style={{
                        padding: '1.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        borderLeft: `4px solid ${simInk.hex || 'var(--coral)'}`,
                        backgroundColor: 'var(--bg-white)',
                        position: 'relative'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <span className={`category-tag ${simInk.tagClass}`} style={{ fontSize: '0.65rem' }}>
                            {sim.category_name || 'Technology'}
                          </span>
                          <span
                            className="mono"
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              color: 'var(--coral)',
                              backgroundColor: 'rgba(231, 111, 130, 0.1)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-full)'
                            }}
                          >
                            {sim.similarity_score}% RELATED
                          </span>
                        </div>

                        <h4 style={{ fontSize: '1.15rem', marginBottom: '0.45rem', lineHeight: 1.25 }}>
                          {sim.title}
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '0.75rem' }}>
                          {sim.short_description || sim.problem_statement?.slice(0, 100)}
                        </p>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '0.75rem', backgroundColor: 'var(--bg-cream)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                          "{sim.similarity_reason}"
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                          <StageBadge stage={sim.project_stage || 'idea'} />
                          <span style={{ color: 'var(--coral)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            Inspect Specimen <ArrowUpRight size={12} />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= FEEDBACK TAB ================= */}
      {activeProjectTab === 'FEEDBACK' && (() => {
        // Calculate Review Snapshot & Metrics
        const totalReviewsCount = reviews.length;
        const helpfulReviewsCount = reviews.filter(r => (r.helpful_votes_count || 0) > 0 || Number(r.rating || 5) >= 4).length;
        const keyConcernsCount = reviews.filter(r => (r.problem_relevance === 'MAYBE' || r.problem_relevance === 'NOT YET' || r.would_use === 'NO')).length;
        const suggestedImprovementsCount = reviews.filter(r => Boolean(r.suggestion || r.improvement_suggestions)).length;

        // Sort reviews based on reviewSort state
        const sortedReviews = [...reviews].sort((a, b) => {
          if (reviewSort === 'MOST_HELPFUL') {
            const votesA = a.helpful_votes_count || 0;
            const votesB = b.helpful_votes_count || 0;
            if (votesB !== votesA) return votesB - votesA;
            return (b.rating || 5) - (a.rating || 5);
          }
          if (reviewSort === 'NEWEST') {
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
          }
          if (reviewSort === 'OLDEST') {
            return new Date(a.created_at || 0) - new Date(b.created_at || 0);
          }
          if (reviewSort === 'MOST_DISCUSSED') {
            return ((b.overall_feedback || '').length) - ((a.overall_feedback || '').length);
          }
          return 0;
        });

        return (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.45rem' }}>
                  PEER REVIEW LEDGER ({reviews.length})
                </div>
                <h2 style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>Validated Peer Feedback & Critiques</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem' }}>
                  Real evaluations submitted by network peers across problem relevance, solution utility, and constructive suggestions.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {reviews.length > 0 && (
                  <select
                    value={reviewSort}
                    onChange={e => setReviewSort(e.target.value)}
                    className="form-select"
                    style={{ height: '40px', fontSize: '0.84rem', padding: '0.35rem 2rem 0.35rem 0.75rem', fontWeight: 600 }}
                  >
                    <option value="MOST_HELPFUL">Sort: Most Helpful First</option>
                    <option value="NEWEST">Sort: Newest Reviews</option>
                    <option value="OLDEST">Sort: Oldest Reviews</option>
                    <option value="MOST_DISCUSSED">Sort: Detailed Feedback</option>
                  </select>
                )}

                <button
                  onClick={() => {
                    setSelectedInnoId(innovation.id);
                    setActiveTab('review_submit');
                  }}
                  className="btn btn-coral"
                  style={{ gap: '0.45rem', height: '40px' }}
                >
                  Submit Validation Review <ArrowUpRight size={15} />
                </button>
              </div>
            </div>

            {/* AI Feature 4: Community Feedback Agent Consensus Analysis Card */}
            {feedbackAgentResult && (
              <div
                className="editorial-card"
                style={{
                  backgroundColor: 'var(--bg-white)',
                  borderLeft: `4px solid ${feedbackAgentResult.hasReviews ? (feedbackAgentResult.overall_sentiment === 'Positive' ? 'var(--green)' : feedbackAgentResult.overall_sentiment === 'Needs Improvement' ? 'var(--coral)' : 'var(--apricot)') : 'var(--periwinkle)'}`,
                  padding: '1.75rem',
                  marginBottom: '2rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={16} color="var(--coral)" />
                    <span className="editorial-mono-label" style={{ color: 'var(--coral)' }}>
                      ✦ COMMUNITY FEEDBACK AGENT CONSENSUS
                    </span>
                  </div>

                  {feedbackAgentResult.hasReviews && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        REVIEWS ANALYZED: {feedbackAgentResult.reviews_count}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          padding: '0.2rem 0.65rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: feedbackAgentResult.overall_sentiment === 'Positive' ? 'rgba(105, 184, 154, 0.15)' : feedbackAgentResult.overall_sentiment === 'Needs Improvement' ? 'rgba(231, 111, 130, 0.15)' : 'rgba(233, 180, 91, 0.15)',
                          color: feedbackAgentResult.overall_sentiment === 'Positive' ? 'var(--green)' : feedbackAgentResult.overall_sentiment === 'Needs Improvement' ? 'var(--coral)' : 'var(--apricot)'
                        }}
                      >
                        ● {feedbackAgentResult.overall_sentiment.toUpperCase()} SENTIMENT
                      </span>
                    </div>
                  )}
                </div>

                {!feedbackAgentResult.hasReviews ? (
                  <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--text-secondary)' }}>
                    <p style={{ fontSize: '0.94rem', margin: 0 }}>
                      {feedbackAgentResult.message || 'NO COMMUNITY FEEDBACK AVAILABLE YET. Be the first to request feedback from the community.'}
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Likes & Concerns 2-Column Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                      <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)' }}>
                        <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--green)', marginBottom: '0.45rem' }}>
                          WHAT THE COMMUNITY LIKES
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {(feedbackAgentResult.what_community_likes || []).map((like, i) => (
                            <li key={i} style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>{like}</li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)' }}>
                        <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--coral)', marginBottom: '0.45rem' }}>
                          COMMON CONCERNS & MOST REQUESTED IMPROVEMENTS
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {[...(feedbackAgentResult.common_concerns || []), ...(feedbackAgentResult.most_requested_improvements || [])].slice(0, 3).map((item, i) => (
                            <li key={i} style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* AI Consensus Summary */}
                    {feedbackAgentResult.ai_summary && (
                      <div style={{ padding: '0.85rem 1.25rem', backgroundColor: 'rgba(231, 111, 130, 0.05)', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(231, 111, 130, 0.25)' }}>
                        <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--coral)', marginBottom: '0.35rem' }}>
                          SYNTHESIS SUMMARY
                        </div>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
                          "{feedbackAgentResult.ai_summary}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Review Snapshot Scorecard */}
            {reviews.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem'
                }}
              >
                <div className="editorial-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--coral)' }}>
                  <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.2rem', fontWeight: 800, color: 'var(--coral)' }}>
                    {totalReviewsCount}
                  </div>
                  <div className="editorial-mono-label" style={{ fontSize: '0.66rem' }}>Total Reviews</div>
                </div>

                <div className="editorial-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--green)' }}>
                  <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.2rem', fontWeight: 800, color: 'var(--green)' }}>
                    {helpfulReviewsCount}
                  </div>
                  <div className="editorial-mono-label" style={{ fontSize: '0.66rem' }}>Helpful Reviews</div>
                </div>

                <div className="editorial-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--apricot)' }}>
                  <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.2rem', fontWeight: 800, color: 'var(--apricot)' }}>
                    {keyConcernsCount}
                  </div>
                  <div className="editorial-mono-label" style={{ fontSize: '0.66rem' }}>Key Concerns</div>
                </div>

                <div className="editorial-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--periwinkle)' }}>
                  <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.2rem', fontWeight: 800, color: 'var(--periwinkle)' }}>
                    {suggestedImprovementsCount}
                  </div>
                  <div className="editorial-mono-label" style={{ fontSize: '0.66rem' }}>Suggested Improvements</div>
                </div>
              </div>
            )}

            {/* List of Reviews */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {sortedReviews.length === 0 ? (
                <div className="editorial-card" style={{ padding: '3.5rem', textAlign: 'center', backgroundColor: 'var(--bg-cream)' }}>
                  <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.5rem' }}>
                    AWAITING PEER SCRUTINY
                  </div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No feedback reviews submitted yet.</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
                    Be the first to inspect this specimen and contribute constructive validation perspective.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedInnoId(innovation.id);
                      setActiveTab('review_submit');
                    }}
                    className="btn btn-coral"
                    style={{ gap: '0.45rem' }}
                  >
                    Submit Validation Review <ArrowUpRight size={15} />
                  </button>
                </div>
              ) : (
                sortedReviews.map((r, idx) => {
                  const relevance = (r.relevance_answer || r.problem_relevance || r.solves_real_problem || 'YES').toUpperCase();
                  const wouldUseVal = r.would_use === true || r.would_use === 'YES' || r.is_relevant === 'YES' ? 'YES' : 'NO';
                  const feedbackText = r.overall_feedback || r.liked_features || `Relevant to interests: ${relevance}. Would use: ${wouldUseVal}.`;
                  const suggestionText = r.suggestion || r.improvement_suggestions || 'Focus on user feedback and continuous prototype iteration.';
                  const formattedDate = r.created_at ? new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
                  const userVote = reviewVotes[r.id];
                  const quality = StorageService.getReviewQuality(r, r.helpful_votes_count || 0);

                  const qualityBadgeColors = {
                    'HIGHLY HELPFUL': { color: 'var(--green)', bg: 'rgba(105, 184, 154, 0.15)', border: 'rgba(105, 184, 154, 0.3)' },
                    'HELPFUL': { color: 'var(--teal)', bg: 'rgba(88, 184, 173, 0.15)', border: 'rgba(88, 184, 173, 0.3)' },
                    'COMMUNITY FEEDBACK': { color: 'var(--text-secondary)', bg: 'var(--bg-cream)', border: 'var(--border-medium)' }
                  };
                  const qColors = qualityBadgeColors[quality.label] || qualityBadgeColors['COMMUNITY FEEDBACK'];

                  const isMyReview = currentUser && (r.user_id === currentUser.id || r.reviewer_id === currentUser.id);
                  const isEditingThis = editingReviewId === r.id;

                  return (
                    <div
                      key={r.id || idx}
                      className="editorial-card"
                      style={{
                        padding: '2rem',
                        borderLeft: `4px solid ${quality.label === 'HIGHLY HELPFUL' ? 'var(--green)' : 'var(--coral)'}`,
                        backgroundColor: 'var(--bg-white)',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      {/* Review Header: Reviewer Info, Badges, Quality Signal, Rating, Date */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img
                            src={r.reviewer_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(r.reviewer_name || 'Validator')}&backgroundColor=20212a,e76f82,7186d8`}
                            alt=""
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                          />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: '1rem' }}>{r.reviewer_name || 'Verified Validator'}</strong>
                              <span className="editorial-mono-label" style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>
                                {isMyReview ? 'YOU (AUTHOR)' : 'PEER VALIDATOR'}
                              </span>
                            </div>
                            <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              Reviewed on {formattedDate}
                            </div>
                          </div>
                        </div>

                        {/* Review Status Badges & Quality Score & Edit/Delete Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {isMyReview && !isEditingThis && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginRight: '0.5rem' }}>
                              <button
                                type="button"
                                onClick={() => handleStartEditReview(r)}
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize: '0.74rem', padding: '0.2rem 0.5rem', gap: '0.25rem', color: 'var(--text-secondary)' }}
                                title="Edit your review"
                              >
                                <Edit3 size={12} /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReview(r.id)}
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize: '0.74rem', padding: '0.2rem 0.5rem', gap: '0.25rem', color: 'var(--coral)' }}
                                title="Delete your review"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          )}

                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              color: qColors.color,
                              backgroundColor: qColors.bg,
                              border: `1px solid ${qColors.border}`,
                              padding: '0.2rem 0.55rem',
                              borderRadius: 'var(--radius-full)'
                            }}
                          >
                            ✦ {quality.label}
                          </span>

                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontFamily: 'var(--font-mono)',
                              padding: '0.25rem 0.65rem',
                              borderRadius: 'var(--radius-full)',
                              fontWeight: 700,
                              backgroundColor: relevance === 'YES' ? 'rgba(105, 184, 154, 0.15)' : relevance === 'MAYBE' ? 'rgba(233, 180, 91, 0.15)' : 'rgba(231, 111, 130, 0.15)',
                              color: relevance === 'YES' ? 'var(--green)' : relevance === 'MAYBE' ? 'var(--apricot)' : 'var(--coral)',
                              border: `1px solid ${relevance === 'YES' ? 'rgba(105, 184, 154, 0.3)' : relevance === 'MAYBE' ? 'rgba(233, 180, 91, 0.3)' : 'rgba(231, 111, 130, 0.3)'}`
                            }}
                          >
                            SOLVES PROBLEM: {relevance}
                          </span>

                          <span
                            style={{
                              fontSize: '0.8rem',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              color: 'var(--coral)',
                              backgroundColor: 'var(--bg-cream)',
                              padding: '0.25rem 0.65rem',
                              borderRadius: 'var(--radius-full)',
                              border: '1px solid var(--border-subtle)'
                            }}
                          >
                            {r.rating || 5}/5 ★
                          </span>
                        </div>
                      </div>

                      {/* Review Body: Inline Edit Mode vs Display Mode */}
                      {isEditingThis ? (
                        <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--border-medium)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <div className="editorial-mono-label" style={{ fontSize: '0.72rem', color: 'var(--coral)' }}>
                              EDIT YOUR PERSPECTIVE & RATING
                            </div>
                            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setEditRating(star)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    color: star <= editRating ? 'var(--coral)' : 'var(--border-medium)',
                                    padding: '0 0.15rem'
                                  }}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                            className="form-control"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem', fontSize: '0.9rem', backgroundColor: 'var(--bg-white)' }}
                            placeholder="Update your review content..."
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={handleCancelEditReview}
                              className="btn btn-secondary btn-sm"
                              disabled={isSavingReviewEdit}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditReview(r.id)}
                              className="btn btn-coral btn-sm"
                              disabled={isSavingReviewEdit}
                            >
                              {isSavingReviewEdit ? 'Saving...' : 'Save Update'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                          {/* Overall Feedback */}
                          <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--green)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <CheckCircle2 size={13} /> OVERALL FEEDBACK & STRENGTHS
                            </div>
                            <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.55, margin: 0 }}>
                              {feedbackText}
                            </p>
                          </div>

                          {/* Constructive Suggestion */}
                          <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--coral)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Sparkles size={13} /> CONSTRUCTIVE SUGGESTIONS & IMPROVEMENTS
                            </div>
                            <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.55, margin: 0 }}>
                              {suggestionText}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Review Helpfulness Voting Section */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {(r.helpful_votes_count || 0) > 0 ? (
                            <span><strong style={{ color: 'var(--green)' }}>{r.helpful_votes_count}</strong> community members found this review helpful.</span>
                          ) : (
                            <span style={{ fontStyle: 'italic' }}>No community votes yet — be the first to rate this feedback.</span>
                          )}
                        </div>

                        {/* ▲ Helpful & ▼ Not Helpful Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={(e) => handleVoteReview(e, r.id, 'upvote')}
                            className={`btn ${userVote === 'upvote' ? 'btn-coral' : 'btn-secondary'} btn-sm`}
                            style={{ fontSize: '0.76rem', padding: '0.25rem 0.65rem', gap: '0.3rem' }}
                            title="Mark review as helpful"
                          >
                            <ThumbsUp size={12} /> ▲ Helpful {(r.helpful_votes_count || 0) > 0 ? `(${r.helpful_votes_count})` : ''}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleVoteReview(e, r.id, 'downvote')}
                            className={`btn ${userVote === 'downvote' ? 'btn-secondary' : 'btn-ghost'} btn-sm`}
                            style={{ fontSize: '0.76rem', padding: '0.25rem 0.55rem', color: userVote === 'downvote' ? 'var(--coral)' : 'var(--text-secondary)', gap: '0.25rem' }}
                            title="Mark review as not helpful"
                          >
                            <ThumbsDown size={12} /> ▼ Not Helpful
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* ================= INSIGHTS TAB ================= */}
      {activeProjectTab === 'INSIGHTS' && (
        <div className="editorial-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Sparkles size={36} color="var(--rose-pink)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Full AI Synthesis Engine</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 2rem auto' }}>
            View consensus distributions, top strengths, key friction points, and rule-based clustering reports.
          </p>
          <button
            onClick={() => {
              setSelectedInnoId(innovation.id);
              setActiveTab('insight');
            }}
            className="btn btn-coral btn-lg"
          >
            Launch Insights Dashboard ↗
          </button>
        </div>
      )}

      {/* ================= IMPROVEMENTS TAB ================= */}
      {activeProjectTab === 'IMPROVEMENTS' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <div className="editorial-mono-label" style={{ color: 'var(--apricot)', marginBottom: '0.35rem' }}>
                ITERATION HISTORY
              </div>
              <h2 style={{ fontSize: '1.85rem' }}>Version Changelog & Iterations</h2>
            </div>

            {isOwner && (
              <button onClick={() => setIsImproveModalOpen(true)} className="btn btn-coral" style={{ gap: '0.4rem' }}>
                <Edit3 size={15} /> Log New Version
              </button>
            )}
          </div>

          <div className="editorial-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <GitBranch size={16} color="var(--coral)" />
              <strong style={{ fontSize: '1.1rem' }}>v{innovation.version || 1}.0 — Baseline Registered Specimen</strong>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              {innovation.last_changelog || 'Initial problem statement and solution hypothesis logged into the validation registry.'}
            </p>
          </div>
        </div>
      )}

      {/* ================= LAUNCH TAB ================= */}
      {activeProjectTab === 'LAUNCH' && (
        <div className="editorial-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <Rocket size={40} color="var(--green)" style={{ margin: '0 auto 1.25rem auto' }} />
          <h2 style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>
            {innovation.status === 'PUBLISHED' ? 'Project is Live on INNOVEXA' : 'Ready to Launch on INNOVEXA?'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto 2rem auto', fontSize: '1.05rem', lineHeight: 1.5 }}>
            {innovation.status === 'PUBLISHED' 
              ? 'This project is published on the public directory. You can update destination links, prototype embeds, or project stage at any time.'
              : 'Launch setup configures your destination links or next community action and presents your project to the entire innovator network.'
            }
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {isOwner ? (
              <button
                onClick={() => setIsLaunchModalOpen(true)}
                className="btn btn-coral btn-lg"
                style={{ gap: '0.5rem', fontWeight: 800 }}
              >
                <Rocket size={18} /> {innovation.status === 'PUBLISHED' ? 'CONFIGURE LAUNCH SETTINGS ↗' : 'LAUNCH PROJECT ↗'}
              </button>
            ) : (
              <button onClick={handlePrimaryCtaClick} className="btn btn-primary btn-lg">
                {getPrimaryCtaLabel()}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Launch Setup Modal */}
      <LaunchSetupModal
        isOpen={isLaunchModalOpen}
        onClose={() => setIsLaunchModalOpen(false)}
        innovation={innovation}
        onPublished={() => loadData()}
      />

      {/* Log Improvement Modal */}
      {isImproveModalOpen && (
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
            if (e.target === e.currentTarget) setIsImproveModalOpen(false);
          }}
        >
          <div
            className="editorial-card"
            style={{
              width: '100%',
              maxWidth: '540px',
              backgroundColor: 'var(--bg-white)',
              borderRadius: 'var(--radius-lg)',
              padding: '2.5rem'
            }}
          >
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.4rem' }}>
              ITERATION TRACKER
            </div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>
              Log Changes for v{(innovation.version || 1) + 1}.0
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Describe what was improved based on peer review feedback (e.g. refined UX, updated technical architecture).
            </p>

            <form onSubmit={handleSaveImprovement}>
              <div className="form-group">
                <label className="form-label">CHANGELOG / WHAT CHANGED</label>
                <textarea
                  value={improvementChangelog}
                  onChange={e => setImprovementChangelog(e.target.value)}
                  placeholder="e.g. Simplified student onboarding flow, reduced latency by 40%..."
                  className="form-textarea"
                  rows={4}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsImproveModalOpen(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-coral">
                  Save Version v{(innovation.version || 1) + 1}.0
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= AI PROJECT IMPROVEMENT ASSISTANT MODAL (FEATURE 6) ================= */}
      {isAiImproveModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAiImproveModalOpen(false);
          }}
        >
          <div
            className="editorial-card"
            style={{
              width: '100%',
              maxWidth: '840px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-white)',
              borderRadius: 'var(--radius-xl)',
              padding: '2.5rem',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Sparkles size={20} color="var(--coral)" />
                <span className="editorial-mono-label" style={{ color: 'var(--coral)', fontSize: '0.85rem' }}>
                  AI PROJECT IMPROVEMENT ASSISTANT (5 PILLARS)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAiImproveModalOpen(false)}
                className="btn btn-ghost btn-sm"
              >
                ✕ Close
              </button>
            </div>

            {isGeneratingPlan ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <Sparkles size={32} color="var(--coral)" style={{ margin: '0 auto 1rem auto', animation: 'spin 2s linear infinite' }} />
                <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Synthesizing 5-Pillar Improvement Blueprint...</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Analyzing project narrative, domain competitive landscape, and peer review feedback.
                </p>
              </div>
            ) : aiImprovementPlan ? (
              <div>
                <div style={{ marginBottom: '1.75rem', backgroundColor: 'var(--bg-dark)', color: '#FFFFFF', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                  <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.25rem' }}>
                    INCUBATOR STRATEGIC ADVISORY
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                    {innovation.title}
                  </div>
                  <div style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '0.35rem' }}>
                    Actionable roadmap synthesized across problem clarity, technical execution, and user value proposition.
                  </div>
                </div>

                {/* 5 Pillars Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  {[
                    { number: '01', title: 'CLARITY & NARRATIVE DEFINITION', color: 'var(--coral)', content: aiImprovementPlan.clarity },
                    { number: '02', title: 'TECHNICAL FEASIBILITY & EXECUTION', color: 'var(--periwinkle)', content: aiImprovementPlan.feasibility },
                    { number: '03', title: 'DIFFERENTIATION & COMPETITIVE MOAT', color: 'var(--lavender)', content: aiImprovementPlan.differentiation },
                    { number: '04', title: 'USER VALUE DELIVERY & ONBOARDING', color: 'var(--green)', content: aiImprovementPlan.user_value }
                  ].map(pillar => (
                    <div
                      key={pillar.number}
                      style={{
                        padding: '1.25rem 1.5rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-cream)',
                        borderLeft: `4px solid ${pillar.color}`
                      }}
                    >
                      <div className="editorial-mono-label" style={{ color: pillar.color, fontSize: '0.72rem', marginBottom: '0.35rem' }}>
                        {pillar.number} / {pillar.title}
                      </div>
                      <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                        {pillar.content}
                      </div>
                    </div>
                  ))}

                  {/* 05 / Next Steps */}
                  <div
                    style={{
                      padding: '1.25rem 1.5rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(231, 111, 130, 0.05)',
                      border: '1px solid rgba(231, 111, 130, 0.2)'
                    }}
                  >
                    <div className="editorial-mono-label" style={{ color: 'var(--coral)', fontSize: '0.72rem', marginBottom: '0.75rem' }}>
                      05 / ACTIONABLE NEXT STEPS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {(aiImprovementPlan.next_steps || []).map((step, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.88rem' }}>
                          <CheckCircle2 size={15} color="var(--coral)" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const text = `INNOVEXA AI Improvement Plan for ${innovation.title}\n\n1. Clarity: ${aiImprovementPlan.clarity}\n2. Feasibility: ${aiImprovementPlan.feasibility}\n3. Differentiation: ${aiImprovementPlan.differentiation}\n4. User Value: ${aiImprovementPlan.user_value}\n\nNext Steps:\n${(aiImprovementPlan.next_steps || []).map(s => `- ${s}`).join('\n')}`;
                      navigator.clipboard.writeText(text);
                      showToast('Improvement plan copied to clipboard!', 'success');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '0.4rem' }}
                  >
                    <Copy size={13} /> COPY SUGGESTIONS
                  </button>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAiImproveModalOpen(false);
                          setIsImproveModalOpen(true);
                          setImprovementChangelog(aiImprovementPlan.clarity || '');
                        }}
                        className="btn btn-coral btn-sm"
                        style={{ gap: '0.4rem' }}
                      >
                        <Edit3 size={13} /> APPLY TO DRAFT / LOG ITERATION
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsAiImproveModalOpen(false)}
                      className="btn btn-ghost btn-sm"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ================= AI FEATURE 2: INNOVATION RESEARCH MODAL FOR SPECIMEN ================= */}
      {showSpecimenResearchModal && (
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
            if (e.target === e.currentTarget) setShowSpecimenResearchModal(false);
          }}
        >
          <div
            className="editorial-card"
            style={{
              width: '100%',
              maxWidth: '840px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-white)',
              borderRadius: 'var(--radius-xl)',
              padding: '2.5rem',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Search size={20} color="var(--green)" />
                <span className="editorial-mono-label" style={{ color: 'var(--green)', fontSize: '0.85rem' }}>
                  INNOVATION RESEARCH AGENT
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSpecimenResearchModal(false)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.85rem' }}
              >
                ✕ Close
              </button>
            </div>

            {isResearchingSpecimen ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--green)', borderRadius: '50%', margin: '0 auto 1rem auto' }} />
                <div className="editorial-mono-label" style={{ color: 'var(--green)', marginBottom: '0.35rem' }}>
                  CROSS-REFERENCING RESEARCH ECOSYSTEMS
                </div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.35rem' }}>Synthesizing Domain Insights & Verified Resources...</h3>
                <p style={{ fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto' }}>
                  Locating verified benchmark datasets, recommended architectures, and strategic implementation pathways.
                </p>
              </div>
            ) : specimenResearchResult ? (
              <div>
                {/* Related Areas */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div className="editorial-mono-label" style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.72rem' }}>
                    RELATED INNOVATION AREAS
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {(specimenResearchResult.related_areas || []).map((area, i) => (
                      <span key={i} className="filter-chip active" style={{ fontSize: '0.78rem' }}>
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tech & Architecture Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div className="editorial-card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-cream)', borderLeft: '4px solid var(--periwinkle)' }}>
                    <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '0.65rem', fontSize: '0.72rem' }}>
                      RECOMMENDED TECHNOLOGIES
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {(specimenResearchResult.recommended_technologies || []).map((t, i) => (
                        <li key={i} style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="editorial-card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-cream)', borderLeft: '4px solid var(--teal)' }}>
                    <div className="editorial-mono-label" style={{ color: 'var(--teal)', marginBottom: '0.65rem', fontSize: '0.72rem' }}>
                      SUGGESTED ARCHITECTURES
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {(specimenResearchResult.suggested_architectures || []).map((a, i) => (
                        <li key={i} style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Verified Datasets & Open Resources */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.65rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={14} /> VERIFIED DATASETS & OPEN REFERENCES
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {(specimenResearchResult.verified_references || []).map((ref, idx) => (
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
                      {(specimenResearchResult.opportunities || []).map((opp, i) => (
                        <li key={i} style={{ fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{opp}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.5rem', fontSize: '0.72rem' }}>
                      IMPLEMENTATION CHALLENGES
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {(specimenResearchResult.implementation_challenges || []).map((ch, i) => (
                        <li key={i} style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{ch}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowSpecimenResearchModal(false)}
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
