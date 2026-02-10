// src/app/page.tsx
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatInput } from '@/components/layout/ChatInput';
import { RecentCards } from '@/components/home/RecentCards';
import { TopicGrid } from '@/components/home/TopicGrid';
import { ActivityStrip } from '@/components/home/ActivityStrip';
import { SearchOverlay } from '@/components/search/SearchOverlay';
import { useCommandK } from '@/hooks/useCommandK';
import { ALL_CONVERSATIONS } from '@/data/conversations';
import { TOPICS } from '@/data/topics';
import type { TopicId } from '@/types';

export default function Home() {
  const router = useRouter();
  const [selectedTopicId, setSelectedTopicId] = useState<TopicId | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auto-collapse sidebar below 1024px on initial load
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  useCommandK(openSearch, closeSearch);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleConversationClick = useCallback((id: string) => {
    router.push(`/conversation/${id}`);
  }, [router]);

  const recentConversations = useMemo(() => {
    if (!selectedTopicId) return ALL_CONVERSATIONS.slice(0, 9);
    return ALL_CONVERSATIONS
      .filter((c) => c.topicId === selectedTopicId)
      .slice(0, 9);
  }, [selectedTopicId]);

  const recentLabel = useMemo(() => {
    if (!selectedTopicId) return 'Pick up where you left off';
    const topic = TOPICS.find((t) => t.id === selectedTopicId);
    return `Recent in ${topic?.name ?? ''}`;
  }, [selectedTopicId]);

  return (
    <div className="flex h-screen w-full bg-[var(--surface-app)] overflow-hidden font-[family-name:var(--font-sans)]">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        onClose={() => setIsSidebarOpen(false)}
        onSearchClick={openSearch}
        onConversationClick={handleConversationClick}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto relative flex flex-col items-center">
        <div className="w-full max-w-[720px] pt-20 pb-40 px-6">
          <RecentCards
            conversations={recentConversations}
            label={recentLabel}
            isFiltered={!!selectedTopicId}
            onClearFilter={() => setSelectedTopicId(null)}
          />

          <TopicGrid
            topics={TOPICS}
            selectedTopicId={selectedTopicId}
            onSelectTopic={(id) => router.push(`/topic/${id}`)}
          />

          <ActivityStrip onSearchClick={openSearch} />
        </div>

        {/* Chat input */}
        <ChatInput />
      </main>

      {/* Search overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={closeSearch}
        onNavigate={handleConversationClick}
      />
    </div>
  );
}