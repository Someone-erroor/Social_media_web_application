import PageHeader from '@/components/ui/PageHeader';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Looply platform overview and system metrics'
};

export default function AdminDashboardPage() {
  const metricCards = [
    {
      title: 'Total Users',
      value: '—',
      note: 'Telemetry Pending Sync',
      icon: 'users',
      color: 'text-indigo-600'
    },
    {
      title: 'Published Posts',
      value: '—',
      note: 'Telemetry Pending Sync',
      icon: 'posts',
      color: 'text-purple-600'
    },
    {
      title: 'Pending Moderation',
      value: '—',
      note: 'Telemetry Pending Sync',
      icon: 'shield',
      color: 'text-amber-600'
    },
    {
      title: 'Security Audits',
      value: '—',
      note: 'Telemetry Pending Sync',
      icon: 'activity',
      color: 'text-emerald-600'
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Administrative Overview"
        description="High-level platform telemetry, operational health, and moderation queues"
        badge={
          <Badge variant="primary" size="sm">
            Admin Console
          </Badge>
        }
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric) => (
          <Card key={metric.title} className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {metric.title}
                </span>
                <span className={`p-2 rounded-xl bg-slate-50 ${metric.color}`}>
                  <Icon name={metric.icon} className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                  {metric.value}
                </div>
                <p className="mt-1 text-[11px] text-slate-400 font-mono">
                  {metric.note}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Service Architecture Overview */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Architecture Status</CardTitle>
              <CardDescription>
                Decoupled Express.js and Next.js service configuration
              </CardDescription>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Awaiting Telemetry Sync
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-semibold text-slate-800">Backend API</span>
              <p className="text-slate-500 mt-0.5">Express.js 4.x decoupled service</p>
              <p className="text-[11px] text-slate-500 font-mono mt-2">Health route: /api/health</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-semibold text-slate-800">CORS Restrictions</span>
              <p className="text-slate-500 mt-0.5">Origin-validated whitelist</p>
              <p className="text-[11px] text-slate-500 font-mono mt-2">Configured per environment</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-semibold text-slate-800">Database Layer</span>
              <p className="text-slate-500 mt-0.5">MongoDB &amp; Mongoose schemas</p>
              <p className="text-[11px] text-slate-500 font-mono mt-2">Persistence integration pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Log Placeholder */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Recent Audit Events
          </h2>
        </div>

        <EmptyState
          icon="activity"
          title="No Recent Activity Records"
          description="Administrative audit actions, user sign-ins, and moderation decisions will appear here as activity occurs."
          badgeText="Audit Ledger"
        />
      </div>
    </div>
  );
}
