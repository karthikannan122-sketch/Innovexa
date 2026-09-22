import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { 
  Compass, 
  PlusCircle, 
  CheckSquare, 
  LayoutDashboard, 
  ShieldCheck, 
  Bell, 
  User, 
  Sparkles,
  Users,
  Activity,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { currentUser, setIsPersonaModalOpen, setIsApiKeyModalOpen, apiKey } = useAuth();
  const [pendingAssignmentsCount, setPendingAssignmentsCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const updateQueueCount = () => {
    if (currentUser) {
      const assignments = StorageService.getAssignmentsForUser(currentUser.id);
      setPendingAssignmentsCount(assignments.length);
      const notifs = StorageService.getNotificationsForUser(currentUser.id);
      setNotifications(notifs);
    }
  };

  useEffect(() => {
    updateQueueCount();
    const handler = () => updateQueueCount();
    window.addEventListener('innovexa:datachange', handler);
    return () => window.removeEventListener('innovexa:datachange', handler);
  }, [currentUser]);

  const navItems = [
    { id: 'explore', label: 'Explore Ledger', icon: Compass },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'creator', label: 'My Projects', icon: LayoutDashboard },
    { 
      id: 'queue', 
      label: 'Reviews', 
      icon: CheckSquare, 
      badge: pendingAssignmentsCount > 0 ? pendingAssignmentsCount : null 
    },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  if (currentUser?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Ledger', icon: ShieldCheck });
  }

  const unreadNotifs = notifications.filter(n => !n.is_read).length;

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 8000,
      borderBottom: '1px solid rgba(28, 43, 69, 0.16)',
      boxShadow: '0 4px 16px rgba(28, 43, 69, 0.04)'
    }} className="glass-header">
      {/* Top Precision Ledger Ribbon */}
      <div style={{
        background: 'var(--ink-navy)',
        color: '#ffffff',
        padding: '0.3rem 1.5rem',
        fontSize: '0.73rem',
        fontFamily: 'var(--font-mono)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        letterSpacing: '0.05em',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: 'var(--signal-green)' }}>● SYSTEM STATE: ACTIVE</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span style={{ opacity: 0.85 }}>SPECIMEN VALIDATION LEDGER v1.4</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: apiKey ? 'var(--signal-green)' : '#ffffff',
              cursor: 'pointer',
              fontSize: '0.73rem',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              opacity: 0.9,
              transition: 'opacity 0.15s ease'
            }}
            title="Configure Gemini API or use Rule-based clustering fallback"
          >
            <Sparkles size={12} />
            {apiKey ? 'AI: LIVE GEMINI API' : 'AI: RULE FALLBACK (CONFIG)'}
          </button>

          <span style={{ opacity: 0.4 }}>|</span>

          <button
            onClick={() => setIsPersonaModalOpen(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: 'var(--radius-sm)',
              color: '#ffffff',
              padding: '0.15rem 0.6rem',
              cursor: 'pointer',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={12} />
            Persona: <strong>{currentUser?.name || 'Guest'}</strong>
          </button>
        </div>
      </div>

      {/* Main Floating Navigation Bar */}
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '66px'
      }}>
        {/* Brand Identity */}
        <div 
          onClick={() => setActiveTab('explore')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            background: 'var(--stamp-red)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontFamily: 'var(--font-mono)',
            fontWeight: '700',
            fontSize: '1.05rem',
            transform: 'rotate(-4deg)',
            boxShadow: '0 2px 6px rgba(178, 58, 46, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
          }}>
            IX
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '1.38rem',
              lineHeight: 1,
              color: 'var(--ink-navy)',
              letterSpacing: '-0.025em'
            }}>
              INNOVEXA
            </div>
            <div className="label-mono" style={{ fontSize: '0.66rem', letterSpacing: '0.08em', marginTop: '2px' }}>
              The Validation Ledger
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`btn btn-sm ${isActive ? 'btn-secondary' : 'btn-outline'}`}
                style={{
                  border: isActive ? '1px solid rgba(28, 43, 69, 0.22)' : '1px solid transparent',
                  backgroundColor: isActive ? 'var(--ledger-paper-raised)' : 'transparent',
                  color: isActive ? 'var(--ink-navy)' : 'var(--slate)',
                  boxShadow: isActive ? 'var(--shadow-btn-secondary)' : 'none',
                  position: 'relative',
                  fontWeight: isActive ? '700' : '600'
                }}
              >
                <Icon size={15} />
                <span>{item.label}</span>
                {item.badge && (
                  <span style={{
                    background: 'var(--stamp-red)',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    padding: '0.1rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                    marginLeft: '0.25rem',
                    fontWeight: 700,
                    boxShadow: '0 1px 3px rgba(178, 58, 46, 0.3)'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Notifications & User Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Notification Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.45rem', position: 'relative' }}
              title="Notifications"
            >
              <Bell size={17} />
              {unreadNotifs > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '14px',
                  height: '14px',
                  background: 'var(--stamp-red)',
                  color: '#ffffff',
                  borderRadius: '50%',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifMenu && (
              <div 
                className="ledger-card card-paper-white"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '115%',
                  width: '320px',
                  maxHeight: '360px',
                  overflowY: 'auto',
                  padding: '1rem',
                  zIndex: 9999,
                  boxShadow: 'var(--shadow-modal)',
                  border: '1px solid rgba(28, 43, 69, 0.2)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div className="label-mono">Activity Ledger</div>
                  <button 
                    style={{ background: 'none', border: 'none', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--graph-blue)' }}
                    onClick={() => {
                      notifications.forEach(n => StorageService.markNotificationRead(n.id));
                      if (currentUser?.id) {
                        SupabaseService.markAllNotificationsAsRead(currentUser.id);
                      }
                      updateQueueCount();
                      setShowNotifMenu(false);
                    }}
                  >
                    Mark all read
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--slate)', textAlign: 'center', padding: '1rem 0' }}>
                    No notifications recorded.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      style={{
                        padding: '0.6rem 0',
                        borderBottom: '1px solid var(--slate-divider)',
                        fontSize: '0.82rem'
                      }}
                    >
                      <div style={{ color: 'var(--ink-navy)', fontWeight: n.is_read ? 'normal' : '600' }}>
                        {n.message}
                      </div>
                      <div className="label-mono" style={{ fontSize: '0.68rem', marginTop: '0.2rem' }}>
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User Profile Mini Badge */}
          <div
            onClick={() => setActiveTab('profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              cursor: 'pointer',
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(28, 43, 69, 0.16)',
              backgroundColor: 'var(--ledger-paper-raised)',
              boxShadow: 'var(--shadow-btn-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            <img
              src={currentUser?.avatar}
              alt={currentUser?.name}
              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.1 }}>
                {currentUser?.name?.split(' ')[0]}
              </span>
              <span className="label-mono" style={{ fontSize: '0.66rem', color: 'var(--stamp-red)' }}>
                {currentUser?.credits || 0} pts
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
