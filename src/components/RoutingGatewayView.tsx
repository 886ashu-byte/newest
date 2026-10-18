import React, { useState } from 'react';
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
  Server
} from 'lucide-react';
import { DEFAULT_ROUTING_CONFIG } from '../utils/algorithmicEngine';

export const RoutingGatewayView: React.FC = () => {
  const [testMetric, setTestMetric] = useState<'views' | 'micro_likes' | 'macro_likes' | 'saves' | 'shares' | 'reposts'>('micro_likes');
  const [testQuantity, setTestQuantity] = useState<number>(7);
  const [testLink, setTestLink] = useState('https://www.instagram.com/reel/C8qXYZ99abc/');
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Compute live routing decision
  const getRoutingDecision = (metric: string, qty: number) => {
    if (metric === 'views') {
      return {
        provider: 'ReliableSMM',
        serviceId: 8024,
        serviceName: 'Instagram High-Retention Views [Service 8024]',
        min: 10,
        type: 'Views Highway'
      };
    }
    if (metric === 'micro_likes' || (metric === 'likes' && qty < 10)) {
      return {
        provider: 'Just Another Panel (JAP)',
        serviceId: 1778,
        serviceName: 'Instagram Micro-Likes [5-9 Drip]',
        min: 5,
        type: 'Micro-Likes Branch'
      };
    }
    if (metric === 'macro_likes' || (metric === 'likes' && qty >= 10)) {
      return {
        provider: 'ReliableSMM',
        serviceId: 7147,
        serviceName: 'Instagram Macro-Likes [Active Profile Drip]',
        min: 10,
        type: 'Macro-Likes Branch'
      };
    }
    if (metric === 'saves') {
      return {
        provider: 'ReliableSMM',
        serviceId: 7841,
        serviceName: 'Targeted Saves [Organic Signal]',
        min: 1,
        type: 'Saves Route'
      };
    }
    if (metric === 'shares') {
      return {
        provider: 'ReliableSMM',
        serviceId: 2060,
        serviceName: 'Viral Social Shares',
        min: 10,
        type: 'Shares Route'
      };
    }
    return {
      provider: 'ReliableSMM',
      serviceId: 7842,
      serviceName: 'Targeted Reposts / Shares v2',
      min: 1,
      type: 'Reposts Route'
    };
  };

  const currentRoute = getRoutingDecision(testMetric, testQuantity);

  const handleSimulateDispatch = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
      setDispatchResult({
        timestamp: new Date().toISOString(),
        targetUrl: testLink,
        metric: testMetric,
        quantity: testQuantity,
        provider: currentRoute.provider,
        serviceId: currentRoute.serviceId,
        orderId,
        requestPayload: {
          key: '••••••••',
          action: 'add',
          service: currentRoute.serviceId,
          link: testLink,
          quantity: testQuantity,
        },
        responsePayload: {
          order: orderId,
          status: 'success',
          charge: (testQuantity / 1000 * 0.35).toFixed(4),
          currency: 'USD',
          remains: testQuantity,
        }
      });
      setIsSimulating(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Workflow className="w-5 h-5 text-teal-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Multi-Provider Routing Gateway (SMM v2 Protocol)
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
            Automated Traffic Router
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Intelligent payload inspection dynamically routes micro-volumes vs macro-volumes to optimal parent panels, evading minimum order limits and bot velocity flags.
        </p>
      </div>

      {/* Visual Routing Architecture Flowchart */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2 font-mono">
          <span>SMM v2 Gateway Routing Matrix</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs font-mono">
          {/* Node 1: Views Route */}
          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-4 space-y-2.5 relative">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Eye className="w-4 h-4" />
              <span>Views Highway</span>
            </div>
            <div className="text-[11px] text-slate-300">
              Condition: All View Chunks
            </div>
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400">Target Panel:</div>
              <div className="font-bold text-white">ReliableSMM</div>
              <div className="text-emerald-400 text-[11px]">Service #8024</div>
              <div className="text-[10px] text-slate-500">Min 10 • High-Retention Views</div>
            </div>
          </div>

          {/* Node 2: Micro-Likes Route */}
          <div className="bg-slate-900/80 border border-cyan-500/30 rounded-xl p-4 space-y-2.5 relative">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Heart className="w-4 h-4" />
              <span>Micro-Likes</span>
            </div>
            <div className="text-[11px] text-slate-300">
              Condition: 5 to 9 Likes
            </div>
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400">Target Panel:</div>
              <div className="font-bold text-white">Just Another Panel (JAP)</div>
              <div className="text-cyan-400 text-[11px]">Service #1778</div>
              <div className="text-[10px] text-slate-500">Min 5 • Micro-Drip</div>
            </div>
          </div>

          {/* Node 3: Macro-Likes Route */}
          <div className="bg-slate-900/80 border border-pink-500/30 rounded-xl p-4 space-y-2.5 relative">
            <div className="flex items-center gap-2 text-pink-400 font-bold">
              <Heart className="w-4 h-4" />
              <span>Macro-Likes</span>
            </div>
            <div className="text-[11px] text-slate-300">
              Condition: 10+ Likes
            </div>
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400">Target Panel:</div>
              <div className="font-bold text-white">ReliableSMM</div>
              <div className="text-pink-400 text-[11px]">Service #7147</div>
              <div className="text-[10px] text-slate-500">Min 10 • Real Profile Drip</div>
            </div>
          </div>

          {/* Node 4: Saves Route */}
          <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-4 space-y-2.5 relative">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Bookmark className="w-4 h-4" />
              <span>Targeted Saves</span>
            </div>
            <div className="text-[11px] text-slate-300">
              Condition: 1+ Saves
            </div>
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400">Target Panel:</div>
              <div className="font-bold text-white">ReliableSMM</div>
              <div className="text-amber-400 text-[11px]">Service #7841</div>
              <div className="text-[10px] text-slate-500">Min 1 • High Organic Weight</div>
            </div>
          </div>

          {/* Node 5: Shares & Reposts */}
          <div className="bg-slate-900/80 border border-purple-500/30 rounded-xl p-4 space-y-2.5 relative">
            <div className="flex items-center gap-2 text-purple-400 font-bold">
              <Share2 className="w-4 h-4" />
              <span>Shares & Reposts</span>
            </div>
            <div className="text-[11px] text-slate-300">
              Condition: Shares (10+), Reposts (1+)
            </div>
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400">Target Panel:</div>
              <div className="font-bold text-white">ReliableSMM</div>
              <div className="text-purple-400 text-[11px]">Shares #2060 / Reposts #7842</div>
              <div className="text-[10px] text-slate-500">Viral Distribution Pipeline</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Gateway Test Console */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2 font-mono">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>Interactive Protocol Dispatch Simulator</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Action: 'add' Payload Test</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Dispatch Settings */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-mono">Metric Type to Route</label>
              <select
                value={testMetric}
                onChange={(e) => {
                  const m = e.target.value as any;
                  setTestMetric(m);
                  if (m === 'micro_likes') setTestQuantity(7);
                  else if (m === 'macro_likes') setTestQuantity(25);
                  else if (m === 'views') setTestQuantity(150);
                  else if (m === 'saves') setTestQuantity(5);
                  else if (m === 'shares') setTestQuantity(15);
                  else setTestQuantity(2);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white font-mono"
              >
                <option value="views">Views (Indian IG Views)</option>
                <option value="micro_likes">Micro-Likes (5 to 9 units)</option>
                <option value="macro_likes">Macro-Likes (10+ units)</option>
                <option value="saves">Saves (Min 1)</option>
                <option value="shares">Shares (Min 10)</option>
                <option value="reposts">Reposts (Min 1)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-mono">Quantity</label>
              <input
                type="number"
                value={testQuantity}
                onChange={(e) => setTestQuantity(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-mono">Target URL</label>
              <input
                type="text"
                value={testLink}
                onChange={(e) => setTestLink(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white font-mono truncate"
              />
            </div>

            <button
              onClick={handleSimulateDispatch}
              disabled={isSimulating}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold font-mono transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSimulating ? 'Routing Dispatch...' : 'Dispatch SMM v2 Packet'}</span>
            </button>
          </div>

          {/* Computed Gateway Decision & Payload Inspect */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span>Selected Route: <strong className="text-white">{currentRoute.provider}</strong></span>
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
