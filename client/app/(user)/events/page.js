'use client';

import { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import Card, { CardContent } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { eventService } from '@/services/eventService';

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

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await eventService.listEvents();
      if (res?.success) {
        setEvents(res.events || []);
        if (res.events?.length > 0 && !selectedEvent) {
          setSelectedEvent(res.events[0]);
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
    if (!selectedEvent) return;
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
      setFeedback({ success: false, message: err.message || 'Incorrect answer. Keep searching!' });
    } finally {
      setSubmitting(false);
    }
  };

  const hasSolved = Boolean(
    selectedEvent?.hasSolved ||
    selectedEvent?.solvers?.some((s) => (s.user?._id || s.user) === user?._id) ||
    selectedEvent?.submissions?.some((s) => (s.user?._id || s.user) === user?._id && s.isCorrect)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Global Mystery Events"
        description="Platform-wide collaborative riddles, detective quests, and puzzle leaderboards"
      />

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-44 rounded-2xl bg-[#1E1B26] border border-[#2D2938] animate-pulse" />
          <div className="h-64 rounded-2xl bg-[#1E1B26] border border-[#2D2938] animate-pulse" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon="events"
          title="No Active Mystery Events"
          description="Platform admins will launch the next global mystery event soon. Check back often!"
          badgeText="Detective Guild"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Quest Area (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Selector / Tabs */}
            {events.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-[#2D2938]">
                {events.map((ev) => (
                  <button
                    key={ev._id}
                    type="button"
                    onClick={() => {
                      setSelectedEvent(ev);
                      setFeedback(null);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedEvent?._id === ev._id
                        ? 'bg-[#FF6257] text-[#17151D] shadow-md shadow-[#FF6257]/20 font-bold'
                        : 'text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26]'
                    }`}
                  >
                    {ev.title}
                  </button>
                ))}
              </div>
            )}

            {selectedEvent && (
              <Card className="bg-[#1E1B26] border-[#2D2938] shadow-xl overflow-hidden">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF6257]/15 text-[#FF6257] border border-[#FF6257]/30 font-display">
                      {selectedEvent.status === 'active' ? '● Live Mystery' : 'Mystery Concluded'}
                    </span>
                    {hasSolved && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D5F36A]/15 text-[#D5F36A] border border-[#D5F36A]/30 flex items-center gap-1 font-display">
                        <Icon name="check" className="w-3 h-3 text-[#D5F36A]" />
                        Solved by You
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-[#F6F2EA] font-display">
                      {selectedEvent.title}
                    </h2>
                    <p className="text-xs text-[#777580] leading-relaxed">
                      {selectedEvent.description}
                    </p>
                  </div>

                  {/* Clues Section */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#B9A8F5] flex items-center gap-1.5 font-display">
                      <Icon name="sparkles" className="w-4 h-4 text-[#B9A8F5]" />
                      Discovered Clues
                    </h3>
                    <div className="space-y-2.5">
                      {selectedEvent.clues && selectedEvent.clues.length > 0 ? (
                        selectedEvent.clues.map((clue, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] space-y-1"
                          >
                            <span className="text-[10px] font-bold text-[#B9A8F5] uppercase font-display">
                              Clue #{idx + 1}
                            </span>
                            <p className="leading-relaxed">{typeof clue === 'string' ? clue : clue.text}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#777580] italic">
                          No public clues revealed yet. Stay vigilant!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Answer Submission Form */}
                  <div className="pt-4 border-t border-[#2D2938] space-y-3">
                    <h3 className="text-xs font-bold text-[#F6F2EA] font-display">
                      Submit Your Solution
                    </h3>

                    {feedback && (
                      <div
                        className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                          feedback.isCorrect
                            ? 'bg-[#D5F36A]/10 border-[#D5F36A]/30 text-[#D5F36A]'
                            : 'bg-[#FF6257]/10 border-[#FF6257]/30 text-[#FF6257]'
                        }`}
                      >
                        <Icon name={feedback.isCorrect ? 'check' : 'alertCircle'} className="w-4 h-4 shrink-0" />
                        <span>{feedback.message || (feedback.isCorrect ? 'Congratulations! Mystery solved!' : 'Incorrect answer.')}</span>
                      </div>
                    )}

                    {hasSolved ? (
                      <div className="p-4 rounded-xl bg-[#17151D] border border-[#D5F36A]/30 text-xs text-[#D5F36A] text-center font-semibold">
                        🎖️ You have successfully cracked this mystery! Your name is recorded on the leaderboard.
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
            <Card className="bg-[#1E1B26] border-[#2D2938]">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#2D2938]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#F6F2EA] flex items-center gap-2 font-display">
                    <Icon name="activity" className="w-4 h-4 text-[#D5F36A]" />
                    Detective Hall of Fame
                  </h3>
                  <span className="text-[10px] text-[#777580]">
                    {leaderboard.length} Solvers
                  </span>
                </div>

                {leaderboard.length === 0 ? (
                  <p className="text-xs text-[#777580] text-center py-6">
                    No detectives have solved this mystery yet. Will you be the first?
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={entry._id || index}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#17151D] border border-[#2D2938]"
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
                                : 'text-[#777580]'
                            }`}
                          >
                            {index + 1}
                          </span>
                          <Avatar
                            name={entry.user?.fullName || 'Solver'}
                            src={entry.user?.profile?.avatarUrl}
                            size="xs"
                          />
                          <span className="text-xs font-semibold text-[#F6F2EA] truncate max-w-[110px]">
                            {entry.user?.fullName || 'Solver'}
                          </span>
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
      )}
    </div>
  );
}
