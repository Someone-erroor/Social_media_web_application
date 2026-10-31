'use client';

import { useState } from 'react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthContext';
import { postService } from '@/services/postService';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

export default function PostComposer({ onPostCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const charCount = content.length;
  const isOverLimit = charCount > 1000;
  const isUnverified = user && user.isEmailVerified === false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (isUnverified) {
      setErrorMessage('Please verify your email address before publishing posts.');
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      setErrorMessage('Post content cannot be empty.');
      return;
    }

    if (trimmed.length > 1000) {
      setErrorMessage('Post content exceeds the 1000 character limit.');
      return;
    }

    setLoading(true);

    try {
      const res = await postService.createPost({ content: trimmed });
      setContent('');
      if (onPostCreated && res.post) {
        onPostCreated(res.post);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to publish post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-xs">
      <CardContent className="p-4 sm:p-5 space-y-3">
        {isUnverified && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="alertCircle" className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Your email is not verified yet. Verify to publish posts.</span>
            </div>
            <Link
              href={ROUTES.PUBLIC.VERIFY_EMAIL}
              className="font-semibold underline hover:text-amber-900 ml-2 shrink-0"
            >
              Verify now
            </Link>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-start gap-3">
            <Avatar
              name={user?.fullName || 'User'}
              src={user?.profile?.avatarUrl}
              size="md"
              status="online"
            />
            <div className="flex-1 min-w-0">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What is happening? Share your thoughts..."
                rows={3}
                disabled={loading}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-medium ${
                  isOverLimit
                    ? 'text-red-600 font-bold'
                    : charCount > 900
                    ? 'text-amber-600'
                    : 'text-slate-400'
                }`}
              >
                {charCount} / 1000
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading || !content.trim() || isOverLimit}
            >
              {loading ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

