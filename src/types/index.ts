export type Platform = 'instagram' | 'tiktok';

export type AudienceRegion = 
  | 'us_east' 
  | 'us_west' 
  | 'india' 
  | 'uk_europe' 
  | 'global';

export type AlgorithmicCurve = 
  | 'explore_push' 
  | 'fyp_waves' 
  | 'trending_rocket' 
  | 'steady_climb' 
  | 'evergreen' 
  | 'circadian' 
  | 'steady' 
  | 'viral_spike' 
  | 'front_loaded' 
  | 'custom_svg'
  | 'custom_bezier';

export interface CurvePoint {
  id: number;
  x: number; // 0 to 1 (time progress)
  y: number; // 0 to 1 (intensity)
}

export type SpeedInterval = 
  | 'interval_20_35m'
  | 'interval_25_40m'
  | 'interval_35_50m'
  | 'interval_45_60m'
  | 'interval_25m'
  | 'interval_35m'
  | 'interval_45m'
  | 'interval_60m'
  | 'rapid_30s' 
  | 'turbo_1m' 
  | 'turbo_2m' 
  | 'hourly_60m' 
  | 'custom';

export type CommentNiche = 
  | 'Lifestyle' 
  | 'Crypto & Web3' 
  | 'Fitness & Health' 
  | 'E-commerce & Dropshipping' 
  | 'Tech & AI' 
  | 'Luxury & Automotive' 
  | 'Motivation & Business' 
  | 'Streetwear & Aesthetics';

export interface CampaignMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reposts: number;
}

export interface RatioGuardrailStatus {
  metric: keyof Omit<CampaignMetrics, 'views'>;
  currentPercent: number;
  minPercent: number;
  maxPercent: number;
  isCompliant: boolean;
  recommendedValue: number;
  warning?: string;
}

export interface BezierControlPoints {
  p0: { x: number; y: number }; // usually (0, 0)
  p1: { x: number; y: number }; // handle 1
  p2: { x: number; y: number }; // handle 2
  p3: { x: number; y: number }; // end (1, 1)
}

export interface ProviderRoutingConfig {
  viewsService: {
    providerId: string;
    providerName: string;
    serviceId: number;
    serviceName: string;
    minQuantity: number;
    ratePer1k: number;
  };
  microLikesService: {
    providerId: string;
    providerName: string;
    serviceId: number;
    serviceName: string;
    minQuantity: number;
    maxQuantity: number; // 5 - 9
    ratePer1k: number;
  };
  macroLikesService: {
    providerId: string;
    providerName: string;
    serviceId: number;
    serviceName: string;
    minQuantity: number; // 10+
    ratePer1k: number;
  };
  savesService: {
    providerId: string;
    providerName: string;
    serviceId: number;
    serviceName: string;
    minQuantity: number; // 1
    ratePer1k: number;
  };
  repostsService: {
    providerId: string;
    providerName: string;
    serviceId: number;
    serviceName: string;
    minQuantity: number; // 1
    ratePer1k: number;
  };
  sharesService: {
    providerId: string;
    providerName: string;
    serviceId: number;
    serviceName: string;
    minQuantity: number; // 10
    ratePer1k: number;
  };
}

export interface ScheduledBatch {
  batchIndex: number; // 0, 1, 2...
  scheduledAt: string; // ISO string
  isSeedBatch: boolean; // True for Batch #0 and #1 (views only)
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reposts: number;
  likesProvider: 'JAP_Micro' | 'ReliableSMM_Macro' | 'None';
  status: 'pending' | 'running' | 'dispatched' | 'success' | 'failed' | 'skipped';
  dispatchedAt?: string;
  orderIds?: Record<string, string>;
  error?: string;
  executionLogs?: string[];
  gapMinutes?: number;
  gapText?: string;
}

export interface AlgorithmicRiskAudit {
  score: number; // 0 to 20 (0-3: Ghost-Grade Organic, 4-8: Safe Drip, 9-14: Moderate, 15-20: High Flag)
  riskCategory: 'Ghost-Grade Organic' | 'Safe Drip' | 'Moderate Risk' | 'Critical Flag Risk';
  detectionProbability: string; // e.g. "<0.08%"
  redFlags: {
    id: string;
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
  }[];
  optimizationTips: {
    id: string;
    title: string;
    actionableFix: string;
    autoFixable: boolean;
  }[];
  seedProtocolCompliant: boolean;
  jitterVarianceActive: boolean;
  pacingSafetyIndex: number; // 0-100%
}

export interface Campaign {
  id: string;
  name: string;
  platform: Platform;
  targetUrl: string;
  handle: string;
  organicMode: boolean;
  metrics: CampaignMetrics;
  commentNiche: CommentNiche;
  generatedComments: string[];
  durationHours: number;
  curve: AlgorithmicCurve;
  audienceRegion?: AudienceRegion;
  curvePoints?: CurvePoint[];
  bezierPoints: BezierControlPoints;
  speedInterval: SpeedInterval;
  cadenceRange?: { minMins: number; maxMins: number };
  intervalMinutes: number;
  jitterPercent: number; // e.g. 15 for ±15%
  seedChunkProtocol: boolean;
  batches: ScheduledBatch[];
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  currentBatchIndex: number;
  riskAudit: AlgorithmicRiskAudit;
  routingConfig: ProviderRoutingConfig;
}

export interface SmmPanel {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  currency: 'USD' | 'INR';
  balance: number;
  lastChecked?: string;
  status: 'active' | 'error' | 'untested';
  isDefault?: boolean;
  latencyMs?: number;
  supportedServicesCount?: number;
  notes?: string;
}

export interface DispatchLog {
  id: string;
  campaignId: string;
  campaignName: string;
  batchIndex: number;
  timestamp: string;
  providerName: string;
  serviceId: number;
  metricType: string;
  quantity: number;
  status: 'success' | 'failed' | 'simulated';
  orderId?: string;
  responsePayload: any;
  error?: string;
}
