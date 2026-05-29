import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

export default function TopAppBar({ onSearch, currentQuery, onOpenProfile, onOpenNotifications, onOpenCommandPalette }) {
  const [searchVal, setSearchVal] = useState(currentQuery || '');
  const { settings, updateSettings } = useSettings();

  const isDark = settings.theme.includes('dark') || 
                 settings.theme === 'midnight' || 
                 settings.theme === 'terminal' || 
                 settings.theme === 'amber';

  // Update input val if query changes from outside
  useEffect(() => {
    setSearchVal(currentQuery || '');
  }, [currentQuery]);

  const handleToggleTheme = () => {
    if (isDark) {
      updateSettings({ theme: 'archive-light' });
    } else {
      updateSettings({ theme: 'archive-dark' });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch(searchVal);
    }
  };

  return (
    <header 
      style={{
        backgroundColor: isDark 
          ? 'color-mix(in srgb, var(--surface) 80%, transparent)' 
          : 'rgba(249, 248, 246, 0.8)'
      }}
      className="backdrop-blur-md fixed top-0 right-0 w-[calc(100%-16rem)] z-40 border-b border-gray-300 dark:border-outline-variant flex items-center justify-between px-8 md:px-16 h-16 transition-colors duration-300"
    >
      {/* Search Bar Input */}
      <div 
        className="flex items-center gap-4 w-1/2 max-w-md group cursor-text"
        onClick={onOpenCommandPalette}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); onSearch(searchVal); }}
          className="material-symbols-outlined text-gray-500 dark:text-on-surface-variant flex-shrink-0 group-hover:text-secondary transition-colors"
        >
          search
        </button>
        <div className="relative w-full h-full flex items-center">
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            placeholder="Query semantic index... (Press Enter)"
            className="bg-transparent border-none text-body-mono font-body-mono text-gray-900 dark:text-on-surface focus:ring-0 placeholder-gray-500 dark:placeholder-on-surface-variant/60 w-full h-full py-4 focus:outline-none"
          />
          <div className="absolute right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <kbd className="bg-gray-200 dark:bg-surface-container-high text-gray-500 dark:text-on-surface-variant px-1.5 py-0.5 rounded text-[10px] font-body-mono border border-gray-300 dark:border-outline-variant">⌘K</kbd>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-6">
        {/* Theme Toggle */}
        <button
          aria-label="Toggle Dark Mode"
          onClick={handleToggleTheme}
          className="text-gray-500 dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 flex items-center justify-center p-1 rounded-none hover:bg-gray-200 dark:hover:bg-surface-container-high"
        >
          {isDark ? (
            <span className="material-symbols-outlined">light_mode</span>
          ) : (
            <span className="material-symbols-outlined">dark_mode</span>
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={onOpenNotifications}
            className="text-gray-500 dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 flex items-center justify-center p-1 rounded-none hover:bg-gray-200 dark:hover:bg-surface-container-high relative"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full"></span>
          </button>
        </div>

        {/* User Account */}
        <button 
          onClick={onOpenProfile}
          className="text-gray-500 dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 flex items-center justify-center p-1 rounded-none hover:bg-gray-200 dark:hover:bg-surface-container-high"
        >
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </header>
  );
}

