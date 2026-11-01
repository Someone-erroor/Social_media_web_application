'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import { adminService } from '@/services/adminService';

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
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getActionBadgeVariant(action) {
  switch (action) {
    case 'user_registration':
      return 'success';
    case 'successful_login':
      return 'primary';
    case 'post_creation':
      return 'neutral';
    case 'post_deletion':
    case 'comment_deletion':
      return 'danger';
    case 'admin_action':
      return 'warning';
    default:
      return 'neutral';
  }
}

function formatActionTitle(action) {
  switch (action) {
    case 'user_registration':
      return 'User Registered';
    case 'successful_login':
      return 'User Logged In';
    case 'post_creation':
      return 'Post Published';
    case 'post_deletion':
      return 'Post Deleted';
    case 'comment_creation':
      return 'Comment Added';
    case 'like_creation':
      return 'Post Liked';
    case 'admin_action':
      return 'Admin Action';
    case 'email_verification':
      return 'Email Verified';
    case 'password_reset':
      return 'Password Reset';
    default:
      return action.replace(/_/g, ' ');
  }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    setError('');
    try {
      const [statsRes, activityRes] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getDashboardActivity(15)
      ]);
      setStats(statsRes.stats || null);
      setActivities(activityRes.activities || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve administrative telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    Promise.all([
      adminService.getDashboardStats(),
      adminService.getDashboardActivity(15)
    ])
      .then(([statsRes, activityRes]) => {
        if (!ignore) {
          setStats(statsRes.stats || null);
          setActivities(activityRes.activities || []);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to retrieve administrative telemetry.');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleRetry = () => {
    setLoading(true);
    loadDashboardData();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Administrative Overview"
          description="Live platform telemetry, operational database statistics, and audit activity"
          badge={
            <Badge variant="primary" size="sm">
              Admin Console &bull; Real Telemetry
            </Badge>
          }
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRetry}
          disabled={loading}
          icon={<Icon name="activity" className="w-4 h-4" />}
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Error Alert with Retry */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Icon name="close" className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button type="button" variant="danger" size="sm" onClick={handleRetry}>
            Retry
          </Button>
        </div>
      )}

      {/* Real Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Total Users
              </span>
              <span className="p-2 rounded-xl bg-cyan-50 text-[#087F8A]">
                <Icon name="users" className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {loading ? '...' : stats?.users?.total ?? 0}
              </div>
              <p className="mt-1 text-[11px] text-slate-600">
                {loading
                  ? 'Loading metrics...'
                  : `${stats?.users?.active ?? 0} active &bull; ${stats?.users?.suspended ?? 0} suspended`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Published Posts */}
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Published Posts
              </span>
              <span className="p-2 rounded-xl bg-[#FF725E]/10 text-[#FF725E]">
                <Icon name="posts" className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {loading ? '...' : stats?.content?.posts ?? 0}
              </div>
              <p className="mt-1 text-[11px] text-slate-600">
                {loading ? 'Loading metrics...' : 'Total community posts in MongoDB'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Discussion Comments */}
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Total Comments
              </span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Icon name="comments" className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {loading ? '...' : stats?.content?.comments ?? 0}
              </div>
              <p className="mt-1 text-[11px] text-slate-600">
                {loading ? 'Loading metrics...' : 'Total discussion replies'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Platform Likes */}
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Total Likes
              </span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Icon name="heart" className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {loading ? '...' : stats?.content?.likes ?? 0}
              </div>
              <p className="mt-1 text-[11px] text-slate-600">
                {loading ? 'Loading metrics...' : 'Total post reactions recorded'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status Details */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>System Architecture Status</CardTitle>
              <CardDescription>
                Live database connectivity and runtime telemetry
              </CardDescription>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Database: {stats?.system?.databaseStatus || 'connected'} ({stats?.system?.databaseName || 'looply'})
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-600 block text-[11px]">New Registrations Today</span>
              <span className="text-base font-bold text-slate-900 mt-1 block">
                {loading ? '...' : stats?.users?.newToday ?? 0}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-600 block text-[11px]">New Registrations This Week</span>
              <span className="text-base font-bold text-slate-900 mt-1 block">
                {loading ? '...' : stats?.users?.newThisWeek ?? 0}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-600 block text-[11px]">Verified Email Accounts</span>
              <span className="text-base font-bold text-slate-900 mt-1 block">
                {loading ? '...' : stats?.users?.verified ?? 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Platform Activity */}
      <Card className="border-slate-200 overflow-hidden">
        <CardHeader>
          <CardTitle>Recent Platform Activity</CardTitle>
          <CardDescription>
            Real audit trail events captured in ActivityLog
          </CardDescription>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th scope="col" className="px-5 py-3.5">Action</th>
                <th scope="col" className="px-5 py-3.5">Actor</th>
                <th scope="col" className="px-5 py-3.5">Target</th>
                <th scope="col" className="px-5 py-3.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Loading recent audit activity...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-0">
                    <EmptyState
                      icon="activity"
                      title="No Audit Activity Recorded"
                      description="Platform security events, user logins, and administrative actions will populate this ledger."
                      className="border-none rounded-none bg-white py-10"
                    />
                  </td>
                </tr>
              ) : (
                activities.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                        {formatActionTitle(log.action)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {log.actor ? (
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={log.actor.fullName}
                            src={log.actor.avatarUrl}
                            size="sm"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {log.actor.fullName}
                            </span>
                            <span className="text-[10px] text-slate-600 font-mono">
                              {log.actor.email}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">System / Visitor</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-700">
                      {log.targetType ? `${log.targetType} (${log.targetId ? log.targetId.slice(-6) : '—'})` : '—'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">
                      {formatTimestamp(log.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
