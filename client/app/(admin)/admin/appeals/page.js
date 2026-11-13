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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E7E5E0]">
        <div>
          <h1 className="text-xl font-bold font-display text-[#1E1E24] flex items-center gap-2">
            <Icon name="shield" className="w-5 h-5 text-[#6C63FF]" />
            Moderation Appeals
          </h1>
          <p className="text-xs text-[#6B6B73]">
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
                  ? 'bg-[#6C63FF] text-white shadow-xs'
                  : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FFEAEA] border border-[#FF6B6B]/30 text-xs text-[#FF6B6B]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E7E5E0] animate-pulse h-28" />
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
            <Card key={appeal._id} className="bg-[#FFFFFF] border-[#E7E5E0] shadow-xs">
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1E1E24]">
                      {appeal.user?.fullName || appeal.user?.email || 'User'}
                    </span>
                    <span className="text-[10px] text-[#6B6B73] font-mono">
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

                <div className="p-3.5 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] space-y-1">
                  <p className="text-xs text-[#1E1E24] leading-relaxed">
                    <strong>Appeal Statement:</strong> {appeal.reason}
                  </p>
                  {appeal.reviewNotes && (
                    <p className="text-xs text-[#2E7D4E] pt-1">
                      <strong>Admin Notes:</strong> {appeal.reviewNotes}
                    </p>
                  )}
                  <p className="text-[10px] text-[#6B6B73] pt-1">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E7E5E0] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E0]">
              <h2 className="text-sm font-bold text-[#1E1E24]">
                Review Appeal from {selectedAppeal.user?.fullName || 'User'}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedAppeal(null)}
                className="text-[#6B6B73] hover:text-[#1E1E24] p-1 rounded-lg hover:bg-[#F1F0EC]"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6B6B73]">Decision</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E7E5E0] text-xs text-[#1E1E24] focus:outline-hidden focus:border-[#6C63FF]"
                >
                  <option value="accepted">Accept Appeal (Reinstate Account/Clear Violation)</option>
                  <option value="rejected">Reject Appeal (Uphold Moderation Action)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6B6B73]">
                  Reviewer Notes to User
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Provide rationale for this decision..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E7E5E0] text-xs text-[#1E1E24] focus:outline-hidden focus:border-[#6C63FF]"
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
