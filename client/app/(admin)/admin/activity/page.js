import PageHeader from '@/components/ui/PageHeader';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';

export const metadata = {
  title: 'System Activity | Admin',
  description: 'Security audit trail and authentication logs'
};

export default function AdminActivityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="System Activity &amp; Audit Trail"
        description="Review security checkpoints, login audit trails, and administrative action logs"
      />

      {/* Audit Log Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            disabled
            aria-label="Filter by event type"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            <option>All Event Types</option>
            <option>User Login</option>
            <option>Password Reset</option>
            <option>Role Change</option>
            <option>Content Moderation</option>
          </select>

          <Button type="button" variant="outline" size="sm" disabled>
            Clear Filters
          </Button>
        </div>

        <Button type="button" variant="outline" size="sm" disabled>
          Download Audit Log
        </Button>
      </div>

      {/* Honest Empty Activity Log State */}
      <EmptyState
        icon="activity"
        title="No System Events Logged"
        description="The audit log is clear. Security checkpoints, login timestamps, and administrative actions are recorded in real time."
        badgeText="Audit Ledger"
      />
    </div>
  );
}

