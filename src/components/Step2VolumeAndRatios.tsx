import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  Repeat,
  Wand2,
  Clock,
  Globe,
  TrendingUp,
  SunMoon,
  Flame,
  Rocket,
  Check
} from 'lucide-react';
import { 
  CampaignMetrics, 
  CommentNiche, 
  AlgorithmicCurve, 
  AudienceRegion, 
  SpeedInterval,
  CurvePoint 
} from '../types';
import { 
  evaluateRatioGuardrails, 
  computeGoldenRatioMetrics,
  computeMetricsFromRatioPreset,
  RATIO_PRESET_CONFIGS,
  RatioPresetType,
  ADVANCED_CURVE_PRESETS,
  getIntervalMinutes
} from '../utils/algorithmicEngine';
import { getRandomPresetComments } from '../utils/commentPresets';

interface Step2Props {
  metrics: CampaignMetrics;
  setMetrics: React.Dispatch<React.SetStateAction<CampaignMetrics>>;
  commentNiche: CommentNiche;
  setCommentNiche: (n: CommentNiche) => void;
  generatedComments: string[];
  setGeneratedComments: React.Dispatch<React.SetStateAction<string[]>>;
  durationHours: number;
  setDurationHours: (h: number) => void;
  curve: AlgorithmicCurve;
  setCurve: (c: AlgorithmicCurve) => void;
  audienceRegion?: AudienceRegion;
  setAudienceRegion?: (r: AudienceRegion) => void;
  speedInterval?: SpeedInterval;
  setSpeedInterval?: (s: SpeedInterval) => void;
  curvePoints?: CurvePoint[];
  setCurvePoints?: React.Dispatch<React.SetStateAction<CurvePoint[]>>;
}

const NICHES: CommentNiche[] = [
  'Lifestyle',
  'Crypto & Web3',
  'Fitness & Health',
  'E-commerce & Dropshipping',
  'Tech & AI',
  'Luxury & Automotive',
  'Motivation & Business',
  'Streetwear & Aesthetics',
];

const QUICK_VIEWS = [1000, 5000, 10000, 25000, 50000, 100000, 250000];

const DURATION_PRESETS = [
  { hours: 6, label: '6 Hours', sub: 'Fast Push' },
  { hours: 12, label: '12 Hours', sub: 'Half Day' },
  { hours: 24, label: '24 Hours', sub: 'Recommended' },
  { hours: 48, label: '48 Hours', sub: 'Extended Drip' },
  { hours: 72, label: '3 Days', sub: 'Viral Taper' },
];

const AUDIENCE_OPTIONS: { id: AudienceRegion; label: string; flag: string; peak: string; desc: string }[] = [
  { id: 'india', label: 'India & South Asia', flag: '🇮🇳', peak: '7:00 PM – 11:30 PM IST', desc: 'Indian IG Views + high Reels engagement' },
  { id: 'us_east', label: 'USA & North America (East)', flag: '🇺🇸', peak: '12:00 PM – 9:00 PM EST', desc: 'Tier-1 high conversion audience' },
  { id: 'us_west', label: 'USA & North America (West)', flag: '🇺🇸', peak: '1:00 PM – 10:00 PM PST', desc: 'West coast peak evening browsing' },
  { id: 'uk_europe', label: 'Europe & UK', flag: '🇪🇺', peak: '2:00 PM – 10:00 PM GMT/CET', desc: 'European metropolitan timezone' },
  { id: 'global', label: 'Global Organic Mix', flag: '🌍', peak: '24/7 Balanced Flow', desc: 'Rotational drip across global zones' },
];

const ORGANIC_CURVE_PRESETS: { id: AlgorithmicCurve; name: string; icon: any; tagline: string; desc: string }[] = [
  {
    id: 'circadian',
    name: 'Circadian Day/Night Cycle',
    icon: SunMoon,
    tagline: 'Natural human sleep & wake rhythm',
    desc: 'Volume automatically drops by 85% during 1 AM – 6 AM audience sleep hours, surging during evening peak.'
  },
  {
    id: 'trending_rocket',
    name: 'Viral Exponential Surge',
    icon: Rocket,
    tagline: 'Explore page viral breakout',
    desc: 'Gradual organic warm-up, steep exponential surge at hour 8–14, smoothly tapering off naturally.'
  },
  {
    id: 'steady',
    name: 'Steady Organic Drip',
    icon: TrendingUp,
    tagline: 'Linear uniform distribution',
    desc: 'Maintains a smooth, unflagged natural trickle of views and interactions across the full duration.'
  },
  {
    id: 'front_loaded',
    name: 'Front-Loaded Launch',
    icon: Flame,
    tagline: 'High initial momentum',
    desc: 'Delivers 35% in the first 2 hours to catch early algorithm recommendation waves, then steady decay.'
  }
];

export const Step2VolumeAndRatios: React.FC<Step2Props> = ({
  metrics,
  setMetrics,
  commentNiche,
  setCommentNiche,
  generatedComments,
  setGeneratedComments,
  durationHours,
  setDurationHours,
  curve,
  setCurve,
  audienceRegion = 'india',
  setAudienceRegion,
  speedInterval = 'turbo_2m',
  setSpeedInterval,
  curvePoints,
  setCurvePoints,
}) => {
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentTone, setCommentTone] = useState<'Casual & Organic' | 'Hype & Fire' | 'Relatable' | 'Question-based'>('Casual & Organic');

  const ratioEvaluations = evaluateRatioGuardrails(metrics.views, metrics);

  // Auto-lock guardrails to golden ratio
  const handleAutoLockGuardrails = () => {
    const optimal = computeGoldenRatioMetrics(metrics.views);
    setMetrics(optimal);
  };

  // Views change handler
  const handleViewsChange = (newViews: number) => {
    const safe = Math.max(1000, newViews);
    const currentRatio = {
      likes: metrics.likes / (metrics.views || 1000),
      comments: metrics.comments / (metrics.views || 1000),
      shares: metrics.shares / (metrics.views || 1000),
      saves: metrics.saves / (metrics.views || 1000),
      reposts: metrics.reposts / (metrics.views || 1000),
    };

    setMetrics({
      views: safe,
      likes: Math.max(10, Math.round(safe * currentRatio.likes)),
      comments: Math.max(2, Math.round(safe * currentRatio.comments)),
      shares: Math.max(10, Math.round(safe * currentRatio.shares)),
      saves: Math.max(5, Math.round(safe * currentRatio.saves)),
      reposts: Math.max(2, Math.round(safe * currentRatio.reposts)),
    });
  };

  // Curve selection handler
  const handleSelectCurve = (presetId: AlgorithmicCurve) => {
    setCurve(presetId);
    if (setCurvePoints) {
      const found = ADVANCED_CURVE_PRESETS.find(p => p.id === presetId);
      if (found) {
        setCurvePoints([...found.points]);
      }
    }
  };

  // AI Comment Generator via backend API
  const handleGenerateComments = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/gemini/generate-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: commentNiche,
          tone: commentTone,
          count: Math.min(20, Math.max(8, metrics.comments))
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.comments && Array.isArray(data.comments)) {
          setGeneratedComments(data.comments);
          return;
        }
      }
      setGeneratedComments(getRandomPresetComments(commentNiche, Math.min(20, Math.max(8, metrics.comments))));
    } catch (err) {
      setGeneratedComments(getRandomPresetComments(commentNiche, Math.min(20, Math.max(8, metrics.comments))));
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    setGeneratedComments(prev => [newCommentText.trim(), ...prev]);
    setNewCommentText('');
  };

  const handleRemoveComment = (index: number) => {
    setGeneratedComments(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate estimated total batches
  const intervalMins = getIntervalMinutes(speedInterval);
  const totalBatchesEstimate = Math.max(1, Math.floor((durationHours * 60) / intervalMins));

  // Preview curve points for mini visualizer
  const miniCurvePath = useMemo(() => {
    const points: number[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      let y = 0.5;
      if (curve === 'circadian') {
        y = 0.2 + 0.7 * Math.pow(Math.sin((t - 0.2) * Math.PI), 2);
      } else if (curve === 'trending_rocket' || curve === 'viral_spike') {
        y = Math.pow(t, 2.2) * 0.95 + 0.05;
        if (t > 0.8) y *= (1 - (t - 0.8) * 2);
      } else if (curve === 'front_loaded') {
        y = Math.max(0.1, 0.95 - t * 0.75);
      } else {
        y = 0.45 + 0.1 * Math.sin(t * 10);
      }
      points.push(Math.max(0.08, Math.min(0.95, y)));
    }
    
    return points.map((p, idx) => {
      const x = (idx / 12) * 280 + 10;
      const y = 65 - p * 50;
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [curve]);

  return (
    <div className="space-y-6">
      {/* 1. Target Views Slider */}
      <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Target View Volume</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select total campaign views to dispatch across your scheduled pattern
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1000}
              max={1000000}
              step={500}
              value={metrics.views}
              onChange={(e) => handleViewsChange(Number(e.target.value))}
              className="w-32 bg-slate-50 dark:bg-slate-950 border border-purple-300 dark:border-purple-500/40 rounded-xl px-3 py-1.5 text-right font-mono font-bold text-purple-700 dark:text-purple-300 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
            />
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Views</span>
          </div>
        </div>

        {/* Range Slider */}
        <div className="pt-2">
          <input
            type="range"
            min={1000}
            max={500000}
            step={1000}
            value={metrics.views}
            onChange={(e) => handleViewsChange(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1.5">
            <span>1,000 min</span>
            <span>25,000</span>
            <span>100,000</span>
            <span>250,000</span>
            <span>500,000+ max</span>
          </div>
        </div>

        {/* Quick Views presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Quick Sets:</span>
          {QUICK_VIEWS.map((qty) => (
            <button
              key={qty}
              type="button"
              onClick={() => handleViewsChange(qty)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                metrics.views === qty
                  ? 'bg-purple-600 text-white font-bold shadow-sm shadow-purple-500/30'
                  : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {qty >= 1000 ? `${qty / 1000}k` : qty}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Delivery Timeframe & Speed */}
      <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Delivery Timeframe & Speed</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Set the exact duration over which your views and interactions will organically flow
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1 font-mono text-xs text-slate-700 dark:text-slate-300">
            <span className="text-slate-500 dark:text-slate-400">Pacing:</span>
            <span className="text-cyan-700 dark:text-cyan-300 font-bold">~{Math.round(metrics.views / totalBatchesEstimate)} views / batch</span>
          </div>
        </div>

        {/* Duration Options */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {DURATION_PRESETS.map((p) => {
            const isSelected = durationHours === p.hours;
            return (
              <button
                key={p.hours}
                type="button"
                onClick={() => setDurationHours(p.hours)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-50 dark:bg-purple-600/20 border-purple-500 text-purple-950 dark:text-white shadow-sm dark:shadow-purple-500/10'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-sm text-slate-900 dark:text-white">{p.label}</div>
                <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-purple-600 dark:text-purple-300 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                  {p.sub}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Hours & Speed interval selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">Custom Duration:</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={168}
                value={durationHours}
                onChange={(e) => setDurationHours(Math.max(1, Math.min(168, Number(e.target.value))))}
                className="w-20 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1 text-center font-mono font-bold text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <span className="text-xs text-slate-500 font-mono">Hours</span>
            </div>
          </div>

          {setSpeedInterval && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">Cadence (25–60m gap):</span>
              <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 text-xs font-mono transition-colors">
                {[
                  { id: 'interval_25m', label: '25m' },
                  { id: 'interval_35m', label: '35m' },
                  { id: 'interval_45m', label: '45m' },
                  { id: 'interval_60m', label: '60m' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSpeedInterval(s.id as SpeedInterval)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      speedInterval === s.id
                        ? 'bg-purple-600 text-white font-bold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Target Audience & Geo-Demographics */}
      <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Target Audience & Peak Activity Window</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Aligns delivery timing and curve dynamics to when your target audience is naturally active on social media
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {AUDIENCE_OPTIONS.map((aud) => {
            const isSelected = audienceRegion === aud.id;
            return (
              <button
                key={aud.id}
                type="button"
                onClick={() => setAudienceRegion && setAudienceRegion(aud.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 shadow-sm dark:shadow-emerald-500/10'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{aud.flag}</span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{aud.label}</span>
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono mt-2 font-medium">
                  Peak: {aud.peak}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {aud.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Organic Curve & Pattern */}
      <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
              <span>Algorithmic Curve & Pattern</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select how engagement ramps up to look completely authentic to platform algorithms
            </p>
          </div>

          <span className="text-xs font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30 px-2.5 py-1 rounded-lg font-medium">
            Pattern: {ORGANIC_CURVE_PRESETS.find(p => p.id === curve)?.name || 'Custom Pattern'}
          </span>
        </div>

        {/* 4 Preset Pattern Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ORGANIC_CURVE_PRESETS.map((preset) => {
            const isSelected = curve === preset.id;
            const Icon = preset.icon;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectCurve(preset.id)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-500 shadow-sm dark:shadow-purple-500/10'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{preset.name}</h4>
                      <p className="text-[10px] text-purple-600 dark:text-purple-300 font-mono mt-0.2 font-medium">{preset.tagline}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
                  {preset.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Live Mini Curve Visualizer Preview */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 transition-colors">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400 animate-pulse"></span>
              <span>Organic Delivery Flow Visualizer ({durationHours}h)</span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Total {totalBatchesEstimate} Batches · {intervalMins}m Interval
            </span>
          </div>

          <div className="h-20 w-full relative flex items-center">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 70" preserveAspectRatio="none">
              <defs>
                <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d={`${miniCurvePath} L 290 68 L 10 68 Z`}
                fill="url(#curveGradient)"
              />
              <path
                d={miniCurvePath}
                fill="none"
                stroke="#9333ea"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-900">
            <span>Hour 0 (Warmup)</span>
            <span>Hour {Math.round(durationHours / 2)} (Peak Activity)</span>
            <span>Hour {durationHours} (Natural Finish)</span>
          </div>
        </div>
      </div>

      {/* 5. Synchronized Engagement Ratios */}
      <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Synchronized Natural Engagement Ratios</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Organic ratio guardrails: Likes 2–6% (~4.0%), Comments ~0.12%, Shares 0.6–2.2%, Saves 0.8–2.5%
            </p>
          </div>

          <button
            type="button"
            onClick={handleAutoLockGuardrails}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-Lock Golden Ratios</span>
          </button>
        </div>

        {/* Ratio Preset Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {(['organic', 'viral_breakout', 'stealth_drip'] as const).map((presetKey) => {
            const cfg = RATIO_PRESET_CONFIGS[presetKey];
            return (
              <button
                key={presetKey}
                type="button"
                onClick={() => setMetrics(computeMetricsFromRatioPreset(metrics.views, presetKey))}
                className="p-3 rounded-xl border text-left transition-all cursor-pointer bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500/50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">{cfg.name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                    {cfg.badge}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  {cfg.tagline}
                </div>
                <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 mt-2 font-medium">
                  {cfg.likesPct}% Likes • {cfg.sharesPct}% Shares • {cfg.savesPct}% Saves
                </div>
              </button>
            );
          })}
        </div>

        {/* Metric Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Likes */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                <span>Likes</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20">
                {((metrics.likes / metrics.views) * 100).toFixed(2)}%
              </span>
            </div>
            <input
              type="number"
              min={5}
              value={metrics.likes}
              onChange={(e) => setMetrics({ ...metrics, likes: Number(e.target.value) })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 transition-colors"
            />
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Target: 2.0%–6.0% (~4%)
            </div>
          </div>

          {/* Comments */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Comments</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20">
                {((metrics.comments / metrics.views) * 100).toFixed(3)}%
              </span>
            </div>
            <input
              type="number"
              min={1}
              value={metrics.comments}
              onChange={(e) => setMetrics({ ...metrics, comments: Number(e.target.value) })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Target: 0.05%–0.30%
            </div>
          </div>

          {/* Shares */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Shares</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
                {((metrics.shares / metrics.views) * 100).toFixed(2)}%
              </span>
            </div>
            <input
              type="number"
              min={1}
              value={metrics.shares}
              onChange={(e) => setMetrics({ ...metrics, shares: Number(e.target.value) })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Target: 0.6%–2.2% (~1.2%)
            </div>
          </div>

          {/* Saves */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Saves</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20">
                {((metrics.saves / metrics.views) * 100).toFixed(2)}%
              </span>
            </div>
            <input
              type="number"
              min={1}
              value={metrics.saves}
              onChange={(e) => setMetrics({ ...metrics, saves: Number(e.target.value) })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Target: 0.8%–2.5% (~1.5%)
            </div>
          </div>

          {/* Reposts */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Reposts</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20">
                {((metrics.reposts / metrics.views) * 100).toFixed(2)}%
              </span>
            </div>
            <input
              type="number"
              min={1}
              value={metrics.reposts}
              onChange={(e) => setMetrics({ ...metrics, reposts: Number(e.target.value) })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Target: 0.1%–0.6% (~0.35%)
            </div>
          </div>
        </div>

        {/* Guardrail compliance warnings */}
        <div className="space-y-2">
          {ratioEvaluations.map((item) => (
            <div
              key={item.metric}
              className={`text-xs px-3 py-2 rounded-xl flex items-center justify-between ${
                item.isCompliant
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {item.isCompliant ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
                <span>
                  <strong>{item.metric.toUpperCase()}</strong>: {item.currentPercent}% of views.
                  {' '}
                  {item.warning || `Compliant with organic guardrail (${item.minPercent}% - ${item.maxPercent}%).`}
                </span>
              </div>

              {!item.isCompliant && (
                <button
                  type="button"
                  onClick={() => setMetrics(prev => ({ ...prev, [item.metric]: item.recommendedValue }))}
                  className="px-2.5 py-0.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-500/30 rounded-lg text-[11px] font-mono shrink-0 cursor-pointer"
                >
                  Snap to {item.recommendedValue}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 6. AI Comments & Niche Customization */}
      <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>AI Comments & Niche Customization</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Generates genuine, organic comments matching the post content and slang
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateComments}
              disabled={isGeneratingAi}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAi ? 'Generating...' : 'Generate with AI'}</span>
            </button>

            <button
              type="button"
              onClick={() => setGeneratedComments(getRandomPresetComments(commentNiche, 12))}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all cursor-pointer"
            >
              Load Presets
            </button>
          </div>
        </div>

        {/* Niche & Tone selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1.5">
              Content Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {NICHES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setCommentNiche(n);
                    setGeneratedComments(getRandomPresetComments(n, 10));
                  }}
                  className={`px-2.5 py-2 rounded-xl text-xs font-medium text-left truncate transition-all cursor-pointer ${
                    commentNiche === n
                      ? 'bg-purple-50 dark:bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500 font-bold'
                      : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1.5">
                Vibe & Tone
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Casual & Organic', 'Hype & Fire', 'Relatable', 'Question-based'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCommentTone(t)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-medium text-left transition-all cursor-pointer ${
                      commentTone === t
                        ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick add custom comment */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1.5">
                Add Custom Comment
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="e.g. this edit is insane 🔥"
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comment Pool Preview List */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-mono">
            <span>Comment Queue ({generatedComments.length} ready):</span>
            <span className="text-purple-600 dark:text-purple-400 text-[11px]">Dispatched smoothly across engagement batches</span>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {generatedComments.map((comment, idx) => (
              <div
                key={idx}
                className="group flex items-center justify-between bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="font-mono text-[10px] text-slate-400 dark:text-slate-600">#{idx + 1}</span>
                  <span className="truncate">{comment}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveComment(idx)}
                  className="text-slate-400 hover:text-rose-500 opacity-60 group-hover:opacity-100 transition-all p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
