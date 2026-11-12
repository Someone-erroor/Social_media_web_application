'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import { heistService } from '@/services/heistService';
import { safetyService } from '@/services/safetyService';
import { ROUTES } from '@/lib/routes';

export default function HeistMissionConsolePage({ params }) {
  const unwrappedParams = use(params);
  const heistId = unwrappedParams.heistId;

  const [heist, setHeist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Action states
  const [answerInput, setAnswerInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState(null); // { isCorrect: boolean, message: string }
  const [joining, setJoining] = useState(false);

  // Safety report modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState('spam');
  const [reportNotes, setReportNotes] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');

  const loadHeistData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await heistService.getHeist(heistId);
      if (res?.success) {
        setHeist(res.heist);
      }
    } catch (err) {
      setError(err.message || 'Failed to load mission console data.');
    } finally {
      setLoading(false);
    }
  }, [heistId]);

  useEffect(() => {
    loadHeistData();
  }, [loadHeistData]);

  const handleJoin = async () => {
    setJoining(true);
    setError('');
    try {
      await heistService.joinHeist(heistId);
      loadHeistData();
    } catch (err) {
      setError(err.message || 'Failed to enroll in heist.');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to withdraw from this mission?')) return;
    try {
      await heistService.leaveHeist(heistId);
      loadHeistData();
    } catch (err) {
      setError(err.message || 'Failed to withdraw from heist.');
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerInput.trim()) return;

    setSubmitting(true);
    setSubmitFeedback(null);
    try {
      const res = await heistService.submitAnswer(heistId, {
        answer: answerInput.trim(),
        note: noteInput.trim()
      });

      setSubmitFeedback({
        isCorrect: res.isCorrect,
        message: res.message
      });

      if (res.isCorrect) {
        setAnswerInput('');
        setNoteInput('');
        loadHeistData();
      }
    } catch (err) {
      setSubmitFeedback({
        isCorrect: false,
        message: err.message || 'Submission error.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      await safetyService.createReport({
        targetType: 'FeedHeist',
        reportedTarget: heistId,
        category: reportCategory,
        explanation: reportNotes.trim()
      });
      setReportSuccess('Report submitted to Trust & Safety moderation team.');
      setShowReportModal(false);
      setReportNotes('');
    } catch (err) {
      setError(err.message || 'Failed to file report.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-20 bg-[#1E1B26] rounded-2xl border border-[#2D2938]" />
        <div className="h-64 bg-[#1E1B26] rounded-2xl border border-[#2D2938]" />
      </div>
    );
  }

  if (error && !heist) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#FF6257]/15 text-[#FF6257] mx-auto flex items-center justify-center">
          <Icon name="alertCircle" className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#F6F2EA]">Mission Access Denied</h2>
        <p className="text-xs text-[#777580]">{error}</p>
        <Link href={ROUTES.USER.HEISTS}>
          <Button variant="outline" size="sm">
            Back to Heists Directory
          </Button>
        </Link>
      </div>
    );
  }

  const isCompleted = heist?.status === 'completed';
  const isExpired = heist?.status === 'expired';
  const isActive = heist?.status === 'active';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs text-[#777580]">
        <Link
          href={ROUTES.USER.HEISTS}
          className="inline-flex items-center gap-1.5 hover:text-[#FF6257] transition-colors"
        >
          <Icon name="arrowLeft" className="w-3.5 h-3.5" />
          <span>All Feed Heists</span>
        </Link>

        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          className="inline-flex items-center gap-1 hover:text-[#FF6257] transition-colors"
        >
          <Icon name="flag" className="w-3.5 h-3.5" />
          <span>Report Mission</span>
        </button>
      </div>

      {reportSuccess && (
        <div className="p-3.5 rounded-xl bg-[#D5F36A]/10 border border-[#D5F36A]/30 text-xs text-[#D5F36A] flex items-center justify-between">
          <span>{reportSuccess}</span>
          <button type="button" onClick={() => setReportSuccess('')} className="font-bold">✕</button>
        </div>
      )}

      {/* Mission Banner & Header */}
      <Card className="bg-[#1E1B26] border-[#2D2938] overflow-hidden">
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#FF6257]/15 text-[#FF6257] border border-[#FF6257]/30">
                <Icon name="key" className="w-5 h-5" />
              </span>
              <Badge variant={isCompleted ? 'success' : isExpired ? 'neutral' : 'coral'} size="sm">
                {heist.status?.toUpperCase()}
              </Badge>
              <span className="text-xs font-mono uppercase text-[#D5F36A]">
                {heist.heistType?.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[#777580] flex items-center gap-1">
                <Icon name="users" className="w-4 h-4 text-[#D5F36A]" />
                {heist.participantsCount} Operatives
              </span>
              <span className="text-[#2D2938]">•</span>
              <span className="text-[#FF6257] flex items-center gap-1">
                <Icon name="clock" className="w-4 h-4" />
                {isCompleted ? 'Mission Solved' : isExpired ? 'Expired' : 'Active Deadline'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#F6F2EA] font-display tracking-tight">
              {heist.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#777580] leading-relaxed max-w-2xl">
              {heist.shortDescription}
            </p>
          </div>

          {/* Operative Enrollment State */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#2D2938]">
            <div className="flex items-center gap-2.5">
              <Avatar
                name={heist.creator?.fullName || 'Operative'}
                src={heist.creator?.profile?.avatarUrl}
                size="sm"
              />
              <div className="text-xs">
                <span className="text-[#777580] block text-[10px]">Mission Dispatcher</span>
                <span className="text-[#F6F2EA] font-semibold">{heist.creator?.fullName || 'Anonymous'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {heist.isParticipant ? (
                <>
                  <span className="px-3 py-1.5 rounded-xl bg-[#D5F36A]/15 text-[#D5F36A] border border-[#D5F36A]/30 text-xs font-semibold flex items-center gap-1.5">
                    <Icon name="check" className="w-3.5 h-3.5" />
                    Enrolled Operative
                  </span>
                  {isActive && (
                    <button
                      type="button"
                      onClick={handleLeave}
                      className="px-3 py-1.5 rounded-xl text-xs text-[#777580] hover:text-[#FF6257] hover:bg-[#17151D] transition-colors"
                    >
                      Withdraw
                    </button>
                  )}
                </>
              ) : isActive ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleJoin}
                  disabled={joining}
                  icon={<Icon name="plus" className="w-4 h-4" />}
                >
                  {joining ? 'Enrolling...' : 'Join Mission'}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      {/* Completion Debrief Banner */}
      {isCompleted && (
        <div className="p-6 rounded-2xl bg-[#D5F36A]/10 border border-[#D5F36A]/40 text-[#F6F2EA] space-y-3 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[#D5F36A] text-[#110F17] font-bold">
              ✓
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D5F36A] font-mono">
                Mission Accomplished
              </span>
              <h2 className="text-base font-bold">Community Objective Decrypted</h2>
            </div>
          </div>

          <p className="text-xs text-[#F6F2EA] leading-relaxed">
            {heist.solutionSummary || 'The target cipher was broken and the mission successfully concluded.'}
          </p>

          <div className="p-3 rounded-xl bg-[#110F17] border border-[#2D2938] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Avatar
                name={heist.solvedBy?.fullName || 'Operative'}
                src={heist.solvedBy?.profile?.avatarUrl}
                size="xs"
              />
              <span className="text-[#D5F36A] font-semibold">
                Cracked by {heist.solvedBy?.fullName || 'Fellow Operative'}
              </span>
            </div>
            <Badge variant="lime" size="sm">
              Badge: {heist.rewardBadge || 'Loop Heist Operative'}
            </Badge>
          </div>
        </div>
      )}

      {/* Two-Column Grid: Clues & Cipher Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Clue Ledger */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-[#1E1B26] border-[#2D2938]">
            <CardHeader>
              <CardTitle>Mission Briefing &amp; Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs sm:text-sm text-[#F6F2EA] leading-relaxed whitespace-pre-wrap">
                {heist.missionPrompt}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#1E1B26] border-[#2D2938]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Signal Ledger &amp; Discovered Clues</CardTitle>
                <span className="text-[10px] font-mono text-[#D5F36A] bg-[#17151D] px-2 py-0.5 rounded border border-[#2D2938]">
                  {heist.clues?.filter((c) => c.isUnlocked).length} / {heist.clues?.length || 0} Unlocked
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {heist.clues?.length === 0 ? (
                <p className="text-xs text-[#777580] italic">No specific sub-clues registered for this mission.</p>
              ) : (
                heist.clues.map((clue, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      clue.isUnlocked
                        ? 'bg-[#17151D] border-[#2D2938]'
                        : 'bg-[#110F17]/60 border-[#2D2938]/40 border-dashed'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#FF6257]">
                        Signal Clue #{clue.order || idx + 1}
                      </span>
                      {clue.isUnlocked ? (
                        <span className="text-[10px] font-mono text-[#D5F36A] flex items-center gap-1">
                          <Icon name="check" className="w-3 h-3" /> Unlocked
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-[#777580] flex items-center gap-1">
                          <Icon name="lock" className="w-3 h-3" /> Requires {clue.unlockParticipantThreshold} operatives
                        </span>
                      )}
                    </div>

                    <p className={`text-xs leading-relaxed ${clue.isUnlocked ? 'text-[#F6F2EA]' : 'text-[#777580] font-mono'}`}>
                      {clue.clueText}
                    </p>

                    {clue.isUnlocked && clue.hint && (
                      <p className="mt-2 text-[11px] text-[#B9A8F5] italic flex items-center gap-1">
                        <Icon name="info" className="w-3 h-3" />
                        Hint: {clue.hint}
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Decryption Console & Operative Roster */}
        <div className="space-y-4">
          <Card className="bg-[#1E1B26] border-[#2D2938]">
            <CardHeader>
              <CardTitle>Decryption Console</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCompleted ? (
                <div className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938] text-center space-y-2">
                  <span className="text-2xl block">🏆</span>
                  <p className="text-xs font-bold text-[#F6F2EA]">Mission Complete</p>
                  <p className="text-[11px] text-[#777580]">
                    The objective was successfully solved. Debrief credentials have been durably stored in the platform ledger.
                  </p>
                </div>
              ) : isExpired ? (
                <div className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938] text-center space-y-2">
                  <span className="text-2xl block">⌛</span>
                  <p className="text-xs font-bold text-[#777580]">Mission Expired</p>
                  <p className="text-[11px] text-[#777580]">
                    The operational window closed before the cipher could be broken.
                  </p>
                </div>
              ) : !heist.isParticipant ? (
                <div className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938] text-center space-y-3">
                  <Icon name="key" className="w-8 h-8 text-[#FF6257] mx-auto" />
                  <p className="text-xs text-[#F6F2EA] font-semibold">Operative Clearance Required</p>
                  <p className="text-[11px] text-[#777580]">
                    Join the mission to submit decryption signals and unlock collaborative clues.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={handleJoin}
                    disabled={joining}
                  >
                    {joining ? 'Enrolling...' : 'Join as Operative'}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmitAnswer} className="space-y-3">
                  {submitFeedback && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                        submitFeedback.isCorrect
                          ? 'bg-[#D5F36A]/10 border-[#D5F36A]/30 text-[#D5F36A]'
                          : 'bg-[#FF6257]/10 border-[#FF6257]/30 text-[#FF6257]'
                      }`}
                    >
                      <Icon
                        name={submitFeedback.isCorrect ? 'check' : 'alertCircle'}
                        className="w-4 h-4 shrink-0"
                      />
                      <span>{submitFeedback.message}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#777580]">
                      Your Answer / Decrypted Code
                    </label>
                    <input
                      type="text"
                      required
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      placeholder="Type the solution here..."
                      className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] focus:outline-none focus:border-[#FF6257]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#777580]">
                      Methodology / Field Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="How did you arrive at this solution?"
                      className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] focus:outline-none focus:border-[#FF6257]"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full"
                    disabled={submitting || !answerInput.trim()}
                  >
                    {submitting ? 'Transmitting Signal...' : 'Transmit Decryption Attempt'}
                  </Button>

                  <p className="text-[10px] text-center text-[#777580]">
                    Submissions are verified server-side against cryptographic cipher records.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Operative Roster */}
          <Card className="bg-[#1E1B26] border-[#2D2938]">
            <CardHeader>
              <CardTitle>Operative Roster ({heist.participants?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-none">
                {heist.participants?.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#17151D] border border-[#2D2938]/60 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={p.user?.fullName || 'Operative'}
                        src={p.user?.profile?.avatarUrl}
                        size="xs"
                      />
                      <span className="text-[#F6F2EA] font-medium text-[11px]">
                        {p.user?.fullName || 'Operative'}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-[#777580]">
                      {p.contributionsCount || 0} attempts
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Safety Report Modal */}
      {showReportModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#110F17]/85 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-md bg-[#1E1B26] border border-[#2D2938] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D2938]">
              <h3 className="text-sm font-bold text-[#F6F2EA]">Report Feed Heist Mission</h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-[#777580] hover:text-[#F6F2EA]"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#777580] font-semibold">Violation Category</label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-[#F6F2EA]"
                >
                  <option value="spam">Spam / Low Quality</option>
                  <option value="harassment">Harassment / Bullying</option>
                  <option value="hate_speech">Hate Speech</option>
                  <option value="other">Other Violation</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[#777580] font-semibold">Details / Context</label>
                <textarea
                  rows={3}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Explain why this mission violates community guidelines..."
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-[#F6F2EA]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReportModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="danger" size="sm">
                  Submit Report
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
