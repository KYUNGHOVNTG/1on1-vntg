/**
 * R&R 도메인 Store
 *
 * 나의 R&R 관리 관련 상태 관리 (Zustand)
 */

import { create } from 'zustand';
import type {
  RrItem,
  MyDepartmentItem,
  ParentRrOption,
  RrCreateRequest,
} from './types';
import * as rnrApi from './api';

// =============================================
// State 타입 정의
// =============================================

interface RnrState {
  // R&R 목록
  myRrList: RrItem[];
  myRrTotal: number;

  // 내 부서 목록 (겸직 포함)
  myDepartments: MyDepartmentItem[];
  myDepartmentsTotal: number;

  // 상위 R&R 선택 목록
  parentRrOptions: ParentRrOption[];
  parentRrOptionsTotal: number;

  // 로딩 상태
  isLoading: {
    myRrList: boolean;
    myDepartments: boolean;
    parentRrOptions: boolean;
    createRr: boolean;
  };

  // 에러 상태
  error: {
    myRrList: string | null;
    myDepartments: string | null;
    parentRrOptions: string | null;
    createRr: string | null;
  };

  // 액션
  fetchMyRrList: (year?: string) => Promise<void>;
  fetchMyDepartments: () => Promise<void>;
  fetchParentRrOptions: (deptCode: string, year?: string) => Promise<void>;
  createRr: (request: RrCreateRequest) => Promise<RrItem>;
  clearError: (key: keyof RnrState['error']) => void;
}

// =============================================
// Store 생성
// =============================================

export const useRnrStore = create<RnrState>((set, get) => ({
  // 초기 상태
  myRrList: [],
  myRrTotal: 0,

  myDepartments: [],
  myDepartmentsTotal: 0,

  parentRrOptions: [],
  parentRrOptionsTotal: 0,

  isLoading: {
    myRrList: false,
    myDepartments: false,
    parentRrOptions: false,
    createRr: false,
  },

  error: {
    myRrList: null,
    myDepartments: null,
    parentRrOptions: null,
    createRr: null,
  },

  // =============================================
  // 액션
  // =============================================

  /**
   * 나의 R&R 목록 조회
   *
   * @param year - 기준 연도 (YYYY, 기본값: 현재 연도)
   */
  fetchMyRrList: async (year?: string) => {
    set((state) => ({
      isLoading: { ...state.isLoading, myRrList: true },
      error: { ...state.error, myRrList: null },
    }));

    try {
      const response = await rnrApi.getMyRrList(year);
      set((state) => ({
        myRrList: response.items,
        myRrTotal: response.total,
        isLoading: { ...state.isLoading, myRrList: false },
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'R&R 목록 조회 실패';
      set((state) => ({
        isLoading: { ...state.isLoading, myRrList: false },
        error: { ...state.error, myRrList: errorMessage },
      }));
      throw err;
    }
  },

  /**
   * 내 부서 목록 조회 (겸직 포함)
   */
  fetchMyDepartments: async () => {
    set((state) => ({
      isLoading: { ...state.isLoading, myDepartments: true },
      error: { ...state.error, myDepartments: null },
    }));

    try {
      const response = await rnrApi.getMyDepartments();
      set((state) => ({
        myDepartments: response.items,
        myDepartmentsTotal: response.total,
        isLoading: { ...state.isLoading, myDepartments: false },
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '부서 목록 조회 실패';
      set((state) => ({
        isLoading: { ...state.isLoading, myDepartments: false },
        error: { ...state.error, myDepartments: errorMessage },
      }));
      throw err;
    }
  },

  /**
   * 상위 R&R 선택 목록 조회
   *
   * @param deptCode - 부서 코드
   * @param year     - 기준 연도 (YYYY, 기본값: 현재 연도)
   */
  fetchParentRrOptions: async (deptCode: string, year?: string) => {
    set((state) => ({
      isLoading: { ...state.isLoading, parentRrOptions: true },
      error: { ...state.error, parentRrOptions: null },
    }));

    try {
      const response = await rnrApi.getParentRrOptions(deptCode, year);
      set((state) => ({
        parentRrOptions: response.items,
        parentRrOptionsTotal: response.total,
        isLoading: { ...state.isLoading, parentRrOptions: false },
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '상위 R&R 목록 조회 실패';
      set((state) => ({
        isLoading: { ...state.isLoading, parentRrOptions: false },
        error: { ...state.error, parentRrOptions: errorMessage },
      }));
      throw err;
    }
  },

  /**
   * R&R 등록
   *
   * @param request - R&R 등록 요청 데이터
   * @returns 등록된 R&R 정보
   */
  createRr: async (request: RrCreateRequest): Promise<RrItem> => {
    set((state) => ({
      isLoading: { ...state.isLoading, createRr: true },
      error: { ...state.error, createRr: null },
    }));

    try {
      const newRr = await rnrApi.createRr(request);
      set((state) => ({
        isLoading: { ...state.isLoading, createRr: false },
      }));
      return newRr;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'R&R 등록 실패';
      set((state) => ({
        isLoading: { ...state.isLoading, createRr: false },
        error: { ...state.error, createRr: errorMessage },
      }));
      throw err;
    }
  },

  /**
   * 특정 에러 클리어
   *
   * @param key - 에러 키
   */
  clearError: (key: keyof RnrState['error']) => {
    set((state) => ({
      error: { ...state.error, [key]: null },
    }));
  },
}));
