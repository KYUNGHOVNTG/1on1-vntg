/**
 * Notification Store
 *
 * 알림 센터 상태 관리를 위한 Zustand 스토어
 */

import { create } from 'zustand';
import type { Notification, NotificationType } from './NotificationCenter.types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      read: false,
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: notification && !notification.read ? state.unreadCount - 1 : state.unreadCount,
      };
    });
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: state.notifications.find((n) => n.id === id && !n.read)
        ? state.unreadCount - 1
        : state.unreadCount,
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));

/**
 * Notification 헬퍼 함수
 *
 * @example
 * notification.info('새 메시지', '새로운 메시지가 도착했습니다');
 * notification.success('저장 완료', '데이터가 성공적으로 저장되었습니다');
 */
export const notification = {
  add: (type: NotificationType, title: string, message: string, link?: string) => {
    useNotificationStore.getState().addNotification({ type, title, message, link });
  },
  info: (title: string, message: string, link?: string) => {
    notification.add('info', title, message, link);
  },
  success: (title: string, message: string, link?: string) => {
    notification.add('success', title, message, link);
  },
  warning: (title: string, message: string, link?: string) => {
    notification.add('warning', title, message, link);
  },
  error: (title: string, message: string, link?: string) => {
    notification.add('error', title, message, link);
  },
};
