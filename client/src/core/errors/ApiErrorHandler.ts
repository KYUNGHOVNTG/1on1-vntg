/**
 * API Error Handler (Class-based)
 *
 * API 요청 중 발생하는 에러를 일관되게 처리합니다.
 * - HTTP 상태 코드별 에러 메시지 제공
 * - 에러 로깅 및 알림
 * - 재시도 로직 (선택적)
 *
 * 사용 가이드:
 *    ApiClient의 response interceptor에서 사용됩니다.
 *    직접 사용할 일은 거의 없지만, 에러 핸들링 커스터마이징이 필요하면
 *    이 클래스를 확장하세요.
 *
 * 확장 가이드:
 *    - 특정 에러 코드에 대한 자동 재시도
 *    - 토큰 갱신 로직 추가
 *    - 에러 로깅 서비스 연동
 *    - 사용자에게 Toast 알림 표시
 */

import { AxiosError } from 'axios';

/**
 * 표준화된 API 에러 인터페이스
 */
export interface ApiErrorData {
  status: number;
  message: string;
  details?: any;
  timestamp?: string;
}

/**
 * ApiErrorHandler 클래스
 *
 * API 에러를 분석하고 사용자 친화적인 메시지로 변환합니다.
 */
export class ApiErrorHandler {
  /**
   * Axios 에러를 표준 형식으로 변환
   *
   * @param error - Axios 에러 객체
   * @returns 표준화된 에러 데이터
   */
  static handle(error: AxiosError): ApiErrorData {
    const status = error.response?.status || 0;
    const responseData = error.response?.data as any;

    // 서버에서 제공한 에러 메시지가 있으면 우선 사용
    // FastAPI는 detail 필드를 사용하므로 우선순위: detail > error > message
    let message = responseData?.detail || responseData?.error || responseData?.message;

    // 없으면 HTTP 상태 코드별 기본 메시지 사용
    if (!message) {
      message = this.getDefaultMessage(status, error);
    }

    const errorData: ApiErrorData = {
      status,
      message,
      details: responseData?.details,
      timestamp: new Date().toISOString(),
    };

    // 개발 환경에서 콘솔에 에러 출력
    if (import.meta.env.DEV) {
      console.error('🔴 API Error:', errorData);
      console.error('Original Error:', error);
    }

    // TODO: 에러 로깅 서비스 연동
    // this.logToService(errorData);

    // TODO: 특정 에러에 대한 Toast 알림
    // this.showToast(errorData);

    return errorData;
  }

  /**
   * HTTP 상태 코드별 기본 에러 메시지 반환
   *
   * @param status - HTTP 상태 코드
   * @param error - Axios 에러 객체
   * @returns 사용자 친화적인 에러 메시지
   */
  private static getDefaultMessage(status: number, error: AxiosError): string {
    // 네트워크 에러 (서버 응답 없음)
    if (!status || status === 0) {
      if (error.code === 'ECONNABORTED') {
        return '요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.';
      }
      return '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.';
    }

    // HTTP 상태 코드별 메시지
    switch (status) {
      case 400:
        return '잘못된 요청입니다. 입력 내용을 확인해주세요.';
      case 401:
        return '인증이 필요합니다. 다시 로그인해주세요.';
      case 403:
        return '접근 권한이 없습니다.';
      case 404:
        return '요청하신 리소스를 찾을 수 없습니다.';
      case 409:
        return '요청이 서버의 현재 상태와 충돌합니다.';
      case 422:
        return '입력 데이터 검증에 실패했습니다.';
      case 429:
        return '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.';
      case 500:
        return '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      case 502:
        return '게이트웨이 오류가 발생했습니다.';
      case 503:
        return '서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
      case 504:
        return '게이트웨이 시간 초과가 발생했습니다.';
      default:
        return `오류가 발생했습니다. (상태 코드: ${status})`;
    }
  }

  /**
   * 에러가 특정 상태 코드인지 확인
   *
   * @param error - Axios 에러 객체
   * @param statusCode - 확인할 상태 코드
   * @returns 상태 코드 일치 여부
   */
  static isStatusCode(error: AxiosError, statusCode: number): boolean {
    return error.response?.status === statusCode;
  }

  /**
   * 인증 에러인지 확인
   *
   * @param error - Axios 에러 객체
   * @returns 인증 에러 여부
   */
  static isAuthError(error: AxiosError): boolean {
    const status = error.response?.status;
    return status === 401;
  }

  /**
   * 권한 없음 에러인지 확인 (403 Forbidden)
   * 인증 상태는 유지하되 해당 리소스에 접근 권한이 없는 경우
   *
   * @param error - Axios 에러 객체
   * @returns 권한 없음 에러 여부
   */
  static isForbiddenError(error: AxiosError): boolean {
    return error.response?.status === 403;
  }

  /**
   * 네트워크 에러인지 확인
   *
   * @param error - Axios 에러 객체
   * @returns 네트워크 에러 여부
   */
  static isNetworkError(error: AxiosError): boolean {
    return !error.response || error.code === 'ECONNABORTED';
  }

  /**
   * 에러 로깅 서비스 연동
   *
   * TODO: Sentry, LogRocket 등과 연동
   *
   * @param errorData - 에러 데이터
   */
  // @ts-expect-error - TODO: 향후 사용 예정
  private static _logToService(_errorData: ApiErrorData): void {
    // Example: Sentry
    // Sentry.captureException(new Error(errorData.message), {
    //   extra: errorData,
    // });

    // Example: Custom logging service
    // LoggingService.logError(errorData);
  }

  /**
   * Toast 알림 표시
   *
   * TODO: Toast 라이브러리 연동
   *
   * @param errorData - 에러 데이터
   */
  // @ts-expect-error - TODO: 향후 사용 예정
  private static _showToast(_errorData: ApiErrorData): void {
    // Example: react-hot-toast
    // toast.error(errorData.message);

    // Example: Custom toast component
    // ToastManager.showError(errorData.message);
  }
}

/**
 * 사용 예시:
 *
 * 1. ApiClient의 response interceptor에서
 * ```ts
 * axios.interceptors.response.use(
 *   (response) => response,
 *   (error) => {
 *     const errorData = ApiErrorHandler.handle(error);
 *     return Promise.reject(errorData);
 *   }
 * );
 * ```
 *
 * 2. 특정 에러 타입 체크
 * ```ts
 * try {
 *   await apiClient.get('/protected');
 * } catch (error) {
 *   if (ApiErrorHandler.isAuthError(error)) {
 *     // 로그인 페이지로 리다이렉트
 *   }
 * }
 * ```
 *
 * 3. 커스텀 에러 핸들링
 * ```ts
 * class CustomErrorHandler extends ApiErrorHandler {
 *   static handle(error: AxiosError): ApiErrorData {
 *     const errorData = super.handle(error);
 *     // 추가 로직...
 *     return errorData;
 *   }
 * }
 * ```
 */
