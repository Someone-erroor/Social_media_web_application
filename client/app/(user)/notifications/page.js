import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

export const metadata = {
  title: 'Notifications',
  description: 'View interactions, mentions, and updates'
};

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay informed about interactions, replies, and community activity"
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-xs"
        >
          All
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          Mentions
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          System
        </button>
      </div>

      {/* Honest Empty Notifications State */}
      <EmptyState
        icon="notifications"
        title="No Notifications Yet"
        description="You're all caught up! When other members interact with your posts, mention your handle, or follow you, alerts will appear here in real-time."
        badgeText="Notifications Inbox"
      />
    </div>
  );
}

