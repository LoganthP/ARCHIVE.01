import { HiOutlineBeaker, HiOutlineCube } from 'react-icons/hi2';

export default function Header({ activeTab, onTabChange }) {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-800/80 bg-surface-950/80 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <HiOutlineBeaker className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-surface-950 animate-pulse-soft" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Research Tracker
              </h1>
              <p className="text-[10px] text-surface-500 font-medium uppercase tracking-widest -mt-0.5">
                AI-Powered Search
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-surface-800/50 rounded-xl p-1 border border-surface-700/30">
            <button
              onClick={() => onTabChange('papers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'papers'
                  ? 'bg-surface-700/80 text-white shadow-sm'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <HiOutlineCube className="w-4 h-4" />
              Papers
            </button>
            <button
              onClick={() => onTabChange('search')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'search'
                  ? 'bg-surface-700/80 text-white shadow-sm'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Semantic Search
            </button>
          </nav>

          {/* Status indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-surface-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Gemini Connected
          </div>
        </div>
      </div>
    </header>
  );
}
