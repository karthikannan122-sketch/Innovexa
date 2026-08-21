import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { 
  MessageSquare, 
  Bell, 
  Check, 
  Send, 
  User, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Inbox,
  Clock,
  Filter,
  Plus,
  Search,
  X,
  Users,
  ArrowUpRight,
  ThumbsUp,
  Share2
} from 'lucide-react';

/**
 * MessagesPage — Unified Communications Desk
 * Sections:
 * 1. DIRECT MESSAGES: Real-time 1-on-1 conversations with community members, founders & reviewers.
 * 2. COMMUNITY DISCUSSIONS: Live stream of community topics, with direct send & receive capabilities.
 * 3. NOTIFICATIONS: Network feedback alerts and milestone updates.
 */
export default function MessagesPage({ setActiveTab, setSelectedInnoId, selectedRecipientId, setSelectedRecipientId }) {
  const { currentUser, showToast, markNotificationAsRead, markAllNotificationsRead } = useAuth();
  const [activeTab, setActiveMessagesTab] = useState('MESSAGES'); // 'MESSAGES' | 'COMMUNITY' | 'NOTIFICATIONS'
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Chat / Direct Messages State
  const [activeThreadId, setActiveThreadId] = useState(selectedRecipientId || null);
  const [messageInput, setMessageInput] = useState('');
  const [sendType, setSendType] = useState('message'); // 'message' | 'suggestion'
  const [conversations, setConversations] = useState([]);
  const [activeMessages, setActiveMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [availableFounders, setAvailableFounders] = useState([]);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const messagesEndRef = useRef(null);

  // Community Feed State inside Messages
  const [communityPosts, setCommunityPosts] = useState([]);
  const [selectedCommunityPost, setSelectedCommunityPost] = useState(null);
  const [communityComments, setCommunityComments] = useState([]);
  const [communityCommentInput, setCommunityCommentInput] = useState('');
  const [isSubmittingCommunityReply, setIsSubmittingCommunityReply] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadNotifs = async () => {
    if (!currentUser) return;
    try {
      const { data } = await SupabaseService.getNotifications(currentUser.id);
      setNotifications(data || []);
    } catch (err) {
      console.warn('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversations = async () => {
    if (!currentUser) return;
    try {
      const { data } = await SupabaseService.getConversations(currentUser.id);
      const convList = data || [];
      setConversations(convList);

      if (selectedRecipientId) {
        setActiveThreadId(selectedRecipientId);
      } else if (convList.length > 0 && !activeThreadId) {
        setActiveThreadId(convList[0].id);
      }
    } catch (err) {
      console.warn('Error loading conversations:', err);
    }
  };

  const loadFoundersAndContacts = async () => {
    try {
      const [profRes, projRes, commRes] = await Promise.all([
        SupabaseService.getProfiles(),
        SupabaseService.getProjects(),
        SupabaseService.getCommunityPosts()
      ]);

      const dbProfiles = profRes.data || [];
      const allProjects = projRes.data || StorageService.getInnovations() || [];
      const allPosts = commRes.data || StorageService.getCommunityPosts() || [];
      const foundersMap = new Map();

      // 1. Fetch all real profiles from Supabase database (public.profiles)
      dbProfiles.forEach(prof => {
        const pId = prof.id;
        if (pId && pId !== currentUser?.id && !foundersMap.has(pId)) {
          const name = (prof.full_name || prof.name || prof.username || '').trim() || 'Community Innovator';
          foundersMap.set(pId, {
            id: pId,
            name: name,
            avatar: prof.avatar_url || prof.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
            headline: prof.bio || prof.headline || 'Registered Member',
            type: prof.role || 'Member',
            bio: prof.bio || ''
          });
        }
      });

      // 2. Collect project creators
      allProjects.forEach(p => {
        const fId = p.user_id || p.creator_id;
        if (fId && fId !== currentUser?.id && !foundersMap.has(fId)) {
          const name = (p.creator_name || '').trim() || 'Project Founder';
          foundersMap.set(fId, {
            id: fId,
            name: name,
            avatar: p.creator_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
            headline: p.title ? `Founder of ${p.title}` : 'Innovator',
            type: 'Founder',
            bio: p.description || ''
          });
        }
      });

      // 3. Collect community authors
      allPosts.forEach(post => {
        const aId = post.author_id || post.user_id;
        if (aId && aId !== currentUser?.id && !foundersMap.has(aId)) {
          const name = (post.author_name || '').trim() || 'Community Author';
          foundersMap.set(aId, {
            id: aId,
            name: name,
            avatar: post.author_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
            headline: post.author_headline || 'Community Contributor',
            type: 'Contributor',
            bio: post.content || ''
          });
        }
      });

      // 4. Default verified validators for peer matchmaking if directory is empty
      if (foundersMap.size === 0) {
        if (currentUser?.id !== 'usr_sarah_reviewer') {
          foundersMap.set('usr_sarah_reviewer', {
            id: 'usr_sarah_reviewer',
            name: 'Sarah Reviewer',
            avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20Reviewer&backgroundColor=20212a,58b8ad,9b8ae5',
            headline: 'Healthcare & AI Validator',
            type: 'Validator',
            bio: 'Healthcare & AI Validator'
          });
        }
        if (currentUser?.id !== 'usr_alex_validator') {
          foundersMap.set('usr_alex_validator', {
            id: 'usr_alex_validator',
            name: 'Alex Tech Validator',
            avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Alex%20Tech&backgroundColor=20212a,7186d8,69b89a',
            headline: 'Distributed Systems Architect',
            type: 'Architect',
            bio: 'Distributed Systems Architect'
          });
        }
      }

      setAvailableFounders(Array.from(foundersMap.values()));
    } catch (e) {
      console.warn('Error loading founders and profiles list:', e);
    }
  };

  const loadCommunityFeed = async () => {
    try {
      const { data } = await SupabaseService.getCommunityPosts();
      const list = data || StorageService.getCommunityPosts() || [];
      setCommunityPosts(list);
      if (list.length > 0 && !selectedCommunityPost) {
        setSelectedCommunityPost(list[0]);
      }
    } catch (e) {
      console.warn('Error loading community feed for messages:', e);
    }
  };

  const loadThreadMessages = async (otherUserId) => {
    if (!currentUser || !otherUserId) return;
    try {
      const { data } = await SupabaseService.getMessages(currentUser.id, otherUserId);
      setActiveMessages(data || []);
      await SupabaseService.markMessagesAsRead(currentUser.id, otherUserId);
      setTimeout(scrollToBottom, 80);
    } catch (err) {
      console.warn('Error loading thread messages:', err);
    }
  };

  // Load comments for selected community post
  useEffect(() => {
    if (selectedCommunityPost) {
      const comms = StorageService.getCommunityComments(selectedCommunityPost.id);
      setCommunityComments(comms);
    }
  }, [selectedCommunityPost]);

  useEffect(() => {
    loadNotifs();
    loadConversations();
    loadFoundersAndContacts();
    loadCommunityFeed();

    if (!currentUser) return;

    // Realtime subscriptions
    const unsubNotifs = SupabaseService.subscribeToNotifications(currentUser.id, () => {
      loadNotifs();
    });

    const unsubMsgs = SupabaseService.subscribeToMessages(currentUser.id, () => {
      loadConversations();
      if (activeThreadId) {
        loadThreadMessages(activeThreadId);
      }
    });

    const handler = (e) => {
      if (e.detail?.entity === 'notifications') loadNotifs();
      if (e.detail?.entity === 'messages') {
        loadConversations();
        if (activeThreadId) loadThreadMessages(activeThreadId);
      }
      if (e.detail?.entity === 'community') {
        loadCommunityFeed();
        if (selectedCommunityPost) {
          const comms = StorageService.getCommunityComments(selectedCommunityPost.id);
          setCommunityComments(comms);
        }
      }
    };
    window.addEventListener('innovexa:datachange', handler);

    return () => {
      unsubNotifs();
      unsubMsgs();
      window.removeEventListener('innovexa:datachange', handler);
    };
  }, [currentUser]);

  useEffect(() => {
    if (selectedRecipientId) {
      setActiveThreadId(selectedRecipientId);
      setActiveMessagesTab('MESSAGES');
    }
  }, [selectedRecipientId]);

  useEffect(() => {
    if (activeThreadId && currentUser) {
      loadThreadMessages(activeThreadId);
    }
  }, [activeThreadId, currentUser]);

  const handleStartThread = (founder) => {
    setActiveThreadId(founder.id);
    if (setSelectedRecipientId) setSelectedRecipientId(founder.id);
    setActiveMessagesTab('MESSAGES');
    setIsNewChatModalOpen(false);
    showToast(`Started direct conversation with ${founder.name}.`, 'info');
  };

  const handleMarkAllRead = async () => {
    if (currentUser) {
      await SupabaseService.markAllNotificationsAsRead(currentUser.id);
      if (markAllNotificationsRead) markAllNotificationsRead();
      loadNotifs();
      showToast('All notifications marked as read.', 'success');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeThreadId || !currentUser || isSending) return;

    const content = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    try {
      const res = await SupabaseService.sendMessage(activeThreadId, content, sendType);

      if (res?.error) {
        showToast(res.error.message || 'Message could not be sent.', 'error');
      } else {
        await loadThreadMessages(activeThreadId);
        await loadConversations();
      }
    } catch (err) {
      console.warn('Error sending message:', err);
      showToast('Message could not be sent.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Submit reply into community discussion from Messages hub
  const handleSendCommunityReply = async (e) => {
    e.preventDefault();
    if (!communityCommentInput.trim() || !selectedCommunityPost || !currentUser || isSubmittingCommunityReply) return;

    const content = communityCommentInput.trim();
    setCommunityCommentInput('');
    setIsSubmittingCommunityReply(true);

    try {
      const res = await SupabaseService.addCommunityComment({
        postId: selectedCommunityPost.id,
        authorId: currentUser.id,
        authorName: currentUser.name || currentUser.full_name || 'Community Member',
        authorAvatar: currentUser.avatar || currentUser.avatar_url || '',
        content: content
      });

      if (res.data) {
        const comms = StorageService.getCommunityComments(selectedCommunityPost.id);
        setCommunityComments(comms);
        showToast('Insight posted to Community Discussion!', 'success');
      }
    } catch (e) {
      console.warn('Error submitting community reply:', e);
      showToast('Could not post insight to community topic.', 'error');
    } finally {
      setIsSubmittingCommunityReply(false);
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n) return;
    try {
      if (currentUser) {
        await SupabaseService.markNotificationAsRead(n.id, currentUser.id);
        if (markNotificationAsRead) markNotificationAsRead(n.id);
        loadNotifs();
      }

      // If direct message notification, open conversation
      if ((n.type || '').toUpperCase().includes('MESSAGE')) {
        setActiveMessagesTab('MESSAGES');
        const senderId = n.sender_id || n.data?.sender_id;
        if (senderId) {
          setActiveThreadId(senderId);
        }
        return;
      }

      // If target project is linked
      const targetProjectId = n.project_id || n.innovation_id || n.data?.project_id;
      if (targetProjectId) {
        if (setSelectedInnoId) setSelectedInnoId(targetProjectId);
        setActiveTab('detail');
      }
    } catch (e) {
      console.warn('Error handling notification click:', e);
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filterType === 'UNREAD') return !n.is_read && !n.read;
    if (filterType === 'MESSAGES') return (n.type || '').toLowerCase().includes('message');
    if (filterType === 'REVIEWS') return (n.type || '').toLowerCase().includes('review');
    if (filterType === 'LIKES') return (n.type || '').toLowerCase().includes('like');
    return true;
  });

  const filteredContacts = availableFounders.filter(f => {
    if (!f || !f.id || f.id === currentUser?.id) return false;
    if (!contactSearch.trim()) return true;
    const q = contactSearch.toLowerCase().trim();
    return (
      (f.name || '').toLowerCase().includes(q) ||
      (f.headline || '').toLowerCase().includes(q) ||
      (f.type || '').toLowerCase().includes(q) ||
      (f.bio || '').toLowerCase().includes(q)
    );
  });

  const activeConversation = conversations.find(c => c.id === activeThreadId) || 
    (availableFounders.find(f => f.id === activeThreadId) ? {
      id: activeThreadId,
      user: availableFounders.find(f => f.id === activeThreadId),
      lastMessage: 'Starting conversation...'
    } : null);

  return (
    <div className="workspace-container" style={{ maxWidth: '1120px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.45rem' }}>
            COMMUNICATIONS & COMMUNITY DESK
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.35rem' }}>
            Messages & Community Exchange
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem' }}>
            Direct peer messaging, live community topic dispatching, and feedback alerts.
          </p>
        </div>

        {/* Section Toggle */}
        <div style={{ display: 'flex', gap: '0.35rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', padding: '0.25rem', backgroundColor: 'var(--bg-cream)' }}>
          <button
            onClick={() => setActiveMessagesTab('MESSAGES')}
            style={{
              padding: '0.45rem 1.1rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              backgroundColor: activeTab === 'MESSAGES' ? 'var(--bg-white)' : 'transparent',
              color: activeTab === 'MESSAGES' ? 'var(--coral)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'MESSAGES' ? 700 : 500,
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'MESSAGES' ? 'var(--shadow-sm)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <MessageSquare size={14} /> Direct Chats ({conversations.length})
          </button>

          <button
            onClick={() => setActiveMessagesTab('COMMUNITY')}
            style={{
              padding: '0.45rem 1.1rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              backgroundColor: activeTab === 'COMMUNITY' ? 'var(--bg-white)' : 'transparent',
              color: activeTab === 'COMMUNITY' ? 'var(--teal)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'COMMUNITY' ? 700 : 500,
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'COMMUNITY' ? 'var(--shadow-sm)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Users size={14} /> Community Topics ({communityPosts.length})
          </button>

          <button
            onClick={() => setActiveMessagesTab('NOTIFICATIONS')}
            style={{
              padding: '0.45rem 1.1rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              backgroundColor: activeTab === 'NOTIFICATIONS' ? 'var(--bg-white)' : 'transparent',
              color: activeTab === 'NOTIFICATIONS' ? 'var(--coral)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'NOTIFICATIONS' ? 700 : 500,
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'NOTIFICATIONS' ? 'var(--shadow-sm)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Bell size={14} /> Alerts ({notifications.filter(n => !n.is_read && !n.read).length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. DIRECT MESSAGES TAB (SEND & RECEIVE 1-ON-1)                            */}
      {/* ========================================================================= */}
      {activeTab === 'MESSAGES' && (
        <div className="editorial-card" style={{ padding: '0', overflow: 'hidden', minHeight: '580px', display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) 1fr' }}>
          
          {/* Threads Column */}
          <div style={{ borderRight: '1px solid var(--border-hairline)', backgroundColor: 'var(--bg-cream)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="editorial-mono-label" style={{ fontSize: '0.72rem' }}>
                DIRECT THREADS ({conversations.length})
              </div>
              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(true)}
                className="btn btn-coral btn-sm"
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem', gap: '0.25rem' }}
              >
                <Plus size={12} /> New Chat
              </button>
            </div>

            {conversations.length === 0 ? (
              <div style={{ padding: '1.5rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                No conversations yet. Connect with a founder or community contributor below.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: '280px' }}>
                {conversations.map(c => (
                  <div
                    key={c.id}
                    onClick={() => setActiveThreadId(c.id)}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: activeThreadId === c.id ? 'var(--bg-white)' : 'transparent',
                      border: '1px solid',
                      borderColor: activeThreadId === c.id ? 'var(--border-subtle)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                      {c.user?.avatar ? (
                        <img src={c.user.avatar} alt="" style={{ width: '26px', height: '26px', borderRadius: '50%' }} />
                      ) : (
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--coral)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700 }}>
                          {(c.user?.name || 'I').charAt(0)}
                        </div>
                      )}
                      <strong style={{ fontSize: '0.88rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.user?.name || 'Innovator'}
                      </strong>
                      {c.unreadCount > 0 && (
                        <span style={{ fontSize: '0.68rem', backgroundColor: 'var(--coral)', color: '#FFF', borderRadius: '10px', padding: '0.1rem 0.4rem', fontWeight: 700 }}>
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                      {c.lastMessage}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Network Innovators & Community Directory */}
            {availableFounders.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '1rem', marginTop: 'auto' }}>
                <div className="editorial-mono-label" style={{ marginBottom: '0.6rem', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  COMMUNITY NETWORK
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {availableFounders.slice(0, 5).map(f => (
                    <div
                      key={f.id}
                      onClick={() => handleStartThread(f)}
                      style={{
                        padding: '0.5rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: activeThreadId === f.id ? 'var(--bg-white)' : 'rgba(0,0,0,0.02)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                        <img src={f.avatar} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {f.name}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--coral)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        Chat ↗
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Messages Conversation Column */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', backgroundColor: 'var(--bg-white)', minWidth: 0 }}>
            {activeConversation ? (
              <>
                {/* Active Chat Header */}
                <div style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {activeConversation.user?.avatar ? (
                      <img src={activeConversation.user.avatar} alt="" style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
                    ) : (
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'var(--coral)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700 }}>
                        {(activeConversation.user?.name || 'I').charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 style={{ fontSize: '1.15rem', margin: 0 }}>{activeConversation.user?.name || 'Innovator'}</h3>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {activeConversation.user?.headline || 'Community Innovator'}
                      </span>
                    </div>
                  </div>

                  <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--status-success)' }} />
                    Connected
                  </span>
                </div>

                {/* Message Bubble History */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', maxHeight: '420px', paddingRight: '0.25rem' }}>
                  {activeMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 1rem', fontSize: '0.88rem' }}>
                      Start your conversation with {activeConversation.user?.name || 'this innovator'}. Messages are delivered in real time.
                    </div>
                  ) : (
                    activeMessages.map((m, idx) => {
                      const isMe = m.sender_id === currentUser?.id || m.sender === 'me';
                      const isSuggestion = m.message_type === 'suggestion';
                      return (
                        <div
                          key={m.id || idx}
                          style={{
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            backgroundColor: isMe ? (isSuggestion ? 'var(--navy)' : 'var(--coral)') : (isSuggestion ? '#F0F3FF' : 'var(--bg-cream)'),
                            color: isMe ? '#FFFFFF' : 'var(--text-primary)',
                            border: isSuggestion && !isMe ? '1px solid #C7D2FE' : 'none',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            maxWidth: '78%',
                            fontSize: '0.88rem',
                            boxShadow: 'var(--shadow-sm)',
                            wordBreak: 'break-word'
                          }}
                        >
                          {isSuggestion && (
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, opacity: 0.9, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              💡 SUGGESTION
                            </div>
                          )}
                          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{m.content || m.text}</p>
                          <span style={{ fontSize: '0.68rem', opacity: 0.8, display: 'block', textAlign: 'right', marginTop: '0.25rem' }}>
                            {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (m.time || 'Now')}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Send Mode Toggle & Input Box */}
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => setSendType('message')}
                    className="btn btn-ghost btn-sm"
                    style={{
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: sendType === 'message' ? 'var(--coral)' : 'var(--text-secondary)',
                      backgroundColor: sendType === 'message' ? 'rgba(235, 94, 65, 0.08)' : 'transparent',
                      borderRadius: '4px'
                    }}
                  >
                    Direct Message
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendType('suggestion')}
                    className="btn btn-ghost btn-sm"
                    style={{
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: sendType === 'suggestion' ? 'var(--navy)' : 'var(--text-secondary)',
                      backgroundColor: sendType === 'suggestion' ? '#EEF2FF' : 'transparent',
                      borderRadius: '4px'
                    }}
                  >
                    💡 Send Suggestion
                  </button>
                </div>

                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    placeholder={sendType === 'suggestion' ? `Type your suggestion for ${activeConversation.user?.name || 'innovator'}...` : `Type your message to ${activeConversation.user?.name || 'innovator'}...`}
                    className="form-input"
                    style={{ flex: 1 }}
                    disabled={isSending}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-coral" disabled={isSending || !messageInput.trim()}>
                    <Send size={15} />
                  </button>
                </form>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', padding: '3rem', textAlign: 'center' }}>
                <MessageSquare size={36} color="var(--border-subtle)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>No active thread selected</h3>
                <p style={{ fontSize: '0.88rem', maxWidth: '360px', margin: '0 auto 1.5rem auto' }}>
                  Choose a conversation from the left or click "New Chat" to connect with founders and reviewers.
                </p>
                <button onClick={() => setIsNewChatModalOpen(true)} className="btn btn-coral btn-sm">
                  <Plus size={14} /> Start New Conversation
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. COMMUNITY TOPICS TAB (SEND & RECEIVE DISCUSSIONS)                       */}
      {/* ========================================================================= */}
      {activeTab === 'COMMUNITY' && (
        <div className="editorial-card" style={{ padding: '0', overflow: 'hidden', minHeight: '580px', display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr' }}>
          
          {/* Topics List */}
          <div style={{ borderRight: '1px solid var(--border-hairline)', backgroundColor: 'var(--bg-cream)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <div className="editorial-mono-label" style={{ fontSize: '0.72rem', color: 'var(--teal)' }}>
                COMMUNITY CHANNELS ({communityPosts.length})
              </div>
              <button
                onClick={() => setActiveTab('community')}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.72rem', color: 'var(--teal)', fontWeight: 700, padding: 0 }}
              >
                Community Page ↗
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: '480px' }}>
              {communityPosts.map(post => {
                const isSelected = selectedCommunityPost?.id === post.id;
                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedCommunityPost(post)}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'var(--bg-white)' : 'transparent',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--teal)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span className="category-tag" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                        {post.category_name || 'General'}
                      </span>
                      <span className="mono" style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem', lineHeight: 1.3, wordBreak: 'break-word' }}>
                      {post.title}
                    </strong>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      <span>By {post.author_name}</span>
                      <span>{post.comments_count || 0} replies</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Topic Detail & Live Comments Thread */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.75rem', backgroundColor: 'var(--bg-white)', minWidth: 0 }}>
            {selectedCommunityPost ? (
              <>
                <div style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1.25rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div className="editorial-mono-label" style={{ color: 'var(--teal)', fontSize: '0.72rem', marginBottom: '0.25rem' }}>
                        ✦ {selectedCommunityPost.post_type || 'COMMUNITY DISCUSSION'}
                      </div>
                      <h2 style={{ fontSize: '1.4rem', margin: '0 0 0.4rem 0', lineHeight: 1.25, wordBreak: 'break-word' }}>
                        {selectedCommunityPost.title}
                      </h2>
                      <div className="mono" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        Posted by {selectedCommunityPost.author_name} • {selectedCommunityPost.author_headline || 'Innovator'}
                      </div>
                    </div>

                    {(selectedCommunityPost.author_id || selectedCommunityPost.user_id) && (selectedCommunityPost.author_id || selectedCommunityPost.user_id) !== currentUser?.id && (
                      <button
                        onClick={() => {
                          const authorId = selectedCommunityPost.author_id || selectedCommunityPost.user_id;
                          setActiveThreadId(authorId);
                          setActiveMessagesTab('MESSAGES');
                        }}
                        className="btn btn-coral btn-sm"
                        style={{ gap: '0.35rem', fontSize: '0.78rem' }}
                      >
                        <Send size={12} /> Message Author 1-on-1
                      </button>
                    )}
                  </div>

                  <p style={{ color: 'var(--text-primary)', fontSize: '0.94rem', lineHeight: 1.55, marginTop: '0.85rem', backgroundColor: 'var(--bg-cream)', padding: '1rem', borderRadius: 'var(--radius-sm)', margin: '0.85rem 0 0 0', wordBreak: 'break-word' }}>
                    {selectedCommunityPost.content}
                  </p>
                </div>

                {/* Community Comments Stream */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', maxHeight: '300px', paddingRight: '0.25rem' }}>
                  <div className="editorial-mono-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    COMMUNITY REPLIES ({communityComments.length})
                  </div>

                  {communityComments.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', fontStyle: 'italic', padding: '1rem 0' }}>
                      No replies on this topic yet. Share your technical perspective below.
                    </div>
                  ) : (
                    communityComments.map(c => (
                      <div key={c.id} style={{ backgroundColor: 'var(--bg-ivory)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--border-medium)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                          <strong style={{ fontSize: '0.85rem' }}>{c.author_name}</strong>
                          <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                            {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.45, wordBreak: 'break-word' }}>
                          {c.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendCommunityReply} style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-hairline)', paddingTop: '1rem' }}>
                  <input
                    type="text"
                    value={communityCommentInput}
                    onChange={e => setCommunityCommentInput(e.target.value)}
                    placeholder="Dispatch your insight or comment to this community topic..."
                    className="form-input"
                    style={{ flex: 1 }}
                    disabled={isSubmittingCommunityReply}
                  />
                  <button type="submit" className="btn btn-teal" disabled={isSubmittingCommunityReply || !communityCommentInput.trim()}>
                    <Send size={15} /> Send Reply
                  </button>
                </form>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                Select a community discussion topic from the left.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. NOTIFICATIONS TAB                                                      */}
      {/* ========================================================================= */}
      {activeTab === 'NOTIFICATIONS' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="filter-chip-group">
              {[
                { id: 'ALL', label: `All Alerts (${notifications.length})` },
                { id: 'UNREAD', label: `Unread (${notifications.filter(n => !n.is_read && !n.read).length})` },
                { id: 'MESSAGES', label: `Direct Messages (${notifications.filter(n => (n.type || '').toLowerCase().includes('message')).length})` },
                { id: 'REVIEWS', label: 'Peer Reviews' },
                { id: 'LIKES', label: 'Endorsements' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`filter-chip ${filterType === tab.id ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {notifications.some(n => !n.is_read && !n.read) && (
              <button onClick={handleMarkAllRead} className="btn btn-secondary btn-sm" style={{ gap: '0.4rem' }}>
                <Check size={14} /> Mark All as Read
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {isLoading ? (
              <div className="editorial-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Retrieving network alerts...
              </div>
            ) : filteredNotifs.length === 0 ? (
              <div className="editorial-card" style={{ padding: '3.5rem', textAlign: 'center', backgroundColor: 'var(--bg-white)', borderLeft: '4px solid var(--coral)' }}>
                <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.5rem' }}>
                  COMMUNICATIONS CLEAR
                </div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>No notifications to display.</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', margin: 0 }}>
                  You will receive real-time updates when peers review your projects, endorse your specimens, or send messages.
                </p>
              </div>
            ) : (
              filteredNotifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className="editorial-card hover-lift"
                  style={{
                    padding: '1.25rem 1.5rem',
                    backgroundColor: n.is_read || n.read ? 'var(--bg-white)' : 'rgba(231, 111, 130, 0.04)',
                    borderLeft: `4px solid ${n.is_read || n.read ? 'var(--border-subtle)' : 'var(--coral)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {!n.is_read && !n.read && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--coral)', flexShrink: 0 }} />
                    )}
                    <p style={{ fontSize: '0.94rem', color: 'var(--text-primary)', margin: 0, fontWeight: n.is_read || n.read ? 400 : 600 }}>
                      {n.message}
                    </p>
                  </div>
                  <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {n.created_at ? new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. START NEW CHAT MODAL                                                   */}
      {/* ========================================================================= */}
      {isNewChatModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 20, 24, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 1000
          }}
          onClick={() => setIsNewChatModalOpen(false)}
        >
          <div
            className="editorial-card"
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: 'var(--bg-white)',
              padding: '2rem',
              borderLeft: '5px solid var(--coral)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setIsNewChatModalOpen(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={18} />
            </button>

            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.25rem' }}>
              ✦ CONNECT WITH FOUNDERS & CONTRIBUTORS
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              Start a Conversation
            </h2>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
                placeholder="Search by name, role, or project..."
                className="form-input"
                style={{ paddingLeft: '2rem', height: '38px', fontSize: '0.85rem' }}
                autoFocus
              />
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
              {filteredContacts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  No contacts matching "{contactSearch}".
                </div>
              ) : (
                filteredContacts.map(contact => (
                  <div
                    key={contact.id}
                    onClick={() => handleStartThread(contact)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-cream)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-ivory)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-cream)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img src={contact.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{contact.name}</div>
                        <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {contact.headline}
                        </div>
                      </div>
                    </div>
                    <span className="btn btn-coral btn-sm" style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem' }}>
                      Chat ↗
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
