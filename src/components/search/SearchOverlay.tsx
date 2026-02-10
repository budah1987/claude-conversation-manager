// src/components/search/SearchOverlay.tsx
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ALL_CONVERSATIONS, RECENT_SEARCHES } from '@/data/conversations';
import { TOPICS } from '@/data/topics';
import type { TopicId, Conversation } from '@/types';

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

// --- Match reason badge ---
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

// --- Topic filter chip ---
function TopicChip({
  name,
  color,
  count,
  active,
  onClick,
}: {
  name: string;
  color: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full border-[0.5px] text-[12px] font-medium transition-all duration-150 shrink-0',
        active
          ? 'border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)]'
          : 'border-[var(--border-tertiary)] text-[var(--text-tertiary)] hover:border-[var(--border-secondary)] hover:text-[var(--text-secondary)]'
      )}
    >
      <div
        className="w-[6px] h-[6px] rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      {name}
      <span className={cn('text-[10px]', active ? 'text-[var(--text-secondary)]' : 'text-[var(--text-ghost)]')}>
        {count}
      </span>
    </button>
  );
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
  onNavigate?: (conversationId: string) => void;
}

export function SearchOverlay({ isOpen, onClose, onNavigate }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTopicFilter, setActiveTopicFilter] = useState<TopicId | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Filter results based on query + topic filter
  const results = useMemo(() => {
    let filtered = ALL_CONVERSATIONS;

    // Apply topic filter
    if (activeTopicFilter) {
      filtered = filtered.filter((c) => c.topicId === activeTopicFilter);
    }

    // Apply text search
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.preview.toLowerCase().includes(q) ||
          (c.project?.toLowerCase().includes(q) ?? false)
      );
    }

    return filtered;
  }, [query, activeTopicFilter]);

  // Count results per topic (for filter chips, based on text query only)
  const topicCounts = useMemo(() => {
    let filtered = ALL_CONVERSATIONS;
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.preview.toLowerCase().includes(q) ||
          (c.project?.toLowerCase().includes(q) ?? false)
      );
    }
    const counts: Record<string, number> = {};
    for (const c of filtered) {
      counts[c.topicId] = (counts[c.topicId] || 0) + 1;
    }
    return counts;
  }, [query]);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setActiveTopicFilter(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Scroll selected result into view
  useEffect(() => {
    if (!resultsRef.current) return;
    const selected = resultsRef.current.children[selectedIndex] as HTMLElement;
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && results[selectedIndex]) {
        onNavigate?.(results[selectedIndex].id);
        onClose();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [isOpen, results, selectedIndex, onClose, onNavigate]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Should we show the topic filter chips?
  const showTopicFilters = query.trim().length > 0 && results.length > 0;
  const hasActiveSearch = query.trim().length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] px-4">
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
                placeholder="Search conversations..."
                className="flex-1 text-[15px] text-[var(--text-primary)] bg-transparent outline-none placeholder-[var(--text-ghost)] font-sans"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    setActiveTopicFilter(null);
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

            {/* Topic filter chips (only shown when there are results) */}
            {showTopicFilters && (
              <div className="flex items-center gap-2 px-4 py-2.5 border-b-[0.5px] border-[var(--border-tertiary)] overflow-x-auto">
                <button
                  onClick={() => setActiveTopicFilter(null)}
                  className={cn(
                    'text-[12px] font-medium px-2.5 py-1 rounded-full border-[0.5px] transition-all duration-150 shrink-0',
                    !activeTopicFilter
                      ? 'border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                      : 'border-[var(--border-tertiary)] text-[var(--text-tertiary)] hover:border-[var(--border-secondary)]'
                  )}
                >
                  All
                </button>
                {TOPICS.filter((t) => (topicCounts[t.id] || 0) > 0).map((topic) => (
                  <TopicChip
                    key={topic.id}
                    name={topic.name}
                    color={topic.color}
                    count={topicCounts[topic.id] || 0}
                    active={activeTopicFilter === topic.id}
                    onClick={() =>
                      setActiveTopicFilter(
                        activeTopicFilter === topic.id ? null : topic.id
                      )
                    }
                  />
                ))}
              </div>
            )}

            {/* Result count */}
            {hasActiveSearch && results.length > 0 && (
              <div className="px-4 py-1.5 text-[11px] text-[var(--text-ghost)]">
                {results.length} result{results.length !== 1 ? 's' : ''}
                {activeTopicFilter && (
                  <span>
                    {' '}
                    in {TOPICS.find((t) => t.id === activeTopicFilter)?.name}
                  </span>
                )}
              </div>
            )}

            {/* Results area */}
            <div ref={resultsRef} className="max-h-[320px] overflow-y-auto">
              {/* Empty state: no query yet */}
              {!hasActiveSearch && (
                <div className="px-4 py-3">
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

              {/* No results */}
              {hasActiveSearch && results.length === 0 && (
                <div className="py-10 text-center">
                  <p className="text-[14px] text-[var(--text-tertiary)]">
                    No conversations found for "{query}"
                  </p>
                  {activeTopicFilter && (
                    <button
                      onClick={() => setActiveTopicFilter(null)}
                      className="mt-2 text-[12px] text-[var(--text-info)] hover:underline"
                    >
                      Search all topics instead
                    </button>
                  )}
                </div>
              )}

              {/* Results list */}
              {hasActiveSearch &&
                results.map((result, idx) => {
                  const matchField = getMatchField(result, query);
                  return (
                    <div
                      key={result.id}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => {
                        onNavigate?.(result.id);
                        onClose();
                      }}
                      className={cn(
                        'px-4 py-3 cursor-pointer flex items-start gap-3 transition-colors duration-100',
                        idx === selectedIndex
                          ? 'bg-[var(--surface-hover)]'
                          : 'hover:bg-[rgba(31,30,29,0.02)]'
                      )}
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: result.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-[14px] font-semibold text-[var(--text-primary)] truncate flex-1">
                            <HighlightText text={result.title} query={query} />
                          </h4>
                          {matchField !== 'title' && <MatchBadge field={matchField} />}
                          <span className="text-[12px] text-[var(--text-tertiary)] shrink-0">
                            {result.timestamp}
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
                })}
            </div>

            {/* Footer hints */}
            <div className="px-4 py-2 border-t-[0.5px] border-[var(--border-tertiary)] flex items-center gap-4">
              {[
                { key: '↑↓', label: 'Navigate' },
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