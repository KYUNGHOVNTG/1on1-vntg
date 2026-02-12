/**
 * HR Domain Store
 *
 * 직원 및 조직도 관련 상태 관리
 */

import { create } from 'zustand';
import type {
  Employee,
  EmployeeListResponse,
  EmployeeListParams,
  ConcurrentPosition,
  OrgTreeNode,
  DepartmentDetail,
  DepartmentEmployeesResponse,
  SyncHistory,
  EmployeeSyncRequest,
  DepartmentSyncRequest,
  SyncExecutionResponse,
} from './types';
import * as hrApi from './api';

// =============================================
// State 타입 정의
// =============================================

interface HRState {
  // 직원 관련 상태
  employees: Employee[];
  employeesTotal: number;
  employeesPage: number;
  employeesSize: number;
  employeesPages: number;
  selectedEmployee: Employee | null;
  concurrentPositions: ConcurrentPosition[];

  // 조직도 관련 상태
  orgTree: OrgTreeNode[];
  selectedDepartment: DepartmentDetail | null;
  departmentEmployees: Employee[];
  departmentEmployeesTotal: number;

  // 동기화 관련 상태
  syncHistory: SyncHistory[];
  syncHistoryTotal: number;

  // 로딩/에러 상태
  loading: {
    employees: boolean;
    employee: boolean;
    orgTree: boolean;
    department: boolean;
    departmentEmployees: boolean;
    syncEmployees: boolean;
    syncDepartments: boolean;
    syncHistory: boolean;
  };
  error: {
    employees: string | null;
    employee: string | null;
    orgTree: string | null;
    department: string | null;
    departmentEmployees: string | null;
    syncEmployees: string | null;
    syncDepartments: string | null;
    syncHistory: string | null;
  };

  // 직원 관련 액션
  fetchEmployees: (params?: EmployeeListParams) => Promise<void>;
  fetchEmployeeById: (empNo: string) => Promise<void>;
  fetchConcurrentPositions: (empNo: string) => Promise<void>;
  clearSelectedEmployee: () => void;

  // 조직도 관련 액션
  fetchOrgTree: (year?: number) => Promise<void>;
  fetchDepartmentById: (deptCode: string) => Promise<void>;
  fetchDepartmentEmployees: (deptCode: string, includeSubDepts?: boolean) => Promise<void>;
  clearSelectedDepartment: () => void;

  // 동기화 관련 액션
  syncEmployees: (employees: EmployeeSyncRequest[]) => Promise<SyncExecutionResponse>;
  syncDepartments: (departments: DepartmentSyncRequest[]) => Promise<SyncExecutionResponse>;
  fetchSyncHistory: (syncType?: 'employees' | 'departments' | 'org_tree', limit?: number) => Promise<void>;

  // 에러 클리어
  clearError: (key: keyof HRState['error']) => void;
  clearAllErrors: () => void;
}

// =============================================
// Store 생성
// =============================================

export const useHRStore = create<HRState>((set, get) => ({
  // 초기 상태
  employees: [],
  employeesTotal: 0,
  employeesPage: 1,
  employeesSize: 20,
  employeesPages: 0,
  selectedEmployee: null,
  concurrentPositions: [],

  orgTree: [],
  selectedDepartment: null,
  departmentEmployees: [],
  departmentEmployeesTotal: 0,

  syncHistory: [],
  syncHistoryTotal: 0,

  loading: {
    employees: false,
    employee: false,
    orgTree: false,
    department: false,
    departmentEmployees: false,
    syncEmployees: false,
    syncDepartments: false,
    syncHistory: false,
  },
  error: {
    employees: null,
    employee: null,
    orgTree: null,
    department: null,
    departmentEmployees: null,
    syncEmployees: null,
    syncDepartments: null,
    syncHistory: null,
  },

  // =============================================
  // 직원 관련 액션
  // =============================================

  /**
   * 직원 목록 조회
   *
   * @param params - 검색 및 필터 파라미터
   */
  fetchEmployees: async (params?: EmployeeListParams) => {
    set((state) => ({
      loading: { ...state.loading, employees: true },
      error: { ...state.error, employees: null },
    }));

    try {
      const response: EmployeeListResponse = await hrApi.getEmployees(params);
      set({
        employees: response.items,
        employeesTotal: response.total,
        employeesPage: response.page,
        employeesSize: response.size,
        employeesPages: response.pages,
        loading: { ...get().loading, employees: false },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '직원 목록 조회 실패';
      set((state) => ({
        loading: { ...state.loading, employees: false },
        error: { ...state.error, employees: errorMessage },
      }));
      throw error;
    }
  },

  /**
   * 직원 상세 조회
   *
   * @param empNo - 사번
   */
  fetchEmployeeById: async (empNo: string) => {
    set((state) => ({
      loading: { ...state.loading, employee: true },
      error: { ...state.error, employee: null },
    }));

    try {
      const employee = await hrApi.getEmployee(empNo);
      set({
        selectedEmployee: employee,
        loading: { ...get().loading, employee: false },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '직원 상세 조회 실패';
      set((state) => ({
        loading: { ...state.loading, employee: false },
        error: { ...state.error, employee: errorMessage },
      }));
      throw error;
    }
  },

  /**
   * 직원 겸직 정보 조회
   *
   * @param empNo - 사번
   */
  fetchConcurrentPositions: async (empNo: string) => {
    try {
      const positions = await hrApi.getConcurrentPositions(empNo);
      set({ concurrentPositions: positions });
    } catch (error) {
      console.error('겸직 정보 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 선택된 직원 정보 초기화
   */
  clearSelectedEmployee: () => {
    set({
      selectedEmployee: null,
      concurrentPositions: [],
    });
  },

  // =============================================
  // 조직도 관련 액션
  // =============================================

  /**
   * 조직도 트리 조회
   *
   * @param year - 기준 연도 (선택)
   */
  fetchOrgTree: async (year?: number) => {
    set((state) => ({
      loading: { ...state.loading, orgTree: true },
      error: { ...state.error, orgTree: null },
    }));

    try {
      const tree = await hrApi.getOrgTree(year);
      set({
        orgTree: tree,
        loading: { ...get().loading, orgTree: false },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '조직도 조회 실패';
      set((state) => ({
        loading: { ...state.loading, orgTree: false },
        error: { ...state.error, orgTree: errorMessage },
      }));
      throw error;
    }
  },

  /**
   * 부서 상세 조회
   *
   * @param deptCode - 부서 코드
   */
  fetchDepartmentById: async (deptCode: string) => {
    set((state) => ({
      loading: { ...state.loading, department: true },
      error: { ...state.error, department: null },
    }));

    try {
      const department = await hrApi.getDepartmentById(deptCode);
      set({
        selectedDepartment: department,
        loading: { ...get().loading, department: false },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '부서 상세 조회 실패';
      set((state) => ({
        loading: { ...state.loading, department: false },
        error: { ...state.error, department: errorMessage },
      }));
      throw error;
    }
  },

  /**
   * 부서별 직원 목록 조회
   *
   * @param deptCode - 부서 코드
   * @param includeSubDepts - 하위 부서 포함 여부
   */
  fetchDepartmentEmployees: async (deptCode: string, includeSubDepts = false) => {
    set((state) => ({
      loading: { ...state.loading, departmentEmployees: true },
      error: { ...state.error, departmentEmployees: null },
    }));

    try {
      const response: DepartmentEmployeesResponse = await hrApi.getDepartmentEmployees(
        deptCode,
        includeSubDepts
      );
      set({
        departmentEmployees: response.items,
        departmentEmployeesTotal: response.total,
        loading: { ...get().loading, departmentEmployees: false },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '부서 직원 목록 조회 실패';
      set((state) => ({
        loading: { ...state.loading, departmentEmployees: false },
        error: { ...state.error, departmentEmployees: errorMessage },
      }));
      throw error;
    }
  },

  /**
   * 선택된 부서 정보 초기화
   */
  clearSelectedDepartment: () => {
    set({
      selectedDepartment: null,
      departmentEmployees: [],
      departmentEmployeesTotal: 0,
    });
  },

  // =============================================
  // 에러 관리
  // =============================================

  /**
   * 특정 에러 클리어
   *
   * @param key - 에러 키
   */
  clearError: (key: keyof HRState['error']) => {
    set((state) => ({
      error: { ...state.error, [key]: null },
    }));
  },

  /**
   * 모든 에러 클리어
   */
  clearAllErrors: () => {
    set({
      error: {
        employees: null,
        employee: null,
        orgTree: null,
        department: null,
        departmentEmployees: null,
        syncEmployees: null,
        syncDepartments: null,
        syncHistory: null,
      },
    });
  },

  // =============================================
  // 동기화 관련 액션
  // =============================================

  /**
   * 직원 정보 동기화
   *
   * @param employees - 동기화할 직원 목록
   * @returns 동기화 실행 결과
   */
  syncEmployees: async (employees: EmployeeSyncRequest[]): Promise<SyncExecutionResponse> => {
    set((state) => ({
      loading: { ...state.loading, syncEmployees: true },
      error: { ...state.error, syncEmployees: null },
    }));

    try {
      const result = await hrApi.syncEmployees(employees);
      set((state) => ({
        loading: { ...state.loading, syncEmployees: false },
      }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '직원 정보 동기화 실패';
      set((state) => ({
        loading: { ...state.loading, syncEmployees: false },
        error: { ...state.error, syncEmployees: errorMessage },
      }));
      throw error;
    }
  },

  /**
   * 부서 정보 동기화
   *
   * @param departments - 동기화할 부서 목록
   * @returns 동기화 실행 결과
   */
  syncDepartments: async (departments: DepartmentSyncRequest[]): Promise<SyncExecutionResponse> => {
    set((state) => ({
      loading: { ...state.loading, syncDepartments: true },
      error: { ...state.error, syncDepartments: null },
    }));

    try {
      const result = await hrApi.syncDepartments(departments);
      set((state) => ({
        loading: { ...state.loading, syncDepartments: false },
      }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '부서 정보 동기화 실패';
      set((state) => ({
        loading: { ...state.loading, syncDepartments: false },
        error: { ...state.error, syncDepartments: errorMessage },
      }));
      throw error;
    }
  },

  /**
   * 동기화 이력 조회
   *
   * @param syncType - 동기화 타입 필터
   * @param limit - 최대 조회 건수
   */
  fetchSyncHistory: async (
    syncType?: 'employees' | 'departments' | 'org_tree',
    limit = 50
  ) => {
    set((state) => ({
      loading: { ...state.loading, syncHistory: true },
      error: { ...state.error, syncHistory: null },
    }));

    try {
      const response = await hrApi.getSyncHistory(syncType, limit);
      set({
        syncHistory: response.items,
        syncHistoryTotal: response.total,
        loading: { ...get().loading, syncHistory: false },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '동기화 이력 조회 실패';
      set((state) => ({
        loading: { ...state.loading, syncHistory: false },
        error: { ...state.error, syncHistory: errorMessage },
      }));
      throw error;
    }
  },
}));
