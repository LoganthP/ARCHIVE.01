import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useSettings } from '../context/SettingsContext';

export default function CommandPalette({ isOpen, onClose, onNavigate, onSearch }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const { settings, updateSettings } = useSettings();

  // Quick actions
  const actions = [
    { id: 'search', title: 'Search Papers', icon: 'search', action: () => onSearch(query) },
    { id: 'settings', title: 'Open Settings', icon: 'settings', action: () => onNavigate('settings') },
    { id: 'support', title: 'Help & Support', icon: 'support_agent', action: () => onNavigate('support') },
    { id: 'library', title: 'Go to Library', icon: 'menu_book', action: () => onNavigate('library') },
    { id: 'uploads', title: 'Go to Uploads', icon: 'upload_file', action: () => onNavigate('uploads') },
    { id: 'analytics', title: 'View Analytics', icon: 'analytics', action: () => onNavigate('analytics') },
    {
      id: 'theme',
      title: 'Toggle Dark Mode',
      icon: 'lightbulb',
      action: () => {
        const isDark = settings.theme.includes('dark') || settings.theme === 'midnight' || settings.theme === 'terminal';
        updateSettings({ theme: isDark ? 'archive-light' : 'archive-dark' });
      }
    }
  ];

  // Filter actions based on query
  const filteredActions = actions.filter(action =>
    action.title.toLowerCase().includes(query.toLowerCase())
  );

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-colors"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl bg-[#F0EFEB] dark:bg-surface border border-gray-300 dark:border-outline-variant rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            <div className="flex items-center px-4 py-3 border-b border-gray-300 dark:border-outline-variant">
              <span className="material-symbols-outlined text-gray-400 dark:text-on-surface-variant mr-3">
                search
              </span>
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a command or search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && query.trim() !== '') {
                    onSearch(query);
                    onClose();
                  }
                }}
                className="w-full bg-transparent border-none text-gray-900 dark:text-on-surface focus:ring-0 placeholder-gray-500 dark:placeholder-on-surface-variant/60 font-body-mono text-body-mono outline-none"
              />
            </div>
            
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredActions.length > 0 ? (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-label-caps uppercase tracking-widest text-gray-500 dark:text-on-surface-variant/60 px-3 py-1 mt-1 mb-1">
                    Suggestions
                  </span>
                  {filteredActions.map((action, index) => (
                    <button
                      key={action.id}
                      onClick={() => {
                        action.action();
                        onClose();
                      }}
                      className="flex items-center gap-3 px-3 py-3 w-full text-left rounded-lg hover:bg-gray-200 dark:hover:bg-surface-container-high transition-colors text-gray-700 dark:text-on-surface-variant hover:text-gray-900 dark:hover:text-on-surface group"
                    >
                      <span className="material-symbols-outlined text-sm opacity-70 group-hover:opacity-100 group-hover:text-secondary transition-all">
                        {action.icon}
                      </span>
                      <span className="font-body-mono text-sm">{action.title}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500 dark:text-on-surface-variant font-body-mono text-sm">
                  No commands found. Press Enter to search papers for "{query}".
                </div>
              )}
            </div>
            <div className="bg-gray-100 dark:bg-surface-container-low border-t border-gray-300 dark:border-outline-variant px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs font-body-mono text-gray-500 dark:text-on-surface-variant/60">
                <span className="flex items-center gap-1"><kbd className="bg-gray-200 dark:bg-surface-container-high px-1 rounded">esc</kbd> to close</span>
                <span className="flex items-center gap-1"><kbd className="bg-gray-200 dark:bg-surface-container-high px-1 rounded">↵</kbd> to select/search</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
