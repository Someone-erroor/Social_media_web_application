'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { messageService } from '@/services/messageService';
import { deriveConversationKey, encryptMessage, decryptMessage } from '@/lib/crypto';

export default function MessagesPage() {
  const { user } = useAuth();
  const { socket } = useNotifications();

  const [conversations, setConversations] = useState([]);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'requests'
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [decryptedCache, setDecryptedCache] = useState({});
  const [messageInput, setMessageInput] = useState('');
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

  // Scroll to bottom of message list
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

  // Derive E2EE key whenever active conversation changes
  useEffect(() => {
    if (!activeConversation) {
      cryptoKeyRef.current = null;
      return;
    }

    let ignore = false;
    // Derive key using conversation id as shared secret seed
    deriveConversationKey(activeConversation._id)
      .then((key) => {
        if (!ignore) {
          cryptoKeyRef.current = key;
        }
      })
      .catch((err) => {
        console.warn('E2EE key derivation notice:', err);
      });

    return () => {
      ignore = true;
    };
  }, [activeConversation]);

  // Fetch messages and decrypt them
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

  // When active conversation changes, load messages & join socket room
  useEffect(() => {
    if (!activeConversation) return;

    fetchMessages(activeConversation._id);

    if (socket) {
      socket.emit('join_conversation', { conversationId: activeConversation._id });

      const handleNewMessage = (payload) => {
        if (payload?.conversationId === activeConversation._id && payload?.message?._id) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === payload.message._id)) return prev;
            return [...prev, payload.message];
          });
          scrollToBottom();
        }
      };

      const handleTypingStart = (payload) => {
        if (payload?.conversationId === activeConversation._id && payload?.userId !== user?._id) {
          setPartnerTyping(true);
        }
      };

      const handleTypingStop = (payload) => {
        if (payload?.conversationId === activeConversation._id && payload?.userId !== user?._id) {
          setPartnerTyping(false);
        }
      };

      socket.on('new_message', handleNewMessage);
      socket.on('typing_start', handleTypingStart);
      socket.on('typing_stop', handleTypingStop);

      return () => {
        socket.emit('leave_conversation', { conversationId: activeConversation._id });
        socket.off('new_message', handleNewMessage);
        socket.off('typing_start', handleTypingStart);
        socket.off('typing_stop', handleTypingStop);
      };
    }
  }, [activeConversation, socket, user?._id, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, partnerTyping]);

  // Decrypt encrypted messages using derived key
  useEffect(() => {
    if (!cryptoKeyRef.current || messages.length === 0) return;

    let ignore = false;
    messages.forEach((msg) => {
      if (msg.isEncrypted && msg.iv && !decryptedCache[msg._id]) {
        decryptMessage(msg.content, msg.iv, cryptoKeyRef.current).then((plaintext) => {
          if (!ignore) {
            setDecryptedCache((prev) => ({ ...prev, [msg._id]: plaintext }));
          }
        });
      }
    });

    return () => {
      ignore = true;
    };
  }, [messages, decryptedCache]);

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

  // Send message with E2EE
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = messageInput.trim();
    if (!text || !activeConversation || sending) return;

    setSending(true);
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
          console.warn('E2EE encryption fallback to plaintext:', encErr);
        }
      }

      const res = await messageService.sendMessage(activeConversation._id, {
        content: contentToSend,
        isEncrypted,
        iv: ivToSend
      });

      if (res?.success) {
        setMessageInput('');
        setMessages((prev) => [...prev, res.message]);
        if (isEncrypted) {
          setDecryptedCache((prev) => ({ ...prev, [res.message._id]: text }));
        }
        if (socket) {
          socket.emit('typing_stop', { conversationId: activeConversation._id, userId: user?._id });
        }
        setIsTyping(false);
        scrollToBottom();
      }
    } catch (err) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  // Handle message request accept/reject
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

  // Filter conversations with complete status compatibility
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

  const displayedConversations = activeTab === 'chats' ? directChats : messageRequests;

  // Active recipient
  const recipient = getOtherUser(activeConversation);

  return (
    <div className="h-[calc(100vh-8.5rem)] flex rounded-2xl bg-[#101A22] border border-[#263640] overflow-hidden shadow-xl animate-fade-in relative">
      {/* Left Sidebar: Conversations List */}
      <div
        className={`w-full md:w-80 border-r border-[#263640] flex flex-col bg-[#101A22] ${
          activeConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header, Action & Tabs */}
        <div className="p-4 border-b border-[#263640] space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-bold text-[#F4F8FA] flex items-center gap-2">
              <Icon name="message" className="w-5 h-5 text-[#19D3E3]" />
              Messages
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-[#19D3E3] bg-[#19D3E3]/15 border border-[#19D3E3]/30 px-2 py-0.5 rounded-full hidden sm:inline-block">
                E2EE Active
              </span>
              <button
                type="button"
                onClick={openNewChatModal}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#19D3E3] text-[#080D12] hover:bg-[#19D3E3]/90 transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                title="Start New Chat"
              >
                <Icon name="plus" className="w-3.5 h-3.5" />
                <span>New Chat</span>
              </button>
            </div>
          </div>

          <div className="flex rounded-xl bg-[#151F29] p-1 border border-[#263640]">
            <button
              type="button"
              onClick={() => setActiveTab('chats')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'chats'
                  ? 'bg-[#19D3E3] text-[#080D12]'
                  : 'text-[#9BAAB4] hover:text-[#F4F8FA]'
              }`}
            >
              Direct Chats ({directChats.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'requests'
                  ? 'bg-[#19D3E3] text-[#080D12]'
                  : 'text-[#9BAAB4] hover:text-[#F4F8FA]'
              }`}
            >
              Requests ({messageRequests.length})
            </button>
          </div>
        </div>

        {/* Conversations Scroll Area */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#263640]">
          {loadingConversations ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-[#151F29]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-24 h-3 bg-[#151F29] rounded" />
                    <div className="w-36 h-2.5 bg-[#151F29]/60 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#9BAAB4] flex flex-col items-center gap-3">
              <p>
                {activeTab === 'chats'
                  ? 'No active direct chats yet.'
                  : 'No pending message requests.'}
              </p>
              {activeTab === 'chats' && (
                <button
                  type="button"
                  onClick={openNewChatModal}
                  className="px-3.5 py-1.5 rounded-xl bg-[#19D3E3]/15 border border-[#19D3E3]/30 text-[#19D3E3] text-xs font-semibold hover:bg-[#19D3E3]/25 transition-all flex items-center gap-1.5 cursor-pointer"
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

              return (
                <button
                  key={conv._id}
                  type="button"
                  onClick={() => setActiveConversation(conv)}
                  className={`w-full p-3.5 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#19D3E3]/10 border-l-4 border-[#19D3E3]'
                      : 'hover:bg-[#151F29]'
                  }`}
                >
                  <Avatar
                    name={otherUser?.fullName || 'User'}
                    src={otherUser?.profile?.avatarUrl}
                    size="md"
                    status="online"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[#F4F8FA] truncate">
                        {otherUser?.fullName || 'User'}
                      </p>
                      <span className="text-[10px] text-[#9BAAB4]">
                        {conv.lastMessageAt
                          ? new Date(conv.lastMessageAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric'
                            })
                          : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <p className="text-[11px] text-[#9BAAB4] truncate">
                        {conv.lastMessageSnippet || 'Start conversation...'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="shrink-0 px-1.5 py-0.2 rounded-full bg-[#19D3E3] text-[#080D12] text-[9px] font-bold">
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
        className={`flex-1 flex flex-col bg-[#080D12] ${
          !activeConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversation && recipient ? (
          <>
            {/* Active Chat Header */}
            <div className="h-16 px-4 sm:px-6 border-b border-[#263640] bg-[#101A22] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden text-[#9BAAB4] hover:text-[#F4F8FA] p-1"
                  aria-label="Back to conversations"
                >
                  <Icon name="arrowLeft" className="w-5 h-5" />
                </button>
                <Avatar
                  name={recipient.fullName || 'User'}
                  src={recipient?.profile?.avatarUrl}
                  size="sm"
                  status="online"
                />
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-[#F4F8FA] leading-tight">
                    {recipient.fullName}
                  </h2>
                  <p className="text-[11px] text-[#9BAAB4]">
                    {recipient.username ? `@${recipient.username}` : recipient.email}
                  </p>
                </div>
              </div>

              {/* E2EE Protocol Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#19D3E3]/10 border border-[#19D3E3]/20 text-[#19D3E3] text-[11px] font-semibold">
                <Icon name="lock" className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AES-GCM 256-bit E2EE</span>
                <span className="sm:hidden">E2EE</span>
              </div>
            </div>

            {/* Message Request Warning Banner */}
            {(activeConversation.status === 'pending_request' || activeConversation.status === 'pending') &&
              activeConversation.initiatedBy?._id !== user?._id &&
              activeConversation.initiatedBy !== user?._id && (
                <div className="p-3 bg-[#FFB800]/10 border-b border-[#FFB800]/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-[#FFB800]">
                    <Icon name="alertCircle" className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>{recipient.fullName}</strong> sent you a message request.
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
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {loadingMessages ? (
                <div className="p-8 text-center text-xs text-[#9BAAB4]">
                  Decrypting secure message stream...
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-[#9BAAB4]">
                  <Icon name="lock" className="w-8 h-8 text-[#19D3E3]" />
                  <p className="text-xs font-semibold text-[#F4F8FA]">Client-Side Encrypted (AES-GCM 256-bit)</p>
                  <p className="text-[11px] max-w-xs">
                    Messages are encrypted in your browser using Web Crypto AES-GCM 256-bit before leaving your device.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender?._id === user?._id || msg.sender === user?._id;
                  const displayContent = msg.isEncrypted
                    ? decryptedCache[msg._id] || 'Decrypting...'
                    : msg.content;

                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] sm:max-w-md px-3.5 py-2.5 rounded-2xl text-xs break-words shadow-xs ${
                          isMine
                            ? 'bg-[#19D3E3]/20 border border-[#19D3E3]/30 text-[#F4F8FA] rounded-br-xs'
                            : 'bg-[#151F29] border border-[#263640] text-[#F4F8FA] rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{displayContent}</p>
                        <div
                          className={`flex items-center gap-1.5 mt-1 text-[9px] ${
                            isMine ? 'text-[#19D3E3]/80 justify-end' : 'text-[#9BAAB4]'
                          }`}
                        >
                          {msg.isEncrypted && <Icon name="lock" className="w-2.5 h-2.5" />}
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {isMine && (
                            <span>{msg.readBy?.length > 1 || msg.readAt ? '• Read' : '• Sent'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Partner Typing Indicator */}
              {partnerTyping && (
                <div className="flex items-center gap-1.5 text-xs text-[#9BAAB4] italic py-1 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-[#19D3E3]" />
                  <span>{recipient.fullName} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-4 border-t border-[#263640] bg-[#101A22] flex items-center gap-2.5"
            >
              <input
                type="text"
                value={messageInput}
                onChange={handleInputChange}
                placeholder={`Encrypted message to ${recipient.fullName}...`}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#151F29] border border-[#263640] text-xs text-[#F4F8FA] placeholder-[#9BAAB4] focus:outline-hidden focus:border-[#19D3E3]"
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
              <div className="w-16 h-16 rounded-2xl bg-[#151F29] border border-[#263640] flex items-center justify-center text-[#19D3E3] shadow-lg">
                <Icon name="lock" className="w-8 h-8 text-[#19D3E3]" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-[#19D3E3] bg-[#19D3E3]/15 border border-[#19D3E3]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Web Crypto AES-GCM 256-bit
                </span>
                <h2 className="text-lg font-bold text-[#F4F8FA] mt-2">End-to-End Encrypted Messaging</h2>
                <p className="text-xs text-[#9BAAB4] max-w-sm mx-auto mt-1 leading-relaxed">
                  Select an existing conversation from the list or start a direct, client-side encrypted conversation with any community member.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={openNewChatModal}
                className="flex items-center gap-2 shadow-md hover:shadow-cyan-500/20 cursor-pointer"
              >
                <Icon name="plus" className="w-4 h-4" />
                <span>Start New Encrypted Chat</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat & User Discovery Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#101A22] border border-[#263640] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#263640] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#19D3E3]/15 flex items-center justify-center text-[#19D3E3]">
                  <Icon name="lock" className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#F4F8FA]">Start Encrypted Chat</h2>
                  <p className="text-[10px] text-[#9BAAB4]">AES-GCM 256-Bit Client Encryption</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="p-1 rounded-lg text-[#9BAAB4] hover:text-[#F4F8FA] hover:bg-[#151F29] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-[#263640] bg-[#080D12]">
              <div className="relative">
                <Icon
                  name="search"
                  className="w-4 h-4 text-[#9BAAB4] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search members by name or email..."
                  value={contactSearch}
                  onChange={handleContactSearchChange}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#151F29] border border-[#263640] text-xs text-[#F4F8FA] placeholder-[#9BAAB4] focus:outline-hidden focus:border-[#19D3E3]"
                  autoFocus
                />
              </div>
            </div>

            {/* Contacts Scroll Area */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#263640]/50 p-2 max-h-[380px]">
              {loadingContacts ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-9 h-9 rounded-full bg-[#151F29]" />
                      <div className="flex-1 space-y-1.5">
                        <div className="w-24 h-3 bg-[#151F29] rounded" />
                        <div className="w-36 h-2 bg-[#151F29]/60 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : contacts.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#9BAAB4] space-y-1">
                  <Icon name="users" className="w-8 h-8 text-[#9BAAB4]/60 mx-auto mb-2" />
                  <p className="font-semibold text-[#F4F8FA]">No community members found</p>
                  <p className="text-[11px]">Try searching with a different name or email.</p>
                </div>
              ) : (
                contacts.map((contact) => (
                  <div
                    key={contact._id}
                    className="p-2.5 rounded-xl hover:bg-[#151F29] transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        name={contact.fullName || 'User'}
                        src={contact.avatarUrl}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-[#F4F8FA] truncate">
                            {contact.fullName}
                          </p>
                          {contact.role === 'admin' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-[#FF453A]/20 text-[#FF453A] font-bold">
                              Admin
                            </span>
                          )}
                          {contact.isFollowing && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-[#19D3E3]/15 text-[#19D3E3] font-medium">
                              Following
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#9BAAB4] truncate">
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
                          <Icon name="lock" className="w-3 h-3" />
                          <span>Chat</span>
                        </>
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Security Note Footer */}
            <div className="p-3 bg-[#080D12] border-t border-[#263640] flex items-center gap-2 text-[10px] text-[#9BAAB4]">
              <Icon name="shield" className="w-4 h-4 text-[#19D3E3] shrink-0" />
              <span>Web Crypto AES-GCM 256-bit encryption protects all messages before transmission.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
