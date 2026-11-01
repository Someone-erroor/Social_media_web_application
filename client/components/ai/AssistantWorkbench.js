'use client';

import { useState } from 'react';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { aiService } from '@/services/aiService';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

/**
 * Categorizes and formats errors into canonical user-facing guidance.
 *
 * @param {any} err
 * @returns {{ message: string, canRetry: boolean }}
 */
const formatAiError = (err) => {
  const status = err?.status;
  const data = err?.data;
  const code = data?.code || '';
  const category = data?.category || '';
  const rawMsg = String(err?.message || '');

  // 1. Daily Quota Exhausted
  if (category === 'DAILY_QUOTA_EXHAUSTED' || /daily quota/i.test(rawMsg)) {
    return {
      message: 'Gemini daily quota has been exhausted. Check your Google AI Studio usage limits.',
      canRetry: false
    };
  }

  // 2. Rate Limit (RPM / TPM / Resource Exhausted)
  if (
    status === 429 ||
    category === 'RATE_LIMIT_RPM' ||
    category === 'RATE_LIMIT_TPM' ||
    category === 'RESOURCE_EXHAUSTED_GENERAL' ||
    code === 'GEMINI_RESOURCE_EXHAUSTED' ||
    /resource_exhausted|rate limit/i.test(rawMsg)
  ) {
    return {
      message: data?.message || 'Gemini request limit reached. Please retry after the indicated time.',
      canRetry: true
    };
  }

  // 3. Invalid Credentials or Permission Denied
  if (
    code === 'GEMINI_AUTH_FAILED' ||
    code === 'GEMINI_PERMISSION_DENIED' ||
    status === 401 ||
    (status === 403 && /authentication|API key|permission/i.test(rawMsg)) ||
    /API key not valid|UNAUTHENTICATED/i.test(rawMsg)
  ) {
    return {
      message: 'Gemini API authentication failed. The administrator must verify API configuration.',
      canRetry: false
    };
  }

  // 4. Model Error
  if (status === 404 || code === 'GEMINI_MODEL_NOT_FOUND' || /model.*unavailable|not found/i.test(rawMsg)) {
    return {
      message: 'The configured Gemini model is unavailable.',
      canRetry: false
    };
  }

  // 5. Provider Unavailable
  if (status === 503 && (code === 'GEMINI_UNAVAILABLE' || /temporarily unavailable|overloaded/i.test(rawMsg))) {
    return {
      message: 'Google Gemini is temporarily unavailable.',
      canRetry: true
    };
  }

  // 6. Network Error
  if (
    err?.isNetworkError ||
    status === 0 ||
    code === 'GEMINI_NETWORK_ERROR' ||
    /Unable to reach the AI service|network/i.test(rawMsg)
  ) {
    return {
      message: 'Unable to reach the AI service.',
      canRetry: true
    };
  }

  // 7. Timeout
  if (status === 504 || code === 'GEMINI_TIMEOUT' || /timeout|timed out/i.test(rawMsg)) {
    return {
      message: 'Google Gemini request timed out. Please try again.',
      canRetry: true
    };
  }

  // Fallback
  return {
    message: rawMsg || 'An error occurred while contacting the AI service.',
    canRetry: true
  };
};

export default function AssistantWorkbench() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' | 'improve'

  // Generator form
  const [topic, setTopic] = useState('');
  const [context, setContext] = useState('');
  const [tone, setTone] = useState('insightful');
  const [length, setLength] = useState('medium');

  // Improver form
  const [contentToImprove, setContentToImprove] = useState('');
  const [instructions, setInstructions] = useState('');

  // Execution state
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(null); // { message: string, canRetry: boolean }
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const suggestions = [
    {
      title: 'Tech Insights',
      topic: 'Clean code and performance optimization in full-stack web applications',
      tone: 'insightful'
    },
    {
      title: 'Career Advice',
      topic: 'Key lessons learned transitioning from junior to senior engineer',
      tone: 'inspiring'
    },
    {
      title: 'Product Announcement',
      topic: 'Launching a new real-time social feature on our web platform',
      tone: 'professional'
    },
    {
      title: 'Developer Humor',
      topic: 'Fixing bugs on Friday afternoon and deploying to production',
      tone: 'humorous'
    }
  ];

  const handleApplySuggestion = (s) => {
    setActiveTab('generate');
    setTopic(s.topic);
    setTone(s.tone);
    setErrorState(null);
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    setErrorState(null);
    setResult(null);

    if (!topic.trim()) {
      setErrorState({
        message: 'Please provide a topic or prompt for post generation.',
        canRetry: false
      });
      return;
    }

    setLoading(true);
    try {
      const res = await aiService.generatePost({
        topic: topic.trim(),
        context: context.trim() || undefined,
        tone,
        length
      });

      if (res && res.generatedContent) {
        setResult({
          type: 'generated',
          text: res.generatedContent,
          metadata: res.metadata
        });
      } else {
        setErrorState({
          message: res?.message || 'Failed to receive generated post content.',
          canRetry: true
        });
      }
    } catch (err) {
      setErrorState(formatAiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleImprove = async (e) => {
    if (e) e.preventDefault();
    setErrorState(null);
    setResult(null);

    if (!contentToImprove.trim()) {
      setErrorState({
        message: 'Please provide the text you would like AI to polish.',
        canRetry: false
      });
      return;
    }

    setLoading(true);
    try {
      const res = await aiService.improvePost({
        content: contentToImprove.trim(),
        tone,
        instructions: instructions.trim() || undefined
      });

      if (res && res.improvedContent) {
        setResult({
          type: 'improved',
          text: res.improvedContent,
          metadata: res.metadata
        });
      } else {
        setErrorState({
          message: res?.message || 'Failed to receive improved content.',
          canRetry: true
        });
      }
    } catch (err) {
      setErrorState(formatAiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.text) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      setCopied(false);
    }
  };

  const handleSendToFeed = () => {
    if (!result?.text) return;
    try {
      sessionStorage.setItem('looply_draft_post', result.text);
    } catch (e) {}
    router.push(ROUTES.USER.FEED);
  };

  return (
    <div className="space-y-6">
      {/* Workbench Card */}
      <Card className="border-[#263640] bg-[#151F29] shadow-xl shadow-black/40">
        {/* Tab Header */}
        <div className="flex border-b border-[#263640] bg-[#101A22] rounded-t-2xl px-4 pt-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('generate');
              setErrorState(null);
            }}
            className={`flex items-center gap-2 pb-3 px-3.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'generate'
                ? 'border-[#19D3E3] text-[#19D3E3]'
                : 'border-transparent text-[#9BAAB4] hover:text-[#F4F8FA]'
            }`}
          >
            <Icon name="sparkles" className="w-4 h-4 text-[#19D3E3]" />
            <span>Post Generator</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('improve');
              setErrorState(null);
            }}
            className={`flex items-center gap-2 pb-3 px-3.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'improve'
                ? 'border-[#FF6F61] text-[#FF6F61]'
                : 'border-transparent text-[#9BAAB4] hover:text-[#F4F8FA]'
            }`}
          >
            <Icon name="edit" className="w-4 h-4 text-[#FF6F61]" />
            <span>Tone &amp; Clarity Improver</span>
          </button>
        </div>

        <CardContent className="p-5 sm:p-6 space-y-6">
          {/* Error Banner with Optional Retry Button */}
          {errorState && (
            <div className="p-3.5 rounded-xl bg-[#FF5C70]/10 border border-[#FF5C70]/30 text-xs text-[#FF5C70] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <Icon name="alertCircle" className="w-4 h-4 text-[#FF5C70] shrink-0" />
                <span className="font-medium">{errorState.message}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {errorState.canRetry && (
                  <button
                    type="button"
                    onClick={activeTab === 'generate' ? handleGenerate : handleImprove}
                    disabled={loading}
                    className="px-2.5 py-1 rounded-md bg-[#FF5C70]/20 hover:bg-[#FF5C70]/30 text-[#F4F8FA] font-semibold text-[11px] transition-colors"
                  >
                    Retry Request
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setErrorState(null)}
                  className="text-[#9BAAB4] hover:text-[#F4F8FA] font-bold px-1"
                  aria-label="Dismiss error"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {activeTab === 'generate' ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label htmlFor="ai-gen-topic" className="block text-xs font-semibold text-[#F4F8FA] mb-1.5">
                  Topic or Theme <span className="text-[#FF6F61]">*</span>
                </label>
                <input
                  id="ai-gen-topic"
                  type="text"
                  placeholder="e.g. 5 tips for asynchronous communication in remote engineering teams"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  maxLength={200}
                  disabled={loading}
                  className="w-full rounded-xl border border-[#263640] bg-[#101A22] p-3 text-sm text-[#F4F8FA] placeholder:text-[#9BAAB4] focus:outline-none focus:border-[#19D3E3] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="ai-gen-context" className="block text-xs font-semibold text-[#F4F8FA] mb-1.5">
                  Context / Keywords (Optional)
                </label>
                <textarea
                  id="ai-gen-context"
                  placeholder="Additional context, key takeaways, hashtags, or personal anecdotes..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={2}
                  maxLength={500}
                  disabled={loading}
                  className="w-full rounded-xl border border-[#263640] bg-[#101A22] p-3 text-xs text-[#F4F8FA] placeholder:text-[#9BAAB4] focus:outline-none focus:border-[#19D3E3] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ai-gen-tone" className="block text-xs font-semibold text-[#F4F8FA] mb-1.5">
                    Tone of Voice
                  </label>
                  <select
                    id="ai-gen-tone"
                    aria-label="Tone of voice"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-[#263640] bg-[#101A22] p-2.5 text-xs text-[#F4F8FA] focus:outline-none focus:border-[#19D3E3]"
                  >
                    <option value="insightful">Insightful &amp; Analytical</option>
                    <option value="casual">Casual &amp; Friendly</option>
                    <option value="professional">Professional &amp; Authoritative</option>
                    <option value="humorous">Humorous &amp; Playful</option>
                    <option value="inspiring">Inspiring &amp; Motivating</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ai-gen-length" className="block text-xs font-semibold text-[#F4F8FA] mb-1.5">
                    Target Length
                  </label>
                  <select
                    id="ai-gen-length"
                    aria-label="Target length"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-[#263640] bg-[#101A22] p-2.5 text-xs text-[#F4F8FA] focus:outline-none focus:border-[#19D3E3]"
                  >
                    <option value="short">Short (&lt; 150 chars)</option>
                    <option value="medium">Medium (150 - 400 chars)</option>
                    <option value="long">Long (400 - 800 chars)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-[#9BAAB4]">
                  Powered by Google Gemini 3.8 Flash
                </span>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={loading || !topic.trim()}
                  icon={<Icon name="sparkles" className="w-4 h-4" />}
                >
                  {loading ? 'Crafting Post...' : 'Generate Post Draft'}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleImprove} className="space-y-4">
              <div>
                <label htmlFor="ai-improve-content" className="block text-xs font-semibold text-[#F4F8FA] mb-1.5">
                  Content to Polish <span className="text-[#FF6F61]">*</span>
                </label>
                <textarea
                  id="ai-improve-content"
                  placeholder="Paste or write the draft you would like Gemini to refine, restructure, or rewrite..."
                  value={contentToImprove}
                  onChange={(e) => setContentToImprove(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  disabled={loading}
                  className="w-full rounded-xl border border-[#263640] bg-[#101A22] p-3 text-sm text-[#F4F8FA] placeholder:text-[#9BAAB4] focus:outline-none focus:border-[#FF6F61] transition-colors"
                />
                <div className="mt-1 flex justify-end">
                  <span className="text-[11px] text-[#9BAAB4]">
                    {contentToImprove.length} / 1000
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ai-improve-tone" className="block text-xs font-semibold text-[#F4F8FA] mb-1.5">
                    Target Tone
                  </label>
                  <select
                    id="ai-improve-tone"
                    aria-label="Target tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-[#263640] bg-[#101A22] p-2.5 text-xs text-[#F4F8FA] focus:outline-none focus:border-[#FF6F61]"
                  >
                    <option value="insightful">Insightful &amp; Analytical</option>
                    <option value="casual">Casual &amp; Friendly</option>
                    <option value="professional">Professional &amp; Authoritative</option>
                    <option value="humorous">Humorous &amp; Playful</option>
                    <option value="inspiring">Inspiring &amp; Motivating</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ai-improve-instructions" className="block text-xs font-semibold text-[#F4F8FA] mb-1.5">
                    Custom Instructions (Optional)
                  </label>
                  <input
                    id="ai-improve-instructions"
                    type="text"
                    placeholder="e.g. Make it more concise, fix grammar, add a question hook"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    maxLength={300}
                    disabled={loading}
                    className="w-full rounded-xl border border-[#263640] bg-[#101A22] p-2.5 text-xs text-[#F4F8FA] placeholder:text-[#9BAAB4] focus:outline-none focus:border-[#FF6F61]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-[#9BAAB4]">
                  Powered by Google Gemini 3.8 Flash
                </span>
                <Button
                  type="submit"
                  variant="coral"
                  size="md"
                  disabled={loading || !contentToImprove.trim()}
                  icon={<Icon name="sparkles" className="w-4 h-4" />}
                >
                  {loading ? 'Refining Content...' : 'Polish with AI'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Generated Result Output Box */}
      {result && (
        <Card className="border-[#19D3E3]/40 bg-gradient-to-b from-[#1D2A35] to-[#151F29] shadow-xl shadow-[#19D3E3]/5 animate-fade-in">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={result.type === 'generated' ? 'primary' : 'coral'} size="sm">
                  {result.type === 'generated' ? 'Generated Draft' : 'Polished Draft'}
                </Badge>
                {result.metadata?.model && (
                  <span className="text-[11px] font-mono text-[#9BAAB4]">
                    model: {result.metadata.model}
                  </span>
                )}
              </div>
              <span className="text-xs text-[#9BAAB4]">
                {result.text.length} chars
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#101A22] border border-[#263640] text-sm text-[#F4F8FA] leading-relaxed whitespace-pre-wrap">
              {result.text}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-[11px] text-[#9BAAB4] italic">
                Never auto-published. Always review and edit before posting to Looply.
              </p>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  icon={<Icon name={copied ? 'check' : 'copy'} className="w-3.5 h-3.5" />}
                >
                  {copied ? 'Copied to Clipboard!' : 'Copy Text'}
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSendToFeed}
                  icon={<Icon name="send" className="w-3.5 h-3.5" />}
                >
                  Copy to Feed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prompt Inspiration Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#F4F8FA] uppercase tracking-wider">
          Inspiration &amp; Prompt Starters
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((s) => (
            <div
              key={s.title}
              onClick={() => handleApplySuggestion(s)}
              className="p-3.5 rounded-xl border border-[#263640] bg-[#151F29] hover:border-[#19D3E3]/50 hover:bg-[#1D2A35] transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#F4F8FA] group-hover:text-[#19D3E3] transition-colors">
                  {s.title}
                </span>
                <span className="text-[10px] font-medium text-[#9BAAB4] uppercase tracking-wider">
                  {s.tone}
                </span>
              </div>
              <p className="text-xs text-[#9BAAB4] leading-relaxed">
                {s.topic}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
