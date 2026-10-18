import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  ExternalLink,
  Code2,
  Trash2
} from 'lucide-react';
import { DispatchLog } from '../types';

export const ExecutionLogsView: React.FC = () => {
  const [logs, setLogs] = useState<DispatchLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<DispatchLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch logs from backend
  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        if (data.logs && Array.isArray(data.logs)) {
          setLogs(data.logs);
          return;
        }
      }
    } catch (e) {
      console.warn('Logs fetch fallback:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => 
    log.campaignName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.providerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.metricType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              SMM v2 Protocol Execution Audit Logs
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Live Stream
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time audit log of all automated dispatches sent by the 24/7 background scheduler to parent SMM panels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3 backdrop-blur-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search logs by Order ID, Provider, Campaign, or Metric..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
          />
        </div>
        <span className="text-xs font-mono text-slate-400 pr-2">
          {filteredLogs.length} Entries
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Campaign</th>
                <th className="py-2.5 px-3">Batch</th>
                <th className="py-2.5 px-3">Provider</th>
                <th className="py-2.5 px-3">Service ID</th>
                <th className="py-2.5 px-3">Metric</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    No SMM v2 dispatches recorded yet. Launch a campaign to see live background execution logs.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-900/60 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 text-white font-semibold truncate max-w-[150px]">
                      {log.campaignName}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-cyan-400">
                      #{log.batchIndex}
                    </td>
                    <td className="py-2.5 px-3 text-white font-medium">
                      {log.providerName}
                    </td>
                    <td className="py-2.5 px-3 text-purple-300">
                      #{log.serviceId}
                    </td>
                    <td className="py-2.5 px-3 capitalize text-slate-300">
                      {log.metricType}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                      {log.quantity.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {log.orderId || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                        Dispatched
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Log Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-400" />
                <span>SMM v2 Protocol Packet Details</span>
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span className="text-slate-500">Campaign:</span>
                <span className="text-white font-bold">{selectedLog.campaignName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span className="text-slate-500">Order ID:</span>
                <span className="text-emerald-400 font-bold">{selectedLog.orderId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span className="text-slate-500">Provider & Service:</span>
                <span className="text-purple-300">{selectedLog.providerName} (Service #{selectedLog.serviceId})</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span className="text-slate-500">Quantity Dispatched:</span>
                <span className="text-white">{selectedLog.quantity.toLocaleString()} {selectedLog.metricType}</span>
              </div>
            </div>

            <div>
              <div className="text-slate-400 mb-1">Raw Response Payload:</div>
              <pre className="bg-slate-900 p-3 rounded-lg text-emerald-300 overflow-x-auto text-[11px] border border-slate-800">
                {JSON.stringify(selectedLog.responsePayload, null, 2)}
              </pre>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
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
