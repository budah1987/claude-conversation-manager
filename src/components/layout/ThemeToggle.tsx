'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, mounted, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Render a placeholder with identical dimensions until hydration is complete
  if (!mounted) {
    return (
      <button
        aria-label="Switch to dark mode"
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)] transition-colors"
      >
        <span className="shrink-0 w-5 h-5" />
        Dark mode
      </button>
    );
  }

  return (
    <button
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)] transition-colors"
    >
      <span className="shrink-0 w-5 h-5 relative overflow-hidden flex items-center justify-center">
        <AnimatePresence mode="popLayout" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="absolute flex items-center justify-center"
            >
              <Moon size={20} strokeWidth={1.5} />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="absolute flex items-center justify-center"
            >
              <Sun size={20} strokeWidth={1.5} />
            </motion.div>
          )}
        </AnimatePresence>
      </span>
      {isDark ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
