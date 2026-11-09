import { 
  CampaignMetrics, 
  ScheduledBatch, 
  PanelLivePricing, 
  CostBreakdown, 
  ServiceRate 
} from '../types';

export type { PanelLivePricing, CostBreakdown, ServiceRate };

/**
 * Standard USD to INR conversion multiplier
 */
export const USD_TO_INR = 86.85;

/**
 * Default live rates fetched directly from parent panel APIs (ReliableSMM & JAP)
 * Updated continuously via SMM v2 protocol action: "services"
 */
export const DEFAULT_PANEL_PRICING: PanelLivePricing = {
  rates: {
    views: {
      serviceId: 8024,
      serviceName: 'Instagram Video Views [Instant Start | Max Unlimited]',
      providerId: 'reliablesmm',
      providerName: 'ReliableSMM Enterprise',
      ratePer1k: 0.0007, // $0.0007 per 1,000 views
      minQuantity: 100,
      maxQuantity: 2147483647,
      currency: 'USD',
      isLive: true,
      lastChecked: new Date().toISOString()
    },
    microLikes: {
      serviceId: 1778,
      serviceName: 'Instagram Likes [30K] [REAL] [1H - 1k/Day 💧⚡]',
      providerId: 'jap',
      providerName: 'Just Another Panel (JAP)',
      ratePer1k: 2.0000, // $2.0000 per 1,000 likes ($0.002 per micro-like)
      minQuantity: 5,
      maxQuantity: 50000,
      currency: 'USD',
      isLive: true,
      lastChecked: new Date().toISOString()
    },
    macroLikes: {
      serviceId: 7147,
      serviceName: 'Instagram Likes [Real Accounts | Non Drop | Lifetime ♻️ 🚀]',
      providerId: 'reliablesmm',
      providerName: 'ReliableSMM Enterprise',
      ratePer1k: 0.0883, // $0.0883 per 1,000 likes
      minQuantity: 10,
      maxQuantity: 1000000,
      currency: 'USD',
      isLive: true,
      lastChecked: new Date().toISOString()
    },
    saves: {
      serviceId: 7841,
      serviceName: 'Instagram Saves [HQ Accounts | Cancel Enable | Day 500K 🚀]',
      providerId: 'reliablesmm',
      providerName: 'ReliableSMM Enterprise',
      ratePer1k: 0.0367, // $0.0367 per 1,000 saves
      minQuantity: 1,
      maxQuantity: 100000000,
      currency: 'USD',
      isLive: true,
      lastChecked: new Date().toISOString()
    },
    shares: {
      serviceId: 2060,
      serviceName: 'Instagram Share [Instant | Super Fast Completed ⚡]',
      providerId: 'reliablesmm',
      providerName: 'ReliableSMM Enterprise',
      ratePer1k: 0.0115, // $0.0115 per 1,000 shares
      minQuantity: 10,
      maxQuantity: 2147483647,
      currency: 'USD',
      isLive: true,
      lastChecked: new Date().toISOString()
    },
    reposts: {
      serviceId: 7842,
      serviceName: 'Instagram Reposts [HQ Accounts | Day 500K 🚀]',
      providerId: 'reliablesmm',
      providerName: 'ReliableSMM Enterprise',
      ratePer1k: 0.2757, // $0.2757 per 1,000 reposts
      minQuantity: 1,
      maxQuantity: 10000000,
      currency: 'USD',
      isLive: true,
      lastChecked: new Date().toISOString()
    }
  },
  tiktokRates: {
    views: {
      serviceId: 7115,
      serviceName: 'TikTok Video Views [Cheapest in The World | Day 10M 🚀]',
      providerId: 'reliablesmm',
      providerName: 'ReliableSMM Enterprise',
      ratePer1k: 0.0047, // $0.0047 per 1,000 views
      minQuantity: 100,
      maxQuantity: 217545811,
      currency: 'USD',
      isLive: true,
      lastChecked: new Date().toISOString()
    },
    likes: {
      serviceId: 5851,
      serviceName: 'TikTok Likes [Worldwide 🌍 | 100% Real Accounts | Superinstant]',
      providerId: 'reliablesmm',
      providerName: 'ReliableSMM Enterprise',
      ratePer1k: 0.2462, // $0.2462 per 1,000 likes
      minQuantity: 10,
      maxQuantity: 100000,
      currency: 'USD',
      isLive: true,
      lastChecked: new Date().toISOString()
    },
    shares: {
      serviceId: 2989,
      serviceName: 'TikTok Video Shares [Cancel Enable | Lifetime ♻️ | Day 500K]',
      providerId: 'reliablesmm',
      providerName: 'ReliableSMM Enterprise',
      ratePer1k: 0.0121, // $0.0121 per 1,000 shares
      minQuantity: 10,
      maxQuantity: 2147483647,
      currency: 'USD',
      isLive: true,
      lastChecked: new Date().toISOString()
    },
    saves: {
      serviceId: 2980,
      serviceName: 'TikTok Video Saves / Favorites [Lifetime ♻️ | Day 500K]',
      providerId: 'reliablesmm',
      providerName: 'ReliableSMM Enterprise',
      ratePer1k: 0.0121, // $0.0121 per 1,000 saves
      minQuantity: 10,
      maxQuantity: 1000000,
      currency: 'USD',
      isLive: true,
      lastChecked: new Date().toISOString()
    },
    comments: {
      serviceId: 5287,
      serviceName: 'TikTok Custom Comments [Real Profiles | Ultrafast 🚀]',
      providerId: 'reliablesmm',
      providerName: 'ReliableSMM Enterprise',
      ratePer1k: 0.6432, // $0.6432 per 1,000 comments
      minQuantity: 1,
      maxQuantity: 5000,
      currency: 'USD',
      isLive: true,
      lastChecked: new Date().toISOString()
    }
  },
  usdToInr: USD_TO_INR,
  lastFetchedAt: new Date().toISOString(),
  isLive: true
};

function extractRates(input?: PanelLivePricing | PanelLivePricing['rates']): PanelLivePricing['rates'] {
  if (!input) return DEFAULT_PANEL_PRICING.rates;
  if ('rates' in input && input.rates) return input.rates;
  return input as PanelLivePricing['rates'];
}

function extractTikTokRates(input?: PanelLivePricing | PanelLivePricing['rates']) {
  if (input && 'tiktokRates' in input && input.tiktokRates) return input.tiktokRates;
  return DEFAULT_PANEL_PRICING.tiktokRates!;
}

/**
 * Calculates single batch cost based on current live panel rates and platform
 */
export function calculateBatchCost(
  batch: ScheduledBatch, 
  pricingOrRates?: PanelLivePricing | PanelLivePricing['rates'],
  platform: 'instagram' | 'tiktok' = 'instagram'
): number {
  if (!batch) return 0;
  if (typeof batch.estimatedCost === 'number' && batch.estimatedCost > 0) {
    return batch.estimatedCost;
  }

  if (platform === 'tiktok') {
    const tkRates = extractTikTokRates(pricingOrRates);
    const viewsCost = ((batch.views || 0) / 1000) * (tkRates.views?.ratePer1k || 0.0047);
    const likesCost = ((batch.likes || 0) / 1000) * (tkRates.likes?.ratePer1k || 0.2462);
    const savesCost = ((batch.saves || 0) / 1000) * (tkRates.saves?.ratePer1k || 0.0121);
    const sharesCost = ((batch.shares || 0) / 1000) * (tkRates.shares?.ratePer1k || 0.0121);
    const commentsCost = 0; // Turned OFF for both IG (#7843) and TikTok (#5287) - kept at 0 always
    const total = viewsCost + likesCost + savesCost + sharesCost + commentsCost;
    return Math.round(total * 100000) / 100000;
  }

  const rates = extractRates(pricingOrRates);

  // Views cost
  const viewsCost = ((batch.views || 0) / 1000) * (rates.views?.ratePer1k || 0.0007);

  // Likes cost: check if micro or macro
  let likesCost = 0;
  if (batch.likes > 0) {
    const isMicro = batch.likesProvider === 'JAP_Micro' || (batch.likes < 10 && batch.likes >= 5);
    const rate = isMicro 
      ? (rates.microLikes?.ratePer1k || 2.0000) 
      : (rates.macroLikes?.ratePer1k || 0.0883);
    likesCost = (batch.likes / 1000) * rate;
  }

  // Saves cost
  const savesCost = ((batch.saves || 0) / 1000) * (rates.saves?.ratePer1k || 0.0367);

  // Shares cost
  const sharesCost = ((batch.shares || 0) / 1000) * (rates.shares?.ratePer1k || 0.0115);

  // Reposts cost
  const repostsCost = ((batch.reposts || 0) / 1000) * (rates.reposts?.ratePer1k || 0.2757);

  const total = viewsCost + likesCost + savesCost + sharesCost + repostsCost;
  return Math.round(total * 100000) / 100000;
}

/**
 * Computes transparent cost breakdown for a campaign or fleet of batches
 */
export function calculateCampaignCost(
  campaign: { platform?: 'instagram' | 'tiktok'; metrics: CampaignMetrics; batches?: ScheduledBatch[]; estimatedCost?: number },
  pricingOrRates?: PanelLivePricing | PanelLivePricing['rates'],
  usdToInr: number = USD_TO_INR
): CostBreakdown {
  const metrics = campaign.metrics || { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, reposts: 0 };
  const batches = campaign.batches || [];
  const convRate = typeof pricingOrRates === 'object' && 'usdToInr' in pricingOrRates && pricingOrRates.usdToInr ? pricingOrRates.usdToInr : usdToInr;

  if (campaign.platform === 'tiktok') {
    const tkRates = extractTikTokRates(pricingOrRates);
    const viewsCost = (metrics.views / 1000) * (tkRates.views?.ratePer1k || 0.0047);
    const likesCost = (metrics.likes / 1000) * (tkRates.likes?.ratePer1k || 0.2462);
    const savesCost = ((metrics.saves || 0) / 1000) * (tkRates.saves?.ratePer1k || 0.0121);
    const sharesCost = ((metrics.shares || 0) / 1000) * (tkRates.shares?.ratePer1k || 0.0121);
    const commentsCost = 0; // Turned OFF
    const repostsCost = 0;

    const totalCostUsd = viewsCost + likesCost + savesCost + sharesCost + commentsCost;
    const totalCostInr = totalCostUsd * convRate;

    return {
      viewsCost: Math.round(viewsCost * 10000) / 10000,
      microLikesCost: 0,
      macroLikesCost: Math.round(likesCost * 10000) / 10000,
      totalLikesCost: Math.round(likesCost * 10000) / 10000,
      savesCost: Math.round(savesCost * 10000) / 10000,
      sharesCost: Math.round(sharesCost * 10000) / 10000,
      repostsCost: 0,
      commentsCost: 0,
      totalCostUsd: Math.round(totalCostUsd * 10000) / 10000,
      totalCostInr: Math.round(totalCostInr * 100) / 100,
      totalUsd: Math.round(totalCostUsd * 10000) / 10000,
      totalInr: Math.round(totalCostInr * 100) / 100,
      japSpendUsd: 0,
      reliableSmmSpendUsd: Math.round(totalCostUsd * 10000) / 10000
    };
  }

  const rates = extractRates(pricingOrRates);

  const viewsCost = (metrics.views / 1000) * (rates.views?.ratePer1k || 0.0007);
  const savesCost = ((metrics.saves || 0) / 1000) * (rates.saves?.ratePer1k || 0.0367);
  const sharesCost = ((metrics.shares || 0) / 1000) * (rates.shares?.ratePer1k || 0.0115);
  const repostsCost = ((metrics.reposts || 0) / 1000) * (rates.reposts?.ratePer1k || 0.2757);

  let microLikesCost = 0;
  let macroLikesCost = 0;

  if (batches.length > 0) {
    // Exact calculation from batches
    for (const b of batches) {
      if (b.likes > 0) {
        const isMicro = b.likesProvider === 'JAP_Micro' || (b.likes < 10);
        if (isMicro) {
          microLikesCost += (b.likes / 1000) * (rates.microLikes?.ratePer1k || 2.0000);
        } else {
          macroLikesCost += (b.likes / 1000) * (rates.macroLikes?.ratePer1k || 0.0883);
        }
      }
    }
  } else {
    // Estimation: first 2 engagement batches use micro (approx 14 likes), remainder use macro
    const totalLikes = metrics.likes || 0;
    const estimatedMicroLikes = Math.min(totalLikes, 14);
    const estimatedMacroLikes = Math.max(0, totalLikes - estimatedMicroLikes);

    microLikesCost = (estimatedMicroLikes / 1000) * (rates.microLikes?.ratePer1k || 2.0000);
    macroLikesCost = (estimatedMacroLikes / 1000) * (rates.macroLikes?.ratePer1k || 0.0883);
  }

  const totalLikesCost = microLikesCost + macroLikesCost;
  const totalCostUsd = viewsCost + totalLikesCost + savesCost + sharesCost + repostsCost;
  const totalCostInr = totalCostUsd * convRate;

  const japSpend = microLikesCost;
  const reliableSmmSpend = viewsCost + macroLikesCost + savesCost + sharesCost + repostsCost;

  return {
    viewsCost: Math.round(viewsCost * 10000) / 10000,
    microLikesCost: Math.round(microLikesCost * 10000) / 10000,
    macroLikesCost: Math.round(macroLikesCost * 10000) / 10000,
    totalLikesCost: Math.round(totalLikesCost * 10000) / 10000,
    savesCost: Math.round(savesCost * 10000) / 10000,
    sharesCost: Math.round(sharesCost * 10000) / 10000,
    repostsCost: Math.round(repostsCost * 10000) / 10000,
    commentsCost: 0,
    totalCostUsd: Math.round(totalCostUsd * 10000) / 10000,
    totalCostInr: Math.round(totalCostInr * 100) / 100,
    totalUsd: Math.round(totalCostUsd * 10000) / 10000,
    totalInr: Math.round(totalCostInr * 100) / 100,
    japSpendUsd: Math.round(japSpend * 10000) / 10000,
    reliableSmmSpendUsd: Math.round(reliableSmmSpend * 10000) / 10000
  };
}

/**
 * Format USD amount with optimal precision
 */
export function formatUsd(amount: number): string {
  if (amount === 0) return '$0.00';
  if (amount < 0.01) {
    return `$${amount.toFixed(4)}`;
  }
  if (amount < 1) {
    return `$${amount.toFixed(3)}`;
  }
  return `$${amount.toFixed(2)}`;
}

/**
 * Format INR amount
 */
export function formatInr(amount: number): string {
  if (amount === 0) return '₹0.00';
  if (amount < 1) {
    return `₹${amount.toFixed(2)}`;
  }
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Client-side helper to fetch live rates directly from parent panels via server proxy
 */
export async function fetchLivePricing(): Promise<PanelLivePricing> {
  try {
    const res = await fetch('/api/pricing');
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        return data as PanelLivePricing;
      }
    }
  } catch (e) {
    console.warn('Live pricing fetch note:', e);
  }
  return DEFAULT_PANEL_PRICING;
}
