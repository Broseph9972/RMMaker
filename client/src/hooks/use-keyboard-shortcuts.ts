import { useCallback, useEffect, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  repeatable?: boolean; // New property for keys that should repeat when held
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const pressedKeys = useRef<Set<string>>(new Set());
  const repeatIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const getShortcutKey = (event: KeyboardEvent) => {
    return `${event.ctrlKey ? 'ctrl+' : ''}${event.shiftKey ? 'shift+' : ''}${event.altKey ? 'alt+' : ''}${event.metaKey ? 'meta+' : ''}${event.key.toLowerCase()}`;
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable elements
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      return;
    }

    const keyCombo = getShortcutKey(event);

    // Prevent default browser behavior for our shortcuts
    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey;
      const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey;
      const altMatch = shortcut.altKey === undefined || shortcut.altKey === event.altKey;
      const metaMatch = shortcut.metaKey === undefined || shortcut.metaKey === event.metaKey;
      
      if (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        ctrlMatch &&
        shiftMatch &&
        altMatch &&
        metaMatch
      ) {
        event.preventDefault();
        
        // If this key combination isn't already being pressed
        if (!pressedKeys.current.has(keyCombo)) {
          pressedKeys.current.add(keyCombo);
          
          // Execute immediately
          shortcut.action();
          
          // If it's repeatable, set up interval for continuous execution
          if (shortcut.repeatable) {
            const intervalId = setInterval(() => {
              shortcut.action();
            }, 150); // Repeat every 150ms when held
            
            repeatIntervals.current.set(keyCombo, intervalId);
          }
        }
        break;
      }
    }
  }, [shortcuts]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const keyCombo = getShortcutKey(event);
    
    if (pressedKeys.current.has(keyCombo)) {
      pressedKeys.current.delete(keyCombo);
      
      // Clear any repeat interval
      const intervalId = repeatIntervals.current.get(keyCombo);
      if (intervalId) {
        clearInterval(intervalId);
        repeatIntervals.current.delete(keyCombo);
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      
      // Clear all intervals on cleanup
      repeatIntervals.current.forEach(intervalId => clearInterval(intervalId));
      repeatIntervals.current.clear();
      pressedKeys.current.clear();
    };
  }, [handleKeyDown, handleKeyUp]);

  return shortcuts;
}

// Common keyboard shortcuts helper
export const createShortcuts = {
  undo: (action: () => void): KeyboardShortcut => ({
    key: 'z',
    ctrlKey: true,
    action,
    description: 'Undo (Ctrl+Z)',
    repeatable: true // Enable hold-to-repeat
  }),
  
  redo: (action: () => void): KeyboardShortcut => ({
    key: 'y',
    ctrlKey: true,
    action,
    description: 'Redo (Ctrl+Y)',
    repeatable: true // Enable hold-to-repeat
  }),
  
  redoAlt: (action: () => void): KeyboardShortcut => ({
    key: 'z',
    ctrlKey: true,
    shiftKey: true,
    action,
    description: 'Redo (Ctrl+Shift+Z)',
    repeatable: true // Enable hold-to-repeat
  }),
  
  save: (action: () => void): KeyboardShortcut => ({
    key: 's',
    ctrlKey: true,
    action,
    description: 'Save (Ctrl+S)'
  }),
  
  new: (action: () => void): KeyboardShortcut => ({
    key: 'n',
    ctrlKey: true,
    action,
    description: 'New Project (Ctrl+N)'
  }),
  
  open: (action: () => void): KeyboardShortcut => ({
    key: 'o',
    ctrlKey: true,
    action,
    description: 'Open Project (Ctrl+O)'
  }),

  // Tool shortcuts
  brush: (action: () => void): KeyboardShortcut => ({
    key: 'b',
    action,
    description: 'Brush Tool (B)'
  }),
  

  
  eraser: (action: () => void): KeyboardShortcut => ({
    key: 'e',
    action,
    description: 'Eraser Tool (E)'
  }),
  
  // View shortcuts
  zoomIn: (action: () => void): KeyboardShortcut => ({
    key: '=',
    ctrlKey: true,
    action,
    description: 'Zoom In (Ctrl+=)'
  }),
  
  zoomOut: (action: () => void): KeyboardShortcut => ({
    key: '-',
    ctrlKey: true,
    action,
    description: 'Zoom Out (Ctrl+-)'
  }),
  
  resetZoom: (action: () => void): KeyboardShortcut => ({
    key: '0',
    ctrlKey: true,
    action,
    description: 'Reset Zoom (Ctrl+0)'
  }),
  
  toggleGrid: (action: () => void): KeyboardShortcut => ({
    key: 'g',
    action,
    description: 'Toggle Grid (G)'
  })
};