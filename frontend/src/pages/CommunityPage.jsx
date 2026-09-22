import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { getCategoryInk, BRAND_COLORS } from '../utils/categoryColors';
import StatusBadge, { StageBadge } from '../components/StatusBadge';
import CountUp from '../components/CountUp';
import CommunityOpenChat from '../components/CommunityOpenChat';
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
  Edit2,
  Trash2,
  CornerDownRight,
  Link as LinkIcon
} from 'lucide-react';

/**
 * CommunityPage — Collaborative Innovation Hub, Resource Exchange & Consensus Engine
 */
export default function CommunityPage({ setActiveTab, setSelectedInnoId, setSelectedRecipientId, setViewUserId }) {
  const { currentUser, showToast } = useAuth();

  // Mode: 'DISCUSSIONS' | 'OPEN_CHAT'
  const [communityMode, setCommunityMode] = useState('DISCUSSIONS');

  // Data Collections
  const [posts, setPosts] = useState([]);
  const [resources, setResources] = useState([]);
  const [projectsNeedingFeedback, setProjectsNeedingFeedback] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userBookmarks, setUserBookmarks] = useState([]);
  const [userVotes, setUserVotes] = useState({}); // key: `discussion_${id}` -> 'like' | 'dislike' | null
  const [isLoading, setIsLoading] = useState(true);

  // Active Filter States
  const [contentType, setContentType] = useState('ALL'); // 'ALL' | 'DISCUSSION' | 'QUESTION' | 'RESOURCE' | 'ANNOUNCEMENT' | 'FEEDBACK'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST'); // 'NEWEST' | 'OLDEST' | 'MOST_LIKED' | 'MOST_COMMENTED' | 'TRENDING'
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Modals & Active Selections
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [isNewResourceModalOpen, setIsNewResourceModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null); // Post object for editing
  const [activeDiscussionItem, setActiveDiscussionItem] = useState(null);
  const [discussionComments, setDiscussionComments] = useState([]);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [replyingToComment, setReplyingToComment] = useState(null); // { id, author_name }
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // New Post Form State
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState('DISCUSSION'); // 'DISCUSSION' | 'QUESTION' | 'RESOURCE' | 'ANNOUNCEMENT' | 'FEEDBACK'
  const [postCategoryId, setPostCategoryId] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [postTagsInput, setPostTagsInput] = useState('');

  // Edit Post Form State
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState('DISCUSSION');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editTagsInput, setEditTagsInput] = useState('');

  // New Resource Form State
  const [resTitle, setResTitle] = useState('');
  const [resDescription, setResDescription] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [resType, setResType] = useState('TOOL'); // 'TOOL' | 'ARTICLE' | 'RESEARCH' | 'GITHUB' | 'API' | 'DATASET' | 'VIDEO' | 'COURSE' | 'OTHER'
  const [resCategoryId, setResCategoryId] = useState('');
  const [resTagsInput, setResTagsInput] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [postsRes, projRes, catRes] = await Promise.all([
        SupabaseService.getCommunityPosts(),
        SupabaseService.getProjects(),
        SupabaseService.getCategories()
      ]);

      const allPosts = postsRes.data || [];
      const allProjects = projRes.data || [];
      const allCats = catRes.data || [];
      const allResources = StorageService.getCommunityResources() || [];

      setPosts(allPosts);
      setCategories(allCats);
      setResources(allResources);

      if (allCats.length > 0) {
        if (!postCategoryId) setPostCategoryId(allCats[0].id);
        if (!resCategoryId) setResCategoryId(allCats[0].id);
      }

      // Projects needing feedback: valid_reviews_count < 10
      const needingReview = allProjects.filter(p => (p.valid_reviews_count || 0) < 10 && !p.is_demo);
      setProjectsNeedingFeedback(needingReview.slice(0, 4));

      if (currentUser) {
        const bookmarks = StorageService.getUserResourceBookmarks(currentUser.id);
        setUserBookmarks(bookmarks);

        // Fetch user vote status for each post
        allPosts.forEach(async (p) => {
          const vRes = await SupabaseService.getCommunityVotes(p.id, currentUser.id);
          if (vRes.userVote) {
            setUserVotes(prev => ({
              ...prev,
              [`discussion_${p.id}`]: vRes.userVote
            }));
          }
        });

        // Fetch user vote status for each resource
        allResources.forEach((r) => {
          const uv = StorageService.getUserVote({ userId: currentUser.id, targetType: 'resource', targetId: r.id });
          if (uv) {
            setUserVotes(prev => ({
              ...prev,
              [`resource_${r.id}`]: uv === 'upvote' || uv === 'like' ? 'like' : null
            }));
          }
        });
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

  // Load comments when active discussion item changes with Realtime sync
  useEffect(() => {
    if (!activeDiscussionItem) {
      setDiscussionComments([]);
      return;
    }

    let isActive = true;
    const fetchComments = async () => {
      const res = await SupabaseService.getCommunityComments(activeDiscussionItem.id);
      if (isActive && res.data) {
        setDiscussionComments(res.data);
      }
    };

    fetchComments();

    const unsub = SupabaseService.subscribeToCommunityComments(activeDiscussionItem.id, () => {
      if (isActive) fetchComments();
    });

    return () => {
      isActive = false;
      if (typeof unsub === 'function') unsub();
    };
  }, [activeDiscussionItem?.id]);

  // Handle Community Vote Toggle (like / dislike) with Instant Optimistic UI
  const handleVote = async (e, targetType = 'discussion', targetId, voteType = 'like') => {
    e.stopPropagation();
    const effectiveUser = currentUser || StorageService.getCurrentUser() || { id: 'usr_guest_voter', name: 'Community Member' };
    if (!effectiveUser?.id) {
      showToast('Please sign in to vote on community contributions.', 'info');
      return;
    }

    const cleanVoteType = (voteType === 'dislike' || voteType === 'downvote') ? 'dislike' : 'like';
    const voteKey = `${targetType}_${targetId}`;
    const prevVote = userVotes[voteKey] || null;

    if (targetType === 'discussion') {
      const targetPost = posts.find(p => p.id === targetId) || (activeDiscussionItem?.id === targetId ? activeDiscussionItem : null);
      const prevLikes = targetPost?.likes_count || targetPost?.upvotes_count || 0;
      const prevDislikes = targetPost?.dislikes_count || targetPost?.downvotes_count || 0;

      let nextVote = null;
      let nextLikes = prevLikes;
      let nextDislikes = prevDislikes;

      if (prevVote === cleanVoteType) {
        // Toggle off
        nextVote = null;
        if (cleanVoteType === 'like') nextLikes = Math.max(0, prevLikes - 1);
        else nextDislikes = Math.max(0, prevDislikes - 1);
      } else {
        // Switch or new vote
        nextVote = cleanVoteType;
        if (cleanVoteType === 'like') {
          nextLikes = prevLikes + 1;
          if (prevVote === 'dislike') nextDislikes = Math.max(0, prevDislikes - 1);
        } else {
          nextDislikes = prevDislikes + 1;
          if (prevVote === 'like') nextLikes = Math.max(0, prevLikes - 1);
        }
      }

      // 1. Instant optimistic UI update (0ms latency!)
      setUserVotes(prev => ({ ...prev, [voteKey]: nextVote }));
      setPosts(prev => prev.map(p => p.id === targetId ? {
        ...p,
        likes_count: nextLikes,
        upvotes_count: nextLikes,
        dislikes_count: nextDislikes,
        downvotes_count: nextDislikes
      } : p));

      if (activeDiscussionItem?.id === targetId) {
        setActiveDiscussionItem(prev => ({
          ...prev,
          likes_count: nextLikes,
          upvotes_count: nextLikes,
          dislikes_count: nextDislikes,
          downvotes_count: nextDislikes
        }));
      }

      // 2. Background sync with database
      try {
        await SupabaseService.voteCommunityPost({
          postId: targetId,
          userId: effectiveUser.id,
          voteType: cleanVoteType
        });
      } catch (err) {
        console.warn('Error voting on discussion, rolling back:', err);
        setUserVotes(prev => ({ ...prev, [voteKey]: prevVote }));
        setPosts(prev => prev.map(p => p.id === targetId ? {
          ...p,
          likes_count: prevLikes,
          upvotes_count: prevLikes,
          dislikes_count: prevDislikes,
          downvotes_count: prevDislikes
        } : p));
        if (activeDiscussionItem?.id === targetId) {
          setActiveDiscussionItem(prev => ({
            ...prev,
            likes_count: prevLikes,
            upvotes_count: prevLikes,
            dislikes_count: prevDislikes,
            downvotes_count: prevDislikes
          }));
        }
      }
    } else if (targetType === 'resource') {
      const targetRes = resources.find(r => r.id === targetId);
      const prevLikes = targetRes?.upvotes_count || 0;
      const nextVote = prevVote === 'like' ? null : 'like';
      const nextLikes = nextVote === 'like' ? prevLikes + 1 : Math.max(0, prevLikes - 1);

      // 1. Instant optimistic UI update (0ms latency!)
      setUserVotes(prev => ({ ...prev, [voteKey]: nextVote }));
      setResources(prev => prev.map(r => r.id === targetId ? {
        ...r,
        upvotes_count: nextLikes
      } : r));

      // 2. Background sync with storage
      try {
        StorageService.toggleVote({
          userId: effectiveUser.id,
          targetType: 'resource',
          targetId: targetId,
          voteType: 'upvote'
        });
      } catch (err) {
        console.warn('Error voting on resource, rolling back:', err);
        setUserVotes(prev => ({ ...prev, [voteKey]: prevVote }));
        setResources(prev => prev.map(r => r.id === targetId ? {
          ...r,
          upvotes_count: prevLikes
        } : r));
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

  // Submit New Discussion / Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please sign in to create a post.', 'info');
      return;
    }
    if (!postTitle.trim() || !postContent.trim()) {
      showToast('Please enter a post title and explanation.', 'error');
      return;
    }

    const catObj = categories.find(c => c.id === postCategoryId);
    const tags = postTagsInput.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);

    const newPostData = {
      title: postTitle.trim(),
      content: postContent.trim(),
      post_type: postType,
      category_id: postCategoryId || (categories[0]?.id || null),
      category_name: catObj ? catObj.name : 'General',
      image_url: postImageUrl.trim(),
      tags: tags.length > 0 ? tags : ['Innovation', 'Community']
    };

    const res = await SupabaseService.createCommunityPost(newPostData);
    if (res.data) {
      setPosts(prev => [res.data, ...prev]);
      setIsNewPostModalOpen(false);
      setPostTitle('');
      setPostContent('');
      setPostImageUrl('');
      setPostTagsInput('');
      showToast('Contribution published to Community Ledger!', 'success');
    }
  };

  // Open Edit Post Modal
  const handleOpenEditPost = (e, post) => {
    e.stopPropagation();
    setEditingPost(post);
    setEditTitle(post.title || '');
    setEditContent(post.content || '');
    setEditType(post.post_type || 'DISCUSSION');
    setEditCategoryId(post.category_id || categories[0]?.id || '');
    setEditImageUrl(post.image_url || '');
    setEditTagsInput(Array.isArray(post.tags) ? post.tags.join(', ') : '');
  };

  // Submit Edit Post
  const handleUpdatePost = async (e) => {
    e.preventDefault();
    if (!editingPost || !currentUser) return;
    if (!editTitle.trim() || !editContent.trim()) {
      showToast('Please enter a title and content.', 'error');
      return;
    }

    const catObj = categories.find(c => c.id === editCategoryId);
    const tags = editTagsInput.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);

    const updates = {
      title: editTitle.trim(),
      content: editContent.trim(),
      post_type: editType,
      category_id: editCategoryId,
      category_name: catObj ? catObj.name : editingPost.category_name,
      image_url: editImageUrl.trim(),
      tags: tags
    };

    const res = await SupabaseService.updateCommunityPost(editingPost.id, updates, currentUser.id);
    if (res.data) {
      setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, ...updates } : p));
      if (activeDiscussionItem?.id === editingPost.id) {
        setActiveDiscussionItem(prev => ({ ...prev, ...updates }));
      }
      setEditingPost(null);
      showToast('Post updated successfully!', 'success');
    } else {
      showToast(res.error?.message || 'Failed to update post.', 'error');
    }
  };

  // Delete Post
  const handleDeletePost = async (e, postId) => {
    e.stopPropagation();
    if (!currentUser) return;
    if (!window.confirm('Are you sure you want to delete this community post?')) return;

    const res = await SupabaseService.deleteCommunityPost(postId, currentUser.id);
    if (res.success) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      if (activeDiscussionItem?.id === postId) {
        setActiveDiscussionItem(null);
      }
      showToast('Post deleted.', 'info');
    } else {
      showToast(res.error?.message || 'Failed to delete post.', 'error');
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
      category_id: resCategoryId || (categories[0]?.id || null),
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

  // Submit Comment or Reply
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
      content: newCommentContent.trim(),
      parent_comment_id: replyingToComment ? replyingToComment.id : null
    };

    const res = await SupabaseService.createCommunityComment(commentData);
    if (res.data) {
      setDiscussionComments(prev => [...prev, res.data]);
      setNewCommentContent('');
      setReplyingToComment(null);
      setPosts(prev => prev.map(p => p.id === activeDiscussionItem.id ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
      setActiveDiscussionItem(prev => ({ ...prev, comments_count: (prev.comments_count || 0) + 1 }));
      showToast(replyingToComment ? 'Reply posted.' : 'Comment posted to thread.', 'success');
    }
    setIsSubmittingComment(false);
  };

  // Delete Comment
  const handleDeleteComment = async (commentId) => {
    if (!currentUser) return;
    if (!window.confirm('Delete this comment?')) return;
    const res = await SupabaseService.deleteCommunityComment(commentId, currentUser.id);
    if (res?.success !== false) {
      setDiscussionComments(prev => prev.filter(c => c.id !== commentId && c.parent_comment_id !== commentId));
      showToast('Comment deleted.', 'info');
    }
  };

  // Filtered Posts
  const filteredPosts = posts.filter(item => {
    const itemType = (item.post_type || 'DISCUSSION').toUpperCase();
    if (contentType !== 'ALL' && itemType !== contentType.toUpperCase()) {
      return false;
    }

    if (selectedCategory !== 'ALL') {
      const match = item.category_id === selectedCategory || 
        (item.category_name || '').toLowerCase() === selectedCategory.toLowerCase() ||
        (Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase() === selectedCategory.toLowerCase()));
      if (!match) return false;
    }

    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase().trim();
      const match = (item.title || '').toLowerCase().includes(q) ||
        (item.content || '').toLowerCase().includes(q) ||
        (item.author_name || '').toLowerCase().includes(q) ||
        (item.category_name || '').toLowerCase().includes(q) ||
        (Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase().includes(q))) ||
        (typeof item.tags === 'string' && item.tags.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Filtered Resources
  const filteredResources = resources.filter(item => {
    if (contentType !== 'ALL' && contentType !== 'RESOURCE') return false;

    if (selectedCategory !== 'ALL') {
      const match = item.category_id === selectedCategory || 
        (item.category_name || '').toLowerCase() === selectedCategory.toLowerCase() ||
        (Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase() === selectedCategory.toLowerCase()));
      if (!match) return false;
    }

    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase().trim();
      const match = (item.title || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.author_name || '').toLowerCase().includes(q) ||
        (item.category_name || '').toLowerCase().includes(q) ||
        (Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase().includes(q))) ||
        (typeof item.tags === 'string' && item.tags.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Sorted items
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'NEWEST' || sortBy === 'LATEST') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    if (sortBy === 'OLDEST') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    if (sortBy === 'MOST_LIKED' || sortBy === 'MOST_UPVOTED') return (b.upvotes_count || b.likes_count || 0) - (a.upvotes_count || a.likes_count || 0);
    if (sortBy === 'MOST_COMMENTED' || sortBy === 'MOST_DISCUSSED') return (b.comments_count || 0) - (a.comments_count || 0);
    if (sortBy === 'TRENDING') {
      const scoreA = (a.upvotes_count || a.likes_count || 0) * 2 + (a.comments_count || 0) * 3;
      const scoreB = (b.upvotes_count || b.likes_count || 0) * 2 + (b.comments_count || 0) * 3;
      return scoreB - scoreA;
    }
    return 0;
  });

  const sortedResources = [...filteredResources].sort((a, b) => {
    if (sortBy === 'NEWEST' || sortBy === 'LATEST') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    if (sortBy === 'OLDEST') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    if (sortBy === 'MOST_LIKED' || sortBy === 'MOST_UPVOTED') return (b.upvotes_count || 0) - (a.upvotes_count || 0);
    return (b.bookmarks_count || 0) - (a.bookmarks_count || 0);
  });

  // Post Type Badges Configuration (Support 5 Types: discussion, question, resource, announcement, feedback)
  const postTypeLabels = {
    'DISCUSSION': { label: 'DISCUSSION', color: 'var(--periwinkle)', bg: 'rgba(113, 134, 216, 0.12)' },
    'QUESTION': { label: 'QUESTION', color: 'var(--coral)', bg: 'rgba(231, 111, 130, 0.12)' },
    'RESOURCE': { label: 'RESOURCE', color: 'var(--teal)', bg: 'rgba(88, 184, 173, 0.12)' },
    'ANNOUNCEMENT': { label: 'ANNOUNCEMENT', color: 'var(--apricot)', bg: 'rgba(233, 180, 91, 0.12)' },
    'FEEDBACK': { label: 'FEEDBACK', color: 'var(--lavender)', bg: 'rgba(155, 138, 229, 0.12)' },
    'FEEDBACK_REQUEST': { label: 'FEEDBACK', color: 'var(--lavender)', bg: 'rgba(155, 138, 229, 0.12)' },
    'COLLABORATION': { label: 'COLLABORATION', color: 'var(--teal)', bg: 'rgba(88, 184, 173, 0.12)' },
    'CHALLENGE': { label: 'CHALLENGE', color: 'var(--coral)', bg: 'rgba(231, 111, 130, 0.12)' }
  };

  const isAnyFilterActive = searchQuery.trim() !== '' || contentType !== 'ALL' || selectedCategory !== 'ALL' || (sortBy !== 'NEWEST' && sortBy !== 'LATEST');

  // Helper to separate top-level comments and nested replies
  const rootComments = discussionComments.filter(c => !c.parent_comment_id);
  const getRepliesForComment = (parentId) => discussionComments.filter(c => c.parent_comment_id === parentId);

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
            RESEARCH INQUIRIES, QUESTIONS & PEER DIALOGUE.
          </div>
        </div>

        <p className="editorial-lead" style={{ maxWidth: '680px', color: 'var(--text-secondary)' }}>
          Collaborate with fellow innovators, ask tough architectural questions, exchange research datasets, and scrutinize emerging hypotheses to shape frontier technology.
        </p>

        {/* Action Buttons & Mode Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', marginTop: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsNewPostModalOpen(true)}
              className="btn btn-coral"
              style={{ gap: '0.5rem' }}
            >
              <PlusCircle size={16} /> Start a Discussion
            </button>

            <button
              onClick={() => setIsNewResourceModalOpen(true)}
              className="btn btn-secondary"
              style={{ gap: '0.5rem', color: 'var(--teal)', borderColor: 'var(--teal)' }}
            >
              <Share2 size={16} /> Share Resource
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: 'var(--bg-white)', padding: '0.35rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-hairline)' }}>
            <button
              onClick={() => setCommunityMode('DISCUSSIONS')}
              className={`btn btn-sm ${communityMode === 'DISCUSSIONS' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-pill)', gap: '0.4rem' }}
            >
              <FileText size={14} /> Discussions & Articles
            </button>
            <button
              onClick={() => setCommunityMode('OPEN_CHAT')}
              className={`btn btn-sm ${communityMode === 'OPEN_CHAT' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-pill)', gap: '0.4rem' }}
            >
              <Radio size={14} color="var(--signal-green)" className="animate-pulse" /> Live Open Chat 💬
            </button>
          </div>
        </div>
      </section>

      {/* RENDER LIVE OPEN CHAT WHEN SELECTED */}
      {communityMode === 'OPEN_CHAT' && (
        <CommunityOpenChat 
          setActiveTab={setActiveTab} 
          setSelectedInnoId={setSelectedInnoId} 
        />
      )}

      {/* RENDER REGULAR DISCUSSIONS & SCORECARD WHEN DISCUSSIONS SELECTED */}
      {communityMode === 'DISCUSSIONS' && (
        <>
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
                <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Active Contributions</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  {posts.length > 0 ? `${posts.reduce((acc, p) => acc + (p.comments_count || 0), 0)} peer replies recorded` : 'Start the first discussion!'}
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
                  Frontier Tech
                </div>
                <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Top Innovation Domain</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Highest peer engagement
                </div>
              </div>
            </div>
          </section>

          {/* 3. UNIFIED SEARCH & FILTER TOOLBAR */}
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
          
          {/* Search Input */}
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
              placeholder="Search posts, questions, feedback requests, author names, tags..."
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
            
            {/* Filter Selects */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              
              {/* Post Type Filter (Support 5 Types) */}
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
                <option value="ALL">All Post Types</option>
                <option value="DISCUSSION">Discussions</option>
                <option value="QUESTION">Questions</option>
                <option value="RESOURCE">Resources</option>
                <option value="ANNOUNCEMENT">Announcements</option>
                <option value="FEEDBACK">Feedback Requests</option>
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
                <option value="NEWEST">Latest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="MOST_LIKED">Most Liked</option>
                <option value="MOST_COMMENTED">Most Commented</option>
                <option value="TRENDING">Trending Velocity</option>
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

      {/* 5. 02 / COMMUNITY POSTS FEED */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.25rem' }}>
              02 / COMMUNITY CONTRIBUTIONS & INQUIRIES
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              Peer Dialogue & Consensus Threads
            </h2>
          </div>
          <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {sortedPosts.length} POST{sortedPosts.length === 1 ? '' : 'S'}
          </span>
        </div>

        {/* Empty State */}
        {sortedPosts.length === 0 ? (
          <div className="editorial-card" style={{ padding: '3.5rem', textAlign: 'center', backgroundColor: 'var(--bg-cream)' }}>
            <HelpCircle size={36} color="var(--coral)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>No community posts found.</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
              Every breakthrough begins with an open inquiry. Start the first post or discussion thread in this category.
            </p>
            <button
              onClick={() => setIsNewPostModalOpen(true)}
              className="btn btn-coral btn-md"
              style={{ gap: '0.45rem' }}
            >
              <PlusCircle size={15} /> Create the First Post
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {sortedPosts.map(post => {
              const normType = (post.post_type || 'DISCUSSION').toUpperCase();
              const typeConfig = postTypeLabels[normType] || postTypeLabels['DISCUSSION'];
              const userVote = userVotes[`discussion_${post.id}`];
              const isAuthor = currentUser && (post.user_id === currentUser.id || post.author_id === currentUser.id);

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
                  {/* Header: Author + Post Type Badge + Author Edit/Delete Controls */}
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
                      {/* Author Edit & Delete buttons */}
                      {isAuthor && (
                        <div style={{ display: 'flex', gap: '0.35rem', marginRight: '0.25rem' }}>
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditPost(e, post)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', gap: '0.25rem' }}
                            title="Edit post"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeletePost(e, post.id)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0.2rem 0.45rem', fontSize: '0.72rem', color: 'var(--coral)' }}
                            title="Delete post"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}

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

                  {/* Optional Image */}
                  {post.image_url && (
                    <div style={{ marginBottom: '1.25rem', maxHeight: '240px', overflow: 'hidden', borderRadius: 'var(--radius-sm)' }}>
                      <img src={post.image_url} alt="" style={{ width: '100%', height: 'auto', objectFit: 'cover' }} />
                    </div>
                  )}

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

                  {/* Bottom Metadata & Voting / Comments */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    
                    {/* Voting: Like & Dislike */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={(e) => handleVote(e, 'discussion', post.id, 'like')}
                        className={`btn ${userVote === 'like' ? 'btn-coral' : 'btn-secondary'} btn-sm`}
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', gap: '0.3rem' }}
                        title="Like post"
                      >
                        <ThumbsUp size={13} /> {post.likes_count || post.upvotes_count || 0}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleVote(e, 'discussion', post.id, 'dislike')}
                        className={`btn ${userVote === 'dislike' ? 'btn-secondary' : 'btn-ghost'} btn-sm`}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem', color: userVote === 'dislike' ? 'var(--coral)' : 'var(--text-secondary)' }}
                        title="Dislike post"
                      >
                        <ThumbsDown size={13} /> {post.dislikes_count || post.downvotes_count || ''}
                      </button>
                    </div>

                    {/* Comments count & Open CTA */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <MessageSquare size={14} color="var(--periwinkle)" /> {post.comments_count || 0} replies
                      </span>

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

      {/* 6. 03 / COMMUNITY RESOURCE SHARING MATRIX */}
      {(contentType === 'ALL' || contentType === 'RESOURCE') && (
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
                      {/* Bottom Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={(e) => handleVote(e, 'resource', res.id, 'like')}
                            className={`btn ${userVote === 'like' ? 'btn-coral' : 'btn-secondary'} btn-sm`}
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.76rem', gap: '0.25rem' }}
                            title="Like resource"
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

      {/* 7. 04 / SPECIMENS SEEKING CRITIQUE */}
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
      </>
      )}

      {/* ================= MODAL 1: START A POST / DISCUSSION ================= */}
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
              ✦ NEW COMMUNITY POST
            </div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Publish Contribution</h2>

            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                  POST TYPE
                </label>
                <select
                  value={postType}
                  onChange={e => setPostType(e.target.value)}
                  className="form-select"
                  style={{ width: '100%', height: '42px' }}
                >
                  <option value="DISCUSSION">Discussion (Open Innovation Topic)</option>
                  <option value="QUESTION">Question (Technical or Architectural Problem)</option>
                  <option value="RESOURCE">Resource (Tool, Dataset, or Article)</option>
                  <option value="ANNOUNCEMENT">Announcement (Update or Milestone)</option>
                  <option value="FEEDBACK">Feedback Request (Specimen Critique)</option>
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
                  TITLE
                </label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={e => setPostTitle(e.target.value)}
                  placeholder="e.g. Optimizing low-latency distributed telemetry streams..."
                  className="form-input"
                  style={{ width: '100%', height: '42px' }}
                  required
                />
              </div>

              <div>
                <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                  CONTENT & CONTEXT
                </label>
                <textarea
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  placeholder="Provide background context, technical specifications, hypotheses tested, or discussion points..."
                  className="form-input"
                  style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
                  required
                />
              </div>

              <div>
                <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                  BANNER / DIAGRAM IMAGE URL (OPTIONAL)
                </label>
                <input
                  type="url"
                  value={postImageUrl}
                  onChange={e => setPostImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="form-input"
                  style={{ width: '100%', height: '40px' }}
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
                  Publish Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: EDIT POST ================= */}
      {editingPost && (
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
          onClick={() => setEditingPost(null)}
        >
          <div 
            className="editorial-card"
            style={{
              width: '100%',
              maxWidth: '620px',
              backgroundColor: 'var(--bg-white)',
              padding: '2.25rem',
              borderLeft: '5px solid var(--periwinkle)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setEditingPost(null)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>

            <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '0.5rem' }}>
              ✦ EDIT COMMUNITY POST
            </div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Update Post</h2>

            <form onSubmit={handleUpdatePost} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                  POST TYPE
                </label>
                <select
                  value={editType}
                  onChange={e => setEditType(e.target.value)}
                  className="form-select"
                  style={{ width: '100%', height: '42px' }}
                >
                  <option value="DISCUSSION">Discussion</option>
                  <option value="QUESTION">Question</option>
                  <option value="RESOURCE">Resource</option>
                  <option value="ANNOUNCEMENT">Announcement</option>
                  <option value="FEEDBACK">Feedback Request</option>
                </select>
              </div>

              <div>
                <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                  CATEGORY
                </label>
                <select
                  value={editCategoryId}
                  onChange={e => setEditCategoryId(e.target.value)}
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
                  TITLE
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', height: '42px' }}
                  required
                />
              </div>

              <div>
                <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                  CONTENT
                </label>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
                  required
                />
              </div>

              <div>
                <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                  BANNER / DIAGRAM IMAGE URL (OPTIONAL)
                </label>
                <input
                  type="url"
                  value={editImageUrl}
                  onChange={e => setEditImageUrl(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', height: '40px' }}
                />
              </div>

              <div>
                <label className="editorial-mono-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                  TAGS (COMMA SEPARATED)
                </label>
                <input
                  type="text"
                  value={editTagsInput}
                  onChange={e => setEditTagsInput(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', height: '40px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-coral"
                  style={{ padding: '0.65rem 1.75rem' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: SHARE A RESOURCE ================= */}
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
                  DESCRIPTION
                </label>
                <textarea
                  value={resDescription}
                  onChange={e => setResDescription(e.target.value)}
                  placeholder="Briefly explain what this resource does..."
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
                  placeholder="Benchmark, OpenSource, Telemetry"
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

      {/* ================= MODAL 4: DISCUSSION THREAD & NESTED COMMENTS ================= */}
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
          onClick={() => { setActiveDiscussionItem(null); setReplyingToComment(null); }}
        >
          <div 
            className="editorial-card"
            style={{
              width: '100%',
              maxWidth: '740px',
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
              onClick={() => { setActiveDiscussionItem(null); setReplyingToComment(null); }}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>

            {/* Top Post Badges */}
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
                    {activeDiscussionItem.author_headline || 'Community Innovator'} • Published on {new Date(activeDiscussionItem.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </div>
                </div>
              </div>
            </div>

            {/* Full Post Body */}
            <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '1.02rem', lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>
                {activeDiscussionItem.content}
              </p>
            </div>

            {/* Post Image */}
            {activeDiscussionItem.image_url && (
              <div style={{ marginBottom: '1.5rem', maxHeight: '320px', overflow: 'hidden', borderRadius: 'var(--radius-sm)' }}>
                <img src={activeDiscussionItem.image_url} alt="" style={{ width: '100%', height: 'auto', objectFit: 'cover' }} />
              </div>
            )}

            {/* Voting Bar: Like & Dislike */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={(e) => handleVote(e, 'discussion', activeDiscussionItem.id, 'like')}
                  className={`btn ${userVotes[`discussion_${activeDiscussionItem.id}`] === 'like' ? 'btn-coral' : 'btn-secondary'} btn-sm`}
                  style={{ gap: '0.35rem' }}
                >
                  <ThumbsUp size={14} /> Like ({activeDiscussionItem.likes_count || activeDiscussionItem.upvotes_count || 0})
                </button>
                <button
                  type="button"
                  onClick={(e) => handleVote(e, 'discussion', activeDiscussionItem.id, 'dislike')}
                  className={`btn ${userVotes[`discussion_${activeDiscussionItem.id}`] === 'dislike' ? 'btn-secondary' : 'btn-ghost'} btn-sm`}
                  style={{ color: userVotes[`discussion_${activeDiscussionItem.id}`] === 'dislike' ? 'var(--coral)' : 'var(--text-secondary)' }}
                >
                  <ThumbsDown size={14} /> Dislike ({activeDiscussionItem.dislikes_count || activeDiscussionItem.downvotes_count || 0})
                </button>
              </div>

              <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {discussionComments.length} Community Replies
              </span>
            </div>

            {/* Comments Thread with Nested Replies */}
            <div style={{ marginBottom: '2rem' }}>
              <div className="editorial-mono-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                PEER REPLIES & NESTED INSIGHTS
              </div>

              {rootComments.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', padding: '1rem 0' }}>
                  No replies recorded yet. Be the first to provide engineering insight or perspective.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {rootComments.map(c => {
                    const replies = getRepliesForComment(c.id);
                    const isCommentAuthor = currentUser && (c.user_id === currentUser.id || c.author_id === currentUser.id);

                    return (
                      <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* Parent Comment */}
                        <div style={{ backgroundColor: 'var(--bg-ivory)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--border-medium)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <img src={c.author_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.author_name || 'Member')}&backgroundColor=20212a,58b8ad,9b8ae5`} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                              <strong style={{ fontSize: '0.9rem' }}>{c.author_name}</strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isCommentAuthor && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="btn btn-ghost btn-sm"
                                  style={{ padding: '0 4px', color: 'var(--coral)' }}
                                  title="Delete comment"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
                            {c.content}
                          </p>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <button
                              type="button"
                              onClick={() => setReplyingToComment({ id: c.id, author_name: c.author_name })}
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: '0.72rem', padding: '2px 6px', color: 'var(--periwinkle)', gap: '0.25rem' }}
                            >
                              <CornerDownRight size={12} /> Reply
                            </button>
                          </div>
                        </div>

                        {/* Nested Replies */}
                        {replies.length > 0 && (
                          <div style={{ marginLeft: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '2px dashed var(--border-medium)', paddingLeft: '1rem' }}>
                            {replies.map(reply => {
                              const isReplyAuthor = currentUser && (reply.user_id === currentUser.id || reply.author_id === currentUser.id);

                              return (
                                <div key={reply.id} style={{ backgroundColor: 'var(--bg-cream)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                      <img src={reply.author_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(reply.author_name || 'Member')}&backgroundColor=20212a,58b8ad,9b8ae5`} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                                      <strong style={{ fontSize: '0.84rem' }}>{reply.author_name}</strong>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                                        {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      {isReplyAuthor && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteComment(reply.id)}
                                          className="btn btn-ghost btn-sm"
                                          style={{ padding: '0 4px', color: 'var(--coral)' }}
                                          title="Delete reply"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.45, margin: 0 }}>
                                    {reply.content}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Comment Form (with Reply Header indicator) */}
            <form onSubmit={handleAddComment} style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <div className="editorial-mono-label" style={{ fontSize: '0.7rem', color: 'var(--coral)' }}>
                  {replyingToComment ? `REPLYING TO @${replyingToComment.author_name.toUpperCase()}` : 'CONTRIBUTE AN INSIGHT'}
                </div>
                {replyingToComment && (
                  <button
                    type="button"
                    onClick={() => setReplyingToComment(null)}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', padding: 0 }}
                  >
                    Cancel Reply
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  value={newCommentContent}
                  onChange={e => setNewCommentContent(e.target.value)}
                  placeholder={replyingToComment ? `Write a reply to ${replyingToComment.author_name}...` : "Write a constructive response or research reference..."}
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
                  <Send size={14} /> {replyingToComment ? 'Reply' : 'Post'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
