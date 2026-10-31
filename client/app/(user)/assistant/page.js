import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import AssistantWorkbench from '@/components/ai/AssistantWorkbench';

export const metadata = {
  title: 'AI Assistant',
  description: 'AI-assisted writing, brainstorming, and tone improvement powered by Google Gemini'
};

export default function AssistantPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Assistant Workbench"
        description="Brainstorm post ideas, draft engaging updates, and refine your writing with Google Gemini 2.5 Flash"
        badge={
          <Badge variant="primary" size="sm">
            Google Gemini Active
          </Badge>
        }
      />

      <AssistantWorkbench />
    </div>
  );
}
