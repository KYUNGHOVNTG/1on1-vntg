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
  email?: string;
  name?: string;
}
