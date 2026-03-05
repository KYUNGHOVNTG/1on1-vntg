/**
 * Auth Store (Skeleton)
 *
 * 인증 상태 관리
 *
 * @example
 * const { user, login, logout } = useAuthStore();
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  /** 직책 코드 (예: P001) */
  position_code: string;
  /** 역할 코드 (예: R001=시스템 관리자, R002=일반 사용자) */
  role_code: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /** Zustand persist hydration 완료 여부 — persist 복원 전까지 false */
  _hasHydrated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

      login: async (email: string, password: string) => {
        // TODO: API 호출로 로그인 처리
        // const response = await apiClient.post('/auth/login', { email, password });
        // set({ user: response.data.user, token: response.data.token, isAuthenticated: true });

        console.log('Login called with:', email, password);
      },

      logout: () => {
        // TODO: 토큰 삭제, 상태 초기화
        set({ user: null, token: null, isAuthenticated: false });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setHasHydrated: (hasHydrated: boolean) => {
        set({ _hasHydrated: hasHydrated });
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      // _hasHydrated는 persist 대상에서 제외 (항상 런타임에 결정)
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
