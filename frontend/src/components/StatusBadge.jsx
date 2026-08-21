import React from 'react';
import { getCategoryInk } from '../utils/categoryColors';

/**
 * StageBadge — Distinct visual badge for Project Stages (IDEA, PROTOTYPE, MVP, BETA, LIVE)
 */
export function StageBadge({ stage }) {
  const normStage = (stage || 'idea').toLowerCase();

  switch (normStage) {
    case 'live':
      return (
        <span
          className="category-tag"
          style={{
            color: '#10B981',
            borderColor: 'rgba(16, 185, 129, 0.35)',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            fontWeight: 700,
            letterSpacing: '0.06em'
          }}
        >
          ● LIVE PRODUCT
        </span>
      );

    case 'beta':
      return (
        <span
          className="category-tag"
          style={{
            color: '#8B5CF6',
            borderColor: 'rgba(139, 92, 246, 0.35)',
            backgroundColor: 'rgba(139, 92, 246, 0.08)',
            fontWeight: 700,
            letterSpacing: '0.06em'
          }}
        >
          ▲ BETA / EARLY ACCESS
        </span>
      );

    case 'mvp':
      return (
        <span
          className="category-tag"
          style={{
            color: '#3B82F6',
            borderColor: 'rgba(59, 130, 246, 0.35)',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            fontWeight: 700,
            letterSpacing: '0.06em'
          }}
        >
          ◆ MVP BUILD
        </span>
      );

    case 'prototype':
      return (
        <span
          className="category-tag"
          style={{
            color: '#F59E0B',
            borderColor: 'rgba(245, 158, 11, 0.35)',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            fontWeight: 700,
            letterSpacing: '0.06em'
          }}
        >
          ✦ PROTOTYPE
        </span>
      );

    case 'idea':
    case 'concept':
    default:
      return (
        <span
          className="category-tag"
          style={{
            color: 'var(--coral)',
            borderColor: 'rgba(231, 111, 130, 0.35)',
            backgroundColor: 'rgba(231, 111, 130, 0.08)',
            fontWeight: 700,
            letterSpacing: '0.06em'
          }}
        >
          ✧ CONCEPT & IDEA
        </span>
      );
  }
}

/**
 * FeaturedDemoBadge — Subtle editorial badge for Curated Demo / Example Projects
 */
export function FeaturedDemoBadge({ type, label }) {
  const isProduct = type === 'product_example';
  return (
    <span
      className="category-tag"
      style={{
        color: isProduct ? 'var(--periwinkle)' : 'var(--lavender)',
        borderColor: isProduct ? 'rgba(113, 134, 216, 0.45)' : 'rgba(155, 138, 229, 0.45)',
        backgroundColor: isProduct ? 'rgba(113, 134, 216, 0.1)' : 'rgba(155, 138, 229, 0.1)',
        fontWeight: 800,
        letterSpacing: '0.08em',
        fontSize: '0.68rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem'
      }}
    >
      ✦ {label || (isProduct ? 'FEATURED PRODUCT EXAMPLE' : 'FEATURED DEMO')}
    </span>
  );
}

/**
 * StatusBadge — Editorial Category & Status Badge
 */
export default function StatusBadge({ status, stage, categoryId, categoryName }) {
  const ink = getCategoryInk(categoryId, categoryName);
  const normStatus = (status || 'DRAFT').toUpperCase();

  switch (normStatus) {
    case 'PUBLISHED':
      return (
        <span
          className="category-tag"
          style={{
            color: 'var(--green)',
            borderColor: 'rgba(105, 184, 154, 0.4)',
            backgroundColor: '#EFF7F3'
          }}
        >
          ✓ PUBLISHED
        </span>
      );

    case 'READY_TO_LAUNCH':
      return (
        <span
          className="category-tag"
          style={{
            color: '#8B5CF6',
            borderColor: 'rgba(139, 92, 246, 0.4)',
            backgroundColor: '#F5F0FF',
            fontWeight: 700
          }}
        >
          🚀 READY TO LAUNCH
        </span>
      );

    case 'VALIDATION_COMPLETE':
      return (
        <span
          className="category-tag"
          style={{
            color: 'var(--rose-pink)',
            borderColor: 'rgba(216, 107, 154, 0.4)',
            backgroundColor: '#FAF0F5'
          }}
        >
          ✦ INSIGHTS READY
        </span>
      );

    case 'UNDER_VALIDATION':
    case 'VALIDATING':
      return (
        <span
          className="category-tag"
          style={{
            color: ink.hex || 'var(--coral)',
            borderColor: 'rgba(231, 111, 130, 0.4)',
            backgroundColor: ink.lightBg || '#FDF1F3'
          }}
        >
          ● VALIDATING
        </span>
      );

    case 'IMPROVING':
      return (
        <span
          className="category-tag"
          style={{
            color: 'var(--apricot)',
            borderColor: 'rgba(240, 164, 93, 0.4)',
            backgroundColor: '#FDF6EE'
          }}
        >
          ✏ ITERATING
        </span>
      );

    case 'DRAFT':
    default:
      return (
        <span
          className="category-tag"
          style={{
            color: 'var(--text-secondary)',
            borderColor: 'var(--border-medium)',
            backgroundColor: 'var(--bg-cream)'
          }}
        >
          DRAFT
        </span>
      );
  }
}
