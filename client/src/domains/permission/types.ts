/**
 * Permission Domain Types
 *
 * 권한 관리 도메인 타입 정의
 */

/**
 * 권한 부여용 메뉴 정보
 *
 * 권한 관리 화면에서 표시할 메뉴 정보를 담습니다.
 */
export interface MenuForPermission {
  /** 메뉴 코드 */
  menu_code: string;
  /** 메뉴명 */
  menu_name: string;
  /** 메뉴 타입 (COMMON/ADMIN) */
  menu_type: 'COMMON' | 'ADMIN';
  /** 메뉴 레벨 (1: 상위, 2: 하위) */
  menu_level: number;
  /** 상위 메뉴 코드 */
  up_menu_code: string | null;
  /** 정렬 순서 */
  sort_seq: number | null;
  /** 하위 메뉴 목록 (UI 표시용) */
  children?: MenuForPermission[];
}

// ============================================================================
// 직책 관련 타입
// ============================================================================

/**
 * 직책 기본 정보
 *
 * 공통코드(POSITION)에서 조회한 직책 정보입니다.
 */
export interface Position {
  /** 직책 코드 (예: P001) */
  code: string;
  /** 직책명 (예: HR) */
  code_name: string;
}

/**
 * 직책별 메뉴 권한 조회 응답
 *
 * 특정 직책이 접근 가능한 메뉴 코드 목록을 반환합니다.
 */
export interface PositionMenuPermissionResponse {
  /** 직책 코드 */
  position_code: string;
  /** 접근 가능한 메뉴 코드 목록 */
  menu_codes: string[];
}

/**
 * 직책별 메뉴 권한 수정 요청
 *
 * 직책의 메뉴 권한을 일괄 수정합니다.
 * 기존 권한은 모두 삭제되고 새로운 권한으로 대체됩니다.
 */
export interface PositionMenuPermissionUpdateRequest {
  /** 부여할 메뉴 코드 목록 */
  menu_codes: string[];
}

// ============================================================================
// 사용자 관련 타입
// ============================================================================

/**
 * 사용자 기본 정보
 *
 * 권한 관리를 위한 최소한의 사용자 정보입니다.
 */
export interface UserBasic {
  /** 사용자 ID */
  user_id: string;
  /** 이메일 */
  email: string;
  /** 직책 코드 */
  position_code: string;
}

/**
 * 사용자별 메뉴 권한 조회 응답
 *
 * 특정 사용자에게 추가로 부여된 메뉴 코드 목록을 반환합니다.
 * (직책별 권한은 포함되지 않음)
 */
export interface UserMenuPermissionResponse {
  /** 사용자 ID */
  user_id: string;
  /** 추가 부여된 메뉴 코드 목록 */
  menu_codes: string[];
}

/**
 * 사용자별 메뉴 권한 수정 요청
 *
 * 사용자의 추가 메뉴 권한을 일괄 수정합니다.
 * 기존 권한은 모두 삭제되고 새로운 권한으로 대체됩니다.
 */
export interface UserMenuPermissionUpdateRequest {
  /** 부여할 메뉴 코드 목록 */
  menu_codes: string[];
}
