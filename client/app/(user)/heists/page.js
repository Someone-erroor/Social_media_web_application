'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import { heistService } from '@/services/heistService';
import { ROUTES } from '@/lib/routes';

const STATUS_FILTERS = [
  { id: '', label: 'All Missions' },
  { id: 'active', label: 'Active Heists' },
  { id: 'completed', label: 'Cracked / Solved' },
  { id: 'expired', label: 'Archived / Expired' }
];

const DIFFICULTY_VARIANTS = {
  easy: 'success',
  medium: 'warning',
  hard: 'danger',
  master: 'lavender'
};

function formatTimeRemaining(endAt) {
  if (!endAt) return 'No deadline';
  const diff = new Date(endAt).getTime() - Date.now();
  if (diff <= 0) return 'Mission Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h remaining`;
  }
  return `${hours}h ${mins}m remaining`;
}

export default function HeistsPage() {
  const [heists, setHeists] = useState([]);
  const [statusFilter, setStatusFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Creation Form State
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    missionPrompt: '',
    heistType: 'community_code',
    difficulty: 'medium',
    category: 'cipher',
    targetSolution: '',
    durationHours: 6,
    clue1Text: '',
    clue1Hint: '',
    clue2Text: '',
    clue2Hint: '',
    clue2Threshold: 2
  });

  const loadHeists = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await heistService.getHeists({
        status: statusFilter,
        search
      });
      if (res?.success) {
        setHeists(res.heists || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load community Feed Heists.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadHeists();
  }, [loadHeists]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!formData.title.trim()) {
      setCreateError('Mission title is required.');
      return;
    }
    if (!formData.shortDescription.trim()) {
      setCreateError('Short briefing description is required.');
      return;
    }
    if (!formData.missionPrompt.trim()) {
      setCreateError('Full mission prompt is required.');
      return;
    }
    if (!formData.targetSolution.trim()) {
      setCreateError('Target cipher solution is required.');
      return;
    }

    const endAt = new Date(Date.now() + Math.max(1, formData.durationHours) * 3600 * 1000);

    const clues = [];
    if (formData.clue1Text.trim()) {
      clues.push({
        order: 1,
        clueText: formData.clue1Text.trim(),
        hint: formData.clue1Hint.trim(),
        unlockParticipantThreshold: 0
      });
    }
    if (formData.clue2Text.trim()) {
      clues.push({
        order: 2,
        clueText: formData.clue2Text.trim(),
        hint: formData.clue2Hint.trim(),
        unlockParticipantThreshold: parseInt(formData.clue2Threshold, 10) || 2
      });
    }

    setCreateLoading(true);
    try {
      await heistService.createHeist({
        title: formData.title.trim(),
        shortDescription: formData.shortDescription.trim(),
        missionPrompt: formData.missionPrompt.trim(),
        heistType: formData.heistType,
        difficulty: formData.difficulty,
        category: formData.category,
        targetSolution: formData.targetSolution.trim(),
        endAt: endAt.toISOString(),
        clues
      });

      setShowCreateModal(false);
      setFormData({
        title: '',
        shortDescription: '',
        missionPrompt: '',
        heistType: 'community_code',
        difficulty: 'medium',
        category: 'cipher',
        targetSolution: '',
        durationHours: 6,
        clue1Text: '',
        clue1Hint: '',
        clue2Text: '',
        clue2Hint: '',
        clue2Threshold: 2
      });
      loadHeists();
    } catch (err) {
      setCreateError(err.message || 'Failed to initiate Feed Heist.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <PageHeader
        title="Feed Heists"
        description="Collaborative, time-sensitive social missions appearing in the Loop. Operatives must collectively uncover clues and crack objectives before time expires."
        badge={
          <Badge variant="coral" size="sm">
            Signature Experience
          </Badge>
        }
        action={
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            icon={<Icon name="key" className="w-4 h-4" />}
          >
            Initiate Heist
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#2D2938]">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === f.id
                  ? 'bg-[#FF6257] text-[#110F17]'
                  : 'text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search missions..."
            aria-label="Search heists"
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] focus:outline-none focus:border-[#FF6257]"
          />
          <Icon name="search" className="w-3.5 h-3.5 text-[#777580] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257]">
          {error}
        </div>
      )}

      {/* Grid of Heists */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-[#1E1B26] border border-[#2D2938] animate-pulse" />
          ))}
        </div>
      ) : heists.length === 0 ? (
        <EmptyState
          icon="key"
          title="No Active Feed Heists"
          description={
            statusFilter === 'active'
              ? 'There are currently no active missions running. Initiate the first collaborative community heist!'
              : 'No missions match your selected filter criteria.'
          }
          badgeText="Social Missions"
          action={
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              Initiate Heist
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {heists.map((heist) => {
            const isCompleted = heist.status === 'completed';
            const isExpired = heist.status === 'expired';

            return (
              <Card
                key={heist._id}
                className="bg-[#1E1B26] border-[#2D2938] hover:border-[#FF6257]/40 transition-all flex flex-col justify-between"
              >
                <CardContent className="p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-[#FF6257]/15 text-[#FF6257]">
                        <Icon name="key" className="w-4 h-4" />
                      </span>
                      <Badge variant={DIFFICULTY_VARIANTS[heist.difficulty] || 'neutral'} size="sm">
                        {heist.difficulty?.toUpperCase()}
                      </Badge>
                      <span className="text-[11px] font-mono text-[#D5F36A] uppercase">
                        {heist.heistType?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <Badge
                      variant={
                        isCompleted
                          ? 'success'
                          : isExpired
                          ? 'neutral'
                          : 'coral'
                      }
                      size="sm"
                    >
                      {isCompleted ? 'CRACKED' : isExpired ? 'EXPIRED' : 'ACTIVE'}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-base font-bold text-[#F6F2EA] font-display hover:text-[#FF6257] transition-colors">
                      <Link href={ROUTES.USER.HEIST_DETAIL(heist._id)}>
                        {heist.title}
                      </Link>
                    </h2>
                    <p className="text-xs text-[#777580] line-clamp-2 leading-relaxed">
                      {heist.shortDescription}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#17151D] border border-[#2D2938] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={heist.creator?.fullName || 'Operative'}
                        src={heist.creator?.profile?.avatarUrl}
                        size="xs"
                      />
                      <span className="text-[#F6F2EA] font-medium text-[11px]">
                        {heist.creator?.fullName || 'Anonymous'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#777580]">
                      <span className="flex items-center gap-1 font-mono text-[#D5F36A]">
                        <Icon name="users" className="w-3.5 h-3.5" />
                        {heist.participantsCount ?? 0} Operatives
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-[#FF6257] flex items-center gap-1">
                      <Icon name="clock" className="w-3.5 h-3.5" />
                      {isCompleted ? 'Mission Completed' : formatTimeRemaining(heist.endAt)}
                    </span>

                    <Link href={ROUTES.USER.HEIST_DETAIL(heist._id)}>
                      <Button type="button" size="sm" variant={isCompleted ? 'outline' : 'primary'}>
                        {isCompleted ? 'View Debrief' : 'Enter Mission'}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Heist Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#110F17]/85 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-xl bg-[#1E1B26] border border-[#2D2938] rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D2938]">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#FF6257]">Mission Dispatch</span>
                <h3 className="text-base font-bold text-[#F6F2EA]">Initiate Feed Heist</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#777580] hover:text-[#F6F2EA] p-1 rounded-lg"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257]">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#777580]">Mission Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Operation Echo Chamber"
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-[#F6F2EA] focus:outline-none focus:border-[#FF6257]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#777580]">Mission Format</label>
                  <select
                    value={formData.heistType}
                    onChange={(e) => setFormData({ ...formData, heistType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-[#F6F2EA] focus:outline-none focus:border-[#FF6257]"
                  >
                    <option value="community_code">Community Code</option>
                    <option value="perspective_heist">Perspective Heist</option>
                    <option value="signal_hunt">Signal Hunt</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#777580]">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-[#F6F2EA] focus:outline-none focus:border-[#FF6257]"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="master">Master</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#777580]">Duration (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={formData.durationHours}
                    onChange={(e) => setFormData({ ...formData, durationHours: parseInt(e.target.value, 10) || 6 })}
                    className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-[#F6F2EA] focus:outline-none focus:border-[#FF6257]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#777580]">Short Briefing *</label>
                <input
                  type="text"
                  required
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="One sentence summary visible in feed and cards..."
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-[#F6F2EA] focus:outline-none focus:border-[#FF6257]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#777580]">Full Mission Briefing / Objective *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.missionPrompt}
                  onChange={(e) => setFormData({ ...formData, missionPrompt: e.target.value })}
                  placeholder="Explain the background mystery, what the community is investigating, and what format the answer takes..."
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-[#F6F2EA] focus:outline-none focus:border-[#FF6257]"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#17151D] border border-[#2D2938] space-y-3">
                <span className="font-bold text-[#FF6257] block">Clue 1 (Unlocked Immediately)</span>
                <input
                  type="text"
                  value={formData.clue1Text}
                  onChange={(e) => setFormData({ ...formData, clue1Text: e.target.value })}
                  placeholder="First clue description or riddle..."
                  className="w-full px-3 py-2 rounded-xl bg-[#110F17] border border-[#2D2938] text-[#F6F2EA] focus:outline-none focus:border-[#FF6257]"
                />
                <input
                  type="text"
                  value={formData.clue1Hint}
                  onChange={(e) => setFormData({ ...formData, clue1Hint: e.target.value })}
                  placeholder="Optional hint..."
                  className="w-full px-3 py-2 rounded-xl bg-[#110F17] border border-[#2D2938] text-[#F6F2EA] focus:outline-none focus:border-[#FF6257]"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#17151D] border border-[#2D2938] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#D5F36A]">Clue 2 (Gated by Operative Count)</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#777580]">Unlocks at:</span>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={formData.clue2Threshold}
                      onChange={(e) => setFormData({ ...formData, clue2Threshold: parseInt(e.target.value, 10) || 2 })}
                      className="w-16 px-2 py-1 rounded-lg bg-[#110F17] border border-[#2D2938] text-[#F6F2EA] text-center"
                    />
                    <span className="text-[#777580]">operatives</span>
                  </div>
                </div>
                <input
                  type="text"
                  value={formData.clue2Text}
                  onChange={(e) => setFormData({ ...formData, clue2Text: e.target.value })}
                  placeholder="Second clue that unlocks when community unites..."
                  className="w-full px-3 py-2 rounded-xl bg-[#110F17] border border-[#2D2938] text-[#F6F2EA] focus:outline-none focus:border-[#FF6257]"
                />
                <input
                  type="text"
                  value={formData.clue2Hint}
                  onChange={(e) => setFormData({ ...formData, clue2Hint: e.target.value })}
                  placeholder="Optional hint..."
                  className="w-full px-3 py-2 rounded-xl bg-[#110F17] border border-[#2D2938] text-[#F6F2EA] focus:outline-none focus:border-[#FF6257]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#FF6257]">Target Cipher Solution *</label>
                <input
                  type="text"
                  required
                  value={formData.targetSolution}
                  onChange={(e) => setFormData({ ...formData, targetSolution: e.target.value })}
                  placeholder="The exact solution code or phrase that cracks the heist..."
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#FF6257]/40 text-[#F6F2EA] focus:outline-none focus:border-[#FF6257]"
                />
                <p className="text-[10px] text-[#777580]">
                  Target solution is strictly encrypted on the server and hidden from all public payloads.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2D2938]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={createLoading}
                >
                  {createLoading ? 'Deploying...' : 'Dispatch Mission'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

