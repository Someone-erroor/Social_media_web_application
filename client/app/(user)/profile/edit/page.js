import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import FormField from '@/components/forms/FormField';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';

export const metadata = {
  title: 'Edit Profile',
  description: 'Update your Looply profile details'
};

export default function ProfileEditPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Profile"
        description="Update your public profile, avatar, and personal biography"
        action={
          <Button
            href={ROUTES.USER.PROFILE}
            variant="ghost"
            size="sm"
            icon={<Icon name="arrowLeft" className="w-4 h-4" />}
          >
            Back to Profile
          </Button>
        }
      />

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>
            This information will be displayed publicly on your Looply profile
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Avatar Change Area */}
          <div className="flex items-center gap-5">
            <Avatar name="Alex Morgan" size="xl" />
            <div className="space-y-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
                title="Photo uploads activate in Phase 7"
              >
                Change Photo
              </Button>
              <p className="text-[11px] text-slate-400">
                JPG, GIF or PNG. 1MB max. Uploads activate in Phase 7.
              </p>
            </div>
          </div>

          <form className="space-y-4">
            <FormField id="edit-name" label="Full Name" required>
              <Input
                id="edit-name"
                defaultValue="Alex Morgan"
                placeholder="Your full name"
              />
            </FormField>

            <FormField id="edit-handle" label="Handle" required helperText="Your unique public @handle">
              <Input
                id="edit-handle"
                defaultValue="alexmorgan"
                placeholder="handle"
              />
            </FormField>

            <FormField id="edit-bio" label="Bio" helperText="Brief description for your profile (max 160 characters)">
              <textarea
                id="edit-bio"
                defaultValue="Exploring modern interface engineering, distributed systems, and creative expression. Building with Next.js, React, and Tailwind CSS."
                rows={3}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="edit-location" label="Location">
                <Input
                  id="edit-location"
                  defaultValue="San Francisco, CA"
                  placeholder="City, Country"
                />
              </FormField>

              <FormField id="edit-website" label="Website">
                <Input
                  id="edit-website"
                  defaultValue="https://example.com"
                  placeholder="https://yourwebsite.com"
                />
              </FormField>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <p className="text-[11px] text-slate-400">
            Phase 2 UI Interface • Profile update persistence activates in Phase 7
          </p>

          <div className="flex items-center gap-2 justify-end">
            <Button
              href={ROUTES.USER.PROFILE}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled
              title="Profile updates activate in Phase 7"
            >
              Save Changes
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
