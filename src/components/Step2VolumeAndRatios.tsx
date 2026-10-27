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
  Check,
  Dices,
  Layers,
  Edit3,
  Shuffle,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  ArrowUpDown
} from 'lucide-react';
import { 
  CampaignMetrics, 
  CommentNiche, 
  AlgorithmicCurve, 
  AudienceRegion, 
  SpeedInterval,
  CurvePoint,
  BulkUrlItem,
  BulkRangeSettings,
  FleetSequenceOrder
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
  cadenceRange?: { minMins: number; maxMins: number };
  setCadenceRange?: (r: { minMins: number; maxMins: number }) => void;
  curvePoints?: CurvePoint[];
  setCurvePoints?: React.Dispatch<React.SetStateAction<CurvePoint[]>>;
  // Bulk URLs Props
  isBulkMode?: boolean;
  bulkUrls?: BulkUrlItem[];
  setBulkUrls?: React.Dispatch<React.SetStateAction<BulkUrlItem[]>>;
  bulkRangeSettings?: BulkRangeSettings;
  setBulkRangeSettings?: React.Dispatch<React.SetStateAction<BulkRangeSettings>>;
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
  speedInterval = 'interval_20_35m',
  setSpeedInterval,
  cadenceRange = { minMins: 20, maxMins: 35 },
  setCadenceRange,
  curvePoints,
  setCurvePoints,
  isBulkMode = false,
  bulkUrls = [],
  setBulkUrls,
  bulkRangeSettings,
  setBulkRangeSettings,
}) => {
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentTone, setCommentTone] = useState<'Casual & Organic' | 'Hype & Fire' | 'Relatable' | 'Question-based'>('Casual & Organic');
  const [isShuffling, setIsShuffling] = useState(false);
  const [activeMetricTab, setActiveMetricTab] = useState<'likes' | 'comments' | 'shares' | 'saves' | 'reposts'>('likes');

  const defaultRange: BulkRangeSettings = useMemo(() => ({
    mode: 'random_range',
    sequenceOrder: 'descending',
    viewsMin: 1000,
    viewsMax: 5000,
    fixedViews: 5000,
    // Likes
    likesMode: 'auto_golden',
    likesMin: 80,
    likesMax: 350,
    fixedLikes: 280,
    // Comments
    commentsMode: 'auto_golden',
    commentsMin: 5,
    commentsMax: 30,
    fixedComments: 12,
    // Shares
    sharesMode: 'auto_golden',
    sharesMin: 10,
    sharesMax: 80,
    fixedShares: 35,
    // Saves
    savesMode: 'auto_golden',
    savesMin: 5,
    savesMax: 50,
    fixedSaves: 20,
    // Reposts
    repostsMode: 'auto_golden',
    repostsMin: 2,
    repostsMax: 30,
    fixedReposts: 10,
  }), []);

  const activeRange = bulkRangeSettings || defaultRange;

  // Re-roll random view and engagement distribution for bulk URLs
  const handleRerollBulk = (overrides?: Partial<BulkRangeSettings>) => {
    if (!setBulkUrls) return;
    setIsShuffling(true);
    setTimeout(() => setIsShuffling(false), 300);

    const merged: BulkRangeSettings = { ...activeRange, ...(overrides || {}) };
    if (setBulkRangeSettings && overrides) {
      setBulkRangeSettings(prev => ({ ...prev, ...overrides }));
    }

    setBulkUrls(prev => {
      const count = prev.length;
      if (count === 0) return prev;

      // 1. Generate Views Array
      const viewsList: number[] = [];
      if (merged.mode === 'fixed') {
        const fixedV = merged.fixedViews || 5000;
        for (let i = 0; i < count; i++) viewsList.push(fixedV);
      } else {
        const minV = Math.max(100, merged.viewsMin || 1000);
        const maxV = Math.max(minV, merged.viewsMax || 5000);
        const step = maxV > 50000 ? 500 : maxV > 10000 ? 250 : 50;

        for (let i = 0; i < count; i++) {
          const raw = Math.random() * (maxV - minV) + minV;
          const rounded = Math.round(raw / step) * step;
          viewsList.push(Math.max(minV, Math.min(maxV, rounded)));
        }

        // Apply Sequence Ordering
        if (merged.sequenceOrder === 'descending' || !merged.sequenceOrder) {
          viewsList.sort((a, b) => b - a); // Higher to lower sequentially
        } else if (merged.sequenceOrder === 'ascending') {
          viewsList.sort((a, b) => a - b); // Lower to higher sequentially
        }
      }

      // 2. Generate Likes Array
      const likesList: number[] = [];
      if (merged.likesMode === 'random_range') {
        const minL = Math.max(5, merged.likesMin || 50);
        const maxL = Math.max(minL, merged.likesMax || 350);
        for (let i = 0; i < count; i++) {
          likesList.push(Math.round(Math.random() * (maxL - minL) + minL));
        }
        if (merged.sequenceOrder === 'descending' || !merged.sequenceOrder) {
          likesList.sort((a, b) => b - a);
        } else if (merged.sequenceOrder === 'ascending') {
          likesList.sort((a, b) => a - b);
        }
      }

      // 3. Generate Comments Array
      const commentsList: number[] = [];
      if (merged.commentsMode === 'random_range') {
        const minC = Math.max(0, merged.commentsMin || 2);
        const maxC = Math.max(minC, merged.commentsMax || 30);
        for (let i = 0; i < count; i++) {
          commentsList.push(Math.round(Math.random() * (maxC - minC) + minC));
        }
        if (merged.sequenceOrder === 'descending' || !merged.sequenceOrder) {
          commentsList.sort((a, b) => b - a);
        } else if (merged.sequenceOrder === 'ascending') {
          commentsList.sort((a, b) => a - b);
        }
      }

      // 4. Generate Shares Array
      const sharesList: number[] = [];
      if (merged.sharesMode === 'random_range') {
        const minS = Math.max(0, merged.sharesMin || 5);
        const maxS = Math.max(minS, merged.sharesMax || 80);
        for (let i = 0; i < count; i++) {
          sharesList.push(Math.round(Math.random() * (maxS - minS) + minS));
        }
        if (merged.sequenceOrder === 'descending' || !merged.sequenceOrder) {
          sharesList.sort((a, b) => b - a);
        } else if (merged.sequenceOrder === 'ascending') {
          sharesList.sort((a, b) => a - b);
        }
      }

      // 5. Generate Saves Array
      const savesList: number[] = [];
      if (merged.savesMode === 'random_range') {
        const minSv = Math.max(0, merged.savesMin || 5);
        const maxSv = Math.max(minSv, merged.savesMax || 50);
        for (let i = 0; i < count; i++) {
          savesList.push(Math.round(Math.random() * (maxSv - minSv) + minSv));
        }
        if (merged.sequenceOrder === 'descending' || !merged.sequenceOrder) {
          savesList.sort((a, b) => b - a);
        } else if (merged.sequenceOrder === 'ascending') {
          savesList.sort((a, b) => a - b);
        }
      }

      // 6. Generate Reposts Array
      const repostsList: number[] = [];
      if (merged.repostsMode === 'random_range') {
        const minR = Math.max(0, merged.repostsMin || 1);
        const maxR = Math.max(minR, merged.repostsMax || 30);
        for (let i = 0; i < count; i++) {
          repostsList.push(Math.round(Math.random() * (maxR - minR) + minR));
        }
        if (merged.sequenceOrder === 'descending' || !merged.sequenceOrder) {
          repostsList.sort((a, b) => b - a);
        } else if (merged.sequenceOrder === 'ascending') {
          repostsList.sort((a, b) => a - b);
        }
      }

      // Map back to bulk items
      return prev.map((item, idx) => {
        const views = viewsList[idx] || 5000;
        const golden = computeGoldenRatioMetrics(views);

        const likes = merged.likesMode === 'auto_golden'
          ? golden.likes
          : merged.likesMode === 'random_range'
          ? (likesList[idx] !== undefined ? likesList[idx] : golden.likes)
          : (merged.fixedLikes !== undefined ? merged.fixedLikes : golden.likes);

        const comments = merged.commentsMode === 'auto_golden'
          ? golden.comments
          : merged.commentsMode === 'random_range'
          ? (commentsList[idx] !== undefined ? commentsList[idx] : golden.comments)
          : (merged.fixedComments !== undefined ? merged.fixedComments : golden.comments);

        const shares = merged.sharesMode === 'auto_golden'
          ? golden.shares
          : merged.sharesMode === 'random_range'
          ? (sharesList[idx] !== undefined ? sharesList[idx] : golden.shares)
          : (merged.fixedShares !== undefined ? merged.fixedShares : golden.shares);

        const saves = merged.savesMode === 'auto_golden'
          ? golden.saves
          : merged.savesMode === 'random_range'
          ? (savesList[idx] !== undefined ? savesList[idx] : golden.saves)
          : (merged.fixedSaves !== undefined ? merged.fixedSaves : golden.saves);

        const reposts = merged.repostsMode === 'auto_golden'
          ? golden.reposts
          : merged.repostsMode === 'random_range'
          ? (repostsList[idx] !== undefined ? repostsList[idx] : golden.reposts)
          : (merged.fixedReposts !== undefined ? merged.fixedReposts : golden.reposts);

        return {
          ...item,
          assignedMetrics: {
            views,
            likes,
            comments,
            shares,
            saves,
            reposts,
          }
        };
      });
    });
  };

  // Direct reel array ordering (arrange reels by views high-to-low, low-to-high, or shuffle)
  const handleArrangeReels = (direction: 'descending' | 'ascending' | 'shuffle') => {
    if (!setBulkUrls) return;
    setIsShuffling(true);
    setTimeout(() => setIsShuffling(false), 250);

    setBulkUrls(prev => {
      const copy = [...prev];
      if (direction === 'descending') {
        copy.sort((a, b) => (b.assignedMetrics?.views || 0) - (a.assignedMetrics?.views || 0));
      } else if (direction === 'ascending') {
        copy.sort((a, b) => (a.assignedMetrics?.views || 0) - (b.assignedMetrics?.views || 0));
      } else if (direction === 'shuffle') {
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
      }
      return copy;
    });
  };

  // Fleet Totals
  const fleetTotalViews = useMemo(() => {
    return bulkUrls.reduce((sum, u) => sum + (u.assignedMetrics?.views || 0), 0);
  }, [bulkUrls]);

  const fleetTotalLikes = useMemo(() => {
    return bulkUrls.reduce((sum, u) => sum + (u.assignedMetrics?.likes || 0), 0);
  }, [bulkUrls]);

  const fleetTotalComments = useMemo(() => {
    return bulkUrls.reduce((sum, u) => sum + (u.assignedMetrics?.comments || 0), 0);
  }, [bulkUrls]);

  const fleetTotalShares = useMemo(() => {
    return bulkUrls.reduce((sum, u) => sum + (u.assignedMetrics?.shares || 0), 0);
  }, [bulkUrls]);

  const fleetTotalSaves = useMemo(() => {
    return bulkUrls.reduce((sum, u) => sum + (u.assignedMetrics?.saves || 0), 0);
  }, [bulkUrls]);

  const fleetTotalReposts = useMemo(() => {
    return bulkUrls.reduce((sum, u) => sum + (u.assignedMetrics?.reposts || 0), 0);
  }, [bulkUrls]);

  // Inline editing of single bulk item metrics
  const handleUpdateItemMetric = (itemId: string, key: keyof CampaignMetrics, val: number) => {
    if (!setBulkUrls) return;
    const safeV = Math.max(0, val);
    setBulkUrls(prev => prev.map(item => {
      if (item.id === itemId) {
        const cur = item.assignedMetrics || computeGoldenRatioMetrics(5000);
        return {
          ...item,
          assignedMetrics: {
            ...cur,
            [key]: safeV
          }
        };
      }
      return item;
    }));
  };

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
      {/* 1. Target Views Slider (Single Mode) OR Bulk Volume & Random Range Matrix (Bulk Mode) */}
      {isBulkMode ? (
        <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-5 transition-colors">
          {/* Header & Mode Switcher */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold uppercase">
                  Bulk Fleet Volume Engine
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {bulkUrls.length} Reels Loaded
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Reel Fleet View Allocation</span>
              </h3>
            </div>

            {/* Distribution Mode Switch */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  if (setBulkRangeSettings) {
                    setBulkRangeSettings(prev => ({ ...prev, mode: 'random_range' }));
                  }
                  handleRerollBulk({ mode: 'random_range' });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                  activeRange.mode === 'random_range'
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Random Range</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (setBulkRangeSettings) {
                    setBulkRangeSettings(prev => ({ ...prev, mode: 'fixed' }));
                  }
                  handleRerollBulk({ mode: 'fixed' });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                  activeRange.mode === 'fixed'
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Fixed Equal</span>
              </button>
            </div>
          </div>

          {/* Random Range Controls */}
          {activeRange.mode === 'random_range' ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Each reel automatically receives randomized views within your range (e.g. 1k – 5k gives Reel #1 4,000 views, Reel #2 4,500 views, etc.).
                </p>

                {/* Shuffle / Re-Roll Button */}
                <button
                  type="button"
                  onClick={() => handleRerollBulk()}
                  disabled={isShuffling}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-mono font-bold text-xs shadow-md shadow-purple-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <Shuffle className={`w-3.5 h-3.5 ${isShuffling ? 'animate-spin' : ''}`} />
                  <span>Re-roll Random Values</span>
                </button>
              </div>

              {/* Reel Sequence Ordering Selector (High-to-Low, Pure Random, Low-to-High) */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <ArrowDownNarrowWide className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Reel Sequence Order Flow</span>
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Assign random values sequentially from upper limit to lower limit or vice versa
                    </p>
                  </div>

                  {/* Mode Buttons */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (setBulkRangeSettings) setBulkRangeSettings(prev => ({ ...prev, sequenceOrder: 'descending' }));
                        handleRerollBulk({ sequenceOrder: 'descending' });
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all cursor-pointer font-bold ${
                        (activeRange.sequenceOrder || 'descending') === 'descending'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Starts with big/highest views at Reel #1 and cascades down to lower views"
                    >
                      <ArrowDownNarrowWide className="w-3.5 h-3.5" />
                      <span>High → Low (Cascade)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (setBulkRangeSettings) setBulkRangeSettings(prev => ({ ...prev, sequenceOrder: 'random' }));
                        handleRerollBulk({ sequenceOrder: 'random' });
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all cursor-pointer font-bold ${
                        activeRange.sequenceOrder === 'random'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Unordered random values across all reels"
                    >
                      <Dices className="w-3.5 h-3.5" />
                      <span>Pure Random</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (setBulkRangeSettings) setBulkRangeSettings(prev => ({ ...prev, sequenceOrder: 'ascending' }));
                        handleRerollBulk({ sequenceOrder: 'ascending' });
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all cursor-pointer font-bold ${
                        activeRange.sequenceOrder === 'ascending'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Starts with lower views at Reel #1 up to higher views"
                    >
                      <ArrowUpNarrowWide className="w-3.5 h-3.5" />
                      <span>Low → High (Ramp)</span>
                    </button>
                  </div>
                </div>

                {/* Dynamic Status / Indicator Message */}
                {(activeRange.sequenceOrder || 'descending') === 'descending' && (
                  <div className="text-[11px] text-purple-700 dark:text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20 flex items-center justify-between">
                    <span>
                      📉 <strong>Descending Cascade Active:</strong> Reel #1 starts with higher random views (~{activeRange.viewsMax.toLocaleString()}), and subsequent reels cascade down sequentially toward lower limit (~{activeRange.viewsMin.toLocaleString()}). Likes & engagements follow the same cascade.
                    </span>
                    <span className="shrink-0 text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 ml-2">
                      Sequenced
                    </span>
                  </div>
                )}
                {activeRange.sequenceOrder === 'ascending' && (
                  <div className="text-[11px] text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20 flex items-center justify-between">
                    <span>
                      📈 <strong>Ascending Ramp Active:</strong> Reel #1 starts with lower views (~{activeRange.viewsMin.toLocaleString()}) and ascends to higher views (~{activeRange.viewsMax.toLocaleString()}) for later reels.
                    </span>
                    <span className="shrink-0 text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 ml-2">
                      Sequenced
                    </span>
                  </div>
                )}
              </div>

              {/* Min & Max Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Minimum Views per Reel
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={100}
                      max={900000}
                      step={500}
                      value={activeRange.viewsMin}
                      onChange={(e) => {
                        const val = Math.max(100, Number(e.target.value) || 100);
                        if (setBulkRangeSettings) {
                          setBulkRangeSettings(prev => ({ ...prev, viewsMin: val }));
                        }
                        handleRerollBulk({ viewsMin: val });
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-xs text-slate-400">Views</span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Maximum Views per Reel
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={500}
                      max={1000000}
                      step={1000}
                      value={activeRange.viewsMax}
                      onChange={(e) => {
                        const val = Math.max(activeRange.viewsMin, Number(e.target.value) || 1000);
                        if (setBulkRangeSettings) {
                          setBulkRangeSettings(prev => ({ ...prev, viewsMax: val }));
                        }
                        handleRerollBulk({ viewsMax: val });
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-xs text-slate-400">Views</span>
                  </div>
                </div>
              </div>

              {/* Quick Range Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-1 font-mono">
                <span className="text-xs text-slate-500 dark:text-slate-400">Quick Ranges:</span>
                {[
                  { label: '1k – 5k', min: 1000, max: 5000 },
                  { label: '2k – 10k', min: 2000, max: 10000 },
                  { label: '5k – 25k', min: 5000, max: 25000 },
                  { label: '10k – 50k', min: 10000, max: 50000 },
                  { label: '25k – 100k', min: 25000, max: 100000 },
                  { label: '100k – 1M', min: 100000, max: 1000000 },
                ].map(p => {
                  const isActive = activeRange.viewsMin === p.min && activeRange.viewsMax === p.max;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        if (setBulkRangeSettings) {
                          setBulkRangeSettings(prev => ({ ...prev, viewsMin: p.min, viewsMax: p.max }));
                        }
                        handleRerollBulk({ viewsMin: p.min, viewsMax: p.max });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-purple-600 text-white font-bold shadow-sm shadow-purple-500/30'
                          : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Fixed Volume Controls */
            <div className="space-y-3 font-mono">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                All reels in the fleet will receive the exact same volume target.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1000}
                  max={1000000}
                  step={500}
                  value={activeRange.fixedViews}
                  onChange={(e) => {
                    const val = Math.max(100, Number(e.target.value) || 100);
                    if (setBulkRangeSettings) {
                      setBulkRangeSettings(prev => ({ ...prev, fixedViews: val }));
                    }
                    handleRerollBulk({ fixedViews: val, mode: 'fixed' });
                  }}
                  className="w-40 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-bold"
                />
                <span className="text-xs text-slate-500">Views per Reel</span>
              </div>
            </div>
          )}

          {/* 2. Engagement Metrics Distribution Engine (Likes, Comments, Shares, Saves, Reposts) */}
          <div className="border-t border-slate-200 dark:border-slate-800/80 pt-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-mono">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  <span>Engagement Distribution (Likes, Comments, Shares, Saves, Reposts)</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Set individual random ranges or fixed quantities for every engagement interaction type across the fleet.
                </p>
              </div>

              {/* Global Quick Action Buttons */}
              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => {
                    handleRerollBulk({
                      likesMode: 'auto_golden',
                      commentsMode: 'auto_golden',
                      sharesMode: 'auto_golden',
                      savesMode: 'auto_golden',
                      repostsMode: 'auto_golden',
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-[11px] transition-colors cursor-pointer"
                  title="Recalculate all engagement metrics using organic golden ratio proportional to each reel's views"
                >
                  ✨ All Auto-Golden
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleRerollBulk({
                      likesMode: 'random_range',
                      commentsMode: 'random_range',
                      sharesMode: 'random_range',
                      savesMode: 'random_range',
                      repostsMode: 'random_range',
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300 hover:bg-pink-100 text-[11px] transition-colors cursor-pointer"
                  title="Randomize all engagement interactions across reels"
                >
                  🎲 All Random Range
                </button>
              </div>
            </div>

            {/* Metric Selector Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-none">
              {[
                { id: 'likes' as const, label: 'Likes', icon: Heart, color: 'text-pink-500', mode: activeRange.likesMode },
                { id: 'comments' as const, label: 'Comments', icon: MessageSquare, color: 'text-cyan-500', mode: activeRange.commentsMode },
                { id: 'shares' as const, label: 'Shares', icon: Share2, color: 'text-emerald-500', mode: activeRange.sharesMode },
                { id: 'saves' as const, label: 'Saves', icon: Bookmark, color: 'text-amber-500', mode: activeRange.savesMode },
                { id: 'reposts' as const, label: 'Reposts', icon: Repeat, color: 'text-purple-500', mode: activeRange.repostsMode },
              ].map(m => {
                const Icon = m.icon;
                const isSelected = activeMetricTab === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveMetricTab(m.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer border ${
                      isSelected
                        ? 'bg-purple-600 text-white font-bold border-purple-500 shadow-sm shadow-purple-500/20'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : m.color}`} />
                    <span>{m.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {m.mode === 'auto_golden' ? 'Golden' : m.mode === 'random_range' ? 'Random' : 'Fixed'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Metric Configuration Card */}
            <div className="bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3 font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase flex items-center gap-2">
                  <span className="capitalize">{activeMetricTab} Configuration</span>
                  {activeMetricTab === 'likes' && (
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-normal">
                      (Micro 5-9 & Macro 10+ smart-split compatible)
                    </span>
                  )}
                </div>

                {/* Mode Selector for Current Metric */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
                  {(['auto_golden', 'random_range', 'fixed'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        const key = `${activeMetricTab}Mode` as keyof BulkRangeSettings;
                        handleRerollBulk({ [key]: mode });
                      }}
                      className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                        (activeRange as any)[`${activeMetricTab}Mode`] === mode
                          ? 'bg-purple-600 text-white font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {mode === 'auto_golden' ? 'Auto Golden' : mode === 'random_range' ? 'Random Range' : 'Fixed Equal'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Specific Inputs */}
              {(activeRange as any)[`${activeMetricTab}Mode`] === 'auto_golden' && (
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-800 dark:text-purple-300">
                  ⚡ <strong>Auto Golden Ratio Active:</strong> {activeMetricTab} are automatically scaled organically per reel based on each reel's randomized view volume (maintaining human-like organic variance).
                </div>
              )}

              {(activeRange as any)[`${activeMetricTab}Mode`] === 'random_range' && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                        Minimum {activeMetricTab} per Reel
                      </label>
                      <input
                        type="number"
                        min={activeMetricTab === 'likes' ? 5 : 0}
                        value={(activeRange as any)[`${activeMetricTab}Min`]}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          const minKey = `${activeMetricTab}Min` as keyof BulkRangeSettings;
                          handleRerollBulk({ [minKey]: val });
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                        Maximum {activeMetricTab} per Reel
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={(activeRange as any)[`${activeMetricTab}Max`]}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value) || 1);
                          const maxKey = `${activeMetricTab}Max` as keyof BulkRangeSettings;
                          handleRerollBulk({ [maxKey]: val });
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Metric Quick Preset Pills */}
                  {activeMetricTab === 'likes' && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      <span className="text-slate-400">Quick Sets:</span>
                      {[
                        { label: '50 – 200', min: 50, max: 200 },
                        { label: '100 – 400', min: 100, max: 400 },
                        { label: '250 – 800', min: 250, max: 800 },
                        { label: '500 – 2,000', min: 500, max: 2000 },
                      ].map(p => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => handleRerollBulk({ likesMin: p.min, likesMax: p.max, likesMode: 'random_range' })}
                          className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 text-slate-600 dark:text-slate-300"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeMetricTab === 'comments' && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      <span className="text-slate-400">Quick Sets:</span>
                      {[
                        { label: '5 – 25', min: 5, max: 25 },
                        { label: '10 – 50', min: 10, max: 50 },
                        { label: '25 – 100', min: 25, max: 100 },
                      ].map(p => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => handleRerollBulk({ commentsMin: p.min, commentsMax: p.max, commentsMode: 'random_range' })}
                          className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 text-slate-600 dark:text-slate-300"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeMetricTab === 'shares' && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      <span className="text-slate-400">Quick Sets:</span>
                      {[
                        { label: '10 – 50', min: 10, max: 50 },
                        { label: '25 – 100', min: 25, max: 100 },
                        { label: '50 – 250', min: 50, max: 250 },
                      ].map(p => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => handleRerollBulk({ sharesMin: p.min, sharesMax: p.max, sharesMode: 'random_range' })}
                          className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 text-slate-600 dark:text-slate-300"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeMetricTab === 'saves' && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      <span className="text-slate-400">Quick Sets:</span>
                      {[
                        { label: '5 – 25', min: 5, max: 25 },
                        { label: '10 – 50', min: 10, max: 50 },
                        { label: '25 – 100', min: 25, max: 100 },
                      ].map(p => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => handleRerollBulk({ savesMin: p.min, savesMax: p.max, savesMode: 'random_range' })}
                          className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 text-slate-600 dark:text-slate-300"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeMetricTab === 'reposts' && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      <span className="text-slate-400">Quick Sets:</span>
                      {[
                        { label: '2 – 15', min: 2, max: 15 },
                        { label: '5 – 30', min: 5, max: 30 },
                        { label: '10 – 50', min: 10, max: 50 },
                      ].map(p => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => handleRerollBulk({ repostsMin: p.min, repostsMax: p.max, repostsMode: 'random_range' })}
                          className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 text-slate-600 dark:text-slate-300"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(activeRange as any)[`${activeMetricTab}Mode`] === 'fixed' && (
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="number"
                    min={0}
                    value={(activeRange as any)[`${activeMetricTab}Fixed`] ?? (activeRange as any)[`fixed${activeMetricTab.charAt(0).toUpperCase() + activeMetricTab.slice(1)}`]}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value) || 0);
                      const fixKey = `fixed${activeMetricTab.charAt(0).toUpperCase() + activeMetricTab.slice(1)}` as keyof BulkRangeSettings;
                      handleRerollBulk({ [fixKey]: val });
                    }}
                    className="w-36 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white font-bold text-xs"
                  />
                  <span className="text-xs text-slate-500">Fixed {activeMetricTab} per Reel</span>
                </div>
              )}
            </div>
          </div>

          {/* Fleet Aggregate Metric Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 p-3.5 rounded-xl font-mono text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Total Fleet Views</span>
              <span className="text-purple-700 dark:text-purple-300 font-bold text-sm">
                {fleetTotalViews.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Total Fleet Likes</span>
              <span className="text-pink-600 dark:text-pink-400 font-bold text-sm">
                {fleetTotalLikes.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Total Comments</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-bold text-sm">
                {fleetTotalComments.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Total Shares</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                {fleetTotalShares.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Total Saves</span>
              <span className="text-amber-500 dark:text-amber-400 font-bold text-sm">
                {fleetTotalSaves.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Avg Views / Reel</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold text-sm">
                {bulkUrls.length > 0 ? Math.round(fleetTotalViews / bulkUrls.length).toLocaleString() : 0}
              </span>
            </div>
          </div>

          {/* Detailed Reel Allocation Table with Full In-Line Edit for All Metrics */}
          {bulkUrls.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span>Per-Reel Allocation Preview ({bulkUrls.length} Reels):</span>
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 hidden md:inline">
                    (Direct cell editable)
                  </span>
                </div>

                {/* Instant Arrange / Sort Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] text-slate-400">Arrange:</span>
                  <button
                    type="button"
                    onClick={() => handleArrangeReels('descending')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 text-slate-700 dark:text-slate-300 font-bold text-[11px] cursor-pointer shadow-xs hover:text-purple-600 transition-colors"
                    title="Arrange all reels by views from highest to lowest"
                  >
                    <ArrowDownNarrowWide className="w-3.5 h-3.5 text-purple-500" />
                    <span>High → Low</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArrangeReels('ascending')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 text-slate-700 dark:text-slate-300 text-[11px] cursor-pointer shadow-xs hover:text-cyan-600 transition-colors"
                    title="Arrange all reels by views from lowest to highest"
                  >
                    <ArrowUpNarrowWide className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Low → High</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArrangeReels('shuffle')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 text-slate-700 dark:text-slate-300 text-[11px] cursor-pointer shadow-xs hover:text-pink-600 transition-colors"
                    title="Shuffle reel order"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-pink-500" />
                    <span>Shuffle</span>
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/60 p-2 space-y-1.5 scrollbar-thin">
                {bulkUrls.map((item, idx) => {
                  const m = item.assignedMetrics || computeGoldenRatioMetrics(5000);
                  const isTop = idx === 0 && bulkUrls.length > 1;
                  const isSecond = idx === 1 && bulkUrls.length > 2;
                  const isLast = idx === bulkUrls.length - 1 && bulkUrls.length > 2;
                  return (
                    <div
                      key={item.id || idx}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/60 text-xs font-mono space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-6 text-center text-slate-400 font-bold">#{idx + 1}</span>
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold shrink-0">
                            {item.handle}
                          </span>
                          {isTop && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold shrink-0">
                              🔥 #1 Highest
                            </span>
                          )}
                          {isSecond && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-bold shrink-0">
                              ⚡ #2 High
                            </span>
                          )}
                          {isLast && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-bold shrink-0">
                              🌱 Base Drip
                            </span>
                          )}
                          <span className="text-slate-500 dark:text-slate-400 truncate text-[11px]">
                            {item.cleanUrl}
                          </span>
                        </div>
                      </div>

                      {/* Direct Editable Cells for All 6 Metrics */}
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[11px]">
                        {/* Views */}
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-purple-200/50 dark:border-purple-800/40">
                          <span className="text-slate-400 text-[10px]">👁️</span>
                          <input
                            type="number"
                            min={100}
                            step={100}
                            value={m.views}
                            onChange={(e) => handleUpdateItemMetric(item.id, 'views', Number(e.target.value))}
                            className="w-full bg-transparent text-right font-bold text-purple-700 dark:text-purple-300 focus:outline-none"
                            title="Direct edit views"
                          />
                        </div>

                        {/* Likes */}
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-pink-200/50 dark:border-pink-800/40">
                          <span className="text-slate-400 text-[10px]">❤️</span>
                          <input
                            type="number"
                            min={0}
                            value={m.likes}
                            onChange={(e) => handleUpdateItemMetric(item.id, 'likes', Number(e.target.value))}
                            className="w-full bg-transparent text-right font-bold text-pink-600 dark:text-pink-400 focus:outline-none"
                            title="Direct edit likes"
                          />
                        </div>

                        {/* Comments */}
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-cyan-200/50 dark:border-cyan-800/40">
                          <span className="text-slate-400 text-[10px]">💬</span>
                          <input
                            type="number"
                            min={0}
                            value={m.comments}
                            onChange={(e) => handleUpdateItemMetric(item.id, 'comments', Number(e.target.value))}
                            className="w-full bg-transparent text-right font-bold text-cyan-600 dark:text-cyan-400 focus:outline-none"
                            title="Direct edit comments"
                          />
                        </div>

                        {/* Shares */}
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-emerald-200/50 dark:border-emerald-800/40">
                          <span className="text-slate-400 text-[10px]">↗️</span>
                          <input
                            type="number"
                            min={0}
                            value={m.shares}
                            onChange={(e) => handleUpdateItemMetric(item.id, 'shares', Number(e.target.value))}
                            className="w-full bg-transparent text-right font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none"
                            title="Direct edit shares"
                          />
                        </div>

                        {/* Saves */}
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-amber-200/50 dark:border-amber-800/40">
                          <span className="text-slate-400 text-[10px]">🔖</span>
                          <input
                            type="number"
                            min={0}
                            value={m.saves}
                            onChange={(e) => handleUpdateItemMetric(item.id, 'saves', Number(e.target.value))}
                            className="w-full bg-transparent text-right font-bold text-amber-600 dark:text-amber-400 focus:outline-none"
                            title="Direct edit saves"
                          />
                        </div>

                        {/* Reposts */}
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
                          <span className="text-slate-400 text-[10px]">🔁</span>
                          <input
                            type="number"
                            min={0}
                            value={m.reposts}
                            onChange={(e) => handleUpdateItemMetric(item.id, 'reposts', Number(e.target.value))}
                            className="w-full bg-transparent text-right font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                            title="Direct edit reposts"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* SINGLE CAMPAIGN TARGET VIEWS SLIDER */
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
      )}

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
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs text-slate-700 dark:text-slate-300 font-mono font-semibold flex items-center gap-1.5">
                  <span>Batch Cadence Gap:</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Randomized Per Batch
                  </span>
                </span>
                
                <div className="flex items-center flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-xs font-mono transition-colors">
                  {[
                    { id: 'interval_20_35m', label: '20–35m', min: 20, max: 35 },
                    { id: 'interval_25m', label: '25m (20–30m)', min: 20, max: 30 },
                    { id: 'interval_35m', label: '35m (25–45m)', min: 25, max: 45 },
                    { id: 'interval_45m', label: '45m (35–55m)', min: 35, max: 55 },
                    { id: 'interval_60m', label: '60m (45–65m)', min: 45, max: 65 },
                    { id: 'interval_25_60m', label: '25–60m', min: 25, max: 60 },
                  ].map((s) => {
                    const isSelected = speedInterval === s.id || (cadenceRange?.minMins === s.min && cadenceRange?.maxMins === s.max);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSpeedInterval(s.id as SpeedInterval);
                          if (setCadenceRange) {
                            setCadenceRange({ minMins: s.min, maxMins: s.max });
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white font-bold shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Variance Explanation Note */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 p-2.5 rounded-xl text-[11px] font-mono text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">Random Gap Variance:</span>
                  <span>
                    Each batch will send with a unique random time gap between{' '}
                    <strong className="text-purple-600 dark:text-purple-300 font-bold">{cadenceRange?.minMins || 20}m</strong> and{' '}
                    <strong className="text-purple-600 dark:text-purple-300 font-bold">{cadenceRange?.maxMins || 35}m</strong>.
                  </span>
                </div>

                {setCadenceRange && (
                  <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                    <span className="text-slate-400">Custom:</span>
                    <input
                      type="number"
                      min={10}
                      max={120}
                      value={cadenceRange?.minMins || 20}
                      onChange={(e) => {
                        const val = Math.max(10, Number(e.target.value));
                        setCadenceRange({ minMins: val, maxMins: Math.max(val, cadenceRange?.maxMins || 35) });
                      }}
                      className="w-12 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded px-1 py-0.5 text-center font-bold text-slate-900 dark:text-white"
                      title="Min Minutes"
                    />
                    <span>to</span>
                    <input
                      type="number"
                      min={10}
                      max={180}
                      value={cadenceRange?.maxMins || 35}
                      onChange={(e) => {
                        const val = Math.max(cadenceRange?.minMins || 20, Number(e.target.value));
                        setCadenceRange({ minMins: cadenceRange?.minMins || 20, maxMins: val });
                      }}
                      className="w-12 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded px-1 py-0.5 text-center font-bold text-slate-900 dark:text-white"
                      title="Max Minutes"
                    />
                    <span>m</span>
                  </div>
                )}
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
