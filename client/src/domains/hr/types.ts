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
  position_code: string;
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
