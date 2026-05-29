import React from 'react';

export default function SideNavBar({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'library', name: 'Library', icon: 'menu_book' },
    { id: 'uploads', name: 'Uploads', icon: 'upload_file' },
    { id: 'analytics', name: 'Analytics', icon: 'analytics' },
    { id: 'ai-chat', name: 'AI Chat', icon: 'forum' }
  ];

  return (
    <nav className="bg-[#F0EFEB] dark:bg-surface h-screen w-64 fixed left-0 top-0 border-r border-gray-300 dark:border-outline-variant flex flex-col py-8 z-30 transition-colors duration-300">
      {/* Brand Header */}
      <div className="px-6 mb-12">
        <h1 className="font-headline-md text-headline-md font-bold tracking-tight text-gray-900 dark:text-on-surface">
          ARCHIVE.01
        </h1>
        <p className="font-metadata text-metadata text-gray-600 dark:text-on-surface-variant mt-1">
          Semantic Engine v4.2
        </p>
      </div>

      {/* Primary Links */}
      <ul className="flex flex-col gap-2 flex-grow">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <li key={tab.id}>
              <button
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-3 py-3 w-full text-left pl-4 hover:bg-gray-200 dark:hover:bg-surface-container-high transition-colors duration-200 ${
                  isActive
                    ? 'text-secondary font-bold border-l-2 border-secondary scale-[0.99] transition-transform'
                    : 'text-gray-600 dark:text-on-surface-variant hover:text-gray-900 dark:hover:text-on-surface'
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: `"FILL" ${isActive ? 1 : 0}` }}
                >
                  {tab.icon}
                </span>
                <span className="font-label-caps text-label-caps tracking-widest uppercase">
                  {tab.name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Secondary Links / Footer */}
      <div className="px-4 mt-auto">
        <ul className="flex flex-col gap-2 border-t border-gray-300 dark:border-outline-variant pt-4">
          <li>
            <button
              onClick={() => onTabChange('settings')}
              className={`flex items-center gap-3 py-2 w-full text-left pl-4 hover:bg-gray-200 dark:hover:bg-surface-container-high transition-colors duration-200 ${
                activeTab === 'settings'
                  ? 'text-secondary font-bold'
                  : 'text-gray-600 dark:text-on-surface-variant hover:text-gray-900 dark:hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 0' }}>
                settings
              </span>
              <span className="font-label-caps text-label-caps tracking-widest uppercase">
                Settings
              </span>
            </button>
          </li>
          <li>
            <button
              onClick={() => onTabChange('support')}
              className={`flex items-center gap-3 py-2 w-full text-left pl-4 hover:bg-gray-200 dark:hover:bg-surface-container-high transition-colors duration-200 ${
                activeTab === 'support'
                  ? 'text-secondary font-bold'
                  : 'text-gray-600 dark:text-on-surface-variant hover:text-gray-900 dark:hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 0' }}>
                help
              </span>
              <span className="font-label-caps text-label-caps tracking-widest uppercase">
                Support
              </span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

