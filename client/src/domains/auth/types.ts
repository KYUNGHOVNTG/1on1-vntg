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
 * 세션 정보
 */
export interface SessionInfo {
  device_info?: string;
  ip_address?: string;
  created_at?: string;
  last_activity_at?: string;
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
  role_code?: string;
  position_code?: string;
  has_active_session?: boolean; // 기존 활성 세션 존재 여부
  existing_session_info?: SessionInfo; // 기존 세션 정보
}

/**
 * 로그아웃 응답
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * 활성 세션 확인 요청
 */
export interface CheckActiveSessionRequest {
  user_id: string;
}

/**
 * 활성 세션 확인 응답
 */
export interface CheckActiveSessionResponse {
  has_active_session: boolean;
  session_info?: SessionInfo;
}

/**
 * 세션 폐기 요청
 */
export interface RevokeSessionRequest {
  user_id: string;
  revoke_previous?: boolean;
}

/**
 * 세션 폐기 응답
 */
export interface RevokeSessionResponse {
  success: boolean;
  message: string;
}
