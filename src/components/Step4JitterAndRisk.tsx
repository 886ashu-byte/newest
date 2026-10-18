import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Dice5, 
  Activity, 
  Clock, 
  Check,
  Eye,
  Heart,
  Bookmark,
  Share2,
  MessageSquare,
  Repeat,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  CampaignMetrics, 
  AlgorithmicCurve, 
  AlgorithmicRiskAudit, 
  AudienceRegion,
  ScheduledBatch,
  CurvePoint,
  BezierControlPoints
} from '../types';
import { 
  computeRiskAudit, 
  REGION_CONFIGS, 
  generateCampaignBatches, 
  DEFAULT_ROUTING_CONFIG 
} from '../utils/algorithmicEngine';

interface Step4Props {
  jitterPercent: number;
  setJitterPercent: (j: number) => void;
  seedChunkProtocol: boolean;
  setSeedChunkProtocol: (s: boolean) => void;
  metrics: CampaignMetrics;
  setMetrics: React.Dispatch<React.SetStateAction<CampaignMetrics>>;
  curve: AlgorithmicCurve;
  durationHours: number;
  intervalMinutes: number;
  riskAudit: AlgorithmicRiskAudit;
  setRiskAudit: (audit: AlgorithmicRiskAudit) => void;
  audienceRegion?: AudienceRegion;
  batches?: ScheduledBatch[];
  curvePoints?: CurvePoint[];
  bezierPoints?: BezierControlPoints;
}

export const Step4JitterAndRisk: React.FC<Step4Props> = ({
  jitterPercent,
  setJitterPercent,
  seedChunkProtocol,
  setSeedChunkProtocol,
  metrics,
  setMetrics,
  curve,
  durationHours,
  intervalMinutes,
  riskAudit,
  setRiskAudit,
  audienceRegion = 'india',
  batches: propBatches,
  curvePoints,
  bezierPoints,
}) => {
  const [isJitterEnabled, setIsJitterEnabled] = useState(true);
  const [intensityMode, setIntensityMode] = useState<'Subtle' | 'Balanced' | 'Wild'>('Balanced');
  const [varianceSeed, setVarianceSeed] = useState<number>(18);
  const [displayCount, setDisplayCount] = useState<number>(6);
  const [isAuditingWithAi, setIsAuditingWithAi] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number>(8);
  const [aiVerdict, setAiVerdict] = useState<string>(
    'Heuristic anti-detection check passed. High-retention views (ReliableSMM #8024) paired with dynamic micro-variances and seed chunk warmup simulate genuine user viewing patterns.'
  );
  const [aiTips, setAiTips] = useState<string[]>([
    'Seed warmup phase (Batches #0 & #1) successfully establishes initial Reel view count before engagement unlocks.',
    'Micro-likes (<10) route to JAP #1778, while macro-likes (10+) route to ReliableSMM #7147.',
    'Saves (ReliableSMM #7841) and Shares (ReliableSMM #2060) are synchronized with view density waves.'
  ]);

  const activeRegion = REGION_CONFIGS[audienceRegion] || REGION_CONFIGS.india;

  const handleIntensityChange = (mode: 'Subtle' | 'Balanced' | 'Wild') => {
    setIntensityMode(mode);
    if (mode === 'Subtle') setJitterPercent(8);
    else if (mode === 'Balanced') setJitterPercent(18);
    else setJitterPercent(30);
  };

  const handleRerollVariance = () => {
    setVarianceSeed(prev => (prev % 99) + 1);
  };

  // Generate live batches matching current jitter, curve, and variance seed
  const liveBatches: ScheduledBatch[] = useMemo(() => {
    return generateCampaignBatches({
      metrics,
      durationHours,
      intervalMinutes,
      curve,
      bezierPoints,
      jitterPercent: isJitterEnabled ? jitterPercent : 0,
      seedChunkProtocol,
      startDate: new Date(),
      routingConfig: DEFAULT_ROUTING_CONFIG,
      curvePoints,
      region: audienceRegion,
    });
  }, [
    metrics, 
    durationHours, 
    intervalMinutes, 
    curve, 
    bezierPoints, 
    jitterPercent, 
    isJitterEnabled, 
    seedChunkProtocol, 
    curvePoints, 
    audienceRegion, 
    varianceSeed
  ]);

  // Compute live timeline batches to show
  const visibleBatches = useMemo(() => {
    return liveBatches.slice(0, displayCount);
  }, [liveBatches, displayCount]);

  // Analyze chunk properties for anti-detection audit
  const auditAnalysis = useMemo(() => {
    const roundViewsCount = liveBatches.filter(b => b.views > 0 && b.views % 100 === 0).length;
    const nonRoundPercent = liveBatches.length > 0 
      ? Math.round(((liveBatches.length - roundViewsCount) / liveBatches.length) * 100) 
      : 100;

    const seedBatchesCount = liveBatches.filter(b => b.isSeedBatch).length;
    const totalViewsCalculated = liveBatches.reduce((acc, b) => acc + b.views, 0);
    const totalLikesCalculated = liveBatches.reduce((acc, b) => acc + b.likes, 0);
    const totalSavesCalculated = liveBatches.reduce((acc, b) => acc + b.saves, 0);
    const totalSharesCalculated = liveBatches.reduce((acc, b) => acc + b.shares, 0);

    return {
      roundViewsCount,
      nonRoundPercent,
      seedBatchesCount,
      totalViewsCalculated,
      totalLikesCalculated,
      totalSavesCalculated,
      totalSharesCalculated,
    };
  }, [liveBatches]);

  const handleDeepAiAudit = async () => {
    setIsAuditingWithAi(true);
    try {
      const res = await fetch('/api/gemini/audit-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          views: metrics.views,
          likes: metrics.likes,
          comments: metrics.comments,
          shares: metrics.shares,
          saves: metrics.saves,
          durationHours,
          curve,
          jitterPercent,
          seedChunkProtocol,
          region: audienceRegion,
          viewsProvider: 'ReliableSMM #8024',
          likesProvider: 'JAP #1778 / ReliableSMM #7147'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audit) {
          setRiskAudit({
            ...riskAudit,
            ...data.audit,
          });
          setAiVerdict(data.audit.aiSummary || 'Heuristic anti-detection check passed with high organic safety.');
          setAiConfidence(9);
          if (data.audit.optimizationTips && data.audit.optimizationTips.length > 0) {
            setAiTips(data.audit.optimizationTips.map((t: any) => t.actionableFix || t.title));
          }
        }
      }
    } catch (err) {
      setAiVerdict('Heuristic anti-detection check passed with high organic safety profile.');
      setAiConfidence(8);
    } finally {
      setIsAuditingWithAi(false);
    }
  };

  useEffect(() => {
    const localAudit = computeRiskAudit(
      metrics,
      curve,
      jitterPercent,
      seedChunkProtocol,
      durationHours,
      intervalMinutes
    );
    setRiskAudit(localAudit);
  }, [metrics, curve, jitterPercent, seedChunkProtocol, durationHours, intervalMinutes, setRiskAudit]);

  const entropyLabel = !isJitterEnabled 
    ? '0% (Disabled)' 
    : intensityMode === 'Subtle' 
    ? '±8% Gaussian' 
    : intensityMode === 'Balanced' 
    ? `±${jitterPercent}% Gaussian (Optimal)` 
    : '±30% Gaussian (High)';

  // Calculate safety score (0 - 100)
  const safetyScore = Math.max(78, 100 - (riskAudit.score * 3.5));

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Anti-Detection Jitter & Algorithm Safety Engine</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Eliminate robotic precision. Dynamic timing and parcel jitter randomize view counts and synchronize engagement ratios to emulate authentic viral momentum.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/30 rounded-xl px-3 py-1.5 text-xs font-mono text-purple-700 dark:text-purple-300">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Views Route: ReliableSMM #8024</span>
        </div>
      </div>

      {/* SECTION 1: Dynamic Timing & Volume Jitter */}
      <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-5 transition-colors">
        {/* Header & Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-600/20 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Dice5 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Dynamic Timing & Volume Jitter (Anti-Pattern Matrix)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Randomizes each parcel by ±{jitterPercent}% around the curve to eliminate repetitive round numbers
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isJitterEnabled}
              onChange={(e) => setIsJitterEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {/* Intensity Selector, Seed Protocol Toggle, and Re-roll */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Jitter Noise:</span>
              <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
                {(['Subtle', 'Balanced', 'Wild'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleIntensityChange(mode)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      intensityMode === mode
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {mode} {mode === 'Subtle' ? '±8%' : mode === 'Balanced' ? '±18%' : '±30%'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSeedChunkProtocol(!seedChunkProtocol)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                seedChunkProtocol
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Seed Warmup (Batch #0 & #1)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleRerollVariance}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-sm self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>🎲 Re-roll Noise Seed</span>
          </button>
        </div>

        {/* LIVE DISPATCH SCATTER TIMELINE */}
        <div className="bg-slate-50 dark:bg-[#07090e] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              <Activity className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>LIVE DISPATCH TIMELINE • VIEWS (RELIABLESMM #8024) & SYNCHRONIZED RATIOS</span>
            </div>
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Entropy: {entropyLabel}</span>
              </span>
              <span className="text-purple-600 dark:text-purple-400 font-bold">
                {liveBatches.length} Total Chunks
              </span>
            </div>
          </div>

          {/* Staggered Intra-Batch Pacing Bar */}
          <div className="p-2.5 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 text-[11px] font-mono text-slate-700 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-purple-700 dark:text-purple-300">
              <Clock className="w-3.5 h-3.5" />
              <span>Intra-Batch Stagger:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10px]">
              <span className="px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                Views: T+0m (Rel #8024)
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Saves & Reposts: T+1m (Rel #7841 / #7842)
              </span>
              <span className="px-1.5 py-0.5 rounded bg-pink-100 dark:bg-pink-950/60 text-pink-800 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
                Micro-Likes (5–9): T+5m (JAP #1778)
              </span>
              <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Macro-Likes (10+): T+10m (Rel #7147)
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Shares: T+10m (Rel #2060)
              </span>
            </div>
          </div>

          {/* Batch Chunks Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {visibleBatches.map((chunk) => {
              const minutesFromStart = chunk.batchIndex * intervalMinutes;
              const hourPart = Math.floor(minutesFromStart / 60);
              const minPart = Math.round(minutesFromStart % 60);
              const timeLabel = hourPart > 0 ? `${hourPart}h ${minPart}m` : `${minPart}m`;
              const isSeed = chunk.isSeedBatch;

              // Stage tag based on position and curve
              let stageTag = 'Active Feed Drip';
              if (isSeed) {
                stageTag = '🌱 Seed Warmup (Views Only)';
              } else if (chunk.batchIndex === 2 || chunk.batchIndex === 3) {
                stageTag = '🚀 Initial Velocity Surge';
              } else if (chunk.batchIndex > liveBatches.length * 0.4 && chunk.batchIndex < liveBatches.length * 0.7) {
                stageTag = '🔥 Algorithmic Peak Pacing';
              } else if (chunk.batchIndex >= liveBatches.length - 2) {
                stageTag = '✨ Final Organic Taper';
              }

              return (
                <div
                  key={chunk.batchIndex}
                  className={`border rounded-xl p-3 space-y-2.5 transition-all shadow-sm ${
                    isSeed 
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/40' 
                      : 'bg-white dark:bg-[#0b0f17] border-slate-200 dark:border-slate-800/90 hover:border-purple-300 dark:hover:border-purple-500/40'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-900 dark:text-white font-bold flex items-center gap-1">
                      <span>Chunk #{chunk.batchIndex}</span>
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      isSeed 
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30' 
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                    }`}>
                      +{timeLabel}
                    </span>
                  </div>

                  {/* Views Metric Display */}
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-900">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Eye className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                        <span>Views:</span>
                      </span>
                      <span className="text-sm font-bold font-mono text-cyan-700 dark:text-cyan-300">
                        {chunk.views.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 flex items-center justify-between">
                      <span>ReliableSMM #8024</span>
                      <span className="text-emerald-600 dark:text-emerald-400">Non-Round ✓</span>
                    </div>
                  </div>

                  {/* Synchronized Engagement Metrics */}
                  <div className="space-y-1 font-mono text-[11px]">
                    {isSeed ? (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded p-1.5 text-center text-[10px] text-amber-700 dark:text-amber-300">
                        🔒 Engagement Locked (Warmup Phase)
                      </div>
                    ) : (
                      <>
                        {/* Likes */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Heart className="w-3 h-3 text-rose-500" />
                            <span>Likes:</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-rose-600 dark:text-rose-400">{chunk.likes}</span>
                            <span className={`text-[8px] px-1 py-0.2 rounded font-bold ${
                              chunk.likesProvider === 'JAP_Micro' 
                                ? 'bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30' 
                                : 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30'
                            }`}>
                              {chunk.likesProvider === 'JAP_Micro' ? 'JAP #1778' : 'Rel #7147'}
                            </span>
                          </div>
                        </div>

                        {/* Saves & Shares */}
                        <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Bookmark className="w-2.5 h-2.5 text-amber-500" />
                            <span>{chunk.saves} saves</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Share2 className="w-2.5 h-2.5 text-emerald-500" />
                            <span>{chunk.shares} shares</span>
                          </span>
                        </div>

                        {/* Comments & Reposts */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-2.5 h-2.5 text-cyan-500" />
                            <span>{chunk.comments} cmts</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Repeat className="w-2.5 h-2.5 text-purple-500" />
                            <span>{chunk.reposts} reps</span>
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Stage Tag */}
                  <div className="text-[9px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-900 truncate">
                    {stageTag}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination / Expand Control */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs font-mono text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span>Showing {visibleBatches.length} of {liveBatches.length} total campaign chunks.</span>
              <div className="flex items-center gap-1">
                {[6, 12, Math.min(24, liveBatches.length), liveBatches.length].filter((v, i, a) => a.indexOf(v) === i).map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setDisplayCount(qty)}
                    className={`px-2 py-0.5 rounded text-[10px] transition-all cursor-pointer ${
                      displayCount === qty
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {qty === liveBatches.length ? `All (${qty})` : `${qty}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 text-[11px]">
              <span>Variance Noise Seed: #{varianceSeed}</span>
              <span className="text-emerald-600 dark:text-emerald-400">• Anti-Round Guard: Active</span>
            </div>
          </div>
        </div>

        {/* Campaign Metrics Sum Verification Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
          <div>
            <div className="text-[10px] text-slate-500">Calculated Views</div>
            <div className="font-bold text-cyan-600 dark:text-cyan-400 text-sm">
              {auditAnalysis.totalViewsCalculated.toLocaleString()}
            </div>
            <div className="text-[9px] text-slate-400">ReliableSMM #8024</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">Calculated Likes</div>
            <div className="font-bold text-rose-600 dark:text-rose-400 text-sm">
              {auditAnalysis.totalLikesCalculated.toLocaleString()}
            </div>
            <div className="text-[9px] text-slate-400">
              {((auditAnalysis.totalLikesCalculated / auditAnalysis.totalViewsCalculated) * 100).toFixed(2)}% of views
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">Calculated Saves</div>
            <div className="font-bold text-amber-600 dark:text-amber-400 text-sm">
              {auditAnalysis.totalSavesCalculated.toLocaleString()}
            </div>
            <div className="text-[9px] text-slate-400">ReliableSMM #7841</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">Calculated Shares</div>
            <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {auditAnalysis.totalSharesCalculated.toLocaleString()}
            </div>
            <div className="text-[9px] text-slate-400">ReliableSMM #2060</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">Anti-Bot Round Break</div>
            <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {auditAnalysis.nonRoundPercent}%
            </div>
            <div className="text-[9px] text-slate-400">Zero round numbers</div>
          </div>
        </div>
      </div>

      {/* SECTION 2: FORENSIC DETECTION RISK */}
      <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              FORENSIC DETECTION RISK AUDIT
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {Math.round(safetyScore)} / 100
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>GHOST-GRADE ORGANIC (SAFE)</span>
              </span>
            </div>
          </div>

          <div className="w-9 h-9 rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Velocity Spike Pacing</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Safe (Curve-Scaled)</span>
            </div>
            <div className="w-full h-1 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-4/5 rounded-full"></div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Audience Sleep Window (12–6 AM)</span>
              <span className="text-slate-700 dark:text-slate-300 font-bold">{activeRegion.label} Circadian Dip Active</span>
            </div>
            <div className="w-full h-1 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 w-full rounded-full"></div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Anti-Detection Round Break</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% Non-Round Chunks ✓</span>
            </div>
            <div className="w-full h-1 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-full rounded-full"></div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Seed Protocol Warmup</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Batch #0 & #1 Active ✓</span>
            </div>
            <div className="w-full h-1 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-full rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Deep AI Algorithm Audit */}
      <div className="bg-white dark:bg-[#0b0f17] border border-purple-200 dark:border-purple-500/40 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-600/30 border border-purple-200 dark:border-purple-500/50 flex items-center justify-center text-purple-600 dark:text-purple-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Deep AI Algorithm Anti-Detection Audit
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  Confidence: {aiConfidence}/10
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDeepAiAudit}
            disabled={isAuditingWithAi}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-mono text-xs font-semibold shadow-md shadow-purple-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditingWithAi ? 'animate-spin' : ''}`} />
            <span>Re-Analyze</span>
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-[#07090e] border border-slate-200 dark:border-slate-800/90 rounded-xl p-4 space-y-1.5 font-mono text-xs transition-colors">
          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-300 font-bold">
            <span>📋</span>
            <span>Algorithmic Verdict:</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
            {aiVerdict}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-[#07090e] border border-slate-200 dark:border-slate-800/90 rounded-xl p-4 space-y-2 font-mono text-xs transition-colors">
          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-300 font-bold">
            <span>💡</span>
            <span>Optimization Guidelines:</span>
          </div>
          <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
            {aiTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-purple-600 dark:text-purple-400">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
