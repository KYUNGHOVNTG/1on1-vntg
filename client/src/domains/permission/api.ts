/**
 * Permission Domain API
 *
 * 권한 관리 관련 API 호출 함수
 */

import { apiClient } from '@/core/api/client';
import type {
  Position,
  PositionMenuPermissionResponse,
  PositionMenuPermissionUpdateRequest,
  UserBasic,
  UserMenuPermissionResponse,
  UserMenuPermissionUpdateRequest,
  MenuForPermission,
} from './types';

// ============================================================================
// 직책별 권한 관리
// ============================================================================

/**
 * 전체 직책 목록 조회
 *
 * 권한 관리를 위한 전체 직책 목록을 조회합니다.
 * 공통코드(POSITION)에서 사용 가능한 직책 목록을 조회합니다.
 *
 * @returns 직책 목록
 */
export async function getPositions(): Promise<Position[]> {
  const response = await apiClient.get<Position[]>('/v1/permissions/positions');
  return response.data;
}

/**
 * 직책별 메뉴 권한 조회
 *
 * 특정 직책이 접근 가능한 메뉴 목록을 조회합니다.
 *
 * @param positionCode - 직책 코드 (예: P001)
 * @returns 직책별 메뉴 권한 정보
 */
export async function getPositionMenus(
  positionCode: string
): Promise<PositionMenuPermissionResponse> {
  const response = await apiClient.get<PositionMenuPermissionResponse>(
    `/v1/permissions/positions/${positionCode}/menus`
  );
  return response.data;
}

/**
 * 직책별 메뉴 권한 수정
 *
 * 직책의 메뉴 권한을 일괄 수정합니다.
 * 기존 권한은 모두 삭제되고 새로운 권한으로 대체됩니다.
 *
 * @param positionCode - 직책 코드 (예: P001)
 * @param data - 메뉴 권한 수정 요청
 * @returns 수정된 메뉴 권한 정보
 */
export async function updatePositionMenus(
  positionCode: string,
  data: PositionMenuPermissionUpdateRequest
): Promise<PositionMenuPermissionResponse> {
  const response = await apiClient.put<PositionMenuPermissionResponse>(
    `/v1/permissions/positions/${positionCode}/menus`,
    data
  );
  return response.data;
}

// ============================================================================
// 사용자별 권한 관리
// ============================================================================

/**
 * 전체 사용자 목록 조회
 *
 * 권한 관리를 위한 전체 사용자 목록을 조회합니다.
 *
 * @returns 사용자 목록
 */
export async function getUsers(): Promise<UserBasic[]> {
  const response = await apiClient.get<UserBasic[]>('/v1/permissions/users');
  return response.data;
}

/**
 * 사용자별 메뉴 권한 조회
 *
 * 특정 사용자에게 추가로 부여된 메뉴 목록을 조회합니다.
 * (직책별 권한은 포함되지 않음)
 *
 * @param userId - 사용자 ID
 * @returns 사용자별 메뉴 권한 정보
 */
export async function getUserMenus(
  userId: string
): Promise<UserMenuPermissionResponse> {
  const response = await apiClient.get<UserMenuPermissionResponse>(
    `/v1/permissions/users/${userId}/menus`
  );
  return response.data;
}

/**
 * 사용자별 메뉴 권한 수정
 *
 * 사용자의 추가 메뉴 권한을 일괄 수정합니다.
 * 기존 권한은 모두 삭제되고 새로운 권한으로 대체됩니다.
 *
 * @param userId - 사용자 ID
 * @param data - 메뉴 권한 수정 요청
 * @returns 수정된 메뉴 권한 정보
 */
export async function updateUserMenus(
  userId: string,
  data: UserMenuPermissionUpdateRequest
): Promise<UserMenuPermissionResponse> {
  const response = await apiClient.put<UserMenuPermissionResponse>(
    `/v1/permissions/users/${userId}/menus`,
    data
  );
  return response.data;
}

// ============================================================================
// 공통
// ============================================================================

/**
 * 권한 부여 가능한 전체 메뉴 조회
 *
 * 권한 관리 화면에서 표시할 전체 메뉴 목록을 조회합니다.
 *
 * @returns 메뉴 목록
 */
export async function getMenusForPermission(): Promise<MenuForPermission[]> {
  const response = await apiClient.get<MenuForPermission[]>(
    '/v1/permissions/menus'
  );
  return response.data;
}
