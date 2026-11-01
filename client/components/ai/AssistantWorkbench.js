'use client';

import { useState } from 'react';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { aiService } from '@/services/aiService';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

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
  const [error, setError] = useState('');
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
    setError('');
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!topic.trim()) {
      setError('Please provide a topic or prompt for post generation.');
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
        setError(res?.message || 'Failed to receive generated post content.');
      }
    } catch (err) {
      setError(err.message || 'Error occurred while contacting Gemini AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleImprove = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!contentToImprove.trim()) {
      setError('Please provide the text you would like AI to polish.');
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
        setError(res?.message || 'Failed to receive improved content.');
      }
    } catch (err) {
      setError(err.message || 'Error occurred while contacting Gemini AI.');
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
      // Fallback
      setCopied(false);
    }
  };

  const handleSendToFeed = () => {
    if (!result?.text) return;
    try {
      sessionStorage.setItem('looply_draft_post', result.text);
    } catch (e) {
      // storage quota or disabled
    }
    router.push(ROUTES.USER.FEED);
  };

  return (
    <div className="space-y-6">
      {/* Workbench Card */}
      <Card className="border-slate-200 shadow-xs">
        {/* Tab Header */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 rounded-t-2xl px-4 pt-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('generate');
              setError('');
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'generate'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon name="sparkles" className="w-4 h-4 text-indigo-500" />
            <span>Post Generator</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('improve');
              setError('');
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'improve'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon name="edit" className="w-4 h-4 text-purple-500" />
            <span>Tone &amp; Clarity Improver</span>
          </button>
        </div>

        <CardContent className="p-5 sm:p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="alertCircle" className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {activeTab === 'generate' ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label htmlFor="ai-gen-topic" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Topic or Theme <span className="text-red-500">*</span>
                </label>
                <input
                  id="ai-gen-topic"
                  type="text"
                  placeholder="e.g. 5 tips for asynchronous communication in remote engineering teams"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  maxLength={200}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="ai-gen-context" className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ai-gen-tone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tone of Voice
                  </label>
                  <select
                    id="ai-gen-tone"
                    aria-label="Tone of voice"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="insightful">Insightful &amp; Analytical</option>
                    <option value="casual">Casual &amp; Friendly</option>
                    <option value="professional">Professional &amp; Authoritative</option>
                    <option value="humorous">Humorous &amp; Playful</option>
                    <option value="inspiring">Inspiring &amp; Motivating</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ai-gen-length" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Length
                  </label>
                  <select
                    id="ai-gen-length"
                    aria-label="Target length"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="short">Short (&lt; 150 chars)</option>
                    <option value="medium">Medium (150 - 400 chars)</option>
                    <option value="long">Long (400 - 800 chars)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Powered by Google Gemini 2.5 Flash
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
                <label htmlFor="ai-improve-content" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Content to Polish <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="ai-improve-content"
                  placeholder="Paste or write the draft you would like Gemini to refine, restructure, or rewrite..."
                  value={contentToImprove}
                  onChange={(e) => setContentToImprove(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <div className="mt-1 flex justify-end">
                  <span className="text-[11px] text-slate-400">
                    {contentToImprove.length} / 1000
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ai-improve-tone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Tone
                  </label>
                  <select
                    id="ai-improve-tone"
                    aria-label="Target tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                  >
                    <option value="insightful">Insightful &amp; Analytical</option>
                    <option value="casual">Casual &amp; Friendly</option>
                    <option value="professional">Professional &amp; Authoritative</option>
                    <option value="humorous">Humorous &amp; Playful</option>
                    <option value="inspiring">Inspiring &amp; Motivating</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ai-improve-instructions" className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Powered by Google Gemini 2.5 Flash
                </span>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={loading || !contentToImprove.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
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
        <Card className="border-indigo-200 bg-linear-to-b from-indigo-50/30 to-white shadow-sm animate-in fade-in">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">
                  {result.type === 'generated' ? 'Generated Draft' : 'Polished Draft'}
                </Badge>
                {result.metadata?.model && (
                  <span className="text-[11px] font-mono text-slate-400">
                    model: {result.metadata.model}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500">
                {result.text.length} chars
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/80 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
              {result.text}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-[11px] text-slate-500 italic">
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
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Inspiration &amp; Prompt Starters
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((s) => (
            <div
              key={s.title}
              onClick={() => handleApplySuggestion(s)}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {s.title}
                </span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  {s.tone}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {s.topic}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

