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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#263640]">
        <div>
          <h1 className="text-xl font-bold text-[#F4F8FA] flex items-center gap-2">
            <Icon name="shield" className="w-5 h-5 text-[#19D3E3]" />
            Moderation Appeals
          </h1>
          <p className="text-xs text-[#9BAAB4]">
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
                  ? 'bg-[#19D3E3] text-[#080D12]'
                  : 'text-[#9BAAB4] hover:text-[#F4F8FA] hover:bg-[#151F29]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FF5C70]/10 border border-[#FF5C70]/30 text-xs text-[#FF5C70]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-[#151F29] border border-[#263640] animate-pulse h-28" />
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
            <Card key={appeal._id} className="bg-[#151F29] border-[#263640]">
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#F4F8FA]">
                      {appeal.user?.fullName || appeal.user?.email || 'User'}
                    </span>
                    <span className="text-[10px] text-[#9BAAB4] font-mono">
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

                <div className="p-3 rounded-xl bg-[#101A22] border border-[#263640] space-y-1">
                  <p className="text-xs text-[#F4F8FA] leading-relaxed">
                    <strong>Appeal Statement:</strong> {appeal.reason}
                  </p>
                  {appeal.reviewNotes && (
                    <p className="text-xs text-[#19D3E3] pt-1">
                      <strong>Admin Notes:</strong> {appeal.reviewNotes}
                    </p>
                  )}
                  <p className="text-[10px] text-[#9BAAB4] pt-1">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080D12]/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-md bg-[#101A22] border border-[#263640] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#263640]">
              <h2 className="text-sm font-bold text-[#F4F8FA]">
                Review Appeal from {selectedAppeal.user?.fullName || 'User'}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedAppeal(null)}
                className="text-[#9BAAB4] hover:text-[#F4F8FA] p-1 rounded-lg hover:bg-[#151F29]"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9BAAB4]">Decision</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#151F29] border border-[#263640] text-xs text-[#F4F8FA] focus:outline-hidden focus:border-[#19D3E3]"
                >
                  <option value="accepted">Accept Appeal (Reinstate Account/Clear Violation)</option>
                  <option value="rejected">Reject Appeal (Uphold Moderation Action)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9BAAB4]">
                  Reviewer Notes to User
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Provide rationale for this decision..."
                  className="w-full px-3 py-2 rounded-xl bg-[#151F29] border border-[#263640] text-xs text-[#F4F8FA] focus:outline-hidden focus:border-[#19D3E3]"
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

