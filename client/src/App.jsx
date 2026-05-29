import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import SideNavBar from './components/SideNavBar';
import TopAppBar from './components/TopAppBar';
import PapersPage from './pages/PapersPage';
import UploadsPage from './pages/UploadsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/SettingsPage';
import SupportPage from './pages/SupportPage';
import AiChatPage from './pages/AiChatPage';
import CommandPalette from './components/CommandPalette';
import ProfileDrawer from './components/ProfileDrawer';
import NotificationsPanel from './components/NotificationsPanel';
import { semanticSearch } from './api/client';
import { useSettings } from './context/SettingsContext';

export default function App() {
  const { settings, loading } = useSettings();
  const [activeTab, setActiveTab] = useState('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // New modules state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleGlobalSearch = async (query) => {
    if (!query || !query.trim()) return;
    setSearchQuery(query);
    setSearchLoading(true);
    setActiveTab('search');
    try {
      const data = await semanticSearch(query.trim(), 5);
      setSearchResults(data);
    } catch (err) {
      // handled by interceptor
    } finally {
      setSearchLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="spinner"></div></div>;

  return (
    <div className={`min-h-screen theme-${settings.theme} ${settings.theme.includes('dark') || settings.theme === 'midnight' || settings.theme === 'terminal' || settings.theme === 'amber' ? 'dark' : ''} bg-background text-on-background flex bg-grain-overlay transition-colors duration-300 font-${settings.typography === 'Playfair' ? 'sans' : 'mono'}`}>
      {/* Side Navigation Menu */}
      <SideNavBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'search') {
            // Reset query when leaving search page
            setSearchQuery('');
            setSearchResults(null);
          }
        }}
      />

      {/* Sticky top level search/actions bar */}
      <TopAppBar
        onSearch={handleGlobalSearch}
        currentQuery={searchQuery}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen((prev) => !prev)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Content Pane */}
      <main className="ml-64 pt-16 w-full min-h-screen relative transition-colors duration-300">
        <div className="max-w-[1200px] mx-auto p-8 md:p-16 h-full flex flex-col gap-12 relative">
          
          <NotificationsPanel 
            isOpen={isNotificationsOpen} 
            onClose={() => setIsNotificationsOpen(false)} 
          />

          {activeTab === 'library' && (
            <PapersPage onNavigateToUploads={() => setActiveTab('uploads')} />
          )}
          {activeTab === 'uploads' && (
            <UploadsPage onPaperAdded={() => setActiveTab('library')} />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsPage />
          )}
          {activeTab === 'search' && (
            <SearchPage
              query={searchQuery}
              results={searchResults}
              loading={searchLoading}
              onSearch={handleGlobalSearch}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsPage />
          )}
          {activeTab === 'support' && (
            <SupportPage />
          )}
          {activeTab === 'ai-chat' && (
            <AiChatPage />
          )}
        </div>
      </main>

      {/* Global Overlays */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        onSearch={handleGlobalSearch}
      />

      <ProfileDrawer 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Retro styled toasts notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#131313',
            color: '#e5e2e1',
            border: '1px solid #4A5D73',
            borderRadius: '0px',
            fontFamily: 'JetBrains Mono',
            fontSize: '12px',
          },
        }}
      />
    </div>
  );
}

