import React from 'react';

/**
 * TransitionCurtain — Signature Editorial Page Transition
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
        backgroundColor: '#20212A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FCFBF8',
        animation: 'transitionSweep 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      <div style={{ textAlign: 'center', transform: 'scale(1.02)' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          border: '2px solid rgba(255, 255, 255, 0.15)',
          borderTopColor: '#E76F82',
          margin: '0 auto 1.25rem auto',
          animation: 'spin 0.8s linear infinite'
        }} />

        <div className="editorial-mono-label" style={{ color: '#E76F82', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
          ✦ INNOVEXA NETWORK
        </div>

        <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.85rem', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          {title}
        </h2>
      </div>

      <style>{`
        @keyframes transitionSweep {
          0% { opacity: 0; transform: scale(0.98); }
          25% { opacity: 1; transform: scale(1); }
          75% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.02); pointer-events: none; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
