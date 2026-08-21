import React from 'react';
import { Compass, FileQuestion, Layers } from 'lucide-react';

/**
 * UnstampedEmptyState — Tactile Empty State Component (Section 5)
 * Displays a faint "unstamped" specimen ledger card illustration with interface-voice copy.
 */
export default function UnstampedEmptyState({
  title = 'No Specimen Records Found',
  description = 'No innovation specimens match your current filter criteria or review queue state.',
  actionLabel,
  onAction,
  icon: Icon = FileQuestion
}) {
  return (
    <div
      className="ledger-card card-paper-white"
      style={{
        padding: '3.5rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        border: '1.5px dashed rgba(28, 43, 69, 0.22)',
        background: 'var(--ledger-paper-card)'
      }}
    >
      {/* Faint Unstamped Watermark */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-12deg)',
          opacity: 0.04,
          fontFamily: 'var(--font-mono)',
          fontSize: '6.5rem',
          fontWeight: 900,
          color: 'var(--ink-navy)',
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          letterSpacing: '0.1em'
        }}
      >
        UNSTAMPED
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px', margin: '0 auto' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--ledger-paper-raised)',
            border: '1px solid rgba(28, 43, 69, 0.15)',
            boxShadow: '0 2px 6px rgba(28, 43, 69, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto'
          }}
        >
          <Icon size={26} color="var(--slate)" />
        </div>

        <div className="label-mono" style={{ color: 'var(--slate)', marginBottom: '0.35rem' }}>
          SPECIMEN LEDGER STATE: EMPTY
        </div>

        <h3 style={{ fontSize: '1.35rem', color: 'var(--ink-navy)', marginBottom: '0.5rem' }}>
          {title}
        </h3>

        <p style={{ color: 'var(--slate)', fontSize: '0.92rem', lineHeight: '1.5', marginBottom: actionLabel ? '1.5rem' : '0' }}>
          {description}
        </p>

        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="btn btn-secondary btn-stamp-action"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
