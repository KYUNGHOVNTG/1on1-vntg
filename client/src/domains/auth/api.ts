/**
 * Auth API 클라이언트
 *
 * Google OAuth 로그인 API 호출을 처리합니다.
 */

import { apiClient } from '@/core/api/client';
import type {
  CheckActiveSessionRequest,
  CheckActiveSessionResponse,
  CompleteForceLoginRequest,
  GoogleAuthCallbackRequest,
  GoogleAuthResponse,
  GoogleAuthURLResponse,
  HeartbeatResponse,
  LogoutResponse,
  RevokeSessionRequest,
  RevokeSessionResponse,
  UserInfoResponse,
} from './types';

/**
 * Google OAuth 인증 URL을 가져옵니다.
 */
export async function getGoogleAuthURL(): Promise<GoogleAuthURLResponse> {
  const response = await apiClient.get<GoogleAuthURLResponse>('/v1/auth/google/url');
  return response.data;
}

/**
 * Google OAuth 콜백을 처리합니다.
 */
export async function handleGoogleCallback(
  request: GoogleAuthCallbackRequest
): Promise<GoogleAuthResponse> {
  const response = await apiClient.post<GoogleAuthResponse>(
    '/v1/auth/google/callback',
    request
  );
  return response.data;
}

/**
 * 로그아웃을 처리합니다.
 */
export async function logout(): Promise<LogoutResponse> {
  const response = await apiClient.post<LogoutResponse>('/v1/auth/logout');
  return response.data;
}

/**
 * 현재 로그인한 사용자 정보를 조회합니다.
 * 세션 유효성 검증에 사용됩니다.
 */
export async function getCurrentUser(): Promise<UserInfoResponse> {
  const response = await apiClient.get<UserInfoResponse>('/v1/auth/me');
  return response.data;
}

/**
 * 활성 세션을 확인합니다.
 */
export async function checkActiveSession(
  request: CheckActiveSessionRequest
): Promise<CheckActiveSessionResponse> {
  const response = await apiClient.post<CheckActiveSessionResponse>(
    '/v1/auth/check-active-session',
    request
  );
  return response.data;
}

/**
 * 세션을 폐기합니다. (동시접속 제어용)
 */
export async function revokeSession(
  request: RevokeSessionRequest
): Promise<RevokeSessionResponse> {
  const response = await apiClient.post<RevokeSessionResponse>(
    '/v1/auth/revoke-session',
    request
  );
  return response.data;
}

/**
 * 강제 로그인을 완료합니다.
 * 기존 세션 폐기 후 임시 저장된 토큰으로 로그인을 완료합니다.
 */
export async function completeForceLogin(
  request: CompleteForceLoginRequest
): Promise<GoogleAuthResponse> {
  const response = await apiClient.post<GoogleAuthResponse>(
    '/v1/auth/complete-force-login',
    request
  );
  return response.data;
}

/**
 * Heartbeat를 전송하여 세션을 활성 상태로 유지합니다.
 * 백그라운드에서 조용히 실행됩니다 (로딩 표시 없음).
 */
export async function sendHeartbeat(): Promise<HeartbeatResponse> {
  const response = await apiClient.post<HeartbeatResponse>(
    '/v1/auth/session/heartbeat',
    {},
    { skipLoading: true } as any // skipLoading 옵션 전달
  );
  return response.data;
}
