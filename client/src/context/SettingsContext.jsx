import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const SettingsContext = createContext();

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    theme: 'archive-light',
    typography: 'Playfair',
    searchStrategy: 'hybrid',
    fuzzyMatching: true,
    notificationsEnabled: true,
    emailNotifications: true,
    semanticModel: 'text-embedding-3-small',
    similarityThreshold: 0.70,
    chunkSize: 512,
    chunkOverlap: 50
  });

  const [loading, setLoading] = useState(true);

  // Load from DB (with localStorage fallback handled if network fails)
  useEffect(() => {
    async function loadSettings() {
      try {
        const local = localStorage.getItem('archive_settings');
        if (local) {
          setSettings(JSON.parse(local));
        }

        const res = await api.get('/settings');
        if (res.data) {
          setSettings(res.data);
          localStorage.setItem('archive_settings', JSON.stringify(res.data));
        }
      } catch (err) {
        console.error('Failed to fetch settings from API, using defaults/local', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Synchronize theme with document element for global CSS variables and dark mode support
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all old theme classes
    const themeClasses = ['theme-archive-light', 'theme-archive-dark', 'theme-midnight', 'theme-amber', 'theme-terminal'];
    themeClasses.forEach(c => root.classList.remove(c));
    
    // Add current theme class
    root.classList.add(`theme-${settings.theme}`);
    
    // Determine if it is a dark theme
    const isDark = settings.theme.includes('dark') || 
                   settings.theme === 'midnight' || 
                   settings.theme === 'terminal' || 
                   settings.theme === 'amber';
                   
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const updateSettings = async (newSettings) => {
    // Optimistic update
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('archive_settings', JSON.stringify(updated));

    try {
      await api.put('/settings', newSettings);
    } catch (err) {
      console.error('Failed to sync settings to API', err);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}
