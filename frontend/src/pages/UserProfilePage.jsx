import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { CATEGORY_INKS, BRAND_COLORS } from '../utils/categoryColors';
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
  Building
} from 'lucide-react';

/**
 * UserProfilePage — Editorial Validator Credentials & Reputation Desk
 */
export default function UserProfilePage() {
  const { currentUser, updateUserProfile, showToast } = useAuth();

  const allCategories = StorageService.getCategories();
  const [name, setName] = useState(currentUser?.name || '');
  const [headline, setHeadline] = useState(currentUser?.headline || '');
  const [organization, setOrganization] = useState(currentUser?.organization || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [interests, setInterests] = useState(currentUser?.interests || ['AI & MACHINE LEARNING', 'WEB TECHNOLOGY']);
  const [skills, setSkills] = useState(currentUser?.skills?.join(', ') || '');

  const handleToggleInterest = (catName) => {
    if (interests.includes(catName)) {
      setInterests(interests.filter(i => i !== catName));
    } else {
      setInterests([...interests, catName]);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const skillsArr = skills.split(',').map(s => s.trim()).filter(Boolean);
    updateUserProfile({
      name: name.trim(),
      headline: headline.trim(),
      organization: organization.trim(),
      bio: bio.trim(),
      interests,
      skills: skillsArr
    });
    showToast('Validator credentials updated successfully!', 'success');
  };

  const myReviews = StorageService.getReviews().filter(r => r.reviewer_id === currentUser?.id);
  const myInnovations = StorageService.getInnovations().filter(i => i.user_id === currentUser?.id);

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
      desc: 'Submitted an innovation specimen',
      unlocked: myInnovations.length > 0 
    },
    { 
      title: 'Verified Validator', 
      icon: '✓', 
      color: BRAND_COLORS.teal, 
      desc: 'Completed a structured peer review',
      unlocked: myReviews.length > 0 
    },
    { 
      title: 'Consensus Architect', 
      icon: '★', 
      color: BRAND_COLORS.periwinkle, 
      desc: 'Earned over 50 reputation credits',
      unlocked: (currentUser?.credits || 0) >= 50 
    }
  ];

  return (
    <div className="workspace-container" style={{ maxWidth: '1080px' }}>
      {/* Header Statement */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.45rem' }}>
          01 / VALIDATOR DOSSIER
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.35rem' }}>
          Validator Credentials & Profile
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem' }}>
          Manage your reputation standing, technical fluency matrix, and peer validation credentials.
        </p>
      </div>

      {/* 1. EDITORIAL PROFILE HERO CARD */}
      <div className="editorial-card" style={{ padding: '2.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={currentUser?.name}
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid var(--border-medium)',
              boxShadow: 'var(--shadow-md)'
            }}
          />

          <div style={{ flex: '1 1 400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '2rem' }}>{currentUser?.name || 'Innovator'}</h2>
              <span className="category-tag tag-ink-ai">
                TIER: {currentUser?.reputation_tier || 'NEW INNOVATOR'}
              </span>
              {currentUser?.organization && (
                <span className="category-tag tag-ink-environment">
                  {currentUser.organization}
                </span>
              )}
            </div>

            <div style={{ color: 'var(--coral)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.65rem' }}>
              {currentUser?.headline || 'Innovator & Peer Validator'}
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.5, maxWidth: '640px' }}>
              {currentUser?.bio || 'No biography provided yet. Add your story and background below.'}
            </p>
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
              <CountUp value={currentUser?.credits || 0} />
            </div>
            <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              {myReviews.length} reviews • {myInnovations.length} projects
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

      {/* 2. CREDENTIALS & FLUENCY EDIT FORM */}
      <form onSubmit={handleSave} className="editorial-card" style={{ padding: '2.5rem', marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Edit Credentials & Domain Fluency</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
          <div className="form-group">
            <label className="form-label">FULL NAME</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="form-input"
              required
            />
          </div>

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
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
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

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-coral btn-lg" style={{ gap: '0.5rem' }}>
            <Save size={16} /> Save Updated Credentials
          </button>
        </div>
      </form>

      {/* 3. REAL ACTIVITY STATS: PROJECTS & REVIEWS GIVEN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Projects Created */}
        <div className="editorial-card" style={{ padding: '2rem' }}>
          <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.5rem' }}>
            MY REGISTERED SPECIMENS ({myInnovations.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {myInnovations.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', padding: '1rem 0' }}>
                You haven't submitted any innovation specimens yet.
              </div>
            ) : (
              myInnovations.slice(0, 4).map(i => (
                <div key={i.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-hairline)' }}>
                  <strong style={{ fontSize: '0.94rem' }}>{i.title}</strong>
                  <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {i.valid_reviews_count || 0}/{i.validation_target || 10} Reviews • Status: {i.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reviews Given */}
        <div className="editorial-card" style={{ padding: '2rem' }}>
          <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '0.5rem' }}>
            REVIEWS LOGGED ({myReviews.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {myReviews.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', padding: '1rem 0' }}>
                You haven't completed any peer reviews yet.
              </div>
            ) : (
              myReviews.slice(0, 4).map(r => (
                <div key={r.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-hairline)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '0.9rem' }}>Review #{r.id.slice(-4)}</strong>
                    <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--coral)' }}>{r.rating || 5}/5 ★</span>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.improvement_suggestions || r.liked_features}
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
