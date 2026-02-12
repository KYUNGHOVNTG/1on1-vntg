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
  OrgTreeNode,
  DepartmentDetail,
  DepartmentEmployeesResponse,
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

// =============================================
// 조직도 API
// =============================================

/**
 * 조직도 트리 조회
 *
 * 계층형 조직도 트리 구조를 조회합니다.
 * CM_DEPARTMENT_TREE 테이블의 플랫 데이터를 트리 구조로 변환하여 반환합니다.
 *
 * @param year - 기준 연도 (선택, 기본값: 현재 연도)
 * @returns 조직도 트리 루트 노드 배열
 */
export async function getOrgTree(year?: number): Promise<OrgTreeNode[]> {
  const response = await apiClient.get<OrgTreeNode[]>('/v1/hr/org-tree', {
    params: year ? { year } : undefined,
  });
  return response.data;
}

/**
 * 부서 상세 조회 (확장)
 *
 * 부서 코드로 부서의 상세 정보를 조회합니다.
 * 부서장 정보와 소속 직원 수를 포함합니다.
 *
 * @param deptCode - 부서 코드
 * @returns 부서 상세 정보 (부서장 정보 + 직원 수 포함)
 */
export async function getDepartmentById(deptCode: string): Promise<DepartmentDetail> {
  const response = await apiClient.get<DepartmentDetail>(`/v1/hr/departments/${deptCode}`);
  return response.data;
}

/**
 * 부서별 직원 목록 조회
 *
 * 특정 부서에 소속된 직원 목록을 조회합니다.
 * 주소속 직원과 겸직 직원을 모두 포함합니다.
 *
 * @param deptCode - 부서 코드
 * @param includeSubDepts - 하위 부서 포함 여부 (선택, 기본값: false)
 * @returns 부서별 직원 목록
 */
export async function getDepartmentEmployees(
  deptCode: string,
  includeSubDepts = false
): Promise<DepartmentEmployeesResponse> {
  const response = await apiClient.get<DepartmentEmployeesResponse>(
    `/v1/hr/departments/${deptCode}/employees`,
    {
      params: includeSubDepts ? { include_sub_depts: true } : undefined,
    }
  );
  return response.data;
}
