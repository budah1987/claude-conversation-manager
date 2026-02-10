// src/components/home/ActivityStrip.tsx
'use client';

import { useMemo } from 'react';
import { Search } from 'lucide-react';
import { ALL_CONVERSATIONS } from '@/data/conversations';
import { TOPICS } from '@/data/topics';

interface ActivityStripProps {
  onSearchClick: () => void;
}

export function ActivityStrip({ onSearchClick }: ActivityStripProps) {
  const stats = useMemo(() => {
    const totalConversations = ALL_CONVERSATIONS.length;
    const totalTopics = TOPICS.length;
    const projects = new Set(
      ALL_CONVERSATIONS
        .map((c) => c.project)
        .filter(Boolean)
    );
    const totalProjects = projects.size;

    // Most active topics: top 3 by count
    const topicCounts: Record<string, number> = {};
    for (const c of ALL_CONVERSATIONS) {
      topicCounts[c.topicId] = (topicCounts[c.topicId] || 0) + 1;
    }
    const topTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => TOPICS.find((t) => t.id === id)?.name)
      .filter(Boolean);

    return { totalConversations, totalTopics, totalProjects, topTopics };
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 mt-5">
      <span className="text-[12px] text-[var(--text-ghost)]">
        {stats.totalConversations} conversations · {stats.totalTopics} topics · {stats.totalProjects} projects
      </span>
      <button
        onClick={onSearchClick}
        className="group flex items-center gap-2.5 px-4 py-2 rounded-full bg-[var(--surface-card)] border-[0.5px] border-[var(--border-tertiary)] text-[13px] text-[var(--text-ghost)] hover:border-[var(--border-secondary)] hover:text-[var(--text-tertiary)] transition-all"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <Search size={14} strokeWidth={1.5} />
        <span>Search all conversations</span>
        <kbd className="ml-1 px-1.5 py-0.5 border-[0.5px] border-[var(--border-tertiary)] rounded-[4px] bg-[var(--bg-tertiary)] text-[10px] font-semibold leading-none text-[var(--text-tertiary)]">
          ⌘K
        </kbd>
      </button>
    </div>
  );
}