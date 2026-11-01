'use client';

import { useState } from 'react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthContext';
import { postService } from '@/services/postService';
import { aiService } from '@/services/aiService';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

export default function PostComposer({ onPostCreated }) {
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
      const res = await postService.createPost({ content: trimmed });
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

      if (res.generatedContent) {
        setContent(res.generatedContent);
        setSuccessNotice('AI draft loaded into composer! Review and edit before publishing.');
        setAiMode(null);
        setAiTopic('');
        setAiContext('');
      } else {
        setErrorMessage(res.message || 'AI generation failed to return content.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to generate post with AI.');
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
      setErrorMessage('Please write some content first before asking AI to improve it.');
      return;
    }

    setAiLoading(true);
    try {
      const res = await aiService.improvePost({
        content: trimmed,
        tone: aiTone,
        instructions: aiInstructions.trim() || undefined
      });

      if (res.improvedContent) {
        setContent(res.improvedContent);
        setSuccessNotice('Post improved with AI! Review and edit before publishing.');
        setAiMode(null);
        setAiInstructions('');
      } else {
        setErrorMessage(res.message || 'AI improvement failed to return content.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to improve post with AI.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-xs">
      <CardContent className="p-4 sm:p-5 space-y-3">
        {isUnverified && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="alertCircle" className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Your email is not verified yet. Verify to publish posts.</span>
            </div>
            <Link
              href={ROUTES.PUBLIC.VERIFY_EMAIL}
              className="font-semibold underline hover:text-amber-900 ml-2 shrink-0"
            >
              Verify now
            </Link>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="text-red-500 hover:text-red-700 ml-2 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {successNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Icon name="check" className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessNotice('')}
              className="text-emerald-500 hover:text-emerald-700 ml-2 font-bold"
            >
              ×
            </button>
          </div>
        )}

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
                aria-label="What is happening? Share your thoughts"
                placeholder="What is happening? Share your thoughts..."
                rows={3}
                disabled={loading || aiLoading}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* AI Helper Drawers */}
          {aiMode === 'generate' && (
            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-indigo-900 flex items-center gap-1.5">
                  <Icon name="sparkles" className="w-4 h-4 text-indigo-600" />
                  Generate Post with Gemini AI
                </span>
                <button
                  type="button"
                  onClick={() => setAiMode(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
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
                  className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />

                <input
                  type="text"
                  aria-label="Additional context or keywords"
                  placeholder="Additional context or keywords (optional)..."
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  maxLength={300}
                  disabled={aiLoading}
                  className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />

                <div className="flex items-center gap-2">
                  <select
                    value={aiTone}
                    aria-label="AI tone of voice"
                    onChange={(e) => setAiTone(e.target.value)}
                    disabled={aiLoading}
                    className="flex-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="casual">Tone: Casual</option>
                    <option value="professional">Tone: Professional</option>
                    <option value="humorous">Tone: Humorous</option>
                    <option value="insightful">Tone: Insightful</option>
                    <option value="inspiring">Tone: Inspiring</option>
                  </select>

                  <select
                    value={aiLength}
                    aria-label="Target length"
                    onChange={(e) => setAiLength(e.target.value)}
                    disabled={aiLoading}
                    className="flex-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="short">Length: Short (&lt; 150 chars)</option>
                    <option value="medium">Length: Medium (150-400 chars)</option>
                    <option value="long">Length: Long (400-800 chars)</option>
                  </select>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAiGenerate}
                    disabled={aiLoading || !aiTopic.trim()}
                    className="shrink-0"
                  >
                    {aiLoading ? 'Drafting...' : 'Draft'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {aiMode === 'improve' && (
            <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-purple-900 flex items-center gap-1.5">
                  <Icon name="sparkles" className="w-4 h-4 text-purple-600" />
                  Improve Post with Gemini AI
                </span>
                <button
                  type="button"
                  onClick={() => setAiMode(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
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
                  className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                />

                <div className="flex items-center gap-2">
                  <select
                    value={aiTone}
                    aria-label="Target improvement tone"
                    onChange={(e) => setAiTone(e.target.value)}
                    disabled={aiLoading}
                    className="flex-1 rounded-lg border border-purple-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-purple-500"
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
                    className="shrink-0 bg-purple-600 hover:bg-purple-700"
                  >
                    {aiLoading ? 'Improving...' : 'Improve'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAiMode(aiMode === 'generate' ? null : 'generate')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  aiMode === 'generate'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600'
                }`}
                title="Draft a post with Gemini AI"
              >
                <Icon name="sparkles" className="w-3.5 h-3.5 text-indigo-500" />
                <span>AI Draft</span>
              </button>

              <button
                type="button"
                onClick={() => setAiMode(aiMode === 'improve' ? null : 'improve')}
                disabled={!content.trim()}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  aiMode === 'improve'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-600 disabled:opacity-40 disabled:hover:bg-slate-100 disabled:hover:text-slate-600 disabled:cursor-not-allowed'
                }`}
                title={content.trim() ? "Improve draft with Gemini AI" : "Write text to enable AI polish"}
              >
                <Icon name="sparkles" className="w-3.5 h-3.5 text-purple-500" />
                <span>AI Polish</span>
              </button>

              <span
                className={`text-[11px] font-medium ml-2 ${
                  isOverLimit
                    ? 'text-red-600 font-bold'
                    : charCount > 900
                    ? 'text-amber-600'
                    : 'text-slate-600'
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
      </CardContent>
    </Card>
  );
}
