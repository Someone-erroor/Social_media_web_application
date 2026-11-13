'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import { moodOrbitService } from '@/services/moodOrbitService';
import { safetyService } from '@/services/safetyService';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { ROUTES } from '@/lib/routes';

const MOOD_THEMES = {
  creative: {
    bgGradient: 'from-[#EEEAFE] to-white',
    borderColor: 'border-[#6C63FF]/30',
    accentText: 'text-[#6C63FF]',
    badgeVariant: 'primary'
  },
  curious: {
    bgGradient: 'from-[#E8F7EE] to-white',
    borderColor: 'border-[#4CAF78]/30',
    accentText: 'text-[#2E7D4E]',
    badgeVariant: 'lime'
  },
  chill: {
    bgGradient: 'from-[#E0F2FE] to-white',
    borderColor: 'border-[#0284C7]/30',
    accentText: 'text-[#0284C7]',
    badgeVariant: 'neutral'
  },
  energized: {
    bgGradient: 'from-[#FFF7E0] to-white',
    borderColor: 'border-[#FFD166]/40',
    accentText: 'text-[#B28200]',
    badgeVariant: 'yellow'
  },
  focused: {
    bgGradient: 'from-[#EEEAFE] to-white',
    borderColor: 'border-[#6C63FF]/30',
    accentText: 'text-[#6C63FF]',
    badgeVariant: 'lavender'
  },
  reflective: {
    bgGradient: 'from-[#FFEAEA] to-white',
    borderColor: 'border-[#FF6B6B]/30',
    accentText: 'text-[#FF6B6B]',
    badgeVariant: 'coral'
  }
};

function formatMessageTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatCountdown(expiresAt) {
  if (!expiresAt) return '';
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m remaining`;
}

export default function MoodOrbitRoomPage({ params }) {
  const unwrappedParams = use(params);
  const roomId = unwrappedParams.roomId;
  const router = useRouter();

  const { user } = useAuth();
  const { socket } = useNotifications();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);

  // Safety report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState('spam');
  const [reportExplanation, setReportExplanation] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadRoomData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await moodOrbitService.getRoom(roomId);
      if (res?.success) {
        setRoom(res.room);
        setMessages(res.messages || []);
      } else {
        throw new Error(res?.message || 'Could not find room.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to space.');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    loadRoomData();
  }, [loadRoomData]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time socket presence and message subscription
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit('mood_orbit:join', { roomId });

    const handleNewMessage = (payload) => {
      if (payload.roomId === roomId && payload.message) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === payload.message._id)) return prev;
          return [...prev, payload.message];
        });
      }
    };

    const handlePresenceUpdate = (payload) => {
      if (payload.roomId === roomId && payload.participantsCount !== undefined) {
        setRoom((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            participantsCount: payload.participantsCount,
            participants: payload.participants || prev.participants
          };
        });
      }
    };

    socket.on('mood_orbit:message', handleNewMessage);
    socket.on('mood_orbit:presence', handlePresenceUpdate);

    return () => {
      socket.emit('mood_orbit:leave', { roomId });
      socket.off('mood_orbit:message', handleNewMessage);
      socket.off('mood_orbit:presence', handlePresenceUpdate);
    };
  }, [socket, roomId]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await moodOrbitService.joinRoom(roomId);
      if (res?.success) {
        setRoom(res.room);
      }
    } catch (err) {
      setError(err.message || 'Failed to enter space.');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    try {
      await moodOrbitService.leaveRoom(roomId);
      router.push(ROUTES.USER.MOOD_ORBIT);
    } catch (err) {
      setError(err.message || 'Failed to leave space.');
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!messageInput.trim() || sending) return;

    setSending(true);
    try {
      const newMsg = await moodOrbitService.postMessage(roomId, {
        content: messageInput.trim()
      });

      setMessageInput('');
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMsg.message?._id)) return prev;
        return [...prev, newMsg.message];
      });
    } catch (err) {
      setError(err.message || 'Failed to post message.');
    } finally {
      setSending(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      await safetyService.createReport({
        targetType: 'MoodOrbitRoom',
        reportedTarget: roomId,
        category: reportCategory,
        explanation: reportExplanation.trim()
      });
      setReportSuccess('Report submitted to Trust & Safety moderation team.');
      setShowReportModal(false);
      setReportExplanation('');
    } catch (err) {
      setError(err.message || 'Failed to file report.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-28 bg-white rounded-2xl border border-[#E7E5E0]" />
        <div className="h-96 bg-white rounded-2xl border border-[#E7E5E0]" />
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#FFEAEA] text-[#FF6B6B] mx-auto flex items-center justify-center">
          <Icon name="alertCircle" className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#1E1E24]">Orbit Connection Failed</h2>
        <p className="text-xs text-[#6B6B73]">{error}</p>
        <Link href={ROUTES.USER.MOOD_ORBIT}>
          <Button variant="outline" size="sm">
            Back to Mood-Orbit
          </Button>
        </Link>
      </div>
    );
  }

  const moodTheme = MOOD_THEMES[room?.mood] || MOOD_THEMES.creative;
  const isExpired = room?.status === 'expired' || new Date(room?.expiresAt) < new Date();

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header & Navigation Bar */}
      <div className="flex items-center justify-between text-xs text-[#6B6B73]">
        <Link
          href={ROUTES.USER.MOOD_ORBIT}
          className="inline-flex items-center gap-1.5 hover:text-[#6C63FF] transition-colors"
        >
          <Icon name="arrowLeft" className="w-3.5 h-3.5" />
          <span>All Mood-Orbit Rooms</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="hover:text-[#FF6B6B] transition-colors cursor-pointer"
          >
            Report Space
          </button>
          {room?.isParticipant && (
            <button
              type="button"
              onClick={handleLeave}
              className="text-[#FF6B6B] hover:underline cursor-pointer"
            >
              Leave Space
            </button>
          )}
        </div>
      </div>

      {reportSuccess && (
        <div className="p-3.5 rounded-xl bg-[#E8F7EE] border border-[#4CAF78]/30 text-xs text-[#2E7D4E] flex items-center justify-between">
          <span>{reportSuccess}</span>
          <button type="button" onClick={() => setReportSuccess('')} className="font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* Atmospheric Space Banner */}
      <div
        className={`p-6 sm:p-7 rounded-2xl bg-gradient-to-br ${moodTheme.bgGradient} bg-white border ${moodTheme.borderColor} shadow-xs relative overflow-hidden space-y-4`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-white border border-[#E7E5E0] text-[#6C63FF] shadow-2xs">
              <Icon name="sparkles" className="w-5 h-5" />
            </span>
            <Badge variant={moodTheme.badgeVariant} size="sm">
              {room?.mood?.toUpperCase()} ORBIT
            </Badge>
            <span className="text-xs font-mono text-[#6B6B73]">
              {formatCountdown(room?.expiresAt)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-white border border-[#E7E5E0] text-[#1E1E24] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#4CAF78] animate-pulse" />
              {room?.participantsCount || 0} / {room?.maxParticipants} Active
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-[#1E1E24] font-display tracking-tight">
            {room?.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B73] leading-relaxed max-w-2xl">
            {room?.intention}
          </p>
        </div>

        {/* Room Prompt Card */}
        {room?.prompt && (
          <div className="p-3.5 rounded-xl bg-white/90 border border-[#E7E5E0] flex items-center gap-3 shadow-2xs">
            <Icon name="info" className="w-4 h-4 text-[#6C63FF] shrink-0" />
            <p className="text-xs text-[#1E1E24] italic">
              <strong>Atmospheric Prompt:</strong> "{room.prompt}"
            </p>
          </div>
        )}
      </div>

      {/* Two-Column Grid: Conversation Stream & Presence Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Conversation Stream */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="bg-white border-[#E7E5E0] flex flex-col h-[520px] shadow-xs">
            <CardHeader className="pb-3 border-b border-[#E7E5E0]">
              <div className="flex items-center justify-between">
                <CardTitle>Atmospheric Stream</CardTitle>
                <span className="text-[11px] text-[#6B6B73] font-mono">
                  Real-time broadcast active
                </span>
              </div>
            </CardHeader>

            {/* Messages Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#6B6B73] space-y-2">
                  <Icon name="sparkles" className="w-8 h-8 text-[#6C63FF]/60" />
                  <p className="text-xs font-semibold text-[#1E1E24]">A Quiet Orbit</p>
                  <p className="text-[11px] max-w-xs">
                    Be the first to share a thought, answer the prompt, or set the atmosphere.
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isCurrentUser = user && (user._id === msg.sender || user.id === msg.sender);

                  return (
                    <div
                      key={msg._id || idx}
                      className={`flex gap-2.5 max-w-[85%] ${
                        isCurrentUser ? 'ml-auto flex-row-reverse' : ''
                      }`}
                    >
                      <Avatar
                        name={msg.senderName || 'Member'}
                        src={msg.senderAvatar}
                        size="xs"
                        className="shrink-0 mt-0.5"
                      />
                      <div className="space-y-1">
                        <div
                          className={`flex items-center gap-2 text-[10px] ${
                            isCurrentUser ? 'justify-end' : ''
                          }`}
                        >
                          <span className="font-semibold text-[#1E1E24]">
                            {isCurrentUser ? 'You' : msg.senderName}
                          </span>
                          <span className="text-[#6B6B73] font-mono">
                            {formatMessageTime(msg.createdAt)}
                          </span>
                        </div>
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed break-words ${
                            isCurrentUser
                              ? 'bg-[#6C63FF] text-white rounded-tr-xs font-medium'
                              : 'bg-[#F1F0EC] border border-[#E7E5E0] text-[#1E1E24] rounded-tl-xs'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer Footer */}
            <div className="p-3 border-t border-[#E7E5E0] bg-[#F8F7F4] rounded-b-2xl">
              {isExpired ? (
                <p className="text-center text-xs text-[#6B6B73] italic py-2">
                  This Mood-Orbit room has expired and closed.
                </p>
              ) : !room?.isParticipant ? (
                <div className="flex items-center justify-between p-2">
                  <span className="text-xs text-[#6B6B73]">
                    You are in preview mode. Join the orbit to contribute to the stream.
                  </span>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleJoin}
                    disabled={joining}
                  >
                    {joining ? 'Entering...' : 'Join Space'}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Share an impression, project update, or thought..."
                    maxLength={500}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-[#E7E5E0] text-xs text-[#1E1E24] placeholder:text-[#6B6B73]/60 focus:outline-none focus:border-[#6C63FF]"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={sending || !messageInput.trim()}
                    icon={<Icon name="send" className="w-3.5 h-3.5" />}
                  >
                    Send
                  </Button>
                </form>
              )}
            </div>
          </Card>
        </div>

        {/* Presence Roster Column */}
        <div className="space-y-4">
          <Card className="bg-white border-[#E7E5E0] shadow-xs">
            <CardHeader className="pb-3 border-b border-[#E7E5E0]">
              <CardTitle className="text-xs">
                Active Operatives ({room?.participants?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 max-h-[460px] overflow-y-auto scrollbar-none">
              {room?.participants?.length === 0 ? (
                <p className="text-[11px] text-[#6B6B73] italic">No active operatives in this orbit.</p>
              ) : (
                room?.participants?.map((p, idx) => (
                  <div
                    key={p.user?._id || idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        name={p.user?.fullName || 'Operative'}
                        src={p.user?.profile?.avatarUrl}
                        size="xs"
                        status="online"
                      />
                      <span className="text-xs font-semibold text-[#1E1E24] truncate">
                        {p.user?.fullName || 'Anonymous'}
                      </span>
                    </div>

                    <span className="w-2 h-2 rounded-full bg-[#4CAF78]" title="Present" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Safety Report Modal */}
      {showReportModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
        >
          <div className="w-full max-w-md bg-white border border-[#E7E5E0] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E0]">
              <h3 className="text-sm font-bold text-[#1E1E24]">Report Mood-Orbit Space</h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-[#6B6B73] hover:text-[#1E1E24] p-1 cursor-pointer"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#1E1E24] font-semibold">Violation Category</label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E0] text-[#1E1E24]"
                >
                  <option value="spam">Spam / Low Quality</option>
                  <option value="harassment">Harassment / Bullying</option>
                  <option value="hate_speech">Hate Speech</option>
                  <option value="other">Other Violation</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[#1E1E24] font-semibold">Details / Context</label>
                <textarea
                  rows={3}
                  value={reportExplanation}
                  onChange={(e) => setReportExplanation(e.target.value)}
                  placeholder="Explain why this space violates community guidelines..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E0] text-[#1E1E24]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReportModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="danger" size="sm">
                  Submit Report
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
