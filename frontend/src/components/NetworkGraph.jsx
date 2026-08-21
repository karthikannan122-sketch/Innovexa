import React, { useState } from 'react';
import { Layers, Users, Lightbulb, Sparkles, Rocket, ShieldCheck } from 'lucide-react';

/**
 * NetworkGraph — Interactive Future Network Signature Visualization (Section 2 & 22)
 * Renders the connected graph ecosystem:
 * IDEAS → RELATED INNOVATIONS → REVIEWERS → FEEDBACK → INSIGHTS → IMPROVEMENT → LAUNCH
 */
export default function NetworkGraph({
  innovationTitle = 'Core Specimen',
  relatedCount = 3,
  reviewersCount = 8,
  insightsCount = 4,
  height = 320,
  interactive = true
}) {
  const [activeNode, setActiveNode] = useState(null);

  // Layout Node Coordinates
  const cx = 300;
  const cy = 160;

  const nodes = [
    {
      id: 'center',
      label: innovationTitle,
      type: 'INNOVATION',
      x: cx,
      y: cy,
      r: 34,
      color: 'var(--primary)',
      icon: Sparkles,
      desc: 'Active Innovation Specimen under validation'
    },
    {
      id: 'related',
      label: `${relatedCount} Related Ideas`,
      type: 'SIMILARITY',
      x: cx - 180,
      y: cy - 70,
      r: 24,
      color: 'var(--secondary)',
      icon: Layers,
      desc: 'Discovered through 5-factor similarity matching'
    },
    {
      id: 'reviewers',
      label: `${reviewersCount} Matched Peers`,
      type: 'REVIEWERS',
      x: cx + 180,
      y: cy - 70,
      r: 24,
      color: 'var(--accent-cyan)',
      icon: Users,
      desc: 'Targeted domain experts & active reviewers'
    },
    {
      id: 'insights',
      label: `${insightsCount} Feedback Clusters`,
      type: 'INSIGHTS',
      x: cx - 140,
      y: cy + 90,
      r: 24,
      color: 'var(--status-warning)',
      icon: Lightbulb,
      desc: 'Synthesized strengths, gaps, and feature requests'
    },
    {
      id: 'launch',
      label: 'Validated Launch',
      type: 'LAUNCH',
      x: cx + 140,
      y: cy + 90,
      r: 24,
      color: 'var(--status-success)',
      icon: Rocket,
      desc: 'Community release with quality assurance'
    }
  ];

  const links = [
    { source: 'related', target: 'center', stroke: 'var(--secondary)' },
    { source: 'reviewers', target: 'center', stroke: 'var(--accent-cyan)' },
    { source: 'center', target: 'insights', stroke: 'var(--status-warning)' },
    { source: 'insights', target: 'launch', stroke: 'var(--status-success)' },
    { source: 'center', target: 'launch', stroke: 'var(--status-success)' }
  ];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: `${height}px`,
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)'
      }}
    >
      {/* Background Matrix Grid */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 600 320"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
      >
        <defs>
          <radialGradient id="netCenterGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Center Glow */}
        <circle cx={cx} cy={cy} r="120" fill="url(#netCenterGlow)" />

        {/* Connection Links */}
        {links.map((link, idx) => {
          const sNode = nodes.find(n => n.id === link.source);
          const tNode = nodes.find(n => n.id === link.target);
          if (!sNode || !tNode) return null;

          return (
            <g key={idx}>
              {/* Outer soft link glow */}
              <line
                x1={sNode.x}
                y1={sNode.y}
                x2={tNode.x}
                y2={tNode.y}
                stroke={link.stroke}
                strokeWidth="3"
                strokeOpacity="0.2"
              />
              {/* Core dashed line */}
              <line
                x1={sNode.x}
                y1={sNode.y}
                x2={tNode.x}
                y2={tNode.y}
                stroke={link.stroke}
                strokeWidth="1.6"
                strokeDasharray="4 4"
                strokeOpacity="0.8"
              />
            </g>
          );
        })}

        {/* Interactive Nodes */}
        {nodes.map(node => {
          const isCenter = node.id === 'center';
          const isHovered = activeNode?.id === node.id;
          const Icon = node.icon;

          return (
            <g
              key={node.id}
              style={{ cursor: interactive ? 'pointer' : 'default' }}
              onMouseEnter={() => setActiveNode(node)}
              onMouseLeave={() => setActiveNode(null)}
            >
              {/* Outer pulsating ring for center node */}
              {isCenter && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r + 8}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.6"
                />
              )}

              {/* Node Main Circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={isHovered ? node.r + 3 : node.r}
                fill="var(--bg-surface)"
                stroke={node.color}
                strokeWidth={isCenter ? '2.5' : '2'}
                style={{
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  filter: isHovered ? `drop-shadow(0 0 12px ${node.color})` : 'none'
                }}
              />

              {/* Node Label Text */}
              <text
                x={node.x}
                y={node.y + node.r + 16}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="11px"
                fontWeight="600"
                fontFamily="var(--font-ui)"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Info Tooltip Banner */}
      {activeNode && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-surface)',
            border: `1px solid ${activeNode.color}`,
            padding: '0.4rem 0.95rem',
            borderRadius: 'var(--radius-full)',
            boxShadow: 'var(--shadow-card)',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <span style={{ color: activeNode.color, fontWeight: 'bold' }}>● {activeNode.type}:</span>
          <span style={{ color: 'var(--text-primary)' }}>{activeNode.desc}</span>
        </div>
      )}
    </div>
  );
}
