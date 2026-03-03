/**
 * R&R 도메인 API
 *
 * 나의 R&R 관리 관련 API 호출 함수
 */

import { apiClient } from '@/core/api/client';
import type {
  RrListResponse,
  MyDepartmentsResponse,
  ParentRrOptionsResponse,
  RrItem,
  RrCreateRequest,
  RrUpdateRequest,
  TeamRrListResponse,
  TeamRrFilterOptions,
  GetTeamRrListParams,
} from './types';

/**
 * 나의 R&R 목록 조회
 *
 * 로그인한 사용자의 R&R 목록을 조회합니다.
 *
 * @param year - 기준 연도 (YYYY, 기본값: 현재 연도)
 * @returns R&R 목록 및 전체 건수
 */
export async function getMyRrList(year?: string): Promise<RrListResponse> {
  const response = await apiClient.get<RrListResponse>('/v1/rnr/my', {
    params: year ? { year } : undefined,
  });
  return response.data;
}

/**
 * 내 부서 목록 조회 (겸직 포함)
 *
 * 로그인한 사용자의 주소속 부서와 겸직 부서 목록을 조회합니다.
 *
 * @returns 내 부서 목록 및 전체 건수
 */
export async function getMyDepartments(): Promise<MyDepartmentsResponse> {
  const response = await apiClient.get<MyDepartmentsResponse>('/v1/rnr/my-departments');
  return response.data;
}

/**
 * 상위 R&R 선택 목록 조회
 *
 * 부서 코드를 기준으로 상위 R&R 선택 목록을 조회합니다.
 * 직책에 따라 조회 범위가 달라집니다:
 * - P005(팀원): 동일 부서의 LEADER R&R
 * - P001~P004(조직장): 상위 부서의 LEADER R&R
 *
 * @param deptCode - 부서 코드
 * @param year     - 기준 연도 (YYYY, 기본값: 현재 연도)
 * @returns 상위 R&R 선택 목록 및 전체 건수
 */
export async function getParentRrOptions(
  deptCode: string,
  year?: string
): Promise<ParentRrOptionsResponse> {
  const response = await apiClient.get<ParentRrOptionsResponse>(
    `/v1/rnr/departments/${deptCode}/parent-rr`,
    { params: year ? { year } : undefined }
  );
  return response.data;
}

/**
 * R&R 등록
 *
 * 새로운 R&R을 등록합니다.
 * RR_TYPE은 직책 코드에 따라 백엔드에서 자동 결정됩니다.
 *
 * @param request - R&R 등록 요청 데이터
 * @returns 등록된 R&R 정보
 */
export async function createRr(request: RrCreateRequest): Promise<RrItem> {
  const response = await apiClient.post<RrItem>('/v1/rnr', request);
  return response.data;
}

/**
 * R&R 수정
 *
 * 기존 R&R의 제목, 상세 내용, 상위 R&R, 수행 기간을 수정합니다.
 *
 * @param rrId    - R&R ID (UUID)
 * @param request - R&R 수정 요청 데이터
 * @returns 수정된 R&R 정보
 */
export async function updateRr(rrId: string, request: RrUpdateRequest): Promise<RrItem> {
  const response = await apiClient.put<RrItem>(`/v1/rnr/${rrId}`, request);
  return response.data;
}

/**
 * R&R 삭제
 *
 * R&R과 관련된 수행 기간을 모두 삭제합니다.
 *
 * @param rrId - R&R ID (UUID)
 */
export async function deleteRr(rrId: string): Promise<void> {
  await apiClient.delete(`/v1/rnr/${rrId}`);
}

/**
 * 팀 R&R 현황 목록 조회 (조직장 전용)
 *
 * 로그인한 조직장의 하위 조직 팀원 전체의 R&R 목록을 조회합니다.
 *
 * @param params - 필터 파라미터 (year, dept_code, position_code, emp_name)
 * @returns 팀원별 R&R 현황 목록 및 전체 건수
 */
export async function getTeamRrList(params?: GetTeamRrListParams): Promise<TeamRrListResponse> {
  const response = await apiClient.get<TeamRrListResponse>('/v1/rnr/team', { params });
  return response.data;
}

/**
 * 팀 R&R 필터 옵션 조회 (조직장 전용)
 *
 * 팀 R&R 조회에 사용하는 부서/직책 필터 목록을 반환합니다.
 *
 * @returns 부서 목록 및 직책 목록
 */
export async function getTeamFilterOptions(): Promise<TeamRrFilterOptions> {
  const response = await apiClient.get<TeamRrFilterOptions>('/v1/rnr/team-filter-options');
  return response.data;
}
