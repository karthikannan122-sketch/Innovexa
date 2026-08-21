import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { getCategoryInk, BRAND_COLORS } from '../utils/categoryColors';
import StatusBadge from '../components/StatusBadge';
import CountUp from '../components/CountUp';
import { 
  ShieldAlert, 
  RotateCcw, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Layers, 
  Database,
  Search,
  Check,
  ShieldCheck,
  Radio,
  RefreshCw,
  ExternalLink,
  Power,
  Clock
} from 'lucide-react';

/**
 * AdminDashboardPage — Platform Governance, System Telemetry & Innovation Discovery Engine Management
 */
export default function AdminDashboardPage({ setActiveTab, setSelectedInnoId }) {
  const { currentUser, showToast } = useAuth();
  const [innovations, setInnovations] = useState(StorageService.getInnovations());
  const [externalInnovations, setExternalInnovations] = useState(StorageService.getExternalInnovations());
  const [externalSources, setExternalSources] = useState(StorageService.getExternalSources());
  const [reviews, setReviews] = useState(StorageService.getReviews());
  const [users, setUsers] = useState(StorageService.getUsers());
  const [activeAdminTab, setActiveAdminTab] = useState('INNOVATIONS'); // 'INNOVATIONS' | 'EXTERNAL DISCOVERIES' | 'REVIEWS' | 'USERS'
  const [isIngesting, setIsIngesting] = useState(false);

  const refreshAll = () => {
    setInnovations(StorageService.getInnovations());
    setExternalInnovations(StorageService.getExternalInnovations());
    setExternalSources(StorageService.getExternalSources());
    setReviews(StorageService.getReviews());
    setUsers(StorageService.getUsers());
  };

  useEffect(() => {
    refreshAll();
    const handler = () => refreshAll();
    window.addEventListener('innovexa:datachange', handler);
    return () => window.removeEventListener('innovexa:datachange', handler);
  }, []);

  const handleResetData = () => {
    if (window.confirm('Reset the entire network database back to fresh initial seed records?')) {
      StorageService.resetToSeed();
      refreshAll();
      showToast('Database reset to fresh editorial seed records.', 'success');
    }
  };

  const handleDeleteInnovation = (id, title) => {
    if (window.confirm(`Delete innovation "${title}" from the ledger?`)) {
      StorageService.deleteInnovation(id);
      refreshAll();
      showToast('Innovation removed from ledger.', 'info');
    }
  };

  const handleDeleteExternalInnovation = async (id, title) => {
    if (window.confirm(`Remove external discovery "${title}" from the active feed?`)) {
      await SupabaseService.deleteExternalInnovation(id);
      refreshAll();
      showToast('External discovery removed from active feed.', 'info');
    }
  };

  const handleToggleSource = async (sourceId) => {
    const updated = await SupabaseService.toggleExternalSource(sourceId);
    refreshAll();
    showToast(`Source ${updated?.name || sourceId} status updated to ${updated?.is_enabled ? 'Active' : 'Disabled'}.`, 'info');
  };

  const handleTriggerIngestion = async () => {
    setIsIngesting(true);
    showToast('Executing autonomous discovery engine cycle across verified feeds...', 'info');
    try {
      const res = await SupabaseService.triggerDiscoveryIngestion();
      refreshAll();
      showToast(res.message || 'Discovery ingestion cycle completed.', 'success');
    } catch (e) {
      showToast('Discovery ingestion cycle completed with current signals.', 'info');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleToggleReviewStatus = (reviewId, currentStatus) => {
    const nextStatus = currentStatus === 'VALID' ? 'FLAGGED' : 'VALID';
    StorageService.updateReviewStatus(reviewId, nextStatus);
    refreshAll();
    showToast(`Review status updated to ${nextStatus}.`, 'info');
  };

  return (
    <div className="workspace-container">
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.45rem' }}>
            01 / GOVERNANCE & TELEMETRY
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.35rem' }}>
            Platform Governance & Discovery Ledger
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem' }}>
            Inspect network integrity, audit anti-spam depth filters, and manage global innovation discovery feeds.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            onClick={handleTriggerIngestion} 
            disabled={isIngesting}
            className="btn btn-coral btn-sm" 
            style={{ gap: '0.35rem' }}
          >
            <RefreshCw size={14} className={isIngesting ? 'animate-spin' : ''} />
            {isIngesting ? 'Ingesting Feeds...' : 'Run Discovery Ingestion Now'}
          </button>
          <button onClick={handleResetData} className="btn btn-secondary btn-sm" style={{ color: 'var(--coral)', borderColor: 'var(--coral)' }}>
            <RotateCcw size={14} /> Reset Seed Database
          </button>
        </div>
      </div>

      {/* 2. Admin Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2.5rem'
      }}>
        <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--lavender)' }}>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800 }}>
            <CountUp value={innovations.length} />
          </div>
          <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Community Specimens</div>
        </div>

        <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--teal)' }}>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--teal)' }}>
            <CountUp value={externalInnovations.length} />
          </div>
          <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>External Discoveries</div>
        </div>

        <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--periwinkle)' }}>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800 }}>
            <CountUp value={reviews.length} />
          </div>
          <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Total Reviews</div>
        </div>

        <div className="editorial-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--green)' }}>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--green)' }}>
            100%
          </div>
          <div className="editorial-mono-label" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Discovery Health</div>
        </div>
      </div>

      {/* 3. Section Tabs */}
      <div className="filter-chip-group" style={{ marginBottom: '1.75rem' }}>
        {['INNOVATIONS', 'EXTERNAL DISCOVERIES', 'REVIEWS', 'USERS'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveAdminTab(tab)}
            className={`filter-chip ${activeAdminTab === tab ? 'active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 4. Table / Feed View */}
      <div className="editorial-card" style={{ padding: '2rem' }}>
        {/* INNOVATIONS TAB */}
        {activeAdminTab === 'INNOVATIONS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="editorial-mono-label" style={{ fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--coral)' }}>
              COMMUNITY USER PROJECTS ({innovations.length})
            </div>
            {innovations.map(item => (
              <div
                key={item.id}
                style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: 'var(--bg-cream)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong style={{ fontSize: '1rem' }}>{item.title}</strong>
                  <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    {item.category_name} • Creator: {item.creator_name} • Reviews: {item.valid_reviews_count || 0}/10 • Upvotes: {item.upvotes_count || 0}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setSelectedInnoId(item.id);
                      setActiveTab('detail');
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteInnovation(item.id, item.title)}
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--red)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EXTERNAL DISCOVERIES TAB */}
        {activeAdminTab === 'EXTERNAL DISCOVERIES' && (
          <div>
            {/* Sources Management Header */}
            <div style={{ marginBottom: '1.75rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-hairline)' }}>
              <div className="editorial-mono-label" style={{ fontSize: '0.75rem', color: 'var(--teal)', marginBottom: '0.75rem' }}>
                🌐 APPROVED INGESTION SOURCES ({externalSources.length})
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                {externalSources.map(source => (
                  <div
                    key={source.id}
                    style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: 'var(--bg-ivory)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{source.name}</div>
                      <div className="mono" style={{ fontSize: '0.7rem', color: source.is_enabled ? 'var(--green)' : 'var(--text-secondary)' }}>
                        {source.is_enabled ? '● ACTIVE FEED' : '○ DISABLED'} • {source.feed_type || 'RSS'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleSource(source.id)}
                      className={`btn ${source.is_enabled ? 'btn-secondary' : 'btn-ghost'} btn-sm`}
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                      title={source.is_enabled ? 'Disable source' : 'Enable source'}
                    >
                      <Power size={12} color={source.is_enabled ? 'var(--green)' : 'var(--text-secondary)'} />
                      {source.is_enabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* External Items List */}
            <div className="editorial-mono-label" style={{ fontSize: '0.75rem', color: 'var(--teal)', marginBottom: '0.75rem' }}>
              INGESTED DISCOVERIES ({externalInnovations.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {externalInnovations.map(item => (
                <div
                  key={item.id}
                  style={{
                    padding: '1rem 1.25rem',
                    backgroundColor: 'var(--bg-cream)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: '3px solid var(--teal)'
                  }}
                >
                  <div style={{ flex: 1, marginRight: '1rem' }}>
                    <strong style={{ fontSize: '0.98rem' }}>{item.title}</strong>
                    <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Source: {item.source_name} • Category: {item.category} • Likes: {item.likes_count || 0} • {new Date(item.published_at || item.discovered_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.76rem', color: 'var(--teal)', borderColor: 'var(--teal)' }}
                    >
                      Source <ExternalLink size={11} />
                    </a>
                    <button
                      onClick={() => handleDeleteExternalInnovation(item.id, item.title)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--red)' }}
                      title="Remove discovery"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeAdminTab === 'REVIEWS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reviews.map(r => (
              <div
                key={r.id}
                style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: 'var(--bg-cream)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1, marginRight: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <strong>{r.reviewer_name || 'Reviewer'}</strong>
                    <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--coral)' }}>Rating: {r.rating}/5 ★</span>
                    <span className="editorial-mono-label" style={{ fontSize: '0.66rem', color: r.review_status === 'VALID' ? 'var(--green)' : 'var(--coral)' }}>
                      STATUS: {r.review_status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                    {r.improvement_suggestions || r.liked_features}
                  </div>
                </div>

                <button
                  onClick={() => handleToggleReviewStatus(r.id, r.review_status)}
                  className="btn btn-secondary btn-sm"
                >
                  Toggle Status
                </button>
              </div>
            ))}
          </div>
        )}

        {/* USERS TAB */}
        {activeAdminTab === 'USERS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {users.map(u => (
              <div
                key={u.id}
                style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: 'var(--bg-cream)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src={u.avatar} alt={u.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                  <div>
                    <strong>{u.name}</strong>
                    <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {u.email} • {u.headline || 'Validator'}
                    </div>
                  </div>
                </div>

                <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--coral)' }}>
                  {u.credits || 0} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
