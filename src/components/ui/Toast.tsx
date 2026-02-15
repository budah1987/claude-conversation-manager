'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, RotateCcw, ArrowRight } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export function Toast() {
  const { toast, dismissToast, pauseTimer, resumeTimer } = useToast();
  const [noteInput, setNoteInput] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset note input state when toast changes
  useEffect(() => {
    setShowNoteInput(false);
    setNoteInput('');
  }, [toast]);

  // Auto-focus input when note input is shown
  useEffect(() => {
    if (showNoteInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showNoteInput]);

  if (!toast) return null;

  const handleAddNoteClick = () => {
    pauseTimer();
    setShowNoteInput(true);
  };

  const handleNoteSave = () => {
    if (toast.onAddNote && noteInput.trim()) {
      toast.onAddNote();
      dismissToast();
    }
  };

  const handleNoteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && noteInput.trim()) {
      handleNoteSave();
    } else if (e.key === 'Escape') {
      setShowNoteInput(false);
      setNoteInput('');
      resumeTimer();
    }
  };

  const handleCloseNoteInput = () => {
    setShowNoteInput(false);
    setNoteInput('');
    resumeTimer();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[100] max-w-[calc(100vw-40px)]"
        style={{
          width: showNoteInput ? 'min(400px, calc(100vw - 32px))' : 'auto',
          minWidth: showNoteInput ? 'min(340px, calc(100vw - 32px))' : '0',
        }}
      >
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: 'var(--toast-bg)',
            boxShadow: 'var(--shadow-lg)',
          }}
          onTouchStart={pauseTimer}
          onTouchEnd={resumeTimer}
        >
          {/* ─── Save Toast: Compact State ─── */}
          {toast.type === 'save' && !showNoteInput && (
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Check icon */}
              <div
                className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--toast-check-bg)' }}
              >
                <Check
                  size={12}
                  strokeWidth={3}
                  style={{ color: 'var(--toast-check-color)' }}
                />
              </div>

              {/* Text */}
              <span
                className="text-[14px] font-medium whitespace-nowrap"
                style={{ color: 'var(--toast-text)' }}
              >
                Saved
              </span>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Actions */}
              <div className="flex items-center gap-0.5">
                {toast.onAddNote && (
                  <button
                    onClick={handleAddNoteClick}
                    className="px-2.5 py-1 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap"
                    style={{ color: 'var(--toast-accent)' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        'color-mix(in srgb, var(--toast-accent) 10%, transparent)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'transparent')
                    }
                  >
                    Add note
                  </button>
                )}

                {toast.onAddNote && toast.onView && (
                  <div
                    className="w-[1px] h-4 mx-1"
                    style={{ backgroundColor: 'var(--toast-border)' }}
                  />
                )}

                {toast.onView && (
                  <button
                    onClick={() => {
                      toast.onView?.();
                      dismissToast();
                    }}
                    className="px-2.5 py-1 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap"
                    style={{ color: 'var(--toast-secondary)' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        'color-mix(in srgb, var(--toast-text) 8%, transparent)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'transparent')
                    }
                  >
                    View
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ─── Save Toast: Note Input Expanded ─── */}
          {toast.type === 'save' && showNoteInput && (
            <div className="p-3.5 px-4">
              {/* Top row */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--toast-check-bg)' }}
                >
                  <Check
                    size={12}
                    strokeWidth={3}
                    style={{ color: 'var(--toast-check-color)' }}
                  />
                </div>
                <span
                  className="text-[14px] font-medium"
                  style={{ color: 'var(--toast-text)' }}
                >
                  Saved
                </span>
                <div className="flex-1" />
                <button
                  onClick={handleCloseNoteInput}
                  className="w-8 h-8 flex items-center justify-center rounded transition-colors"
                  style={{ color: 'var(--toast-ghost)' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = 'var(--toast-secondary)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = 'var(--toast-ghost)')
                  }
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>

              {/* Input with inline save button */}
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={handleNoteKeyDown}
                  placeholder="Add a note to this bookmark..."
                  className="w-full text-[13px] rounded-lg px-3 py-2.5 pr-11 outline-none transition-colors"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--toast-text)',
                    backgroundColor: 'var(--toast-input-bg)',
                    border: '1px solid var(--toast-input-border)',
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = 'var(--toast-accent)')
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor =
                      'var(--toast-input-border)')
                  }
                />
                <button
                  onClick={handleNoteSave}
                  disabled={!noteInput.trim()}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-md flex items-center justify-center transition-all disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: noteInput.trim()
                      ? 'var(--toast-accent)'
                      : 'transparent',
                    color: noteInput.trim() ? '#FFFFFF' : 'var(--toast-ghost)',
                  }}
                >
                  <ArrowRight size={14} strokeWidth={2.5} />
                </button>
              </div>

              {/* Hint */}
              <p
                className="text-[11px] mt-2 leading-[1.4]"
                style={{ color: 'var(--toast-ghost)' }}
              >
                Press Enter to save · Esc to skip
              </p>
            </div>
          )}

          {/* ─── Remove Toast ─── */}
          {toast.type === 'remove' && (
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Icon */}
              <div
                className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor:
                    'color-mix(in srgb, var(--toast-ghost) 12%, transparent)',
                }}
              >
                <RotateCcw
                  size={12}
                  strokeWidth={2.5}
                  style={{ color: 'var(--toast-ghost)' }}
                />
              </div>

              {/* Text */}
              <span
                className="text-[14px] font-medium whitespace-nowrap"
                style={{ color: 'var(--toast-text)' }}
              >
                {toast.message}
              </span>

              {/* Spacer */}
              {toast.onUndo && <div className="flex-1" />}

              {/* Undo button */}
              {toast.onUndo && (
                <button
                  onClick={() => {
                    toast.onUndo?.();
                    dismissToast();
                  }}
                  className="px-2.5 py-1 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap"
                  style={{ color: 'var(--toast-accent)' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      'color-mix(in srgb, var(--toast-accent) 10%, transparent)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'transparent')
                  }
                >
                  Undo
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
