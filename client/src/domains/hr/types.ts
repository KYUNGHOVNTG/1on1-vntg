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
