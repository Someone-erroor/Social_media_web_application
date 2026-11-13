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
      setErrorMessage('Display name must be at least 2 characters.');
      return;
    }
    if (trimmedName.length > 70) {
      setErrorMessage('Display name cannot exceed 70 characters.');
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
        setSuccessMessage('Profile updated successfully! Redirecting...');
        setTimeout(() => {
          router.push(ROUTES.USER.PROFILE);
        }, 1000);
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
        description="Update your public identity, display name, avatar, and personal biography"
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
        <div className="p-4 rounded-2xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-xs text-[#FF6B6B] flex items-center justify-between gap-3 font-medium">
          <span>{fetchError}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFetchLoading(true);
              setFetchError('');
              setReloadTrigger((n) => n + 1);
            }}
            className="text-xs text-[#FF6B6B] hover:bg-[#FF6B6B]/10"
          >
            Retry
          </Button>
        </div>
      )}

      {fetchLoading ? (
        <Card className="border-[#E7E5E0] bg-white animate-pulse shadow-xs">
          <CardHeader className="space-y-2">
            <div className="h-5 w-40 bg-[#F1F0EC] rounded" />
            <div className="h-3 w-64 bg-[#F1F0EC]/60 rounded" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-[#F1F0EC]" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-28 bg-[#F1F0EC] rounded" />
                <div className="h-2.5 w-48 bg-[#F1F0EC]/60 rounded" />
              </div>
            </div>
            <div className="h-10 bg-[#F1F0EC]/50 rounded-xl" />
            <div className="h-10 bg-[#F1F0EC]/50 rounded-xl" />
            <div className="h-24 bg-[#F1F0EC]/50 rounded-xl" />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#E7E5E0] bg-white shadow-xs">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
              This information will be displayed publicly on your Looply profile
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-xs text-[#FF6B6B] flex items-center gap-2 font-medium">
                  <Icon name="alertCircle" className="w-4 h-4 text-[#FF6B6B] shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 rounded-xl bg-[#E8F7EE] border border-[#4CAF78]/30 text-xs text-[#2E7D4E] flex items-center gap-2 font-medium">
                  <Icon name="check" className="w-4 h-4 text-[#2E7D4E] shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Avatar Live Preview */}
              <div className="flex items-center gap-5 p-4 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0]">
                <Avatar
                  name={fullName || 'User'}
                  src={avatarUrl.trim()}
                  size="xl"
                />
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-bold text-[#1E1E24]">Avatar Live Preview</p>
                  <p className="text-[11px] text-[#6B6B73]">
                    Enter a direct public image URL (JPEG, PNG, or WebP) below to update your picture.
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
              <FormField
                id="edit-name"
                label="Display Name"
                required
                helperText={`${fullName.length}/70 characters (minimum 2)`}
              >
                <Input
                  id="edit-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  disabled={loading}
                  maxLength={70}
                  required
                />
              </FormField>

              {/* Email Field (Read-only) */}
              <FormField
                id="edit-email"
                label="Account Email"
                helperText="Account email address cannot be changed from this form."
              >
                <Input
                  id="edit-email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="opacity-70 bg-[#F1F0EC]"
                />
              </FormField>

              {/* Bio Field */}
              <FormField
                id="edit-bio"
                label="Biography"
                helperText={`${bio.length}/250 characters`}
              >
                <textarea
                  id="edit-bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a few words about your creative interests, hobbies, or what brings you to Looply..."
                  maxLength={250}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E7E5E0] text-xs text-[#1E1E24] placeholder-[#6B6B73] focus:outline-hidden focus:border-[#6C63FF] transition-colors"
                />
              </FormField>
            </CardContent>

            <CardFooter className="flex items-center justify-end gap-3 border-t border-[#E7E5E0] pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                href={ROUTES.USER.PROFILE}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={loading}
                icon={loading ? undefined : <Icon name="check" className="w-4 h-4 text-white" />}
              >
                {loading ? 'Saving Changes...' : 'Save Profile'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}
