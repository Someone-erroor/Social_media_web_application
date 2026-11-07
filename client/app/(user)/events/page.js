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
        // Reload leaderboard and events
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
        <div className="p-3.5 rounded-xl bg-[#FF5C70]/10 border border-[#FF5C70]/30 text-xs text-[#FF5C70]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-44 rounded-2xl bg-[#151F29] animate-pulse" />
          <div className="h-64 rounded-2xl bg-[#151F29] animate-pulse" />
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
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#263640]">
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
                        ? 'bg-[#19D3E3] text-[#080D12] shadow-sm shadow-[#19D3E3]/20'
                        : 'text-[#9BAAB4] hover:text-[#F4F8FA] hover:bg-[#151F29]'
                    }`}
                  >
                    {ev.title}
                  </button>
                ))}
              </div>
            )}

            {selectedEvent && (
              <Card className="bg-[#101A22] border-[#263640] shadow-xl overflow-hidden">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#19D3E3]/15 text-[#19D3E3] border border-[#19D3E3]/30">
                      {selectedEvent.status === 'active' ? '● Live Mystery' : 'Mystery Concluded'}
                    </span>
                    {hasSolved && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 flex items-center gap-1">
                        <Icon name="check" className="w-3 h-3" />
                        Solved by You
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-[#F4F8FA]">
                      {selectedEvent.title}
                    </h2>
                    <p className="text-xs text-[#9BAAB4] leading-relaxed">
                      {selectedEvent.description}
                    </p>
                  </div>

                  {/* Clues Section */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#19D3E3] flex items-center gap-1.5">
                      <Icon name="sparkles" className="w-4 h-4" />
                      Discovered Clues
                    </h3>
                    <div className="space-y-2.5">
                      {selectedEvent.clues && selectedEvent.clues.length > 0 ? (
                        selectedEvent.clues.map((clue, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-[#151F29] border border-[#263640] text-xs text-[#F4F8FA] space-y-1"
                          >
                            <span className="text-[10px] font-bold text-[#19D3E3] uppercase">
                              Clue #{idx + 1}
                            </span>
                            <p className="leading-relaxed">{typeof clue === 'string' ? clue : clue.text}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#9BAAB4] italic">
                          No public clues revealed yet. Stay vigilant!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Answer Submission Form */}
                  <div className="pt-4 border-t border-[#263640] space-y-3">
                    <h3 className="text-xs font-bold text-[#F4F8FA]">
                      Submit Your Solution
                    </h3>

                    {feedback && (
                      <div
                        className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                          feedback.isCorrect
                            ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                            : 'bg-[#FF5C70]/10 border-[#FF5C70]/30 text-[#FF5C70]'
                        }`}
                      >
                        <Icon name={feedback.isCorrect ? 'check' : 'alertCircle'} className="w-4 h-4 shrink-0" />
                        <span>{feedback.message || (feedback.isCorrect ? 'Congratulations! Mystery solved!' : 'Incorrect answer.')}</span>
                      </div>
                    )}

                    {hasSolved ? (
                      <div className="p-4 rounded-xl bg-[#151F29] border border-[#19D3E3]/30 text-xs text-[#19D3E3] text-center font-semibold">
                        🎖️ You have successfully cracked this mystery! Your name is recorded on the leaderboard.
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitAnswer} className="flex gap-2.5">
                        <input
                          type="text"
                          value={answerInput}
                          onChange={(e) => setAnswerInput(e.target.value)}
                          placeholder="Enter your final deductive solution..."
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#151F29] border border-[#263640] text-xs text-[#F4F8FA] placeholder-[#9BAAB4] focus:outline-hidden focus:border-[#19D3E3]"
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
            <Card className="bg-[#101A22] border-[#263640]">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#263640]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#F4F8FA] flex items-center gap-2">
                    <Icon name="activity" className="w-4 h-4 text-[#19D3E3]" />
                    Detective Hall of Fame
                  </h3>
                  <span className="text-[10px] text-[#9BAAB4]">
                    {leaderboard.length} Solvers
                  </span>
                </div>

                {leaderboard.length === 0 ? (
                  <p className="text-xs text-[#9BAAB4] text-center py-6">
                    No detectives have solved this mystery yet. Will you be the first?
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={entry._id || index}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#151F29] border border-[#263640]"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              index === 0
                                ? 'bg-[#FFB800] text-[#080D12]'
                                : index === 1
                                ? 'bg-[#9BAAB4] text-[#080D12]'
                                : index === 2
                                ? 'bg-[#CD7F32] text-[#080D12]'
                                : 'text-[#9BAAB4]'
                            }`}
                          >
                            {index + 1}
                          </span>
                          <Avatar
                            name={entry.user?.fullName || 'Solver'}
                            src={entry.user?.profile?.avatarUrl}
                            size="xs"
                          />
                          <span className="text-xs font-semibold text-[#F4F8FA] truncate max-w-[110px]">
                            {entry.user?.fullName || 'Solver'}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-[#19D3E3]">
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

