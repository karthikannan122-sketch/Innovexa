import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

/**
 * JourneyPipeline — Multi-Ink 6-Stage Innovation Lifecycle Pipeline
 * CREATE -> CONNECT -> VALIDATE -> LEARN -> IMPROVE -> LAUNCH
 */
export default function JourneyPipeline({ currentStage = 'VALIDATE', progressPercent = 50 }) {
  const stages = [
    { key: 'CREATE', label: 'Create', color: 'var(--ink-ai)', desc: 'Document Specimen' },
    { key: 'CONNECT', label: 'Connect', color: 'var(--ink-security)', desc: 'Match Reviewers' },
    { key: 'VALIDATE', label: 'Validate', color: 'var(--ink-devtools)', desc: 'Anti-Spam Peer Reviews' },
    { key: 'LEARN', label: 'Learn', color: 'var(--ink-edu)', desc: 'Dual-Engine Insights' },
    { key: 'IMPROVE', label: 'Improve', color: 'var(--ink-saas)', desc: 'Iterate Version' },
    { key: 'LAUNCH', label: 'Launch', color: 'var(--ink-fintech)', desc: 'Community Release' },
  ];

  const currentIdx = stages.findIndex(s => s.key === currentStage.toUpperCase());
  const activeIdx = currentIdx !== -1 ? currentIdx : 2;

  return (
    <div style={{ padding: '0.5rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        {stages.map((stage, idx) => {
          const isPassed = idx < activeIdx;
          const isCurrent = idx === activeIdx;

          return (
            <React.Fragment key={stage.key}>
              {/* Stage Node */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                zIndex: 2,
                position: 'relative'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: isPassed || isCurrent ? stage.color : 'var(--paper-raised)',
                  border: `2px solid ${isPassed || isCurrent ? stage.color : 'var(--border-paper)'}`,
                  color: isPassed || isCurrent ? '#FFFFFF' : 'var(--slate-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  boxShadow: isCurrent ? `0 0 12px ${stage.color}55` : 'none',
                  transition: 'all 0.2s ease'
                }}>
                  {isPassed ? <Check size={14} strokeWidth={3} /> : idx + 1}
                </div>

                <div style={{ marginTop: '0.35rem' }}>
                  <div style={{
                    fontSize: '0.78rem',
                    fontWeight: isCurrent ? 700 : 600,
                    color: isCurrent ? 'var(--ink-charcoal)' : 'var(--slate-muted)',
                    fontFamily: 'var(--font-ui)'
                  }}>
                    {stage.label}
                  </div>
                </div>
              </div>

              {/* Connecting Line between stages */}
              {idx < stages.length - 1 && (
                <div style={{
                  flex: 1,
                  height: '2px',
                  backgroundColor: idx < activeIdx ? stage.color : 'var(--paper-sunken)',
                  margin: '0 0.5rem',
                  marginBottom: '1.2rem',
                  zIndex: 1,
                  transition: 'background-color 0.3s ease'
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
