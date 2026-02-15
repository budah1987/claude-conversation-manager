// src/app/conversation/[id]/page.tsx
'use client';

import { use, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronDown,
  Pin,
  Pencil,
  FolderMinus,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatInput } from '@/components/layout/ChatInput';
import { SearchOverlay } from '@/components/search/SearchOverlay';
import { useCommandK } from '@/hooks/useCommandK';
import { ALL_CONVERSATIONS } from '@/data/conversations';
import { CONVERSATION_MESSAGES } from '@/data/messages';
import { useBookmarks } from '@/context/BookmarkContext';
import { useToast } from '@/context/ToastContext';
import { ActionRow } from '@/components/conversation/ActionRow';
import { CheckboxPanel } from '@/components/conversation/CheckboxPanel';
import { BookmarkIndicator } from '@/components/conversation/BookmarkIndicator';
import type { Message } from '@/types';
import { parseMessageContent, getLineColor, hasCodeBlocks, extractFirstCodeBlock } from '@/lib/codeBlockUtils';

// --- Code block parser (now imported from @/lib/codeBlockUtils) ---

// --- Inline markdown: bold ---
function renderInline(text: string) {
  const parts: (string | React.ReactElement)[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(<strong key={match.index}>{match[1]}</strong>);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// --- Text renderer (handles \n\n paragraphs, - list items, **bold**) ---
function TextBlock({ text }: { text: string }) {
  const paragraphs = text.split('\n\n');
  return (
    <>
      {paragraphs.map((para, i) => {
        if (!para.trim()) return null;
        const lines = para.split('\n');

        // Check if all non-empty lines are list items
        const nonEmpty = lines.filter((l) => l.trim());
        const allList = nonEmpty.length > 0 && nonEmpty.every((l) => l.trimStart().startsWith('- '));

        if (allList) {
          return (
            <ul key={i} className={cn('list-disc pl-5 space-y-1', i > 0 && 'mt-4')}>
              {nonEmpty.map((line, j) => (
                <li key={j}>{renderInline(line.trimStart().slice(2))}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className={i > 0 ? 'mt-4' : ''}>
            {lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {renderInline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
}

// --- Code block renderer ---
function CodeBlock({ code }: { code: string }) {
  return (
    <pre
      className="my-3 rounded-lg p-4 overflow-x-auto text-[13px] leading-relaxed"
      style={{
        backgroundColor: 'var(--code-bg)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <code>
        {code.split('\n').map((line, i) => (
          <div key={i} style={{ color: getLineColor(line) }}>
            {line || ' '}
          </div>
        ))}
      </code>
    </pre>
  );
}

// --- Breadcrumb dropdown menu ---
function BreadcrumbMenu({
  hasProject,
  onClose,
}: {
  hasProject: boolean;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const topItems = [
    { icon: Pin, label: 'Unpin', danger: false },
    { icon: Pencil, label: 'Rename', danger: false },
  ];

  const bottomItems = [
    ...(hasProject
      ? [{ icon: FolderMinus, label: 'Remove from project', danger: false }]
      : []),
    { icon: Trash2, label: 'Delete', danger: true },
  ];

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.12 }}
      className="absolute top-full left-0 md:left-auto md:right-0 mt-1 w-52 max-w-[calc(100vw-2rem)] rounded-lg border-[0.5px] border-[var(--border-tertiary)] bg-[var(--surface-card)] py-1 z-50"
      style={{ boxShadow: 'var(--shadow-md)' }}
    >
      {topItems.map((item) => (
        <button
          key={item.label}
          onClick={onClose}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
        >
          <item.icon size={15} strokeWidth={1.5} />
          {item.label}
        </button>
      ))}

      {bottomItems.map((item) => (
        <button
          key={item.label}
          onClick={onClose}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors hover:bg-[var(--surface-hover)]',
            item.danger
              ? 'text-[var(--text-danger)]'
              : 'text-[var(--text-secondary)]'
          )}
        >
          <item.icon size={15} strokeWidth={1.5} />
          {item.label}
        </button>
      ))}
    </motion.div>
  );
}

// --- Single chat message ---
function ChatMessage({
  message,
  index,
  prevRole,
  conversationId,
  conversationTitle,
  userQuery,
}: {
  message: Message;
  index: number;
  prevRole?: 'user' | 'assistant';
  conversationId: string;
  conversationTitle: string;
  userQuery?: string;
}) {
  const {
    isBookmarked,
    addBookmark,
    removeBookmark,
    softRemoveBookmark,
    restoreBookmark,
    getBookmarkForMessage,
  } = useBookmarks();
  const { showToast } = useToast();
  const [showCheckboxPanel, setShowCheckboxPanel] = useState(false);

  const isUser = message.role === 'user';
  const sameRoleAsPrev = prevRole === message.role;
  const gap = sameRoleAsPrev ? 'mt-2' : 'mt-6';

  const messageIsBookmarked = !isUser && isBookmarked(message.id);
  const hasSolutions = !isUser && message.solutions && message.solutions.length > 0;

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.03 }}
        className={cn('flex justify-end', index > 0 && gap)}
      >
        <div className="max-w-[85%]">
          <div
            className="px-[18px] py-[14px] md:px-4 md:py-3 rounded-2xl"
            style={{
              backgroundColor: 'var(--surface-message-user)',
              fontFamily: 'var(--font-sans)',
              fontSize: '15px',
              lineHeight: '1.5',
              color: 'var(--text-primary)',
            }}
          >
            {message.content}
          </div>
          <p
            className="mt-1 text-right pr-2"
            style={{
              fontSize: '11px',
              color: 'var(--text-ghost)',
            }}
          >
            {message.timestamp}
          </p>
        </div>
      </motion.div>
    );
  }

  const handleBookmarkClick = () => {
    if (messageIsBookmarked) {
      // Remove bookmark with undo
      const bookmark = getBookmarkForMessage(message.id);
      if (bookmark) {
        const bookmarkId = bookmark.id;

        // Soft remove (can be undone)
        softRemoveBookmark(bookmarkId);

        // Set timer to permanently remove after 4 seconds
        const removalTimer = setTimeout(() => {
          removeBookmark(bookmarkId);
        }, 4000);

        // Show toast with undo
        showToast({
          type: 'remove',
          message: 'Bookmark removed',
          onUndo: () => {
            clearTimeout(removalTimer);
            restoreBookmark(bookmarkId);
          },
        });
      }
    } else {
      // Add bookmark
      if (hasSolutions) {
        // Show checkbox panel for multi-solution
        setShowCheckboxPanel(true);
      } else {
        // Save single-solution
        createBookmark();
      }
    }
  };

  const createBookmark = (selectedSolutionIndices?: number[]) => {
    // Detect code blocks in message content
    const hasCode = hasCodeBlocks(message.content);
    const codeBlockData = hasCode ? extractFirstCodeBlock(message.content) : null;

    const bookmark = {
      id: `bm-${Date.now()}`,
      variant: (hasSolutions && selectedSolutionIndices && selectedSolutionIndices.length > 1)
        ? 'multi-bookmark'
        : (hasSolutions && selectedSolutionIndices && selectedSolutionIndices.length === 1)
        ? 'single-option'
        : hasCode  // Check for code blocks!
        ? 'single-code'
        : 'single-text',
      conversationId,
      conversationTitle,
      messageId: message.id,
      userQuery: userQuery || 'User query',
      responsePreview: message.content.slice(0, 150) + (message.content.length > 150 ? '...' : ''),
      fullResponse: message.content,
      tag: 'code' as const,
      createdAt: new Date().toISOString(),

      // Populate codeBlock and codeLanguage properties
      ...(codeBlockData ? {
        codeBlock: codeBlockData.code,
        codeLanguage: codeBlockData.language,
      } : {}),

      // Existing solution handling
      ...(hasSolutions && selectedSolutionIndices && selectedSolutionIndices.length > 1 ? {
        selectedOptions: selectedSolutionIndices.map((i) => message.solutions![i]),
        unselectedOptions: message.solutions!.filter((_, i) => !selectedSolutionIndices.includes(i)),
      } : {}),
      ...(hasSolutions && selectedSolutionIndices && selectedSolutionIndices.length === 1 ? {
        optionLabel: `OPTION ${String.fromCharCode(65 + selectedSolutionIndices[0])}`,
        totalOptions: message.solutions!.length,
      } : {}),
    };

    addBookmark(bookmark as any);
    showToast({
      type: 'save',
      message: 'Saved',
      onAddNote: () => {
        // Note will be added via toast input
      },
      onView: () => {
        window.location.href = '/saved';
      },
    });
    setShowCheckboxPanel(false);
  };

  const handleCheckboxSave = (selectedIndices: number[]) => {
    createBookmark(selectedIndices);
  };

  // Assistant message
  const parts = parseMessageContent(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.03 }}
      className={cn('flex', index > 0 && gap)}
    >
      <div
        className="min-w-0 w-full relative group"
        onMouseEnter={(e) => {
          if (messageIsBookmarked) {
            e.currentTarget.style.backgroundColor = 'var(--query-bg)';
            e.currentTarget.style.borderColor = 'var(--query-border)';
          } else {
            e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--accent-primary) 6%, transparent)';
            e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent-primary) 30%, transparent)';
          }
        }}
        onMouseLeave={(e) => {
          if (messageIsBookmarked) {
            e.currentTarget.style.backgroundColor = 'var(--card-bg)';
            e.currentTarget.style.borderColor = 'var(--query-border)';
          } else {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }
        }}
        style={{
          borderRadius: '12px',
          margin: '-1px',
          padding: '16px',
          transition: 'background-color 150ms ease, border-color 150ms ease',
          border: '1px solid transparent',
          backgroundColor: messageIsBookmarked ? 'var(--card-bg)' : 'transparent',
          borderColor: messageIsBookmarked ? 'var(--query-border)' : 'transparent',
        }}
      >
        {/* Bookmark indicator for bookmarked messages */}
        {messageIsBookmarked && <BookmarkIndicator />}

        <div
          className="text-[17px] leading-[1.7] md:text-[16px] md:leading-[1.6]"
          style={{
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-primary)',
          }}
        >
          {parts.map((part, i) =>
            part.type === 'code' ? (
              <CodeBlock key={i} code={part.content} />
            ) : (
              <TextBlock key={i} text={part.content} />
            )
          )}
        </div>

        {/* Action row */}
        <ActionRow
          isBookmarked={messageIsBookmarked}
          onBookmarkClick={handleBookmarkClick}
          hasMultipleSolutions={hasSolutions}
        />

        {/* Checkbox panel for multi-solution */}
        <AnimatePresence>
          {showCheckboxPanel && hasSolutions && (
            <CheckboxPanel
              solutions={message.solutions!}
              onSave={handleCheckboxSave}
              onCancel={() => setShowCheckboxPanel(false)}
            />
          )}
        </AnimatePresence>

        <p
          className="mt-1"
          style={{
            fontSize: '11px',
            color: 'var(--text-ghost)',
          }}
        >
          {message.timestamp}
        </p>
      </div>
    </motion.div>
  );
}

// --- Main Page ---
export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const conversation = useMemo(
    () => ALL_CONVERSATIONS.find((c) => c.id === id),
    [id]
  );
  const messages = CONVERSATION_MESSAGES[id] ?? [];

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

  // Empty state — conversation ID not found
  if (!conversation) {
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
            No messages yet
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
        activeConversationId={id}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        {/* Breadcrumb header */}
        <div
          className="sticky top-0 z-20 pl-12 pr-4 md:px-6 py-3 min-h-[48px] lg:min-h-0 flex items-center backdrop-blur-md border-b-[0.5px] border-[var(--border-tertiary)]"
          style={{
            backgroundColor:
              'color-mix(in srgb, var(--surface-app) 85%, transparent)',
          }}
        >
          <div className="max-w-[720px] mx-auto flex items-center w-full">
            <div className="flex items-center gap-1.5 min-w-0 relative">
              <Link
                href="/"
                className="inline-flex items-center gap-1 shrink-0 text-[14px] font-medium transition-colors duration-150"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = 'var(--text-primary)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = 'var(--text-tertiary)')
                }
              >
                <ArrowLeft size={16} strokeWidth={2} />
                Chats
              </Link>
              <span
                className="text-[14px] shrink-0"
                style={{ color: 'var(--text-ghost)' }}
              >
                /
              </span>
              <button
                onMouseDown={(e) => e.nativeEvent.stopImmediatePropagation()}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-1 min-w-0 rounded-md cursor-pointer hover:bg-[var(--surface-hover)]"
                style={{
                  padding: '4px 8px',
                  transition: 'background-color 0.15s ease',
                }}
                aria-label="Conversation menu"
              >
                <span
                  className="text-sm md:text-[14px] font-semibold truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {conversation.title}
                </span>
                <ChevronDown
                  size={14}
                  className="shrink-0 text-[var(--text-tertiary)]"
                  style={{
                    transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>

              {/* Dropdown menu */}
              {isMenuOpen && (
                <BreadcrumbMenu
                  hasProject={!!conversation.project}
                  onClose={() => setIsMenuOpen(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Chat thread */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[720px] mx-auto px-4 md:px-6 pt-6" style={{ paddingBottom: 'calc(140px + env(safe-area-inset-bottom, 0px))' }}>
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p
                  className="text-[15px]"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  No messages yet
                </p>
              </div>
            ) : (
              messages.map((msg, i) => {
                // Find the most recent user message before this assistant message
                let userQuery = '';
                if (msg.role === 'assistant') {
                  for (let j = i - 1; j >= 0; j--) {
                    if (messages[j].role === 'user') {
                      userQuery = messages[j].content;
                      break;
                    }
                  }
                }

                return (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    index={i}
                    prevRole={i > 0 ? messages[i - 1].role : undefined}
                    conversationId={conversation.id}
                    conversationTitle={conversation.title}
                    userQuery={userQuery}
                  />
                );
              })
            )}
          </div>
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
