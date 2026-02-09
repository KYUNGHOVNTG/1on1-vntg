/**
 * Menu Domain Store
 *
 * 메뉴 상태 관리 (Zustand)
 */

import { create } from 'zustand';
import { getUserMenus } from './api';
import type { MenuHierarchy } from './types';

interface MenuState {
    /** 사용자 메뉴 목록 */
    menus: MenuHierarchy[];
    /** 로딩 상태 */
    loading: boolean;
    /** 에러 메시지 */
    error: string | null;

    /** 사용자 메뉴 조회 */
    fetchUserMenus: (userId: string, positionCode: string, roleCode: string) => Promise<void>;
    /** 상태 초기화 */
    reset: () => void;
}

export const useMenuStore = create<MenuState>((set) => ({
    menus: [],
    loading: false,
    error: null,

    fetchUserMenus: async (userId: string, positionCode: string, roleCode: string) => {
        set({ loading: true, error: null });
        try {
            const response = await getUserMenus(userId, positionCode, roleCode);
            set({ menus: response.menus, loading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : '메뉴 조회 중 오류가 발생했습니다.',
                loading: false,
            });
        }
    },

    reset: () => {
        set({ menus: [], loading: false, error: null });
    },
}));
