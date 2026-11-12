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
        setSuccessNotice('Draft generated with Gemini AI! Review and edit before posting.');
        setAiMode(null);
      } else {
        setErrorMessage(res?.message || 'Failed to generate post draft.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error occurred while communicating with Gemini AI.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiImprove = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    const trimmed = content.trim();
    if (!trimmed) {
      setErrorMessage('Please enter some text in the composer first.');
      return;
    }

    setAiLoading(true);
    try {
      const res = await aiService.improvePost({
        content: trimmed,
        tone: aiTone,
        instructions: aiInstructions.trim() || undefined
      });

      if (res?.success && res.improved) {
        setContent(res.improved);
        setSuccessNotice('Draft polished with Gemini AI!');
        setAiMode(null);
      } else {
        setErrorMessage(res?.message || 'Failed to improve post draft.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error occurred while communicating with Gemini AI.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Card className="border-[#2D2938] bg-[#1E1B26] shadow-xl">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Email Verification Banner */}
        {isUnverified && (
          <div className="p-3 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257] flex items-center justify-between">
            <span>Your email address is unverified. Verify your email to create posts.</span>
            <Link
              href={ROUTES.AUTH.VERIFY_EMAIL}
              className="underline font-semibold hover:text-[#F6F2EA] ml-2"
            >
              Verify Email
            </Link>
          </div>
        )}

        {/* Dynamic Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257] flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="text-[#777580] hover:text-[#F6F2EA] ml-2 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {successNotice && (
          <div className="p-3 rounded-xl bg-[#D5F36A]/10 border border-[#D5F36A]/30 text-xs text-[#D5F36A] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Icon name="check" className="w-4 h-4 text-[#D5F36A] shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessNotice('')}
              className="text-[#777580] hover:text-[#F6F2EA] ml-2 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Post Format Selector */}
        <div className="flex items-center gap-1.5 pb-2 border-b border-[#2D2938]">
          <button
            type="button"
            onClick={() => setPostFormat('normal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              postFormat === 'normal'
                ? 'bg-[#1E1B26] text-[#F6F2EA] border border-[#2D2938] shadow-sm'
                : 'text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26]/50'
            }`}
          >
            <Icon name="feed" className="w-3.5 h-3.5 text-[#FF6257]" />
            <span>Community Post</span>
          </button>

          <button
            type="button"
            onClick={() => setPostFormat('splitReality')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              postFormat === 'splitReality'
                ? 'bg-[#FF6257] text-[#17151D] shadow-md shadow-[#FF6257]/20 font-display'
                : 'text-[#777580] hover:text-[#FF6257] hover:bg-[#1E1B26]/50'
            }`}
          >
            <Icon
              name="split"
              className={`w-3.5 h-3.5 ${
                postFormat === 'splitReality' ? 'text-[#17151D]' : 'text-[#FF6257]'
              }`}
            />
            <span>🔀 Split-Reality Post</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                postFormat === 'splitReality'
                  ? 'bg-black/20 text-[#17151D]'
                  : 'bg-[#FF6257]/20 text-[#FF6257]'
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
                placeholder="What's happening in your Loop? Share a thought, link, or question..."
                rows={3}
                disabled={loading || aiLoading}
                className="w-full resize-none rounded-xl border border-[#2D2938] bg-[#17151D] p-3 text-sm text-[#F6F2EA] placeholder:text-[#777580] focus:outline-none focus:border-[#FF6257] transition-colors leading-relaxed"
              />
            </div>
          </div>

          {/* AI Helper Drawers */}
          {aiMode === 'generate' && (
            <div className="p-3.5 rounded-xl bg-[#17151D] border border-[#B9A8F5]/30 space-y-3 text-xs animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#F6F2EA] flex items-center gap-1.5 font-display">
                  <Icon name="sparkles" className="w-4 h-4 text-[#B9A8F5]" />
                  Generate Post with Gemini AI
                </span>
                <button
                  type="button"
                  onClick={() => setAiMode(null)}
                  className="text-[#777580] hover:text-[#F6F2EA] font-bold"
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
                  className="w-full rounded-lg border border-[#2D2938] bg-[#1E1B26] px-3 py-2 text-xs text-[#F6F2EA] placeholder:text-[#777580] focus:outline-none focus:border-[#B9A8F5]"
                />

                <input
                  type="text"
                  aria-label="Additional context or keywords"
                  placeholder="Additional context or keywords (optional)..."
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  maxLength={300}
                  disabled={aiLoading}
                  className="w-full rounded-lg border border-[#2D2938] bg-[#1E1B26] px-3 py-2 text-xs text-[#F6F2EA] placeholder:text-[#777580] focus:outline-none focus:border-[#B9A8F5]"
                />

                <div className="flex items-center gap-2">
                  <select
                    value={aiTone}
                    aria-label="AI tone of voice"
                    onChange={(e) => setAiTone(e.target.value)}
                    disabled={aiLoading}
                    className="flex-1 rounded-lg border border-[#2D2938] bg-[#1E1B26] px-2.5 py-1.5 text-xs text-[#F6F2EA] focus:outline-none focus:border-[#B9A8F5]"
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
                    className="flex-1 rounded-lg border border-[#2D2938] bg-[#1E1B26] px-2.5 py-1.5 text-xs text-[#F6F2EA] focus:outline-none focus:border-[#B9A8F5]"
                  >
                    <option value="short">Length: Short</option>
                    <option value="medium">Length: Medium</option>
                    <option value="long">Length: Long</option>
                  </select>

                  <Button
                    type="button"
                    variant="lavender"
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
            <div className="p-3.5 rounded-xl bg-[#17151D] border border-[#FF6257]/30 space-y-3 text-xs animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#F6F2EA] flex items-center gap-1.5 font-display">
                  <Icon name="sparkles" className="w-4 h-4 text-[#FF6257]" />
                  Improve Draft with Gemini AI
                </span>
                <button
                  type="button"
                  onClick={() => setAiMode(null)}
                  className="text-[#777580] hover:text-[#F6F2EA] font-bold"
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
                  className="w-full rounded-lg border border-[#2D2938] bg-[#1E1B26] px-3 py-2 text-xs text-[#F6F2EA] placeholder:text-[#777580] focus:outline-none focus:border-[#FF6257]"
                />

                <div className="flex items-center gap-2">
                  <select
                    value={aiTone}
                    aria-label="Target improvement tone"
                    onChange={(e) => setAiTone(e.target.value)}
                    disabled={aiLoading}
                    className="flex-1 rounded-lg border border-[#2D2938] bg-[#1E1B26] px-2.5 py-1.5 text-xs text-[#F6F2EA] focus:outline-none focus:border-[#FF6257]"
                  >
                    <option value="insightful">Tone: Insightful</option>
                    <option value="casual">Tone: Casual</option>
                    <option value="professional">Tone: Professional</option>
                    <option value="humorous">Tone: Humorous</option>
                    <option value="inspiring">Tone: Inspiring</option>
                  </select>

                  <Button
                    type="button"
                    variant="primary"
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

          <div className="pt-2 border-t border-[#2D2938] flex items-center justify-between gap-3 text-xs text-[#777580]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAiMode(aiMode === 'generate' ? null : 'generate')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${aiMode === 'generate'
                  ? 'bg-[#B9A8F5]/15 text-[#B9A8F5] border border-[#B9A8F5]/30'
                  : 'bg-[#17151D] border border-[#2D2938] hover:border-[#B9A8F5]/40 text-[#777580] hover:text-[#B9A8F5]'
                  }`}
                title="Draft a post with Gemini AI"
              >
                <Icon name="sparkles" className="w-3.5 h-3.5 text-[#B9A8F5]" />
                <span>AI Draft</span>
              </button>

              <button
                type="button"
                onClick={() => setAiMode(aiMode === 'improve' ? null : 'improve')}
                disabled={!content.trim()}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${aiMode === 'improve'
                  ? 'bg-[#FF6257]/15 text-[#FF6257] border border-[#FF6257]/30'
                  : 'bg-[#17151D] border border-[#2D2938] hover:border-[#FF6257]/40 text-[#777580] hover:text-[#FF6257] disabled:opacity-40 disabled:hover:bg-[#17151D] disabled:hover:text-[#777580] disabled:cursor-not-allowed'
                  }`}
                title={content.trim() ? "Improve draft with Gemini AI" : "Write text to enable AI polish"}
              >
                <Icon name="sparkles" className="w-3.5 h-3.5 text-[#FF6257]" />
                <span>AI Polish</span>
              </button>

              <span
                className={`text-[11px] font-medium ml-2 ${isOverLimit
                  ? 'text-[#FF6257] font-bold'
                  : charCount > 900
                    ? 'text-[#D5F36A]'
                    : 'text-[#777580]'
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
