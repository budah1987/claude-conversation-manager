// src/components/search/SearchOverlay.tsx
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, X, Bookmark as BookmarkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ALL_CONVERSATIONS, RECENT_SEARCHES } from '@/data/conversations';
import { useBookmarks } from '@/context/BookmarkContext';
import type { Conversation, Bookmark } from '@/types';

const BOOKMARK_SHOW_LIMIT = 2;

// --- Highlight matched text ---
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="bg-[rgba(70,130,213,0.15)] text-inherit rounded-[2px] px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

// --- Match reason badge (conversations) ---
function MatchBadge({ field }: { field: 'title' | 'preview' | 'project' }) {
  const labels = {
    title: 'Title',
    preview: 'Content',
    project: 'Project',
  };
  return (
    <span className="text-[10px] font-medium text-[var(--text-tertiary)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded-[3px] shrink-0">
      {labels[field]}
    </span>
  );
}

// --- Saved badge (bookmarks) ---
function SavedBadge() {
  return (
    <span className="text-[10px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-[3px] shrink-0">
      Saved
    </span>
  );
}

// --- Section header ---
function SectionHeader({ label, count, showBookmarkIcon }: { label: string; count?: number; showBookmarkIcon?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 px-4 pt-3 pb-1.5">
      {showBookmarkIcon && (
        <BookmarkIcon size={12} className="text-amber-600 fill-amber-600 shrink-0" />
      )}
      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
        {label}
      </p>
      {count !== undefined && count > 0 && (
        <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/50 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}

// --- Format relative date ---
function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

// --- Determine which field matched ---
function getMatchField(
  conversation: Conversation,
  query: string
): 'title' | 'project' | 'preview' {
  const q = query.toLowerCase();
  if (conversation.title.toLowerCase().includes(q)) return 'title';
  if (conversation.project?.toLowerCase().includes(q)) return 'project';
  return 'preview';
}

// --- Main Component ---

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (conversationId: string, messageId?: string) => void;
}

export function SearchOverlay({ isOpen, onClose, onNavigate }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState<'saved' | 'conversations'>('saved');
  const [savedIndex, setSavedIndex] = useState(0);
  const [conversationIndex, setConversationIndex] = useState(0);
  const [showAllBookmarks, setShowAllBookmarks] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { bookmarks, pendingRemoval } = useBookmarks();

  // Active (non-pending) bookmarks
  const activeBookmarks = useMemo(() =>
    bookmarks.filter(b => !pendingRemoval.has(b.id)),
    [bookmarks, pendingRemoval]
  );

  // Bookmark search results
  const bookmarkResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return activeBookmarks.filter(b =>
      b.userQuery.toLowerCase().includes(q) ||
      b.responsePreview.toLowerCase().includes(q) ||
      b.fullResponse.toLowerCase().includes(q) ||
      (b.note?.toLowerCase().includes(q) ?? false) ||
      (b.project?.toLowerCase().includes(q) ?? false) ||
      b.conversationTitle.toLowerCase().includes(q)
    );
  }, [query, activeBookmarks]);

  // Conversation search results (with dedup)
  const conversationResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const bookmarkedConvIds = new Set(bookmarkResults.map(b => b.conversationId));
    return ALL_CONVERSATIONS.filter(c => {
      if (bookmarkedConvIds.has(c.id)) return false;
      return (
        c.title.toLowerCase().includes(q) ||
        c.preview.toLowerCase().includes(q) ||
        (c.project?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [query, bookmarkResults]);

  // Visible bookmarks + show all
  const visibleBookmarks = showAllBookmarks
    ? bookmarkResults
    : bookmarkResults.slice(0, BOOKMARK_SHOW_LIMIT);
  const hasMoreBookmarks = bookmarkResults.length > BOOKMARK_SHOW_LIMIT;
  const showExpandButton = hasMoreBookmarks && !showAllBookmarks;

  // Navigation counts
  const savedNavCount = bookmarkResults.length > 0
    ? visibleBookmarks.length + (showExpandButton ? 1 : 0)
    : 0;
  const conversationNavCount = conversationResults.length;

  // Recent bookmarks for empty query state
  const recentBookmarks = useMemo(() =>
    activeBookmarks
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3),
    [activeBookmarks]
  );

  const hasActiveSearch = query.trim().length > 0;
  const totalResults = bookmarkResults.length + conversationResults.length;

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveSection('saved');
      setSavedIndex(0);
      setConversationIndex(0);
      setShowAllBookmarks(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset indices when query changes
  useEffect(() => {
    setSavedIndex(0);
    setConversationIndex(0);
    setShowAllBookmarks(false);
    // Set active section based on what has results
    // (bookmarkResults/conversationResults will update on next render, so default to saved)
    setActiveSection('saved');
  }, [query]);

  // Ensure activeSection points to a section that has items
  useEffect(() => {
    if (activeSection === 'saved' && savedNavCount === 0 && conversationNavCount > 0) {
      setActiveSection('conversations');
      setConversationIndex(0);
    } else if (activeSection === 'conversations' && conversationNavCount === 0 && savedNavCount > 0) {
      setActiveSection('saved');
      setSavedIndex(0);
    }
  }, [savedNavCount, conversationNavCount, activeSection]);

  // Scroll selected result into view
  useEffect(() => {
    if (!resultsRef.current) return;
    const idx = activeSection === 'saved' ? savedIndex : conversationIndex;
    const el = resultsRef.current.querySelector(`[data-nav-id="${activeSection}-${idx}"]`) as HTMLElement;
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeSection, savedIndex, conversationIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Tab between sections
      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          if (activeSection === 'conversations' && savedNavCount > 0) {
            setActiveSection('saved');
            setSavedIndex(0);
          }
        } else {
          if (activeSection === 'saved' && conversationNavCount > 0) {
            setActiveSection('conversations');
            setConversationIndex(0);
          }
        }
        return;
      }

      // Arrow down
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (activeSection === 'saved') {
          if (savedIndex < savedNavCount - 1) {
            setSavedIndex(i => i + 1);
          } else if (conversationNavCount > 0) {
            setActiveSection('conversations');
            setConversationIndex(0);
          }
        } else {
          setConversationIndex(i => Math.min(i + 1, conversationNavCount - 1));
        }
        return;
      }

      // Arrow up
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (activeSection === 'conversations') {
          if (conversationIndex > 0) {
            setConversationIndex(i => i - 1);
          } else if (savedNavCount > 0) {
            setActiveSection('saved');
            setSavedIndex(savedNavCount - 1);
          }
        } else {
          setSavedIndex(i => Math.max(i - 1, 0));
        }
        return;
      }

      // Enter
      if (e.key === 'Enter') {
        if (activeSection === 'saved') {
          // "Show all" button selected
          if (showExpandButton && savedIndex === visibleBookmarks.length) {
            setShowAllBookmarks(true);
            return;
          }
          const bookmark = visibleBookmarks[savedIndex];
          if (bookmark) {
            onNavigate?.(bookmark.conversationId, bookmark.messageId);
            onClose();
          }
        } else {
          const conv = conversationResults[conversationIndex];
          if (conv) {
            onNavigate?.(conv.id);
            onClose();
          }
        }
        return;
      }
    },
    [isOpen, activeSection, savedIndex, conversationIndex, savedNavCount,
      conversationNavCount, visibleBookmarks, conversationResults,
      showExpandButton, onClose, onNavigate]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[4vh] md:pt-[18vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: -8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[640px] bg-[var(--surface-card)] rounded-[12px] shadow-[0px_16px_48px_rgba(0,0,0,0.12)] border-[0.5px] border-[rgba(31,30,29,0.2)] overflow-hidden flex flex-col"
          >
            {/* Search input */}
            <div className="flex items-center px-4 py-3.5 border-b-[0.5px] border-[var(--border-tertiary)] gap-3">
              <Search size={18} className="text-[var(--text-tertiary)] shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 text-[15px] text-[var(--text-primary)] bg-transparent outline-none placeholder-[var(--text-ghost)] font-sans"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="p-1 hover:bg-[var(--surface-hover)] rounded-[4px] transition-colors"
                >
                  <X size={14} className="text-[var(--text-tertiary)]" />
                </button>
              )}
              <kbd className="px-1.5 py-0.5 border-[0.5px] border-[var(--border-tertiary)] rounded-[4px] bg-[var(--bg-tertiary)] text-[10px] text-[var(--text-tertiary)] font-semibold shrink-0">
                ESC
              </kbd>
            </div>

            {/* Result count */}
            {hasActiveSearch && totalResults > 0 && (
              <div className="px-4 py-1.5 text-[11px] text-[var(--text-ghost)]">
                {totalResults} result{totalResults !== 1 ? 's' : ''}
              </div>
            )}

            {/* Results area */}
            <div ref={resultsRef} className="max-h-[50vh] md:max-h-[420px] overflow-y-auto">
              {/* Empty state: no query yet */}
              {!hasActiveSearch && (
                <div className="px-4 py-3">
                  {/* Recently Saved */}
                  {recentBookmarks.length > 0 && (
                    <>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)] mb-2 px-1 flex items-center gap-1.5">
                        <BookmarkIcon size={10} className="text-amber-600 fill-amber-600" />
                        Recently saved
                      </p>
                      {recentBookmarks.map((bookmark) => (
                        <button
                          key={bookmark.id}
                          onClick={() => {
                            onNavigate?.(bookmark.conversationId, bookmark.messageId);
                            onClose();
                          }}
                          className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-[6px] transition-colors"
                        >
                          <BookmarkIcon size={12} className="text-amber-500 fill-amber-500 shrink-0" />
                          <span className="truncate">{bookmark.conversationTitle}</span>
                          <span className="text-[11px] text-[var(--text-ghost)] ml-auto shrink-0">
                            {formatRelativeDate(bookmark.createdAt)}
                          </span>
                        </button>
                      ))}
                      <div className="my-2 border-t-[0.5px] border-[var(--border-tertiary)]" />
                    </>
                  )}

                  {/* Recent Searches */}
                  <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)] mb-2 px-1">
                    Recent searches
                  </p>
                  {RECENT_SEARCHES.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-[6px] transition-colors"
                    >
                      <Search size={12} className="text-[var(--text-ghost)] shrink-0" />
                      {term}
                    </button>
                  ))}
                </div>
              )}

              {/* No results at all */}
              {hasActiveSearch && totalResults === 0 && (
                <div className="py-10 text-center">
                  <p className="text-[14px] text-[var(--text-tertiary)]">
                    No results found for &ldquo;{query}&rdquo;
                  </p>
                </div>
              )}

              {/* SAVED section */}
              {hasActiveSearch && bookmarkResults.length > 0 && (
                <>
                  <SectionHeader label="Saved" count={bookmarkResults.length} showBookmarkIcon />
                  {visibleBookmarks.map((bookmark, idx) => {
                    const isSelected = activeSection === 'saved' && savedIndex === idx;
                    return (
                      <div
                        key={bookmark.id}
                        data-nav-id={`saved-${idx}`}
                        onMouseEnter={() => { setActiveSection('saved'); setSavedIndex(idx); }}
                        onClick={() => {
                          onNavigate?.(bookmark.conversationId, bookmark.messageId);
                          onClose();
                        }}
                        className={cn(
                          'px-4 py-3 cursor-pointer transition-colors duration-100',
                          isSelected
                            ? 'bg-amber-50/80'
                            : 'hover:bg-[rgba(31,30,29,0.02)]'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-[14px] font-semibold text-[var(--text-primary)] truncate flex-1">
                            <HighlightText text={bookmark.conversationTitle} query={query} />
                          </h4>
                          <SavedBadge />
                          <span className="text-[12px] text-[var(--text-tertiary)] shrink-0">
                            {formatRelativeDate(bookmark.createdAt)}
                          </span>
                        </div>
                        <p className="text-[12px] text-[var(--text-tertiary)] truncate">
                          <HighlightText text={bookmark.userQuery} query={query} />
                        </p>
                        {bookmark.project && (
                          <span className="inline-block mt-1 text-[10px] font-medium text-[var(--text-tertiary)] bg-[var(--surface-message-user)] px-1.5 py-0.5 rounded-full">
                            <HighlightText text={bookmark.project} query={query} />
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {/* Show all button */}
                  {showExpandButton && (
                    <button
                      data-nav-id={`saved-${visibleBookmarks.length}`}
                      onMouseEnter={() => { setActiveSection('saved'); setSavedIndex(visibleBookmarks.length); }}
                      onClick={() => setShowAllBookmarks(true)}
                      className={cn(
                        'w-full px-5 py-2 text-left text-[12px] font-medium transition-colors',
                        activeSection === 'saved' && savedIndex === visibleBookmarks.length
                          ? 'bg-[var(--surface-hover)] text-[var(--text-primary)]'
                          : 'text-[var(--text-tertiary)] hover:bg-[rgba(31,30,29,0.02)]'
                      )}
                    >
                      Show all {bookmarkResults.length} saved results
                    </button>
                  )}
                </>
              )}

              {/* Divider between sections */}
              {hasActiveSearch && bookmarkResults.length > 0 && (
                <div className="mx-4 my-1 border-t-[0.5px] border-[var(--border-tertiary)]" />
              )}

              {/* CONVERSATIONS section */}
              {hasActiveSearch && totalResults > 0 && (
                <>
                  <SectionHeader label="Conversations" />
                  {conversationResults.length === 0 ? (
                    <p className="px-5 py-3 text-[13px] text-[var(--text-ghost)]">
                      No conversations
                    </p>
                  ) : (
                    conversationResults.map((result, idx) => {
                      const matchField = getMatchField(result, query);
                      const isSelected = activeSection === 'conversations' && conversationIndex === idx;
                      return (
                        <div
                          key={result.id}
                          data-nav-id={`conversations-${idx}`}
                          onMouseEnter={() => { setActiveSection('conversations'); setConversationIndex(idx); }}
                          onClick={() => {
                            onNavigate?.(result.id);
                            onClose();
                          }}
                          className={cn(
                            'px-4 py-3 cursor-pointer flex items-start gap-3 transition-colors duration-100',
                            isSelected
                              ? 'bg-[var(--surface-hover)]'
                              : 'hover:bg-[rgba(31,30,29,0.02)]'
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="text-[14px] font-semibold text-[var(--text-primary)] truncate flex-1">
                                <HighlightText text={result.title} query={query} />
                              </h4>
                              {matchField === 'project' && <MatchBadge field={matchField} />}
                              <span className="text-[12px] text-[var(--text-tertiary)] shrink-0">
                                {formatRelativeDate(result.timestamp)}
                              </span>
                            </div>
                            <p className="text-[12px] text-[var(--text-tertiary)] truncate">
                              <HighlightText text={result.preview} query={query} />
                            </p>
                            {result.project && (
                              <span className="inline-block mt-1 text-[10px] font-medium text-[var(--text-tertiary)] bg-[var(--surface-message-user)] px-1.5 py-0.5 rounded-full">
                                <HighlightText text={result.project} query={query} />
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>

            {/* Footer hints */}
            <div className="px-4 py-2 border-t-[0.5px] border-[var(--border-tertiary)] hidden md:flex items-center gap-4">
              {[
                { key: '↑↓', label: 'Navigate' },
                { key: 'Tab', label: 'Section' },
                { key: '↵', label: 'Open' },
                { key: 'esc', label: 'Close' },
              ].map(({ key, label }) => (
                <span
                  key={label}
                  className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1"
                >
                  <kbd className="text-[11px] font-medium">{key}</kbd>
                  {label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
