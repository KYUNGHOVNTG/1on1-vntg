/**
 * R&R 도메인 Store
 *
 * 나의 R&R 관리 + 팀 R&R 현황 관련 상태 관리 (Zustand)
 */

import { create } from 'zustand';
import type {
  RrItem,
  MyDepartmentItem,
  ParentRrOption,
  RrCreateRequest,
  RrUpdateRequest,
  TeamRrEmployeeItem,
  TeamRrFilterOptions,
  GetTeamRrListParams,
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

  // 팀 R&R 현황
  teamRrList: TeamRrEmployeeItem[];
  teamRrTotal: number;
  teamFilterOptions: TeamRrFilterOptions | null;

  // 로딩 상태
  isLoading: {
    myRrList: boolean;
    myDepartments: boolean;
    parentRrOptions: boolean;
    createRr: boolean;
    updateRr: boolean;
    deleteRr: boolean;
    teamRrList: boolean;
    teamFilterOptions: boolean;
  };

  // 에러 상태
  error: {
    myRrList: string | null;
    myDepartments: string | null;
    parentRrOptions: string | null;
    createRr: string | null;
    updateRr: string | null;
    deleteRr: string | null;
    teamRrList: string | null;
    teamFilterOptions: string | null;
  };

  // 액션
  fetchMyRrList: (year?: string) => Promise<void>;
  fetchMyDepartments: () => Promise<void>;
  fetchParentRrOptions: (deptCode: string, year?: string) => Promise<void>;
  createRr: (request: RrCreateRequest) => Promise<RrItem>;
  updateRr: (rrId: string, request: RrUpdateRequest) => Promise<RrItem>;
  deleteRr: (rrId: string) => Promise<void>;
  fetchTeamRrList: (params?: GetTeamRrListParams) => Promise<void>;
  fetchTeamFilterOptions: () => Promise<void>;
  clearError: (key: keyof RnrState['error']) => void;
}

// =============================================
// Store 생성
// =============================================

export const useRnrStore = create<RnrState>((set, _get) => ({
  // 초기 상태
  myRrList: [],
  myRrTotal: 0,

  myDepartments: [],
  myDepartmentsTotal: 0,

  parentRrOptions: [],
  parentRrOptionsTotal: 0,

  teamRrList: [],
  teamRrTotal: 0,
  teamFilterOptions: null,

  isLoading: {
    myRrList: false,
    myDepartments: false,
    parentRrOptions: false,
    createRr: false,
    updateRr: false,
    deleteRr: false,
    teamRrList: false,
    teamFilterOptions: false,
  },

  error: {
    myRrList: null,
    myDepartments: null,
    parentRrOptions: null,
    createRr: null,
    updateRr: null,
    deleteRr: null,
    teamRrList: null,
    teamFilterOptions: null,
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

  /**
   * R&R 수정
   *
   * @param rrId    - R&R ID (UUID 문자열)
   * @param request - R&R 수정 요청 데이터
   * @returns 수정된 R&R 정보
   */
  updateRr: async (rrId: string, request: RrUpdateRequest): Promise<RrItem> => {
    set((state) => ({
      isLoading: { ...state.isLoading, updateRr: true },
      error: { ...state.error, updateRr: null },
    }));

    try {
      const updated = await rnrApi.updateRr(rrId, request);
      // 로컬 목록 즉시 업데이트
      set((state) => ({
        myRrList: state.myRrList.map((item) =>
          item.rr_id === rrId ? updated : item
        ),
        isLoading: { ...state.isLoading, updateRr: false },
      }));
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'R&R 수정 실패';
      set((state) => ({
        isLoading: { ...state.isLoading, updateRr: false },
        error: { ...state.error, updateRr: errorMessage },
      }));
      throw err;
    }
  },

  /**
   * R&R 삭제
   *
   * @param rrId - R&R ID (UUID 문자열)
   */
  deleteRr: async (rrId: string): Promise<void> => {
    set((state) => ({
      isLoading: { ...state.isLoading, deleteRr: true },
      error: { ...state.error, deleteRr: null },
    }));

    try {
      await rnrApi.deleteRr(rrId);
      // 로컬 목록에서 즉시 제거
      set((state) => ({
        myRrList: state.myRrList.filter((item) => item.rr_id !== rrId),
        myRrTotal: state.myRrTotal - 1,
        isLoading: { ...state.isLoading, deleteRr: false },
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'R&R 삭제 실패';
      set((state) => ({
        isLoading: { ...state.isLoading, deleteRr: false },
        error: { ...state.error, deleteRr: errorMessage },
      }));
      throw err;
    }
  },

  /**
   * 팀 R&R 현황 목록 조회 (조직장 전용)
   *
   * @param params - 필터 파라미터 (year, dept_code, position_code, emp_name)
   */
  fetchTeamRrList: async (params?: GetTeamRrListParams) => {
    set((state) => ({
      isLoading: { ...state.isLoading, teamRrList: true },
      error: { ...state.error, teamRrList: null },
    }));

    try {
      const response = await rnrApi.getTeamRrList(params);
      set((state) => ({
        teamRrList: response.items,
        teamRrTotal: response.total,
        isLoading: { ...state.isLoading, teamRrList: false },
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '팀 R&R 목록 조회 실패';
      set((state) => ({
        isLoading: { ...state.isLoading, teamRrList: false },
        error: { ...state.error, teamRrList: errorMessage },
      }));
      throw err;
    }
  },

  /**
   * 팀 R&R 필터 옵션 조회 (조직장 전용)
   */
  fetchTeamFilterOptions: async () => {
    set((state) => ({
      isLoading: { ...state.isLoading, teamFilterOptions: true },
      error: { ...state.error, teamFilterOptions: null },
    }));

    try {
      const options = await rnrApi.getTeamFilterOptions();
      set((state) => ({
        teamFilterOptions: options,
        isLoading: { ...state.isLoading, teamFilterOptions: false },
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '필터 옵션 조회 실패';
      set((state) => ({
        isLoading: { ...state.isLoading, teamFilterOptions: false },
        error: { ...state.error, teamFilterOptions: errorMessage },
      }));
      throw err;
    }
  },
}));
