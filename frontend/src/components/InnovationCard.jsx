import React from 'react';
import StatusBadge, { StageBadge, FeaturedDemoBadge } from './StatusBadge';
import CountUp from './CountUp';
import { getCategoryInk } from '../utils/categoryColors';
import { Heart, MessageSquare, ArrowUpRight, Globe, Play, ExternalLink, Radio } from 'lucide-react';

/**
 * InnovationCard — Editorial Specimen Card
 * Distinguishes cleanly between Community Innovations and Global Discoveries
 */
export default function InnovationCard({ innovation, onSelect, onAction, actionLabel = 'Inspect Specimen' }) {
  if (!innovation) return null;

  const isExternal = Boolean(innovation.is_external || innovation.source_url);
  const ink = getCategoryInk(innovation.category_id, innovation.category_name || innovation.category);
  const target = innovation.validation_target || 10;
  const current = innovation.valid_reviews_count || 0;
  const progressPercent = Math.min(100, Math.round((current / target) * 100));
  const stage = (innovation.project_stage || (innovation.creation_type === 'PRODUCT' ? 'prototype' : 'idea')).toLowerCase();
  const isDemo = innovation.is_demo || innovation.is_featured_example;

  return (
    <div
      onClick={onSelect}
      className="editorial-card hover-lift"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        padding: '1.75rem',
        borderLeft: `4px solid ${isExternal ? 'var(--teal)' : ink.hex}`
      }}
    >
      <div>
        {/* Category Tag & Stage / Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`category-tag ${ink.tagClass}`}>
              {innovation.categories?.name || innovation.category_name || innovation.category || "Uncategorized"}
            </span>
            {isExternal ? (
              <span className="editorial-mono-label" style={{ fontSize: '0.66rem', color: 'var(--teal)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Radio size={10} /> GLOBAL DISCOVERY
              </span>
            ) : (
              <>
                <StageBadge stage={stage} />
                {isDemo && (
                  <FeaturedDemoBadge type={innovation.demo_project_type} label={innovation.demo_badge_label} />
                )}
              </>
            )}
          </div>
          {!isExternal && <StatusBadge status={innovation.status} />}
        </div>

        {/* Title */}
        <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '0.45rem', lineHeight: '1.25' }}>
          {innovation.title}
        </h3>

        {/* Short Description */}
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.88rem',
          lineHeight: '1.5',
          marginBottom: '1.25rem',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {innovation.short_description || innovation.summary || innovation.ai_summary || innovation.problem_statement?.slice(0, 140)}
        </p>
      </div>

      <div>
        {/* If Community: Validation Progress Track. If External: Verified Live Source Link */}
        {isExternal ? (
          <div style={{ marginBottom: '1rem', borderTop: '1px solid var(--border-hairline)', paddingTop: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span>Source: <strong>{innovation.source_name || 'Frontier Wire'}</strong></span>
              {innovation.source_url && (
                <a
                  href={innovation.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', gap: '0.3rem', color: 'var(--teal)', borderColor: 'var(--teal)' }}
                >
                  EXPLORE SOURCE <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
              <span>VALIDATION PROGRESS</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{current} / {target} REVIEWS</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: ink.hex
                }}
              />
            </div>
          </div>
        )}

        {/* Author & Metrics Bottom Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: isExternal ? 'none' : '1px solid var(--border-hairline)',
          paddingTop: isExternal ? '0' : '0.85rem',
          fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
            <img
              src={innovation.creator_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={innovation.creator_name || 'Innovator'}
              style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <span style={{ fontWeight: 600 }}>{isExternal ? (innovation.source_name || 'Research Wire') : (innovation.creator_name || 'Innovator')}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Heart size={13} color="var(--coral)" /> {innovation.upvotes_count || innovation.likes_count || 0}
            </span>
            {!isExternal && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MessageSquare size={13} color="var(--periwinkle)" /> {current}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
