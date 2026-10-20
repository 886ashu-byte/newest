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
  X
} from 'lucide-react';
import { Campaign, ScheduledBatch } from '../types';

interface ActiveSchedulerProps {
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  onFastForwardBatch: (campaignId: string) => void;
  onPauseCampaign: (campaignId: string) => void;
  onResumeCampaign: (campaignId: string) => void;
  onDeleteCampaign: (campaignId: string) => void;
  onSelectCampaignForWizard?: (campaign: Campaign) => void;
}

export const ActiveSchedulerView: React.FC<ActiveSchedulerProps> = ({
  campaigns,
  setCampaigns,
  onFastForwardBatch,
  onPauseCampaign,
  onResumeCampaign,
  onDeleteCampaign,
  onSelectCampaignForWizard,
}) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    campaigns.length > 0 ? campaigns[0].id : null
  );
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [inspectBatch, setInspectBatch] = useState<ScheduledBatch | null>(null);

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
                    className={`group relative cursor-pointer p-4 rounded-xl border transition-all ${
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

                      <div className="flex flex-col items-end gap-1.5 shrink-0 font-mono">
                        <div className="text-right">
                          <div className="text-xs font-bold text-cyan-300">{progressPct}%</div>
                          <div className="text-[10px] text-slate-500">{completedBatches}/{camp.batches.length}</div>
                        </div>
                        {/* Quick Delete from list */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCampaignToDelete(camp);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                  <div className="flex items-center flex-wrap gap-2">
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
    </div>
  );
};
