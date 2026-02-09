/**
 * Menu Domain API
 *
 * 메뉴 관련 API 호출 함수
 */

import { apiClient } from '@/core/api/client';
import type { UserMenuResponse, MenuHierarchy } from './types';

/**
 * 사용자별 메뉴 조회
 *
 * 사용자가 접근 가능한 메뉴를 계층 구조로 조회합니다.
 * 역할(role)에 따라 관리자 메뉴와 일반 메뉴를 분리하여 반환합니다.
 *
 * @param userId - 사용자 ID
 * @param positionCode - 직책 코드 (예: P001)
 * @param roleCode - 역할 코드 (예: R001=시스템 관리자, R002=일반 사용자)
 * @returns 사용자가 접근 가능한 메뉴 목록
 */
export async function getUserMenus(
    userId: string,
    positionCode: string,
    roleCode: string
): Promise<UserMenuResponse> {
    const response = await apiClient.get<UserMenuResponse>(
        `/v1/menus/user/${userId}`,
        {
            params: { position_code: positionCode, role_code: roleCode },
        }
    );
    return response.data;
}

/**
 * 메뉴 계층 구조 조회
 *
 * 전체 메뉴 또는 특정 메뉴들의 계층 구조를 조회합니다.
 * 최상위 메뉴만 반환되며, 하위 메뉴는 children 필드에 포함됩니다.
 *
 * @param menuCodes - 조회할 메뉴 코드 배열 (선택사항)
 * @returns 계층 구조 메뉴 목록
 */
export async function getMenuHierarchy(
    menuCodes?: string[]
): Promise<MenuHierarchy[]> {
    const response = await apiClient.get<MenuHierarchy[]>('/v1/menus/hierarchy', {
        params: menuCodes ? { menu_codes: menuCodes.join(',') } : undefined,
    });
    return response.data;
}
