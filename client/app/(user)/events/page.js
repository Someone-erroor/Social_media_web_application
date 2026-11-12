'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import ExperienceHeader from '@/components/experiences/ExperienceHeader';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import Card, { CardContent } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { eventService } from '@/services/eventService';
import { ROUTES } from '@/lib/routes';

function formatEventCountdown(endDate) {
  if (!endDate) return null;
  const diffMs = new Date(endDate) - new Date();
  if (diffMs <= 0) return 'Concluded';

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s remaining`;
  return `${hours}h ${minutes}m ${seconds}s remaining`;
}

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [answerInput, setAnswerInput] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());

  // Live timer for event deadline countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await eventService.listEvents();
      if (res?.success) {
        const evList = res.events || [];
        setEvents(evList);
        if (evList.length > 0 && !selectedEvent) {
          setSelectedEvent(evList[0]);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load global mystery events.');
    } finally {
      setLoading(false);
    }
  }, [selectedEvent]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Load leaderboard when selectedEvent changes
  useEffect(() => {
    if (!selectedEvent?._id) return;
    eventService
      .getLeaderboard(selectedEvent._id)
      .then((res) => {
        if (res?.success) {
          setLeaderboard(res.leaderboard || []);
        }
      })
      .catch(() => {});
  }, [selectedEvent]);

  const handleSubmitAnswer = async (e) => {
    e?.preventDefault();
    const trimmed = answerInput.trim();
    if (!trimmed || !selectedEvent || submitting) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await eventService.submitAnswer(selectedEvent._id, { answer: trimmed });
      if (res?.success) {
        setFeedback(res);
        setAnswerInput('');
        eventService.getLeaderboard(selectedEvent._id).then((lbRes) => {
          if (lbRes?.success) setLeaderboard(lbRes.leaderboard || []);
        });
        loadEvents();
      }
    } catch (err) {
      setFeedback({
        success: false,
        message: err.message || 'Incorrect answer. Keep searching for clues!'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const hasSolved = Boolean(
    selectedEvent?.hasSolved ||
    selectedEvent?.solvers?.some((s) => (s.user?._id || s.user) === user?._id) ||
    selectedEvent?.submissions?.some((s) => (s.user?._id || s.user) === user?._id && s.isCorrect)
  );

  const countdownText = useMemo(() => {
    if (!selectedEvent?.endDate) return null;
    return formatEventCountdown(selectedEvent.endDate);
  }, [selectedEvent, now]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. Standardized Experience Header */}
      <ExperienceHeader
        title="Global Mystery Events"
        description="Collaborate and compete in platform-wide detective investigations, cryptographic riddles, and collaborative puzzle leaderboards."
        icon="events"
        categoryLabel="Platform Mystery"
        status="Detective Guild"
        statusVariant="coral"
        action={
          selectedEvent ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#777580]">
                <Icon name="clock" className="w-3.5 h-3.5 text-[#FF6257]" />
                <span className="font-mono text-[#F6F2EA]">{countdownText || 'Live Mystery'}</span>
              </span>
            </div>
          ) : null
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257] flex items-center gap-2">
          <Icon name="alertCircle" className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Active Content or Empty State */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-44 rounded-2xl bg-[#1E1B26] border border-[#2D2938] animate-pulse" />
          <div className="h-64 rounded-2xl bg-[#1E1B26] border border-[#2D2938] animate-pulse" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon="events"
          title="No Active Global Mysteries"
          description="The Detective Guild currently has no open cases under investigation. Platform admins launch new events periodically—check back soon!"
          badgeText="Detective Guild"
          action={
            <Link href={ROUTES.USER.PLAY}>
              <Button type="button" variant="primary" size="sm" icon={<Icon name="play" className="w-4 h-4" />}>
                Explore Looply Play Mini-Games
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Event Selector Pills if multiple events exist */}
          {events.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#2D2938]">
              {events.map((ev) => {
                const isSelected = selectedEvent?._id === ev._id;
                return (
                  <button
                    key={ev._id}
                    type="button"
                    onClick={() => {
                      setSelectedEvent(ev);
                      setFeedback(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FF6257] text-[#17151D] shadow-md shadow-[#FF6257]/20 font-bold'
                        : 'bg-[#1E1B26] border border-[#2D2938] text-[#777580] hover:text-[#F6F2EA]'
                    }`}
                  >
                    {ev.title}
                  </button>
                );
              })}
            </div>
          )}

          {/* Main Quest Area & Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Mystery Clues & Submission Form */}
            <div className="lg:col-span-2 space-y-6">
              {selectedEvent && (
                <Card className="bg-[#1E1B26] border-[#2D2938] shadow-xl overflow-hidden">
                  <CardContent className="p-6 space-y-6">
                    {/* Event Status Bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF6257]/15 text-[#FF6257] border border-[#FF6257]/30 font-display">
                          {selectedEvent.status === 'active' || !selectedEvent.status
                            ? '● Live Mystery'
                            : 'Mystery Concluded'}
                        </span>
                        {countdownText && (
                          <span className="text-[11px] font-mono text-[#777580]">
                            {countdownText}
                          </span>
                        )}
                      </div>

                      {hasSolved && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D5F36A]/15 text-[#D5F36A] border border-[#D5F36A]/30 flex items-center gap-1 font-display">
                          <Icon name="check" className="w-3 h-3 text-[#D5F36A]" />
                          Cracked by You
                        </span>
                      )}
                    </div>

                    {/* Mystery Title & Narrative */}
                    <div className="space-y-2">
                      <h2 className="text-xl sm:text-2xl font-bold text-[#F6F2EA] font-display">
                        {selectedEvent.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-[#777580] leading-relaxed">
                        {selectedEvent.description}
                      </p>
                    </div>

                    {/* Discovered Clues */}
                    <div className="space-y-3 pt-2 border-t border-[#2D2938]">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#B9A8F5] flex items-center gap-1.5 font-display">
                          <Icon name="sparkles" className="w-4 h-4 text-[#B9A8F5]" />
                          Discovered Evidence &amp; Clues
                        </h3>
                        <span className="text-[10px] text-[#777580]">
                          {selectedEvent.clues?.length || 0} clues revealed
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {selectedEvent.clues && selectedEvent.clues.length > 0 ? (
                          selectedEvent.clues.map((clue, idx) => (
                            <div
                              key={idx}
                              className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-[#B9A8F5] uppercase tracking-wider font-display">
                                  Clue #{idx + 1}
                                </span>
                                <span className="text-[10px] text-[#777580]">Decrypted</span>
                              </div>
                              <p className="leading-relaxed font-mono text-[11px] sm:text-xs">
                                {typeof clue === 'string' ? clue : clue.text}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#777580] text-center italic">
                            No public clues revealed yet. Check back soon as the mystery unfolds.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Answer Submission Form */}
                    <div className="pt-4 border-t border-[#2D2938] space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-[#F6F2EA] font-display">
                          Submit Deductive Solution
                        </h3>
                        <span className="text-[11px] text-[#D5F36A] font-semibold flex items-center gap-1">
                          <Icon name="sparkles" className="w-3 h-3 text-[#D5F36A]" />
                          +500 Points Reward
                        </span>
                      </div>

                      {feedback && (
                        <div
                          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                            feedback.isCorrect
                              ? 'bg-[#D5F36A]/10 border-[#D5F36A]/30 text-[#D5F36A]'
                              : 'bg-[#FF6257]/10 border-[#FF6257]/30 text-[#FF6257]'
                          }`}
                        >
                          <Icon
                            name={feedback.isCorrect ? 'check' : 'alertCircle'}
                            className="w-4 h-4 shrink-0"
                          />
                          <span>
                            {feedback.message ||
                              (feedback.isCorrect
                                ? 'Brilliant detective work! Mystery solved!'
                                : 'Incorrect answer. Review the clues and try again!')}
                          </span>
                        </div>
                      )}

                      {hasSolved ? (
                        <div className="p-4 rounded-xl bg-[#17151D] border border-[#D5F36A]/30 text-xs text-[#D5F36A] text-center font-semibold flex items-center justify-center gap-2">
                          <Icon name="check" className="w-4 h-4 text-[#D5F36A]" />
                          <span>
                            You cracked this case! Your rank and score are immortalized in the Hall of Fame.
                          </span>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmitAnswer} className="flex gap-2.5">
                          <input
                            type="text"
                            value={answerInput}
                            onChange={(e) => setAnswerInput(e.target.value)}
                            placeholder="Enter your final deductive solution..."
                            className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] placeholder-[#777580] focus:outline-hidden focus:border-[#FF6257]"
                            disabled={submitting}
                          />
                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={submitting || !answerInput.trim()}
                          >
                            {submitting ? 'Verifying...' : 'Submit'}
                          </Button>
                        </form>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: Detective Leaderboard */}
            <div className="space-y-4">
              <Card className="bg-[#1E1B26] border-[#2D2938] shadow-xl">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#2D2938]">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#F6F2EA] flex items-center gap-2 font-display">
                      <Icon name="activity" className="w-4 h-4 text-[#D5F36A]" />
                      Detective Hall of Fame
                    </h3>
                    <span className="text-[10px] text-[#777580]">
                      {leaderboard.length} Solvers
                    </span>
                  </div>

                  {leaderboard.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <Icon name="shield" className="w-8 h-8 text-[#777580]/40 mx-auto" />
                      <p className="text-xs text-[#777580]">
                        No detectives have solved this case yet.
                      </p>
                      <p className="text-[11px] text-[#FF6257] font-semibold">
                        Will you be the first on the board?
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {leaderboard.map((entry, index) => (
                        <div
                          key={entry._id || index}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#17151D] border border-[#2D2938]"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                index === 0
                                  ? 'bg-[#D5F36A] text-[#17151D]'
                                  : index === 1
                                  ? 'bg-[#B9A8F5] text-[#17151D]'
                                  : index === 2
                                  ? 'bg-[#FF6257] text-white'
                                  : 'text-[#777580] bg-[#24202E]'
                              }`}
                            >
                              {index + 1}
                            </span>
                            <Avatar
                              name={entry.user?.fullName || 'Solver'}
                              src={entry.user?.profile?.avatarUrl}
                              size="xs"
                            />
                            <div className="truncate max-w-[100px]">
                              <p className="text-xs font-semibold text-[#F6F2EA] truncate">
                                {entry.user?.fullName || 'Solver'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-[#D5F36A]">
                            {entry.points || 500} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* 3. Supporting Information / Detective Guild Rules */}
      <section className="p-6 rounded-2xl bg-[#1E1B26]/80 border border-[#2D2938] space-y-4">
        <div className="flex items-center gap-2">
          <Icon name="shield" className="w-4 h-4 text-[#FF6257]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F6F2EA] font-display">
            Detective Guild Protocols
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938] space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-[#FF6257]/15 text-[#FF6257] flex items-center justify-center text-xs font-bold font-display">
              1
            </div>
            <h3 className="text-xs font-bold text-[#F6F2EA] font-display">Analyze Discovered Clues</h3>
            <p className="text-[11px] text-[#777580] leading-relaxed">
              Examine riddles, cryptographic hints, and platform cues released throughout the active event duration.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938] space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-[#B9A8F5]/15 text-[#B9A8F5] flex items-center justify-center text-xs font-bold font-display">
              2
            </div>
            <h3 className="text-xs font-bold text-[#F6F2EA] font-display">Submit Deductions</h3>
            <p className="text-[11px] text-[#777580] leading-relaxed">
              Enter your deduction into the verification terminal. Solutions are verified instantly on submission.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938] space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-[#D5F36A]/15 text-[#D5F36A] flex items-center justify-center text-xs font-bold font-display">
              3
            </div>
            <h3 className="text-xs font-bold text-[#F6F2EA] font-display">Immortalize Your Name</h3>
            <p className="text-[11px] text-[#777580] leading-relaxed">
              Top detectives earn permanent placement in the Detective Hall of Fame and bonus reputation points.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
