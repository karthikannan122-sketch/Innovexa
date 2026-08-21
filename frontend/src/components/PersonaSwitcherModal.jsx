import React from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { Users, Check, X, Sparkles, ShieldCheck } from 'lucide-react';

/**
 * PersonaSwitcherModal — Quick Persona Selector for Peer Testing
 */
export default function PersonaSwitcherModal() {
  const { isPersonaModalOpen, setIsPersonaModalOpen, currentUser, switchUser, showToast } = useAuth();
  const users = StorageService.getUsers();

  if (!isPersonaModalOpen) return null;

  const handleSelectUser = (user) => {
    switchUser(user.id);
    setIsPersonaModalOpen(false);
    showToast(`Switched active persona to ${user.name}.`, 'success');
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsPersonaModalOpen(false)}>
      <div
        className="command-dialog"
        onClick={e => e.stopPropagation()}
        style={{ padding: '2.5rem', maxWidth: '580px', borderRadius: 'var(--radius-lg)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.25rem' }}>
              SIMULATION / TESTING DESK
            </div>
            <h2 style={{ fontSize: '1.65rem' }}>Select User Persona</h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setIsPersonaModalOpen(false)}>✕</button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.75rem' }}>
          Switch between founder creators, domain reviewers, and platform governance accounts to test multi-user peer validation.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '360px', overflowY: 'auto' }}>
          {users.map(u => {
            const isSelected = u.id === currentUser?.id;
            return (
              <div
                key={u.id}
                onClick={() => handleSelectUser(u)}
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isSelected ? 'var(--bg-cream)' : 'var(--bg-white)',
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--coral)' : 'var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <img
                    src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name || 'User')}&backgroundColor=20212a,e76f82,7186d8`}
                    alt={u.name}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.94rem' }}>{u.name}</strong>
                      <span className="editorial-mono-label" style={{ fontSize: '0.66rem', color: 'var(--coral)' }}>
                        {Array.isArray(u.role) ? u.role[0] : (u.role || 'Creator')}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {u.headline || u.email}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--coral)' }}>
                    {u.credits || 0} pts
                  </span>
                  {isSelected && <Check size={16} color="var(--coral)" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Add User B Reviewer Persona */}
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-hairline)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => {
              const peerUser = StorageService.upsertUser({
                id: `usr_validator_${Date.now().toString(36)}`,
                name: 'Sarah Reviewer',
                email: 'sarah.validator@innovexa.io',
                bio: 'Senior Systems Architect & Peer Validator evaluating early-stage technical thesis.',
                organization: 'Distributed AI Lab',
                role: ['I VALIDATE INNOVATIONS'],
                interests: ['AI & MACHINE LEARNING', 'WEB TECHNOLOGY', 'PRODUCTIVITY'],
                credits: 50,
                reputation_score: 50,
                reputation_tier: 'TRUSTED REVIEWER',
                onboarding_completed: true
              });
              switchUser(peerUser.id);
              setIsPersonaModalOpen(false);
              showToast('Created and switched to Sarah Reviewer!', 'success');
            }}
            className="btn btn-secondary btn-sm"
            style={{ gap: '0.45rem' }}
          >
            <Sparkles size={13} color="var(--periwinkle)" /> + Add Peer Validator (Sarah)
          </button>

          <button
            onClick={() => setIsPersonaModalOpen(false)}
            className="btn btn-ghost btn-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
