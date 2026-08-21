import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { 
  Search, 
  PlusCircle, 
  CheckSquare, 
  Home, 
  Compass, 
  Sparkles, 
  User, 
  Users, 
  ArrowRight,
  ArrowUpRight,
  X,
  Settings,
  FolderKanban,
  MessageSquare,
  Tag,
  Layers,
  Heart,
  ExternalLink
} from 'lucide-react';

/**
 * CommandPalette — Editorial Global Search & Quick Option Spotlight
 * Provides live search across projects, navigation routes, categories, and direct explore queries.
 */
export default function CommandPalette({ setActiveTab, setSelectedInnoId, setExploreFilters }) {
  const { 
    isCommandPaletteOpen, 
    setIsCommandPaletteOpen, 
    setIsApiKeyModalOpen 
  } = useAuth();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [innovations, setInnovations] = useState([]);
  const [categories, setCategories] = useState([]);
  const inputRef = useRef(null);
  const resultsContainerRef = useRef(null);

  // Load real innovations & categories when opening
  const loadData = async () => {
    try {
      const [projRes, catRes] = await Promise.all([
        SupabaseService.getProjects(),
        SupabaseService.getCategories()
      ]);
      const projs = projRes.data || StorageService.getInnovations() || [];
      const cats = catRes.data || StorageService.getCategories() || [];
      setInnovations(projs);
      setCategories(cats);
    } catch (err) {
      setInnovations(StorageService.getInnovations() || []);
      setCategories(StorageService.getCategories() || []);
    }
  };

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      loadData();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  // Global key listener for Ctrl+K / Cmd+K and Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  // Base Workspace Navigation Actions
  const baseActions = [
    {
      id: 'action_explore',
      title: 'Explore Innovation Directory',
      subtitle: 'Browse all hypotheses, prototypes, and live ventures',
      section: 'PAGES & ACTIONS',
      icon: Compass,
      action: () => {
        if (setExploreFilters) setExploreFilters({ search: '', category: 'ALL' });
        setActiveTab('explore');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'action_create',
      title: 'Create New Idea or Project',
      subtitle: 'Submit a new innovation specimen to the validation network',
      section: 'PAGES & ACTIONS',
      icon: PlusCircle,
      action: () => {
        setActiveTab('submit');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'action_dashboard',
      title: 'Home Workspace Desk',
      subtitle: 'View your project statistics, active progress, and telemetry',
      section: 'PAGES & ACTIONS',
      icon: Home,
      action: () => {
        setActiveTab('dashboard');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'action_projects',
      title: 'My Projects Portfolio',
      subtitle: 'Manage, edit, duplicate, or launch your created specimens',
      section: 'PAGES & ACTIONS',
      icon: FolderKanban,
      action: () => {
        setActiveTab('creator');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'action_queue',
      title: 'Peer Review Desk & Queue',
      subtitle: 'Critique assigned projects and earn +10 reputation credits',
      section: 'PAGES & ACTIONS',
      icon: CheckSquare,
      action: () => {
        setActiveTab('queue');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'action_messages',
      title: 'Messages & Notifications',
      subtitle: 'Review feedback alerts, upvotes, and review receipts',
      section: 'PAGES & ACTIONS',
      icon: MessageSquare,
      action: () => {
        setActiveTab('messages');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'action_profile',
      title: 'My Profile & Credentials',
      subtitle: 'Update your professional bio, skills, and disciplines',
      section: 'WORKSPACE',
      icon: User,
      action: () => {
        setActiveTab('profile');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'action_settings',
      title: 'Platform Settings & AI Keys',
      subtitle: 'Configure preferences and Google Gemini API integration',
      section: 'WORKSPACE',
      icon: Settings,
      action: () => {
        setActiveTab('settings');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'action_api',
      title: 'Configure Gemini AI Engine',
      subtitle: 'Set up live neural consensus feedback and synthesis',
      section: 'WORKSPACE',
      icon: Sparkles,
      action: () => {
        setIsApiKeyModalOpen(true);
        setIsCommandPaletteOpen(false);
      }
    }
  ];

  // Category browse options
  const categoryActions = categories.map(cat => ({
    id: `cat_${cat.id}`,
    title: `Explore ${cat.name}`,
    subtitle: `Filter all innovations in ${cat.name}`,
    section: 'CATEGORIES',
    icon: Tag,
    action: () => {
      if (setExploreFilters) {
        setExploreFilters({ search: '', category: cat.id });
      }
      setActiveTab('explore');
      setIsCommandPaletteOpen(false);
    }
  }));

  // Direct search action when user types query
  const directSearchAction = query.trim() ? [{
    id: 'action_search_explore',
    title: `Search "${query.trim()}" in Discovery Matrix`,
    subtitle: 'Open full search & filter results in Explore page',
    section: 'DISCOVERY SEARCH',
    icon: Search,
    action: () => {
      if (setExploreFilters) {
        setExploreFilters({ search: query.trim(), category: 'ALL' });
      }
      setActiveTab('explore');
      setIsCommandPaletteOpen(false);
    }
  }] : [];

  // Filtered Innovations based on user query
  const filteredInnovations = query.trim()
    ? innovations.filter(i => {
        const q = query.toLowerCase();
        const title = (i.title || '').toLowerCase();
        const desc = (i.description || i.short_description || '').toLowerCase();
        const cat = (i.category_name || '').toLowerCase();
        const creator = (i.creator_name || '').toLowerCase();
        const tags = Array.isArray(i.tags) ? i.tags.join(' ').toLowerCase() : (i.tags || '').toLowerCase();
        return title.includes(q) || desc.includes(q) || cat.includes(q) || creator.includes(q) || tags.includes(q);
      }).slice(0, 6).map(i => ({
        id: `inno_${i.id}`,
        title: i.title,
        subtitle: `${i.category_name || 'Innovation'} • ${i.valid_reviews_count || 0} reviews • ${i.upvotes_count || 0} likes`,
        section: 'INNOVATIONS & SPECIMENS',
        icon: Compass,
        action: () => {
          setSelectedInnoId(i.id);
          setActiveTab('detail');
          setIsCommandPaletteOpen(false);
        }
      }))
    : innovations.slice(0, 3).map(i => ({
        id: `recent_${i.id}`,
        title: i.title,
        subtitle: `${i.category_name || 'Featured'} • ${i.valid_reviews_count || 0} reviews`,
        section: 'FEATURED SPECIMENS',
        icon: Compass,
        action: () => {
          setSelectedInnoId(i.id);
          setActiveTab('detail');
          setIsCommandPaletteOpen(false);
        }
      }));

  // Matching actions/pages based on query
  const matchingActions = query.trim()
    ? baseActions.filter(a => 
        a.title.toLowerCase().includes(query.toLowerCase()) || 
        a.subtitle.toLowerCase().includes(query.toLowerCase())
      )
    : baseActions;

  // Matching categories based on query
  const matchingCategories = query.trim()
    ? categoryActions.filter(c => c.title.toLowerCase().includes(query.toLowerCase()))
    : categoryActions.slice(0, 4);

  // Combine into final indexed list of options
  const allItems = query.trim()
    ? [...directSearchAction, ...filteredInnovations, ...matchingActions, ...matchingCategories]
    : [...baseActions.slice(0, 4), ...matchingCategories, ...filteredInnovations, ...baseActions.slice(4)];

  // Keyboard navigation handler
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < allItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : allItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].action();
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsCommandPaletteOpen(false)} style={{ zIndex: 1200 }}>
      <div
        className="command-dialog"
        onClick={e => e.stopPropagation()}
        style={{ 
          padding: '0', 
          maxWidth: '620px', 
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-white)',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-modal)'
        }}
      >
        {/* Top Search Input Bar */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '1.1rem 1.35rem', 
            borderBottom: '1px solid var(--border-hairline)',
            backgroundColor: 'var(--bg-ivory)'
          }}
        >
          <Search size={18} color="var(--coral)" style={{ marginRight: '0.85rem' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, categories, pages, or commands..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-ui)',
              fontSize: '1.02rem',
              color: 'var(--text-primary)',
              background: 'transparent'
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                marginRight: '0.5rem'
              }}
            >
              <X size={15} />
            </button>
          )}
          <span 
            className="mono" 
            style={{ 
              fontSize: '0.72rem', 
              color: 'var(--text-secondary)', 
              backgroundColor: 'var(--bg-cream)',
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-xs)'
            }}
          >
            Esc
          </span>
        </div>

        {/* Dynamic Options List */}
        <div 
          ref={resultsContainerRef}
          style={{ 
            maxHeight: '420px', 
            overflowY: 'auto', 
            padding: '0.75rem' 
          }}
        >
          {allItems.length === 0 ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Compass size={28} color="var(--coral)" style={{ margin: '0 auto 0.75rem auto', opacity: 0.7 }} />
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                No matching options found
              </div>
              <div style={{ fontSize: '0.84rem' }}>
                Try typing a project title, category name (e.g. "Healthcare"), or route (e.g. "Create").
              </div>
            </div>
          ) : (
            allItems.map((item, idx) => {
              const Icon = item.icon || Compass;
              const isSelected = idx === selectedIndex;
              const showSectionHeader = idx === 0 || allItems[idx - 1].section !== item.section;

              return (
                <React.Fragment key={item.id}>
                  {showSectionHeader && (
                    <div 
                      className="editorial-mono-label" 
                      style={{ 
                        padding: '0.65rem 0.85rem 0.35rem 0.85rem', 
                        fontSize: '0.66rem', 
                        color: 'var(--coral)',
                        letterSpacing: '0.1em'
                      }}
                    >
                      ✦ {item.section}
                    </div>
                  )}

                  <div
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'var(--bg-cream)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--coral)' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                      gap: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                      <span 
                        style={{ 
                          color: isSelected ? 'var(--coral)' : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: isSelected ? 'rgba(231, 111, 130, 0.12)' : 'var(--bg-ivory)'
                        }}
                      >
                        <Icon size={15} />
                      </span>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div 
                          style={{ 
                            fontSize: '0.92rem', 
                            fontWeight: 600, 
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div 
                            style={{ 
                              fontSize: '0.76rem', 
                              color: 'var(--text-secondary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <ArrowUpRight 
                      size={14} 
                      color={isSelected ? 'var(--coral)' : 'var(--text-muted)'} 
                      style={{ opacity: isSelected ? 1 : 0.4, transform: isSelected ? 'translate(1px, -1px)' : 'none', transition: 'all 0.15s ease' }} 
                    />
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Interactive Keyboard Help Footer */}
        <div 
          style={{ 
            padding: '0.65rem 1.25rem', 
            backgroundColor: 'var(--bg-ivory)', 
            borderTop: '1px solid var(--border-hairline)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: '0.72rem', 
            color: 'var(--text-secondary)', 
            fontFamily: 'var(--font-mono)' 
          }}
        >
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span><strong style={{ color: 'var(--text-primary)' }}>↑ ↓</strong> Navigate</span>
            <span><strong style={{ color: 'var(--text-primary)' }}>↵ Enter</strong> Select</span>
            <span><strong style={{ color: 'var(--text-primary)' }}>Esc</strong> Close</span>
          </div>
          <span style={{ color: 'var(--coral)', fontWeight: 700 }}>✦ INNOVEXA SEARCH</span>
        </div>
      </div>
    </div>
  );
}
