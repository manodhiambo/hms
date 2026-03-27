import { useEffect, useState } from 'react';
import { ScrollText, Search, Filter, Printer } from 'lucide-react';
import { auditApi } from '../../api/services';
import type { ActivityLog } from '../../types';

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-green-100 text-green-700',
  DELETE_USER: 'bg-red-100 text-red-700',
  CREATE: 'bg-blue-100 text-blue-700',
  UPDATE: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
  PAYMENT: 'bg-purple-100 text-purple-700',
  DISPENSE: 'bg-teal-100 text-teal-700',
  RELEASE: 'bg-indigo-100 text-indigo-700',
};

function actionBadge(action: string) {
  const cls = ACTION_COLORS[action] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {action.replace(/_/g, ' ')}
    </span>
  );
}

function fmt(dt: string) {
  try {
    return new Date(dt).toLocaleString('en-KE', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return dt;
  }
}

export default function AuditPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [startFilter, setStartFilter] = useState('');
  const [endFilter, setEndFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const load = (p = 0) => {
    setLoading(true);
    auditApi.getLogs({
      action: actionFilter || undefined,
      start: startFilter ? startFilter + ':00' : undefined,
      end: endFilter ? endFilter + ':59' : undefined,
      page: p,
      size: 50,
    })
      .then((r) => {
        setLogs(r.data.data.content);
        setTotalPages(r.data.data.totalPages);
        setTotalElements(r.data.data.totalElements);
        setPage(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(0); }, []); // eslint-disable-line

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(0);
  };

  const printLogs = () => {
    const win = window.open('', '_blank', 'width=1000,height=700');
    if (!win) return;
    const rows = logs.map((l) => `
      <tr>
        <td>${fmt(l.createdAt)}</td>
        <td><strong>${l.actorName || '—'}</strong><br/><small>${l.actorRole || ''}</small></td>
        <td>${l.action.replace(/_/g, ' ')}</td>
        <td>${l.entityType || '—'}${l.entityId ? ' #' + l.entityId : ''}</td>
        <td>${l.details || '—'}</td>
        <td>${l.ipAddress || '—'}</td>
      </tr>`).join('');
    win.document.write(`<!DOCTYPE html><html><head><title>Audit Log</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
        h2 { text-align: center; margin-bottom: 4px; }
        p { text-align: center; color: #555; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #1e3a5f; color: white; padding: 6px 8px; text-align: left; font-size: 11px; }
        td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
        tr:nth-child(even) { background: #f9fafb; }
        small { color: #6b7280; }
      </style></head><body>
      <h2>System Audit Log</h2>
      <p>Printed: ${new Date().toLocaleString('en-KE')} &nbsp;|&nbsp; ${totalElements} total records</p>
      <table>
        <thead><tr>
          <th>Date & Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th><th>IP Address</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ScrollText className="w-6 h-6 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-sm text-gray-500">{totalElements.toLocaleString()} total records</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
          <button
            onClick={printLogs}
            className="flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Action (keyword)</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  placeholder="e.g. LOGIN, DELETE..."
                  className="w-full pl-9 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
              <input
                type="datetime-local"
                value={startFilter}
                onChange={(e) => setStartFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
              <input
                type="datetime-local"
                value={endFilter}
                onChange={(e) => setEndFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
              Apply Filters
            </button>
            <button
              type="button"
              onClick={() => { setActionFilter(''); setStartFilter(''); setEndFilter(''); load(0); }}
              className="border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Entity</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Details</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 font-mono">{fmt(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-sm">{log.actorName || '—'}</div>
                      <div className="text-xs text-gray-400">{log.actorRole?.replace(/_/g, ' ')}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{actionBadge(log.action)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {log.entityType || '—'}
                      {log.entityId && <span className="text-gray-400"> #{log.entityId}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate" title={log.details ?? ''}>
                      {log.details || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{log.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => load(page - 1)}
              disabled={page === 0}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => load(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
