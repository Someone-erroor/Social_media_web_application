import PageHeader from '@/components/ui/PageHeader';
import Card, { CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';

export const metadata = {
  title: 'User Management | Admin',
  description: 'Manage registered user accounts and permissions'
};

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Search, inspect, and moderate registered accounts and permissions"
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Search users by name, email, or handle..."
            disabled
            icon={<Icon name="search" className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            disabled
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            <option>All Roles</option>
            <option>User</option>
            <option>Moderator</option>
            <option>Admin</option>
          </select>

          <Button type="button" variant="outline" size="sm" disabled>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <Card className="border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th scope="col" className="px-5 py-3.5">User</th>
                <th scope="col" className="px-5 py-3.5">Email</th>
                <th scope="col" className="px-5 py-3.5">Role</th>
                <th scope="col" className="px-5 py-3.5">Status</th>
                <th scope="col" className="px-5 py-3.5">Joined</th>
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Honest empty state rendered inside table canvas */}
              <tr>
                <td colSpan={6} className="p-0">
                  <EmptyState
                    icon="users"
                    title="No Registered Users Found"
                    description="Registered user accounts will populate this administrative ledger once user authentication and registration workflows begin in Phase 4."
                    badgeText="User Directory Ready • Phase 2"
                    className="border-none rounded-none bg-white py-12"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

