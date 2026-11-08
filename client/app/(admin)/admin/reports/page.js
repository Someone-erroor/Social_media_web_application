'use client';

import { useState, useEffect, useCallback } from 'react';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { adminService } from '@/services/adminService';

const STATUS_FILTERS = [
  { id: '', label: 'All Statuses' },
  { id: 'pending', label: 'Pending Review' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'dismissed', label: 'Dismissed' }
];

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected report for resolution action
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionStatus, setActionStatus] = useState('resolved');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [moderationAction, setModerationAction] = useState('none');
  const [submitting, setSubmitting] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getReports({ status: statusFilter });
      if (res?.success) {
        setReports(res.reports || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load safety reports.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleResolveSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedReport) return;

    setSubmitting(true);
    try {
      // 1. Update Report Status
      await adminService.updateReportStatus(selectedReport._id, {
        status: actionStatus,
        resolutionNotes: resolutionNotes.trim()
      });

      // 2. Optionally Apply Moderation Action
      if (moderationAction !== 'none') {
        const rawTargetId = selectedReport.reportedTarget?._id || selectedReport.reportedTarget || selectedReport.targetId;
        await adminService.applyModerationAction({
          action: moderationAction,
          targetType: selectedReport.targetType,
          targetId: rawTargetId,
          reason: resolutionNotes.trim() || `Moderation action taken on report ${selectedReport._id}`
        });
      }

      setSelectedReport(null);
      setResolutionNotes('');
      setModerationAction('none');
      loadReports();
    } catch (err) {
      setError(err.message || 'Failed to process report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Status Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#2D2938]">
        <div>
          <h1 className="text-xl font-bold font-display text-[#F6F2EA] flex items-center gap-2">
            <Icon name="flag" className="w-5 h-5 text-[#FF6257]" />
            Trust & Safety Reports
          </h1>
          <p className="text-xs text-[#777580]">
            Review flagged posts, comments, accounts, and enforce community standards
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
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-[#1E1B26] border border-[#2D2938] animate-pulse h-28" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon="flag"
          title="No Reports Found"
          description="There are currently no reported items matching this filter. Community health is clear!"
          badgeText="Trust & Safety"
        />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report._id} className="bg-[#1E1B26] border-[#2D2938] hover:border-[#FF6257]/30">
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF6257]/15 text-[#FF6257] border border-[#FF6257]/30">
                      {report.category?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-semibold text-[#F6F2EA]">
                      Target: <span className="uppercase text-[#D5F36A]">{report.targetType}</span>
                    </span>
                    <span className="text-[11px] text-[#777580] font-mono">
                      (ID: {report.targetId})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        report.status === 'resolved'
                          ? 'success'
                          : report.status === 'under_review'
                          ? 'warning'
                          : report.status === 'dismissed'
                          ? 'neutral'
                          : 'danger'
                      }
                    >
                      {report.status?.replace(/_/g, ' ')}
                    </Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReport(report);
                        setActionStatus(report.status === 'pending' ? 'resolved' : report.status);
                        setResolutionNotes(report.resolutionNotes || '');
                      }}
                    >
                      Take Action
                    </Button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#17151D] border border-[#2D2938] space-y-1">
                  <p className="text-xs text-[#F6F2EA]">
                    <strong>Reason / Details:</strong> {report.explanation || report.reason || 'No description provided.'}
                  </p>
                  <p className="text-[10px] text-[#777580]">
                    Target: <code className="text-[#FF6257] font-mono">{String(report.reportedTarget?._id || report.reportedTarget || report.targetId || 'N/A')}</code> • Reported by: {report.reporter?.fullName || report.reporter?.email || 'User'} •{' '}
                    {new Date(report.createdAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Moderation Resolution Modal */}
      {selectedReport && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#110F17]/85 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-lg bg-[#1E1B26] border border-[#2D2938] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D2938]">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#FF6257]">
                  Safety Action Center
                </span>
                <h2 className="text-sm font-bold text-[#F6F2EA]">
                  Review Report #{selectedReport._id?.slice(-6)}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="text-[#777580] hover:text-[#F6F2EA] p-1 rounded-lg hover:bg-[#17151D]"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#777580]">
                  Update Report Status
                </label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] focus:outline-hidden focus:border-[#FF6257]"
                >
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved (Action Taken)</option>
                  <option value="dismissed">Dismissed (No Violation)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#777580]">
                  Enforce Moderation Action (Optional)
                </label>
                <select
                  value={moderationAction}
                  onChange={(e) => setModerationAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] focus:outline-hidden focus:border-[#FF6257]"
                >
                  <option value="none">No immediate automated action</option>
                  {selectedReport.targetType?.toLowerCase() === 'post' && (
                    <option value="delete_post">Delete Post Permanently</option>
                  )}
                  {selectedReport.targetType?.toLowerCase() === 'comment' && (
                    <option value="delete_comment">Delete Comment Permanently</option>
                  )}
                  {selectedReport.targetType?.toLowerCase() === 'user' && (
                    <>
                      <option value="warn_user">Issue Official Warning</option>
                      <option value="suspend_user">Suspend Account</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#777580]">
                  Resolution Notes / Audit Log
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Explain the review findings and any actions taken..."
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] focus:outline-hidden focus:border-[#FF6257]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedReport(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                >
                  {submitting ? 'Applying...' : 'Confirm Action'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

