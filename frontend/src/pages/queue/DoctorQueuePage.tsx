import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Play, RefreshCw } from 'lucide-react';
import { visitApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import type { Visit } from '../../types';
import StatusBadge from '../../components/StatusBadge';

export default function DoctorQueuePage() {
  const userId = useAuthStore((s) => s.userId);
  const [queue, setQueue] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadQueue = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await visitApi.getDoctorQueue(userId);
      setQueue(res.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 30000);
    return () => clearInterval(interval);
  }, [loadQueue]);

  const getWaitTime = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Queue</h1>
            <p className="text-sm text-gray-500">{queue.length} patient{queue.length !== 1 ? 's' : ''} waiting</p>
          </div>
        </div>
        <button onClick={loadQueue} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading && queue.length === 0 ? (
        <div className="p-12 text-center text-gray-400">Loading...</div>
      ) : queue.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg font-medium">No patients waiting</p>
          <p className="text-gray-400 text-sm mt-1">Your queue is empty</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((visit, index) => (
            <div key={visit.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-5 hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-semibold text-gray-900">{visit.patientName}</p>
                  <span className="text-xs text-gray-500">{visit.patientNo}</span>
                  <StatusBadge status={visit.visitType} />
                </div>
                {visit.chiefComplaint && (
                  <p className="text-sm text-gray-600 truncate">{visit.chiefComplaint}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">Waiting: {getWaitTime(visit.createdAt)}</p>
              </div>
              <button
                onClick={() => navigate(`/visits/${visit.id}`)}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 shrink-0"
              >
                <Play className="w-4 h-4" /> Start Consultation
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
