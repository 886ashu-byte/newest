import React, { useState, useEffect, useRef } from 'react';
import { 
  Instagram, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ShieldAlert,
  Globe,
  Layers,
  Upload,
  Sparkles,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  Link,
  Users
} from 'lucide-react';
import { Platform, BulkUrlItem, CampaignMetrics } from '../types';
import { parseTargetUrl, computeGoldenRatioMetrics } from '../utils/algorithmicEngine';

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
  autoPauseOnServiceFailure?: boolean;
  setAutoPauseOnServiceFailure?: (val: boolean) => void;
  // Bulk URLs Support
  isBulkMode?: boolean;
  setIsBulkMode?: (val: boolean) => void;
  bulkRawText?: string;
  setBulkRawText?: (text: string) => void;
  bulkUrls?: BulkUrlItem[];
  setBulkUrls?: React.Dispatch<React.SetStateAction<BulkUrlItem[]>>;
  groupName?: string;
  setGroupName?: (name: string) => void;
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
  autoPauseOnServiceFailure = true,
  setAutoPauseOnServiceFailure,
  isBulkMode = false,
  setIsBulkMode,
  bulkRawText = '',
  setBulkRawText,
  bulkUrls = [],
  setBulkUrls,
  groupName = 'Viral Reels Algorithmic Fleet #01',
  setGroupName,
}) => {
  const [urlStatus, setUrlStatus] = useState<{
    isValid: boolean;
    handle: string;
    cleanUrl: string;
    errorMessage?: string;
  }>({ isValid: false, handle: '', cleanUrl: '' });

  const [isPreviewExpanded, setIsPreviewExpanded] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Real-time Single URL validation
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

  // Real-time Bulk URLs Parser (up to 1,000 URLs)
  useEffect(() => {
    if (!isBulkMode || !setBulkUrls) return;

    if (!bulkRawText || !bulkRawText.trim()) {
      setBulkUrls([]);
      return;
    }

    const lines = bulkRawText
      .split(/[\r\n,]+/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const parsedItems: BulkUrlItem[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < Math.min(lines.length, 1000); i++) {
      const rawLine = lines[i];
      if (seen.has(rawLine)) continue;
      seen.add(rawLine);

      const parsed = parseTargetUrl(rawLine, platform);
      const cleanUrl = parsed.cleanUrl || rawLine;
      const extractedHandle = parsed.handle || (rawLine.includes('@') ? '@' + rawLine.split('@')[1].split('/')[0] : `@creator_${i + 1}`);

      parsedItems.push({
        id: `bulk_reel_${i}_${Date.now().toString(36)}`,
        url: rawLine,
        cleanUrl,
        handle: extractedHandle,
        isValid: parsed.isValid,
        assignedMetrics: computeGoldenRatioMetrics(5000),
      });
    }

    setBulkUrls(parsedItems);
  }, [bulkRawText, isBulkMode, platform, setBulkUrls]);

  // Load 5 sample videos for instant testing
  const handleLoadSampleUrls = () => {
    const sampleUrls = platform === 'tiktok' ? [
      'https://www.tiktok.com/@tiktok/video/7123456789012345678',
      'https://www.tiktok.com/@khaby.lame/video/7100000000000000000',
      'https://www.tiktok.com/@zachking/video/7155555555555555555',
      'https://www.tiktok.com/@charlidamelio/video/7188888888888888888',
      'https://www.tiktok.com/@bellapoarch/video/7199999999999999999',
    ] : [
      'https://www.instagram.com/reel/DD1rB4wSpK9/',
      'https://www.instagram.com/reel/DD7hT82oJ6m/',
      'https://www.instagram.com/reel/DEAcQ81pq3L/',
      'https://www.instagram.com/reel/DEFm9tqR8vB/',
      'https://www.instagram.com/reel/DEH-271xZy0/',
    ];
    if (setBulkRawText) {
      setBulkRawText(sampleUrls.join('\n'));
    }
    if (setGroupName && (!groupName || groupName.includes('Fleet #01'))) {
      setGroupName(platform === 'tiktok' ? 'TikTok Viral FYP Fleet #01' : 'Instagram Reels Viral Drop #01');
    }
  };

  // Upload .txt / .csv file of URLs
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text && setBulkRawText) {
        setBulkRawText(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const validBulkCount = bulkUrls.filter(u => u.isValid).length;
  const invalidBulkCount = bulkUrls.length - validBulkCount;

  return (
    <div className="space-y-6">
      {/* Campaign Mode Switcher: Single vs Bulk URLs */}
      {setIsBulkMode && (
        <div className="bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBulkMode(false)}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold font-mono transition-all cursor-pointer ${
              !isBulkMode
                ? 'bg-white dark:bg-slate-950 text-purple-600 dark:text-purple-400 shadow-sm border border-slate-200 dark:border-purple-500/30'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Single Reel Campaign</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBulkMode(true)}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold font-mono transition-all cursor-pointer ${
              isBulkMode
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Bulk URLs Fleet (1 – 1,000 Reels)</span>
            <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
              Group Mode
            </span>
          </button>
        </div>
      )}

      {/* Campaign / Group Identifier */}
      <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl transition-colors">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 font-mono">
          {isBulkMode ? 'Bulk Campaign Fleet / Group Name' : 'Campaign Identifier'}
        </label>
        <input
          type="text"
          value={isBulkMode ? groupName : campaignName}
          onChange={(e) => {
            if (isBulkMode && setGroupName) {
              setGroupName(e.target.value);
            } else {
              setCampaignName(e.target.value);
            }
          }}
          placeholder={isBulkMode ? "e.g. Summer Viral Reels Fleet #01 (25 Reels)" : "e.g. Viral Reels Drip - Summer Drop #01"}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
        />
        {isBulkMode && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1.5">
            All reels added below will run together and show in Active Campaigns grouped under this single fleet folder.
          </p>
        )}
      </div>

      {/* Platform Selection */}
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
                  FYP Acceleration Velocity Drip
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
            <span className="text-slate-500 dark:text-slate-400">ReliableSMM Direct (#7115 Views $0.0047/1k, #5851 Likes, #2989 Shares)</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Active Route</span>
          </div>
        </div>
      </div>

      {/* TARGET INPUT: BULK URLS MODE */}
      {isBulkMode ? (
        <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 font-mono">
                <span>Bulk Target URLs (Up to 1,000 Reels)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-mono font-bold">
                  {bulkUrls.length} Detected
                </span>
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Paste one URL per line, comma-separated, or upload a .txt / .csv file.
              </p>
            </div>

            {/* Bulk Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap font-mono">
              <button
                type="button"
                onClick={handleLoadSampleUrls}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs transition-colors cursor-pointer"
                title="Paste 5 example Instagram reels"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load 5 Samples</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload List</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {bulkUrls.length > 0 && setBulkRawText && (
                <button
                  type="button"
                  onClick={() => setBulkRawText('')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs transition-colors cursor-pointer"
                  title="Clear all URLs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Large Bulk Textarea */}
          <div className="relative">
            <textarea
              rows={6}
              value={bulkRawText}
              onChange={(e) => setBulkRawText && setBulkRawText(e.target.value)}
              placeholder={`https://www.instagram.com/reel/DE-96v6s...
https://www.instagram.com/reel/DF_128a...
https://www.instagram.com/reel/DG_943c...
(Paste up to 1,000 URLs here)`}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono leading-relaxed"
            />
          </div>

          {/* Parse Summary Bar */}
          {bulkUrls.length > 0 && (
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{validBulkCount} Valid Reels</span>
                </div>
                {invalidBulkCount > 0 && (
                  <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                    <AlertCircle className="w-4 h-4" />
                    <span>{invalidBulkCount} Unverified Links</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer text-xs"
              >
                <span>{isPreviewExpanded ? 'Hide Verified List' : `View ${bulkUrls.length} Parsed Reels`}</span>
                {isPreviewExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Collapsible Verified URLs Preview Table */}
          {bulkUrls.length > 0 && isPreviewExpanded && (
            <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/60 p-2 space-y-1.5 scrollbar-thin">
              {bulkUrls.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/60 text-xs font-mono gap-2"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-6 text-center text-slate-400 font-bold">#{idx + 1}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold shrink-0">
                      {item.handle}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 truncate">
                      {item.cleanUrl}
                    </span>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    {item.isValid ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-500 text-[10px]">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Custom Link</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* SINGLE URL INPUT MODE */
        <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 font-mono">
              <span>Target Video URL</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                Auto Validation
              </span>
            </label>
          </div>

          <div className="relative">
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder={
                platform === 'instagram'
                  ? 'https://www.instagram.com/reel/XXXXXXXXXXX/ or https://instagram.com/p/...'
                  : 'https://www.tiktok.com/@username/video/1234567890123456789'
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
      )}

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

      {/* Auto-Pause Circuit Breaker on Service Outage Toggle */}
      {setAutoPauseOnServiceFailure && (
        <div className={`p-5 rounded-2xl border transition-all ${
          autoPauseOnServiceFailure 
            ? 'bg-gradient-to-r from-purple-500/10 via-white to-slate-50 dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900/60 border-purple-500/40 shadow-sm dark:shadow-purple-500/5'
            : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                autoPauseOnServiceFailure 
                  ? 'bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/40' 
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Auto-Pause on Service Outage
                  </h4>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                    autoPauseOnServiceFailure 
                      ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30' 
                      : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}>
                    {autoPauseOnServiceFailure ? 'AUTO-PAUSE ACTIVE' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Automatically pauses the campaign immediately if any SMM provider API reports an error, insufficient balance, or unavailable service, preventing wasted budget.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={autoPauseOnServiceFailure}
                onChange={(e) => setAutoPauseOnServiceFailure(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
