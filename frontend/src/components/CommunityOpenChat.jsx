import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { SupabaseService } from '../services/supabaseService';
import { 
  Send, 
  Sparkles, 
  Users, 
  Hash, 
  Radio, 
  Smile, 
  Code2, 
  Search, 
  MessageSquare, 
  CheckCircle2,
  Trash2,
  CornerDownRight,
  Flame,
  Lightbulb,
  Rocket,
  ThumbsUp,
  Heart,
  Zap,
  Info
} from 'lucide-react';

const CHAT_STORAGE_KEY = 'innovexa_community_open_chat_v2';

const CHANNELS = [
  { id: 'general', name: 'general-lounge', icon: '🌐', desc: 'Open discussion, greetings & serendipitous collisions' },
  { id: 'ideas', name: 'ideas-and-hypotheses', icon: '💡', desc: 'Early brainstorming & unvetted technological theses' },
  { id: 'opensource', name: 'open-source-collab', icon: '🛠️', desc: 'Code implementations, repositories & library stacks' },
  { id: 'airesearch', name: 'ai-research-findings', icon: '🔬', desc: 'Model benchmarks, arXiv papers, datasets & prompts' },
  { id: 'feedback', name: 'feedback-and-critique', icon: '🎯', desc: 'Fast peer feedback requests and spec audits' }
];

const INITIAL_OPEN_MESSAGES = [
  {
    id: 'msg_seed_1',
    channel: 'general',
    sender_id: 'usr_elena_ai',
    sender_name: 'Dr. Elena Rostova',
    sender_role: 'AI Systems Architect',
    sender_badge: 'VALIDATOR',
    sender_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
    content: 'Welcome everyone to the INNOVEXA open lounge! Excited to see all the autonomous multi-agent specs being published this cycle.',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    reactions: { '🚀': 5, '💡': 3 }
  },
  {
    id: 'msg_seed_2',
    channel: 'ideas',
    sender_id: 'usr_marcus_vance',
    sender_name: 'Marcus Vance',
    sender_role: 'Distributed Systems Lead',
    sender_badge: 'RESEARCHER',
    sender_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
    content: 'Exploring deterministic consensus proofs on edge mobile devices. What are the best lightweight zero-knowledge stacks to pair with libp2p right now?',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    reactions: { '🧠': 4, '⚡': 2 }
  },
  {
    id: 'msg_seed_3',
    channel: 'opensource',
    sender_id: 'usr_aisha_patel',
    sender_name: 'Aisha Patel',
    sender_role: 'Bioinformatics Lead',
    sender_badge: 'CREATOR',
    sender_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120',
    content: 'Just published an open-source parser for real-time carbon telemetry streams. Check the Open Source Research desk for direct GitHub references! 🌿',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    reactions: { '🔥': 6, '👏': 4 }
  },
  {
    id: 'msg_seed_4',
    channel: 'airesearch',
    sender_id: 'usr_chen_wei',
    sender_name: 'Dr. Chen Wei',
    sender_role: 'Clinical Data Scientist',
    sender_badge: 'VALIDATOR',
    sender_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
    content: 'The new MONAI healthcare imaging benchmark preprints on arXiv look extremely promising for diagnostic accuracy testing.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    reactions: { '💡': 3, '💎': 2 }
  }
];

export default function CommunityOpenChat({ setActiveTab, setSelectedInnoId }) {
  const { currentUser, showToast } = useAuth();
  const [activeChannel, setActiveChannel] = useState('general');
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Load chat messages from Supabase and merge with local seed data
  const loadChannelMessages = async (channelId = activeChannel) => {
    try {
      const { data: supaMessages } = await SupabaseService.getCommunityMessages(channelId);
      
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      let localList = INITIAL_OPEN_MESSAGES;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) localList = parsed;
        } catch {
          // ignore
        }
      }

      if (supaMessages && supaMessages.length > 0) {
        // Merge Supabase messages with local list (avoiding duplicate IDs)
        const existingIds = new Set(supaMessages.map(m => m.id));
        const filteredLocal = localList.filter(m => !existingIds.has(m.id));
        const combined = [...filteredLocal, ...supaMessages];
        setMessages(combined);
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(combined));
      } else {
        setMessages(localList);
      }
    } catch (err) {
      console.warn('[CommunityOpenChat] Error syncing with Supabase:', err);
    }
  };

  useEffect(() => {
    loadChannelMessages(activeChannel);

    const handler = (e) => {
      if (e.detail?.messages) {
        setMessages(e.detail.messages);
      } else if (e.detail?.entity === 'messages') {
        loadChannelMessages(activeChannel);
      }
    };
    window.addEventListener('innovexa:communitychat', handler);
    window.addEventListener('innovexa:datachange', handler);
    return () => {
      window.removeEventListener('innovexa:communitychat', handler);
      window.removeEventListener('innovexa:datachange', handler);
    };
  }, [activeChannel]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  // Send Message (Stores in Supabase and broadcasts to community)
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || isSending) return;

    if (!currentUser) {
      showToast('Please sign in to participate in community open chat.', 'info');
      return;
    }

    const contentText = messageInput.trim();
    setMessageInput('');
    setShowEmojiPicker(false);
    setIsSending(true);

    const localMsgId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const tempMessage = {
      id: localMsgId,
      channel: activeChannel,
      sender_id: currentUser.id || 'user_anon',
      sender_name: currentUser.full_name || currentUser.username || 'Anonymous Innovator',
      sender_role: currentUser.role === 'admin' ? 'Platform Architect' : 'Innovator',
      sender_badge: currentUser.role === 'admin' ? 'ARCHITECT' : 'MEMBER',
      sender_avatar: currentUser.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.full_name || 'Innovator')}`,
      content: contentText,
      timestamp: new Date().toISOString(),
      reactions: {}
    };

    // Optimistic UI update
    const updated = [...messages, tempMessage];
    setMessages(updated);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('innovexa:communitychat', { detail: { messages: updated } }));
    }

    // Persist in Supabase
    try {
      const { data: savedMsg, error } = await SupabaseService.sendCommunityMessage({
        channel: activeChannel,
        senderId: currentUser.id,
        content: contentText
      });

      if (!error && savedMsg) {
        const withRealId = updated.map(m => m.id === localMsgId ? { ...savedMsg, channel: activeChannel } : m);
        setMessages(withRealId);
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(withRealId));
      }
    } catch (err) {
      console.warn('[CommunityOpenChat] Supabase send error, preserved in local stream:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Add reaction to a message
  const handleToggleReaction = (msgId, emoji) => {
    if (!currentUser) {
      showToast('Sign in to react to messages.', 'info');
      return;
    }

    const updated = messages.map(m => {
      if (m.id === msgId) {
        const reactions = { ...(m.reactions || {}) };
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        return { ...m, reactions };
      }
      return m;
    });

    setMessages(updated);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
  };

  // Delete message (sender or admin only)
  const handleDeleteMessage = async (msgId) => {
    const updated = messages.filter(m => m.id !== msgId);
    setMessages(updated);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
    showToast('Message removed.', 'info');

    if (currentUser?.id) {
      await SupabaseService.deleteCommunityMessage(msgId, currentUser.id);
    }
  };

  const channelObj = CHANNELS.find(c => c.id === activeChannel) || CHANNELS[0];
  const channelMessages = messages.filter(m => {
    const matchChan = (m.channel || 'general') === activeChannel;
    const matchSearch = !searchFilter || m.content.toLowerCase().includes(searchFilter.toLowerCase()) || m.sender_name.toLowerCase().includes(searchFilter.toLowerCase());
    return matchChan && matchSearch;
  });

  return (
    <div 
      className="editorial-card" 
      style={{ 
        display: 'grid', 
        gridTemplateColumns: '260px 1fr', 
        minHeight: '620px', 
        backgroundColor: 'var(--bg-white)', 
        border: '1px solid var(--border-hairline)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '3rem'
      }}
    >
      {/* 1. LEFT SIDEBAR: CHANNEL DIRECTORY */}
      <div 
        style={{ 
          backgroundColor: 'var(--ink-navy)', 
          color: '#FFFFFF', 
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.25rem 1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Radio size={12} className="animate-pulse" color="var(--signal-green)" /> OPEN COMMUNITY CHAT
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-editorial)' }}>
            Innovation Channels
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.2rem' }}>
            ● 28 Innovators Active
          </div>
        </div>

        {/* Channel Navigation List */}
        <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          {CHANNELS.map(chan => {
            const count = messages.filter(m => (m.channel || 'general') === chan.id).length;
            const isSelected = activeChannel === chan.id;
            return (
              <button
                key={chan.id}
                type="button"
                onClick={() => setActiveChannel(chan.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isSelected ? 'rgba(231, 111, 130, 0.18)' : 'transparent',
                  border: isSelected ? '1px solid rgba(231, 111, 130, 0.4)' : '1px solid transparent',
                  color: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <span style={{ fontSize: '0.95rem' }}>{chan.icon}</span>
                  <span style={{ fontSize: '0.86rem', fontWeight: isSelected ? 700 : 500, fontFamily: 'var(--font-mono)' }}>
                    #{chan.name}
                  </span>
                </div>
                <span className="mono" style={{ fontSize: '0.68rem', backgroundColor: 'rgba(255, 255, 255, 0.12)', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Channel Description Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(0, 0, 0, 0.15)' }}>
          <div className="editorial-mono-label" style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem' }}>
            CHANNEL TOPIC
          </div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.35 }}>
            {channelObj.desc}
          </div>
        </div>
      </div>

      {/* 2. RIGHT CHAT FEED & MESSAGE INPUT */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-ivory)' }}>
        
        {/* Top Chat Channel Header */}
        <div 
          style={{ 
            padding: '1rem 1.5rem', 
            borderBottom: '1px solid var(--border-hairline)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            backgroundColor: 'var(--bg-white)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{channelObj.icon}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                #{channelObj.name}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                {channelObj.desc}
              </div>
            </div>
          </div>

          {/* Quick Search inside Channel */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-ivory)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-hairline)' }}>
            <Search size={13} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Search chat..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.78rem', width: '130px' }}
            />
            {searchFilter && (
              <button onClick={() => setSearchFilter('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-secondary)' }}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Message Stream Area */}
        <div 
          style={{ 
            flex: 1, 
            padding: '1.5rem', 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.25rem',
            maxHeight: '420px'
          }}
        >
          {channelMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
              <Sparkles size={28} color="var(--coral)" style={{ margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>No messages in #{channelObj.name} yet</div>
              <p style={{ fontSize: '0.85rem' }}>Be the first to post a thought, hypothesis, or open-source query!</p>
            </div>
          ) : (
            channelMessages.map(msg => {
              const isMine = currentUser && msg.sender_id === currentUser.id;
              return (
                <div 
                  key={msg.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                    padding: '0.85rem 1rem',
                    backgroundColor: 'var(--bg-white)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-hairline)',
                    transition: 'box-shadow 0.15s ease'
                  }}
                >
                  <img
                    src={msg.sender_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
                    alt={msg.sender_name}
                    style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-subtle)' }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          {msg.sender_name}
                        </span>
                        {msg.sender_badge && (
                          <span className="mono" style={{ fontSize: '0.64rem', backgroundColor: 'var(--bg-ivory)', color: 'var(--coral)', padding: '0.1rem 0.45rem', borderRadius: '3px', fontWeight: 700, border: '1px solid var(--border-hairline)' }}>
                            {msg.sender_badge}
                          </span>
                        )}
                        <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {(isMine || currentUser?.role === 'admin') && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px', opacity: 0.6 }}
                          title="Delete message"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    {/* Message Body */}
                    <p style={{ fontSize: '0.94rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: '0 0 0.6rem 0', wordBreak: 'break-word' }}>
                      {msg.content}
                    </p>

                    {/* Reaction Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {['🚀', '💡', '🔥', '🧠', '👏'].map(emoji => {
                        const count = msg.reactions?.[emoji] || 0;
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: 'var(--radius-pill)',
                              border: count > 0 ? '1px solid var(--coral)' : '1px solid var(--border-hairline)',
                              backgroundColor: count > 0 ? 'rgba(231, 111, 130, 0.08)' : 'var(--bg-ivory)',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.1s ease'
                            }}
                          >
                            <span>{emoji}</span>
                            {count > 0 && <span style={{ fontWeight: 700, fontSize: '0.7rem' }}>{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 3. BOTTOM MESSAGE INPUT BAR */}
        <div style={{ padding: '1rem 1.5rem', backgroundColor: 'var(--bg-white)', borderTop: '1px solid var(--border-hairline)' }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  placeholder={`Send open message to #${channelObj.name}...`}
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  className="form-input"
                  style={{
                    width: '100%',
                    paddingRight: '3rem',
                    height: '46px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.94rem',
                    backgroundColor: 'var(--bg-ivory)'
                  }}
                />

                {/* Quick Emoji Trigger */}
                <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '0.25rem' }}>
                  {['🚀', '💡', '🔥'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setMessageInput(prev => prev + ' ' + emoji)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', padding: '0 2px' }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="btn btn-coral"
                style={{ height: '46px', padding: '0 1.25rem', gap: '0.45rem', fontWeight: 800 }}
              >
                <Send size={15} /> Send
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              <span>✦ Messages in open channels are publicly visible to the INNOVEXA community.</span>
              <span className="mono">Press Enter to send</span>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
