// src/app/topic/[id]/page.tsx
'use client';

import { use, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatInput } from '@/components/layout/ChatInput';
import { SearchOverlay } from '@/components/search/SearchOverlay';
import { useCommandK } from '@/hooks/useCommandK';
import { ALL_CONVERSATIONS } from '@/data/conversations';
import { TOPICS } from '@/data/topics';
import type { TopicId } from '@/types';

export default function TopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auto-collapse sidebar below 1024px
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

  const handleConversationClick = useCallback(
    (convId: string) => {
      router.push(`/conversation/${convId}`);
    },
    [router]
  );

  const topic = useMemo(() => TOPICS.find((t) => t.id === id), [id]);

  const conversations = useMemo(
    () => ALL_CONVERSATIONS.filter((c) => c.topicId === (id as TopicId)),
    [id]
  );

  const lastActive = conversations[0]?.timestamp ?? '';

  type SortMode = 'recent' | 'oldest' | 'az';
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const sortedConversations = useMemo(() => {
    switch (sortMode) {
      case 'oldest':
        return [...conversations].reverse();
      case 'az':
        return [...conversations].sort((a, b) =>
          a.title.localeCompare(b.title)
        );
      case 'recent':
      default:
        return conversations;
    }
  }, [conversations, sortMode]);

  // Topic not found
  if (!topic) {
    return (
      <div className="flex h-screen w-full bg-[var(--surface-app)] overflow-hidden font-[family-name:var(--font-sans)]">
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
          onClose={() => setIsSidebarOpen(false)}
          onSearchClick={openSearch}
          onConversationClick={handleConversationClick}
        />
        <main className="flex-1 overflow-y-auto relative flex flex-col items-center justify-center">
          <p className="text-[15px]" style={{ color: 'var(--text-tertiary)' }}>
            Topic not found
          </p>
        </main>
      </div>
    );
  }

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
        <div className="w-full max-w-[720px] pt-10 pb-40 px-6">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[14px] font-medium mb-2 transition-colors duration-150 hover:text-[var(--text-primary)]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <ArrowLeft size={16} strokeWidth={2} />
            Chats
          </Link>

          {/* Header */}
          <div className="mb-4">
            {/* Topic badge */}
            <span
              className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium text-white mb-3"
              style={{ backgroundColor: topic.color }}
            >
              {topic.name}
            </span>

            {/* Topic name */}
            <h1
              className="text-[20px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {topic.name}
            </h1>

            {/* Subtitle */}
            <p
              className="text-[13px] mt-1"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              {lastActive && <> &middot; Last active {lastActive}</>}
            </p>
          </div>

          {/* Divider */}
          <div
            className="mb-6 border-b"
            style={{ borderColor: 'var(--border-tertiary)' }}
          />

          {/* Sort controls */}
          {conversations.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-[13px] font-medium"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-4">
                {([
                  { key: 'recent', label: 'Recent' },
                  { key: 'oldest', label: 'Oldest' },
                  { key: 'az', label: 'A-Z' },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSortMode(key)}
                    className="text-[13px] font-medium transition-colors duration-150"
                    style={{
                      color:
                        sortMode === key
                          ? 'var(--text-primary)'
                          : 'var(--text-tertiary)',
                      textDecoration: sortMode === key ? 'underline' : 'none',
                      textDecorationColor:
                        sortMode === key ? topic.color : undefined,
                      textUnderlineOffset: '4px',
                      textDecorationThickness: '2px',
                    }}
                    onMouseEnter={(e) => {
                      if (sortMode !== key)
                        e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      if (sortMode !== key)
                        e.currentTarget.style.color = 'var(--text-tertiary)';
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation list */}
          {conversations.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p
                className="text-[14px]"
                style={{ color: 'var(--text-ghost)' }}
              >
                No conversations in this topic yet
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sortedConversations.map((conv, i) => (
                <motion.button
                  key={conv.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    ease: 'easeOut',
                    delay: i * 0.03,
                  }}
                  onClick={() => router.push(`/conversation/${conv.id}`)}
                  className="group w-full text-left rounded-xl border-[0.5px] border-[var(--border-tertiary)] bg-[var(--bg-primary)] p-4 transition-all hover:border-[var(--border-secondary)]"
                >
                  {/* Title */}
                  <p
                    className="text-[15px] font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors"
                  >
                    {conv.title}
                  </p>

                  {/* Preview */}
                  <p
                    className="text-[13px] mt-1 truncate"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {conv.preview.length > 80
                      ? conv.preview.slice(0, 80) + '...'
                      : conv.preview}
                  </p>

                  {/* Metadata row */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {conv.project && (
                      <>
                        <span
                          className="text-[12px]"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {conv.project}
                        </span>
                        <span
                          className="text-[12px]"
                          style={{ color: 'var(--text-ghost)' }}
                        >
                          &middot;
                        </span>
                      </>
                    )}
                    <span
                      className="text-[12px]"
                      style={{ color: 'var(--text-ghost)' }}
                    >
                      {conv.timestamp}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
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
