import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CampaignWizard } from './components/CampaignWizard';
import { ActiveSchedulerView } from './components/ActiveSchedulerView';
import { SettingsModal } from './components/SettingsModal';
import { Campaign, SmmPanel } from './types';
import { 
  DEFAULT_ROUTING_CONFIG, 
  computeGoldenRatioMetrics, 
  generateCampaignBatches, 
  computeRiskAudit 
} from './utils/algorithmicEngine';
import { getRandomPresetComments } from './utils/commentPresets';
import { CheckCircle2, Rocket, X, ArrowRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'wizard' | 'campaigns'>('wizard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [launchSuccessModal, setLaunchSuccessModal] = useState<Campaign | null>(null);

  // Initial parent panels matching SMM v2 protocol specifications (ReliableSMM & JAP only)
  const [panels, setPanels] = useState<SmmPanel[]>([
    {
      id: 'reliablesmm',
      name: 'ReliableSMM Enterprise',
      apiUrl: 'https://reliablesmm.com/api/v2',
      apiKey: '79bb502d1dc2c1bccf81ef56a6ec9ef5',
      currency: 'USD',
      balance: 412.15,
      status: 'active',
      isDefault: true,
      lastChecked: new Date().toISOString(),
      supportedServicesCount: 3100,
      notes: 'Primary provider for Views (Service 8024), Macro-Likes (7147), Saves (7841), Reposts (7842), Shares (2060)'
    },
    {
      id: 'jap',
      name: 'Just Another Panel (JAP)',
      apiUrl: 'https://justanotherpanel.com/api/v2',
      apiKey: '085945504bab9706597c00aaf8c1edb4',
      currency: 'USD',
      balance: 247.80,
      status: 'active',
      isDefault: true,
      lastChecked: new Date().toISOString(),
      supportedServicesCount: 2890,
      notes: 'Micro-Likes specialist (Service 1778, 5-9 likes micro-drip) & Custom Engagement'
    }
  ]);

  // Initial active campaigns (with localStorage fallback)
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    try {
      const saved = localStorage.getItem('smm_campaigns_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Sync panels & campaigns from server (with non-destructive anti-wipe merge from browser cache)
  useEffect(() => {
    const loadServerData = async () => {
      try {
        const res = await fetch('/api/panels');
        if (res.ok) {
          const data = await res.json();
          if (data.panels && Array.isArray(data.panels) && data.panels.length > 0) {
            setPanels(data.panels);
          }
        }
      } catch (e) {}

      try {
        // Read client cache first
        let cachedCampaigns: Campaign[] = [];
        try {
          const saved = localStorage.getItem('smm_campaigns_cache');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) cachedCampaigns = parsed;
          }
        } catch (e) {}

        const res = await fetch('/api/campaigns');
        if (res.ok) {
          const data = await res.json();
          const serverCampaigns: Campaign[] = Array.isArray(data.campaigns) ? data.campaigns : [];

          // Non-destructive Union Merge: Never drop campaigns that exist in client or server
          const campaignMap = new Map<string, Campaign>();
          
          // Seed with cached campaigns
          cachedCampaigns.forEach(c => {
            if (c && c.id) campaignMap.set(c.id, c);
          });

          // Merge with server campaigns
          serverCampaigns.forEach(s => {
            if (s && s.id) {
              const existing = campaignMap.get(s.id);
              if (!existing) {
                campaignMap.set(s.id, s);
              } else {
                // If server has more recent dispatch or identical, prefer server
                const sSuccess = s.batches?.filter(b => b.status === 'success').length || 0;
                const eSuccess = existing.batches?.filter(b => b.status === 'success').length || 0;
                if (sSuccess >= eSuccess) {
                  campaignMap.set(s.id, s);
                }
              }
            }
          });

          const mergedCampaigns = Array.from(campaignMap.values());
          if (mergedCampaigns.length > 0) {
            setCampaigns(mergedCampaigns);
            try {
              localStorage.setItem('smm_campaigns_cache', JSON.stringify(mergedCampaigns));
            } catch (e) {}

            // Persist the full merged set to server files immediately
            fetch('/api/campaigns/sync-cache', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clientCampaigns: mergedCampaigns })
            }).catch(() => {});
          }
        }
      } catch (e) {
        console.warn('Initial server data sync note:', e);
      }
    };

    loadServerData();
  }, []);

  // 24/7 background sync: Pull server state while preserving all client campaigns
  useEffect(() => {
    const syncWorker = setInterval(async () => {
      try {
        const res = await fetch('/api/campaigns');
        if (res.ok) {
          const data = await res.json();
          if (data.campaigns && Array.isArray(data.campaigns) && data.campaigns.length > 0) {
            setCampaigns(prev => {
              const map = new Map<string, Campaign>();
              // Keep all existing client campaigns
              prev.forEach(c => { if (c && c.id) map.set(c.id, c); });
              // Update with server dispatches
              data.campaigns.forEach((sc: Campaign) => {
                if (sc && sc.id) map.set(sc.id, sc);
              });
              const updated = Array.from(map.values());
              try {
                localStorage.setItem('smm_campaigns_cache', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
          }
        }
      } catch (e) {}
    }, 6000);

    return () => clearInterval(syncWorker);
  }, []);

  // Save campaigns to localStorage whenever changed & sync to server disk
  useEffect(() => {
    try {
      if (campaigns.length > 0) {
        localStorage.setItem('smm_campaigns_cache', JSON.stringify(campaigns));
        fetch('/api/campaigns/sync-cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientCampaigns: campaigns })
        }).catch(() => {});
      }
    } catch (e) {}
  }, [campaigns]);

  // Handle successful campaign launch
  const handleLaunchSuccess = (launched: Campaign | Campaign[]) => {
    const list = Array.isArray(launched) ? launched : [launched];
    setCampaigns(prev => [...list, ...prev]);
    setLaunchSuccessModal(list[0]);
    setActiveTab('campaigns');
  };

  // Manual fast-forward next batch: Triggers live dispatch on main SMM panel
  const handleFastForwardBatch = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/dispatch-next`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.campaign) {
          setCampaigns(prev => prev.map(c => c.id === campaignId ? data.campaign : c));
          return;
        }
      }
    } catch (e) {
      console.warn('Dispatch next batch error:', e);
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/pause`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.campaign) {
          setCampaigns(prev => prev.map(c => c.id === campaignId ? data.campaign : c));
          return;
        }
      }
    } catch (e) {}

    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'paused' } : c));
  };

  const handleResumeCampaign = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/resume`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.campaign) {
          setCampaigns(prev => prev.map(c => c.id === campaignId ? data.campaign : c));
          return;
        }
      }
    } catch (e) {}

    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'running' } : c));
  };

  // Delete campaign: Permanently remove from server and cancel remaining batches
  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        if (data.campaigns && Array.isArray(data.campaigns)) {
          setCampaigns(data.campaigns);
          try {
            localStorage.setItem('smm_campaigns_cache', JSON.stringify(data.campaigns));
          } catch (e) {}
          return;
        }
      }
    } catch (e) {
      console.warn('Delete campaign error:', e);
    }

    setCampaigns(prev => {
      const updated = prev.filter(c => c.id !== campaignId);
      try {
        localStorage.setItem('smm_campaigns_cache', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Edit campaign: Update properties on server and cache
  const handleEditCampaign = async (updatedCampaign: Campaign) => {
    try {
      const res = await fetch(`/api/campaigns/${updatedCampaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCampaign)
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(prev => {
          const updated = prev.map(c => c.id === updatedCampaign.id ? data.campaign : c);
          try { localStorage.setItem('smm_campaigns_cache', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });
      }
    } catch (e) {
      console.error('Failed to save campaign edit', e);
    }
  };

  // Clone campaign: Clone on server with optional custom payload and prepend to list
  const handleCloneCampaign = async (campaignId: string, customPayload?: any) => {
    const source = campaigns.find(c => c.id === campaignId);
    const fullPayload = {
      ...(customPayload || {}),
      sourceCampaign: source
    };

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      if (data.campaign) {
        setCampaigns(prev => {
          const updated = [data.campaign, ...prev];
          try { localStorage.setItem('smm_campaigns_cache', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });
        return data.campaign;
      }
    } catch (e: any) {
      console.warn('Server clone failed, creating client clone as resilient fallback:', e?.message);
      // Client-side fallback if server is unreachable
      if (source && customPayload) {
        const fallbackClone: Campaign = {
          ...source,
          ...customPayload,
          id: 'camp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
          status: 'running',
          createdAt: new Date().toISOString(),
          startedAt: new Date().toISOString(),
          currentBatchIndex: 0
        };

        setCampaigns(prev => {
          const updated = [fallbackClone, ...prev];
          try { localStorage.setItem('smm_campaigns_cache', JSON.stringify(updated)); } catch (err) {}
          return updated;
        });

        // Trigger background sync to server
        fetch('/api/campaigns/sync-cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientCampaigns: [fallbackClone] })
        }).catch(() => {});

        return fallbackClone;
      }
      throw e;
    }
  };

  const activeCount = campaigns.filter(c => c.status === 'running').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-700 dark:selection:text-purple-200 transition-colors">
      {/* Clean Minimalist Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeCampaignCount={activeCount}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'wizard' ? (
          <CampaignWizard
            panels={panels}
            onLaunchSuccess={handleLaunchSuccess}
          />
        ) : (
          <ActiveSchedulerView
            campaigns={campaigns}
            setCampaigns={setCampaigns}
            onFastForwardBatch={handleFastForwardBatch}
            onPauseCampaign={handlePauseCampaign}
            onResumeCampaign={handleResumeCampaign}
            onDeleteCampaign={handleDeleteCampaign}
            onEditCampaign={handleEditCampaign}
            onCloneCampaign={handleCloneCampaign}
          />
        )}
      </main>

      {/* Profile & Settings Modal (Parent Panels, Gateway Rules, Vercel 24/7 Setup, Logs) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        panels={panels}
        setPanels={setPanels}
      />

      {/* Campaign Launch Confirmation Modal */}
      {launchSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-purple-500/50 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl dark:shadow-purple-500/10 transition-colors">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-600/20 border border-purple-200 dark:border-purple-500/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Rocket className="w-6 h-6 animate-bounce" />
              </div>
              <button
                onClick={() => setLaunchSuccessModal(null)}
                className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 font-bold">
                Campaign Initialized
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Campaign Dispatched Successfully</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>Batch #1</strong> was executed immediately to establish initial presence. Subsequent batches will be dispatched 24/7 automatically according to your pacing schedule.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span className="text-slate-500 dark:text-slate-400">Campaign:</span>
                <span className="text-slate-900 dark:text-white font-bold truncate max-w-[200px]">{launchSuccessModal.name}</span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span className="text-slate-500 dark:text-slate-400">Batch #0 Status:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Executed (Views Sent)</span>
                </span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span className="text-slate-500 dark:text-slate-400">Total Batches:</span>
                <span className="text-purple-600 dark:text-purple-300 font-bold">{launchSuccessModal.batches.length} Chunks</span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span className="text-slate-500 dark:text-slate-400">Target URL:</span>
                <span className="text-slate-600 dark:text-slate-400 truncate max-w-[180px]">{launchSuccessModal.targetUrl}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setLaunchSuccessModal(null);
                setActiveTab('campaigns');
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold text-xs font-mono shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <span>View in Active Campaigns</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/60 bg-white dark:bg-[#07090e] py-3 text-center text-xs text-slate-500 dark:text-slate-400 font-mono transition-colors">
        SMM Drip Engine • 24/7 Automated Campaign Scheduler
      </footer>
    </div>
  );
}
