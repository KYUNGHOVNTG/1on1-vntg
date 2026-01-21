/**
 * Toast Store
 *
 * Toast 상태 관리를 위한 Zustand 스토어
 */

import { create } from 'zustand';
import type { Toast } from './Toast.types';

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },
}));

/**
 * Toast 헬퍼 함수
 *
 * @example
 * toast.success('저장되었습니다');
 * toast.error('오류가 발생했습니다');
 * toast.warning('경고 메시지');
 * toast.info('안내 메시지');
 */
export const toast = {
  success: (message: string, duration?: number) => {
    useToastStore.getState().addToast({ message, variant: 'success', duration });
  },
  error: (message: string, duration?: number) => {
    useToastStore.getState().addToast({ message, variant: 'error', duration });
  },
  warning: (message: string, duration?: number) => {
    useToastStore.getState().addToast({ message, variant: 'warning', duration });
  },
  info: (message: string, duration?: number) => {
    useToastStore.getState().addToast({ message, variant: 'info', duration });
  },
};
