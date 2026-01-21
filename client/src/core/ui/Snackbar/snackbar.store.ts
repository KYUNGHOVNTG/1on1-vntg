/**
 * Snackbar Store
 *
 * Snackbar 상태 관리를 위한 Zustand 스토어
 */

import { create } from 'zustand';
import type { Snackbar, SnackbarAction } from './Snackbar.types';

interface SnackbarState {
  snackbars: Snackbar[];
  addSnackbar: (snackbar: Omit<Snackbar, 'id'>) => void;
  removeSnackbar: (id: string) => void;
  clearAll: () => void;
}

export const useSnackbarStore = create<SnackbarState>((set) => ({
  snackbars: [],

  addSnackbar: (snackbar) => {
    const id = `snackbar-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    set((state) => ({
      snackbars: [...state.snackbars, { ...snackbar, id }],
    }));
  },

  removeSnackbar: (id) => {
    set((state) => ({
      snackbars: state.snackbars.filter((snackbar) => snackbar.id !== id),
    }));
  },

  clearAll: () => {
    set({ snackbars: [] });
  },
}));

/**
 * Snackbar 헬퍼 함수
 *
 * @example
 * snackbar.show('항목이 삭제되었습니다');
 * snackbar.show('파일이 삭제되었습니다', {
 *   label: '취소',
 *   onClick: handleUndo
 * });
 */
export const snackbar = {
  show: (message: string, action?: SnackbarAction, duration?: number) => {
    useSnackbarStore.getState().addSnackbar({ message, action, duration });
  },
};
