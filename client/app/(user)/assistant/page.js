import PageHeader from '@/components/ui/PageHeader';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';

export const metadata = {
  title: 'AI Assistant',
  description: 'AI-assisted writing, brainstorming, and thread summarization'
};

export default function AssistantPage() {
  const suggestions = [
    'Help me draft an insightful post about web performance',
    'Summarize discussion themes from this morning',
    'Refine this announcement draft into a concise tone',
    'Suggest 5 creative discussion hooks for my profile'
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Assistant"
        description="Brainstorm post ideas, refine writing tone, and synthesize discussions"
        badge={
          <Badge variant="primary" size="sm">
            AI Preview &bull; Coming Soon
          </Badge>
        }
      />

      {/* Main Conversational Container */}
      <Card className="border-slate-200 min-h-[480px] flex flex-col justify-between shadow-xs">
        {/* Assistant Message Canvas & Empty State */}
        <CardContent className="p-6 flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center mb-4 shadow-md">
            <Icon name="sparkles" className="w-7 h-7" />
          </div>

          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Meet the Looply Assistant
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed">
            Your conversational companion for generating engaging posts, reviewing grammar, adjusting tone, and condensing lengthy comment threads.
          </p>

          <div className="mt-4 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-mono border border-slate-200">
            Intelligent discussion assistant &bull; Preview
          </div>

          {/* Starter Prompts */}
          <div className="mt-8 w-full max-w-lg space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">
              Suggested Prompts:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {suggestions.map((prompt) => (
                <div
                  key={prompt}
                  className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 text-xs text-slate-700 transition-colors cursor-default"
                >
                  <p className="line-clamp-2">{prompt}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        {/* Input Composer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl space-y-2">
          <div className="relative">
            <textarea
              placeholder="Ask Looply Assistant to write, refine, or summarize..."
              rows={2}
              disabled
              className="w-full resize-none rounded-xl border border-slate-300 bg-white p-3 pr-24 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
            <div className="absolute right-2.5 bottom-2.5">
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled
                icon={<Icon name="send" className="w-3.5 h-3.5" />}
                title="AI Assistant available soon"
              >
                Send
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-center text-slate-400">
            Conversational assistant preview. Intelligent generation services activating soon.
          </p>
        </div>
      </Card>
    </div>
  );
}

