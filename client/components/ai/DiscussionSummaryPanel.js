'use client';

import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

/**
 * AI Discussion Summary Panel
 * Displays structured synthesized insights from post comments using Google Gemini.
 *
 * @param {object} props
 * @param {object|null} props.summary - Structured summary ({ topic, mainPoints, commonOpinions, differentViewpoints, questions, conclusion })
 * @param {boolean} props.loading - Loading state while AI synthesizes comments
 * @param {string} props.error - Error message if AI generation failed
 * @param {object|null} props.metadata - Provider, model, and comment count telemetry
 * @param {() => void} props.onClose - Dismiss/close handler
 * @param {() => void} props.onRetry - Re-fetch/retry handler
 */
export default function DiscussionSummaryPanel({
  summary,
  loading,
  error,
  metadata,
  onClose,
  onRetry
}) {
  return (
    <div
      role="region"
      aria-label="AI Discussion Summary"
      className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-purple-50/70 via-indigo-50/50 to-white border border-purple-200/80 shadow-xs space-y-3.5 transition-all"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-purple-100/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <Icon name="sparkles" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Discussion Summary</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700">
                {metadata?.provider === 'google-gemini' ? 'Gemini AI' : 'AI Analysis'}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              {metadata?.commentsAnalyzed
                ? `Synthesized from ${metadata.commentsAnalyzed} community comment${metadata.commentsAnalyzed === 1 ? '' : 's'}`
                : 'Key takeaways and community viewpoints'}
            </p>
          </div>
        </div>

        {/* Panel Actions */}
        <div className="flex items-center gap-1">
          {onRetry && !loading && (
            <button
              type="button"
              onClick={onRetry}
              className="p-1 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-purple-100/60 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
              aria-label="Refresh summary"
              title="Re-analyze discussion"
            >
              <Icon name="refresh" className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
            aria-label="Close discussion summary"
            title="Close summary"
          >
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div role="status" aria-live="polite" className="py-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-purple-700 font-medium animate-pulse">
            <svg
              className="animate-spin h-3.5 w-3.5 text-purple-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Analyzing discussion comments with Google Gemini...</span>
          </div>
          <div className="h-3 bg-purple-100/70 rounded-full w-5/6 animate-pulse" />
          <div className="h-3 bg-purple-100/70 rounded-full w-4/6 animate-pulse" />
          <div className="h-3 bg-purple-100/70 rounded-full w-3/4 animate-pulse" />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2"
        >
          <div className="flex items-start gap-2">
            <Icon name="alertCircle" className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
          {onRetry && (
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="text-xs h-7 px-3 bg-white hover:bg-rose-50 border-rose-300 text-rose-700"
              >
                Retry Summarization
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Summary Content */}
      {!loading && !error && summary && (
        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          {/* Topic */}
          {summary.topic && (
            <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100/80">
              <span className="font-semibold text-purple-900 block text-[11px] uppercase tracking-wider mb-0.5">
                Discussion Topic
              </span>
              <p className="text-slate-800 font-medium">{summary.topic}</p>
            </div>
          )}

          {/* Main Points */}
          {Array.isArray(summary.mainPoints) && summary.mainPoints.length > 0 && (
            <div>
              <span className="font-semibold text-slate-900 block text-[11px] uppercase tracking-wider mb-1">
                Main Points
              </span>
              <ul className="space-y-1 list-disc list-inside text-slate-700 pl-0.5">
                {summary.mainPoints.map((pt, i) => (
                  <li key={i} className="leading-snug">
                    <span className="text-slate-800">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Common Opinions */}
          {Array.isArray(summary.commonOpinions) && summary.commonOpinions.length > 0 && (
            <div>
              <span className="font-semibold text-slate-900 block text-[11px] uppercase tracking-wider mb-1">
                Common Opinions & Perspectives
              </span>
              <ul className="space-y-1 list-disc list-inside text-slate-700 pl-0.5">
                {summary.commonOpinions.map((op, i) => (
                  <li key={i} className="leading-snug">
                    <span className="text-slate-800">{op}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Diverse Viewpoints */}
          {Array.isArray(summary.differentViewpoints) && summary.differentViewpoints.length > 0 && (
            <div>
              <span className="font-semibold text-slate-900 block text-[11px] uppercase tracking-wider mb-1">
                Diverse Angles & Viewpoints
              </span>
              <ul className="space-y-1 list-disc list-inside text-slate-700 pl-0.5">
                {summary.differentViewpoints.map((vp, i) => (
                  <li key={i} className="leading-snug">
                    <span className="text-slate-800">{vp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Questions Raised */}
          {Array.isArray(summary.questions) && summary.questions.length > 0 && (
            <div>
              <span className="font-semibold text-slate-900 block text-[11px] uppercase tracking-wider mb-1">
                Questions Raised
              </span>
              <ul className="space-y-1 list-disc list-inside text-slate-700 pl-0.5">
                {summary.questions.map((q, i) => (
                  <li key={i} className="leading-snug">
                    <span className="text-slate-800">{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Conclusion */}
          {summary.conclusion && (
            <div className="bg-purple-100/40 p-2.5 rounded-xl border border-purple-200/60">
              <span className="font-semibold text-purple-950 block text-[11px] uppercase tracking-wider mb-0.5">
                Discussion Synthesis
              </span>
              <p className="text-purple-900 text-[11px]">{summary.conclusion}</p>
            </div>
          )}

          {/* Footer Transparency Badge */}
          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
            <span>AI-generated discussion synthesis. Never published automatically.</span>
            {metadata?.model && (
              <span className="font-mono text-[9px] uppercase tracking-tight text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                {metadata.model}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

