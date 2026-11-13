'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import ExperienceHeader from '@/components/experiences/ExperienceHeader';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import Card, { CardContent } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { circleService } from '@/services/circleService';
import { ROUTES } from '@/lib/routes';

// Categories strictly aligned with backend Circle schema enum
const CIRCLE_CATEGORIES = [
  { id: 'all', label: 'All Circles' },
  { id: 'Technology', label: 'Technology' },
  { id: 'Gaming', label: 'Gaming' },
  { id: 'Photography', label: 'Photography' },
  { id: 'Movies', label: 'Movies & Cinema' },
  { id: 'Music', label: 'Music & Audio' },
  { id: 'Travel', label: 'Travel & Adventure' },
  { id: 'Art', label: 'Art & Design' },
  { id: 'College', label: 'College & Campus' },
  { id: 'Other', label: 'Other Topics' }
];

export default function CirclesPage() {
  const { user } = useAuth();
  const [circles, setCircles] = useState([]);
  const [category, setCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('discover'); // 'discover' | 'my_circles'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [circleCategory, setCircleCategory] = useState('Technology');
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
    const isMember = Boolean(
      circle.isMember ||
      circle.members?.some((m) => (m._id || m) === user?._id)
    );
    setActionLoadingId(circle._id);
    try {
      if (isMember) {
        await circleService.leaveCircle(circle._id);
      } else {
        await circleService.joinCircle(circle._id);
      }
      await loadCircles();
    } catch (err) {
      setError(err.message || 'Failed to update circle membership.');
    } finally {
      setActionLoadingId(null);
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

  // Filter circles based on active tab and search query
  const filteredCircles = useMemo(() => {
    return circles.filter((circle) => {
      const isMember = Boolean(
        circle.isMember ||
        circle.members?.some((m) => (m._id || m) === user?._id)
      );

      // Tab filter
      if (activeTab === 'my_circles' && !isMember) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = circle.name?.toLowerCase().includes(query);
        const matchesDesc = circle.description?.toLowerCase().includes(query);
        const matchesCat = circle.category?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }

      return true;
    });
  }, [circles, activeTab, searchQuery, user?._id]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. Standardized Experience Header */}
      <ExperienceHeader
        title="Community Circles & Spaces"
        description="Discover interest-driven communities, join discussions, and share content with creators who share your passions."
        icon="circles"
        categoryLabel="Spaces & Social"
        status="Active Communities"
        statusVariant="lime"
        action={
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setShowCreateModal(true)}
            icon={<Icon name="plus" className="w-4 h-4 text-white" />}
            className="shadow-sm font-semibold shrink-0"
          >
            Create Circle
          </Button>
        }
      />

      {error && (
        <div className="p-4 rounded-2xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-xs text-[#FF6B6B] flex items-center gap-2 font-medium">
          <Icon name="alertCircle" className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Primary Tabs & Search Input */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Navigation Tabs (Discover vs My Circles) */}
        <div className="flex items-center gap-2 border-b border-[#E7E5E0] pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-2 text-xs font-bold transition-colors cursor-pointer border-b-2 -mb-[2px] ${
              activeTab === 'discover'
                ? 'border-[#6C63FF] text-[#6C63FF]'
                : 'border-transparent text-[#6B6B73] hover:text-[#1E1E24]'
            }`}
          >
            Discover All Circles
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my_circles')}
            className={`px-4 py-2 text-xs font-bold transition-colors cursor-pointer border-b-2 -mb-[2px] ${
              activeTab === 'my_circles'
                ? 'border-[#6C63FF] text-[#6C63FF]'
                : 'border-transparent text-[#6B6B73] hover:text-[#1E1E24]'
            }`}
          >
            My Circles
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circles by name or topic..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-[#E7E5E0] text-xs text-[#1E1E24] placeholder-[#6B6B73] focus:outline-hidden focus:border-[#6C63FF] shadow-2xs transition-colors"
          />
          <Icon
            name="search"
            className="w-4 h-4 text-[#6B6B73] absolute left-3 top-1/2 -translate-y-1/2"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B73] hover:text-[#1E1E24]"
            >
              <Icon name="close" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CIRCLE_CATEGORIES.map((cat) => {
          const isSelected = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#6C63FF] text-white shadow-xs font-bold'
                  : 'bg-white border border-[#E7E5E0] text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F8F7F4]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 4. Active Content Grid or Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-[#E7E5E0] animate-pulse space-y-3 shadow-xs">
              <div className="flex justify-between items-center">
                <div className="w-20 h-4 bg-[#F1F0EC] rounded" />
                <div className="w-16 h-4 bg-[#F1F0EC] rounded" />
              </div>
              <div className="w-3/4 h-5 bg-[#F1F0EC] rounded" />
              <div className="w-full h-10 bg-[#F1F0EC] rounded" />
              <div className="w-full h-8 bg-[#F1F0EC] rounded" />
            </div>
          ))}
        </div>
      ) : filteredCircles.length === 0 ? (
        <EmptyState
          icon="circles"
          title={
            activeTab === 'my_circles'
              ? "You Haven't Joined Any Circles Yet"
              : searchQuery
              ? 'No Circles Matched Your Search'
              : 'No Circles Found'
          }
          description={
            activeTab === 'my_circles'
              ? 'Explore the communities above and click Join on the topics that match your passions.'
              : searchQuery
              ? `No circles found matching "${searchQuery}". Try a different keyword or create one!`
              : 'No communities exist under this category yet. Be the first to start a circle!'
          }
          badgeText="Looply Communities"
          action={
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              icon={<Icon name="plus" className="w-4 h-4 text-white" />}
            >
              Create Circle
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCircles.map((circle) => {
            const isMember = Boolean(
              circle.isMember ||
              circle.members?.some((m) => (m._id || m) === user?._id)
            );
            const isActing = actionLoadingId === circle._id;

            return (
              <Card
                key={circle._id}
                className="bg-white border-[#E7E5E0] hover:border-[#6C63FF]/40 transition-all flex flex-col justify-between shadow-xs hover:shadow-md group"
              >
                <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* Category Pill and Member Count */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EEEAFE] text-[#6C63FF] border border-[#6C63FF]/20">
                      {circle.category}
                    </span>
                    <span className="text-[11px] text-[#6B6B73] flex items-center gap-1.5 font-medium">
                      <Icon name="users" className="w-3.5 h-3.5 text-[#6C63FF]" />
                      {circle.memberCount || circle.membersCount || circle.members?.length || 1} members
                    </span>
                  </div>

                  {/* Circle Name and Description */}
                  <div className="space-y-1.5">
                    <Link
                      href={ROUTES.USER.CIRCLE_DETAIL(circle.slug)}
                      className="text-sm font-bold text-[#1E1E24] group-hover:text-[#6C63FF] transition-colors line-clamp-1 block"
                    >
                      {circle.name}
                    </Link>
                    <p className="text-xs text-[#6B6B73] line-clamp-2 leading-relaxed">
                      {circle.description}
                    </p>
                  </div>

                  {/* Creator and Membership Action */}
                  <div className="pt-3 border-t border-[#E7E5E0] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={circle.creator?.fullName || 'Creator'}
                        src={circle.creator?.profile?.avatarUrl}
                        size="xs"
                      />
                      <span className="text-[11px] text-[#6B6B73] truncate max-w-[90px]">
                        {circle.creator?.fullName || 'Creator'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={isMember ? 'outline' : 'primary'}
                        disabled={isActing}
                        onClick={() => handleJoinLeave(circle)}
                        className="text-xs font-semibold"
                      >
                        {isActing
                          ? 'Updating...'
                          : isMember
                          ? 'Joined'
                          : 'Join'}
                      </Button>
                      <Link href={ROUTES.USER.CIRCLE_DETAIL(circle.slug)}>
                        <Button type="button" size="sm" variant="ghost" className="text-xs text-[#6B6B73] hover:text-[#1E1E24]">
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

      {/* 5. Supporting Information / About Circles */}
      <section className="p-6 rounded-2xl bg-white border border-[#E7E5E0] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Icon name="circles" className="w-4 h-4 text-[#6C63FF]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E1E24]">
            About Looply Community Circles
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-[#EEEAFE] text-[#6C63FF] flex items-center justify-center text-xs font-bold">
              1
            </div>
            <h3 className="text-xs font-bold text-[#1E1E24]">Focused Micro-Spaces</h3>
            <p className="text-[11px] text-[#6B6B73] leading-relaxed">
              Every circle is dedicated strictly to a shared hobby, craft, or creative discipline.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-[#FFF7E0] text-[#B28200] flex items-center justify-center text-xs font-bold">
              2
            </div>
            <h3 className="text-xs font-bold text-[#1E1E24]">Creator Hubs</h3>
            <p className="text-[11px] text-[#6B6B73] leading-relaxed">
              Lead discussions, collaborate, and foster genuine connection without algorithmic noise.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-[#FFEAEA] text-[#FF6B6B] flex items-center justify-center text-xs font-bold">
              3
            </div>
            <h3 className="text-xs font-bold text-[#1E1E24]">Dedicated Streams</h3>
            <p className="text-[11px] text-[#6B6B73] leading-relaxed">
              Posts published into circles reach fellow members directly in their dedicated community feed.
            </p>
          </div>
        </div>
      </section>

      {/* Create Circle Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
        >
          <div className="w-full max-w-md bg-white border border-[#E7E5E0] rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EEEAFE] flex items-center justify-center text-[#6C63FF]">
                  <Icon name="circles" className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-[#1E1E24]">Create a New Circle</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#6B6B73] hover:text-[#1E1E24] p-1 rounded-lg hover:bg-[#F1F0EC] cursor-pointer"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-xs text-[#FF6B6B] font-medium">
                  {createError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1E1E24]">Circle Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Next.js Developers"
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] text-xs text-[#1E1E24] placeholder-[#6B6B73] focus:outline-hidden focus:border-[#6C63FF] focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1E1E24]">Category</label>
                <select
                  value={circleCategory}
                  onChange={(e) => setCircleCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] text-xs text-[#1E1E24] focus:outline-hidden focus:border-[#6C63FF] focus:bg-white"
                >
                  <option value="Technology">Technology</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Photography">Photography</option>
                  <option value="Movies">Movies &amp; Cinema</option>
                  <option value="Music">Music &amp; Audio</option>
                  <option value="Travel">Travel &amp; Adventure</option>
                  <option value="Art">Art &amp; Design</option>
                  <option value="College">College &amp; Campus</option>
                  <option value="Other">Other Topics</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1E1E24]">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what your circle is about and community guidelines..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] text-xs text-[#1E1E24] placeholder-[#6B6B73] focus:outline-hidden focus:border-[#6C63FF] focus:bg-white"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="circleIsPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded border-[#E7E5E0] text-[#6C63FF] focus:ring-[#6C63FF]"
                />
                <label htmlFor="circleIsPrivate" className="text-xs text-[#1E1E24] cursor-pointer font-medium">
                  Private Circle (invite only)
                </label>
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
