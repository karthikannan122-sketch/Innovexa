import { supabase } from '../lib/supabase.js';
import { StorageService, notifyDataChange } from './storage.js';
import { cleanProjectTitle } from '../utils/textUtils.js';

/**
 * SupabaseService — Comprehensive Database Service Layer for INNOVEXA
 * 
 * Implements strict, typed operations for all 15 tables in the new Supabase architecture:
 * 1. profiles
 * 2. user_private_data
 * 3. categories
 * 4. projects
 * 5. project_votes
 * 6. project_suggestions
 * 7. reviews
 * 8. review_suggestions
 * 9. review_votes
 * 10. community_posts
 * 11. community_comments
 * 12. community_votes
 * 13. messages
 * 14. notifications
 * 15. project_follows
 */
const isUUID = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(val || ''));

// ============================================================================
// HIGH-SPEED IN-MEMORY TTL QUERY CACHE FOR 0ms PAGE SWITCHING
// ============================================================================
const _supabaseCache = new Map();
const DEFAULT_CACHE_TTL = 30000; // 30 seconds

export function getCachedQuery(key) {
  const item = _supabaseCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    _supabaseCache.delete(key);
    return null;
  }
  return item.data;
}

export function setCachedQuery(key, data, ttlMs = DEFAULT_CACHE_TTL) {
  if (data === undefined || data === null) return;
  _supabaseCache.set(key, {
    data,
    expiry: Date.now() + ttlMs
  });
}

export function invalidateSupabaseCache(prefix = '') {
  if (!prefix) {
    _supabaseCache.clear();
    return;
  }
  for (const key of _supabaseCache.keys()) {
    if (key.startsWith(prefix) || key.includes(prefix)) {
      _supabaseCache.delete(key);
    }
  }
}

// Invalidate on data change notifications
if (typeof window !== 'undefined') {
  window.addEventListener('innovexa:datachange', (e) => {
    const entity = e?.detail?.entity;
    if (entity) {
      invalidateSupabaseCache(entity);
    } else {
      invalidateSupabaseCache();
    }
  });
}

export const SupabaseService = {
  // Invalidation helper exposed on service
  clearCache(prefix = '') {
    invalidateSupabaseCache(prefix);
  },

  // ============================================================================
  // AUTH & USER HELPERS
  // ============================================================================
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;
      return user;
    } catch (e) {
      console.warn('[Supabase getCurrentUser exception]:', e);
      return null;
    }
  },

  // ============================================================================
  // 1. PROFILES (public.profiles)
  // ============================================================================
  async getProfiles() {
    const cacheKey = 'profiles:all';
    const cached = getCachedQuery(cacheKey);
    if (cached) return { data: cached, error: null };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('[Supabase getProfiles error]:', error.message || error);
        const local = StorageService.getUsers() || [];
        setCachedQuery(cacheKey, local, 15000);
        return { data: local, error };
      }
      const list = data || [];
      setCachedQuery(cacheKey, list, 30000);
      return { data: list, error: null };
    } catch (e) {
      console.error('[Supabase getProfiles exception]:', e);
      const local = StorageService.getUsers() || [];
      setCachedQuery(cacheKey, local, 15000);
      return { data: local, error: e };
    }
  },

  async getProfile(userId) {
    return this.getProfileById(userId);
  },

  async getProfileById(userId) {
    if (!userId) return { data: null, error: 'User ID is required' };
    const cacheKey = `profile:${userId}`;
    const cached = getCachedQuery(cacheKey);
    if (cached) return { data: cached, error: null };

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUUID) {
      const local = StorageService.getUserById(userId) || null;
      if (local) setCachedQuery(cacheKey, local, 30000);
      return { data: local, error: null };
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        const local = StorageService.getUserById(userId) || null;
        if (local) setCachedQuery(cacheKey, local, 15000);
        return { data: local, error };
      }
      const resolved = data || StorageService.getUserById(userId) || null;
      if (resolved) setCachedQuery(cacheKey, resolved, 30000);
      return { data: resolved, error: null };
    } catch (e) {
      const local = StorageService.getUserById(userId) || null;
      if (local) setCachedQuery(cacheKey, local, 15000);
      return { data: local, error: e };
    }
  },

  async updateProfile(userId, updates) {
    if (!userId) return { data: null, error: 'User ID is required' };
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('[Supabase updateProfile error]:', error);
        return { data: null, error };
      }
      return { data, error: null };
    } catch (e) {
      console.error('[Supabase updateProfile exception]:', e);
      return { data: null, error: e };
    }
  },

  // ============================================================================
  // 2. USER PRIVATE DATA (public.user_private_data)
  // ============================================================================
  async getUserPrivateData(userId) {
    if (!userId) return { data: null, error: 'User ID is required' };
    try {
      const { data, error } = await supabase
        .from('user_private_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Supabase getUserPrivateData error]:', error.message || error);
        return { data: null, error };
      }
      return { data: data || null, error: null };
    } catch (e) {
      console.error('[Supabase getUserPrivateData exception]:', e);
      return { data: null, error: e };
    }
  },

  async updateUserPrivateData(userId, updates) {
    if (!userId) return { data: null, error: 'User ID is required' };
    try {
      const { data, error } = await supabase
        .from('user_private_data')
        .upsert({
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('[Supabase updateUserPrivateData error]:', error);
        return { data: null, error };
      }
      return { data, error: null };
    } catch (e) {
      console.error('[Supabase updateUserPrivateData exception]:', e);
      return { data: null, error: e };
    }
  },

  // ============================================================================
  // 3. CATEGORIES (public.categories)
  // ============================================================================
  async getCategories() {
    const cacheKey = 'categories:all';
    const cached = getCachedQuery(cacheKey);
    if (cached) return { data: cached, error: null };

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description, icon, created_at')
        .order('name', { ascending: true });

      if (error) {
        console.error('[Supabase getCategories error]:', error.message || error);
        const local = StorageService.getCategories() || [];
        setCachedQuery(cacheKey, local, 15000);
        return { data: local, error };
      }

      if (data && data.length > 0) {
        setCachedQuery(cacheKey, data, 60000);
        return { data, error: null };
      }

      const local = StorageService.getCategories() || [];
      setCachedQuery(cacheKey, local, 60000);
      return { data: local, error: null };
    } catch (err) {
      console.error('[Supabase getCategories exception]:', err);
      const local = StorageService.getCategories() || [];
      setCachedQuery(cacheKey, local, 15000);
      return { data: local, error: err };
    }
  },

  async getCategoryBySlug(slug) {
    if (!slug) return { data: null, error: 'Slug is required' };
    const cacheKey = `category:${slug}`;
    const cached = getCachedQuery(cacheKey);
    if (cached) return { data: cached, error: null };

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        console.error(`[Supabase getCategoryBySlug error for ${slug}]:`, error);
        return { data: null, error };
      }
      if (data) setCachedQuery(cacheKey, data, 60000);
      return { data, error: null };
    } catch (e) {
      console.error('[Supabase getCategoryBySlug exception]:', e);
      return { data: null, error: e };
    }
  },

  // ============================================================================
  // 4. PROJECTS (public.projects - 24 columns)
  // ============================================================================
  async getProjects(filters = {}) {
    const cacheKey = `projects:${JSON.stringify(filters)}`;
    const cached = getCachedQuery(cacheKey);
    if (cached) return { data: cached, error: null };

    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          categories:category_id (
            id,
            name,
            slug,
            description,
            icon
          ),
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            headline,
            role,
            reputation_points
          )
        `);

      // Sorting - only use physical DB columns in Supabase SQL query (created_at)
      const sortMode = (filters.sort_by || filters.sortBy || 'newest').toLowerCase();
      if (sortMode === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      if (filters.category_id && filters.category_id !== 'ALL') {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.status && filters.status !== 'ALL') {
        query = query.eq('status', filters.status);
      }
      if (filters.project_type && filters.project_type !== 'ALL') {
        query = query.ilike('project_type', filters.project_type);
      }
      if (filters.project_stage && filters.project_stage !== 'ALL') {
        query = query.ilike('project_stage', filters.project_stage);
      }
      if (filters.innovation_type && filters.innovation_type !== 'ALL') {
        query = query.ilike('innovation_type', filters.innovation_type);
      }
      if (filters.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public);
      }
      if (filters.public_only) {
        query = query.neq('status', 'DRAFT').neq('status', 'draft');
      }
      if (filters.search && filters.search.trim()) {
        const s = filters.search.trim();
        query = query.or(`title.ilike.%${s}%,short_description.ilike.%${s}%,description.ilike.%${s}%,problem_statement.ilike.%${s}%,proposed_solution.ilike.%${s}%`);
      }

      const { data, error } = await query;

      const filterLocalProjects = (items = []) => {
        let res = [...items];
        if (filters.category_id && filters.category_id !== 'ALL') {
          res = res.filter(i => i.category_id === filters.category_id || i.category === filters.category_id);
        }
        if (filters.user_id) {
          res = res.filter(i => i.user_id === filters.user_id || i.creator_id === filters.user_id);
        }
        if (filters.status && filters.status !== 'ALL') {
          res = res.filter(i => (i.status || '').toUpperCase() === filters.status.toUpperCase());
        }
        if (filters.project_type && filters.project_type !== 'ALL') {
          res = res.filter(i => (i.project_type || i.type || '').toLowerCase() === filters.project_type.toLowerCase());
        }
        if (filters.project_stage && filters.project_stage !== 'ALL') {
          res = res.filter(i => (i.project_stage || i.stage || '').toLowerCase() === filters.project_stage.toLowerCase());
        }
        if (filters.innovation_type && filters.innovation_type !== 'ALL') {
          res = res.filter(i => (i.innovation_type || '').toLowerCase() === filters.innovation_type.toLowerCase());
        }
        if (filters.is_public !== undefined) {
          res = res.filter(i => filters.is_public ? i.is_public !== false : i.is_public === false);
        }
        if (filters.public_only) {
          res = res.filter(i => (i.status || '').toUpperCase() !== 'DRAFT' && i.is_public !== false);
        }
        if (filters.search && filters.search.trim()) {
          const s = filters.search.trim().toLowerCase();
          res = res.filter(i => 
            (i.title || '').toLowerCase().includes(s) ||
            (i.short_description || i.description || '').toLowerCase().includes(s) ||
            (i.problem_statement || '').toLowerCase().includes(s) ||
            (i.proposed_solution || '').toLowerCase().includes(s) ||
            (Array.isArray(i.tags) && i.tags.some(t => String(t).toLowerCase().includes(s))) ||
            (typeof i.tags === 'string' && i.tags.toLowerCase().includes(s))
          );
        }

        // Sorting for local fallback
        if (sortMode === 'oldest') {
          res.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        } else if (sortMode === 'most_upvoted' || sortMode === 'most_liked') {
          res.sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0));
        } else if (sortMode === 'most_downvoted') {
          res.sort((a, b) => (b.downvotes_count || 0) - (a.downvotes_count || 0));
        } else if (sortMode === 'most_reviewed') {
          res.sort((a, b) => (b.valid_reviews_count || 0) - (a.valid_reviews_count || 0));
        } else if (sortMode === 'highest_rated') {
          res.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        } else {
          res.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        }

        return res;
      };

      if (error) {
        console.error('[Supabase getProjects error]:', error.message || error);
        const local = filterLocalProjects(StorageService.getInnovations() || []);
        setCachedQuery(cacheKey, local, 15000);
        return { data: local, error };
      }

      if (data && Array.isArray(data)) {
        // Enrich project objects with computed properties for backwards component compatibility
        const enriched = data.map((item) => {
          const author = item.profiles || {};
          const cat = item.categories || {};
          const cleanTitle = cleanProjectTitle(item.title);

          return {
            ...item,
            title: cleanTitle,
            creator_id: item.user_id,
            creator_name: author.full_name || 'Community Innovator',
            creator_avatar: author.avatar_url || '',
            category_name: cat.name || item.category_name || 'Technology',
            valid_reviews_count: item.valid_reviews_count || 0,
            upvotes_count: item.upvotes_count || 0,
            downvotes_count: item.downvotes_count || 0,
            average_rating: item.average_rating || null,
            innovation_type: item.innovation_type || item.innovationType || 'INCREMENTAL',
            is_demo: false
          };
        });

        setCachedQuery(cacheKey, enriched, 25000);
        return { data: enriched, error: null };
      }

      return { data: [], error: null };
    } catch (err) {
      console.error('[Supabase getProjects exception]:', err);
      try {
        const raw = StorageService.getInnovations() || [];
        let res = [...raw];
        if (filters.category_id && filters.category_id !== 'ALL') {
          res = res.filter(i => i.category_id === filters.category_id || i.category === filters.category_id);
        }
        if (filters.user_id) {
          res = res.filter(i => i.user_id === filters.user_id || i.creator_id === filters.user_id);
        }
        if (filters.status && filters.status !== 'ALL') {
          res = res.filter(i => (i.status || '').toUpperCase() === filters.status.toUpperCase());
        }
        if (filters.project_type && filters.project_type !== 'ALL') {
          res = res.filter(i => (i.project_type || i.type || '').toLowerCase() === filters.project_type.toLowerCase());
        }
        if (filters.project_stage && filters.project_stage !== 'ALL') {
          res = res.filter(i => (i.project_stage || i.stage || '').toLowerCase() === filters.project_stage.toLowerCase());
        }
        if (filters.innovation_type && filters.innovation_type !== 'ALL') {
          res = res.filter(i => (i.innovation_type || '').toLowerCase() === filters.innovation_type.toLowerCase());
        }
        if (filters.is_public !== undefined) {
          res = res.filter(i => filters.is_public ? i.is_public !== false : i.is_public === false);
        }
        if (filters.public_only) {
          res = res.filter(i => (i.status || '').toUpperCase() !== 'DRAFT' && i.is_public !== false);
        }
        if (filters.search && filters.search.trim()) {
          const s = filters.search.trim().toLowerCase();
          res = res.filter(i => 
            (i.title || '').toLowerCase().includes(s) ||
            (i.short_description || i.description || '').toLowerCase().includes(s) ||
            (i.problem_statement || '').toLowerCase().includes(s) ||
            (i.proposed_solution || '').toLowerCase().includes(s) ||
            (Array.isArray(i.tags) && i.tags.some(t => String(t).toLowerCase().includes(s))) ||
            (typeof i.tags === 'string' && i.tags.toLowerCase().includes(s))
          );
        }
        setCachedQuery(cacheKey, res, 15000);
        return { data: res, error: err };
      } catch {
        return { data: StorageService.getInnovations() || [], error: err };
      }
    }
  },

  // getUserProjects — defined once below at section 4 (after getProjectById)
  // Alias for backwards compatibility:
  async getMyProjects_alias(userId) { return this.getUserProjects(userId); },

  async getProject(idOrSlug) {
    return this.getProjectById(idOrSlug);
  },

  async getProjectById(idOrSlug) {
    if (!idOrSlug) return { data: null, error: 'Project ID or Slug is required' };
    const cacheKey = `project:${idOrSlug}`;
    const cached = getCachedQuery(cacheKey);
    if (cached) return { data: cached, error: null };

    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          categories:category_id (
            id,
            name,
            slug,
            description,
            icon
          ),
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            headline,
            bio,
            role,
            reputation_points
          )
        `);

      // Check if parameter is UUID or Slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug) || idOrSlug.startsWith('inno_');
      if (isUUID) {
        query = query.eq('id', idOrSlug);
      } else {
        query = query.or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error(`[Supabase getProjectById error for ${idOrSlug}]:`, error.message || error);
        const local = StorageService.getInnovationById(idOrSlug) || null;
        if (local) setCachedQuery(cacheKey, local, 15000);
        return { data: local, error };
      }

      if (data) {
        // Fetch real-time live vote counts from project_votes
        let liveUpvotes = 0;
        let liveDownvotes = 0;
        try {
          const [upRes, downRes] = await Promise.all([
            supabase.from('project_votes').select('id', { count: 'exact', head: true }).eq('project_id', data.id).eq('vote_type', 'upvote'),
            supabase.from('project_votes').select('id', { count: 'exact', head: true }).eq('project_id', data.id).eq('vote_type', 'downvote')
          ]);
          if (typeof upRes.count === 'number') liveUpvotes = upRes.count;
          if (typeof downRes.count === 'number') liveDownvotes = downRes.count;
        } catch (e) {
          console.warn('[Supabase getProjectById vote counts]:', e?.message || e);
        }

        const author = data.profiles || {};
        const cat = data.categories || {};
        const cleanTitle = cleanProjectTitle(data.title);

        const project = {
          ...data,
          title: cleanTitle,
          creator_id: data.user_id,
          creator_name: author.full_name || 'Community Innovator',
          creator_avatar: author.avatar_url || '',
          category_name: cat.name || 'Technology',
          upvotes_count: liveUpvotes,
          downvotes_count: liveDownvotes,
          valid_reviews_count: data.valid_reviews_count || 0,
          is_demo: false
        };

        setCachedQuery(cacheKey, project, 30000);
        return { data: project, error: null };
      }

      const local = StorageService.getInnovationById(idOrSlug) || null;
      if (local) setCachedQuery(cacheKey, local, 30000);
      return { data: local, error: null };
    } catch (err) {
      console.error(`[Supabase getProjectById exception for ${idOrSlug}]:`, err);
      const local = StorageService.getInnovationById(idOrSlug) || null;
      if (local) setCachedQuery(cacheKey, local, 15000);
      return { data: local, error: err };
    }
  },

  async getMyProjects(userId) {
    return this.getUserProjects(userId);
  },

  async getUserProjects(userId) {
    if (!userId) return { data: [], error: 'User ID is required' };
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUUID) {
      const local = (StorageService.getInnovations() || []).filter(
        i => i.user_id === userId || i.creator_id === userId
      );
      return { data: local, error: null };
    }
    return this.getProjects({ user_id: userId });
  },

  async createProject(projectData, currentUser) {
    let categoryId = projectData.category_id || null;

    // 1. Verify authenticated Supabase user
    let effectiveUser = (currentUser && typeof currentUser === 'object' && currentUser.id) 
      ? currentUser 
      : (typeof currentUser === 'string' && currentUser ? { id: currentUser } : null);

    if (!effectiveUser) {
      try {
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr) {
          console.error('[Supabase createProject auth error]:', authErr);
        }
        if (authData?.user?.id) {
          effectiveUser = authData.user;
        }
      } catch (e) {
        console.warn('[Supabase createProject auth check exception]:', e);
      }
    }

    if (!effectiveUser && projectData.user_id) {
      effectiveUser = { id: projectData.user_id };
    }

    if (!effectiveUser || !effectiveUser.id) {
      const authErr = new Error('Authentication required: please sign in to create a project.');
      console.error('[Supabase createProject error]:', authErr);
      return { data: null, error: authErr };
    }

    try {
      // 2. Resolve Category UUID robustly against DB categories
      const { data: dbCategories } = await supabase.from('categories').select('id, name, slug');
      let resolvedCategoryName = projectData.category_name || 'Technology';

      if (dbCategories && dbCategories.length > 0) {
        const existingCat = dbCategories.find(c => c.id === categoryId);
        if (existingCat) {
          resolvedCategoryName = existingCat.name;
        } else {
          // Attempt match by name or slug
          let match = null;
          if (projectData.category_name) {
            match = dbCategories.find(c => 
              c.name.toLowerCase() === projectData.category_name.toLowerCase() || 
              c.slug.toLowerCase() === projectData.category_name.toLowerCase()
            );
          }
          if (match) {
            categoryId = match.id;
            resolvedCategoryName = match.name;
          } else {
            const defaultCat = dbCategories.find(c => c.slug === 'technology') || dbCategories[0];
            categoryId = defaultCat.id;
            resolvedCategoryName = defaultCat.name;
          }
        }
      }

      const cleanTitle = cleanProjectTitle(projectData.title || 'Untitled Specimen');
      const shortDesc = (projectData.short_description || projectData.description || projectData.problem_statement || cleanTitle).trim();
      const fullDesc = (projectData.description || projectData.short_description || projectData.proposed_solution || cleanTitle).trim();
      const projStatus = (projectData.status || (projectData.as_draft ? 'draft' : 'published')).toLowerCase();
      const isPublic = projectData.is_public !== undefined ? Boolean(projectData.is_public) : (projStatus === 'published');

      // Generate clean unique slug
      const baseSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'innovation';
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const generatedSlug = `${baseSlug}-${randomSuffix}`;

      // Normalize project_type: 'idea' | 'product' | 'startup' | 'prototype' | 'research'
      const rawType = (projectData.project_type || projectData.creation_type || 'idea').toLowerCase();
      const validTypes = ['idea', 'product', 'startup', 'prototype', 'research'];
      const normalizedType = validTypes.includes(rawType) ? rawType : 'idea';

      // Normalize project_stage to check constraint: 'idea' | 'concept' | 'prototype' | 'development' | 'testing' | 'launched'
      const rawStage = (projectData.project_stage || 'idea').toLowerCase();
      const validStages = ['idea', 'concept', 'prototype', 'development', 'testing', 'launched'];
      let normalizedStage = 'idea';
      if (validStages.includes(rawStage)) {
        normalizedStage = rawStage;
      } else if (rawStage === 'live' || rawStage === 'beta' || rawStage === 'mvp') {
        normalizedStage = 'launched';
      }

      const newProjectPayload = {
        user_id: effectiveUser.id,
        category_id: categoryId,
        title: cleanTitle,
        slug: projectData.slug || generatedSlug,
        short_description: shortDesc,
        description: fullDesc,
        problem_statement: projectData.problem_statement ? projectData.problem_statement.trim() : null,
        proposed_solution: projectData.proposed_solution ? projectData.proposed_solution.trim() : null,
        project_type: normalizedType,
        project_stage: normalizedStage,
        innovation_type: (projectData.innovation_type || 'technical').toLowerCase(),
        target_users: projectData.target_users ? projectData.target_users.trim() : null,
        features: Array.isArray(projectData.features) ? projectData.features : [],
        tags: Array.isArray(projectData.tags) ? projectData.tags : [],
        cover_image: projectData.cover_image || null,
        images: Array.isArray(projectData.images) ? projectData.images : (projectData.images ? [projectData.images] : []),
        launch_url: projectData.launch_url || projectData.website_url || null,
        demo_url: projectData.demo_url || null,
        github_url: projectData.github_url || null,
        status: projStatus,
        is_public: isPublic
      };

      console.log('[CREATE PROJECT] Executing Supabase Insert with Payload:', {
        user_id: newProjectPayload.user_id,
        title: newProjectPayload.title,
        category_id: newProjectPayload.category_id,
        project_type: newProjectPayload.project_type,
        project_stage: newProjectPayload.project_stage,
        status: newProjectPayload.status
      });

      // 3. Execute insertion in Supabase
      const { data, error } = await supabase
        .from('projects')
        .insert([newProjectPayload])
        .select(`
          *,
          categories:category_id (
            id,
            name,
            slug,
            description,
            icon
          ),
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            headline,
            role,
            reputation_points
          )
        `)
        .single();

      if (error) {
        console.error('[PROJECT INSERT ERROR]', error);
        throw error;
      }

      if (!data || !data.id) {
        throw new Error('Project was not created successfully: no project ID returned from Supabase.');
      }

      // 4. Verify project existence in Supabase
      const { data: savedProject, error: fetchError } = await supabase
        .from('projects')
        .select(`
          *,
          categories:category_id (
            id,
            name,
            slug,
            description,
            icon
          ),
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            headline,
            role,
            reputation_points
          )
        `)
        .eq('id', data.id)
        .single();

      if (fetchError || !savedProject) {
        console.error('[PROJECT VERIFICATION ERROR]', fetchError);
        throw (fetchError || new Error('Project verification in database failed.'));
      }

      console.log('[PROJECT CREATED & VERIFIED IN SUPABASE]:', savedProject.id, savedProject.title);

      // 5. Update local storage cache and notify subscribers
      const author = savedProject.profiles || {};
      const cat = savedProject.categories || {};
      const finalProject = {
        ...savedProject,
        creator_id: savedProject.user_id,
        creator_name: author.full_name || effectiveUser.name || effectiveUser.full_name || 'Innovator',
        creator_avatar: author.avatar_url || effectiveUser.avatar || effectiveUser.avatar_url || '',
        category_name: cat.name || resolvedCategoryName,
        upvotes_count: savedProject.upvotes_count || 0,
        downvotes_count: savedProject.downvotes_count || 0,
        valid_reviews_count: savedProject.valid_reviews_count || 0
      };

      StorageService.addInnovation(finalProject);
      notifyDataChange('projects');

      return { data: finalProject, error: null };
    } catch (err) {
      console.error('[PROJECT SUBMISSION ERROR]:', err);
      return { data: null, error: err };
    }
  },

  async updateProject(projectId, updates, userId) {
    if (!projectId) return { data: null, error: 'Project ID is required' };
    
    // Check owner authorization if userId is supplied
    const existing = StorageService.getInnovationById(projectId);
    if (existing && userId && existing.user_id && existing.user_id !== userId && existing.creator_id !== userId) {
      const authErr = new Error('Unauthorized: only the project owner can update this project.');
      console.warn(`[Supabase updateProject permission error for ${projectId}]:`, authErr.message);
      return { data: null, error: authErr };
    }

    try {
      // Whitelist only valid DB columns for projects table
      const VALID_PROJECT_COLUMNS = new Set([
        'id', 'user_id', 'category_id', 'title', 'slug', 'short_description', 'description',
        'project_type', 'innovation_type', 'project_stage', 'status', 'problem_statement',
        'proposed_solution', 'target_users', 'features', 'tags', 'images', 'cover_image',
        'launch_url', 'demo_url', 'github_url', 'is_public'
      ]);

      const sanitizedUpdates = {};
      for (const [k, v] of Object.entries(updates || {})) {
        if (VALID_PROJECT_COLUMNS.has(k) && v !== undefined) {
          sanitizedUpdates[k] = v;
        }
      }
      sanitizedUpdates.updated_at = new Date().toISOString();

      let query = supabase
        .from('projects')
        .update(sanitizedUpdates)
        .eq('id', projectId);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query
        .select(`
          *,
          categories:category_id (
            id,
            name,
            slug
          ),
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      StorageService.updateInnovation(projectId, data || updates);
      notifyDataChange('projects');

      return { data, error: null };
    } catch (err) {
      console.warn(`[Supabase updateProject fallback for ${projectId}]:`, err.message || err);
      try {
        const updatedLocal = StorageService.updateInnovation(projectId, updates);
        notifyDataChange('projects');
        return { data: updatedLocal || { id: projectId, ...updates }, error: null };
      } catch (e) {
        return { data: null, error: err };
      }
    }
  },

  async deleteProject(projectId, userId) {
    if (!projectId) return { data: null, error: 'Project ID is required' };

    // Check owner authorization if userId is supplied
    const existing = StorageService.getInnovationById(projectId);
    if (existing && userId && existing.user_id && existing.user_id !== userId && existing.creator_id !== userId) {
      const authErr = new Error('Unauthorized: only the project owner can delete this project.');
      console.warn(`[Supabase deleteProject permission error for ${projectId}]:`, authErr.message);
      return { success: false, error: authErr };
    }

    try {
      let query = supabase.from('projects').delete().eq('id', projectId);
      if (userId) query = query.eq('user_id', userId);

      const { error } = await query;
      if (error) {
        throw error;
      }

      StorageService.deleteInnovation(projectId);
      notifyDataChange('projects');
      return { success: true, error: null };
    } catch (err) {
      console.warn(`[Supabase deleteProject fallback for ${projectId}]:`, err.message || err);
      try {
        StorageService.deleteInnovation(projectId);
        notifyDataChange('projects');
        return { success: true, error: null };
      } catch (e) {
        return { success: false, error: err };
      }
    }
  },

  async incrementProjectViewCount(projectId) {
    if (!projectId) return;
    try {
      await supabase.rpc('increment_project_view_count', { p_project_id: projectId });
    } catch (e) {
      // Non-blocking telemetry
    }
  },

  /**
   * getProjectAnalytics — Phase 7 Project Insights and Real Database Telemetry
   * Fetches real counts and rows from projects, project_votes, reviews,
   * project_suggestions, and project_follows to calculate authoritative metrics.
   */
  async getProjectAnalytics(projectId) {
    if (!projectId) {
      return { data: null, error: 'Project ID is required for analytics' };
    }

    try {
      // Parallel execution across all relevant tables
      const [
        projRes,
        votesRes,
        reviewsRes,
        suggestionsRes,
        followsRes
      ] = await Promise.all([
        supabase.from('projects').select('*, profiles:user_id(full_name, avatar_url), categories:category_id(name)').eq('id', projectId).maybeSingle(),
        supabase.from('project_votes').select('vote_type, created_at').eq('project_id', projectId),
        supabase.from('reviews').select('id, rating, problem_relevance, solution_effectiveness, market_potential, overall_feedback, helpful_votes_count, unhelpful_votes_count, is_valid, created_at').eq('project_id', projectId),
        supabase.from('project_suggestions').select('id, suggestion_type, status, created_at').eq('project_id', projectId),
        supabase.from('project_follows').select('id, created_at').eq('project_id', projectId)
      ]);

      let project = projRes.data;
      let votes = votesRes.data || [];
      let reviews = reviewsRes.data || [];
      let suggestions = suggestionsRes.data || [];
      let follows = followsRes.data || [];

      // Fallback to local storage if Supabase returned null or in local mode
      if (!project) {
        project = StorageService.getInnovationById(projectId);
      }
      if (votes.length === 0) {
        const localVotes = StorageService.getProjectVotes?.(projectId) || [];
        if (localVotes.length > 0) votes = localVotes;
      }
      if (reviews.length === 0) {
        const localRevs = StorageService.getReviewsForInnovation(projectId) || [];
        if (localRevs.length > 0) reviews = localRevs;
      }
      if (suggestions.length === 0) {
        const localSugg = StorageService.getSuggestionsByProject?.(projectId) || [];
        if (localSugg.length > 0) suggestions = localSugg;
      }
      if (follows.length === 0) {
        const localFollows = StorageService.getFollowersByProject?.(projectId) || [];
        if (localFollows.length > 0) follows = localFollows;
      }

      if (!project) {
        return { data: null, error: `Project '${projectId}' not found` };
      }

      // ================= COMPUTED METRICS =================
      const views = Math.max(0, project.views_count || (project.views || 0));
      
      // Upvotes & Downvotes
      const upvotes = votes.filter(v => (v.vote_type || v.type) === 'upvote').length || (project.upvotes_count || 0);
      const downvotes = votes.filter(v => (v.vote_type || v.type) === 'downvote').length || (project.downvotes_count || 0);
      const totalVotes = upvotes + downvotes;

      // Reviews & Ratings
      const reviewsCount = reviews.length;
      const validRatings = reviews.map(r => Number(r.rating)).filter(n => !isNaN(n) && n >= 1 && n <= 5);
      const averageRating = validRatings.length > 0
        ? Number((validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(2))
        : 0;

      // Helpful reviews (reviews that received helpful votes or positive review rating)
      const helpfulReviewCount = reviews.filter(r => (r.helpful_votes_count || 0) > (r.unhelpful_votes_count || 0) || (r.helpful_votes_count || 0) > 0).length;
      const totalHelpfulVotes = reviews.reduce((sum, r) => sum + (Number(r.helpful_votes_count) || 0), 0);

      // Suggestions & Followers
      const suggestionsCount = suggestions.length;
      const followersCount = follows.length;

      // Rating Distribution
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      validRatings.forEach(score => {
        const rounded = Math.min(5, Math.max(1, Math.round(score)));
        ratingDistribution[rounded] = (ratingDistribution[rounded] || 0) + 1;
      });

      // 1. Engagement Rate Calculation: total interactions divided by views
      const totalInteractions = upvotes + downvotes + reviewsCount + suggestionsCount + followersCount;
      const engagementRate = views > 0
        ? Number(((totalInteractions / views) * 100).toFixed(1))
        : (totalInteractions > 0 ? 100 : 0);

      // 2. Vote Ratio Calculation: percentage of total votes that are upvotes
      const voteRatio = totalVotes > 0
        ? Number(((upvotes / totalVotes) * 100).toFixed(1))
        : (upvotes > 0 ? 100 : 0);

      // 3. Review Score Calculation: normalized composite review rating out of 100
      const reviewScore = reviewsCount > 0
        ? Math.min(100, Math.round((averageRating / 5) * 80 + Math.min(20, reviewsCount * 4)))
        : 0;

      // 4. Community Engagement Score: weighted composite interaction index
      const communityEngagement = Math.round(
        (upvotes * 2) +
        (downvotes * 0.5) +
        (reviewsCount * 5) +
        (suggestionsCount * 4) +
        (followersCount * 3) +
        (totalHelpfulVotes * 1.5)
      );

      // Activity Timeline (Daily aggregations for trend charting)
      const dateMap = {};
      const recordEvent = (dateStr, type) => {
        if (!dateStr) return;
        const key = dateStr.slice(0, 10);
        if (!dateMap[key]) {
          dateMap[key] = { date: key, upvotes: 0, reviews: 0, suggestions: 0, follows: 0, total: 0 };
        }
        if (type === 'upvote') dateMap[key].upvotes += 1;
        if (type === 'review') dateMap[key].reviews += 1;
        if (type === 'suggestion') dateMap[key].suggestions += 1;
        if (type === 'follow') dateMap[key].follows += 1;
        dateMap[key].total += 1;
      };

      votes.forEach(v => recordEvent(v.created_at, v.vote_type));
      reviews.forEach(r => recordEvent(r.created_at, 'review'));
      suggestions.forEach(s => recordEvent(s.created_at, 'suggestion'));
      follows.forEach(f => recordEvent(f.created_at, 'follow'));

      const activityTimeline = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

      return {
        data: {
          project_id: project.id,
          title: cleanProjectTitle(project.title),
          category_name: project.categories?.name || project.category_name || 'Technology',
          project_stage: project.project_stage || 'idea',
          status: project.status || 'UNDER_VALIDATION',
          created_at: project.created_at,
          published_at: project.published_at || project.created_at,
          creator_id: project.user_id,
          creator_name: project.profiles?.full_name || project.creator_name || 'Innovator',
          creator_avatar: project.profiles?.avatar_url || project.creator_avatar || '',
          
          // Primary Metrics from Supabase
          views,
          upvotes,
          downvotes,
          total_votes: totalVotes,
          reviews_count: reviewsCount,
          average_rating: averageRating,
          helpful_review_count: helpfulReviewCount,
          total_helpful_votes: totalHelpfulVotes,
          suggestions_count: suggestionsCount,
          followers_count: followersCount,
          
          // Calculated Strategic Metrics
          engagement_rate: engagementRate,
          vote_ratio: voteRatio,
          review_score: reviewScore,
          community_engagement: communityEngagement,
          
          // Data Breakdowns for Visuals
          rating_distribution: ratingDistribution,
          activity_timeline: activityTimeline,
          
          // Insufficient Data Safeguards
          has_enough_vote_data: totalVotes > 0,
          has_enough_review_data: reviewsCount > 0,
          has_enough_engagement_data: totalInteractions > 0 || views > 0,
          has_enough_timeline_data: activityTimeline.length >= 2,
          has_enough_suggestions_data: suggestionsCount > 0,
          has_enough_followers_data: followersCount > 0
        },
        error: null
      };
    } catch (err) {
      console.error(`[Supabase getProjectAnalytics exception for ${projectId}]:`, err);
      return { data: null, error: err };
    }
  },

  // ============================================================================
  // 5. PROJECT VOTES (public.project_votes)
  // ============================================================================
  async voteProject({ projectId, userId, voteType = 'upvote' }) {
    if (!projectId || !userId) {
      const err = new Error('Project ID and User ID are required to vote.');
      console.error('[Supabase voteProject error]:', err);
      return { data: null, error: err };
    }

    if (!isUUID(projectId) || !isUUID(userId)) {
      const res = StorageService.toggleVote({
        userId,
        targetType: 'project',
        targetId: projectId,
        voteType
      });
      const action = res?.activeVoteType ? (res.activeVoteType === voteType ? 'created' : 'updated') : 'removed';
      return { data: { action, vote_type: res?.activeVoteType || null }, error: null };
    }

    try {
      // 1. Check existing vote in Supabase
      const { data: existingVote, error: fetchErr } = await supabase
        .from('project_votes')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Toggle off: clicked same vote again -> remove vote
          const { error: delErr } = await supabase
            .from('project_votes')
            .delete()
            .eq('id', existingVote.id);

          if (delErr) throw delErr;
          StorageService.toggleVote({ userId, targetType: 'project', targetId: projectId, voteType });
          notifyDataChange('project_votes');
          return { data: { action: 'removed', vote_type: null }, error: null };
        } else {
          // Switch vote: e.g. upvote -> downvote
          const { data: updated, error: updateErr } = await supabase
            .from('project_votes')
            .update({
              vote_type: voteType,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingVote.id)
            .select()
            .single();

          if (updateErr) throw updateErr;
          StorageService.toggleVote({ userId, targetType: 'project', targetId: projectId, voteType });
          notifyDataChange('project_votes');
          return { data: { action: 'updated', vote_type: voteType, vote: updated }, error: null };
        }
      } else {
        // Insert new vote
        const { data: newVote, error: insertErr } = await supabase
          .from('project_votes')
          .insert([{
            project_id: projectId,
            user_id: userId,
            vote_type: voteType
          }])
          .select()
          .single();

        if (insertErr) throw insertErr;

        StorageService.toggleVote({ userId, targetType: 'project', targetId: projectId, voteType });
        notifyDataChange('project_votes');
        return { data: { action: 'created', vote_type: voteType, vote: newVote }, error: null };
      }
    } catch (err) {
      console.warn('[Supabase voteProject fallback to storage]:', err.message || err);
      const res = StorageService.toggleVote({
        userId,
        targetType: 'project',
        targetId: projectId,
        voteType
      });
      const action = res?.activeVoteType ? (res.activeVoteType === voteType ? 'created' : 'updated') : 'removed';
      return { data: { action, vote_type: res?.activeVoteType || null }, error: null };
    }
  },

  async removeProjectVote(projectId, userId) {
    if (!projectId || !userId) return { success: false, error: 'Project ID and User ID required' };
    if (!isUUID(projectId) || !isUUID(userId)) {
      try {
        const localVotes = StorageService.getVotes() || [];
        const filtered = localVotes.filter(v => !(v.target_type === 'project' && (String(v.target_id) === String(projectId) || String(v.innovation_id) === String(projectId)) && String(v.user_id) === String(userId)));
        localStorage.setItem('innovexa_votes_v2', JSON.stringify(filtered));
        notifyDataChange('project_votes');
        return { success: true, error: null };
      } catch (err) {
        return { success: false, error: err };
      }
    }
    try {
      const { error } = await supabase
        .from('project_votes')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) throw error;
      notifyDataChange('project_votes');
      return { success: true, error: null };
    } catch (e) {
      try {
        const localVotes = StorageService.getVotes() || [];
        const filtered = localVotes.filter(v => !(v.target_type === 'project' && (String(v.target_id) === String(projectId) || String(v.innovation_id) === String(projectId)) && String(v.user_id) === String(userId)));
        localStorage.setItem('innovexa_votes_v2', JSON.stringify(filtered));
        notifyDataChange('project_votes');
        return { success: true, error: null };
      } catch (err) {
        return { success: false, error: e };
      }
    }
  },

  async getProjectVotes(projectId) {
    if (!projectId) return { upvotes: 0, downvotes: 0, total: 0, error: null };
    if (!isUUID(projectId)) {
      return StorageService.getProjectVotes(projectId);
    }
    try {
      const [upRes, downRes] = await Promise.all([
        supabase.from('project_votes').select('id', { count: 'exact', head: true }).eq('project_id', projectId).eq('vote_type', 'upvote'),
        supabase.from('project_votes').select('id', { count: 'exact', head: true }).eq('project_id', projectId).eq('vote_type', 'downvote')
      ]);

      if (!upRes.error && !downRes.error) {
        const inno = StorageService.getInnovationById(projectId);
        const baseUp = inno ? (inno.base_upvotes ?? (inno.upvotes_count || 0)) : 0;
        const baseDown = inno ? (inno.base_downvotes ?? (inno.downvotes_count || 0)) : 0;
        const upvotes = baseUp + (upRes.count || 0);
        const downvotes = baseDown + (downRes.count || 0);
        return { upvotes, downvotes, total: upvotes - downvotes, error: null };
      }
    } catch (e) {}

    return StorageService.getProjectVotes(projectId);
  },

  async getUserProjectVote(projectId, userId) {
    if (!projectId || !userId) return null;
    if (!isUUID(projectId) || !isUUID(userId)) {
      return StorageService.getUserVote(userId, 'project', projectId);
    }
    try {
      const { data, error } = await supabase
        .from('project_votes')
        .select('vote_type')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return data.vote_type;
      }
    } catch (e) {}

    return StorageService.getUserVote(userId, 'project', projectId);
  },

  // Backwards-compatible vote helpers
  async toggleProjectLike(projectId, currentUser) {
    if (!currentUser?.id) return { data: null, error: 'User must be signed in' };
    return this.voteProject({ projectId, userId: currentUser.id, voteType: 'upvote' });
  },

  async toggleVote({ projectId, voteType = 'upvote', currentUser }) {
    if (!currentUser?.id) return { data: null, error: 'User must be signed in' };
    return this.voteProject({ projectId, userId: currentUser.id, voteType });
  },

  async hasUserLikedProject(projectId, userId) {
    const v = await this.getUserProjectVote(projectId, userId);
    return v === 'upvote';
  },

  async hasUserDislikedProject(projectId, userId) {
    const v = await this.getUserProjectVote(projectId, userId);
    return v === 'downvote';
  },

  // ============================================================================
  // 6. PROJECT SUGGESTIONS (public.project_suggestions)
  // ============================================================================
  async createProjectSuggestion({ projectId, userId, title, content, suggestionType = 'general' }) {
    if (!projectId || !userId || !content) {
      const err = new Error('Project ID, User ID, and Content are required for suggestions.');
      console.error('[Supabase createProjectSuggestion error]:', err);
      return { data: null, error: err };
    }

    try {
      const { data, error } = await supabase
        .from('project_suggestions')
        .insert([{
          project_id: projectId,
          user_id: userId,
          title: title || 'Project Enhancement Suggestion',
          content: content.trim(),
          suggestion_type: suggestionType,
          status: 'open'
        }])
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Notify project owner about the suggestion (fire-and-forget)
      try {
        const { data: proj } = await supabase.from('projects').select('user_id, title').eq('id', projectId).maybeSingle();
        if (proj?.user_id && proj.user_id !== userId) {
          const { data: suggester } = await supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle();
          const suggesterName = suggester?.full_name || 'Someone';
          await this.createNotification({
            userId: proj.user_id,
            actorId: userId,
            projectId: projectId,
            type: 'project_suggestion',
            title: `New suggestion on "${proj.title || 'your project'}"`,
            message: `${suggesterName} submitted: "${(title || content || '').slice(0, 80)}"`,
            link: `detail:${projectId}`
          });
        }
      } catch (_) {}

      notifyDataChange('project_suggestions');
      return { data, error: null };
    } catch (err) {
      console.warn('[Supabase createProjectSuggestion fallback to storage]:', err.message || err);
      try {
        const localSugs = JSON.parse(localStorage.getItem('innovexa_project_suggestions_v2') || '[]');
        const newSug = {
          id: `sug_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          project_id: projectId,
          user_id: userId,
          title: title || 'Project Enhancement Suggestion',
          content: content.trim(),
          suggestion_type: suggestionType,
          status: 'open',
          created_at: new Date().toISOString()
        };
        localSugs.unshift(newSug);
        localStorage.setItem('innovexa_project_suggestions_v2', JSON.stringify(localSugs));
        notifyDataChange('project_suggestions');
        return { data: newSug, error: null };
      } catch (e) {
        return { data: null, error: err };
      }
    }
  },

  async getProjectSuggestions(projectId) {
    if (!projectId) return { data: [], error: null };
    try {
      const { data, error } = await supabase
        .from('project_suggestions')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (e) {
      try {
        const localSugs = JSON.parse(localStorage.getItem('innovexa_project_suggestions_v2') || '[]');
        const filtered = localSugs.filter(s => s.project_id === projectId);
        return { data: filtered, error: null };
      } catch {
        return { data: [], error: e };
      }
    }
  },

  async updateProjectSuggestionStatus(suggestionId, status, userId) {
    if (!suggestionId || !status) return { data: null, error: 'Suggestion ID and Status required' };
    try {
      let query = supabase
        .from('project_suggestions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', suggestionId);

      const { data, error } = await query.select().single();
      if (error) throw error;
      notifyDataChange('project_suggestions');
      return { data, error: null };
    } catch (e) {
      try {
        const localSugs = JSON.parse(localStorage.getItem('innovexa_project_suggestions_v2') || '[]');
        const idx = localSugs.findIndex(s => s.id === suggestionId);
        if (idx !== -1) {
          localSugs[idx].status = status;
          localSugs[idx].updated_at = new Date().toISOString();
          localStorage.setItem('innovexa_project_suggestions_v2', JSON.stringify(localSugs));
          notifyDataChange('project_suggestions');
          return { data: localSugs[idx], error: null };
        }
        return { data: null, error: 'Suggestion not found' };
      } catch {
        return { data: null, error: e };
      }
    }
  },

  // ============================================================================
  // 6.5. PROJECT FOLLOWS (public.project_follows)
  // ============================================================================
  async followProject(arg1, arg2) {
    const projectId = typeof arg1 === 'object' && arg1 !== null ? (arg1.projectId || arg1.id) : arg1;
    const userId = typeof arg1 === 'object' && arg1 !== null ? (arg1.userId || arg1.user_id) : arg2;
    if (!projectId || !userId) {
      return { success: false, isFollowing: false, error: 'Project ID and User ID are required' };
    }
    try {
      const { data, error } = await supabase
        .from('project_follows')
        .upsert([{ project_id: projectId, user_id: userId }], { onConflict: 'project_id,user_id' })
        .select()
        .single();

      if (error) throw error;

      // Notify project owner about the follow (fire-and-forget)
      try {
        const { data: proj } = await supabase.from('projects').select('user_id, title').eq('id', projectId).maybeSingle();
        if (proj?.user_id && proj.user_id !== userId) {
          const { data: follower } = await supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle();
          const followerName = follower?.full_name || 'Someone';
          await this.createNotification({
            userId: proj.user_id,
            actorId: userId,
            projectId: projectId,
            type: 'project_follow',
            title: `${followerName} is now following "${proj.title || 'your project'}"`,
            message: `${followerName} added your project to their watchlist.`,
            link: `detail:${projectId}`
          });
        }
      } catch (_) {}

      notifyDataChange('project_follows');
      return { success: true, isFollowing: true, data, error: null };
    } catch (err) {
      console.warn('[Supabase followProject fallback to storage]:', err.message || err);
      try {
        const localFollows = JSON.parse(localStorage.getItem('innovexa_project_follows_v2') || '[]');
        if (!localFollows.some(f => f.project_id === projectId && f.user_id === userId)) {
          localFollows.push({
            id: `fol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            project_id: projectId,
            user_id: userId,
            created_at: new Date().toISOString()
          });
          localStorage.setItem('innovexa_project_follows_v2', JSON.stringify(localFollows));
        }
        notifyDataChange('project_follows');
        return { success: true, isFollowing: true, error: null };
      } catch (e) {
        return { success: false, isFollowing: false, error: err };
      }
    }
  },

  async unfollowProject(arg1, arg2) {
    const projectId = typeof arg1 === 'object' && arg1 !== null ? (arg1.projectId || arg1.id) : arg1;
    const userId = typeof arg1 === 'object' && arg1 !== null ? (arg1.userId || arg1.user_id) : arg2;
    if (!projectId || !userId) {
      return { success: false, isFollowing: false, error: 'Project ID and User ID are required' };
    }
    try {
      const { error } = await supabase
        .from('project_follows')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) throw error;

      notifyDataChange('project_follows');
      return { success: true, isFollowing: false, error: null };
    } catch (err) {
      console.warn('[Supabase unfollowProject fallback to storage]:', err.message || err);
      try {
        const localFollows = JSON.parse(localStorage.getItem('innovexa_project_follows_v2') || '[]');
        const filtered = localFollows.filter(f => !(f.project_id === projectId && f.user_id === userId));
        localStorage.setItem('innovexa_project_follows_v2', JSON.stringify(filtered));
        notifyDataChange('project_follows');
        return { success: true, isFollowing: false, error: null };
      } catch (e) {
        return { success: false, isFollowing: false, error: err };
      }
    }
  },

  async toggleFollowProject(arg1, arg2) {
    const projectId = typeof arg1 === 'object' && arg1 !== null ? (arg1.projectId || arg1.id) : arg1;
    const userId = typeof arg1 === 'object' && arg1 !== null ? (arg1.userId || arg1.user_id) : arg2;
    if (!projectId || !userId) {
      return { isFollowing: false, error: 'User must be signed in to follow projects' };
    }
    try {
      const currentlyFollowing = await this.isProjectFollowed(projectId, userId);
      if (currentlyFollowing) {
        const res = await this.unfollowProject(projectId, userId);
        return { isFollowing: false, error: res.error || null };
      } else {
        const res = await this.followProject(projectId, userId);
        return { isFollowing: true, error: res.error || null };
      }
    } catch (err) {
      console.error('[Supabase toggleFollowProject exception]:', err);
      return { isFollowing: false, error: err };
    }
  },

  async isProjectFollowed(arg1, arg2) {
    const projectId = typeof arg1 === 'object' && arg1 !== null ? (arg1.projectId || arg1.id) : arg1;
    const userId = typeof arg1 === 'object' && arg1 !== null ? (arg1.userId || arg1.user_id) : arg2;
    if (!projectId || !userId) return false;
    try {
      const { data, error } = await supabase
        .from('project_follows')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) return true;
    } catch (e) {}

    try {
      const localFollows = JSON.parse(localStorage.getItem('innovexa_project_follows_v2') || '[]');
      return localFollows.some(f => f.project_id === projectId && f.user_id === userId);
    } catch {
      return false;
    }
  },

  async getProjectFollowersCount(projectId) {
    if (!projectId) return 0;
    try {
      const { count, error } = await supabase
        .from('project_follows')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId);

      if (!error && typeof count === 'number') return count;
    } catch (e) {}

    try {
      const localFollows = JSON.parse(localStorage.getItem('innovexa_project_follows_v2') || '[]');
      return localFollows.filter(f => f.project_id === projectId).length;
    } catch {
      return 0;
    }
  },

  async getProjectFollowers(projectId) {
    if (!projectId) return { data: [], error: null };
    try {
      const { data, error } = await supabase
        .from('project_follows')
        .select(`
          id,
          created_at,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            headline
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (!error && data) return { data, error: null };
    } catch (e) {}

    try {
      const localFollows = JSON.parse(localStorage.getItem('innovexa_project_follows_v2') || '[]');
      const filtered = localFollows.filter(f => f.project_id === projectId);
      return { data: filtered, error: null };
    } catch (e) {
      return { data: [], error: e };
    }
  },

  async getUserFollowedProjects(userId) {
    if (!userId) return { data: [], error: null };
    try {
      const { data, error } = await supabase
        .from('project_follows')
        .select(`
          id,
          created_at,
          projects:project_id (
            *,
            categories:category_id (*),
            profiles:user_id (*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Supabase getUserFollowedProjects error]:', error);
        return { data: [], error };
      }
      return { data: (data || []).map(f => f.projects).filter(Boolean), error: null };
    } catch (e) {
      console.error('[Supabase getUserFollowedProjects exception]:', e);
      return { data: [], error: e };
    }
  },

  // ============================================================================
  // 7. REVIEWS (public.reviews - project_id, user_id, rating, title, content, is_public)
  // ============================================================================
  async createReview({ projectId, userId, rating = 5, title = '', content = '', isPublic = true }) {
    if (!projectId || !userId || !content) {
      const err = new Error('Project ID, User ID, and Content are required to submit a review.');
      console.error('[Supabase createReview error]:', err);
      return { data: null, error: err };
    }

    // NOTE: The reviews table uses reviewer_id (NOT user_id) as the author column.
    // The RLS policy enforces: auth.uid() = reviewer_id.
    // The unique constraint is: UNIQUE (project_id, reviewer_id).
    const reviewPayload = {
      project_id: projectId,
      reviewer_id: userId,          // ← FIXED: was 'user_id', must be 'reviewer_id'
      rating: Math.max(1, Math.min(5, Number(rating) || 5)),
      overall_feedback: content.trim(), // ← FIXED: schema column is 'overall_feedback'
      suggestion: title ? title.trim() : '', // store title text in suggestion field
      title: title ? title.trim() : (content.trim().slice(0, 60) + (content.trim().length > 60 ? '...' : '')),
      content: content.trim(),      // ← added by migration FIX 2
      is_public: Boolean(isPublic)  // ← added by migration FIX 2
    };

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([reviewPayload])
        .select(`
          *,
          profiles:reviewer_id (
            id,
            username,
            full_name,
            avatar_url,
            headline,
            role,
            reputation_points
          )
        `)
        .single();

      if (error) throw error;

      if (!data?.id) {
        throw new Error('Review was not created (no ID returned)');
      }

      const enriched = {
        ...data,
        reviewer_id: data.reviewer_id || data.user_id,
        user_id: data.reviewer_id || data.user_id, // backwards-compat alias
        reviewer_name: data.profiles?.full_name || 'Community Validator',
        reviewer_avatar: data.profiles?.avatar_url || '',
        overall_feedback: data.overall_feedback || data.content || '',
        helpful_votes_count: 0,
        unhelpful_votes_count: 0
      };

      // Notify the project owner that a review was submitted (fire-and-forget)
      try {
        const { data: proj } = await supabase.from('projects').select('user_id, title').eq('id', projectId).maybeSingle();
        if (proj?.user_id && proj.user_id !== userId) {
          const reviewerName = enriched.reviewer_name;
          await this.createNotification({
            userId: proj.user_id,
            actorId: userId,
            projectId: projectId,
            type: 'new_review',
            title: `${reviewerName} reviewed "${proj.title || 'your project'}"`,
            message: `Rating: ${'⭐'.repeat(enriched.rating || 5)} — "${(enriched.title || enriched.content || '').slice(0, 80)}"`,
            link: `detail:${projectId}`
          });
        }
      } catch (_) {}

      StorageService.addReview(enriched);
      notifyDataChange('reviews');
      return { data: enriched, error: null };
    } catch (err) {
      console.warn('[Supabase createReview fallback to storage]:', err.message || err);
      try {
        const localReviews = StorageService.getReviews() || [];
        const newReview = {
          id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          project_id: projectId,
          user_id: userId,
          rating: reviewPayload.rating,
          title: reviewPayload.title,
          content: reviewPayload.content,
          is_public: reviewPayload.is_public,
          helpful_votes_count: 0,
          unhelpful_votes_count: 0,
          created_at: new Date().toISOString()
        };
        localReviews.unshift(newReview);
        localStorage.setItem('innovexa_reviews_v2', JSON.stringify(localReviews));
        notifyDataChange('reviews');
        return { data: newReview, error: null };
      } catch (e) {
        return { data: null, error: err };
      }
    }
  },

  async submitReview(projectId, rating, content, title = '', isPublic = true) {
    const user = await this.getCurrentUser();
    const effectiveUserId = user?.id || StorageService.getCurrentUserId();
    return this.createReview({
      projectId,
      userId: effectiveUserId,
      rating,
      title,
      content,
      isPublic
    });
  },

  async getProjectReviews(projectId) {
    return this.getReviews(projectId);
  },

  async getReviews(projectId) {
    if (!projectId) return { data: [], error: null };

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:reviewer_id (
            id,
            username,
            full_name,
            avatar_url,
            headline,
            role,
            reputation_points
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && Array.isArray(data)) {
        // Enrich reviews with real helpful votes from review_votes
        const enriched = await Promise.all(data.map(async (item) => {
          let helpfulVotes = 0;
          let unhelpfulVotes = 0;
          try {
            const [hRes, uRes] = await Promise.all([
              supabase.from('review_votes').select('id', { count: 'exact', head: true }).eq('review_id', item.id).eq('vote_type', 'helpful'),
              supabase.from('review_votes').select('id', { count: 'exact', head: true }).eq('review_id', item.id).eq('vote_type', 'not_helpful')
            ]);
            if (typeof hRes.count === 'number') helpfulVotes = hRes.count;
            if (typeof uRes.count === 'number') unhelpfulVotes = uRes.count;
          } catch (e) {}

          return {
            ...item,
            reviewer_id: item.reviewer_id || item.user_id,
            user_id: item.reviewer_id || item.user_id, // backwards-compat alias
            reviewer_name: item.profiles?.full_name || 'Community Validator',
            reviewer_avatar: item.profiles?.avatar_url || '',
            helpful_votes_count: helpfulVotes,
            unhelpful_votes_count: unhelpfulVotes,
            overall_feedback: item.overall_feedback || item.content,
            suggestion: item.suggestion || item.content
          };
        }));

        return { data: enriched, error: null };
      }

      return { data: [], error: null };
    } catch (err) {
      console.warn('[Supabase getReviews fallback to storage]:', err.message || err);
      try {
        const localReviews = StorageService.getReviewsForInnovation(projectId) || [];
        const localVotes = JSON.parse(localStorage.getItem('innovexa_review_votes_v2') || '[]');
        const enriched = localReviews.map(r => {
          const votesForReview = localVotes.filter(v => v.review_id === r.id);
          const helpful = votesForReview.filter(v => v.vote_type === 'helpful').length;
          const notHelpful = votesForReview.filter(v => v.vote_type === 'not_helpful').length;
          return {
            ...r,
            helpful_votes_count: Math.max(r.helpful_votes_count || 0, helpful),
            unhelpful_votes_count: Math.max(r.unhelpful_votes_count || 0, notHelpful),
            overall_feedback: r.content || r.overall_feedback,
            suggestion: r.content || r.suggestion
          };
        });
        return { data: enriched, error: null };
      } catch (e) {
        return { data: [], error: err };
      }
    }
  },

  async getUserReviews(userId) {
    if (!userId) return { data: [], error: null };
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUUID) {
      const local = (StorageService.getReviews() || []).filter(
        r => r.reviewer_id === userId || r.user_id === userId
      );
      return { data: local, error: null };
    }
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          projects:project_id (
            id,
            title,
            slug
          )
        `)
        .eq('reviewer_id', userId)  // FIXED: schema uses reviewer_id not user_id
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (e) {
      try {
        const local = StorageService.getReviewsByReviewerId(userId) || [];
        return { data: local, error: null };
      } catch {
        return { data: [], error: e };
      }
    }
  },

  async hasUserReviewedProject(projectId, userId) {
    if (!projectId || !userId) return false;
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('id')
        .eq('project_id', projectId)
        .eq('reviewer_id', userId)  // FIXED: schema uses reviewer_id not user_id
        .maybeSingle();

      if (!error && data) return true;
    } catch (e) {}

    try {
      const local = StorageService.getReviewsForInnovation(projectId) || [];
      return local.some(r => r.user_id === userId || r.reviewer_id === userId);
    } catch {
      return false;
    }
  },

  async updateReview(reviewId, updates, userId) {
    if (!reviewId) return { data: null, error: 'Review ID is required' };
    try {
      let query = supabase
        .from('reviews')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (userId) query = query.eq('user_id', userId);

      const { data, error } = await query
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      StorageService.updateReview(reviewId, data || updates);
      notifyDataChange('reviews');
      return { data, error: null };
    } catch (err) {
      console.warn(`[Supabase updateReview fallback for ${reviewId}]:`, err.message || err);
      try {
        const localReviews = StorageService.getReviews() || [];
        const idx = localReviews.findIndex(r => r.id === reviewId);
        if (idx !== -1) {
          if (userId && localReviews[idx].user_id && localReviews[idx].user_id !== userId && localReviews[idx].reviewer_id !== userId) {
            return { data: null, error: new Error('Unauthorized: only the author can update this review.') };
          }
          localReviews[idx] = {
            ...localReviews[idx],
            ...updates,
            updated_at: new Date().toISOString()
          };
          localStorage.setItem('innovexa_reviews_v2', JSON.stringify(localReviews));
          notifyDataChange('reviews');
          return { data: localReviews[idx], error: null };
        }
        return { data: null, error: new Error('Review not found') };
      } catch (e) {
        return { data: null, error: err };
      }
    }
  },

  async deleteReview(reviewId, userId) {
    if (!reviewId) return { success: false, error: 'Review ID is required' };
    try {
      let query = supabase.from('reviews').delete().eq('id', reviewId);
      if (userId) query = query.eq('user_id', userId);

      const { error } = await query;
      if (error) throw error;

      StorageService.deleteReview(reviewId);
      notifyDataChange('reviews');
      return { success: true, error: null };
    } catch (err) {
      console.warn(`[Supabase deleteReview fallback for ${reviewId}]:`, err.message || err);
      try {
        const localReviews = StorageService.getReviews() || [];
        const idx = localReviews.findIndex(r => r.id === reviewId);
        if (idx !== -1) {
          if (userId && localReviews[idx].user_id && localReviews[idx].user_id !== userId && localReviews[idx].reviewer_id !== userId) {
            return { success: false, error: new Error('Unauthorized: only the author can delete this review.') };
          }
          localReviews.splice(idx, 1);
          localStorage.setItem('innovexa_reviews_v2', JSON.stringify(localReviews));
          notifyDataChange('reviews');
          return { success: true, error: null };
        }
        return { success: false, error: new Error('Review not found') };
      } catch (e) {
        return { success: false, error: err };
      }
    }
  },

  // ============================================================================
  // 8. REVIEW SUGGESTIONS (public.review_suggestions)
  // ============================================================================
  async createReviewSuggestion({ reviewId, userId, content, title = '' }) {
    if (!reviewId || !userId || !content) {
      const err = new Error('Review ID, User ID, and Content are required.');
      console.error('[Supabase createReviewSuggestion error]:', err);
      return { data: null, error: err };
    }

    try {
      const { data, error } = await supabase
        .from('review_suggestions')
        .insert([{
          review_id: reviewId,
          user_id: userId,
          content: content.trim()
        }])
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      notifyDataChange('review_suggestions');
      return { data, error: null };
    } catch (err) {
      console.warn('[Supabase createReviewSuggestion fallback to storage]:', err.message || err);
      try {
        const localRevSugs = JSON.parse(localStorage.getItem('innovexa_review_suggestions_v2') || '[]');
        const newSug = {
          id: `rev_sug_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          review_id: reviewId,
          user_id: userId,
          content: content.trim(),
          created_at: new Date().toISOString()
        };
        localRevSugs.push(newSug);
        localStorage.setItem('innovexa_review_suggestions_v2', JSON.stringify(localRevSugs));
        notifyDataChange('review_suggestions');
        return { data: newSug, error: null };
      } catch (e) {
        return { data: null, error: err };
      }
    }
  },

  async getReviewSuggestions(reviewId) {
    if (!reviewId) return { data: [], error: null };
    try {
      const { data, error } = await supabase
        .from('review_suggestions')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('review_id', reviewId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (e) {
      try {
        const localRevSugs = JSON.parse(localStorage.getItem('innovexa_review_suggestions_v2') || '[]');
        const filtered = localRevSugs.filter(s => s.review_id === reviewId);
        return { data: filtered, error: null };
      } catch {
        return { data: [], error: e };
      }
    }
  },

  // ============================================================================
  // 9. REVIEW VOTES (public.review_votes - helpful | not_helpful)
  // ============================================================================
  async voteReview({ reviewId, userId, voteType = 'helpful' }) {
    if (!reviewId || !userId) {
      const err = new Error('Review ID and User ID are required.');
      console.error('[Supabase voteReview error]:', err);
      return { data: null, error: err };
    }

    const normalizedVote = (voteType === 'not_helpful' || voteType === 'downvote' || voteType === 'unhelpful') ? 'not_helpful' : 'helpful';

    if (!isUUID(reviewId) || !isUUID(userId)) {
      const res = StorageService.toggleVote({
        userId,
        targetType: 'review',
        targetId: reviewId,
        voteType: normalizedVote === 'helpful' ? 'upvote' : 'downvote'
      });
      const action = res?.activeVoteType ? (res.activeVoteType === (normalizedVote === 'helpful' ? 'upvote' : 'downvote') ? 'created' : 'updated') : 'removed';
      return { data: { action, vote_type: normalizedVote }, error: null };
    }

    try {
      const { data: existing, error: fetchErr } = await supabase
        .from('review_votes')
        .select('*')
        .eq('review_id', reviewId)
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (existing) {
        if (existing.vote_type === normalizedVote) {
          // Toggle off: remove vote
          const { error: delErr } = await supabase.from('review_votes').delete().eq('id', existing.id);
          if (delErr) throw delErr;
          StorageService.toggleVote({ userId, targetType: 'review', targetId: reviewId, voteType: normalizedVote === 'helpful' ? 'upvote' : 'downvote' });
          notifyDataChange('review_votes');
          return { data: { action: 'removed', vote_type: null }, error: null };
        } else {
          // Switch vote (helpful <-> not_helpful)
          const { data: updated, error: updateErr } = await supabase
            .from('review_votes')
            .update({ vote_type: normalizedVote, updated_at: new Date().toISOString() })
            .eq('id', existing.id)
            .select()
            .single();

          if (updateErr) throw updateErr;
          StorageService.toggleVote({ userId, targetType: 'review', targetId: reviewId, voteType: normalizedVote === 'helpful' ? 'upvote' : 'downvote' });
          notifyDataChange('review_votes');
          return { data: { action: 'updated', vote_type: normalizedVote, vote: updated }, error: null };
        }
      } else {
        const { data: created, error: insertErr } = await supabase
          .from('review_votes')
          .insert([{ review_id: reviewId, user_id: userId, vote_type: normalizedVote }])
          .select()
          .single();

        if (insertErr) throw insertErr;
        StorageService.toggleVote({ userId, targetType: 'review', targetId: reviewId, voteType: normalizedVote === 'helpful' ? 'upvote' : 'downvote' });
        notifyDataChange('review_votes');
        return { data: { action: 'created', vote_type: normalizedVote, vote: created }, error: null };
      }
    } catch (err) {
      console.warn('[Supabase voteReview fallback to storage]:', err.message || err);
      const res = StorageService.toggleVote({
        userId,
        targetType: 'review',
        targetId: reviewId,
        voteType: normalizedVote === 'helpful' ? 'upvote' : 'downvote'
      });
      const action = res?.activeVoteType ? (res.activeVoteType === (normalizedVote === 'helpful' ? 'upvote' : 'downvote') ? 'created' : 'updated') : 'removed';
      return { data: { action, vote_type: normalizedVote }, error: null };
    }
  },

  async getReviewVotes(reviewId, userId = null) {
    if (!reviewId) return { helpful: 0, not_helpful: 0, userVote: null, total: 0, error: null };

    // Retrieve base counts from storage
    const allRevs = StorageService.getReviews() || [];
    const targetRev = allRevs.find(r => String(r.id) === String(reviewId));
    const baseHelpful = targetRev ? (targetRev.base_helpful ?? (targetRev.helpful_votes_count || 0)) : 0;
    const baseNotHelpful = targetRev ? (targetRev.base_unhelpful ?? (targetRev.unhelpful_votes_count || 0)) : 0;

    if (!isUUID(reviewId)) {
      const localStats = StorageService.getVotesForTarget('review', reviewId);
      const uv = userId ? StorageService.getUserVote(userId, 'review', reviewId) : null;
      const userVote = uv === 'upvote' ? 'helpful' : (uv === 'downvote' ? 'not_helpful' : null);
      const helpful = baseHelpful + localStats.upvotes;
      const notHelpful = baseNotHelpful + localStats.downvotes;
      return {
        helpful,
        not_helpful: notHelpful,
        total: helpful - notHelpful,
        userVote,
        error: null
      };
    }

    try {
      const [helpRes, notHelpRes] = await Promise.all([
        supabase.from('review_votes').select('id', { count: 'exact', head: true }).eq('review_id', reviewId).eq('vote_type', 'helpful'),
        supabase.from('review_votes').select('id', { count: 'exact', head: true }).eq('review_id', reviewId).eq('vote_type', 'not_helpful')
      ]);

      if (helpRes?.error) throw helpRes.error;
      if (notHelpRes?.error) throw notHelpRes.error;

      let userVote = null;
      if (userId && isUUID(userId)) {
        const { data: userV, error: userVErr } = await supabase
          .from('review_votes')
          .select('vote_type')
          .eq('review_id', reviewId)
          .eq('user_id', userId)
          .maybeSingle();
        if (!userVErr && userV) userVote = userV.vote_type;
      } else if (userId) {
        const uv = StorageService.getUserVote(userId, 'review', reviewId);
        if (uv) userVote = uv === 'upvote' ? 'helpful' : (uv === 'downvote' ? 'not_helpful' : null);
      }

      const helpful = baseHelpful + (helpRes?.count || 0);
      const notHelpful = baseNotHelpful + (notHelpRes?.count || 0);

      return {
        helpful,
        not_helpful: notHelpful,
        total: helpful - notHelpful,
        userVote,
        error: null
      };
    } catch (e) {
      const localStats = StorageService.getVotesForTarget('review', reviewId);
      const uv = userId ? StorageService.getUserVote(userId, 'review', reviewId) : null;
      const userVote = uv === 'upvote' ? 'helpful' : (uv === 'downvote' ? 'not_helpful' : null);
      const helpful = baseHelpful + localStats.upvotes;
      const notHelpful = baseNotHelpful + localStats.downvotes;
      return {
        helpful,
        not_helpful: notHelpful,
        total: helpful - notHelpful,
        userVote,
        error: null
      };
    }
  },

  // ============================================================================
  // 10. COMMUNITY POSTS (public.community_posts)
  // ============================================================================
  async getCommunityPosts(filters = {}) {
    try {
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          categories:category_id (
            id,
            name,
            slug
          ),
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            headline,
            role,
            reputation_points
          )
        `);

      if (filters.category_id && filters.category_id !== 'ALL') {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.post_type && filters.post_type !== 'ALL') {
        query = query.ilike('post_type', filters.post_type);
      }
      if (filters.search && filters.search.trim()) {
        const q = `%${filters.search.trim()}%`;
        query = query.or(`title.ilike.${q},content.ilike.${q}`);
      }

      const sortBy = (filters.sortBy || 'LATEST').toUpperCase();
      if (sortBy === 'OLDEST') {
        query = query.order('created_at', { ascending: true });
      } else if (sortBy === 'MOST_LIKED' || sortBy === 'MOST_UPVOTED') {
        query = query.order('upvotes_count', { ascending: false });
      } else if (sortBy === 'MOST_COMMENTED' || sortBy === 'MOST_DISCUSSED') {
        query = query.order('comments_count', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && Array.isArray(data)) {
        const enriched = data.map(item => ({
          ...item,
          author_name: item.profiles?.full_name || 'Community Member',
          author_avatar: item.profiles?.avatar_url || '',
          author_headline: item.profiles?.headline || '',
          category_name: item.categories?.name || item.category_name || 'General',
          likes_count: item.upvotes_count || 0,
          dislikes_count: item.downvotes_count || 0,
          comments_count: item.comments_count || 0
        }));
        return { data: enriched, error: null };
      }

      return { data: [], error: null };
    } catch (err) {
      console.warn('[Supabase getCommunityPosts fallback]:', err.message || err);
      try {
        let localPosts = StorageService.getCommunityPosts() || [];
        if (filters.category_id && filters.category_id !== 'ALL') {
          localPosts = localPosts.filter(p => p.category_id === filters.category_id || p.category_name === filters.category_id);
        }
        if (filters.user_id) {
          localPosts = localPosts.filter(p => p.user_id === filters.user_id);
        }
        if (filters.post_type && filters.post_type !== 'ALL') {
          localPosts = localPosts.filter(p => (p.post_type || '').toLowerCase() === filters.post_type.toLowerCase());
        }
        if (filters.search && filters.search.trim()) {
          const q = filters.search.toLowerCase().trim();
          localPosts = localPosts.filter(p =>
            (p.title || '').toLowerCase().includes(q) ||
            (p.content || '').toLowerCase().includes(q) ||
            (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(q)))
          );
        }
        const sortBy = (filters.sortBy || 'LATEST').toUpperCase();
        if (sortBy === 'MOST_LIKED' || sortBy === 'MOST_UPVOTED') {
          localPosts.sort((a, b) => (b.upvotes_count || b.likes_count || 0) - (a.upvotes_count || a.likes_count || 0));
        } else if (sortBy === 'MOST_COMMENTED' || sortBy === 'MOST_DISCUSSED') {
          localPosts.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
        } else {
          localPosts.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        }
        return { data: localPosts, error: null };
      } catch (e) {
        return { data: [], error: err };
      }
    }
  },

  async createCommunityPost(postData) {
    try {
      const user = await this.getCurrentUser();
      const userId = postData.user_id || user?.id || (typeof user === 'string' ? user : null) || StorageService.getCurrentUserId();
      if (!userId) throw new Error('User must be signed in to create a community post.');

      let categoryId = postData.category_id || null;
      let categoryName = postData.category_name || 'General';
      if (!categoryId || categoryId === 'ALL') {
        const { data: cats } = await supabase.from('categories').select('id, name').limit(1);
        if (cats && cats.length > 0) {
          categoryId = cats[0].id;
          categoryName = cats[0].name;
        }
      }

      // community_posts.post_type CHECK constraint uses UPPERCASE values.
      // Normalize incoming post_type to UPPERCASE to satisfy the constraint.
      const normPostType = (postData.post_type || 'DISCUSSION').toUpperCase();
      const supportedTypes = ['DISCUSSION', 'QUESTION', 'FEEDBACK_REQUEST', 'COLLABORATION', 'CHALLENGE', 'RESOURCE', 'ANNOUNCEMENT', 'FEEDBACK'];
      const finalPostType = supportedTypes.includes(normPostType) ? normPostType : 'DISCUSSION';

      const newPost = {
        user_id: userId,
        category_id: categoryId,
        title: (postData.title || '').trim(),
        content: (postData.content || '').trim(),
        post_type: finalPostType,
        tags: Array.isArray(postData.tags) ? postData.tags : (typeof postData.tags === 'string' ? postData.tags.split(',').map(t => t.trim()).filter(Boolean) : [])
      };

      const { data, error } = await supabase
        .from('community_posts')
        .insert([newPost])
        .select(`
          *,
          categories:category_id (
            id,
            name,
            slug
          ),
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            username,
            headline
          )
        `)
        .single();

      if (error) throw error;

      StorageService.createCommunityPost({
        ...data,
        author_name: data.profiles?.full_name || 'Community Member',
        author_avatar: data.profiles?.avatar_url || '',
        category_name: data.categories?.name || categoryName
      });

      notifyDataChange('community_posts');
      return { data, error: null };
    } catch (err) {
      console.warn('[Supabase createCommunityPost fallback]:', err.message || err);
      try {
        const localCreated = StorageService.createCommunityPost({
          ...postData,
          user_id: postData.user_id || StorageService.getCurrentUserId()
        });
        return { data: localCreated, error: null };
      } catch (e) {
        return { data: null, error: err };
      }
    }
  },

  async updateCommunityPost(postId, updates, userId) {
    if (!postId) return { data: null, error: 'Post ID is required' };
    try {
      const user = await this.getCurrentUser();
      const currentUid = userId || user?.id || (typeof user === 'string' ? user : null) || StorageService.getCurrentUserId();

      // Verify ownership
      const { data: existing, error: fetchErr } = await supabase
        .from('community_posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (fetchErr) throw fetchErr;
      if (existing && currentUid && existing.user_id !== currentUid) {
        const authErr = new Error('Unauthorized: only the author can update this post.');
        console.error(authErr);
        return { data: null, error: authErr };
      }

      const VALID_POST_COLS = new Set(['title', 'content', 'post_type', 'category_id', 'tags']);
      const sanitizedUpdates = {};
      for (const [k, v] of Object.entries(updates || {})) {
        if (VALID_POST_COLS.has(k) && v !== undefined) {
          sanitizedUpdates[k] = (k === 'post_type' && typeof v === 'string') ? v.toUpperCase() : v;
        }
      }
      sanitizedUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('community_posts')
        .update(sanitizedUpdates)
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;
      notifyDataChange('community_posts');
      return { data, error: null };
    } catch (e) {
      console.warn('[Supabase updateCommunityPost fallback]:', e.message || e);
      try {
        const posts = StorageService.getCommunityPosts();
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          const user = await this.getCurrentUser();
          const currentUid = userId || user?.id || (typeof user === 'string' ? user : null) || StorageService.getCurrentUserId();
          if (posts[postIndex].user_id && currentUid && posts[postIndex].user_id !== currentUid) {
            return { data: null, error: new Error('Unauthorized: only the author can update this post.') };
          }
          posts[postIndex] = { ...posts[postIndex], ...updates, updated_at: new Date().toISOString() };
          localStorage.setItem('innovexa_community_posts_v2', JSON.stringify(posts));
          notifyDataChange('community_posts');
          return { data: posts[postIndex], error: null };
        }
        return { data: null, error: e };
      } catch (err) {
        return { data: null, error: e };
      }
    }
  },

  async deleteCommunityPost(postId, userId) {
    if (!postId) return { success: false, error: 'Post ID is required' };
    try {
      const user = await this.getCurrentUser();
      const currentUid = userId || user?.id || (typeof user === 'string' ? user : null) || StorageService.getCurrentUserId();

      // Verify ownership
      const { data: existing, error: fetchErr } = await supabase
        .from('community_posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (fetchErr) throw fetchErr;
      if (existing && currentUid && existing.user_id !== currentUid) {
        return { success: false, error: new Error('Unauthorized: only the author can delete this post.') };
      }

      const { error } = await supabase.from('community_posts').delete().eq('id', postId);
      if (error) throw error;

      notifyDataChange('community_posts');
      return { success: true, error: null };
    } catch (e) {
      console.warn('[Supabase deleteCommunityPost fallback]:', e.message || e);
      try {
        const posts = StorageService.getCommunityPosts();
        const existing = posts.find(p => p.id === postId);
        const user = await this.getCurrentUser();
        const currentUid = userId || user?.id || (typeof user === 'string' ? user : null) || StorageService.getCurrentUserId();
        if (existing && existing.user_id && currentUid && existing.user_id !== currentUid) {
          return { success: false, error: new Error('Unauthorized: only the author can delete this post.') };
        }
        StorageService.deleteCommunityPost(postId);
        notifyDataChange('community_posts');
        return { success: true, error: null };
      } catch (err) {
        return { success: false, error: e };
      }
    }
  },

  // ============================================================================
  // 11. COMMUNITY COMMENTS (public.community_comments)
  // ============================================================================
  async getCommunityComments(postId) {
    if (!postId) return { data: [], error: null };
    try {
      const { data, error } = await supabase
        .from('community_comments')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            role,
            headline
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && Array.isArray(data)) {
        const enriched = data.map(item => ({
          ...item,
          author_name: item.profiles?.full_name || 'Community Member',
          author_avatar: item.profiles?.avatar_url || '',
          author_headline: item.profiles?.headline || '',
          likes_count: item.upvotes_count || 0,
          dislikes_count: item.downvotes_count || 0
        }));
        return { data: enriched, error: null };
      }

      return { data: [], error: null };
    } catch (err) {
      console.warn('[Supabase getCommunityComments fallback]:', err.message || err);
      try {
        const localComments = StorageService.getCommunityComments(postId) || [];
        return { data: localComments, error: null };
      } catch (e) {
        return { data: [], error: err };
      }
    }
  },

  async createCommunityComment(commentData) {
    try {
      const user = await this.getCurrentUser();
      const userId = commentData.user_id || user?.id || (typeof user === 'string' ? user : null) || StorageService.getCurrentUserId();
      const postId = commentData.post_id || commentData.postId;
      const content = (commentData.content || '').trim();
      const parentCommentId = commentData.parent_comment_id || commentData.parentCommentId || null;

      if (!userId || !postId || !content) {
        throw new Error('User ID, Post ID, and Content are required to comment.');
      }

      const newComment = {
        post_id: postId,
        user_id: userId,
        parent_comment_id: parentCommentId,
        content: content
      };

      const { data, error } = await supabase
        .from('community_comments')
        .insert([newComment])
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            username,
            headline
          )
        `)
        .single();

      if (error) throw error;

      StorageService.createCommunityComment({
        ...data,
        author_name: data.profiles?.full_name || 'Community Member',
        author_avatar: data.profiles?.avatar_url || ''
      });

      // Notify post author about the comment (fire-and-forget)
      try {
        const { data: post } = await supabase.from('community_posts').select('user_id, title').eq('id', postId).maybeSingle();
        if (post?.user_id && post.user_id !== userId) {
          const commenterName = data.profiles?.full_name || 'Someone';
          await this.createNotification({
            userId: post.user_id,
            actorId: userId,
            type: 'community_interaction',
            title: `${commenterName} commented on "${(post.title || 'your post').slice(0, 60)}"`,
            message: `"${content.slice(0, 100)}"`,
            link: `community`
          });
        }
      } catch (_) {}

      notifyDataChange('community_comments');
      return { data, error: null };
    } catch (err) {
      console.warn('[Supabase createCommunityComment fallback]:', err.message || err);
      try {
        const localComment = StorageService.createCommunityComment({
          ...commentData,
          post_id: commentData.post_id || commentData.postId,
          user_id: commentData.user_id || StorageService.getCurrentUserId()
        });
        return { data: localComment, error: null };
      } catch (e) {
        return { data: null, error: err };
      }
    }
  },

  async deleteCommunityComment(commentId, userId) {
    if (!commentId) return { success: false, error: 'Comment ID is required' };
    try {
      let query = supabase.from('community_comments').delete().eq('id', commentId);
      if (userId) query = query.eq('user_id', userId);
      const { error } = await query;
      if (error) throw error;

      if (StorageService.deleteCommunityComment) {
        StorageService.deleteCommunityComment(commentId);
      }
      notifyDataChange('community_comments');
      return { success: true, error: null };
    } catch (err) {
      console.warn('[Supabase deleteCommunityComment fallback]:', err.message || err);
      if (StorageService.deleteCommunityComment) {
        StorageService.deleteCommunityComment(commentId);
      }
      notifyDataChange('community_comments');
      return { success: true, error: null };
    }
  },

  // Backwards compatibility alias
  async addCommunityComment(commentData) {
    return this.createCommunityComment(commentData);
  },

  // ============================================================================
  // 12. COMMUNITY VOTES (public.community_votes - like | dislike)
  // ============================================================================
  async voteCommunityPost({ postId, userId, voteType = 'like' }) {
    if (!postId || !userId) {
      const err = new Error('Post ID and User ID are required.');
      console.error('[Supabase voteCommunityPost error]:', err);
      return { data: null, error: err };
    }

    const normVote = (voteType === 'dislike' || voteType === 'downvote') ? 'downvote' : 'upvote';
    const clientVoteType = normVote === 'upvote' ? 'like' : 'dislike';

    if (!isUUID(postId) || !isUUID(userId)) {
      const res = StorageService.toggleVote({
        userId,
        targetType: 'discussion',
        targetId: postId,
        voteType: normVote
      });
      const clientActive = res?.activeVoteType === 'upvote' ? 'like' : (res?.activeVoteType === 'downvote' ? 'dislike' : null);
      const action = clientActive ? (res.activeVoteType === normVote ? 'created' : 'updated') : 'removed';
      return { data: { action, vote_type: clientActive }, error: null };
    }

    try {
      const { data: existing, error: fetchErr } = await supabase
        .from('community_votes')
        .select('*')
        .eq('target_type', 'post')
        .eq('target_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (existing) {
        if (existing.vote_type === normVote) {
          // Toggle off: remove vote
          const { error: delErr } = await supabase
            .from('community_votes')
            .delete()
            .eq('id', existing.id);
          if (delErr) throw delErr;
          StorageService.toggleVote({ userId, targetType: 'discussion', targetId: postId, voteType: normVote });
          notifyDataChange('community_votes');
          return { data: { action: 'removed', vote_type: null }, error: null };
        } else {
          // Switch vote: upvote <-> downvote
          const { data: updated, error: updateErr } = await supabase
            .from('community_votes')
            .update({ vote_type: normVote })
            .eq('id', existing.id)
            .select()
            .single();

          if (updateErr) throw updateErr;
          StorageService.toggleVote({ userId, targetType: 'discussion', targetId: postId, voteType: normVote });
          notifyDataChange('community_votes');
          return { data: { action: 'updated', vote_type: clientVoteType, vote: updated }, error: null };
        }
      } else {
        const { data: created, error: insertErr } = await supabase
          .from('community_votes')
          .insert([{
            user_id: userId,
            target_type: 'post',
            target_id: postId,
            vote_type: normVote
          }])
          .select()
          .single();

        if (insertErr) throw insertErr;
        StorageService.toggleVote({ userId, targetType: 'discussion', targetId: postId, voteType: normVote });
        notifyDataChange('community_votes');
        return { data: { action: 'created', vote_type: clientVoteType, vote: created }, error: null };
      }
    } catch (err) {
      console.warn('[Supabase voteCommunityPost fallback]:', err.message || err);
      const res = StorageService.toggleVote({
        userId,
        targetType: 'discussion',
        targetId: postId,
        voteType: normVote
      });
      const clientActive = res?.activeVoteType === 'upvote' ? 'like' : (res?.activeVoteType === 'downvote' ? 'dislike' : null);
      const action = clientActive ? (res.activeVoteType === normVote ? 'created' : 'updated') : 'removed';
      return { data: { action, vote_type: clientActive }, error: null };
    }
  },

  async getCommunityVotes(postId, userId = null) {
    if (!postId) return { likes: 0, dislikes: 0, userVote: null, total: 0, error: null };

    // Retrieve base counts from storage
    const allPosts = StorageService.getCommunityPosts() || [];
    const targetPost = allPosts.find(p => String(p.id) === String(postId));
    const baseLikes = targetPost ? (targetPost.base_upvotes ?? (targetPost.likes_count || targetPost.upvotes_count || 0)) : 0;
    const baseDislikes = targetPost ? (targetPost.base_downvotes ?? (targetPost.dislikes_count || targetPost.downvotes_count || 0)) : 0;

    if (!isUUID(postId)) {
      const res = StorageService.getVotesForTarget('discussion', postId);
      let userVote = null;
      if (userId) {
        const uv = StorageService.getUserVote({ userId, targetType: 'discussion', targetId: postId });
        if (uv) userVote = uv === 'upvote' ? 'like' : (uv === 'downvote' ? 'dislike' : null);
      }
      const likes = baseLikes + res.upvotes;
      const dislikes = baseDislikes + res.downvotes;
      return {
        likes,
        dislikes,
        total: likes - dislikes,
        userVote,
        error: null
      };
    }

    try {
      const [upRes, downRes] = await Promise.all([
        supabase.from('community_votes').select('id', { count: 'exact', head: true }).eq('target_type', 'post').eq('target_id', postId).eq('vote_type', 'upvote'),
        supabase.from('community_votes').select('id', { count: 'exact', head: true }).eq('target_type', 'post').eq('target_id', postId).eq('vote_type', 'downvote')
      ]);

      if (upRes?.error) throw upRes.error;
      if (downRes?.error) throw downRes.error;

      let userVote = null;
      if (userId && isUUID(userId)) {
        const { data: uv, error: uvErr } = await supabase
          .from('community_votes')
          .select('vote_type')
          .eq('target_type', 'post')
          .eq('target_id', postId)
          .eq('user_id', userId)
          .maybeSingle();
        if (!uvErr && uv) {
          userVote = uv.vote_type === 'upvote' ? 'like' : (uv.vote_type === 'downvote' ? 'dislike' : null);
        }
      } else if (userId) {
        const uv = StorageService.getUserVote({ userId, targetType: 'discussion', targetId: postId });
        if (uv) userVote = uv === 'upvote' ? 'like' : (uv === 'downvote' ? 'dislike' : null);
      }

      const likes = baseLikes + (upRes?.count || 0);
      const dislikes = baseDislikes + (downRes?.count || 0);

      return {
        likes,
        dislikes,
        total: likes - dislikes,
        userVote,
        error: null
      };
    } catch (e) {
      const res = StorageService.getVotesForTarget('discussion', postId);
      let userVote = null;
      if (userId) {
        const uv = StorageService.getUserVote({ userId, targetType: 'discussion', targetId: postId });
        if (uv) userVote = uv === 'upvote' ? 'like' : (uv === 'downvote' ? 'dislike' : null);
      }
      const likes = baseLikes + (res.upvotes || 0);
      const dislikes = baseDislikes + (res.downvotes || 0);
      return {
        likes,
        dislikes,
        total: likes - dislikes,
        userVote,
        error: null
      };
    }
  },

  // ============================================================================
  // 13. MESSAGES (public.messages)
  // ============================================================================
  async sendMessage(param1, param2, param3) {
    let senderId, receiverId, content;
    if (typeof param1 === 'object' && param1 !== null) {
      senderId = param1.senderId;
      receiverId = param1.receiverId;
      content = param1.content;
    } else {
      receiverId = param1;
      content = param2;
      const currentUser = await this.getCurrentUser();
      senderId = currentUser?.id || StorageService.getCurrentUserId();
    }

    if (!senderId || !receiverId || !content) {
      const err = new Error('Sender ID, Receiver ID, and Content are required to send a message.');
      console.error('[Supabase sendMessage error]:', err);
      return { data: null, error: err };
    }

    try {
      const newMsg = {
        sender_id: senderId,
        receiver_id: receiverId,
        content: content.trim(),
        is_read: false
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([newMsg])
        .select()
        .single();

      if (error) {
        console.error('[Supabase sendMessage error]:', error);
        return { data: null, error };
      }

      // Automatically create a notification for the receiver
      try {
        const { data: senderProf } = await supabase.from('profiles').select('full_name').eq('id', senderId).maybeSingle();
        const senderName = senderProf?.full_name || 'An innovator';

        await this.createNotification({
          userId: receiverId,
          actorId: senderId,
          type: 'message',
          title: `New message from ${senderName}`,
          message: content.slice(0, 100),
          link: `/messages?user=${senderId}`
        });
      } catch (notifErr) {}

      notifyDataChange('messages');
      return { data, error: null };
    } catch (err) {
      console.error('[Supabase sendMessage exception]:', err);
      return { data: null, error: err };
    }
  },

  async getConversation(userId, otherUserId) {
    return this.getMessages(userId, otherUserId);
  },

  async getMessages(userId, otherUserId) {
    if (!userId || !otherUserId) return { data: [], error: null };
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[Supabase getMessages error]:', error.message || error);
        return { data: [], error };
      }
      return { data: data || [], error: null };
    } catch (err) {
      console.error('[Supabase getMessages exception]:', err);
      return { data: [], error: err };
    }
  },

  async getConversations(userId) {
    if (!userId) return { data: [], error: null };
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          message_type,
          is_read,
          created_at,
          sender:sender_id (
            id,
            full_name,
            avatar_url,
            headline
          ),
          receiver:receiver_id (
            id,
            full_name,
            avatar_url,
            headline
          )
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Supabase getConversations error]:', error.message || error);
        return { data: [], error };
      }

      // Aggregate raw message rows into deduplicated conversation threads
      const threadMap = new Map();
      for (const msg of (data || [])) {
        // The contact is whoever is NOT the current user
        const contactId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        const contactProfile = msg.sender_id === userId ? msg.receiver : msg.sender;

        if (!contactId) continue;

        if (!threadMap.has(contactId)) {
          threadMap.set(contactId, {
            id: contactId,
            user: {
              id: contactId,
              name: contactProfile?.full_name || 'Community Member',
              avatar: contactProfile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contactProfile?.full_name || contactId)}`,
              headline: contactProfile?.headline || 'INNOVEXA Member'
            },
            lastMessage: msg.content || '',
            lastMessageAt: msg.created_at,
            unreadCount: (!msg.is_read && msg.receiver_id === userId) ? 1 : 0
          });
        } else {
          // Accumulate unread count for subsequent (older) messages in the same thread
          const existing = threadMap.get(contactId);
          if (!msg.is_read && msg.receiver_id === userId) {
            existing.unreadCount = (existing.unreadCount || 0) + 1;
          }
        }
      }

      const threads = Array.from(threadMap.values());
      return { data: threads, error: null };
    } catch (err) {
      console.error('[Supabase getConversations exception]:', err);
      return { data: [], error: err };
    }
  },

  async getUnreadMessagesCount(userId) {
    if (!userId) return 0;
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);
      if (error) return 0;
      return count || 0;
    } catch (e) {
      return 0;
    }
  },

  async markMessageRead(messageId, receiverId) {
    if (!messageId) return { success: false, error: 'Message ID is required' };
    try {
      let query = supabase
        .from('messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (receiverId) query = query.eq('receiver_id', receiverId);

      const { error } = await query;
      if (error) {
        console.error('[Supabase markMessageRead error]:', error);
        return { success: false, error };
      }
      notifyDataChange('messages');
      return { success: true, error: null };
    } catch (e) {
      console.error('[Supabase markMessageRead exception]:', e);
      return { success: false, error: e };
    }
  },

  async markMessagesAsRead(userId, otherUserId) {
    if (!userId || !otherUserId) return;
    try {
      await supabase
        .from('messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('receiver_id', userId)
        .eq('sender_id', otherUserId)
        .eq('is_read', false);

      notifyDataChange('messages');
    } catch (e) {
      console.error('[Supabase markMessagesAsRead exception]:', e);
    }
  },

  // ============================================================================
  // COMMUNITY OPEN CHAT MESSAGES (Stored in Supabase community_posts)
  // ============================================================================
  async getCommunityMessages(channel = 'general') {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          id,
          user_id,
          title,
          content,
          tags,
          created_at,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            headline,
            role
          )
        `)
        .contains('tags', [`channel:${channel}`])
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.warn('[Supabase getCommunityMessages warning]:', error.message || error);
        return { data: null, error };
      }

      if (data && data.length > 0) {
        const formatted = data.map(msg => ({
          id: msg.id,
          channel: channel,
          sender_id: msg.user_id,
          sender_name: msg.profiles?.full_name || 'Innovator',
          sender_role: Array.isArray(msg.profiles?.role) ? msg.profiles.role[0] : (msg.profiles?.role || 'Innovator'),
          sender_badge: 'MEMBER',
          sender_avatar: msg.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(msg.profiles?.full_name || 'Innovator')}`,
          content: msg.content,
          timestamp: msg.created_at,
          reactions: {}
        }));
        return { data: formatted, error: null };
      }

      return { data: [], error: null };
    } catch (err) {
      console.error('[Supabase getCommunityMessages exception]:', err);
      return { data: null, error: err };
    }
  },

  async sendCommunityMessage({ channel = 'general', senderId, content }) {
    if (!senderId || !content) return { data: null, error: 'Sender and content required' };
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert([{
          user_id: senderId,
          title: `[#${channel}] Community Lounge Message`,
          content: content.trim(),
          post_type: 'DISCUSSION',   // FIXED: constraint requires UPPERCASE
          tags: ['chat', `channel:${channel}`]
        }])
        .select(`
          id,
          user_id,
          title,
          content,
          tags,
          created_at,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            headline,
            role
          )
        `)
        .single();

      if (error) {
        console.warn('[Supabase sendCommunityMessage warning]:', error.message || error);
        return { data: null, error };
      }

      const formatted = {
        id: data.id,
        channel: channel,
        sender_id: data.user_id,
        sender_name: data.profiles?.full_name || 'Innovator',
        sender_role: Array.isArray(data.profiles?.role) ? data.profiles.role[0] : (data.profiles?.role || 'Innovator'),
        sender_badge: 'MEMBER',
        sender_avatar: data.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.profiles?.full_name || 'Innovator')}`,
        content: data.content,
        timestamp: data.created_at,
        reactions: {}
      };

      notifyDataChange('messages');
      return { data: formatted, error: null };
    } catch (err) {
      console.error('[Supabase sendCommunityMessage exception]:', err);
      return { data: null, error: err };
    }
  },

  async deleteCommunityMessage(messageId, userId) {
    if (!messageId || !userId) return { data: null, error: 'Message ID and User ID required' };
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', messageId)
        .eq('user_id', userId);

      if (error) {
        console.error('[Supabase deleteCommunityMessage error]:', error);
        return { data: null, error };
      }
      notifyDataChange('messages');
      return { data, error: null };
    } catch (err) {
      console.error('[Supabase deleteCommunityMessage exception]:', err);
      return { data: null, error: err };
    }
  },

  // ============================================================================
  // 14. NOTIFICATIONS (public.notifications)
  // ============================================================================
  async createNotification({ userId, actorId = null, projectId = null, type = 'system', title, message, link = '' }) {
    if (!userId || !title) return { data: null, error: 'User ID and Title are required' };
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          actor_id: actorId,
          project_id: projectId,
          type,
          title: title.trim(),
          message: (message || '').trim(),
          link: link || '',
          is_read: false
        }])
        .select()
        .single();

      if (error) {
        console.error('[Supabase createNotification error]:', error);
        return { data: null, error };
      }
      notifyDataChange('notifications');
      return { data, error: null };
    } catch (e) {
      console.error('[Supabase createNotification exception]:', e);
      return { data: null, error: e };
    }
  },

  async getNotifications(userId) {
    if (!userId) return { data: [], error: null };
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error(`[Supabase getNotifications error for ${userId}]:`, error.message || error);
        return { data: StorageService.getNotificationsForUser(userId) || [], error };
      }
      return { data: data || [], error: null };
    } catch (err) {
      console.error('[Supabase getNotifications exception]:', err);
      return { data: StorageService.getNotificationsForUser(userId) || [], error: err };
    }
  },

  async markNotificationRead(notificationId, userId = null) {
    return this.markNotificationAsRead(notificationId, userId);
  },

  async markNotificationAsRead(notificationId, userId = null) {
    if (!notificationId) return;
    try {
      let query = supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (userId) query = query.eq('user_id', userId);

      await query;
      notifyDataChange('notifications');
    } catch (e) {
      console.error('[Supabase markNotificationAsRead exception]:', e);
    }
  },

  async markAllNotificationsRead(userId) {
    return this.markAllNotificationsAsRead(userId);
  },

  async markAllNotificationsAsRead(userId) {
    if (!userId) return;
    try {
      await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      notifyDataChange('notifications');
    } catch (e) {
      console.error('[Supabase markAllNotificationsAsRead exception]:', e);
    }
  },

  // ============================================================================
  // 15. COMMUNITY COMMENTS (public.community_comments)
  // ============================================================================
  async getCommunityComments(postId) {
    if (!postId) return { data: [], error: null };
    try {
      const { data, error } = await supabase
        .from('community_comments')
        .select(`
          id,
          post_id,
          user_id,
          parent_comment_id,
          content,
          created_at,
          updated_at,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            headline,
            role
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn(`[Supabase getCommunityComments warning for post ${postId}]:`, error.message || error);
        return { data: StorageService.getCommentsForCommunityPost?.(postId) || [], error };
      }

      const formatted = (data || []).map(c => ({
        id: c.id,
        post_id: c.post_id,
        user_id: c.user_id,
        author_id: c.user_id,
        parent_comment_id: c.parent_comment_id,
        content: c.content,
        created_at: c.created_at,
        updated_at: c.updated_at,
        author_name: c.profiles?.full_name || 'Community Member',
        author_avatar: c.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.profiles?.full_name || 'Member')}&backgroundColor=20212a,58b8ad,9b8ae5`,
        author_headline: c.profiles?.headline || 'Innovator',
        author_role: Array.isArray(c.profiles?.role) ? c.profiles.role[0] : (c.profiles?.role || 'member')
      }));

      return { data: formatted, error: null };
    } catch (err) {
      console.error('[Supabase getCommunityComments exception]:', err);
      return { data: StorageService.getCommentsForCommunityPost?.(postId) || [], error: err };
    }
  },

  async createCommunityComment({ post_id, content, parent_comment_id = null, user_id = null }) {
    if (!post_id || !content) return { data: null, error: 'Post ID and content are required' };
    try {
      const activeUserId = user_id || (supabase.auth.getUser ? (await supabase.auth.getUser()).data?.user?.id : null);
      const { data, error } = await supabase
        .from('community_comments')
        .insert([{
          post_id,
          user_id: activeUserId,
          content: content.trim(),
          parent_comment_id: parent_comment_id || null
        }])
        .select(`
          id,
          post_id,
          user_id,
          parent_comment_id,
          content,
          created_at,
          updated_at,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            headline,
            role
          )
        `)
        .single();

      if (error) {
        console.error('[Supabase createCommunityComment error]:', error);
        return { data: null, error };
      }

      const formatted = {
        id: data.id,
        post_id: data.post_id,
        user_id: data.user_id,
        author_id: data.user_id,
        parent_comment_id: data.parent_comment_id,
        content: data.content,
        created_at: data.created_at,
        updated_at: data.updated_at,
        author_name: data.profiles?.full_name || 'Community Member',
        author_avatar: data.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.profiles?.full_name || 'Member')}&backgroundColor=20212a,58b8ad,9b8ae5`,
        author_headline: data.profiles?.headline || 'Innovator',
        author_role: Array.isArray(data.profiles?.role) ? data.profiles.role[0] : (data.profiles?.role || 'member')
      };

      notifyDataChange('community');
      return { data: formatted, error: null };
    } catch (err) {
      console.error('[Supabase createCommunityComment exception]:', err);
      return { data: null, error: err };
    }
  },

  async deleteCommunityComment(commentId, userId = null) {
    if (!commentId) return { success: false, error: 'Comment ID is required' };
    try {
      let query = supabase.from('community_comments').delete().eq('id', commentId);
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query;
      if (error) {
        console.error('[Supabase deleteCommunityComment error]:', error);
        return { success: false, error };
      }
      notifyDataChange('community');
      return { success: true, error: null };
    } catch (err) {
      console.error('[Supabase deleteCommunityComment exception]:', err);
      return { success: false, error: err };
    }
  },



  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================
  _createRealtimeSubscription({ channelName, schema = 'public', table, filter, event = '*', callback }) {
    if (typeof callback !== 'function' || !channelName || !table) return () => {};
    try {
      // 1. Check for any existing channel with this name/topic and remove it first
      const existingChannels = typeof supabase.getChannels === 'function' ? supabase.getChannels() : [];
      const found = existingChannels.find(ch => ch.topic === `realtime:${channelName}` || ch.topic === channelName);
      if (found) {
        try { supabase.removeChannel(found); } catch (_) {}
      }

      // 2. Create channel instance
      const channel = supabase.channel(channelName);
      
      const config = { event, schema, table };
      if (filter) config.filter = filter;

      // 3. Register postgres_changes listener BEFORE calling subscribe()
      channel.on('postgres_changes', config, (payload) => {
        try {
          callback(payload);
        } catch (cbErr) {
          console.error(`[REALTIME] Error executing callback for ${channelName}:`, cbErr);
        }
      });

      // 4. Subscribe LAST
      channel.subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn(`[REALTIME] Subscription channel '${channelName}' encountered CHANNEL_ERROR.`);
        }
      });

      // 5. Return cleanup function
      return () => {
        try {
          supabase.removeChannel(channel);
        } catch (unsubErr) {
          console.warn(`[REALTIME] Error removing channel '${channelName}':`, unsubErr);
        }
      };
    } catch (err) {
      console.warn(`[REALTIME] Failed to initialize subscription for '${channelName}':`, err);
      return () => {};
    }
  },

  subscribeToProjectVotes(projectId, callback) {
    if (!projectId || typeof callback !== 'function') return () => {};
    return this._createRealtimeSubscription({
      channelName: `project-votes-${projectId}`,
      table: 'project_votes',
      filter: `project_id=eq.${projectId}`,
      callback
    });
  },

  subscribeToProjectReviews(projectId, callback) {
    if (!projectId || typeof callback !== 'function') return () => {};
    return this._createRealtimeSubscription({
      channelName: `project-reviews-${projectId}`,
      table: 'reviews',
      filter: `project_id=eq.${projectId}`,
      callback
    });
  },

  subscribeToProjectLikes(projectId, callback) {
    if (!projectId || typeof callback !== 'function') return () => {};
    return this._createRealtimeSubscription({
      channelName: `project-likes-${projectId}`,
      table: 'project_votes',
      filter: `project_id=eq.${projectId}`,
      callback
    });
  },

  subscribeToMessages(userId, callback) {
    if (!userId || typeof callback !== 'function') return () => {};
    return this._createRealtimeSubscription({
      channelName: `messages-${userId}`,
      table: 'messages',
      event: 'INSERT',
      filter: `receiver_id=eq.${userId}`,
      callback
    });
  },

  subscribeToNotifications(userId, callback) {
    if (!userId || typeof callback !== 'function') return () => {};
    return this._createRealtimeSubscription({
      channelName: `notifications-${userId}`,
      table: 'notifications',
      event: 'INSERT',
      filter: `user_id=eq.${userId}`,
      callback
    });
  },

  subscribeToCommunityPosts(callback) {
    if (typeof callback !== 'function') return () => {};
    return this._createRealtimeSubscription({
      channelName: 'community-posts-global',
      table: 'community_posts',
      callback
    });
  },

  subscribeToCommunityComments(postId, callback) {
    if (!postId || typeof callback !== 'function') return () => {};
    return this._createRealtimeSubscription({
      channelName: `community-comments-${postId}`,
      table: 'community_comments',
      filter: `post_id=eq.${postId}`,
      callback
    });
  },

  // ============================================================================
  // ANALYTICS & AGGREGATIONS
  // ============================================================================
  async getUserDashboardSummary(userId) {
    if (!userId) {
      return {
        data: {
          my_projects: [],
          my_projects_count: 0,
          published_projects: [],
          published_projects_count: 0,
          draft_projects: [],
          draft_projects_count: 0,
          total_views: 0,
          upvotes: 0,
          downvotes: 0,
          reviews_received_count: 0,
          suggestions_count: 0,
          followers_count: 0,
          unread_notifications_count: 0,
          unread_messages_count: 0,
          recent_activity: []
        },
        error: null
      };
    }

    try {
      // 1. Fetch user projects, notifications, and received messages in parallel
      const [
        projsRes,
        notifsRes,
        msgsRes
      ] = await Promise.all([
        supabase.from('projects').select('*, categories:category_id(name)').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30),
        supabase.from('messages').select('*, sender:sender_id(full_name, avatar_url)').eq('receiver_id', userId).order('created_at', { ascending: false }).limit(30)
      ]);

      let userProjects = projsRes.data || [];
      if (userProjects.length === 0) {
        const localProjs = StorageService.getInnovationsByUserId(userId) || [];
        if (localProjs.length > 0) userProjects = localProjs;
      }

      const notifications = notifsRes.data || StorageService.getNotificationsForUser?.(userId) || [];
      const messages = msgsRes.data || StorageService.getMessagesForUser?.(userId) || [];

      const projectIds = userProjects.map(p => p.id);
      let votes = [];
      let reviews = [];
      let suggestions = [];
      let follows = [];

      // 2. If user has projects, query votes, reviews, suggestions, follows on those projects
      if (projectIds.length > 0) {
        const [
          votesRes,
          revsRes,
          suggRes,
          follRes
        ] = await Promise.all([
          supabase.from('project_votes').select('*, profiles:user_id(full_name, avatar_url)').in('project_id', projectIds).order('created_at', { ascending: false }).limit(40),
          supabase.from('reviews').select('*, profiles:user_id(full_name, avatar_url)').in('project_id', projectIds).order('created_at', { ascending: false }).limit(40),
          supabase.from('project_suggestions').select('*, profiles:user_id(full_name, avatar_url)').in('project_id', projectIds).order('created_at', { ascending: false }).limit(40),
          supabase.from('project_follows').select('*, profiles:user_id(full_name, avatar_url)').in('project_id', projectIds).order('created_at', { ascending: false }).limit(40)
        ]);

        votes = votesRes.data || [];
        reviews = revsRes.data || [];
        suggestions = suggRes.data || [];
        follows = follRes.data || [];

        // Local storage fallbacks
        if (votes.length === 0) {
          projectIds.forEach(pid => {
            const lv = StorageService.getProjectVotes?.(pid) || [];
            if (lv.length > 0) votes.push(...lv);
          });
        }
        if (reviews.length === 0) {
          projectIds.forEach(pid => {
            const lr = StorageService.getReviewsForInnovation?.(pid) || [];
            if (lr.length > 0) reviews.push(...lr);
          });
        }
      }

      // Map project titles for fast lookup in activity items
      const projectTitleMap = {};
      userProjects.forEach(p => {
        projectTitleMap[p.id] = cleanProjectTitle(p.title);
      });

      // 3. Compute Metrics
      const publishedProjects = userProjects.filter(p => (p.status || '').toUpperCase() === 'PUBLISHED');
      const draftProjects = userProjects.filter(p => (p.status || '').toUpperCase() !== 'PUBLISHED');

      const totalViews = userProjects.reduce((sum, p) => sum + (p.views_count || p.views || 0), 0);
      
      const upvotes = votes.filter(v => (v.vote_type || v.type) === 'upvote').length || 
        userProjects.reduce((sum, p) => sum + (p.upvotes_count || 0), 0);
      
      const downvotes = votes.filter(v => (v.vote_type || v.type) === 'downvote').length || 
        userProjects.reduce((sum, p) => sum + (p.downvotes_count || 0), 0);

      const reviewsCount = reviews.length || userProjects.reduce((sum, p) => sum + (p.valid_reviews_count || 0), 0);
      const suggestionsCount = suggestions.length;
      const followersCount = follows.length;

      const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;
      const unreadMessagesCount = messages.filter(m => !m.is_read).length;

      // 4. Synthesize Recent Activity Feed (reviews, suggestions, votes, followers, messages)
      const activityItems = [];

      // New Reviews
      reviews.forEach(r => {
        const pTitle = projectTitleMap[r.project_id] || 'your project';
        const actorName = r.profiles?.full_name || 'A community peer';
        activityItems.push({
          id: `rev_${r.id}`,
          type: 'new_review',
          title: `New Review on "${pTitle}"`,
          description: r.overall_feedback ? `"${r.overall_feedback.slice(0, 110)}..."` : `Rated ${r.rating || 5}★ by ${actorName}`,
          actor_name: actorName,
          actor_avatar: r.profiles?.avatar_url || '',
          timestamp: r.created_at,
          target_id: r.project_id,
          target_tab: 'detail',
          badge_color: 'var(--periwinkle)'
        });
      });

      // New Suggestions
      suggestions.forEach(s => {
        const pTitle = projectTitleMap[s.project_id] || 'your project';
        const actorName = s.profiles?.full_name || 'An innovator';
        activityItems.push({
          id: `sugg_${s.id}`,
          type: 'new_suggestion',
          title: `New Suggestion on "${pTitle}"`,
          description: s.title || s.suggestion || `${s.suggestion_type || 'Feature'} recommendation proposed`,
          actor_name: actorName,
          actor_avatar: s.profiles?.avatar_url || '',
          timestamp: s.created_at,
          target_id: s.project_id,
          target_tab: 'detail',
          badge_color: 'var(--lavender)'
        });
      });

      // New Votes
      votes.forEach(v => {
        const pTitle = projectTitleMap[v.project_id] || 'your project';
        const isUp = (v.vote_type || v.type) === 'upvote';
        const actorName = v.profiles?.full_name || 'A community member';
        activityItems.push({
          id: `vote_${v.id || v.project_id + v.created_at}`,
          type: 'new_vote',
          title: `New ${isUp ? 'Upvote' : 'Vote'} on "${pTitle}"`,
          description: `${actorName} cast an ${isUp ? 'endorsement upvote' : 'evaluation vote'}`,
          actor_name: actorName,
          actor_avatar: v.profiles?.avatar_url || '',
          timestamp: v.created_at,
          target_id: v.project_id,
          target_tab: 'detail',
          badge_color: isUp ? 'var(--teal)' : 'var(--coral)'
        });
      });

      // New Followers
      follows.forEach(f => {
        const pTitle = projectTitleMap[f.project_id] || 'your project';
        const actorName = f.profiles?.full_name || 'A follower';
        activityItems.push({
          id: `foll_${f.id || f.project_id + f.created_at}`,
          type: 'new_follower',
          title: `New Follower on "${pTitle}"`,
          description: `${actorName} subscribed to project launch updates`,
          actor_name: actorName,
          actor_avatar: f.profiles?.avatar_url || '',
          timestamp: f.created_at,
          target_id: f.project_id,
          target_tab: 'detail',
          badge_color: 'var(--coral)'
        });
      });

      // New Messages
      messages.forEach(m => {
        const senderName = m.sender?.full_name || 'Community Member';
        activityItems.push({
          id: `msg_${m.id}`,
          type: 'new_message',
          title: `Direct Message from ${senderName}`,
          description: m.content ? `"${m.content.slice(0, 100)}..."` : 'Sent a new message',
          actor_name: senderName,
          actor_avatar: m.sender?.avatar_url || '',
          timestamp: m.created_at,
          target_id: m.sender_id,
          target_tab: 'messages',
          badge_color: 'var(--apricot)'
        });
      });

      // Sort all activity items descending by timestamp
      activityItems.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

      return {
        data: {
          my_projects: userProjects,
          my_projects_count: userProjects.length,
          published_projects: publishedProjects,
          published_projects_count: publishedProjects.length,
          draft_projects: draftProjects,
          draft_projects_count: draftProjects.length,
          total_views: totalViews,
          upvotes,
          downvotes,
          reviews_received_count: reviewsCount,
          suggestions_count: suggestionsCount,
          followers_count: followersCount,
          unread_notifications_count: unreadNotificationsCount,
          unread_messages_count: unreadMessagesCount,
          recent_activity: activityItems.slice(0, 20)
        },
        error: null
      };
    } catch (err) {
      console.error('[Supabase getUserDashboardSummary exception]:', err);
      return {
        data: {
          my_projects: [],
          my_projects_count: 0,
          published_projects: [],
          published_projects_count: 0,
          draft_projects: [],
          draft_projects_count: 0,
          total_views: 0,
          upvotes: 0,
          downvotes: 0,
          reviews_received_count: 0,
          suggestions_count: 0,
          followers_count: 0,
          unread_notifications_count: 0,
          unread_messages_count: 0,
          recent_activity: []
        },
        error: err
      };
    }
  },

  async getInsightsData() {
    try {
      const [projRes, revRes, userRes, catRes] = await Promise.all([
        supabase.from('projects').select('id, category_id, status, created_at, project_type'),
        supabase.from('reviews').select('id, project_id, rating, created_at'),
        supabase.from('profiles').select('id, reputation_points, role, created_at'),
        supabase.from('categories').select('id, name, slug')
      ]);

      const projects = projRes.data || [];
      const reviews = revRes.data || [];
      const users = userRes.data || [];
      const categories = catRes.data || [];

      return {
        total_projects: projects.length,
        total_reviews: reviews.length,
        total_validators: users.length,
        average_rating: reviews.length > 0 ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1) : '5.0',
        categories_count: categories.length,
        projects,
        reviews,
        users,
        categories
      };
    } catch (e) {
      console.error('[Supabase getInsightsData exception]:', e);
      return {
        total_projects: 0,
        total_reviews: 0,
        total_validators: 0,
        average_rating: '5.0',
        categories_count: 6,
        projects: [],
        reviews: [],
        users: [],
        categories: []
      };
    }
  },

  async voteCommunityItem({ itemId, userId, voteType }) {
    return this.voteCommunityPost({ postId: itemId, userId, voteType });
  },

  async isUserFollowingProject(projectId, userId) {
    try {
      if (!userId || !projectId) return { following: false, error: null };
      const { data, error } = await supabase
        .from('project_follows')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return { following: Boolean(data), error: null };
    } catch {
      const all = StorageService.getProjectFollowers ? StorageService.getProjectFollowers(projectId) : [];
      return { following: all.includes(userId), error: null };
    }
  },

  // ============================================================================
  // 16. EXTERNAL DISCOVERY SIGNALS (Discovery Engine Integration)
  // ============================================================================
  async getExternalInnovations(filters = {}) {
    const cacheKey = `external_innovations:${JSON.stringify(filters)}`;
    const cached = getCachedQuery(cacheKey);
    if (cached) return { data: cached, error: null };

    const list = StorageService.getExternalInnovations(filters) || [];
    setCachedQuery(cacheKey, list, 30000);
    return { data: list, error: null };
  },

  async getExternalInnovationById(id) {
    if (!id) return { data: null, error: 'ID required' };
    const cacheKey = `external_innovation:${id}`;
    const cached = getCachedQuery(cacheKey);
    if (cached) return { data: cached, error: null };

    const item = StorageService.getExternalInnovationById(id);
    if (item) setCachedQuery(cacheKey, item, 30000);
    return { data: item || null, error: null };
  },

  async likeExternalInnovation(id) {
    if (!id) return { data: null, error: 'ID required' };
    const item = StorageService.toggleLikeExternalInnovation(id);
    invalidateSupabaseCache('external_innovation');
    return { data: item || null, error: null };
  }
};

