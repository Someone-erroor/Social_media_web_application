'use client';

import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

/**
 * AI Discussion Summary Panel (Warm Social Playground Theme)
 * Displays structured synthesized insights from post comments using Google Gemini.
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
      className="mt-3 p-4 rounded-2xl bg-[#EEEAFE] border border-[#6C63FF]/20 shadow-xs space-y-3.5 transition-all animate-fade-in"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#6C63FF]/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-white text-[#6C63FF] border border-[#6C63FF]/30 flex items-center justify-center shadow-2xs">
            <Icon name="sparkles" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1E1E24] tracking-tight flex items-center gap-1.5 font-display">
              <span>Discussion Summary</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white text-[#6C63FF] border border-[#6C63FF]/20">
                {metadata?.provider === 'google-gemini' ? (metadata?.model || 'Gemini AI') : 'AI Analysis'}
              </span>
            </h4>
            <p className="text-[11px] text-[#6B6B73]">
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
              className="p-1 text-[#6B6B73] hover:text-[#6C63FF] rounded-lg hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#6C63FF] cursor-pointer"
              aria-label="Refresh summary"
              title="Re-analyze discussion"
            >
              <Icon name="refresh" className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#6B6B73] hover:text-[#1E1E24] rounded-lg hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#6C63FF] cursor-pointer"
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
          <div className="flex items-center gap-2 text-xs text-[#6C63FF] font-medium animate-pulse">
            <svg
              className="animate-spin h-3.5 w-3.5 text-[#6C63FF]"
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
          <div className="h-3 bg-white/70 rounded-full w-5/6 animate-pulse" />
          <div className="h-3 bg-white/70 rounded-full w-4/6 animate-pulse" />
          <div className="h-3 bg-white/70 rounded-full w-3/4 animate-pulse" />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-[#FFEAEA] border border-[#FF6B6B]/30 text-[#FF6B6B] text-xs space-y-2"
        >
          <div className="flex items-start gap-2">
            <Icon name="alertCircle" className="w-4 h-4 text-[#FF6B6B] shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
          {onRetry && (
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="text-xs h-7 px-3 bg-white hover:bg-[#F1F0EC] border-[#FF6B6B]/40 text-[#1E1E24]"
              >
                Retry Summarization
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Summary Content */}
      {!loading && !error && summary && (
        <div className="space-y-3 text-xs text-[#1E1E24] leading-relaxed">
          {/* Topic */}
          {summary.topic && (
            <div className="bg-white p-3 rounded-xl border border-[#E7E5E0] shadow-2xs">
              <span className="font-bold text-[#6C63FF] block text-[11px] uppercase tracking-wider mb-0.5 font-display">
                Discussion Topic
              </span>
              <p className="text-[#1E1E24] font-medium">{summary.topic}</p>
            </div>
          )}

          {/* Main Points */}
          {Array.isArray(summary.mainPoints) && summary.mainPoints.length > 0 && (
            <div className="bg-white p-3 rounded-xl border border-[#E7E5E0] shadow-2xs">
              <span className="font-bold text-[#2E7D4E] block text-[11px] uppercase tracking-wider mb-1 font-display">
                Main Points
              </span>
              <ul className="space-y-1 list-disc list-inside text-[#1E1E24] pl-0.5">
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
            <div className="bg-white p-3 rounded-xl border border-[#E7E5E0] shadow-2xs">
              <span className="font-bold text-[#FF6B6B] block text-[11px] uppercase tracking-wider mb-1 font-display">
                Common Opinions &amp; Perspectives
              </span>
              <ul className="space-y-1 list-disc list-inside text-[#1E1E24] pl-0.5">
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
            <div className="bg-white p-3 rounded-xl border border-[#E7E5E0] shadow-2xs">
              <span className="font-bold text-[#6B6B73] block text-[11px] uppercase tracking-wider mb-1 font-display">
                Diverse Angles &amp; Viewpoints
              </span>
              <ul className="space-y-1 list-disc list-inside text-[#6B6B73] pl-0.5">
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
            <div className="bg-white p-3 rounded-xl border border-[#E7E5E0] shadow-2xs">
              <span className="font-bold text-[#B28200] block text-[11px] uppercase tracking-wider mb-1 font-display">
                Questions Raised
              </span>
              <ul className="space-y-1 list-disc list-inside text-[#1E1E24] pl-0.5">
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
            <div className="bg-white p-3 rounded-xl border border-[#E7E5E0] shadow-2xs">
              <span className="font-bold text-[#6C63FF] block text-[11px] uppercase tracking-wider mb-0.5 font-display">
                Discussion Synthesis
              </span>
              <p className="text-[#1E1E24] text-[11px]">{summary.conclusion}</p>
            </div>
          )}

          {/* Footer Transparency Badge */}
          <div className="pt-1 flex items-center justify-between text-[10px] text-[#6B6B73]">
            <span>AI-generated discussion synthesis. Never published automatically.</span>
            {metadata?.model && (
              <span className="font-mono text-[9px] uppercase tracking-tight text-[#6C63FF] bg-white px-1.5 py-0.5 rounded border border-[#6C63FF]/20">
                {metadata.model}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
