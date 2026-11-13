'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { messageService } from '@/services/messageService';
import { deriveConversationKey, encryptMessage, decryptMessage } from '@/lib/crypto';

// Global cache of derived CryptoKey instances by conversationId to prevent redundant 100k PBKDF2 passes
const conversationKeyCache = new Map();

function formatMessageTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatConversationDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function MessagesContent() {
  const { user } = useAuth();
  const { socket, isUserOnline } = useNotifications();
  const searchParams = useSearchParams();
  const queryUserId = searchParams.get('userId');
  const queryConvId = searchParams.get('conversationId');

  const [conversations, setConversations] = useState([]);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'requests'
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [decryptedCache, setDecryptedCache] = useState({});
  const [cryptoKey, setCryptoKey] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // New Chat Modal & Contact Discovery States
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [startingChatWithId, setStartingChatWithId] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const cryptoKeyRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const activeConversationRef = useRef(activeConversation);
  const decryptingIdsRef = useRef(new Set());
  const decryptedCacheRef = useRef({});

  // Synchronously keep refs aligned with state
  activeConversationRef.current = activeConversation;
  decryptedCacheRef.current = decryptedCache;

  // Scroll to bottom of message list smoothly
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper to extract the other user from a conversation
  const getOtherUser = useCallback(
    (conv) => {
      if (!conv) return null;
      if (conv.otherUser) return conv.otherUser;
      if (Array.isArray(conv.participants)) {
        return conv.participants.find((p) => {
          const pid = p?._id || p;
          return pid?.toString() !== user?._id?.toString();
        });
      }
      return null;
    },
    [user?._id]
  );

  // Helper for consistent ID comparisons
  const getMsgId = (m) => (m?._id?.toString?.() || m?._id || m?.id?.toString?.() || m?.id || '').toString();

  // Fetch all user conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const res = await messageService.listConversations();
      if (res?.success) {
        setConversations(res.conversations || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load conversations.');
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Support direct conversation selection or creation from URL query parameters (?userId=... or ?conversationId=...)
  useEffect(() => {
    if (!queryUserId && !queryConvId) return;

    if (queryConvId && conversations.length > 0) {
      const match = conversations.find((c) => (c._id?.toString?.() || c._id) === queryConvId);
      if (match) {
        setActiveConversation(match);
        setActiveTab(match.status === 'pending_request' ? 'requests' : 'chats');
        return;
      }
    }

    if (queryUserId) {
      messageService
        .getOrCreateConversation(queryUserId)
        .then((res) => {
          if (res?.success && res.conversation) {
            const conv = res.conversation;
            setConversations((prev) => {
              const exists = prev.some(
                (c) => (c._id?.toString?.() || c._id) === (conv._id?.toString?.() || conv._id)
              );
              if (exists) return prev;
              return [conv, ...prev];
            });
            setActiveConversation(conv);
            setActiveTab('chats');
          }
        })
        .catch(() => {});
    }
  }, [queryUserId, queryConvId, conversations]);

  // Fetch contacts for the New Chat selector
  const fetchContacts = useCallback(async (query = '') => {
    try {
      setLoadingContacts(true);
      const res = await messageService.getContacts(query);
      if (res?.success) {
        setContacts(res.contacts || []);
      }
    } catch (err) {
      console.warn('Failed to load contacts for messaging:', err);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  const openNewChatModal = () => {
    setShowNewChatModal(true);
    setContactSearch('');
    fetchContacts('');
  };

  const handleContactSearchChange = (e) => {
    const val = e.target.value;
    setContactSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchContacts(val);
    }, 300);
  };

  // Start or open a conversation with a selected contact
  const handleSelectContact = async (targetContact) => {
    if (!targetContact?._id) return;
    try {
      setStartingChatWithId(targetContact._id);
      const res = await messageService.getOrCreateConversation(targetContact._id);
      if (res?.success && res.conversation) {
        const conv = res.conversation;
        if (!conv.otherUser) {
          conv.otherUser = targetContact;
        }
        setConversations((prev) => {
          const exists = prev.some((c) => c._id === conv._id);
          if (exists) {
            return prev.map((c) => (c._id === conv._id ? { ...c, ...conv } : c));
          }
          return [conv, ...prev];
        });
        setActiveTab('chats');
        setActiveConversation(conv);
        setShowNewChatModal(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to start conversation.');
    } finally {
      setStartingChatWithId(null);
    }
  };

  // Derive Client-Side AES-GCM key whenever active conversation changes (uses memory cache)
  useEffect(() => {
    const convId = (activeConversation?._id || activeConversation?.id)?.toString();
    if (!convId) {
      cryptoKeyRef.current = null;
      setCryptoKey(null);
      return;
    }

    if (conversationKeyCache.has(convId)) {
      const cachedKey = conversationKeyCache.get(convId);
      cryptoKeyRef.current = cachedKey;
      setCryptoKey(cachedKey);
      return;
    }

    let ignore = false;
    deriveConversationKey(convId)
      .then((key) => {
        if (!ignore) {
          conversationKeyCache.set(convId, key);
          cryptoKeyRef.current = key;
          setCryptoKey(key);
        }
      })
      .catch((err) => {
        console.warn('Crypto key derivation notice:', err);
      });

    return () => {
      ignore = true;
    };
  }, [activeConversation?._id, activeConversation?.id]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    try {
      setLoadingMessages(true);
      const res = await messageService.getMessages(conversationId);
      if (res?.success) {
        setMessages(res.messages || []);
        messageService.markAsRead(conversationId).catch(() => {});
      }
    } catch (err) {
      setError(err.message || 'Failed to load messages.');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Atomic, race-condition-free single message decryptor
  const decryptSingleMessage = useCallback(async (msg, explicitKey) => {
    if (!msg || !msg.isEncrypted || !msg.iv || !msg.content) return;
    const msgId = getMsgId(msg);
    if (!msgId || decryptedCacheRef.current[msgId] || decryptingIdsRef.current.has(msgId)) return;

    let key = explicitKey || cryptoKeyRef.current;
    if (!key) {
      const convId = (
        activeConversationRef.current?._id ||
        activeConversationRef.current?.id ||
        msg.conversation?._id ||
        msg.conversation
      )?.toString();
      if (convId) {
        if (conversationKeyCache.has(convId)) {
          key = conversationKeyCache.get(convId);
        } else {
          try {
            key = await deriveConversationKey(convId);
            conversationKeyCache.set(convId, key);
            cryptoKeyRef.current = key;
            setCryptoKey(key);
          } catch {}
        }
      }
    }

    if (!key) return;

    decryptingIdsRef.current.add(msgId);
    try {
      const plaintext = await decryptMessage(msg.content, msg.iv, key);
      decryptedCacheRef.current[msgId] = plaintext;
      setDecryptedCache((prev) => ({ ...prev, [msgId]: plaintext }));
    } catch (err) {
      console.warn('[Crypto Decrypt Notice]', msgId, err);
    } finally {
      decryptingIdsRef.current.delete(msgId);
    }
  }, []);

  // Persistent real-time Socket.IO listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (payload) => {
      if (!payload?.message) return;

      const incomingMsg = payload.message;
      const incomingId = getMsgId(incomingMsg);
      if (!incomingId) return;

      const incomingConvId = (
        payload.conversationId?._id ||
        payload.conversationId ||
        incomingMsg.conversation?._id ||
        incomingMsg.conversation ||
        ''
      ).toString();

      const currentConvId = (
        activeConversationRef.current?._id ||
        activeConversationRef.current?.id ||
        ''
      ).toString();

      // If incoming message belongs to open chat, immediately append with strict duplicate check
      if (incomingConvId && incomingConvId === currentConvId) {
        setMessages((prev) => {
          if (prev.some((m) => getMsgId(m) === incomingId)) return prev;
          return [...prev, incomingMsg];
        });

        // Decrypt immediately upon arrival
        if (incomingMsg.isEncrypted && incomingMsg.iv) {
          decryptSingleMessage(incomingMsg);
        }

        setTimeout(scrollToBottom, 50);
        messageService.markAsRead(currentConvId).catch(() => {});
      }

      // Update sidebar conversation list snippet & unread count
      setConversations((prev) => {
        const exists = prev.some((c) => (c._id?.toString?.() || c._id || c.id?.toString?.() || c.id) === incomingConvId);
        if (exists) {
          return prev.map((c) => {
            const cId = (c._id?.toString?.() || c._id || c.id?.toString?.() || c.id);
            if (cId === incomingConvId) {
              return {
                ...c,
                lastMessage: incomingMsg,
                lastMessageSnippet: incomingMsg.isEncrypted
                  ? '🔒 Encrypted message'
                  : incomingMsg.content,
                lastMessageAt: incomingMsg.createdAt || new Date().toISOString(),
                unreadCount: incomingConvId === currentConvId ? 0 : (c.unreadCount || 0) + 1
              };
            }
            return c;
          });
        }
        fetchConversations();
        return prev;
      });
    };

    const handleTypingStart = (payload) => {
      const incomingConvId = (payload?.conversationId || '').toString();
      const currentConvId = (
        activeConversationRef.current?._id ||
        activeConversationRef.current?.id ||
        ''
      ).toString();
      if (incomingConvId === currentConvId && payload?.userId !== user?._id) {
        setPartnerTyping(true);
      }
    };

    const handleTypingStop = (payload) => {
      const incomingConvId = (payload?.conversationId || '').toString();
      const currentConvId = (
        activeConversationRef.current?._id ||
        activeConversationRef.current?.id ||
        ''
      ).toString();
      if (incomingConvId === currentConvId && payload?.userId !== user?._id) {
        setPartnerTyping(false);
      }
    };

    const handleRejoin = () => {
      const convId = (
        activeConversationRef.current?._id ||
        activeConversationRef.current?.id
      )?.toString();
      if (convId && socket) {
        socket.emit('join_conversation', convId);
        socket.emit('join_conversation', { conversationId: convId });
      }
    };

    const handleMessagesRead = (payload) => {
      const incomingConvId = (payload?.conversationId || '').toString();
      const currentConvId = (
        activeConversationRef.current?._id ||
        activeConversationRef.current?.id ||
        ''
      ).toString();
      if (incomingConvId && incomingConvId === currentConvId) {
        setMessages((prev) =>
          prev.map((m) => {
            const senderId = (m.sender?._id || m.sender)?.toString();
            const currentUserId = user?._id?.toString();
            if (!m.readAt && senderId === currentUserId) {
              return { ...m, readAt: payload.readAt || new Date().toISOString() };
            }
            return m;
          })
        );
      }
    };

    const handleConversationStatusChange = (payload) => {
      const incomingConvId = (payload?.conversationId || '').toString();
      const currentConvId = (
        activeConversationRef.current?._id ||
        activeConversationRef.current?.id ||
        ''
      ).toString();

      if (incomingConvId && incomingConvId === currentConvId && payload.conversation) {
        setActiveConversation(payload.conversation);
      }
      fetchConversations();
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('conversation_status_change', handleConversationStatusChange);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);
    socket.on('user_typing', handleTypingStart);
    socket.on('user_stopped_typing', handleTypingStop);
    socket.on('connect', handleRejoin);
    socket.on('reconnect', handleRejoin);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('conversation_status_change', handleConversationStatusChange);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
      socket.off('user_typing', handleTypingStart);
      socket.off('user_stopped_typing', handleTypingStop);
      socket.off('connect', handleRejoin);
      socket.off('reconnect', handleRejoin);
    };
  }, [socket, user?._id, fetchConversations, decryptSingleMessage]);

  // When active conversation changes, load messages & join conversation room
  useEffect(() => {
    const convId = (activeConversation?._id || activeConversation?.id)?.toString();
    if (!convId) return;

    fetchMessages(convId);

    if (socket) {
      socket.emit('join_conversation', convId);
      socket.emit('join_conversation', { conversationId: convId });

      return () => {
        socket.emit('leave_conversation', convId);
        socket.emit('leave_conversation', { conversationId: convId });
      };
    }
  }, [activeConversation?._id, activeConversation?.id, socket, fetchMessages]);

  // Background sync interval
  useEffect(() => {
    const convId = (activeConversation?._id || activeConversation?.id)?.toString();
    if (!convId) return;

    const syncInterval = setInterval(async () => {
      try {
        const res = await messageService.getMessages(convId, 1, 50);
        if (res?.success && Array.isArray(res.messages)) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => getMsgId(m)));
            const newOnes = res.messages.filter((m) => !existingIds.has(getMsgId(m)));
            if (newOnes.length === 0) return prev;
            newOnes.forEach((m) => decryptSingleMessage(m));
            setTimeout(scrollToBottom, 50);
            return [...prev, ...newOnes];
          });
        }
      } catch {
        // Silent sync
      }
    }, 2000);

    return () => clearInterval(syncInterval);
  }, [activeConversation?._id, activeConversation?.id, decryptSingleMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, partnerTyping]);

  // Decrypt encrypted messages reliably
  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.isEncrypted && msg.iv) {
        decryptSingleMessage(msg, cryptoKey);
      }
    });
  }, [messages, cryptoKey, decryptSingleMessage]);

  // Typing event handler
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    if (socket && activeConversation) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing_start', { conversationId: activeConversation._id, userId: user?._id });
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('typing_stop', { conversationId: activeConversation._id, userId: user?._id });
      }, 2000);
    }
  };

  // Send message with Client-Side AES-GCM 256-bit encryption
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = messageInput.trim();
    if (!text || !activeConversation || sending) return;

    setMessageInput('');
    setSending(true);
    setError('');

    try {
      let contentToSend = text;
      let isEncrypted = false;
      let ivToSend = null;

      if (cryptoKeyRef.current) {
        try {
          const encResult = await encryptMessage(text, cryptoKeyRef.current);
          contentToSend = encResult.ciphertext;
          ivToSend = encResult.iv;
          isEncrypted = true;
        } catch (encErr) {
          console.warn('Encryption fallback to plaintext:', encErr);
        }
      }

      const res = await messageService.sendMessage(activeConversation._id, {
        content: contentToSend,
        isEncrypted,
        iv: ivToSend
      });

      if (res?.success && res.message) {
        const sentId = getMsgId(res.message);
        setMessages((prev) => {
          if (prev.some((m) => getMsgId(m) === sentId)) return prev;
          return [...prev, res.message];
        });
        if (isEncrypted) {
          decryptedCacheRef.current[sentId] = text;
          setDecryptedCache((prev) => ({ ...prev, [sentId]: text }));
        }
        if (socket) {
          socket.emit('typing_stop', { conversationId: activeConversation._id, userId: user?._id });
        }
        setIsTyping(false);
        setTimeout(scrollToBottom, 50);

        setConversations((prev) =>
          prev.map((c) => {
            if ((c._id?.toString?.() || c._id) === (activeConversation._id?.toString?.() || activeConversation._id)) {
              return {
                ...c,
                lastMessage: res.message,
                lastMessageSnippet: isEncrypted ? '🔒 Encrypted message' : text,
                lastMessageAt: res.message.createdAt || new Date().toISOString()
              };
            }
            return c;
          })
        );
      }
    } catch (err) {
      setMessageInput(text);
      setError(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleRequestResponse = async (action) => {
    if (!activeConversation) return;
    try {
      const res = await messageService.respondToRequest(activeConversation._id, action);
      if (res?.success) {
        setActiveConversation(res.conversation);
        fetchConversations();
      }
    } catch (err) {
      setError(err.message || `Failed to ${action} message request.`);
    }
  };

  const directChats = conversations.filter(
    (c) =>
      c.status === 'active' ||
      c.status === 'accepted' ||
      (c.status === 'pending_request' && (c.initiatedBy?._id === user?._id || c.initiatedBy === user?._id))
  );

  const messageRequests = conversations.filter(
    (c) =>
      (c.status === 'pending_request' || c.status === 'pending') &&
      c.initiatedBy?._id !== user?._id &&
      c.initiatedBy !== user?._id
  );

  const displayedConversations = (activeTab === 'chats' ? directChats : messageRequests).filter(
    (conv) => {
      if (!chatSearchQuery.trim()) return true;
      const other = getOtherUser(conv);
      return (
        other?.fullName?.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
        other?.email?.toLowerCase().includes(chatSearchQuery.toLowerCase())
      );
    }
  );

  const recipient = getOtherUser(activeConversation);

  return (
    <div className="h-[calc(100dvh-12rem)] md:h-[calc(100vh-8.5rem)] mb-16 md:mb-0 flex rounded-2xl bg-white border border-[#E7E5E0] overflow-hidden shadow-xs relative">
      {/* Left Sidebar: Conversations List */}
      <div
        className={`w-full md:w-80 border-r border-[#E7E5E0] flex flex-col bg-[#F8F7F4] ${
          activeConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header, Action & Tabs */}
        <div className="p-4 border-b border-[#E7E5E0] space-y-3 bg-[#F8F7F4]">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-bold text-[#1E1E24] flex items-center gap-2">
              <Icon name="message" className="w-5 h-5 text-[#6C63FF]" />
              Messages
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-[#6C63FF] bg-[#EEEAFE] border border-[#6C63FF]/20 px-2 py-0.5 rounded-full hidden sm:inline-block">
                AES-GCM 256-bit Protected
              </span>
              <button
                type="button"
                onClick={openNewChatModal}
                className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-[#6C63FF] text-white hover:bg-[#574FE8] transition-all flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                title="Start New Chat"
              >
                <Icon name="plus" className="w-3.5 h-3.5 text-white" />
                <span>New Chat</span>
              </button>
            </div>
          </div>

          {/* Quick Chat Search Filter */}
          <div className="relative">
            <Icon
              name="search"
              className="w-3.5 h-3.5 text-[#6B6B73] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search conversations..."
              value={chatSearchQuery}
              onChange={(e) => setChatSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#E7E5E0] text-xs text-[#1E1E24] placeholder-[#6B6B73] focus:outline-hidden focus:border-[#6C63FF] shadow-2xs transition-colors"
            />
          </div>

          <div className="flex rounded-xl bg-[#F1F0EC] p-1 border border-[#E7E5E0]">
            <button
              type="button"
              onClick={() => setActiveTab('chats')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'chats'
                  ? 'bg-white text-[#1E1E24] font-bold shadow-xs'
                  : 'text-[#6B6B73] hover:text-[#1E1E24]'
              }`}
            >
              Direct Chats ({directChats.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-white text-[#1E1E24] font-bold shadow-xs'
                  : 'text-[#6B6B73] hover:text-[#1E1E24]'
              }`}
            >
              Requests ({messageRequests.length})
            </button>
          </div>
        </div>

        {/* Conversations Scroll Area */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E7E5E0]">
          {loadingConversations ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-[#E7E5E0]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-24 h-3 bg-[#E7E5E0] rounded" />
                    <div className="w-36 h-2.5 bg-[#E7E5E0]/60 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#6B6B73] flex flex-col items-center gap-3">
              <p>
                {chatSearchQuery
                  ? `No conversations matching "${chatSearchQuery}".`
                  : activeTab === 'chats'
                  ? 'No active direct chats yet. Connect with members to start a conversation.'
                  : 'No pending message requests.'}
              </p>
              {activeTab === 'chats' && !chatSearchQuery && (
                <button
                  type="button"
                  onClick={openNewChatModal}
                  className="px-3.5 py-1.5 rounded-xl bg-[#EEEAFE] border border-[#6C63FF]/30 text-[#6C63FF] text-xs font-semibold hover:bg-[#6C63FF] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Icon name="plus" className="w-3.5 h-3.5" />
                  <span>Start New Chat</span>
                </button>
              )}
            </div>
          ) : (
            displayedConversations.map((conv) => {
              const otherUser = getOtherUser(conv);
              const isSelected = activeConversation?._id === conv._id;
              const isOtherOnline = isUserOnline ? isUserOnline(otherUser?._id) : false;

              return (
                <button
                  key={conv._id}
                  type="button"
                  onClick={() => setActiveConversation(conv)}
                  className={`w-full p-3.5 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-white border-l-4 border-[#6C63FF] shadow-2xs'
                      : 'hover:bg-white/80'
                  }`}
                >
                  <Avatar
                    name={otherUser?.fullName || 'User'}
                    src={otherUser?.profile?.avatarUrl}
                    size="md"
                    status={isOtherOnline ? 'online' : 'offline'}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#1E1E24] truncate">
                        {otherUser?.fullName || 'User'}
                      </p>
                      <span className="text-[10px] text-[#6B6B73]">
                        {formatConversationDate(conv.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <p className="text-[11px] text-[#6B6B73] truncate">
                        {conv.lastMessageSnippet || 'Start conversation...'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="shrink-0 px-1.5 py-0.2 rounded-full bg-[#FF6B6B] text-white text-[9px] font-bold">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Area: Active Chat Panel */}
      <div
        className={`flex-1 flex flex-col bg-white ${
          !activeConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversation && recipient ? (
          <>
            {/* Active Chat Header */}
            <div className="h-16 px-4 sm:px-6 border-b border-[#E7E5E0] bg-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden text-[#6B6B73] hover:text-[#1E1E24] p-1.5 -ml-1 rounded-lg hover:bg-[#F1F0EC] transition-colors cursor-pointer shrink-0"
                  aria-label="Back to conversations list"
                >
                  <Icon name="arrowLeft" className="w-5 h-5" />
                </button>
                {(() => {
                  const isRecipientOnline = isUserOnline ? isUserOnline(recipient?._id) : false;
                  return (
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        name={recipient.fullName || 'User'}
                        src={recipient?.profile?.avatarUrl}
                        size="sm"
                        status={isRecipientOnline ? 'online' : 'offline'}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xs sm:text-sm font-bold text-[#1E1E24] leading-tight truncate">
                            {recipient.fullName}
                          </h2>
                          <span className={`text-[10px] font-semibold shrink-0 ${isRecipientOnline ? 'text-[#4CAF78]' : 'text-[#6B6B73]'}`}>
                            • {isRecipientOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B6B73] truncate">
                          {recipient.email ? `@${recipient.email.split('@')[0]}` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Cryptographic Protocol Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEEAFE] border border-[#6C63FF]/20 text-[#6C63FF] text-[11px] font-semibold shrink-0">
                <Icon name="lock" className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AES-GCM 256-bit Protected</span>
                <span className="sm:hidden">AES-256</span>
              </div>
            </div>

            {/* Error Notice Banner */}
            {error && (
              <div className="p-3 bg-[#FF6B6B]/10 border-b border-[#FF6B6B]/30 flex items-center justify-between text-xs text-[#FF6B6B] font-medium">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="p-1 hover:text-[#FF6B6B] font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Message Request Warning Banner */}
            {(activeConversation.status === 'pending_request' || activeConversation.status === 'pending') &&
              activeConversation.initiatedBy?._id !== user?._id &&
              activeConversation.initiatedBy !== user?._id && (
                <div className="p-3 bg-[#FFF7E0] border-b border-[#FFD166]/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-[#996F00]">
                    <Icon name="alertCircle" className="w-4 h-4 shrink-0" />
                    <span>
                      <strong className="text-[#1E1E24]">{recipient.fullName}</strong> sent you a message request.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={() => handleRequestResponse('accept')}
                    >
                      Accept
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequestResponse('decline')}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              )}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#F8F7F4]/50">
              {loadingMessages ? (
                <div className="p-8 text-center text-xs text-[#6B6B73] animate-pulse">
                  Decrypting secure message stream...
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-[#6B6B73]">
                  <div className="w-12 h-12 rounded-2xl bg-[#EEEAFE] text-[#6C63FF] flex items-center justify-center">
                    <Icon name="lock" className="w-6 h-6 text-[#6C63FF]" />
                  </div>
                  <p className="text-xs font-bold text-[#1E1E24]">Client-Side Encrypted (AES-GCM 256-bit)</p>
                  <p className="text-[11px] max-w-sm leading-relaxed text-[#6B6B73]">
                    Messages are encrypted in your browser before leaving your device. Only conversation participants can decrypt.
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const msgId = getMsgId(msg);
                  const senderId = (msg.sender?._id || msg.sender)?.toString();
                  const currentUserId = user?._id?.toString();
                  const isMine = senderId === currentUserId;
                  const displayContent = msg.isEncrypted
                    ? decryptedCache[msgId] || 'Decrypting...'
                    : msg.content;

                  return (
                    <div
                      key={msgId || index}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] sm:max-w-md px-3.5 py-2.5 rounded-2xl text-xs break-words shadow-xs ${
                          isMine
                            ? 'bg-[#6C63FF] text-white rounded-br-xs shadow-md shadow-[#6C63FF]/15'
                            : 'bg-white border border-[#E7E5E0] text-[#1E1E24] rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{displayContent}</p>
                        <div
                          className={`flex items-center gap-1.5 mt-1 text-[9px] ${
                            isMine ? 'text-white/80 justify-end' : 'text-[#6B6B73]'
                          }`}
                        >
                          {msg.isEncrypted && <Icon name="lock" className="w-2.5 h-2.5" />}
                          <span>{formatMessageTime(msg.createdAt)}</span>
                          {isMine && (
                            <span>{msg.readAt || msg.readBy?.length > 1 ? '• Read' : '• Sent'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Partner Typing Indicator */}
              {partnerTyping && (
                <div className="flex items-center gap-2 text-xs text-[#6B6B73] italic py-1 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-[#4CAF78]" />
                  <span>{recipient.fullName} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-4 border-t border-[#E7E5E0] bg-white flex items-center gap-2.5"
            >
              <input
                type="text"
                value={messageInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`Encrypted message to ${recipient.fullName}...`}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] text-xs text-[#1E1E24] placeholder-[#6B6B73] focus:outline-hidden focus:border-[#6C63FF] focus:bg-white transition-colors"
                disabled={sending}
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={sending || !messageInput.trim()}
              >
                {sending ? 'Sending...' : 'Send'}
              </Button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#EEEAFE] border border-[#6C63FF]/20 flex items-center justify-center text-[#6C63FF] shadow-xs">
                <Icon name="lock" className="w-8 h-8 text-[#6C63FF]" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-[#6C63FF] bg-[#EEEAFE] border border-[#6C63FF]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  AES-GCM PROTECTED
                </span>
                <h2 className="text-lg font-bold text-[#1E1E24] mt-2">Client-Side Encrypted Messages</h2>
                <p className="text-xs text-[#6B6B73] max-w-sm mx-auto mt-1 leading-relaxed">
                  Choose a contact from the list or start a conversation with any creator. Messages are encrypted in your browser before transmission.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={openNewChatModal}
                className="flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Icon name="plus" className="w-4 h-4 text-white" />
                <span>Start New Encrypted Chat</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat & User Discovery Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white border border-[#E7E5E0] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#E7E5E0] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EEEAFE] flex items-center justify-center text-[#6C63FF]">
                  <Icon name="lock" className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1E1E24]">Start Encrypted Chat</h2>
                  <p className="text-[10px] text-[#6B6B73]">AES-GCM 256-Bit Client Encryption</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="p-1 rounded-lg text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-[#E7E5E0] bg-[#F8F7F4]">
              <div className="relative">
                <Icon
                  name="search"
                  className="w-4 h-4 text-[#6B6B73] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search members by name or email..."
                  value={contactSearch}
                  onChange={handleContactSearchChange}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#E7E5E0] text-xs text-[#1E1E24] placeholder-[#6B6B73] focus:outline-hidden focus:border-[#6C63FF] focus:bg-white"
                  autoFocus
                />
              </div>
            </div>

            {/* Contacts Scroll Area */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#E7E5E0] p-2 max-h-[380px]">
              {loadingContacts ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-9 h-9 rounded-full bg-[#E7E5E0]" />
                      <div className="flex-1 space-y-1.5">
                        <div className="w-24 h-3 bg-[#E7E5E0] rounded" />
                        <div className="w-36 h-2 bg-[#E7E5E0]/60 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : contacts.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#6B6B73] space-y-1">
                  <Icon name="users" className="w-8 h-8 text-[#6B6B73]/60 mx-auto mb-2" />
                  <p className="font-bold text-[#1E1E24]">No community members found</p>
                  <p className="text-[11px]">Try searching with a different name or email.</p>
                </div>
              ) : (
                contacts.map((contact) => (
                  <div
                    key={contact._id}
                    className="p-2.5 rounded-xl hover:bg-[#F8F7F4] transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        name={contact.fullName || 'User'}
                        src={contact.avatarUrl}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-[#1E1E24] truncate">
                            {contact.fullName}
                          </p>
                          {contact.role === 'admin' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-[#EEEAFE] text-[#6C63FF] font-bold">
                              Admin
                            </span>
                          )}
                          {contact.isFollowing && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-[#FFEAEA] text-[#FF6B6B] font-medium">
                              Following
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#6B6B73] truncate">
                          {contact.bio || contact.email}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleSelectContact(contact)}
                      disabled={startingChatWithId === contact._id}
                      className="shrink-0 text-xs py-1 px-3 flex items-center gap-1 cursor-pointer"
                    >
                      {startingChatWithId === contact._id ? (
                        'Starting...'
                      ) : (
                        <>
                          <Icon name="lock" className="w-3 h-3 text-white" />
                          <span>Chat</span>
                        </>
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Security Note Footer */}
            <div className="p-3 bg-[#F8F7F4] border-t border-[#E7E5E0] flex items-center gap-2 text-[10px] text-[#6B6B73]">
              <Icon name="shield" className="w-4 h-4 text-[#4CAF78] shrink-0" />
              <span>Web Crypto AES-GCM 256-bit encryption protects all messages before transmission.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-8.5rem)] flex items-center justify-center text-xs text-[#6B6B73] bg-white rounded-2xl border border-[#E7E5E0]">
          Loading messages...
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
