'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';
import { useNotifications } from '@/context/NotificationContext';

function formatTimestamp(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getNotificationIcon(type) {
  switch (type) {
    case 'post_like':
      return <Icon name="heart" className="w-4 h-4 text-[#FF6257] fill-[#FF6257]" />;
    case 'post_comment':
      return <Icon name="comments" className="w-4 h-4 text-[#B9A8F5]" />;
    case 'follow':
    case 'follow_request_accepted':
      return <Icon name="users" className="w-4 h-4 text-[#D5F36A]" />;
    case 'follow_request':
      return <Icon name="clock" className="w-4 h-4 text-[#FBBF24]" />;
    case 'message':
      return <Icon name="message" className="w-4 h-4 text-[#FF6257]" />;
    case 'circle_invite':
      return <Icon name="circles" className="w-4 h-4 text-[#B9A8F5]" />;
    case 'time_capsule_unlocked':
      return <Icon name="vault" className="w-4 h-4 text-[#D5F36A]" />;
    case 'game_challenge':
      return <Icon name="play" className="w-4 h-4 text-[#D5F36A]" />;
    case 'moderation_warning':
      return <Icon name="alertCircle" className="w-4 h-4 text-[#FF6257]" />;
    case 'login_alert':
      return <Icon name="lock" className="w-4 h-4 text-[#FBBF24]" />;
    default:
      return <Icon name="notifications" className="w-4 h-4 text-[#777580]" />;
  }
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    error: contextError,
    isConnected,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  } = useNotifications();

  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'likes' | 'comments'
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [errorNotice, setErrorNotice] = useState('');

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.readAt;
    if (filter === 'likes') return n.type === 'post_like';
    if (filter === 'comments') return n.type === 'post_comment';
    return true;
  });

  const totalPages = Math.ceil(filteredNotifications.length / pageSize) || 1;
  const paginatedNotifications = filteredNotifications.slice((page - 1) * pageSize, page * pageSize);

  const handleRefresh = async () => {
    setErrorNotice('');
    try {
      await refreshNotifications();
    } catch (err) {
      setErrorNotice(err.message || 'Failed to refresh notifications.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Notifications"
          description="Real-time alerts, post reactions, and community interactions"
          badge={
            <Badge variant={isConnected ? 'lime' : 'neutral'} size="sm">
              {isConnected ? 'Real-time Connected' : 'Sync Active'}
            </Badge>
          }
        />

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            icon={<Icon name="activity" className="w-3.5 h-3.5" />}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>

          {unreadCount > 0 && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={markAllAsRead}
              icon={<Icon name="check" className="w-3.5 h-3.5" />}
            >
              Mark all read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {(contextError || errorNotice) && (
        <div className="p-3.5 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="alertCircle" className="w-4 h-4 text-[#FF6257] shrink-0" />
            <span>{contextError || errorNotice}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="font-medium underline hover:text-[#FF8178]"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => setErrorNotice('')}
              className="text-[#FF6257] hover:text-[#FF8178] font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2D2938] pb-3 text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setFilter('all');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
            filter === 'all'
              ? 'bg-[#FF6257] text-[#17151D] shadow-sm'
              : 'text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26]'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setFilter('unread');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
            filter === 'unread'
              ? 'bg-[#FF6257] text-[#17151D] shadow-sm'
              : 'text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26]'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => {
            setFilter('likes');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
            filter === 'likes'
              ? 'bg-[#FF6257] text-[#17151D] shadow-sm'
              : 'text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26]'
          }`}
        >
          Likes
        </button>
        <button
          type="button"
          onClick={() => {
            setFilter('comments');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
            filter === 'comments'
              ? 'bg-[#FF6257] text-[#17151D] shadow-sm'
              : 'text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26]'
          }`}
        >
          Comments
        </button>
      </div>

      {/* Loading Skeletons */}
      {loading && notifications.length === 0 ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-[#2D2938] bg-[#1E1B26] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#24202E] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 bg-[#24202E] rounded" />
                <div className="h-2 w-1/4 bg-[#24202E]/60 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          icon="notifications"
          title={filter === 'unread' ? 'No Unread Alerts' : 'No Notifications Yet'}
          description={
            filter === 'unread'
              ? "You're all caught up! No unread notifications found."
              : 'When members like your posts or leave comments, real-time alerts will appear here.'
          }
          badgeText="Live Activity"
        />
      ) : (
        <div className="space-y-2.5">
          {paginatedNotifications.map((notif) => {
            const isUnread = !notif.readAt;
            const actor = notif.actor || {};

            return (
              <Card
                key={notif._id}
                className={`transition-colors ${
                  isUnread
                    ? 'bg-[#1E1B26] border-[#FF6257]/40 shadow-sm'
                    : 'bg-[#1E1B26]/70 border-[#2D2938] hover:bg-[#24202E]/60'
                }`}
              >
                <div className="p-4 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <Avatar
                        name={actor.fullName || 'User'}
                        src={actor.profile?.avatarUrl}
                        size="md"
                      />
                      <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#17151D] border border-[#2D2938] shadow-xs">
                        {getNotificationIcon(notif.type)}
                      </span>
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <p className="text-[#F6F2EA] leading-snug">
                        {notif.message}
                      </p>
                      <span className="text-[11px] text-[#777580] block font-mono">
                        {formatTimestamp(notif.createdAt)}
                      </span>
                    </div>
                  </div>

                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => markAsRead(notif._id)}
                      className="shrink-0 p-1.5 rounded-lg text-[#FF6257] hover:bg-[#FF6257]/10 transition-colors text-[11px] font-semibold"
                      title="Mark as read"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </Card>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-3 flex items-center justify-between text-xs text-[#777580]">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
