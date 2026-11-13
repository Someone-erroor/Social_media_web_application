'use client';

import { useState } from 'react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthContext';
import { postService } from '@/services/postService';
import { aiService } from '@/services/aiService';
import SplitRealityComposer from './SplitRealityComposer';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

export default function PostComposer({ onPostCreated, defaultCircleId = null }) {
  const { user } = useAuth();
  const [content, setContent] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const draft = sessionStorage.getItem('looply_draft_post');
        if (draft) {
          sessionStorage.removeItem('looply_draft_post');
          return draft;
        }
      } catch (e) {
        // storage unavailable
      }
    }
    return '';
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [postFormat, setPostFormat] = useState('normal'); // 'normal' | 'splitReality'

  // AI Panel state
  const [aiMode, setAiMode] = useState(null); // 'generate' | 'improve' | null
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [aiTone, setAiTone] = useState('casual');
  const [aiLength, setAiLength] = useState('medium');
  const [aiInstructions, setAiInstructions] = useState('');

  const charCount = content.length;
  const isOverLimit = charCount > 1000;
  const isUnverified = user && user.isEmailVerified === false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    if (isUnverified) {
      setErrorMessage('Please verify your email address before publishing posts.');
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      setErrorMessage('Post content cannot be empty.');
      return;
    }

    if (trimmed.length > 1000) {
      setErrorMessage('Post content exceeds the 1000 character limit.');
      return;
    }

    setLoading(true);

    try {
      const res = await postService.createPost({
        content: trimmed,
        circle: defaultCircleId || undefined
      });
      setContent('');
      setAiMode(null);
      if (onPostCreated && res.post) {
        onPostCreated(res.post);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to publish post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAiGenerate = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    if (!aiTopic.trim()) {
      setErrorMessage('Please provide a topic for AI post generation.');
      return;
    }

    setAiLoading(true);
    try {
      const res = await aiService.generatePost({
        topic: aiTopic.trim(),
        context: aiContext.trim() || undefined,
        tone: aiTone,
        length: aiLength
      });
      if (res?.success && res.content) {
        setContent(res.content);
        setAiMode(null);
        setSuccessNotice('Gemini AI drafted your post! Feel free to customize it.');
      } else {
        throw new Error(res?.message || 'Failed to generate post draft.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'AI generation failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiImprove = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    if (!content.trim()) {
      setErrorMessage('Please enter some text in the composer before asking AI to improve it.');
      return;
    }

    setAiLoading(true);
    try {
      const res = await aiService.improveDraft({
        draft: content.trim(),
        tone: aiTone,
        instructions: aiInstructions.trim() || undefined
      });
      if (res?.success && res.improved) {
        setContent(res.improved);
        setAiMode(null);
        setSuccessNotice('Draft improved by Gemini AI! Review and publish when ready.');
      } else {
        throw new Error(res?.message || 'Failed to polish draft.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'AI polish failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Card className="border-[#E7E5E0] bg-white shadow-xs">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Email Verification Banner */}
        {isUnverified && (
          <div className="p-3 rounded-xl bg-[#FFEAEA] border border-[#FF6B6B]/30 text-xs text-[#FF6B6B] flex items-center justify-between">
            <span>Your email address is unverified. Verify your email to create posts.</span>
            <Link
              href={ROUTES.AUTH.VERIFY_EMAIL}
              className="underline font-semibold hover:text-[#1E1E24] ml-2"
            >
              Verify Email
            </Link>
          </div>
        )}

        {/* Dynamic Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-[#FFEAEA] border border-[#FF6B6B]/30 text-xs text-[#FF6B6B] flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="text-[#6B6B73] hover:text-[#1E1E24] ml-2 font-bold cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {successNotice && (
          <div className="p-3 rounded-xl bg-[#E8F7EE] border border-[#4CAF78]/30 text-xs text-[#2E7D4E] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Icon name="check" className="w-4 h-4 text-[#4CAF78] shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessNotice('')}
              className="text-[#6B6B73] hover:text-[#1E1E24] ml-2 font-bold cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Post Format Selector */}
        <div className="flex items-center gap-1.5 pb-2 border-b border-[#E7E5E0]">
          <button
            type="button"
            onClick={() => setPostFormat('normal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              postFormat === 'normal'
                ? 'bg-[#EEEAFE] text-[#6C63FF] shadow-2xs'
                : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC]'
            }`}
          >
            <Icon name="feed" className="w-3.5 h-3.5 text-[#6C63FF]" />
            <span>Community Post</span>
          </button>

          <button
            type="button"
            onClick={() => setPostFormat('splitReality')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              postFormat === 'splitReality'
                ? 'bg-[#6C63FF] text-white shadow-xs font-display'
                : 'text-[#6B6B73] hover:text-[#6C63FF] hover:bg-[#F1F0EC]'
            }`}
          >
            <Icon
              name="split"
              className={`w-3.5 h-3.5 ${
                postFormat === 'splitReality' ? 'text-white' : 'text-[#6C63FF]'
              }`}
            />
            <span>🔀 Split-Reality Post</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                postFormat === 'splitReality'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#EEEAFE] text-[#6C63FF]'
              }`}
            >
              New
            </span>
          </button>
        </div>

        {postFormat === 'splitReality' ? (
          <SplitRealityComposer
            onCancel={() => setPostFormat('normal')}
            onPostCreated={(newPost) => {
              setPostFormat('normal');
              setSuccessNotice('Split-Reality post published successfully!');
              if (onPostCreated) onPostCreated(newPost);
            }}
            defaultCircleId={defaultCircleId}
            isUnverified={isUnverified}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-start gap-3">
              <Avatar
                name={user?.fullName || 'User'}
                src={user?.profile?.avatarUrl}
                size="md"
                status="online"
              />
              <div className="flex-1 min-w-0">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  aria-label="What's happening in your Loop?"
                  placeholder="What's on your mind? Share a thought, link, or question..."
                  rows={3}
                  disabled={loading || aiLoading}
                  className="w-full resize-none rounded-xl border border-[#E7E5E0] bg-[#F8F7F4] p-3 text-sm text-[#1E1E24] placeholder:text-[#6B6B73]/60 focus:outline-none focus:bg-white focus:border-[#6C63FF] transition-all leading-relaxed"
                />
              </div>
            </div>

            {/* AI Helper Drawers */}
            {aiMode === 'generate' && (
              <div className="p-3.5 rounded-xl bg-[#EEEAFE] border border-[#6C63FF]/30 space-y-3 text-xs animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E1E24] flex items-center gap-1.5 font-display">
                    <Icon name="sparkles" className="w-4 h-4 text-[#6C63FF]" />
                    Generate Post with Gemini AI
                  </span>
                  <button
                    type="button"
                    onClick={() => setAiMode(null)}
                    className="text-[#6B6B73] hover:text-[#1E1E24] font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    aria-label="Topic or main idea for AI generation"
                    placeholder="Topic or main idea (e.g. Tips for junior developers)..."
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    maxLength={200}
                    disabled={aiLoading}
                    className="w-full rounded-lg border border-[#E7E5E0] bg-white px-3 py-2 text-xs text-[#1E1E24] placeholder:text-[#6B6B73]/60 focus:outline-none focus:border-[#6C63FF]"
                  />

                  <input
                    type="text"
                    aria-label="Additional context or keywords"
                    placeholder="Additional context or keywords (optional)..."
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                    maxLength={300}
                    disabled={aiLoading}
                    className="w-full rounded-lg border border-[#E7E5E0] bg-white px-3 py-2 text-xs text-[#1E1E24] placeholder:text-[#6B6B73]/60 focus:outline-none focus:border-[#6C63FF]"
                  />

                  <div className="flex items-center gap-2">
                    <select
                      value={aiTone}
                      aria-label="AI tone of voice"
                      onChange={(e) => setAiTone(e.target.value)}
                      disabled={aiLoading}
                      className="flex-1 rounded-lg border border-[#E7E5E0] bg-white px-2.5 py-1.5 text-xs text-[#1E1E24] focus:outline-none focus:border-[#6C63FF]"
                    >
                      <option value="casual">Tone: Casual</option>
                      <option value="professional">Tone: Professional</option>
                      <option value="humorous">Tone: Humorous</option>
                      <option value="insightful">Tone: Insightful</option>
                      <option value="inspiring">Tone: Inspiring</option>
                    </select>

                    <select
                      value={aiLength}
                      aria-label="AI post length"
                      onChange={(e) => setAiLength(e.target.value)}
                      disabled={aiLoading}
                      className="flex-1 rounded-lg border border-[#E7E5E0] bg-white px-2.5 py-1.5 text-xs text-[#1E1E24] focus:outline-none focus:border-[#6C63FF]"
                    >
                      <option value="short">Length: Short</option>
                      <option value="medium">Length: Medium</option>
                      <option value="long">Length: Long</option>
                    </select>

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleAiGenerate}
                      disabled={aiLoading || !aiTopic.trim()}
                      className="shrink-0"
                    >
                      {aiLoading ? 'Generating...' : 'Generate'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {aiMode === 'improve' && (
              <div className="p-3.5 rounded-xl bg-[#FFF7E0] border border-[#FFD166]/40 space-y-3 text-xs animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E1E24] flex items-center gap-1.5 font-display">
                    <Icon name="sparkles" className="w-4 h-4 text-[#B28200]" />
                    Improve Draft with Gemini AI
                  </span>
                  <button
                    type="button"
                    onClick={() => setAiMode(null)}
                    className="text-[#6B6B73] hover:text-[#1E1E24] font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    aria-label="Optional instructions for AI improvement"
                    placeholder="Optional instructions (e.g. Make it punchier, fix grammar)..."
                    value={aiInstructions}
                    onChange={(e) => setAiInstructions(e.target.value)}
                    maxLength={300}
                    disabled={aiLoading}
                    className="w-full rounded-lg border border-[#E7E5E0] bg-white px-3 py-2 text-xs text-[#1E1E24] placeholder:text-[#6B6B73]/60 focus:outline-none focus:border-[#6C63FF]"
                  />

                  <div className="flex items-center gap-2">
                    <select
                      value={aiTone}
                      aria-label="Target improvement tone"
                      onChange={(e) => setAiTone(e.target.value)}
                      disabled={aiLoading}
                      className="flex-1 rounded-lg border border-[#E7E5E0] bg-white px-2.5 py-1.5 text-xs text-[#1E1E24] focus:outline-none focus:border-[#6C63FF]"
                    >
                      <option value="insightful">Tone: Insightful</option>
                      <option value="casual">Tone: Casual</option>
                      <option value="professional">Tone: Professional</option>
                      <option value="humorous">Tone: Humorous</option>
                      <option value="inspiring">Tone: Inspiring</option>
                    </select>

                    <Button
                      type="button"
                      variant="yellow"
                      size="sm"
                      onClick={handleAiImprove}
                      disabled={aiLoading || !content.trim()}
                      className="shrink-0"
                    >
                      {aiLoading ? 'Improving...' : 'Improve'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#E7E5E0] flex items-center justify-between gap-3 text-xs text-[#6B6B73]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAiMode(aiMode === 'generate' ? null : 'generate')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    aiMode === 'generate'
                      ? 'bg-[#EEEAFE] text-[#6C63FF] border border-[#6C63FF]/30'
                      : 'bg-[#F1F0EC] border border-[#E7E5E0] text-[#6B6B73] hover:text-[#6C63FF]'
                  }`}
                  title="Draft a post with Gemini AI"
                >
                  <Icon name="sparkles" className="w-3.5 h-3.5 text-[#6C63FF]" />
                  <span>AI Draft</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAiMode(aiMode === 'improve' ? null : 'improve')}
                  disabled={!content.trim()}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    aiMode === 'improve'
                      ? 'bg-[#FFF7E0] text-[#B28200] border border-[#FFD166]/40'
                      : 'bg-[#F1F0EC] border border-[#E7E5E0] text-[#6B6B73] hover:text-[#B28200] disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                  title={content.trim() ? 'Improve draft with Gemini AI' : 'Write text to enable AI polish'}
                >
                  <Icon name="sparkles" className="w-3.5 h-3.5 text-[#B28200]" />
                  <span>AI Polish</span>
                </button>

                <span
                  className={`text-[11px] font-medium ml-2 ${
                    isOverLimit
                      ? 'text-[#FF6B6B] font-bold'
                      : charCount > 900
                      ? 'text-[#B28200]'
                      : 'text-[#6B6B73]'
                  }`}
                >
                  {charCount} / 1000
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={loading || aiLoading || !content.trim() || isOverLimit}
              >
                {loading ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
