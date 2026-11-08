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
import { authService } from '@/services/authService';
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
  const [successNotice, setSuccessNotice] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { userId, nextStatus, fullName }

  // Admin creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

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

  const handleRoleChange = async (userId, nextRole) => {
    setActionLoadingId(userId);
    setError('');
    setSuccessNotice('');
    try {
      const res = await adminService.updateUserRole(userId, nextRole);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: res.user.role } : u))
      );
      setSuccessNotice(`User role updated to ${nextRole}.`);
    } catch (err) {
      setError(err.message || 'Failed to update user role.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateAdminSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!createName.trim()) {
      setCreateError('Full name is required.');
      return;
    }
    if (!createEmail.trim()) {
      setCreateError('Admin email is required.');
      return;
    }
    if (!createPassword || createPassword.length < 8) {
      setCreateError('Password must be at least 8 characters.');
      return;
    }

    setCreateLoading(true);
    try {
      await authService.registerAdmin({
        fullName: createName.trim(),
        email: createEmail.trim(),
        password: createPassword
      });
      setShowCreateModal(false);
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('');
      setSuccessNotice('New administrator account created and active!');
      fetchUsers(1);
    } catch (err) {
      setCreateError(err.message || 'Failed to create administrator account.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Search, inspect, and moderate registered accounts and permissions"
        badge={
          <Badge variant="lavender" size="sm">
            Live Directory
          </Badge>
        }
        action={
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            icon={<Icon name="shield" className="w-4 h-4" />}
          >
            Create Administrator
          </Button>
        }
      />

      {/* Success Banner */}
      {successNotice && (
        <div className="p-3.5 rounded-xl bg-[#D5F36A]/10 border border-[#D5F36A]/30 text-xs text-[#D5F36A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="check" className="w-4 h-4 text-[#D5F36A] shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button type="button" onClick={() => setSuccessNotice('')} className="text-[#D5F36A] hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257] flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-[#FF6257] hover:text-white">
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Create Administrator Inline Card / Modal */}
      {showCreateModal && (
        <Card className="p-5 border-[#2D2938] bg-[#1E1B26] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#2D2938] pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#B9A8F5]/15 text-[#B9A8F5]">
                <Icon name="shield" className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-[#F6F2EA]">Create Platform Administrator</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setCreateError('');
              }}
              className="text-[#777580] hover:text-white font-bold"
            >
              ✕
            </button>
          </div>

          {createError && (
            <div className="p-3 rounded-lg bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257]">
              {createError}
            </div>
          )}

          <form onSubmit={handleCreateAdminSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="create-admin-name" className="block text-[11px] font-medium text-[#777580] mb-1">
                Admin Full Name *
              </label>
              <Input
                id="create-admin-name"
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. System Admin"
                disabled={createLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="create-admin-email" className="block text-[11px] font-medium text-[#777580] mb-1">
                Admin Email / ID *
              </label>
              <Input
                id="create-admin-email"
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="admin@example.com"
                disabled={createLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="create-admin-pass" className="block text-[11px] font-medium text-[#777580] mb-1">
                Password (min 8 chars) *
              </label>
              <Input
                id="create-admin-pass"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="••••••••"
                disabled={createLoading}
                required
              />
            </div>

            <div className="sm:col-span-3 flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError('');
                }}
                disabled={createLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={createLoading}
              >
                {createLoading ? 'Provisioning...' : 'Provision Administrator'}
              </Button>
            </div>
          </form>
        </Card>
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
            className="rounded-xl border border-[#2D2938] bg-[#17151D] px-3 py-2 text-xs text-[#F6F2EA] focus:outline-none focus:border-[#FF6257]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="Filter by user role"
            className="rounded-xl border border-[#2D2938] bg-[#17151D] px-3 py-2 text-xs text-[#F6F2EA] focus:outline-none focus:border-[#FF6257]"
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
        <div className="p-4 rounded-xl bg-amber-400/10 border border-amber-400/30 text-xs text-amber-300 space-y-2">
          <p className="font-semibold text-amber-200">
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
      <Card className="overflow-hidden bg-[#1E1B26] border-[#2D2938]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#F6F2EA]">
            <thead className="bg-[#17151D] border-b border-[#2D2938] text-[#777580] uppercase tracking-wider font-semibold">
              <tr>
                <th scope="col" className="px-5 py-3.5">User</th>
                <th scope="col" className="px-5 py-3.5">Email</th>
                <th scope="col" className="px-5 py-3.5">Role</th>
                <th scope="col" className="px-5 py-3.5">Status</th>
                <th scope="col" className="px-5 py-3.5">Joined</th>
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D2938]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#777580] font-medium">
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
                      className="border-none rounded-none bg-transparent py-12"
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
                    <tr key={targetUser._id} className="hover:bg-[#17151D]/60 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            name={targetUser.fullName}
                            src={targetUser.profile?.avatarUrl}
                            size="sm"
                          />
                          <span className="font-semibold text-[#F6F2EA]">
                            {targetUser.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[#777580]">
                        {targetUser.email}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Badge variant={targetUser.role === 'admin' ? 'lavender' : 'neutral'} size="sm">
                            {targetUser.role}
                          </Badge>
                          {!isCurrentAdmin && (
                            <button
                              type="button"
                              disabled={actionLoadingId === targetUser._id}
                              onClick={() => handleRoleChange(targetUser._id, targetUser.role === 'admin' ? 'user' : 'admin')}
                              className="text-[10px] text-[#FF6257] hover:underline font-semibold cursor-pointer disabled:opacity-40"
                              title={targetUser.role === 'admin' ? 'Demote to standard user' : 'Promote to administrator'}
                            >
                              {targetUser.role === 'admin' ? 'Demote' : 'Promote'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <Badge variant={isSuspended ? 'danger' : 'success'} size="sm">
                          {isSuspended ? 'Suspended' : 'Active'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-[#777580]">
                        {formatDate(targetUser.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        {isCurrentAdmin ? (
                          <span className="text-[11px] text-[#777580] italic">Current Session</span>
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
          <div className="flex items-center justify-between p-4 border-t border-[#2D2938] bg-[#17151D] text-xs text-[#777580]">
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
