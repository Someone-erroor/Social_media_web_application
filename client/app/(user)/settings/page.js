'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { privacyService } from '@/services/privacyService';
import { safetyService } from '@/services/safetyService';
import { ROUTES } from '@/lib/routes';

export default function SettingsPage() {
  const { user, logout } = useAuth();

  // Privacy State
  const [isPrivate, setIsPrivate] = useState(false);
  const [loadingPrivacy, setLoadingPrivacy] = useState(true);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);
  const [followRequests, setFollowRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Safety & Blocked Users State
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [unblockingId, setUnblockingId] = useState(null);

  // Appeal State
  const [appealReason, setAppealReason] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [appealNotice, setAppealNotice] = useState('');

  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load initial settings
  const loadSettingsData = useCallback(async () => {
    setLoadingPrivacy(true);
    setLoadingRequests(true);
    setLoadingBlocked(true);

    try {
      const [privacyRes, requestsRes, blockedRes] = await Promise.allSettled([
        privacyService.getPrivacySettings(),
        privacyService.getPendingFollowRequests(),
        safetyService.getBlockedUsers()
      ]);

      if (privacyRes.status === 'fulfilled' && privacyRes.value?.success) {
        setIsPrivate(Boolean(privacyRes.value.settings?.isPrivate));
      }
      if (requestsRes.status === 'fulfilled' && requestsRes.value?.success) {
        setFollowRequests(requestsRes.value.requests || []);
      }
      if (blockedRes.status === 'fulfilled' && blockedRes.value?.success) {
        setBlockedUsers(blockedRes.value.blockedUsers || []);
      }
    } catch (err) {
      console.warn('Error loading settings:', err);
    } finally {
      setLoadingPrivacy(false);
      setLoadingRequests(false);
      setLoadingBlocked(false);
    }
  }, []);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  // Toggle Account Privacy (Public / Private)
  const handleTogglePrivacy = async () => {
    const nextState = !isPrivate;
    setUpdatingPrivacy(true);
    setErrorMessage('');
    setFeedbackMessage('');

    try {
      const res = await privacyService.updatePrivacySettings({ isPrivate: nextState });
      if (res?.success) {
        setIsPrivate(res.settings?.isPrivate ?? nextState);
        setFeedbackMessage(
          nextState
            ? 'Account set to Private. New followers must now request approval.'
            : 'Account set to Public. Anyone can view your posts and follow you.'
        );
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update privacy settings.');
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  // Accept Follow Request
  const handleAcceptRequest = async (requesterId) => {
    try {
      await privacyService.acceptFollowRequest(requesterId);
      setFollowRequests((prev) => prev.filter((r) => (r.user?._id || r._id || r) !== requesterId));
      setFeedbackMessage('Follow request accepted.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to accept follow request.');
    }
  };

  // Reject Follow Request
  const handleRejectRequest = async (requesterId) => {
    try {
      await privacyService.rejectFollowRequest(requesterId);
      setFollowRequests((prev) => prev.filter((r) => (r.user?._id || r._id || r) !== requesterId));
      setFeedbackMessage('Follow request declined.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to decline follow request.');
    }
  };

  // Unblock user
  const handleUnblock = async (targetUserId) => {
    setUnblockingId(targetUserId);
    try {
      await safetyService.unblockUser(targetUserId);
      setBlockedUsers((prev) => prev.filter((u) => u._id !== targetUserId));
      setFeedbackMessage('User unblocked successfully.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to unblock user.');
    } finally {
      setUnblockingId(null);
    }
  };

  // Submit Safety Appeal
  const handleSubmitAppeal = async (e) => {
    e?.preventDefault();
    if (!appealReason.trim()) return;

    setSubmittingAppeal(true);
    setAppealNotice('');
    try {
      const res = await safetyService.submitAppeal({
        reason: appealReason.trim()
      });
      if (res?.success) {
        setAppealNotice('Your appeal has been submitted for administrative review.');
        setAppealReason('');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit appeal.');
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Active';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure your account preferences, security options, and platform details"
      />

      {feedbackMessage && (
        <div className="p-3.5 rounded-xl bg-[#19D3E3]/10 border border-[#19D3E3]/30 text-xs text-[#19D3E3] flex items-center justify-between">
          <span>{feedbackMessage}</span>
          <button type="button" onClick={() => setFeedbackMessage('')} className="text-[#19D3E3] hover:opacity-80">
            <Icon name="close" className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-[#FF5C70]/10 border border-[#FF5C70]/30 text-xs text-[#FF5C70] flex items-center justify-between">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage('')} className="text-[#FF5C70] hover:opacity-80">
            <Icon name="close" className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Account Overview Card */}
      <Card className="border-[#263640] bg-[#151F29]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Account Overview</CardTitle>
              <CardDescription>
                Primary account credentials and security clearance
              </CardDescription>
            </div>
            <Badge variant={user?.role === 'admin' ? 'danger' : 'primary'}>
              {user?.role === 'admin' ? 'Administrator' : 'Standard Member'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="min-w-0 p-3.5 rounded-xl bg-[#101A22] border border-[#263640] space-y-1">
              <span className="text-[#9BAAB4] font-medium">Display Name</span>
              <p className="text-sm font-semibold text-[#F4F8FA] truncate">{user?.fullName || 'User'}</p>
            </div>

            <div className="min-w-0 p-3.5 rounded-xl bg-[#101A22] border border-[#263640] space-y-1">
              <span className="text-[#9BAAB4] font-medium">Email Address</span>
              <p className="text-sm font-semibold text-[#F4F8FA] truncate">{user?.email || '—'}</p>
            </div>

            <div className="min-w-0 p-3.5 rounded-xl bg-[#101A22] border border-[#263640] space-y-1">
              <span className="text-[#9BAAB4] font-medium">Email Verification</span>
              <div className="flex flex-wrap items-center gap-2 pt-0.5 min-w-0">
                {user?.isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                    <Icon name="check" className="w-3.5 h-3.5 shrink-0" /> Verified
                  </span>
                ) : (
                  <Link
                    href={ROUTES.PUBLIC.VERIFY_EMAIL}
                    className="inline-flex flex-wrap items-center gap-1 text-amber-400 font-semibold text-xs hover:underline"
                  >
                    <Icon name="alertCircle" className="w-3.5 h-3.5 shrink-0" />
                    <span>Unverified (Verify now)</span>
                  </Link>
                )}
              </div>
            </div>

            <div className="min-w-0 p-3.5 rounded-xl bg-[#101A22] border border-[#263640] space-y-1">
              <span className="text-[#9BAAB4] font-medium">Member Since</span>
              <p className="text-sm font-semibold text-[#F4F8FA] truncate">{memberSince}</p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-[#263640]">
            <Button
              href={ROUTES.USER.PROFILE_EDIT}
              variant="outline"
              size="sm"
            >
              Edit Profile Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security & Password Card */}
      <Card className="border-[#263640] bg-[#151F29]">
        <CardHeader>
          <CardTitle>Security & Password</CardTitle>
          <CardDescription>
            Manage password recovery and active credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#101A22] border border-[#263640]">
            <div>
              <p className="text-xs font-semibold text-[#F4F8FA]">Password Recovery</p>
              <p className="text-[11px] text-[#9BAAB4]">
                Send instructions to reset your password via your verified email address.
              </p>
            </div>
            <Button
              href={ROUTES.PUBLIC.FORGOT_PASSWORD}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              Reset Password
            </Button>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-[#263640]">
            <div>
              <p className="text-xs font-semibold text-[#FF6F61]">Active Session</p>
              <p className="text-[11px] text-[#9BAAB4]">
                Sign out of Looply on this browser.
              </p>
            </div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={logout}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Account Visibility Card */}
      <Card className="border-[#263640] bg-[#151F29]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Privacy & Account Visibility</CardTitle>
              <CardDescription>
                Control who can view your posts and send follow requests
              </CardDescription>
            </div>
            <Badge variant={isPrivate ? 'warning' : 'primary'}>
              {isPrivate ? 'Private Account' : 'Public Account'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#101A22] border border-[#263640]">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#F4F8FA]">Private Profile</p>
              <p className="text-[11px] text-[#9BAAB4] leading-relaxed max-w-md">
                When your account is private, only users you approve can see your posts and media.
                Anyone can send a follow request, but you choose whether to accept them.
              </p>
            </div>
            <Button
              type="button"
              variant={isPrivate ? 'primary' : 'outline'}
              size="sm"
              onClick={handleTogglePrivacy}
              disabled={updatingPrivacy || loadingPrivacy}
              className="shrink-0"
            >
              {updatingPrivacy ? 'Updating...' : isPrivate ? 'Switch to Public' : 'Make Private'}
            </Button>
          </div>

          {/* Pending Follow Requests Drawer */}
          <div className="space-y-3 pt-2 border-t border-[#263640]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#F4F8FA] flex items-center gap-2">
                <Icon name="users" className="w-4 h-4 text-[#19D3E3]" />
                Pending Follow Requests ({followRequests.length})
              </h3>
            </div>

            {loadingRequests ? (
              <p className="text-xs text-[#9BAAB4]">Checking pending requests...</p>
            ) : followRequests.length === 0 ? (
              <p className="text-xs text-[#9BAAB4] italic">
                No pending follow requests at this time.
              </p>
            ) : (
              <div className="space-y-2 divide-y divide-[#263640]">
                {followRequests.map((req) => {
                  const requester = req.user || req;
                  return (
                    <div
                      key={requester._id}
                      className="pt-2 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          name={requester.fullName || 'User'}
                          src={requester.profile?.avatarUrl}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#F4F8FA] truncate">
                            {requester.fullName || 'User'}
                          </p>
                          <p className="text-[10px] text-[#9BAAB4] truncate">
                            {requester.username ? `@${requester.username}` : requester.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleAcceptRequest(requester._id)}
                        >
                          Accept
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectRequest(requester._id)}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Safety & Blocked Users Card */}
      <Card className="border-[#263640] bg-[#151F29]">
        <CardHeader>
          <CardTitle>Safety & Blocked Users</CardTitle>
          <CardDescription>
            Manage users you have blocked from contacting or viewing your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingBlocked ? (
            <p className="text-xs text-[#9BAAB4]">Loading blocked users list...</p>
          ) : blockedUsers.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#101A22] border border-[#263640] text-xs text-[#9BAAB4]">
              You have not blocked any users.
            </div>
          ) : (
            <div className="space-y-2 divide-y divide-[#263640]">
              {blockedUsers.map((blocked) => (
                <div
                  key={blocked._id}
                  className="pt-2 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      name={blocked.fullName || 'User'}
                      src={blocked.profile?.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#F4F8FA] truncate">
                        {blocked.fullName}
                      </p>
                      <p className="text-[10px] text-[#9BAAB4] truncate">
                        {blocked.username ? `@${blocked.username}` : blocked.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(blocked._id)}
                    disabled={unblockingId === blocked._id}
                  >
                    {unblockingId === blocked._id ? 'Unblocking...' : 'Unblock'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Community Moderation Appeals Card */}
      <Card className="border-[#263640] bg-[#151F29]">
        <CardHeader>
          <CardTitle>Community Moderation Appeals</CardTitle>
          <CardDescription>
            Submit an appeal if you believe a moderation action on your account or content was made in error
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {appealNotice && (
            <div className="p-3.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 text-xs text-[#10B981] flex items-center gap-2">
              <Icon name="check" className="w-4 h-4 shrink-0" />
              <span>{appealNotice}</span>
            </div>
          )}

          <form onSubmit={handleSubmitAppeal} className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="appeal-reason-input" className="text-xs font-semibold text-[#9BAAB4]">
                Reason for Appeal
              </label>
              <textarea
                id="appeal-reason-input"
                rows={3}
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="Explain the context and why you believe the moderation action was mistaken..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#101A22] border border-[#263640] text-xs text-[#F4F8FA] placeholder-[#9BAAB4] focus:outline-hidden focus:border-[#19D3E3]"
                required
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={submittingAppeal || !appealReason.trim()}
            >
              {submittingAppeal ? 'Submitting Appeal...' : 'Submit Appeal to Trust & Safety'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
