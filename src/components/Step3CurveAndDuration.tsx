import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  TrendingUp, 
  SlidersHorizontal, 
  Globe, 
  Sparkles, 
  Shield, 
  Eye, 
  Heart, 
  MessageSquare, 
  BarChart3 
} from 'lucide-react';
import { 
  AlgorithmicCurve, 
  AudienceRegion, 
  CurvePoint, 
  SpeedInterval, 
  BezierControlPoints 
} from '../types';
import { 
  REGION_CONFIGS, 
  ADVANCED_CURVE_PRESETS, 
  getCurveDensityWeights 
} from '../utils/algorithmicEngine';

interface Step3Props {
  durationHours: number;
  setDurationHours: (h: number) => void;
  curve: AlgorithmicCurve;
  setCurve: (c: AlgorithmicCurve) => void;
  speedInterval: SpeedInterval;
  setSpeedInterval: (s: SpeedInterval) => void;
  bezierPoints: BezierControlPoints;
  setBezierPoints: React.Dispatch<React.SetStateAction<BezierControlPoints>>;
  audienceRegion?: AudienceRegion;
  setAudienceRegion?: (r: AudienceRegion) => void;
  curvePoints?: CurvePoint[];
  setCurvePoints?: React.Dispatch<React.SetStateAction<CurvePoint[]>>;
  targetViews?: number;
}

export const Step3CurveAndDuration: React.FC<Step3Props> = ({
  durationHours,
  curve,
  setCurve,
  bezierPoints,
  audienceRegion = 'india',
  setAudienceRegion,
  curvePoints: propCurvePoints,
  setCurvePoints: propSetCurvePoints,
  targetViews = 5000,
}) => {
  // Region state
  const selectedRegion = audienceRegion || 'india';
  const handleSelectRegion = (reg: AudienceRegion) => {
    if (setAudienceRegion) setAudienceRegion(reg);
  };
  const activeRegionConfig = REGION_CONFIGS[selectedRegion] || REGION_CONFIGS.india;

  // Local control points state if not provided via props
  const [internalPoints, setInternalPoints] = useState<CurvePoint[]>([
    { id: 0, x: 0.05, y: 0.12 },
    { id: 1, x: 0.16, y: 0.16 },
    { id: 2, x: 0.32, y: 0.32 },
    { id: 3, x: 0.50, y: 0.55 },
    { id: 4, x: 0.68, y: 0.88 },
    { id: 5, x: 0.84, y: 0.45 },
    { id: 6, x: 0.95, y: 0.20 },
  ]);

  const activePoints = propCurvePoints || internalPoints;
  const updatePoints = propSetCurvePoints || setInternalPoints;

  // Layer toggles
  const [showViewsLayer, setShowViewsLayer] = useState(true);
  const [showLikesLayer, setShowLikesLayer] = useState(true);
  const [showCommentsLayer, setShowCommentsLayer] = useState(false);

  // Projection View: 'hourly' vs 'cumulative'
  const [projectionView, setProjectionView] = useState<'hourly' | 'cumulative'>('hourly');

  // Dragging node state
  const [draggingPointId, setDraggingPointId] = useState<number | null>(null);
  const curveSvgRef = useRef<SVGSVGElement | null>(null);

  // Select a preset curve and load its points
  const handleSelectPreset = (presetId: AlgorithmicCurve) => {
    setCurve(presetId);
    const found = ADVANCED_CURVE_PRESETS.find(p => p.id === presetId);
    if (found) {
      updatePoints([...found.points]);
    }
  };

  // Convert SVG coordinates
  const canvasWidth = 720;
  const canvasHeight = 180;
  const padX = 30;
  const padY = 20;
  const innerWidth = canvasWidth - padX * 2;
  const innerHeight = canvasHeight - padY * 2;

  const toCanvasX = (x: number) => padX + x * innerWidth;
  const toCanvasY = (y: number) => padY + (1 - y) * innerHeight;

  // Drag listener
  const handleSvgMouseMove = useCallback((e: MouseEvent) => {
    if (draggingPointId === null || !curveSvgRef.current) return;
    const rect = curveSvgRef.current.getBoundingClientRect();
    const rawX = (e.clientX - rect.left - padX) / innerWidth;
    const rawY = 1 - (e.clientY - rect.top - padY) / innerHeight;

    const clampedX = Math.max(0, Math.min(1, Math.round(rawX * 100) / 100));
    const clampedY = Math.max(0.05, Math.min(0.98, Math.round(rawY * 100) / 100));

    updatePoints(prev => prev.map(p => {
      if (p.id === draggingPointId) {
        const finalX = p.id === 0 ? 0.05 : p.id === prev.length - 1 ? 0.95 : clampedX;
        return { ...p, x: finalX, y: clampedY };
      }
      return p;
    }));

    if (curve !== 'custom_svg') {
      setCurve('custom_svg');
    }
  }, [draggingPointId, innerWidth, innerHeight, padX, padY, updatePoints, curve, setCurve]);

  const handleSvgMouseUp = useCallback(() => {
    setDraggingPointId(null);
  }, []);

  useEffect(() => {
    if (draggingPointId !== null) {
      window.addEventListener('mousemove', handleSvgMouseMove);
      window.addEventListener('mouseup', handleSvgMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleSvgMouseMove);
      window.removeEventListener('mouseup', handleSvgMouseUp);
    };
  }, [draggingPointId, handleSvgMouseMove, handleSvgMouseUp]);

  // Compute smooth curve path
  const curvePathD = useMemo(() => {
    if (activePoints.length === 0) return '';
    const sorted = [...activePoints].sort((a, b) => a.x - b.x);
    let d = `M ${toCanvasX(sorted[0].x)} ${toCanvasY(sorted[0].y)}`;
    for (let i = 0; i < sorted.length - 1; i++) {
      const p1 = sorted[i];
      const p2 = sorted[i + 1];
      const midX = (toCanvasX(p1.x) + toCanvasX(p2.x)) / 2;
      d += ` Q ${midX} ${toCanvasY((p1.y + p2.y) / 2)}, ${toCanvasX(p2.x)} ${toCanvasY(p2.y)}`;
    }
    return d;
  }, [activePoints]);

  // Likes curve (lagging slightly)
  const likesCurvePathD = useMemo(() => {
    if (activePoints.length === 0) return '';
    const sorted = [...activePoints].sort((a, b) => a.x - b.x);
    let d = `M ${toCanvasX(sorted[0].x)} ${toCanvasY(sorted[0].y * 0.75 + 0.05)}`;
    for (let i = 0; i < sorted.length - 1; i++) {
      const p1 = sorted[i];
      const p2 = sorted[i + 1];
      const targetY1 = p1.y * 0.75 + 0.05;
      const targetY2 = p2.y * 0.75 + 0.05;
      const midX = (toCanvasX(p1.x) + toCanvasX(p2.x)) / 2;
      d += ` Q ${midX} ${toCanvasY((targetY1 + targetY2) / 2)}, ${toCanvasX(p2.x)} ${toCanvasY(targetY2)}`;
    }
    return d;
  }, [activePoints]);

  // Comments curve
  const commentsCurvePathD = useMemo(() => {
    if (activePoints.length === 0) return '';
    const sorted = [...activePoints].sort((a, b) => a.x - b.x);
    let d = `M ${toCanvasX(sorted[0].x)} ${toCanvasY(sorted[0].y * 0.45 + 0.02)}`;
    for (let i = 0; i < sorted.length - 1; i++) {
      const p1 = sorted[i];
      const p2 = sorted[i + 1];
      const targetY1 = p1.y * 0.45 + 0.02;
      const targetY2 = p2.y * 0.45 + 0.02;
      const midX = (toCanvasX(p1.x) + toCanvasX(p2.x)) / 2;
      d += ` Q ${midX} ${toCanvasY((targetY1 + targetY2) / 2)}, ${toCanvasX(p2.x)} ${toCanvasY(targetY2)}`;
    }
    return d;
  }, [activePoints]);

  // Calculate 24-chunk density weights and volumes
  const chunkCount = 24;
  const densityWeights = useMemo(() => {
    return getCurveDensityWeights(
      curve,
      chunkCount,
      bezierPoints,
      durationHours,
      activePoints,
      selectedRegion
    );
  }, [curve, chunkCount, bezierPoints, durationHours, activePoints, selectedRegion]);

  const totalWeight = densityWeights.reduce((a, b) => a + b, 0);
  const hourlyVolumes = densityWeights.map(w => Math.round((w / totalWeight) * targetViews));
  const maxChunkVolume = Math.max(...hourlyVolumes, 1);

  // Cumulative volume
  const cumulativeVolumes = useMemo(() => {
    let sum = 0;
    return hourlyVolumes.map(v => {
      sum += v;
      return sum;
    });
  }, [hourlyVolumes]);

  const peakVelocity = maxChunkVolume;

  const activeProfileLabel = useMemo(() => {
    const matched = ADVANCED_CURVE_PRESETS.find(p => p.id === curve);
    if (matched) return `${matched.icon} ${matched.label}`;
    if (curve === 'custom_svg') return 'Custom SVG';
    return 'Custom Pacing';
  }, [curve]);

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Algorithmic Curve Tuning & Node Canvas
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Fine-tune delivery pacing nodes, view circadian sleep dip zones, and inspect hourly volume distribution.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/40 text-purple-700 dark:text-purple-200 text-xs font-semibold shadow-sm font-mono self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300" />
          <span>Multi-Node Pacing Active</span>
        </div>
      </div>

      {/* TARGET AUDIENCE REGION & CIRCADIAN CALIBRATION */}
      <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
            <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Target Audience Region & Circadian Calibration</span>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Offset: {activeRegionConfig.offsetLabel}
          </span>
        </div>

        {/* 5 Region Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {(Object.entries(REGION_CONFIGS) as [AudienceRegion, typeof REGION_CONFIGS[AudienceRegion]][]).map(([key, cfg]) => {
            const isSelected = selectedRegion === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectRegion(key)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-950 dark:text-white shadow-sm dark:shadow-purple-500/20'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white truncate">
                  <span>{cfg.flag}</span>
                  <span className="truncate">{cfg.label}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-1">
                  {cfg.sublabel}
                </div>
              </button>
            );
          })}
        </div>

        {/* Regional Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-xs font-mono transition-colors">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{activeRegionConfig.flag}</span>
            <span className="font-bold text-slate-900 dark:text-white">{activeRegionConfig.label}:</span>
            <span className="text-slate-500 dark:text-slate-400">{activeRegionConfig.sublabel}</span>
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-[11px]">
            Sleep Dip: 12–6 AM • Peak Activity: 7–11 PM
          </div>
        </div>
      </div>

      {/* PRESET PACING CURVES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {ADVANCED_CURVE_PRESETS.map((preset) => {
          const isSelected = curve === preset.id;
          return (
            <div
              key={preset.id}
              onClick={() => handleSelectPreset(preset.id)}
              className={`relative cursor-pointer p-3.5 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-950 dark:text-white shadow-sm dark:shadow-purple-500/20'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {preset.isRecommended && (
                <div className="absolute -top-2.5 right-3 px-2 py-0.2 rounded-full bg-fuchsia-600 text-white text-[9px] font-mono uppercase tracking-wider font-bold shadow-md">
                  Recommended
                </div>
              )}

              <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white mt-1">
                <span className="text-sm">{preset.icon}</span>
                <span>{preset.label}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                {preset.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* INTERACTIVE CURVE EDITOR (Drag points to customize) */}
      <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        {/* Editor Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
            <SlidersHorizontal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Interactive Curve Editor (Drag points to customize)</span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 inline-block"></span>
              <span>Sleep (12–6 AM {activeRegionConfig.flag})</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-medium">
              <span className="w-3 h-3 rounded-sm bg-purple-100 dark:bg-purple-900/50 border border-purple-300 dark:border-purple-500/60 inline-block"></span>
              <span>Peak (7–11 PM)</span>
            </div>
          </div>
        </div>

        {/* Visual Interactive Canvas */}
        <div className="relative bg-slate-50 dark:bg-[#07090e] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden select-none transition-colors">
          <svg
            ref={curveSvgRef}
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            className="w-full h-52 touch-none cursor-crosshair"
          >
            <defs>
              <linearGradient id="purplePinkCurve" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9333ea" />
                <stop offset="60%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#f472b6" />
              </linearGradient>

              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
              </linearGradient>

              <pattern id="editorGrid" width="40" height="30" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#94a3b8" strokeOpacity="0.18" strokeWidth="0.6" />
              </pattern>
            </defs>

            {/* Grid */}
            <rect x="0" y="0" width={canvasWidth} height={canvasHeight} fill="url(#editorGrid)" />

            {/* Shaded Sleep Zone */}
            <rect
              x={padX}
              y={padY}
              width={innerWidth * 0.22}
              height={innerHeight}
              fill="#0b0f19"
              fillOpacity="0.15"
            />
            <rect
              x={padX + innerWidth * 0.88}
              y={padY}
              width={innerWidth * 0.12}
              height={innerHeight}
              fill="#0b0f19"
              fillOpacity="0.15"
            />

            {/* Shaded Peak Zone */}
            <rect
              x={padX + innerWidth * 0.52}
              y={padY}
              width={innerWidth * 0.23}
              height={innerHeight}
              fill="#a855f7"
              fillOpacity="0.12"
              stroke="#9333ea"
              strokeWidth="0.8"
              strokeDasharray="4 4"
            />

            {/* Zone Annotations */}
            <g transform={`translate(${padX + 15}, ${padY + 22})`}>
              <text fill="#d97706" fontSize="11" fontFamily="monospace" fontWeight="600">
                🌙 Sleep (12–6 AM)
              </text>
            </g>
            <g transform={`translate(${padX + innerWidth * 0.88 - 30}, ${padY + 22})`}>
              <text fill="#d97706" fontSize="11" fontFamily="monospace" fontWeight="600">
                🌙 Sleep (12–6 AM)
              </text>
            </g>

            <g transform={`translate(${padX + innerWidth * 0.54}, ${padY + 22})`}>
              <text fill="#db2777" fontSize="11" fontFamily="monospace" fontWeight="700">
                🔥 Peak (7–11 PM)
              </text>
            </g>

            {/* Area Fill */}
            {showViewsLayer && (
              <path
                d={`${curvePathD} L ${toCanvasX(activePoints[activePoints.length - 1].x)} ${padY + innerHeight} L ${toCanvasX(activePoints[0].x)} ${padY + innerHeight} Z`}
                fill="url(#areaGradient)"
              />
            )}

            {/* Likes Sync Curve */}
            {showLikesLayer && (
              <path
                d={likesCurvePathD}
                fill="none"
                stroke="#f472b6"
                strokeWidth="2.2"
                strokeDasharray="6 4"
                opacity="0.9"
              />
            )}

            {/* Comments Sync Curve */}
            {showCommentsLayer && (
              <path
                d={commentsCurvePathD}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.8"
                strokeDasharray="4 4"
                opacity="0.75"
              />
            )}

            {/* Main Views Curve */}
            {showViewsLayer && (
              <path
                d={curvePathD}
                fill="none"
                stroke="url(#purplePinkCurve)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            )}

            {/* Draggable Control Points */}
            {showViewsLayer && activePoints.map((pt) => {
              const cx = toCanvasX(pt.x);
              const cy = toCanvasY(pt.y);
              const isDragging = draggingPointId === pt.id;

              return (
                <g key={pt.id} className="cursor-grab active:cursor-grabbing">
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isDragging ? 12 : 9}
                    fill="#a855f7"
                    fillOpacity="0.3"
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isDragging ? 6.5 : 5}
                    fill="#ffffff"
                    stroke="#9333ea"
                    strokeWidth="2.5"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingPointId(pt.id);
                    }}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Toolbar inside Curve Editor Box */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 text-xs font-mono font-bold">
              <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>90/100 • Accelerated Ramping</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Natural pacing curve calibrated with sleep dip zones.
            </p>
          </div>

          {/* Layer Toggles */}
          <div className="flex items-center gap-2 font-mono text-xs shrink-0">
            <span className="text-slate-400 uppercase text-[11px] font-semibold">LAYERS:</span>

            <button
              type="button"
              onClick={() => setShowViewsLayer(!showViewsLayer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                showViewsLayer
                  ? 'bg-purple-600 text-white border-purple-500 font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Views</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLikesLayer(!showLikesLayer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                showLikesLayer
                  ? 'bg-pink-600 text-white border-pink-500 font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Likes</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCommentsLayer(!showCommentsLayer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                showCommentsLayer
                  ? 'bg-sky-600 text-white border-sky-500 font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Comments</span>
            </button>
          </div>
        </div>
      </div>

      {/* LIVE DELIVERY PROJECTION */}
      <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
            <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Delivery Projection Volume</span>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1 font-mono text-xs transition-colors">
            <button
              type="button"
              onClick={() => setProjectionView('cumulative')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                projectionView === 'cumulative'
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Cumulative View
            </button>
            <button
              type="button"
              onClick={() => setProjectionView('hourly')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                projectionView === 'hourly'
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Hourly View
            </button>
          </div>
        </div>

        {/* Projection Box */}
        <div className="bg-slate-50 dark:bg-[#07090e] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 transition-colors">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {projectionView === 'hourly'
                ? 'Per-hour delivery volume with active night dip'
                : 'Cumulative post growth curve'}
            </span>
            <span className="text-purple-700 dark:text-fuchsia-400 font-bold">
              {projectionView === 'hourly'
                ? `Peak: ${peakVelocity} views/chunk`
                : `100% Target: ${targetViews.toLocaleString()} Views`}
            </span>
          </div>

          {/* Histogram */}
          <div className="pt-2">
            <div className="h-40 flex items-end gap-1.5 sm:gap-2">
              {densityWeights.map((w, idx) => {
                const currentVal = projectionView === 'hourly' ? hourlyVolumes[idx] : cumulativeVolumes[idx];
                const maxVal = projectionView === 'hourly' ? maxChunkVolume : targetViews;
                const heightPercent = Math.max(6, Math.min(100, Math.round((currentVal / maxVal) * 95)));

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center group relative h-full justify-end"
                  >
                    <div className="absolute -top-8 bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                      H{idx + 1}: {currentVal.toLocaleString()}
                    </div>

                    <div
                      className="w-full rounded-t-sm transition-all duration-300 bg-gradient-to-t from-purple-700 to-fuchsia-500 group-hover:brightness-110"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono pt-3 border-t border-slate-200 dark:border-slate-900">
              <span>Hour 0 (Post Launch)</span>
              <span>Hour 12</span>
              <span>Hour {durationHours} (Target Complete)</span>
            </div>
          </div>
        </div>

        {/* 4-Stat Telemetry Footer Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between transition-colors">
            <span className="text-slate-500 dark:text-slate-400">Pacing</span>
            <span className="font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{activeProfileLabel}</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between transition-colors">
            <span className="text-slate-500 dark:text-slate-400">Peak Velocity</span>
            <span className="font-bold text-fuchsia-600 dark:text-fuchsia-400">{peakVelocity} / chunk</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between transition-colors">
            <span className="text-slate-500 dark:text-slate-400">Circadian</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>{activeRegionConfig.flag}</span>
              <span>Dip Active</span>
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between transition-colors">
            <span className="text-slate-500 dark:text-slate-400">Windows</span>
            <span className="font-bold text-cyan-600 dark:text-cyan-400">{chunkCount} Chunks</span>
          </div>
        </div>
      </div>
    </div>
  );
};
