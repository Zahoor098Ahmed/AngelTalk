import React, { useState, useEffect } from "react";
import { ShieldAlert, Search, RefreshCw, Eye } from "lucide-react";
import { api } from "../api/client";
import { keep, peek } from "../api/cache";
import { AuditLog } from "../types";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";
import { ErrorNotice } from "../components/common/ErrorNotice";
import { errorMessage } from "../api/errors";

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(() => peek<AuditLog[]>("audit") ?? []);
  const [loading, setLoading] = useState(() => !peek("audit"));
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    if (!peek("audit")) setLoading(true);
    setError(null);
    try {
      const response = await api.get("/admin/audit-logs");
      if (response.data?.data) {
        setLogs(keep("audit", response.data.data.logs || response.data.data));
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actorId?.toLowerCase().includes(search.toLowerCase()) ||
      String(l.meta?.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      l.ip?.includes(search)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Security & Audit Trail</h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable system logs recorded for security compliance and PDPL compliance.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {error && <ErrorNotice message={error} onRetry={fetchLogs} />}

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl ring-1 ring-slate-200/80 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, user ID, or IP..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono">
          {filteredLogs.length} events logged
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl ring-1 ring-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-5">Security Action</th>
                <th className="py-3 px-5">Actor / User ID</th>
                <th className="py-3 px-5">Source IP</th>
                <th className="py-3 px-5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading security log entries...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No security events found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-5 font-mono text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-5">
                      <Badge
                        variant={
                          log.action.includes("lockout") || log.action.includes("deleted")
                            ? "danger"
                            : log.action.includes("login")
                            ? "primary"
                            : "neutral"
                        }
                      >
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-5 font-mono text-slate-700">
                      {String(log.meta?.email ?? "") || log.actorId || "system"}
                    </td>
                    <td className="py-3 px-5 font-mono text-slate-500">
                      {log.ip || "—"}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        title="View Metadata"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Metadata"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              <span className="font-bold text-slate-900 text-sm">{selectedLog.action}</span>
            </div>
            <pre className="p-4 bg-slate-900 text-indigo-300 rounded-xl text-xs overflow-x-auto font-mono">
              {JSON.stringify(selectedLog, null, 2)}
            </pre>
            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

