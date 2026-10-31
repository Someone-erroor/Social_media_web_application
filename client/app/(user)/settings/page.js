import PageHeader from '@/components/ui/PageHeader';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import FormField from '@/components/forms/FormField';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export const metadata = {
  title: 'Settings',
  description: 'Manage account preferences and security'
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure your account preferences, security options, and platform experience"
      />

      {/* Account Preferences Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Account Preferences</CardTitle>
          <CardDescription>
            Manage your personal contact details and display preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField id="settings-email" label="Account Email" helperText="Used for authentication and notifications">
            <Input
              id="settings-email"
              type="email"
              defaultValue="alex@example.com"
              disabled
            />
          </FormField>

          <FormField id="settings-language" label="Interface Language">
            <select
              id="settings-language"
              defaultValue="en"
              disabled
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none disabled:cursor-not-allowed"
            >
              <option value="en">English (United States)</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </FormField>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-[11px] text-slate-400">Account preferences &bull; Coming Soon</span>
          <Button type="button" variant="primary" size="sm" disabled>
            Save Preferences
          </Button>
        </CardFooter>
      </Card>

      {/* Account Security Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Security &amp; Password</CardTitle>
          <CardDescription>
            Ensure your account stays protected with strong passwords and authentication security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField id="current-pass" label="Current Password">
            <Input
              id="current-pass"
              type="password"
              placeholder="••••••••"
              disabled
            />
          </FormField>

          <FormField id="new-pass" label="New Password">
            <Input
              id="new-pass"
              type="password"
              placeholder="••••••••"
              disabled
            />
          </FormField>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-[11px] text-slate-400">Security preferences &bull; Coming Soon</span>
          <Button type="button" variant="primary" size="sm" disabled>
            Update Password
          </Button>
        </CardFooter>
      </Card>

      {/* Notification Preferences Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Select which community notifications and summaries you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { id: 'notify-mentions', label: 'Mentions and replies', desc: 'Notify when someone mentions you or replies to your post' },
            { id: 'notify-likes', label: 'Likes and reactions', desc: 'Notify when someone likes your published content' },
            { id: 'notify-digest', label: 'Weekly email digest', desc: 'Summary of top community discussions and discussions' }
          ].map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                defaultChecked
                disabled
                className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-60"
              />
              <div className="text-xs">
                <p className="font-semibold text-slate-800">{item.label}</p>
                <p className="text-slate-500">{item.desc}</p>
              </div>
            </label>
          ))}
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-[11px] text-slate-400">Notification preferences &bull; Coming Soon</span>
          <Button type="button" variant="primary" size="sm" disabled>
            Save Notification Rules
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

