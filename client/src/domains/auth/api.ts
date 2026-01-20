/**
 * Auth API 클라이언트
 *
 * Google OAuth 로그인 API 호출을 처리합니다.
 */

import { apiClient } from '@/core/api/client';
import type {
  GoogleAuthURLResponse,
  GoogleAuthCallbackRequest,
  GoogleAuthResponse,
  LogoutResponse,
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
