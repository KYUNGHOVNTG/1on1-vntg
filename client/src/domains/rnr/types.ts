/**
 * R&R 도메인 타입 정의
 *
 * 나의 R&R 관리 관련 타입을 정의합니다.
 * 백엔드 응답 필드명(snake_case)과 일치합니다.
 */

// =============================================
// 업무 기간
// =============================================

/**
 * R&R 수행 기간 항목
 */
export interface RrPeriod {
  seq: number;
  start_date: string;  // YYYYMM
  end_date: string;    // YYYYMM
}

/**
 * R&R 등록 시 기간 입력 항목 (seq 없음)
 */
export interface PeriodInput {
  start_date: string;  // YYYYMM
  end_date: string;    // YYYYMM
}

// =============================================
// R&R 아이템
// =============================================

/**
 * R&R 상태
 * N: 미작성, R: 작성중, Y: 확정
 */
export type RrStatus = 'N' | 'R' | 'Y';

/**
 * R&R 유형
 * COMPANY: 전사, LEADER: 조직장, MEMBER: 팀원
 */
export type RrType = 'COMPANY' | 'LEADER' | 'MEMBER';

/**
 * R&R 단일 아이템 (목록/상세 공통)
 */
export interface RrItem {
  rr_id: string;
  year: string;
  level_id: string;
  emp_no: string;
  dept_code: string;
  rr_type: RrType;
  parent_rr_id: string | null;
  parent_title: string | null;  // 상위 R&R 명 (JOIN 결과)
  title: string;
  content: string | null;
  status: RrStatus;
  in_date: string;
  periods: RrPeriod[];
}

/**
 * R&R 목록 응답
 */
export interface RrListResponse {
  items: RrItem[];
  total: number;
}

// =============================================
// 내 부서 목록
// =============================================

/**
 * 소속 부서 아이템 (주소속 + 겸직)
 */
export interface MyDepartmentItem {
  dept_code: string;
  dept_name: string;
  is_main: boolean;  // 주소속 여부
}

/**
 * 내 부서 목록 응답
 */
export interface MyDepartmentsResponse {
  items: MyDepartmentItem[];
  total: number;
}

// =============================================
// 상위 R&R 선택 목록
// =============================================

/**
 * 상위 R&R 드롭다운 항목
 */
export interface ParentRrOption {
  rr_id: string;
  title: string;
  emp_no: string;
  emp_name: string;
}

/**
 * 상위 R&R 선택 목록 응답
 */
export interface ParentRrOptionsResponse {
  items: ParentRrOption[];
  total: number;
}

// =============================================
// R&R 등록 요청
// =============================================

/**
 * R&R 등록 요청
 */
export interface RrCreateRequest {
  year: string;
  dept_code: string;
  parent_rr_id: string | null;
  title: string;
  content: string | null;
  periods: PeriodInput[];
}
