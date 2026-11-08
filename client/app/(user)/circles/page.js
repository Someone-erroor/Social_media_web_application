'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import Card, { CardContent } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { circleService } from '@/services/circleService';
import { ROUTES } from '@/lib/routes';

const CATEGORIES = [
  { id: 'all', label: 'All Circles' },
  { id: 'technology', label: 'Technology' },
  { id: 'art', label: 'Art & Design' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'music', label: 'Music & Audio' },
  { id: 'science', label: 'Science' },
  { id: 'general', label: 'General' }
];

export default function CirclesPage() {
  const { user } = useAuth();
  const [circles, setCircles] = useState([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [circleCategory, setCircleCategory] = useState('technology');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadCircles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const catParam = category === 'all' ? null : category;
      const res = await circleService.listCircles({ category: catParam });
      if (res?.success) {
        setCircles(res.circles || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load circles.');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadCircles();
  }, [loadCircles]);

  const handleJoinLeave = async (circle) => {
    const isMember = circle.members?.some((m) => (m._id || m) === user?._id);
    try {
      if (isMember) {
        await circleService.leaveCircle(circle._id);
      } else {
        await circleService.joinCircle(circle._id);
      }
      loadCircles();
    } catch (err) {
      setError(err.message || 'Failed to update circle membership.');
    }
  };

  const handleCreate = async (e) => {
    e?.preventDefault();
    setCreateError('');

    if (!name.trim() || !description.trim()) {
      setCreateError('Please provide a name and description.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await circleService.createCircle({
        name: name.trim(),
        description: description.trim(),
        category: circleCategory,
        isPrivate
      });
      if (res?.success) {
        setShowCreateModal(false);
        setName('');
        setDescription('');
        loadCircles();
      }
    } catch (err) {
      setCreateError(err.message || 'Failed to create circle.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Community Circles"
          description="Join focused topical spaces, discuss passions, and discover creators with shared interests"
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          icon={<Icon name="plus" className="w-4 h-4" />}
          className="self-start sm:self-auto shrink-0 shadow-lg shadow-coral-500/10"
        >
          Create Circle
        </Button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-[#2D2938]">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              category === cat.id
                ? 'bg-[#FF6257] text-[#17151D] shadow-md shadow-[#FF6257]/20'
                : 'text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-[#1E1B26] border border-[#2D2938] animate-pulse space-y-3">
              <div className="w-20 h-4 bg-[#24202E] rounded" />
              <div className="w-3/4 h-5 bg-[#24202E] rounded" />
              <div className="w-full h-8 bg-[#24202E] rounded" />
            </div>
          ))}
        </div>
      ) : circles.length === 0 ? (
        <EmptyState
          icon="circles"
          title="No Circles Found"
          description="No communities exist under this category yet. Create the very first circle!"
          badgeText="Looply Communities"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {circles.map((circle) => {
            const isMember = circle.members?.some((m) => (m._id || m) === user?._id);

            return (
              <Card
                key={circle._id}
                className="bg-[#1E1B26] border-[#2D2938] hover:border-[#FF6257]/40 transition-colors flex flex-col justify-between shadow-xl"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#B9A8F5]/15 text-[#B9A8F5] border border-[#B9A8F5]/30">
                      {circle.category}
                    </span>
                    <span className="text-[11px] text-[#777580] flex items-center gap-1">
                      <Icon name="users" className="w-3.5 h-3.5 text-[#D5F36A]" />
                      {circle.membersCount || circle.members?.length || 1} members
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Link
                      href={ROUTES.USER.CIRCLE_DETAIL(circle.slug)}
                      className="text-sm font-bold text-[#F6F2EA] hover:text-[#FF6257] font-display transition-colors line-clamp-1 block"
                    >
                      {circle.name}
                    </Link>
                    <p className="text-xs text-[#777580] line-clamp-2 leading-relaxed">
                      {circle.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#2D2938] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={circle.creator?.fullName || 'Creator'}
                        src={circle.creator?.profile?.avatarUrl}
                        size="xs"
                      />
                      <span className="text-[11px] text-[#777580] truncate max-w-[100px]">
                        {circle.creator?.fullName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={isMember ? 'outline' : 'primary'}
                        onClick={() => handleJoinLeave(circle)}
                      >
                        {isMember ? 'Joined' : 'Join'}
                      </Button>
                      <Link href={ROUTES.USER.CIRCLE_DETAIL(circle.slug)}>
                        <Button type="button" size="sm" variant="ghost">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Circle Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#110F17]/85 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-md bg-[#1E1B26] border border-[#2D2938] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D2938]">
              <h2 className="text-sm font-bold text-[#F6F2EA] font-display">Create a New Circle</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#777580] hover:text-[#F6F2EA] p-1 rounded-lg hover:bg-[#24202E]"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257]">
                  {createError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F6F2EA] font-display">Circle Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Next.js Developers"
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] placeholder-[#777580] focus:outline-hidden focus:border-[#FF6257]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F6F2EA] font-display">Category</label>
                <select
                  value={circleCategory}
                  onChange={(e) => setCircleCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] focus:outline-hidden focus:border-[#FF6257]"
                >
                  <option value="technology">Technology</option>
                  <option value="art">Art &amp; Design</option>
                  <option value="gaming">Gaming</option>
                  <option value="music">Music &amp; Audio</option>
                  <option value="science">Science</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F6F2EA] font-display">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what your circle is about and community guidelines..."
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] placeholder-[#777580] focus:outline-hidden focus:border-[#FF6257]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Circle'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
