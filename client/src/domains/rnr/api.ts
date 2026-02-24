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
