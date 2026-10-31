import PageHeader from '@/components/ui/PageHeader';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import FormField from '@/components/forms/FormField';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';

export const metadata = {
  title: 'Admin Alerts & Broadcasts',
  description: 'Manage administrative broadcasts and security notifications'
};

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Alerts &amp; Broadcasts"
        description="Dispatch platform-wide announcements, critical maintenance notices, and security advisories"
      />

      {/* Broadcast Composer */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Compose System Broadcast</CardTitle>
          <CardDescription>
            Send a high-priority banner or in-app notification to all registered Looply users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField id="broadcast-title" label="Announcement Title" required>
            <Input
              id="broadcast-title"
              placeholder="e.g. Scheduled Maintenance Window"
              disabled
            />
          </FormField>

          <FormField id="broadcast-message" label="Broadcast Message" required>
            <textarea
              id="broadcast-message"
              placeholder="Enter message text..."
              rows={3}
              disabled
              className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="broadcast-severity" label="Severity Level">
              <select
                id="broadcast-severity"
                disabled
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700 disabled:cursor-not-allowed"
              >
                <option>Information (Blue)</option>
                <option>Maintenance (Amber)</option>
                <option>Urgent Security (Rose)</option>
              </select>
            </FormField>

            <FormField id="broadcast-target" label="Target Audience">
              <select
                id="broadcast-target"
                disabled
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700 disabled:cursor-not-allowed"
              >
                <option>All Users</option>
                <option>Administrators &amp; Moderators Only</option>
              </select>
            </FormField>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-[11px] text-slate-400">
            System dispatch activates in Phase 12 &amp; 13
          </span>
          <Button type="button" variant="primary" size="sm" disabled>
            Dispatch Broadcast
          </Button>
        </CardFooter>
      </Card>

      {/* Past Broadcasts List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Broadcast History
        </h2>
        <EmptyState
          icon="notifications"
          title="No Previous Broadcasts"
          description="Platform announcements and system advisories that have been dispatched will be archived here."
          badgeText="History Archive • Phase 2"
        />
      </div>
    </div>
  );
}

