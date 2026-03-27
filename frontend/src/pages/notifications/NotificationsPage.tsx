import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { notificationApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import type { Notification } from '../../types';

export default function NotificationsPage() {
  const userId = useAuthStore((s) => s.userId);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    if (!userId) return;
    setLoading(true);
    notificationApi.get(userId).then((r) => setNotifications(r.data.data.content)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [userId]);

  const markRead = async (id: number) => {
    await notificationApi.markRead(id);
    load();
    if (userId) fetchUnreadCount(userId);
  };

  const markAllRead = async () => {
    if (!userId) return;
    await notificationApi.markAllRead(userId);
    load();
    fetchUnreadCount(userId);
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      await notificationApi.markRead(n.id);
      if (userId) fetchUnreadCount(userId);
    }
    const type = (n.type || '').toUpperCase();
    if (type.includes('VISIT') || type.includes('QUEUE')) {
      navigate('/my-queue');
    } else {
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        </div>
        <button onClick={markAllRead} className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700">
          <CheckCheck className="w-4 h-4" /> Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-primary-50/50' : ''}`}
            >
              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.read ? 'bg-primary-500' : 'bg-transparent'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</p>
              </div>
              {!n.read && (
                <button onClick={(e) => { e.stopPropagation(); markRead(n.id); }} className="text-primary-600 hover:text-primary-700 p-1">
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
