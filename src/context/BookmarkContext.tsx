'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Bookmark } from '@/types';
import { SEED_BOOKMARKS } from '@/data/bookmarks';

// Actions
type BookmarkAction =
  | { type: 'ADD_BOOKMARK'; payload: Bookmark }
  | { type: 'REMOVE_BOOKMARK'; payload: string } // bookmark id
  | { type: 'UPDATE_NOTE'; payload: { id: string; note: string } }
  | { type: 'INITIALIZE'; payload: Bookmark[] };

// State
interface BookmarkState {
  bookmarks: Bookmark[];
}

// Context value
interface BookmarkContextValue extends BookmarkState {
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (id: string) => void;
  updateNote: (id: string, note: string) => void;
  isBookmarked: (messageId: string) => boolean;
  getBookmarkForMessage: (messageId: string) => Bookmark | undefined;
}

const BookmarkContext = createContext<BookmarkContextValue | undefined>(undefined);

// Reducer
function bookmarkReducer(state: BookmarkState, action: BookmarkAction): BookmarkState {
  switch (action.type) {
    case 'INITIALIZE':
      return { bookmarks: action.payload };

    case 'ADD_BOOKMARK':
      return {
        bookmarks: [...state.bookmarks, action.payload],
      };

    case 'REMOVE_BOOKMARK':
      return {
        bookmarks: state.bookmarks.filter((b) => b.id !== action.payload),
      };

    case 'UPDATE_NOTE':
      return {
        bookmarks: state.bookmarks.map((b) =>
          b.id === action.payload.id ? { ...b, note: action.payload.note } : b
        ),
      };

    default:
      return state;
  }
}

// Provider
export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookmarkReducer, { bookmarks: [] });

  // Initialize from localStorage or seed data
  useEffect(() => {
    const stored = localStorage.getItem('bookmarks');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        dispatch({ type: 'INITIALIZE', payload: parsed });
      } catch {
        // If parsing fails, use seed data
        dispatch({ type: 'INITIALIZE', payload: SEED_BOOKMARKS });
      }
    } else {
      // First load - use seed data
      dispatch({ type: 'INITIALIZE', payload: SEED_BOOKMARKS });
    }
  }, []);

  // Persist to localStorage on changes
  useEffect(() => {
    if (state.bookmarks.length > 0) {
      localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
    }
  }, [state.bookmarks]);

  const addBookmark = (bookmark: Bookmark) => {
    dispatch({ type: 'ADD_BOOKMARK', payload: bookmark });
  };

  const removeBookmark = (id: string) => {
    dispatch({ type: 'REMOVE_BOOKMARK', payload: id });
  };

  const updateNote = (id: string, note: string) => {
    dispatch({ type: 'UPDATE_NOTE', payload: { id, note } });
  };

  const isBookmarked = (messageId: string): boolean => {
    return state.bookmarks.some((b) => b.messageId === messageId);
  };

  const getBookmarkForMessage = (messageId: string): Bookmark | undefined => {
    return state.bookmarks.find((b) => b.messageId === messageId);
  };

  return (
    <BookmarkContext.Provider
      value={{
        ...state,
        addBookmark,
        removeBookmark,
        updateNote,
        isBookmarked,
        getBookmarkForMessage,
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
}

// Hook
export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error('useBookmarks must be used within BookmarkProvider');
  }
  return context;
}
