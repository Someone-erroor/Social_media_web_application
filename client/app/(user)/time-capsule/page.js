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
      return;
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
        description="Seal personal reflections, photos, and messages into future vaults. Vaults remain locked and encrypted by platform protocol until their designated unlock timestamp."
        icon="vault"
        categoryLabel="Moments & Vaults"
        status="Memory Vault"
        statusVariant="lavender"
        action={
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setShowCreateModal(true)}
            icon={<Icon name="vault" className="w-4 h-4 text-[#B9A8F5]" />}
            className="border-[#B9A8F5]/40 text-[#B9A8F5] hover:bg-[#B9A8F5]/10 shadow-lg shadow-[#B9A8F5]/10 font-bold shrink-0"
          >
            Seal a Capsule
          </Button>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257] flex items-center gap-2">
          <Icon name="alertCircle" className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Categorization / Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2D2938] pb-3">
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
                    ? 'bg-[#B9A8F5] text-[#17151D] font-bold shadow-md shadow-[#B9A8F5]/20'
                    : 'bg-[#1E1B26] border border-[#2D2938] text-[#777580] hover:text-[#F6F2EA]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-[#17151D]/20 text-[#17151D]' : 'bg-[#2D2938] text-[#777580]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-[11px] text-[#777580] flex items-center gap-1.5 self-end sm:self-auto">
          <Icon name="clock" className="w-3.5 h-3.5 text-[#B9A8F5]" />
          <span>Live Vault Synchronization</span>
        </div>
      </div>

      {/* 3. Active Content Grid or Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-[#1E1B26] border border-[#2D2938] animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="w-24 h-4 bg-[#24202E] rounded" />
                <div className="w-6 h-6 bg-[#24202E] rounded" />
              </div>
              <div className="w-3/4 h-5 bg-[#24202E] rounded" />
              <div className="w-full h-24 bg-[#24202E] rounded" />
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
              variant="secondary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              icon={<Icon name="vault" className="w-4 h-4 text-[#B9A8F5]" />}
              className="border-[#B9A8F5]/40 text-[#B9A8F5] hover:bg-[#B9A8F5]/10"
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
                className={`transition-all duration-300 shadow-xl flex flex-col justify-between ${
                  isUnlocked
                    ? 'bg-[#1E1B26] border-[#D5F36A]/40 shadow-lg shadow-[#D5F36A]/5'
                    : 'bg-[#17151D] border-[#2D2938] hover:border-[#B9A8F5]/40'
                }`}
              >
                <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* Status & Vault Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isUnlocked
                          ? 'bg-[#D5F36A]/15 text-[#D5F36A] border border-[#D5F36A]/30'
                          : 'bg-[#B9A8F5]/15 text-[#B9A8F5] border border-[#B9A8F5]/30'
                      }`}
                    >
                      <Icon name={isUnlocked ? 'sparkles' : 'lock'} className="w-3 h-3" />
                      {isUnlocked ? 'Unsealed Memory' : 'Vault Locked'}
                    </span>

                    {/* Delete action */}
                    {deletingId === capsule._id ? (
                      <div className="flex items-center gap-1.5 bg-[#24202E] px-2 py-1 rounded-lg border border-[#FF6257]/40">
                        <span className="text-[10px] text-[#FF6257]">Delete?</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(capsule._id)}
                          className="text-[10px] text-[#FF6257] hover:underline font-bold"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="text-[10px] text-[#777580] hover:text-[#F6F2EA]"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingId(capsule._id)}
                        className="text-[#777580] hover:text-[#FF6257] p-1 rounded-lg transition-colors cursor-pointer"
                        title="Delete Capsule"
                      >
                        <Icon name="trash" className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Title & Date Metadata */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#F6F2EA] font-display line-clamp-1">
                      {capsule.title}
                    </h3>
                    <p className="text-[11px] text-[#777580]">
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
                    <div className="p-4 rounded-xl bg-[#17151D] border border-[#D5F36A]/20 space-y-2">
                      <p className="text-xs text-[#F6F2EA] whitespace-pre-wrap leading-relaxed">
                        {capsule.message || 'Sealed message revealed.'}
                      </p>
                      <p className="text-[10px] text-[#D5F36A] font-semibold pt-1 flex items-center gap-1">
                        <Icon name="check" className="w-3 h-3 text-[#D5F36A]" />
                        Unsealed and accessible permanently
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#110F17] border border-[#2D2938] text-center space-y-2">
                      <Icon name="lock" className="w-5 h-5 text-[#B9A8F5] mx-auto animate-pulse" />
                      <p className="text-xs font-bold text-[#F6F2EA] font-mono tracking-wider">
                        {formatCountdown(unlockDate)}
                      </p>
                      <p className="text-[10px] text-[#777580] leading-relaxed">
                        Content is securely locked by backend protocol until the target date.
                      </p>
                    </div>
                  )}

                  {/* Creator / Date footer */}
                  <div className="pt-2 border-t border-[#2D2938] flex items-center justify-between text-[11px] text-[#777580]">
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
      <section className="p-6 rounded-2xl bg-[#1E1B26]/80 border border-[#2D2938] space-y-4">
        <div className="flex items-center gap-2">
          <Icon name="vault" className="w-4 h-4 text-[#B9A8F5]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F6F2EA] font-display">
            How Time Vaults Work
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938] space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-[#B9A8F5]/15 text-[#B9A8F5] flex items-center justify-center text-xs font-bold font-display">
              1
            </div>
            <h3 className="text-xs font-bold text-[#F6F2EA] font-display">Compose &amp; Seal</h3>
            <p className="text-[11px] text-[#777580] leading-relaxed">
              Write personal predictions, letters to your future self, or secret memories for friends.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938] space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-[#FF6257]/15 text-[#FF6257] flex items-center justify-center text-xs font-bold font-display">
              2
            </div>
            <h3 className="text-xs font-bold text-[#F6F2EA] font-display">Automated Lock Protocol</h3>
            <p className="text-[11px] text-[#777580] leading-relaxed">
              The platform cryptographically withholds the message until the countdown expires.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938] space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-[#D5F36A]/15 text-[#D5F36A] flex items-center justify-center text-xs font-bold font-display">
              3
            </div>
            <h3 className="text-xs font-bold text-[#F6F2EA] font-display">Future Reveal</h3>
            <p className="text-[11px] text-[#777580] leading-relaxed">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#110F17]/85 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-md bg-[#1E1B26] border border-[#2D2938] rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D2938]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#B9A8F5]/15 flex items-center justify-center text-[#B9A8F5]">
                  <Icon name="vault" className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#F6F2EA] font-display">Seal a Time Capsule</h2>
                  <p className="text-[11px] text-[#777580]">Lock a memory to open in the future</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#777580] hover:text-[#F6F2EA] p-1 rounded-lg hover:bg-[#24202E] cursor-pointer"
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
                <label className="text-xs font-bold text-[#F6F2EA] font-display">Capsule Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Letter to My 2027 Self"
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] placeholder-[#777580] focus:outline-hidden focus:border-[#B9A8F5]"
                  required
                />
              </div>

              {/* Quick Presets for Unlock Date */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#F6F2EA] font-display flex items-center justify-between">
                  <span>Unlock Date &amp; Time</span>
                  <span className="text-[10px] text-[#777580] font-normal">Presets:</span>
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
                      className="px-2.5 py-1 rounded-lg bg-[#17151D] hover:bg-[#24202E] border border-[#2D2938] text-[10px] text-[#B9A8F5] cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="datetime-local"
                  value={unlockAt}
                  onChange={(e) => setUnlockAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] focus:outline-hidden focus:border-[#B9A8F5]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F6F2EA] font-display">Sealed Message / Reflection</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What do you want to remember or say when this unseals?..."
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] placeholder-[#777580] focus:outline-hidden focus:border-[#B9A8F5]"
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
                  variant="secondary"
                  size="sm"
                  disabled={submitting}
                  className="border-[#B9A8F5]/40 text-[#B9A8F5] hover:bg-[#B9A8F5]/10"
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
