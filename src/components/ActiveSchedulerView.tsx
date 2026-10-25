import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  FastForward, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Heart, 
  MessageSquare, 
  Bookmark, 
  Share2, 
  Activity, 
  ChevronRight, 
  RefreshCw,
  Zap,
  Server,
  Layers,
  Sparkles,
  Trash2,
  FileText,
  X,
  Edit3,
  Copy,
  ShieldAlert,
  AlertTriangle,
  Save,
  Sliders,
  Globe,
  SunMoon,
  Rocket,
  TrendingUp,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { Campaign, ScheduledBatch, AlgorithmicCurve } from '../types';
import { generateCampaignBatches, parseTargetUrl, computeGoldenRatioMetrics } from '../utils/algorithmicEngine';

interface ActiveSchedulerProps {
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  onFastForwardBatch: (campaignId: string) => void;
  onPauseCampaign: (campaignId: string) => void;
  onResumeCampaign: (campaignId: string) => void;
  onDeleteCampaign: (campaignId: string) => void;
  onSelectCampaignForWizard?: (campaign: Campaign) => void;
  onEditCampaign?: (campaign: Campaign) => Promise<void>;
  onCloneCampaign?: (campaignId: string) => Promise<void>;
}

export const ActiveSchedulerView: React.FC<ActiveSchedulerProps> = ({
  campaigns,
  setCampaigns,
  onFastForwardBatch,
  onPauseCampaign,
  onResumeCampaign,
  onDeleteCampaign,
  onSelectCampaignForWizard,
  onEditCampaign,
  onCloneCampaign,
}) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    campaigns.length > 0 ? campaigns[0].id : null
  );
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [inspectBatch, setInspectBatch] = useState<ScheduledBatch | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [editModalCampaign, setEditModalCampaign] = useState<Campaign | null>(null);
  const [editForm, setEditForm] = useState<{
    id: string;
    name: string;
    targetUrl: string;
    handle: string;
    autoPauseOnServiceFailure: boolean;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    reposts: number;
    durationHours: number;
    minMins: number;
    maxMins: number;
    curve: AlgorithmicCurve;
    rebalancePendingBatches: boolean;
  } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMsg) {
      const t = setTimeout(() => setToastMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toastMsg]);

  // Clone Campaign
  const handleClone = async (campaignId: string) => {
    setCloningId(campaignId);
    try {
      if (onCloneCampaign) {
        await onCloneCampaign(campaignId);
      } else {
        const res = await fetch(`/api/campaigns/${campaignId}/clone`, { method: 'POST' });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to clone');
        }
        const data = await res.json();
        if (data.campaign) {
          setCampaigns(prev => [data.campaign, ...prev]);
          setSelectedCampaignId(data.campaign.id);
        }
      }
      setToastMsg({ text: 'Campaign cloned successfully with fresh scheduled batches!', type: 'success' });
    } catch (e: any) {
      setToastMsg({ text: e.message || 'Failed to clone campaign', type: 'error' });
    } finally {
      setCloningId(null);
    }
  };

  // Toggle Auto-Pause on Outage / Error
  const handleToggleAutoPause = async (campaign: Campaign) => {
    const newVal = campaign.autoPauseOnServiceFailure === false;
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoPauseOnServiceFailure: newVal })
      });
      if (res.ok) {
        setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, autoPauseOnServiceFailure: newVal } : c));
        setToastMsg({
          text: `Auto-pause on service outage is now ${newVal ? 'ENABLED' : 'DISABLED'} for this campaign.`,
          type: 'info'
        });
      }
    } catch (e) {
      setToastMsg({ text: 'Failed to update auto-pause setting', type: 'error' });
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (campaign: Campaign) => {
    setEditModalCampaign(campaign);
    setEditForm({
      id: campaign.id,
      name: campaign.name,
      targetUrl: campaign.targetUrl,
      handle: campaign.handle,
      autoPauseOnServiceFailure: campaign.autoPauseOnServiceFailure !== false,
      views: campaign.metrics.views,
      likes: campaign.metrics.likes,
      comments: campaign.metrics.comments,
      shares: campaign.metrics.shares,
      saves: campaign.metrics.saves,
      reposts: campaign.metrics.reposts,
      durationHours: campaign.durationHours || 24,
      minMins: campaign.cadenceRange?.minMins || 20,
      maxMins: campaign.cadenceRange?.maxMins || 35,
      curve: campaign.curve || 'trending_rocket',
      rebalancePendingBatches: true
    });
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editModalCampaign || !editForm) return;
    setIsSavingEdit(true);

    try {
      const targetUrlParsed = parseTargetUrl(editForm.targetUrl, editModalCampaign.platform);
      const cleanHandle = editForm.handle.trim() || targetUrlParsed.handle || editModalCampaign.handle;
      const cleanTargetUrl = editForm.targetUrl.trim() || editModalCampaign.targetUrl;

      const updatedMetrics = {
        views: Math.max(100, Number(editForm.views) || 100),
        likes: Math.max(5, Number(editForm.likes) || 5),
        comments: Math.max(0, Number(editForm.comments) || 0),
        shares: Math.max(10, Number(editForm.shares) || 10),
        saves: Math.max(1, Number(editForm.saves) || 1),
        reposts: Math.max(1, Number(editForm.reposts) || 1)
      };

      let updatedBatches = editModalCampaign.batches;

      if (editForm.rebalancePendingBatches) {
        // Preserve successful/dispatched batches
        const doneBatches = editModalCampaign.batches.filter(b => b.status === 'success' || b.status === 'running');
        const doneViews = doneBatches.reduce((s, b) => s + b.views, 0);
        const doneLikes = doneBatches.reduce((s, b) => s + b.likes, 0);
        const doneComments = doneBatches.reduce((s, b) => s + b.comments, 0);
        const doneShares = doneBatches.reduce((s, b) => s + b.shares, 0);
        const doneSaves = doneBatches.reduce((s, b) => s + b.saves, 0);
        const doneReposts = doneBatches.reduce((s, b) => s + b.reposts, 0);

        const remainingMetrics = {
          views: Math.max(100, updatedMetrics.views - doneViews),
          likes: Math.max(5, updatedMetrics.likes - doneLikes),
          comments: Math.max(0, updatedMetrics.comments - doneComments),
          shares: Math.max(10, updatedMetrics.shares - doneShares),
          saves: Math.max(1, updatedMetrics.saves - doneSaves),
          reposts: Math.max(1, updatedMetrics.reposts - doneReposts)
        };

        const newGenerated = generateCampaignBatches({
          metrics: remainingMetrics,
          durationHours: Math.max(1, editForm.durationHours),
          intervalMinutes: Math.round((editForm.minMins + editForm.maxMins) / 2),
          curve: editForm.curve,
          jitterPercent: editModalCampaign.jitterPercent || 20,
          seedChunkProtocol: false, // Warmup already done
          cadenceRange: { minMins: editForm.minMins, maxMins: editForm.maxMins },
          startDate: new Date()
        });

        // Merge: keep doneBatches, append reindexed newGenerated
        const reindexedNew = newGenerated.map((b, idx) => ({
          ...b,
          batchIndex: doneBatches.length + idx,
          isSeedBatch: false
        }));
        updatedBatches = [...doneBatches, ...reindexedNew];
      }

      const updatedCampaign: Campaign = {
        ...editModalCampaign,
        name: editForm.name.trim() || editModalCampaign.name,
        targetUrl: cleanTargetUrl,
        handle: cleanHandle,
        autoPauseOnServiceFailure: editForm.autoPauseOnServiceFailure,
        metrics: updatedMetrics,
        durationHours: editForm.durationHours,
        curve: editForm.curve,
        cadenceRange: { minMins: editForm.minMins, maxMins: editForm.maxMins },
        batches: updatedBatches
      };

      if (onEditCampaign) {
        await onEditCampaign(updatedCampaign);
      } else {
        const res = await fetch(`/api/campaigns/${updatedCampaign.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedCampaign)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to save');
        }
        const data = await res.json();
        setCampaigns(prev => prev.map(c => c.id === updatedCampaign.id ? data.campaign : c));
      }

      setToastMsg({ text: `Campaign "${updatedCampaign.name}" updated successfully!`, type: 'success' });
      setEditModalCampaign(null);
      setEditForm(null);
    } catch (e: any) {
      setToastMsg({ text: e.message || 'Error updating campaign', type: 'error' });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Sync selectedCampaignId if deleted or changed
  useEffect(() => {
    if (campaigns.length > 0) {
      if (!selectedCampaignId || !campaigns.some(c => c.id === selectedCampaignId)) {
        setSelectedCampaignId(campaigns[0].id);
      }
    } else {
      setSelectedCampaignId(null);
    }
  }, [campaigns, selectedCampaignId]);

  // Clock ticker for real-time countdown updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0];

  // Calculate next scheduled batch countdown
  const getNextBatchCountdown = (campaign: Campaign) => {
    if (campaign.status !== 'running') return { text: 'Paused / Inactive', seconds: 0 };
    const nextPending = campaign.batches.find(b => b.status === 'pending');
    if (!nextPending) return { text: 'All Batches Delivered', seconds: 0 };

    const scheduledMs = new Date(nextPending.scheduledAt).getTime();
    const diffSec = Math.max(0, Math.floor((scheduledMs - currentTime) / 1000));

    if (diffSec <= 0) return { text: 'Dispatching Now...', seconds: 0 };
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return {
      text: `${mins > 0 ? `${mins}m ` : ''}${secs}s`,
      seconds: diffSec,
      batchIndex: nextPending.batchIndex
    };
  };

  return (
    <div className="space-y-6">
      {/* Minimalist Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b0f17] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Active Campaigns</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time delivery progress and batch schedule for your running campaigns
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-purple-300 bg-purple-950/40 border border-purple-500/30 px-3 py-1 rounded-xl">
            {campaigns.filter(c => c.status === 'running').length} Active
          </span>
        </div>
      </div>

      {/* Floating Action Feedback Toast */}
      {toastMsg && (
        <div className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 shadow-xl transition-all animate-fade-in ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' 
            : toastMsg.type === 'error'
            ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
            : 'bg-purple-950/80 border-purple-500/50 text-purple-300'
        }`}>
          <div className="flex items-center gap-2">
            {toastMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastMsg.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toastMsg.type === 'info' && <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />}
            <span>{toastMsg.text}</span>
          </div>
          <button 
            onClick={() => setToastMsg(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main campaigns display */}
      {campaigns.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">No Active Campaigns Running</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Use the <strong>Campaign Creation Wizard</strong> to configure your platform, ratios, algorithmic curves, and launch your first 24/7 drip campaign.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaigns list sidebar */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Active Queues ({campaigns.length})
            </h3>

            <div className="space-y-2">
              {campaigns.map((camp) => {
                const isSelected = selectedCampaign?.id === camp.id;
                const completedBatches = camp.batches.filter(b => b.status === 'success').length;
                const progressPct = Math.round((completedBatches / camp.batches.length) * 100);
                const nextCountdown = getNextBatchCountdown(camp);
                const isAutoPaused = camp.status === 'paused' && !!camp.lastAutoPause;

                return (
                  <div
                    key={camp.id}
                    onClick={() => setSelectedCampaignId(camp.id)}
                    className={`group relative cursor-pointer p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="truncate pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {camp.platform}
                          </span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                            isAutoPaused
                              ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold'
                              : camp.status === 'running' 
                              ? 'bg-emerald-500/20 text-emerald-300' 
                              : camp.status === 'paused'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isAutoPaused ? 'AUTO-PAUSED' : camp.status.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-sm mt-1 truncate">
                          {camp.name}
                        </h4>
                        <div className="text-[11px] text-slate-400 font-mono truncate">
                          {camp.handle}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0 font-mono">
                        <div className="text-right">
                          <div className="text-xs font-bold text-cyan-300">{progressPct}%</div>
                          <div className="text-[10px] text-slate-500">{completedBatches}/{camp.batches.length}</div>
                        </div>

                        {/* Quick Action Icons in List Item */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Quick Clone button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClone(camp.id);
                            }}
                            disabled={cloningId === camp.id}
                            className="p-1 rounded hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-all cursor-pointer"
                            title="Clone Campaign"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Delete from list */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCampaignToDelete(camp);
                            }}
                            className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                            title="Delete Campaign"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    {/* Countdown Ticker */}
                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Next Dispatch:</span>
                      <span className="text-emerald-400 font-bold">{nextCountdown.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Campaign Detail & Real-time Live Ticker */}
          {selectedCampaign && (
            <div className="lg:col-span-2 space-y-5">
              {/* Circuit Breaker Auto-Pause Outage Banner */}
              {selectedCampaign.status === 'paused' && selectedCampaign.lastAutoPause && (
                <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 shadow-lg animate-fade-in font-mono">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm text-amber-300 flex items-center gap-2">
                        <span>Circuit Breaker Auto-Paused Campaign</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                          PROTECTION ACTIVE
                        </span>
                      </div>
                      <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                        Provider <strong>{selectedCampaign.lastAutoPause.serviceName}</strong> (Service #{selectedCampaign.lastAutoPause.serviceId}) reported:
                        <span className="font-bold text-white bg-black/40 px-1.5 py-0.5 rounded ml-1 border border-amber-500/30">
                          "{selectedCampaign.lastAutoPause.error}"
                        </span>
                      </p>
                      <p className="text-[10px] text-amber-400/80 mt-1">
                        Subsequent orders were held automatically to prevent wasted budget. Click Resume once the provider is restored.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onResumeCampaign(selectedCampaign.id)}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shrink-0 cursor-pointer shadow-md shadow-emerald-900/40"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume Campaign</span>
                  </button>
                </div>
              )}

              {/* Campaign Status Card */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 backdrop-blur-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{selectedCampaign.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                        Curve: {selectedCampaign.curve}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-md">
                      {selectedCampaign.targetUrl}
                    </p>
                  </div>

                  {/* Scheduler Control Actions */}
                  <div className="flex items-center flex-wrap gap-2">
                    {/* Pause / Resume */}
                    {selectedCampaign.status === 'running' ? (
                      <button
                        onClick={() => onPauseCampaign(selectedCampaign.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-semibold transition-all cursor-pointer"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onResumeCampaign(selectedCampaign.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-semibold transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Resume</span>
                      </button>
                    )}

                    {/* Edit Campaign Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(selectedCampaign)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-semibold transition-all cursor-pointer"
                      title="Edit campaign settings, target URL, metrics, pacing, and curve"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                      <span>Edit</span>
                    </button>

                    {/* Clone Campaign Button */}
                    <button
                      type="button"
                      onClick={() => handleClone(selectedCampaign.id)}
                      disabled={cloningId === selectedCampaign.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-semibold transition-all cursor-pointer disabled:opacity-50"
                      title="Clone entire campaign with refreshed pacing schedule"
                    >
                      {cloningId === selectedCampaign.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                      <span>Clone</span>
                    </button>

                    {/* Auto-Pause Outage Circuit Breaker Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleAutoPause(selectedCampaign)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all cursor-pointer ${
                        selectedCampaign.autoPauseOnServiceFailure !== false
                          ? 'bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border-purple-500/40 shadow-sm'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                      title="Auto-pause circuit breaker: automatically pauses when any SMM service fails"
                    >
                      <ShieldAlert className={`w-3.5 h-3.5 ${selectedCampaign.autoPauseOnServiceFailure !== false ? 'text-purple-400' : 'text-slate-500'}`} />
                      <span>Auto-Pause: {selectedCampaign.autoPauseOnServiceFailure !== false ? 'ON' : 'OFF'}</span>
                    </button>

                    {/* Trigger Next Batch */}
                    <button
                      onClick={() => onFastForwardBatch(selectedCampaign.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-mono font-semibold shadow-sm transition-all cursor-pointer"
                      title="Instantly execute next scheduled batch via SMM v2 gateway"
                    >
                      <FastForward className="w-3.5 h-3.5" />
                      <span>Trigger Next Batch</span>
                    </button>

                    {/* Prominent Delete Campaign button */}
                    <button
                      type="button"
                      onClick={() => setCampaignToDelete(selectedCampaign)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-semibold transition-all cursor-pointer"
                      title="Permanently remove campaign and cancel remaining SMM batches"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Progress Stats Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 font-mono text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Batches Dispatched</div>
                    <div className="text-sm font-bold text-white">
                      {selectedCampaign.batches.filter(b => b.status === 'success').length} / {selectedCampaign.batches.length}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Delivered Views</div>
                    <div className="text-sm font-bold text-emerald-400">
                      {selectedCampaign.batches
                        .filter(b => b.status === 'success')
                        .reduce((sum, b) => sum + b.views, 0)
                        .toLocaleString()}{' '}
                      <span className="text-[10px] text-slate-500">/ {selectedCampaign.metrics.views.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Active Anti-Detection</div>
                    <div className="text-sm font-bold text-cyan-400">
                      ±{selectedCampaign.jitterPercent}% Jitter
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Risk Audit</div>
                    <div className="text-sm font-bold text-emerald-400">
                      {selectedCampaign.riskAudit?.riskCategory || 'Ghost-Grade'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Batches Timeline Table */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2 font-mono">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Real-Time Execution Batch Feed</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    Staggered intra-batch timing (T+0m Views, T+1m Saves, T+5m Micro-Likes, T+10m Macro/Shares)
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-lg max-h-96">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Batch</th>
                        <th className="py-2.5 px-3">Scheduled At</th>
                        <th className="py-2.5 px-3">Views (ReliableSMM #8024)</th>
                        <th className="py-2.5 px-3">Likes & Routing</th>
                        <th className="py-2.5 px-3">Engagement</th>
                        <th className="py-2.5 px-3">Live Order IDs</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/60 text-slate-300">
                      {selectedCampaign.batches.map((batch) => (
                        <tr
                          key={batch.batchIndex}
                          className={`hover:bg-slate-900/60 transition-colors ${
                            batch.status === 'success' ? 'bg-emerald-950/10' : batch.status === 'running' ? 'bg-cyan-950/15' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                            <span>#{batch.batchIndex}</span>
                            {batch.isSeedBatch && (
                              <span className="text-[9px] uppercase px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Seed
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                            <div className="text-white font-medium">
                              {new Date(batch.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {batch.gapText && (
                              <div className="text-[10px] text-purple-400 font-mono">
                                Gap: {batch.gapText}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-white font-semibold">
                            {batch.views.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3">
                            {batch.isSeedBatch ? (
                              <span className="text-slate-500">Seed Warmup</span>
                            ) : batch.likes > 0 ? (
                              <div>
                                <span className="text-pink-400 font-bold">{batch.likes}</span>
                                <div className="text-[10px] mt-0.5">
                                  {batch.likes < 10 ? (
                                    <span className="text-cyan-400 bg-cyan-950/40 px-1 rounded border border-cyan-500/30">
                                      JAP #1778 (min 5)
                                    </span>
                                  ) : (
                                    <span className="text-purple-400 bg-purple-950/40 px-1 rounded border border-purple-500/30">
                                      Reliable #7147 (min 10)
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] space-y-0.5">
                            {batch.isSeedBatch ? (
                              <span className="text-slate-500 italic">Locked (Warmup)</span>
                            ) : (
                              <div className="flex items-center gap-2 text-slate-300">
                                {batch.saves > 0 && <span>Saves: <strong className="text-amber-400">{batch.saves}</strong></span>}
                                {batch.reposts > 0 && <span>Reposts: <strong className="text-indigo-400">{batch.reposts}</strong></span>}
                                {batch.shares > 0 && <span>Shares: <strong className="text-emerald-400">{batch.shares}</strong></span>}
                                {!batch.saves && !batch.reposts && !batch.shares && <span className="text-slate-600">—</span>}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] font-mono">
                            {batch.orderIds?.views ? (
                              <div className="space-y-0.5 max-w-[170px] truncate">
                                <div className="text-emerald-400" title={`Views: ${batch.orderIds.views}`}>
                                  V: #{batch.orderIds.views}
                                </div>
                                {batch.orderIds.likes && (
                                  <div className="text-pink-400" title={`Likes: ${batch.orderIds.likes}`}>
                                    L: #{batch.orderIds.likes}
                                  </div>
                                )}
                                {batch.orderIds.saves && (
                                  <div className="text-amber-400" title={`Saves: ${batch.orderIds.saves}`}>
                                    S: #{batch.orderIds.saves}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500">Pending</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {batch.status === 'success' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold whitespace-nowrap">
                                Delivered
                              </span>
                            ) : batch.status === 'running' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold animate-pulse whitespace-nowrap">
                                Delivering...
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900 border border-slate-800 text-slate-400 whitespace-nowrap">
                                Queued
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setInspectBatch(batch)}
                              className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors cursor-pointer"
                              title="View Order Details & Execution Logs"
                            >
                              Logs
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Campaign Confirmation Modal */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-rose-400">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Delete Campaign</h3>
              </div>
              <button
                type="button"
                onClick={() => setCampaignToDelete(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <p>
                Are you sure you want to permanently delete{' '}
                <strong className="text-white font-mono">{campaignToDelete.name}</strong>?
              </p>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
                <div>URL: {campaignToDelete.targetUrl}</div>
                <div>Batches: {campaignToDelete.batches.length} total</div>
                <div>Status: {campaignToDelete.status.toUpperCase()}</div>
              </div>
              <p className="text-rose-300 text-[11px]">
                This action cancels all remaining scheduled SMM batches and removes the campaign from the server.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCampaignToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = campaignToDelete.id;
                  onDeleteCampaign(id);
                  setCampaignToDelete(null);
                  if (selectedCampaignId === id) {
                    const remaining = campaigns.filter(c => c.id !== id);
                    setSelectedCampaignId(remaining.length > 0 ? remaining[0].id : null);
                  }
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono shadow-md shadow-rose-600/30 transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Logs & Order Details Modal */}
      {inspectBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Batch #{inspectBatch.batchIndex} SMM Orders & Logs
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectBatch(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-500">Scheduled Time</div>
                  <div className="text-white">{new Date(inspectBatch.scheduledAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Dispatched Time</div>
                  <div className="text-white">{inspectBatch.dispatchedAt ? new Date(inspectBatch.dispatchedAt).toLocaleString() : 'Not dispatched yet'}</div>
                </div>
              </div>

              {/* Order IDs Box */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="text-[10px] font-bold uppercase text-slate-400">Live SMM Panel Orders:</div>
                <div className="text-slate-300 space-y-1 text-[11px]">
                  <div>Views (ReliableSMM #8024): <span className="text-emerald-400 font-bold">{inspectBatch.orderIds?.views || 'Pending'}</span></div>
                  <div>Likes ({inspectBatch.likesProvider || 'Routing'}): <span className="text-pink-400 font-bold">{inspectBatch.orderIds?.likes || 'Pending'}</span></div>
                  <div>Saves (ReliableSMM #7841): <span className="text-amber-400 font-bold">{inspectBatch.orderIds?.saves || 'Pending / None'}</span></div>
                  <div>Reposts (ReliableSMM #7842): <span className="text-indigo-400 font-bold">{inspectBatch.orderIds?.reposts || 'Pending / None'}</span></div>
                  <div>Shares (ReliableSMM #2060): <span className="text-emerald-400 font-bold">{inspectBatch.orderIds?.shares || 'Pending / None'}</span></div>
                </div>
              </div>

              {/* Execution Logs */}
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Live Execution Trail:</div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 max-h-48 overflow-y-auto space-y-1 leading-relaxed">
                  {inspectBatch.executionLogs && inspectBatch.executionLogs.length > 0 ? (
                    inspectBatch.executionLogs.map((log, idx) => (
                      <div key={idx} className="font-mono text-slate-300">{log}</div>
                    ))
                  ) : (
                    <div className="text-slate-500 italic">No execution logs recorded yet. Batch is queued.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setInspectBatch(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {editModalCampaign && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl my-8 space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Edit Campaign Configuration
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                      {editModalCampaign.id}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Change target URL, volume metrics, duration, cadence gaps, or curve with automated batch rebalancing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditModalCampaign(null);
                  setEditForm(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="space-y-4">
              {/* Target & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="e.g. Viral Reel Growth Push"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                    Creator Handle
                  </label>
                  <input
                    type="text"
                    value={editForm.handle}
                    onChange={e => setEditForm({ ...editForm, handle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="@username"
                  />
                </div>
              </div>

              {/* Target URL */}
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                  Target Post / Reel URL
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    value={editForm.targetUrl}
                    onChange={e => {
                      const newUrl = e.target.value;
                      const parsed = parseTargetUrl(newUrl, editModalCampaign.platform);
                      setEditForm({
                        ...editForm,
                        targetUrl: newUrl,
                        handle: parsed.handle && editForm.handle.startsWith('@creator_') ? parsed.handle : editForm.handle
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="https://www.instagram.com/reel/..."
                  />
                </div>
              </div>

              {/* Circuit Breaker Auto-Pause on Outage Card */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20">
                <div className="flex items-start gap-3 pr-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      Auto-Pause Campaign if Any Service Is Unavailable
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                        Circuit Breaker
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Automatically halts the campaign immediately if ReliableSMM or JAP returns an API error, insufficient balance, or maintenance response to prevent dropped orders.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, autoPauseOnServiceFailure: !editForm.autoPauseOnServiceFailure })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    editForm.autoPauseOnServiceFailure ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      editForm.autoPauseOnServiceFailure ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Engagement Volume */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Target Engagement Volume</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const golden = computeGoldenRatioMetrics(editForm.views);
                      setEditForm({
                        ...editForm,
                        likes: golden.likes,
                        comments: golden.comments,
                        shares: golden.shares,
                        saves: golden.saves,
                        reposts: golden.reposts
                      });
                    }}
                    className="flex items-center gap-1 text-[11px] font-mono text-purple-400 hover:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Calculate Ratios (Golden Ratio)</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400"><Eye className="w-3 h-3 text-cyan-400" /> Views</span>
                      <span className="text-[9px] text-cyan-400 font-bold">Min 100</span>
                    </div>
                    <input
                      type="number"
                      min="100"
                      step="50"
                      value={editForm.views}
                      onChange={e => setEditForm({ ...editForm, views: Math.max(100, Number(e.target.value) || 100) })}
                      className="w-full bg-transparent text-white font-bold mt-1 focus:outline-none border-b border-slate-800 focus:border-cyan-400 pb-0.5"
                    />
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400"><Heart className="w-3 h-3 text-pink-400" /> Likes</span>
                      <span className="text-[9px] text-slate-400">Min 5</span>
                    </div>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={editForm.likes}
                      onChange={e => setEditForm({ ...editForm, likes: Math.max(5, Number(e.target.value) || 5) })}
                      className="w-full bg-transparent text-white font-bold mt-1 focus:outline-none border-b border-slate-800 focus:border-pink-400 pb-0.5"
                    />
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400"><MessageSquare className="w-3 h-3 text-emerald-400" /> Comments</span>
                      <span className="text-[9px] text-slate-400">0+</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editForm.comments}
                      onChange={e => setEditForm({ ...editForm, comments: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full bg-transparent text-white font-bold mt-1 focus:outline-none border-b border-slate-800 focus:border-emerald-400 pb-0.5"
                    />
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400"><Share2 className="w-3 h-3 text-emerald-400" /> Shares</span>
                      <span className="text-[9px] text-emerald-400 font-bold">Min 10</span>
                    </div>
                    <input
                      type="number"
                      min="10"
                      step="5"
                      value={editForm.shares}
                      onChange={e => setEditForm({ ...editForm, shares: Math.max(10, Number(e.target.value) || 10) })}
                      className="w-full bg-transparent text-white font-bold mt-1 focus:outline-none border-b border-slate-800 focus:border-emerald-400 pb-0.5"
                    />
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400"><Bookmark className="w-3 h-3 text-amber-400" /> Saves</span>
                      <span className="text-[9px] text-slate-400">Min 1</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="5"
                      value={editForm.saves}
                      onChange={e => setEditForm({ ...editForm, saves: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-full bg-transparent text-white font-bold mt-1 focus:outline-none border-b border-slate-800 focus:border-amber-400 pb-0.5"
                    />
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400"><RefreshCw className="w-3 h-3 text-indigo-400" /> Reposts</span>
                      <span className="text-[9px] text-slate-400">Min 1</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="2"
                      value={editForm.reposts}
                      onChange={e => setEditForm({ ...editForm, reposts: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-full bg-transparent text-white font-bold mt-1 focus:outline-none border-b border-slate-800 focus:border-indigo-400 pb-0.5"
                    />
                  </div>
                </div>
              </div>

              {/* Cadence Gap Range & Duration */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Cadence Interval & Dynamic Random Gap</span>
                  </div>
                  <div className="text-[11px] font-mono text-indigo-400 font-bold">
                    Random {editForm.minMins}–{editForm.maxMins}m per batch
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '20–35m', min: 20, max: 35 },
                    { label: '25m', min: 20, max: 30 },
                    { label: '35m', min: 25, max: 45 },
                    { label: '45m', min: 35, max: 55 },
                    { label: '60m', min: 45, max: 65 },
                    { label: '25–60m (Wide)', min: 25, max: 60 },
                  ].map(p => {
                    const active = editForm.minMins === p.min && editForm.maxMins === p.max;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, minMins: p.min, maxMins: p.max })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                          active
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {/* Duration & Custom Range */}
                <div className="grid grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
                  <div>
                    <label className="text-[10px] text-slate-500">Duration (Hours)</label>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={editForm.durationHours}
                      onChange={e => setEditForm({ ...editForm, durationHours: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-bold mt-0.5 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Min Gap (Mins)</label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={editForm.minMins}
                      onChange={e => setEditForm({ ...editForm, minMins: Math.max(5, Number(e.target.value) || 5) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-bold mt-0.5 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Max Gap (Mins)</label>
                    <input
                      type="number"
                      min={editForm.minMins}
                      max="180"
                      value={editForm.maxMins}
                      onChange={e => setEditForm({ ...editForm, maxMins: Math.max(editForm.minMins, Number(e.target.value) || editForm.minMins) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-bold mt-0.5 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>
              </div>

              {/* Algorithmic Curve */}
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                  Algorithmic Curve
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                  {[
                    { id: 'trending_rocket', label: 'Trending Rocket', icon: '🚀' },
                    { id: 'steady_climb', label: 'Steady Climb', icon: '📈' },
                    { id: 'explore_push', label: 'Explore Push', icon: '🔥' },
                    { id: 'fyp_waves', label: 'FYP Waves', icon: '🌊' },
                    { id: 'circadian', label: 'Circadian Sleep/Wake', icon: '🌙' },
                    { id: 'evergreen', label: 'Evergreen Slow-Burn', icon: '⏳' },
                  ].map(c => {
                    const isSelected = editForm.curve === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, curve: c.id as AlgorithmicCurve })}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-950/60 border-purple-500/50 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <span className="text-sm">{c.icon}</span>
                        <span className="truncate text-[11px] font-bold">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Smart Rebalance Toggle */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl border border-purple-500/30 bg-purple-950/20 font-mono">
                <input
                  type="checkbox"
                  id="rebalanceToggle"
                  checked={editForm.rebalancePendingBatches}
                  onChange={e => setEditForm({ ...editForm, rebalancePendingBatches: e.target.checked })}
                  className="mt-0.5 rounded border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="rebalanceToggle" className="text-xs cursor-pointer select-none">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>Smart Rebalance Remaining Batches (Recommended)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Preserves already dispatched/completed batches, subtracts delivered volume, and smoothly re-distributes only the remaining metrics across newly timed batches starting now.
                  </p>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 font-mono">
              <button
                type="button"
                onClick={() => {
                  setEditModalCampaign(null);
                  setEditForm(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={handleSaveEdit}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingEdit ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save & Update Campaign</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

