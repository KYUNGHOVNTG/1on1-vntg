/**
 * HR Domain API
 *
 * 직원 및 부서 관련 API 호출 함수
 */

import { apiClient } from '@/core/api/client';
import type {
  Employee,
  EmployeeListResponse,
  EmployeeListParams,
  ConcurrentPosition,
  Department,
  DepartmentListResponse,
  DepartmentListParams,
} from './types';

// =============================================
// 직원 API
// =============================================

/**
 * 직원 목록 조회
 *
 * 검색, 필터링, 페이징을 지원하는 직원 목록을 조회합니다.
 *
 * @param params - 검색 및 필터 파라미터
 * @returns 직원 목록 및 페이징 정보
 */
export async function getEmployees(
  params?: EmployeeListParams
): Promise<EmployeeListResponse> {
  const response = await apiClient.get<EmployeeListResponse>('/v1/hr/employees', {
    params,
  });
  return response.data;
}

/**
 * 직원 상세 조회
 *
 * 사번으로 직원의 상세 정보를 조회합니다.
 *
 * @param empNo - 사번
 * @returns 직원 상세 정보
 */
export async function getEmployee(empNo: string): Promise<Employee> {
  const response = await apiClient.get<Employee>(`/v1/hr/employees/${empNo}`);
  return response.data;
}

/**
 * 직원 겸직 정보 조회
 *
 * 사번으로 직원의 겸직 정보를 조회합니다 (주소속 포함).
 *
 * @param empNo - 사번
 * @returns 겸직 정보 목록
 */
export async function getConcurrentPositions(
  empNo: string
): Promise<ConcurrentPosition[]> {
  const response = await apiClient.get<ConcurrentPosition[]>(
    `/v1/hr/employees/${empNo}/concurrent-positions`
  );
  return response.data;
}

// =============================================
// 부서 API
// =============================================

/**
 * 부서 목록 조회
 *
 * 검색 및 필터링을 지원하는 부서 목록을 조회합니다.
 *
 * @param params - 검색 및 필터 파라미터
 * @returns 부서 목록
 */
export async function getDepartments(
  params?: DepartmentListParams
): Promise<DepartmentListResponse> {
  const response = await apiClient.get<DepartmentListResponse>('/v1/hr/departments', {
    params,
  });
  return response.data;
}

/**
 * 부서 상세 조회
 *
 * 부서 코드로 부서의 상세 정보를 조회합니다.
 *
 * @param deptCode - 부서 코드
 * @returns 부서 상세 정보
 */
export async function getDepartment(deptCode: string): Promise<Department> {
  const response = await apiClient.get<Department>(`/v1/hr/departments/${deptCode}`);
  return response.data;
}
