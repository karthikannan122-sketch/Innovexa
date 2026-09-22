import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { getCategoryInk, BRAND_COLORS } from '../utils/categoryColors';
import CountUp from '../components/CountUp';
import { 
  User, 
  Award, 
  ShieldCheck, 
  Tag, 
  Sliders, 
  CheckCircle2, 
  Star, 
  Save, 
  Heart, 
  MessageSquare,
  Sparkles,
  Zap,
  FolderKanban,
  Building,
  MapPin,
  Globe,
  Code2,
  Link2,
  ExternalLink,
  Mail,
  ArrowLeft,
  Edit3,
  Users
} from 'lucide-react';

/**
 * UserProfilePage — Validator Credentials, Public Dossier & Profile Desk
 * Supports both Own Authenticated Profile (with edit controls) and Public Profile View for other innovators.
 */
export default function UserProfilePage({ 
  viewUserId, 
  setViewUserId, 
  setActiveTab, 
  setSelectedInnoId, 
  setSelectedRecipientId 
}) {
  const { currentUser, updateUserProfile, showToast } = useAuth();

  // Effective user resolution with instant local storage fallback & default founder persona
  const effectiveCurrentUser = currentUser || StorageService.getCurrentUser() || (StorageService.getUsers()[0] || null);
  const effectiveTargetUserId = viewUserId || effectiveCurrentUser?.id || StorageService.getCurrentUserId() || 'usr_karthick_founder';
  const isOwnProfile = Boolean(
    !viewUserId || 
    (effectiveCurrentUser?.id && viewUserId === effectiveCurrentUser.id) ||
    (StorageService.getCurrentUserId() && viewUserId === StorageService.getCurrentUserId())
  );

  const allCategories = StorageService.getCategories();

  // Synchronous initial profile resolution for instant zero-latency render
  const resolveTargetProfile = (targetId, isOwn) => {
    if (viewUserId) {
      const fromStorage = StorageService.getUserById(viewUserId);
      if (fromStorage) return fromStorage;
    }
    if (isOwn && effectiveCurrentUser) {
      return effectiveCurrentUser;
    }
    if (targetId) {
      const fromStorage = StorageService.getUserById(targetId);
      if (fromStorage) return fromStorage;
    }
    return effectiveCurrentUser;
  };

  const initialCached = resolveTargetProfile(effectiveTargetUserId, isOwnProfile);

  // Target Profile Data State - seeded immediately so it NEVER gets stuck on empty
  const [profileData, setProfileData] = useState(initialCached);
  const [userProjects, setUserProjects] = useState(() => {
    if (!effectiveTargetUserId) return [];
    return (StorageService.getInnovations() || []).filter(
      i => i.user_id === effectiveTargetUserId || i.creator_id === effectiveTargetUserId
    );
  });
  const [userReviews, setUserReviews] = useState(() => {
    if (!effectiveTargetUserId) return [];
    return (StorageService.getReviews() || []).filter(
      r => r.reviewer_id === effectiveTargetUserId || r.user_id === effectiveTargetUserId
    );
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form Edit State - prefilled from initial cached data
  const [fullName, setFullName] = useState(initialCached?.full_name || initialCached?.name || '');
  const [username, setUsername] = useState(initialCached?.username || '');
  const [headline, setHeadline] = useState(initialCached?.headline || '');
  const [organization, setOrganization] = useState(initialCached?.organization || '');
  const [bio, setBio] = useState(initialCached?.bio || '');
  const [location, setLocation] = useState(initialCached?.location || '');
  const [website, setWebsite] = useState(initialCached?.website || '');
  const [githubUrl, setGithubUrl] = useState(initialCached?.github_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(initialCached?.linkedin_url || '');
  const [avatarUrl, setAvatarUrl] = useState(initialCached?.avatar_url || initialCached?.avatar || '');
  const [interests, setInterests] = useState(initialCached?.interests || ['AI & MACHINE LEARNING', 'WEB TECHNOLOGY']);
  const [skills, setSkills] = useState(Array.isArray(initialCached?.skills) ? initialCached.skills.join(', ') : '');

  // Load Profile and Real Supabase Metrics with Safety Timeout
  const loadProfileData = async () => {
    const activeUserId = viewUserId || effectiveTargetUserId;
    if (!activeUserId) {
      setIsLoading(false);
      return;
    }

    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activeUserId);
      let dbProfile = null;
      if (isUUID) {
        const profilePromise = SupabaseService.getProfileById(activeUserId);
        const timeoutPromise = new Promise(resolve => 
          setTimeout(() => resolve({ data: null, error: 'timeout' }), 1500)
        );
        const res = await Promise.race([profilePromise, timeoutPromise]);
        dbProfile = res?.data;
      }

      const fallback = isOwnProfile ? (currentUser || StorageService.getCurrentUser()) : StorageService.getUserById(activeUserId);
      const resolved = dbProfile || fallback || profileData || {
        id: activeUserId,
        name: 'Community Innovator',
        full_name: 'Community Innovator',
        headline: 'Active Community Innovator',
        reputation_points: 100,
        credits: 100
      };

      if (resolved && (resolved.name || resolved.full_name || resolved.id)) {
        setProfileData(resolved);

        // Populate edit fields if own profile
        if (isOwnProfile) {
          setFullName(resolved.full_name || resolved.name || currentUser?.name || 'Innovator');
          setUsername(resolved.username || currentUser?.username || '');
          setHeadline(resolved.headline || currentUser?.headline || '');
          setOrganization(resolved.organization || currentUser?.organization || '');
          setBio(resolved.bio || currentUser?.bio || '');
          setLocation(resolved.location || currentUser?.location || '');
          setWebsite(resolved.website || currentUser?.website || '');
          setGithubUrl(resolved.github_url || currentUser?.github_url || '');
          setLinkedinUrl(resolved.linkedin_url || currentUser?.linkedin_url || '');
          setAvatarUrl(resolved.avatar_url || resolved.avatar || currentUser?.avatar || '');
          setInterests(resolved.interests || currentUser?.interests || ['AI & MACHINE LEARNING', 'WEB TECHNOLOGY']);
          setSkills(Array.isArray(resolved.skills) ? resolved.skills.join(', ') : (currentUser?.skills?.join(', ') || ''));
        }
      }

      // Fetch target user's actual projects and reviews with timeout
      const projsPromise = SupabaseService.getUserProjects(activeUserId);
      const revsPromise = SupabaseService.getUserReviews(activeUserId);
      const dataTimeout = new Promise(resolve => 
        setTimeout(() => resolve([{ data: null }, { data: null }]), 1500)
      );

      const [projsRes, revsRes] = await Promise.race([
        Promise.all([projsPromise, revsPromise]),
        dataTimeout
      ]);

      const localProjects = (StorageService.getInnovations() || []).filter(
        i => i.user_id === activeUserId || i.creator_id === activeUserId
      );
      const localReviews = (StorageService.getReviews() || []).filter(
        r => r.reviewer_id === activeUserId || r.user_id === activeUserId
      );

      const projects = (projsRes?.data && projsRes.data.length > 0) ? projsRes.data : localProjects;
      const reviews = (revsRes?.data && revsRes.data.length > 0) ? revsRes.data : localReviews;

      setUserProjects(projects);
      setUserReviews(reviews);
    } catch (e) {
      console.warn('[UserProfilePage loadProfileData notice]:', e);
      const fallbackProjects = (StorageService.getInnovations() || []).filter(
        i => i.user_id === activeUserId || i.creator_id === activeUserId
      );
      const fallbackReviews = (StorageService.getReviews() || []).filter(
        r => r.reviewer_id === activeUserId || r.user_id === activeUserId
      );
      setUserProjects(fallbackProjects);
      setUserReviews(fallbackReviews);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const cached = resolveTargetProfile(effectiveTargetUserId, isOwnProfile);
    if (cached) {
      setProfileData(cached);
      if (isOwnProfile) {
        setFullName(cached.full_name || cached.name || 'Innovator');
        setUsername(cached.username || '');
        setHeadline(cached.headline || '');
        setOrganization(cached.organization || '');
        setBio(cached.bio || '');
        setLocation(cached.location || '');
        setWebsite(cached.website || '');
        setGithubUrl(cached.github_url || '');
        setLinkedinUrl(cached.linkedin_url || '');
        setAvatarUrl(cached.avatar_url || cached.avatar || '');
        setInterests(cached.interests || ['AI & MACHINE LEARNING', 'WEB TECHNOLOGY']);
        setSkills(Array.isArray(cached.skills) ? cached.skills.join(', ') : '');
      }
    }
    const localProjects = (StorageService.getInnovations() || []).filter(
      i => i.user_id === effectiveTargetUserId || i.creator_id === effectiveTargetUserId
    );
    const localReviews = (StorageService.getReviews() || []).filter(
      r => r.reviewer_id === effectiveTargetUserId || r.user_id === effectiveTargetUserId
    );
    setUserProjects(localProjects);
    setUserReviews(localReviews);
    loadProfileData();
  }, [viewUserId, effectiveTargetUserId, currentUser]);

  const handleToggleInterest = (catName) => {
    if (!isOwnProfile) return;
    if (interests.includes(catName)) {
      setInterests(interests.filter(i => i !== catName));
    } else {
      setInterests([...interests, catName]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isOwnProfile || !currentUser) {
      showToast('You do not have permission to modify this profile.', 'error');
      return;
    }

    setIsSaving(true);
    const skillsArr = skills.split(',').map(s => s.trim()).filter(Boolean);

    const updatePayload = {
      full_name: fullName.trim(),
      name: fullName.trim(),
      username: username.trim().replace(/^@/, ''),
      headline: headline.trim(),
      organization: organization.trim(),
      bio: bio.trim(),
      location: location.trim(),
      website: website.trim(),
      github_url: githubUrl.trim(),
      linkedin_url: linkedinUrl.trim(),
      avatar_url: avatarUrl.trim() || undefined,
      avatar: avatarUrl.trim() || undefined,
      interests,
      skills: skillsArr
    };

    try {
      await updateUserProfile(updatePayload);
      setProfileData(prev => ({ ...prev, ...updatePayload }));
      setIsEditing(false);
      showToast('Validator credentials updated successfully!', 'success');
    } catch (err) {
      showToast('Error updating profile. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = profileData?.full_name || profileData?.name || (isOwnProfile ? (currentUser?.name || effectiveCurrentUser?.name) : 'Community Innovator');
  const displayUsername = profileData?.username || (isOwnProfile ? (currentUser?.username || effectiveCurrentUser?.username) : '') || displayName.toLowerCase().replace(/\s+/g, '_');
  const displayAvatar = profileData?.avatar_url || profileData?.avatar || (isOwnProfile ? (currentUser?.avatar || effectiveCurrentUser?.avatar) : '') || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=20212a,e76f82,7186d8`;
  const reputationScore = profileData?.reputation_score ?? profileData?.credits ?? profileData?.reputation_points ?? (isOwnProfile ? (currentUser?.credits || effectiveCurrentUser?.credits) : 100);
  const reputationTier = profileData?.reputation_tier || (reputationScore >= 200 ? 'EXPERT CONTRIBUTOR' : (reputationScore >= 100 ? 'TRUSTED REVIEWER' : 'NEW INNOVATOR'));
  const projectsCount = userProjects.length || profileData?.projects_count || 0;
  const reviewsCount = userReviews.length || profileData?.reviews_count || 0;

  // Dynamic Badges based on real achievements
  const badges = [
    { 
      title: 'Founding Citizen', 
      icon: '✦', 
      color: BRAND_COLORS.coral, 
      desc: 'Registered account in the network',
      unlocked: true 
    },
    { 
      title: 'Active Creator', 
      icon: '⚡', 
      color: BRAND_COLORS.lavender, 
      desc: `${projectsCount} innovation specimen${projectsCount === 1 ? '' : 's'} submitted`,
      unlocked: projectsCount > 0 
    },
    { 
      title: 'Verified Validator', 
      icon: '✓', 
      color: BRAND_COLORS.teal, 
      desc: `${reviewsCount} structured review${reviewsCount === 1 ? '' : 's'} completed`,
      unlocked: reviewsCount > 0 
    },
    { 
      title: 'Consensus Architect', 
      icon: '★', 
      color: BRAND_COLORS.periwinkle, 
      desc: 'Earned over 50 reputation credits',
      unlocked: reputationScore >= 50 
    }
  ];

  if (isLoading && !profileData) {
    return (
      <div className="workspace-container" style={{ maxWidth: '1080px', padding: '3rem 1rem', textAlign: 'center' }}>
        <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.75rem' }}>
          SYNCING VALIDATOR DOSSIER...
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Loading validator credentials from the ledger...
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="workspace-container" style={{ maxWidth: '1080px', padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.75rem' }}>
          VALIDATOR DOSSIER
        </div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Sign In to Access Your Credentials</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
          Please sign in to access your registered validator credentials, or select an innovator from the community ledger.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { if (setActiveTab) setActiveTab('login'); }}
            className="btn btn-coral"
          >
            Sign In to INNOVEXA
          </button>
          <button
            onClick={() => { if (setActiveTab) setActiveTab('explore'); }}
            className="btn btn-secondary"
          >
            Explore Public Ledger
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-container" style={{ maxWidth: '1080px' }}>
      {/* Demo Persona Info Banner when browsing in guest mode */}
      {isOwnProfile && !currentUser && (
        <div style={{
          padding: '0.9rem 1.25rem',
          backgroundColor: 'rgba(231, 111, 130, 0.08)',
          border: '1px solid rgba(231, 111, 130, 0.25)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Sparkles size={16} color="var(--coral)" />
            <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
              <strong>Demo Persona Active:</strong> Viewing default founder profile. Sign in or register to record and edit your personal validator credentials.
            </span>
          </div>
          <button
            onClick={() => { if (setActiveTab) setActiveTab('login'); }}
            className="btn btn-coral btn-sm"
          >
            Sign In / Register
          </button>
        </div>
      )}
      {/* Navigation breadcrumb when viewing another user's public profile */}
      {!isOwnProfile && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => {
              if (setViewUserId) setViewUserId(null);
            }}
            className="btn btn-secondary btn-sm"
            style={{ gap: '0.4rem' }}
          >
            <ArrowLeft size={14} /> Back to My Profile
          </button>
          <span className="category-tag tag-ink-environment" style={{ fontSize: '0.72rem' }}>
            PUBLIC PROFILE VIEW
          </span>
        </div>
      )}

      {/* Header Statement */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.45rem' }}>
            {isOwnProfile ? '01 / VALIDATOR DOSSIER' : 'PUBLIC INNOVATOR PROFILE'}
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.35rem' }}>
            {isOwnProfile ? 'Validator Credentials & Profile' : `${displayName}'s Portfolio`}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem' }}>
            {isOwnProfile 
              ? 'Manage your reputation standing, technical fluency matrix, and peer validation credentials.'
              : 'Inspect verified consensus achievements, registered innovation specimens, and peer critique history.'
            }
          </p>
        </div>

        {isOwnProfile && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`btn ${isEditing ? 'btn-secondary' : 'btn-coral'}`}
            style={{ gap: '0.45rem' }}
          >
            <Edit3 size={15} />
            {isEditing ? 'View Public Card' : 'Edit Credentials'}
          </button>
        )}

        {!isOwnProfile && currentUser && (
          <button
            onClick={() => {
              if (setActiveTab) setActiveTab('community');
            }}
            className="btn btn-coral"
            style={{ gap: '0.45rem' }}
          >
            <Users size={15} /> Community Discussions
          </button>
        )}
      </div>

      {/* 1. EDITORIAL PROFILE HERO CARD (PUBLIC VIEW) */}
      <div className="editorial-card" style={{ padding: '2.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>
          <img
            src={displayAvatar}
            alt={displayName}
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid var(--border-medium)',
              boxShadow: 'var(--shadow-md)',
              backgroundColor: 'var(--bg-cream)'
            }}
          />

          <div style={{ flex: '1 1 400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '2rem' }}>{displayName}</h2>
              <span className="category-tag tag-ink-ai">
                TIER: {reputationTier}
              </span>
              {profileData?.organization && (
                <span className="category-tag tag-ink-environment" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Building size={12} /> {profileData.organization}
                </span>
              )}
            </div>

            {/* Username */}
            <div className="mono" style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '0.5rem' }}>
              @{displayUsername}
            </div>

            {/* Headline */}
            <div style={{ color: 'var(--coral)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.65rem' }}>
              {profileData?.headline || (isOwnProfile ? 'Innovator & Peer Validator' : 'Active Community Innovator')}
            </div>

            {/* Bio */}
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.5, maxWidth: '640px', marginBottom: '1rem' }}>
              {profileData?.bio || 'No biography provided yet.'}
            </p>

            {/* Location & External Social Links */}
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', paddingTop: '0.5rem' }}>
              {profileData?.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                  <MapPin size={14} style={{ color: 'var(--coral)' }} />
                  {profileData.location}
                </span>
              )}

              {profileData?.website && (
                <a
                  href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--teal)', fontSize: '0.84rem', fontWeight: 600, textDecoration: 'none' }}
                >
                  <Globe size={14} /> Website <ExternalLink size={11} />
                </a>
              )}

              {profileData?.github_url && (
                <a
                  href={profileData.github_url.startsWith('http') ? profileData.github_url : `https://github.com/${profileData.github_url.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-primary)', fontSize: '0.84rem', fontWeight: 600, textDecoration: 'none' }}
                >
                  <Code2 size={14} /> GitHub <ExternalLink size={11} />
                </a>
              )}

              {profileData?.linkedin_url && (
                <a
                  href={profileData.linkedin_url.startsWith('http') ? profileData.linkedin_url : `https://linkedin.com/in/${profileData.linkedin_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--periwinkle)', fontSize: '0.84rem', fontWeight: 600, textDecoration: 'none' }}
                >
                  <Link2 size={14} /> LinkedIn <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>

          {/* Reputation Stats Box */}
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: 'var(--bg-cream)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              minWidth: '180px',
              textAlign: 'center'
            }}
          >
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.25rem' }}>
              REPUTATION SCORE
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              <CountUp value={reputationScore} />
            </div>
            <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              {reviewsCount} reviews • {projectsCount} projects
            </div>
          </div>
        </div>

        {/* Badges Ribbon */}
        <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '1.5rem', marginTop: '2rem' }}>
          <div className="editorial-mono-label" style={{ marginBottom: '1rem' }}>
            EARNED BADGES & CREDENTIALS
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {badges.map((b, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  backgroundColor: b.unlocked ? 'var(--bg-ivory)' : 'rgba(0, 0, 0, 0.02)',
                  border: '1px solid',
                  borderColor: b.unlocked ? 'var(--border-subtle)' : 'var(--border-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  opacity: b.unlocked ? 1 : 0.45
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: b.unlocked ? b.color : 'var(--border-medium)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {b.icon}
                </div>
                <div>
                  <strong style={{ fontSize: '0.88rem', display: 'block' }}>{b.title}</strong>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{b.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. EDIT FORM (ONLY DISPLAYED TO PROFILE OWNER) */}
      {isOwnProfile && isEditing && (
        <form onSubmit={handleSave} className="editorial-card" style={{ padding: '2.5rem', marginBottom: '2.5rem', borderLeft: '4px solid var(--coral)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem' }}>Edit Credentials & Public Profile</h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
            <div className="form-group">
              <label className="form-label">FULL NAME</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">USERNAME</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. karthick_innovator"
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
            <div className="form-group">
              <label className="form-label">HEADLINE / SPECIALTY</label>
              <input
                type="text"
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                placeholder="e.g. Distributed Systems Architect"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">ORGANIZATION / UNIVERSITY</label>
              <input
                type="text"
                value={organization}
                onChange={e => setOrganization(e.target.value)}
                placeholder="e.g. Stanford University / Tech Labs"
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
            <div className="form-group">
              <label className="form-label">LOCATION</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">WEBSITE URL</label>
              <input
                type="text"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://mywebsite.com"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">GITHUB USERNAME / URL</label>
              <input
                type="text"
                value={githubUrl}
                onChange={e => setGithubUrl(e.target.value)}
                placeholder="e.g. github.com/username"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">LINKEDIN URL</label>
              <input
                type="text"
                value={linkedinUrl}
                onChange={e => setLinkedinUrl(e.target.value)}
                placeholder="e.g. linkedin.com/in/username"
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
            <div className="form-group">
              <label className="form-label">AVATAR IMAGE URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">SKILLS & EXPERTISE (COMMA-SEPARATED)</label>
              <input
                type="text"
                value={skills}
                onChange={e => setSkills(e.target.value)}
                placeholder="e.g. AI, React, Distributed Systems"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">BIOGRAPHY</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell fellow innovators about your technical background and perspective..."
              className="form-textarea"
              rows={3}
            />
          </div>

          {/* Interests Selector */}
          <div style={{ marginBottom: '2rem' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '0.75rem' }}>
              SELECT CURIOSITY DISCIPLINES
            </label>
            <div className="filter-chip-group">
              {allCategories.map(cat => {
                const isSelected = interests.includes(cat.name) || interests.includes(cat.id) || interests.includes(cat.name.toUpperCase());
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleToggleInterest(cat.name)}
                    className={`filter-chip ${isSelected ? 'active' : ''}`}
                  >
                    {isSelected ? '✓ ' : '+ '}{cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-coral btn-lg"
              style={{ gap: '0.5rem' }}
            >
              <Save size={16} />
              {isSaving ? 'Saving Changes...' : 'Save Updated Credentials'}
            </button>
          </div>
        </form>
      )}

      {/* 3. REAL ACTIVITY STATS: REGISTERED SPECIMENS & REVIEWS GIVEN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Projects Created */}
        <div className="editorial-card" style={{ padding: '2rem' }}>
          <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.5rem' }}>
            REGISTERED SPECIMENS ({userProjects.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {userProjects.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', padding: '1rem 0' }}>
                {isOwnProfile ? "You haven't submitted any innovation specimens yet." : "This innovator has not submitted any innovation specimens yet."}
              </div>
            ) : (
              userProjects.slice(0, 6).map(i => (
                <div 
                  key={i.id} 
                  onClick={() => {
                    if (setSelectedInnoId) setSelectedInnoId(i.id);
                    if (setActiveTab) setActiveTab('detail');
                  }}
                  style={{ 
                    padding: '0.75rem 0', 
                    borderBottom: '1px solid var(--border-hairline)',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.94rem', color: 'var(--text-primary)' }}>{i.title}</strong>
                    <span className="category-tag tag-ink-ai" style={{ fontSize: '0.68rem' }}>
                      {i.category_name || 'Innovation'}
                    </span>
                  </div>
                  <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {i.valid_reviews_count || 0}/{i.validation_target || 10} Reviews • Status: {i.status || 'UNDER_VALIDATION'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reviews Given */}
        <div className="editorial-card" style={{ padding: '2rem' }}>
          <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '0.5rem' }}>
            VALIDATION CONTRIBUTIONS ({userReviews.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {userReviews.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', padding: '1rem 0' }}>
                {isOwnProfile ? "You haven't completed any peer reviews yet." : "This innovator has not submitted any public reviews yet."}
              </div>
            ) : (
              userReviews.slice(0, 6).map(r => (
                <div key={r.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-hairline)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9rem' }}>
                      {r.projects?.title ? `Review: ${r.projects.title}` : `Review #${(r.id || '').slice(-4)}`}
                    </strong>
                    <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--coral)' }}>
                      {r.rating || 5}/5 ★
                    </span>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.overall_feedback || r.suggestion || r.content || 'Structured critique recorded in the ledger.'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
