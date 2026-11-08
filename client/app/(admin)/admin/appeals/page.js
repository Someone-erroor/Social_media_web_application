'use client';

import { useState, useEffect, useCallback } from 'react';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { adminService } from '@/services/adminService';

const STATUS_FILTERS = [
  { id: '', label: 'All Appeals' },
  { id: 'pending', label: 'Pending Review' },
  { id: 'accepted', label: 'Accepted (Reinstated)' },
  { id: 'rejected', label: 'Rejected (Denied)' }
];

export default function AdminAppealsPage() {
  const [appeals, setAppeals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected appeal for review
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('accepted');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadAppeals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getAppeals({ status: statusFilter });
      if (res?.success) {
        setAppeals(res.appeals || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load moderation appeals.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadAppeals();
  }, [loadAppeals]);

  const handleReviewSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedAppeal) return;

    setSubmitting(true);
    try {
      await adminService.reviewAppeal(selectedAppeal._id, {
        status: reviewStatus,
        reviewNotes: reviewNotes.trim()
      });

      setSelectedAppeal(null);
      setReviewNotes('');
      loadAppeals();
    } catch (err) {
      setError(err.message || 'Failed to submit appeal review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#2D2938]">
        <div>
          <h1 className="text-xl font-bold font-display text-[#F6F2EA] flex items-center gap-2">
            <Icon name="shield" className="w-5 h-5 text-[#B9A8F5]" />
            Moderation Appeals
          </h1>
          <p className="text-xs text-[#777580]">
            Review user petitions challenging moderation decisions and restore accounts
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === f.id
                  ? 'bg-[#FF6257] text-[#110F17]'
                  : 'text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-[#1E1B26] border border-[#2D2938] animate-pulse h-28" />
          ))}
        </div>
      ) : appeals.length === 0 ? (
        <EmptyState
          icon="shield"
          title="No Appeals Found"
          description="There are currently no moderation appeals requiring administrative action."
          badgeText="Fair Review"
        />
      ) : (
        <div className="space-y-3">
          {appeals.map((appeal) => (
            <Card key={appeal._id} className="bg-[#1E1B26] border-[#2D2938]">
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#F6F2EA]">
                      {appeal.user?.fullName || appeal.user?.email || 'User'}
                    </span>
                    <span className="text-[10px] text-[#777580] font-mono">
                      (ID: {appeal.user?._id})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        appeal.status === 'accepted'
                          ? 'success'
                          : appeal.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {appeal.status}
                    </Badge>
                    {appeal.status === 'pending' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setSelectedAppeal(appeal);
                          setReviewStatus('accepted');
                          setReviewNotes('');
                        }}
                      >
                        Review Appeal
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#17151D] border border-[#2D2938] space-y-1">
                  <p className="text-xs text-[#F6F2EA] leading-relaxed">
                    <strong>Appeal Statement:</strong> {appeal.reason}
                  </p>
                  {appeal.reviewNotes && (
                    <p className="text-xs text-[#D5F36A] pt-1">
                      <strong>Admin Notes:</strong> {appeal.reviewNotes}
                    </p>
                  )}
                  <p className="text-[10px] text-[#777580] pt-1">
                    Submitted: {new Date(appeal.createdAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedAppeal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#110F17]/85 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-md bg-[#1E1B26] border border-[#2D2938] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D2938]">
              <h2 className="text-sm font-bold text-[#F6F2EA]">
                Review Appeal from {selectedAppeal.user?.fullName || 'User'}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedAppeal(null)}
                className="text-[#777580] hover:text-[#F6F2EA] p-1 rounded-lg hover:bg-[#17151D]"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#777580]">Decision</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] focus:outline-hidden focus:border-[#FF6257]"
                >
                  <option value="accepted">Accept Appeal (Reinstate Account/Clear Violation)</option>
                  <option value="rejected">Reject Appeal (Uphold Moderation Action)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#777580]">
                  Reviewer Notes to User
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Provide rationale for this decision..."
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] focus:outline-hidden focus:border-[#FF6257]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAppeal(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Finalize Decision'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

