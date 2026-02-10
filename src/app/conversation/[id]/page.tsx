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
  ArrowRightLeft,
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
import { TOPICS } from '@/data/topics';
import type { Message, TopicId } from '@/types';

// --- Code block parser ---
function parseMessageContent(content: string) {
  const parts: { type: 'text' | 'code'; content: string }[] = [];
  const segments = content.split('```');

  segments.forEach((segment, i) => {
    if (i % 2 === 0) {
      // Regular text
      if (segment) {
        parts.push({ type: 'text', content: segment });
      }
    } else {
      // Code block — strip optional language identifier from first line
      const lines = segment.split('\n');
      const firstLine = lines[0]?.trim();
      const hasLang = firstLine && !firstLine.includes(' ') && lines.length > 1;
      const code = hasLang ? lines.slice(1).join('\n') : segment;
      parts.push({ type: 'code', content: code.trim() });
    }
  });

  return parts;
}

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
        backgroundColor: 'var(--surface-input)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <code>{code}</code>
    </pre>
  );
}

// --- Topic pill for Move-to selector ---
function TopicPill({
  topic,
  isSelected,
  onClick,
}: {
  topic: { id: string; name: string; color: string };
  isSelected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const borderColor = isSelected
    ? topic.color
    : hovered
      ? 'var(--border-secondary)'
      : 'var(--border-tertiary)';

  const bgColor = isSelected
    ? hovered
      ? `color-mix(in srgb, ${topic.color} 30%, transparent)`
      : `color-mix(in srgb, ${topic.color} 20%, transparent)`
    : hovered
      ? 'var(--surface-hover)'
      : 'transparent';

  const textColor = isSelected
    ? topic.color
    : hovered
      ? 'var(--text-primary)'
      : 'var(--text-secondary)';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-1.5 rounded-lg text-[13px] font-medium cursor-pointer"
      style={{
        padding: '6px 12px',
        border: `1.5px solid ${borderColor}`,
        backgroundColor: bgColor,
        color: textColor,
        transition: 'all 0.15s ease',
      }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: topic.color }}
      />
      {topic.name}
    </button>
  );
}

// --- Move-to toast ---
function MoveToast({
  topic,
  onDone,
  onUndo,
}: {
  topic: { name: string; color: string };
  onDone: () => void;
  onUndo: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed z-[100] flex items-center gap-2.5 rounded-xl font-medium border-[0.5px]"
      style={{
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'var(--surface-card)',
        borderColor: 'var(--border-tertiary)',
        color: 'var(--text-secondary)',
        fontSize: 14,
        padding: '12px 20px',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      Moved to
      <span
        className="inline-flex items-center rounded text-[10px] font-medium text-white"
        style={{
          backgroundColor: topic.color,
          padding: '1px 7px',
        }}
      >
        {topic.name}
      </span>
      <span style={{ color: 'var(--border-tertiary)' }}>·</span>
      <button
        onClick={() => { onUndo(); onDone(); }}
        className="text-[13px] font-medium cursor-pointer"
        style={{ color: 'var(--text-tertiary)', transition: 'color 0.15s ease' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
      >
        Undo
      </button>
    </motion.div>
  );
}

// --- Breadcrumb dropdown menu ---
function BreadcrumbMenu({
  hasProject,
  currentTopicId,
  onClose,
  onMoveTo,
}: {
  hasProject: boolean;
  currentTopicId?: TopicId;
  onClose: () => void;
  onMoveTo: (topicId: TopicId) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showTopics, setShowTopics] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<TopicId | undefined>(currentTopicId);

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

  const handleDone = () => {
    if (selectedTopic && selectedTopic !== currentTopicId) {
      onMoveTo(selectedTopic);
    }
    onClose();
  };

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.12 }}
      className="absolute top-full right-0 mt-1 w-52 rounded-lg border-[0.5px] border-[var(--border-tertiary)] bg-[var(--surface-card)] py-1 z-50"
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

      {/* Move to... */}
      <button
        onClick={() => setShowTopics(!showTopics)}
        className={cn(
          'w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]',
          showTopics && 'bg-[var(--surface-hover)]'
        )}
      >
        <ArrowRightLeft size={15} strokeWidth={1.5} />
        Move to...
      </button>

      {/* Topic pills (inline expansion) */}
      <AnimatePresence initial={false}>
        {showTopics && (
          <motion.div
            key="topic-pills"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3 pt-2 pb-1">
              <div className="flex flex-wrap gap-1.5">
                {TOPICS.map((topic) => (
                  <TopicPill
                    key={topic.id}
                    topic={topic}
                    isSelected={selectedTopic === topic.id}
                    onClick={() => setSelectedTopic(topic.id)}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-end">
                {selectedTopic && selectedTopic !== currentTopicId ? (
                  <button
                    onClick={handleDone}
                    className="text-[13px] font-medium rounded-lg"
                    style={{
                      padding: '6px 14px',
                      backgroundColor: 'var(--bg-inverse)',
                      color: 'var(--text-inverse)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    Done
                  </button>
                ) : (
                  <button
                    onClick={handleDone}
                    className="text-[13px] font-medium"
                    style={{
                      color: 'var(--text-tertiary)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
}: {
  message: Message;
  index: number;
  prevRole?: 'user' | 'assistant';
}) {
  const isUser = message.role === 'user';
  const sameRoleAsPrev = prevRole === message.role;
  const gap = sameRoleAsPrev ? 'mt-2' : 'mt-6';

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

  // Assistant message
  const parts = parseMessageContent(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.03 }}
      className={cn('flex', index > 0 && gap)}
    >
      <div className="min-w-0">
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
  const [activeTopicId, setActiveTopicId] = useState<TopicId | undefined>(undefined);
  const [previousTopicId, setPreviousTopicId] = useState<TopicId | undefined>(undefined);
  const [toastTopic, setToastTopic] = useState<{ name: string; color: string } | null>(null);

  const conversation = useMemo(
    () => ALL_CONVERSATIONS.find((c) => c.id === id),
    [id]
  );
  const messages = CONVERSATION_MESSAGES[id] ?? [];

  // Initialize activeTopicId from conversation data
  useEffect(() => {
    if (conversation) setActiveTopicId(conversation.topicId);
  }, [conversation]);

  const handleMoveTo = useCallback((topicId: TopicId) => {
    setPreviousTopicId(activeTopicId);
    setActiveTopicId(topicId);
    const topic = TOPICS.find((t) => t.id === topicId);
    if (topic) setToastTopic({ name: topic.name, color: topic.color });
  }, [activeTopicId]);

  const handleUndoMove = useCallback(() => {
    if (previousTopicId) setActiveTopicId(previousTopicId);
    setToastTopic(null);
  }, [previousTopicId]);

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
          className="sticky top-0 z-20 pl-12 pr-4 md:px-6 py-3 min-h-[60px] lg:min-h-0 flex items-center backdrop-blur-md border-b-[0.5px] border-[var(--border-tertiary)]"
          style={{
            backgroundColor:
              'color-mix(in srgb, var(--surface-app) 85%, transparent)',
          }}
        >
          <div className="max-w-[720px] mx-auto flex items-center w-full">
            <div className="flex items-center gap-1.5 min-w-0 relative">
              {(() => {
                const topic = activeTopicId
                  ? TOPICS.find((t) => t.id === activeTopicId)
                  : null;
                return (
                  <Link
                    href={topic ? `/topic/${topic.id}` : '/'}
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
                    {topic ? topic.name : 'Chats'}
                  </Link>
                );
              })()}
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
                  currentTopicId={activeTopicId}
                  onClose={() => setIsMenuOpen(false)}
                  onMoveTo={handleMoveTo}
                />
              )}
            </div>
          </div>
        </div>

        {/* Chat thread */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[720px] mx-auto px-4 md:px-6 pt-6 pb-[140px]">
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
              messages.map((msg, i) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  index={i}
                  prevRole={i > 0 ? messages[i - 1].role : undefined}
                />
              ))
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

      {/* Move-to toast */}
      <AnimatePresence>
        {toastTopic && (
          <MoveToast
            topic={toastTopic}
            onDone={() => setToastTopic(null)}
            onUndo={handleUndoMove}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
