'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
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

export default function AdminNotificationsPage() {
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

  const [filter, setFilter] = useState('all'); // 'all' | 'login_alerts' | 'unread'
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [actionError, setActionError] = useState('');

  const loginAlerts = notifications.filter((n) => n.type === 'login_alert');

  const displayedAlerts = notifications.filter((n) => {
    if (filter === 'login_alerts') return n.type === 'login_alert';
    if (filter === 'unread') return !n.readAt;
    return true;
  });

  const totalPages = Math.ceil(displayedAlerts.length / pageSize) || 1;
  const paginatedAlerts = displayedAlerts.slice((page - 1) * pageSize, page * pageSize);

  const handleRefresh = async () => {
    setActionError('');
    try {
      await refreshNotifications();
    } catch (err) {
      setActionError(err.message || 'Failed to refresh notifications.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Security &amp; Login Alerts"
          description="Live administrative notification feed tracking user logins, system alerts, and critical security checkpoints"
          badge={
            <Badge variant={isConnected ? 'success' : 'neutral'} size="sm">
              {isConnected ? 'Real-time Socket Connected' : 'Sync Active'}
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

      {(contextError || actionError) && (
        <div className="p-3.5 rounded-xl bg-[#FFEAEA] border border-[#FF6B6B]/30 text-xs text-[#FF6B6B] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Icon name="alertCircle" className="w-4 h-4 text-[#FF6B6B] shrink-0" />
            <span>{contextError || actionError}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="font-medium underline hover:text-[#1E1E24]"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => setActionError('')}
              className="text-[#FF6B6B] hover:text-[#1E1E24] font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E7E5E0] pb-2 text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setFilter('all');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 ${
            filter === 'all'
              ? 'bg-[#6C63FF] text-white font-semibold shadow-xs'
              : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC]'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setFilter('login_alerts');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 ${
            filter === 'login_alerts'
              ? 'bg-[#6C63FF] text-white font-semibold shadow-xs'
              : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC]'
          }`}
        >
          User Login Events ({loginAlerts.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setFilter('unread');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 ${
            filter === 'unread'
              ? 'bg-[#6C63FF] text-white font-semibold shadow-xs'
              : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC]'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Alerts Table / Feed */}
      <Card className="overflow-hidden bg-[#FFFFFF] border-[#E7E5E0] shadow-xs">
        <CardHeader>
          <CardTitle className="text-[#1E1E24]">User Authentication Event Log</CardTitle>
          <CardDescription className="text-[#6B6B73]">
            Recorded whenever registered members sign in across the platform
          </CardDescription>
        </CardHeader>

        {loading && notifications.length === 0 ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-[#F8F7F4] rounded-lg w-full" />
            ))}
          </div>
        ) : displayedAlerts.length === 0 ? (
          <EmptyState
            icon="notifications"
            title="No Authentication Alerts"
            description="When users log in or administrative security events occur, real-time alerts will appear here."
            badgeText="Login Security"
            className="border-none rounded-none bg-transparent py-12"
          />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#1E1E24]">
                <thead className="bg-[#F8F7F4] border-b border-[#E7E5E0] text-[#6B6B73] uppercase tracking-wider font-semibold">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">User</th>
                    <th scope="col" className="px-5 py-3.5">Email</th>
                    <th scope="col" className="px-5 py-3.5">Event Type</th>
                    <th scope="col" className="px-5 py-3.5">Timestamp</th>
                    <th scope="col" className="px-5 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E5E0]">
                  {paginatedAlerts.map((alert) => {
                    const actor = alert.actor || {};
                    const isUnread = !alert.readAt;

                    return (
                      <tr
                        key={alert._id}
                        className={`transition-colors ${
                          isUnread ? 'bg-[#EEEAFE]/30 font-medium' : 'hover:bg-[#F8F7F4]/60'
                        }`}
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              name={actor.fullName || 'User'}
                              src={actor.profile?.avatarUrl}
                              size="sm"
                            />
                            <span className="font-semibold text-[#1E1E24]">
                              {actor.fullName || 'Unknown Member'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[#6B6B73]">
                          {actor.email || '—'}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <Badge
                            variant={alert.type === 'login_alert' ? 'yellow' : 'neutral'}
                            size="sm"
                          >
                            {alert.type === 'login_alert' ? 'Login Success' : alert.type}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-[#6B6B73]">
                          {formatTimestamp(alert.createdAt)}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-right">
                          {isUnread ? (
                            <button
                              type="button"
                              onClick={() => markAsRead(alert._id)}
                              className="text-[#6C63FF] hover:underline font-semibold"
                            >
                              Mark read
                            </button>
                          ) : (
                            <span className="text-[#6B6B73] italic">Read</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-[#E7E5E0] flex items-center justify-between text-xs text-[#6B6B73] bg-[#F8F7F4]">
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
      </Card>
    </div>
  );
}
