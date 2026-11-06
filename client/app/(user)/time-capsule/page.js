'use client';

import { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/ui/PageHeader';
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

  if (days > 0) return `${days}d ${hours}h ${minutes}m remaining`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s remaining`;
  return `${minutes}m ${seconds}s remaining`;
}

export default function TimeCapsulePage() {
  const { user } = useAuth();
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [unlockAt, setUnlockAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Ticking timer for countdown updates
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
    if (!window.confirm('Are you sure you want to delete this time capsule?')) return;
    try {
      await timeCapsuleService.deleteCapsule(capsuleId);
      setCapsules((prev) => prev.filter((c) => c._id !== capsuleId));
    } catch (err) {
      setError(err.message || 'Failed to delete time capsule.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Time Capsule Vault"
          description="Lock thoughts, letters, and predictions to be unlocked on a future date"
        />
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => setShowCreateModal(true)}
          className="self-start sm:self-auto flex items-center gap-2"
        >
          <Icon name="vault" className="w-4 h-4" />
          Seal a Capsule
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FF5C70]/10 border border-[#FF5C70]/30 text-xs text-[#FF5C70]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-[#151F29] border border-[#263640] animate-pulse space-y-3">
              <div className="w-24 h-4 bg-[#1D2A35] rounded" />
              <div className="w-3/4 h-5 bg-[#1D2A35] rounded" />
              <div className="w-full h-12 bg-[#1D2A35] rounded" />
            </div>
          ))}
        </div>
      ) : capsules.length === 0 ? (
        <EmptyState
          icon="vault"
          title="Vault is Empty"
          description="You have no sealed time capsules. Write a message to your future self or lock a memory for friends!"
          badgeText="Encrypted Vault"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capsules.map((capsule) => {
            const isUnlocked = new Date(capsule.unlockAt) <= now;

            return (
              <Card
                key={capsule._id}
                className={`transition-all duration-300 ${
                  isUnlocked
                    ? 'bg-[#151F29] border-[#19D3E3]/40 shadow-lg shadow-[#19D3E3]/5'
                    : 'bg-[#101A22] border-[#263640]'
                }`}
              >
                <CardContent className="p-5 space-y-4">
                  {/* Status & Vault Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isUnlocked
                          ? 'bg-[#19D3E3]/15 text-[#19D3E3] border border-[#19D3E3]/30'
                          : 'bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/30'
                      }`}
                    >
                      <Icon name={isUnlocked ? 'sparkles' : 'lock'} className="w-3 h-3" />
                      {isUnlocked ? 'Unsealed Memory' : 'Vault Locked'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDelete(capsule._id)}
                      className="text-[#9BAAB4] hover:text-[#FF5C70] p-1 rounded-lg transition-colors"
                      title="Delete Capsule"
                    >
                      <Icon name="trash" className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#F4F8FA] line-clamp-1">
                      {capsule.title}
                    </h3>
                    <p className="text-[11px] text-[#9BAAB4]">
                      Target date: {new Date(capsule.unlockAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Vault Content: Revealed vs Locked */}
                  {isUnlocked ? (
                    <div className="p-3.5 rounded-xl bg-[#151F29] border border-[#19D3E3]/20 space-y-2">
                      <p className="text-xs text-[#F4F8FA] whitespace-pre-wrap leading-relaxed">
                        {capsule.message || 'Sealed message revealed.'}
                      </p>
                      <p className="text-[10px] text-[#19D3E3] font-medium pt-1">
                        ✨ Unsealed and readable forever
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#080D12] border border-[#263640] text-center space-y-2">
                      <Icon name="lock" className="w-6 h-6 text-[#FFB800] mx-auto animate-pulse" />
                      <p className="text-xs font-semibold text-[#F4F8FA]">
                        {formatCountdown(capsule.unlockAt)}
                      </p>
                      <p className="text-[10px] text-[#9BAAB4]">
                        Content is securely locked by backend protocol until the target date.
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#263640] flex items-center justify-between text-[11px] text-[#9BAAB4]">
                    <span>Sealed {new Date(capsule.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    <span>By {capsule.creator?.fullName || user?.fullName}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Seal a Capsule Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080D12]/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-md bg-[#101A22] border border-[#263640] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#263640]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#19D3E3]/15 flex items-center justify-center text-[#19D3E3]">
                  <Icon name="vault" className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#F4F8FA]">Seal a Time Capsule</h2>
                  <p className="text-[11px] text-[#9BAAB4]">Lock a memory to open in the future</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#9BAAB4] hover:text-[#F4F8FA] p-1 rounded-lg hover:bg-[#151F29]"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-[#FF5C70]/10 border border-[#FF5C70]/30 text-xs text-[#FF5C70]">
                  {createError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9BAAB4]">Capsule Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Letter to My 2027 Self"
                  className="w-full px-3 py-2 rounded-xl bg-[#151F29] border border-[#263640] text-xs text-[#F4F8FA] focus:outline-hidden focus:border-[#19D3E3]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9BAAB4]">Unlock Date & Time</label>
                <input
                  type="datetime-local"
                  value={unlockAt}
                  onChange={(e) => setUnlockAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#151F29] border border-[#263640] text-xs text-[#F4F8FA] focus:outline-hidden focus:border-[#19D3E3]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9BAAB4]">Sealed Message / Reflection</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What do you want to remember or say when this unseals?..."
                  className="w-full px-3 py-2 rounded-xl bg-[#151F29] border border-[#263640] text-xs text-[#F4F8FA] focus:outline-hidden focus:border-[#19D3E3]"
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

