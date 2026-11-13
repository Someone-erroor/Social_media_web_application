'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import ExperienceHeader from '@/components/experiences/ExperienceHeader';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
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
  const [createWkmQuestions, setCreateWkmQuestions] = useState([
    { question: 'What is my absolute favorite morning beverage?', options: ['Pour-over coffee', 'Matcha latte', 'Earl Grey tea', 'Cold orange juice'], correctOption: 0 },
    { question: 'Where would I spend a quiet Saturday afternoon?', options: ['Secondhand bookstore', 'Mountain trail', 'Local coffee shop', 'Art museum'], correctOption: 0 }
  ]);
  const [createTtlStatements, setCreateTtlStatements] = useState(['', '', '']);
  const [createTtlLieIndex, setCreateTtlLieIndex] = useState(1);
  const [createTtlExplanation, setCreateTtlExplanation] = useState('');
  const [createEmojiString, setCreateEmojiString] = useState('');
  const [createEmojiCategory, setCreateEmojiCategory] = useState('');
  const [createEmojiHint, setCreateEmojiHint] = useState('');
  const [createEmojiAnswer, setCreateEmojiAnswer] = useState('');
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
    setWkmCurrentQ(0);
    setWkmAnswers({});
    setSelectedLieIndex(null);
    setEmojiGuess('');
    setShowEmojiHint(false);
    setPictureGuess('');
    setShowPictureHint(false);
  };

  // Submit play action across each of the 4 independent games
  const handleSubmitPlay = async (answerPayload) => {
    if (!activeChallenge) return;
    setSubmittingPlay(true);
    try {
      let finalSubmission = answerPayload;

      // Handle who_knows_me array packaging
      if (activeChallenge.gameType === 'who_knows_me' && !answerPayload.selectedOption && !answerPayload.answers) {
        finalSubmission = { answers: wkmAnswers };
      }

      const res = await playService.playChallenge(activeChallenge._id, finalSubmission);
      if (res?.success) {
        setPlayResult(res);
        setChallenges((prev) =>
          prev.map((c) =>
            c._id === activeChallenge._id
              ? {
                  ...c,
                  played: true,
                  participants: [...(c.participants || []), { user: user?._id, score: res.score }]
                }
              : c
          )
        );
      }
    } catch (err) {
      setError(err.message || 'Failed to submit game answers.');
    } finally {
      setSubmittingPlay(false);
    }
  };

  // Create Challenge handler
  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    setCreateError('');
    setSubmittingCreate(true);

    try {
      let payload = {
        title: createTitle.trim(),
        description: createDesc.trim() || undefined,
        gameType: createType
      };

      if (createType === 'who_knows_me') {
        const validQuestions = createWkmQuestions.filter(q => q.question.trim());
        if (validQuestions.length === 0) {
          throw new Error('Please add at least one question.');
        }
        payload.prompt = validQuestions[0].question;
        payload.options = validQuestions[0].options;
        payload.correctAnswer = validQuestions[0].options[validQuestions[0].correctOption];
        payload.gameData = {
          questions: validQuestions
        };
      } else if (createType === 'two_truths_and_lie') {
        const validStatements = createTtlStatements.map(s => s.trim());
        if (validStatements.some(s => !s)) {
          throw new Error('All 3 statements must be filled out.');
        }
        payload.prompt = 'Two of these are true. One is a lie. Spot the lie!';
        payload.options = validStatements;
        payload.correctAnswer = String(createTtlLieIndex);
        payload.gameData = {
          statements: validStatements,
          correctLieIndex: createTtlLieIndex,
          explanation: createTtlExplanation.trim() || undefined
        };
      } else if (createType === 'emoji_challenge') {
        if (!createEmojiString.trim() || !createEmojiAnswer.trim()) {
          throw new Error('Emojis and correct answer are required.');
        }
        payload.prompt = createEmojiString.trim();
        payload.correctAnswer = createEmojiAnswer.trim();
        payload.gameData = {
          emojis: createEmojiString.trim(),
          category: createEmojiCategory.trim() || 'General',
          hint: createEmojiHint.trim() || undefined
        };
      } else if (createType === 'picture_mystery') {
        if (!createPicImageUrl.trim() || !createPicAnswer.trim()) {
          throw new Error('Picture URL and correct answer are required.');
        }
        payload.prompt = createPicImageUrl.trim();
        payload.correctAnswer = createPicAnswer.trim();
        payload.gameData = {
          imageUrl: createPicImageUrl.trim(),
          category: createPicCategory.trim() || 'Visual Mystery',
          hint: createPicHint.trim() || undefined
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
        categoryLabel="Social Play & Banter"
        status="Active Arcade"
        statusVariant="yellow"
        action={
          <Button
            type="button"
            variant="yellow"
            size="md"
            onClick={() => setShowCreateModal(true)}
            icon={<Icon name="plus" className="w-4 h-4" />}
            className="shrink-0 font-bold"
          >
            Create a Game
          </Button>
        }
      />

      {error && (
        <div role="alert" className="p-4 rounded-xl bg-[#FFEAEA] border border-[#FF6B6B]/30 text-xs text-[#FF6B6B] flex items-center gap-2">
          <Icon name="alertCircle" className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Featured Challenge Hero */}
      {!loading && featuredChallenge && selectedType === 'all' && statusFilter === 'all' && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#FFF7E0] via-white to-[#EEEAFE] border border-[#FFD166]/40 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FFD166] text-[#1E1E24] font-display shadow-2xs">
                  ★ Community Favorite
                </span>
                <span className="text-[11px] text-[#6B6B73] uppercase tracking-wider font-semibold">
                  {featuredChallenge.gameType?.replace(/_/g, ' ')}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#1E1E24] font-display">
                {featuredChallenge.title}
              </h2>
              <p className="text-xs text-[#6B6B73] line-clamp-2 leading-relaxed">
                {featuredChallenge.description || featuredChallenge.prompt}
              </p>
              <div className="flex items-center gap-3 text-xs text-[#6B6B73] pt-1">
                <span className="flex items-center gap-1.5">
                  <Avatar
                    name={featuredChallenge.creator?.fullName || 'Creator'}
                    src={featuredChallenge.creator?.profile?.avatarUrl}
                    size="xs"
                  />
                  <span>By {featuredChallenge.creator?.fullName || 'Looply Friend'}</span>
                </span>
                <span>•</span>
                <span className="text-[#2E7D4E] font-semibold flex items-center gap-1">
                  <Icon name="sparkles" className="w-3.5 h-3.5" />
                  {featuredChallenge.participants?.length || 0} played
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="yellow"
              size="md"
              onClick={() => handleOpenPlay(featuredChallenge)}
              icon={<Icon name="play" className="w-4 h-4" />}
              className="w-full md:w-auto font-bold shadow-xs"
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
                    ? 'bg-[#FFD166] text-[#1E1E24] shadow-xs font-bold'
                    : 'bg-white border border-[#E7E5E0] text-[#6B6B73] hover:text-[#1E1E24]'
                }`}
              >
                <Icon name={gt.icon} className="w-3.5 h-3.5" />
                <span>{gt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-[#E7E5E0]">
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
                    ? 'bg-[#EEEAFE] text-[#6C63FF] font-bold'
                    : 'text-[#6B6B73] hover:text-[#1E1E24]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-[#6B6B73]">
            {filteredChallenges.length} {filteredChallenges.length === 1 ? 'game' : 'games'} available
          </span>
        </div>
      </div>

      {/* 4. Challenges Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-[#E7E5E0] animate-pulse space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-20 h-4 bg-[#F1F0EC] rounded" />
                <div className="w-12 h-4 bg-[#F1F0EC] rounded" />
              </div>
              <div className="w-3/4 h-5 bg-[#F1F0EC] rounded" />
              <div className="w-full h-12 bg-[#F1F0EC] rounded" />
              <div className="w-full h-8 bg-[#F1F0EC] rounded pt-2" />
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
              : 'No community challenges exist for this category yet. Be the first to create one!'
          }
          badgeText="Looply Play"
          action={
            <Button
              type="button"
              variant="yellow"
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
              who_knows_me: { label: 'Friendship Quiz', color: 'bg-[#FFEAEA] text-[#FF6B6B] border-[#FF6B6B]/25' },
              two_truths_and_lie: { label: 'Two Truths & Lie', color: 'bg-[#FFF7E0] text-[#B28200] border-[#FFD166]/40' },
              emoji_challenge: { label: 'Emoji Riddle', color: 'bg-[#EEEAFE] text-[#6C63FF] border-[#6C63FF]/25' },
              picture_mystery: { label: 'Picture Mystery', color: 'bg-[#E0F2FE] text-[#0284C7] border-[#0284C7]/25' }
            };

            const formatMeta = formatPillMap[challenge.gameType] || { label: 'Game', color: 'bg-[#F1F0EC] text-[#1E1E24]' };

            return (
              <Card
                key={challenge._id}
                className="bg-white border-[#E7E5E0] hover:border-[#6C63FF]/40 transition-all flex flex-col justify-between shadow-xs group"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border font-display ${formatMeta.color}`}>
                      {formatMeta.label}
                    </span>
                    {isPlayed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2E7D4E] bg-[#E8F7EE] border border-[#4CAF78]/30 px-2 py-0.5 rounded-full">
                        <Icon name="check" className="w-3 h-3" />
                        Completed
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-[#6B6B73]">
                        {challenge.participants?.length || 0} played
                      </span>
                    )}
                  </div>

                  {/* Title & Preview */}
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-[#1E1E24] font-display line-clamp-1 group-hover:text-[#6C63FF] transition-colors">
                      {challenge.title}
                    </h3>
                    <p className="text-xs text-[#6B6B73] line-clamp-2 leading-relaxed">
                      {challenge.description || challenge.prompt}
                    </p>
                  </div>

                  {/* Creator Info & Action */}
                  <div className="pt-3 border-t border-[#E7E5E0] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={challenge.creator?.fullName || 'Creator'}
                        src={challenge.creator?.profile?.avatarUrl}
                        size="xs"
                      />
                      <div className="truncate max-w-[100px]">
                        <p className="text-[11px] font-semibold text-[#1E1E24] truncate">
                          {challenge.creator?.fullName || 'Looply Friend'}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant={isPlayed ? 'outline' : 'yellow'}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
        >
          <div className="w-full max-w-lg bg-white border border-[#E7E5E0] rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E0]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C63FF] font-display">
                    {activeChallenge.gameType?.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-[#6B6B73]">
                    by {activeChallenge.creator?.fullName || 'Friend'}
                  </span>
                </div>
                <h2 className="text-base font-bold text-[#1E1E24] font-display">
                  {activeChallenge.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveChallenge(null)}
                aria-label="Close modal"
                className="text-[#6B6B73] hover:text-[#1E1E24] p-1.5 rounded-lg hover:bg-[#F1F0EC] cursor-pointer"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            {/* RESULTS VIEW (After Playing) */}
            {playResult ? (
              <div className="py-4 space-y-5 text-center">
                <div
                  className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl shadow-xs ${
                    playResult.score > 0
                      ? 'bg-[#E8F7EE] text-[#2E7D4E] border border-[#4CAF78]/40'
                      : 'bg-[#FFEAEA] text-[#FF6B6B] border border-[#FF6B6B]/40'
                  }`}
                >
                  {playResult.score === playResult.maxScore ? '🎉' : playResult.score > 0 ? '✨' : '😅'}
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-[#1E1E24] font-display">
                    {playResult.message || (playResult.score > 0 ? 'Well done!' : 'Nice try!')}
                  </h3>
                  <p className="text-xs text-[#6B6B73]">
                    Final Score: <strong className="text-[#2E7D4E] text-sm">{playResult.score} / {playResult.maxScore}</strong>
                  </p>
                </div>

                {/* Debrief Details per Game Type */}
                {/* 1. Who Knows Me debrief */}
                {activeChallenge.gameType === 'who_knows_me' && (
                  <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] text-left space-y-3">
                    <p className="text-xs font-bold text-[#1E1E24] font-display">Quiz Debrief:</p>
                    {(activeChallenge.gameData?.questions || [{ question: activeChallenge.prompt, options: activeChallenge.options }]).map((q, idx) => {
                      const userChoice = wkmAnswers[`q${idx}`];
                      const correctChoice = playResult.correctAnswers ? playResult.correctAnswers[`q${idx}`] : null;
                      const isMatch = Number(userChoice) === Number(correctChoice);

                      return (
                        <div key={idx} className="p-2.5 rounded-lg bg-white border border-[#E7E5E0] text-xs space-y-1">
                          <p className="font-semibold text-[#1E1E24]">{idx + 1}. {q.question}</p>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#6B6B73]">Your Pick: <strong className="text-[#1E1E24]">{q.options?.[userChoice] || 'No answer'}</strong></span>
                            {isMatch ? (
                              <span className="text-[#2E7D4E] font-bold flex items-center gap-1">✓ Matched</span>
                            ) : (
                              <span className="text-[#FF6B6B] font-medium flex items-center gap-1">Actual: {q.options?.[correctChoice]}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Two Truths & A Lie debrief */}
                {activeChallenge.gameType === 'two_truths_and_lie' && (
                  <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] text-left space-y-3">
                    <p className="text-xs font-bold text-[#1E1E24] font-display">The Truth Revealed:</p>
                    {(activeChallenge.gameData?.statements || activeChallenge.options || []).map((stmt, idx) => {
                      const isLie = idx === Number(playResult.correctLieIndex);
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border text-xs ${
                            isLie
                              ? 'border-[#FF6B6B] bg-[#FFEAEA] text-[#1E1E24]'
                              : 'border-[#E7E5E0] bg-white text-[#6B6B73]'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold pb-1">
                            <span>Statement {idx + 1}</span>
                            <span className={isLie ? 'text-[#FF6B6B]' : 'text-[#2E7D4E]'}>
                              {isLie ? '🚫 THE LIE' : '✓ TRUE STORY'}
                            </span>
                          </div>
                          <p className="text-xs text-[#1E1E24]">{stmt}</p>
                        </div>
                      );
                    })}
                    {playResult.explanation && (
                      <div className="p-3 rounded-lg bg-white border border-[#E7E5E0] text-xs text-[#1E1E24]">
                        <p className="text-[10px] uppercase font-bold text-[#6C63FF] mb-1">Story Behind The Lie:</p>
                        <p className="text-xs leading-relaxed">{playResult.explanation}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Emoji Challenge debrief */}
                {activeChallenge.gameType === 'emoji_challenge' && (
                  <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] text-left space-y-2">
                    <p className="text-[11px] text-[#6B6B73] uppercase tracking-wider font-semibold">Decoded Riddle:</p>
                    <p className="text-sm font-bold text-[#6C63FF] font-display">
                      Answer: {playResult.correctAnswer}
                    </p>
                  </div>
                )}

                {/* 4. Picture Mystery debrief */}
                {activeChallenge.gameType === 'picture_mystery' && (
                  <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] text-left space-y-2">
                    <p className="text-[11px] text-[#6B6B73] uppercase tracking-wider font-semibold">Mystery Solved:</p>
                    <p className="text-sm font-bold text-[#0284C7] font-display">
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
                      <div className="flex items-center justify-between text-xs text-[#6B6B73]">
                        <span>Question {wkmCurrentQ + 1} of {totalQ}</span>
                        <div className="flex gap-1.5">
                          {questions.map((_, idx) => (
                            <span
                              key={idx}
                              className={`w-5 h-1.5 rounded-full transition-all ${
                                idx === wkmCurrentQ
                                  ? 'bg-[#6C63FF]'
                                  : wkmAnswers[`q${idx}`] !== undefined
                                  ? 'bg-[#4CAF78]'
                                  : 'bg-[#E7E5E0]'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Question Heading */}
                      <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0]">
                        <h3 className="text-sm font-bold text-[#1E1E24] font-display leading-snug">
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
                                  ? 'border-[#6C63FF] bg-[#EEEAFE] text-[#1E1E24] font-bold shadow-2xs'
                                  : 'border-[#E7E5E0] hover:bg-[#F8F7F4] text-[#6B6B73]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                                  isSelected ? 'bg-[#6C63FF] text-white' : 'bg-[#F1F0EC] text-[#6B6B73]'
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {isSelected && <Icon name="check" className="w-4 h-4 text-[#6C63FF]" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Stepper Navigation */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#E7E5E0]">
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
                            variant="yellow"
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
                      <div className="p-3.5 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0]">
                        <p className="text-xs text-[#1E1E24] leading-relaxed">
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
                                  ? 'border-[#FF6B6B] bg-[#FFEAEA] text-[#1E1E24] shadow-2xs font-bold'
                                  : 'border-[#E7E5E0] hover:bg-[#F8F7F4] text-[#6B6B73]'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className={isSelected ? 'text-[#FF6B6B]' : 'text-[#6B6B73]'}>
                                  Statement {idx + 1}
                                </span>
                                {isSelected && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF6B6B] text-white">
                                    My Lie Choice
                                  </span>
                                )}
                              </div>
                              <p className="text-xs leading-relaxed text-[#1E1E24]">{stmt}</p>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E7E5E0]">
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
                          variant="yellow"
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
                      <div className="p-6 rounded-2xl bg-[#F8F7F4] border border-[#E7E5E0] text-center space-y-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EEEAFE] text-[#6C63FF] border border-[#6C63FF]/30">
                          {category}
                        </span>
                        <div className="text-4xl sm:text-5xl py-3 tracking-widest select-none">
                          {emojis}
                        </div>
                        <p className="text-[11px] text-[#6B6B73]">
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
                              className="text-xs text-[#2E7D4E] hover:underline flex items-center gap-1.5 cursor-pointer font-semibold"
                            >
                              <Icon name="sparkles" className="w-3.5 h-3.5" />
                              <span>Need a clue? Reveal hint</span>
                            </button>
                          ) : (
                            <div className="p-3 rounded-xl bg-[#E8F7EE] border border-[#4CAF78]/30 text-xs text-[#2E7D4E] flex items-center gap-2">
                              <Icon name="sparkles" className="w-4 h-4 shrink-0" />
                              <span>Hint: {hint}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Answer Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#1E1E24] font-display">
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
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E7E5E0] text-xs text-[#1E1E24] placeholder:text-[#6B6B73]/60 focus:outline-hidden focus:border-[#6C63FF]"
                          autoFocus
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E7E5E0]">
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
                      <div className="relative rounded-2xl overflow-hidden border border-[#E7E5E0] bg-[#F1F0EC]">
                        <img
                          src={imageUrl}
                          alt="Mystery clue visual"
                          className="w-full h-52 object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-[#0284C7] border border-[#0284C7]/30 shadow-xs">
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
                              className="text-xs text-[#0284C7] hover:underline flex items-center gap-1.5 cursor-pointer font-semibold"
                            >
                              <Icon name="sparkles" className="w-3.5 h-3.5" />
                              <span>Stuck? Reveal clue hint</span>
                            </button>
                          ) : (
                            <div className="p-3 rounded-xl bg-[#E0F2FE] border border-[#0284C7]/30 text-xs text-[#0284C7] flex items-center gap-2">
                              <Icon name="sparkles" className="w-4 h-4 shrink-0" />
                              <span>Clue: {hint}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Answer Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#1E1E24] font-display">
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
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E7E5E0] text-xs text-[#1E1E24] placeholder:text-[#6B6B73]/60 focus:outline-hidden focus:border-[#6C63FF]"
                          autoFocus
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E7E5E0]">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
        >
          <div className="w-full max-w-lg bg-white border border-[#E7E5E0] rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E0]">
              <h2 className="text-base font-bold text-[#1E1E24] font-display">Create a Play Challenge</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close dialog"
                className="text-[#6B6B73] hover:text-[#1E1E24] p-1 rounded-lg hover:bg-[#F1F0EC] cursor-pointer"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChallenge} className="space-y-4">
              {createError && (
                <div role="alert" className="p-3 rounded-xl bg-[#FFEAEA] border border-[#FF6B6B]/30 text-xs text-[#FF6B6B]">
                  {createError}
                </div>
              )}

              {/* Format Selector Pills */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1E1E24] font-display">Select Game Format</label>
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
                          ? 'border-[#6C63FF] bg-[#EEEAFE] text-[#6C63FF] font-bold shadow-2xs'
                          : 'border-[#E7E5E0] bg-white text-[#6B6B73] hover:text-[#1E1E24]'
                      }`}
                    >
                      <Icon name={f.icon} className="w-4 h-4 shrink-0 text-[#6C63FF]" />
                      <span>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1E1E24] font-display">Game Title</label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. How Well Do You Know My Habits?"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E0] text-xs text-[#1E1E24] placeholder:text-[#6B6B73]/60 focus:outline-hidden focus:border-[#6C63FF]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1E1E24] font-display">Intro / Description (optional)</label>
                <input
                  type="text"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="A friendly intro for players..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E0] text-xs text-[#1E1E24] placeholder:text-[#6B6B73]/60 focus:outline-hidden focus:border-[#6C63FF]"
                />
              </div>

              {/* ================= BUILDER A: WHO KNOWS ME ================= */}
              {createType === 'who_knows_me' && (
                <div className="space-y-4 pt-2 border-t border-[#E7E5E0]">
                  <p className="text-xs font-bold text-[#6C63FF] font-display">Friendship Questions Builder:</p>
                  {createWkmQuestions.map((qObj, qIdx) => (
                    <div key={qIdx} className="p-3.5 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1E1E24]">Question {qIdx + 1}</span>
                        {createWkmQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setCreateWkmQuestions(prev => prev.filter((_, i) => i !== qIdx))}
                            className="text-[11px] text-[#FF6B6B] hover:underline cursor-pointer"
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
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E7E5E0] text-xs text-[#1E1E24]"
                        required
                      />

                      <div className="space-y-1.5 pt-1">
                        <p className="text-[11px] text-[#6B6B73]">Options (Select the radio button for your true answer):</p>
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
                              className="accent-[#6C63FF]"
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
                              className="flex-1 px-2.5 py-1 rounded bg-white border border-[#E7E5E0] text-xs text-[#1E1E24]"
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
                <div className="space-y-3 pt-2 border-t border-[#E7E5E0]">
                  <p className="text-xs font-bold text-[#2E7D4E] font-display">Enter Three Statements (Mark which one is the LIE):</p>
                  {createTtlStatements.map((stmt, sIdx) => (
                    <div key={sIdx} className="p-3 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#1E1E24]">Statement {sIdx + 1}</span>
                        <label className="flex items-center gap-1.5 text-xs text-[#FF6B6B] font-bold cursor-pointer">
                          <input
                            type="radio"
                            name="ttl_lie_choice"
                            checked={createTtlLieIndex === sIdx}
                            onChange={() => setCreateTtlLieIndex(sIdx)}
                            className="accent-[#FF6B6B]"
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
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E7E5E0] text-xs text-[#1E1E24]"
                        required
                      />
                    </div>
                  ))}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1E1E24]">Story Behind The Lie (Debrief explanation):</label>
                    <input
                      type="text"
                      value={createTtlExplanation}
                      onChange={(e) => setCreateTtlExplanation(e.target.value)}
                      placeholder="Explain why the lie is false and share the real story..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E0] text-xs text-[#1E1E24]"
                    />
                  </div>
                </div>
              )}

              {/* ================= BUILDER C: EMOJI RIDDLE ================= */}
              {createType === 'emoji_challenge' && (
                <div className="space-y-3 pt-2 border-t border-[#E7E5E0]">
                  <p className="text-xs font-bold text-[#6C63FF] font-display">Create Your Emoji Riddle:</p>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1E1E24]">Emojis (e.g. 🦁 👑 🎬)</label>
                    <input
                      type="text"
                      value={createEmojiString}
                      onChange={(e) => setCreateEmojiString(e.target.value)}
                      placeholder="Paste emojis here..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E0] text-lg text-[#1E1E24]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1E1E24]">Category</label>
                      <input
                        type="text"
                        value={createEmojiCategory}
                        onChange={(e) => setCreateEmojiCategory(e.target.value)}
                        placeholder="e.g. Movies, Songs"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E0] text-xs text-[#1E1E24]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1E1E24]">Correct Answer</label>
                      <input
                        type="text"
                        value={createEmojiAnswer}
                        onChange={(e) => setCreateEmojiAnswer(e.target.value)}
                        placeholder="The Lion King"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E0] text-xs text-[#1E1E24]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1E1E24]">Hint (optional)</label>
                    <input
                      type="text"
                      value={createEmojiHint}
                      onChange={(e) => setCreateEmojiHint(e.target.value)}
                      placeholder="Give a subtle hint for players..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E0] text-xs text-[#1E1E24]"
                    />
                  </div>
                </div>
              )}

              {/* ================= BUILDER D: PICTURE MYSTERY ================= */}
              {createType === 'picture_mystery' && (
                <div className="space-y-3 pt-2 border-t border-[#E7E5E0]">
                  <p className="text-xs font-bold text-[#0284C7] font-display">Create Your Picture Mystery:</p>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1E1E24]">Image URL</label>
                    <input
                      type="url"
                      value={createPicImageUrl}
                      onChange={(e) => setCreatePicImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E0] text-xs text-[#1E1E24]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1E1E24]">Category</label>
                      <input
                        type="text"
                        value={createPicCategory}
                        onChange={(e) => setCreatePicCategory(e.target.value)}
                        placeholder="e.g. Architecture, Nature"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E0] text-xs text-[#1E1E24]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1E1E24]">Correct Answer</label>
                      <input
                        type="text"
                        value={createPicAnswer}
                        onChange={(e) => setCreatePicAnswer(e.target.value)}
                        placeholder="Golden Gate Bridge"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E0] text-xs text-[#1E1E24]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1E1E24]">Clue / Hint (optional)</label>
                    <input
                      type="text"
                      value={createPicHint}
                      onChange={(e) => setCreatePicHint(e.target.value)}
                      placeholder="e.g. Built in 1937 in Northern California"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E0] text-xs text-[#1E1E24]"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E7E5E0]">
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
