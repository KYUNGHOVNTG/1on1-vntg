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
  /** 표시 이름 - 로그인 시 Google 이름, /me 갱신 후 name_kor로 교체됨 */
  name: string;
  /** 직책 코드 (예: P001) */
  position_code: string;
  /** 역할 코드 (예: R001=시스템 관리자, R002=일반 사용자) */
  role_code: string;
  /** 사번 (hr_mgnt.emp_no) - /me 호출 후 채워짐 */
  emp_no?: string;
  /** 부서 코드 (hr_mgnt.dept_code) - /me 호출 후 채워짐 */
  dept_code?: string;
  /** 부서명 (cm_department.dept_name) - /me 호출 후 채워짐 */
  dept_name?: string;
  /** 한글 이름 (hr_mgnt.name_kor) - /me 호출 후 채워짐 */
  name_kor?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

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
    }),
    {
      name: 'auth-storage', // localStorage key
    }
  )
);
