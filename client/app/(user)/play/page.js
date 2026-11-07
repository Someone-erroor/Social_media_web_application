'use client';

import { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import Card, { CardContent } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { playService } from '@/services/playService';

const GAME_TYPES = [
  { id: 'all', label: 'All Games', icon: 'play' },
  { id: 'who_knows_me', label: 'Who Knows Me Better?', icon: 'users', desc: 'Test how well your friends really know your preferences' },
  { id: 'two_truths_and_lie', label: 'Two Truths & a Lie', icon: 'sparkles', desc: 'Two real facts, one clever lie. Can they spot it?' },
  { id: 'emoji_challenge', label: 'Emoji Challenge', icon: 'assistant', desc: 'Decode movie, song, or phrase puzzles from emojis' },
  { id: 'picture_mystery', label: 'Picture Mystery', icon: 'eye', desc: 'Unravel riddles and secret visual clues' }
];

export default function PlayPage() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState('all');
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active Play Modal State
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [submittingPlay, setSubmittingPlay] = useState(false);
  const [playResult, setPlayResult] = useState(null);

  // Create Challenge Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState('who_knows_me');
  const [createTitle, setCreateTitle] = useState('');
  const [createPrompt, setCreatePrompt] = useState('');
  const [createOptions, setCreateOptions] = useState(['', '', '']);
  const [createAnswerKey, setCreateAnswerKey] = useState('0');
  const [createHint, setCreateHint] = useState('');
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadChallenges = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const typeParam = selectedType === 'all' ? null : selectedType;
      const res = await playService.listChallenges(typeParam);
      if (res?.success) {
        setChallenges(res.challenges || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load game challenges.');
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  // Open play modal
  const handleOpenPlay = (challenge) => {
    setActiveChallenge(challenge);
    setSelectedOption(null);
    setTextAnswer('');
    setPlayResult(null);
  };

  // Submit gameplay answer
  const handleSubmitAnswer = async () => {
    if (!activeChallenge) return;
    if (selectedOption === null && !textAnswer.trim()) return;

    setSubmittingPlay(true);
    try {
      const res = await playService.playChallenge(activeChallenge._id, {
        selectedOption: selectedOption !== null ? Number(selectedOption) : undefined,
        textAnswer: textAnswer.trim() || undefined
      });
      if (res?.success) {
        setPlayResult(res);
        // Refresh challenges to update counts
        loadChallenges();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit answer.');
    } finally {
      setSubmittingPlay(false);
    }
  };

  // Submit challenge creation
  const handleCreateChallenge = async (e) => {
    e?.preventDefault();
    setCreateError('');

    if (!createTitle.trim() || !createPrompt.trim()) {
      setCreateError('Please provide a title and prompt.');
      return;
    }

    const filteredOptions = createOptions.map((o) => o.trim()).filter(Boolean);
    if (createType !== 'emoji_challenge' && filteredOptions.length < 2) {
      setCreateError('Please provide at least 2 options.');
      return;
    }

    setSubmittingCreate(true);
    try {
      const payload = {
        gameType: createType,
        title: createTitle.trim(),
        prompt: createPrompt.trim(),
        options: filteredOptions,
        answerKey: createType === 'emoji_challenge' ? createOptions[0]?.trim() || createTitle : createAnswerKey,
        hint: createHint.trim()
      };

      const res = await playService.createChallenge(payload);
      if (res?.success) {
        setShowCreateModal(false);
        setCreateTitle('');
        setCreatePrompt('');
        setCreateOptions(['', '', '']);
        setCreateHint('');
        loadChallenges();
      }
    } catch (err) {
      setCreateError(err.message || 'Failed to create challenge.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Looply Play"
          description="Interactive social games, trivia, and friend challenges"
        />
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => setShowCreateModal(true)}
          className="self-start sm:self-auto flex items-center gap-2"
        >
          <Icon name="plus" className="w-4 h-4" />
          Create Challenge
        </Button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#263640]">
        {GAME_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => setSelectedType(type.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedType === type.id
                ? 'bg-[#19D3E3] text-[#080D12] shadow-sm shadow-[#19D3E3]/20'
                : 'text-[#9BAAB4] hover:text-[#F4F8FA] hover:bg-[#151F29]'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FF5C70]/10 border border-[#FF5C70]/30 text-xs text-[#FF5C70]">
          {error}
        </div>
      )}

      {/* Challenges Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-[#151F29] border border-[#263640] animate-pulse space-y-3">
              <div className="w-20 h-4 bg-[#1D2A35] rounded" />
              <div className="w-3/4 h-5 bg-[#1D2A35] rounded" />
              <div className="w-full h-3 bg-[#1D2A35] rounded" />
            </div>
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <EmptyState
          icon="play"
          title="No Challenges Found"
          description="No interactive challenges created under this category yet. Be the first to challenge your friends!"
          badgeText="Looply Play"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {challenges.map((c) => {
            const hasPlayed = c.participants?.some((p) => p.user?._id === user?._id || p.user === user?._id);
            const myScore = c.participants?.find((p) => p.user?._id === user?._id || p.user === user?._id)?.score;

            return (
              <Card key={c._id} className="bg-[#151F29] border-[#263640] hover:border-[#19D3E3]/40 transition-colors flex flex-col justify-between">
                <CardContent className="p-5 space-y-4">
                  {/* Game Category Badge & Creator */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#19D3E3]/15 text-[#19D3E3] border border-[#19D3E3]/30">
                      {c.gameType?.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={c.creator?.fullName || 'Host'}
                        src={c.creator?.profile?.avatarUrl}
                        size="xs"
                      />
                      <span className="text-[11px] text-[#9BAAB4] truncate max-w-[100px]">
                        {c.creator?.fullName}
                      </span>
                    </div>
                  </div>

                  {/* Challenge Title & Prompt */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#F4F8FA] line-clamp-1">
                      {c.title}
                    </h3>
                    <p className="text-xs text-[#9BAAB4] line-clamp-2">
                      {c.prompt}
                    </p>
                  </div>

                  {/* Options Preview */}
                  {c.options && c.options.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {c.options.slice(0, 3).map((opt, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 rounded-lg bg-[#101A22] border border-[#263640] text-[11px] text-[#9BAAB4] truncate"
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stats & Play Button */}
                  <div className="pt-2 border-t border-[#263640] flex items-center justify-between">
                    <span className="text-[11px] text-[#9BAAB4]">
                      {c.participantsCount || c.participants?.length || 0} played
                    </span>
                    {hasPlayed ? (
                      <span className="text-xs font-semibold text-[#19D3E3]">
                        Score: {myScore || 100} pts
                      </span>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={() => handleOpenPlay(c)}
                      >
                        Play Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Active Challenge Play Modal */}
      {activeChallenge && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080D12]/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-lg bg-[#101A22] border border-[#263640] rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#263640]">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#19D3E3]">
                  {activeChallenge.gameType?.replace(/_/g, ' ')}
                </span>
                <h2 className="text-base font-bold text-[#F4F8FA]">
                  {activeChallenge.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveChallenge(null)}
                className="text-[#9BAAB4] hover:text-[#F4F8FA] p-1 rounded-lg hover:bg-[#151F29]"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            {playResult ? (
              <div className="py-6 text-center space-y-4">
                <div
                  className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center text-2xl ${
                    playResult.isCorrect
                      ? 'bg-[#19D3E3]/20 text-[#19D3E3] border border-[#19D3E3]'
                      : 'bg-[#FF5C70]/20 text-[#FF5C70] border border-[#FF5C70]'
                  }`}
                >
                  {playResult.isCorrect ? '🎉' : '🤔'}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#F4F8FA]">
                    {playResult.isCorrect ? 'Brilliant! You got it right!' : 'Nice try! Better luck next round.'}
                  </h3>
                  <p className="text-xs text-[#9BAAB4]">
                    Points earned: <strong className="text-[#19D3E3]">{playResult.score || 0} pts</strong>
                  </p>
                  {playResult.explanation && (
                    <p className="text-xs text-[#F4F8FA] bg-[#151F29] p-3 rounded-xl border border-[#263640] mt-3">
                      {playResult.explanation}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setActiveChallenge(null)}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#151F29] border border-[#263640] text-xs text-[#F4F8FA] leading-relaxed">
                  {activeChallenge.prompt}
                </div>

                {activeChallenge.options && activeChallenge.options.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#9BAAB4]">
                      {activeChallenge.gameType === 'two_truths_and_a_lie'
                        ? 'Spot the LIE among these statements:'
                        : 'Select your answer:'}
                    </p>
                    {activeChallenge.options.map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedOption(idx)}
                        className={`w-full p-3 rounded-xl border text-xs text-left transition-colors ${
                          selectedOption === idx
                            ? 'border-[#19D3E3] bg-[#19D3E3]/15 text-[#F4F8FA] font-semibold'
                            : 'border-[#263640] hover:bg-[#151F29] text-[#9BAAB4]'
                        }`}
                      >
                        <span className="font-bold text-[#19D3E3] mr-2">{String.fromCharCode(65 + idx)}.</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#9BAAB4]">
                      Type your answer:
                    </label>
                    <input
                      type="text"
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      placeholder="Enter your guess..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#151F29] border border-[#263640] text-xs text-[#F4F8FA] focus:outline-hidden focus:border-[#19D3E3]"
                    />
                  </div>
                )}

                {activeChallenge.hint && (
                  <p className="text-[11px] text-[#FFB800] italic">
                    💡 Hint: {activeChallenge.hint}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveChallenge(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleSubmitAnswer}
                    disabled={submittingPlay || (selectedOption === null && !textAnswer.trim())}
                  >
                    {submittingPlay ? 'Submitting...' : 'Submit Answer'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080D12]/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-lg bg-[#101A22] border border-[#263640] rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#263640]">
              <h2 className="text-base font-bold text-[#F4F8FA]">Create Challenge</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#9BAAB4] hover:text-[#F4F8FA] p-1 rounded-lg hover:bg-[#151F29]"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChallenge} className="space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-[#FF5C70]/10 border border-[#FF5C70]/30 text-xs text-[#FF5C70]">
                  {createError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9BAAB4]">Game Type</label>
                <select
                  value={createType}
                  onChange={(e) => setCreateType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#151F29] border border-[#263640] text-xs text-[#F4F8FA] focus:outline-hidden focus:border-[#19D3E3]"
                >
                  <option value="who_knows_me">Who Knows Me Better?</option>
                  <option value="two_truths_and_lie">Two Truths and a Lie</option>
                  <option value="emoji_challenge">Emoji Challenge</option>
                  <option value="picture_mystery">Picture Mystery</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9BAAB4]">Title</label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. My Favorite Weekend Habit"
                  className="w-full px-3 py-2 rounded-xl bg-[#151F29] border border-[#263640] text-xs text-[#F4F8FA] focus:outline-hidden focus:border-[#19D3E3]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9BAAB4]">Question / Prompt</label>
                <textarea
                  rows={2}
                  value={createPrompt}
                  onChange={(e) => setCreatePrompt(e.target.value)}
                  placeholder="Ask a question or explain the riddle..."
                  className="w-full px-3 py-2 rounded-xl bg-[#151F29] border border-[#263640] text-xs text-[#F4F8FA] focus:outline-hidden focus:border-[#19D3E3]"
                  required
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9BAAB4]">
                  {createType === 'two_truths_and_a_lie' ? 'Three Statements (2 truths + 1 lie)' : 'Options'}
                </label>
                {createOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#19D3E3] w-4">{i + 1}.</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...createOptions];
                        newOpts[i] = e.target.value;
                        setCreateOptions(newOpts);
                      }}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-[#151F29] border border-[#263640] text-xs text-[#F4F8FA] focus:outline-hidden focus:border-[#19D3E3]"
                      required
                    />
                    <label className="flex items-center gap-1 text-[11px] text-[#9BAAB4] cursor-pointer">
                      <input
                        type="radio"
                        name="correct_option"
                        value={String(i)}
                        checked={createAnswerKey === String(i)}
                        onChange={(e) => setCreateAnswerKey(e.target.value)}
                        className="accent-[#19D3E3]"
                      />
                      <span>{createType === 'two_truths_and_a_lie' ? 'Lie' : 'Correct'}</span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9BAAB4]">Hint (optional)</label>
                <input
                  type="text"
                  value={createHint}
                  onChange={(e) => setCreateHint(e.target.value)}
                  placeholder="Give a subtle clue to help friends..."
                  className="w-full px-3 py-2 rounded-xl bg-[#151F29] border border-[#263640] text-xs text-[#F4F8FA] focus:outline-hidden focus:border-[#19D3E3]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
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
                  disabled={submittingCreate}
                >
                  {submittingCreate ? 'Publishing...' : 'Publish Challenge'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

