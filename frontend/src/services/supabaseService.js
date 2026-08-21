import { supabase } from '../lib/supabase.js';
import { StorageService, notifyDataChange } from './storage.js';
import { cleanProjectTitle } from '../utils/textUtils.js';

/**
 * SupabaseService — Comprehensive Real Supabase Data Layer for INNOVEXA
 * 
 * Handles real asynchronous CRUD operations against Supabase tables:
 * - categories
 * - projects
 * - project_likes (and upvotes)
 * - reviews
 * - notifications
 * - profiles
 */

export const SupabaseService = {
  // ============================================================================
  // 1. CATEGORIES
  // ============================================================================
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.warn('[Supabase categories fetch error]:', error.message || error);
        return { data: StorageService.getCategories(), error: null };
      }

      if (data && data.length > 0) {
        // Save to local cache for instant zero-latency UI renders
        try {
          localStorage.setItem('innovexa_categories_v2', JSON.stringify(data));
        } catch (e) {}
        return { data, error: null };
      }

      return { data: StorageService.getCategories(), error: null };
    } catch (err) {
      console.warn('[Supabase categories exception]:', err);
      return { data: StorageService.getCategories(), error: null };
    }
  },

  // ============================================================================
  // PROFILES (public.profiles)
  // ============================================================================
  async getProfiles() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (!error && Array.isArray(data)) {
        return { data, error: null };
      }
      if (error) {
        console.warn('[Supabase getProfiles notice]:', error.message || error);
      }
    } catch (e) {
      console.warn('[Supabase getProfiles exception]:', e);
    }
    return { data: [], error: null };
  },

  async getProfileById(userId) {
    if (!userId) return { data: null, error: null };
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        return { data, error: null };
      }
    } catch (e) {
      console.warn('[Supabase getProfileById exception]:', e);
    }
    return { data: null, error: null };
  },

  // ============================================================================
  // 2. PROJECTS (public.projects)
  // ============================================================================
  async getProjects(filters = {}) {
    try {
      let query = supabase
        .from('projects')
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
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (filters.category_id && filters.category_id !== 'ALL') {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.status && filters.status !== 'published') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('[Supabase projects fetch error]:', error.message || error);
        // Fallback to simple select if join issue occurs
        const fallbackRes = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (!fallbackRes.error && fallbackRes.data) {
          const projs = fallbackRes.data.map(item => ({
            ...item,
            title: cleanProjectTitle(item.title),
            creator_id: item.user_id,
            category_name: item.categories?.name || StorageService.getCategoryName(item.category_id) || 'Uncategorized',
            creator_name: item.creator_name || 'Community Innovator',
            valid_reviews_count: item.valid_reviews_count || 0,
            upvotes_count: item.upvotes_count || 0
          }));
          return { data: projs, error: null };
        }
        return { data: StorageService.getInnovations(), error: null };
      }

      if (data && Array.isArray(data)) {
        // Fetch like counts from project_likes table in Supabase
        const likesCountMap = {};
        try {
          const { data: allLikes, error: allLikesErr } = await supabase.from('project_likes').select('project_id');
          if (allLikesErr) {
            console.error('[Supabase getProjects allLikes error]:', allLikesErr);
          }
          if (Array.isArray(allLikes)) {
            allLikes.forEach(l => {
              if (l.project_id) {
                likesCountMap[l.project_id] = (likesCountMap[l.project_id] || 0) + 1;
              }
            });
          }
        } catch (e) {
          console.error('[Supabase getProjects allLikes exception]:', e);
        }

        const enrichedProjects = data.map(item => {
          const catName = item.categories?.name || StorageService.getCategoryName(item.category_id) || 'Uncategorized';
          const creatorName = item.profiles?.full_name || item.creator_name || 'Community Innovator';
          const creatorAvatar = item.profiles?.avatar_url || item.creator_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(creatorName)}&backgroundColor=20212a,e76f82,7186d8`;
          const upvotesCount = likesCountMap[item.id] !== undefined ? likesCountMap[item.id] : (item.upvotes_count || 0);

          return {
            ...item,
            title: cleanProjectTitle(item.title),
            creator_id: item.user_id,
            creator_name: creatorName,
            creator_avatar: creatorAvatar,
            category_name: catName,
            valid_reviews_count: item.valid_reviews_count || StorageService.getReviewsForInnovation(item.id).length || 0,
            upvotes_count: upvotesCount
          };
        });

        // Sync to local storage map for zero-latency UI fallback
        try {
          const localList = StorageService.getInnovations();
          const map = new Map();
          enrichedProjects.forEach(item => map.set(item.id, item));
          localList.forEach(item => {
            if (!map.has(item.id)) map.set(item.id, item);
          });
          const merged = Array.from(map.values());
          localStorage.setItem('innovexa_innovations_v2', JSON.stringify(merged));
        } catch (e) {}

        return { data: enrichedProjects, error: null };
      }

      return { data: StorageService.getInnovations(), error: null };
    } catch (err) {
      console.error('[Supabase projects exception]:', err);
      return { data: StorageService.getInnovations(), error: null };
    }
  },

  async getProjectById(id) {
    if (!id) return { data: null, error: 'No project ID provided.' };

    try {
      const { data, error } = await supabase
        .from('projects')
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
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('[Supabase projectById error]:', error.message || error);
        return { data: StorageService.getInnovationById(id), error: null };
      }

      if (data) {
        let dbLikes = data.upvotes_count || 0;
        try {
          const { count, error: countErr } = await supabase
            .from('project_likes')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', id);
          if (countErr) {
            console.error('[Supabase getProjectById count error]:', countErr);
          }
          if (typeof count === 'number') dbLikes = count;
        } catch (e) {
          console.error('[Supabase getProjectById count exception]:', e);
        }

        const catName = data.categories?.name || StorageService.getCategoryName(data.category_id) || 'Uncategorized';
        const creatorName = data.profiles?.full_name || data.creator_name || 'Community Innovator';
        const creatorAvatar = data.profiles?.avatar_url || data.creator_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(creatorName)}&backgroundColor=20212a,e76f82,7186d8`;

        const fullItem = {
          ...data,
          title: cleanProjectTitle(data.title),
          creator_id: data.user_id,
          creator_name: creatorName,
          creator_avatar: creatorAvatar,
          category_name: catName,
          project_id: data.id,
          valid_reviews_count: data.valid_reviews_count || StorageService.getReviewsForInnovation(data.id).length || 0,
          upvotes_count: dbLikes
        };
        StorageService.updateInnovation(id, fullItem);
        return { data: fullItem, error: null };
      }

      return { data: StorageService.getInnovationById(id), error: null };
    } catch (err) {
      console.warn('[Supabase projectById exception]:', err);
      return { data: StorageService.getInnovationById(id), error: null };
    }
  },

  async getUserProjects(userId) {
    if (!userId) return { data: [], error: 'User ID is required.' };

    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          profiles:user_id (id, full_name, avatar_url),
          categories:category_id (id, name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Supabase user projects fetch error]:', error.message || error);
        return { data: StorageService.getInnovationsByUserId(userId), error: null };
      }

      if (data && Array.isArray(data)) {
        const likesCountMap = {};
        try {
          const { data: allLikes } = await supabase.from('project_likes').select('project_id');
          if (Array.isArray(allLikes)) {
            allLikes.forEach(l => {
              if (l.project_id) {
                likesCountMap[l.project_id] = (likesCountMap[l.project_id] || 0) + 1;
              }
            });
          }
        } catch (e) {}

        const enriched = data.map(item => {
          const dbLikes = likesCountMap[item.id] || 0;
          const localStats = StorageService.getProjectVotes(item.id);
          const upvotesCount = Math.max(dbLikes, localStats.upvotes || 0, item.upvotes_count || 0);

          return {
            ...item,
            title: cleanProjectTitle(item.title),
            creator_id: item.user_id,
            creator_name: item.profiles?.full_name || item.creator_name || 'Community Innovator',
            creator_avatar: item.profiles?.avatar_url || item.creator_avatar,
            category_name: item.categories?.name || StorageService.getCategoryName(item.category_id) || 'Technology',
            valid_reviews_count: item.valid_reviews_count || StorageService.getReviewsForInnovation(item.id).length || 0,
            upvotes_count: upvotesCount
          };
        });
        return { data: enriched, error: null };
      }

      return { data: [], error: null };
    } catch (err) {
      console.warn('[Supabase user projects exception]:', err);
      return { data: StorageService.getInnovationsByUserId(userId), error: null };
    }
  },

  normalizeProjectType(type) {
    if (!type) return 'idea';
    const lower = String(type).trim().toLowerCase();
    if (lower === 'product' || lower.includes('product')) return 'product';
    if (lower === 'startup' || lower.includes('startup')) return 'startup';
    return 'idea';
  },

  normalizeProjectStatus(status, asDraftOnly = false) {
    if (asDraftOnly) return 'draft';
    if (!status) return 'draft';
    const lower = String(status).trim().toLowerCase();
    if (lower === 'published' || lower === 'active' || lower === 'under_validation' || lower === 'validating' || lower === 'live') {
      return 'published';
    }
    return 'draft';
  },

  async createProject(projectData, currentUser) {
    // 1. Verify authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const effectiveUser = user || currentUser;

    if (!effectiveUser || !effectiveUser.id) {
      return { data: null, error: new Error('You must be signed in to create a project.') };
    }

    const title = (projectData.title || '').trim();
    if (!title) {
      return { data: null, error: new Error('Project title is required.') };
    }

    const desc = (projectData.description || projectData.short_description || projectData.problem_statement || title).trim();
    if (!desc) {
      return { data: null, error: new Error('Project description is required.') };
    }

    // Ensure profile row exists in public.profiles to satisfy FK constraint projects_user_id_fkey
    try {
      const { data: profCheck } = await supabase.from('profiles').select('id').eq('id', effectiveUser.id).maybeSingle();
      if (!profCheck) {
        await supabase.from('profiles').upsert([{
          id: effectiveUser.id,
          full_name: effectiveUser.name || effectiveUser.full_name || 'Innovator',
          avatar_url: effectiveUser.avatar || effectiveUser.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(effectiveUser.name || 'Innovator')}`,
          onboarding_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      }
    } catch (profErr) {
      console.warn('[Supabase profile auto-ensure notice]:', profErr);
    }

    // Map to exact PostgreSQL allowed check constraint values
    const dbProjectType = this.normalizeProjectType(projectData.project_type || projectData.creation_type);
    const dbStatus = this.normalizeProjectStatus(projectData.status, projectData.asDraftOnly);
    const launchUrl = projectData.launch_url || projectData.website_url || projectData.demo_url || null;

    // Validate project_type is an exact valid PostgreSQL value: 'idea' | 'product' | 'startup'
    const allowedTypes = ['idea', 'product', 'startup'];
    if (!allowedTypes.includes(dbProjectType)) {
      console.error('[Supabase createProject invalid project_type]:', dbProjectType);
      return { data: null, error: new Error(`Invalid project type '${dbProjectType}'. Must be idea, product, or startup.`) };
    }

    // Validate status is an exact valid PostgreSQL value: 'draft' | 'review' | 'published'
    const allowedStatuses = ['draft', 'review', 'published'];
    if (!allowedStatuses.includes(dbStatus)) {
      console.error('[Supabase createProject invalid status]:', dbStatus);
      return { data: null, error: new Error(`Invalid status '${dbStatus}'. Must be draft, review, or published.`) };
    }

    const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    let validCatId = null;
    if (isUUID(projectData.category_id)) {
      validCatId = projectData.category_id;
    } else if (projectData.category_id) {
      console.error('[Supabase createProject invalid category_id]:', projectData.category_id);
      return { data: null, error: new Error(`Invalid category_id '${projectData.category_id}'. Must be a valid UUID.`) };
    }

    // Default to Technology category UUID if unassigned
    if (!validCatId) {
      validCatId = '93fe2938-c843-4fa4-8b01-b07d59990023';
    }

    // Clean payload matching the Supabase public.projects table schema
    const payload = {
      user_id: effectiveUser.id,
      title: title,
      description: desc,
      project_type: dbProjectType,
      launch_url: launchUrl,
      status: dbStatus,
      category_id: validCatId
    };

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([payload])
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
        console.error('[Supabase createProject error]:', error.message || error, error);
        return { data: null, error: new Error(error.message || 'Failed to save project to Supabase.') };
      }

      // Sync into StorageService cache with full project attributes
      const savedInno = {
        ...projectData,
        ...data,
        id: data.id,
        project_id: data.id,
        user_id: effectiveUser.id,
        creator_id: effectiveUser.id,
        creator_name: effectiveUser.name || effectiveUser.full_name || 'Innovator',
        creator_avatar: effectiveUser.avatar || effectiveUser.avatar_url || '',
        category_name: projectData.category_name || StorageService.getCategoryName(validCatId) || 'Technology',
        creation_type: (projectData.creation_type || dbProjectType).toUpperCase(),
        innovation_type: (projectData.innovation_type || dbProjectType).toUpperCase(),
        project_stage: projectData.project_stage || 'idea',
        problem_statement: projectData.problem_statement || projectData.description || '',
        proposed_solution: projectData.proposed_solution || projectData.description || '',
        target_users: projectData.target_users || '',
        status: dbStatus === 'published' ? 'UNDER_VALIDATION' : 'DRAFT'
      };
      StorageService.createInnovation(savedInno);
      notifyDataChange('innovations');

      return { data: savedInno, error: null };
    } catch (err) {
      console.error('[Supabase createProject exception]:', err);
      return { data: null, error: new Error(err.message || 'Failed to communicate with Supabase.') };
    }
  },

  async updateProject(projectId, updates, currentUserId) {
    if (!projectId) return { data: null, error: new Error('Project ID is required.') };

    try {
      const allowedPayload = {};
      if (updates.title !== undefined) allowedPayload.title = cleanProjectTitle(updates.title);
      if (updates.description !== undefined) allowedPayload.description = updates.description;
      if (updates.launch_url !== undefined) allowedPayload.launch_url = updates.launch_url;
      if (updates.category_id !== undefined) {
        const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        if (isUUID(updates.category_id)) allowedPayload.category_id = updates.category_id;
      }
      if (updates.project_type !== undefined) allowedPayload.project_type = this.normalizeProjectType(updates.project_type);
      if (updates.status !== undefined) allowedPayload.status = this.normalizeProjectStatus(updates.status);
      allowedPayload.updated_at = new Date().toISOString();

      let query = supabase
        .from('projects')
        .update(allowedPayload)
        .eq('id', projectId);

      if (currentUserId) {
        query = query.eq('user_id', currentUserId);
      }

      const { data, error } = await query.select().maybeSingle();

      if (error) {
        console.warn('[Supabase updateProject error]:', error.message || error);
      }

      // Sync local storage
      const localUpdated = StorageService.updateInnovation(projectId, updates);
      notifyDataChange('innovations');

      return { data: data || localUpdated, error: null };
    } catch (err) {
      console.warn('[Supabase updateProject exception]:', err);
      const localUpdated = StorageService.updateInnovation(projectId, updates);
      return { data: localUpdated, error: null };
    }
  },

  async deleteProject(projectId, currentUserId) {
    if (!projectId) return { success: false, error: new Error('Project ID is required.') };

    try {
      let query = supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (currentUserId) {
        query = query.eq('user_id', currentUserId);
      }

      const { error } = await query;

      if (error) {
        console.warn('[Supabase deleteProject error]:', error.message || error);
      }

      // Sync local storage
      StorageService.deleteInnovation(projectId);
      notifyDataChange('innovations');

      return { success: true, error: null };
    } catch (err) {
      console.warn('[Supabase deleteProject exception]:', err);
      StorageService.deleteInnovation(projectId);
      return { success: true, error: null };
    }
  },

  // ============================================================================
  // 3. PROJECT VOTING & LIKES (▲ UPVOTE / ▼ DOWNVOTE - 3 STATES)
  // ============================================================================
  async getUserProjectVote(projectId, userId) {
    if (!projectId || !userId) return null;
    try {
      const { data, error } = await supabase
        .from('project_likes')
        .select('id, project_id, user_id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Supabase getUserProjectVote error]:', error);
        return null;
      }
      if (data) return 'upvote';
      return null;
    } catch (e) {
      console.error('[Supabase getUserProjectVote exception]:', e);
      return null;
    }
  },

  async hasUserLikedProject(projectId, userId) {
    if (!projectId || !userId) return false;
    try {
      const { data, error } = await supabase
        .from('project_likes')
        .select('id, project_id, user_id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Supabase hasUserLikedProject error]:', error);
        return false;
      }
      return Boolean(data);
    } catch (e) {
      console.error('[Supabase hasUserLikedProject exception]:', e);
      return false;
    }
  },

  async getProjectLikeCount(projectId) {
    if (!projectId) return 0;
    try {
      const { count, data, error } = await supabase
        .from('project_likes')
        .select('id', { count: 'exact' })
        .eq('project_id', projectId);

      if (error) {
        console.error('[Supabase getProjectLikeCount error]:', error);
        return 0;
      }
      if (typeof count === 'number') {
        return count;
      }
      if (Array.isArray(data)) {
        return data.length;
      }
    } catch (e) {
      console.error('[Supabase getProjectLikeCount exception]:', e);
    }
    return 0;
  },

  async getProjectVotes(projectId) {
    if (!projectId) return { upvotes: 0, downvotes: 0, total: 0 };
    try {
      const { count, data, error } = await supabase
        .from('project_likes')
        .select('id', { count: 'exact' })
        .eq('project_id', projectId);

      if (error) {
        console.error('[Supabase getProjectVotes error]:', error);
        return { upvotes: 0, downvotes: 0, total: 0 };
      }
      const countNum = (typeof count === 'number') ? count : (Array.isArray(data) ? data.length : 0);
      return {
        upvotes: countNum,
        downvotes: 0,
        total: countNum
      };
    } catch (e) {
      console.error('[Supabase getProjectVotes exception]:', e);
      return { upvotes: 0, downvotes: 0, total: 0 };
    }
  },

  async getProjectLikes(projectId) {
    if (!projectId) return [];
    try {
      const { data, error } = await supabase
        .from('project_likes')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Supabase getProjectLikes error]:', error);
        return [];
      }
      if (data && Array.isArray(data)) {
        return data;
      }
      return [];
    } catch (err) {
      console.error('[Supabase getProjectLikes exception]:', err);
      return [];
    }
  },

  async voteProject({ projectId, userId, voteType = 'upvote', projectOwnerId, projectTitle, userName, userAvatar }) {
    // 1. Get current authenticated user using supabase.auth.getUser()
    let authUser = null;
    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) {
        console.error('[Supabase auth.getUser error]:', authErr);
      }
      authUser = authData?.user || null;
    } catch (authException) {
      console.error('[Supabase auth.getUser exception]:', authException);
    }

    const effectiveUserId = authUser?.id || userId;

    // 2 & 12. Verify that project.id and user.id are never undefined before inserting
    if (!projectId || typeof projectId !== 'string' || !projectId.trim() || !effectiveUserId || typeof effectiveUserId !== 'string' || !effectiveUserId.trim()) {
      const validationError = new Error('Invalid project ID or user ID: both must be defined non-empty strings.');
      console.error('[Supabase voteProject parameter validation error]:', validationError);
      return { activeVoteType: null, upvotesCount: 0, downvotesCount: 0, error: validationError };
    }

    try {
      // 3. Check public.project_likes for an existing row where project_id = projectId AND user_id = effectiveUserId
      const { data: existingRows, error: checkErr } = await supabase
        .from('project_likes')
        .select('id, project_id, user_id')
        .eq('project_id', projectId)
        .eq('user_id', effectiveUserId);

      if (checkErr) {
        console.error('[Supabase check project_likes error]:', checkErr);
        return { activeVoteType: null, upvotesCount: 0, downvotesCount: 0, error: checkErr };
      }

      const hasExistingRow = Array.isArray(existingRows) && existingRows.length > 0;
      let activeVoteType = null;

      if (!hasExistingRow) {
        // 4. If no row exists, insert: { project_id: project.id, user_id: user.id }
        const insertPayload = {
          project_id: projectId,
          user_id: effectiveUserId
        };

        const { error: insertErr } = await supabase
          .from('project_likes')
          .insert([insertPayload]);

        if (insertErr) {
          console.error('[Supabase insert project_likes error]:', insertErr);
          return { activeVoteType: null, upvotesCount: 0, downvotesCount: 0, error: insertErr };
        }
        activeVoteType = voteType || 'upvote';
      } else {
        // 5. If a row already exists, delete that row so the Upvote button acts as a toggle
        const { error: deleteErr } = await supabase
          .from('project_likes')
          .delete()
          .eq('project_id', projectId)
          .eq('user_id', effectiveUserId);

        if (deleteErr) {
          console.error('[Supabase delete project_likes error]:', deleteErr);
          return { activeVoteType: null, upvotesCount: 0, downvotesCount: 0, error: deleteErr };
        }
        activeVoteType = null;
      }

      // 7. After every successful insert or delete, fetch the real vote count from Supabase
      const { count: realCount, data: countData, error: countErr } = await supabase
        .from('project_likes')
        .select('id', { count: 'exact' })
        .eq('project_id', projectId);

      if (countErr) {
        console.error('[Supabase fetch real count error]:', countErr);
        return { activeVoteType, upvotesCount: 0, downvotesCount: 0, error: countErr };
      }

      const upvotesCount = (typeof realCount === 'number') ? realCount : (Array.isArray(countData) ? countData.length : 0);

      // Sync projects table upvotes_count column and local storage cache
      try {
        await supabase
          .from('projects')
          .update({ upvotes_count: upvotesCount })
          .eq('id', projectId);
      } catch (projUpdateErr) {
        console.error('[Supabase update projects upvotes_count exception]:', projUpdateErr);
      }

      StorageService.updateInnovation(projectId, { upvotes_count: upvotesCount });

      // Send notification if upvoted
      if (activeVoteType === 'upvote' && projectOwnerId && projectOwnerId !== effectiveUserId) {
        try {
          await this.createNotification({
            userId: projectOwnerId,
            type: 'like',
            title: 'Project Upvoted',
            message: `${userName || 'An innovator'} upvoted your project "${projectTitle || 'Untitled'}".`,
            projectId: projectId
          });
        } catch (notifErr) {
          console.error('[Supabase notification error on upvote]:', notifErr);
        }
      }

      notifyDataChange('innovations');
      notifyDataChange('votes');
      notifyDataChange('upvotes');

      return {
        activeVoteType,
        upvotesCount,
        downvotesCount: 0,
        error: null
      };
    } catch (err) {
      console.error('[Supabase voteProject error]:', err);
      return {
        activeVoteType: null,
        upvotesCount: 0,
        downvotesCount: 0,
        error: err
      };
    }
  },

  async toggleVote({ userId, targetType, targetId, voteType = 'upvote', userName = 'Innovator', userAvatar = '' }) {
    if (!userId || !targetType || !targetId) {
      return { activeVoteType: null, upvotesCount: 0, downvotesCount: 0, error: new Error('User ID, target type, and target ID are required.') };
    }

    // 1. Separate Project Likes workflow
    if (targetType === 'project') {
      return this.voteProject({
        projectId: targetId,
        userId,
        voteType,
        userName,
        userAvatar
      });
    }

    // 2. Synchronize local cache first for responsive UI
    const localResult = StorageService.toggleVote({
      userId,
      targetType,
      targetId,
      voteType,
      userName,
      userAvatar
    });

    let activeVote = localResult.activeVoteType;
    let upvotesCount = localResult.upvotesCount;
    let downvotesCount = localResult.downvotesCount;
    let dbError = null;

    // 3. Persist to Supabase public.votes table (3-State Logic)
    try {
      // Query existing vote in Supabase
      const { data: existingVote, error: selectErr } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', userId)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .maybeSingle();

      if (selectErr && !selectErr.message?.includes('schema cache')) {
        console.error(`[Supabase ${targetType} vote select error]:`, selectErr);
        dbError = selectErr;
      }

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // SAME VOTE EXISTS -> DELETE / REMOVE VOTE
          const { error: deleteErr } = await supabase
            .from('votes')
            .delete()
            .eq('id', existingVote.id);

          if (deleteErr) {
            console.error(`[Supabase ${targetType} vote delete error]:`, deleteErr);
            dbError = deleteErr;
          } else {
            activeVote = null;
          }
        } else {
          // OPPOSITE VOTE EXISTS -> UPDATE VOTE TYPE (e.g. downvote -> upvote)
          const { error: updateErr } = await supabase
            .from('votes')
            .update({
              vote_type: voteType,
              user_name: userName || 'Innovator',
              user_avatar: userAvatar || '',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingVote.id);

          if (updateErr) {
            console.error(`[Supabase ${targetType} vote update error]:`, updateErr);
            dbError = updateErr;
          } else {
            activeVote = voteType;
          }
        }
      } else {
        // NO VOTE -> INSERT NEW VOTE
        const { error: insertErr } = await supabase
          .from('votes')
          .insert([{
            user_id: userId,
            target_type: targetType,
            target_id: targetId,
            vote_type: voteType,
            user_name: userName || 'Innovator',
            user_avatar: userAvatar || '',
            created_at: new Date().toISOString()
          }]);

        if (insertErr) {
          console.error(`[Supabase ${targetType} vote insert error]:`, insertErr);
          dbError = insertErr;
        } else {
          activeVote = voteType;
        }
      }

      // 4. Fetch updated vote counts from database if table exists
      const { data: dbAllVotes, error: countErr } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('target_type', targetType)
        .eq('target_id', targetId);

      if (!countErr && Array.isArray(dbAllVotes)) {
        upvotesCount = dbAllVotes.filter(v => v.vote_type === 'upvote').length;
        downvotesCount = dbAllVotes.filter(v => v.vote_type === 'downvote').length;
      }
    } catch (err) {
      console.warn(`[Supabase ${targetType} voting notice]:`, err.message || err);
      dbError = err;
    }

    notifyDataChange('votes');
    if (targetType === 'review') notifyDataChange('reviews');
    if (targetType === 'discussion') notifyDataChange('communityPosts');
    if (targetType === 'comment') notifyDataChange('communityComments');
    if (targetType === 'resource') notifyDataChange('communityResources');

    return {
      activeVoteType: activeVote,
      upvotesCount,
      downvotesCount,
      error: dbError
    };
  },

  async getReviewVotes(reviewId, userId = null) {
    if (!reviewId) return { activeVoteType: null, upvotesCount: 0, downvotesCount: 0 };

    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('target_type', 'review')
        .eq('target_id', reviewId);

      if (!error && Array.isArray(data)) {
        const upvotes = data.filter(v => v.vote_type === 'upvote').length;
        const downvotes = data.filter(v => v.vote_type === 'downvote').length;
        const userVote = userId ? (data.find(v => v.user_id === userId)?.vote_type || null) : null;
        return { activeVoteType: userVote, upvotesCount: upvotes, downvotesCount: downvotes };
      }
    } catch (e) {}

    const localVotes = StorageService.getVotesForTarget('review', reviewId);
    const localUserVote = userId ? StorageService.getUserVote({ userId, targetType: 'review', targetId: reviewId })?.vote_type : null;
    return {
      activeVoteType: localUserVote || null,
      upvotesCount: localVotes.upvotes || 0,
      downvotesCount: localVotes.downvotes || 0
    };
  },

  async toggleProjectLike(projectId, userId, projectOwnerId, projectTitle, userName, userAvatar) {
    const res = await this.voteProject({
      projectId,
      userId,
      voteType: 'upvote',
      projectOwnerId,
      projectTitle,
      userName,
      userAvatar
    });
    return {
      hasLiked: res.activeVoteType === 'upvote',
      likeCount: res.upvotesCount,
      error: res.error
    };
  },

  // ============================================================================
  // 4. REVIEWS (public.reviews)
  // ============================================================================
  async getReviews(projectId = null) {
    try {
      if (projectId) {
        console.log("Fetching reviews for project:", projectId);
      }

      let query = supabase
        .from('reviews')
        .select(`
          *,
          profiles (
            id,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data: reviews, error } = await query;

      if (error) {
        console.error('[Supabase getReviews error]:', error.message || error);
        return { data: projectId ? StorageService.getReviewsForInnovation(projectId) : StorageService.getReviews(), error: null };
      }

      if (reviews && Array.isArray(reviews)) {
        const enriched = reviews.map(r => ({
          ...r,
          reviewer_id: r.user_id,
          reviewer_name: r.profiles?.full_name || 'Verified Validator',
          reviewer_avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(r.profiles?.full_name || 'Validator')}&backgroundColor=20212a,e76f82,7186d8`,
          overall_feedback: r.content || r.overall_feedback || '',
          suggestion: r.content || r.suggestion || '',
          rating: Number(r.rating) || 5
        }));
        return { data: enriched, error: null };
      }

      return { data: projectId ? StorageService.getReviewsForInnovation(projectId) : StorageService.getReviews(), error: null };
    } catch (err) {
      console.error('[Supabase getReviews exception]:', err);
      return { data: projectId ? StorageService.getReviewsForInnovation(projectId) : StorageService.getReviews(), error: null };
    }
  },

  async hasUserReviewedProject(projectId, userId) {
    if (!projectId || !userId) return false;

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) return true;

      const localReviews = StorageService.getReviewsForInnovation(projectId);
      return localReviews.some(r => r.user_id === userId || r.reviewer_id === userId);
    } catch (err) {
      const localReviews = StorageService.getReviewsForInnovation(projectId);
      return localReviews.some(r => r.user_id === userId || r.reviewer_id === userId);
    }
  },

  async submitReview(projectId, rating, content) {
    try {
      // Get authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("Authentication error:", authError);
        throw new Error("You must be signed in to submit a review.");
      }

      if (!projectId) {
        throw new Error("Project ID is missing.");
      }

      if (!content?.trim()) {
        throw new Error("Review content cannot be empty.");
      }

      const ratingVal = Number(rating) || 5;
      const cleanContent = content.trim();

      console.log({
        projectId,
        userId: user.id,
        rating: ratingVal,
        content: cleanContent
      });

      // Insert into Supabase
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          project_id: projectId,
          user_id: user.id,
          rating: ratingVal,
          content: cleanContent,
        })
        .select(`
          *,
          profiles (
            id,
            full_name
          )
        `)
        .single();

      if (error) {
        console.error("Review insert failed:", error);
        throw error;
      }

      console.log("Review saved successfully:", data);

      // Save to StorageService
      StorageService.addReview({
        id: data.id,
        project_id: projectId,
        innovation_id: projectId,
        user_id: user.id,
        reviewer_id: user.id,
        reviewer_name: data.profiles?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Verified Validator',
        reviewer_avatar: user.user_metadata?.avatar_url || '',
        rating: ratingVal,
        content: cleanContent,
        suggestion: cleanContent,
        overall_feedback: cleanContent,
        review_status: 'VALID'
      });

      // Optionally notify project owner (if owner !== reviewer)
      try {
        const { data: projData } = await supabase
          .from("projects")
          .select("user_id, title")
          .eq("id", projectId)
          .maybeSingle();

        if (projData?.user_id && projData.user_id !== user.id) {
          await this.createNotification({
            userId: projData.user_id,
            actorId: user.id,
            type: "REVIEW",
            title: "New Review on Your Project",
            message: `${data.profiles?.full_name || 'An innovator'} reviewed "${projData.title || 'your project'}": "${cleanContent.substring(0, 50)}..."`,
            relatedProjectId: projectId
          });
        }
      } catch (notifErr) {
        console.warn("Could not send review notification:", notifErr);
      }

      notifyDataChange('reviews');
      notifyDataChange('innovations');

      return data;
    } catch (error) {
      console.error("Submit review error:", error);
      throw error;
    }
  },

  async updateReview(reviewId, { rating, content }) {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("Authentication error:", authError);
        throw new Error("You must be signed in to edit your review.");
      }

      if (!reviewId) {
        throw new Error("Review ID is missing.");
      }

      if (!content?.trim()) {
        throw new Error("Review content cannot be empty.");
      }

      const ratingVal = Number(rating) || 5;
      const cleanContent = content.trim();

      const { data, error } = await supabase
        .from('reviews')
        .update({
          rating: ratingVal,
          content: cleanContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)
        .eq('user_id', user.id)
        .select(`
          *,
          profiles (
            id,
            full_name
          )
        `)
        .single();

      if (error) {
        console.error("Review update failed:", error);
        throw error;
      }

      StorageService.updateReview(reviewId, {
        rating: ratingVal,
        content: cleanContent,
        suggestion: cleanContent,
        overall_feedback: cleanContent
      });

      notifyDataChange('reviews');
      return { data, error: null };
    } catch (error) {
      console.error("Update review error:", error);
      return { data: null, error };
    }
  },

  async deleteReview(reviewId) {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("Authentication error:", authError);
        throw new Error("You must be signed in to delete your review.");
      }

      if (!reviewId) {
        throw new Error("Review ID is missing.");
      }

      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id);

      if (error) {
        console.error("Review delete failed:", error);
        throw error;
      }

      StorageService.deleteReview(reviewId);
      notifyDataChange('reviews');
      return { success: true, error: null };
    } catch (error) {
      console.error("Delete review error:", error);
      return { success: false, error };
    }
  },

  // ============================================================================
  // 5. NOTIFICATIONS (public.notifications)
  // ============================================================================
  async getNotifications(userId) {
    if (!userId) return { data: [], error: null };

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Supabase getNotifications error]:', error.message || error);
        return { data: StorageService.getNotificationsForUser(userId), error: null };
      }

      if (data && Array.isArray(data)) {
        try {
          localStorage.setItem('innovexa_notifications_v2', JSON.stringify(data));
        } catch (e) {}
        return { data, error: null };
      }

      return { data: StorageService.getNotificationsForUser(userId), error: null };
    } catch (err) {
      console.warn('[Supabase getNotifications exception]:', err);
      return { data: StorageService.getNotificationsForUser(userId), error: null };
    }
  },

  async createNotification({ userId, actorId = null, senderId = null, type = 'SYSTEM_ALERT', title = 'Notification', message, projectId = null, relatedProjectId = null, relatedMessageId = null }) {
    if (!userId || !message) return null;

    const payload = {
      user_id: userId,
      type: type,
      title: title,
      message: message,
      is_read: false
    };

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([payload])
        .select()
        .maybeSingle();

      if (error) {
        console.warn('[Supabase createNotification error]:', error.message || error);
      }

      const storedNotif = StorageService.addNotification({
        id: data?.id,
        user_id: userId,
        actor_id: actorId || senderId,
        sender_id: actorId || senderId,
        type,
        title,
        message,
        project_id: relatedProjectId || projectId,
        related_project_id: relatedProjectId || projectId,
        related_message_id: relatedMessageId,
        is_read: false
      });
      notifyDataChange('notifications');

      return data || storedNotif;
    } catch (err) {
      console.warn('[Supabase createNotification exception]:', err);
      const fallback = StorageService.addNotification({
        user_id: userId,
        actor_id: actorId || senderId,
        sender_id: actorId || senderId,
        type,
        title,
        message,
        project_id: relatedProjectId || projectId,
        related_project_id: relatedProjectId || projectId,
        related_message_id: relatedMessageId,
        is_read: false
      });
      notifyDataChange('notifications');
      return fallback;
    }
  },

  async markNotificationAsRead(notificationId, userId) {
    if (!notificationId) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      StorageService.markNotificationRead(notificationId);
      notifyDataChange('notifications');
    } catch (err) {
      StorageService.markNotificationRead(notificationId);
    }
  },

  async markAllNotificationsAsRead(userId) {
    if (!userId) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId);

      StorageService.markAllNotificationsRead(userId);
      notifyDataChange('notifications');
    } catch (err) {
      StorageService.markAllNotificationsRead(userId);
    }
  },

  // ============================================================================
  // 7. EXTERNAL INNOVATION DISCOVERY ENGINE (Discovered Signals)
  // ============================================================================
  async getExternalInnovations(filters = {}) {
    const apiBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:8000/api/v1';

    // 1. Try Backend API first if server is running
    try {
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'ALL') params.append('category', filters.category);
      if (filters.source && filters.source !== 'ALL') params.append('source', filters.source);
      if (filters.search) params.append('search', filters.search);
      if (filters.sort_by) params.append('sort_by', filters.sort_by);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${apiBase}/external-innovations?${params.toString()}`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json && json.data && json.data.length > 0) {
          // Sync with local storage
          json.data.forEach(item => StorageService.saveExternalInnovation(item));
          return { data: json.data, error: null, source: 'backend' };
        }
      }
    } catch (e) {
      // Backend not running or timeout -> proceed to Supabase / Local Storage
    }

    // 2. Try Supabase Table
    try {
      let query = supabase
        .from('external_innovations')
        .select('*')
        .eq('is_active', true)
        .order('published_at', { ascending: false });

      if (filters.category && filters.category !== 'ALL') {
        query = query.eq('category', filters.category);
      }
      if (filters.source && filters.source !== 'ALL') {
        query = query.eq('source_name', filters.source);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        data.forEach(item => StorageService.saveExternalInnovation(item));
        return { data, error: null, source: 'supabase' };
      }
    } catch (e) {
      console.warn('[Supabase external_innovations fetch exception]:', e);
    }

    // 3. Fallback to Local Storage
    return { data: StorageService.getExternalInnovations(filters), error: null, source: 'local' };
  },

  async likeExternalInnovation(id) {
    if (!id) return null;
    const apiBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:8000/api/v1';

    // 1. Update local storage
    const updated = StorageService.toggleLikeExternalInnovation(id);

    // 2. Try Backend
    try {
      fetch(`${apiBase}/external-innovations/${id}/like`, { method: 'POST' }).catch(() => {});
    } catch (e) {}

    // 3. Try Supabase
    try {
      if (updated) {
        await supabase
          .from('external_innovations')
          .update({ likes_count: updated.likes_count })
          .eq('id', id);
      }
    } catch (e) {}

    return updated;
  },

  async deleteExternalInnovation(id) {
    if (!id) return false;
    const apiBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:8000/api/v1';

    StorageService.deleteExternalInnovation(id);

    try {
      fetch(`${apiBase}/external-innovations/${id}`, { method: 'DELETE' }).catch(() => {});
      await supabase.from('external_innovations').delete().eq('id', id);
    } catch (e) {}

    return true;
  },

  async triggerDiscoveryIngestion() {
    const apiBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:8000/api/v1';
    try {
      const res = await fetch(`${apiBase}/external-innovations/ingest`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        notifyDataChange('externalInnovations');
        return { success: true, message: json.message, report: json.report };
      }
    } catch (e) {
      console.warn('[Discovery Ingestion Trigger Notice]:', e.message);
    }

    // Local refresh fallback
    notifyDataChange('externalInnovations');
    return { success: true, message: 'Discovery feed synchronized with latest global intelligence signals.' };
  },

  async getExternalSources() {
    const apiBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:8000/api/v1';
    try {
      const res = await fetch(`${apiBase}/external-innovations/sources`);
      if (res.ok) {
        const json = await res.json();
        return { data: json.data || StorageService.getExternalSources(), error: null };
      }
    } catch (e) {}

    return { data: StorageService.getExternalSources(), error: null };
  },

  async toggleExternalSource(sourceId) {
    const apiBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:8000/api/v1';
    const localUpdated = StorageService.toggleExternalSource(sourceId);

    try {
      fetch(`${apiBase}/external-innovations/sources/${sourceId}/toggle`, { method: 'POST' }).catch(() => {});
    } catch (e) {}

    return localUpdated;
  },

  // ============================================================================
  // 8. COMMUNITY HUB, DISCUSSIONS, RESOURCES & VOTING
  // ============================================================================

  async getCommunityPosts(filters = {}) {
    try {
      let query = supabase
        .from("community_posts")
        .select(`
          *,
          profiles (
            id,
            full_name
          )
        `)
        .order("created_at", {
          ascending: false
        });

      if (filters.category && filters.category !== 'ALL') {
        query = query.eq('category_id', filters.category);
      }
      if (filters.postType && filters.postType !== 'ALL') {
        query = query.eq('post_type', filters.postType);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Failed to fetch community posts:", error);

        // Fallback to flat query if join constraint differs
        const fallback = await supabase
          .from('community_posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (!fallback.error && fallback.data && fallback.data.length > 0) {
          return { data: fallback.data, error: null };
        }
        return { data: StorageService.getCommunityPosts(filters), error: null };
      }

      if (data && Array.isArray(data)) {
        return { data, error: null };
      }
    } catch (e) {
      console.warn('[Supabase community_posts exception]:', e);
    }
    return { data: StorageService.getCommunityPosts(filters), error: null };
  },

  async createCommunityPost(arg1, arg2) {
    const content = typeof arg1 === 'string' ? arg1 : (arg1?.content || '');
    const postType = typeof arg1 === 'string' ? (arg2 || 'discussion') : (arg1?.post_type || arg1?.postType || 'discussion');

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("User is not authenticated");
      return;
    }

    if (!content?.trim()) {
      console.error("Community post content is missing");
      return;
    }

    const trimmedContent = content.trim();

    const { data, error } = await supabase
      .from("community_posts")
      .insert({
        user_id: user.id,
        content: trimmedContent,
        post_type: postType || "discussion"
      })
      .select()
      .single();

    if (error) {
      console.error("Community post failed:", error);
      const localPost = StorageService.createCommunityPost({
        user_id: user.id,
        content: trimmedContent,
        post_type: postType || "discussion",
        author_name: user.user_metadata?.full_name || 'Innovator',
        author_avatar: user.user_metadata?.avatar_url || ''
      });
      notifyDataChange('community');
      return { data: localPost, error: null };
    }

    StorageService.createCommunityPost({
      id: data.id,
      user_id: user.id,
      content: trimmedContent,
      post_type: data.post_type || postType || "discussion",
      author_name: user.user_metadata?.full_name || 'Innovator',
      author_avatar: user.user_metadata?.avatar_url || '',
      created_at: data.created_at
    });

    notifyDataChange('community');
    return { data, error: null };
  },

  async getCommunityComments(postId) {
    try {
      const { data, error } = await supabase
        .from('community_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (!error && data) return { data, error: null };
    } catch (e) {
      console.warn('[Supabase community_comments exception]:', e);
    }
    return { data: StorageService.getCommunityComments(postId), error: null };
  },

  async createCommunityComment(commentData) {
    const localComment = StorageService.createCommunityComment(commentData);

    try {
      const { data, error } = await supabase
        .from('community_comments')
        .insert([{
          id: localComment.id,
          post_id: localComment.post_id,
          user_id: localComment.user_id,
          parent_comment_id: localComment.parent_comment_id,
          content: localComment.content
        }])
        .select()
        .single();

      if (!error && data) return { data, error: null };
    } catch (e) {
      console.warn('[Supabase createCommunityComment exception]:', e);
    }
    return { data: localComment, error: null };
  },

  async getCommunityResources(filters = {}) {
    try {
      let query = supabase
        .from('community_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.category && filters.category !== 'ALL') {
        query = query.eq('category_id', filters.category);
      }
      if (filters.resourceType && filters.resourceType !== 'ALL') {
        query = query.eq('resource_type', filters.resourceType);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return { data, error: null };
      }
    } catch (e) {
      console.warn('[Supabase community_resources exception]:', e);
    }
    return { data: StorageService.getCommunityResources(filters), error: null };
  },

  async createCommunityResource(resourceData) {
    const localRes = StorageService.createCommunityResource(resourceData);

    try {
      const { data, error } = await supabase
        .from('community_resources')
        .insert([{
          id: localRes.id,
          user_id: localRes.user_id,
          title: localRes.title,
          description: localRes.description,
          resource_url: localRes.resource_url,
          resource_type: localRes.resource_type,
          category_id: localRes.category_id,
          category_name: localRes.category_name,
          tags: localRes.tags
        }])
        .select()
        .single();

      if (!error && data) return { data, error: null };
    } catch (e) {
      console.warn('[Supabase createCommunityResource exception]:', e);
    }
    return { data: localRes, error: null };
  },



  async getUserInnovationInsights(userId) {
    return StorageService.getUserInnovationInsights(userId);
  },

  // ============================================================================
  // 6. DIRECT MESSAGING & CONVERSATIONS
  // ============================================================================
  async getConversations(userId) {
    if (!userId) return { data: [], error: null };
    try {
      // Try querying messages table if available
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // Sync to local
        data.forEach(m => {
          const local = StorageService.getAllMessages();
          if (!local.some(l => l.id === m.id)) {
            local.push(m);
            localStorage.setItem('innovexa_messages_v2', JSON.stringify(local));
          }
        });
      }
    } catch (e) {
      // Fallback cleanly to storage
    }
    const convs = StorageService.getConversations(userId);
    return { data: convs, error: null };
  },

  async fetchConversation(otherUserId) {
    try {
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("User is not authenticated");
        return [];
      }

      if (!otherUserId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            id,
            full_name
          ),
          receiver:profiles!messages_receiver_id_fkey (
            id,
            full_name
          )
        `)
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),` +
          `and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order("created_at", {
          ascending: true
        });

      if (error) {
        console.error("Failed to load messages:", error);

        // Fallback without foreign key alias in case constraint name differs in Supabase
        const fallback = await supabase
          .from("messages")
          .select("*")
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),` +
            `and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
          )
          .order("created_at", { ascending: true });

        if (!fallback.error && fallback.data) {
          return fallback.data;
        }

        return StorageService.getMessages(user.id, otherUserId) || [];
      }

      return data || [];
    } catch (err) {
      console.error("fetchConversation exception:", err);
      return [];
    }
  },

  async getMessages(userId, otherUserId) {
    if (!otherUserId) return { data: [], error: null };
    const msgs = await this.fetchConversation(otherUserId);
    if (msgs && msgs.length > 0) {
      return { data: msgs, error: null };
    }
    const fallbackMsgs = StorageService.getMessages(userId, otherUserId);
    return { data: fallbackMsgs, error: null };
  },

  async sendMessage(arg1, arg2, arg3) {
    const receiverId = typeof arg1 === 'string' ? arg1 : (arg1?.receiverId || arg1?.receiver_id);
    const content = typeof arg1 === 'string' ? arg2 : (arg1?.content || arg2);
    const messageType = typeof arg1 === 'string' ? (arg3 || 'message') : (arg1?.message_type || arg1?.messageType || arg3 || 'message');

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("User is not authenticated");
      return;
    }

    if (!receiverId || !content?.trim()) {
      console.error("Receiver or message is missing");
      return;
    }

    if (receiverId === user.id) {
      console.error("Sender and receiver must be different");
      return;
    }

    const trimmed = content.trim();

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content: trimmed,
        message_type: messageType
      })
      .select()
      .single();

    if (error) {
      console.error("Message failed:", error);
      const localMsg = StorageService.addMessage({
        sender_id: user.id,
        receiver_id: receiverId,
        content: trimmed,
        message_type: messageType,
        sender_name: user.user_metadata?.full_name || 'Innovator',
        sender_avatar: user.user_metadata?.avatar_url || ''
      });
      notifyDataChange('messages');
      return localMsg;
    }

    console.log("Message sent:", data);

    StorageService.addMessage({
      id: data.id,
      sender_id: user.id,
      receiver_id: receiverId,
      content: trimmed,
      message_type: data.message_type || messageType,
      sender_name: user.user_metadata?.full_name || 'Innovator',
      sender_avatar: user.user_metadata?.avatar_url || '',
      created_at: data.created_at
    });

    // Create notification for receiver
    const notifTitle = messageType === 'suggestion' ? 'New Innovation Suggestion' : 'New Direct Message';
    const notifType = messageType === 'suggestion' ? 'SUGGESTION' : 'MESSAGE';
    const snippet = trimmed.length > 60 ? trimmed.substring(0, 57) + '...' : trimmed;
    await this.createNotification({
      userId: receiverId,
      actorId: user.id,
      senderId: user.id,
      type: notifType,
      title: notifTitle,
      message: `${user.user_metadata?.full_name || 'An innovator'} sent you a ${messageType}: "${snippet}"`,
      relatedMessageId: data.id
    });

    notifyDataChange('messages');
    notifyDataChange('notifications');
    return data;
  },

  async markMessagesAsRead(userId, senderId) {
    if (!userId || !senderId) return;
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .match({ receiver_id: userId, sender_id: senderId });
    } catch (e) {}
    StorageService.markMessagesAsRead(userId, senderId);
  },

  async getAllProjectLikes() {
    try {
      const { data, error } = await supabase.from('project_likes').select('*');
      if (error) {
        return { data: [], error };
      }
      return { data: data || [], error: null };
    } catch (e) {
      return { data: [], error: null };
    }
  },

  // ============================================================================
  // 6. COMPREHENSIVE INSIGHTS TELEMETRY (PERSONAL & PLATFORM AGGREGATIONS)
  // ============================================================================
  async getInsightsData(userId) {
    try {
      // 1. Fetch real Supabase datasets with storage fallback
      const [projsRes, revsRes, likesRes, catsRes] = await Promise.all([
        this.getProjects(),
        this.getReviews(),
        this.getAllProjectLikes(),
        this.getCategories()
      ]);

      const allProjects = projsRes.data || StorageService.getInnovations() || [];
      const allReviews = revsRes.data || StorageService.getReviews() || [];
      const allCategories = catsRes.data || StorageService.getCategories() || [];
      const allResources = StorageService.getCommunityResources() || [];
      const allPosts = StorageService.getCommunityPosts() || [];
      const allComments = StorageService.getCommunityComments() || [];
      const allVotes = StorageService.getVotes() || [];

      // 2. Personal Insights (for current user)
      const userProjects = allProjects.filter(p => (p.user_id === userId || p.creator_id === userId) && !p.is_demo);
      const reviewsGiven = allReviews.filter(r => r.reviewer_id === userId);
      const resourcesShared = allResources.filter(r => r.user_id === userId);
      const discussionsStarted = allPosts.filter(p => p.user_id === userId);
      const discussionComments = allComments.filter(c => c.user_id === userId);

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

      const userProjectIds = new Set(userProjects.map(p => p.id));
      const receivedReviews = allReviews.filter(r => userProjectIds.has(r.project_id) && (r.is_valid === true || r.review_status === 'VALID' || r.is_valid === undefined));

      let userLikesReceived = 0;
      let userDislikesReceived = 0;
      const projectPerformance = userProjects.map(p => {
        const pReviews = receivedReviews.filter(r => r.project_id === p.id);
        const pUpvotes = p.upvotes_count || 0;
        const pDownvotes = p.downvotes_count || 0;
        userLikesReceived += pUpvotes;
        userDislikesReceived += pDownvotes;

        const solvesYesCount = pReviews.filter(r => (r.problem_relevance || r.relevance_answer || r.solves_real_problem) === 'YES' || r.problem_relevance === true).length;
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
          category_name: p.category_name || StorageService.getCategoryName(p.category_id),
          stage: p.project_stage || (p.creation_type === 'PRODUCT' ? 'prototype' : 'idea'),
          upvotes_count: pUpvotes,
          downvotes_count: pDownvotes,
          reviews_count: pReviews.length,
          avgRating,
          solvesYesCount,
          sentiment,
          created_at: p.created_at
        };
      });

      // Category distribution for user
      const catCountMap = {};
      userProjects.forEach(p => {
        const cName = p.category_name || StorageService.getCategoryName(p.category_id) || 'Technology';
        catCountMap[cName] = (catCountMap[cName] || 0) + 1;
      });
      const categoryDistribution = Object.entries(catCountMap).map(([category, count]) => ({ category, count }));

      const mostReviewedProject = userProjects.length > 0 
        ? [...projectPerformance].sort((a, b) => b.reviews_count - a.reviews_count)[0] 
        : null;

      const mostLikedProject = userProjects.length > 0 
        ? [...projectPerformance].sort((a, b) => b.upvotes_count - a.upvotes_count)[0] 
        : null;

      let topStrengths = [];
      let commonConcerns = [];
      let recommendedAction = userProjects.length > 0
        ? 'Invite fellow innovators to review your specimen in the community.'
        : 'Create your first innovation specimen to unlock peer consensus telemetry.';

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

      // 3. Platform & Community Insights (across ALL public projects & data)
      const nonDemoProjects = allProjects.filter(p => !p.is_demo);
      const totalProjectsCount = nonDemoProjects.length > 0 ? nonDemoProjects.length : allProjects.length;
      
      // Calculate real trending scores: (upvotes * 2 + reviews * 3 + base)
      const scoredProjects = allProjects.map(p => {
        const pRevs = allReviews.filter(r => r.project_id === p.id);
        const pUpvotes = p.upvotes_count || 0;
        const trendScore = (pUpvotes * 2) + (pRevs.length * 3);
        const catName = p.category_name || StorageService.getCategoryName(p.category_id) || 'Technology';

        return {
          ...p,
          trendScore,
          reviews_count: pRevs.length,
          category_name: catName
        };
      });

      const trendingProjects = [...scoredProjects]
        .sort((a, b) => b.trendScore - a.trendScore || new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 6);

      const recentlyAddedProjects = [...allProjects]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 4);

      const mostReviewedProjects = [...scoredProjects]
        .sort((a, b) => b.reviews_count - a.reviews_count)
        .slice(0, 4);

      // Popular categories with real project counts
      const globalCatMap = {};
      allProjects.forEach(p => {
        const cName = p.category_name || StorageService.getCategoryName(p.category_id) || 'Technology';
        globalCatMap[cName] = (globalCatMap[cName] || 0) + 1;
      });

      const popularCategories = Object.entries(globalCatMap)
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalProjectsCount > 0 ? Math.round((count / totalProjectsCount) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);

      const totalLikes = allProjects.reduce((acc, p) => acc + (p.upvotes_count || 0), 0);
      const totalReviews = allReviews.length;

      return {
        personal: {
          hasPersonalProjects: userProjects.length > 0,
          projectsCreated: userProjects.length,
          reviewsReceived: receivedReviews.length,
          reviewsGiven: reviewsGiven.length,
          likesReceived: userLikesReceived,
          dislikesReceived: userDislikesReceived,
          helpfulVotesReceived,
          resourcesShared: resourcesShared.length,
          discussionsStarted: discussionsStarted.length,
          mostReviewedProject,
          mostLikedProject,
          categoryDistribution,
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
        },
        platform: {
          totalProjects: totalProjectsCount,
          totalReviews,
          totalLikes,
          totalCategories: popularCategories.length,
          popularCategories,
          trendingProjects,
          recentlyAddedProjects,
          mostReviewedProjects,
          communityVelocityScore: totalProjectsCount * 10 + totalReviews * 15 + totalLikes * 5
        }
      };
    } catch (err) {
      console.warn('[Supabase getInsightsData error, using StorageService]:', err);
      const legacyPersonal = StorageService.getUserInnovationInsights(userId);
      return {
        personal: {
          hasPersonalProjects: (legacyPersonal?.activity?.projectsCreated || 0) > 0,
          projectsCreated: legacyPersonal?.activity?.projectsCreated || 0,
          reviewsReceived: legacyPersonal?.feedbackInsights?.totalReviewsReceived || 0,
          reviewsGiven: legacyPersonal?.activity?.reviewsGiven || 0,
          likesReceived: 0,
          dislikesReceived: 0,
          helpfulVotesReceived: legacyPersonal?.activity?.helpfulVotesReceived || 0,
          resourcesShared: legacyPersonal?.activity?.resourcesShared || 0,
          discussionsStarted: legacyPersonal?.activity?.discussionsStarted || 0,
          mostReviewedProject: null,
          mostLikedProject: null,
          categoryDistribution: [],
          projectPerformance: legacyPersonal?.projectPerformance || [],
          feedbackInsights: legacyPersonal?.feedbackInsights || {
            totalReviewsReceived: 0,
            topStrengths: [],
            commonConcerns: [],
            recommendedAction: 'Invite community members to review your specimen.'
          },
          communityImpact: legacyPersonal?.communityImpact || {
            reviewsReceived: 0,
            helpfulVotes: 0,
            resourcesShared: 0,
            discussionParticipation: 0
          }
        },
        platform: {
          totalProjects: StorageService.getInnovations().length,
          totalReviews: StorageService.getReviews().length,
          totalLikes: 0,
          totalCategories: 6,
          popularCategories: [],
          trendingProjects: StorageService.getInnovations().slice(0, 4),
          recentlyAddedProjects: StorageService.getInnovations().slice(0, 4),
          mostReviewedProjects: StorageService.getInnovations().slice(0, 4),
          communityVelocityScore: 100
        }
      };
    }
  },

  // ============================================================================
  // 7. REAL-TIME SUBSCRIPTION CHANNELS
  // ============================================================================
  subscribeToProjectReviews(projectId, onReview) {
    if (!projectId || typeof onReview !== 'function') return () => {};

    try {
      const channel = supabase
        .channel(`reviews_channel_${projectId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `project_id=eq.${projectId}`
        }, (payload) => {
          onReview(payload);
        })
        .subscribe();

      const localHandler = (e) => {
        if (e.detail?.entity === 'reviews') onReview({ eventType: 'LOCAL_CHANGE' });
      };
      window.addEventListener('innovexa:datachange', localHandler);

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('innovexa:datachange', localHandler);
      };
    } catch (e) {
      const localHandler = (e) => {
        if (e.detail?.entity === 'reviews') onReview({ eventType: 'LOCAL_CHANGE' });
      };
      window.addEventListener('innovexa:datachange', localHandler);
      return () => window.removeEventListener('innovexa:datachange', localHandler);
    }
  },

  subscribeToProjectLikes(projectId, onLike) {
    if (!projectId || typeof onLike !== 'function') return () => {};

    try {
      const channel = supabase
        .channel(`likes_channel_${projectId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'project_likes',
          filter: `project_id=eq.${projectId}`
        }, (payload) => {
          onLike(payload);
        })
        .subscribe();

      const localHandler = (e) => {
        if (e.detail?.entity === 'upvotes' || e.detail?.entity === 'innovations') onLike({ eventType: 'LOCAL_CHANGE' });
      };
      window.addEventListener('innovexa:datachange', localHandler);

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('innovexa:datachange', localHandler);
      };
    } catch (e) {
      const localHandler = (e) => {
        if (e.detail?.entity === 'upvotes' || e.detail?.entity === 'innovations') onLike({ eventType: 'LOCAL_CHANGE' });
      };
      window.addEventListener('innovexa:datachange', localHandler);
      return () => window.removeEventListener('innovexa:datachange', localHandler);
    }
  },

  subscribeToMessages(userId, onMessage) {
    if (!userId || typeof onMessage !== 'function') return () => {};

    try {
      const channel = supabase
        .channel(`messages_channel_${userId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        }, (payload) => {
          onMessage(payload);
        })
        .subscribe();

      const localHandler = (e) => {
        if (e.detail?.entity === 'messages') onMessage({ eventType: 'LOCAL_CHANGE' });
      };
      window.addEventListener('innovexa:datachange', localHandler);

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('innovexa:datachange', localHandler);
      };
    } catch (e) {
      const localHandler = (e) => {
        if (e.detail?.entity === 'messages') onMessage({ eventType: 'LOCAL_CHANGE' });
      };
      window.addEventListener('innovexa:datachange', localHandler);
      return () => window.removeEventListener('innovexa:datachange', localHandler);
    }
  },

  subscribeToNotifications(userId, onNotification) {
    if (!userId || typeof onNotification !== 'function') return () => {};

    try {
      const channel = supabase
        .channel(`notifs_channel_${userId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          onNotification(payload);
        })
        .subscribe();

      const localHandler = (e) => {
        if (e.detail?.entity === 'notifications') onNotification({ eventType: 'LOCAL_CHANGE' });
      };
      window.addEventListener('innovexa:datachange', localHandler);

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('innovexa:datachange', localHandler);
      };
    } catch (e) {
      const localHandler = (e) => {
        if (e.detail?.entity === 'notifications') onNotification({ eventType: 'LOCAL_CHANGE' });
      };
      window.addEventListener('innovexa:datachange', localHandler);
      return () => window.removeEventListener('innovexa:datachange', localHandler);
    }
  }
};
