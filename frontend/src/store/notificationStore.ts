import { create } from 'zustand';
import { notificationApi } from '../api/services';

interface NotificationState {
  unreadCount: number;
  fetchUnreadCount: (userId: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  fetchUnreadCount: async (userId: number) => {
    try {
      const res = await notificationApi.unreadCount(userId);
      set({ unreadCount: res.data.data });
    } catch {
      // ignore
    }
  },
}));
