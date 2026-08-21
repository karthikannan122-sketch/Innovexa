import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { 
  Home, 
  Compass, 
  PlusCircle, 
  FolderKanban, 
  CheckSquare, 
  Sparkles, 
  MessageSquare, 
  User, 
  Settings, 
  ShieldCheck, 
  LogOut, 
  Search, 
  Bell, 
  Menu, 
  X,
  ArrowUpRight
} from 'lucide-react';

/**
 * AppShell — Editorial Architecture with Modern Dark Sidebar & Protected Header
 */
export default function AppShell({ activeTab, setActiveTab, children }) {
  const { 
    currentUser, 
    setIsApiKeyModalOpen, 
    setIsCommandPaletteOpen,
    notifications = [],
    unreadNotificationsCount = 0,
    markNotificationAsRead = () => {},
    markAllNotificationsRead = () => {},
    logout = () => {}
  } = useAuth();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Check pending reviews count for real user
  const myAssignments = currentUser 
    ? (StorageService.getAssignmentsForUser(currentUser.id) || [])
    : [];

  const isPublicPage = activeTab === 'landing' || activeTab === 'login' || activeTab === 'signup' || activeTab === 'onboarding';

  const sidebarNavItems = [
    { key: 'dashboard', label: 'HOME', icon: <Home size={17} /> },
    { key: 'explore', label: 'EXPLORE', icon: <Compass size={17} /> },
    { key: 'submit', label: 'CREATE IDEA', icon: <PlusCircle size={17} /> },
    { key: 'creator', label: 'MY PROJECTS', icon: <FolderKanban size={17} /> },
    { key: 'queue', label: 'REVIEWS', icon: <CheckSquare size={17} />, badge: myAssignments.length },
    { key: 'insight', label: 'INSIGHTS', icon: <Sparkles size={17} /> },
    { key: 'messages', label: 'MESSAGES', icon: <MessageSquare size={17} />, badge: unreadNotificationsCount },
    { key: 'profile', label: 'PROFILE', icon: <User size={17} /> },
    { key: 'settings', label: 'SETTINGS', icon: <Settings size={17} /> }
  ];

  if (currentUser?.role === 'admin') {
    sidebarNavItems.push({ key: 'admin', label: 'ADMIN', icon: <ShieldCheck size={17} /> });
  }

  const notifsList = Array.isArray(notifications) ? notifications : [];

  const handleLogout = () => {
    setActiveTab('landing');
    logout();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-ivory)' }}>
      {/* 1. PUBLIC TOP NAVIGATION (For Landing / Auth Pages) */}
      {isPublicPage ? (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <header
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 800,
              backgroundColor: 'rgba(246, 243, 238, 0.92)',
              backdropFilter: 'blur(12px)',
              borderBottom: '1px solid var(--border-hairline)',
              height: 'var(--topbar-height)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <div className="workspace-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Left Brand */}
              <div 
                onClick={() => setActiveTab('landing')}
                style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ fontFamily: 'var(--font-editorial)', fontWeight: 800, fontSize: '1.45rem', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                  ✦ INNOVEXA
                </span>
                <span className="editorial-mono-label" style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>
                  THE INNOVATION NETWORK
                </span>
              </div>

              {/* Center Navigation */}
              <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <button onClick={() => setActiveTab('explore')} className="btn btn-ghost btn-sm" style={{ fontWeight: 600, letterSpacing: '0.08em' }}>
                  DISCOVER
                </button>
                <button onClick={() => setActiveTab('submit')} className="btn btn-ghost btn-sm" style={{ fontWeight: 600, letterSpacing: '0.08em' }}>
                  CREATE
                </button>
                <button onClick={() => setActiveTab('queue')} className="btn btn-ghost btn-sm" style={{ fontWeight: 600, letterSpacing: '0.08em' }}>
                  VALIDATE
                </button>
                <button onClick={() => setActiveTab('explore')} className="btn btn-ghost btn-sm" style={{ fontWeight: 600, letterSpacing: '0.08em' }}>
                  CONNECT
                </button>
                <button onClick={() => setActiveTab('insight')} className="btn btn-ghost btn-sm" style={{ fontWeight: 600, letterSpacing: '0.08em' }}>
                  INSIGHTS
                </button>
              </nav>

              {/* Right Authentication CTA */}
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                {currentUser ? (
                  <>
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className="btn btn-primary btn-sm"
                      style={{ gap: '0.45rem' }}
                    >
                      WORKSPACE DESK <ArrowUpRight size={14} />
                    </button>
                    <button
                      onClick={handleLogout}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--text-secondary)' }}
                      title="Log Out"
                    >
                      <LogOut size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setActiveTab('login')}
                      className="btn btn-secondary btn-sm"
                      style={{ letterSpacing: '0.04em' }}
                    >
                      SIGN IN ↗
                    </button>
                    <button
                      onClick={() => setActiveTab('signup')}
                      className="btn btn-coral btn-sm"
                      style={{ gap: '0.4rem', letterSpacing: '0.04em' }}
                    >
                      BEGIN YOUR JOURNEY ↗
                    </button>
                  </>
                )}
              </div>
            </div>
          </header>

          <main style={{ flex: 1 }}>
            {children}
          </main>
        </div>
      ) : (
        /* 2. MODERN DARK SIDEBAR & DASHBOARD WORKSPACE */
        <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
          {/* Desktop Modern Dark Sidebar */}
          <aside
            style={{
              width: 'var(--sidebar-width)',
              backgroundColor: 'var(--bg-dark)',
              color: 'var(--text-inverse)',
              borderRight: '1px solid var(--border-dark)',
              padding: '1.75rem 1.15rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              height: '100vh',
              zIndex: 900
            }}
          >
            {/* Top Brand Logo */}
            <div>
              <div
                onClick={() => setActiveTab('landing')}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.6rem',
                  cursor: 'pointer',
                  padding: '0 0.5rem 1.75rem 0.5rem',
                  borderBottom: '1px solid var(--border-dark)',
                  marginBottom: '1.5rem'
                }}
              >
                <span style={{ fontFamily: 'var(--font-editorial)', fontWeight: 800, fontSize: '1.35rem', color: '#FFFFFF', letterSpacing: '-0.03em' }}>
                  ✦ INNOVEXA
                </span>
                <span className="editorial-mono-label" style={{ fontSize: '0.62rem', color: 'var(--text-inverse-muted)' }}>
                  NETWORK
                </span>
              </div>

              {/* Sidebar Navigation */}
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {sidebarNavItems.map(item => {
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isActive ? 'rgba(231, 111, 130, 0.15)' : 'transparent',
                        border: '1px solid',
                        borderColor: isActive ? 'rgba(231, 111, 130, 0.4)' : 'transparent',
                        color: isActive ? 'var(--coral)' : 'var(--text-inverse-muted)',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '0.82rem',
                        letterSpacing: '0.06em',
                        fontFamily: 'var(--font-ui)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ color: isActive ? 'var(--coral)' : 'var(--text-inverse-muted)' }}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>

                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          style={{
                            backgroundColor: 'var(--coral)',
                            color: '#FFFFFF',
                            borderRadius: 'var(--radius-full)',
                            padding: '0.1rem 0.45rem',
                            fontSize: '0.68rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Profile & Logout Bar */}
            <div style={{ borderTop: '1px solid var(--border-dark)', paddingTop: '1.25rem' }}>
              <div
                onClick={() => setActiveTab('profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  marginBottom: '0.85rem'
                }}
              >
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={currentUser?.name}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser?.name || 'Innovator'}
                  </div>
                  <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--coral)' }}>
                    {currentUser?.credits || 0} pts • {currentUser?.reputation_tier || 'NEW'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => setIsApiKeyModalOpen(true)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--text-inverse-muted)', fontSize: '0.72rem', padding: '0.25rem 0.4rem' }}
                >
                  <Sparkles size={13} color="var(--rose-pink)" /> AI Engine
                </button>
                <button
                  onClick={handleLogout}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--coral)', fontSize: '0.72rem', padding: '0.25rem 0.4rem' }}
                  title="Sign Out"
                >
                  <LogOut size={13} /> Exit
                </button>
              </div>
            </div>
          </aside>

          {/* Main Workspace Area with Top Bar */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh' }}>
            {/* Top Bar for Desktop Workspace */}
            <header
              style={{
                height: 'var(--topbar-height)',
                backgroundColor: 'rgba(246, 243, 238, 0.94)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--border-hairline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 2rem',
                position: 'sticky',
                top: 0,
                zIndex: 700
              }}
            >
              {/* Left Search Trigger (Ctrl+K) */}
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.45rem 1rem',
                  backgroundColor: 'var(--bg-cream)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  width: '280px'
                }}
              >
                <Search size={14} />
                <span style={{ flex: 1, textAlign: 'left' }}>Search innovations...</span>
                <span className="mono" style={{ fontSize: '0.68rem', backgroundColor: 'var(--bg-ivory)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                  Ctrl K
                </span>
              </button>

              {/* Right Quick Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Notifications Bell */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setIsNotifOpen(prev => !prev)}
                    className="btn btn-ghost btn-sm"
                    style={{ position: 'relative', padding: '0.45rem' }}
                  >
                    <Bell size={18} color="var(--text-primary)" />
                    {unreadNotificationsCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          width: '8px',
                          height: '8px',
                          backgroundColor: 'var(--coral)',
                          borderRadius: '50%'
                        }}
                      />
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {isNotifOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '120%',
                        width: '320px',
                        backgroundColor: 'var(--bg-white)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)',
                        border: '1px solid var(--border-subtle)',
                        padding: '1rem',
                        zIndex: 999
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <strong style={{ fontSize: '0.85rem' }}>Notifications ({unreadNotificationsCount})</strong>
                        {unreadNotificationsCount > 0 && (
                          <button onClick={markAllNotificationsRead} className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem', padding: '0.1rem 0.3rem' }}>
                            Mark read
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto' }}>
                        {notifsList.length === 0 ? (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
                            No notifications yet.
                          </div>
                        ) : (
                          notifsList.map(n => (
                            <div
                              key={n.id}
                              onClick={() => markNotificationAsRead(n.id)}
                              style={{
                                padding: '0.6rem',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: n.is_read ? 'transparent' : 'var(--bg-cream)',
                                fontSize: '0.78rem',
                                cursor: 'pointer'
                              }}
                            >
                              <p style={{ margin: 0, color: 'var(--text-primary)' }}>{n.message}</p>
                              <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setActiveTab('submit')}
                  className="btn btn-coral btn-sm"
                  style={{ gap: '0.4rem' }}
                >
                  <PlusCircle size={14} /> NEW SPECIMEN
                </button>
              </div>
            </header>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem 2.5rem' }}>
              {children}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
