import React, { useState, useEffect } from 'react';
import { 
  Workflow, 
  ArrowRight, 
  Eye, 
  Heart, 
  Bookmark, 
  Share2, 
  Repeat, 
  CheckCircle2, 
  Zap, 
  Send, 
  Code2, 
  Layers,
  ShieldCheck,
  Server,
  Power,
  Sliders,
  Save,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  DollarSign
} from 'lucide-react';
import { RoutingGateConfig, SmmPanel, PanelLivePricing } from '../types';
import { DEFAULT_PANEL_PRICING, formatUsd, formatInr } from '../utils/pricingEngine';

export const RoutingGatewayView: React.FC = () => {
  // Direct Panel Live Pricing state
  const [pricing, setPricing] = useState<PanelLivePricing>(DEFAULT_PANEL_PRICING);
  const [isRefreshingPricing, setIsRefreshingPricing] = useState(false);
  const [pricingRefreshMsg, setPricingRefreshMsg] = useState<string | null>(null);

  // Provider gate state
  const [panels, setPanels] = useState<SmmPanel[]>([
    {
      id: 'reliablesmm',
      name: 'ReliableSMM Enterprise',
      apiUrl: 'https://reliablesmm.com/api/v2',
      apiKey: '••••••••',
      currency: 'USD',
      balance: 412.15,
      status: 'active',
      enabled: true
    },
    {
      id: 'jap',
      name: 'Just Another Panel (JAP)',
      apiUrl: 'https://justanotherpanel.com/api/v2',
      apiKey: '••••••••',
      currency: 'USD',
      balance: 247.80,
      status: 'active',
      enabled: true
    }
  ]);

  const [routingConfig, setRoutingConfig] = useState<RoutingGateConfig>({
    mode: 'smart_split',
    microLikesThreshold: 10,
    microLikes: {
      providerId: 'jap',
      serviceId: 1778,
      serviceName: 'Instagram Micro-Likes [5-9 Drip]',
      minQuantity: 5,
      maxQuantity: 9
    },
    macroLikes: {
      providerId: 'reliablesmm',
      serviceId: 7147,
      serviceName: 'Instagram Macro-Likes [Active Profile Drip]',
      minQuantity: 10
    },
    views: {
      providerId: 'reliablesmm',
      serviceId: 8024,
      serviceName: 'Instagram High-Retention Views',
      minQuantity: 100
    },
    saves: {
      providerId: 'reliablesmm',
      serviceId: 7841,
      serviceName: 'Targeted Saves [Organic Signal]',
      minQuantity: 1
    },
    shares: {
      providerId: 'reliablesmm',
      serviceId: 2060,
      serviceName: 'Viral Social Shares',
      minQuantity: 10
    },
    reposts: {
      providerId: 'reliablesmm',
      serviceId: 7842,
      serviceName: 'Targeted Reposts / Shares v2',
      minQuantity: 1
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Platform view selection
  const [activePlatformTab, setActivePlatformTab] = useState<'instagram' | 'tiktok'>('instagram');

  // Simulator state
  const [simPlatform, setSimPlatform] = useState<'instagram' | 'tiktok'>('instagram');
  const [testMetric, setTestMetric] = useState<string>('micro_likes');
  const [testQuantity, setTestQuantity] = useState<number>(7);
  const [testLink, setTestLink] = useState('https://www.instagram.com/reel/C89viralXYZ/');
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Fetch current routing configuration and panel statuses from server
  const fetchRoutingData = async () => {
    try {
      const res = await fetch('/api/routing-config');
      if (res.ok) {
        const data = await res.json();
        if (data.routingGateConfig) setRoutingConfig(data.routingGateConfig);
        if (Array.isArray(data.panels)) {
          setPanels(prev => prev.map(p => {
            const found = data.panels.find((dp: any) => dp.id === p.id);
            return found ? { ...p, ...found } : p;
          }));
        }
      }
    } catch (e) {
      console.warn('Routing fetch note:', e);
    }
  };

  // Fetch live pricing directly from parent panels
  const fetchPricingData = async () => {
    try {
      const res = await fetch('/api/pricing');
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) setPricing(data);
      }
    } catch (e) {
      console.warn('Pricing fetch note:', e);
    }
  };

  useEffect(() => {
    fetchRoutingData();
    fetchPricingData();
  }, []);

  // Force re-fetch rates directly from ReliableSMM and JAP parent panels
  const handleRefreshPricingDirect = async () => {
    setIsRefreshingPricing(true);
    setPricingRefreshMsg(null);
    try {
      const res = await fetch('/api/pricing/refresh', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.pricing) setPricing(data.pricing);
        setPricingRefreshMsg('Live rates verified directly from panel APIs!');
        setTimeout(() => setPricingRefreshMsg(null), 4000);
      }
    } catch (e: any) {
      setPricingRefreshMsg('Failed to refresh pricing from panels');
    } finally {
      setIsRefreshingPricing(false);
    }
  };

  // Toggle Provider ON / OFF
  const handleToggleProvider = async (panelId: string) => {
    try {
      const res = await fetch(`/api/panels/${panelId}/toggle-status`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.panels) setPanels(data.panels);
        else if (data.panel) {
          setPanels(prev => prev.map(p => p.id === data.panel.id ? data.panel : p));
        }
        if (data.routingGateConfig) {
          setRoutingConfig(data.routingGateConfig);
        }
        setSaveSuccessMsg(data.message || 'Provider status updated!');
        setTimeout(() => setSaveSuccessMsg(null), 3500);
      }
    } catch (e) {
      setPanels(prev => prev.map(p => {
        if (p.id === panelId) {
          const newEn = p.enabled === false;
          return { ...p, enabled: newEn, status: newEn ? 'active' : 'disabled' };
        }
        return p;
      }));
    }
  };

  // Quick Preset Handlers
  const handleApplyPreset = (preset: 'smart_split' | 'single_reliable' | 'single_jap') => {
    if (preset === 'smart_split') {
      setRoutingConfig(prev => ({
        ...prev,
        mode: 'smart_split',
        microLikesThreshold: 10,
        microLikes: {
          ...prev.microLikes,
          providerId: 'jap',
          serviceId: 1778,
          serviceName: 'Instagram Micro-Likes [5-9 Drip]'
        },
        macroLikes: {
          ...prev.macroLikes,
          providerId: 'reliablesmm',
          serviceId: 7147,
          serviceName: 'Instagram Macro-Likes [Active Profile Drip]'
        }
      }));
    } else if (preset === 'single_reliable') {
      setRoutingConfig(prev => ({
        ...prev,
        mode: 'single_reliable',
        microLikes: {
          ...prev.microLikes,
          providerId: 'reliablesmm',
          serviceId: 7147,
          serviceName: 'ReliableSMM Direct Likes (#7147)'
        },
        macroLikes: {
          ...prev.macroLikes,
          providerId: 'reliablesmm',
          serviceId: 7147,
          serviceName: 'Instagram Macro-Likes (#7147)'
        }
      }));
    } else if (preset === 'single_jap') {
      setRoutingConfig(prev => ({
        ...prev,
        mode: 'single_jap',
        microLikes: {
          ...prev.microLikes,
          providerId: 'jap',
          serviceId: 1778,
          serviceName: 'Instagram Micro-Likes (#1778)'
        },
        macroLikes: {
          ...prev.macroLikes,
          providerId: 'jap',
          serviceId: 1778,
          serviceName: 'JAP Standard Likes (#1778)'
        }
      }));
    }
  };

  // Save Config to Server
  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    try {
      const res = await fetch('/api/routing-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routingConfig)
      });
      if (res.ok) {
        const data = await res.json();
        setSaveSuccessMsg('Routing rules and service gates saved permanently to server!');
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      }
    } catch (e: any) {
      setSaveSuccessMsg('Error saving routing configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const isReliableOn = panels.find(p => p.id === 'reliablesmm')?.enabled !== false && panels.find(p => p.id === 'reliablesmm')?.status !== 'disabled';
  const isJapOn = panels.find(p => p.id === 'jap')?.enabled !== false && panels.find(p => p.id === 'jap')?.status !== 'disabled';

  // Compute live routing decision for simulator
  const getRoutingDecision = (metric: string, qty: number, platform: 'instagram' | 'tiktok' = 'instagram') => {
    if (platform === 'tiktok') {
      if (metric === 'views' || metric === 'tiktok_views') {
        return {
          provider: 'ReliableSMM Enterprise',
          serviceId: 7115,
          serviceName: 'TikTok Video Views [Max Unlimited] | Instant Start | Day 10M',
          min: 100,
          type: 'TikTok FYP Views Highway ($0.0047/1k)'
        };
      }
      if (metric === 'likes' || metric === 'tiktok_likes') {
        return {
          provider: 'ReliableSMM Enterprise',
          serviceId: 5851,
          serviceName: 'TikTok Likes [Worldwide 🌍] | 100% Real Accounts | Superinstant',
          min: 10,
          type: 'TikTok Real Likes Route [10+ Matrix] ($0.2462/1k)'
        };
      }
      if (metric === 'shares' || metric === 'tiktok_shares') {
        return {
          provider: 'ReliableSMM Enterprise',
          serviceId: 2989,
          serviceName: 'TikTok Video Shares [Max Unlimited] | Lifetime ♻️ | Day 500K',
          min: 10,
          type: 'TikTok Viral Video Shares ($0.0121/1k)'
        };
      }
      if (metric === 'saves' || metric === 'tiktok_saves') {
        return {
          provider: 'ReliableSMM Enterprise',
          serviceId: 2980,
          serviceName: 'TikTok Video Saves / Favorites [Lifetime ♻️ | Day 500K]',
          min: 10,
          type: 'TikTok Saves & Favorites Route ($0.0121/1k)'
        };
      }
      return {
        provider: 'ReliableSMM Enterprise',
        serviceId: 5287,
        serviceName: 'TikTok Custom Comments [Max 50K] | HQ & Real Profiles',
        min: 1,
        type: 'TikTok Custom Comments ($0.6432/1k)'
      };
    }

    if (metric === 'views') {
      const provider = isReliableOn ? 'ReliableSMM' : (isJapOn ? 'JAP (Fallback)' : 'ReliableSMM (Offline)');
      return {
        provider,
        serviceId: routingConfig.views.serviceId || 8024,
        serviceName: 'Instagram High-Retention Views',
        min: 100,
        type: 'Views Highway'
      };
    }

    if (metric === 'micro_likes' || (metric === 'likes' && qty < routingConfig.microLikesThreshold)) {
      if (routingConfig.mode === 'single_reliable' || !isJapOn) {
        return {
          provider: 'ReliableSMM',
          serviceId: routingConfig.macroLikes.serviceId || 7147,
          serviceName: !isJapOn ? 'ReliableSMM (JAP Turned OFF Fallback)' : 'ReliableSMM Solo Gate',
          min: 10,
          type: 'Macro Branch (Auto-Rerouted)'
        };
      }
      return {
        provider: 'Just Another Panel (JAP)',
        serviceId: routingConfig.microLikes.serviceId || 1778,
        serviceName: routingConfig.microLikes.serviceName,
        min: 5,
        type: 'Micro-Likes Branch [5-9 Drip]'
      };
    }

    if (metric === 'macro_likes' || (metric === 'likes' && qty >= routingConfig.microLikesThreshold)) {
      if (routingConfig.mode === 'single_jap' || !isReliableOn) {
        return {
          provider: 'Just Another Panel (JAP)',
          serviceId: routingConfig.microLikes.serviceId || 1778,
          serviceName: !isReliableOn ? 'JAP (ReliableSMM Turned OFF Fallback)' : 'JAP Solo Gate',
          min: 5,
          type: 'Likes Branch (Auto-Rerouted)'
        };
      }
      return {
        provider: 'ReliableSMM',
        serviceId: routingConfig.macroLikes.serviceId || 7147,
        serviceName: routingConfig.macroLikes.serviceName,
        min: 10,
        type: 'Macro-Likes Branch [10+ Drip]'
      };
    }

    if (metric === 'saves') {
      const provider = isReliableOn ? 'ReliableSMM' : (isJapOn ? 'JAP (Fallback)' : 'ReliableSMM');
      return {
        provider,
        serviceId: routingConfig.saves.serviceId || 7841,
        serviceName: 'Targeted Saves [Organic Signal]',
        min: 1,
        type: 'Saves Route'
      };
    }

    if (metric === 'shares') {
      const provider = isReliableOn ? 'ReliableSMM' : (isJapOn ? 'JAP (Fallback)' : 'ReliableSMM');
      return {
        provider,
        serviceId: routingConfig.shares.serviceId || 2060,
        serviceName: 'Viral Social Shares',
        min: 10,
        type: 'Shares Route'
      };
    }

    const provider = isReliableOn ? 'ReliableSMM' : (isJapOn ? 'JAP (Fallback)' : 'ReliableSMM');
    return {
      provider,
      serviceId: routingConfig.reposts.serviceId || 7842,
      serviceName: 'Targeted Reposts / Shares v2',
      min: 1,
      type: 'Reposts Route'
    };
  };

  const currentRoute = getRoutingDecision(testMetric, testQuantity, simPlatform);

  const handleSimulateDispatch = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
      let effectiveQty = testQuantity;
      let ratePer1k = 0.0883;

      if (simPlatform === 'tiktok') {
        const tk = pricing.tiktokRates || {
          views: { ratePer1k: 0.0047 },
          likes: { ratePer1k: 0.2462 },
          shares: { ratePer1k: 0.0121 },
          saves: { ratePer1k: 0.0121 },
          comments: { ratePer1k: 0.6432 }
        };

        if (testMetric === 'views' || testMetric === 'tiktok_views') {
          effectiveQty = Math.max(100, testQuantity);
          ratePer1k = tk.views?.ratePer1k || 0.0047;
        } else if (testMetric === 'likes' || testMetric === 'tiktok_likes') {
          effectiveQty = Math.max(10, testQuantity);
          ratePer1k = tk.likes?.ratePer1k || 0.2462;
        } else if (testMetric === 'shares' || testMetric === 'tiktok_shares') {
          effectiveQty = Math.max(10, testQuantity);
          ratePer1k = tk.shares?.ratePer1k || 0.0121;
        } else if (testMetric === 'saves' || testMetric === 'tiktok_saves') {
          effectiveQty = Math.max(10, testQuantity);
          ratePer1k = tk.saves?.ratePer1k || 0.0121;
        } else {
          effectiveQty = Math.max(1, testQuantity);
          ratePer1k = tk.comments?.ratePer1k || 0.6432;
        }
      } else {
        const isReroutedToReliable = (testMetric === 'micro_likes') && (!isJapOn || routingConfig.mode === 'single_reliable');
        effectiveQty = isReroutedToReliable ? Math.max(10, testQuantity) : testQuantity;
        ratePer1k = testMetric === 'views' 
          ? (pricing.rates.views?.ratePer1k || 0.0007) 
          : isReroutedToReliable
          ? (pricing.rates.macroLikes?.ratePer1k || 0.0883)
          : testMetric === 'micro_likes' 
          ? (pricing.rates.microLikes?.ratePer1k || 2.0) 
          : testMetric === 'macro_likes' 
          ? (pricing.rates.macroLikes?.ratePer1k || 0.0883) 
          : testMetric === 'saves' 
          ? (pricing.rates.saves?.ratePer1k || 0.0367) 
          : testMetric === 'shares' 
          ? (pricing.rates.shares?.ratePer1k || 0.0115) 
          : (pricing.rates.reposts?.ratePer1k || 0.2757);
      }

      const chargeUsd = (effectiveQty / 1000) * ratePer1k;
      const chargeInr = chargeUsd * (pricing.usdToInr || 86.85);

      const requestPayload: any = {
        key: '••••••••',
        action: 'add',
        service: currentRoute.serviceId,
        link: testLink,
      };

      if (simPlatform === 'tiktok' && (testMetric === 'comments' || testMetric === 'tiktok_comments')) {
        requestPayload.comments = 'Love this video! 🔥\nInsane quality!\nSaved!';
      } else {
        requestPayload.quantity = effectiveQty;
      }

      setDispatchResult({
        timestamp: new Date().toISOString(),
        targetUrl: testLink,
        platform: simPlatform,
        metric: testMetric,
        quantity: effectiveQty,
        provider: currentRoute.provider,
        serviceId: currentRoute.serviceId,
        orderId,
        requestPayload,
        responsePayload: {
          order: orderId,
          status: 'success',
          ratePer1k: ratePer1k,
          chargeUsd: chargeUsd.toFixed(5),
          chargeFormatted: formatUsd(chargeUsd),
          chargeInrFormatted: formatInr(chargeInr),
          currency: 'USD',
          remains: effectiveQty,
        }
      });
      setIsSimulating(false);
    }, 350);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Workflow className="w-5 h-5 text-teal-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Smart-Split Likes Routing & Provider Access Gate
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                SMM v2 Protocol
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Configure dual-provider routing gates (JAP #1778 for 5–9 micro-likes vs ReliableSMM #7147 for 10+ macro-likes) and toggle providers ON/OFF.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isRefreshingPricing}
              onClick={handleRefreshPricingDirect}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
              title="Fetch latest live rates directly from ReliableSMM and JAP APIs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingPricing ? 'animate-spin text-teal-400' : ''}`} />
              <span>{isRefreshingPricing ? 'Fetching Rates...' : 'Fetch Live Rates'}</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveConfig}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs font-mono transition-all cursor-pointer shadow-md shadow-emerald-500/20 disabled:opacity-50 shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Gates...' : 'Save Routing Rules'}</span>
            </button>
          </div>
        </div>

        {pricingRefreshMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-teal-950/40 border border-teal-500/40 text-teal-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{pricingRefreshMsg} (Rates updated from panels)</span>
          </div>
        )}

        {saveSuccessMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* SECTION 1: PROVIDER ON/OFF POWER GATE SWITCHES */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
            <Power className="w-4 h-4 text-purple-400" />
            <span>Parent Providers Power Gate (Turn ON / Turn OFF)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Automated failover: If a provider is OFF, traffic reroutes automatically
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: ReliableSMM */}
          <div className={`p-4 rounded-xl border transition-all ${
            isReliableOn 
              ? 'bg-slate-900/80 border-slate-700 text-white' 
              : 'bg-amber-950/20 border-amber-500/40 text-slate-400'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-white">ReliableSMM Enterprise</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isReliableOn 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {isReliableOn ? 'ONLINE / ENABLED' : 'TURNED OFF'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Views (#8024), Macro-Likes (#7147), Saves, Shares, Reposts
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleToggleProvider('reliablesmm')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shadow-sm ${
                  isReliableOn
                    ? 'bg-rose-600/25 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{isReliableOn ? 'Turn OFF' : 'Turn ON'}</span>
              </button>
            </div>

            {!isReliableOn && (
              <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>ReliableSMM is disabled. All views and macro-likes will attempt fallback to JAP.</span>
              </div>
            )}
          </div>

          {/* Card 2: JAP */}
          <div className={`p-4 rounded-xl border transition-all ${
            isJapOn 
              ? 'bg-slate-900/80 border-slate-700 text-white' 
              : 'bg-amber-950/20 border-amber-500/40 text-slate-400'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-white">Just Another Panel (JAP)</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isJapOn 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {isJapOn ? 'ONLINE / ENABLED' : 'TURNED OFF'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Micro-Likes Specialist (Service #1778 • 5–9 Micro Drip)
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleToggleProvider('jap')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shadow-sm ${
                  isJapOn
                    ? 'bg-rose-600/25 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{isJapOn ? 'Turn OFF' : 'Turn ON'}</span>
              </button>
            </div>

            {!isJapOn && (
              <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-2.5 font-mono">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-200">
                    JAP IS TURNED OFF • 100% RELIABLESMM GATE ACTIVE
                  </div>
                  <div className="text-amber-300/90 leading-relaxed text-[10.5px]">
                    All likes route exclusively via <strong>ReliableSMM (#7147)</strong> with a <strong>strictly enforced 10+ matrix</strong> (&ge; 10 likes/batch). Micro-parcels (5–9) are automatically consolidated to prevent SMM API order rejection, preserving the exact <strong>Golden Ratio percentages</strong> (3–5% of views) at wholesale rates ($0.0883/1k).
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PLATFORM GATEWAY SELECTOR TABS */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 font-mono text-xs">
        <button
          type="button"
          onClick={() => setActivePlatformTab('instagram')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activePlatformTab === 'instagram'
              ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Instagram Reels Gateway (Smart-Split JAP + ReliableSMM)</span>
        </button>
        <button
          type="button"
          onClick={() => setActivePlatformTab('tiktok')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activePlatformTab === 'tiktok'
              ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>TikTok FYP Gateway (ReliableSMM Direct — Lowest Cost)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white font-bold">
            Live Verified
          </span>
        </button>
      </div>

      {activePlatformTab === 'tiktok' ? (
        /* TIKTOK DIRECT RELIABLESMM GATEWAY */
        <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
                <Workflow className="w-4 h-4" />
                <span>ReliableSMM Direct TikTok FYP Pipeline</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  Wholesale Rates Direct
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Verified, non-drop TikTok services queried directly from ReliableSMM catalog via SMM v2 API (No intermediary markup).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Provider: ReliableSMM Enterprise (Active)</span>
              </span>
            </div>
          </div>

          {/* 5 TikTok Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
            {/* 1. TikTok Video Views */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between text-cyan-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>TikTok Video Views</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  Instant Start • 10M/day
                </span>
              </div>
              <div className="space-y-1 text-slate-300 text-[11px]">
                <div className="text-white font-semibold">Service #7115</div>
                <div className="text-slate-400 text-[10.5px]">TikTok Video Views [Max Unlimited] | Instant Start | Day 10M</div>
                <div className="text-slate-400">Min Quantity: <strong className="text-white">100</strong></div>
              </div>
              <div className="bg-slate-950/90 p-2 rounded-lg border border-cyan-500/30 flex items-center justify-between">
                <span className="text-slate-400">Direct Rate:</span>
                <div className="text-right">
                  <span className="text-cyan-300 font-bold">${pricing.tiktokRates?.views?.ratePer1k || 0.0047} / 1k</span>
                  <div className="text-[9px] text-slate-500">(${((pricing.tiktokRates?.views?.ratePer1k || 0.0047) / 1000).toFixed(7)}/ea)</div>
                </div>
              </div>
            </div>

            {/* 2. TikTok Likes */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-pink-500/30 space-y-3">
              <div className="flex items-center justify-between text-pink-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4" />
                  <span>TikTok Real Likes (10+ Matrix)</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-500/30">
                  100% Real Accounts
                </span>
              </div>
              <div className="space-y-1 text-slate-300 text-[11px]">
                <div className="text-white font-semibold">Service #5851</div>
                <div className="text-slate-400 text-[10.5px]">TikTok Likes [Worldwide 🌍] | 100% Real Accounts | Superinstant</div>
                <div className="text-slate-400">Min Quantity: <strong className="text-white">10</strong></div>
              </div>
              <div className="bg-slate-950/90 p-2 rounded-lg border border-pink-500/30 flex items-center justify-between">
                <span className="text-slate-400">Direct Rate:</span>
                <div className="text-right">
                  <span className="text-pink-300 font-bold">${pricing.tiktokRates?.likes?.ratePer1k || 0.2462} / 1k</span>
                  <div className="text-[9px] text-slate-500">(${((pricing.tiktokRates?.likes?.ratePer1k || 0.2462) / 1000).toFixed(7)}/ea)</div>
                </div>
              </div>
            </div>

            {/* 3. TikTok Video Shares */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Share2 className="w-4 h-4" />
                  <span>TikTok Video Shares</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  Lifetime ♻️ • 500K/day
                </span>
              </div>
              <div className="space-y-1 text-slate-300 text-[11px]">
                <div className="text-white font-semibold">Service #2989</div>
                <div className="text-slate-400 text-[10.5px]">TikTok Video Shares [Max Unlimited] | Lifetime ♻️ | Day 500K</div>
                <div className="text-slate-400">Min Quantity: <strong className="text-white">10</strong></div>
              </div>
              <div className="bg-slate-950/90 p-2 rounded-lg border border-emerald-500/30 flex items-center justify-between">
                <span className="text-slate-400">Direct Rate:</span>
                <div className="text-right">
                  <span className="text-emerald-300 font-bold">${pricing.tiktokRates?.shares?.ratePer1k || 0.0121} / 1k</span>
                  <div className="text-[9px] text-slate-500">(${((pricing.tiktokRates?.shares?.ratePer1k || 0.0121) / 1000).toFixed(7)}/ea)</div>
                </div>
              </div>
            </div>

            {/* 4. TikTok Saves / Favorites */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between text-amber-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4" />
                  <span>TikTok Saves / Favorites</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                  Lifetime ♻️ • 500K/day
                </span>
              </div>
              <div className="space-y-1 text-slate-300 text-[11px]">
                <div className="text-white font-semibold">Service #2980</div>
                <div className="text-slate-400 text-[10.5px]">TikTok Video Saves / Favorites [Lifetime ♻️ | Day 500K]</div>
                <div className="text-slate-400">Min Quantity: <strong className="text-white">10</strong></div>
              </div>
              <div className="bg-slate-950/90 p-2 rounded-lg border border-amber-500/30 flex items-center justify-between">
                <span className="text-slate-400">Direct Rate:</span>
                <div className="text-right">
                  <span className="text-amber-300 font-bold">${pricing.tiktokRates?.saves?.ratePer1k || 0.0121} / 1k</span>
                  <div className="text-[9px] text-slate-500">(${((pricing.tiktokRates?.saves?.ratePer1k || 0.0121) / 1000).toFixed(7)}/ea)</div>
                </div>
              </div>
            </div>

            {/* 5. TikTok Custom Comments (Turned OFF) */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 opacity-80">
              <div className="flex items-center justify-between text-slate-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-slate-500" />
                  <span>TikTok Custom Comments</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30 font-semibold">
                  TURNED OFF (0 ALWAYS)
                </span>
              </div>
              <div className="space-y-1 text-slate-400 text-[11px]">
                <div className="text-slate-300 font-semibold">Service #5287 • Turned OFF</div>
                <div className="text-slate-500 text-[10.5px]">TikTok Custom Comments [Max 50K] | HQ & Real Profiles</div>
                <div className="text-rose-400 font-medium">Comments are disabled across all campaigns (always 0).</div>
              </div>
              <div className="bg-slate-950/90 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-500">Service Status:</span>
                <div className="text-right">
                  <span className="text-rose-400 font-bold">Turned OFF (0 cost)</span>
                  <div className="text-[9px] text-slate-600">No orders dispatched</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SECTION 2: SMART-SPLIT LIKES GATE & PRESET SELECTOR (INSTAGRAM) */
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 font-mono">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Smart-Split Routing Mode & Gate Rules (Instagram)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose routing policy or customize provider service IDs
              </p>
            </div>

            {/* Quick Preset Selector Buttons */}
            <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
              <button
                type="button"
                onClick={() => handleApplyPreset('smart_split')}
                className={`px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer ${
                  routingConfig.mode === 'smart_split'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Smart-Split Gate (Recommended)
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('single_reliable')}
                className={`px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer ${
                  routingConfig.mode === 'single_reliable'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                100% ReliableSMM Only
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('single_jap')}
                className={`px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer ${
                  routingConfig.mode === 'single_jap'
                    ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                100% JAP Only
              </button>
            </div>
          </div>

          {/* Granular Service ID Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
            {/* Micro-Likes Card */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between text-cyan-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4" />
                  <span>Micro-Likes Gate (&lt; 10 likes)</span>
                </span>
                <span className="text-[10px] px-1.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  5–9 Drip
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-slate-400 text-[10px]">Assigned Provider:</label>
                  <select
                    value={routingConfig.microLikes.providerId}
                    onChange={e => setRoutingConfig(prev => ({
                      ...prev,
                      microLikes: { ...prev.microLikes, providerId: e.target.value }
                    }))}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option value="jap">Just Another Panel (JAP)</option>
                    <option value="reliablesmm">ReliableSMM Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 text-[10px]">Service ID (API Param):</label>
                  <input
                    type="number"
                    value={routingConfig.microLikes.serviceId}
                    onChange={e => setRoutingConfig(prev => ({
                      ...prev,
                      microLikes: { ...prev.microLikes, serviceId: Number(e.target.value) }
                    }))}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-cyan-300 font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-[10px]">Service Label:</label>
                  <input
                    type="text"
                    value={routingConfig.microLikes.serviceName}
                    onChange={e => setRoutingConfig(prev => ({
                      ...prev,
                      microLikes: { ...prev.microLikes, serviceName: e.target.value }
                    }))}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-300 text-[11px]"
                  />
                </div>

                {/* Direct Panel Live Rate Badge */}
                <div className="bg-slate-950/90 p-2 rounded-lg border border-cyan-500/30 text-[11px] font-mono flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span>Panel Live Rate:</span>
                  </span>
                  <span className="text-cyan-300 font-bold">
                    ${pricing.rates.microLikes?.ratePer1k || 2.0} / 1k <span className="text-slate-500 text-[10px]">(${((pricing.rates.microLikes?.ratePer1k || 2.0) / 1000).toFixed(4)}/ea)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Macro-Likes Card */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-pink-500/30 space-y-3">
              <div className="flex items-center justify-between text-pink-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4" />
                  <span>Macro-Likes Gate (&ge; 10 likes)</span>
                </span>
                <span className="text-[10px] px-1.5 rounded bg-pink-950 text-pink-300 border border-pink-500/30">
                  10+ Drip
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-slate-400 text-[10px]">Assigned Provider:</label>
                  <select
                    value={routingConfig.macroLikes.providerId}
                    onChange={e => setRoutingConfig(prev => ({
                      ...prev,
                      macroLikes: { ...prev.macroLikes, providerId: e.target.value }
                    }))}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option value="reliablesmm">ReliableSMM Enterprise</option>
                    <option value="jap">Just Another Panel (JAP)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 text-[10px]">Service ID (API Param):</label>
                  <input
                    type="number"
                    value={routingConfig.macroLikes.serviceId}
                    onChange={e => setRoutingConfig(prev => ({
                      ...prev,
                      macroLikes: { ...prev.macroLikes, serviceId: Number(e.target.value) }
                    }))}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-pink-300 font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-[10px]">Service Label:</label>
                  <input
                    type="text"
                    value={routingConfig.macroLikes.serviceName}
                    onChange={e => setRoutingConfig(prev => ({
                      ...prev,
                      macroLikes: { ...prev.macroLikes, serviceName: e.target.value }
                    }))}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-300 text-[11px]"
                  />
                </div>

                {/* Direct Panel Live Rate Badge */}
                <div className="bg-slate-950/90 p-2 rounded-lg border border-pink-500/30 text-[11px] font-mono flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse"></span>
                    <span>Panel Live Rate:</span>
                  </span>
                  <span className="text-pink-300 font-bold">
                    ${pricing.rates.macroLikes?.ratePer1k || 0.0883} / 1k <span className="text-slate-500 text-[10px]">(${((pricing.rates.macroLikes?.ratePer1k || 0.0883) / 1000).toFixed(6)}/ea)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Views Highway Card */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>Views Highway (Min 100)</span>
                </span>
                <span className="text-[10px] px-1.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  Retention Views
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-slate-400 text-[10px]">Assigned Provider:</label>
                  <select
                    value={routingConfig.views.providerId}
                    onChange={e => setRoutingConfig(prev => ({
                      ...prev,
                      views: { ...prev.views, providerId: e.target.value }
                    }))}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option value="reliablesmm">ReliableSMM Enterprise</option>
                    <option value="jap">Just Another Panel (JAP)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 text-[10px]">Service ID (API Param):</label>
                  <input
                    type="number"
                    value={routingConfig.views.serviceId}
                    onChange={e => setRoutingConfig(prev => ({
                      ...prev,
                      views: { ...prev.views, serviceId: Number(e.target.value) }
                    }))}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-emerald-300 font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-[10px]">Service Label:</label>
                  <input
                    type="text"
                    value={routingConfig.views.serviceName}
                    onChange={e => setRoutingConfig(prev => ({
                      ...prev,
                      views: { ...prev.views, serviceName: e.target.value }
                    }))}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-300 text-[11px]"
                  />
                </div>

                {/* Direct Panel Live Rate Badge */}
                <div className="bg-slate-950/90 p-2 rounded-lg border border-emerald-500/30 text-[11px] font-mono flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Panel Live Rate:</span>
                  </span>
                  <span className="text-emerald-300 font-bold">
                    ${pricing.rates.views?.ratePer1k || 0.0007} / 1k <span className="text-slate-500 text-[10px]">(${((pricing.rates.views?.ratePer1k || 0.0007) / 1000).toFixed(7)}/ea)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Saves Card */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between text-amber-400 font-bold">
                <span>Targeted Saves</span>
                <span className="text-[10px] text-slate-400">Min 1</span>
              </div>
              <div>
                <label className="text-slate-400 text-[10px]">Service ID (ReliableSMM):</label>
                <input
                  type="number"
                  value={routingConfig.saves.serviceId}
                  onChange={e => setRoutingConfig(prev => ({
                    ...prev,
                    saves: { ...prev.saves, serviceId: Number(e.target.value) }
                  }))}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-amber-300 font-bold"
                />
              </div>
              <div className="bg-slate-950/90 p-1.5 rounded-lg border border-amber-500/30 text-[10px] font-mono flex items-center justify-between">
                <span className="text-slate-400">Direct Rate:</span>
                <span className="text-amber-300 font-bold">${pricing.rates.saves?.ratePer1k || 0.0367} / 1k</span>
              </div>
            </div>

            {/* Reposts Card */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between text-indigo-400 font-bold">
                <span>Reposts / Network Shares</span>
                <span className="text-[10px] text-slate-400">Min 1</span>
              </div>
              <div>
                <label className="text-slate-400 text-[10px]">Service ID (ReliableSMM):</label>
                <input
                  type="number"
                  value={routingConfig.reposts.serviceId}
                  onChange={e => setRoutingConfig(prev => ({
                    ...prev,
                    reposts: { ...prev.reposts, serviceId: Number(e.target.value) }
                  }))}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-indigo-300 font-bold"
                />
              </div>
              <div className="bg-slate-950/90 p-1.5 rounded-lg border border-indigo-500/30 text-[10px] font-mono flex items-center justify-between">
                <span className="text-slate-400">Direct Rate:</span>
                <span className="text-indigo-300 font-bold">${pricing.rates.reposts?.ratePer1k || 0.2757} / 1k</span>
              </div>
            </div>

            {/* Social Shares Card */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between text-purple-400 font-bold">
                <span>Viral DM Shares</span>
                <span className="text-[10px] text-slate-400">Min 10</span>
              </div>
              <div>
                <label className="text-slate-400 text-[10px]">Service ID (ReliableSMM):</label>
                <input
                  type="number"
                  value={routingConfig.shares.serviceId}
                  onChange={e => setRoutingConfig(prev => ({
                    ...prev,
                    shares: { ...prev.shares, serviceId: Number(e.target.value) }
                  }))}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-purple-300 font-bold"
                />
              </div>
              <div className="bg-slate-950/90 p-1.5 rounded-lg border border-purple-500/30 text-[10px] font-mono flex items-center justify-between">
                <span className="text-slate-400">Direct Rate:</span>
                <span className="text-purple-300 font-bold">${pricing.rates.shares?.ratePer1k || 0.0115} / 1k</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: LIVE GATEWAY TEST CONSOLE */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2 font-mono">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>Interactive Protocol Dispatch Simulator</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Action: 'add' Payload Test</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-mono text-xs">
          {/* Dispatch Settings */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div>
              <label className="block text-slate-400 mb-1">Simulator Platform</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setSimPlatform('instagram');
                    setTestMetric('micro_likes');
                    setTestQuantity(7);
                    setTestLink('https://www.instagram.com/reel/C89viralXYZ/');
                  }}
                  className={`py-1.5 px-2 rounded font-bold cursor-pointer transition-all ${
                    simPlatform === 'instagram'
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Instagram
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimPlatform('tiktok');
                    setTestMetric('tiktok_views');
                    setTestQuantity(150);
                    setTestLink('https://www.tiktok.com/@tiktok/video/7123456789012345678');
                  }}
                  className={`py-1.5 px-2 rounded font-bold cursor-pointer transition-all ${
                    simPlatform === 'tiktok'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  TikTok Direct
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Metric Type to Route</label>
              <select
                value={testMetric}
                onChange={(e) => {
                  const m = e.target.value as any;
                  setTestMetric(m);
                  if (simPlatform === 'tiktok') {
                    if (m === 'tiktok_views' || m === 'views') setTestQuantity(150);
                    else if (m === 'tiktok_likes' || m === 'likes') setTestQuantity(15);
                    else if (m === 'tiktok_shares' || m === 'shares') setTestQuantity(15);
                    else if (m === 'tiktok_saves' || m === 'saves') setTestQuantity(12);
                    else setTestQuantity(3);
                  } else {
                    if (m === 'micro_likes') setTestQuantity(7);
                    else if (m === 'macro_likes') setTestQuantity(25);
                    else if (m === 'views') setTestQuantity(150);
                    else if (m === 'saves') setTestQuantity(5);
                    else if (m === 'shares') setTestQuantity(15);
                    else setTestQuantity(2);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white"
              >
                {simPlatform === 'tiktok' ? (
                  <>
                    <option value="tiktok_views">TikTok Video Views (#7115 • $0.0047/1k, min 100)</option>
                    <option value="tiktok_likes">TikTok Real Likes (#5851 • $0.2462/1k, min 10)</option>
                    <option value="tiktok_shares">TikTok Video Shares (#2989 • $0.0121/1k, min 10)</option>
                    <option value="tiktok_saves">TikTok Saves / Favorites (#2980 • $0.0121/1k, min 10)</option>
                    <option value="tiktok_comments">TikTok Custom Comments (#5287 • $0.6432/1k, min 1)</option>
                  </>
                ) : (
                  <>
                    <option value="micro_likes">Micro-Likes (5 to 9 units) [JAP #1778]</option>
                    <option value="macro_likes">Macro-Likes (10+ units) [ReliableSMM #7147]</option>
                    <option value="views">Views Highway (100+ units) [ReliableSMM #8024]</option>
                    <option value="saves">Saves (1+ units) [ReliableSMM #7841]</option>
                    <option value="shares">Shares (10+ units) [ReliableSMM #2060]</option>
                    <option value="reposts">Reposts (1+ units) [ReliableSMM #7842]</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Quantity</label>
              <input
                type="number"
                value={testQuantity}
                onChange={(e) => setTestQuantity(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Target URL</label>
              <input
                type="text"
                value={testLink}
                onChange={(e) => setTestLink(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white truncate"
              />
            </div>

            <button
              onClick={handleSimulateDispatch}
              disabled={isSimulating}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSimulating ? 'Routing Dispatch...' : 'Dispatch SMM v2 Packet'}</span>
            </button>
          </div>

          {/* Computed Gateway Decision & Payload Inspect */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span>Active Route: <strong className="text-white">{currentRoute.provider}</strong></span>
              <span className="text-teal-400 font-bold">Service #{currentRoute.serviceId}</span>
            </div>

            {dispatchResult ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Dispatch Confirmed! Order ID: <strong>{dispatchResult.orderId}</strong></span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-400 mb-1 font-semibold">Outgoing Request Body (POST):</div>
                    <pre className="text-cyan-300 overflow-x-auto">
                      {JSON.stringify(dispatchResult.requestPayload, null, 2)}
                    </pre>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-400 mb-1 font-semibold">Incoming Response Body:</div>
                    <pre className="text-emerald-300 overflow-x-auto">
                      {JSON.stringify(dispatchResult.responsePayload, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-center">
                <Workflow className="w-8 h-8 mb-2 opacity-50" />
                <p>Click "Dispatch SMM v2 Packet" to test payload transmission.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
