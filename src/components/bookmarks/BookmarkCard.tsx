'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark as BookmarkType } from '@/types';
import { useBookmarks } from '@/context/BookmarkContext';
import { useToast } from '@/context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark as BookmarkIcon, ChevronDown, Trash2, Copy, Mail, Check, Lightbulb } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { parseMessageContent, getLineColor, countLines } from '@/lib/codeBlockUtils';

interface BookmarkCardProps {
  bookmark: BookmarkType;
}

// ────────────────────────────────────────────────────────────
// Helper Functions
// ────────────────────────────────────────────────────────────

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ────────────────────────────────────────────────────────────
// Code Block Display Component
// ────────────────────────────────────────────────────────────

interface CodeBlockDisplayProps {
  code: string;
  language?: string;
}

function CodeBlockDisplay({ code, language }: CodeBlockDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(true);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const codeRef = useRef<HTMLDivElement>(null);

  const lineCount = countLines(code);
  const shouldShowExpand = lineCount > 20;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    // Calculate scroll progress (0-1)
    const progress = scrollTop / (scrollHeight - clientHeight);
    setScrollProgress(progress);

    // Check if scrolled to bottom (within 10px threshold)
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setIsScrolledToBottom(isAtBottom);

    // Detect scroll direction for button fade behavior
    if (scrollTop > lastScrollTop && scrollTop > 10) {
      // Scrolling down - hide button
      setShowExpandButton(false);
    } else if (scrollTop < lastScrollTop) {
      // Scrolling up - show button
      setShowExpandButton(true);
    }
    setLastScrollTop(scrollTop);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Code block container with expand button INSIDE */}
      <div
        style={{
          backgroundColor: 'var(--code-bg)',
          borderRadius: '6px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Header with language label, line count, and copy button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Language label with line count badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-sans)',
                color: 'var(--code-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {language || 'code'}
            </span>
            {shouldShowExpand && (
              <>
                <span style={{ color: '#637777', fontSize: '11px' }}>•</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--code-text-muted)',
                    letterSpacing: '0.5px',
                  }}
                >
                  {lineCount} LINES
                </span>
              </>
            )}
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontFamily: 'var(--font-sans)',
              color: copied ? '#4ade80' : 'var(--code-text)',
              backgroundColor: 'var(--code-button-bg)',
              border: '1px solid var(--code-border)',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onMouseEnter={(e) => {
              if (!copied) {
                e.currentTarget.style.backgroundColor = 'var(--code-button-hover-bg)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--code-button-bg)';
            }}
          >
            {copied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>

        {/* Code content with scroll tracking */}
        <div
          ref={codeRef}
          onScroll={handleScroll}
          className="scrollbar-none"
          style={{
            padding: '12px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            lineHeight: '19.2px',
            whiteSpace: 'pre',
            overflowX: 'auto',
            maxHeight: isExpanded ? 'none' : '400px',
            overflowY: isExpanded ? 'visible' : 'auto',
            position: 'relative',
          }}
        >
          {code.split('\n').map((line, i) => (
            <div key={i} style={{ color: getLineColor(line) }}>
              {line || ' '}
            </div>
          ))}
        </div>

        {/* Bottom gradient fade indicator (only when scrollable and not at bottom) */}
        {!isExpanded && shouldShowExpand && !isScrolledToBottom && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60px',
              background: 'linear-gradient(to bottom, transparent, var(--code-bg))',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Scroll progress indicator (only when scrollable) */}
        {!isExpanded && shouldShowExpand && (
          <div
            style={{
              position: 'absolute',
              top: '47px', // Below header
              right: '2px',
              width: '3px',
              height: 'calc(100% - 47px)',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: `${scrollProgress * 100}%`,
                width: '100%',
                height: '30%',
                backgroundColor: 'rgba(198, 97, 63, 0.6)',
                borderRadius: '2px',
                transition: 'top 0.1s ease-out, opacity 0.2s',
                opacity: scrollProgress > 0.01 ? 1 : 0.3,
              }}
            />
          </div>
        )}

        {/* Expand/Collapse button INSIDE container at bottom - fades based on scroll direction */}
        {!isExpanded && shouldShowExpand && (
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              transition: 'opacity 0.3s ease-in-out',
              opacity: showExpandButton ? 1 : 0,
              pointerEvents: showExpandButton ? 'auto' : 'none',
              zIndex: 10,
            }}
          >
            <button
              onClick={() => setIsExpanded(true)}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                fontFamily: 'var(--font-sans)',
                color: 'var(--code-text)',
                backgroundColor: 'var(--code-expand-bg)',
                border: '1px solid var(--code-border)',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--code-expand-hover-bg)';
                e.currentTarget.style.borderColor = 'var(--code-border-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--code-expand-bg)';
                e.currentTarget.style.borderColor = 'var(--code-border)';
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              Show all {lineCount} lines
            </button>
          </div>
        )}

        {/* Show less button when expanded - positioned inside container */}
        {isExpanded && shouldShowExpand && (
          <div
            style={{
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                fontFamily: 'var(--font-sans)',
                color: '#c2c0b2',
                backgroundColor: 'rgba(30, 30, 29, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--code-expand-hover-bg)';
                e.currentTarget.style.borderColor = 'var(--code-border-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--code-expand-bg)';
                e.currentTarget.style.borderColor = 'var(--code-border)';
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  transform: 'rotate(180deg)',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              Show less
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Note Section Component
// ────────────────────────────────────────────────────────────

interface NoteSectionProps {
  bookmarkId: string;
  currentNote?: string;
  onNoteUpdate: (id: string, note: string) => void;
}

function NoteSection({ bookmarkId, currentNote, onNoteUpdate }: NoteSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [noteInput, setNoteInput] = useState(currentNote || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea height based on content
  useEffect(() => {
    if (textareaRef.current && isExpanded) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [noteInput, isExpanded]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent newline
      handleNoteSave();
      textareaRef.current?.blur(); // Exit focus
    } else if (e.key === 'Escape') {
      setNoteInput(currentNote || '');
      textareaRef.current?.blur();
    }
    // Shift+Enter: default behavior (new line)
  };

  const handleNoteSave = () => {
    const trimmed = noteInput.trim();
    if (trimmed !== currentNote) {
      onNoteUpdate(bookmarkId, trimmed);
    }
  };

  const handleNoteDelete = () => {
    onNoteUpdate(bookmarkId, '');
    setNoteInput('');
    setShowDeleteConfirm(false);
    setIsExpanded(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10px', gap: isExpanded ? '24px' : '0' }}>
      <button
        onClick={handleToggle}
        style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          padding: 0,
          transition: 'opacity 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        <ChevronDown
          size={16}
          strokeWidth={2}
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: 'rgba(115, 114, 108, 1)',
          }}
        />
        <span
          style={{
            marginTop: '4px',
            color: 'rgba(115, 114, 108, 1)',
            fontSize: '11px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            letterSpacing: '0.44px',
            textTransform: 'uppercase',
          }}
        >
          {isExpanded ? 'Hide Note' : 'View Note'}
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ width: '100%', overflow: 'hidden' }}
          >
            <div
              style={{
                width: '100%',
                padding: '9px 14px 10px',
                backgroundColor: 'var(--note-bg)',
                border: '1px solid var(--note-border)',
                borderRadius: '8px',
                boxSizing: 'border-box',
                position: 'relative',
              }}
            >
              <div style={{ marginBottom: '4px' }}>
                <span
                  style={{
                    color: 'rgba(115, 114, 108, 1)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 600,
                    letterSpacing: '0.44px',
                    textTransform: 'uppercase',
                  }}
                >
                  Note
                </span>
              </div>

              {/* Always-visible textarea */}
              <textarea
                ref={textareaRef}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onBlur={handleNoteSave}
                onKeyDown={handleKeyDown}
                placeholder="Add note"
                style={{
                  width: '100%',
                  minHeight: '40px',
                  maxHeight: '200px',
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: '1px solid transparent',
                  borderRadius: '4px',
                  outline: 'none',
                  resize: 'none',
                  color: 'var(--note-text)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-sans)',
                  lineHeight: '20.1px',
                  transition: 'border-color 0.2s ease',
                  overflow: 'auto',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(234, 179, 8, 0.5)';
                }}
              />

              {currentNote && !showDeleteConfirm && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    position: 'absolute',
                    bottom: '-24px',
                    left: '0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <Trash2 size={14} strokeWidth={2} style={{ color: '#dc2626' }} />
                </button>
              )}

              {showDeleteConfirm && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-28px',
                    left: '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: 'rgba(115, 114, 108, 1)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>Delete note?</span>
                  <button
                    onClick={handleNoteDelete}
                    style={{
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 500,
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 500,
                      backgroundColor: 'var(--note-bg)',
                      color: 'var(--note-text)',
                      border: '1px solid var(--note-border)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Footer Component
// ────────────────────────────────────────────────────────────

interface FooterProps {
  date: string;
  project?: string;
  savedCount?: string;
  isDraft?: boolean;
}

function Footer({ date, project, savedCount, isDraft }: FooterProps) {
  return (
    <footer
      style={{
        display: 'flex',
        alignItems: 'center',
        paddingTop: '10px',
        marginTop: isDraft ? 'auto' : '8px',
        borderTop: '1px solid rgba(31, 30, 29, 0.08)',
        gap: '8px',
        width: '100%',
      }}
    >
      <span style={{ fontSize: '12px', fontFamily: 'var(--font-sans)', color: 'rgba(115, 114, 108, 0.5)' }}>
        {formatDate(date)}
      </span>

      {project && (
        <>
          <span style={{ fontSize: '12px', color: 'rgba(115, 114, 108, 0.5)' }}>·</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'rgba(115, 114, 108, 1)' }}>
              Project:
            </span>
            <div
              style={{
                padding: '2px 10px',
                backgroundColor: 'var(--query-bg)',
                border: '1px solid var(--query-border)',
                borderRadius: '6px',
              }}
            >
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'rgba(115, 114, 108, 1)' }}>
                {project}
              </span>
            </div>
          </div>
        </>
      )}

      {savedCount && (
        <>
          <span style={{ fontSize: '12px', color: 'rgba(115, 114, 108, 0.5)' }}>·</span>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-sans)', color: 'rgba(115, 114, 108, 0.5)' }}>
            {savedCount}
          </span>
        </>
      )}
    </footer>
  );
}

// ────────────────────────────────────────────────────────────
// Main BookmarkCard Component
// ────────────────────────────────────────────────────────────

export function BookmarkCard({ bookmark }: BookmarkCardProps) {
  const router = useRouter();
  const { removeBookmark, softRemoveBookmark, restoreBookmark, updateNote } = useBookmarks();
  const { showToast } = useToast();

  const handleBookmarkClick = () => {
    // Soft remove (can be undone)
    softRemoveBookmark(bookmark.id);

    // Set timer to permanently remove after 4 seconds
    const removalTimer = setTimeout(() => {
      removeBookmark(bookmark.id);
    }, 4000);

    // Show toast with undo
    showToast({
      type: 'remove',
      message: 'Bookmark removed',
      onUndo: () => {
        clearTimeout(removalTimer);
        restoreBookmark(bookmark.id);
      },
    });
  };

  const handleViewConversation = () => {
    router.push(`/conversation/${bookmark.conversationId}#${bookmark.messageId}`);
  };

  return (
    <div
      style={{
        maxWidth: '560px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 24px',
        gap: '8px',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--query-border)',
        borderRadius: '12px',
        boxSizing: 'border-box',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Bookmark Icon */}
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <button
          onClick={handleBookmarkClick}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(198, 97, 63, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Remove bookmark"
        >
          <BookmarkIcon
            size={20}
            strokeWidth={2}
            fill="var(--accent-primary)"
            style={{ color: 'var(--accent-primary)' }}
          />
        </button>
      </div>

      {/* User Query Box */}
      <div
        style={{
          width: '100%',
          padding: '9px 14px 10px',
          backgroundColor: 'var(--query-bg)',
          border: '1px solid var(--query-border)',
          borderRadius: '8px',
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            color: 'var(--query-text)',
            fontSize: '13px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 400,
            lineHeight: '20.1px',
          }}
        >
          "{bookmark.userQuery}"
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: '100%', height: '1px', borderTop: '1px solid rgba(31, 30, 29, 0.08)', margin: '4px 0' }} />

      {/* Variant-specific content */}
      {bookmark.variant === 'single-text' && <SingleTextVariant bookmark={bookmark} />}
      {bookmark.variant === 'single-code' && <SingleCodeVariant bookmark={bookmark} />}
      {bookmark.variant === 'multi-bookmark' && <MultiBookmarkVariant bookmark={bookmark} />}
      {bookmark.variant === 'draft' && <DraftVariant bookmark={bookmark} />}
      {/* View full conversation link */}
      <div style={{ width: '100%', marginTop: '4px' }}>
        <button
          onClick={handleViewConversation}
          style={{
            background: 'var(--query-bg)',
            border: '1px solid var(--query-border)',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            color: 'rgba(115, 114, 108, 1)',
            fontSize: '12px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          View full conversation →
        </button>
      </div>

      {/* Note Section */}
      <NoteSection bookmarkId={bookmark.id} currentNote={bookmark.note} onNoteUpdate={updateNote} />

      {/* Footer */}
      <Footer
        date={bookmark.createdAt}
        project={bookmark.project}
        savedCount={
          bookmark.variant === 'multi-bookmark' && bookmark.options
            ? `${bookmark.options.filter((o) => o.isSaved).length} of ${bookmark.options.length} saved`
            : undefined
        }
        isDraft={bookmark.variant === 'draft'}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Variant Components
// ────────────────────────────────────────────────────────────

function SingleTextVariant({ bookmark }: { bookmark: BookmarkType }) {
  // Parse content for code blocks
  const parts = parseMessageContent(bookmark.fullResponse);
  const hasCode = parts.some(p => p.type === 'code');

  // If no code blocks, use existing paragraph logic
  if (!hasCode) {
    const paragraphs = bookmark.fullResponse.split('\n\n').filter((p) => p.trim());

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10.8px', width: '100%' }}>
        {paragraphs.map((paragraph, index) => (
          <div key={index} style={{ alignSelf: 'stretch' }}>
            <span
              style={{
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontFamily: 'var(--font-serif)',
                fontWeight: 400,
                lineHeight: '23.8px',
              }}
            >
              {paragraph}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Mixed text + code rendering
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {parts.map((part, i) => {
        if (part.type === 'code') {
          return (
            <CodeBlockDisplay
              key={i}
              code={part.content}
              language={part.language}
            />
          );
        }

        // Text content
        const paragraphs = part.content.split('\n\n').filter((p) => p.trim());
        return paragraphs.map((paragraph, j) => (
          <div key={`${i}-${j}`} style={{ alignSelf: 'stretch' }}>
            <span
              style={{
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontFamily: 'var(--font-serif)',
                fontWeight: 400,
                lineHeight: '23.8px',
              }}
            >
              {paragraph}
            </span>
          </div>
        ));
      })}
    </div>
  );
}

function SingleCodeVariant({ bookmark }: { bookmark: BookmarkType }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
      {/* Response text */}
      {bookmark.fullResponse && (
        <div
          style={{
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontFamily: 'var(--font-serif)',
            lineHeight: '23.8px',
          }}
        >
          {bookmark.fullResponse}
        </div>
      )}

      {/* Code block - use shared component */}
      {bookmark.codeBlock && (
        <CodeBlockDisplay
          code={bookmark.codeBlock}
          language={bookmark.codeLanguage}
        />
      )}
    </div>
  );
}

function MultiBookmarkVariant({ bookmark }: { bookmark: BookmarkType }) {
  const [expandedOption, setExpandedOption] = useState<string | null>(null);

  if (!bookmark.options) return null;

  const toggleOption = (id: string) => {
    setExpandedOption(expandedOption === id ? null : id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignSelf: 'stretch' }}>
      {bookmark.options.map((option) => {
        const isExpanded = expandedOption === option.id;
        const isUnsaved = !option.isSaved;

        return (
          <div
            key={option.id}
            style={{
              width: '100%',
              backgroundColor: 'var(--draft-bg)',
              borderRadius: '12px',
              overflow: 'hidden',
              opacity: isUnsaved ? 0.7 : 1,
            }}
          >
            <button
              onClick={() => toggleOption(option.id)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '12px 8px',
                background: 'none',
                border: 'none',
                borderBottom: isExpanded ? '1px solid rgba(31, 30, 29, 0.08)' : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                borderRadius: isExpanded ? '0' : '12px 12px 0 0',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isExpanded) {
                  e.currentTarget.style.backgroundColor = 'rgba(31, 30, 29, 0.02)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span
                  style={{
                    color: isUnsaved ? 'rgba(115, 114, 108, 0.5)' : 'rgba(198, 97, 63, 1)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 600,
                    letterSpacing: '0.44px',
                    textTransform: 'uppercase',
                  }}
                >
                  {option.label}
                </span>
                <span
                  style={{
                    color: isUnsaved ? 'rgba(115, 114, 108, 1)' : 'var(--text-primary)',
                    fontSize: '14px',
                    fontFamily: 'var(--font-serif)',
                    lineHeight: '21px',
                  }}
                >
                  {option.title}
                </span>
              </div>
              <div style={{ paddingTop: '4px' }}>
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  style={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    opacity: isUnsaved ? 0.4 : 1,
                    color: 'rgba(115, 114, 108, 1)',
                  }}
                />
              </div>
            </button>

            {isExpanded && (
              <div style={{ padding: '12px 8px 14px' }}>
                <p
                  style={{
                    margin: 0,
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontFamily: 'var(--font-serif)',
                    lineHeight: '23.8px',
                  }}
                >
                  {option.content}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DraftVariant({ bookmark }: { bookmark: BookmarkType }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard();

  const handleCopy = async () => {
    if (bookmark.draftContent) {
      await copyToClipboard(bookmark.draftContent);
    }
  };

  const paragraphs = bookmark.draftContent?.split('\n\n').filter((p) => p.trim()) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Draft container */}
      <div
        style={{
          backgroundColor: 'var(--draft-bg)',
          border: '1px solid var(--query-border)',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 14px',
            borderBottom: '1px solid rgba(31, 30, 29, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Mail size={13} strokeWidth={2} style={{ color: 'rgba(115, 114, 108, 0.5)' }} />
            <span
              style={{
                color: 'rgba(115, 114, 108, 0.5)',
                fontSize: '11px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.44px',
              }}
            >
              Draft Message
            </span>
          </div>
          <button
            onClick={handleCopy}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              padding: 0,
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {isCopied ? (
              <Check size={13} strokeWidth={2} style={{ color: '#10b981' }} />
            ) : (
              <Copy size={13} strokeWidth={2} style={{ color: '#73726c' }} />
            )}
            <span
              style={{
                color: isCopied ? '#10b981' : '#73726c',
                fontSize: '11px',
                fontWeight: 500,
                transition: 'color 0.2s ease',
              }}
            >
              {isCopied ? 'Copied!' : 'Copy'}
            </span>
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '23.7px', padding: '14px' }}>
          {paragraphs.map((paragraph, index) => (
            <span
              key={index}
              style={{
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontFamily: 'var(--font-serif)',
                lineHeight: '23.8px',
                whiteSpace: 'pre-line',
              }}
            >
              {paragraph}
            </span>
          ))}
        </div>
      </div>

      {/* Strategic note */}
      {bookmark.strategicNote && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 12px',
            backgroundColor: 'rgba(254, 249, 195, 0.3)',
            border: '1px solid rgba(234, 179, 8, 0.2)',
            borderRadius: '8px',
            marginTop: '4px',
          }}
        >
          <Lightbulb
            size={14}
            strokeWidth={2}
            style={{
              color: 'rgba(161, 98, 7, 1)',
              flexShrink: 0,
              marginTop: '3px',
            }}
          />
          <div style={{ flex: 1 }}>
            <span
              style={{
                color: 'rgba(161, 98, 7, 1)',
                fontSize: '11px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.44px',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Strategic Note
            </span>
            <span
              style={{
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                lineHeight: '23.8px',
              }}
            >
              {bookmark.strategicNote}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

