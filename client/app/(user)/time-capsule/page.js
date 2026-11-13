'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import ExperienceHeader from '@/components/experiences/ExperienceHeader';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Card, { CardContent } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { timeCapsuleService } from '@/services/timeCapsuleService';

function formatCountdown(targetDate) {
  const diffMs = new Date(targetDate) - new Date();
  if (diffMs <= 0) return 'Unlocked';

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export default function TimeCapsulePage() {
  const { user } = useAuth();
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());
  const [tabFilter, setTabFilter] = useState('all'); // 'all' | 'locked' | 'unsealed'
  const [deletingId, setDeletingId] = useState(null);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [unlockAt, setUnlockAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Ticking timer for real-time countdown updates
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadCapsules = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await timeCapsuleService.listCapsules();
      if (res?.success) {
        setCapsules(res.capsules || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load time capsules.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCapsules();
  }, [loadCapsules]);

  const handleCreate = async (e) => {
    e?.preventDefault();
    setCreateError('');

    if (!title.trim() || !message.trim() || !unlockAt) {
      setCreateError('Please complete all required fields.');
    }

    const targetDate = new Date(unlockAt);
    if (targetDate <= new Date()) {
      setCreateError('The unlock date must be in the future.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await timeCapsuleService.createCapsule({
        title: title.trim(),
        message: message.trim(),
        unlockDate: targetDate.toISOString(),
        unlockAt: targetDate.toISOString()
      });
      if (res?.success) {
        setShowCreateModal(false);
        setTitle('');
        setMessage('');
        setUnlockAt('');
        loadCapsules();
      }
    } catch (err) {
      setCreateError(err.message || 'Failed to seal capsule.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (capsuleId) => {
    try {
      await timeCapsuleService.deleteCapsule(capsuleId);
      setCapsules((prev) => prev.filter((c) => c._id !== capsuleId));
      setDeletingId(null);
    } catch (err) {
      setError(err.message || 'Failed to delete capsule.');
    }
  };

  // Helper to apply quick preset unlock dates
  const setPresetDate = (months) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    setUnlockAt(d.toISOString().slice(0, 16));
  };

  // Categorize capsules into locked vs unsealed
  const { lockedList, unsealedList, filteredList } = useMemo(() => {
    const locked = [];
    const unsealed = [];

    capsules.forEach((c) => {
      const unlockDate = new Date(c.unlockDate || c.unlockAt);
      const isUnlocked = c.isLocked === false || (c.isLocked === undefined && unlockDate <= now);
      if (isUnlocked) {
        unsealed.push(c);
      } else {
        locked.push(c);
      }
    });

    let filtered = capsules;
    if (tabFilter === 'locked') filtered = locked;
    if (tabFilter === 'unsealed') filtered = unsealed;

    return { lockedList: locked, unsealedList: unsealed, filteredList: filtered };
  }, [capsules, now, tabFilter]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. Standardized Experience Header */}
      <ExperienceHeader
        title="Time Capsules & Memory Vaults"
        description="Seal personal reflections, photos, and messages into future vaults. Vaults remain safely sealed by platform protocol until their designated unlock timestamp."
        icon="vault"
        categoryLabel="Moments & Vaults"
        status="Memory Vault"
        statusVariant="lavender"
        action={
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setShowCreateModal(true)}
            icon={<Icon name="vault" className="w-4 h-4 text-white" />}
            className="shadow-sm font-semibold shrink-0"
          >
            Seal a Capsule
          </Button>
        }
      />

      {error && (
        <div className="p-4 rounded-2xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-xs text-[#FF6B6B] flex items-center gap-2 font-medium">
          <Icon name="alertCircle" className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Categorization / Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E5E0] pb-3">
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'All Vaults', count: capsules.length },
            { id: 'locked', label: 'Locked Vaults', count: lockedList.length },
            { id: 'unsealed', label: 'Unsealed Memories', count: unsealedList.length }
          ].map((tab) => {
            const isSelected = tabFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTabFilter(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#6C63FF] text-white shadow-sm'
                    : 'bg-white border border-[#E7E5E0] text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F8F7F4]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white font-bold' : 'bg-[#F1F0EC] text-[#6B6B73]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-[11px] text-[#6B6B73] flex items-center gap-1.5 self-end sm:self-auto font-medium">
          <Icon name="clock" className="w-3.5 h-3.5 text-[#6C63FF]" />
          <span>Live Vault Synchronization</span>
        </div>
      </div>

      {/* 3. Active Content Grid or Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-white border border-[#E7E5E0] animate-pulse space-y-4 shadow-xs">
              <div className="flex justify-between items-center">
                <div className="w-24 h-4 bg-[#F1F0EC] rounded" />
                <div className="w-6 h-6 bg-[#F1F0EC] rounded" />
              </div>
              <div className="w-3/4 h-5 bg-[#F1F0EC] rounded" />
              <div className="w-full h-24 bg-[#F1F0EC] rounded" />
            </div>
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <EmptyState
          icon="vault"
          title={
            tabFilter === 'locked'
              ? 'No Locked Capsules'
              : tabFilter === 'unsealed'
              ? 'No Unsealed Memories Yet'
              : 'Vault is Empty'
          }
          description={
            tabFilter === 'locked'
              ? 'You have no time vaults counting down. Seal a new memory to unlock on a future date!'
              : tabFilter === 'unsealed'
              ? 'None of your locked capsules have reached their unlock date yet. Check back when the timers expire!'
              : 'You have no sealed time capsules. Write a reflection to your future self or lock a moment in time.'
          }
          badgeText="Encrypted Vault"
          action={
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              icon={<Icon name="vault" className="w-4 h-4 text-white" />}
            >
              Seal a Capsule
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map((capsule) => {
            const unlockDate = new Date(capsule.unlockDate || capsule.unlockAt);
            const isUnlocked = capsule.isLocked === false || (capsule.isLocked === undefined && unlockDate <= now);

            return (
              <Card
                key={capsule._id}
                className={`transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between ${
                  isUnlocked
                    ? 'border-[#4CAF78]/40 bg-[#F5FBF7]'
                    : 'bg-white border-[#E7E5E0] hover:border-[#6C63FF]/40'
                }`}
              >
                <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* Status & Vault Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isUnlocked
                          ? 'bg-[#4CAF78]/15 text-[#2E7D4E] border border-[#4CAF78]/30'
                          : 'bg-[#EEEAFE] text-[#6C63FF] border border-[#6C63FF]/30'
                      }`}
                    >
                      <Icon name={isUnlocked ? 'sparkles' : 'lock'} className="w-3 h-3" />
                      {isUnlocked ? 'Unsealed Memory' : 'Vault Locked'}
                    </span>

                    {/* Delete action */}
                    {deletingId === capsule._id ? (
                      <div className="flex items-center gap-1.5 bg-[#F1F0EC] px-2 py-1 rounded-lg border border-[#FF6B6B]/40">
                        <span className="text-[10px] text-[#FF6B6B] font-bold">Delete?</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(capsule._id)}
                          className="text-[10px] text-[#FF6B6B] hover:underline font-bold"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="text-[10px] text-[#6B6B73] hover:text-[#1E1E24]"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingId(capsule._id)}
                        className="text-[#6B6B73] hover:text-[#FF6B6B] p-1 rounded-lg transition-colors cursor-pointer"
                        title="Delete Capsule"
                      >
                        <Icon name="trash" className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Title & Date Metadata */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#1E1E24] line-clamp-1">
                      {capsule.title}
                    </h3>
                    <p className="text-[11px] text-[#6B6B73]">
                      Target date: {unlockDate.toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Vault Content: Revealed vs Locked Countdown */}
                  {isUnlocked ? (
                    <div className="p-4 rounded-xl bg-white border border-[#4CAF78]/30 space-y-2 shadow-xs">
                      <p className="text-xs text-[#1E1E24] whitespace-pre-wrap leading-relaxed">
                        {capsule.message || 'Sealed message revealed.'}
                      </p>
                      <p className="text-[10px] text-[#2E7D4E] font-semibold pt-1 flex items-center gap-1">
                        <Icon name="check" className="w-3 h-3 text-[#2E7D4E]" />
                        Unsealed and accessible permanently
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] text-center space-y-2">
                      <Icon name="lock" className="w-5 h-5 text-[#6C63FF] mx-auto animate-pulse" />
                      <p className="text-xs font-bold text-[#1E1E24] font-mono tracking-wider">
                        {formatCountdown(unlockDate)}
                      </p>
                      <p className="text-[10px] text-[#6B6B73] leading-relaxed">
                        Content is securely locked by platform protocol until the target date.
                      </p>
                    </div>
                  )}

                  {/* Creator / Date footer */}
                  <div className="pt-2 border-t border-[#E7E5E0] flex items-center justify-between text-[11px] text-[#6B6B73]">
                    <span>Sealed {new Date(capsule.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>By {capsule.creator?.fullName || user?.fullName || 'You'}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 4. Supporting Information / How It Works */}
      <section className="p-6 rounded-2xl bg-white border border-[#E7E5E0] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Icon name="vault" className="w-4 h-4 text-[#6C63FF]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E1E24]">
            How Time Vaults Work
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-[#EEEAFE] text-[#6C63FF] flex items-center justify-center text-xs font-bold">
              1
            </div>
            <h3 className="text-xs font-bold text-[#1E1E24]">Compose &amp; Seal</h3>
            <p className="text-[11px] text-[#6B6B73] leading-relaxed">
              Write personal predictions, letters to your future self, or secret memories for friends.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-[#FFEAEA] text-[#FF6B6B] flex items-center justify-center text-xs font-bold">
              2
            </div>
            <h3 className="text-xs font-bold text-[#1E1E24]">Automated Lock Protocol</h3>
            <p className="text-[11px] text-[#6B6B73] leading-relaxed">
              The platform securely holds the message in confidence until the countdown expires.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-[#E8F7EE] text-[#4CAF78] flex items-center justify-center text-xs font-bold">
              3
            </div>
            <h3 className="text-xs font-bold text-[#1E1E24]">Future Reveal</h3>
            <p className="text-[11px] text-[#6B6B73] leading-relaxed">
              When the unlock date arrives, your memory vault transforms into an unsealed keepsake.
            </p>
          </div>
        </div>
      </section>

      {/* Seal a Capsule Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
        >
          <div className="w-full max-w-md bg-white border border-[#E7E5E0] rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EEEAFE] flex items-center justify-center text-[#6C63FF]">
                  <Icon name="vault" className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1E1E24]">Seal a Time Capsule</h2>
                  <p className="text-[11px] text-[#6B6B73]">Lock a memory to open in the future</p>
                </div>
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
                <label className="text-xs font-bold text-[#1E1E24]">Capsule Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Letter to My 2027 Self"
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] text-xs text-[#1E1E24] placeholder-[#6B6B73] focus:outline-hidden focus:border-[#6C63FF] focus:bg-white"
                  required
                />
              </div>

              {/* Quick Presets for Unlock Date */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#1E1E24] flex items-center justify-between">
                  <span>Unlock Date &amp; Time</span>
                  <span className="text-[10px] text-[#6B6B73] font-normal">Presets:</span>
                </label>
                <div className="flex items-center gap-1.5 pb-1">
                  {[
                    { label: '+1 Mo', months: 1 },
                    { label: '+6 Mo', months: 6 },
                    { label: '+1 Yr', months: 12 },
                    { label: '+2 Yr', months: 24 }
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setPresetDate(p.months)}
                      className="px-2.5 py-1 rounded-lg bg-[#F1F0EC] hover:bg-[#EEEAFE] border border-[#E7E5E0] text-[10px] font-semibold text-[#6C63FF] cursor-pointer transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="datetime-local"
                  value={unlockAt}
                  onChange={(e) => setUnlockAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] text-xs text-[#1E1E24] focus:outline-hidden focus:border-[#6C63FF] focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1E1E24]">Sealed Message / Reflection</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What do you want to remember or say when this unseals?..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] text-xs text-[#1E1E24] placeholder-[#6B6B73] focus:outline-hidden focus:border-[#6C63FF] focus:bg-white"
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
                  {submitting ? 'Locking in Vault...' : 'Seal Capsule'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
