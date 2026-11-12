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
  { id: 'all', label: 'All Formats', icon: 'play', desc: 'Browse all active community games' },
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
  const [submittingPlay, setSubmittingPlay] = useState(false);
  const [playResult, setPlayResult] = useState(null);

  // Game-specific active play state
  // 1. Who Knows Me
  const [wkmCurrentQ, setWkmCurrentQ] = useState(0);
  const [wkmAnswers, setWkmAnswers] = useState({});
  // 2. Two Truths & Lie
  const [selectedLieIndex, setSelectedLieIndex] = useState(null);
  // 3. Emoji Challenge
  const [emojiGuess, setEmojiGuess] = useState('');
  const [showEmojiHint, setShowEmojiHint] = useState(false);
  // 4. Picture Mystery
  const [pictureGuess, setPictureGuess] = useState('');
  const [showPictureHint, setShowPictureHint] = useState(false);

  // Create Challenge Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState('who_knows_me');
  const [createTitle, setCreateTitle] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState('');

  // Format-specific creator inputs:
  // A. Who Knows Me: array of questions
  const [createWkmQuestions, setCreateWkmQuestions] = useState([
    { question: 'What is my absolute favorite morning beverage?', options: ['Pour-over coffee', 'Matcha latte', 'Earl Grey tea', 'Cold orange juice'], correctOption: 0 },
    { question: 'Where would I spend a quiet Saturday afternoon?', options: ['Secondhand bookstore', 'Mountain trail', 'Local coffee shop', 'Art museum'], correctOption: 0 }
  ]);
  // B. Two Truths & A Lie
  const [createTtlStatements, setCreateTtlStatements] = useState(['', '', '']);
  const [createTtlLieIndex, setCreateTtlLieIndex] = useState(1);
  const [createTtlExplanation, setCreateTtlExplanation] = useState('');
  // C. Emoji Riddle
  const [createEmojiString, setCreateEmojiString] = useState('');
  const [createEmojiCategory, setCreateEmojiCategory] = useState('');
  const [createEmojiHint, setCreateEmojiHint] = useState('');
  const [createEmojiAnswer, setCreateEmojiAnswer] = useState('');
  // D. Picture Mystery
  const [createPicImageUrl, setCreatePicImageUrl] = useState('');
  const [createPicCategory, setCreatePicCategory] = useState('');
  const [createPicHint, setCreatePicHint] = useState('');
  const [createPicAnswer, setCreatePicAnswer] = useState('');

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

  // Open play modal and reset format-specific state
  const handleOpenPlay = (challenge) => {
    setActiveChallenge(challenge);
    setPlayResult(null);

    // Reset gameplay state
    setWkmCurrentQ(0);
    setWkmAnswers({});
    setSelectedLieIndex(null);
    setEmojiGuess('');
    setShowEmojiHint(false);
    setPictureGuess('');
    setShowPictureHint(false);
  };

  // Submit gameplay answer for any of the 4 formats
  const handleSubmitPlay = async (userAnswersPayload) => {
    if (!activeChallenge) return;

    setSubmittingPlay(true);
    setError('');
    try {
      const res = await playService.submitAnswer(activeChallenge._id, userAnswersPayload);
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

  // Submit challenge creation with format-specific data
  const handleCreateChallenge = async (e) => {
    e?.preventDefault();
    setCreateError('');

    if (!createTitle.trim()) {
      setCreateError('Please provide a challenge title.');
      return;
    }

    setSubmittingCreate(true);
    try {
      let payload = {
        gameType: createType,
        title: createTitle.trim(),
        description: createDesc.trim()
      };

      if (createType === 'who_knows_me') {
        const questions = createWkmQuestions.filter(q => q.question.trim());
        if (questions.length === 0) {
          throw new Error('Please include at least one question.');
        }
        const answerKey = {};
        questions.forEach((q, idx) => {
          answerKey[`q${idx}`] = Number(q.correctOption) || 0;
        });
        payload.gameData = { questions };
        payload.answerKey = answerKey;
      } else if (createType === 'two_truths_and_lie') {
        const statements = createTtlStatements.map(s => s.trim()).filter(Boolean);
        if (statements.length < 3) {
          throw new Error('Please enter all 3 statements (2 truths and 1 lie).');
        }
        payload.gameData = {
          statements,
          prompt: 'Spot the lie among these three statements:',
          explanation: createTtlExplanation.trim()
        };
        payload.answerKey = {
          lieIndex: Number(createTtlLieIndex) || 0,
          explanation: createTtlExplanation.trim()
        };
      } else if (createType === 'emoji_challenge') {
        if (!createEmojiString.trim() || !createEmojiAnswer.trim()) {
          throw new Error('Please enter the emojis and the correct answer.');
        }
        payload.gameData = {
          emojis: createEmojiString.trim(),
          category: createEmojiCategory.trim() || 'General',
          hint: createEmojiHint.trim()
        };
        payload.answerKey = {
          answer: createEmojiAnswer.trim()
        };
      } else if (createType === 'picture_mystery') {
        if (!createPicImageUrl.trim() || !createPicAnswer.trim()) {
          throw new Error('Please enter an image URL and the mystery answer.');
        }
        payload.gameData = {
          imageUrl: createPicImageUrl.trim(),
          category: createPicCategory.trim() || 'Visual Clue',
          hint: createPicHint.trim()
        };
        payload.answerKey = {
          answer: createPicAnswer.trim()
        };
      }

      const res = await playService.createChallenge(payload);
      if (res?.success) {
        setShowCreateModal(false);
        setCreateTitle('');
        setCreateDesc('');
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

  const featuredChallenge = challenges.length > 0 ? challenges[0] : null;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. Header */}
      <ExperienceHeader
        title="Looply Play & Games"
        description="Spark playful banter and test your connections with Who Knows Me?, Two Truths & A Lie, Emoji Riddles, and Picture Mysteries."
        icon="play"
        categoryLabel="Interactive & Social Play"
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
            Create a Game
          </Button>
        }
      />

      {error && (
        <div role="alert" className="p-4 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257] flex items-center gap-2">
          <Icon name="alertCircle" className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Featured Challenge Hero */}
      {!loading && featuredChallenge && selectedType === 'all' && statusFilter === 'all' && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#1E1B26] via-[#241F30] to-[#1E1B26] border border-[#FF6257]/30 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6257]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF6257] text-[#17151D] font-display">
                  ★ Community Favorite
                </span>
                <span className="text-[11px] text-[#777580] uppercase tracking-wider font-semibold">
                  {featuredChallenge.gameType?.replace(/_/g, ' ')}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#F6F2EA] font-display">
                {featuredChallenge.title}
              </h2>
              <p className="text-xs text-[#777580] line-clamp-2 leading-relaxed">
                {featuredChallenge.description || featuredChallenge.prompt}
              </p>
              <div className="flex items-center gap-3 text-xs text-[#777580] pt-1">
                <span className="flex items-center gap-1.5">
                  <Avatar
                    name={featuredChallenge.creator?.fullName || 'Creator'}
                    src={featuredChallenge.creator?.profile?.avatarUrl}
                    size="xs"
                  />
                  <span>By {featuredChallenge.creator?.fullName || 'Looply Friend'}</span>
                </span>
                <span>•</span>
                <span className="text-[#D5F36A] font-semibold flex items-center gap-1">
                  <Icon name="sparkles" className="w-3.5 h-3.5" />
                  {featuredChallenge.participants?.length || 0} played
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
              Play Challenge
            </Button>
          </div>
        </div>
      )}

      {/* 3. Filter Navigation */}
      <div className="space-y-4">
        {/* Game Types */}
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

        {/* Status Filter Tabs */}
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-[#2D2938]">
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All Challenges' },
              { id: 'unplayed', label: 'Unplayed' },
              { id: 'played', label: 'Completed' }
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

      {/* 4. Challenges Grid */}
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
          title="No Games Found"
          description={
            statusFilter === 'played'
              ? "You haven't played any challenges in this section yet. Choose an unplayed game to test your connections!"
              : "No community challenges exist for this category yet. Be the first to create one!"
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
              Create Game
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

            // Format specific visual cues
            const formatPillMap = {
              who_knows_me: { label: 'Friendship Quiz', color: 'bg-[#FF6257]/15 text-[#FF6257] border-[#FF6257]/30' },
              two_truths_and_lie: { label: 'Two Truths & Lie', color: 'bg-[#D5F36A]/15 text-[#D5F36A] border-[#D5F36A]/30' },
              emoji_challenge: { label: 'Emoji Riddle', color: 'bg-[#B9A8F5]/15 text-[#B9A8F5] border-[#B9A8F5]/30' },
              picture_mystery: { label: 'Picture Mystery', color: 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30' }
            };

            const formatMeta = formatPillMap[challenge.gameType] || { label: 'Game', color: 'bg-[#2D2938] text-[#F6F2EA]' };

            return (
              <Card
                key={challenge._id}
                className="bg-[#1E1B26] border-[#2D2938] hover:border-[#FF6257]/40 transition-all flex flex-col justify-between shadow-xl group"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border font-display ${formatMeta.color}`}>
                      {formatMeta.label}
                    </span>
                    {isPlayed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D5F36A] bg-[#D5F36A]/10 border border-[#D5F36A]/30 px-2 py-0.5 rounded-full">
                        <Icon name="check" className="w-3 h-3" />
                        Completed
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-[#777580]">
                        {challenge.participants?.length || 0} played
                      </span>
                    )}
                  </div>

                  {/* Title & Preview */}
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-[#F6F2EA] font-display line-clamp-1 group-hover:text-[#FF6257] transition-colors">
                      {challenge.title}
                    </h3>
                    <p className="text-xs text-[#777580] line-clamp-2 leading-relaxed">
                      {challenge.description || challenge.prompt}
                    </p>
                  </div>

                  {/* Creator Info & Action */}
                  <div className="pt-3 border-t border-[#2D2938] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={challenge.creator?.fullName || 'Creator'}
                        src={challenge.creator?.profile?.avatarUrl}
                        size="xs"
                      />
                      <div className="truncate max-w-[100px]">
                        <p className="text-[11px] font-medium text-[#F6F2EA] truncate">
                          {challenge.creator?.fullName || 'Looply Friend'}
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
                      {isPlayed ? 'View Results' : 'Play Now'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          ACTIVE PLAY MODAL WITH 4 DEDICATED GAMEPLAY MODES
         ========================================================================= */}
      {activeChallenge && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#110F17]/85 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-lg bg-[#1E1B26] border border-[#2D2938] rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#2D2938]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6257] font-display">
                    {activeChallenge.gameType?.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-[#777580]">
                    by {activeChallenge.creator?.fullName || 'Friend'}
                  </span>
                </div>
                <h2 className="text-base font-bold text-[#F6F2EA] font-display">
                  {activeChallenge.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveChallenge(null)}
                aria-label="Close modal"
                className="text-[#777580] hover:text-[#F6F2EA] p-1.5 rounded-lg hover:bg-[#24202E] cursor-pointer"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            {/* RESULTS VIEW (After Playing) */}
            {playResult ? (
              <div className="py-4 space-y-5 text-center">
                <div
                  className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl shadow-lg ${
                    playResult.score > 0
                      ? 'bg-[#D5F36A]/20 text-[#D5F36A] border border-[#D5F36A]'
                      : 'bg-[#FF6257]/20 text-[#FF6257] border border-[#FF6257]'
                  }`}
                >
                  {playResult.score === playResult.maxScore ? '🎉' : playResult.score > 0 ? '✨' : '😅'}
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-[#F6F2EA] font-display">
                    {playResult.message || (playResult.score > 0 ? 'Well done!' : 'Nice try!')}
                  </h3>
                  <p className="text-xs text-[#777580]">
                    Final Score: <strong className="text-[#D5F36A] text-sm">{playResult.score} / {playResult.maxScore}</strong>
                  </p>
                </div>

                {/* Debrief Details per Game Type */}
                {/* 1. Who Knows Me debrief */}
                {activeChallenge.gameType === 'who_knows_me' && (
                  <div className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938] text-left space-y-3">
                    <p className="text-xs font-bold text-[#F6F2EA] font-display">Quiz Debrief:</p>
                    {(activeChallenge.gameData?.questions || [{ question: activeChallenge.prompt, options: activeChallenge.options }]).map((q, idx) => {
                      const userChoice = wkmAnswers[`q${idx}`];
                      const correctChoice = playResult.correctAnswers ? playResult.correctAnswers[`q${idx}`] : null;
                      const isMatch = Number(userChoice) === Number(correctChoice);

                      return (
                        <div key={idx} className="p-2.5 rounded-lg bg-[#24202E] text-xs space-y-1">
                          <p className="font-semibold text-[#F6F2EA]">{idx + 1}. {q.question}</p>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#777580]">Your Pick: <strong className="text-[#F6F2EA]">{q.options?.[userChoice] || 'No answer'}</strong></span>
                            {isMatch ? (
                              <span className="text-[#D5F36A] font-bold flex items-center gap-1">✓ Matched</span>
                            ) : (
                              <span className="text-[#FF6257] font-medium flex items-center gap-1">Actual: {q.options?.[correctChoice]}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Two Truths & A Lie debrief */}
                {activeChallenge.gameType === 'two_truths_and_lie' && (
                  <div className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938] text-left space-y-3">
                    <p className="text-xs font-bold text-[#F6F2EA] font-display">The Truth Revealed:</p>
                    {(activeChallenge.gameData?.statements || activeChallenge.options || []).map((stmt, idx) => {
                      const isLie = idx === Number(playResult.correctLieIndex);
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border text-xs ${
                            isLie
                              ? 'border-[#FF6257] bg-[#FF6257]/15 text-[#F6F2EA]'
                              : 'border-[#D5F36A]/30 bg-[#D5F36A]/5 text-[#777580]'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold pb-1">
                            <span>Statement {idx + 1}</span>
                            <span className={isLie ? 'text-[#FF6257]' : 'text-[#D5F36A]'}>
                              {isLie ? '🚫 THE LIE' : '✓ TRUE STORY'}
                            </span>
                          </div>
                          <p className="text-xs text-[#F6F2EA]">{stmt}</p>
                        </div>
                      );
                    })}
                    {playResult.explanation && (
                      <div className="p-3 rounded-lg bg-[#24202E] text-xs text-[#F6F2EA]">
                        <p className="text-[10px] uppercase font-bold text-[#D5F36A] mb-1">Story Behind The Lie:</p>
                        <p className="text-xs leading-relaxed">{playResult.explanation}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Emoji Challenge debrief */}
                {activeChallenge.gameType === 'emoji_challenge' && (
                  <div className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938] text-left space-y-2">
                    <p className="text-[11px] text-[#777580] uppercase tracking-wider font-semibold">Decoded Riddle:</p>
                    <p className="text-sm font-bold text-[#D5F36A] font-display">
                      Answer: {playResult.correctAnswer}
                    </p>
                  </div>
                )}

                {/* 4. Picture Mystery debrief */}
                {activeChallenge.gameType === 'picture_mystery' && (
                  <div className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938] text-left space-y-2">
                    <p className="text-[11px] text-[#777580] uppercase tracking-wider font-semibold">Mystery Solved:</p>
                    <p className="text-sm font-bold text-[#38BDF8] font-display">
                      Object: {playResult.correctAnswer}
                    </p>
                  </div>
                )}

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setActiveChallenge(null)}
                  className="w-full font-bold"
                >
                  Close & Explore More Games
                </Button>
              </div>
            ) : (
              /* ACTIVE GAMEPLAY INTERFACES (4 FORMATS) */
              <div className="space-y-4">
                {/* -----------------------------------------------------------
                    FORMAT 1: WHO KNOWS ME? (Multi-Question Stepper)
                   ----------------------------------------------------------- */}
                {activeChallenge.gameType === 'who_knows_me' && (() => {
                  const questions = activeChallenge.gameData?.questions || [
                    { question: activeChallenge.prompt, options: activeChallenge.options }
                  ];
                  const currentQ = questions[wkmCurrentQ] || questions[0];
                  const totalQ = questions.length;
                  const currentChoice = wkmAnswers[`q${wkmCurrentQ}`];

                  return (
                    <div className="space-y-4">
                      {/* Step Indicator */}
                      <div className="flex items-center justify-between text-xs text-[#777580]">
                        <span>Question {wkmCurrentQ + 1} of {totalQ}</span>
                        <div className="flex gap-1.5">
                          {questions.map((_, idx) => (
                            <span
                              key={idx}
                              className={`w-5 h-1.5 rounded-full transition-all ${
                                idx === wkmCurrentQ
                                  ? 'bg-[#FF6257]'
                                  : wkmAnswers[`q${idx}`] !== undefined
                                  ? 'bg-[#D5F36A]'
                                  : 'bg-[#2D2938]'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Question Heading */}
                      <div className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938]">
                        <h3 className="text-sm font-bold text-[#F6F2EA] font-display leading-snug">
                          {currentQ.question}
                        </h3>
                      </div>

                      {/* Option Choices */}
                      <div className="space-y-2">
                        {currentQ.options?.map((opt, optIdx) => {
                          const isSelected = currentChoice === optIdx;
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => setWkmAnswers(prev => ({ ...prev, [`q${wkmCurrentQ}`]: optIdx }))}
                              className={`w-full p-3.5 rounded-xl border text-xs text-left transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'border-[#FF6257] bg-[#FF6257]/15 text-[#F6F2EA] font-bold shadow-md shadow-[#FF6257]/10'
                                  : 'border-[#2D2938] hover:bg-[#24202E] text-[#777580]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                                  isSelected ? 'bg-[#FF6257] text-[#17151D]' : 'bg-[#24202E] text-[#777580]'
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {isSelected && <Icon name="check" className="w-4 h-4 text-[#FF6257]" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Stepper Navigation */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#2D2938]">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={wkmCurrentQ === 0}
                          onClick={() => setWkmCurrentQ(prev => Math.max(0, prev - 1))}
                        >
                          Previous
                        </Button>

                        {wkmCurrentQ < totalQ - 1 ? (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={currentChoice === undefined}
                            onClick={() => setWkmCurrentQ(prev => prev + 1)}
                          >
                            Next Question
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={submittingPlay || currentChoice === undefined}
                            onClick={() => handleSubmitPlay(wkmAnswers)}
                          >
                            {submittingPlay ? 'Submitting Quiz...' : 'Finish & See Score'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* -----------------------------------------------------------
                    FORMAT 2: TWO TRUTHS & A LIE (Statement Lie Spotter)
                   ----------------------------------------------------------- */}
                {activeChallenge.gameType === 'two_truths_and_lie' && (() => {
                  const statements = activeChallenge.gameData?.statements || activeChallenge.options || [];

                  return (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-[#17151D] border border-[#2D2938]">
                        <p className="text-xs text-[#F6F2EA] leading-relaxed">
                          Two of these statements actually happened. One is a creative lie. <strong>Click the statement you think is the LIE!</strong>
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        {statements.map((stmt, idx) => {
                          const isSelected = selectedLieIndex === idx;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedLieIndex(idx)}
                              className={`w-full p-4 rounded-xl border text-xs text-left transition-all cursor-pointer space-y-1.5 ${
                                isSelected
                                  ? 'border-[#FF6257] bg-[#FF6257]/15 text-[#F6F2EA] shadow-md shadow-[#FF6257]/15'
                                  : 'border-[#2D2938] hover:bg-[#24202E] text-[#777580]'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className={isSelected ? 'text-[#FF6257]' : 'text-[#777580]'}>
                                  Statement {idx + 1}
                                </span>
                                {isSelected && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF6257] text-[#17151D]">
                                    My Lie Choice
                                  </span>
                                )}
                              </div>
                              <p className="text-xs leading-relaxed text-[#F6F2EA]">{stmt}</p>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2D2938]">
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
                          disabled={submittingPlay || selectedLieIndex === null}
                          onClick={() => handleSubmitPlay({ lieIndex: selectedLieIndex })}
                        >
                          {submittingPlay ? 'Checking Lie...' : 'Submit Lie Guess'}
                        </Button>
                      </div>
                    </div>
                  );
                })()}

                {/* -----------------------------------------------------------
                    FORMAT 3: EMOJI CHALLENGE (Visual Riddle Decoder)
                   ----------------------------------------------------------- */}
                {activeChallenge.gameType === 'emoji_challenge' && (() => {
                  const emojis = activeChallenge.gameData?.emojis || activeChallenge.prompt;
                  const category = activeChallenge.gameData?.category || 'Word Riddle';
                  const hint = activeChallenge.gameData?.hint || activeChallenge.hint;

                  return (
                    <div className="space-y-4">
                      {/* Big Emoji Board */}
                      <div className="p-6 rounded-2xl bg-[#17151D] border border-[#2D2938] text-center space-y-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#B9A8F5]/15 text-[#B9A8F5] border border-[#B9A8F5]/30">
                          {category}
                        </span>
                        <div className="text-4xl sm:text-5xl py-3 tracking-widest select-none">
                          {emojis}
                        </div>
                        <p className="text-[11px] text-[#777580]">
                          Decode these emojis into a famous movie, game, phrase, or title!
                        </p>
                      </div>

                      {/* Progressive Hint Accordion */}
                      {hint && (
                        <div>
                          {!showEmojiHint ? (
                            <button
                              type="button"
                              onClick={() => setShowEmojiHint(true)}
                              className="text-xs text-[#D5F36A] hover:underline flex items-center gap-1.5 cursor-pointer font-medium"
                            >
                              <Icon name="sparkles" className="w-3.5 h-3.5" />
                              <span>Need a clue? Reveal hint</span>
                            </button>
                          ) : (
                            <div className="p-3 rounded-xl bg-[#D5F36A]/10 border border-[#D5F36A]/30 text-xs text-[#D5F36A] flex items-center gap-2">
                              <Icon name="sparkles" className="w-4 h-4 shrink-0" />
                              <span>Hint: {hint}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Answer Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#F6F2EA] font-display">
                          Your Guess:
                        </label>
                        <input
                          type="text"
                          value={emojiGuess}
                          onChange={(e) => setEmojiGuess(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && emojiGuess.trim() && !submittingPlay) {
                              handleSubmitPlay({ answer: emojiGuess.trim() });
                            }
                          }}
                          placeholder="Type what you think the emojis mean..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] placeholder-[#777580] focus:outline-hidden focus:border-[#FF6257]"
                          autoFocus
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2D2938]">
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
                          disabled={submittingPlay || !emojiGuess.trim()}
                          onClick={() => handleSubmitPlay({ answer: emojiGuess.trim() })}
                        >
                          {submittingPlay ? 'Checking...' : 'Submit Guess'}
                        </Button>
                      </div>
                    </div>
                  );
                })()}

                {/* -----------------------------------------------------------
                    FORMAT 4: PICTURE MYSTERY (Visual Mystery Clue)
                   ----------------------------------------------------------- */}
                {activeChallenge.gameType === 'picture_mystery' && (() => {
                  const imageUrl = activeChallenge.gameData?.imageUrl || activeChallenge.prompt;
                  const category = activeChallenge.gameData?.category || 'Visual Mystery';
                  const hint = activeChallenge.gameData?.hint || activeChallenge.hint;

                  return (
                    <div className="space-y-4">
                      {/* Image Preview Container */}
                      <div className="relative rounded-2xl overflow-hidden border border-[#2D2938] bg-[#17151D]">
                        <img
                          src={imageUrl}
                          alt="Mystery clue visual"
                          className="w-full h-52 object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#17151D]/80 backdrop-blur-md text-[#38BDF8] border border-[#38BDF8]/30">
                            {category}
                          </span>
                        </div>
                      </div>

                      {/* Progressive Hint */}
                      {hint && (
                        <div>
                          {!showPictureHint ? (
                            <button
                              type="button"
                              onClick={() => setShowPictureHint(true)}
                              className="text-xs text-[#38BDF8] hover:underline flex items-center gap-1.5 cursor-pointer font-medium"
                            >
                              <Icon name="sparkles" className="w-3.5 h-3.5" />
                              <span>Stuck? Reveal clue hint</span>
                            </button>
                          ) : (
                            <div className="p-3 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-xs text-[#38BDF8] flex items-center gap-2">
                              <Icon name="sparkles" className="w-4 h-4 shrink-0" />
                              <span>Clue: {hint}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Answer Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#F6F2EA] font-display">
                          What is this mystery subject?
                        </label>
                        <input
                          type="text"
                          value={pictureGuess}
                          onChange={(e) => setPictureGuess(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && pictureGuess.trim() && !submittingPlay) {
                              handleSubmitPlay({ answer: pictureGuess.trim() });
                            }
                          }}
                          placeholder="Type your deduction..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] placeholder-[#777580] focus:outline-hidden focus:border-[#FF6257]"
                          autoFocus
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2D2938]">
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
                          disabled={submittingPlay || !pictureGuess.trim()}
                          onClick={() => handleSubmitPlay({ answer: pictureGuess.trim() })}
                        >
                          {submittingPlay ? 'Checking...' : 'Submit Deduction'}
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          CREATE CHALLENGE MODAL (WITH FORMAT-SPECIFIC BUILDERS)
         ========================================================================= */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#110F17]/85 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-lg bg-[#1E1B26] border border-[#2D2938] rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D2938]">
              <h2 className="text-base font-bold text-[#F6F2EA] font-display">Create a Play Challenge</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close dialog"
                className="text-[#777580] hover:text-[#F6F2EA] p-1 rounded-lg hover:bg-[#24202E] cursor-pointer"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChallenge} className="space-y-4">
              {createError && (
                <div role="alert" className="p-3 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257]">
                  {createError}
                </div>
              )}

              {/* Format Selector Pills */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F6F2EA] font-display">Select Game Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'who_knows_me', label: 'Who Knows Me?', icon: 'users' },
                    { id: 'two_truths_and_lie', label: 'Two Truths & Lie', icon: 'sparkles' },
                    { id: 'emoji_challenge', label: 'Emoji Riddle', icon: 'assistant' },
                    { id: 'picture_mystery', label: 'Picture Mystery', icon: 'split' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setCreateType(f.id)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                        createType === f.id
                          ? 'border-[#FF6257] bg-[#FF6257]/15 text-[#F6F2EA]'
                          : 'border-[#2D2938] bg-[#17151D] text-[#777580] hover:text-[#F6F2EA]'
                      }`}
                    >
                      <Icon name={f.icon} className="w-4 h-4 shrink-0 text-[#FF6257]" />
                      <span>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F6F2EA] font-display">Game Title</label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. How Well Do You Know My Habits?"
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] placeholder-[#777580] focus:outline-hidden focus:border-[#FF6257]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F6F2EA] font-display">Intro / Description (optional)</label>
                <input
                  type="text"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="A friendly intro for players..."
                  className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA] placeholder-[#777580] focus:outline-hidden focus:border-[#FF6257]"
                />
              </div>

              {/* ================= BUILDER A: WHO KNOWS ME ================= */}
              {createType === 'who_knows_me' && (
                <div className="space-y-4 pt-2 border-t border-[#2D2938]">
                  <p className="text-xs font-bold text-[#FF6257] font-display">Friendship Questions Builder:</p>
                  {createWkmQuestions.map((qObj, qIdx) => (
                    <div key={qIdx} className="p-3.5 rounded-xl bg-[#17151D] border border-[#2D2938] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#F6F2EA]">Question {qIdx + 1}</span>
                        {createWkmQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setCreateWkmQuestions(prev => prev.filter((_, i) => i !== qIdx))}
                            className="text-[11px] text-[#FF6257] hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={qObj.question}
                        onChange={(e) => {
                          const updated = [...createWkmQuestions];
                          updated[qIdx].question = e.target.value;
                          setCreateWkmQuestions(updated);
                        }}
                        placeholder="e.g. What is my comfort food?"
                        className="w-full px-3 py-1.5 rounded-lg bg-[#24202E] border border-[#2D2938] text-xs text-[#F6F2EA]"
                        required
                      />

                      <div className="space-y-1.5 pt-1">
                        <p className="text-[11px] text-[#777580]">Options (Select the radio button for your true answer):</p>
                        {qObj.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct_q_${qIdx}`}
                              checked={qObj.correctOption === oIdx}
                              onChange={() => {
                                const updated = [...createWkmQuestions];
                                updated[qIdx].correctOption = oIdx;
                                setCreateWkmQuestions(updated);
                              }}
                              className="accent-[#FF6257]"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const updated = [...createWkmQuestions];
                                updated[qIdx].options[oIdx] = e.target.value;
                                setCreateWkmQuestions(updated);
                              }}
                              placeholder={`Option ${oIdx + 1}`}
                              className="flex-1 px-2.5 py-1 rounded bg-[#24202E] border border-[#2D2938] text-xs text-[#F6F2EA]"
                              required
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {createWkmQuestions.length < 3 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCreateWkmQuestions(prev => [
                        ...prev,
                        { question: '', options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'], correctOption: 0 }
                      ])}
                      className="w-full text-xs"
                    >
                      + Add Another Question
                    </Button>
                  )}
                </div>
              )}

              {/* ================= BUILDER B: TWO TRUTHS & A LIE ================= */}
              {createType === 'two_truths_and_lie' && (
                <div className="space-y-3 pt-2 border-t border-[#2D2938]">
                  <p className="text-xs font-bold text-[#D5F36A] font-display">Enter Three Statements (Mark which one is the LIE):</p>
                  {createTtlStatements.map((stmt, sIdx) => (
                    <div key={sIdx} className="p-3 rounded-xl bg-[#17151D] border border-[#2D2938] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#F6F2EA]">Statement {sIdx + 1}</span>
                        <label className="flex items-center gap-1.5 text-xs text-[#FF6257] font-bold cursor-pointer">
                          <input
                            type="radio"
                            name="ttl_lie_choice"
                            checked={createTtlLieIndex === sIdx}
                            onChange={() => setCreateTtlLieIndex(sIdx)}
                            className="accent-[#FF6257]"
                          />
                          <span>This is the LIE</span>
                        </label>
                      </div>
                      <textarea
                        rows={2}
                        value={stmt}
                        onChange={(e) => {
                          const updated = [...createTtlStatements];
                          updated[sIdx] = e.target.value;
                          setCreateTtlStatements(updated);
                        }}
                        placeholder={sIdx === createTtlLieIndex ? 'Write your clever, believable lie...' : 'Write an authentic true fact about yourself...'}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#24202E] border border-[#2D2938] text-xs text-[#F6F2EA]"
                        required
                      />
                    </div>
                  ))}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#F6F2EA]">Story Behind The Lie (Debrief explanation):</label>
                    <input
                      type="text"
                      value={createTtlExplanation}
                      onChange={(e) => setCreateTtlExplanation(e.target.value)}
                      placeholder="Explain why the lie is false and share the real story..."
                      className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA]"
                    />
                  </div>
                </div>
              )}

              {/* ================= BUILDER C: EMOJI RIDDLE ================= */}
              {createType === 'emoji_challenge' && (
                <div className="space-y-3 pt-2 border-t border-[#2D2938]">
                  <p className="text-xs font-bold text-[#B9A8F5] font-display">Create Your Emoji Riddle:</p>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#F6F2EA]">Emojis (e.g. 🦁 👑 🎬)</label>
                    <input
                      type="text"
                      value={createEmojiString}
                      onChange={(e) => setCreateEmojiString(e.target.value)}
                      placeholder="Paste emojis here..."
                      className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-lg text-[#F6F2EA]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#F6F2EA]">Category</label>
                      <input
                        type="text"
                        value={createEmojiCategory}
                        onChange={(e) => setCreateEmojiCategory(e.target.value)}
                        placeholder="e.g. Movies, Songs"
                        className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#F6F2EA]">Correct Answer</label>
                      <input
                        type="text"
                        value={createEmojiAnswer}
                        onChange={(e) => setCreateEmojiAnswer(e.target.value)}
                        placeholder="The Lion King"
                        className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#F6F2EA]">Hint (optional)</label>
                    <input
                      type="text"
                      value={createEmojiHint}
                      onChange={(e) => setCreateEmojiHint(e.target.value)}
                      placeholder="Give a subtle hint for players..."
                      className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA]"
                    />
                  </div>
                </div>
              )}

              {/* ================= BUILDER D: PICTURE MYSTERY ================= */}
              {createType === 'picture_mystery' && (
                <div className="space-y-3 pt-2 border-t border-[#2D2938]">
                  <p className="text-xs font-bold text-[#38BDF8] font-display">Create Your Picture Mystery:</p>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#F6F2EA]">Image URL</label>
                    <input
                      type="url"
                      value={createPicImageUrl}
                      onChange={(e) => setCreatePicImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#F6F2EA]">Category</label>
                      <input
                        type="text"
                        value={createPicCategory}
                        onChange={(e) => setCreatePicCategory(e.target.value)}
                        placeholder="e.g. Architecture, Nature"
                        className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#F6F2EA]">Correct Answer</label>
                      <input
                        type="text"
                        value={createPicAnswer}
                        onChange={(e) => setCreatePicAnswer(e.target.value)}
                        placeholder="Golden Gate Bridge"
                        className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#F6F2EA]">Clue / Hint (optional)</label>
                    <input
                      type="text"
                      value={createPicHint}
                      onChange={(e) => setCreatePicHint(e.target.value)}
                      placeholder="e.g. Built in 1937 in Northern California"
                      className="w-full px-3 py-2 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs text-[#F6F2EA]"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2D2938]">
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
                  className="font-bold"
                >
                  {submittingCreate ? 'Publishing Game...' : 'Publish Challenge'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
