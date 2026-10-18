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
  Sparkles
} from 'lucide-react';
import { Campaign, ScheduledBatch } from '../types';

interface ActiveSchedulerProps {
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  onFastForwardBatch: (campaignId: string) => void;
  onPauseCampaign: (campaignId: string) => void;
  onResumeCampaign: (campaignId: string) => void;
  onSelectCampaignForWizard?: (campaign: Campaign) => void;
}

export const ActiveSchedulerView: React.FC<ActiveSchedulerProps> = ({
  campaigns,
  setCampaigns,
  onFastForwardBatch,
  onPauseCampaign,
  onResumeCampaign,
  onSelectCampaignForWizard,
}) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    campaigns.length > 0 ? campaigns[0].id : null
  );
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

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

                return (
                  <div
                    key={camp.id}
                    onClick={() => setSelectedCampaignId(camp.id)}
                    className={`cursor-pointer p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="truncate pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {camp.platform}
                          </span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                            camp.status === 'running' 
                              ? 'bg-emerald-500/20 text-emerald-300' 
                              : camp.status === 'paused'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {camp.status.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-sm mt-1 truncate">
                          {camp.name}
                        </h4>
                        <div className="text-[11px] text-slate-400 font-mono truncate">
                          {camp.handle}
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono">
                        <div className="text-xs font-bold text-cyan-300">{progressPct}%</div>
                        <div className="text-[10px] text-slate-500">{completedBatches}/{camp.batches.length}</div>
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
                  <div className="flex items-center gap-2">
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

                    <button
                      onClick={() => onFastForwardBatch(selectedCampaign.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-mono font-semibold shadow-sm transition-all cursor-pointer"
                      title="Instantly execute next scheduled batch via SMM v2 gateway"
                    >
                      <FastForward className="w-3.5 h-3.5" />
                      <span>Trigger Next Batch Now</span>
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
                    Updates live as batches fire
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-lg max-h-80">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Batch</th>
                        <th className="py-2.5 px-3">Scheduled At</th>
                        <th className="py-2.5 px-3">Views (ReliableSMM #8024)</th>
                        <th className="py-2.5 px-3">Likes</th>
                        <th className="py-2.5 px-3">Provider</th>
                        <th className="py-2.5 px-3">Order ID</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/60 text-slate-300">
                      {selectedCampaign.batches.map((batch) => (
                        <tr
                          key={batch.batchIndex}
                          className={`hover:bg-slate-900/60 transition-colors ${
                            batch.status === 'success' ? 'bg-emerald-950/10' : ''
                          }`}
                        >
                          <td className="py-2 px-3 font-bold text-white flex items-center gap-1.5">
                            <span>#{batch.batchIndex}</span>
                            {batch.isSeedBatch && (
                              <span className="text-[9px] uppercase px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Seed
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-400">
                            {new Date(batch.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2 px-3 text-white font-semibold">
                            {batch.views.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-pink-400">
                            {batch.isSeedBatch ? '0 (locked)' : batch.likes}
                          </td>
                          <td className="py-2 px-3 text-[11px]">
                            {batch.isSeedBatch ? (
                              <span className="text-slate-500">Seed Mode</span>
                            ) : batch.likesProvider === 'JAP_Micro' ? (
                              <span className="text-cyan-400">JAP #1778</span>
                            ) : batch.likesProvider === 'ReliableSMM_Macro' ? (
                              <span className="text-purple-400">Reliable #7147</span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-400 text-[11px]">
                            {batch.orderIds?.views || 'Pending'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {batch.status === 'success' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                                Delivered
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900 border border-slate-800 text-slate-400">
                                Queued
                              </span>
                            )}
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
    </div>
  );
};
