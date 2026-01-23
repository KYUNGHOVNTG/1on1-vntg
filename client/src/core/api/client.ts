/**
 * API Client Singleton
 *
 * 모든 HTTP 요청은 이 클라이언트를 통해 처리됩니다.
 * 컴포넌트에서 axios를 직접 사용하지 마세요.
 *
 * @example
 * import { apiClient } from '@/core/api/client';
 * const response = await apiClient.get('/users');
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, AxiosError } from 'axios';
import { LoadingManager } from '../loading/LoadingManager';
import { ApiErrorHandler } from '../errors/ApiErrorHandler';
import { toast } from '../ui/Toast';

class ApiClient {
  private instance: AxiosInstance;
  private static _instance: ApiClient;

  private constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Singleton 인스턴스 반환
   */
  public static getInstance(): ApiClient {
    if (!ApiClient._instance) {
      ApiClient._instance = new ApiClient();
    }
    return ApiClient._instance;
  }

  /**
   * Request/Response Interceptors 설정
   *
   * 전역 Loading 및 Error 처리를 자동화합니다.
   */
  private setupInterceptors(): void {
    // Request Interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // 전역 로딩 시작
        // config.skipLoading이 true이면 로딩 표시 안 함
        if (!(config as any).skipLoading) {
          LoadingManager.show();
        }

        // Authorization 헤더 자동 추가
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => {
        // 요청 실패 시 로딩 숨김
        LoadingManager.hide();
        return Promise.reject(error);
      }
    );

    // Response Interceptor
    this.instance.interceptors.response.use(
      (response) => {
        // 응답 성공 시 로딩 숨김
        LoadingManager.hide();
        return response;
      },
      (error: AxiosError) => {
        // 응답 실패 시 로딩 숨김
        LoadingManager.hide();

        // 에러 처리
        const errorData = ApiErrorHandler.handle(error);

        // 401 인증 에러 자동 처리
        if (ApiErrorHandler.isAuthError(error)) {
          // 에러 응답에서 error_code 추출
          const errorDetail = error.response?.data?.detail;
          const errorCode = typeof errorDetail === 'object' ? errorDetail.error_code : null;
          const errorMessage = typeof errorDetail === 'object' ? errorDetail.message : '인증이 만료되었습니다';

          // localStorage에서 토큰 삭제
          localStorage.removeItem('access_token');

          // Zustand store 초기화는 App.tsx에서 처리
          // (순환 참조 방지)

          // 현재 위치가 로그인 페이지가 아니면 리다이렉트
          if (window.location.pathname !== '/') {
            // error_code에 따라 다른 메시지 표시
            if (errorCode === 'SESSION_REVOKED') {
              // 다른 곳에서 로그인됨
              toast.warning('다른 기기에서 로그인하여 현재 세션이 종료되었습니다');
            } else if (errorCode === 'SESSION_IDLE_TIMEOUT') {
              // Idle timeout
              toast.warning('장시간 사용하지 않아 자동 로그아웃되었습니다');
            } else if (errorCode === 'SESSION_EXPIRED') {
              // 일반 세션 만료
              toast.warning('세션이 만료되었습니다');
            } else {
              // 기타 인증 오류
              toast.warning(errorMessage);
            }

            // 2초 후 로그인 페이지로 리다이렉트
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          }
        }

        // 변환된 에러 데이터 반환
        return Promise.reject(errorData);
      }
    );
  }

  /**
   * GET 요청
   */
  public async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config);
  }

  /**
   * POST 요청
   */
  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config);
  }

  /**
   * PUT 요청
   */
  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data, config);
  }

  /**
   * PATCH 요청
   */
  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data, config);
  }

  /**
   * DELETE 요청
   */
  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, config);
  }
}

// Singleton 인스턴스 export
export const apiClient = ApiClient.getInstance();
