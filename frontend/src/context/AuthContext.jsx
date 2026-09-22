import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { checkAndProcessExpiredAssignments } from '../services/reassignment';

const AuthContext = createContext();

// Helper: Enhanced Error Diagnosis & Console Logging (Step 10)
const diagnoseAuthError = (error, context = 'Auth') => {
  console.error(`Authentication error [${context}]:`, error);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    console.error("[Supabase Diagnostic] Root cause: Missing VITE_SUPABASE_URL in .env");
    return "Supabase configuration error: Missing VITE_SUPABASE_URL in .env.";
  }
  if (!supabaseKey) {
    console.error("[Supabase Diagnostic] Root cause: Missing VITE_SUPABASE_ANON_KEY in .env");
    return "Supabase configuration error: Missing VITE_SUPABASE_ANON_KEY in .env.";
  }

  const msg = error?.message || (typeof error === 'string' ? error : '');
  const lower = msg.toLowerCase();

  // Requirement 6: "Too many authentication emails have been requested. Please wait before trying again."
  if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit') || error?.status === 429) {
    console.warn(
      "[Supabase Diagnostic] Root cause: Supabase Email Rate Limit Exceeded.\n" +
      "-> To allow instant signups in development without rate limits:\n" +
      "   1. Go to Supabase Dashboard -> Authentication -> Providers -> Email\n" +
      "   2. Turn OFF 'Confirm email'\n" +
      "   3. Click 'Save'."
    );
    return "Too many authentication emails have been requested. Please wait before trying again.";
  }

  // Requirement 9: "An account may already exist with this email. Please try signing in."
  if (lower.includes('already registered') || lower.includes('user already exists')) {
    return "An account may already exist with this email. Please try signing in.";
  }

  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network request failed')) {
    console.error(
      "[Supabase Diagnostic] Root cause: Network fetch failure (TypeError: Failed to fetch).\n" +
      "-> Common causes & fixes:\n" +
      "   1. Ad blocker or Brave Shields blocking requests to supabase.co — Disable on localhost.\n" +
      "   2. Internet connection temporarily interrupted.\n" +
      "   3. Supabase project paused in Supabase Dashboard (supabase.com/dashboard) — Click 'Resume Project'.\n" +
      "   4. Restart the Vite development server (`npm run dev`) if environment variables were updated."
    );
    return "Network connection failed. Please check your internet connection or disable ad blockers.";
  }

  if (lower.includes('invalid api key') || lower.includes('jwt') || lower.includes('apikey') || lower.includes('unauthorized') || error?.status === 401 || error?.status === 403) {
    console.error("[Supabase Diagnostic] Root cause: Invalid API key.");
    return "Invalid Supabase API key. Please check your VITE_SUPABASE_ANON_KEY configuration.";
  }

  if (lower.includes('invalid login credentials') || lower.includes('invalid credential')) {
    return "Invalid email or password. Please verify your credentials.";
  }
  if (lower.includes('email not confirmed')) {
    return "Please verify your email address via the confirmation link sent to your inbox before signing in.";
  }
  if (lower.includes('password should be at least')) {
    return "Password must be at least 6 characters long.";
  }
  if (lower.includes('valid email')) {
    return "Please enter a valid email address.";
  }

  return msg || "Authentication error occurred. Please try again.";
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [theme, setTheme] = useState('dark');
  const [redirectPath, setRedirectPath] = useState(null);

  // In-flight operation locks to prevent duplicate network calls (Requirements 1, 4, 5)
  const isSignupInProgressRef = useRef(false);
  const isLoginInProgressRef = useRef(false);

  // Helper: Fetch or verify/create profile row in public.profiles and public.user_private_data
  const fetchOrCreateProfile = async (authUser) => {
    if (!authUser || !authUser.id) return null;

    try {
      // 1. Fetch public profile and private data concurrently with safety timeout
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      const privatePromise = supabase
        .from('user_private_data')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      const timeoutPromise = new Promise((resolve) => 
        setTimeout(() => resolve({ data: null, error: null }), 3000)
      );

      const [profileResult, privateResult] = await Promise.all([
        Promise.race([profilePromise, timeoutPromise]),
        Promise.race([privatePromise, timeoutPromise])
      ]);

      let existingProfile = profileResult?.data;
      let existingPrivate = privateResult?.data;

      if (existingProfile) {
        return {
          ...existingProfile,
          private_data: existingPrivate || null,
          onboarding_completed: existingPrivate?.onboarding_completed ?? false
        };
      }

      // 2. Profile does not exist yet; create it for the authenticated Supabase user
      const meta = authUser.user_metadata || {};
      const fullName = meta.full_name || meta.name || authUser.email?.split('@')[0] || 'Innovator';
      const username = meta.username || authUser.email?.split('@')[0] || `user_${authUser.id.slice(0, 8)}`;
      
      const initialProfile = {
        id: authUser.id,
        username: username,
        full_name: fullName,
        avatar_url: meta.avatar_url || meta.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=20212a,e76f82,7186d8`,
        headline: meta.headline || '',
        bio: meta.bio || '',
        location: meta.location || '',
        website: meta.website || '',
        github_url: meta.github_url || '',
        linkedin_url: meta.linkedin_url || '',
        role: typeof meta.role === 'string' ? meta.role : (Array.isArray(meta.role) ? meta.role[0] : 'innovator'),
        reputation_points: 100,
        projects_count: 0,
        reviews_count: 0,
        profile_visibility: 'public',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const initialPrivate = {
        user_id: authUser.id,
        phone: meta.phone || null,
        date_of_birth: meta.date_of_birth || null,
        address: meta.address || null,
        preferences: {
          ...(meta.preferences || {}),
          onboarding_completed: meta.onboarding_completed !== undefined ? Boolean(meta.onboarding_completed) : false
        }
      };

      try {
        const { data: createdProfile } = await supabase
          .from('profiles')
          .insert([initialProfile])
          .select()
          .maybeSingle();

        const { data: createdPrivate } = await supabase
          .from('user_private_data')
          .insert([initialPrivate])
          .select()
          .maybeSingle();

        return {
          ...(createdProfile || initialProfile),
          private_data: createdPrivate || initialPrivate,
          onboarding_completed: Boolean((createdPrivate || initialPrivate)?.preferences?.onboarding_completed)
        };
      } catch (insertErr) {
        console.warn('[Supabase profiles] Notice while creating profile row:', insertErr);
        return {
          ...initialProfile,
          private_data: initialPrivate,
          onboarding_completed: Boolean(initialPrivate?.preferences?.onboarding_completed)
        };
      }
    } catch (err) {
      console.warn('[Supabase profiles] Unexpected exception during profile check:', err);
      return null;
    }
  };

  // Sync Supabase session & profiles table with application user state
  const syncUserFromSession = async (supabaseSession) => {
    if (!supabaseSession || !supabaseSession.user) {
      setSession(null);
      setCurrentUser(null);
      setProfile(null);
      StorageService.setCurrentUserId(null);
      setNotifications([]);
      return null;
    }

    const sbUser = supabaseSession.user;
    const userProfile = await fetchOrCreateProfile(sbUser);

    const meta = sbUser.user_metadata || {};
    const fullName = userProfile?.full_name || meta.full_name || meta.name || sbUser.email?.split('@')[0] || 'Innovator';
    const avatar = userProfile?.avatar_url || meta.avatar_url || meta.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=20212a,e76f82,7186d8`;
    const onboardingDone = Boolean(userProfile?.onboarding_completed !== undefined ? userProfile.onboarding_completed : (userProfile?.private_data?.onboarding_completed ?? meta.onboarding_completed));
    const repPoints = userProfile?.reputation_points ?? userProfile?.credits ?? meta.reputation_points ?? 100;

    const appUser = {
      id: sbUser.id,
      email: sbUser.email,
      username: userProfile?.username || meta.username || sbUser.email?.split('@')[0],
      name: fullName,
      full_name: fullName,
      avatar: avatar,
      avatar_url: avatar,
      bio: userProfile?.bio || meta.bio || '',
      headline: userProfile?.headline || meta.headline || '',
      organization: userProfile?.organization || meta.organization || '',
      location: userProfile?.location || '',
      website: userProfile?.website || '',
      github_url: userProfile?.github_url || '',
      linkedin_url: userProfile?.linkedin_url || '',
      role: userProfile?.role || meta.role || ['I CREATE IDEAS'],
      interests: userProfile?.interests || meta.interests || ['AI & MACHINE LEARNING', 'WEB TECHNOLOGY'],
      skills: userProfile?.skills || meta.skills || [],
      preferred_domains: userProfile?.preferred_domains || meta.preferred_domains || [],
      credits: repPoints,
      reputation_score: repPoints,
      reputation_points: repPoints,
      reputation_tier: repPoints >= 200 ? 'EXPERT CONTRIBUTOR' : (repPoints >= 100 ? 'TRUSTED REVIEWER' : 'NEW INNOVATOR'),
      projects_count: userProfile?.projects_count || 0,
      reviews_count: userProfile?.reviews_count || 0,
      profile_visibility: userProfile?.profile_visibility || 'public',
      onboarding_completed: onboardingDone,
      created_at: userProfile?.created_at || sbUser.created_at,
      updated_at: userProfile?.updated_at || new Date().toISOString()
    };

    // Upsert into local cache for offline/instant availability
    StorageService.upsertUser(appUser);

    setSession(supabaseSession);
    setProfile(userProfile);
    StorageService.setCurrentUserId(appUser.id);
    setCurrentUser(appUser);

    try {
      const { data: realNotifs } = await SupabaseService.getNotifications(appUser.id);
      setNotifications(realNotifs && realNotifs.length > 0 ? realNotifs : (StorageService.getNotificationsForUser(appUser.id) || []));
    } catch (e) {
      const notifs = StorageService.getNotificationsForUser(appUser.id);
      setNotifications(notifs || []);
    }

    // Load unread message count
    try {
      const cnt = await SupabaseService.getUnreadMessagesCount(appUser.id);
      setUnreadMessagesCount(cnt || 0);
    } catch (_) {}

    return appUser;
  };

  const refreshUserData = async () => {
    try {
      const allUsers = StorageService.getUsers();
      setUsers(allUsers || []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: { session: currSession } } = await supabase.auth.getSession();
        if (currSession) {
          await syncUserFromSession(currSession);
        }
      }
      setApiKey(StorageService.getGeminiApiKey() || '');
    } catch (e) {
      console.warn('Error refreshing user data:', e);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        StorageService.init();
        setApiKey(StorageService.getGeminiApiKey() || '');

        // Theme initialization
        const savedTheme = localStorage.getItem('innovexa_theme') || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);

        // 1. Check existing session on load
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[Supabase session init warning]:', error.message || error);
        }

        if (isMounted) {
          if (initialSession) {
            await syncUserFromSession(initialSession);
          } else {
            const localUser = StorageService.getCurrentUser();
            if (localUser) {
              setCurrentUser(localUser);
              setProfile(localUser);
              setNotifications(StorageService.getNotificationsForUser(localUser.id) || []);
            } else {
              setSession(null);
              setCurrentUser(null);
              setProfile(null);
            }
          }
          setIsLoadingAuth(false);
        }

        // 2. Subscribe to Supabase auth state change events
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (!isMounted) return;
          if (event === 'SIGNED_OUT') {
            setSession(null);
            setCurrentUser(null);
            setProfile(null);
            StorageService.setCurrentUserId(null);
            setNotifications([]);
            setIsLoadingAuth(false);
          } else if (newSession) {
            await syncUserFromSession(newSession);
            setIsLoadingAuth(false);
            if (window.location.hash.includes('access_token=') || window.location.search.includes('code=')) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        });

        checkAndProcessExpiredAssignments();

        // Global Command Palette Shortcut (Ctrl+K or Cmd+K)
        const handleKeyDown = (e) => {
          if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
            e.preventDefault();
            setIsCommandPaletteOpen(prev => !prev);
          }
        };
        window.addEventListener('keydown', handleKeyDown);

        // Listen to custom data change events
        const handleDataChange = () => {
          refreshUserData();
        };
        window.addEventListener('innovexa:datachange', handleDataChange);

        return () => {
          subscription?.unsubscribe?.();
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('innovexa:datachange', handleDataChange);
        };
      } catch (err) {
        console.error('AuthProvider init error:', err);
        if (isMounted) setIsLoadingAuth(false);
      }
    };

    const cleanupPromise = initAuth();

    return () => {
      isMounted = false;
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('innovexa_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Toast notification helper
  const showToast = (message, type = 'info', duration = 4000) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const newToast = { id, message, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  // Switch persona for simulation / testing
  const switchUser = (userId) => {
    const targetUser = StorageService.getUserById(userId);
    if (targetUser) {
      StorageService.setCurrentUserId(targetUser.id);
      setCurrentUser(targetUser);
      const notifs = StorageService.getNotificationsForUser(targetUser.id);
      setNotifications(notifs || []);
      showToast(`Switched active persona to ${targetUser.name}.`, 'info');
    }
  };

  // Real Supabase Signup
  const signup = async ({ name, email, password, role }) => {
    if (isSignupInProgressRef.current) {
      return { success: false, inProgress: true };
    }

    isSignupInProgressRef.current = true;

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: password,
        options: {
          data: {
            full_name: trimmedName,
            name: trimmedName,
            role: role || 'I CREATE IDEAS'
          }
        }
      });

      if (error) {
        const userMessage = diagnoseAuthError(error, 'Signup');
        showToast(userMessage, 'warning');
        return { success: false, error: userMessage };
      }

      if (data?.user) {
        if (data.session) {
          const appUser = await syncUserFromSession(data.session);
          showToast(`Welcome to INNOVEXA, ${trimmedName}!`, 'success');
          return {
            success: true,
            user: appUser,
            session: data.session,
            onboarding_completed: Boolean(appUser?.onboarding_completed)
          };
        } else {
          // Email confirmation is enabled in Supabase project
          showToast('Account created! Please check your email to verify your account or proceed to sign in.', 'success', 6000);
          return {
            success: true,
            user: data.user,
            emailConfirmationRequired: true
          };
        }
      }

      const defaultErr = 'Registration could not be completed. Please try again.';
      showToast(defaultErr, 'warning');
      return { success: false, error: defaultErr };
    } catch (err) {
      const userMessage = diagnoseAuthError(err, 'Signup (Exception)');
      showToast(userMessage, 'warning');
      return { success: false, error: userMessage };
    } finally {
      isSignupInProgressRef.current = false;
    }
  };

  // Real Supabase Login
  const login = async ({ email, password }) => {
    if (isLoginInProgressRef.current) {
      return { success: false, inProgress: true };
    }

    isLoginInProgressRef.current = true;

    try {
      const trimmedEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password
      });

      if (error) {
        const userMessage = diagnoseAuthError(error, 'Login');
        showToast(userMessage, 'warning');
        return { success: false, error: userMessage };
      }

      if (data?.session) {
        const appUser = await syncUserFromSession(data.session);
        showToast(`Welcome back, ${appUser?.name || 'Innovator'}!`, 'success');
        return {
          success: true,
          user: appUser,
          session: data.session,
          onboarding_completed: Boolean(appUser?.onboarding_completed)
        };
      }

      const defaultErr = 'Invalid email or password credentials.';
      showToast(defaultErr, 'warning');
      return { success: false, error: defaultErr };
    } catch (err) {
      const userMessage = diagnoseAuthError(err, 'Login (Exception)');
      showToast(userMessage, 'warning');
      return { success: false, error: userMessage };
    } finally {
      isLoginInProgressRef.current = false;
    }
  };

  // Supabase Password Reset Request
  const resetPassword = async (email) => {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail);

      if (error) {
        const userMessage = diagnoseAuthError(error, 'Password Reset');
        showToast(userMessage, 'warning');
        return { success: false, error: userMessage };
      }

      showToast(`Password reset link sent to ${trimmedEmail}. Please check your inbox.`, 'success');
      return { success: true };
    } catch (err) {
      const userMessage = diagnoseAuthError(err, 'Password Reset (Exception)');
      showToast(userMessage, 'warning');
      return { success: false, error: userMessage };
    }
  };

  // Real Supabase Logout
  const logout = async () => {
    StorageService.setCurrentUserId(null);
    setSession(null);
    setCurrentUser(null);
    setProfile(null);
    setNotifications([]);
    showToast('You have been signed out of INNOVEXA.', 'info');
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Error during Supabase signOut:', e);
    }
  };

  // Update Profile, Onboarding & User Interests (Instant Local + Async Cloud Sync)
  const updateUserProfile = async (updates) => {
    const targetUserId = currentUser?.id || StorageService.getCurrentUserId() || (StorageService.getUsers()[0]?.id);
    if (!targetUserId) return null;

    const existingUser = (currentUser && currentUser.id === targetUserId) 
      ? currentUser 
      : (StorageService.getUserById(targetUserId) || StorageService.getUsers()[0] || {});

    const fullName = updates.name !== undefined ? updates.name : (updates.full_name !== undefined ? updates.full_name : (existingUser.name || 'Innovator'));
    const username = updates.username !== undefined ? updates.username : (existingUser.username || '');
    const headline = updates.headline !== undefined ? updates.headline : (existingUser.headline || '');
    const bio = updates.bio !== undefined ? updates.bio : (existingUser.bio || '');
    const location = updates.location !== undefined ? updates.location : (existingUser.location || '');
    const website = updates.website !== undefined ? updates.website : (existingUser.website || '');
    const githubUrl = updates.github_url !== undefined ? updates.github_url : (existingUser.github_url || '');
    const linkedinUrl = updates.linkedin_url !== undefined ? updates.linkedin_url : (existingUser.linkedin_url || '');
    const organization = updates.organization !== undefined ? updates.organization : (existingUser.organization || '');
    const avatar = updates.avatar !== undefined ? updates.avatar : (updates.avatar_url !== undefined ? updates.avatar_url : (existingUser.avatar || ''));
    const onboardingCompleted = updates.onboarding_completed !== undefined ? Boolean(updates.onboarding_completed) : Boolean(existingUser.onboarding_completed);
    const role = updates.role !== undefined ? updates.role : (existingUser.role || ['I CREATE IDEAS']);
    const interests = updates.interests !== undefined ? updates.interests : (existingUser.interests || ['AI & MACHINE LEARNING']);
    const skills = updates.skills !== undefined ? updates.skills : (existingUser.skills || []);
    const preferredDomains = updates.preferred_domains !== undefined ? updates.preferred_domains : (existingUser.preferred_domains || []);

    const profileData = {
      full_name: fullName,
      name: fullName,
      username: username,
      avatar_url: avatar,
      avatar: avatar,
      headline: headline,
      bio: bio,
      location: location,
      website: website,
      github_url: githubUrl,
      linkedin_url: linkedinUrl,
      organization: organization,
      onboarding_completed: onboardingCompleted,
      role: role,
      interests: interests,
      skills: skills,
      preferred_domains: preferredDomains,
      updated_at: new Date().toISOString()
    };

    // 1. INSTANT LOCAL UPDATE (Storage + React State)
    StorageService.updateUser(targetUserId, profileData);
    StorageService.setCurrentUserId(targetUserId);

    const finalAppUser = {
      ...existingUser,
      id: targetUserId,
      ...profileData
    };

    setCurrentUser(finalAppUser);
    setProfile(finalAppUser);

    // 2. ASYNC CLOUD SYNC (Supabase background execution)
    (async () => {
      try {
        await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            username: username || undefined,
            avatar_url: avatar,
            headline: headline,
            bio: bio,
            location: location,
            website: website,
            github_url: githubUrl,
            linkedin_url: linkedinUrl,
            role: typeof role === 'string' ? role : (Array.isArray(role) ? role[0] : 'innovator'),
            profile_visibility: updates.profile_visibility !== undefined ? updates.profile_visibility : (existingUser.profile_visibility || 'public'),
            updated_at: new Date().toISOString()
          })
          .eq('id', targetUserId);
      } catch (err) {
        console.warn('[Supabase profiles async sync notice]:', err);
      }

      try {
        const currentPrefs = updates.preferences !== undefined ? updates.preferences : (existingUser.preferences || {});
        await supabase
          .from('user_private_data')
          .upsert({
            user_id: targetUserId,
            phone: updates.phone !== undefined ? updates.phone : (existingUser.phone || null),
            date_of_birth: updates.date_of_birth !== undefined ? updates.date_of_birth : (existingUser.date_of_birth || null),
            address: updates.address !== undefined ? updates.address : (existingUser.address || null),
            preferences: {
              ...(typeof currentPrefs === 'object' ? currentPrefs : {}),
              onboarding_completed: onboardingCompleted
            },
            updated_at: new Date().toISOString()
          });
      } catch (privateErr) {
        console.warn('[Supabase user_private_data async sync notice]:', privateErr);
      }

      try {
        await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            name: fullName,
            onboarding_completed: onboardingCompleted,
            role: role,
            interests: interests,
            avatar: avatar,
            avatar_url: avatar,
            bio: bio,
            organization: organization,
            skills: skills,
            preferred_domains: preferredDomains
          }
        });
      } catch (authSyncErr) {
        // auth sync optional in offline/demo mode
      }
    })();

    return finalAppUser;
  };

  const saveApiKey = (newKey) => {
    StorageService.setGeminiApiKey(newKey);
    setApiKey(newKey);
    showToast(newKey ? 'Gemini API Key saved for live AI analysis.' : 'API Key cleared. Using rule-based fallback.', 'success');
  };

  const markNotificationAsRead = async (id) => {
    StorageService.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true, read: true } : n));
    try {
      await SupabaseService.markNotificationAsRead(id);
    } catch (e) {
      // offline fallback
    }
  };

  const markAllNotificationsRead = async () => {
    if (currentUser) {
      StorageService.markAllNotificationsRead(currentUser.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read: true })));
      try {
        await SupabaseService.markAllNotificationsAsRead(currentUser.id);
      } catch (e) {
        // offline fallback
      }
      showToast('All notifications marked as read.', 'info');
    }
  };

  const unreadNotificationsCount = (notifications || []).filter(n => !n.is_read && !n.read).length;

  // Refresh unread message count whenever a data-change event fires (realtime push)
  useEffect(() => {
    if (!currentUser) return;
    const handler = async (e) => {
      if (!e.detail?.entity || e.detail.entity === 'messages') {
        try {
          const cnt = await SupabaseService.getUnreadMessagesCount(currentUser.id);
          setUnreadMessagesCount(cnt || 0);
        } catch (_) {}
      }
    };
    window.addEventListener('innovexa:datachange', handler);
    return () => window.removeEventListener('innovexa:datachange', handler);
  }, [currentUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        session,
        isLoadingAuth,
        users,
        signup,
        login,
        logout,
        switchUser,
        resetPassword,
        updateUserProfile,
        refreshUserData,
        showToast,
        redirectPath,
        setRedirectPath,
        isApiKeyModalOpen,
        setIsApiKeyModalOpen,
        isPersonaModalOpen,
        setIsPersonaModalOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        apiKey,
        setApiKey: saveApiKey,
        saveApiKey,
        theme,
        toggleTheme,
        notifications: notifications || [],
        unreadNotificationsCount,
        unreadMessagesCount,
        markNotificationAsRead,
        markAllNotificationsRead
      }}
    >
      {children}

      {/* Global Toast Stack */}
      <div className="toast-stack">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast-message ${toast.type}`}>
            <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>
              {toast.type === 'success' ? '✓' : toast.type === 'warning' ? '⚠' : 'ℹ'}
            </span>
            <div>{toast.message}</div>
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      currentUser: null,
      profile: null,
      session: null,
      isLoadingAuth: false,
      users: [],
      signup: async () => ({ success: false }),
      login: async () => ({ success: false }),
      logout: async () => {},
      switchUser: () => {},
      resetPassword: async () => ({ success: false }),
      updateUserProfile: async () => {},
      refreshUserData: async () => {},
      showToast: () => {},
      redirectPath: null,
      setRedirectPath: () => {},
      isApiKeyModalOpen: false,
      setIsApiKeyModalOpen: () => {},
      isPersonaModalOpen: false,
      setIsPersonaModalOpen: () => {},
      isCommandPaletteOpen: false,
      setIsCommandPaletteOpen: () => {},
      apiKey: '',
      setApiKey: () => {},
      saveApiKey: () => {},
      theme: 'dark',
      toggleTheme: () => {},
      notifications: [],
      unreadNotificationsCount: 0,
      unreadMessagesCount: 0,
      markNotificationAsRead: () => {},
      markAllNotificationsRead: () => {}
    };
  }
  return context;
}
