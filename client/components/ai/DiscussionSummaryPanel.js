'use client';

import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

/**
 * AI Discussion Summary Panel (Dark Neon Theme)
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
      className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-[#101A22] via-[#151F29] to-[#101A22] border border-[#263640] shadow-xl shadow-black/40 space-y-3.5 transition-all animate-fade-in"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#263640]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#1D2A35] text-[#19D3E3] border border-[#263640] flex items-center justify-center shadow-xs">
            <Icon name="sparkles" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#F4F8FA] tracking-tight flex items-center gap-1.5">
              <span>Discussion Summary</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#19D3E3]/15 text-[#19D3E3] border border-[#19D3E3]/30">
                {metadata?.provider === 'google-gemini' ? 'Gemini 3.8 Flash' : 'AI Analysis'}
              </span>
            </h4>
            <p className="text-[11px] text-[#9BAAB4]">
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
              className="p-1 text-[#9BAAB4] hover:text-[#19D3E3] rounded-lg hover:bg-[#1D2A35] transition-colors focus:outline-none focus:ring-2 focus:ring-[#19D3E3]"
              aria-label="Refresh summary"
              title="Re-analyze discussion"
            >
              <Icon name="refresh" className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#9BAAB4] hover:text-[#F4F8FA] rounded-lg hover:bg-[#1D2A35] transition-colors focus:outline-none focus:ring-2 focus:ring-[#19D3E3]"
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
          <div className="flex items-center gap-2 text-xs text-[#19D3E3] font-medium animate-pulse">
            <svg
              className="animate-spin h-3.5 w-3.5 text-[#19D3E3]"
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
          <div className="h-3 bg-[#1D2A35] rounded-full w-5/6 animate-pulse" />
          <div className="h-3 bg-[#1D2A35] rounded-full w-4/6 animate-pulse" />
          <div className="h-3 bg-[#1D2A35] rounded-full w-3/4 animate-pulse" />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-[#FF5C70]/10 border border-[#FF5C70]/30 text-[#FF5C70] text-xs space-y-2"
        >
          <div className="flex items-start gap-2">
            <Icon name="alertCircle" className="w-4 h-4 text-[#FF5C70] shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
          {onRetry && (
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="text-xs h-7 px-3 bg-[#151F29] hover:bg-[#1D2A35] border-[#FF5C70]/40 text-[#F4F8FA]"
              >
                Retry Summarization
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Summary Content */}
      {!loading && !error && summary && (
        <div className="space-y-3 text-xs text-[#F4F8FA] leading-relaxed">
          {/* Topic */}
          {summary.topic && (
            <div className="bg-[#101A22] p-2.5 rounded-xl border border-[#263640]">
              <span className="font-semibold text-[#19D3E3] block text-[11px] uppercase tracking-wider mb-0.5">
                Discussion Topic
              </span>
              <p className="text-[#F4F8FA] font-medium">{summary.topic}</p>
            </div>
          )}

          {/* Main Points */}
          {Array.isArray(summary.mainPoints) && summary.mainPoints.length > 0 && (
            <div>
              <span className="font-semibold text-[#19D3E3] block text-[11px] uppercase tracking-wider mb-1">
                Main Points
              </span>
              <ul className="space-y-1 list-disc list-inside text-[#F4F8FA] pl-0.5">
                {summary.mainPoints.map((pt, i) => (
                  <li key={i} className="leading-snug">
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Common Opinions */}
          {Array.isArray(summary.commonOpinions) && summary.commonOpinions.length > 0 && (
            <div>
              <span className="font-semibold text-[#FF6F61] block text-[11px] uppercase tracking-wider mb-1">
                Common Opinions &amp; Perspectives
              </span>
              <ul className="space-y-1 list-disc list-inside text-[#F4F8FA] pl-0.5">
                {summary.commonOpinions.map((op, i) => (
                  <li key={i} className="leading-snug">
                    <span>{op}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Diverse Viewpoints */}
          {Array.isArray(summary.differentViewpoints) && summary.differentViewpoints.length > 0 && (
            <div>
              <span className="font-semibold text-[#9BAAB4] block text-[11px] uppercase tracking-wider mb-1">
                Diverse Angles &amp; Viewpoints
              </span>
              <ul className="space-y-1 list-disc list-inside text-[#9BAAB4] pl-0.5">
                {summary.differentViewpoints.map((vp, i) => (
                  <li key={i} className="leading-snug">
                    <span>{vp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Questions Raised */}
          {Array.isArray(summary.questions) && summary.questions.length > 0 && (
            <div>
              <span className="font-semibold text-[#F5B942] block text-[11px] uppercase tracking-wider mb-1">
                Questions Raised
              </span>
              <ul className="space-y-1 list-disc list-inside text-[#F4F8FA] pl-0.5">
                {summary.questions.map((q, i) => (
                  <li key={i} className="leading-snug">
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Conclusion */}
          {summary.conclusion && (
            <div className="bg-[#101A22] p-2.5 rounded-xl border border-[#263640]">
              <span className="font-semibold text-[#19D3E3] block text-[11px] uppercase tracking-wider mb-0.5">
                Discussion Synthesis
              </span>
              <p className="text-[#F4F8FA] text-[11px]">{summary.conclusion}</p>
            </div>
          )}

          {/* Footer Transparency Badge */}
          <div className="pt-1 flex items-center justify-between text-[10px] text-[#9BAAB4]">
            <span>AI-generated discussion synthesis. Never published automatically.</span>
            {metadata?.model && (
              <span className="font-mono text-[9px] uppercase tracking-tight text-[#19D3E3] bg-[#1D2A35] px-1.5 py-0.5 rounded border border-[#263640]">
                {metadata.model}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
