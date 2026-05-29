import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('appearance');

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: 'palette' },
    { id: 'search', label: 'Search Engine', icon: 'search' },
    { id: 'semantic', label: 'Semantic Engine', icon: 'model_training' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto flex gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Settings Sidebar */}
      <div className="w-64 flex-shrink-0">
        <h2 className="font-headline-md text-3xl font-bold mb-8 text-on-background">Settings</h2>
        <div className="flex flex-col gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-md text-left transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'bg-surface text-secondary font-bold border-l-2 border-secondary'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface border-l-2 border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              <span className="font-body-mono text-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 bg-surface border border-outline-variant rounded-xl p-8">
        
        {activeTab === 'appearance' && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface mb-2">Theme Preferences</h3>
              <p className="text-on-surface-variant text-sm mb-6">Customize how Archive.01 looks on your device.</p>
              
              <div className="flex gap-4 flex-wrap">
                <button onClick={() => updateSettings({ theme: 'archive-light' })} className={`flex-1 p-4 border ${settings.theme === 'archive-light' ? 'border-secondary' : 'border-outline-variant opacity-70'} bg-background rounded-lg flex items-center gap-4 relative overflow-hidden transition-all hover:opacity-100`}>
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <span className="material-symbols-outlined text-gray-900">light_mode</span>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-on-surface">Light Mode</p>
                    <p className="text-xs text-on-surface-variant">Stark monochrome</p>
                  </div>
                  {settings.theme === 'archive-light' && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-secondary text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[10px]">check</span>
                    </div>
                  )}
                </button>
                <button onClick={() => updateSettings({ theme: 'archive-dark' })} className={`flex-1 p-4 border ${settings.theme === 'archive-dark' ? 'border-secondary' : 'border-outline-variant opacity-70'} bg-background rounded-lg flex items-center gap-4 relative overflow-hidden transition-all hover:opacity-100`}>
                  <div className="w-12 h-12 rounded-full bg-gray-900 shadow-sm flex items-center justify-center">
                    <span className="material-symbols-outlined text-white">dark_mode</span>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-on-surface">Dark Mode</p>
                    <p className="text-xs text-on-surface-variant">Easy on the eyes</p>
                  </div>
                  {settings.theme === 'archive-dark' && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-secondary text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[10px]">check</span>
                    </div>
                  )}
                </button>
                <button onClick={() => updateSettings({ theme: 'midnight' })} className={`flex-1 p-4 border ${settings.theme === 'midnight' ? 'border-secondary' : 'border-outline-variant opacity-70'} bg-background rounded-lg flex items-center gap-4 relative overflow-hidden transition-all hover:opacity-100`}>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-900 to-black shadow-sm flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-400">terminal</span>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-on-surface">Midnight</p>
                    <p className="text-xs text-on-surface-variant">High contrast dark</p>
                  </div>
                  {settings.theme === 'midnight' && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-secondary text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[10px]">check</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            <hr className="border-outline-variant" />

            <div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface mb-2">Typography</h3>
              <p className="text-on-surface-variant text-sm mb-6">Adjust the reading experience for abstracts and documents.</p>
              
              <div 
                className="flex items-center justify-between p-4 border border-outline-variant rounded-lg bg-background cursor-pointer"
                onClick={() => updateSettings({ typography: settings.typography === 'Playfair' ? 'JetBrains Mono' : 'Playfair' })}
              >
                <div>
                  <p className="font-bold text-on-surface">Serif Headlines</p>
                  <p className="text-xs text-on-surface-variant">Use Playfair Display for document titles</p>
                </div>
                <div className={`w-12 h-6 ${settings.typography === 'Playfair' ? 'bg-secondary' : 'bg-gray-400'} rounded-full relative transition-colors`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.typography === 'Playfair' ? 'right-1' : 'left-1'}`}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface mb-2">Search Behavior</h3>
              <p className="text-on-surface-variant text-sm mb-6">Configure how the global search engine retrieves documents.</p>

              <div className="space-y-4">
                <div className="p-4 border border-outline-variant rounded-lg bg-background">
                  <label className="block text-sm font-bold text-on-surface mb-2">Default Search Strategy</label>
                  <select 
                    value={settings.searchStrategy}
                    onChange={(e) => updateSettings({ searchStrategy: e.target.value })}
                    className="w-full bg-transparent border border-outline-variant text-on-surface text-sm rounded-md focus:ring-secondary focus:border-secondary block p-2.5"
                  >
                    <option className="bg-white text-gray-900 dark:bg-surface dark:text-on-surface" value="hybrid">Hybrid (Semantic + Keyword) - Recommended</option>
                    <option className="bg-white text-gray-900 dark:bg-surface dark:text-on-surface" value="semantic">Strict Semantic</option>
                    <option className="bg-white text-gray-900 dark:bg-surface dark:text-on-surface" value="keyword">Strict Keyword (BM25)</option>
                  </select>
                </div>
                
                <div 
                  className="flex items-center justify-between p-4 border border-outline-variant rounded-lg bg-background cursor-pointer"
                  onClick={() => updateSettings({ fuzzyMatching: !settings.fuzzyMatching })}
                >
                  <div>
                    <p className="font-bold text-on-surface">Fuzzy Matching</p>
                    <p className="text-xs text-on-surface-variant">Allow minor typos in keyword searches</p>
                  </div>
                  <div className={`w-12 h-6 ${settings.fuzzyMatching ? 'bg-secondary' : 'bg-gray-400'} rounded-full relative transition-colors`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.fuzzyMatching ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
 
        {activeTab === 'semantic' && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface mb-2">Semantic Engine</h3>
              <p className="text-on-surface-variant text-sm mb-6">Manage embedding parameters and model selection.</p>
 
              <div className="space-y-4">
                <div className="p-4 border border-outline-variant rounded-lg bg-background">
                  <label className="block text-sm font-bold text-on-surface mb-2">Primary Embedding Model</label>
                  <select 
                    value={settings.semanticModel}
                    onChange={(e) => updateSettings({ semanticModel: e.target.value })}
                    className="w-full bg-transparent border border-outline-variant text-on-surface text-sm rounded-md focus:ring-secondary focus:border-secondary block p-2.5"
                  >
                    <option className="bg-white text-gray-900 dark:bg-surface dark:text-on-surface" value="text-embedding-3-small">text-embedding-3-small (Default)</option>
                    <option className="bg-white text-gray-900 dark:bg-surface dark:text-on-surface" value="text-embedding-ada-002">text-embedding-ada-002 (Legacy)</option>
                    <option className="bg-white text-gray-900 dark:bg-surface dark:text-on-surface" value="jina-embeddings-v2-base-en">jina-embeddings-v2-base-en</option>
                  </select>
                </div>
                
                <div className="p-4 border border-outline-variant rounded-lg bg-background">
                  <label className="block text-sm font-bold text-on-surface mb-2">Similarity Threshold: {settings.similarityThreshold}</label>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.01" 
                    value={settings.similarityThreshold}
                    onChange={(e) => updateSettings({ similarityThreshold: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-outline-variant rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-on-surface-variant mt-2">
                    <span>Lenient (0.0)</span>
                    <span>Strict (1.0)</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 p-4 border border-outline-variant rounded-lg bg-background">
                    <label className="block text-sm font-bold text-on-surface mb-2">Chunk Size</label>
                    <input 
                      type="number" 
                      value={settings.chunkSize}
                      onChange={(e) => updateSettings({ chunkSize: parseInt(e.target.value) })}
                      className="w-full bg-transparent border border-outline-variant text-on-surface text-sm rounded-md focus:ring-secondary focus:border-secondary block p-2.5"
                    />
                  </div>
                  <div className="flex-1 p-4 border border-outline-variant rounded-lg bg-background">
                    <label className="block text-sm font-bold text-on-surface mb-2">Chunk Overlap</label>
                    <input 
                      type="number" 
                      value={settings.chunkOverlap}
                      onChange={(e) => updateSettings({ chunkOverlap: parseInt(e.target.value) })}
                      className="w-full bg-transparent border border-outline-variant text-on-surface text-sm rounded-md focus:ring-secondary focus:border-secondary block p-2.5"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface mb-2">Notifications</h3>
              <p className="text-on-surface-variant text-sm mb-6">Manage how and when you receive updates.</p>

              <div className="space-y-4">
                <div 
                  className="flex items-center justify-between p-4 border border-outline-variant rounded-lg bg-background cursor-pointer"
                  onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
                >
                  <div>
                    <p className="font-bold text-on-surface">In-App Notifications</p>
                    <p className="text-xs text-on-surface-variant">Receive alerts within the platform</p>
                  </div>
                  <div className={`w-12 h-6 ${settings.notificationsEnabled ? 'bg-secondary' : 'bg-gray-400'} rounded-full relative transition-colors`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.notificationsEnabled ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>

                <div 
                  className="flex items-center justify-between p-4 border border-outline-variant rounded-lg bg-background cursor-pointer"
                  onClick={() => updateSettings({ emailNotifications: !settings.emailNotifications })}
                >
                  <div>
                    <p className="font-bold text-on-surface">Email Notifications</p>
                    <p className="text-xs text-on-surface-variant">Receive daily digests and important alerts via email</p>
                  </div>
                  <div className={`w-12 h-6 ${settings.emailNotifications ? 'bg-secondary' : 'bg-gray-400'} rounded-full relative transition-colors`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.emailNotifications ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
