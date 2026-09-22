import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import CommandPalette from '../components/CommandPalette';
import ApiKeyModal from '../components/ApiKeyModal';
import PersonaSwitcherModal from '../components/PersonaSwitcherModal';
import {
  Home, Compass, PlusCircle, CheckSquare, Sparkles, MessageSquare,
  User, Settings, ShieldCheck, LogOut, Search, Bell, Menu, X, Users,
  BarChart2, Folder, ArrowUpRight, ChevronRight
} from 'lucide-react';

/** AppLayout — Light editorial sidebar navigation for authenticated workspace */
export default function AppLayout() {
  const {
    currentUser,
    setIsCommandPaletteOpen,
    notifications = [],
    unreadNotificationsCount = 0,
    unreadMessagesCount = 0,
    markNotificationAsRead = () => {},
    markAllNotificationsRead = () => {},
    logout = () => {}
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Close notif dropdown on outside click
  useEffect(() => {
    const handle = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const myAssignments = currentUser
    ? (StorageService.getAssignmentsForUser(currentUser.id) || [])
    : [];

  const navItems = [
    { to: '/home',      label: 'Home',         icon: <Home size={16} />,        section: null },
    { to: '/explore',   label: 'Explore',       icon: <Compass size={16} />,     section: 'discover' },
    { to: '/create',    label: 'Create Idea',   icon: <PlusCircle size={16} />,  section: 'create' },
    { to: '/reviews',   label: 'Reviews',       icon: <CheckSquare size={16} />, section: 'validate', badge: myAssignments.length },
    { to: '/insights',  label: 'Insights',      icon: <BarChart2 size={16} />,   section: 'insights' },
    { to: '/community', label: 'Community',     icon: <Users size={16} />,       section: 'connect' },
    { to: '/messages',  label: 'Messages',      icon: <MessageSquare size={16}/>, section: null, badge: unreadMessagesCount },
    { to: '/profile',   label: 'Profile',       icon: <User size={16} />,        section: null },
    { to: '/settings',  label: 'Settings',      icon: <Settings size={16} />,    section: null },
  ];

  if (currentUser?.role === 'admin') {
    navItems.push({ to: '/admin', label: 'Admin', icon: <ShieldCheck size={16} />, section: null });
  }

  const notifsList = Array.isArray(notifications) ? notifications : [];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  /* Avatar initials */
  const initials = (currentUser?.full_name || currentUser?.name || 'U')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  /* Section color accent */
  const sectionColors = {
    discover: 'var(--blue)',
    create:   'var(--coral)',
    validate: 'var(--teal)',
    insights: 'var(--amber)',
    connect:  'var(--lavender)',
  };

  const SidebarContent = ({ isMobile = false }) => (
    <div style={{
      width: isMobile ? '100%' : 'var(--sidebar-width)',
      height: '100%',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-hairline)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1.15rem 1rem', borderBottom: '1px solid var(--border-hairline)', flexShrink: 0 }}>
        <button
          onClick={() => { navigate('/home'); if (isMobile) setIsMobileSidebarOpen(false); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: '0.35rem', padding: 0 }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--coral)', letterSpacing: '0.12em' }}>✦</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '1.15rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            INNOVEXA
          </span>
        </button>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '0.15rem', paddingLeft: '0.9rem' }}>
          Innovation Network
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0.65rem 0.6rem', overflowY: 'auto' }}>
        {navItems.map(item => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/home' && location.pathname.startsWith(item.to));
          const accentColor = item.section ? sectionColors[item.section] : 'var(--coral)';
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => { if (isMobile) setIsMobileSidebarOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.6rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.84rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? accentColor : 'var(--text-secondary)',
                backgroundColor: isActive ? `rgba(${isActive ? '234,102,120' : '23,25,37'}, 0.06)` : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                marginBottom: '1px',
                position: 'relative',
              }}
              className="sidebar-nav-item-raw"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ color: isActive ? accentColor : 'var(--text-muted)', flexShrink: 0, display: 'flex' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span style={{
                  backgroundColor: 'var(--coral)',
                  color: '#fff',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.1rem 0.45rem',
                  fontSize: '0.66rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  lineHeight: 1.4
                }}>
                  {item.badge}
                </span>
              )}
              {isActive && (
                <span style={{
                  position: 'absolute', left: 0, top: '18%', bottom: '18%',
                  width: '2px', borderRadius: '0 2px 2px 0',
                  backgroundColor: accentColor
                }} />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div style={{ padding: '0.85rem 0.75rem', borderTop: '1px solid var(--border-hairline)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.65rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-dark)', color: 'var(--text-inverse)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.72rem',
            flexShrink: 0
          }}>
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : initials}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser?.full_name || currentUser?.name || 'Innovator'}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              @{currentUser?.username || 'member'}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
            padding: '0.45rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)',
            backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
            fontFamily: 'var(--font-ui)', fontSize: '0.78rem', fontWeight: 500,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>

      {/* 1. DESKTOP SIDEBAR */}
      <aside style={{
        width: 'var(--sidebar-width)',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        display: 'none',
        flexDirection: 'column',
      }} className="lg:flex md:flex">
        <SidebarContent />
      </aside>

      {/* 2. MOBILE SIDEBAR DRAWER */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              style={{
                position: 'fixed', inset: 0, backgroundColor: 'rgba(23,25,37,0.4)',
                zIndex: 800, backdropFilter: 'blur(2px)'
              }}
            />
            <motion.div
              key="drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px',
                zIndex: 850, display: 'flex', flexDirection: 'column'
              }}
            >
              <div style={{ position: 'absolute', top: '0.75rem', right: '-2.5rem' }}>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-full)', width: '32px', height: '32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}
                >
                  <X size={16} color="var(--text-primary)" />
                </button>
              </div>
              <SidebarContent isMobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh' }}>

        {/* Topbar */}
        <header style={{
          height: 'var(--topbar-height)',
          backgroundColor: 'rgba(247,244,238,0.94)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--border-hairline)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 1.5rem',
          position: 'sticky', top: 0, zIndex: 700
        }}>
          {/* Left — Hamburger + Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '0.4rem', color: 'var(--text-secondary)', display: 'flex',
                borderRadius: 'var(--radius-sm)'
              }}
              className="md:hidden"
            >
              <Menu size={20} />
            </button>

            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.42rem 0.85rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-ui)',
                transition: 'all 0.15s ease',
                maxWidth: '280px',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-medium)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Search size={13} />
              <span style={{ flex: 1, textAlign: 'left' }}>Search innovations...</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                backgroundColor: 'var(--bg-tertiary)', padding: '0.1rem 0.3rem', borderRadius: '3px',
                letterSpacing: '0.04em', color: 'var(--text-muted)'
              }}>⌘K</span>
            </button>
          </div>

          {/* Right — Notifications + CTA + Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>

            {/* Notifications */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(prev => !prev)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '0.4rem', color: 'var(--text-secondary)', position: 'relative',
                  borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <Bell size={18} />
                {unreadNotificationsCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '4px', right: '4px',
                    width: '7px', height: '7px',
                    backgroundColor: 'var(--coral)', borderRadius: '50%',
                    border: '1.5px solid var(--bg-secondary)'
                  }} />
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                      width: '320px', backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                      border: '1px solid var(--border-subtle)',
                      padding: '1rem', zIndex: 999
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        Notifications
                        {unreadNotificationsCount > 0 && (
                          <span style={{ marginLeft: '0.4rem', backgroundColor: 'var(--coral)', color: '#fff', borderRadius: 'var(--radius-full)', padding: '0.05rem 0.45rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                            {unreadNotificationsCount}
                          </span>
                        )}
                      </span>
                      {unreadNotificationsCount > 0 && (
                        <button
                          onClick={markAllNotificationsRead}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--blue)', letterSpacing: '0.04em', textTransform: 'uppercase' }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '280px', overflowY: 'auto' }}>
                      {notifsList.length === 0 ? (
                        <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.25rem 0' }}>
                          All caught up ✓
                        </div>
                      ) : notifsList.slice(0, 12).map(n => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id)}
                          style={{
                            padding: '0.55rem 0.65rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: (!n.is_read && !n.read) ? 'var(--blue-pale)' : 'transparent',
                            fontSize: '0.8rem', cursor: 'pointer',
                            borderLeft: (!n.is_read && !n.read) ? '2px solid var(--blue)' : '2px solid transparent',
                            transition: 'all 0.12s ease'
                          }}
                        >
                          <p style={{ margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', lineHeight: 1.4 }}>{n.message}</p>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Create CTA */}
            <button
              onClick={() => navigate('/create')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.42rem 0.95rem',
                backgroundColor: 'var(--coral)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.78rem',
                cursor: 'pointer', transition: 'all 0.18s ease', letterSpacing: '0.02em'
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#D94F63'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--coral)'; }}
            >
              <PlusCircle size={13} />
              <span className="hidden sm:inline">CREATE</span>
            </button>

            {/* Avatar */}
            <button
              onClick={() => navigate('/profile')}
              style={{
                width: '34px', height: '34px', borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-dark)', color: 'var(--text-inverse)',
                border: '2px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.72rem',
                cursor: 'pointer', flexShrink: 0, overflow: 'hidden',
                transition: 'border-color 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--coral)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            >
              {currentUser?.avatar_url ? (
                <img src={currentUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : initials}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '2rem 2rem', minWidth: 0 }}>
          <Outlet />
        </main>
      </div>

      {/* Global Modals */}
      <CommandPalette />
      <ApiKeyModal />
      <PersonaSwitcherModal />
    </div>
  );
}
