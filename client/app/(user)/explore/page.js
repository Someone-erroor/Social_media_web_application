import PageHeader from '@/components/ui/PageHeader';
import Card, { CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';

export const metadata = {
  title: 'Explore',
  description: 'Discover trending topics and active discussions on Looply'
};

export default function ExplorePage() {
  const topics = [
    'Technology',
    'Design Systems',
    'Software Architecture',
    'Next.js',
    'Artificial Intelligence',
    'Creative Writing',
    'Product Management'
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Explore"
        description="Discover trending conversations, popular topics, and communities"
      />

      {/* Discovery Search */}
      <div className="relative">
        <Input
          placeholder="Search by topic, keyword, or phrase..."
          disabled
          icon={<Icon name="search" className="w-4 h-4" />}
        />
        <span className="absolute right-3 top-2.5 text-[11px] text-slate-400 font-mono">
          Phase 9 Preview
        </span>
      </div>

      {/* Category Tag Pills */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Suggested Topics
        </h2>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <span
              key={topic}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-200/90 shadow-xs cursor-default hover:border-indigo-300 transition-colors"
            >
              #{topic}
            </span>
          ))}
        </div>
      </div>

      {/* Honest Empty State for Explore */}
      <EmptyState
        icon="explore"
        title="No Trending Content Yet"
        description="As discussions and public posts grow in Phase 9, algorithms and community curations will highlight the most engaging topics right here."
        badgeText="Discovery Engine • Phase 2"
      />
    </div>
  );
}

