/**
 * Coaching AI 도메인 타입 정의
 *
 * 1on1 코칭 AI 시스템 관련 전체 타입을 정의합니다.
 * 백엔드 응답 필드명(snake_case)과 일치합니다.
 */

// =============================================
// 공통 타입
// =============================================

/**
 * 미팅 상태
 * REQUESTED: 사전준비 모달 열림
 * IN_PROGRESS: 녹음 중
 * PROCESSING: GCS 업로드 완료, AI 파이프라인 처리 중
 * COMPLETED: 모든 처리 완료
 * FAILED: AI 파이프라인 실패
 */
export type MeetingStatus = 'REQUESTED' | 'IN_PROGRESS' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

/**
 * 아젠다 출처
 * MEMBER_PRESET: 조직원 사전 작성 (v1 미사용, 항상 빈 배열)
 * AI_SUGGESTED: AI 추천 질문
 * LEADER_ADDED: 리더 즉석 추가
 */
export type AgendaSource = 'MEMBER_PRESET' | 'AI_SUGGESTED' | 'LEADER_ADDED';

/**
 * Action Item 담당자
 */
export type ActionItemAssignee = 'LEADER' | 'MEMBER';

/**
 * 면담 상태 (대시보드 필터용)
 * NOT_STARTED: 미실시
 * OVERDUE_2M: 2개월 초과 지연
 * DUE_1M: 1개월 도래
 * NORMAL: 정상
 */
export type MeetingStatusBadge = 'NOT_STARTED' | 'OVERDUE_2M' | 'DUE_1M' | 'NORMAL';

// =============================================
// 대시보드
// =============================================

/**
 * 대시보드 상단 요약 카드
 */
export interface DashboardSummary {
  requested_count: number;   // 면담 요청 (미실시)
  overdue_2month: number;    // 2개월 초과 지연
  due_1month: number;        // 1개월 도래
  normal_count: number;      // 정상
}

/**
 * 대시보드 팀원 목록 항목
 */
export interface DashboardMemberItem {
  emp_no: string;
  emp_name: string;
  dept_name: string;
  last_meeting_date: string | null;
  total_meeting_count: number;
  meeting_status: MeetingStatusBadge;
}

/**
 * 대시보드 응답
 */
export interface DashboardResponse {
  summary: DashboardSummary;
  items: DashboardMemberItem[];
  total: number;
}

/**
 * 대시보드 조회 파라미터
 */
export interface GetDashboardParams {
  dept_code?: string;
  search_name?: string;
}

// =============================================
// 사전 준비 모달 (Pre-meeting)
// =============================================

/**
 * 팀원 기본 정보
 */
export interface MemberInfo {
  emp_no: string;
  emp_name: string;
  dept_name: string;
  position_name: string;
}

/**
 * 이전 미팅 Action Item 요약 (사전 준비 모달용)
 */
export interface ActionItemBrief {
  action_item_id: string;
  content: string;
  assignee: ActionItemAssignee | null;
  origin_meeting_id: string;
}

/**
 * 미팅 생성 요청
 */
export interface CreateMeetingRequest {
  member_emp_no: string;
}

/**
 * 미팅 생성 응답
 */
export interface CreateMeetingResponse {
  meeting_id: string;
}

/**
 * 사전 준비 데이터 응답
 */
export interface PreMeetingResponse {
  meeting_id: string;
  member_info: MemberInfo;
  is_first_meeting: boolean;
  previous_action_items: ActionItemBrief[];
  ai_suggested_agendas: string[];
  member_preset_agendas: string[];  // v1: 항상 빈 배열
}

// =============================================
// 미팅 실행 (Active Meeting)
// =============================================

/**
 * 아젠다 항목 (미팅 시작 요청 시)
 */
export interface AgendaStartItem {
  content: string;
  source: Exclude<AgendaSource, 'MEMBER_PRESET'>;
}

/**
 * 미팅 시작 요청
 */
export interface MeetingStartRequest {
  agendas: AgendaStartItem[];
}

/**
 * 미팅 실행 화면 아젠다 항목
 */
export interface ActiveAgendaItem {
  agenda_id: string;
  content: string;
  source: AgendaSource;
  order: number;
  is_completed: boolean;
}

/**
 * 미팅 실행 화면 Action Item 항목
 */
export interface ActiveActionItem {
  action_item_id: string;
  content: string;
  assignee: ActionItemAssignee | null;
  is_completed: boolean;
  is_carried_over: boolean;
  origin_meeting_id: string | null;
}

/**
 * 미팅 실행 화면 타임라인 항목
 */
export interface ActiveTimelineItem {
  timeline_id: string;
  rr_id: string | null;
  rr_name: string | null;
  start_time: number;
  end_time: number | null;
  segment_summary: string | null;
}

/**
 * 미팅 실행 초기 데이터 응답
 */
export interface ActiveMeetingResponse {
  meeting_id: string;
  member_info: MemberInfo;
  started_at: string;
  agendas: ActiveAgendaItem[];
  action_items: ActiveActionItem[];   // 이월 항목 포함
  timelines: ActiveTimelineItem[];
  private_memo: string | null;
}

/**
 * R&R 트리 노드
 */
export interface RrTreeNode {
  rr_id: string;
  upper_rr_name: string | null;
  rr_name: string;
  detail_content: string | null;
  children: RrTreeNode[];
}

/**
 * R&R 트리 응답
 */
export interface RrTreeResponse {
  items: RrTreeNode[];
  total: number;
}

/**
 * 타임라인 생성 요청
 */
export interface CreateTimelineRequest {
  rr_id: string;
  start_time: number;
}

/**
 * 타임라인 생성 응답
 */
export interface CreateTimelineResponse {
  timeline_id: string;
  rr_id: string;
  start_time: number;
}

/**
 * 타임라인 업데이트 요청 (카드 마감 OR 구간 요약 수정)
 */
export interface UpdateTimelineRequest {
  end_time?: number;
  segment_summary?: string;
}

/**
 * 메모 저장 요청
 */
export interface SaveMemoRequest {
  private_memo: string;
}

/**
 * 아젠다 추가 요청
 */
export interface AddAgendaRequest {
  content: string;
}

/**
 * 아젠다 추가 응답
 */
export interface AddAgendaResponse {
  agenda_id: string;
  content: string;
  source: AgendaSource;
  order: number;
  is_completed: boolean;
}

/**
 * AI 추천 질문 응답
 */
export interface AiQuestionsResponse {
  questions: string[];
}

// =============================================
// 미팅 종료 + GCS 업로드
// =============================================

/**
 * Presigned URL 응답
 */
export interface PresignedUrlResponse {
  presigned_url: string;
  gcs_path: string;
  expires_at: string;
}

/**
 * 타임라인 최종 항목 (미팅 종료 시 전달)
 */
export interface FinalTimelineItem {
  timeline_id: string;
  end_time: number | null;
}

/**
 * 미팅 종료 요청
 */
export interface CompleteMeetingRequest {
  actual_duration_seconds: number;
  gcs_path: string;
  timelines: FinalTimelineItem[];
  private_memo: string | null;
}

// =============================================
// 히스토리 + 리포트
// =============================================

/**
 * 미팅 히스토리 목록 항목
 */
export interface MeetingHistoryItem {
  meeting_id: string;
  started_at: string;
  actual_duration_seconds: number;
  status: MeetingStatus;
  ai_summary: string | null;
  action_item_count: number;
  completed_action_item_count: number;
}

/**
 * 미팅 히스토리 목록 응답
 */
export interface MeetingHistoryResponse {
  items: MeetingHistoryItem[];
  total: number;
}

/**
 * 리포트 타임라인 항목
 */
export interface TimelineItem {
  timeline_id: string;
  rr_name: string | null;
  start_time: number;
  end_time: number | null;
  segment_summary: string | null;
}

/**
 * 리포트 Action Item 항목
 */
export interface ActionItemReport {
  action_item_id: string;
  content: string;
  assignee: ActionItemAssignee | null;
  is_completed: boolean;
  is_carried_over: boolean;
  origin_meeting_id: string | null;
}

/**
 * 미팅 상세 리포트 응답
 */
export interface MeetingReportResponse {
  meeting_id: string;
  member_info: MemberInfo;
  started_at: string;
  actual_duration_seconds: number;
  status: MeetingStatus;
  ai_summary: string | null;
  timelines: TimelineItem[];
  action_items: ActionItemReport[];
  private_memo: string | null;   // 리더만 조회 가능, 멤버는 null
}

/**
 * 오디오 URL 응답
 */
export interface AudioUrlResponse {
  audio_url: string;
  expires_at: string;
}

// =============================================
// Store 내부 타입
// =============================================

/**
 * 현재 진행 중인 미팅 상태 (store 내부용)
 */
export interface ActiveMeeting {
  meeting_id: string;
  member_info: MemberInfo;
  started_at: string;
  agendas: ActiveAgendaItem[];
  action_items: ActiveActionItem[];
  timelines: ActiveTimelineItem[];
  private_memo: string;
}

/**
 * IndexedDB 임시 저장 데이터
 */
export interface MeetingDraft {
  meetingId: string;
  memo: string;
  timestamp: number;
}
