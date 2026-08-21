import React from 'react';

/**
 * TransitionCurtain — Signature Cinematic Page Transition (Section 5 & 8)
 * 600–900ms Convergence & Gradient Flash (Purple → Blue → Cyan)
 */
export default function TransitionCurtain({ isActive = false, title = 'ENTERING THE NETWORK...' }) {
  if (!isActive) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 50%, #06B6D4 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        animation: 'transitionSweep 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      <div style={{ textAlign: 'center', transform: 'scale(1.05)', animation: 'modalPop 0.4s ease' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          borderTopColor: '#FFFFFF',
          margin: '0 auto 1.5rem auto',
          animation: 'spin 0.8s linear infinite'
        }} />

        <div className="editorial-index" style={{ color: 'rgba(255, 255, 255, 0.85)', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
          INNOVEXA VALIDATION NETWORK
        </div>

        <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          {title}
        </h2>
      </div>

      <style>{`
        @keyframes transitionSweep {
          0% { opacity: 0; transform: scale(0.96); }
          30% { opacity: 1; transform: scale(1); }
          85% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.04); pointer-events: none; }
        }
      `}</style>
    </div>
  );
}
