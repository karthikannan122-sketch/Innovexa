import React from 'react';

/**
 * ValidationStamp — High-Fidelity Signature Element of INNOVEXA (Section 57)
 * A rubber stamp with physical deboss depression ring, dual-octave ink-bleed
 * filter, -6deg tactile tilt, and dynamic status encoding.
 */
export default function ValidationStamp({
  status = 'UNDER_VALIDATION',
  validCount = 0,
  targetCount = 10,
  size = 'md', // 'sm' (48px), 'md' (72px), 'lg' (140px)
  className = '',
  showProgressRing = false,
  animated = true
}) {
  const normalizedStatus = (status || 'UNDER_VALIDATION').toUpperCase();

  const dimensions = {
    sm: 52,
    md: 78,
    lg: 148,
  }[size] || 78;

  let color = 'var(--graph-blue)';
  let primaryText = 'IN REVIEW';
  let secondaryText = `${validCount}/${targetCount}`;
  let isFilled = false;
  let embossColor = 'rgba(28, 43, 69, 0.12)';

  if (normalizedStatus === 'DRAFT') {
    color = 'var(--slate)';
    primaryText = 'DRAFT';
    secondaryText = 'SPECIMEN';
    embossColor = 'rgba(107, 114, 128, 0.15)';
  } else if (normalizedStatus === 'UNDER_VALIDATION') {
    color = 'var(--graph-blue)';
    primaryText = 'IN REVIEW';
    secondaryText = `${validCount}/${targetCount}`;
    isFilled = false;
    embossColor = 'rgba(62, 92, 138, 0.18)';
  } else if (normalizedStatus === 'VALIDATION_COMPLETE' || normalizedStatus === 'VALIDATED') {
    color = 'var(--stamp-red)';
    primaryText = 'VALIDATED';
    secondaryText = `${validCount}/${targetCount} MET`;
    isFilled = true;
    embossColor = 'rgba(178, 58, 46, 0.25)';
  } else if (normalizedStatus === 'PUBLISHED') {
    color = 'var(--signal-green)';
    primaryText = 'COMMUNITY';
    secondaryText = 'PUBLISHED';
    isFilled = true;
    embossColor = 'rgba(63, 125, 88, 0.25)';
  }

  const progressPercent = Math.min(100, Math.round((validCount / (targetCount || 10)) * 100));
  const strokeWidth = size === 'lg' ? 4.5 : size === 'md' ? 3 : 2.2;
  const radius = dimensions / 2 - strokeWidth - 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Generate 28 scalloped circle points with micro-irregularities
  const pointsCount = 28;
  const cx = dimensions / 2;
  const cy = dimensions / 2;
  const outerR = dimensions / 2 - 4;
  const innerR = outerR - (size === 'lg' ? 5 : size === 'md' ? 3.5 : 2.5);
  
  let pathD = '';
  for (let i = 0; i < pointsCount; i++) {
    const angle1 = (i * 2 * Math.PI) / pointsCount;
    const angle2 = ((i + 0.5) * 2 * Math.PI) / pointsCount;
    const x1 = cx + outerR * Math.cos(angle1);
    const y1 = cy + outerR * Math.sin(angle1);
    const x2 = cx + innerR * Math.cos(angle2);
    const y2 = cy + innerR * Math.sin(angle2);
    if (i === 0) {
      pathD += `M ${x1} ${y1} Q ${x2} ${y2}, `;
    } else {
      pathD += `${x1} ${y1} Q ${x2} ${y2}, `;
    }
  }
  pathD += 'Z';

  return (
    <div
      className={`validation-stamp-wrapper ${className}`}
      style={{
        width: dimensions,
        height: dimensions,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'rotate(-6deg)',
        transformOrigin: 'center center',
        userSelect: 'none',
        flexShrink: 0,
        position: 'relative'
      }}
      title={`Validation Stamp: ${normalizedStatus} (${validCount}/${targetCount} Valid Reviews)`}
    >
      {/* Physical Deboss Depression Ring in Paper */}
      <div
        style={{
          position: 'absolute',
          width: dimensions - 2,
          height: dimensions - 2,
          borderRadius: '50%',
          boxShadow: `inset 0 1px 3px ${embossColor}, 0 1px 1px rgba(255,255,255,0.9)`,
          pointerEvents: 'none'
        }}
      />

      <svg
        width={dimensions}
        height={dimensions}
        viewBox={`0 0 ${dimensions} ${dimensions}`}
        style={{
          overflow: 'visible',
          filter: isFilled 
            ? 'drop-shadow(0 2px 5px rgba(28,43,69,0.18))'
            : 'drop-shadow(0 1px 3px rgba(28,43,69,0.08))'
        }}
      >
        <defs>
          {/* Dual-Octave Ink Bleed and Edge Fiber Filter */}
          <filter id={`inkBleed-${size}`} x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          {/* Pressed Ink Texture Pattern */}
          <radialGradient id={`inkFade-${size}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
          </radialGradient>
        </defs>

        <g filter={`url(#inkBleed-${size})`}>
          {/* Scalloped outer edge with physical stamped fill */}
          <path
            d={pathD}
            fill={isFilled ? color : 'var(--ledger-paper-raised)'}
            stroke={color}
            strokeWidth={size === 'lg' ? 2.8 : size === 'md' ? 2.0 : 1.6}
            strokeLinejoin="round"
          />

          {/* Ink Distress Overlay */}
          {isFilled && (
            <path
              d={pathD}
              fill={`url(#inkFade-${size})`}
              pointerEvents="none"
            />
          )}

          {/* Inner concentric dashed ring */}
          <circle
            cx={cx}
            cy={cy}
            r={outerR - (size === 'lg' ? 12 : size === 'md' ? 8 : 6)}
            fill="none"
            stroke={isFilled ? '#ffffff' : color}
            strokeWidth={size === 'lg' ? 1.6 : 1.1}
            strokeDasharray={size === 'lg' ? '4, 3' : '3, 2'}
            opacity={isFilled ? 0.8 : 0.65}
          />

          {/* Progress Ring if enabled */}
          {showProgressRing && (
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{
                transition: animated ? 'stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
              }}
            />
          )}

          {/* Stamp Typography: Primary Top Header */}
          <text
            x={cx}
            y={size === 'lg' ? cy - 12 : size === 'md' ? cy - 5 : cy - 3}
            textAnchor="middle"
            fill={isFilled ? '#ffffff' : color}
            fontFamily="var(--font-mono)"
            fontWeight="700"
            fontSize={size === 'lg' ? '12.5px' : size === 'md' ? '8px' : '6px'}
            letterSpacing={size === 'lg' ? '0.14em' : '0.08em'}
            style={{ textTransform: 'uppercase' }}
          >
            {primaryText}
          </text>

          {/* Center decorative divider rule */}
          <line
            x1={cx - (size === 'lg' ? 26 : size === 'md' ? 15 : 10)}
            y1={size === 'lg' ? cy - 1 : size === 'md' ? cy : cy}
            x2={cx + (size === 'lg' ? 26 : size === 'md' ? 15 : 10)}
            y2={size === 'lg' ? cy - 1 : size === 'md' ? cy : cy}
            stroke={isFilled ? '#ffffff' : color}
            strokeWidth={size === 'lg' ? 1.2 : 0.85}
            opacity={0.65}
          />

          {/* Stamp Typography: Secondary Bottom Subtitle */}
          <text
            x={cx}
            y={size === 'lg' ? cy + 16 : size === 'md' ? cy + 10 : cy + 8}
            textAnchor="middle"
            fill={isFilled ? '#ffffff' : color}
            fontFamily="var(--font-mono)"
            fontWeight="600"
            fontSize={size === 'lg' ? '11.5px' : size === 'md' ? '7.5px' : '5.5px'}
            letterSpacing="0.05em"
          >
            {secondaryText}
          </text>
        </g>
      </svg>
    </div>
  );
}
