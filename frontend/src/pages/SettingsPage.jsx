import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { 
  User, 
  Bell, 
  Shield, 
  Sliders, 
  Key, 
  Lock, 
  Save, 
  Check, 
  Eye, 
  RotateCcw,
  Sparkles,
  Smartphone,
  Globe,
  Trash2,
  Calendar,
  MapPin,
  ShieldCheck,
  LockKeyhole
} from 'lucide-react';

/**
 * SettingsPage — Comprehensive Platform Settings & Private Data Desk
 * Sections: ACCOUNT | PRIVATE DATA | PROFILE | NOTIFICATIONS | PRIVACY | APPEARANCE | SECURITY
 */
export default function SettingsPage() {
  const { currentUser, updateUserProfile, apiKey, setApiKey, showToast } = useAuth();
  const [activeSection, setActiveSection] = useState('ACCOUNT');
  const [isLoadingPrivate, setIsLoadingPrivate] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Account State (public.profiles / auth)
  const [name, setName] = useState(currentUser?.name || currentUser?.full_name || '');
  const [email, setEmail] = useState(currentUser?.email || '');

  // Profile State (public.profiles)
  const [headline, setHeadline] = useState(currentUser?.headline || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar_url || currentUser?.avatar || '');
  const [location, setLocation] = useState(currentUser?.location || '');
  const [website, setWebsite] = useState(currentUser?.website || '');
  const [githubUrl, setGithubUrl] = useState(currentUser?.github_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(currentUser?.linkedin_url || '');

  // Private User Data State (public.user_private_data)
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [onboardingCompleted, setOnboardingCompleted] = useState(Boolean(currentUser?.onboarding_completed));

  // Preferences State (inside public.user_private_data)
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [reviewAlerts, setReviewAlerts] = useState(true);
  const [milestoneNotifs, setMilestoneNotifs] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // Privacy State (inside public.user_private_data)
  const [publicProfile, setPublicProfile] = useState(true);
  const [anonymousReviews, setAnonymousReviews] = useState(false);
  const [showReputation, setShowReputation] = useState(true);

  // Appearance State
  const [reducedMotion, setReducedMotion] = useState(false);

  // Security & API State
  const [geminiKeyInput, setGeminiKeyInput] = useState(apiKey || '');

  // Load private user data from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadPrivateData() {
      if (!currentUser?.id) {
        setIsLoadingPrivate(false);
        return;
      }
      setIsLoadingPrivate(true);
      try {
        const { data: privData } = await SupabaseService.getUserPrivateData(currentUser.id);
        if (isMounted && privData) {
          if (privData.phone !== undefined) setPhone(privData.phone || '');
          if (privData.date_of_birth !== undefined) setDateOfBirth(privData.date_of_birth || '');
          if (privData.address !== undefined) setAddress(privData.address || '');
          if (privData.onboarding_completed !== undefined) setOnboardingCompleted(Boolean(privData.onboarding_completed));

          // Notification Preferences
          const notifs = privData.notification_preferences || {};
          if (notifs.email !== undefined) setEmailNotifs(Boolean(notifs.email));
          if (notifs.review_alerts !== undefined) setReviewAlerts(Boolean(notifs.review_alerts));
          if (notifs.milestone_notifications !== undefined) setMilestoneNotifs(Boolean(notifs.milestone_notifications));
          if (notifs.weekly_digest !== undefined) setWeeklyDigest(Boolean(notifs.weekly_digest));

          // Privacy & Other Settings
          const settings = privData.settings || {};
          if (settings.public_profile !== undefined) setPublicProfile(Boolean(settings.public_profile));
          if (settings.anonymous_reviews !== undefined) setAnonymousReviews(Boolean(settings.anonymous_reviews));
          if (settings.show_reputation !== undefined) setShowReputation(Boolean(settings.show_reputation));
          if (settings.reduced_motion !== undefined) setReducedMotion(Boolean(settings.reduced_motion));
        }
      } catch (err) {
        console.warn('[SettingsPage loadPrivateData exception]:', err);
      } finally {
        if (isMounted) setIsLoadingPrivate(false);
      }
    }

    loadPrivateData();
    return () => { isMounted = false; };
  }, [currentUser]);

  // Handle Save Account
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserProfile({ name: name.trim(), full_name: name.trim() });
      showToast('Account details updated in ledger.', 'success');
    } catch (err) {
      showToast('Error updating account.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Save Private User Data
  const handleSavePrivateData = async (e) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    setIsSaving(true);
    try {
      const privatePayload = {
        phone: phone.trim() || null,
        date_of_birth: dateOfBirth || null,
        address: address.trim() || null,
        onboarding_completed: onboardingCompleted
      };

      await SupabaseService.updateUserPrivateData(currentUser.id, privatePayload);
      await updateUserProfile({
        phone: phone.trim() || null,
        date_of_birth: dateOfBirth || null,
        address: address.trim() || null,
        onboarding_completed: onboardingCompleted
      });

      showToast('Private user data saved securely to user_private_data table.', 'success');
    } catch (err) {
      showToast('Error saving private data.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserProfile({ 
        headline: headline.trim(), 
        bio: bio.trim(), 
        avatar: avatar.trim(),
        avatar_url: avatar.trim(),
        location: location.trim(),
        website: website.trim(),
        github_url: githubUrl.trim(),
        linkedin_url: linkedinUrl.trim()
      });
      showToast('Public profile configuration saved to profiles table.', 'success');
    } catch (err) {
      showToast('Error saving profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Save Notifications Preferences
  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    setIsSaving(true);
    try {
      const notifPrefs = {
        email: emailNotifs,
        review_alerts: reviewAlerts,
        milestone_notifications: milestoneNotifs,
        weekly_digest: weeklyDigest
      };

      await SupabaseService.updateUserPrivateData(currentUser.id, {
        notification_preferences: notifPrefs,
        preferences: { notification_preferences: notifPrefs }
      });
      showToast('Notification preferences persisted to user_private_data.', 'success');
    } catch (err) {
      showToast('Error updating notification preferences.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Save Privacy
  const handleSavePrivacy = async (e) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    setIsSaving(true);
    try {
      const privacySettings = {
        public_profile: publicProfile,
        anonymous_reviews: anonymousReviews,
        show_reputation: showReputation
      };

      await SupabaseService.updateUserPrivateData(currentUser.id, {
        settings: privacySettings,
        preferences: { privacy: privacySettings }
      });
      showToast('Privacy rules applied and saved securely.', 'success');
    } catch (err) {
      showToast('Error applying privacy settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Save Security
  const handleSaveSecurity = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (geminiKeyInput.trim() !== apiKey) {
        setApiKey(geminiKeyInput.trim());
        StorageService.setGeminiApiKey(geminiKeyInput.trim());
      }
      if (currentUser?.id) {
        await SupabaseService.updateUserPrivateData(currentUser.id, {
          api_keys: { gemini: geminiKeyInput.trim() ? 'configured' : null }
        });
      }
      showToast('Security & AI settings updated.', 'success');
    } catch (err) {
      showToast('Error updating security settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: 'ACCOUNT', label: 'Account', icon: <User size={16} /> },
    { id: 'PRIVATE_DATA', label: 'Private Info', icon: <LockKeyhole size={16} /> },
    { id: 'PROFILE', label: 'Public Profile', icon: <Globe size={16} /> },
    { id: 'NOTIFICATIONS', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'PRIVACY', label: 'Privacy', icon: <Eye size={16} /> },
    { id: 'APPEARANCE', label: 'Appearance', icon: <Sliders size={16} /> },
    { id: 'SECURITY', label: 'Security & AI', icon: <Shield size={16} /> }
  ];

  return (
    <div className="workspace-container" style={{ maxWidth: '1080px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.45rem' }}>
          01 / SYSTEM CONFIGURATION
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.35rem' }}>
          Settings & Preferences
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem' }}>
          Manage your account credentials, encrypted private data, validator privacy, notification channels, and AI intelligence engines.
        </p>
      </div>

      {/* Main Grid: Left Nav + Right Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2.5rem', alignItems: 'flex-start' }}>
        {/* Navigation Sidebar */}
        <div
          className="editorial-card"
          style={{ padding: '0.75rem', backgroundColor: 'var(--bg-white)', borderRadius: 'var(--radius-md)' }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {sections.map(sec => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isActive ? 'var(--bg-cream)' : 'transparent',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--border-medium)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ color: isActive ? 'var(--coral)' : 'var(--text-secondary)' }}>{sec.icon}</span>
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Form Panel */}
        <div
          className="editorial-card"
          style={{ padding: '2.5rem', backgroundColor: 'var(--bg-white)', borderRadius: 'var(--radius-lg)' }}
        >
          {/* SECTION: ACCOUNT */}
          {activeSection === 'ACCOUNT' && (
            <form onSubmit={handleSaveAccount}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Account Details</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                Your foundational credentials in the INNOVEXA network.
              </p>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input"
                  required
                  disabled
                  style={{ backgroundColor: 'var(--bg-cream)', opacity: 0.85 }}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Email address is linked to your Supabase authentication account.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Current Role / Status</label>
                <input
                  type="text"
                  value={currentUser?.role || 'Creator & Validator'}
                  disabled
                  className="form-input"
                  style={{ backgroundColor: 'var(--bg-cream)', opacity: 0.8 }}
                />
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={isSaving} className="btn btn-primary">
                  <Save size={15} /> {isSaving ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          )}

          {/* SECTION: PRIVATE DATA (public.user_private_data) */}
          {activeSection === 'PRIVATE_DATA' && (
            <form onSubmit={handleSavePrivateData}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <LockKeyhole size={20} style={{ color: 'var(--coral)' }} /> Private User Data
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                    These fields are strictly stored in <code>public.user_private_data</code> with Row Level Security.
                  </p>
                </div>
                <span className="category-tag tag-ink-environment" style={{ fontSize: '0.72rem' }}>
                  🔒 OWNER ONLY ACCESS
                </span>
              </div>

              {/* Privacy Callout Banner */}
              <div style={{
                padding: '1rem 1.25rem',
                backgroundColor: 'rgba(231, 111, 130, 0.08)',
                borderLeft: '3px solid var(--coral)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.75rem',
                fontSize: '0.84rem',
                color: 'var(--text-primary)'
              }}>
                <strong>Privacy Guarantee:</strong> Other users, reviewers, and founders will <strong>never</strong> see your phone number, date of birth, physical address, or private preferences on public profile views.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">PHONE NUMBER (PRIVATE)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="form-input"
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Used solely for urgent system verification.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">DATE OF BIRTH (PRIVATE)</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                    className="form-input"
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Used for age and jurisdiction verification.
                  </span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label className="form-label">PHYSICAL ADDRESS / JURISDICTION (PRIVATE)</label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Street address, City, State/Province, Country, Postal Code"
                  className="form-textarea"
                  rows={3}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Never exposed publicly or included in public profile exports.
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={onboardingCompleted}
                    onChange={e => setOnboardingCompleted(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--coral)' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.92rem' }}>Onboarding Flow Completed</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Marks your initial orientation profile setup as finalized.
                    </span>
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={isSaving} className="btn btn-coral" style={{ gap: '0.45rem' }}>
                  <Save size={15} /> {isSaving ? 'Saving...' : 'Save Private Data'}
                </button>
              </div>
            </form>
          )}

          {/* SECTION: PROFILE */}
          {activeSection === 'PROFILE' && (
            <form onSubmit={handleSaveProfile}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Public Profile</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                Configure public validator dossier fields displayed to the INNOVEXA community.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Headline / Specialty</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={e => setHeadline(e.target.value)}
                    placeholder="e.g. AI Systems Architect & Founder"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Location (Public City / Region)</label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Short Biography</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="form-textarea"
                  rows={4}
                  placeholder="Share your perspective and technical domains..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Avatar Image URL</label>
                <input
                  type="text"
                  value={avatar}
                  onChange={e => setAvatar(e.target.value)}
                  placeholder="https://..."
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Website URL</label>
                  <input
                    type="text"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    placeholder="https://mywebsite.com"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">GitHub</label>
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={e => setGithubUrl(e.target.value)}
                    placeholder="e.g. username"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">LinkedIn</label>
                  <input
                    type="text"
                    value={linkedinUrl}
                    onChange={e => setLinkedinUrl(e.target.value)}
                    placeholder="e.g. username"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={isSaving} className="btn btn-primary">
                  <Save size={15} /> {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}

          {/* SECTION: NOTIFICATIONS */}
          {activeSection === 'NOTIFICATIONS' && (
            <form onSubmit={handleSaveNotifications}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Notification Preferences</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                Configure dispatch channels and alerts saved to your private preferences.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={emailNotifs}
                    onChange={e => setEmailNotifs(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--coral)' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.92rem' }}>Email Notifications</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Receive review updates and critique notifications via email</span>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={reviewAlerts}
                    onChange={e => setReviewAlerts(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--coral)' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.92rem' }}>Review Desk Queue Alerts</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Notify when a new matched innovation is ready for your feedback</span>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={milestoneNotifs}
                    onChange={e => setMilestoneNotifs(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--coral)' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.92rem' }}>Validation Milestones</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Notify when your projects reach 10 reviews or validation consensus</span>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={weeklyDigest}
                    onChange={e => setWeeklyDigest(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--coral)' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.92rem' }}>Weekly Digest</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Weekly summary of ecosystem activity and trending innovations</span>
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={isSaving} className="btn btn-primary">
                  <Save size={15} /> {isSaving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          )}

          {/* SECTION: PRIVACY */}
          {activeSection === 'PRIVACY' && (
            <form onSubmit={handleSavePrivacy}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Privacy & Reputation</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                Control your visibility across the network ledger.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={publicProfile}
                    onChange={e => setPublicProfile(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--coral)' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.92rem' }}>Public Discovery Profile</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Allow other founders and reviewers to view your public validator portfolio</span>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={anonymousReviews}
                    onChange={e => setAnonymousReviews(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--coral)' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.92rem' }}>Anonymous Peer Review Submissions</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Mask your name and show only your validator tier when critiquing</span>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showReputation}
                    onChange={e => setShowReputation(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--coral)' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.92rem' }}>Show Reputation Score</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Display your consensus points on your public dossier</span>
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={isSaving} className="btn btn-primary">
                  <Save size={15} /> {isSaving ? 'Applying...' : 'Apply Privacy Settings'}
                </button>
              </div>
            </form>
          )}

          {/* SECTION: APPEARANCE */}
          {activeSection === 'APPEARANCE' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Appearance & Motion</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                Customize interface responsiveness and visual rendering preferences.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={reducedMotion}
                    onChange={async e => {
                      const val = e.target.checked;
                      setReducedMotion(val);
                      if (currentUser?.id) {
                        await SupabaseService.updateUserPrivateData(currentUser.id, {
                          settings: { reduced_motion: val }
                        });
                      }
                      showToast(`Reduced motion ${val ? 'enabled' : 'disabled'}.`, 'info');
                    }}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--coral)' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.92rem' }}>Reduced Motion / 2D Visual Mode</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Use static geometric fallbacks instead of interactive WebGL 3D scenes</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* SECTION: SECURITY & AI */}
          {activeSection === 'SECURITY' && (
            <form onSubmit={handleSaveSecurity}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Security & AI Engine</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                Configure Gemini API keys and AI intelligence engines.
              </p>

              <div className="form-group">
                <label className="form-label">Google Gemini API Key</label>
                <input
                  type="password"
                  value={geminiKeyInput}
                  onChange={e => setGeminiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="form-input"
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Provide an API key for live Gemini 1.5 synthesis, or leave empty to use our local rule-based clustering engine.
                </span>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={isSaving} className="btn btn-primary">
                  <Save size={15} /> {isSaving ? 'Saving...' : 'Save Security Settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
