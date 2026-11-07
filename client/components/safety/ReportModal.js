'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { safetyService } from '@/services/safetyService';

const REPORT_CATEGORIES = [
  { id: 'spam', label: 'Spam or Scam', desc: 'Misleading links, bot activity, or deceptive content' },
  { id: 'harassment', label: 'Harassment', desc: 'Personal attacks, targeted nuisance, or offensive behavior' },
  { id: 'bullying', label: 'Bullying', desc: 'Intimidation, shaming, or persistent hostility' },
  { id: 'hate_speech', label: 'Hate Speech', desc: 'Discrimination based on identity, race, or religion' },
  { id: 'threats', label: 'Threats & Harm', desc: 'Direct threats of physical harm, violence, or danger' },
  { id: 'impersonation', label: 'Impersonation', desc: 'Pretending to be another person or organization' },
  { id: 'other', label: 'Other Safety Concern', desc: 'Any other violation of Looply community guidelines' }
];

export default function ReportModal({
  isOpen,
  onClose,
  targetType = 'post',
  targetId,
  targetName = 'this item'
}) {
  const [category, setCategory] = useState('spam');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!targetId) return;

    setLoading(true);
    setError('');

    // Normalize targetType to PascalCase (User, Post, Comment, Message)
    const normalizedTarget = (targetType || 'post').toLowerCase();
    const formattedTargetType =
      normalizedTarget === 'user' ? 'User'
      : normalizedTarget === 'comment' ? 'Comment'
      : normalizedTarget === 'message' ? 'Message'
      : 'Post';

    try {
      await safetyService.reportContent({
        targetType: formattedTargetType,
        targetId,
        category,
        reason: reason.trim()
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setReason('');
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080D12]/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-md bg-[#101A22] border border-[#263640] rounded-2xl shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#263640]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF5C70]/15 flex items-center justify-center text-[#FF5C70]">
              <Icon name="flag" className="w-4 h-4" />
            </div>
            <div>
              <h2 id="report-dialog-title" className="text-sm font-bold text-[#F4F8FA]">
                Report {targetType.charAt(0).toUpperCase() + targetType.slice(1)}
              </h2>
              <p className="text-[11px] text-[#9BAAB4]">
                Help keep the Looply community safe and constructive
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9BAAB4] hover:text-[#F4F8FA] p-1 rounded-lg hover:bg-[#151F29] transition-colors"
            aria-label="Close report dialog"
          >
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#19D3E3]/15 text-[#19D3E3] flex items-center justify-center mx-auto">
              <Icon name="check" className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#F4F8FA]">Report Submitted</p>
            <p className="text-xs text-[#9BAAB4]">
              Thank you. Our moderation team has been notified and will review this content.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-[#FF5C70]/10 border border-[#FF5C70]/30 text-xs text-[#FF5C70]">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#9BAAB4]">Select a reason</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {REPORT_CATEGORIES.map((cat) => (
                  <label
                    key={cat.id}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                      category === cat.id
                        ? 'border-[#19D3E3] bg-[#19D3E3]/10 text-[#F4F8FA]'
                        : 'border-[#263640] hover:bg-[#151F29] text-[#9BAAB4]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report_category"
                      value={cat.id}
                      checked={category === cat.id}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-0.5 accent-[#19D3E3]"
                    />
                    <div>
                      <p className="text-xs font-medium text-[#F4F8FA]">{cat.label}</p>
                      <p className="text-[10px] text-[#9BAAB4]">{cat.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="report-reason" className="text-xs font-semibold text-[#9BAAB4]">
                Additional context (optional)
              </label>
              <textarea
                id="report-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe what violates our community standards..."
                className="w-full px-3 py-2 text-xs bg-[#151F29] border border-[#263640] rounded-xl text-[#F4F8FA] placeholder-[#9BAAB4]/60 focus:outline-hidden focus:border-[#19D3E3]"
                maxLength={500}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

