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
}

/**
 * 로그아웃 응답
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * 현재 사용자 정보 응답 (/auth/me)
 */
export interface UserInfoResponse {
  user_id: string;
  message: string;
}

/**
 * Heartbeat 응답
 */
export interface HeartbeatResponse {
  success: boolean;
  last_activity_at?: string;
  message: string;
}
