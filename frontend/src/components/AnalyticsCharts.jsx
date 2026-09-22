import React from 'react';
import { 
  BarChart2, 
  ThumbsUp, 
  ThumbsDown, 
  Star, 
  MessageSquare, 
  Lightbulb, 
  Users, 
  Activity, 
  AlertCircle,
  TrendingUp
} from 'lucide-react';

/**
 * EmptyDataFallback
 * Required fallback for when insufficient data exists.
 * Displays "Not enough data yet" instead of broken/empty charts.
 */
export function EmptyDataFallback({ title, message = 'Not enough data yet', hint = 'As users interact with this project, analytics and charts will populate automatically.' }) {
  return (
    <div 
      style={{
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        backgroundColor: 'var(--bg-cream)',
        borderRadius: 'var(--radius-md)',
        border: '1px dashed var(--border-medium)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.65rem',
        minHeight: '180px'
      }}
    >
      <div 
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: 'rgba(231, 111, 130, 0.1)',
          color: 'var(--coral)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <AlertCircle size={20} />
      </div>
      {title && (
        <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          {title}
        </div>
      )}
      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
        {message}
      </div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '320px', lineHeight: 1.4 }}>
        {hint}
      </p>
    </div>
  );
}

/**
 * RatingDistributionChart
 * Displays 5-tier review score breakdown.
 * Falls back to "Not enough data yet" if reviews_count === 0.
 */
export function RatingDistributionChart({ distribution = {}, totalReviews = 0, averageRating = 0 }) {
  if (!totalReviews || totalReviews === 0) {
    return (
      <EmptyDataFallback 
        title="RATING BREAKDOWN" 
        message="Not enough data yet" 
        hint="No verified community reviews have been submitted for this project."
      />
    );
  }

  const tiers = [5, 4, 3, 2, 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Header Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {averageRating.toFixed(1)}
          </div>
          <div>
            <div style={{ display: 'flex', gap: '2px', color: 'var(--apricot)' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star 
                  key={s} 
                  size={12} 
                  fill={s <= Math.round(averageRating) ? 'var(--apricot)' : 'none'} 
                  stroke="var(--apricot)" 
                />
              ))}
            </div>
            <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </div>
          </div>
        </div>

        <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--teal)' }}>
          VERIFIED RATINGS
        </div>
      </div>

      {/* Distribution Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {tiers.map((tier) => {
          const count = distribution[tier] || 0;
          const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
          return (
            <div key={tier} style={{ display: 'grid', gridTemplateColumns: '45px 1fr 40px', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {tier} <Star size={11} fill="currentColor" />
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--bg-cream)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${pct}%`, 
                    backgroundColor: tier >= 4 ? 'var(--teal)' : (tier === 3 ? 'var(--apricot)' : 'var(--coral)'),
                    borderRadius: '4px',
                    transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                  }} 
                />
              </div>
              <div className="mono" style={{ textAlign: 'right', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {count} ({pct}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * VoteRatioChart
 * Visualizes upvotes vs downvotes ratio and distribution.
 * Falls back to "Not enough data yet" if totalVotes === 0.
 */
export function VoteRatioChart({ upvotes = 0, downvotes = 0, totalVotes = 0, voteRatio = 0 }) {
  if (!totalVotes || totalVotes === 0) {
    return (
      <EmptyDataFallback 
        title="VOTE RATIO METER" 
        message="Not enough data yet" 
        hint="No votes have been recorded for this innovation concept."
      />
    );
  }

  const upPct = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 100;
  const downPct = 100 - upPct;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--teal)', fontWeight: 700, fontSize: '0.9rem' }}>
          <ThumbsUp size={15} /> {upvotes} Upvotes ({upPct}%)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--coral)', fontWeight: 700, fontSize: '0.9rem' }}>
          {downvotes} Downvotes ({downPct}%) <ThumbsDown size={15} />
        </div>
      </div>

      {/* Dual Segment Progress Bar */}
      <div style={{ height: '14px', borderRadius: '7px', display: 'flex', overflow: 'hidden', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-cream)' }}>
        <div 
          style={{ 
            width: `${upPct}%`, 
            backgroundColor: 'var(--teal)', 
            transition: 'width 0.6s ease' 
          }} 
          title={`Upvotes: ${upvotes}`}
        />
        <div 
          style={{ 
            width: `${downPct}%`, 
            backgroundColor: 'var(--coral)', 
            transition: 'width 0.6s ease' 
          }} 
          title={`Downvotes: ${downvotes}`}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
        <span className="mono">Approval Score: <strong style={{ color: 'var(--text-primary)' }}>{voteRatio}%</strong></span>
        <span className="mono">Total Cast: <strong style={{ color: 'var(--text-primary)' }}>{totalVotes}</strong></span>
      </div>
    </div>
  );
}

/**
 * EngagementMixChart
 * Visualizes the breakdown of community interactions: Votes, Reviews, Suggestions, Followers.
 * Falls back to "Not enough data yet" if total interactions === 0.
 */
export function EngagementMixChart({ upvotes = 0, downvotes = 0, reviews = 0, suggestions = 0, followers = 0 }) {
  const total = upvotes + downvotes + reviews + suggestions + followers;

  if (total === 0) {
    return (
      <EmptyDataFallback 
        title="COMMUNITY ENGAGEMENT MIX" 
        message="Not enough data yet" 
        hint="No votes, reviews, suggestions, or followers have been registered yet."
      />
    );
  }

  const items = [
    { label: 'Votes', count: upvotes + downvotes, color: 'var(--teal)', icon: <ThumbsUp size={13} /> },
    { label: 'Reviews', count: reviews, color: 'var(--periwinkle)', icon: <MessageSquare size={13} /> },
    { label: 'Suggestions', count: suggestions, color: 'var(--apricot)', icon: <Lightbulb size={13} /> },
    { label: 'Followers', count: followers, color: 'var(--coral)', icon: <Users size={13} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Segment Bar */}
      <div style={{ height: '12px', borderRadius: '6px', display: 'flex', overflow: 'hidden', backgroundColor: 'var(--bg-cream)', border: '1px solid var(--border-subtle)' }}>
        {items.map((item, i) => {
          if (item.count === 0) return null;
          const pct = (item.count / total) * 100;
          return (
            <div 
              key={i} 
              style={{ width: `${pct}%`, backgroundColor: item.color }} 
              title={`${item.label}: ${item.count} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Legend Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
        {items.map((item, i) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div 
              key={i} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '0.45rem 0.65rem', 
                backgroundColor: 'var(--bg-cream)', 
                borderRadius: 'var(--radius-sm)',
                borderLeft: `3px solid ${item.color}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                {item.icon}
                <span>{item.label}</span>
              </div>
              <span className="mono" style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {item.count} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * ActivityTimelineChart
 * Displays temporal activity distribution.
 * Falls back to "Not enough data yet" if timeline has < 2 days.
 */
export function ActivityTimelineChart({ timeline = [] }) {
  if (!timeline || timeline.length < 2) {
    return (
      <EmptyDataFallback 
        title="ACTIVITY TIMELINE TREND" 
        message="Not enough data yet" 
        hint="Need interactions across multiple dates to construct an activity trend curve."
      />
    );
  }

  const maxTotal = Math.max(...timeline.map(t => t.total || 0), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          DAILY INTERACTION VOLUME
        </span>
        <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--coral)', fontWeight: 700 }}>
          {timeline.reduce((sum, t) => sum + (t.total || 0), 0)} Total Events
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '110px', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
        {timeline.map((point, idx) => {
          const heightPct = Math.max(12, Math.round((point.total / maxTotal) * 100));
          return (
            <div 
              key={idx} 
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                height: '100%', 
                justifyContent: 'flex-end',
                gap: '4px'
              }}
              title={`${point.date}: ${point.total} interactions`}
            >
              <div 
                style={{ 
                  width: '100%', 
                  height: `${heightPct}%`, 
                  backgroundColor: 'var(--coral)', 
                  borderRadius: '3px 3px 0 0',
                  opacity: 0.85,
                  transition: 'height 0.4s ease'
                }} 
              />
              <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {point.date.slice(5)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
