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
  const rawMsg = String(err?.message || data?.message || '');

  // 1. Daily Quota Exhausted (no retry)
  if (category === 'DAILY_QUOTA_EXHAUSTED' || /daily quota|requests per day/i.test(rawMsg)) {
    return {
      message:
        'The Gemini AI service has temporarily reached its daily usage quota. Please try again later or wait for the quota reset.',
      canRetry: false
    };
  }

  // 2. Payment Required / Billing / Credit Limit (no retry)
  if (
    status === 402 ||
    category === 'PAYMENT_REQUIRED' ||
    category === 'SPEND_QUOTA_EXCEEDED' ||
    code === 'GEMINI_PAYMENT_REQUIRED' ||
    /billing|prepaid credit|payment required/i.test(rawMsg)
  ) {
    return {
      message:
        'Gemini billing or prepaid credit limit reached. Check the associated Google Cloud billing project.',
      canRetry: false
    };
  }

  // 3. Rate Limit - RPM (can retry after waiting)
  if (category === 'RATE_LIMIT_RPM' || /requests per minute|RPM/i.test(rawMsg)) {
    return {
      message: 'Gemini request rate limit reached. Please wait before trying again.',
      canRetry: true
    };
  }

  // 4. Rate Limit - TPM (no immediate retry; user must reduce text)
  if (category === 'RATE_LIMIT_TPM' || /tokens per minute|TPM|token limit/i.test(rawMsg)) {
    return {
      message: 'Gemini input token limit reached. Try reducing the amount of text.',
      canRetry: false
    };
  }

  // 5. General HTTP 429 Resource Exhausted
  if (
    status === 429 ||
    category === 'RESOURCE_EXHAUSTED_GENERAL' ||
    code === 'GEMINI_RESOURCE_EXHAUSTED' ||
    /resource_exhausted|rate limit/i.test(rawMsg)
  ) {
    return {
      message: 'Gemini request rate limit reached. Please wait before trying again.',
      canRetry: true
    };
  }

  // 6. Permission Denied / Project Access Denied (HTTP 403, no retry)
  if (
    status === 403 ||
    category === 'PERMISSION_DENIED' ||
    code === 'GEMINI_PERMISSION_DENIED' ||
    /project access|permission denied/i.test(rawMsg)
  ) {
    return {
      message: 'Gemini project access was denied. Check Google AI Studio permissions and billing.',
      canRetry: false
    };
  }

  // 7. Invalid Credentials (HTTP 401, no retry)
  if (
    status === 401 ||
    category === 'INVALID_CREDENTIALS' ||
    code === 'GEMINI_AUTH_FAILED' ||
    /authentication failed|API key not valid|UNAUTHENTICATED/i.test(rawMsg)
  ) {
    return {
      message: 'Gemini API authentication failed. Verify the configured API key.',
      canRetry: false
    };
  }

  // 8. Model Deprecated / Not Found (HTTP 404, no retry)
  if (
    status === 404 ||
    category === 'MODEL_NOT_FOUND' ||
    code === 'GEMINI_MODEL_NOT_FOUND' ||
    /not found for api version|unsupported model/i.test(rawMsg)
  ) {
    return {
      message: 'The requested Gemini model is deprecated or not available in this region.',
      canRetry: false
    };
  }

  // 9. Input Validation Error (HTTP 400, no retry)
  if (status === 400 || category === 'VALIDATION_ERROR' || code === 'VALIDATION_ERROR') {
    return {
      message: rawMsg || 'Invalid input parameters for AI assistance.',
      canRetry: false
    };
  }

  // 10. Email verification required
  if (code === 'EMAIL_VERIFICATION_REQUIRED' || /verify your email/i.test(rawMsg)) {
    return {
      message: 'Please verify your email address to use the AI Assistant.',
      canRetry: false
    };
  }

  // 11. Generic fallback
  return {
    message: rawMsg || 'An unexpected error occurred while contacting the AI service. Please try again later.',
    canRetry: true
  };
};

export default function AssistantWorkbench() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' | 'improve'

  // Generator State
  const [topic, setTopic] = useState('');
  const [context, setContext] = useState('');
  const [tone, setTone] = useState('insightful');
  const [length, setLength] = useState('medium');

  // Improver State
  const [contentToImprove, setContentToImprove] = useState('');
  const [instructions, setInstructions] = useState('');

  // Execution State
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!topic.trim()) {
      setErrorState({ message: 'Please provide a topic or theme.', canRetry: false });
      return;
    }

    setLoading(true);
    setErrorState(null);
    setResult(null);

    try {
      const res = await aiService.generatePost({
        topic: topic.trim(),
        context: context.trim() || undefined,
        tone,
        length
      });

      const generatedText = res?.generatedContent || res?.content;
      if (res?.success && generatedText) {
        setResult({
          text: generatedText,
          type: 'generated',
          metadata: res.metadata
        });
      } else {
        setErrorState(formatAiError(res));
      }
    } catch (err) {
      setErrorState(formatAiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleImprove = async (e) => {
    e?.preventDefault();
    if (!contentToImprove.trim()) {
      setErrorState({ message: 'Please enter content to improve.', canRetry: false });
      return;
    }

    setLoading(true);
    setErrorState(null);
    setResult(null);

    try {
      const res = await aiService.improvePost({
        content: contentToImprove.trim(),
        tone,
        instructions: instructions.trim() || undefined
      });

      const improvedText = res?.improvedContent || res?.improved;
      if (res?.success && improvedText) {
        setResult({
          text: improvedText,
          type: 'improved',
          metadata: res.metadata
        });
      } else {
        setErrorState(formatAiError(res));
      }
    } catch (err) {
      setErrorState(formatAiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.text) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToFeed = () => {
    if (!result?.text) return;
    try {
      sessionStorage.setItem('looply_draft_post', result.text);
    } catch (e) {
      // storage unavailable
    }
    router.push(ROUTES.USER.FEED);
  };

  const suggestions = [
    {
      title: 'Engineering Deep-Dive',
      topic: 'The real-world trade-offs between Server-Side Rendering and Static Site Generation in 2026',
      tone: 'insightful'
    },
    {
      title: 'Design System Philosophy',
      topic: 'Why consistent token design matters more than component libraries in enterprise UX',
      tone: 'professional'
    },
    {
      title: 'Startup Milestone',
      topic: 'Reflections after shipping our first MVP to 500 beta testers: three hard lessons',
      tone: 'inspiring'
    },
    {
      title: 'Dev Life Humor',
      topic: 'When you spend 4 hours debugging only to find a missing environment variable',
      tone: 'humorous'
    }
  ];

  const handleApplySuggestion = (suggestion) => {
    setActiveTab('generate');
    setTopic(suggestion.topic);
    setTone(suggestion.tone);
    setErrorState(null);
  };

  return (
    <div className="space-y-6">
      {/* Workbench Card */}
      <Card className="border-[#2D2938] bg-[#1E1B26] shadow-xl shadow-black/60">
        {/* Tab Header */}
        <div className="flex border-b border-[#2D2938] bg-[#17151D] rounded-t-2xl px-4 pt-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('generate');
              setErrorState(null);
            }}
            className={`flex items-center gap-2 pb-3 px-3.5 text-xs font-semibold border-b-2 transition-all font-display ${
              activeTab === 'generate'
                ? 'border-[#B9A8F5] text-[#B9A8F5]'
                : 'border-transparent text-[#777580] hover:text-[#F6F2EA]'
            }`}
          >
            <Icon name="sparkles" className="w-4 h-4 text-[#B9A8F5]" />
            <span>Post Generator</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('improve');
              setErrorState(null);
            }}
            className={`flex items-center gap-2 pb-3 px-3.5 text-xs font-semibold border-b-2 transition-all font-display ${
              activeTab === 'improve'
                ? 'border-[#FF6257] text-[#FF6257]'
                : 'border-transparent text-[#777580] hover:text-[#F6F2EA]'
            }`}
          >
            <Icon name="edit" className="w-4 h-4 text-[#FF6257]" />
            <span>Tone &amp; Clarity Improver</span>
          </button>
        </div>

        <CardContent className="p-5 sm:p-6 space-y-6">
          {/* Error Banner with Optional Retry Button */}
          {errorState && (
            <div className="p-3.5 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <Icon name="alertCircle" className="w-4 h-4 text-[#FF6257] shrink-0" />
                <span className="font-medium">{errorState.message}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {errorState.canRetry && (
                  <button
                    type="button"
                    onClick={activeTab === 'generate' ? handleGenerate : handleImprove}
                    disabled={loading}
                    className="px-2.5 py-1 rounded-md bg-[#FF6257]/20 hover:bg-[#FF6257]/30 text-[#F6F2EA] font-semibold text-[11px] transition-colors"
                  >
                    Retry Request
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setErrorState(null)}
                  className="text-[#777580] hover:text-[#F6F2EA] font-bold px-1"
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
                <label htmlFor="ai-gen-topic" className="block text-xs font-bold text-[#F6F2EA] mb-1.5 font-display">
                  Topic or Theme <span className="text-[#FF6257]">*</span>
                </label>
                <input
                  id="ai-gen-topic"
                  type="text"
                  placeholder="e.g. 5 tips for asynchronous communication in remote engineering teams"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  maxLength={200}
                  disabled={loading}
                  className="w-full rounded-xl border border-[#2D2938] bg-[#17151D] p-3 text-sm text-[#F6F2EA] placeholder:text-[#777580] focus:outline-none focus:border-[#B9A8F5] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="ai-gen-context" className="block text-xs font-bold text-[#F6F2EA] mb-1.5 font-display">
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
                  className="w-full rounded-xl border border-[#2D2938] bg-[#17151D] p-3 text-xs text-[#F6F2EA] placeholder:text-[#777580] focus:outline-none focus:border-[#B9A8F5] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ai-gen-tone" className="block text-xs font-bold text-[#F6F2EA] mb-1.5 font-display">
                    Tone of Voice
                  </label>
                  <select
                    id="ai-gen-tone"
                    aria-label="Tone of voice"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-[#2D2938] bg-[#17151D] p-2.5 text-xs text-[#F6F2EA] focus:outline-none focus:border-[#B9A8F5]"
                  >
                    <option value="insightful">Insightful &amp; Analytical</option>
                    <option value="casual">Casual &amp; Friendly</option>
                    <option value="professional">Professional &amp; Authoritative</option>
                    <option value="humorous">Humorous &amp; Playful</option>
                    <option value="inspiring">Inspiring &amp; Motivating</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ai-gen-length" className="block text-xs font-bold text-[#F6F2EA] mb-1.5 font-display">
                    Target Length
                  </label>
                  <select
                    id="ai-gen-length"
                    aria-label="Target length"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-[#2D2938] bg-[#17151D] p-2.5 text-xs text-[#F6F2EA] focus:outline-none focus:border-[#B9A8F5]"
                  >
                    <option value="short">Short (&lt; 150 chars)</option>
                    <option value="medium">Medium (150 - 400 chars)</option>
                    <option value="long">Long (400 - 800 chars)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-[#777580]">
                  Powered by Google Gemini AI
                </span>
                <Button
                  type="submit"
                  variant="lavender"
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
                <label htmlFor="ai-improve-content" className="block text-xs font-bold text-[#F6F2EA] mb-1.5 font-display">
                  Content to Polish <span className="text-[#FF6257]">*</span>
                </label>
                <textarea
                  id="ai-improve-content"
                  placeholder="Paste or write the draft you would like Gemini to refine, restructure, or rewrite..."
                  value={contentToImprove}
                  onChange={(e) => setContentToImprove(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  disabled={loading}
                  className="w-full rounded-xl border border-[#2D2938] bg-[#17151D] p-3 text-sm text-[#F6F2EA] placeholder:text-[#777580] focus:outline-none focus:border-[#FF6257] transition-colors"
                />
                <div className="mt-1 flex justify-end">
                  <span className="text-[11px] text-[#777580]">
                    {contentToImprove.length} / 1000
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ai-improve-tone" className="block text-xs font-bold text-[#F6F2EA] mb-1.5 font-display">
                    Target Tone
                  </label>
                  <select
                    id="ai-improve-tone"
                    aria-label="Target tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-[#2D2938] bg-[#17151D] p-2.5 text-xs text-[#F6F2EA] focus:outline-none focus:border-[#FF6257]"
                  >
                    <option value="insightful">Insightful &amp; Analytical</option>
                    <option value="casual">Casual &amp; Friendly</option>
                    <option value="professional">Professional &amp; Authoritative</option>
                    <option value="humorous">Humorous &amp; Playful</option>
                    <option value="inspiring">Inspiring &amp; Motivating</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ai-improve-instructions" className="block text-xs font-bold text-[#F6F2EA] mb-1.5 font-display">
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
                    className="w-full rounded-xl border border-[#2D2938] bg-[#17151D] p-2.5 text-xs text-[#F6F2EA] placeholder:text-[#777580] focus:outline-none focus:border-[#FF6257]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-[#777580]">
                  Powered by Google Gemini AI
                </span>
                <Button
                  type="submit"
                  variant="primary"
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
        <Card className="border-[#B9A8F5]/40 bg-gradient-to-b from-[#24202E] to-[#1E1B26] shadow-xl shadow-[#B9A8F5]/10 animate-fade-in">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={result.type === 'generated' ? 'lavender' : 'coral'} size="sm">
                  {result.type === 'generated' ? 'Generated Draft' : 'Polished Draft'}
                </Badge>
                {result.metadata?.model && (
                  <span className="text-[11px] font-mono text-[#777580]">
                    model: {result.metadata.model}
                  </span>
                )}
              </div>
              <span className="text-xs text-[#777580]">
                {result.text.length} chars
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938] text-sm text-[#F6F2EA] leading-relaxed whitespace-pre-wrap">
              {result.text}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-[11px] text-[#777580] italic">
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
        <h3 className="text-xs font-bold text-[#F6F2EA] uppercase tracking-wider font-display">
          Inspiration &amp; Prompt Starters
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((s) => (
            <div
              key={s.title}
              onClick={() => handleApplySuggestion(s)}
              className="p-3.5 rounded-xl border border-[#2D2938] bg-[#1E1B26] hover:border-[#FF6257]/50 hover:bg-[#24202E] transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#F6F2EA] group-hover:text-[#FF6257] transition-colors font-display">
                  {s.title}
                </span>
                <span className="text-[10px] font-semibold text-[#777580] uppercase tracking-wider">
                  {s.tone}
                </span>
              </div>
              <p className="text-xs text-[#777580] leading-relaxed">
                {s.topic}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
