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
      value: '0',
      note: 'Populates in Phase 4 & 11',
      icon: 'users',
      color: 'text-indigo-600'
    },
    {
      title: 'Published Posts',
      value: '0',
      note: 'Populates in Phase 8 & 11',
      icon: 'posts',
      color: 'text-purple-600'
    },
    {
      title: 'Pending Moderation',
      value: '0',
      note: 'Populates in Phase 12',
      icon: 'shield',
      color: 'text-amber-600'
    },
    {
      title: 'Security Audits',
      value: '0',
      note: 'Populates in Phase 13',
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
            Phase 2 UI Architecture
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

      {/* System Health Status Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System &amp; API Health</CardTitle>
              <CardDescription>
                Live connectivity status with decoupled Express.js backend
              </CardDescription>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Backend Ready
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-semibold text-slate-800">Backend API</span>
              <p className="text-slate-500 mt-0.5">Express.js 4.x decoupled service</p>
              <p className="text-[11px] text-emerald-600 font-mono mt-2">Endpoint: /api/health (HTTP 200)</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-semibold text-slate-800">CORS Restrictions</span>
              <p className="text-slate-500 mt-0.5">Origin-validated whitelist</p>
              <p className="text-[11px] text-emerald-600 font-mono mt-2">Active in all environments</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-semibold text-slate-800">Database Layer</span>
              <p className="text-slate-500 mt-0.5">MongoDB &amp; Mongoose schemas</p>
              <p className="text-[11px] text-amber-600 font-mono mt-2">Scheduled for Phase 3</p>
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
          description="Administrative audit actions, user sign-ins, and moderation decisions will stream here once Phase 11 & 13 operational pipelines are active."
          badgeText="Audit Log Pipeline • Phase 2"
        />
      </div>
    </div>
  );
}

