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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    const demoMetrics = computeGoldenRatioMetrics(10000);
    const demoBatches = generateCampaignBatches({
      metrics: demoMetrics,
      durationHours: 24,
      intervalMinutes: 2,
      curve: 'trending_rocket',
      jitterPercent: 18,
      seedChunkProtocol: true,
      startDate: new Date(Date.now() - 2 * 60 * 1000),
      routingConfig: DEFAULT_ROUTING_CONFIG,
    });

    if (demoBatches.length > 0) {
      demoBatches[0].status = 'success';
      demoBatches[0].dispatchedAt = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      demoBatches[0].orderIds = { views: 'ORD-REL-8024-882194' };
    }

    return [{
      id: 'camp_live_demo1',
      name: 'Viral Reels Algorithmic Push #01',
      platform: 'instagram',
      targetUrl: 'https://www.instagram.com/reel/viral_post_demo/',
      handle: '@aesthetic.vibes',
      organicMode: true,
      metrics: demoMetrics,
      commentNiche: 'Lifestyle',
      generatedComments: getRandomPresetComments('Lifestyle', 12),
      durationHours: 24,
      curve: 'trending_rocket',
      bezierPoints: { p0: { x: 0, y: 0 }, p1: { x: 0.25, y: 0.75 }, p2: { x: 0.75, y: 0.35 }, p3: { x: 1, y: 1 } },
      speedInterval: 'interval_20_35m',
      intervalMinutes: 28,
      jitterPercent: 18,
      seedChunkProtocol: true,
      batches: demoBatches,
      status: 'running',
      createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      startedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      currentBatchIndex: 1,
      riskAudit: computeRiskAudit(demoMetrics, 'trending_rocket', 18, true, 24, 2),
      routingConfig: DEFAULT_ROUTING_CONFIG,
    }];
  });

  // Sync panels & campaigns from server
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
        const res = await fetch('/api/campaigns');
        if (res.ok) {
          const data = await res.json();
          if (data.campaigns && Array.isArray(data.campaigns)) {
            setCampaigns(data.campaigns);
          }
        }
      } catch (e) {}
    };

    loadServerData();
  }, []);

  // 24/7 background sync: Pull real server state (live SMM panel order IDs, delivery status, real logs)
  useEffect(() => {
    const syncWorker = setInterval(async () => {
      try {
        const res = await fetch('/api/campaigns');
        if (res.ok) {
          const data = await res.json();
          if (data.campaigns && Array.isArray(data.campaigns)) {
            setCampaigns(data.campaigns);
          }
        }
      } catch (e) {}
    }, 5000);

    return () => clearInterval(syncWorker);
  }, []);

  // Save campaigns to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('smm_campaigns_cache', JSON.stringify(campaigns));
    } catch (e) {}
  }, [campaigns]);

  // Handle successful campaign launch
  const handleLaunchSuccess = (newCampaign: Campaign) => {
    setCampaigns(prev => [newCampaign, ...prev]);
    setLaunchSuccessModal(newCampaign);
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
