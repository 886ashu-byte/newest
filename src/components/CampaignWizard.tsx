import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Sparkles, 
  Layers, 
  Zap, 
  Sliders, 
  TrendingUp, 
  ShieldAlert, 
  Rocket,
  CheckCircle2
} from 'lucide-react';
import { 
  Platform, 
  CampaignMetrics, 
  CommentNiche, 
  AlgorithmicCurve, 
  AudienceRegion,
  CurvePoint,
  SpeedInterval, 
  BezierControlPoints, 
  Campaign, 
  SmmPanel,
  AlgorithmicRiskAudit
} from '../types';
import { 
  DEFAULT_ROUTING_CONFIG, 
  computeGoldenRatioMetrics, 
  generateCampaignBatches, 
  getIntervalMinutes, 
  computeRiskAudit,
  ADVANCED_CURVE_PRESETS
} from '../utils/algorithmicEngine';
import { getRandomPresetComments } from '../utils/commentPresets';
import { Step1PlatformAndTarget } from './Step1PlatformAndTarget';
import { Step2VolumeAndRatios } from './Step2VolumeAndRatios';
import { Step3CurveAndDuration } from './Step3CurveAndDuration';
import { Step4JitterAndRisk } from './Step4JitterAndRisk';
import { Step5ReviewAndLaunch } from './Step5ReviewAndLaunch';

interface CampaignWizardProps {
  panels: SmmPanel[];
  currency?: 'USD' | 'INR';
  onLaunchSuccess: (campaign: Campaign) => void;
}

export const CampaignWizard: React.FC<CampaignWizardProps> = ({
  panels,
  onLaunchSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Wizard State
  const [campaignName, setCampaignName] = useState('Viral Reels Algorithmic Push #01');
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [targetUrl, setTargetUrl] = useState('https://www.instagram.com/reel/C8qXYZ99abc/');
  const [handle, setHandle] = useState('@target_creator');
  const [organicMode, setOrganicMode] = useState(true);

  // Metrics
  const [metrics, setMetrics] = useState<CampaignMetrics>(computeGoldenRatioMetrics(5000));
  const [commentNiche, setCommentNiche] = useState<CommentNiche>('Lifestyle');
  const [generatedComments, setGeneratedComments] = useState<string[]>(
    getRandomPresetComments('Lifestyle', 12)
  );

  // Curve & Duration & Audience Region
  const [durationHours, setDurationHours] = useState(24);
  const [curve, setCurve] = useState<AlgorithmicCurve>('trending_rocket');
  const [audienceRegion, setAudienceRegion] = useState<AudienceRegion>('india');
  const [curvePoints, setCurvePoints] = useState<CurvePoint[]>(() => {
    const found = ADVANCED_CURVE_PRESETS.find(p => p.id === 'trending_rocket');
    return found ? [...found.points] : [
      { id: 0, x: 0.05, y: 0.12 },
      { id: 1, x: 0.16, y: 0.16 },
      { id: 2, x: 0.32, y: 0.32 },
      { id: 3, x: 0.50, y: 0.55 },
      { id: 4, x: 0.68, y: 0.88 },
      { id: 5, x: 0.84, y: 0.45 },
      { id: 6, x: 0.95, y: 0.20 },
    ];
  });
  const [speedInterval, setSpeedInterval] = useState<SpeedInterval>('interval_35m');
  const [bezierPoints, setBezierPoints] = useState<BezierControlPoints>({
    p0: { x: 0, y: 0 },
    p1: { x: 0.25, y: 0.75 },
    p2: { x: 0.75, y: 0.35 },
    p3: { x: 1, y: 1 },
  });

  // Jitter & Risk
  const [jitterPercent, setJitterPercent] = useState(18); // ±18%
  const [seedChunkProtocol, setSeedChunkProtocol] = useState(true);
  const [riskAudit, setRiskAudit] = useState<AlgorithmicRiskAudit>(() => 
    computeRiskAudit(computeGoldenRatioMetrics(5000), 'trending_rocket', 18, true, 24, 2)
  );

  const intervalMinutes = getIntervalMinutes(speedInterval);

  // Computed Batches for Review & Launch
  const computedBatches = useMemo(() => {
    return generateCampaignBatches({
      metrics,
      durationHours,
      intervalMinutes,
      curve,
      bezierPoints,
      jitterPercent,
      seedChunkProtocol,
      startDate: new Date(),
      routingConfig: DEFAULT_ROUTING_CONFIG,
      curvePoints,
      region: audienceRegion,
    });
  }, [metrics, durationHours, intervalMinutes, curve, bezierPoints, jitterPercent, seedChunkProtocol, curvePoints, audienceRegion]);

  // Assembled Campaign object
  const assembledCampaign: Campaign = useMemo(() => {
    return {
      id: 'camp_draft_' + Date.now().toString(36),
      name: campaignName.trim() || 'Untitled Algorithmic Drip',
      platform,
      targetUrl,
      handle: handle || '@creator',
      organicMode,
      metrics,
      commentNiche,
      generatedComments,
      durationHours,
      curve,
      audienceRegion,
      curvePoints,
      bezierPoints,
      speedInterval,
      intervalMinutes,
      jitterPercent,
      seedChunkProtocol,
      batches: computedBatches,
      status: 'running',
      createdAt: new Date().toISOString(),
      currentBatchIndex: 0,
      riskAudit,
      routingConfig: DEFAULT_ROUTING_CONFIG,
    };
  }, [
    campaignName,
    platform,
    targetUrl,
    handle,
    organicMode,
    metrics,
    commentNiche,
    generatedComments,
    durationHours,
    curve,
    audienceRegion,
    curvePoints,
    bezierPoints,
    speedInterval,
    intervalMinutes,
    jitterPercent,
    seedChunkProtocol,
    computedBatches,
    riskAudit
  ]);

  const steps = [
    { num: 1, title: 'Target & Platform', icon: Zap },
    { num: 2, title: 'Volume & Delivery', icon: Sliders },
    { num: 3, title: 'Curve Tuning', icon: TrendingUp },
    { num: 4, title: 'Anti-Detection', icon: ShieldAlert },
    { num: 5, title: 'Review & Launch', icon: Rocket },
  ];

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 5-Step Progress Stepper Bar */}
      <div className="bg-white/90 dark:bg-[#0b0f17]/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-2.5 sm:p-3 backdrop-blur-md shadow-sm dark:shadow-xl flex items-center justify-between overflow-x-auto gap-2 transition-colors">
        {steps.map((step) => {
          const isCompleted = currentStep > step.num;
          const isCurrent = currentStep === step.num;

          if (isCurrent) {
            return (
              <button
                key={step.num}
                type="button"
                onClick={() => setCurrentStep(step.num)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 text-white font-bold text-xs sm:text-sm font-mono shadow-lg shadow-purple-500/30 shrink-0 cursor-pointer"
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                  {step.num}
                </span>
                <span>{step.title}</span>
              </button>
            );
          }

          if (isCompleted) {
            return (
              <button
                key={step.num}
                type="button"
                onClick={() => setCurrentStep(step.num)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all font-mono text-xs sm:text-sm shrink-0 cursor-pointer font-medium"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 dark:border-emerald-500/40">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>{step.title}</span>
              </button>
            );
          }

          return (
            <button
              key={step.num}
              type="button"
              onClick={() => setCurrentStep(step.num)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40 transition-all font-mono text-xs sm:text-sm shrink-0 cursor-pointer"
            >
              <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-[10px]">
                {step.num}
              </span>
              <span>{step.title}</span>
            </button>
          );
        })}
      </div>

      {/* Wizard Step Render Area */}
      <div className="min-h-[460px]">
        {currentStep === 1 && (
          <Step1PlatformAndTarget
            platform={platform}
            setPlatform={setPlatform}
            targetUrl={targetUrl}
            setTargetUrl={setTargetUrl}
            handle={handle}
            setHandle={setHandle}
            organicMode={organicMode}
            setOrganicMode={setOrganicMode}
            campaignName={campaignName}
            setCampaignName={setCampaignName}
          />
        )}

        {currentStep === 2 && (
          <Step2VolumeAndRatios
            metrics={metrics}
            setMetrics={setMetrics}
            commentNiche={commentNiche}
            setCommentNiche={setCommentNiche}
            generatedComments={generatedComments}
            setGeneratedComments={setGeneratedComments}
            durationHours={durationHours}
            setDurationHours={setDurationHours}
            curve={curve}
            setCurve={setCurve}
            audienceRegion={audienceRegion}
            setAudienceRegion={setAudienceRegion}
            speedInterval={speedInterval}
            setSpeedInterval={setSpeedInterval}
            curvePoints={curvePoints}
            setCurvePoints={setCurvePoints}
          />
        )}

        {currentStep === 3 && (
          <Step3CurveAndDuration
            durationHours={durationHours}
            setDurationHours={setDurationHours}
            curve={curve}
            setCurve={setCurve}
            speedInterval={speedInterval}
            setSpeedInterval={setSpeedInterval}
            bezierPoints={bezierPoints}
            setBezierPoints={setBezierPoints}
            audienceRegion={audienceRegion}
            setAudienceRegion={setAudienceRegion}
            curvePoints={curvePoints}
            setCurvePoints={setCurvePoints}
            targetViews={metrics.views}
          />
        )}

        {currentStep === 4 && (
          <Step4JitterAndRisk
            jitterPercent={jitterPercent}
            setJitterPercent={setJitterPercent}
            seedChunkProtocol={seedChunkProtocol}
            setSeedChunkProtocol={setSeedChunkProtocol}
            metrics={metrics}
            setMetrics={setMetrics}
            curve={curve}
            durationHours={durationHours}
            intervalMinutes={intervalMinutes}
            riskAudit={riskAudit}
            setRiskAudit={setRiskAudit}
            audienceRegion={audienceRegion}
            batches={computedBatches}
            curvePoints={curvePoints}
            bezierPoints={bezierPoints}
          />
        )}

        {currentStep === 5 && (
          <Step5ReviewAndLaunch
            campaign={assembledCampaign}
            panels={panels}
            onLaunchSuccess={onLaunchSuccess}
          />
        )}
      </div>

      {/* Navigation Footer Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800/80 transition-colors">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Step {currentStep} of 5 • {steps[currentStep - 1].title}
        </div>

        {currentStep < 5 && (
          currentStep === 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold text-xs font-mono shadow-md shadow-purple-500/25 transition-all cursor-pointer"
            >
              <span>Anti-Detection & Jitter</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : currentStep === 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold text-xs font-mono shadow-md shadow-purple-500/25 transition-all cursor-pointer"
            >
              <span>Review Campaign</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold text-xs font-mono shadow-md shadow-purple-500/20 transition-all cursor-pointer"
            >
              <span>Continue to Step 0{currentStep + 1}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )
        )}
      </div>
    </div>
  );
};
