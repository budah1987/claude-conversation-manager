'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Bookmark } from '@/types';
import { SEED_BOOKMARKS } from '@/data/bookmarks';

// Actions
type BookmarkAction =
  | { type: 'ADD_BOOKMARK'; payload: Bookmark }
  | { type: 'REMOVE_BOOKMARK'; payload: string } // bookmark id
  | { type: 'SOFT_REMOVE_BOOKMARK'; payload: string } // soft delete for undo
  | { type: 'RESTORE_BOOKMARK'; payload: string } // restore from soft delete
  | { type: 'UPDATE_NOTE'; payload: { id: string; note: string } }
  | { type: 'INITIALIZE'; payload: Bookmark[] };

// State
interface BookmarkState {
  bookmarks: Bookmark[];
  pendingRemoval: Set<string>;
}

// Context value
interface BookmarkContextValue extends BookmarkState {
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (id: string) => void;
  softRemoveBookmark: (id: string) => void;
  restoreBookmark: (id: string) => void;
  updateNote: (id: string, note: string) => void;
  isBookmarked: (messageId: string) => boolean;
  getBookmarkForMessage: (messageId: string) => Bookmark | undefined;
}

const BookmarkContext = createContext<BookmarkContextValue | undefined>(undefined);

// Reducer
function bookmarkReducer(state: BookmarkState, action: BookmarkAction): BookmarkState {
  switch (action.type) {
    case 'INITIALIZE':
      return { bookmarks: action.payload, pendingRemoval: new Set() };

    case 'ADD_BOOKMARK':
      return {
        ...state,
        bookmarks: [...state.bookmarks, action.payload],
      };

    case 'SOFT_REMOVE_BOOKMARK':
      return {
        ...state,
        pendingRemoval: new Set([...state.pendingRemoval, action.payload]),
      };

    case 'RESTORE_BOOKMARK': {
      const newPendingRemoval = new Set(state.pendingRemoval);
      newPendingRemoval.delete(action.payload);
      return {
        ...state,
        pendingRemoval: newPendingRemoval,
      };
    }

    case 'REMOVE_BOOKMARK': {
      const newPendingRemoval = new Set(state.pendingRemoval);
      newPendingRemoval.delete(action.payload);
      return {
        bookmarks: state.bookmarks.filter((b) => b.id !== action.payload),
        pendingRemoval: newPendingRemoval,
      };
    }

    case 'UPDATE_NOTE':
      return {
        ...state,
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
  const [state, dispatch] = useReducer(bookmarkReducer, {
    bookmarks: [],
    pendingRemoval: new Set<string>(),
  });

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

  // Persist to localStorage on changes (excluding pending removals)
  useEffect(() => {
    if (state.bookmarks.length > 0) {
      const activeBookmarks = state.bookmarks.filter(
        (b) => !state.pendingRemoval.has(b.id)
      );
      localStorage.setItem('bookmarks', JSON.stringify(activeBookmarks));
    }
  }, [state.bookmarks, state.pendingRemoval]);

  const addBookmark = (bookmark: Bookmark) => {
    dispatch({ type: 'ADD_BOOKMARK', payload: bookmark });
  };

  const removeBookmark = (id: string) => {
    dispatch({ type: 'REMOVE_BOOKMARK', payload: id });
  };

  const softRemoveBookmark = (id: string) => {
    dispatch({ type: 'SOFT_REMOVE_BOOKMARK', payload: id });
  };

  const restoreBookmark = (id: string) => {
    dispatch({ type: 'RESTORE_BOOKMARK', payload: id });
  };

  const updateNote = (id: string, note: string) => {
    dispatch({ type: 'UPDATE_NOTE', payload: { id, note } });
  };

  const isBookmarked = (messageId: string): boolean => {
    const bookmark = state.bookmarks.find((b) => b.messageId === messageId);
    return bookmark ? !state.pendingRemoval.has(bookmark.id) : false;
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
        softRemoveBookmark,
        restoreBookmark,
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
