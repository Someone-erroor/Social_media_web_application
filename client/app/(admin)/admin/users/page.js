'use client';

import { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';
import { adminService } from '@/services/adminService';
import { useAuth } from '@/context/AuthContext';

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { userId, nextStatus, fullName }

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getUsers({
        page,
        limit: 10,
        search,
        accountStatus,
        role
      });
      setUsers(res.users || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch registered users.');
    } finally {
      setLoading(false);
    }
  }, [search, accountStatus, role]);

  useEffect(() => {
    let ignore = false;
    adminService
      .getUsers({
        page: 1,
        limit: 10,
        search,
        accountStatus,
        role
      })
      .then((res) => {
        if (!ignore) {
          setUsers(res.users || []);
          setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to fetch registered users.');
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
  }, [search, accountStatus, role]);

  const handleStatusChange = async (userId, nextStatus) => {
    setActionLoadingId(userId);
    setError('');
    try {
      const res = await adminService.updateUserStatus(userId, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, accountStatus: res.user.accountStatus } : u))
      );
      setConfirmAction(null);
    } catch (err) {
      setError(err.message || 'Failed to update user status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Search, inspect, and moderate registered accounts and permissions"
        badge={
          <Badge variant="primary" size="sm">
            Live Directory
          </Badge>
        }
      />

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:max-w-md">
          <Input
            id="admin-search-users"
            aria-label="Search users by name or email"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Icon name="search" className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={accountStatus}
            onChange={(e) => setAccountStatus(e.target.value)}
            aria-label="Filter by account status"
            className="rounded-xl border border-[#E3E8E8] bg-white px-3 py-2 text-xs text-[#252E34] focus:outline-none focus:border-[#16B8C8]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="Filter by user role"
            className="rounded-xl border border-[#E3E8E8] bg-white px-3 py-2 text-xs text-[#252E34] focus:outline-none focus:border-[#16B8C8]"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <Button type="button" variant="outline" size="sm" onClick={() => fetchUsers(1)} disabled={loading}>
            Filter
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
          <p className="font-semibold">
            Confirm Account {confirmAction.nextStatus === 'suspended' ? 'Suspension' : 'Reactivation'}
          </p>
          <p>
            Are you sure you want to mark <strong>{confirmAction.fullName}</strong> as{' '}
            <span className="font-bold">{confirmAction.nextStatus}</span>?
            {confirmAction.nextStatus === 'suspended' &&
              ' This will immediately invalidate all active login sessions and block access.'}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant={confirmAction.nextStatus === 'suspended' ? 'danger' : 'primary'}
              size="sm"
              onClick={() => handleStatusChange(confirmAction.userId, confirmAction.nextStatus)}
              disabled={actionLoadingId === confirmAction.userId}
            >
              {actionLoadingId === confirmAction.userId
                ? 'Updating...'
                : confirmAction.nextStatus === 'suspended'
                ? 'Confirm Suspend'
                : 'Confirm Reactivate'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmAction(null)}
              disabled={Boolean(actionLoadingId)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <Card className="border-[#E3E8E8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#252E34]">
            <thead className="bg-[#F6F8F7] border-b border-[#E3E8E8] text-[#252E34] uppercase tracking-wider font-semibold">
              <tr>
                <th scope="col" className="px-5 py-3.5">User</th>
                <th scope="col" className="px-5 py-3.5">Email</th>
                <th scope="col" className="px-5 py-3.5">Role</th>
                <th scope="col" className="px-5 py-3.5">Status</th>
                <th scope="col" className="px-5 py-3.5">Joined</th>
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E8E8]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#252E34] font-medium">
                    Loading users directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      icon="users"
                      title="No Users Found"
                      description="No registered user accounts match the current query criteria."
                      className="border-none rounded-none bg-white py-12"
                    />
                  </td>
                </tr>
              ) : (
                users.map((targetUser) => {
                  const isCurrentAdmin =
                    currentAdmin &&
                    (currentAdmin._id === targetUser._id || currentAdmin.id === targetUser._id);
                  const isSuspended = targetUser.accountStatus === 'suspended';

                  return (
                    <tr key={targetUser._id} className="hover:bg-[#F6F8F7]/60 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            name={targetUser.fullName}
                            src={targetUser.profile?.avatarUrl}
                            size="sm"
                          />
                          <span className="font-semibold text-[#172126]">
                            {targetUser.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[#58666D]">
                        {targetUser.email}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <Badge variant={targetUser.role === 'admin' ? 'primary' : 'neutral'} size="sm">
                          {targetUser.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <Badge variant={isSuspended ? 'danger' : 'success'} size="sm">
                          {isSuspended ? 'Suspended' : 'Active'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-[#58666D]">
                        {formatDate(targetUser.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        {isCurrentAdmin ? (
                          <span className="text-[11px] text-[#58666D] italic">Current Session</span>
                        ) : (
                          <Button
                            type="button"
                            variant={isSuspended ? 'outline' : 'danger'}
                            size="sm"
                            disabled={actionLoadingId === targetUser._id}
                            onClick={() =>
                              setConfirmAction({
                                userId: targetUser._id,
                                nextStatus: isSuspended ? 'active' : 'suspended',
                                fullName: targetUser.fullName
                              })
                            }
                          >
                            {isSuspended ? 'Reactivate' : 'Suspend'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[#E3E8E8] bg-[#F6F8F7]/50 text-xs text-[#58666D]">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total members)
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchUsers(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => fetchUsers(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
