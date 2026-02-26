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
 * cm_user + hr_mgnt + cm_department JOIN 결과
 */
export interface UserInfoResponse {
  user_id: string;
  email?: string;
  name?: string;
  role_code?: string;
  position_code?: string;
  /** 사번 (hr_mgnt.emp_no) - HR 데이터 없으면 undefined */
  emp_no?: string;
  /** 부서 코드 (hr_mgnt.dept_code) */
  dept_code?: string;
  /** 부서명 (cm_department.dept_name) */
  dept_name?: string;
  /** 한글 이름 (hr_mgnt.name_kor) */
  name_kor?: string;
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
