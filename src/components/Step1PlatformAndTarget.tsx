import React, { useState, useEffect } from 'react';
import { 
  Instagram, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Globe
} from 'lucide-react';
import { Platform } from '../types';
import { parseTargetUrl } from '../utils/algorithmicEngine';

interface Step1Props {
  platform: Platform;
  setPlatform: (p: Platform) => void;
  targetUrl: string;
  setTargetUrl: (url: string) => void;
  handle: string;
  setHandle: (h: string) => void;
  organicMode: boolean;
  setOrganicMode: (m: boolean) => void;
  campaignName: string;
  setCampaignName: (name: string) => void;
}

export const Step1PlatformAndTarget: React.FC<Step1Props> = ({
  platform,
  setPlatform,
  targetUrl,
  setTargetUrl,
  handle,
  setHandle,
  organicMode,
  setOrganicMode,
  campaignName,
  setCampaignName,
}) => {
  const [urlStatus, setUrlStatus] = useState<{
    isValid: boolean;
    handle: string;
    cleanUrl: string;
    errorMessage?: string;
  }>({ isValid: false, handle: '', cleanUrl: '' });

  // Real-time URL validation
  useEffect(() => {
    if (!targetUrl) {
      setUrlStatus({ isValid: false, handle: '', cleanUrl: '' });
      return;
    }
    const result = parseTargetUrl(targetUrl, platform);
    setUrlStatus(result);
    if (result.isValid && result.handle) {
      setHandle(result.handle);
    }
  }, [targetUrl, platform, setHandle]);

  const loadSampleUrl = (sample: string, defaultName: string) => {
    setTargetUrl(sample);
    if (!campaignName || campaignName.startsWith('Campaign #')) {
      setCampaignName(defaultName);
    }
  };

  return (
    <div className="space-y-6">
      {/* Campaign Name & Overview */}
      <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl transition-colors">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 font-mono">
          Campaign Identifier
        </label>
        <input
          type="text"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          placeholder="e.g. Viral Reels Drip - Summer Drop #01"
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
        />
      </div>

      {/* Step 1: Platform Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Instagram Reels Card */}
        <div
          onClick={() => setPlatform('instagram')}
          className={`cursor-pointer relative overflow-hidden rounded-2xl border p-5 transition-all ${
            platform === 'instagram'
              ? 'bg-gradient-to-br from-pink-500/10 via-white to-purple-500/10 dark:from-purple-950/40 dark:via-slate-900 dark:to-pink-950/20 border-pink-500 shadow-md shadow-pink-500/10'
              : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                <Instagram className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <span>Instagram Reels</span>
                  {platform === 'instagram' && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 border border-pink-300 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-500/30 font-bold">
                      Selected
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Explore & Reels Algorithmic Push
                </p>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
              platform === 'instagram' 
                ? 'border-pink-500 bg-pink-500 text-white' 
                : 'border-slate-300 dark:border-slate-700'
            }`}>
              {platform === 'instagram' && <CheckCircle2 className="w-4 h-4" />}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400">Indian IG Views + Smart Split Likes</span>
            <span className="text-pink-600 dark:text-pink-400 font-semibold">Active Route</span>
          </div>
        </div>

        {/* TikTok Card */}
        <div
          onClick={() => setPlatform('tiktok')}
          className={`cursor-pointer relative overflow-hidden rounded-2xl border p-5 transition-all ${
            platform === 'tiktok'
              ? 'bg-gradient-to-br from-cyan-500/10 via-white to-slate-50 dark:from-cyan-950/40 dark:via-slate-900 dark:to-rose-950/20 border-cyan-500 shadow-md shadow-cyan-500/10'
              : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-cyan-400 shadow-md">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.86-4.49v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.86-.09z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <span>TikTok Video</span>
                  {platform === 'tiktok' && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 border border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30 font-bold">
                      Selected
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  FYP Completion Velocity Drip
                </p>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
              platform === 'tiktok' 
                ? 'border-cyan-500 bg-cyan-500 text-white' 
                : 'border-slate-300 dark:border-slate-700'
            }`}>
              {platform === 'tiktok' && <CheckCircle2 className="w-4 h-4" />}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400">FYP Acceleration Gateway</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Active Route</span>
          </div>
        </div>
      </div>

      {/* URL Input & Handle Extraction */}
      <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 font-mono">
            <span>Target Video URL</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
              Auto Validation
            </span>
          </label>

          {/* Quick preset links */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Quick Test Samples:</span>
            {platform === 'instagram' ? (
              <button
                type="button"
                onClick={() => loadSampleUrl('https://www.instagram.com/reel/C8qXYZ99abc/', 'IG Reel Viral Drip #44')}
                className="text-pink-600 dark:text-pink-400 hover:underline font-mono text-[11px] cursor-pointer"
              >
                Sample Reel URL
              </button>
            ) : (
              <button
                type="button"
                onClick={() => loadSampleUrl('https://www.tiktok.com/@growthmentor/video/73829104857102948', 'TikTok FYP Push #12')}
                className="text-cyan-600 dark:text-cyan-400 hover:underline font-mono text-[11px] cursor-pointer"
              >
                Sample TikTok URL
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder={
              platform === 'instagram'
                ? 'https://www.instagram.com/reel/C8qXYZ99abc/ or https://instagram.com/p/...'
                : 'https://www.tiktok.com/@username/video/7123456789012345678'
            }
            className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl pl-4 pr-10 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none transition-all ${
              targetUrl
                ? urlStatus.isValid
                  ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  : 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : 'border-slate-300 dark:border-slate-800 focus:border-purple-500'
            }`}
          />
          <div className="absolute right-3 top-3.5">
            {targetUrl && (
              urlStatus.isValid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500" />
              )
            )}
          </div>
        </div>

        {/* Validation Feedback & Handle Extractor */}
        {targetUrl && (
          <div className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            urlStatus.isValid 
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200' 
              : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              {urlStatus.isValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>
                {urlStatus.isValid
                  ? `Target URL validated: ${urlStatus.cleanUrl}`
                  : (urlStatus.errorMessage || 'Invalid URL format')}
              </span>
            </div>

            {urlStatus.isValid && (
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-500 dark:text-slate-400">Extracted Handle:</span>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-500/30">
                  {handle || urlStatus.handle || '@target_creator'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Handle Manual Override */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Target Username Handle
            </label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@username"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Dispatch Target
            </label>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 transition-colors">
              <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Public Video Post Link Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Organic Mode Toggle */}
      <div className={`p-5 rounded-2xl border transition-all ${
        organicMode 
          ? 'bg-gradient-to-r from-emerald-500/10 via-white to-slate-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900/60 border-emerald-500/40 shadow-sm dark:shadow-emerald-500/5'
          : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              organicMode 
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40' 
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Organic Anti-Detection Mode
                </h4>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                  organicMode 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30' 
                    : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                }`}>
                  {organicMode ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Automatically activates humanized circadian curve dips, strict organic ratio guardrails, warm-up views seed chunks, and micro-variance.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
            <input
              type="checkbox"
              checked={organicMode}
              onChange={(e) => setOrganicMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
      </div>
    </div>
  );
};
