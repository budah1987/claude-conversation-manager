'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';

export type ToastType = 'save' | 'remove';

export interface ToastConfig {
  type: ToastType;
  message: string;
  onAddNote?: (note: string) => void;
  onView?: () => void;
  onUndo?: () => void;
}

interface ToastContextValue {
  toast: ToastConfig | null;
  showToast: (config: ToastConfig) => void;
  dismissToast: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const remainingTimeRef = useRef<number>(0);
  const timerStartedAtRef = useRef<number>(0);

  const dismissToast = useCallback(() => {
    setToast(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      const elapsed = Date.now() - timerStartedAtRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    }
  }, []);

  const resumeTimer = useCallback(() => {
    if (remainingTimeRef.current > 0) {
      timerStartedAtRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        dismissToast();
      }, remainingTimeRef.current);
    }
  }, [dismissToast]);

  const showToast = useCallback((config: ToastConfig) => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToast(config);

    // Set initial remaining time based on toast type
    const duration = config.type === 'save' ? 4000 : 6000;
    remainingTimeRef.current = duration;
    timerStartedAtRef.current = Date.now();

    // Auto-dismiss timer
    timerRef.current = setTimeout(() => {
      dismissToast();
    }, duration);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ toast, showToast, dismissToast, pauseTimer, resumeTimer }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
