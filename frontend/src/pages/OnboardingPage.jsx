import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { ArrowRight, ArrowUpRight, Check, Sparkles, User, ShieldCheck } from 'lucide-react';

/**
 * OnboardingPage — 3-Step Personalized Onboarding Experience
 * Step 1: WHO ARE YOU? (Roles)
 * Step 2: WHAT MOVES YOUR CURIOSITY? (Interests)
 * Step 3: MAKE IT YOURS. (Profile, Bio, Skills, Organization, Preferred Domains)
 */
export default function OnboardingPage({ setActiveTab }) {
  const { currentUser, updateUserProfile, showToast } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Roles (One or more)
  const roleOptions = [
    { id: 'I CREATE IDEAS', label: 'I CREATE IDEAS', desc: 'Share raw sparks and conceptual theses' },
    { id: 'I BUILD PRODUCTS', label: 'I BUILD PRODUCTS', desc: 'Architect technical MVPs and software systems' },
    { id: 'I EXPLORE STARTUPS', label: 'I EXPLORE STARTUPS', desc: 'Discover early-stage venture prototypes' },
    { id: 'I REVIEW PROJECTS', label: 'I REVIEW PROJECTS', desc: 'Provide rigorous rubric-driven peer feedback' },
    { id: 'I MENTOR / GUIDE', label: 'I MENTOR / GUIDE', desc: 'Offer architectural and domain mentorship' }
  ];
  const [selectedRoles, setSelectedRoles] = useState(currentUser?.role && Array.isArray(currentUser.role) ? currentUser.role : ['I CREATE IDEAS']);

  // Step 2: Interests
  const interestOptions = [
    'AI & MACHINE LEARNING',
    'WEB TECHNOLOGY',
    'MOBILE APPLICATIONS',
    'HEALTHCARE',
    'EDUCATION',
    'SUSTAINABILITY',
    'FINTECH',
    'CYBERSECURITY',
    'PRODUCTIVITY',
    'DESIGN',
    'SOCIAL IMPACT',
    'STARTUPS',
    'OTHER'
  ];
  const [selectedInterests, setSelectedInterests] = useState(currentUser?.interests || ['AI & MACHINE LEARNING', 'WEB TECHNOLOGY']);

  // Step 3: Profile Details
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [organization, setOrganization] = useState(currentUser?.organization || '');
  const [skills, setSkills] = useState(currentUser?.skills?.join(', ') || 'System Design, Architecture');
  const [preferredDomains, setPreferredDomains] = useState(currentUser?.preferred_domains?.join(', ') || 'Artificial Intelligence, Distributed Systems');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar || '');

  const toggleRole = (roleId) => {
    if (selectedRoles.includes(roleId)) {
      if (selectedRoles.length > 1) {
        setSelectedRoles(selectedRoles.filter(r => r !== roleId));
      }
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter(i => i !== interest));
      }
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleStep1Next = () => {
    if (selectedRoles.length === 0) {
      showToast('Please select at least one role perspective.', 'warning');
      return;
    }
    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    if (selectedInterests.length === 0) {
      showToast('Please select at least one interest discipline.', 'warning');
      return;
    }
    setCurrentStep(3);
  };

  const handleCompleteOnboarding = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
    const domainsArray = preferredDomains.split(',').map(d => d.trim()).filter(Boolean);

    try {
      await updateUserProfile({
        role: selectedRoles,
        interests: selectedInterests,
        bio: bio.trim() || 'Innovator and peer validator in the INNOVEXA ecosystem.',
        organization: organization.trim(),
        skills: skillsArray,
        preferred_domains: domainsArray,
        avatar: avatarUrl || currentUser?.avatar || '',
        onboarding_completed: true
      });

      window.dispatchEvent(new CustomEvent('innovexa:datachange'));
      showToast('Your workspace has been personalized!', 'success');
      setActiveTab('dashboard');
    } catch (err) {
      console.warn('Error completing onboarding profile:', err);
      setActiveTab('dashboard');
    }
  };

  return (
    <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-ivory)', padding: '3.5rem 0' }}>
      <div className="workspace-container" style={{ maxWidth: '980px' }}>
        {/* Step Progress Track */}
        <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="editorial-mono-label" style={{ color: 'var(--coral)' }}>
            ONBOARDING / STEP 0{currentStep} OF 03
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[1, 2, 3].map(step => (
              <div
                key={step}
                style={{
                  width: '36px',
                  height: '4px',
                  borderRadius: '2px',
                  backgroundColor: step <= currentStep ? 'var(--coral)' : 'var(--border-medium)',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* ================= STEP 01 / WHO ARE YOU? ================= */}
        {currentStep === 1 && (
          <div className="editorial-card" style={{ padding: '3.5rem', borderLeft: '4px solid var(--coral)' }}>
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '1rem' }}>
              STEP 01 / WHO ARE YOU?
            </div>

            {/* Exact Required Heading */}
            <div style={{ lineHeight: 0.98, marginBottom: '2rem' }}>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.5rem, 5vw, 4.2rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                EVERY IDEA
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.5rem, 5vw, 4.2rem)', fontWeight: 800, color: 'var(--coral)', fontStyle: 'italic', margin: '0.2rem 0' }}>
                NEEDS A
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.5rem, 5vw, 4.2rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                PERSPECTIVE.
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '2.5rem' }}>
              Select one or more roles that define how you want to participate in the network.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
              {roleOptions.map(role => {
                const isSelected = selectedRoles.includes(role.id);
                return (
                  <div
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    style={{
                      padding: '1.25rem 1.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'var(--bg-cream)' : 'var(--bg-white)',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--coral)' : 'var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.85rem'
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        backgroundColor: isSelected ? 'var(--coral)' : 'transparent',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--coral)' : 'var(--border-medium)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        marginTop: '0.15rem'
                      }}
                    >
                      {isSelected && <Check size={14} />}
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.95rem', display: 'block', color: 'var(--text-primary)' }}>
                        {role.label}
                      </strong>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {role.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleStep1Next}
                className="btn btn-coral btn-lg"
                style={{ gap: '0.5rem' }}
              >
                NEXT: SELECT INTERESTS <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 02 / INTERESTS ================= */}
        {currentStep === 2 && (
          <div className="editorial-card" style={{ padding: '3.5rem', borderLeft: '4px solid var(--periwinkle)' }}>
            <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '1rem' }}>
              STEP 02 / INTERESTS
            </div>

            {/* Exact Required Heading */}
            <div style={{ lineHeight: 0.98, marginBottom: '2rem' }}>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.5rem, 5vw, 4.2rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                WHAT
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.5rem, 5vw, 4.2rem)', fontWeight: 800, color: 'var(--periwinkle)', fontStyle: 'italic', margin: '0.2rem 0' }}>
                MOVES
              </div>
              <div className="editorial-sans-bold" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', color: 'var(--text-secondary)' }}>
                YOUR
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.5rem, 5vw, 4.2rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                CURIOSITY?
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '2rem' }}>
              Select the disciplines and industries you are passionate about. These will power your project recommendations, review matching, and discovery.
            </p>

            <div className="filter-chip-group" style={{ marginBottom: '3rem' }}>
              {interestOptions.map(interest => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`filter-chip ${isSelected ? 'active' : ''}`}
                    style={{ fontSize: '0.9rem', padding: '0.65rem 1.15rem' }}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {interest}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentStep(1)}
                className="btn btn-secondary"
              >
                Back
              </button>
              <button
                onClick={handleStep2Next}
                className="btn btn-coral btn-lg"
                style={{ gap: '0.5rem' }}
              >
                NEXT: COMPLETE PROFILE <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 03 / PROFILE ================= */}
        {currentStep === 3 && (
          <div className="editorial-card" style={{ padding: '3.5rem', borderLeft: '4px solid var(--green)' }}>
            <div className="editorial-mono-label" style={{ color: 'var(--green)', marginBottom: '1rem' }}>
              STEP 03 / PROFILE
            </div>

            {/* Exact Required Heading */}
            <div style={{ lineHeight: 0.98, marginBottom: '2rem' }}>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.8rem, 5.5vw, 4.6rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                MAKE IT
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.8rem, 5.5vw, 4.6rem)', fontWeight: 800, color: 'var(--green)', fontStyle: 'italic', margin: '0.2rem 0' }}>
                YOURS.
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '2.5rem' }}>
              Add details to your validator dossier so peer creators understand your background and expertise.
            </p>

            <form onSubmit={handleCompleteOnboarding} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Short bio */}
              <div className="form-group">
                <label className="form-label">SHORT BIO</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="e.g. AI researcher focused on autonomous agents and human-in-the-loop interfaces..."
                  className="form-textarea"
                  rows={3}
                />
              </div>

              {/* College / Organization */}
              <div className="form-group">
                <label className="form-label">COLLEGE / ORGANIZATION (OPTIONAL)</label>
                <input
                  type="text"
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                  placeholder="e.g. Stanford University / DeepTech Labs"
                  className="form-input"
                />
              </div>

              {/* Skills or expertise */}
              <div className="form-group">
                <label className="form-label">SKILLS OR EXPERTISE (COMMA-SEPARATED)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={e => setSkills(e.target.value)}
                  placeholder="e.g. Distributed Systems, Product Strategy, PyTorch, UX Design"
                  className="form-input"
                />
              </div>

              {/* Preferred domains */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">PREFERRED DOMAINS</label>
                <input
                  type="text"
                  value={preferredDomains}
                  onChange={e => setPreferredDomains(e.target.value)}
                  placeholder="e.g. Clean Energy, LLM Infra, FinTech Ledgers"
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="btn btn-secondary"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-coral btn-lg"
                  style={{ gap: '0.5rem', padding: '1rem 2.5rem' }}
                >
                  ENTER INNOVEXA ↗
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
