import React from 'react';
import { 
  Zap, 
  Clock, 
  Settings, 
  Workflow,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  activeTab: 'wizard' | 'campaigns';
  setActiveTab: (tab: 'wizard' | 'campaigns') => void;
  activeCampaignCount: number;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeCampaignCount,
  onOpenSettings,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#090b10]/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-indigo-600 p-0.5 shadow-md shadow-purple-500/20">
              <div className="w-full h-full bg-white dark:bg-[#090b10] rounded-[10px] flex items-center justify-center transition-colors">
                <Workflow className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>SMM</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 dark:from-purple-400 dark:via-fuchsia-400 dark:to-pink-400">
                  Drip Engine
                </span>
              </h1>
            </div>
          </div>

          {/* Minimalist Center Navigation Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 rounded-xl p-1 text-xs font-mono transition-colors">
            <button
              onClick={() => setActiveTab('wizard')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'wizard'
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>New Campaign</span>
            </button>

            <button
              onClick={() => setActiveTab('campaigns')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'campaigns'
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Active Campaigns</span>
              {activeCampaignCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-purple-700/30 dark:bg-white/20 text-purple-900 dark:text-white text-[10px] font-bold">
                  {activeCampaignCount}
                </span>
              )}
            </button>
          </div>

          {/* Right Controls: Theme Toggle + Profile & Settings */}
          <div className="flex items-center gap-2.5">
            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark and light theme"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 flex items-center justify-center transition-all cursor-pointer shadow-sm"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-purple-600 transition-transform -rotate-12 hover:rotate-0" />
              )}
            </button>

            {/* Profile & Settings Button */}
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer text-xs font-mono shadow-sm"
              title="Parent Panels, Routing Gateway & Vercel 24/7 Hosting"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-fuchsia-600 flex items-center justify-center text-white font-bold text-[11px]">
                A
              </div>
              <span className="hidden sm:inline text-slate-700 dark:text-slate-300 font-sans font-medium">8886ashu@gmail.com</span>
              <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
