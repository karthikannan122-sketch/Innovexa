import {
  INITIAL_CATEGORIES,
  INITIAL_USERS,
  INITIAL_INNOVATIONS,
  INITIAL_FEATURED_DEMOS,
  INITIAL_REVIEWS,
  INITIAL_ASSIGNMENTS,
  INITIAL_COMMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_UPVOTES,
  INITIAL_EXTERNAL_INNOVATIONS,
  INITIAL_EXTERNAL_SOURCES,
  INITIAL_COMMUNITY_POSTS,
  INITIAL_COMMUNITY_COMMENTS,
  INITIAL_COMMUNITY_RESOURCES,
  INITIAL_VOTES
} from './seedData.js';
import { cleanProjectTitle } from '../utils/textUtils.js';

// Environment-safe storage polyfill for Node.js test runs and non-browser contexts
if (typeof globalThis.localStorage === 'undefined') {
  const memoryMap = new Map();
  globalThis.localStorage = {
    getItem: (k) => memoryMap.get(k) || null,
    setItem: (k, v) => memoryMap.set(k, String(v)),
    removeItem: (k) => memoryMap.delete(k),
    clear: () => memoryMap.clear(),
    get length() { return memoryMap.size; },
    key: (i) => Array.from(memoryMap.keys())[i] || null
  };
}

const STORAGE_KEYS = {
  USERS: 'innovexa_users_v2',
  CURRENT_USER_ID: 'innovexa_curr_user_id_v2',
  CATEGORIES: 'innovexa_categories_v2',
  INNOVATIONS: 'innovexa_innovations_v2',
  REVIEWS: 'innovexa_reviews_v2',
  ASSIGNMENTS: 'innovexa_assignments_v2',
  RELATED_FEEDBACK: 'innovexa_related_feedback_v2',
  COMMENTS: 'innovexa_comments_v2',
  UPVOTES: 'innovexa_upvotes_v2',
  NOTIFICATIONS: 'innovexa_notifications_v2',
  EXTERNAL_INNOVATIONS: 'innovexa_external_innovations_v2',
  EXTERNAL_SOURCES: 'innovexa_external_sources_v2',
  COMMUNITY_POSTS: 'innovexa_community_posts_v2',
  COMMUNITY_COMMENTS: 'innovexa_community_comments_v2',
  COMMUNITY_RESOURCES: 'innovexa_community_resources_v2',
  RESOURCE_BOOKMARKS: 'innovexa_resource_bookmarks_v2',
  VOTES: 'innovexa_votes_v2',
  MESSAGES: 'innovexa_messages_v2',
  GEMINI_API_KEY: 'innovexa_gemini_api_key_v2',
  CLEAN_MIGRATED: 'innovexa_clean_v2_migrated'
};

// Event dispatcher for reactive updates across components
export function notifyDataChange(entity) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('innovexa:datachange', { detail: { entity } }));
  }
}

export const StorageService = {
  // Initialize storage with rich production sample data or preserve existing
  init() {
    if (typeof localStorage === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.USERS) || JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]').length === 0) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'usr_karthick_founder');
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    }
    
    const existingInnos = localStorage.getItem(STORAGE_KEYS.INNOVATIONS);
    if (!existingInnos || JSON.parse(existingInnos || '[]').length === 0) {
      localStorage.setItem(STORAGE_KEYS.INNOVATIONS, JSON.stringify(INITIAL_INNOVATIONS));
    } else {
      try {
        let parsed = JSON.parse(existingInnos) || [];
        const missing = INITIAL_INNOVATIONS.filter(d => !parsed.some(i => i.id === d.id));
        if (missing.length > 0) {
          parsed = [...parsed, ...missing];
          localStorage.setItem(STORAGE_KEYS.INNOVATIONS, JSON.stringify(parsed));
        }
      } catch {
        localStorage.setItem(STORAGE_KEYS.INNOVATIONS, JSON.stringify(INITIAL_INNOVATIONS));
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.REVIEWS) || JSON.parse(localStorage.getItem(STORAGE_KEYS.REVIEWS) || '[]').length === 0) {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(INITIAL_REVIEWS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS) || JSON.parse(localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS) || '[]').length === 0) {
      localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(INITIAL_ASSIGNMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMMENTS) || JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMENTS) || '[]').length === 0) {
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(INITIAL_COMMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.UPVOTES)) {
      localStorage.setItem(STORAGE_KEYS.UPVOTES, JSON.stringify(INITIAL_UPVOTES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]').length === 0) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXTERNAL_INNOVATIONS) || JSON.parse(localStorage.getItem(STORAGE_KEYS.EXTERNAL_INNOVATIONS) || '[]').length === 0) {
      localStorage.setItem(STORAGE_KEYS.EXTERNAL_INNOVATIONS, JSON.stringify(INITIAL_EXTERNAL_INNOVATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXTERNAL_SOURCES) || JSON.parse(localStorage.getItem(STORAGE_KEYS.EXTERNAL_SOURCES) || '[]').length === 0) {
      localStorage.setItem(STORAGE_KEYS.EXTERNAL_SOURCES, JSON.stringify(INITIAL_EXTERNAL_SOURCES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMMUNITY_POSTS) || JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMUNITY_POSTS) || '[]').length === 0) {
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_POSTS, JSON.stringify(INITIAL_COMMUNITY_POSTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMMUNITY_COMMENTS) || JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMUNITY_COMMENTS) || '[]').length === 0) {
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_COMMENTS, JSON.stringify(INITIAL_COMMUNITY_COMMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMMUNITY_RESOURCES) || JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMUNITY_RESOURCES) || '[]').length === 0) {
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_RESOURCES, JSON.stringify(INITIAL_COMMUNITY_RESOURCES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.VOTES)) {
      localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify(INITIAL_VOTES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RESOURCE_BOOKMARKS)) {
      localStorage.setItem(STORAGE_KEYS.RESOURCE_BOOKMARKS, JSON.stringify([]));
    }

    // Clean legacy debug labels like (User A), (User B), (User C) from stored users and projects
    try {
      const usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
      if (usersStr && (usersStr.includes('(User A)') || usersStr.includes('(User B)') || usersStr.includes('(User C)'))) {
        const cleanedUsers = JSON.parse(usersStr).map(u => ({
          ...u,
          name: (u.name || '').replace(/\s*\(User\s+[A-Z]\)/gi, '').trim()
        }));
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cleanedUsers));
      }

      const innosStr = localStorage.getItem(STORAGE_KEYS.INNOVATIONS);
      if (innosStr && (innosStr.includes('(User A)') || innosStr.includes('(User B)') || innosStr.includes('(User C)'))) {
        const cleanedInnos = JSON.parse(innosStr).map(i => ({
          ...i,
          creator_name: (i.creator_name || '').replace(/\s*\(User\s+[A-Z]\)/gi, '').trim()
        }));
        localStorage.setItem(STORAGE_KEYS.INNOVATIONS, JSON.stringify(cleanedInnos));
      }

      const revsStr = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      if (revsStr && (revsStr.includes('(User A)') || revsStr.includes('(User B)') || revsStr.includes('(User C)'))) {
        const cleanedRevs = JSON.parse(revsStr).map(r => ({
          ...r,
          reviewer_name: (r.reviewer_name || '').replace(/\s*\(User\s+[A-Z]\)/gi, '').trim()
        }));
        localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(cleanedRevs));
      }
    } catch {
      // safe fallback
    }
  },

  // Populate or reset database with the complete verified sample dataset
  populateSampleData() {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'usr_karthick_founder');
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.INNOVATIONS, JSON.stringify(INITIAL_INNOVATIONS));
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(INITIAL_REVIEWS));
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(INITIAL_ASSIGNMENTS));
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(INITIAL_COMMENTS));
    localStorage.setItem(STORAGE_KEYS.UPVOTES, JSON.stringify(INITIAL_UPVOTES));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.EXTERNAL_INNOVATIONS, JSON.stringify(INITIAL_EXTERNAL_INNOVATIONS));
    localStorage.setItem(STORAGE_KEYS.EXTERNAL_SOURCES, JSON.stringify(INITIAL_EXTERNAL_SOURCES));
    localStorage.setItem(STORAGE_KEYS.COMMUNITY_POSTS, JSON.stringify(INITIAL_COMMUNITY_POSTS));
    localStorage.setItem(STORAGE_KEYS.COMMUNITY_COMMENTS, JSON.stringify(INITIAL_COMMUNITY_COMMENTS));
    localStorage.setItem(STORAGE_KEYS.COMMUNITY_RESOURCES, JSON.stringify(INITIAL_COMMUNITY_RESOURCES));
    localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify(INITIAL_VOTES));
    localStorage.setItem(STORAGE_KEYS.RESOURCE_BOOKMARKS, JSON.stringify([]));
    notifyDataChange('all');
  },

  // Reset database to completely clean state
  resetToClean() {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'usr_karthick_founder');
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.INNOVATIONS, JSON.stringify(INITIAL_INNOVATIONS));
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(INITIAL_REVIEWS));
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(INITIAL_ASSIGNMENTS));
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(INITIAL_COMMENTS));
    localStorage.setItem(STORAGE_KEYS.UPVOTES, JSON.stringify(INITIAL_UPVOTES));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    notifyDataChange('all');
  },

  // ================= USERS & AUTH =================

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    } catch {
      return [];
    }
  },

  getUserById(id) {
    if (!id) return null;
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  },

  getUserByEmail(email) {
    if (!email) return null;
    const users = this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  },

  getCurrentUserId() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || null;
  },

  setCurrentUserId(id) {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    }
    notifyDataChange('currentUser');
  },

  getCurrentUser() {
    const id = this.getCurrentUserId();
    if (!id) return null;
    return this.getUserById(id);
  },

  // Register real user
  registerUser({ name, email, password }) {
    const trimmedEmail = email.toLowerCase().trim();
    const existing = this.getUserByEmail(trimmedEmail);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: trimmedEmail,
      password: password, // In production, password hash is used
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=20212a,e76f82,7186d8`,
      bio: '',
      organization: '',
      role: [], // User roles selected during onboarding
      interests: [],
      skills: [],
      preferred_domains: [],
      credits: 0,
      reputation_score: 0,
      reputation_tier: 'NEW INNOVATOR',
      onboarding_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const users = this.getUsers();
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUserId(newUser.id);
    notifyDataChange('users');
    return newUser;
  },

  // Authenticate user with email and password
  authenticateUser({ email, password }) {
    const trimmedEmail = email.toLowerCase().trim();
    const user = this.getUserByEmail(trimmedEmail);
    if (!user) {
      throw new Error('No account found with this email address.');
    }
    if (user.password && user.password !== password) {
      throw new Error('Invalid password. Please check your credentials and try again.');
    }

    this.setCurrentUserId(user.id);
    return user;
  },

  // Reset user password
  resetUserPassword(email, newPassword) {
    const trimmedEmail = email.toLowerCase().trim();
    const users = this.getUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === trimmedEmail);
    if (idx === -1) {
      throw new Error('No account registered with this email address.');
    }
    users[idx].password = newPassword;
    users[idx].updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    notifyDataChange('users');
    return users[idx];
  },

  updateUser(id, updates) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates, updated_at: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      notifyDataChange('users');
      return users[index];
    }
    return null;
  },

  updateUserProfile(id, updates) {
    return this.updateUser(id, updates);
  },

  upsertUser(userData) {
    if (!userData || !userData.id) return null;
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userData.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...userData, updated_at: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      notifyDataChange('users');
      return users[index];
    } else {
      const newUser = {
        id: userData.id,
        name: userData.name || userData.email?.split('@')[0] || 'Innovator',
        email: userData.email,
        avatar: userData.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name || 'Innovator')}&backgroundColor=20212a,e76f82,7186d8`,
        bio: userData.bio || '',
        organization: userData.organization || '',
        role: userData.role || ['I CREATE IDEAS'],
        interests: userData.interests || ['AI & MACHINE LEARNING'],
        skills: userData.skills || [],
        preferred_domains: userData.preferred_domains || [],
        credits: userData.credits ?? 0,
        reputation_score: userData.reputation_score ?? 0,
        reputation_tier: userData.reputation_tier || 'NEW INNOVATOR',
        onboarding_completed: Boolean(userData.onboarding_completed),
        created_at: userData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      users.push(newUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      notifyDataChange('users');
      return newUser;
    }
  },

  // ================= CATEGORIES =================

  getCategories() {
    try {
      return (typeof localStorage !== 'undefined' && JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES))) || INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  },

  getCategoryById(id) {
    const cats = this.getCategories();
    return cats.find(c => c.id === id) || null;
  },

  getCategoryName(id) {
    if (!id) return 'Technology';
    const cat = this.getCategoryById(id);
    if (cat && cat.name) return cat.name;
    const catMap = {
      '93fe2938-c843-4fa4-8b01-b07d59990023': 'Technology',
      '9dbbcd45-778e-411c-92cc-debee85d7137': 'Education',
      '19b552c7-2ed6-44fe-9846-5d1501b1104f': 'Healthcare',
      'e6fa521c-f84c-42f6-9c7d-88447ee259cc': 'Business',
      '913ce065-82bd-4101-a508-22bf41eaf0d5': 'Environment',
      '3d3d928f-2a11-4639-83d5-865730960135': 'Social Impact',
      'cat_ai': 'Technology',
      'cat_health': 'Healthcare',
      'cat_education': 'Education',
      'cat_startups': 'Business',
      'cat_sustainability': 'Environment',
      'cat_social_impact': 'Social Impact'
    };
    return catMap[id] || 'Technology';
  },

  // ================= INNOVATIONS =================

  getInnovations() {
    try {
      const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.INNOVATIONS)) || [];
      return list.map(item => ({
        ...item,
        title: cleanProjectTitle(item.title)
      }));
    } catch {
      return [];
    }
  },

  getInnovationById(id) {
    const list = this.getInnovations();
    const item = list.find(i => i.id === id || i.project_id === id);
    if (!item) return null;
    return {
      ...item,
      title: cleanProjectTitle(item.title)
    };
  },

  getInnovationsByUserId(userId) {
    if (!userId) return [];
    const list = this.getInnovations();
    return list
      .filter(i => (i.user_id === userId || i.creator_id === userId) && !i.is_demo)
      .map(item => ({
        ...item,
        title: cleanProjectTitle(item.title)
      }));
  },

  getFeaturedDemos() {
    return this.getInnovations()
      .filter(i => i.is_demo || i.is_featured_example)
      .map(item => ({
        ...item,
        title: cleanProjectTitle(item.title)
      }));
  },

  createInnovation(data) {
    const list = this.getInnovations();
    const currentUser = this.getCurrentUser();
    
    const creationType = data.creation_type || data.innovation_type || 'IDEA';
    let defaultStage = 'idea';
    if (creationType === 'PRODUCT') defaultStage = data.has_live_product ? 'live' : 'prototype';
    if (creationType === 'STARTUP') defaultStage = data.project_stage || 'idea';
    if (data.project_stage) defaultStage = data.project_stage.toLowerCase();

    const innoId = data.id || `inno_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const userId = currentUser ? currentUser.id : (data.user_id || 'anonymous');
    const cleanTitle = cleanProjectTitle(data.title || 'Untitled Specimen');

    const newInno = {
      id: innoId,
      project_id: innoId,
      user_id: userId,
      creator_id: userId,
      creator_name: currentUser ? currentUser.name : (data.creator_name || 'Innovator'),
      creator_avatar: currentUser ? currentUser.avatar : (data.creator_avatar || ''),
      creator_headline: currentUser ? (currentUser.bio || currentUser.organization || 'Creator') : '',
      creation_type: creationType, // 'IDEA' | 'PRODUCT' | 'STARTUP'
      innovation_type: creationType,
      project_stage: defaultStage, // 'idea' | 'prototype' | 'mvp' | 'beta' | 'live'
      development_stage: defaultStage.toUpperCase(),
      launch_status: data.launch_status || 'validating', // 'draft' | 'validating' | 'improving' | 'ready_to_launch' | 'published'
      status: data.status || 'UNDER_VALIDATION',
      website_url: data.website_url || null,
      demo_url: data.demo_url || null,
      github_url: data.github_url || null,
      app_store_url: data.app_store_url || null,
      play_store_url: data.play_store_url || null,
      has_live_product: Boolean(data.has_live_product || data.website_url || data.demo_url),
      next_community_action: data.next_community_action || 'follow', // 'follow' | 'waitlist' | 'feedback' | 'contact' | 'prototype'
      features: data.features || [],
      images: data.images || [],
      cover_image: data.cover_image || null,
      version: 1,
      valid_reviews_count: 0,
      validation_target: 10,
      upvotes_count: 0,
      comments_count: 0,
      similarity_score: 0,
      published_at: data.published_at || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data,
      title: cleanTitle,
      id: innoId,
      project_id: innoId
    };

    list.unshift(newInno);
    localStorage.setItem(STORAGE_KEYS.INNOVATIONS, JSON.stringify(list));

    // Award +20 points to creator
    if (currentUser) {
      this.updateUser(currentUser.id, {
        credits: (currentUser.credits || 0) + 20,
        reputation_score: (currentUser.reputation_score || 0) + 20
      });
    }

    // Auto-create assignments for other active users in the network
    try {
      const allUsers = this.getUsers().filter(u => u.id !== userId);
      allUsers.slice(0, 3).forEach(reviewer => {
        this.createAssignment({
          innovation_id: innoId,
          project_id: innoId,
          reviewer_id: reviewer.id,
          title: newInno.title,
          category_name: newInno.category_name,
          match_score: 0.92
        });
      });
    } catch (e) {
      // Assignment generation is non-blocking
    }

    notifyDataChange('innovations');
    return newInno;
  },

  updateInnovation(id, updates) {
    const list = this.getInnovations();
    const index = list.findIndex(i => i.id === id || i.project_id === id);
    if (index !== -1) {
      // Sync status and launch_status if one changes
      const merged = { ...list[index], ...updates };
      if (merged.title) {
        merged.title = cleanProjectTitle(merged.title);
      }
      if (updates.status === 'PUBLISHED' && !merged.published_at) {
        merged.published_at = new Date().toISOString();
        merged.launch_status = 'published';
      }
      if (updates.launch_status === 'published' && merged.status !== 'PUBLISHED') {
        merged.status = 'PUBLISHED';
        if (!merged.published_at) merged.published_at = new Date().toISOString();
      }
      merged.updated_at = new Date().toISOString();
      list[index] = merged;
      localStorage.setItem(STORAGE_KEYS.INNOVATIONS, JSON.stringify(list));
      notifyDataChange('innovations');
      return list[index];
    }
    return null;
  },

  deleteInnovation(id) {
    let list = this.getInnovations();
    list = list.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.INNOVATIONS, JSON.stringify(list));
    notifyDataChange('innovations');
    return true;
  },

  duplicateInnovation(id) {
    const item = this.getInnovationById(id);
    if (!item) return null;
    const { id: _oldId, project_id: _oldProjId, ...rest } = item;
    return this.createInnovation({
      ...rest,
      title: `${cleanProjectTitle(item.title)} (Copy)`,
      status: 'DRAFT',
      launch_status: 'draft',
      valid_reviews_count: 0
    });
  },

  // ================= REVIEWS =================

  getReviews() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.REVIEWS)) || [];
    } catch {
      return [];
    }
  },

  getReviewsForInnovation(innoId) {
    if (!innoId) return [];
    const list = this.getReviews();
    return list.filter(r => r.project_id === innoId || r.innovation_id === innoId);
  },

  getReviewsByReviewerId(reviewerId) {
    if (!reviewerId) return [];
    const list = this.getReviews();
    return list.filter(r => r.reviewer_id === reviewerId);
  },

  getReviewsReceivedByCreator(creatorId) {
    if (!creatorId) return [];
    const myInnos = this.getInnovationsByUserId(creatorId);
    const myInnoIds = new Set(myInnos.map(i => i.id));
    return this.getReviews().filter(r => myInnoIds.has(r.project_id) || myInnoIds.has(r.innovation_id));
  },

  addReview(reviewData) {
    const list = this.getReviews();
    const currentUser = this.getCurrentUser();
    
    const projectId = reviewData.project_id || reviewData.innovation_id;
    const reviewerId = reviewData.reviewer_id || (currentUser ? currentUser.id : 'anonymous');
    const reviewerName = reviewData.reviewer_name || (currentUser ? currentUser.name : 'Validator');
    const reviewerAvatar = reviewData.reviewer_avatar || (currentUser ? currentUser.avatar : '');

    const problemRelevance = reviewData.problem_relevance || reviewData.solves_real_problem || 'YES';
    const wouldUse = reviewData.would_use !== undefined 
      ? reviewData.would_use 
      : (reviewData.is_relevant === 'YES' || reviewData.is_relevant === true ? 'YES' : 'NO');
    const overallFeedback = reviewData.overall_feedback || reviewData.liked_features || '';
    const suggestion = reviewData.suggestion || reviewData.improvement_suggestions || '';
    const rating = Number(reviewData.rating || 5);

    const newReview = {
      id: reviewData.id || `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      project_id: projectId,
      innovation_id: projectId,
      reviewer_id: reviewerId,
      reviewer_name: reviewerName,
      reviewer_avatar: reviewerAvatar,
      problem_relevance: problemRelevance,
      would_use: wouldUse,
      overall_feedback: overallFeedback,
      suggestion: suggestion,
      rating: rating,
      liked_features: overallFeedback,
      improvement_suggestions: suggestion,
      solves_real_problem: problemRelevance,
      is_relevant: wouldUse === true || wouldUse === 'YES' ? 'YES' : 'NO',
      review_status: reviewData.review_status || 'VALID',
      created_at: reviewData.created_at || new Date().toISOString()
    };

    list.unshift(newReview);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(list));

    // Increment review count on the innovation
    const inno = this.getInnovationById(projectId);
    if (inno) {
      const validCount = (inno.valid_reviews_count || 0) + 1;
      const updates = { valid_reviews_count: validCount };
      if (validCount >= (inno.validation_target || 10) && inno.status === 'UNDER_VALIDATION') {
        updates.status = 'VALIDATION_COMPLETE';
      }
      this.updateInnovation(inno.id, updates);

      // Notify project creator (User A)
      const creatorId = inno.user_id || inno.creator_id;
      if (creatorId && creatorId !== reviewerId) {
        this.addNotification({
          user_id: creatorId,
          type: 'REVIEW_RECEIVED',
          message: `${reviewerName} published a review on "${inno.title}".`,
          innovation_id: inno.id,
          project_id: inno.id,
          review_id: newReview.id
        });
      }
    }

    // Award +10 reputation points to reviewer (User B)
    if (currentUser) {
      this.updateUser(currentUser.id, {
        credits: (currentUser.credits || 0) + 10,
        reputation_score: (currentUser.reputation_score || 0) + 10
      });
    }

    notifyDataChange('reviews');
    notifyDataChange('innovations');
    return newReview;
  },

  updateReviewStatus(id, newStatus) {
    const list = this.getReviews();
    const index = list.findIndex(r => r.id === id);
    if (index !== -1) {
      list[index].review_status = newStatus;
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(list));
      notifyDataChange('reviews');
      return list[index];
    }
    return null;
  },

  // ================= ASSIGNMENTS =================

  getAssignments() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS)) || [];
    } catch {
      return [];
    }
  },

  getAssignmentsForUser(userId) {
    if (!userId) return [];
    const list = this.getAssignments();
    return list.filter(a => a.reviewer_id === userId && a.assignment_status === 'ACTIVE');
  },

  createAssignment(data) {
    const list = this.getAssignments();
    const newAssign = {
      id: `asgn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      assignment_status: 'ACTIVE',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      ...data
    };
    list.unshift(newAssign);
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(list));
    notifyDataChange('assignments');
    return newAssign;
  },

  updateAssignment(id, updates) {
    const list = this.getAssignments();
    const index = list.findIndex(a => a.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(list));
      notifyDataChange('assignments');
      return list[index];
    }
    return null;
  },

  // ================= UPVOTES & VOTES =================

  getUpvotes() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.UPVOTES)) || [];
    } catch {
      return [];
    }
  },

  hasUserUpvoted(userId, innovationId) {
    if (!userId || !innovationId) return false;
    const userVote = this.getUserVote(userId, 'project', innovationId);
    if (userVote === 'upvote') return true;
    const upvotes = this.getUpvotes();
    return upvotes.includes(`${userId}_${innovationId}`);
  },

  toggleUpvote(userId, innovationId, userName, userAvatar) {
    const res = this.toggleVote({
      userId,
      targetType: 'project',
      targetId: innovationId,
      voteType: 'upvote',
      userName,
      userAvatar
    });
    return res.activeVoteType === 'upvote';
  },

  getVotes() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.VOTES)) || [];
    } catch {
      return [];
    }
  },

  getUserVote(userId, targetType, targetId) {
    if (!userId || !targetType || !targetId) return null;
    const votes = this.getVotes();
    const entry = votes.find(v => v.user_id === userId && v.target_type === targetType && v.target_id === targetId);
    return entry ? entry.vote_type : null;
  },

  getVotesForTarget(targetType, targetId) {
    if (!targetType || !targetId) return { upvotes: 0, downvotes: 0, total: 0 };
    const votes = this.getVotes().filter(v => v.target_type === targetType && v.target_id === targetId);
    const upvotes = votes.filter(v => v.vote_type === 'upvote').length;
    const downvotes = votes.filter(v => v.vote_type === 'downvote').length;
    return { upvotes, downvotes, total: upvotes - downvotes };
  },

  getProjectVotes(projectId) {
    if (!projectId) return { upvotes: 0, downvotes: 0, total: 0 };
    const stats = this.getVotesForTarget('project', projectId);
    const inno = this.getInnovationById(projectId);
    const baseUpvotes = inno?.upvotes_count || 0;
    return {
      upvotes: Math.max(stats.upvotes, baseUpvotes),
      downvotes: stats.downvotes,
      total: Math.max(stats.upvotes, baseUpvotes) - stats.downvotes
    };
  },

  getProjectLikes(projectId) {
    if (!projectId) return [];
    const votes = this.getVotes().filter(v => v.target_type === 'project' && v.target_id === projectId && v.vote_type === 'upvote');
    return votes.map(v => ({
      project_id: projectId,
      user_id: v.user_id,
      user_name: v.user_name || 'Innovator',
      user_avatar: v.user_avatar || '',
      created_at: v.created_at || new Date().toISOString()
    }));
  },



  // ================= COMMENTS =================

  getComments() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMENTS)) || [];
    } catch {
      return [];
    }
  },

  getCommentsForInnovation(innoId) {
    const list = this.getComments();
    return list.filter(c => c.innovation_id === innoId);
  },

  addComment(commentData) {
    const list = this.getComments();
    const newC = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      ...commentData
    };
    list.push(newC);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(list));

    const inno = this.getInnovationById(commentData.innovation_id);
    if (inno) {
      this.updateInnovation(inno.id, {
        comments_count: (inno.comments_count || 0) + 1
      });
    }

    notifyDataChange('comments');
    return newC;
  },

  // ================= NOTIFICATIONS =================

  getNotifications() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || [];
    } catch {
      return [];
    }
  },

  getNotificationsForUser(userId) {
    if (!userId) return [];
    const list = this.getNotifications();
    return list.filter(n => n.user_id === userId);
  },

  addNotification(notif) {
    const list = this.getNotifications();
    const newN = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      is_read: false,
      read: false,
      created_at: new Date().toISOString(),
      ...notif
    };
    list.unshift(newN);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    notifyDataChange('notifications');
    return newN;
  },

  markNotificationRead(id) {
    const list = this.getNotifications();
    const index = list.findIndex(n => n.id === id);
    if (index !== -1) {
      list[index].is_read = true;
      list[index].read = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
      notifyDataChange('notifications');
    }
  },

  markAllNotificationsRead(userId) {
    if (!userId) return;
    const list = this.getNotifications();
    list.forEach(n => {
      if (n.user_id === userId) {
        n.is_read = true;
        n.read = true;
      }
    });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    notifyDataChange('notifications');
  },

  // ================= GEMINI API KEY =================

  getGeminiApiKey() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY) || '';
  },

  setGeminiApiKey(key) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    if (key) {
      localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, key);
    } else {
      localStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);
    }
    notifyDataChange('geminiKey');
  },

  // ================= EXTERNAL INNOVATIONS (DISCOVERY ENGINE) =================

  getExternalInnovations(filters = {}) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return INITIAL_EXTERNAL_INNOVATIONS;
    const raw = localStorage.getItem(STORAGE_KEYS.EXTERNAL_INNOVATIONS);
    let list = raw ? JSON.parse(raw) : INITIAL_EXTERNAL_INNOVATIONS;

    if (!Array.isArray(list)) list = INITIAL_EXTERNAL_INNOVATIONS;

    // Filter active only
    list = list.filter(item => item.is_active !== false);

    if (filters.category && filters.category !== 'ALL') {
      list = list.filter(item => 
        (item.category || '').toLowerCase() === filters.category.toLowerCase() ||
        (Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase() === filters.category.toLowerCase()))
      );
    }

    if (filters.source && filters.source !== 'ALL') {
      list = list.filter(item => (item.source_name || '').toLowerCase() === filters.source.toLowerCase());
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(item => 
        (item.title || '').toLowerCase().includes(q) ||
        (item.summary || item.ai_summary || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase().includes(q))) ||
        (item.source_name || '').toLowerCase().includes(q)
      );
    }

    return list;
  },

  getExternalInnovationById(id) {
    const list = this.getExternalInnovations();
    return list.find(item => item.id === id) || null;
  },

  saveExternalInnovation(item) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return item;
    const list = this.getExternalInnovations();
    const existingIndex = list.findIndex(i => i.id === item.id || (i.content_hash && i.content_hash === item.content_hash));
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...item, updated_at: new Date().toISOString() };
    } else {
      list.unshift({
        id: item.id || `ext_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        is_external: true,
        likes_count: item.likes_count || 0,
        views_count: item.views_count || 0,
        ...item
      });
    }
    localStorage.setItem(STORAGE_KEYS.EXTERNAL_INNOVATIONS, JSON.stringify(list));
    notifyDataChange('externalInnovations');
    return item;
  },

  deleteExternalInnovation(id) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
    let list = this.getExternalInnovations();
    list = list.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXTERNAL_INNOVATIONS, JSON.stringify(list));
    notifyDataChange('externalInnovations');
    return true;
  },

  toggleLikeExternalInnovation(id) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    const list = this.getExternalInnovations();
    const item = list.find(i => i.id === id);
    if (item) {
      item.likes_count = (item.likes_count || 0) + 1;
      localStorage.setItem(STORAGE_KEYS.EXTERNAL_INNOVATIONS, JSON.stringify(list));
      notifyDataChange('externalInnovations');
      return item;
    }
    return null;
  },

  // ================= EXTERNAL DISCOVERY SOURCES =================

  getExternalSources() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return INITIAL_EXTERNAL_SOURCES;
    const raw = localStorage.getItem(STORAGE_KEYS.EXTERNAL_SOURCES);
    return raw ? JSON.parse(raw) : INITIAL_EXTERNAL_SOURCES;
  },

  toggleExternalSource(sourceId) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    const list = this.getExternalSources();
    const source = list.find(s => s.id === sourceId);
    if (source) {
      source.is_enabled = !source.is_enabled;
      localStorage.setItem(STORAGE_KEYS.EXTERNAL_SOURCES, JSON.stringify(list));
      notifyDataChange('externalSources');
      return source;
    }
    return null;
  },

  updateExternalSourceStatus(sourceId, status, error = null, itemsCount = 0) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    const list = this.getExternalSources();
    const source = list.find(s => s.id === sourceId);
    if (source) {
      source.last_status = status;
      source.last_error = error;
      source.last_fetched_at = new Date().toISOString();
      if (itemsCount > 0) source.items_count = (source.items_count || 0) + itemsCount;
      localStorage.setItem(STORAGE_KEYS.EXTERNAL_SOURCES, JSON.stringify(list));
      notifyDataChange('externalSources');
    }
  },

  // ============================================================================
  // COMMUNITY DISCUSSIONS / POSTS
  // ============================================================================

  getCommunityPosts(filters = {}) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return INITIAL_COMMUNITY_POSTS;
    const raw = localStorage.getItem(STORAGE_KEYS.COMMUNITY_POSTS);
    let list = raw ? JSON.parse(raw) : INITIAL_COMMUNITY_POSTS;
    if (!Array.isArray(list)) list = INITIAL_COMMUNITY_POSTS;

    if (filters.category && filters.category !== 'ALL') {
      list = list.filter(item => 
        item.category_id === filters.category ||
        (item.category_name || '').toLowerCase() === filters.category.toLowerCase() ||
        (Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase() === filters.category.toLowerCase()))
      );
    }

    if (filters.postType && filters.postType !== 'ALL') {
      list = list.filter(item => (item.post_type || 'DISCUSSION').toUpperCase() === filters.postType.toUpperCase());
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(item => 
        (item.title || '').toLowerCase().includes(q) ||
        (item.content || '').toLowerCase().includes(q) ||
        (item.author_name || '').toLowerCase().includes(q) ||
        (item.category_name || '').toLowerCase().includes(q) ||
        (Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Sort
    const sortBy = filters.sortBy || 'NEWEST';
    list = [...list].sort((a, b) => {
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

    return list;
  },

  getCommunityPostById(id) {
    const list = this.getCommunityPosts();
    return list.find(p => p.id === id) || null;
  },

  createCommunityPost(data) {
    const list = this.getCommunityPosts();
    const currentUser = this.getCurrentUser();
    const postId = data.id || `post_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const userId = currentUser ? currentUser.id : (data.user_id || 'anonymous');

    const newPost = {
      id: postId,
      user_id: userId,
      author_name: currentUser ? currentUser.name : (data.author_name || 'Community Member'),
      author_avatar: currentUser ? currentUser.avatar : (data.author_avatar || ''),
      author_headline: currentUser ? (currentUser.headline || currentUser.bio || 'Innovator') : '',
      title: data.title,
      content: data.content,
      post_type: data.post_type || 'DISCUSSION',
      category_id: data.category_id || 'cat_ai',
      category_name: data.category_name || 'AI & Machine Learning',
      tags: data.tags || [],
      upvotes_count: data.upvotes_count || 0,
      downvotes_count: data.downvotes_count || 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    list.unshift(newPost);
    localStorage.setItem(STORAGE_KEYS.COMMUNITY_POSTS, JSON.stringify(list));
    notifyDataChange('communityPosts');
    return newPost;
  },

  deleteCommunityPost(id) {
    let list = this.getCommunityPosts();
    list = list.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMMUNITY_POSTS, JSON.stringify(list));
    notifyDataChange('communityPosts');
    return true;
  },

  // ============================================================================
  // COMMUNITY POST COMMENTS
  // ============================================================================

  getCommunityComments(postId) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return INITIAL_COMMUNITY_COMMENTS;
    const raw = localStorage.getItem(STORAGE_KEYS.COMMUNITY_COMMENTS);
    let list = raw ? JSON.parse(raw) : INITIAL_COMMUNITY_COMMENTS;
    if (!Array.isArray(list)) list = INITIAL_COMMUNITY_COMMENTS;

    if (postId) {
      list = list.filter(c => c.post_id === postId);
    }
    return list.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
  },

  createCommunityComment(data) {
    const list = this.getCommunityComments();
    const currentUser = this.getCurrentUser();
    const commentId = data.id || `comm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const userId = currentUser ? currentUser.id : (data.user_id || 'anonymous');

    const newComment = {
      id: commentId,
      post_id: data.post_id,
      user_id: userId,
      parent_comment_id: data.parent_comment_id || null,
      author_name: currentUser ? currentUser.name : (data.author_name || 'Community Member'),
      author_avatar: currentUser ? currentUser.avatar : (data.author_avatar || ''),
      content: data.content,
      upvotes_count: 0,
      downvotes_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    list.push(newComment);
    localStorage.setItem(STORAGE_KEYS.COMMUNITY_COMMENTS, JSON.stringify(list));

    // Update post comments count
    const posts = this.getCommunityPosts();
    const targetPost = posts.find(p => p.id === data.post_id);
    if (targetPost) {
      targetPost.comments_count = (targetPost.comments_count || 0) + 1;
      targetPost.updated_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_POSTS, JSON.stringify(posts));

      // Trigger notification for post author if different user
      if (targetPost.user_id && targetPost.user_id !== userId) {
        this.addNotification({
          user_id: targetPost.user_id,
          type: 'COMMUNITY_COMMENT',
          title: 'New Discussion Reply',
          message: `${newComment.author_name} commented on your discussion "${targetPost.title.slice(0, 45)}...".`,
          target_id: targetPost.id,
          is_read: false
        });
      }
    }

    notifyDataChange('communityComments');
    notifyDataChange('communityPosts');
    return newComment;
  },

  // ============================================================================
  // COMMUNITY RESOURCES
  // ============================================================================

  getCommunityResources(filters = {}) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return INITIAL_COMMUNITY_RESOURCES;
    const raw = localStorage.getItem(STORAGE_KEYS.COMMUNITY_RESOURCES);
    let list = raw ? JSON.parse(raw) : INITIAL_COMMUNITY_RESOURCES;
    if (!Array.isArray(list)) list = INITIAL_COMMUNITY_RESOURCES;

    if (filters.category && filters.category !== 'ALL') {
      list = list.filter(item => 
        item.category_id === filters.category ||
        (item.category_name || '').toLowerCase() === filters.category.toLowerCase() ||
        (Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase() === filters.category.toLowerCase()))
      );
    }

    if (filters.resourceType && filters.resourceType !== 'ALL') {
      list = list.filter(item => (item.resource_type || 'TOOL').toUpperCase() === filters.resourceType.toUpperCase());
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(item => 
        (item.title || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.author_name || '').toLowerCase().includes(q) ||
        (item.category_name || '').toLowerCase().includes(q) ||
        (Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Sort
    const sortBy = filters.sortBy || 'NEWEST';
    list = [...list].sort((a, b) => {
      if (sortBy === 'NEWEST') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortBy === 'MOST_UPVOTED') return (b.upvotes_count || 0) - (a.upvotes_count || 0);
      if (sortBy === 'MOST_BOOKMARKED') return (b.bookmarks_count || 0) - (a.bookmarks_count || 0);
      return 0;
    });

    return list;
  },

  createCommunityResource(data) {
    const list = this.getCommunityResources();
    const currentUser = this.getCurrentUser();
    const resId = data.id || `res_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const userId = currentUser ? currentUser.id : (data.user_id || 'anonymous');

    const newRes = {
      id: resId,
      user_id: userId,
      author_name: currentUser ? currentUser.name : (data.author_name || 'Community Member'),
      title: data.title,
      description: data.description,
      resource_url: data.resource_url,
      resource_type: data.resource_type || 'TOOL',
      category_id: data.category_id || 'cat_ai',
      category_name: data.category_name || 'AI & Machine Learning',
      tags: data.tags || [],
      upvotes_count: 0,
      downvotes_count: 0,
      bookmarks_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    list.unshift(newRes);
    localStorage.setItem(STORAGE_KEYS.COMMUNITY_RESOURCES, JSON.stringify(list));
    notifyDataChange('communityResources');
    return newRes;
  },

  deleteCommunityResource(id) {
    let list = this.getCommunityResources();
    list = list.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMMUNITY_RESOURCES, JSON.stringify(list));
    notifyDataChange('communityResources');
    return true;
  },

  toggleResourceBookmark(resourceId, userId) {
    if (!userId || !resourceId) return false;
    const raw = localStorage.getItem(STORAGE_KEYS.RESOURCE_BOOKMARKS);
    let bookmarks = raw ? JSON.parse(raw) : [];
    const index = bookmarks.findIndex(b => b.resource_id === resourceId && b.user_id === userId);

    let isBookmarked = false;
    if (index >= 0) {
      bookmarks.splice(index, 1);
      isBookmarked = false;
    } else {
      bookmarks.push({ id: `bm_${Date.now()}`, resource_id: resourceId, user_id: userId, created_at: new Date().toISOString() });
      isBookmarked = true;
    }

    localStorage.setItem(STORAGE_KEYS.RESOURCE_BOOKMARKS, JSON.stringify(bookmarks));

    // Update resource count
    const resources = this.getCommunityResources();
    const res = resources.find(r => r.id === resourceId);
    if (res) {
      res.bookmarks_count = Math.max(0, (res.bookmarks_count || 0) + (isBookmarked ? 1 : -1));
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_RESOURCES, JSON.stringify(resources));
    }

    notifyDataChange('resourceBookmarks');
    notifyDataChange('communityResources');
    return isBookmarked;
  },

  getUserResourceBookmarks(userId) {
    if (!userId) return [];
    const raw = localStorage.getItem(STORAGE_KEYS.RESOURCE_BOOKMARKS);
    const bookmarks = raw ? JSON.parse(raw) : [];
    return bookmarks.filter(b => b.user_id === userId).map(b => b.resource_id);
  },

  // ============================================================================
  // UNIFIED POLYMORPHIC VOTING ENGINE (Reviews, Discussions, Comments, Resources)
  // ============================================================================

  getVotes() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return INITIAL_VOTES;
    const raw = localStorage.getItem(STORAGE_KEYS.VOTES);
    let list = raw ? JSON.parse(raw) : INITIAL_VOTES;
    return Array.isArray(list) ? list : INITIAL_VOTES;
  },

  getUserVote({ userId, targetType, targetId }) {
    if (!userId || !targetType || !targetId) return null;
    const votes = this.getVotes();
    return votes.find(v => v.user_id === userId && v.target_type === targetType && v.target_id === targetId) || null;
  },

  getVotesForTarget(targetType, targetId) {
    const votes = this.getVotes().filter(v => v.target_type === targetType && v.target_id === targetId);
    const upvotes = votes.filter(v => v.vote_type === 'upvote').length;
    const downvotes = votes.filter(v => v.vote_type === 'downvote').length;
    return { upvotes, downvotes, total: upvotes - downvotes, votes };
  },

  toggleVote({ userId, targetType, targetId, voteType = 'upvote', userName = 'Innovator', userAvatar = '' }) {
    if (!userId || !targetType || !targetId || !voteType) return null;
    let votes = this.getVotes();
    const existingIndex = votes.findIndex(v => v.user_id === userId && v.target_type === targetType && v.target_id === targetId);

    let activeVoteType = null;

    if (existingIndex >= 0) {
      const existing = votes[existingIndex];
      if (existing.vote_type === voteType) {
        // Remove vote
        votes.splice(existingIndex, 1);
        activeVoteType = null;
      } else {
        // Change vote (e.g. upvote -> downvote)
        votes[existingIndex].vote_type = voteType;
        if (userName) votes[existingIndex].user_name = userName;
        if (userAvatar) votes[existingIndex].user_avatar = userAvatar;
        votes[existingIndex].updated_at = new Date().toISOString();
        activeVoteType = voteType;
      }
    } else {
      // Add new vote
      votes.push({
        id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        user_id: userId,
        target_type: targetType,
        target_id: targetId,
        vote_type: voteType,
        user_name: userName || 'Innovator',
        user_avatar: userAvatar || '',
        created_at: new Date().toISOString()
      });
      activeVoteType = voteType;
    }

    localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify(votes));

    // Update target item cached counts
    const targetVotes = this.getVotesForTarget(targetType, targetId);

    if (targetType === 'discussion') {
      const posts = this.getCommunityPosts();
      const p = posts.find(item => item.id === targetId);
      if (p) {
        p.upvotes_count = targetVotes.upvotes;
        p.downvotes_count = targetVotes.downvotes;
        localStorage.setItem(STORAGE_KEYS.COMMUNITY_POSTS, JSON.stringify(posts));
        notifyDataChange('communityPosts');
      }
    } else if (targetType === 'comment') {
      const comments = this.getCommunityComments();
      const c = comments.find(item => item.id === targetId);
      if (c) {
        c.upvotes_count = targetVotes.upvotes;
        c.downvotes_count = targetVotes.downvotes;
        localStorage.setItem(STORAGE_KEYS.COMMUNITY_COMMENTS, JSON.stringify(comments));
        notifyDataChange('communityComments');
      }
    } else if (targetType === 'resource') {
      const resources = this.getCommunityResources();
      const r = resources.find(item => item.id === targetId);
      if (r) {
        r.upvotes_count = targetVotes.upvotes;
        r.downvotes_count = targetVotes.downvotes;
        localStorage.setItem(STORAGE_KEYS.COMMUNITY_RESOURCES, JSON.stringify(resources));
        notifyDataChange('communityResources');
      }
    } else if (targetType === 'review') {
      const reviews = this.getReviews();
      const r = reviews.find(item => item.id === targetId);
      if (r) {
        r.helpful_votes_count = targetVotes.upvotes;
        r.unhelpful_votes_count = targetVotes.downvotes;
        localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
        notifyDataChange('reviews');
      }
    } else if (targetType === 'project') {
      const innos = this.getInnovations();
      const inno = innos.find(item => item.id === targetId || item.project_id === targetId);
      if (inno) {
        inno.upvotes_count = targetVotes.upvotes;
        inno.downvotes_count = targetVotes.downvotes;
        localStorage.setItem(STORAGE_KEYS.INNOVATIONS, JSON.stringify(innos));
        notifyDataChange('innovations');
      }
      let upvotes = this.getUpvotes();
      const upvoteKey = `${userId}_${targetId}`;
      if (activeVoteType === 'upvote') {
        if (!upvotes.includes(upvoteKey)) upvotes.push(upvoteKey);
      } else {
        upvotes = upvotes.filter(k => k !== upvoteKey);
      }
      localStorage.setItem(STORAGE_KEYS.UPVOTES, JSON.stringify(upvotes));
      notifyDataChange('upvotes');
    }

    notifyDataChange('votes');
    return {
      activeVoteType,
      upvotesCount: targetVotes.upvotes,
      downvotesCount: targetVotes.downvotes
    };
  },

  getUserProjectVote(userId, projectId) {
    if (!userId || !projectId) return null;
    const vote = this.getUserVote({ userId, targetType: 'project', targetId: projectId });
    if (vote) return vote.vote_type;
    if (this.hasUserUpvoted(userId, projectId)) return 'upvote';
    return null;
  },

  getProjectVotes(projectId) {
    const targetVotes = this.getVotesForTarget('project', projectId);
    const inno = this.getInnovationById(projectId);
    const upvotes = Math.max(targetVotes.upvotes, inno?.upvotes_count || 0);
    const downvotes = Math.max(targetVotes.downvotes, inno?.downvotes_count || 0);
    return { upvotes, downvotes, total: upvotes - downvotes };
  },

  getProjectLikes(projectId) {
    if (!projectId) return [];
    const votes = this.getVotes().filter(v => v.target_type === 'project' && v.target_id === projectId && v.vote_type === 'upvote');
    return votes.map(v => ({
      project_id: projectId,
      user_id: v.user_id,
      user_name: v.user_name || 'Innovator',
      user_avatar: v.user_avatar || '',
      created_at: v.created_at || new Date().toISOString()
    }));
  },

  // ============================================================================
  // REVIEW QUALITY SIGNAL CALCULATION
  // ============================================================================

  getReviewQuality(review, helpfulVotesCount = 0) {
    if (!review) return { label: 'COMMUNITY FEEDBACK', score: 50 };

    const feedbackLen = (review.overall_feedback || review.liked_features || '').trim().length;
    const suggestionLen = (review.suggestion || review.improvement_suggestions || '').trim().length;
    const hasDetailedAnswers = Boolean(review.relevance_answer && review.problem_relevance && review.would_use);
    
    // Completeness Score (0 - 40)
    let completenessScore = 10;
    if (feedbackLen > 30) completenessScore += 15;
    if (suggestionLen > 20) completenessScore += 15;

    // Answer Depth Score (0 - 30)
    const answerScore = hasDetailedAnswers ? 30 : 15;

    // Community Helpful Score (0 - 30)
    const helpfulScore = Math.min(30, (helpfulVotesCount || review.helpful_votes_count || 0) * 10);

    const totalScore = completenessScore + answerScore + helpfulScore;

    let label = 'COMMUNITY FEEDBACK';
    if (totalScore >= 75 || helpfulVotesCount >= 3) {
      label = 'HIGHLY HELPFUL';
    } else if (totalScore >= 50 || helpfulVotesCount >= 1) {
      label = 'HELPFUL';
    }

    return {
      label,
      score: totalScore,
      helpfulVotesCount: helpfulVotesCount || review.helpful_votes_count || 0
    };
  },

  // ============================================================================
  // USER INNOVATION INSIGHTS AGGREGATOR (Real Data Analytics)
  // ============================================================================

  getUserInnovationInsights(userId) {
    if (!userId) return null;

    const allProjects = this.getInnovations();
    const userProjects = allProjects.filter(p => (p.user_id === userId || p.creator_id === userId) && !p.is_demo);
    
    const allReviews = this.getReviews();
    const reviewsGiven = allReviews.filter(r => r.reviewer_id === userId);
    
    const allResources = this.getCommunityResources();
    const resourcesShared = allResources.filter(r => r.user_id === userId);
    
    const allPosts = this.getCommunityPosts();
    const discussionsStarted = allPosts.filter(p => p.user_id === userId);

    const allComments = this.getCommunityComments();
    const discussionComments = allComments.filter(c => c.user_id === userId);

    // Votes received on user's reviews, discussions, and resources
    const allVotes = this.getVotes();
    const userReviewIds = new Set(reviewsGiven.map(r => r.id));
    const userPostIds = new Set(discussionsStarted.map(p => p.id));
    const userResourceIds = new Set(resourcesShared.map(r => r.id));

    let helpfulVotesReceived = 0;
    allVotes.forEach(v => {
      if (v.vote_type === 'upvote') {
        if (v.target_type === 'review' && userReviewIds.has(v.target_id)) helpfulVotesReceived++;
        if (v.target_type === 'discussion' && userPostIds.has(v.target_id)) helpfulVotesReceived++;
        if (v.target_type === 'resource' && userResourceIds.has(v.target_id)) helpfulVotesReceived++;
      }
    });

    // Project performance & sentiment analysis
    const userProjectIds = new Set(userProjects.map(p => p.id));
    const receivedReviews = allReviews.filter(r => userProjectIds.has(r.project_id) && r.review_status === 'VALID');

    const projectPerformance = userProjects.map(p => {
      const pReviews = receivedReviews.filter(r => r.project_id === p.id);
      const solvesYesCount = pReviews.filter(r => (r.problem_relevance || r.solves_real_problem) === 'YES').length;
      const wouldUseCount = pReviews.filter(r => r.would_use === true || r.would_use === 'YES' || r.is_relevant === 'YES').length;
      const avgRating = pReviews.length > 0 ? (pReviews.reduce((acc, r) => acc + Number(r.rating || 5), 0) / pReviews.length).toFixed(1) : null;

      let sentiment = 'NEEDS ATTENTION';
      if (pReviews.length >= 2) {
        if (avgRating >= 4.0 && solvesYesCount / pReviews.length >= 0.6) {
          sentiment = 'POSITIVE';
        } else if (avgRating >= 3.0) {
          sentiment = 'MIXED';
        }
      } else if (pReviews.length === 1) {
        sentiment = avgRating >= 4.0 ? 'POSITIVE' : 'MIXED';
      }

      return {
        id: p.id,
        title: p.title,
        category_name: p.category_name,
        stage: p.project_stage || 'idea',
        views_count: p.views_count || 0,
        upvotes_count: p.upvotes_count || 0,
        reviews_count: pReviews.length,
        avgRating,
        solvesYesCount,
        wouldUseCount,
        sentiment,
        created_at: p.created_at
      };
    });

    // Feedback insights across all received reviews
    let topStrengths = [];
    let commonConcerns = [];
    let recommendedAction = 'Invite fellow innovators to review your specimen in the community.';

    if (receivedReviews.length > 0) {
      topStrengths = receivedReviews
        .map(r => r.overall_feedback || r.liked_features)
        .filter(Boolean)
        .slice(0, 4);

      commonConcerns = receivedReviews
        .map(r => r.suggestion || r.improvement_suggestions)
        .filter(Boolean)
        .slice(0, 4);

      const avgAllRating = (receivedReviews.reduce((acc, r) => acc + Number(r.rating || 5), 0) / receivedReviews.length);
      if (avgAllRating >= 4.2) {
        recommendedAction = 'High consensus reached! Proceed to prototype demo or live launch setup.';
      } else if (avgAllRating >= 3.2) {
        recommendedAction = 'Iterate on key feedback suggestions before seeking second validation round.';
      } else {
        recommendedAction = 'Refine core problem statement and clarify differentiation with peer feedback.';
      }
    }

    return {
      activity: {
        projectsCreated: userProjects.length,
        reviewsGiven: reviewsGiven.length,
        resourcesShared: resourcesShared.length,
        discussionsStarted: discussionsStarted.length,
        helpfulVotesReceived
      },
      projectPerformance,
      feedbackInsights: {
        totalReviewsReceived: receivedReviews.length,
        topStrengths,
        commonConcerns,
        recommendedAction
      },
      communityImpact: {
        reviewsReceived: receivedReviews.length,
        helpfulVotes: helpfulVotesReceived,
        resourcesShared: resourcesShared.length,
        discussionParticipation: discussionsStarted.length + discussionComments.length
      }
    };
  },

  // --------------------------------------------------------------------------
  // DIRECT MESSAGING ENGINE
  // --------------------------------------------------------------------------
  getAllMessages() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('StorageService.getAllMessages error:', e);
      return [];
    }
  },

  getMessages(user1Id, user2Id) {
    if (!user1Id || !user2Id) return [];
    const all = this.getAllMessages();
    return all.filter(m => 
      (m.sender_id === user1Id && m.receiver_id === user2Id) ||
      (m.sender_id === user2Id && m.receiver_id === user1Id)
    ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  },

  getConversations(userId) {
    if (!userId) return [];
    const all = this.getAllMessages();
    const userMsgs = all.filter(m => m.sender_id === userId || m.receiver_id === userId);
    
    const convMap = new Map();
    const allUsers = this.getUsers();

    userMsgs.forEach(m => {
      const otherId = m.sender_id === userId ? m.receiver_id : m.sender_id;
      const isOutgoing = m.sender_id === userId;
      const otherName = isOutgoing ? (m.receiver_name || 'Innovator') : (m.sender_name || 'Innovator');
      const otherAvatar = isOutgoing ? (m.receiver_avatar || '') : (m.sender_avatar || '');

      if (!convMap.has(otherId)) {
        const foundUser = allUsers.find(u => u.id === otherId) || {};
        convMap.set(otherId, {
          id: otherId,
          user: {
            id: otherId,
            name: foundUser.name || otherName,
            avatar: foundUser.avatar || otherAvatar,
            headline: foundUser.headline || 'Community Member',
            organization: foundUser.organization || ''
          },
          lastMessage: m.content,
          lastTime: m.created_at,
          unreadCount: (m.receiver_id === userId && !m.is_read) ? 1 : 0,
          messages: [m]
        });
      } else {
        const conv = convMap.get(otherId);
        if (new Date(m.created_at) > new Date(conv.lastTime)) {
          conv.lastMessage = m.content;
          conv.lastTime = m.created_at;
        }
        if (m.receiver_id === userId && !m.is_read) {
          conv.unreadCount += 1;
        }
        conv.messages.push(m);
      }
    });

    return Array.from(convMap.values()).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
  },

  addMessage({ sender_id, receiver_id, content, sender_name, sender_avatar, receiver_name, receiver_avatar }) {
    if (!sender_id || !receiver_id || !content) return null;
    const all = this.getAllMessages();
    const trimmedContent = content.trim();
    const newMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sender_id,
      receiver_id,
      content: trimmedContent,
      sender_name: sender_name || 'Innovator',
      sender_avatar: sender_avatar || '',
      receiver_name: receiver_name || 'Innovator',
      receiver_avatar: receiver_avatar || '',
      is_read: false,
      created_at: new Date().toISOString()
    };
    all.push(newMsg);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));
    notifyDataChange('messages');

    // Create notification for receiver
    if (receiver_id && receiver_id !== sender_id) {
      const snippet = trimmedContent.length > 60 ? trimmedContent.substring(0, 57) + '...' : trimmedContent;
      this.addNotification({
        user_id: receiver_id,
        sender_id: sender_id,
        type: 'MESSAGE',
        title: 'New Direct Message',
        message: `${sender_name || 'Innovator'} sent you a message: "${snippet}"`
      });
    }

    return newMsg;
  },

  markMessagesAsRead(userId, senderId) {
    if (!userId || !senderId) return;
    const all = this.getAllMessages();
    let changed = false;
    all.forEach(m => {
      if (m.receiver_id === userId && m.sender_id === senderId && !m.is_read) {
        m.is_read = true;
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));
      notifyDataChange('messages');
    }
  }
};
