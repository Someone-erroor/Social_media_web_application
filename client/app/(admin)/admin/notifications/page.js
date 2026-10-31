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
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="alertCircle" className="w-4 h-4 text-red-600 shrink-0" />
            <span>{contextError || actionError}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="font-medium underline hover:text-red-900"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => setActionError('')}
              className="text-red-500 hover:text-red-700 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setFilter('all');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 ${
            filter === 'all'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Alerts Table / Feed */}
      <Card className="border-slate-200 overflow-hidden">
        <CardHeader>
          <CardTitle>User Authentication Event Log</CardTitle>
          <CardDescription>
            Recorded whenever registered members sign in across the platform
          </CardDescription>
        </CardHeader>

        {loading && notifications.length === 0 ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded-lg w-full" />
            ))}
          </div>
        ) : displayedAlerts.length === 0 ? (
          <EmptyState
            icon="notifications"
            title="No Authentication Alerts"
            description="When users log in or administrative security events occur, real-time alerts will appear here."
            badgeText="Login Security"
            className="border-none rounded-none bg-white py-12"
          />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">User</th>
                    <th scope="col" className="px-5 py-3.5">Email</th>
                    <th scope="col" className="px-5 py-3.5">Event Type</th>
                    <th scope="col" className="px-5 py-3.5">Timestamp</th>
                    <th scope="col" className="px-5 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAlerts.map((alert) => {
                    const actor = alert.actor || {};
                    const isUnread = !alert.readAt;

                    return (
                      <tr
                        key={alert._id}
                        className={`transition-colors ${
                          isUnread ? 'bg-indigo-50/20 font-medium' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              name={actor.fullName || 'User'}
                              src={actor.profile?.avatarUrl}
                              size="sm"
                            />
                            <span className="font-semibold text-slate-900">
                              {actor.fullName || 'Unknown Member'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap font-mono text-slate-500">
                          {actor.email || '—'}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <Badge
                            variant={alert.type === 'login_alert' ? 'warning' : 'neutral'}
                            size="sm"
                          >
                            {alert.type === 'login_alert' ? 'Login Success' : alert.type}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-400">
                          {formatTimestamp(alert.createdAt)}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-right">
                          {isUnread ? (
                            <button
                              type="button"
                              onClick={() => markAsRead(alert._id)}
                              className="text-indigo-600 hover:text-indigo-800 font-semibold"
                            >
                              Mark read
                            </button>
                          ) : (
                            <span className="text-slate-400 italic">Read</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
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
