import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { getCategoryInk, BRAND_COLORS } from '../utils/categoryColors';
import { cleanProjectTitle } from '../utils/textUtils';
import StatusBadge, { StageBadge } from '../components/StatusBadge';
import LaunchSetupModal from '../components/LaunchSetupModal';
import CountUp from '../components/CountUp';
import confetti from 'canvas-confetti';
import { 
  PlusCircle, 
  ArrowUpRight, 
  Copy, 
  Trash2, 
  Edit3, 
  Rocket, 
  FolderKanban, 
  Clock, 
  CheckCircle2,
  FileText,
  ExternalLink
} from 'lucide-react';

/**
 * CreatorDashboardPage — "My Projects" Portfolio Management Page
 * Tabs: ALL PROJECTS | VALIDATING | READY TO LAUNCH | PUBLISHED | DRAFTS
 * Actions: OPEN | LAUNCH PROJECT | EDIT | DUPLICATE | DELETE
 */
import { SupabaseService } from '../services/supabaseService';

export default function CreatorDashboardPage({ setActiveTab, setSelectedInnoId }) {
  const { currentUser, showToast } = useAuth();
  const [myInnovations, setMyInnovations] = useState(() => {
    return currentUser ? (StorageService.getInnovationsByUserId(currentUser.id) || []) : [];
  });
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedForLaunch, setSelectedForLaunch] = useState(null);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(() => {
    return !currentUser || (StorageService.getInnovationsByUserId(currentUser.id) || []).length === 0;
  });

  const refreshData = async () => {
    if (!currentUser) {
      setMyInnovations([]);
      setIsLoading(false);
      return;
    }
    const cached = StorageService.getInnovationsByUserId(currentUser.id) || [];
    if (cached.length > 0 && myInnovations.length === 0) {
      setMyInnovations(cached);
    }
    try {
      const { data, error } = await SupabaseService.getUserProjects(currentUser.id);
      if (data && Array.isArray(data)) {
        setMyInnovations(data);
      } else if (cached.length > 0) {
        setMyInnovations(cached);
      }
    } catch (err) {
      console.warn('Error loading user projects:', err);
      if (cached.length > 0) setMyInnovations(cached);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const handler = () => refreshData();
    window.addEventListener('innovexa:datachange', handler);
    return () => window.removeEventListener('innovexa:datachange', handler);
  }, [currentUser]);

  const handleOpen = (id) => {
    sessionStorage.setItem('innovexa_detail_tab', 'FEEDBACK');
    setSelectedInnoId(id);
    setActiveTab('detail');
  };

  const handleEdit = (id) => {
    setSelectedInnoId(id);
    setActiveTab('submit');
  };

  const handleLaunchSetup = (item) => {
    setSelectedForLaunch(item);
    setIsLaunchModalOpen(true);
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Permanently delete project "${title}"?`)) {
      const { error } = await SupabaseService.deleteProject(id, currentUser?.id);
      if (error) {
        showToast(error.message || 'Error deleting project', 'error');
        return;
      }
      refreshData();
      showToast('Project deleted.', 'info');
    }
  };

  const handleDuplicate = async (item) => {
    const cleanTitle = cleanProjectTitle(item.title);
    const { data: duplicated, error } = await SupabaseService.createProject({
      ...item,
      title: `${cleanTitle} (Copy)`,
      status: 'UNDER_VALIDATION',
      launch_status: 'validating',
      valid_reviews_count: 0
    }, currentUser);
    if (error) {
      showToast(error.message || 'Error duplicating project', 'error');
      return;
    }
    refreshData();
    showToast(`Project duplicated: "${duplicated?.title || cleanTitle}"`, 'success');
  };

  const filteredInnos = myInnovations.filter(i => {
    if (activeFilter === 'ALL') return true;
    const st = (i.status || '').toLowerCase();
    const ls = (i.launch_status || '').toLowerCase();
    if (activeFilter === 'VALIDATING') return st === 'under_validation' || st === 'published' || ls === 'validating';
    if (activeFilter === 'READY') return st === 'validation_complete' || ls === 'ready_to_launch' || (i.valid_reviews_count >= (i.validation_target || 10));
    if (activeFilter === 'PUBLISHED') return st === 'published' || ls === 'published';
    if (activeFilter === 'DRAFTS') return st === 'draft' || ls === 'draft';
    return true;
  });

  return (
    <div className="workspace-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.45rem' }}>
            PORTFOLIO DESK
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.35rem' }}>
            My Innovations & Projects
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem' }}>
            Track validation progress, manage lifecycle versions, configure launch setups, and inspect consensus analytics.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('submit')}
          className="btn btn-coral"
          style={{ gap: '0.45rem' }}
        >
          <PlusCircle size={16} /> New Innovation Specimen
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-chip-group" style={{ marginBottom: '2rem' }}>
        {[
          { id: 'ALL', label: `All Projects (${myInnovations.length})` },
          { id: 'VALIDATING', label: `Validating (${myInnovations.filter(i => i.status === 'UNDER_VALIDATION' && i.status !== 'PUBLISHED').length})` },
          { id: 'READY', label: `Ready to Launch (${myInnovations.filter(i => (i.valid_reviews_count >= (i.validation_target || 10) || i.status === 'VALIDATION_COMPLETE') && i.status !== 'PUBLISHED').length})` },
          { id: 'PUBLISHED', label: `Published (${myInnovations.filter(i => i.status === 'PUBLISHED').length})` },
          { id: 'DRAFTS', label: `Drafts (${myInnovations.filter(i => i.status === 'DRAFT').length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`filter-chip ${activeFilter === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Projects List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {isLoading && myInnovations.length === 0 ? (
          <div className="editorial-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: 'var(--bg-white)', borderLeft: '4px solid var(--coral)' }}>
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.75rem' }}>
              SYNCING PORTFOLIO...
            </div>
            <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
              Retrieving your active innovation specimens and telemetry...
            </div>
          </div>
        ) : filteredInnos.length === 0 ? (
          /* ================= EXACT REQUIRED EMPTY STATE ================= */
          <div className="editorial-card" style={{ padding: '4.5rem 3rem', textAlign: 'center', backgroundColor: 'var(--bg-white)', borderLeft: '4px solid var(--coral)' }}>
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '1.25rem' }}>
              ✦ MY PORTFOLIO
            </div>

            <div style={{ lineHeight: 0.98, marginBottom: '1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3rem, 6.2vw, 5rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                NOTHING
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3rem, 6.2vw, 5rem)', fontWeight: 800, color: 'var(--coral)', fontStyle: 'italic', margin: '0.2rem 0' }}>
                HERE.
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3rem, 6.2vw, 5rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                YET.
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', marginBottom: '2.5rem' }}>
              You haven't shared your first idea.
            </p>

            <button
              onClick={() => setActiveTab('submit')}
              className="btn btn-coral btn-lg"
              style={{ padding: '1rem 2.5rem', gap: '0.5rem' }}
            >
              CREATE YOUR FIRST IDEA ↗
            </button>
          </div>
        ) : (
          filteredInnos.map(item => {
            const ink = getCategoryInk(item.category_id, item.category_name);
            const progress = Math.min(100, Math.round(((item.valid_reviews_count || 0) / (item.validation_target || 10)) * 100));
            const stage = (item.project_stage || (item.creation_type === 'PRODUCT' ? 'prototype' : 'idea')).toLowerCase();

            return (
              <div
                key={item.id}
                className="editorial-card"
                style={{
                  padding: '2rem',
                  borderLeft: `4px solid ${ink.hex}`,
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '2rem',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={`category-tag ${ink.tagClass}`}>
                      {item.category_name}
                    </span>
                    <StageBadge stage={stage} />
                    <StatusBadge status={item.status} />
                    <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      v{item.version || 1}.0
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>{item.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', marginBottom: '1.25rem', maxWidth: '680px' }}>
                    {item.short_description || item.problem_statement?.slice(0, 140)}
                  </p>

                  {/* Progress Bar & Review Count */}
                  <div style={{ maxWidth: '420px', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                      <span className="mono" style={{ color: 'var(--text-secondary)' }}>Validation Progress</span>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--coral)' }}>
                        {progress}% ({item.valid_reviews_count || 0}/{item.validation_target || 10} reviews)
                      </span>
                    </div>
                    <div className="progress-track" style={{ height: '6px' }}>
                      <div className="progress-fill" style={{ width: `${progress}%`, backgroundColor: ink.hex }} />
                    </div>
                  </div>

                  <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    Last updated: {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                    {item.published_at && ` • Published live on ${new Date(item.published_at).toLocaleDateString()}`}
                  </div>
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', minWidth: '200px' }}>
                  {/* Dedicated Launch Setup Button */}
                  <button
                    onClick={() => handleLaunchSetup(item)}
                    className="btn btn-coral btn-sm"
                    style={{ gap: '0.45rem', fontWeight: 800 }}
                  >
                    <Rocket size={14} /> {item.status === 'PUBLISHED' ? 'Launch Settings' : 'Launch Project ↗'}
                  </button>

                  <button
                    onClick={() => handleOpen(item.id)}
                    className="btn btn-primary btn-sm"
                    style={{ gap: '0.45rem' }}
                  >
                    View Feedback ({item.valid_reviews_count || 0}) <ArrowUpRight size={14} />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedInnoId(item.id);
                      setActiveTab('insight');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '0.4rem' }}
                  >
                    <FileText size={13} color="var(--rose-pink)" /> AI Insights Report
                  </button>

                  <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', marginTop: '0.2rem' }}>
                    <button
                      onClick={() => handleEdit(item.id)}
                      className="btn btn-secondary btn-sm"
                      title="Edit Specimen"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDuplicate(item)}
                      className="btn btn-secondary btn-sm"
                      title="Duplicate"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--red)' }}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Launch Setup Modal */}
      <LaunchSetupModal
        isOpen={isLaunchModalOpen}
        onClose={() => {
          setIsLaunchModalOpen(false);
          setSelectedForLaunch(null);
        }}
        innovation={selectedForLaunch}
        onPublished={() => refreshData()}
      />
    </div>
  );
}
