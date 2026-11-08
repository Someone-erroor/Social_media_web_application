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
      setCreateError('Please provide a title and question prompt.');
      return;
    }

    const filteredOptions = createOptions.map((o) => o.trim()).filter(Boolean);
    if (filteredOptions.length < 2) {
      setCreateError('Please provide at least 2 options.');
      return;
    }

    setSubmittingCreate(true);
    try {
      const res = await playService.createChallenge({
        gameType: createType,
        title: createTitle.trim(),
        prompt: createPrompt.trim(),
        options: filteredOptions,
        answerKey: createAnswerKey,
        hint: createHint.trim() || undefined
      });

      if (res?.success) {
        setShowCreateModal(false);
        setCreateTitle('');
        setCreatePrompt('');
        setCreateOptions(['', '', '']);
        setCreateHint('');
        loadChallenges();
      }
    } catch (err) {
      setCreateError(err.message || 'Failed to publish challenge.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Looply Play"
          description="Interactive social games, trivia, and playful challenges with friends"
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          icon={<Icon name="plus" className="w-4 h-4" />}
          className="self-start sm:self-auto shrink-0 shadow-lg shadow-coral-500/10"
        >
          Create Challenge
        </Button>
      </div>

      {/* Game Type Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-[#2D2938]">
        {GAME_TYPES.map((gt) => (
          <button
            key={gt.id}
            type="button"
            onClick={() => setSelectedType(gt.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedType === gt.id
                ? 'bg-[#FF6257] text-[#17151D] shadow-md shadow-[#FF6257]/20'
                : 'text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26]'
            }`}
          >
            <Icon name={gt.icon} className="w-3.5 h-3.5" />
            <span>{gt.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257]">
          {error}
        </div>
      )}

      {/* Challenges Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-[#1E1B26] border border-[#2D2938] animate-pulse space-y-3">
              <div className="w-20 h-4 bg-[#24202E] rounded" />
              <div className="w-3/4 h-5 bg-[#24202E] rounded" />
              <div className="w-full h-3 bg-[#24202E] rounded" />
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
              <Card key={c._id} className="bg-[#1E1B26] border-[#2D2938] hover:border-[#FF6257]/40 transition-colors flex flex-col justify-between shadow-xl">
                <CardContent className="p-5 space-y-4">
                  {/* Game Category Badge & Creator */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D5F36A]/15 text-[#D5F36A] border border-[#D5F36A]/30">
                      {c.gameType?.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={c.creator?.fullName || 'Host'}
                        src={c.creator?.profile?.avatarUrl}
                        size="xs"
                      />
                      <span className="text-[11px] text-[#777580] truncate max-w-[100px]">
                        {c.creator?.fullName}
                      </span>
                    </div>
                  </div>

                  {/* Challenge Title & Prompt */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#F6F2EA] font-display line-clamp-1">
                      {c.title}
                    </h3>
                    <p className="text-xs text-[#777580] line-clamp-2 leading-relaxed">
                      {c.prompt}
                    </p>
                  </div>

                  {/* Options Preview */}
                  {c.options && c.options.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {c.options.slice(0, 3).map((opt, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 rounded-lg bg-[#17151D] border border-[#2D2938] text-[11px] text-[#777580] truncate"
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stats & Play Button */}
                  <div className="pt-2 border-t border-[#2D2938] flex items-center justify-between">
                    <span className="text-[11px] text-[#777580]">
                      {c.participantsCount || c.participants?.length || 0} played
                    </span>
                    {hasPlayed ? (
                      <span className="text-xs font-bold text-[#D5F36A]">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#110F17]/85 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-lg bg-[#1E1B26] border border-[#2D2938] rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D2938]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D5F36A]">
                  {activeChallenge.gameType?.replace(/_/g, ' ')}
                </span>
                <h2 className="text-base font-bold text-[#F6F2EA] font-display">
                  {activeChallenge.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveChallenge(null)}
                className="text-[#777580] hover:text-[#F6F2EA] p-1 rounded-lg hover:bg-[#24202E]"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            {playResult ? (
              <div className="py-6 text-center space-y-4">
                <div
                  className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center text-2xl ${
                    playResult.isCorrect
                      ? 'bg-[#D5F36A]/20 text-[#D5F36A] border border-[#D5F36A]'
                      : 'bg-[#FF6257]/20 text-[#FF6257] border border-[#FF6257]'
                  }`}
                >
                  {playResult.isCorrect ? '🎉' : '🤔'}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#F6F2EA] font-display">
                    {playResult.isCorrect ? 'Brilliant! You got it right!' : 'Nice try! Better luck next round.'}
                  </h3>
                  <p className="text-xs text-[#777580]">
                    Points earned: <strong className="text-[#D5F36A] font-bold">{playResult.score || 0} pts</strong>
                  </p>
                  {playResult.explanation && (
                    <p className="text-xs text-[#F6F2EA] bg-[#17151D] p-3 rounded-xl border border-[#2D2938] mt-3">
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
                <div className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] leading-relaxed">
                  {activeChallenge.prompt}
                </div>

                {activeChallenge.options && activeChallenge.options.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-[#F6F2EA] font-display">
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
                            ? 'border-[#FF6257] bg-[#FF6257]/15 text-[#F6F2EA] font-bold'
                            : 'border-[#2D2938] hover:bg-[#24202E] text-[#777580]'
                        }`}
                      >
                        <span className="font-bold text-[#FF6257] mr-2">{String.fromCharCode(65 + idx)}.</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#F6F2EA] font-display">
                      Type your answer:
                    </label>
                    <input
                      type="text"
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      placeholder="Enter your guess..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] placeholder-[#777580] focus:outline-hidden focus:border-[#FF6257]"
                    />
                  </div>
                )}

                {activeChallenge.hint && (
                  <p className="text-[11px] text-[#FBBF24] italic">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#110F17]/85 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-lg bg-[#1E1B26] border border-[#2D2938] rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D2938]">
              <h2 className="text-base font-bold text-[#F6F2EA] font-display">Create Challenge</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#777580] hover:text-[#F6F2EA] p-1 rounded-lg hover:bg-[#24202E]"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChallenge} className="space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257]">
                  {createError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F6F2EA] font-display">Game Type</label>
                <select
                  value={createType}
                  onChange={(e) => setCreateType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] focus:outline-hidden focus:border-[#FF6257]"
                >
                  <option value="who_knows_me">Who Knows Me Better?</option>
                  <option value="two_truths_and_lie">Two Truths and a Lie</option>
                  <option value="emoji_challenge">Emoji Challenge</option>
                  <option value="picture_mystery">Picture Mystery</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F6F2EA] font-display">Title</label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. My Favorite Weekend Habit"
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] placeholder-[#777580] focus:outline-hidden focus:border-[#FF6257]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F6F2EA] font-display">Question / Prompt</label>
                <textarea
                  rows={2}
                  value={createPrompt}
                  onChange={(e) => setCreatePrompt(e.target.value)}
                  placeholder="Ask a question or explain the riddle..."
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] placeholder-[#777580] focus:outline-hidden focus:border-[#FF6257]"
                  required
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#F6F2EA] font-display">
                  {createType === 'two_truths_and_a_lie' ? 'Three Statements (2 truths + 1 lie)' : 'Options'}
                </label>
                {createOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#FF6257] w-4">{i + 1}.</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...createOptions];
                        newOpts[i] = e.target.value;
                        setCreateOptions(newOpts);
                      }}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] placeholder-[#777580] focus:outline-hidden focus:border-[#FF6257]"
                      required
                    />
                    <label className="flex items-center gap-1 text-[11px] text-[#777580] cursor-pointer">
                      <input
                        type="radio"
                        name="correct_option"
                        value={String(i)}
                        checked={createAnswerKey === String(i)}
                        onChange={(e) => setCreateAnswerKey(e.target.value)}
                        className="accent-[#FF6257]"
                      />
                      <span>{createType === 'two_truths_and_a_lie' ? 'Lie' : 'Correct'}</span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F6F2EA] font-display">Hint (optional)</label>
                <input
                  type="text"
                  value={createHint}
                  onChange={(e) => setCreateHint(e.target.value)}
                  placeholder="Give a subtle clue to help friends..."
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] placeholder-[#777580] focus:outline-hidden focus:border-[#FF6257]"
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
