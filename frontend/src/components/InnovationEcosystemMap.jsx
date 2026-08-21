import React, { useState } from 'react';
import { Sparkles, Layers, Rocket, Users, Search, ArrowRight, CheckCircle2 } from 'lucide-react';

/**
 * InnovationEcosystemMap — Luxury Editorial High-Contrast Innovation Architecture Map
 * High-Contrast Accents: Velvet Violet (#6D28D9), Electric Cobalt (#1D4ED8),
 * Burnished Copper (#C25934), and Pitch Obsidian (#111118).
 */

const ECOSYSTEM_NODES = [
  {
    id: 'IDEA',
    name: 'IDEAS',
    icon: Sparkles,
    color: '#6D28D9',      // Velvet Violet
    bg: '#F5F3FF',
    tagline: 'The Origin Spark',
    desc: 'Every great innovation starts as an unproven spark. Document and refine it.',
    action: 'Create Specimen',
    tab: 'submit',
    x: 18,
    y: 35
  },
  {
    id: 'PRODUCT',
    name: 'PRODUCTS',
    icon: Layers,
    color: '#1D4ED8',      // Electric Cobalt
    bg: '#EFF6FF',
    tagline: 'Modular Solutions',
    desc: 'Transform ideas into working prototypes and inspect architectural blueprints.',
    action: 'Inspect Directory',
    tab: 'explore',
    x: 50,
    y: 15
  },
  {
    id: 'STARTUP',
    name: 'STARTUPS',
    icon: Rocket,
    color: '#111118',      // Pitch Obsidian
    bg: '#F3EFEA',
    tagline: 'Ecosystem Growth',
    desc: 'Shape viable software companies through structured iterative releases.',
    action: 'Explore Startups',
    tab: 'explore',
    x: 82,
    y: 35
  },
  {
    id: 'COMMUNITY',
    name: 'COMMUNITY',
    icon: Users,
    color: '#C25934',      // Burnished Copper / Terracotta
    bg: '#FFF7ED',
    tagline: 'Validator Network',
    desc: 'Interest-matched peer reviewers evaluating specifications without spam.',
    action: 'Join Peer Desk',
    tab: 'queue',
    x: 28,
    y: 75
  },
  {
    id: 'INSIGHTS',
    name: 'INSIGHTS',
    icon: Search,
    color: '#4338CA',      // Royal Indigo
    bg: '#EEF2FF',
    tagline: 'AI Consensus',
    desc: 'Turn multi-reviewer feedback into quantitative signals and strategic next steps.',
    action: 'View AI Signals',
    tab: 'insight',
    x: 72,
    y: 75
  }
];

export default function InnovationEcosystemMap({ onSelectNode = () => {} }) {
  const [activeNodeId, setActiveNodeId] = useState('IDEA');

  const activeNode = ECOSYSTEM_NODES.find(n => n.id === activeNodeId) || ECOSYSTEM_NODES[0];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-paper)',
        boxShadow: 'var(--shadow-paper)',
        padding: '2rem',
        overflow: 'hidden'
      }}
    >
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '0.75rem' }}>
        <div className="editorial-index" style={{ color: 'var(--ink-charcoal)' }}>
          ✦ THE INNOVATION NETWORK ARCHITECTURE
        </div>
        <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--slate-muted)' }}>
          5-NODE HIGH-CONTRAST ECOSYSTEM
        </span>
      </div>

      {/* Main Interactive Diagram Canvas */}
      <div style={{
        position: 'relative',
        height: '320px',
        backgroundColor: 'var(--paper-subtle)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-paper)',
        marginBottom: '1.5rem',
        overflow: 'hidden'
      }}>
        {/* SVG Connecting Neural Lines */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          {ECOSYSTEM_NODES.map(node => {
            const isSelected = activeNodeId === node.id;
            return (
              <line
                key={node.id}
                x1="50%"
                y1="50%"
                x2={`${node.x}%`}
                y2={`${node.y}%`}
                stroke={isSelected ? node.color : '#CBD5E1'}
                strokeWidth={isSelected ? 2.5 : 1.5}
                strokeDasharray={isSelected ? 'none' : '4 4'}
                style={{ transition: 'all 0.3s ease' }}
              />
            );
          })}
        </svg>

        {/* Central INNOVEXA Core Node */}
        <div
          onClick={() => onSelectNode('IDEA')}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            backgroundColor: '#111118',
            border: '3px solid #6D28D9',
            boxShadow: '0 0 24px rgba(109, 40, 217, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 5,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
        >
          <span style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 800 }}>✦</span>
          <span style={{ fontSize: '0.58rem', color: '#E2E8F0', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em' }}>
            CORE
          </span>
        </div>

        {/* 5 Surrounding Nodes */}
        {ECOSYSTEM_NODES.map(node => {
          const isSelected = activeNodeId === node.id;
          const Icon = node.icon;

          return (
            <div
              key={node.id}
              onClick={() => {
                setActiveNodeId(node.id);
                onSelectNode(node.id);
              }}
              onMouseEnter={() => setActiveNodeId(node.id)}
              style={{
                position: 'absolute',
                top: `${node.y}%`,
                left: `${node.x}%`,
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
                zIndex: 6,
                transition: 'all 0.2s ease'
              }}
            >
              <div
                style={{
                  width: isSelected ? '54px' : '46px',
                  height: isSelected ? '54px' : '46px',
                  borderRadius: '50%',
                  backgroundColor: isSelected ? node.color : '#FFFFFF',
                  border: `2px solid ${node.color}`,
                  boxShadow: isSelected ? `0 4px 16px ${node.color}55` : 'var(--shadow-paper-flat)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isSelected ? '#FFFFFF' : node.color,
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={isSelected ? 20 : 18} />
              </div>

              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isSelected ? node.color : 'var(--ink-charcoal)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-paper)',
                  boxShadow: 'var(--shadow-paper-flat)'
                }}
              >
                {node.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Active Node Detail Card */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: activeNode.bg,
          border: `1px solid ${activeNode.color}44`,
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: activeNode.color }} />
            <span className="editorial-index" style={{ color: activeNode.color, fontWeight: 800, fontSize: '0.78rem' }}>
              {activeNode.name} — {activeNode.tagline}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--ink-charcoal)', maxWidth: '420px', lineHeight: 1.4 }}>
            {activeNode.desc}
          </p>
        </div>

        <button
          onClick={() => onSelectNode(activeNode.id)}
          className="btn btn-primary btn-sm"
          style={{
            backgroundColor: activeNode.color,
            borderColor: activeNode.color,
            boxShadow: `0 4px 12px ${activeNode.color}44`
          }}
        >
          {activeNode.action} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
