// src/app/page.tsx
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatInputCentered } from '@/components/home/ChatInputCentered';
import { StreamingResponse } from '@/components/home/StreamingResponse';
import { ActionRow } from '@/components/conversation/ActionRow';
import { SearchOverlay } from '@/components/search/SearchOverlay';
import { useCommandK } from '@/hooks/useCommandK';
import ClaudeThinkingIcon from '@/components/ui/ClaudeThinkingIcon';
import { CONVERSATION_MESSAGES } from '@/data/messages';
import { useBookmarks } from '@/context/BookmarkContext';
import { useToast } from '@/context/ToastContext';
import { hasCodeBlocks, extractFirstCodeBlock } from '@/lib/codeBlockUtils';
import { useDemoSession } from '@/context/DemoSessionContext';

const DEMO_QUERY = 'What is react.js?';
const TYPING_DELAY_MS = 1000;
const CHAR_INTERVAL_MS = 60;
const THINKING_DURATION_MS = 1800;

type Phase = 'idle' | 'thinking' | 'streaming' | 'complete';

// Demo message identity
const DEMO_CONVERSATION_ID = 'react-demo';
const DEMO_CONVERSATION_TITLE = 'What is react.js?';
const DEMO_MESSAGE_ID = 'rd-2';

// Get the assistant response from the demo data
const demoMessages = CONVERSATION_MESSAGES[DEMO_CONVERSATION_ID];
const DEMO_RESPONSE = demoMessages?.find((m) => m.role === 'assistant')?.content ?? '';

export default function Home() {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Typing animation state
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isTypingDone, setIsTypingDone] = useState(false);
  const charIndexRef = useRef(0);

  // Post-send phase
  const [phase, setPhase] = useState<Phase>('idle');

  // Bookmark flow
  const {
    isBookmarked,
    addBookmark,
    removeBookmark,
    softRemoveBookmark,
    restoreBookmark,
    getBookmarkForMessage,
    updateNote,
  } = useBookmarks();
  const { showToast } = useToast();
  const { activateDemoConversation } = useDemoSession();

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

  // Typing animation effect
  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setIsTyping(true);

      const interval = setInterval(() => {
        charIndexRef.current += 1;
        const nextIndex = charIndexRef.current;

        if (nextIndex >= DEMO_QUERY.length) {
          setTypedText(DEMO_QUERY);
          setIsTyping(false);
          setIsTypingDone(true);
          clearInterval(interval);
        } else {
          setTypedText(DEMO_QUERY.slice(0, nextIndex));
        }
      }, CHAR_INTERVAL_MS);

      return () => clearInterval(interval);
    }, TYPING_DELAY_MS);

    return () => clearTimeout(startTimeout);
  }, []);

  // Thinking → streaming transition
  useEffect(() => {
    if (phase !== 'thinking') return;
    const timer = setTimeout(() => setPhase('streaming'), THINKING_DURATION_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  useCommandK(openSearch, closeSearch);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleConversationClick = useCallback((id: string, _messageId?: string) => {
    router.push(`/conversation/${id}`);
  }, [router]);

  const handleSend = useCallback(() => {
    if (isTypingDone && phase === 'idle') {
      setPhase('thinking');
      activateDemoConversation(DEMO_CONVERSATION_ID, DEMO_CONVERSATION_TITLE);
    }
  }, [isTypingDone, phase, activateDemoConversation]);

  const handleStreamingComplete = useCallback(() => {
    setPhase('complete');
  }, []);

  const createDemoBookmark = useCallback(() => {
    const hasCode = hasCodeBlocks(DEMO_RESPONSE);
    const codeBlockData = hasCode ? extractFirstCodeBlock(DEMO_RESPONSE) : null;

    const bookmark = {
      id: `bm-${Date.now()}`,
      variant: hasCode ? 'single-code' : 'single-text',
      conversationId: DEMO_CONVERSATION_ID,
      conversationTitle: DEMO_CONVERSATION_TITLE,
      messageId: DEMO_MESSAGE_ID,
      userQuery: DEMO_QUERY,
      responsePreview: DEMO_RESPONSE.slice(0, 150) + (DEMO_RESPONSE.length > 150 ? '...' : ''),
      fullResponse: DEMO_RESPONSE,
      tag: 'code' as const,
      createdAt: new Date().toISOString(),
      ...(codeBlockData ? {
        codeBlock: codeBlockData.code,
        codeLanguage: codeBlockData.language,
      } : {}),
    };

    addBookmark(bookmark as any);
    showToast({
      type: 'save',
      message: 'Saved',
      onAddNote: (note: string) => { updateNote(bookmark.id, note); },
      onView: () => { window.location.href = '/saved'; },
    });
  }, [addBookmark, showToast, updateNote]);

  const handleBookmarkClick = useCallback(() => {
    if (isBookmarked(DEMO_MESSAGE_ID)) {
      const bookmark = getBookmarkForMessage(DEMO_MESSAGE_ID);
      if (bookmark) {
        const bookmarkId = bookmark.id;
        softRemoveBookmark(bookmarkId);

        const removalTimer = setTimeout(() => {
          removeBookmark(bookmarkId);
        }, 4000);

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
      createDemoBookmark();
    }
  }, [isBookmarked, getBookmarkForMessage, softRemoveBookmark, removeBookmark, restoreBookmark, showToast, createDemoBookmark]);

  const hasSent = phase !== 'idle';

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
      <main className="flex-1 overflow-y-auto relative flex flex-col px-4 sm:px-6">
        <AnimatePresence mode="wait">
          {!hasSent ? (
            /* ── Pre-send: greeting + input + pills ── */
            <motion.div
              key="pre-send"
              className="flex-1 flex flex-col items-center justify-center"
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="w-full max-w-2xl flex flex-col items-center gap-8">
                {/* Greeting */}
                <h1
                  className="text-[28px] md:text-[32px] font-normal text-[var(--text-primary)] flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  <ClaudeThinkingIcon size={32} />
                  Evening, Amir
                </h1>

                {/* Centered chat input */}
                <ChatInputCentered
                  value={typedText}
                  isTyping={isTyping}
                  onSend={handleSend}
                />

                {/* Quick action pills */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-full border-[0.5px] border-[var(--border-tertiary)] bg-[var(--surface-card)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
                    aria-label="Write"
                  >
                    <span className="w-4 h-4 rounded bg-[var(--text-ghost)] opacity-20" aria-hidden="true" />
                    Write
                  </button>

                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-full border-[0.5px] border-[var(--border-tertiary)] bg-[var(--surface-card)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
                    aria-label="Learn"
                  >
                    <span className="w-4 h-4 rounded bg-[var(--text-ghost)] opacity-20" aria-hidden="true" />
                    Learn
                  </button>

                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-full border-[0.5px] border-[var(--border-tertiary)] bg-[var(--surface-card)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
                    aria-label="From Drive"
                  >
                    <span className="w-4 h-4 rounded bg-[var(--text-ghost)] opacity-20" aria-hidden="true" />
                    From Drive
                  </button>

                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-full border-[0.5px] border-[var(--border-tertiary)] bg-[var(--surface-card)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
                    aria-label="From Calendar"
                  >
                    <span className="w-4 h-4 rounded bg-[var(--text-ghost)] opacity-20" aria-hidden="true" />
                    From Calendar
                  </button>

                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-full border-[0.5px] border-[var(--border-tertiary)] bg-[var(--surface-card)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
                    aria-label="From Gmail"
                  >
                    <span className="w-4 h-4 rounded bg-[var(--text-ghost)] opacity-20" aria-hidden="true" />
                    From Gmail
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ── Post-send: user bubble + thinking/response ── */
            <motion.div
              key="post-send"
              className="flex-1 flex flex-col pt-12 pb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
                {/* User message bubble */}
                <div className="flex justify-end">
                  <div
                    className="px-4 py-3 rounded-2xl text-[15px] max-w-[80%]"
                    style={{
                      backgroundColor: 'var(--surface-user-bubble, var(--surface-card))',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {DEMO_QUERY}
                  </div>
                </div>

                {/* Assistant response area */}
                <div className="flex gap-3">
                  {/* Claude icon */}
                  <div className="flex-shrink-0 mt-1">
                    <ClaudeThinkingIcon
                      isThinking={phase === 'thinking'}
                      size={24}
                    />
                  </div>

                  {/* Response content */}
                  <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                      {phase === 'thinking' && (
                        <motion.div
                          key="thinking"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-[14px] text-[var(--text-tertiary)] pt-1"
                        >
                          Thinking…
                        </motion.div>
                      )}

                      {(phase === 'streaming' || phase === 'complete') && (
                        <motion.div
                          key="response"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <StreamingResponse
                            content={DEMO_RESPONSE}
                            onComplete={handleStreamingComplete}
                          />
                          {phase === 'complete' && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3, delay: 0.1 }}
                            >
                              <ActionRow
                                isBookmarked={isBookmarked(DEMO_MESSAGE_ID)}
                                onBookmarkClick={handleBookmarkClick}
                              />
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
