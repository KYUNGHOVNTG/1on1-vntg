/**
 * Menu Domain Types
 *
 * 메뉴 도메인 타입 정의
 */

/**
 * 메뉴 기본 정보
 */
export interface Menu {
    /** 메뉴 코드 (예: M001) */
    menu_code: string;
    /** 메뉴명 */
    menu_name: string;
    /** 정렬순서 */
    sort_seq: number | null;
    /** 사용여부 (Y/N) */
    use_yn: string;
    /** 비고 */
    rmk: string | null;
    /** 상위 메뉴 코드 (NULL: 최상위) */
    up_menu_code: string | null;
    /** 메뉴 깊이 (1: 최상위, 2: 2차...) */
    menu_level: number;
    /** 프론트엔드 라우팅 경로 */
    menu_url: string | null;
}

/**
 * 계층 구조 메뉴 (재귀적 구조)
 */
export interface MenuHierarchy extends Menu {
    /** 하위 메뉴 목록 */
    children: MenuHierarchy[];
}

/**
 * 사용자 메뉴 조회 응답
 */
export interface UserMenuResponse {
    /** 사용자가 접근 가능한 메뉴 목록 */
    menus: MenuHierarchy[];
    /** 전체 메뉴 개수 */
    total_count: number;
}

/**
 * 사용자 메뉴 조회 요청
 */
export interface UserMenuRequest {
    /** 사용자 ID */
    user_id: string;
    /** 직책 코드 (예: P001) */
    position_code: string;
}
