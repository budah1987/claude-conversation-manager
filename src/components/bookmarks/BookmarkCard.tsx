'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark as BookmarkType } from '@/types';
import { useBookmarks } from '@/context/BookmarkContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark as BookmarkIcon, ChevronDown, Trash2, Copy, Mail, Check, Lightbulb } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

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

// Simple syntax highlighter for code blocks
const getLineColor = (line: string): string => {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) return '#637777'; // comments
  if (trimmed.startsWith('const ') || trimmed.startsWith('function ') || trimmed.startsWith('async ') ||
      trimmed.startsWith('return ') || trimmed.startsWith('if ') || trimmed.startsWith('else ')) {
    return '#c792ea'; // keywords
  }
  return '#c2c0b2'; // default code
};

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
                backgroundColor: 'rgba(245, 244, 237, 1)',
                border: '1px solid rgba(31, 30, 29, 0.06)',
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
                  color: 'rgba(61, 61, 58, 1)',
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
                      backgroundColor: 'rgba(245, 244, 237, 1)',
                      color: 'rgba(61, 61, 58, 1)',
                      border: '1px solid rgba(31, 30, 29, 0.1)',
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
                backgroundColor: 'rgba(245, 244, 237, 1)',
                border: '1px solid rgba(31, 30, 29, 0.1)',
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
  const { removeBookmark, updateNote } = useBookmarks();

  const handleBookmarkClick = () => {
    removeBookmark(bookmark.id);
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
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(31, 30, 29, 0.15)',
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
          backgroundColor: 'rgba(245, 244, 237, 1)',
          border: '1px solid rgba(31, 30, 29, 0.06)',
          borderRadius: '8px',
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            color: 'rgba(61, 61, 58, 1)',
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
            background: 'rgba(245, 244, 237, 0.5)',
            border: '1px solid rgba(31, 30, 29, 0.1)',
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
            e.currentTarget.style.backgroundColor = 'rgba(245, 244, 237, 1)';
            e.currentTarget.style.borderColor = 'rgba(31, 30, 29, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(245, 244, 237, 0.5)';
            e.currentTarget.style.borderColor = 'rgba(31, 30, 29, 0.1)';
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
  const paragraphs = bookmark.fullResponse.split('\n\n').filter((p) => p.trim());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10.8px', width: '100%' }}>
      {paragraphs.map((paragraph, index) => (
        <div key={index} style={{ alignSelf: 'stretch' }}>
          <span
            style={{
              color: 'rgba(61, 61, 58, 1)',
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

function SingleCodeVariant({ bookmark }: { bookmark: BookmarkType }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard();

  const handleCopy = async () => {
    if (bookmark.codeBlock) {
      await copyToClipboard(bookmark.codeBlock);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
      {/* Response text */}
      <div
        style={{
          color: 'rgba(61, 61, 58, 1)',
          fontSize: '14px',
          fontFamily: 'var(--font-serif)',
          lineHeight: '23.8px',
        }}
      >
        {bookmark.fullResponse}
      </div>

      {/* Code block */}
      {bookmark.codeBlock && (
        <div
          style={{
            width: '100%',
            backgroundColor: '#1e1e1d',
            border: '1px solid rgba(31, 30, 29, 0.06)',
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
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <span
              style={{
                color: 'rgba(115, 114, 108, 0.5)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 500,
              }}
            >
              {bookmark.codeLanguage || 'code'}
            </span>
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

          {/* Code content */}
          <div
            style={{
              padding: '12px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              lineHeight: '19.2px',
              whiteSpace: 'pre',
              overflowX: 'auto',
            }}
          >
            {bookmark.codeBlock.split('\n').map((line, i) => (
              <div key={i} style={{ color: getLineColor(line) }}>
                {line || ' '}
              </div>
            ))}
          </div>
        </div>
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
              backgroundColor: 'rgba(250, 250, 247, 1)',
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
                    color: isUnsaved ? 'rgba(115, 114, 108, 1)' : 'rgba(61, 61, 58, 1)',
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
                    color: 'rgba(61, 61, 58, 1)',
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
          backgroundColor: 'rgba(250, 250, 247, 1)',
          border: '1px solid rgba(31, 30, 29, 0.08)',
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
                color: 'rgba(61, 61, 58, 1)',
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
                color: 'rgba(61, 61, 58, 1)',
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

