'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import FormField from '@/components/forms/FormField';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthContext';
import { profileService } from '@/services/profileService';
import { ROUTES } from '@/lib/routes';

export default function ProfileEditPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatarUrl || '');

  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;

    profileService
      .getMyProfile()
      .then((res) => {
        if (!ignore && res?.user) {
          setFullName(res.user.fullName || '');
          setBio(res.user.profile?.bio || '');
          setAvatarUrl(res.user.profile?.avatarUrl || '');
          setFetchError('');
        }
      })
      .catch((err) => {
        if (!ignore) {
          setFetchError(err.message || 'Failed to load profile details.');
        }
      })
      .finally(() => {
        if (!ignore) {
          setFetchLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [reloadTrigger]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Full name must be at least 2 characters.');
      return;
    }
    if (trimmedName.length > 70) {
      setErrorMessage('Full name cannot exceed 70 characters.');
      return;
    }

    if (bio.trim().length > 250) {
      setErrorMessage('Bio cannot exceed 250 characters.');
      return;
    }

    if (avatarUrl.trim() && !/^https?:\/\/.+/i.test(avatarUrl.trim())) {
      setErrorMessage('Avatar URL must start with http:// or https://.');
      return;
    }

    setLoading(true);

    try {
      const res = await profileService.updateMyProfile({
        fullName: trimmedName,
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim()
      });

      if (res?.user) {
        updateUser(res.user);
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => {
          router.push(ROUTES.USER.PROFILE);
        }, 1200);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

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

      {fetchError && (
        <div className="p-4 rounded-xl bg-[#FF6F61]/10 border border-[#FF6F61]/30 text-xs text-[#FF6F61] flex items-center justify-between gap-3">
          <span>{fetchError}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFetchLoading(true);
              setFetchError('');
              setReloadTrigger((n) => n + 1);
            }}
            className="text-xs text-[#FF6F61] hover:bg-[#FF6F61]/10"
          >
            Retry
          </Button>
        </div>
      )}

      {fetchLoading ? (
        <Card className="border-[#263640] bg-[#151F29] animate-pulse">
          <CardHeader className="space-y-2">
            <div className="h-5 w-40 bg-[#1D2A35] rounded" />
            <div className="h-3 w-64 bg-[#1D2A35]/60 rounded" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-[#1D2A35]" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-28 bg-[#1D2A35] rounded" />
                <div className="h-2.5 w-48 bg-[#1D2A35]/60 rounded" />
              </div>
            </div>
            <div className="h-10 bg-[#1D2A35]/50 rounded-xl" />
            <div className="h-10 bg-[#1D2A35]/50 rounded-xl" />
            <div className="h-24 bg-[#1D2A35]/50 rounded-xl" />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#263640] bg-[#151F29]">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
              This information will be displayed publicly on your Looply profile
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-[#FF6F61]/10 border border-[#FF6F61]/30 text-xs text-[#FF6F61]">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400">
                {successMessage}
              </div>
            )}

            {/* Avatar Preview */}
            <div className="flex items-center gap-5">
              <Avatar
                name={fullName || 'User'}
                src={avatarUrl.trim()}
                size="xl"
              />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#F4F8FA]">Avatar Preview</p>
                <p className="text-[11px] text-[#9BAAB4]">
                  Provide a direct image URL (JPEG, PNG, or WebP) below.
                </p>
              </div>
            </div>

            {/* Avatar URL Field */}
            <FormField
              id="avatar-url"
              label="Avatar Image URL"
              helperText="Optional link to a public image URL starting with http:// or https://"
            >
              <Input
                id="avatar-url"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                disabled={loading}
              />
            </FormField>

            {/* Display Name Field */}
            <FormField id="edit-name" label="Display Name" required>
              <Input
                id="edit-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                disabled={loading}
                required
              />
            </FormField>

            {/* Email Field (Read-only) */}
            <FormField
              id="edit-email"
              label="Email Address"
              helperText="Your email cannot be edited from this form."
            >
              <Input
                id="edit-email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-[#101A22] text-[#9BAAB4] border-[#263640] cursor-not-allowed"
              />
            </FormField>

            {/* Biography Field */}
            <FormField
              id="edit-bio"
              label="Biography"
              helperText={`${bio.length}/250 characters`}
            >
              <textarea
                id="edit-bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the community about yourself, your interests, or what you're working on..."
                disabled={loading}
                className="w-full resize-none rounded-xl border border-[#263640] bg-[#101A22] p-3 text-sm text-[#F4F8FA] placeholder-[#9BAAB4] focus:outline-none focus:border-[#19D3E3]"
              />
            </FormField>
          </CardContent>

          <CardFooter className="flex items-center justify-end gap-3 border-t border-[#263640] pt-4">
            <Button
              href={ROUTES.USER.PROFILE}
              variant="outline"
              size="md"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
            >
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      )}
    </div>
  );
}
