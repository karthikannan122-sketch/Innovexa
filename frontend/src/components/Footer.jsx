import React from 'react';
import { StorageService } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { RotateCcw, ArrowUpRight } from 'lucide-react';

export default function Footer({ setActiveTab }) {
  const { showToast } = useAuth();

  const handleResetSeedData = () => {
    if (window.confirm('Reset all demo innovations, reviews, and test personas to initial seed state?')) {
      StorageService.resetSeedData();
      showToast('Database reset to clean editorial seed records.', 'success');
      if (setActiveTab) setActiveTab('explore');
    }
  };

  return (
    <footer style={{
      marginTop: 'auto',
      backgroundColor: 'var(--bg-dark)',
      color: 'var(--text-inverse)',
      borderTop: '1px solid var(--border-dark)',
      padding: '3.5rem 0 2.5rem 0',
      fontSize: '0.9rem'
    }}>
      <div className="workspace-container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '3rem',
          marginBottom: '3rem'
        }}>
          {/* Col 1: Brand & Tagline */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', marginBottom: '1rem' }}>
              <span style={{ fontFamily: 'var(--font-editorial)', fontWeight: 800, fontSize: '1.4rem', color: '#FFFFFF' }}>
                ✦ INNOVEXA
              </span>
              <span className="editorial-mono-label" style={{ fontSize: '0.66rem', color: 'var(--coral)' }}>
                NETWORK
              </span>
            </div>
            <p style={{ color: 'var(--text-inverse-muted)', fontSize: '0.92rem', lineHeight: '1.55' }}>
              <strong>Ideas were never meant to stay still.</strong>
              <br />
              An editorial innovation platform for structured early-stage discovery, peer review collision, and evidence-based refinement.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '1rem' }}>
              EDITORIAL DIRECTORY
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.88rem' }}>
              <button onClick={() => setActiveTab('explore')} className="btn btn-ghost btn-sm" style={{ color: 'var(--text-inverse-muted)', justifyContent: 'flex-start', padding: 0 }}>
                Magazine Directory →
              </button>
              <button onClick={() => setActiveTab('submit')} className="btn btn-ghost btn-sm" style={{ color: 'var(--text-inverse-muted)', justifyContent: 'flex-start', padding: 0 }}>
                Creative Studio →
              </button>
              <button onClick={() => setActiveTab('queue')} className="btn btn-ghost btn-sm" style={{ color: 'var(--text-inverse-muted)', justifyContent: 'flex-start', padding: 0 }}>
                Review Desk →
              </button>
            </div>
          </div>

          {/* Col 3: Principles */}
          <div>
            <div className="editorial-mono-label" style={{ color: 'var(--periwinkle)', marginBottom: '1rem' }}>
              CORE PILLARS
            </div>
            <ul style={{ listStyle: 'none', fontSize: '0.84rem', color: 'var(--text-inverse-muted)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <li>✦ High-Fashion Editorial Typography</li>
              <li>✦ Anti-Spam Reading & Depth Gates</li>
              <li>✦ Algorithmic Domain Review Matching</li>
              <li>✦ Real-time 3D Innovation Core Engine</li>
            </ul>
          </div>

          {/* Col 4: Telemetry Reset */}
          <div>
            <div className="editorial-mono-label" style={{ color: 'var(--green)', marginBottom: '1rem' }}>
              DEMONSTRATION CONTROLS
            </div>
            <button
              onClick={handleResetSeedData}
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--coral)', borderColor: 'var(--border-dark)', backgroundColor: 'var(--bg-dark-secondary)' }}
            >
              <RotateCcw size={13} /> Reset Seed Data
            </button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-dark)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-inverse-muted)' }}>
          <div className="mono">INNOVEXA • THE LIVING INNOVATION ECOSYSTEM</div>
          <div className="mono">WARM IVORY & DEEP CHARCOAL MASTER THEME</div>
        </div>
      </div>
    </footer>
  );
}
