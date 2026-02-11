'use client';

import { Plus, ArrowUp, ChevronDown } from 'lucide-react';

export function ChatInput() {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex justify-center pt-4 pointer-events-none"
      style={{
        background: 'linear-gradient(to bottom, transparent, var(--surface-app) 30%)',
        paddingBottom: 'max(16px, calc(16px + env(safe-area-inset-bottom, 0px)))',
      }}
    >
      <div
        className="w-full pointer-events-auto"
        style={{
          maxWidth: 'var(--chat-input-width)',
          padding: '0 16px',
        }}
      >
        <div
          className="flex flex-col border-[0.5px] border-[var(--border-tertiary)] overflow-hidden"
          style={{
            backgroundColor: 'var(--surface-input)',
            borderRadius: 'var(--chat-input-radius)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Text area row */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-1">
              <span className="text-[var(--text-ghost)] text-[15px]">
                How can Claude help you today?
              </span>
              <span
                className="w-[2px] h-[18px] bg-[var(--text-tertiary)] cursor-blink"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Toolbar row */}
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-2">
              <button
                aria-label="Attach file"
                className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors focus-ring"
              >
                <Plus size={18} strokeWidth={1.5} />
              </button>

              <button
                className="flex items-center gap-1 px-2 h-7 rounded-[var(--radius-sm)] text-[12px] font-medium text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] transition-colors focus-ring"
                aria-label="Select model"
              >
                <span>Sonnet 4.5</span>
                <ChevronDown size={12} />
              </button>
            </div>

            <button
              aria-label="Send message"
              className="flex items-center justify-center w-8 h-8 text-white transition-opacity hover:opacity-90 focus-ring"
              style={{
                backgroundColor: 'var(--accent-primary)',
                borderRadius: 'var(--interactive-radius)',
              }}
            >
              <ArrowUp size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
