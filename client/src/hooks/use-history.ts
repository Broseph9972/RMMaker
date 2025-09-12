import { useState, useCallback, useEffect } from 'react';

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useHistory<T>(initialState: T) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: []
  });

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const undo = useCallback(() => {
    if (!canUndo) return;

    setHistory(currentHistory => {
      const previous = currentHistory.past[currentHistory.past.length - 1];
      const newPast = currentHistory.past.slice(0, currentHistory.past.length - 1);
      
      return {
        past: newPast,
        present: previous,
        future: [currentHistory.present, ...currentHistory.future]
      };
    });
  }, [canUndo]);

  const redo = useCallback(() => {
    if (!canRedo) return;

    setHistory(currentHistory => {
      const next = currentHistory.future[0];
      const newFuture = currentHistory.future.slice(1);
      
      return {
        past: [...currentHistory.past, currentHistory.present],
        present: next,
        future: newFuture
      };
    });
  }, [canRedo]);

  const pushState = useCallback((newState: T) => {
    setHistory(currentHistory => ({
      past: [...currentHistory.past, currentHistory.present],
      present: newState,
      future: [] // Clear future when new state is added
    }));
  }, []);

  const replaceState = useCallback((newState: T) => {
    setHistory(currentHistory => ({
      ...currentHistory,
      present: newState
    }));
  }, []);

  const clearHistory = useCallback((newState: T) => {
    setHistory({
      past: [],
      present: newState,
      future: []
    });
  }, []);

  return {
    state: history.present,
    canUndo,
    canRedo,
    undo,
    redo,
    pushState,
    replaceState,
    clearHistory
  };
}