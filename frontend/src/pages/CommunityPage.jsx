import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { getCategoryInk, BRAND_COLORS } from '../utils/categoryColors';
import StatusBadge, { StageBadge } from '../components/StatusBadge';
import CountUp from '../components/CountUp';
import { 
  Users, 
  MessageSquare, 
  Share2, 
  PlusCircle, 
  Search, 
  X, 
  SlidersHorizontal, 
  ArrowUpRight, 
  Heart, 
  ThumbsUp, 
  ThumbsDown, 
  ExternalLink, 
  Bookmark, 
  Sparkles, 
  Flame, 
  HelpCircle, 
  Send, 
  CheckCircle2, 
  Clock, 
  Radio, 
  RotateCcw, 
  Code2, 
  FileText, 
  Database, 
  Play, 
  GraduationCap, 
  Layers,
  Award,
  Link as LinkIcon
} from 'lucide-react';

/**
 * CommunityPage — Collaborative Innovation Hub, Resource Exchange & Consensus Engine
 */
export default function CommunityPage({ setActiveTab, setSelectedInnoId, setSelectedRecipientId }) {
  const { currentUser, showToast } = useAuth();

  // Data Collections
  const [posts, setPosts] = useState([]);
  const [resources, setResources] = useState([]);
  const [projectsNeedingFeedback, setProjectsNeedingFeedback] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userBookmarks, setUserBookmarks] = useState([]);
  const [userVotes, setUserVotes] = useState({}); // key: `${targetType}_${targetId}` -> 'upvote' | 'downvote' | null
  const [isLoading, setIsLoading] = useState(true);

  // Active Filter States
  const [contentType, setContentType] = useState('ALL'); // 'ALL' | 'DISCUSSIONS' | 'QUESTIONS' | 'FEEDBACK_REQUESTS' | 'RESOURCES'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST'); // 'NEWEST' | 'TRENDING' | 'MOST_UPVOTED' | 'MOST_DISCUSSED'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Active Selections
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [isNewResourceModalOpen, setIsNewResourceModalOpen] = useState(false);
  const [activeDiscussionItem, setActiveDiscussionItem] = useState(null);
  const [discussionComments, setDiscussionComments] = useState([]);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // New Post Form State
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState('DISCUSSION'); // 'QUESTION' | 'DISCUSSION' | 'FEEDBACK_REQUEST' | 'COLLABORATION' | 'CHALLENGE'
  const [postCategoryId, setPostCategoryId] = useState('cat_ai');
  const [postTagsInput, setPostTagsInput] = useState('');

  // New Resource Form State
  const [resTitle, setResTitle] = useState('');
  const [resDescription, setResDescription] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [resType, setResType] = useState('TOOL'); // 'TOOL' | 'ARTICLE' | 'RESEARCH' | 'GITHUB' | 'API' | 'DATASET' | 'VIDEO' | 'COURSE' | 'OTHER'
  const [resCategoryId, setResCategoryId] = useState('cat_ai');
  const [resTagsInput, setResTagsInput] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [postsRes, resRes, projRes, catRes] = await Promise.all([
        SupabaseService.getCommunityPosts(),
        SupabaseService.getCommunityResources(),
        SupabaseService.getProjects(),
        SupabaseService.getCategories()
      ]);

      const allPosts = postsRes.data || StorageService.getCommunityPosts() || [];
      const allRes = resRes.data || StorageService.getCommunityResources() || [];
      const allProjects = projRes.data || StorageService.getInnovations() || [];
      const allCats = catRes.data || StorageService.getCategories() || [];

      setPosts(allPosts);
      setResources(allRes);
      setCategories(allCats);

      // Projects needing feedback: valid_reviews_count < 10
      const needingReview = allProjects.filter(p => (p.valid_reviews_count || 0) < 10 && !p.is_demo);
      setProjectsNeedingFeedback(needingReview.slice(0, 4));

      if (currentUser) {
        const bookmarks = StorageService.getUserResourceBookmarks(currentUser.id);
        setUserBookmarks(bookmarks);

        // Load active user votes
        const votes = StorageService.getVotes();
        const voteMap = {};
        votes.forEach(v => {
          if (v.user_id === currentUser.id) {
            voteMap[`${v.target_type}_${v.target_id}`] = v.vote_type;
          }
        });
        setUserVotes(voteMap);
      }
    } catch (e) {
      console.warn('Error loading community data:', e);
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

  // Load comments when active discussion item changes
  useEffect(() => {
    if (activeDiscussionItem) {
      const comms = StorageService.getCommunityComments(activeDiscussionItem.id);
      setDiscussionComments(comms);
    }
  }, [activeDiscussionItem]);

  // Handle Polymorphic Vote Toggle
  const handleVote = async (e, targetType, targetId, voteType) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast('Please sign in to vote on community contributions.', 'info');
      return;
    }

    const res = await SupabaseService.toggleVote({
      userId: currentUser.id,
      targetType,
      targetId,
      voteType
    });

    if (res) {
      setUserVotes(prev => ({
        ...prev,
        [`${targetType}_${targetId}`]: res.activeVoteType
      }));

      // Update local state smoothly
      if (targetType === 'discussion') {
        setPosts(prev => prev.map(p => p.id === targetId ? { ...p, upvotes_count: res.upvotesCount, downvotes_count: res.downvotesCount } : p));
        if (activeDiscussionItem?.id === targetId) {
          setActiveDiscussionItem(prev => ({ ...prev, upvotes_count: res.upvotesCount, downvotes_count: res.downvotesCount }));
        }
      } else if (targetType === 'resource') {
        setResources(prev => prev.map(r => r.id === targetId ? { ...r, upvotes_count: res.upvotesCount, downvotes_count: res.downvotesCount } : r));
      } else if (targetType === 'comment') {
        setDiscussionComments(prev => prev.map(c => c.id === targetId ? { ...c, upvotes_count: res.upvotesCount, downvotes_count: res.downvotesCount } : c));
      }
    }
  };

  // Handle Bookmark Toggle
  const handleToggleBookmark = (e, resourceId) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast('Please sign in to bookmark resources.', 'info');
      return;
    }
    const isNowBookmarked = StorageService.toggleResourceBookmark(resourceId, currentUser.id);
    setUserBookmarks(prev => isNowBookmarked ? [...prev, resourceId] : prev.filter(id => id !== resourceId));
    showToast(isNowBookmarked ? 'Resource saved to your bookmarks.' : 'Bookmark removed.', 'info');
  };

  // Submit New Discussion
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please sign in to start a discussion.', 'info');
      return;
    }
    if (!postTitle.trim() || !postContent.trim()) {
      showToast('Please enter a discussion title and explanation.', 'error');
      return;
    }

    const catObj = categories.find(c => c.id === postCategoryId);
    const tags = postTagsInput.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);

    const newPostData = {
      title: postTitle.trim(),
      content: postContent.trim(),
      post_type: postType,
      category_id: postCategoryId,
      category_name: catObj ? catObj.name : 'AI & Machine Learning',
      tags: tags.length > 0 ? tags : ['Innovation', 'Community']
    };

    const res = await SupabaseService.createCommunityPost(newPostData);
    if (res.data) {
      setPosts(prev => [res.data, ...prev]);
      setIsNewPostModalOpen(false);
      setPostTitle('');
      setPostContent('');
      setPostTagsInput('');
      showToast('Discussion launched in the Community Ledger!', 'success');
    }
  };

  // Submit New Resource
  const handleCreateResource = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please sign in to share a resource.', 'info');
      return;
    }
    if (!resTitle.trim() || !resDescription.trim() || !resUrl.trim()) {
      showToast('Please complete all resource fields and URL.', 'error');
      return;
    }

    // URL Validation
    try {
      const parsedUrl = new URL(resUrl.trim());
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        showToast('Please enter a valid https:// resource URL.', 'error');
        return;
      }
    } catch {
      showToast('Please enter a valid, safe URL starting with https://', 'error');
      return;
    }

    const catObj = categories.find(c => c.id === resCategoryId);
    const tags = resTagsInput.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);

    const newResData = {
      title: resTitle.trim(),
      description: resDescription.trim(),
      resource_url: resUrl.trim(),
      resource_type: resType,
      category_id: resCategoryId,
      category_name: catObj ? catObj.name : 'Technology',
      tags: tags.length > 0 ? tags : ['Tool', 'Resource']
    };

    const res = await SupabaseService.createCommunityResource(newResData);
    if (res.data) {
      setResources(prev => [res.data, ...prev]);
      setIsNewResourceModalOpen(false);
      setResTitle('');
      setResDescription('');
      setResUrl('');
      setResTagsInput('');
      showToast('Resource shared with the INNOVEXA community!', 'success');
    }
  };

  // Submit Comment on Discussion
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please sign in to post a reply.', 'info');
      return;
    }
    if (!newCommentContent.trim()) return;

    setIsSubmittingComment(true);
    const commentData = {
      post_id: activeDiscussionItem.id,
      content: newCommentContent.trim()
    };

    const res = await SupabaseService.createCommunityComment(commentData);
    if (res.data) {
      setDiscussionComments(prev => [...prev, res.data]);
      setNewCommentContent('');
      showToast('Reply posted to discussion thread.', 'success');
    }
    setIsSubmittingComment(false);
  };

  // Filtered Discussions
  const filteredPosts = posts.filter(item => {
    if (contentType === 'RESOURCES') return false;
    if (contentType === 'QUESTIONS' && item.post_type !== 'QUESTION') return false;
    if (contentType === 'DISCUSSIONS' && item.post_type !== 'DISCUSSION') return false;
    if (contentType === 'FEEDBACK_REQUESTS' && item.post_type !== 'FEEDBACK_REQUEST') return false;

    if (selectedCategory !== 'ALL') {
      const match = item.category_id === selectedCategory || 
        (item.category_name || '').toLowerCase() === selectedCategory.toLowerCase() ||
        (Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase() === selectedCategory.toLowerCase()));
      if (!match) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match = (item.title || '').toLowerCase().includes(q) ||
        (item.content || '').toLowerCase().includes(q) ||
        (item.author_name || '').toLowerCase().includes(q) ||
        (item.category_name || '').toLowerCase().includes(q) ||
        (Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase().includes(q)));
      if (!match) return false;
    }

    return true;
  });

  // Filtered Resources
  const filteredResources = resources.filter(item => {
    if (contentType !== 'ALL' && contentType !== 'RESOURCES') return false;

    if (selectedCategory !== 'ALL') {
      const match = item.category_id === selectedCategory || 
        (item.category_name || '').toLowerCase() === selectedCategory.toLowerCase() ||
        (Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase() === selectedCategory.toLowerCase()));
      if (!match) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match = (item.title || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.author_name || '').toLowerCase().includes(q) ||
        (item.category_name || '').toLowerCase().includes(q) ||
        (Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase().includes(q)));
      if (!match) return false;
    }

    return true;
  });

  // Sorted items
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'NEWEST') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    if (sortBy === 'MOST_UPVOTED') return (b.upvotes_count || 0) - (a.upvotes_count || 0);
    if (sortBy === 'MOST_DISCUSSED') return (b.comments_count || 0) - (a.comments_count || 0);
    if (sortBy === 'TRENDING') {
      const scoreA = (a.upvotes_count || 0) * 2 + (a.comments_count || 0) * 3;
      const scoreB = (b.upvotes_count || 0) * 2 + (b.comments_count || 0) * 3;
      return scoreB - scoreA;
    }
    return 0;
  });

  const sortedResources = [...filteredResources].sort((a, b) => {
    if (sortBy === 'NEWEST') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    if (sortBy === 'MOST_UPVOTED') return (b.upvotes_count || 0) - (a.upvotes_count || 0);
    return (b.bookmarks_count || 0) - (a.bookmarks_count || 0);
  });

  const postTypeLabels = {
    'QUESTION': { label: 'QUESTION', color: 'var(--coral)', bg: 'rgba(231, 111, 130, 0.12)' },
    'DISCUSSION': { label: 'DISCUSSION', color: 'var(--periwinkle)', bg: 'rgba(113, 134, 216, 0.12)' },
    'FEEDBACK_REQUEST': { label: 'FEEDBACK REQUEST', color: 'var(--teal)', bg: 'rgba(88, 184, 173, 0.12)' },
    'COLLABORATION': { label: 'COLLABORATION', color: 'var(--lavender)', bg: 'rgba(155, 138, 229, 0.12)' },
    'CHALLENGE': { label: 'CHALLENGE', color: 'var(--apricot)', bg: 'rgba(233, 180, 91, 0.12)' }
  };

  const resourceTypeIcons = {
    'TOOL': WrenchIcon,
    'ARTICLE': FileText,
    'RESEARCH': Award,
    'GITHUB': Code2,
    'API': Sparkles,
    'DATASET': Database,
    'VIDEO': Play,
    'COURSE': GraduationCap,
    'OTHER': LinkIcon
  };

  function WrenchIcon(props) {
    return <Sparkles {...props} />;
  }

  // Active Filter Helper
  const isAnyFilterActive = searchQuery.trim() !== '' || contentType !== 'ALL' || selectedCategory !== 'ALL' || sortBy !== 'NEWEST';

  return (
    <div className="workspace-container">
      {/* 1. EDITORIAL HERO HEADER */}
      <section style={{ marginBottom: '2.75rem' }}>
        <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Users size={14} /> 01 / COMMUNITY COLLABORATION HUB
        </div>

        <div style={{ lineHeight: 0.98, marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.8rem, 6vw, 4.8rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
            DISCUSS, SHARE &
          </div>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.8rem, 6vw, 4.8rem)', fontWeight: 800, color: 'var(--coral)', fontStyle: 'italic', margin: '0.2rem 0' }}>
            BUILD CONSENSUS.
          </div>
          <div className="editorial-sans-bold" style={{ fontSize: 'clamp(1.4rem, 3vw, 2.4rem)', color: 'var(--text-secondary)' }}>
            RESEARCH TOOLS, INQUIRIES & PEER DIALOGUE.
          </div>
        </div>

        <p className="editorial-lead" style={{ maxWidth: '680px', color: 'var(--text-secondary)' }}>
          Collaborate with fellow innovators, ask tough architectural questions, exchange research datasets, and scrutinize emerging hypotheses to shape frontier technology.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.75rem' }}>
          <button
            onClick={() => setIsNewPostModalOpen(true)}
            className="btn btn-coral btn-lg"
            style={{ gap: '0.5rem' }}
          >
            <PlusCircle size={16} /> Start a Discussion
          </button>

          <button
            onClick={() => setIsNewResourceModalOpen(true)}
            className="btn btn-secondary btn-lg"
            style={{ gap: '0.5rem', color: 'var(--teal)', borderColor: 'var(--teal)' }}
          >
            <Share2 size={16} /> Share Resource / Tool
          </button>
        </div>
      </section>

      {/* 2. 01 / COMMUNITY PULSE SCORECARD */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.75rem' }}>
          01 / COMMUNITY PULSE LEDGER
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem'
        }}>
          <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--coral)', backgroundColor: 'var(--bg-white)' }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--coral)' }}>
              <CountUp value={posts.length} />
            </div>
            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Active Discussions</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              {posts.length > 0 ? `${posts.reduce((acc, p) => acc + (p.comments_count || 0), 0)} peer replies recorded` : 'Start the first inquiry!'}
            </div>
          </div>

          <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--teal)', backgroundColor: 'var(--bg-white)' }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--teal)' }}>
              <CountUp value={resources.length} />
            </div>
            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Shared Resources</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Tools, datasets, research links & APIs
            </div>
          </div>

          <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--periwinkle)', backgroundColor: 'var(--bg-white)' }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--periwinkle)' }}>
              <CountUp value={projectsNeedingFeedback.length} />
            </div>
            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Seeking Validation</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Specimens awaiting peer review
            </div>
          </div>

          <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--green)', backgroundColor: 'var(--bg-white)' }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--green)', lineHeight: 1.3 }}>
              AI & Tech
            </div>
            <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Top Innovation Domain</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Highest peer engagement
            </div>
          </div>
        </div>
      </section>

      {/* 3. UNIFIED TOOLBAR: SEARCH + FILTER CHIPS + SORTING */}
      <div 
        className="editorial-card" 
        style={{ 
          padding: '1.5rem', 
          marginBottom: '2rem', 
          backgroundColor: 'var(--bg-white)', 
          borderLeft: '4px solid var(--coral)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Top Search Input */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search 
              size={18} 
              color="var(--text-secondary)" 
              style={{ position: 'absolute', left: '1.15rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search discussions, inquiries, resources, author names, tags..."
              className="form-input"
              style={{ 
                paddingLeft: '2.85rem', 
                paddingRight: searchQuery ? '2.75rem' : '1rem',
                borderRadius: 'var(--radius-sm)',
                height: '46px',
                fontSize: '0.95rem',
                backgroundColor: 'var(--bg-ivory)',
                borderColor: 'var(--border-subtle)'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Horizontal Filters & Sorting */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            
            {/* Filter Chips / Selects */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              
              {/* Content Type Filter */}
              <select
                value={contentType}
                onChange={e => setContentType(e.target.value)}
                className="form-select"
                style={{
                  height: '38px',
                  fontSize: '0.84rem',
                  padding: '0.35rem 2rem 0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: contentType !== 'ALL' ? 'var(--bg-cream)' : 'var(--bg-white)',
                  borderColor: contentType !== 'ALL' ? 'var(--coral)' : 'var(--border-medium)',
                  fontWeight: contentType !== 'ALL' ? 700 : 500
                }}
              >
                <option value="ALL">All Contributions</option>
                <option value="DISCUSSIONS">Discussions Only</option>
                <option value="QUESTIONS">Questions Only</option>
                <option value="FEEDBACK_REQUESTS">Feedback Requests</option>
                <option value="RESOURCES">Shared Resources</option>
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="form-select"
                style={{
                  height: '38px',
                  fontSize: '0.84rem',
                  padding: '0.35rem 2rem 0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: selectedCategory !== 'ALL' ? 'var(--bg-cream)' : 'var(--bg-white)',
                  borderColor: selectedCategory !== 'ALL' ? 'var(--coral)' : 'var(--border-medium)',
                  fontWeight: selectedCategory !== 'ALL' ? 700 : 500
                }}
              >
                <option value="ALL">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

            </div>

            {/* Sort Select */}
            <div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="form-select"
                style={{
                  height: '38px',
                  fontSize: '0.84rem',
                  padding: '0.35rem 2rem 0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: sortBy !== 'NEWEST' ? 'var(--bg-cream)' : 'var(--bg-white)',
                  borderColor: sortBy !== 'NEWEST' ? 'var(--coral)' : 'var(--border-medium)',
                  fontWeight: sortBy !== 'NEWEST' ? 700 : 500
                }}
              >
                <option value="NEWEST">Newest First</option>
                <option value="TRENDING">Trending Velocity</option>
                <option value="MOST_UPVOTED">Most Upvoted</option>
                <option value="MOST_DISCUSSED">Most Discussed</option>
              </select>
            </div>

          </div>

        </div>
      </div>

      {/* 4. ACTIVE FILTER CHIPS */}
      {isAnyFilterActive && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <span className="editorial-mono-label" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>ACTIVE FILTERS:</span>
          {contentType !== 'ALL' && (
            <span className="category-tag" onClick={() => setContentType('ALL')} style={{ cursor: 'pointer' }}>
              Type: {contentType} <X size={12} />
            </span>
          )}
          {selectedCategory !== 'ALL' && (
            <span className="category-tag" onClick={() => setSelectedCategory('ALL')} style={{ cursor: 'pointer' }}>
              Category: {categories.find(c => c.id === selectedCategory)?.name || selectedCategory} <X size={12} />
            </span>
          )}
          {searchQuery.trim() && (
            <span className="category-tag" onClick={() => setSearchQuery('')} style={{ cursor: 'pointer' }}>
              Search: "{searchQuery}" <X size={12} />
            </span>
          )}
          <button
            onClick={() => { setContentType('ALL'); setSelectedCategory('ALL'); setSearchQuery(''); setSortBy('NEWEST'); }}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--coral)', fontSize: '0.78rem' }}
          >
            <RotateCcw size={12} /> Reset Filters
          </button>
        </div>
      )}

      {/* 5. 02 / FEATURED & TRENDING DISCUSSIONS */}
      {(contentType !== 'RESOURCES') && (
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.25rem' }}>
                02 / FEATURED DISCUSSIONS
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                Architectural Inquiries & Consensus Threads
              </h2>
            </div>
            <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {sortedPosts.length} ACTIVE THREAD{sortedPosts.length === 1 ? '' : 'S'}
            </span>
          </div>

          {sortedPosts.length === 0 ? (
            <div className="editorial-card" style={{ padding: '3.5rem', textAlign: 'center', backgroundColor: 'var(--bg-cream)' }}>
              <HelpCircle size={36} color="var(--coral)" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>No discussions found for this filter.</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
                Great ideas often start with one question. Start the first discussion in this domain.
              </p>
              <button
                onClick={() => setIsNewPostModalOpen(true)}
                className="btn btn-coral btn-md"
                style={{ gap: '0.45rem' }}
              >
                <PlusCircle size={15} /> Start a Discussion
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {sortedPosts.map(post => {
                const typeConfig = postTypeLabels[post.post_type] || postTypeLabels['DISCUSSION'];
                const userVote = userVotes[`discussion_${post.id}`];

                return (
                  <div
                    key={post.id}
                    onClick={() => setActiveDiscussionItem(post)}
                    className="editorial-card hover-lift"
                    style={{
                      padding: '1.75rem',
                      cursor: 'pointer',
                      borderLeft: `4px solid ${typeConfig.color}`,
                      backgroundColor: 'var(--bg-white)',
                      position: 'relative'
                    }}
                  >
                    {/* Header: Author + Post Type Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img 
                          src={post.author_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(post.author_name || 'Innovator')}&backgroundColor=20212a,e76f82,7186d8`}
                          alt="" 
                          style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border-subtle)' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>{post.author_name}</div>
                          <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            {post.author_headline || 'Community Innovator'} • {new Date(post.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span 
                          style={{
                            fontSize: '0.68rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            color: typeConfig.color,
                            backgroundColor: typeConfig.bg,
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          {typeConfig.label}
                        </span>
                        <span className="category-tag" style={{ fontSize: '0.66rem' }}>
                          {post.category_name}
                        </span>
                      </div>
                    </div>

                    {/* Title & Preview */}
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', lineHeight: 1.25 }}>
                      {post.title}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                      {post.content}
                    </p>

                    {/* Tags */}
                    {Array.isArray(post.tags) && post.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.25rem' }}>
                        {post.tags.map(t => (
                          <span key={t} className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-cream)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bottom Metadata & Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      
                      {/* Voting Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={(e) => handleVote(e, 'discussion', post.id, 'upvote')}
                          className={`btn ${userVote === 'upvote' ? 'btn-coral' : 'btn-secondary'} btn-sm`}
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', gap: '0.3rem' }}
                          title="Upvote discussion"
                        >
                          <ThumbsUp size={13} /> {post.upvotes_count || 0}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleVote(e, 'discussion', post.id, 'downvote')}
                          className={`btn ${userVote === 'downvote' ? 'btn-secondary' : 'btn-ghost'} btn-sm`}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem', color: userVote === 'downvote' ? 'var(--coral)' : 'var(--text-secondary)' }}
                          title="Downvote discussion"
                        >
                          <ThumbsDown size={13} /> {post.downvotes_count > 0 ? post.downvotes_count : ''}
                        </button>
                      </div>

                      {/* Comments count, Direct Chat & Open Discussion CTA */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <MessageSquare size={14} color="var(--periwinkle)" /> {post.comments_count || 0} replies
                        </span>

                        {(post.author_id || post.user_id) && (post.author_id || post.user_id) !== currentUser?.id && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!currentUser) {
                                showToast('Please sign in to message community members.', 'info');
                                return;
                              }
                              const targetId = post.author_id || post.user_id;
                              if (setSelectedRecipientId) setSelectedRecipientId(targetId);
                              setActiveTab('messages');
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.76rem', gap: '0.35rem' }}
                            title="Direct message with author"
                          >
                            <Send size={12} color="var(--coral)" /> Message
                          </button>
                        )}

                        <span className="btn btn-ghost btn-sm" style={{ color: 'var(--coral)', fontWeight: 700, padding: 0 }}>
                          Open Discussion <ArrowUpRight size={13} />
                        </span>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 6. 03 / COMMUNITY RESOURCE SHARING MATRIX */}
      {(contentType === 'ALL' || contentType === 'RESOURCES') && (
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div className="editorial-mono-label" style={{ color: 'var(--teal)', marginBottom: '0.25rem' }}>
                03 / RESOURCE SHARING MATRIX
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                Frontier Tools, Datasets & Research Artifacts
              </h2>
            </div>
            <button
              onClick={() => setIsNewResourceModalOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--teal)', borderColor: 'var(--teal)', gap: '0.35rem' }}
            >
              <PlusCircle size={14} /> Share Resource
            </button>
          </div>

          {sortedResources.length === 0 ? (
            <div className="editorial-card" style={{ padding: '3.5rem', textAlign: 'center', backgroundColor: 'var(--bg-cream)' }}>
              <Share2 size={36} color="var(--teal)" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>No shared resources yet.</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
                Share a tool, dataset, GitHub repository, or research paper that could accelerate another innovator.
              </p>
              <button
                onClick={() => setIsNewResourceModalOpen(true)}
                className="btn btn-secondary btn-md"
                style={{ color: 'var(--teal)', borderColor: 'var(--teal)', gap: '0.45rem' }}
              >
                <Share2 size={15} /> Share Resource
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {sortedResources.map(res => {
                const isBookmarked = userBookmarks.includes(res.id);
                const userVote = userVotes[`resource_${res.id}`];

                return (
                  <div
                    key={res.id}
                    className="editorial-card hover-lift"
                    style={{
                      padding: '1.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderLeft: '4px solid var(--teal)',
                      backgroundColor: 'var(--bg-white)'
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <span 
                            style={{
                              fontSize: '0.68rem',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              color: 'var(--teal)',
                              backgroundColor: 'rgba(88, 184, 173, 0.12)',
                              padding: '0.2rem 0.55rem',
                              borderRadius: 'var(--radius-sm)'
                            }}
                          >
                            {res.resource_type}
                          </span>
                          <span className="category-tag" style={{ fontSize: '0.65rem' }}>
                            {res.category_name}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleToggleBookmark(e, res.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: isBookmarked ? 'var(--coral)' : 'var(--text-secondary)'
                          }}
                          title={isBookmarked ? 'Remove bookmark' : 'Bookmark resource'}
                        >
                          <Bookmark size={16} fill={isBookmarked ? 'var(--coral)' : 'none'} />
                        </button>
                      </div>

                      {/* Title & Description */}
                      <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', lineHeight: 1.25 }}>
                        {res.title}
                      </h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.45, marginBottom: '1rem' }}>
                        {res.description}
                      </p>

                      <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                        Shared by <strong style={{ color: 'var(--text-primary)' }}>{res.author_name}</strong>
                      </div>
                    </div>

                    <div>
                      {/* Bottom Actions: Vote & Open Resource */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={(e) => handleVote(e, 'resource', res.id, 'upvote')}
                            className={`btn ${userVote === 'upvote' ? 'btn-coral' : 'btn-secondary'} btn-sm`}
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.76rem', gap: '0.25rem' }}
                            title="Upvote resource"
                          >
                            <ThumbsUp size={12} /> {res.upvotes_count || 0}
                          </button>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginLeft: '0.3rem' }}>
                            {res.bookmarks_count || 0} saves
                          </span>
                        </div>

                        <a
                          href={res.resource_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--teal)', borderColor: 'var(--teal)', fontWeight: 700, fontSize: '0.78rem', gap: '0.35rem' }}
                        >
                          Open Resource <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 7. 04 / NEEDS FEEDBACK SHOWCASE */}
      {projectsNeedingFeedback.length > 0 && (
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '0.25rem' }}>
                04 / SPECIMENS SEEKING CRITIQUE
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                Help Fellow Innovators Reach Validation Consensus
              </h2>
            </div>
            <span className="mono" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              EARN VALIDATOR REPUTATION POINTS (+10 PTS)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {projectsNeedingFeedback.map(p => {
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
                    padding: '1.5rem',
                    cursor: 'pointer',
                    backgroundColor: 'var(--bg-white)',
                    borderLeft: `4px solid ${ink.hex || 'var(--coral)'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <span className={`category-tag ${ink.tagClass}`} style={{ fontSize: '0.65rem' }}>
                      {p.category_name}
                    </span>
                    <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--coral)', fontWeight: 700 }}>
                      {p.valid_reviews_count || 0}/10 Reviews
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.1rem', marginBottom: '0.35rem', lineHeight: 1.25 }}>
                    {p.title}
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '1rem' }}>
                    {p.short_description || p.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: '0.75rem', fontSize: '0.76rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Created by {p.creator_name}</span>
                    <span style={{ color: 'var(--coral)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      Inspect & Review <ArrowUpRight size={12} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 8. COMMUNITY STARTER GUIDE */}
      <div 
        className="editorial-card" 
        style={{ 
          padding: '2.5rem', 
          backgroundColor: 'var(--bg-cream)', 
          borderLeft: '4px solid var(--periwinkle)',
          marginBottom: '2rem'
        }}
      >
        <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '0.75rem' }}>
          ✦ COMMUNITY REPUTATION GUIDE
        </div>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>How to Participate & Build Validation Authority</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginTop: '1.25rem' }}>
          <div>
            <div className="mono" style={{ color: 'var(--coral)', fontWeight: 800, marginBottom: '0.25rem' }}>01 / DISCUSS</div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
              Post technical questions or feedback requests to gather diverse engineering perspectives.
            </p>
          </div>
          <div>
            <div className="mono" style={{ color: 'var(--teal)', fontWeight: 800, marginBottom: '0.25rem' }}>02 / SHARE</div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
              Contribute useful datasets, open-source code libraries, and research papers to help peers.
            </p>
          </div>
          <div>
            <div className="mono" style={{ color: 'var(--green)', fontWeight: 800, marginBottom: '0.25rem' }}>03 / VALIDATE</div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
              Submit high-quality peer reviews and vote on helpful feedback to earn validator reputation badges.
            </p>
          </div>
        </div>
      </div>

      {/* ================= MODAL 1: START A DISCUSSION ================= */}
      {isNewPostModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 20, 24, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 1000
          }}
          onClick={() => setIsNewPostModalOpen(false)}
        >
          <div 
            className="editorial-card"
            style={{
              width: '100%',
              maxWidth: '620px',
              backgroundColor: 'var(--bg-white)',
              padding: '2.25rem',
              borderLeft: '5px solid var(--coral)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setIsNewPostModalOpen(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>

            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.5rem' }}>
              ✦ NEW COMMUNITY INQUIRY
            </div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Start a Discussion</h2>

            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                  DISCUSSION TYPE
                </label>
                <select
                  value={postType}
                  onChange={e => setPostType(e.target.value)}
                  className="form-select"
                  style={{ width: '100%', height: '42px' }}
                >
                  <option value="DISCUSSION">Discussion (Open Innovation Topic)</option>
                  <option value="QUESTION">Question (Technical or Architectural Problem)</option>
                  <option value="FEEDBACK_REQUEST">Feedback Request (Specimen Critique)</option>
                  <option value="COLLABORATION">Collaboration Request (Team Building)</option>
                  <option value="CHALLENGE">Innovation Challenge (Open Problem)</option>
                </select>
              </div>

              <div>
                <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                  CATEGORY
                </label>
                <select
                  value={postCategoryId}
                  onChange={e => setPostCategoryId(e.target.value)}
                  className="form-select"
                  style={{ width: '100%', height: '42px' }}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                  DISCUSSION TITLE
                </label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={e => setPostTitle(e.target.value)}
                  placeholder="e.g. How can we optimize event-driven sensor meshes for low latency?"
                  className="form-input"
                  style={{ width: '100%', height: '42px' }}
                  required
                />
              </div>

              <div>
                <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                  DETAILED CONTEXT & INQUIRY
                </label>
                <textarea
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  placeholder="Provide background context, technical constraints, hypotheses tested, and specific feedback requested..."
                  className="form-input"
                  style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
                  required
                />
              </div>

              <div>
                <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                  TAGS (COMMA SEPARATED)
                </label>
                <input
                  type="text"
                  value={postTagsInput}
                  onChange={e => setPostTagsInput(e.target.value)}
                  placeholder="Neuromorphic, EdgeComputing, Sensors"
                  className="form-input"
                  style={{ width: '100%', height: '40px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsNewPostModalOpen(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-coral"
                  style={{ padding: '0.65rem 1.75rem' }}
                >
                  Publish Discussion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: SHARE A RESOURCE ================= */}
      {isNewResourceModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 20, 24, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 1000
          }}
          onClick={() => setIsNewResourceModalOpen(false)}
        >
          <div 
            className="editorial-card"
            style={{
              width: '100%',
              maxWidth: '620px',
              backgroundColor: 'var(--bg-white)',
              padding: '2.25rem',
              borderLeft: '5px solid var(--teal)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setIsNewResourceModalOpen(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>

            <div className="editorial-mono-label" style={{ color: 'var(--teal)', marginBottom: '0.5rem' }}>
              ✦ RESOURCE SHARING MATRIX
            </div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Share Resource or Tool</h2>

            <form onSubmit={handleCreateResource} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                  RESOURCE TYPE
                </label>
                <select
                  value={resType}
                  onChange={e => setResType(e.target.value)}
                  className="form-select"
                  style={{ width: '100%', height: '42px' }}
                >
                  <option value="TOOL">Tool / Development Utility</option>
                  <option value="RESEARCH">Research Paper / Publication</option>
                  <option value="GITHUB">GitHub Repository / Open Source</option>
                  <option value="DATASET">Dataset / Benchmark Archive</option>
                  <option value="API">API / SDK / Protocol</option>
                  <option value="ARTICLE">Article / Deep Dive</option>
                  <option value="COURSE">Course / Educational Material</option>
                  <option value="OTHER">Other Innovation Artifact</option>
                </select>
              </div>

              <div>
                <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                  CATEGORY
                </label>
                <select
                  value={resCategoryId}
                  onChange={e => setResCategoryId(e.target.value)}
                  className="form-select"
                  style={{ width: '100%', height: '42px' }}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                  RESOURCE TITLE
                </label>
                <input
                  type="text"
                  value={resTitle}
                  onChange={e => setResTitle(e.target.value)}
                  placeholder="e.g. PhysioNet PTB-XL Benchmark Dataset"
                  className="form-input"
                  style={{ width: '100%', height: '42px' }}
                  required
                />
              </div>

              <div>
                <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                  RESOURCE URL (HTTPS REQUIRED)
                </label>
                <input
                  type="url"
                  value={resUrl}
                  onChange={e => setResUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="form-input"
                  style={{ width: '100%', height: '42px' }}
                  required
                />
              </div>

              <div>
                <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                  DESCRIPTION & VALUE TO INNOVATORS
                </label>
                <textarea
                  value={resDescription}
                  onChange={e => setResDescription(e.target.value)}
                  placeholder="Briefly explain what this resource does and how it helps innovators in this domain..."
                  className="form-input"
                  style={{ width: '100%', minHeight: '90px', resize: 'vertical' }}
                  required
                />
              </div>

              <div>
                <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                  TAGS (COMMA SEPARATED)
                </label>
                <input
                  type="text"
                  value={resTagsInput}
                  onChange={e => setResTagsInput(e.target.value)}
                  placeholder="Benchmark, ECG, OpenSource"
                  className="form-input"
                  style={{ width: '100%', height: '40px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsNewResourceModalOpen(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-secondary"
                  style={{ color: 'var(--teal)', borderColor: 'var(--teal)', padding: '0.65rem 1.75rem' }}
                >
                  Share Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: DISCUSSION THREAD & COMMENTS ================= */}
      {activeDiscussionItem && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 20, 24, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 1000
          }}
          onClick={() => setActiveDiscussionItem(null)}
        >
          <div 
            className="editorial-card"
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-white)',
              padding: '2.5rem',
              borderLeft: '5px solid var(--coral)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveDiscussionItem(null)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>

            {/* Top Post Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span className="editorial-mono-label" style={{ color: 'var(--coral)', fontSize: '0.74rem' }}>
                ✦ {activeDiscussionItem.post_type}
              </span>
              <span className="category-tag" style={{ fontSize: '0.66rem' }}>
                {activeDiscussionItem.category_name}
              </span>
            </div>

            <h2 style={{ fontSize: '1.85rem', lineHeight: 1.25, marginBottom: '1rem' }}>
              {activeDiscussionItem.title}
            </h2>

            {/* Author Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img 
                  src={activeDiscussionItem.author_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeDiscussionItem.author_name || 'Innovator')}&backgroundColor=20212a,e76f82,7186d8`}
                  alt="" 
                  style={{ width: '42px', height: '42px', borderRadius: '50%' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{activeDiscussionItem.author_name}</div>
                  <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    {activeDiscussionItem.author_headline} • Published on {new Date(activeDiscussionItem.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </div>
                </div>
              </div>

              {(activeDiscussionItem.author_id || activeDiscussionItem.user_id) && (activeDiscussionItem.author_id || activeDiscussionItem.user_id) !== currentUser?.id && (
                <button
                  type="button"
                  onClick={() => {
                    const targetId = activeDiscussionItem.author_id || activeDiscussionItem.user_id;
                    if (setSelectedRecipientId) setSelectedRecipientId(targetId);
                    setActiveDiscussionItem(null);
                    setActiveTab('messages');
                  }}
                  className="btn btn-coral btn-sm"
                  style={{ gap: '0.4rem', fontWeight: 700 }}
                >
                  <Send size={13} /> Direct Message Author
                </button>
              )}
            </div>

            {/* Full Post Body */}
            <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '1.02rem', lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>
                {activeDiscussionItem.content}
              </p>
            </div>

            {/* Voting Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={(e) => handleVote(e, 'discussion', activeDiscussionItem.id, 'upvote')}
                  className={`btn ${userVotes[`discussion_${activeDiscussionItem.id}`] === 'upvote' ? 'btn-coral' : 'btn-secondary'} btn-sm`}
                  style={{ gap: '0.35rem' }}
                >
                  <ThumbsUp size={14} /> Helpful ({activeDiscussionItem.upvotes_count || 0})
                </button>
                <button
                  type="button"
                  onClick={(e) => handleVote(e, 'discussion', activeDiscussionItem.id, 'downvote')}
                  className={`btn ${userVotes[`discussion_${activeDiscussionItem.id}`] === 'downvote' ? 'btn-secondary' : 'btn-ghost'} btn-sm`}
                  style={{ color: userVotes[`discussion_${activeDiscussionItem.id}`] === 'downvote' ? 'var(--coral)' : 'var(--text-secondary)' }}
                >
                  <ThumbsDown size={14} />
                </button>
              </div>

              <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {discussionComments.length} Community Replies
              </span>
            </div>

            {/* Comments Thread */}
            <div style={{ marginBottom: '2rem' }}>
              <div className="editorial-mono-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                PEER REPLIES & INSIGHTS
              </div>

              {discussionComments.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', padding: '1rem 0' }}>
                  No replies recorded yet. Be the first to provide engineering insight or perspective.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {discussionComments.map(c => {
                    const cVote = userVotes[`comment_${c.id}`];
                    return (
                      <div key={c.id} style={{ backgroundColor: 'var(--bg-ivory)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--border-medium)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img src={c.author_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.author_name || 'Member')}&backgroundColor=20212a,58b8ad,9b8ae5`} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                            <strong style={{ fontSize: '0.9rem' }}>{c.author_name}</strong>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            {c.author_id && c.author_id !== currentUser?.id && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (setSelectedRecipientId) setSelectedRecipientId(c.author_id);
                                  setActiveDiscussionItem(null);
                                  setActiveTab('messages');
                                }}
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize: '0.72rem', padding: '2px 6px', color: 'var(--coral)', gap: '0.25rem' }}
                                title="Message commenter"
                              >
                                <MessageSquare size={11} /> Message
                              </button>
                            )}
                            <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                              {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
                          {c.content}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={(e) => handleVote(e, 'comment', c.id, 'upvote')}
                            className={`btn ${cVote === 'upvote' ? 'btn-coral' : 'btn-ghost'} btn-sm`}
                            style={{ fontSize: '0.72rem', padding: '2px 6px', gap: '0.25rem' }}
                          >
                            <ThumbsUp size={11} /> {c.upvotes_count || 0}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '1.25rem' }}>
              <div className="editorial-mono-label" style={{ fontSize: '0.7rem', color: 'var(--coral)', marginBottom: '0.45rem' }}>
                CONTRIBUTE AN INSIGHT
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  value={newCommentContent}
                  onChange={e => setNewCommentContent(e.target.value)}
                  placeholder="Write a constructive response or research reference..."
                  className="form-input"
                  style={{ flex: 1, height: '44px' }}
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment}
                  className="btn btn-coral"
                  style={{ gap: '0.35rem' }}
                >
                  <Send size={14} /> Post
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
