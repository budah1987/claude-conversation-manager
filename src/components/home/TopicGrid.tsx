'use client';

import { TopicDot } from '@/components/ui/TopicDot';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { cn } from '@/lib/utils';
import type { Topic, TopicId } from '@/types';

interface TopicGridProps {
  topics: Topic[];
  selectedTopicId: TopicId | null;
  onSelectTopic: (id: TopicId) => void;
}

export function TopicGrid({
  topics,
  selectedTopicId,
  onSelectTopic,
}: TopicGridProps) {
  return (
    <section className="mb-10">
      <SectionLabel className="mb-4">Topics</SectionLabel>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {topics.map((topic) => {
          const isSelected = selectedTopicId === topic.id;
          return (
            <button
              key={topic.id}
              onClick={() => onSelectTopic(topic.id)}
              aria-label={`Filter by ${topic.name}`}
              aria-pressed={isSelected}
              className={cn(
                'flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-md)] border-[0.5px] transition-all text-left focus-ring',
                isSelected
                  ? 'border-[var(--border-secondary)] bg-[var(--surface-card)]'
                  : 'border-[var(--border-tertiary)] bg-[var(--surface-card)] hover:border-[var(--border-secondary)]'
              )}
              style={
                isSelected
                  ? { boxShadow: 'var(--shadow-sm)' }
                  : undefined
              }
            >
              <TopicDot color={topic.color} size="md" />
              <span className="text-[13px] font-medium text-[var(--text-primary)] flex-1">
                {topic.name}
              </span>
              <span className="text-[12px] text-[var(--text-ghost)] tabular-nums">
                {topic.count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
