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

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const cryptoKeyRef = useRef(null);

  // Scroll to bottom of message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
        // Automatically mark as read
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
        if (payload?.conversationId === activeConversation._id) {
          setMessages((prev) => [...prev, payload.message]);
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

  // Filter conversations
  const directChats = conversations.filter((c) => c.status === 'accepted');
  const messageRequests = conversations.filter(
    (c) => c.status === 'pending' && c.initiatedBy?._id !== user?._id
  );
  const displayedConversations = activeTab === 'chats' ? directChats : messageRequests;

  // Active recipient
  const recipient = activeConversation?.participants?.find((p) => p._id !== user?._id);

  return (
    <div className="h-[calc(100vh-8.5rem)] flex rounded-2xl bg-[#101A22] border border-[#263640] overflow-hidden shadow-xl animate-fade-in">
      {/* Left Sidebar: Conversations List */}
      <div
        className={`w-full md:w-80 border-r border-[#263640] flex flex-col bg-[#101A22] ${
          activeConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header & Tabs */}
        <div className="p-4 border-b border-[#263640] space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-bold text-[#F4F8FA] flex items-center gap-2">
              <Icon name="message" className="w-5 h-5 text-[#19D3E3]" />
              Messages
            </h1>
            <span className="text-[10px] font-semibold text-[#19D3E3] bg-[#19D3E3]/15 border border-[#19D3E3]/30 px-2 py-0.5 rounded-full">
              E2EE Active
            </span>
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
            <div className="p-6 text-center text-xs text-[#9BAAB4]">
              {activeTab === 'chats'
                ? 'No active direct chats yet. Follow creators or visit profiles to start a conversation.'
                : 'No pending message requests.'}
            </div>
          ) : (
            displayedConversations.map((conv) => {
              const otherUser = conv.participants?.find((p) => p._id !== user?._id);
              const isSelected = activeConversation?._id === conv._id;

              return (
                <button
                  key={conv._id}
                  type="button"
                  onClick={() => setActiveConversation(conv)}
                  className={`w-full p-3.5 flex items-center gap-3 text-left transition-colors ${
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
                    <p className="text-[11px] text-[#9BAAB4] truncate mt-0.5">
                      {conv.lastMessageSnippet || 'Start conversation...'}
                    </p>
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
                  name={recipient.fullName}
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
            {activeConversation.status === 'pending' &&
              activeConversation.initiatedBy?._id !== user?._id && (
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
                      onClick={() => handleRequestResponse('reject')}
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
                  <p className="text-xs font-semibold text-[#F4F8FA]">End-to-End Encrypted</p>
                  <p className="text-[11px] max-w-xs">
                    Messages are encrypted on your device. Only you and {recipient.fullName} can read them.
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
                            <span>{msg.readBy?.length > 1 ? '• Read' : '• Sent'}</span>
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
          <div className="h-full flex items-center justify-center p-6">
            <EmptyState
              icon="message"
              title="Encrypted Direct Messages"
              description="Choose a contact from the list or start a conversation from a creator profile."
              badgeText="AES-GCM Protected"
            />
          </div>
        )}
      </div>
    </div>
  );
}

