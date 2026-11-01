'use client';

import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';

export default function SettingsPage() {
  const { user, logout } = useAuth();

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

      {/* Account Overview Card */}
      <Card className="border-slate-200">
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
            <div className="min-w-0 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-slate-600 font-medium">Display Name</span>
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.fullName || 'User'}</p>
            </div>

            <div className="min-w-0 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-slate-600 font-medium">Email Address</span>
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.email || '—'}</p>
            </div>

            <div className="min-w-0 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-slate-600 font-medium">Email Verification</span>
              <div className="flex flex-wrap items-center gap-2 pt-0.5 min-w-0">
                {user?.isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                    <Icon name="check" className="w-3.5 h-3.5 shrink-0" /> Verified
                  </span>
                ) : (
                  <Link
                    href={ROUTES.PUBLIC.VERIFY_EMAIL}
                    className="inline-flex flex-wrap items-center gap-1 text-amber-700 font-semibold text-xs hover:underline"
                  >
                    <Icon name="alertCircle" className="w-3.5 h-3.5 shrink-0" />
                    <span>Unverified (Verify now)</span>
                  </Link>
                )}
              </div>
            </div>

            <div className="min-w-0 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-slate-600 font-medium">Member Since</span>
              <p className="text-sm font-semibold text-slate-800 truncate">{memberSince}</p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
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
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Security & Password</CardTitle>
          <CardDescription>
            Manage password recovery and active credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <p className="text-xs font-semibold text-slate-800">Password Recovery</p>
              <p className="text-[11px] text-slate-600">
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

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div>
              <p className="text-xs font-semibold text-red-600">Active Session</p>
              <p className="text-[11px] text-slate-600">
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
    </div>
  );
}
