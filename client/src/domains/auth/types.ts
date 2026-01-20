/**
 * Auth 도메인 타입 정의
 *
 * Google OAuth 로그인 관련 타입을 정의합니다.
 */

/**
 * Google OAuth 인증 URL 응답
 */
export interface GoogleAuthURLResponse {
  auth_url: string;
}

/**
 * Google OAuth 콜백 요청
 */
export interface GoogleAuthCallbackRequest {
  code: string;
}

/**
 * Google OAuth 로그인 응답
 */
export interface GoogleAuthResponse {
  success: boolean;
  access_token?: string;
  token_type?: string;
  user_id?: string;
  email?: string;
  name?: string;
  role?: string;
  position?: string;
  role_code?: string; // 역할 코드 (R001, R002 등)
  position_code?: string; // 메뉴 권한 조회를 위한 직책 코드 (P001, P002 등)
}

/**
 * 로그아웃 응답
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}
