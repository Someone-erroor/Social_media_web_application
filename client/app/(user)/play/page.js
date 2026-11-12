'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import ExperienceHeader from '@/components/experiences/ExperienceHeader';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card, { CardContent } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { playService } from '@/services/playService';

const GAME_TYPES = [
  { id: 'all', label: 'All Formats', icon: 'play' },
  { id: 'who_knows_me', label: 'Who Knows Me?', icon: 'users', desc: 'Test how well your friends know you' },
  { id: 'two_truths_and_lie', label: 'Two Truths & Lie', icon: 'sparkles', desc: 'Can they spot the single lie?' },
  { id: 'emoji_challenge', label: 'Emoji Riddles', icon: 'assistant', desc: 'Decode phrases from emojis' },
  { id: 'picture_mystery', label: 'Picture Mystery', icon: 'split', desc: 'Visual riddles and hidden clues' }
];

export default function PlayPage() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'unplayed' | 'played'
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

  // Filtered list based on status (all, unplayed, played)
  const filteredChallenges = useMemo(() => {
    return challenges.filter((c) => {
      const isPlayed = Boolean(
        c.played ||
        c.participants?.some((p) => (p.user?._id || p.user) === user?._id)
      );
      if (statusFilter === 'played') return isPlayed;
      if (statusFilter === 'unplayed') return !isPlayed;
      return true;
    });
  }, [challenges, statusFilter, user?._id]);

  // Featured challenge is the first active challenge
  const featuredChallenge = challenges.length > 0 ? challenges[0] : null;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. Standardized Experience Header */}
      <ExperienceHeader
        title="Looply Play & Challenges"
        description="Test friendships and spark lighthearted conversations with social games including 'Who Knows Me Better?', 'Two Truths & a Lie', and 'Emoji Challenges'."
        icon="play"
        categoryLabel="Interactive & Play"
        status="Active Games"
        statusVariant="coral"
        action={
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setShowCreateModal(true)}
            icon={<Icon name="plus" className="w-4 h-4" />}
            className="shadow-lg shadow-[#FF6257]/20 shrink-0 font-bold"
          >
            Create Challenge
          </Button>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257] flex items-center gap-2">
          <Icon name="alertCircle" className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Featured Challenge Hero (Shown when on All Games) */}
      {!loading && featuredChallenge && selectedType === 'all' && statusFilter === 'all' && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#1E1B26] via-[#241F30] to-[#1E1B26] border border-[#FF6257]/30 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6257]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF6257] text-[#17151D] font-display">
                  ★ Featured Activity
                </span>
                <span className="text-[11px] text-[#777580] uppercase tracking-wider font-semibold">
                  {featuredChallenge.gameType?.replace(/_/g, ' ')}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#F6F2EA] font-display">
                {featuredChallenge.title}
              </h2>
              <p className="text-xs text-[#777580] line-clamp-2 leading-relaxed">
                {featuredChallenge.prompt}
              </p>
              <div className="flex items-center gap-3 text-xs text-[#777580] pt-1">
                <span className="flex items-center gap-1.5">
                  <Avatar
                    name={featuredChallenge.creator?.fullName || 'Creator'}
                    src={featuredChallenge.creator?.profile?.avatarUrl}
                    size="xs"
                  />
                  <span>By {featuredChallenge.creator?.fullName || 'Looply Creator'}</span>
                </span>
                <span>•</span>
                <span className="text-[#D5F36A] font-semibold flex items-center gap-1">
                  <Icon name="sparkles" className="w-3.5 h-3.5" />
                  +100 Points
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => handleOpenPlay(featuredChallenge)}
              icon={<Icon name="play" className="w-4 h-4" />}
              className="w-full md:w-auto shadow-lg shadow-[#FF6257]/25"
            >
              Play Challenge Now
            </Button>
          </div>
        </div>
      )}

      {/* 3. Categorization & Filtering Controls */}
      <div className="space-y-4">
        {/* Game Type Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {GAME_TYPES.map((gt) => {
            const isSelected = selectedType === gt.id;
            return (
              <button
                key={gt.id}
                type="button"
                onClick={() => setSelectedType(gt.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#FF6257] text-[#17151D] shadow-md shadow-[#FF6257]/20 font-bold'
                    : 'bg-[#1E1B26] border border-[#2D2938] text-[#777580] hover:text-[#F6F2EA] hover:border-[#777580]/40'
                }`}
              >
                <Icon name={gt.icon} className="w-3.5 h-3.5" />
                <span>{gt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status Filter Tabs (All / Unplayed / Played) */}
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-[#2D2938]">
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All Challenges' },
              { id: 'unplayed', label: 'Unplayed' },
              { id: 'played', label: 'Played by Me' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
                  statusFilter === tab.id
                    ? 'bg-[#24202E] text-[#F6F2EA] border border-[#2D2938] font-semibold'
                    : 'text-[#777580] hover:text-[#F6F2EA]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-[#777580]">
            {filteredChallenges.length} {filteredChallenges.length === 1 ? 'game' : 'games'} available
          </span>
        </div>
      </div>

      {/* 4. Active Content Grid or Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-[#1E1B26] border border-[#2D2938] animate-pulse space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-20 h-4 bg-[#24202E] rounded" />
                <div className="w-12 h-4 bg-[#24202E] rounded" />
              </div>
              <div className="w-3/4 h-5 bg-[#24202E] rounded" />
              <div className="w-full h-12 bg-[#24202E] rounded" />
              <div className="w-full h-8 bg-[#24202E] rounded pt-2" />
            </div>
          ))}
        </div>
      ) : filteredChallenges.length === 0 ? (
        <EmptyState
          icon="play"
          title="No Challenges Found"
          description={
            statusFilter === 'played'
              ? "You haven't played any challenges in this category yet. Dive in and test your trivia!"
              : "No community challenges exist for this filter yet. Create the very first one!"
          }
          badgeText="Looply Play"
          action={
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              icon={<Icon name="plus" className="w-4 h-4" />}
            >
              Create Challenge
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChallenges.map((challenge) => {
            const isPlayed = Boolean(
              challenge.played ||
              challenge.participants?.some((p) => (p.user?._id || p.user) === user?._id)
            );

            return (
              <Card
                key={challenge._id}
                className="bg-[#1E1B26] border-[#2D2938] hover:border-[#FF6257]/40 transition-all flex flex-col justify-between shadow-xl group"
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top Bar: Game Type & Status */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF6257]/15 text-[#FF6257] border border-[#FF6257]/30 font-display">
                      {challenge.gameType?.replace(/_/g, ' ')}
                    </span>
                    {isPlayed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D5F36A] bg-[#D5F36A]/10 border border-[#D5F36A]/30 px-2 py-0.5 rounded-full">
                        <Icon name="check" className="w-3 h-3" />
                        Played
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-[#777580]">
                        {challenge.participants?.length || 0} played
                      </span>
                    )}
                  </div>

                  {/* Title & Prompt Preview */}
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-[#F6F2EA] font-display line-clamp-1 group-hover:text-[#FF6257] transition-colors">
                      {challenge.title}
                    </h3>
                    <p className="text-xs text-[#777580] line-clamp-2 leading-relaxed">
                      {challenge.prompt}
                    </p>
                  </div>

                  {/* Creator Info & Action CTA */}
                  <div className="pt-3 border-t border-[#2D2938] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={challenge.creator?.fullName || 'Creator'}
                        src={challenge.creator?.profile?.avatarUrl}
                        size="xs"
                      />
                      <div className="truncate max-w-[90px]">
                        <p className="text-[11px] font-medium text-[#F6F2EA] truncate">
                          {challenge.creator?.fullName || 'Creator'}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant={isPlayed ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => handleOpenPlay(challenge)}
                      icon={<Icon name="play" className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      {isPlayed ? 'Play Again' : 'Play Now'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 5. Supporting Information / How It Works */}
      <section className="p-6 rounded-2xl bg-[#1E1B26]/80 border border-[#2D2938] space-y-4">
        <div className="flex items-center gap-2">
          <Icon name="sparkles" className="w-4 h-4 text-[#FF6257]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F6F2EA] font-display">
            How Looply Play Works
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938] space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-[#FF6257]/15 text-[#FF6257] flex items-center justify-center text-xs font-bold font-display">
              1
            </div>
            <h3 className="text-xs font-bold text-[#F6F2EA] font-display">Pick Your Game Format</h3>
            <p className="text-[11px] text-[#777580] leading-relaxed">
              Create personal friendship trivia, a crafty Two Truths and a Lie, or cryptographic emoji riddles.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938] space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-[#B9A8F5]/15 text-[#B9A8F5] flex items-center justify-center text-xs font-bold font-display">
              2
            </div>
            <h3 className="text-xs font-bold text-[#F6F2EA] font-display">Challenge Your Circle</h3>
            <p className="text-[11px] text-[#777580] leading-relaxed">
              Friends attempt your prompt and submit their deductions. Answers are validated on submission.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938] space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-[#D5F36A]/15 text-[#D5F36A] flex items-center justify-center text-xs font-bold font-display">
              3
            </div>
            <h3 className="text-xs font-bold text-[#F6F2EA] font-display">Earn Social Points</h3>
            <p className="text-[11px] text-[#777580] leading-relaxed">
              Every correct guess earns bragging rights and activity points across your Looply social profile.
            </p>
          </div>
        </div>
      </section>

      {/* Active Play Modal */}
      {activeChallenge && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#110F17]/85 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-md bg-[#1E1B26] border border-[#2D2938] rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D2938]">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6257] font-display">
                  {activeChallenge.gameType?.replace(/_/g, ' ')}
                </span>
                <h2 className="text-base font-bold text-[#F6F2EA] font-display">
                  {activeChallenge.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveChallenge(null)}
                className="text-[#777580] hover:text-[#F6F2EA] p-1.5 rounded-lg hover:bg-[#24202E] cursor-pointer"
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
                      {activeChallenge.gameType === 'two_truths_and_lie'
                        ? 'Spot the LIE among these statements:'
                        : 'Select your answer:'}
                    </p>
                    {activeChallenge.options.map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedOption(idx)}
                        className={`w-full p-3 rounded-xl border text-xs text-left transition-colors cursor-pointer ${
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
                  <p className="text-[11px] text-[#FBBF24] italic flex items-center gap-1">
                    <Icon name="sparkles" className="w-3.5 h-3.5 text-[#FBBF24]" />
                    <span>Hint: {activeChallenge.hint}</span>
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
                className="text-[#777580] hover:text-[#F6F2EA] p-1 rounded-lg hover:bg-[#24202E] cursor-pointer"
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
                <label className="text-xs font-bold text-[#F6F2EA] font-display">Game Format</label>
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
                  {createType === 'two_truths_and_lie' ? 'Three Statements (2 truths + 1 lie)' : 'Options'}
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
                      <span>{createType === 'two_truths_and_lie' ? 'Lie' : 'Correct'}</span>
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
