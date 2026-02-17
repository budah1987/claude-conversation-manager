// src/app/chats/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { SearchOverlay } from '@/components/search/SearchOverlay';
import { useCommandK } from '@/hooks/useCommandK';
import { ALL_CONVERSATIONS } from '@/data/conversations';
import { ProjectPill } from '@/components/ui/ProjectPill';

export default function ChatsPage() {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

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

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  useCommandK(openSearch, closeSearch);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleConversationClick = useCallback((id: string, _messageId?: string) => {
    router.push(`/conversation/${id}`);
  }, [router]);

  // Filter conversations based on debounced search query
  const filteredConversations = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return ALL_CONVERSATIONS;
    }
    const q = debouncedQuery.toLowerCase();
    return ALL_CONVERSATIONS.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.preview.toLowerCase().includes(q) ||
        (c.project?.toLowerCase().includes(q) ?? false)
    );
  }, [debouncedQuery]);

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
      <main className="flex-1 overflow-y-auto relative pl-14 lg:pl-0">
        <div className="max-w-[720px] mx-auto px-4 md:px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1
              className="text-[24px] md:text-[28px] font-normal text-[var(--text-primary)]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Chats
            </h1>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-[var(--text-primary)] bg-[var(--surface-card)] border-[0.5px] border-[var(--border-tertiary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <Plus size={16} strokeWidth={1.5} />
              New chat
            </button>
          </div>

          {/* Search input */}
          <div className="mb-4">
            <div
              className="flex items-center gap-3 px-4 py-3 border-[0.5px] border-[var(--border-tertiary)] rounded-lg bg-[var(--surface-input)]"
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <Search size={18} className="text-[var(--text-tertiary)] shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="flex-1 text-[15px] text-[var(--text-primary)] bg-transparent outline-none placeholder-[var(--text-ghost)] font-sans"
              />
            </div>
          </div>

          {/* Conversation count */}
          <p className="text-[13px] text-[var(--text-tertiary)] mb-4">
            {filteredConversations.length} chat{filteredConversations.length !== 1 ? 's' : ''} with Claude
          </p>

          {/* Conversation list */}
          <div className="flex flex-col">
            {filteredConversations.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-[14px] text-[var(--text-tertiary)]">
                  No conversations found for "{debouncedQuery}"
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation, index) => (
                <div key={conversation.id}>
                  <button
                    onClick={() => handleConversationClick(conversation.id)}
                    className="w-full text-left px-4 py-4 hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className="text-[15px] font-semibold text-[var(--text-primary)] truncate flex-1">
                        {conversation.title}
                      </h3>
                      <span className="text-[12px] text-[var(--text-tertiary)] shrink-0">
                        {conversation.timestamp}
                      </span>
                    </div>
                    <p className="text-[13px] text-[var(--text-tertiary)] truncate mb-2">
                      {conversation.preview}
                    </p>
                    {conversation.project && (
                      <ProjectPill name={conversation.project} />
                    )}
                  </button>
                  {index < filteredConversations.length - 1 && (
                    <div
                      className="h-[0.5px] mx-4 bg-[var(--border-tertiary)]"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
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
