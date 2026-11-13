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
import { useNotifications } from '@/context/NotificationContext';
import { privacyService } from '@/services/privacyService';
import { safetyService } from '@/services/safetyService';
import { ROUTES } from '@/lib/routes';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { isConnected, unreadCount } = useNotifications();

  // Navigation tab state: 'all' | 'account' | 'privacy' | 'safety' | 'security'
  const [activeTab, setActiveTab] = useState('all');

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

  // Load initial settings from real backend endpoints
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
        title="Settings &amp; Preferences"
        description="Configure your account credentials, privacy visibility, trust &amp; safety options, and active sessions"
      />

      {feedbackMessage && (
        <div className="p-3.5 rounded-xl bg-[#E8F7EE] border border-[#4CAF78]/30 text-xs text-[#2E7D4E] flex items-center justify-between animate-fade-in font-medium">
          <span>{feedbackMessage}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage('')}
            className="text-[#2E7D4E] hover:opacity-80 p-1 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-xs text-[#FF6B6B] flex items-center justify-between animate-fade-in font-medium">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-[#FF6B6B] hover:opacity-80 p-1 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Section Navigation Pills */}
      <div className="flex items-center gap-2 border-b border-[#E7E5E0] pb-3 text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'all'
              ? 'bg-[#6C63FF] text-white shadow-xs font-bold'
              : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-white'
          }`}
        >
          All Settings
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'account'
              ? 'bg-[#6C63FF] text-white shadow-xs font-bold'
              : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-white'
          }`}
        >
          Account
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'privacy'
              ? 'bg-[#6C63FF] text-white shadow-xs font-bold'
              : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-white'
          }`}
        >
          Privacy &amp; Requests ({followRequests.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('safety')}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'safety'
              ? 'bg-[#6C63FF] text-white shadow-xs font-bold'
              : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-white'
          }`}
        >
          Safety &amp; Appeals
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'security'
              ? 'bg-[#6C63FF] text-white shadow-xs font-bold'
              : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-white'
          }`}
        >
          Security &amp; Session
        </button>
      </div>

      {/* 1. Account Overview Card */}
      {(activeTab === 'all' || activeTab === 'account') && (
        <Card className="border-[#E7E5E0] bg-white shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Account Overview</CardTitle>
                <CardDescription>
                  Primary account credentials, verification status, and profile information
                </CardDescription>
              </div>
              <Badge variant={user?.role === 'admin' ? 'coral' : 'lavender'}>
                {user?.role === 'admin' ? 'Administrator' : 'Creator'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="min-w-0 p-3.5 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] space-y-1">
                <span className="text-[#6B6B73] font-medium">Display Name</span>
                <p className="text-sm font-semibold text-[#1E1E24] truncate">{user?.fullName || 'User'}</p>
              </div>

              <div className="min-w-0 p-3.5 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] space-y-1">
                <span className="text-[#6B6B73] font-medium">Email Address</span>
                <p className="text-sm font-semibold text-[#1E1E24] truncate">{user?.email || '—'}</p>
              </div>

              <div className="min-w-0 p-3.5 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] space-y-1">
                <span className="text-[#6B6B73] font-medium">Email Verification</span>
                <div className="flex flex-wrap items-center gap-2 pt-0.5 min-w-0">
                  {user?.isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[#2E7D4E] font-semibold text-xs">
                      <Icon name="check" className="w-3.5 h-3.5 shrink-0" /> Verified
                    </span>
                  ) : (
                    <Link
                      href={ROUTES.PUBLIC.VERIFY_EMAIL}
                      className="inline-flex flex-wrap items-center gap-1 text-[#FF6B6B] font-semibold text-xs hover:underline"
                    >
                      <Icon name="alertCircle" className="w-3.5 h-3.5 shrink-0" />
                      <span>Unverified (Verify now)</span>
                    </Link>
                  )}
                </div>
              </div>

              <div className="min-w-0 p-3.5 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] space-y-1">
                <span className="text-[#6B6B73] font-medium">Member Since</span>
                <p className="text-sm font-semibold text-[#1E1E24] truncate">{memberSince}</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[#E7E5E0]">
              <p className="text-xs text-[#6B6B73]">
                To change your avatar or biography, visit the profile editor.
              </p>
              <Button
                href={ROUTES.USER.PROFILE_EDIT}
                variant="outline"
                size="sm"
                icon={<Icon name="edit" className="w-3.5 h-3.5" />}
              >
                Edit Profile Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Privacy & Account Visibility Card */}
      {(activeTab === 'all' || activeTab === 'privacy') && (
        <Card className="border-[#E7E5E0] bg-white shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Privacy &amp; Account Visibility</CardTitle>
                <CardDescription>
                  Control who can view your publications, dual-perspective media, and follow requests
                </CardDescription>
              </div>
              <Badge variant={isPrivate ? 'yellow' : 'primary'}>
                {isPrivate ? 'Private Account' : 'Public Account'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0]">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#1E1E24]">Private Profile Mode</p>
                <p className="text-[11px] text-[#6B6B73] leading-relaxed max-w-md">
                  When your account is private, only followers you approve can view your posts and Split-Reality media.
                  Incoming follow requests will require your explicit approval below.
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
            <div className="space-y-3 pt-2 border-t border-[#E7E5E0]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#1E1E24] flex items-center gap-2">
                  <Icon name="users" className="w-4 h-4 text-[#6C63FF]" />
                  Pending Follow Requests ({followRequests.length})
                </h3>
              </div>

              {loadingRequests ? (
                <p className="text-xs text-[#6B6B73] animate-pulse">Checking pending follow requests...</p>
              ) : followRequests.length === 0 ? (
                <p className="text-xs text-[#6B6B73] italic">
                  No pending follow requests at this time.
                </p>
              ) : (
                <div className="space-y-2 divide-y divide-[#E7E5E0]">
                  {followRequests.map((req) => {
                    const requester = req.user || req;
                    return (
                      <div
                        key={requester._id}
                        className="pt-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar
                            name={requester.fullName || 'User'}
                            src={requester.profile?.avatarUrl}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#1E1E24] truncate">
                              {requester.fullName || 'User'}
                            </p>
                            <p className="text-[10px] text-[#6B6B73] truncate font-mono">
                              {requester.email ? `@${requester.email.split('@')[0]}` : ''}
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
      )}

      {/* 3. Safety & Blocked Users Card */}
      {(activeTab === 'all' || activeTab === 'safety') && (
        <Card className="border-[#E7E5E0] bg-white shadow-xs">
          <CardHeader>
            <CardTitle>Safety &amp; Blocked Users</CardTitle>
            <CardDescription>
              Manage members you have blocked from contacting you or viewing your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {loadingBlocked ? (
              <p className="text-xs text-[#6B6B73] animate-pulse">Loading blocked members list...</p>
            ) : blockedUsers.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] text-xs text-[#6B6B73]">
                You have not blocked any members.
              </div>
            ) : (
              <div className="space-y-2 divide-y divide-[#E7E5E0]">
                {blockedUsers.map((blocked) => (
                  <div
                    key={blocked._id}
                    className="pt-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        name={blocked.fullName || 'User'}
                        src={blocked.profile?.avatarUrl}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#1E1E24] truncate">
                          {blocked.fullName}
                        </p>
                        <p className="text-[10px] text-[#6B6B73] truncate font-mono">
                          {blocked.email ? `@${blocked.email.split('@')[0]}` : ''}
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

            {/* Moderation Appeals Form */}
            <div className="pt-4 border-t border-[#E7E5E0] space-y-3">
              <div>
                <h3 className="text-xs font-bold text-[#1E1E24]">
                  Community Moderation Appeals
                </h3>
                <p className="text-[11px] text-[#6B6B73]">
                  Submit an appeal if you believe a moderation warning or action on your account was made in error.
                </p>
              </div>

              {appealNotice && (
                <div className="p-3.5 rounded-xl bg-[#E8F7EE] border border-[#4CAF78]/30 text-xs text-[#2E7D4E] flex items-center gap-2 font-medium">
                  <Icon name="check" className="w-4 h-4 shrink-0" />
                  <span>{appealNotice}</span>
                </div>
              )}

              <form onSubmit={handleSubmitAppeal} className="space-y-3">
                <textarea
                  id="appeal-reason-input"
                  rows={3}
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="Explain the context and why you believe the moderation action was mistaken..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] text-xs text-[#1E1E24] placeholder-[#6B6B73] focus:outline-hidden focus:border-[#6C63FF] focus:bg-white transition-colors"
                  required
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={submittingAppeal || !appealReason.trim()}
                >
                  {submittingAppeal ? 'Submitting Appeal...' : 'Submit Appeal to Trust & Safety'}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Security & Active Session Card */}
      {(activeTab === 'all' || activeTab === 'security') && (
        <Card className="border-[#E7E5E0] bg-white shadow-xs">
          <CardHeader>
            <CardTitle>Security &amp; Session Management</CardTitle>
            <CardDescription>
              Manage password recovery and active browser authentication sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0]">
              <div>
                <p className="text-xs font-semibold text-[#1E1E24]">Password Recovery</p>
                <p className="text-[11px] text-[#6B6B73]">
                  Send secure instructions to reset your password via your verified email address.
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

            <div className="pt-2 flex items-center justify-between border-t border-[#E7E5E0]">
              <div>
                <p className="text-xs font-semibold text-[#FF6B6B]">Active Browser Session</p>
                <p className="text-[11px] text-[#6B6B73]">
                  Sign out of Looply on this device and terminate current session tokens.
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
      )}

      {/* 5. Live Notifications Overview Card */}
      {(activeTab === 'all' || activeTab === 'account') && (
        <Card className="border-[#E7E5E0] bg-white shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Notifications &amp; Activity Center</CardTitle>
                <CardDescription>
                  Real-time alerts, post reactions, member follows, and community interactions
                </CardDescription>
              </div>
              <Badge variant={isConnected ? 'primary' : 'neutral'} size="sm">
                {isConnected ? 'Real-time Connected' : 'Sync Active'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0]">
              <div>
                <p className="text-xs font-semibold text-[#1E1E24]">
                  Activity Center ({unreadCount} unread)
                </p>
                <p className="text-[11px] text-[#6B6B73]">
                  Interactions on your publications, direct messages, and follows are streamed live via Socket.IO.
                </p>
              </div>
              <Button
                href={ROUTES.USER.NOTIFICATIONS}
                variant="outline"
                size="sm"
                icon={<Icon name="notifications" className="w-3.5 h-3.5" />}
                className="shrink-0"
              >
                Open Activity Center
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
