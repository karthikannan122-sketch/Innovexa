import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
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
  Trash2
} from 'lucide-react';

/**
 * SettingsPage — Comprehensive Platform Settings
 * Sections: ACCOUNT | PROFILE | NOTIFICATIONS | PRIVACY | APPEARANCE | SECURITY
 */
export default function SettingsPage() {
  const { currentUser, updateUserProfile, apiKey, setApiKey, showToast } = useAuth();
  const [activeSection, setActiveSection] = useState('ACCOUNT');

  // Account State
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Profile State
  const [headline, setHeadline] = useState(currentUser?.headline || '');
  const [bio, setBio] = useState(currentUser?.bio || 'Passionate builder & validator in the innovation network.');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');

  // Notifications State
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [reviewAlerts, setReviewAlerts] = useState(true);
  const [milestoneNotifs, setMilestoneNotifs] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // Privacy State
  const [publicProfile, setPublicProfile] = useState(true);
  const [anonymousReviews, setAnonymousReviews] = useState(false);
  const [showReputation, setShowReputation] = useState(true);

  // Appearance State
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Security & API State
  const [geminiKeyInput, setGeminiKeyInput] = useState(apiKey || '');

  const handleSaveAccount = (e) => {
    e.preventDefault();
    updateUserProfile({ name, email });
    showToast('Account details updated.', 'success');
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateUserProfile({ headline, bio, avatar });
    showToast('Profile configuration saved.', 'success');
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    showToast('Notification preferences updated.', 'success');
  };

  const handleSavePrivacy = (e) => {
    e.preventDefault();
    showToast('Privacy rules applied.', 'success');
  };

  const handleSaveSecurity = (e) => {
    e.preventDefault();
    if (geminiKeyInput.trim() !== apiKey) {
      setApiKey(geminiKeyInput.trim());
      StorageService.setGeminiApiKey(geminiKeyInput.trim());
    }
    showToast('Security & API settings updated.', 'success');
  };

  const sections = [
    { id: 'ACCOUNT', label: 'Account', icon: <User size={16} /> },
    { id: 'PROFILE', label: 'Profile', icon: <Globe size={16} /> },
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
          Manage your account credentials, validator privacy, notification channels, and AI intelligence engines.
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
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Account Details</h2>

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
                />
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
                <button type="submit" className="btn btn-primary">
                  <Save size={15} /> Save Account
                </button>
              </div>
            </form>
          )}

          {/* SECTION: PROFILE */}
          {activeSection === 'PROFILE' && (
            <form onSubmit={handleSaveProfile}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Public Profile</h2>

              <div className="form-group">
                <label className="form-label">Headline / Title</label>
                <input
                  type="text"
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  placeholder="e.g. AI Systems Architect & Founder"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Short Biography</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="form-textarea"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Avatar Image URL</label>
                <input
                  type="text"
                  value={avatar}
                  onChange={e => setAvatar(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">
                  <Save size={15} /> Save Profile
                </button>
              </div>
            </form>
          )}

          {/* SECTION: NOTIFICATIONS */}
          {activeSection === 'NOTIFICATIONS' && (
            <form onSubmit={handleSaveNotifications}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Notification Preferences</h2>

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
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">
                  <Save size={15} /> Save Preferences
                </button>
              </div>
            </form>
          )}

          {/* SECTION: PRIVACY */}
          {activeSection === 'PRIVACY' && (
            <form onSubmit={handleSavePrivacy}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Privacy & Reputation</h2>

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
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Allow other founders and reviewers to view your validator portfolio</span>
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
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">
                  <Save size={15} /> Apply Privacy
                </button>
              </div>
            </form>
          )}

          {/* SECTION: APPEARANCE */}
          {activeSection === 'APPEARANCE' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Appearance & Motion</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={reducedMotion}
                    onChange={e => {
                      setReducedMotion(e.target.checked);
                      showToast(`Reduced motion ${e.target.checked ? 'enabled' : 'disabled'}.`, 'info');
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
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Security & AI Engine</h2>

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
                <button type="submit" className="btn btn-primary">
                  <Save size={15} /> Save Security Settings
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
