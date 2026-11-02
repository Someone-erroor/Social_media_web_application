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
    <Card className="border-[#263640] bg-[#151F29] shadow-md transition-all duration-300 hover:border-[#19D3E3]/40 hover:shadow-lg hover:shadow-[#19D3E3]/5">
      <CardContent className="p-4 sm:p-5 space-y-3">
        {isUnverified && (
          <div className="p-3 rounded-xl bg-[#F5B942]/10 border border-[#F5B942]/30 text-xs text-[#F5B942] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="alertCircle" className="w-4 h-4 text-[#F5B942] shrink-0" />
              <span>Your email is not verified yet. Verify to publish posts.</span>
            </div>
            <Link
              href={ROUTES.PUBLIC.VERIFY_EMAIL}
              className="font-semibold underline hover:text-[#F4F8FA] ml-2 shrink-0"
            >
              Verify now
            </Link>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-[#FF5C70]/10 border border-[#FF5C70]/30 text-xs text-[#FF5C70] flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="text-[#9BAAB4] hover:text-[#F4F8FA] ml-2 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {successNotice && (
          <div className="p-3 rounded-xl bg-[#32D583]/10 border border-[#32D583]/30 text-xs text-[#32D583] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Icon name="check" className="w-4 h-4 text-[#32D583] shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessNotice('')}
              className="text-[#9BAAB4] hover:text-[#F4F8FA] ml-2 font-bold"
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
                className="w-full resize-none rounded-xl border border-[#263640] bg-[#101A22] p-3 text-sm text-[#F4F8FA] placeholder:text-[#9BAAB4] focus:outline-none focus:border-[#19D3E3] transition-colors"
              />
            </div>
          </div>

          {/* AI Helper Drawers */}
          {aiMode === 'generate' && (
            <div className="p-3.5 rounded-xl bg-[#101A22] border border-[#19D3E3]/30 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#F4F8FA] flex items-center gap-1.5">
                  <Icon name="sparkles" className="w-4 h-4 text-[#19D3E3]" />
                  Generate Post with Gemini AI
                </span>
                <button
                  type="button"
                  onClick={() => setAiMode(null)}
                  className="text-[#9BAAB4] hover:text-[#F4F8FA] font-bold"
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
                  className="w-full rounded-lg border border-[#263640] bg-[#151F29] px-3 py-2 text-xs text-[#F4F8FA] placeholder:text-[#9BAAB4] focus:outline-none focus:border-[#19D3E3]"
                />

                <input
                  type="text"
                  aria-label="Additional context or keywords"
                  placeholder="Additional context or keywords (optional)..."
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  maxLength={300}
                  disabled={aiLoading}
                  className="w-full rounded-lg border border-[#263640] bg-[#151F29] px-3 py-2 text-xs text-[#F4F8FA] placeholder:text-[#9BAAB4] focus:outline-none focus:border-[#19D3E3]"
                />

                <div className="flex items-center gap-2">
                  <select
                    value={aiTone}
                    aria-label="AI tone of voice"
                    onChange={(e) => setAiTone(e.target.value)}
                    disabled={aiLoading}
                    className="flex-1 rounded-lg border border-[#263640] bg-[#151F29] px-2.5 py-1.5 text-xs text-[#F4F8FA] focus:outline-none focus:border-[#19D3E3]"
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
                    className="flex-1 rounded-lg border border-[#263640] bg-[#151F29] px-2.5 py-1.5 text-xs text-[#F4F8FA] focus:outline-none focus:border-[#19D3E3]"
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
            <div className="p-3.5 rounded-xl bg-[#101A22] border border-[#FF6F61]/30 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#F4F8FA] flex items-center gap-1.5">
                  <Icon name="sparkles" className="w-4 h-4 text-[#FF6F61]" />
                  Improve Post with Gemini AI
                </span>
                <button
                  type="button"
                  onClick={() => setAiMode(null)}
                  className="text-[#9BAAB4] hover:text-[#F4F8FA] font-bold"
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
                  className="w-full rounded-lg border border-[#263640] bg-[#151F29] px-3 py-2 text-xs text-[#F4F8FA] placeholder:text-[#9BAAB4] focus:outline-none focus:border-[#FF6F61]"
                />

                <div className="flex items-center gap-2">
                  <select
                    value={aiTone}
                    aria-label="Target improvement tone"
                    onChange={(e) => setAiTone(e.target.value)}
                    disabled={aiLoading}
                    className="flex-1 rounded-lg border border-[#263640] bg-[#151F29] px-2.5 py-1.5 text-xs text-[#F4F8FA] focus:outline-none focus:border-[#FF6F61]"
                  >
                    <option value="insightful">Tone: Insightful</option>
                    <option value="casual">Tone: Casual</option>
                    <option value="professional">Tone: Professional</option>
                    <option value="humorous">Tone: Humorous</option>
                    <option value="inspiring">Tone: Inspiring</option>
                  </select>

                  <Button
                    type="button"
                    variant="coral"
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

          <div className="pt-2 border-t border-[#263640] flex items-center justify-between gap-3 text-xs text-[#9BAAB4]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAiMode(aiMode === 'generate' ? null : 'generate')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  aiMode === 'generate'
                    ? 'bg-[#19D3E3]/15 text-[#19D3E3] border border-[#19D3E3]/30 font-semibold'
                    : 'bg-[#101A22] border border-[#263640] hover:border-[#19D3E3]/40 text-[#9BAAB4] hover:text-[#19D3E3]'
                }`}
                title="Draft a post with Gemini AI"
              >
                <Icon name="sparkles" className="w-3.5 h-3.5 text-[#19D3E3]" />
                <span>AI Draft</span>
              </button>

              <button
                type="button"
                onClick={() => setAiMode(aiMode === 'improve' ? null : 'improve')}
                disabled={!content.trim()}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  aiMode === 'improve'
                    ? 'bg-[#FF6F61]/15 text-[#FF6F61] border border-[#FF6F61]/30 font-semibold'
                    : 'bg-[#101A22] border border-[#263640] hover:border-[#FF6F61]/40 text-[#9BAAB4] hover:text-[#FF6F61] disabled:opacity-40 disabled:hover:bg-[#101A22] disabled:hover:text-[#9BAAB4] disabled:cursor-not-allowed'
                }`}
                title={content.trim() ? "Improve draft with Gemini AI" : "Write text to enable AI polish"}
              >
                <Icon name="sparkles" className="w-3.5 h-3.5 text-[#FF6F61]" />
                <span>AI Polish</span>
              </button>

              <span
                className={`text-[11px] font-medium ml-2 ${
                  isOverLimit
                    ? 'text-[#FF5C70] font-bold'
                    : charCount > 900
                    ? 'text-[#F5B942]'
                    : 'text-[#9BAAB4]'
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
