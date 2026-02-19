/**
 * HR 도메인 타입 정의
 *
 * 직원 및 부서 관련 타입을 정의합니다.
 */

// =============================================
// 직원 관련 타입
// =============================================

/**
 * 직원 상세 정보
 */
export interface Employee {
  emp_no: string;
  user_id: string;
  name_kor: string;
  dept_code: string;
  dept_name?: string | null;        // [TASK 5] 부서명 (cm_department JOIN)
  position_code: string;
  position_name?: string | null;    // [TASK 5] 직책명 (cm_codedetail JOIN)
  on_work_yn: 'Y' | 'N';
}

/**
 * 직원 목록 응답
 */
export interface EmployeeListResponse {
  items: Employee[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/**
 * 직원 목록 조회 파라미터
 */
export interface EmployeeListParams {
  search?: string;
  on_work_yn?: 'Y' | 'N';
  position_code?: string;
  dept_code?: string;
  page?: number;
  size?: number;
}

/**
 * 직원 목록 1 ROW - 겸직 전개 포함 (TASK 7)
 *
 * CONCUR 데이터가 있는 직원은 CONCUR 기준으로 여러 ROW로 전개됩니다.
 * is_concurrent=true이고 is_main='N'인 ROW에는 겸직 라벨을 표시합니다.
 */
export interface EmployeeRow {
  emp_no: string;
  user_id: string;
  name_kor: string;
  dept_code: string;
  dept_name?: string | null;
  position_code: string;
  position_name?: string | null;
  on_work_yn: 'Y' | 'N';
  is_concurrent: boolean;   // CONCUR 기반 ROW 여부 (true: 겸직 전개 ROW)
  is_main: 'Y' | 'N';       // 본직 여부 (Y: 본직, N: 겸직)
}

/**
 * 겸직 전개 직원 목록 응답 (TASK 7)
 */
export interface EmployeeRowListResponse {
  items: EmployeeRow[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/**
 * 겸직 정보
 */
export interface ConcurrentPosition {
  emp_no: string;
  dept_code: string;
  is_main: 'Y' | 'N';
  position_code: string;
}

// =============================================
// 부서 관련 타입
// =============================================

/**
 * 부서 상세 정보
 */
export interface Department {
  dept_code: string;
  dept_name: string;
  upper_dept_code: string | null;
  dept_head_emp_no: string | null;
  use_yn: 'Y' | 'N';
}

/**
 * 부서 목록 응답
 */
export interface DepartmentListResponse {
  items: Department[];
  total: number;
}

/**
 * 부서 목록 조회 파라미터
 */
export interface DepartmentListParams {
  search?: string;
  use_yn?: 'Y' | 'N';
  upper_dept_code?: string;
}

/**
 * 조직도 트리 노드
 *
 * 계층형 조직도 구조를 표현하는 재귀 타입입니다.
 */
export interface OrgTreeNode {
  dept_code: string;
  dept_name: string;
  disp_lvl: number;
  dept_head_emp_no: string | null;
  dept_head_name?: string | null;
  employee_count: number;
  children: OrgTreeNode[];
}

/**
 * 조직도 트리 조회 응답
 */
export interface OrgTreeResponse {
  std_year: string;
  tree: OrgTreeNode[];
}

/**
 * 부서 상세 정보
 *
 * 부서 기본 정보 + 부서장 정보 + 소속 직원 수를 포함합니다.
 */
export interface DepartmentDetail {
  dept_code: string;
  dept_name: string;
  upper_dept_code: string | null;
  upper_dept_name?: string | null;
  dept_head_emp_no: string | null;
  dept_head_name?: string | null;
  dept_head_position?: string | null;
  use_yn: 'Y' | 'N';
  employee_count: number;
  main_employee_count: number;
  concurrent_employee_count: number;
}

/**
 * 부서별 직원 목록 응답
 */
export interface DepartmentEmployeesResponse {
  items: Employee[];
  total: number;
}

// =============================================
// 동기화 관련 타입
// =============================================

/**
 * 직원 정보 동기화 요청
 */
export interface ConcurrentPositionSyncRequest {
  dept_code: string;
  is_main: 'Y' | 'N';
  position_code: string;
}

export interface EmployeeSyncRequest {
  emp_no: string;
  user_id: string;
  name_kor: string;
  dept_code: string;
  position_code: string;
  on_work_yn: 'Y' | 'N';
  concurrent_positions?: ConcurrentPositionSyncRequest[];
}


/**
 * 부서 정보 동기화 요청
 */
export interface DepartmentSyncRequest {
  dept_code: string;
  dept_name: string;
  upper_dept_code: string | null;
  dept_head_emp_no: string | null;
  use_yn: 'Y' | 'N';
}

/**
 * 동기화 이력 응답
 */
export interface SyncHistory {
  sync_id: number;
  sync_type: 'employees' | 'departments' | 'org_tree';
  sync_status: 'success' | 'failure' | 'partial' | 'in_progress';
  total_count: number;
  success_count: number;
  failure_count: number;
  error_message: string | null;
  sync_start_time: string;
  sync_end_time: string | null;
  in_user: string | null;
  in_date: string;
}

/**
 * 동기화 이력 목록 응답
 */
export interface SyncHistoryListResponse {
  items: SyncHistory[];
  total: number;
}

/**
 * 동기화 실행 응답
 */
export interface SyncExecutionResponse {
  sync_id: number;
  sync_type: string;
  sync_status: string;
  total_count: number;
  success_count: number;
  failure_count: number;
  message: string;
}
