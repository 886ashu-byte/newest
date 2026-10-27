import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  FastForward, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Heart, 
  MessageSquare, 
  Bookmark, 
  Share2, 
  Activity, 
  ChevronRight, 
  RefreshCw,
  Zap,
  Server,
  Layers,
  Sparkles,
  Trash2,
  FileText,
  X,
  Edit3,
  Copy,
  ShieldAlert,
  AlertTriangle,
  Save,
  Sliders,
  Globe,
  SunMoon,
  Rocket,
  TrendingUp,
  Flame,
  ShieldCheck,
  CheckSquare,
  Square,
  Filter,
  Search,
  Download,
  Upload,
  ArrowUpDown,
  SlidersHorizontal,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Campaign, ScheduledBatch, AlgorithmicCurve } from '../types';
import { generateCampaignBatches, parseTargetUrl, computeGoldenRatioMetrics } from '../utils/algorithmicEngine';

interface ActiveSchedulerProps {
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  onFastForwardBatch: (campaignId: string) => void;
  onPauseCampaign: (campaignId: string) => void;
  onResumeCampaign: (campaignId: string) => void;
  onDeleteCampaign: (campaignId: string) => void;
  onSelectCampaignForWizard?: (campaign: Campaign) => void;
  onEditCampaign?: (campaign: Campaign) => Promise<void>;
  onCloneCampaign?: (campaignId: string, customPayload?: any) => Promise<any>;
}

export const ActiveSchedulerView: React.FC<ActiveSchedulerProps> = ({
  campaigns,
  setCampaigns,
  onFastForwardBatch,
  onPauseCampaign,
  onResumeCampaign,
  onDeleteCampaign,
  onSelectCampaignForWizard,
  onEditCampaign,
  onCloneCampaign,
}) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    campaigns.length > 0 ? campaigns[0].id : null
  );
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [inspectBatch, setInspectBatch] = useState<ScheduledBatch | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [editModalCampaign, setEditModalCampaign] = useState<Campaign | null>(null);
  const [editForm, setEditForm] = useState<{
    id: string;
    name: string;
    targetUrl: string;
    handle: string;
    autoPauseOnServiceFailure: boolean;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    reposts: number;
    durationHours: number;
    minMins: number;
    maxMins: number;
    curve: AlgorithmicCurve;
    rebalancePendingBatches: boolean;
  } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Clone with Customize Modal State
  const [cloneModalCampaign, setCloneModalCampaign] = useState<Campaign | null>(null);
  const [cloneForm, setCloneForm] = useState<{
    sourceId: string;
    name: string;
    targetUrl: string;
    handle: string;
    autoPauseOnServiceFailure: boolean;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    reposts: number;
    durationHours: number;
    minMins: number;
    maxMins: number;
    curve: AlgorithmicCurve;
  } | null>(null);
  const [isSubmittingClone, setIsSubmittingClone] = useState(false);

  // Advanced Multiple Selection & Fleet Management
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'paused' | 'auto_paused' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'progress' | 'name' | 'batches'>('recent');
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkEditForm, setBulkEditForm] = useState<{
    autoPauseOnServiceFailure?: boolean;
    curve?: AlgorithmicCurve;
    minMins: number;
    maxMins: number;
    durationHours?: number;
    rebalancePendingBatches: boolean;
  }>({
    autoPauseOnServiceFailure: true,
    curve: 'trending_rocket',
    minMins: 20,
    maxMins: 35,
    rebalancePendingBatches: true
  });
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isSavingToServer, setIsSavingToServer] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pastedJsonText, setPastedJsonText] = useState('');
  const [expandedGroupIds, setExpandedGroupIds] = useState<Record<string, boolean>>({});

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroupIds(prev => ({
      ...prev,
      [groupId]: prev[groupId] === false ? true : false
    }));
  };

  const handleGroupPause = async (groupId: string) => {
    try {
      const res = await fetch(`/api/campaigns/group/${groupId}/pause`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.campaigns) setCampaigns(data.campaigns);
        setToastMsg({ text: `Paused all campaigns in group`, type: 'info' });
      }
    } catch (e) {
      setToastMsg({ text: `Failed to pause group`, type: 'error' });
    }
  };

  const handleGroupResume = async (groupId: string) => {
    try {
      const res = await fetch(`/api/campaigns/group/${groupId}/resume`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.campaigns) setCampaigns(data.campaigns);
        setToastMsg({ text: `Resumed all campaigns in group`, type: 'success' });
      }
    } catch (e) {
      setToastMsg({ text: `Failed to resume group`, type: 'error' });
    }
  };

  const handleGroupDelete = async (groupId: string, gName: string) => {
    if (!window.confirm(`Are you sure you want to delete all campaigns in group "${gName}"?`)) return;
    try {
      const res = await fetch(`/api/campaigns/group/${groupId}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        if (data.campaigns) setCampaigns(data.campaigns);
        setToastMsg({ text: `Deleted group "${gName}"`, type: 'info' });
      }
    } catch (e) {
      setToastMsg({ text: `Failed to delete group`, type: 'error' });
    }
  };

  const handleGroupDispatchNext = async (groupId: string) => {
    try {
      const res = await fetch(`/api/campaigns/group/${groupId}/dispatch-next`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.campaigns) setCampaigns(data.campaigns);
        setToastMsg({ text: `Dispatched next batch for group`, type: 'success' });
      }
    } catch (e) {
      setToastMsg({ text: `Failed to dispatch next batch for group`, type: 'error' });
    }
  };

  const handleSelectAllInGroup = (groupId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const groupCampIds = campaigns.filter(c => c.groupId === groupId).map(c => c.id);
    const allInGroupSelected = groupCampIds.length > 0 && groupCampIds.every(id => selectedCampaignIds.includes(id));
    if (allInGroupSelected) {
      setSelectedCampaignIds(prev => prev.filter(id => !groupCampIds.includes(id)));
    } else {
      setSelectedCampaignIds(prev => Array.from(new Set([...prev, ...groupCampIds])));
    }
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMsg) {
      const t = setTimeout(() => setToastMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toastMsg]);

  // Open Clone & Configure Modal (user can change URL, name, metrics, etc.)
  const handleOpenCloneModal = (campaign: Campaign) => {
    setCloneModalCampaign(campaign);
    setCloneForm({
      sourceId: campaign.id,
      name: `${campaign.name} (Copy)`,
      targetUrl: campaign.targetUrl || '',
      handle: campaign.handle || '@creator',
      autoPauseOnServiceFailure: campaign.autoPauseOnServiceFailure !== false,
      views: campaign.metrics?.views ?? 1000,
      likes: campaign.metrics?.likes ?? 50,
      comments: campaign.metrics?.comments ?? 10,
      shares: campaign.metrics?.shares ?? 20,
      saves: campaign.metrics?.saves ?? 10,
      reposts: campaign.metrics?.reposts ?? 5,
      durationHours: campaign.durationHours || 24,
      minMins: campaign.cadenceRange?.minMins || 20,
      maxMins: campaign.cadenceRange?.maxMins || 35,
      curve: campaign.curve || 'trending_rocket'
    });
  };

  // Confirm & Launch Cloned Campaign with fresh batches
  const handleConfirmClone = async () => {
    if (!cloneModalCampaign || !cloneForm) return;

    const trimmedUrl = cloneForm.targetUrl.trim();
    if (!trimmedUrl) {
      setToastMsg({ text: 'Please enter a target URL before cloning.', type: 'error' });
      return;
    }

    setIsSubmittingClone(true);

    try {
      const parsed = parseTargetUrl(trimmedUrl, cloneModalCampaign.platform);
      const cleanHandle = cloneForm.handle.trim() || parsed.handle || cloneModalCampaign.handle || '@creator';
      const cleanTargetUrl = trimmedUrl;

      const updatedMetrics = {
        views: Math.max(100, Number(cloneForm.views) || 100),
        likes: Math.max(5, Number(cloneForm.likes) || 5),
        comments: Math.max(0, Number(cloneForm.comments) || 0),
        shares: Math.max(10, Number(cloneForm.shares) || 10),
        saves: Math.max(1, Number(cloneForm.saves) || 1),
        reposts: Math.max(1, Number(cloneForm.reposts) || 1)
      };

      const newGeneratedBatches = generateCampaignBatches({
        metrics: updatedMetrics,
        durationHours: Math.max(1, cloneForm.durationHours || 24),
        intervalMinutes: Math.round(((cloneForm.minMins || 20) + (cloneForm.maxMins || 35)) / 2),
        curve: cloneForm.curve || 'trending_rocket',
        jitterPercent: cloneModalCampaign.jitterPercent || 20,
        seedChunkProtocol: cloneModalCampaign.seedChunkProtocol ?? true,
        cadenceRange: { minMins: cloneForm.minMins || 20, maxMins: cloneForm.maxMins || 35 },
        startDate: new Date()
      });

      const clonePayload = {
        name: cloneForm.name.trim() || `${cloneModalCampaign.name} (Copy)`,
        targetUrl: cleanTargetUrl,
        handle: cleanHandle,
        autoPauseOnServiceFailure: cloneForm.autoPauseOnServiceFailure !== false,
        metrics: updatedMetrics,
        durationHours: cloneForm.durationHours || 24,
        curve: cloneForm.curve || 'trending_rocket',
        cadenceRange: { minMins: cloneForm.minMins || 20, maxMins: cloneForm.maxMins || 35 },
        batches: newGeneratedBatches,
        sourceCampaign: cloneModalCampaign
      };

      let newCamp: any;
      if (onCloneCampaign) {
        newCamp = await onCloneCampaign(cloneForm.sourceId, clonePayload);
      } else {
        const res = await fetch(`/api/campaigns/${cloneForm.sourceId}/clone`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clonePayload)
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to clone');
        }
        const data = await res.json();
        newCamp = data.campaign;
        if (newCamp) {
          setCampaigns(prev => [newCamp, ...prev]);
        }
      }

      if (!newCamp || !newCamp.id) {
        throw new Error('Clone creation failed: No campaign returned from server.');
      }

      setSelectedCampaignId(newCamp.id);
      setToastMsg({ text: `Cloned campaign "${clonePayload.name}" created and launched!`, type: 'success' });
      setCloneModalCampaign(null);
      setCloneForm(null);
    } catch (e: any) {
      setToastMsg({ text: e.message || 'Failed to clone campaign', type: 'error' });
    } finally {
      setIsSubmittingClone(false);
    }
  };

  // Toggle selection for bulk actions
  const handleToggleSelectCampaign = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCampaignIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Bulk Pause
  const handleBulkPause = async () => {
    if (selectedCampaignIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      const res = await fetch('/api/campaigns/bulk/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedCampaignIds })
      });
      if (res.ok) {
        setCampaigns(prev => prev.map(c => selectedCampaignIds.includes(c.id) ? { ...c, status: 'paused' } : c));
        setToastMsg({ text: `Successfully paused ${selectedCampaignIds.length} campaigns.`, type: 'info' });
      }
    } catch (e: any) {
      setToastMsg({ text: e.message || 'Failed to pause campaigns', type: 'error' });
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Bulk Resume
  const handleBulkResume = async () => {
    if (selectedCampaignIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      const res = await fetch('/api/campaigns/bulk/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedCampaignIds })
      });
      if (res.ok) {
        setCampaigns(prev => prev.map(c => selectedCampaignIds.includes(c.id) ? { ...c, status: 'running', lastAutoPause: undefined } : c));
        setToastMsg({ text: `Successfully resumed ${selectedCampaignIds.length} campaigns.`, type: 'success' });
      }
    } catch (e: any) {
      setToastMsg({ text: e.message || 'Failed to resume campaigns', type: 'error' });
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Bulk Dispatch Next Batch
  const handleBulkDispatchNext = async () => {
    if (selectedCampaignIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      const res = await fetch('/api/campaigns/bulk/dispatch-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedCampaignIds })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.campaigns) setCampaigns(data.campaigns);
        setToastMsg({ text: `Triggered next batch dispatch for ${selectedCampaignIds.length} campaigns!`, type: 'success' });
      }
    } catch (e: any) {
      setToastMsg({ text: e.message || 'Failed to dispatch next batches', type: 'error' });
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Bulk Delete Confirm
  const handleBulkDeleteConfirm = async () => {
    if (selectedCampaignIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      const res = await fetch('/api/campaigns/bulk/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedCampaignIds })
      });
      if (res.ok) {
        setCampaigns(prev => prev.filter(c => !selectedCampaignIds.includes(c.id)));
        setToastMsg({ text: `Deleted ${selectedCampaignIds.length} campaigns.`, type: 'info' });
        setSelectedCampaignIds([]);
        setIsBulkDeleteConfirmOpen(false);
      }
    } catch (e: any) {
      setToastMsg({ text: e.message || 'Failed to delete campaigns', type: 'error' });
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Apply Bulk Edit to all selected
  const handleApplyBulkEdit = async () => {
    if (selectedCampaignIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      const updatedCampaignsList = campaigns.map(camp => {
        if (!selectedCampaignIds.includes(camp.id)) return camp;

        let newBatches = camp.batches;
        if (bulkEditForm.rebalancePendingBatches) {
          const doneBatches = camp.batches.filter(b => b.status === 'success' || b.status === 'running');
          const doneViews = doneBatches.reduce((s, b) => s + b.views, 0);
          const doneLikes = doneBatches.reduce((s, b) => s + b.likes, 0);
          const doneComments = doneBatches.reduce((s, b) => s + b.comments, 0);
          const doneShares = doneBatches.reduce((s, b) => s + b.shares, 0);
          const doneSaves = doneBatches.reduce((s, b) => s + b.saves, 0);
          const doneReposts = doneBatches.reduce((s, b) => s + b.reposts, 0);

          const remMetrics = {
            views: Math.max(100, camp.metrics.views - doneViews),
            likes: Math.max(5, camp.metrics.likes - doneLikes),
            comments: Math.max(0, camp.metrics.comments - doneComments),
            shares: Math.max(10, camp.metrics.shares - doneShares),
            saves: Math.max(1, camp.metrics.saves - doneSaves),
            reposts: Math.max(1, camp.metrics.reposts - doneReposts)
          };

          const newGen = generateCampaignBatches({
            metrics: remMetrics,
            durationHours: Math.max(1, bulkEditForm.durationHours || camp.durationHours || 24),
            intervalMinutes: Math.round((bulkEditForm.minMins + bulkEditForm.maxMins) / 2),
            curve: bulkEditForm.curve || camp.curve,
            jitterPercent: camp.jitterPercent || 20,
            seedChunkProtocol: false,
            cadenceRange: { minMins: bulkEditForm.minMins, maxMins: bulkEditForm.maxMins },
            startDate: new Date()
          });

          const reindexed = newGen.map((b, idx) => ({
            ...b,
            batchIndex: doneBatches.length + idx,
            isSeedBatch: false
          }));
          newBatches = [...doneBatches, ...reindexed];
        }

        return {
          ...camp,
          autoPauseOnServiceFailure: bulkEditForm.autoPauseOnServiceFailure !== false,
          curve: bulkEditForm.curve || camp.curve,
          cadenceRange: { minMins: bulkEditForm.minMins, maxMins: bulkEditForm.maxMins },
          durationHours: bulkEditForm.durationHours || camp.durationHours,
          batches: newBatches,
          updatedAt: new Date().toISOString()
        };
      });

      for (const camp of updatedCampaignsList.filter(c => selectedCampaignIds.includes(c.id))) {
        await fetch(`/api/campaigns/${camp.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(camp)
        }).catch(() => {});
      }

      setCampaigns(updatedCampaignsList);
      setToastMsg({ text: `Bulk updated ${selectedCampaignIds.length} campaigns!`, type: 'success' });
      setIsBulkEditOpen(false);
    } catch (e: any) {
      setToastMsg({ text: e.message || 'Failed to bulk edit campaigns', type: 'error' });
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Export Campaigns to JSON
  const handleExportJSON = (onlySelected: boolean = false) => {
    const toExport = onlySelected && selectedCampaignIds.length > 0
      ? campaigns.filter(c => selectedCampaignIds.includes(c.id))
      : campaigns;

    if (toExport.length === 0) {
      setToastMsg({ text: 'No campaigns to export', type: 'error' });
      return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(toExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `smm_campaigns_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setToastMsg({ text: `Exported ${toExport.length} campaign(s) to JSON file!`, type: 'success' });
  };

  // Explicit Save to Server Files (Writes to campaigns_backup.json and .data/smm_store.json)
  const handleSaveAllToServer = async () => {
    setIsSavingToServer(true);
    try {
      const res = await fetch('/api/campaigns/save-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaigns })
      });
      if (res.ok) {
        const data = await res.json();
        setToastMsg({
          text: `All ${data.count} campaigns safely committed to server files (campaigns_backup.json)!`,
          type: 'success'
        });
      } else {
        throw new Error('Failed to save to server');
      }
    } catch (e: any) {
      setToastMsg({ text: e.message || 'Error saving to server', type: 'error' });
    } finally {
      setIsSavingToServer(false);
    }
  };

  // Import Campaigns from JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) throw new Error('File must contain an array of campaigns');

        const validCampaigns = parsed.filter(c => c && c.id && c.name && c.targetUrl && Array.isArray(c.batches));
        if (validCampaigns.length === 0) throw new Error('No valid campaigns found in JSON file');

        const res = await fetch('/api/campaigns/sync-cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientCampaigns: validCampaigns })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.campaigns) setCampaigns(data.campaigns);
          setToastMsg({ text: `Successfully imported ${validCampaigns.length} campaigns from backup!`, type: 'success' });
        }
      } catch (err: any) {
        setToastMsg({ text: err.message || 'Failed to parse JSON file', type: 'error' });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Auto-scan browser localStorage for any previously created campaigns
  const handleCheckBrowserStorage = () => {
    try {
      const raw = localStorage.getItem('smm_campaigns_cache');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCampaigns(parsed);
          fetch('/api/campaigns/sync-cache', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientCampaigns: parsed })
          });
          setToastMsg({ text: `Found and restored ${parsed.length} campaigns from your browser cache!`, type: 'success' });
          setIsImportModalOpen(false);
          return;
        }
      }
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('campaign') || key.includes('smm'))) {
          const val = localStorage.getItem(key);
          try {
            const p = JSON.parse(val || '');
            if (Array.isArray(p) && p.length > 0 && p[0].batches) {
              setCampaigns(p);
              fetch('/api/campaigns/sync-cache', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientCampaigns: p })
              });
              setToastMsg({ text: `Recovered ${p.length} campaigns from browser key "${key}"!`, type: 'success' });
              setIsImportModalOpen(false);
              return;
            }
          } catch (e) {}
        }
      }
      setToastMsg({ text: 'No cached campaigns found in this browser storage.', type: 'info' });
    } catch (err: any) {
      setToastMsg({ text: err.message, type: 'error' });
    }
  };

  // Import campaigns from pasted raw JSON
  const handleImportPastedJSON = async () => {
    if (!pastedJsonText.trim()) return;
    try {
      const parsed = JSON.parse(pastedJsonText.trim());
      const arr = Array.isArray(parsed) ? parsed : (parsed.campaigns && Array.isArray(parsed.campaigns) ? parsed.campaigns : null);
      if (!arr) throw new Error('Input must be a JSON array of campaigns or object with "campaigns" list');
      const validCampaigns = arr.filter((c: any) => c && c.id && c.name && Array.isArray(c.batches));
      if (validCampaigns.length === 0) throw new Error('No valid campaigns with batches found in pasted JSON');

      const res = await fetch('/api/campaigns/sync-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientCampaigns: validCampaigns })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.campaigns) setCampaigns(data.campaigns);
        setToastMsg({ text: `Successfully restored ${validCampaigns.length} campaigns from pasted JSON!`, type: 'success' });
        setIsImportModalOpen(false);
        setPastedJsonText('');
      }
    } catch (err: any) {
      setToastMsg({ text: err.message || 'Invalid JSON format', type: 'error' });
    }
  };

  // Filtered and sorted campaigns
  const filteredCampaigns = campaigns.filter(c => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchUrl = c.targetUrl?.toLowerCase().includes(q);
      const matchHandle = c.handle?.toLowerCase().includes(q);
      if (!matchName && !matchUrl && !matchHandle) return false;
    }

    if (statusFilter === 'running') return c.status === 'running';
    if (statusFilter === 'paused') return c.status === 'paused' && !c.lastAutoPause;
    if (statusFilter === 'auto_paused') return c.status === 'paused' && !!c.lastAutoPause;
    if (statusFilter === 'completed') return c.status === 'completed';

    return true;
  }).sort((a, b) => {
    if (sortBy === 'progress') {
      const aDone = a.batches.filter(x => x.status === 'success').length / (a.batches.length || 1);
      const bDone = b.batches.filter(x => x.status === 'success').length / (b.batches.length || 1);
      return bDone - aDone;
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'batches') {
      return b.batches.length - a.batches.length;
    }
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredCampaigns.map(c => c.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedCampaignIds.includes(id));
    if (allSelected) {
      setSelectedCampaignIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedCampaignIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Group clustering for bulk fleets and standalone campaigns
  interface GroupCluster {
    type: 'group';
    groupId: string;
    groupName: string;
    campaigns: Campaign[];
    totalViews: number;
    deliveredViews: number;
    totalBatches: number;
    completedBatches: number;
    progressPct: number;
    status: 'running' | 'paused' | 'completed';
  }

  interface SingleCluster {
    type: 'single';
    campaign: Campaign;
  }

  type ClusterItem = GroupCluster | SingleCluster;

  const clusters: ClusterItem[] = React.useMemo(() => {
    const result: ClusterItem[] = [];
    const groupMap = new Map<string, Campaign[]>();
    const processedGroupIds = new Set<string>();

    for (const c of filteredCampaigns) {
      if (c.groupId) {
        const list = groupMap.get(c.groupId) || [];
        list.push(c);
        groupMap.set(c.groupId, list);
      }
    }

    for (const c of filteredCampaigns) {
      if (c.groupId) {
        if (!processedGroupIds.has(c.groupId)) {
          processedGroupIds.add(c.groupId);
          const gCamps = groupMap.get(c.groupId) || [c];
          const totalViews = gCamps.reduce((s, x) => s + (x.metrics?.views || 0), 0);
          const deliveredViews = gCamps.reduce((s, x) => 
            s + x.batches.filter(b => b.status === 'success').reduce((bs, b) => bs + (b.views || 0), 0), 0
          );
          const totalBatches = gCamps.reduce((s, x) => s + (x.batches?.length || 0), 0);
          const completedBatches = gCamps.reduce((s, x) => 
            s + x.batches.filter(b => b.status === 'success').length, 0
          );
          const progressPct = totalBatches > 0 ? Math.round((completedBatches / totalBatches) * 100) : 0;
          const allCompleted = gCamps.every(x => x.status === 'completed');
          const anyRunning = gCamps.some(x => x.status === 'running');
          const groupStatus: 'running' | 'paused' | 'completed' = allCompleted ? 'completed' : anyRunning ? 'running' : 'paused';

          result.push({
            type: 'group',
            groupId: c.groupId,
            groupName: c.groupName || `Bulk Fleet (${gCamps.length} Reels)`,
            campaigns: gCamps,
            totalViews,
            deliveredViews,
            totalBatches,
            completedBatches,
            progressPct,
            status: groupStatus,
          });
        }
      } else {
        result.push({
          type: 'single',
          campaign: c,
        });
      }
    }

    return result;
  }, [filteredCampaigns]);

  // Fleet Statistics
  const totalTargetViews = campaigns.reduce((s, c) => s + (c.metrics?.views || 0), 0);
  const totalDeliveredViews = campaigns.reduce((s, c) => 
    s + c.batches.filter(b => b.status === 'success').reduce((bs, b) => bs + (b.views || 0), 0), 0
  );
  const totalBatchesCount = campaigns.reduce((s, c) => s + (c.batches?.length || 0), 0);
  const totalDeliveredBatchesCount = campaigns.reduce((s, c) => 
    s + c.batches.filter(b => b.status === 'success').length, 0
  );
  const runningQueuesCount = campaigns.filter(c => c.status === 'running').length;
  const pausedQueuesCount = campaigns.filter(c => c.status === 'paused').length;

  // Toggle Auto-Pause on Outage / Error
  const handleToggleAutoPause = async (campaign: Campaign) => {
    const newVal = campaign.autoPauseOnServiceFailure === false;
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoPauseOnServiceFailure: newVal })
      });
      if (res.ok) {
        setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, autoPauseOnServiceFailure: newVal } : c));
        setToastMsg({
          text: `Auto-pause on service outage is now ${newVal ? 'ENABLED' : 'DISABLED'} for this campaign.`,
          type: 'info'
        });
      }
    } catch (e) {
      setToastMsg({ text: 'Failed to update auto-pause setting', type: 'error' });
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (campaign: Campaign) => {
    setEditModalCampaign(campaign);
    setEditForm({
      id: campaign.id,
      name: campaign.name,
      targetUrl: campaign.targetUrl,
      handle: campaign.handle,
      autoPauseOnServiceFailure: campaign.autoPauseOnServiceFailure !== false,
      views: campaign.metrics.views,
      likes: campaign.metrics.likes,
      comments: campaign.metrics.comments,
      shares: campaign.metrics.shares,
      saves: campaign.metrics.saves,
      reposts: campaign.metrics.reposts,
      durationHours: campaign.durationHours || 24,
      minMins: campaign.cadenceRange?.minMins || 20,
      maxMins: campaign.cadenceRange?.maxMins || 35,
      curve: campaign.curve || 'trending_rocket',
      rebalancePendingBatches: true
    });
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editModalCampaign || !editForm) return;
    setIsSavingEdit(true);

    try {
      const targetUrlParsed = parseTargetUrl(editForm.targetUrl, editModalCampaign.platform);
      const cleanHandle = editForm.handle.trim() || targetUrlParsed.handle || editModalCampaign.handle;
      const cleanTargetUrl = editForm.targetUrl.trim() || editModalCampaign.targetUrl;

      const updatedMetrics = {
        views: Math.max(100, Number(editForm.views) || 100),
        likes: Math.max(5, Number(editForm.likes) || 5),
        comments: Math.max(0, Number(editForm.comments) || 0),
        shares: Math.max(10, Number(editForm.shares) || 10),
        saves: Math.max(1, Number(editForm.saves) || 1),
        reposts: Math.max(1, Number(editForm.reposts) || 1)
      };

      let updatedBatches = editModalCampaign.batches;

      if (editForm.rebalancePendingBatches) {
        // Preserve successful/dispatched batches
        const doneBatches = editModalCampaign.batches.filter(b => b.status === 'success' || b.status === 'running');
        const doneViews = doneBatches.reduce((s, b) => s + b.views, 0);
        const doneLikes = doneBatches.reduce((s, b) => s + b.likes, 0);
        const doneComments = doneBatches.reduce((s, b) => s + b.comments, 0);
        const doneShares = doneBatches.reduce((s, b) => s + b.shares, 0);
        const doneSaves = doneBatches.reduce((s, b) => s + b.saves, 0);
        const doneReposts = doneBatches.reduce((s, b) => s + b.reposts, 0);

        const remainingMetrics = {
          views: Math.max(100, updatedMetrics.views - doneViews),
          likes: Math.max(5, updatedMetrics.likes - doneLikes),
          comments: Math.max(0, updatedMetrics.comments - doneComments),
          shares: Math.max(10, updatedMetrics.shares - doneShares),
          saves: Math.max(1, updatedMetrics.saves - doneSaves),
          reposts: Math.max(1, updatedMetrics.reposts - doneReposts)
        };

        const newGenerated = generateCampaignBatches({
          metrics: remainingMetrics,
          durationHours: Math.max(1, editForm.durationHours),
          intervalMinutes: Math.round((editForm.minMins + editForm.maxMins) / 2),
          curve: editForm.curve,
          jitterPercent: editModalCampaign.jitterPercent || 20,
          seedChunkProtocol: false, // Warmup already done
          cadenceRange: { minMins: editForm.minMins, maxMins: editForm.maxMins },
          startDate: new Date()
        });

        // Merge: keep doneBatches, append reindexed newGenerated
        const reindexedNew = newGenerated.map((b, idx) => ({
          ...b,
          batchIndex: doneBatches.length + idx,
          isSeedBatch: false
        }));
        updatedBatches = [...doneBatches, ...reindexedNew];
      }

      const updatedCampaign: Campaign = {
        ...editModalCampaign,
        name: editForm.name.trim() || editModalCampaign.name,
        targetUrl: cleanTargetUrl,
        handle: cleanHandle,
        autoPauseOnServiceFailure: editForm.autoPauseOnServiceFailure,
        metrics: updatedMetrics,
        durationHours: editForm.durationHours,
        curve: editForm.curve,
        cadenceRange: { minMins: editForm.minMins, maxMins: editForm.maxMins },
        batches: updatedBatches
      };

      if (onEditCampaign) {
        await onEditCampaign(updatedCampaign);
      } else {
        const res = await fetch(`/api/campaigns/${updatedCampaign.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedCampaign)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to save');
        }
        const data = await res.json();
        setCampaigns(prev => prev.map(c => c.id === updatedCampaign.id ? data.campaign : c));
      }

      setToastMsg({ text: `Campaign "${updatedCampaign.name}" updated successfully!`, type: 'success' });
      setEditModalCampaign(null);
      setEditForm(null);
    } catch (e: any) {
      setToastMsg({ text: e.message || 'Error updating campaign', type: 'error' });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Sync selectedCampaignId if deleted or changed
  useEffect(() => {
    if (campaigns.length > 0) {
      if (!selectedCampaignId || !campaigns.some(c => c.id === selectedCampaignId)) {
        setSelectedCampaignId(campaigns[0].id);
      }
    } else {
      setSelectedCampaignId(null);
    }
  }, [campaigns, selectedCampaignId]);

  // Clock ticker for real-time countdown updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0];

  // Calculate next scheduled batch countdown
  const getNextBatchCountdown = (campaign: Campaign) => {
    if (campaign.status !== 'running') return { text: 'Paused / Inactive', seconds: 0 };
    const nextPending = campaign.batches.find(b => b.status === 'pending');
    if (!nextPending) return { text: 'All Batches Delivered', seconds: 0 };

    const scheduledMs = new Date(nextPending.scheduledAt).getTime();
    const diffSec = Math.max(0, Math.floor((scheduledMs - currentTime) / 1000));

    if (diffSec <= 0) return { text: 'Dispatching Now...', seconds: 0 };
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return {
      text: `${mins > 0 ? `${mins}m ` : ''}${secs}s`,
      seconds: diffSec,
      batchIndex: nextPending.batchIndex
    };
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input for importing backup */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJSON}
        accept=".json"
        className="hidden"
      />

      {/* Fleet KPI Overview & Header Bar */}
      <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Fleet Operations Hub</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-campaign orchestration, live delivery monitoring, and automated failover
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap font-mono">
            <button
              type="button"
              disabled={isSavingToServer}
              onClick={handleSaveAllToServer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500/50 hover:border-purple-400 text-xs text-purple-200 hover:text-white transition-all cursor-pointer shadow-sm shadow-purple-950/50 font-bold disabled:opacity-50"
              title="Save & commit all current campaigns to server disk (campaigns_backup.json)"
            >
              {isSavingToServer ? (
                <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Save To Server Disk</span>
            </button>

            <button
              type="button"
              onClick={() => handleExportJSON(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-purple-500/50 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Export all campaigns as a JSON backup file to your computer"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Download JSON</span>
            </button>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Import or paste campaigns from backup"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Import Backup</span>
            </button>
          </div>
        </div>

        {/* Fleet KPI Metrics Cards */}
        {campaigns.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 font-mono">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-[10px] uppercase text-slate-400">Total Views Fleet</div>
              <div className="text-sm font-bold text-cyan-300 mt-0.5">
                {totalDeliveredViews.toLocaleString()} / {totalTargetViews.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {totalTargetViews > 0 ? Math.round((totalDeliveredViews / totalTargetViews) * 100) : 0}% Delivered
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-[10px] uppercase text-slate-400">Total Batches</div>
              <div className="text-sm font-bold text-purple-300 mt-0.5">
                {totalDeliveredBatchesCount} / {totalBatchesCount}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {totalBatchesCount > 0 ? Math.round((totalDeliveredBatchesCount / totalBatchesCount) * 100) : 0}% Dispatched
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-[10px] uppercase text-slate-400">Active Engine</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                {runningQueuesCount} Running
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {pausedQueuesCount} Paused
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-[10px] uppercase text-slate-400">Selected For Action</div>
              <div className="text-sm font-bold text-indigo-300 mt-0.5">
                {selectedCampaignIds.length} Campaigns
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {selectedCampaignIds.length > 0 ? 'Batch actions armed' : 'Click checkboxes to select'}
              </div>
            </div>
          </div>
        )}

        {/* Git Redeployment Shield Status Strip */}
        {campaigns.length > 0 && (
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-bold">Redeployment Shield Active:</span>
              <span className="text-emerald-400">{campaigns.length} campaigns saved in browser & auto-synced to server</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">Local Cache: Safe</span>
              <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">Auto-Merge: Active</span>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bulk Action Command Bar (Displayed when 1 or more campaigns are selected) */}
      {selectedCampaignIds.length > 0 && (
        <div className="sticky top-2 z-30 p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/95 via-indigo-950/95 to-slate-900/95 border border-purple-500/50 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-fade-in font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-200 border border-purple-500/30 font-bold">
              {selectedCampaignIds.length} Selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedCampaignIds([])}
              className="text-slate-400 hover:text-white underline cursor-pointer text-[11px]"
            >
              Deselect All
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={isBulkLoading}
              onClick={handleBulkPause}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 transition-all cursor-pointer disabled:opacity-50"
              title="Pause all selected campaigns"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Bulk Pause</span>
            </button>

            <button
              type="button"
              disabled={isBulkLoading}
              onClick={handleBulkResume}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 transition-all cursor-pointer disabled:opacity-50"
              title="Resume all selected campaigns"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Bulk Resume</span>
            </button>

            <button
              type="button"
              disabled={isBulkLoading}
              onClick={handleBulkDispatchNext}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 transition-all cursor-pointer disabled:opacity-50"
              title="Immediately dispatch next batch across all selected campaigns"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Fast-Forward Next</span>
            </button>

            <button
              type="button"
              disabled={isBulkLoading}
              onClick={() => setIsBulkEditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-500/50 text-indigo-200 transition-all cursor-pointer disabled:opacity-50"
              title="Bulk edit curves, cadences, and failover options"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Bulk Edit</span>
            </button>

            <button
              type="button"
              disabled={isBulkLoading}
              onClick={() => handleExportJSON(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Export only selected campaigns to JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              type="button"
              disabled={isBulkLoading}
              onClick={() => setIsBulkDeleteConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-200 transition-all cursor-pointer disabled:opacity-50"
              title="Delete all selected campaigns"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Feedback Toast */}
      {toastMsg && (
        <div className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 shadow-xl transition-all animate-fade-in ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' 
            : toastMsg.type === 'error'
            ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
            : 'bg-purple-950/80 border-purple-500/50 text-purple-300'
        }`}>
          <div className="flex items-center gap-2">
            {toastMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastMsg.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toastMsg.type === 'info' && <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />}
            <span>{toastMsg.text}</span>
          </div>
          <button 
            onClick={() => setToastMsg(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main campaigns display */}
      {campaigns.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-10 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Active Campaigns in Current View</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              If you had campaigns before this redeployment, you can scan your local browser cache or restore from a JSON backup.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 font-mono">
            <button
              type="button"
              onClick={handleCheckBrowserStorage}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-900/40 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Scan Local Browser Storage</span>
            </button>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 text-cyan-300 hover:text-white font-bold text-xs transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import / Paste Backup JSON</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaigns list sidebar with scrolling keep effect */}
          <div className="space-y-3 lg:sticky lg:top-4 self-start max-h-[calc(100vh-5rem)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 hover:scrollbar-thumb-purple-600/50">
            {/* Search, Filter, and Sort Controls Header */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Queues ({filteredCampaigns.length}/{campaigns.length})
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="flex items-center gap-1 text-[11px] font-mono text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                >
                  {filteredCampaigns.length > 0 && filteredCampaigns.every(c => selectedCampaignIds.includes(c.id)) ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                      <span>Deselect All</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-slate-500" />
                      <span>Select All</span>
                    </>
                  )}
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter name, URL, or handle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono scrollbar-none">
                {(['all', 'running', 'paused', 'auto_paused', 'completed'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setStatusFilter(f)}
                    className={`px-2 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                      statusFilter === f
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {f === 'auto_paused' ? 'Auto-Paused' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {/* Sort Order Selector */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-900">
                <span className="flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  <span>Sort by:</span>
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-slate-300 text-[10px] focus:outline-none focus:border-purple-500"
                >
                  <option value="recent">Newest Created</option>
                  <option value="progress">Progress %</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="batches">Total Batches</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {clusters.map((cluster) => {
                if (cluster.type === 'group') {
                  const isGroupExpanded = expandedGroupIds[cluster.groupId] !== false; // Default expanded
                  const groupCampIds = cluster.campaigns.map(c => c.id);
                  const allInGroupSelected = groupCampIds.length > 0 && groupCampIds.every(id => selectedCampaignIds.includes(id));
                  const isAnyChildSelected = cluster.campaigns.some(c => selectedCampaign?.id === c.id);

                  return (
                    <div
                      key={cluster.groupId}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isAnyChildSelected
                          ? 'bg-slate-900/90 border-purple-500/50 shadow-lg shadow-purple-500/10'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Group Header Card */}
                      <div className="p-3.5 space-y-2.5 bg-gradient-to-r from-purple-950/30 via-slate-900/40 to-slate-950/60">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 truncate">
                            {/* Group Checkbox */}
                            <button
                              type="button"
                              onClick={(e) => handleSelectAllInGroup(cluster.groupId, e)}
                              className="mt-0.5 text-slate-500 hover:text-purple-400 transition-colors cursor-pointer shrink-0"
                              title={allInGroupSelected ? 'Deselect all reels in group' : 'Select all reels in group'}
                            >
                              {allInGroupSelected ? (
                                <CheckSquare className="w-4 h-4 text-purple-400" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                              )}
                            </button>

                            <div className="truncate">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold flex items-center gap-1">
                                  <Folder className="w-3 h-3" />
                                  <span>Fleet Group</span>
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                  {cluster.campaigns.length} Reels
                                </span>
                                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                                  cluster.status === 'running' 
                                    ? 'bg-emerald-500/20 text-emerald-300' 
                                    : cluster.status === 'paused'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {cluster.status.toUpperCase()}
                                </span>
                              </div>

                              <h4 className="font-bold text-white text-sm mt-1 truncate">
                                {cluster.groupName}
                              </h4>
                            </div>
                          </div>

                          {/* Group Expand/Collapse & Progress */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right font-mono">
                              <div className="text-xs font-bold text-purple-300">{cluster.progressPct}%</div>
                              <div className="text-[10px] text-slate-500">{cluster.completedBatches}/{cluster.totalBatches}</div>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleGroupExpand(cluster.groupId)}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              title={isGroupExpanded ? 'Collapse fleet list' : 'Expand fleet list'}
                            >
                              {isGroupExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar for Group */}
                        <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-400 transition-all duration-300"
                            style={{ width: `${cluster.progressPct}%` }}
                          />
                        </div>

                        {/* Group Actions Bar */}
                        <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-slate-400 border-t border-slate-800/60">
                          <div>
                            <span className="text-slate-500">Views: </span>
                            <span className="text-white font-bold">{cluster.deliveredViews.toLocaleString()}</span>
                            <span className="text-slate-500"> / {cluster.totalViews.toLocaleString()}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {cluster.status === 'running' ? (
                              <button
                                type="button"
                                onClick={() => handleGroupPause(cluster.groupId)}
                                className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] cursor-pointer"
                                title="Pause all reels in this group"
                              >
                                Pause Group
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleGroupResume(cluster.groupId)}
                                className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] cursor-pointer"
                                title="Resume all reels in this group"
                              >
                                Resume Group
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleGroupDispatchNext(cluster.groupId)}
                              className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[10px] cursor-pointer"
                              title="Fast-forward next batch for all reels in group"
                            >
                              Dispatch Next
                            </button>

                            <button
                              type="button"
                              onClick={() => handleGroupDelete(cluster.groupId, cluster.groupName)}
                              className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete all reels in this group"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Nested Individual Reels in Group */}
                      {isGroupExpanded && (
                        <div className="p-2 space-y-1.5 bg-slate-950/90 border-t border-slate-800/80">
                          {cluster.campaigns.map((camp, cIdx) => {
                            const isSelected = selectedCampaign?.id === camp.id;
                            const isMultiSelected = selectedCampaignIds.includes(camp.id);
                            const completedBatches = camp.batches.filter(b => b.status === 'success').length;
                            const progressPct = Math.round((completedBatches / camp.batches.length) * 100);
                            const isAutoPaused = camp.status === 'paused' && !!camp.lastAutoPause;

                            return (
                              <div
                                key={camp.id}
                                onClick={() => setSelectedCampaignId(camp.id)}
                                className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs font-mono ${
                                  isSelected
                                    ? 'bg-slate-900 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                                    : isMultiSelected
                                    ? 'bg-purple-950/40 border-purple-500/40'
                                    : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/70'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate pr-2">
                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleSelectCampaign(camp.id, e)}
                                    className="text-slate-500 hover:text-purple-400 cursor-pointer shrink-0"
                                  >
                                    {isMultiSelected ? (
                                      <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                                    ) : (
                                      <Square className="w-3.5 h-3.5 text-slate-600 hover:text-slate-400" />
                                    )}
                                  </button>

                                  <span className="text-[10px] text-slate-500 font-bold shrink-0">#{cIdx + 1}</span>

                                  <div className="truncate">
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className="px-1.5 py-0.2 rounded bg-purple-900/40 text-purple-300 font-bold text-[10px] shrink-0">
                                        {camp.handle}
                                      </span>
                                      <span className="text-white text-xs truncate">
                                        {camp.name.replace(cluster.groupName, '').trim() || camp.name}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">
                                      {camp.metrics.views.toLocaleString()} views • {camp.targetUrl}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="text-right">
                                    <div className="text-[11px] font-bold text-cyan-300">{progressPct}%</div>
                                    <div className="text-[9px] text-slate-500">{completedBatches}/{camp.batches.length}</div>
                                  </div>

                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenCloneModal(camp);
                                      }}
                                      className="p-1 rounded hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-all cursor-pointer"
                                      title="Clone & Customize Reel"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCampaignToDelete(camp);
                                      }}
                                      className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                                      title="Delete Reel"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // Single Standalone Campaign Item
                const camp = cluster.campaign;
                const isSelected = selectedCampaign?.id === camp.id;
                const isMultiSelected = selectedCampaignIds.includes(camp.id);
                const completedBatches = camp.batches.filter(b => b.status === 'success').length;
                const progressPct = Math.round((completedBatches / camp.batches.length) * 100);
                const nextCountdown = getNextBatchCountdown(camp);
                const isAutoPaused = camp.status === 'paused' && !!camp.lastAutoPause;

                return (
                  <div
                    key={camp.id}
                    onClick={() => setSelectedCampaignId(camp.id)}
                    className={`group relative cursor-pointer p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                        : isMultiSelected
                        ? 'bg-purple-950/30 border-purple-500/40'
                        : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2.5 truncate pr-2">
                        {/* Multi-Select Checkbox */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleSelectCampaign(camp.id, e)}
                          className="mt-0.5 text-slate-500 hover:text-purple-400 transition-colors cursor-pointer shrink-0"
                          title={isMultiSelected ? 'Deselect campaign' : 'Select campaign for bulk actions'}
                        >
                          {isMultiSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                          )}
                        </button>

                        <div className="truncate">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                              {camp.platform}
                            </span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                              isAutoPaused
                                ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold'
                                : camp.status === 'running' 
                                ? 'bg-emerald-500/20 text-emerald-300' 
                                : camp.status === 'paused'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {isAutoPaused ? 'AUTO-PAUSED' : camp.status.toUpperCase()}
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-sm mt-1 truncate">
                            {camp.name}
                          </h4>
                          <div className="text-[11px] text-slate-400 font-mono truncate">
                            {camp.handle}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0 font-mono">
                        <div className="text-right">
                          <div className="text-xs font-bold text-cyan-300">{progressPct}%</div>
                          <div className="text-[10px] text-slate-500">{completedBatches}/{camp.batches.length}</div>
                        </div>

                        {/* Quick Action Icons in List Item */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Quick Clone button (opens configure & clone modal) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCloneModal(camp);
                            }}
                            className="p-1 rounded hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-all cursor-pointer"
                            title="Clone & Customize Campaign"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Delete from list */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCampaignToDelete(camp);
                            }}
                            className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                            title="Delete Campaign"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    {/* Countdown Ticker */}
                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Next Dispatch:</span>
                      <span className="text-emerald-400 font-bold">{nextCountdown.text}</span>
                    </div>
                  </div>
                );
              })}

              {filteredCampaigns.length === 0 && (
                <div className="p-6 rounded-xl border border-slate-800/80 bg-slate-950/40 text-center font-mono text-xs text-slate-500">
                  No campaigns match the filter or search query.
                </div>
              )}
            </div>
          </div>

          {/* Campaign Detail & Real-time Live Ticker */}
          {selectedCampaign && (
            <div className="lg:col-span-2 space-y-5">
              {/* Circuit Breaker Auto-Pause Outage Banner */}
              {selectedCampaign.status === 'paused' && selectedCampaign.lastAutoPause && (
                <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 shadow-lg animate-fade-in font-mono">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm text-amber-300 flex items-center gap-2">
                        <span>Circuit Breaker Auto-Paused Campaign</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                          PROTECTION ACTIVE
                        </span>
                      </div>
                      <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                        Provider <strong>{selectedCampaign.lastAutoPause.serviceName}</strong> (Service #{selectedCampaign.lastAutoPause.serviceId}) reported:
                        <span className="font-bold text-white bg-black/40 px-1.5 py-0.5 rounded ml-1 border border-amber-500/30">
                          "{selectedCampaign.lastAutoPause.error}"
                        </span>
                      </p>
                      <p className="text-[10px] text-amber-400/80 mt-1">
                        Subsequent orders were held automatically to prevent wasted budget. Click Resume once the provider is restored.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onResumeCampaign(selectedCampaign.id)}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shrink-0 cursor-pointer shadow-md shadow-emerald-900/40"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume Campaign</span>
                  </button>
                </div>
              )}

              {/* Campaign Status Card with Sticky Keep Effect */}
              <div className="sticky top-2 z-20 bg-slate-900/95 border border-slate-800 rounded-xl p-5 backdrop-blur-md space-y-4 shadow-xl transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-white">{selectedCampaign.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                        Curve: {selectedCampaign.curve}
                      </span>
                      {/* Follow Live Batch shortcut */}
                      {selectedCampaign.batches.some(b => b.status === 'running' || b.status === 'pending') && (
                        <button
                          type="button"
                          onClick={() => {
                            const active = selectedCampaign.batches.find(b => b.status === 'running') || selectedCampaign.batches.find(b => b.status === 'pending');
                            if (active) {
                              const el = document.getElementById(`batch-row-${active.batchIndex}`);
                              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono hover:bg-cyan-900/60 transition-all cursor-pointer shadow-sm shadow-cyan-500/10"
                          title="Scroll view directly to current active batch"
                        >
                          <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
                          <span>Follow Active Batch</span>
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-md">
                      {selectedCampaign.targetUrl}
                    </p>
                  </div>

                  {/* Scheduler Control Actions */}
                  <div className="flex items-center flex-wrap gap-2">
                    {/* Pause / Resume */}
                    {selectedCampaign.status === 'running' ? (
                      <button
                        onClick={() => onPauseCampaign(selectedCampaign.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-semibold transition-all cursor-pointer"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onResumeCampaign(selectedCampaign.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-semibold transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Resume</span>
                      </button>
                    )}

                    {/* Edit Campaign Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(selectedCampaign)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-semibold transition-all cursor-pointer"
                      title="Edit campaign settings, target URL, metrics, pacing, and curve"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                      <span>Edit</span>
                    </button>

                    {/* Clone Campaign Button (Opens Clone & Configure Modal) */}
                    <button
                      type="button"
                      onClick={() => handleOpenCloneModal(selectedCampaign)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-semibold transition-all cursor-pointer"
                      title="Clone & customize campaign with freshly scheduled batches"
                    >
                      <Copy className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Clone</span>
                    </button>

                    {/* Auto-Pause Outage Circuit Breaker Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleAutoPause(selectedCampaign)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all cursor-pointer ${
                        selectedCampaign.autoPauseOnServiceFailure !== false
                          ? 'bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border-purple-500/40 shadow-sm'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                      title="Auto-pause circuit breaker: automatically pauses when any SMM service fails"
                    >
                      <ShieldAlert className={`w-3.5 h-3.5 ${selectedCampaign.autoPauseOnServiceFailure !== false ? 'text-purple-400' : 'text-slate-500'}`} />
                      <span>Auto-Pause: {selectedCampaign.autoPauseOnServiceFailure !== false ? 'ON' : 'OFF'}</span>
                    </button>

                    {/* Trigger Next Batch */}
                    <button
                      onClick={() => onFastForwardBatch(selectedCampaign.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-mono font-semibold shadow-sm transition-all cursor-pointer"
                      title="Instantly execute next scheduled batch via SMM v2 gateway"
                    >
                      <FastForward className="w-3.5 h-3.5" />
                      <span>Trigger Next Batch</span>
                    </button>

                    {/* Prominent Delete Campaign button */}
                    <button
                      type="button"
                      onClick={() => setCampaignToDelete(selectedCampaign)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-semibold transition-all cursor-pointer"
                      title="Permanently remove campaign and cancel remaining SMM batches"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Progress Stats Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 font-mono text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Batches Dispatched</div>
                    <div className="text-sm font-bold text-white">
                      {selectedCampaign.batches.filter(b => b.status === 'success').length} / {selectedCampaign.batches.length}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Delivered Views</div>
                    <div className="text-sm font-bold text-emerald-400">
                      {selectedCampaign.batches
                        .filter(b => b.status === 'success')
                        .reduce((sum, b) => sum + b.views, 0)
                        .toLocaleString()}{' '}
                      <span className="text-[10px] text-slate-500">/ {selectedCampaign.metrics.views.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Active Anti-Detection</div>
                    <div className="text-sm font-bold text-cyan-400">
                      ±{selectedCampaign.jitterPercent}% Jitter
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Risk Audit</div>
                    <div className="text-sm font-bold text-emerald-400">
                      {selectedCampaign.riskAudit?.riskCategory || 'Ghost-Grade'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Batches Timeline Table */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2 font-mono">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Real-Time Execution Batch Feed</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    Staggered intra-batch timing (T+0m Views, T+1m Saves, T+5m Micro-Likes, T+10m Macro/Shares)
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-lg max-h-[480px] scrollbar-thin scrollbar-thumb-purple-900/50 hover:scrollbar-thumb-purple-600/70 scrollbar-track-slate-950 scroll-smooth">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0 z-10 backdrop-blur-md">
                      <tr>
                        <th className="py-2.5 px-3">Batch</th>
                        <th className="py-2.5 px-3">Scheduled At</th>
                        <th className="py-2.5 px-3">Views (ReliableSMM #8024)</th>
                        <th className="py-2.5 px-3">Likes & Routing</th>
                        <th className="py-2.5 px-3">Engagement</th>
                        <th className="py-2.5 px-3">Live Order IDs</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/60 text-slate-300">
                      {selectedCampaign.batches.map((batch, bIdx) => {
                        const isNextPending = batch.status === 'pending' && selectedCampaign.batches.findIndex(b => b.status === 'pending') === bIdx;
                        return (
                        <tr
                          key={batch.batchIndex}
                          id={`batch-row-${batch.batchIndex}`}
                          className={`hover:bg-slate-900/60 transition-colors ${
                            batch.status === 'success' 
                              ? 'bg-emerald-950/10' 
                              : batch.status === 'running' 
                              ? 'bg-cyan-950/30 border-l-4 border-l-cyan-400 font-semibold text-white' 
                              : isNextPending
                              ? 'bg-purple-950/20 border-l-4 border-l-purple-500'
                              : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                            <span>#{batch.batchIndex}</span>
                            {batch.isSeedBatch && (
                              <span className="text-[9px] uppercase px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Seed
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                            <div className="text-white font-medium">
                              {new Date(batch.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {batch.gapText && (
                              <div className="text-[10px] text-purple-400 font-mono">
                                Gap: {batch.gapText}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-white font-semibold">
                            {batch.views.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3">
                            {batch.isSeedBatch ? (
                              <span className="text-slate-500">Seed Warmup</span>
                            ) : batch.likes > 0 ? (
                              <div>
                                <span className="text-pink-400 font-bold">{batch.likes}</span>
                                <div className="text-[10px] mt-0.5">
                                  {batch.likes < 10 ? (
                                    <span className="text-cyan-400 bg-cyan-950/40 px-1 rounded border border-cyan-500/30">
                                      JAP #1778 (min 5)
                                    </span>
                                  ) : (
                                    <span className="text-purple-400 bg-purple-950/40 px-1 rounded border border-purple-500/30">
                                      Reliable #7147 (min 10)
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] space-y-0.5">
                            {batch.isSeedBatch ? (
                              <span className="text-slate-500 italic">Locked (Warmup)</span>
                            ) : (
                              <div className="flex items-center gap-2 text-slate-300">
                                {batch.saves > 0 && <span>Saves: <strong className="text-amber-400">{batch.saves}</strong></span>}
                                {batch.reposts > 0 && <span>Reposts: <strong className="text-indigo-400">{batch.reposts}</strong></span>}
                                {batch.shares > 0 && <span>Shares: <strong className="text-emerald-400">{batch.shares}</strong></span>}
                                {!batch.saves && !batch.reposts && !batch.shares && <span className="text-slate-600">—</span>}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] font-mono">
                            {batch.orderIds?.views ? (
                              <div className="space-y-0.5 max-w-[170px] truncate">
                                <div className="text-emerald-400" title={`Views: ${batch.orderIds.views}`}>
                                  V: #{batch.orderIds.views}
                                </div>
                                {batch.orderIds.likes && (
                                  <div className="text-pink-400" title={`Likes: ${batch.orderIds.likes}`}>
                                    L: #{batch.orderIds.likes}
                                  </div>
                                )}
                                {batch.orderIds.saves && (
                                  <div className="text-amber-400" title={`Saves: ${batch.orderIds.saves}`}>
                                    S: #{batch.orderIds.saves}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500">Pending</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {batch.status === 'success' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold whitespace-nowrap">
                                Delivered
                              </span>
                            ) : batch.status === 'running' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold animate-pulse whitespace-nowrap">
                                Delivering...
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900 border border-slate-800 text-slate-400 whitespace-nowrap">
                                Queued
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setInspectBatch(batch)}
                              className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors cursor-pointer"
                              title="View Order Details & Execution Logs"
                            >
                              Logs
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Campaign Confirmation Modal */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-rose-400">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Delete Campaign</h3>
              </div>
              <button
                type="button"
                onClick={() => setCampaignToDelete(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <p>
                Are you sure you want to permanently delete{' '}
                <strong className="text-white font-mono">{campaignToDelete.name}</strong>?
              </p>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
                <div>URL: {campaignToDelete.targetUrl}</div>
                <div>Batches: {campaignToDelete.batches.length} total</div>
                <div>Status: {campaignToDelete.status.toUpperCase()}</div>
              </div>
              <p className="text-rose-300 text-[11px]">
                This action cancels all remaining scheduled SMM batches and removes the campaign from the server.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCampaignToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = campaignToDelete.id;
                  onDeleteCampaign(id);
                  setCampaignToDelete(null);
                  if (selectedCampaignId === id) {
                    const remaining = campaigns.filter(c => c.id !== id);
                    setSelectedCampaignId(remaining.length > 0 ? remaining[0].id : null);
                  }
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono shadow-md shadow-rose-600/30 transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Logs & Order Details Modal */}
      {inspectBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Batch #{inspectBatch.batchIndex} SMM Orders & Logs
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectBatch(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-500">Scheduled Time</div>
                  <div className="text-white">{new Date(inspectBatch.scheduledAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Dispatched Time</div>
                  <div className="text-white">{inspectBatch.dispatchedAt ? new Date(inspectBatch.dispatchedAt).toLocaleString() : 'Not dispatched yet'}</div>
                </div>
              </div>

              {/* Order IDs Box */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="text-[10px] font-bold uppercase text-slate-400">Live SMM Panel Orders:</div>
                <div className="text-slate-300 space-y-1 text-[11px]">
                  <div>Views (ReliableSMM #8024): <span className="text-emerald-400 font-bold">{inspectBatch.orderIds?.views || 'Pending'}</span></div>
                  <div>Likes ({inspectBatch.likesProvider || 'Routing'}): <span className="text-pink-400 font-bold">{inspectBatch.orderIds?.likes || 'Pending'}</span></div>
                  <div>Saves (ReliableSMM #7841): <span className="text-amber-400 font-bold">{inspectBatch.orderIds?.saves || 'Pending / None'}</span></div>
                  <div>Reposts (ReliableSMM #7842): <span className="text-indigo-400 font-bold">{inspectBatch.orderIds?.reposts || 'Pending / None'}</span></div>
                  <div>Shares (ReliableSMM #2060): <span className="text-emerald-400 font-bold">{inspectBatch.orderIds?.shares || 'Pending / None'}</span></div>
                </div>
              </div>

              {/* Execution Logs */}
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Live Execution Trail:</div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 max-h-48 overflow-y-auto space-y-1 leading-relaxed">
                  {inspectBatch.executionLogs && inspectBatch.executionLogs.length > 0 ? (
                    inspectBatch.executionLogs.map((log, idx) => (
                      <div key={idx} className="font-mono text-slate-300">{log}</div>
                    ))
                  ) : (
                    <div className="text-slate-500 italic">No execution logs recorded yet. Batch is queued.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setInspectBatch(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {editModalCampaign && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl my-8 space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Edit Campaign Configuration
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                      {editModalCampaign.id}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Change target URL, volume metrics, duration, cadence gaps, or curve with automated batch rebalancing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditModalCampaign(null);
                  setEditForm(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="space-y-4">
              {/* Target & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="e.g. Viral Reel Growth Push"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                    Creator Handle
                  </label>
                  <input
                    type="text"
                    value={editForm.handle}
                    onChange={e => setEditForm({ ...editForm, handle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="@username"
                  />
                </div>
              </div>

              {/* Target URL */}
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                  Target Post / Reel URL
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    value={editForm.targetUrl}
                    onChange={e => {
                      const newUrl = e.target.value;
                      const parsed = parseTargetUrl(newUrl, editModalCampaign.platform);
                      setEditForm({
                        ...editForm,
                        targetUrl: newUrl,
                        handle: parsed.handle && editForm.handle.startsWith('@creator_') ? parsed.handle : editForm.handle
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="https://www.instagram.com/reel/..."
                  />
                </div>
              </div>

              {/* Circuit Breaker Auto-Pause on Outage Card */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20">
                <div className="flex items-start gap-3 pr-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      Auto-Pause Campaign if Any Service Is Unavailable
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                        Circuit Breaker
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Automatically halts the campaign immediately if ReliableSMM or JAP returns an API error, insufficient balance, or maintenance response to prevent dropped orders.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, autoPauseOnServiceFailure: !editForm.autoPauseOnServiceFailure })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    editForm.autoPauseOnServiceFailure ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      editForm.autoPauseOnServiceFailure ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Engagement Volume */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Target Engagement Volume</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const golden = computeGoldenRatioMetrics(editForm.views);
                      setEditForm({
                        ...editForm,
                        likes: golden.likes,
                        comments: golden.comments,
                        shares: golden.shares,
                        saves: golden.saves,
                        reposts: golden.reposts
                      });
                    }}
                    className="flex items-center gap-1 text-[11px] font-mono text-purple-400 hover:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Calculate Ratios (Golden Ratio)</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400"><Eye className="w-3 h-3 text-cyan-400" /> Views</span>
                      <span className="text-[9px] text-cyan-400 font-bold">Min 100</span>
                    </div>
                    <input
                      type="number"
                      min="100"
                      step="50"
                      value={editForm.views}
                      onChange={e => setEditForm({ ...editForm, views: Math.max(100, Number(e.target.value) || 100) })}
                      className="w-full bg-transparent text-white font-bold mt-1 focus:outline-none border-b border-slate-800 focus:border-cyan-400 pb-0.5"
                    />
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400"><Heart className="w-3 h-3 text-pink-400" /> Likes</span>
                      <span className="text-[9px] text-slate-400">Min 5</span>
                    </div>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={editForm.likes}
                      onChange={e => setEditForm({ ...editForm, likes: Math.max(5, Number(e.target.value) || 5) })}
                      className="w-full bg-transparent text-white font-bold mt-1 focus:outline-none border-b border-slate-800 focus:border-pink-400 pb-0.5"
                    />
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400"><MessageSquare className="w-3 h-3 text-emerald-400" /> Comments</span>
                      <span className="text-[9px] text-slate-400">0+</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editForm.comments}
                      onChange={e => setEditForm({ ...editForm, comments: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full bg-transparent text-white font-bold mt-1 focus:outline-none border-b border-slate-800 focus:border-emerald-400 pb-0.5"
                    />
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400"><Share2 className="w-3 h-3 text-emerald-400" /> Shares</span>
                      <span className="text-[9px] text-emerald-400 font-bold">Min 10</span>
                    </div>
                    <input
                      type="number"
                      min="10"
                      step="5"
                      value={editForm.shares}
                      onChange={e => setEditForm({ ...editForm, shares: Math.max(10, Number(e.target.value) || 10) })}
                      className="w-full bg-transparent text-white font-bold mt-1 focus:outline-none border-b border-slate-800 focus:border-emerald-400 pb-0.5"
                    />
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400"><Bookmark className="w-3 h-3 text-amber-400" /> Saves</span>
                      <span className="text-[9px] text-slate-400">Min 1</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="5"
                      value={editForm.saves}
                      onChange={e => setEditForm({ ...editForm, saves: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-full bg-transparent text-white font-bold mt-1 focus:outline-none border-b border-slate-800 focus:border-amber-400 pb-0.5"
                    />
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400"><RefreshCw className="w-3 h-3 text-indigo-400" /> Reposts</span>
                      <span className="text-[9px] text-slate-400">Min 1</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="2"
                      value={editForm.reposts}
                      onChange={e => setEditForm({ ...editForm, reposts: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-full bg-transparent text-white font-bold mt-1 focus:outline-none border-b border-slate-800 focus:border-indigo-400 pb-0.5"
                    />
                  </div>
                </div>
              </div>

              {/* Cadence Gap Range & Duration */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Cadence Interval & Dynamic Random Gap</span>
                  </div>
                  <div className="text-[11px] font-mono text-indigo-400 font-bold">
                    Random {editForm.minMins}–{editForm.maxMins}m per batch
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '20–35m', min: 20, max: 35 },
                    { label: '25m', min: 20, max: 30 },
                    { label: '35m', min: 25, max: 45 },
                    { label: '45m', min: 35, max: 55 },
                    { label: '60m', min: 45, max: 65 },
                    { label: '25–60m (Wide)', min: 25, max: 60 },
                  ].map(p => {
                    const active = editForm.minMins === p.min && editForm.maxMins === p.max;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, minMins: p.min, maxMins: p.max })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                          active
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {/* Duration & Custom Range */}
                <div className="grid grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
                  <div>
                    <label className="text-[10px] text-slate-500">Duration (Hours)</label>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={editForm.durationHours}
                      onChange={e => setEditForm({ ...editForm, durationHours: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-bold mt-0.5 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Min Gap (Mins)</label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={editForm.minMins}
                      onChange={e => setEditForm({ ...editForm, minMins: Math.max(5, Number(e.target.value) || 5) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-bold mt-0.5 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Max Gap (Mins)</label>
                    <input
                      type="number"
                      min={editForm.minMins}
                      max="180"
                      value={editForm.maxMins}
                      onChange={e => setEditForm({ ...editForm, maxMins: Math.max(editForm.minMins, Number(e.target.value) || editForm.minMins) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-bold mt-0.5 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>
              </div>

              {/* Algorithmic Curve */}
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                  Algorithmic Curve
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                  {[
                    { id: 'trending_rocket', label: 'Trending Rocket', icon: '🚀' },
                    { id: 'steady_climb', label: 'Steady Climb', icon: '📈' },
                    { id: 'explore_push', label: 'Explore Push', icon: '🔥' },
                    { id: 'fyp_waves', label: 'FYP Waves', icon: '🌊' },
                    { id: 'circadian', label: 'Circadian Sleep/Wake', icon: '🌙' },
                    { id: 'evergreen', label: 'Evergreen Slow-Burn', icon: '⏳' },
                  ].map(c => {
                    const isSelected = editForm.curve === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, curve: c.id as AlgorithmicCurve })}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-950/60 border-purple-500/50 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <span className="text-sm">{c.icon}</span>
                        <span className="truncate text-[11px] font-bold">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Smart Rebalance Toggle */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl border border-purple-500/30 bg-purple-950/20 font-mono">
                <input
                  type="checkbox"
                  id="rebalanceToggle"
                  checked={editForm.rebalancePendingBatches}
                  onChange={e => setEditForm({ ...editForm, rebalancePendingBatches: e.target.checked })}
                  className="mt-0.5 rounded border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="rebalanceToggle" className="text-xs cursor-pointer select-none">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>Smart Rebalance Remaining Batches (Recommended)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Preserves already dispatched/completed batches, subtracts delivered volume, and smoothly re-distributes only the remaining metrics across newly timed batches starting now.
                  </p>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 font-mono">
              <button
                type="button"
                onClick={() => {
                  setEditModalCampaign(null);
                  setEditForm(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={handleSaveEdit}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingEdit ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save & Update Campaign</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone & Configure Campaign Modal */}
      {cloneModalCampaign && cloneForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 max-w-2xl w-full shadow-2xl my-8 space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      Clone & Configure Campaign
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                      New Duplicate
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modify target post URL, handle, volume metrics, duration, cadence gaps, or curve before launching.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCloneModalCampaign(null);
                  setCloneForm(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="space-y-4">
              {/* Campaign Name & Creator Handle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                    New Campaign Name
                  </label>
                  <input
                    type="text"
                    value={cloneForm.name}
                    onChange={e => setCloneForm({ ...cloneForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g. Viral Push #2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                    Creator Handle
                  </label>
                  <input
                    type="text"
                    value={cloneForm.handle}
                    onChange={e => setCloneForm({ ...cloneForm, handle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="@username"
                  />
                </div>
              </div>

              {/* Target Post / Reel URL with highlight */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-indigo-500/30 space-y-1.5">
                <label className="block text-xs font-mono font-bold text-indigo-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    Target Post / Reel URL (Edit or Replace Link)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Apply recipe to new link</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={cloneForm.targetUrl}
                    onChange={e => {
                      const newUrl = e.target.value;
                      const parsed = parseTargetUrl(newUrl, cloneModalCampaign.platform);
                      setCloneForm({
                        ...cloneForm,
                        targetUrl: newUrl,
                        handle: parsed.handle && cloneForm.handle.startsWith('@creator_') ? parsed.handle : cloneForm.handle
                      });
                    }}
                    className="w-full bg-slate-900 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-400 transition-colors placeholder:text-slate-600"
                    placeholder="https://www.instagram.com/reel/..."
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  Tip: Paste the new Instagram Reel or Post URL here to launch this duplicate for another video.
                </p>
              </div>

              {/* Circuit Breaker Auto-Pause Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20">
                <div className="flex items-start gap-3 pr-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      Auto-Pause Campaign if Any Service Is Unavailable
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                        Circuit Breaker
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Halts campaign if ReliableSMM or JAP returns API rejection or balance issues. (Likes errors automatically reroute to ReliableSMM without pausing).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCloneForm({ ...cloneForm, autoPauseOnServiceFailure: !cloneForm.autoPauseOnServiceFailure })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    cloneForm.autoPauseOnServiceFailure ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      cloneForm.autoPauseOnServiceFailure ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Engagement Metrics */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Target Engagement Volume</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const golden = computeGoldenRatioMetrics(cloneForm.views);
                      setCloneForm({
                        ...cloneForm,
                        likes: golden.likes,
                        comments: golden.comments,
                        shares: golden.shares,
                        saves: golden.saves,
                        reposts: golden.reposts
                      });
                    }}
                    className="flex items-center gap-1 text-[11px] font-mono text-purple-400 hover:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Calculate Ratios (Golden Ratio)</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400"><Eye className="w-3 h-3 text-cyan-400" /> Views</span>
                      <span className="text-[9px] text-cyan-400 font-bold">Min 100</span>
                    </div>
                    <input
                      type="number"
                      min="100"
                      step="50"
                      value={cloneForm.views}
                      onChange={e => setCloneForm({ ...cloneForm, views: Math.max(100, Number(e.target.value) || 100) })}
                      className="w-full bg-transparent text-white font-bold mt-1 focus:outline-none border-b border-slate-800 focus:border-cyan-400 pb-0.5"
                    />
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400"><Heart className="w-3 h-3 text-pink-400" /> Likes</span>
                      <span className="text-[9px] text-slate-400">Min 5</span>
                    </div>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={cloneForm.likes}
                      onChange={e => setCloneForm({ ...cloneForm, likes: Math.max(5, Number(e.target.value) || 5) })}
                      className="w-full bg-transparent text-white font-bold mt-1 focus:outline-none border-b border-slate-800 focus:border-pink-400 pb-0.5"
                    />
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400"><MessageSquare className="w-3 h-3 text-emerald-400" /> Comments</span>
                      <span className="text-[9px] text-slate-400">0+</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={cloneForm.comments}
                      onChange={e => setCloneForm({ ...cloneForm, comments: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full bg-transparent text-white font-bold mt-1 focus:outline-none border-b border-slate-800 focus:border-emerald-400 pb-0.5"
                    />
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400"><Share2 className="w-3 h-3 text-emerald-400" /> Shares</span>
                      <span className="text-[9px] text-emerald-400 font-bold">Min 10</span>
                    </div>
                    <input
                      type="number"
                      min="10"
                      step="5"
                      value={cloneForm.shares}
                      onChange={e => setCloneForm({ ...cloneForm, shares: Math.max(10, Number(e.target.value) || 10) })}
                      className="w-full bg-transparent text-white font-bold mt-1 focus:outline-none border-b border-slate-800 focus:border-emerald-400 pb-0.5"
                    />
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400"><Bookmark className="w-3 h-3 text-amber-400" /> Saves</span>
                      <span className="text-[9px] text-slate-400">Min 1</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="5"
                      value={cloneForm.saves}
                      onChange={e => setCloneForm({ ...cloneForm, saves: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-full bg-transparent text-white font-bold mt-1 focus:outline-none border-b border-slate-800 focus:border-amber-400 pb-0.5"
                    />
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400"><RefreshCw className="w-3 h-3 text-indigo-400" /> Reposts</span>
                      <span className="text-[9px] text-slate-400">Min 1</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="2"
                      value={cloneForm.reposts}
                      onChange={e => setCloneForm({ ...cloneForm, reposts: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-full bg-transparent text-white font-bold mt-1 focus:outline-none border-b border-slate-800 focus:border-indigo-400 pb-0.5"
                    />
                  </div>
                </div>
              </div>

              {/* Cadence Gap Range & Duration */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Cadence Interval & Dynamic Random Gap</span>
                  </div>
                  <div className="text-[11px] font-mono text-indigo-400 font-bold">
                    Random {cloneForm.minMins}–{cloneForm.maxMins}m per batch
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '20–35m', min: 20, max: 35 },
                    { label: '25m', min: 20, max: 30 },
                    { label: '35m', min: 25, max: 45 },
                    { label: '45m', min: 35, max: 55 },
                    { label: '60m', min: 45, max: 65 },
                    { label: '25–60m (Wide)', min: 25, max: 60 },
                  ].map(p => {
                    const active = cloneForm.minMins === p.min && cloneForm.maxMins === p.max;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setCloneForm({ ...cloneForm, minMins: p.min, maxMins: p.max })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                          active
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
                  <div>
                    <label className="text-[10px] text-slate-500">Duration (Hours)</label>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={cloneForm.durationHours}
                      onChange={e => setCloneForm({ ...cloneForm, durationHours: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-bold mt-0.5 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Min Gap (Mins)</label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={cloneForm.minMins}
                      onChange={e => setCloneForm({ ...cloneForm, minMins: Math.max(5, Number(e.target.value) || 5) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-bold mt-0.5 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Max Gap (Mins)</label>
                    <input
                      type="number"
                      min={cloneForm.minMins}
                      max="180"
                      value={cloneForm.maxMins}
                      onChange={e => setCloneForm({ ...cloneForm, maxMins: Math.max(cloneForm.minMins, Number(e.target.value) || cloneForm.minMins) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-bold mt-0.5 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>
              </div>

              {/* Algorithmic Curve */}
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                  Algorithmic Curve
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                  {[
                    { id: 'trending_rocket', label: 'Trending Rocket', icon: '🚀' },
                    { id: 'steady_climb', label: 'Steady Climb', icon: '📈' },
                    { id: 'explore_push', label: 'Explore Push', icon: '🔥' },
                    { id: 'fyp_waves', label: 'FYP Waves', icon: '🌊' },
                    { id: 'circadian', label: 'Circadian Sleep/Wake', icon: '🌙' },
                    { id: 'evergreen', label: 'Evergreen Slow-Burn', icon: '⏳' },
                  ].map(c => {
                    const isSelected = cloneForm.curve === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCloneForm({ ...cloneForm, curve: c.id as AlgorithmicCurve })}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-950/70 border-indigo-500/60 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <span className="text-sm">{c.icon}</span>
                        <span className="truncate text-[11px] font-bold">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 font-mono">
              <button
                type="button"
                onClick={() => {
                  setCloneModalCampaign(null);
                  setCloneForm(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingClone}
                onClick={handleConfirmClone}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmittingClone ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Launching Cloned Campaign...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-3.5 h-3.5" />
                    <span>Confirm & Launch Cloned Campaign</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {isBulkEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-purple-500/50 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl shadow-purple-950/50 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Bulk Edit Campaigns</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Applying new settings to {selectedCampaignIds.length} selected campaign(s)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkEditOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 font-mono">
              {/* Selected Campaign Tags */}
              <div>
                <label className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1.5">
                  Target Campaigns
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800">
                  {campaigns
                    .filter(c => selectedCampaignIds.includes(c.id))
                    .map(c => (
                      <span
                        key={c.id}
                        className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/30 text-purple-200 text-[11px]"
                      >
                        {c.name}
                      </span>
                    ))}
                </div>
              </div>

              {/* Circuit Breaker Auto-Pause Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-purple-400" />
                    <span>Auto-Pause on Service Outage</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Halt dispatch automatically if SMM API returns provider outages
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBulkEditForm({ ...bulkEditForm, autoPauseOnServiceFailure: !bulkEditForm.autoPauseOnServiceFailure })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                    bulkEditForm.autoPauseOnServiceFailure ? 'bg-purple-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              {/* Cadence Range */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>Batch Cadence Range</span>
                  </div>
                  <span className="text-[11px] text-purple-400 font-bold">
                    Random {bulkEditForm.minMins}–{bulkEditForm.maxMins}m gap
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '20–35m (Recommended)', min: 20, max: 35 },
                    { label: '25–40m', min: 25, max: 40 },
                    { label: '35–55m', min: 35, max: 55 },
                    { label: '45–65m', min: 45, max: 65 },
                  ].map(p => {
                    const active = bulkEditForm.minMins === p.min && bulkEditForm.maxMins === p.max;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setBulkEditForm({ ...bulkEditForm, minMins: p.min, maxMins: p.max })}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                          active
                            ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500">Min Gap (Mins)</label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={bulkEditForm.minMins}
                      onChange={e => setBulkEditForm({ ...bulkEditForm, minMins: Math.max(5, Number(e.target.value) || 5) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-bold mt-0.5 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Max Gap (Mins)</label>
                    <input
                      type="number"
                      min={bulkEditForm.minMins}
                      max="180"
                      value={bulkEditForm.maxMins}
                      onChange={e => setBulkEditForm({ ...bulkEditForm, maxMins: Math.max(bulkEditForm.minMins, Number(e.target.value) || bulkEditForm.minMins) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-bold mt-0.5 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
              </div>

              {/* Algorithmic Curve */}
              <div>
                <label className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1.5">
                  Delivery Curve Pattern
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'trending_rocket', label: 'Trending Rocket', icon: '🚀' },
                    { id: 'steady_climb', label: 'Steady Climb', icon: '📈' },
                    { id: 'explore_push', label: 'Explore Push', icon: '🔥' },
                    { id: 'fyp_waves', label: 'FYP Waves', icon: '🌊' },
                    { id: 'circadian', label: 'Circadian Sleep/Wake', icon: '🌙' },
                    { id: 'evergreen', label: 'Evergreen Slow-Burn', icon: '⏳' },
                  ].map(c => {
                    const isSelected = bulkEditForm.curve === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setBulkEditForm({ ...bulkEditForm, curve: c.id as AlgorithmicCurve })}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-950/70 border-purple-500/60 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <span className="text-sm">{c.icon}</span>
                        <span className="truncate text-[11px] font-bold">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rebalance Pending Batches Checkbox */}
              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="rebalance-checkbox"
                  checked={bulkEditForm.rebalancePendingBatches}
                  onChange={e => setBulkEditForm({ ...bulkEditForm, rebalancePendingBatches: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-700 bg-slate-900 cursor-pointer"
                />
                <label htmlFor="rebalance-checkbox" className="text-xs text-slate-300 cursor-pointer">
                  <span className="font-bold text-white block">Smart Rebalance Pending Batches</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Recalculates remaining quota and schedule intervals using the selected curve without altering already dispatched batches.
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 font-mono">
              <button
                type="button"
                onClick={() => setIsBulkEditOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkLoading}
                onClick={handleApplyBulkEdit}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isBulkLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Applying Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Apply To {selectedCampaignIds.length} Campaigns</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirm Modal */}
      {isBulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl shadow-rose-950/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Selected Campaigns?</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedCampaignIds.length} campaign(s) will be permanently deleted
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 max-h-36 overflow-y-auto space-y-1 font-mono text-xs">
              {campaigns
                .filter(c => selectedCampaignIds.includes(c.id))
                .map(c => (
                  <div key={c.id} className="text-slate-300 truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>{c.name}</span>
                  </div>
                ))}
            </div>

            <p className="text-xs text-rose-300/90 font-mono">
              All ongoing queued batches will be aborted and removed from the active queue. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 font-mono">
              <button
                type="button"
                onClick={() => setIsBulkDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkLoading}
                onClick={handleBulkDeleteConfirm}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isBulkLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete ({selectedCampaignIds.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import & Recovery Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl shadow-cyan-950/50 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">Restore Campaign Fleet</h3>
                  <p className="text-xs text-slate-400">
                    Import from a JSON file, scan browser storage, or paste JSON
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Method 1: File Upload */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-slate-200">Option 1: Upload Backup File (.json)</div>
                <p className="text-[11px] text-slate-400">
                  If you previously clicked "Download JSON", select that file to restore all campaigns instantly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose JSON Backup File</span>
                </button>
              </div>

              {/* Method 2: Scan Browser Storage */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-slate-200">Option 2: Deep Scan Local Browser Cache</div>
                <p className="text-[11px] text-slate-400">
                  Scans this browser's localStorage for any previous campaign backups or cached queues.
                </p>
                <button
                  type="button"
                  onClick={handleCheckBrowserStorage}
                  className="w-full py-2 px-3 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Scan Local Browser Storage</span>
                </button>
              </div>

              {/* Method 3: Paste Raw JSON */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-slate-200">Option 3: Paste Raw JSON Array</div>
                <p className="text-[11px] text-slate-400">
                  Paste copied campaign JSON data directly here:
                </p>
                <textarea
                  rows={4}
                  value={pastedJsonText}
                  onChange={e => setPastedJsonText(e.target.value)}
                  placeholder='[ { "id": "...", "name": "...", "batches": [...] } ]'
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  type="button"
                  disabled={!pastedJsonText.trim()}
                  onClick={handleImportPastedJSON}
                  className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Restore From Pasted JSON</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

