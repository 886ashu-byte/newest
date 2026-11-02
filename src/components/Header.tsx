import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Clock, 
  Settings, 
  Workflow,
  Sun,
  Moon,
  Wallet,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface PanelBalanceInfo {
  id: string;
  name: string;
  currency: 'USD' | 'INR';
  balance: number;
  balanceUsd: number;
  isLowBalance: boolean;
  status: string;
}

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
  const [panelBalances, setPanelBalances] = useState<PanelBalanceInfo[]>([
    { id: 'reliablesmm', name: 'ReliableSMM', currency: 'USD', balance: 412.15, balanceUsd: 412.15, isLowBalance: false, status: 'active' },
    { id: 'jap', name: 'JAP', currency: 'USD', balance: 247.80, balanceUsd: 247.80, isLowBalance: false, status: 'active' }
  ]);
  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false);
  const [hasLowBalanceAlert, setHasLowBalanceAlert] = useState(false);
  const [dismissLowAlert, setDismissLowAlert] = useState(false);

  const fetchBalances = async () => {
    setIsRefreshingBalances(true);
    try {
      const res = await fetch('/api/panels/balances');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.panels)) {
          setPanelBalances(data.panels);
          setHasLowBalanceAlert(Boolean(data.hasLowBalanceAlert));
        }
      }
    } catch (e) {
      // Fallback to existing cached balances
    } finally {
      setIsRefreshingBalances(false);
    }
  };

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 60000); // 60s live balance check
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#090b10]/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3 shrink-0">
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

            {/* Center Navigation Tabs */}
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

            {/* SMM Provider Live Balance Widget */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs font-mono">
              <Wallet className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">Credits:</span>
              
              <div className="flex items-center gap-3">
                {panelBalances.map(panel => {
                  const isLow = panel.isLowBalance;
                  return (
                    <div 
                      key={panel.id}
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium transition-colors ${
                        isLow
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 animate-pulse'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      }`}
                      title={`${panel.name} Live Balance: ${panel.currency === 'USD' ? '$' : '₹'}${panel.balance.toFixed(2)}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isLow ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {panel.id === 'reliablesmm' ? 'Reliable:' : 'JAP:'}
                      </span>
                      <span>
                        {panel.currency === 'USD' ? '$' : '₹'}{panel.balance.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={fetchBalances}
                disabled={isRefreshingBalances}
                className="p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                title="Refresh Live Balances from Providers"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshingBalances ? 'animate-spin text-purple-600' : ''}`} />
              </button>
            </div>

            {/* Right Controls: Theme Toggle + Profile & Settings */}
            <div className="flex items-center gap-2.5 shrink-0">
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

      {/* Low Balance Warning Banner */}
      {hasLowBalanceAlert && !dismissLowAlert && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-800 dark:text-amber-300 px-4 py-2 text-xs font-mono flex items-center justify-between transition-colors">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Low SMM Balance Alert:</strong> One or more provider balances is below $10.00. Top up credits on ReliableSMM / JAP to guarantee uninterrupted 24/7 drip delivery.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenSettings}
                className="underline hover:text-amber-950 dark:hover:text-white font-bold cursor-pointer"
              >
                Top Up in Gateway →
              </button>
              <button
                onClick={() => setDismissLowAlert(true)}
                className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
