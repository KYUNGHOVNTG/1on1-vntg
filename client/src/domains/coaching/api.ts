/**
 * Coaching AI 도메인 API
 *
 * 1on1 코칭 AI 시스템 관련 API 호출 함수
 */

import { apiClient } from '@/core/api/client';
import type {
  DashboardResponse,
  GetDashboardParams,
  CreateMeetingRequest,
  CreateMeetingResponse,
  PreMeetingResponse,
  MeetingStartRequest,
  ActiveMeetingResponse,
  RrTreeResponse,
  CreateTimelineRequest,
  CreateTimelineResponse,
  UpdateTimelineRequest,
  SaveMemoRequest,
  AddAgendaRequest,
  AddAgendaResponse,
  AiQuestionsResponse,
  PresignedUrlResponse,
  CompleteMeetingRequest,
  MeetingHistoryResponse,
  MeetingReportResponse,
  AudioUrlResponse,
  ActiveAgendaItem,
  ActiveActionItem,
} from './types';

// =============================================
// 대시보드
// =============================================

/**
 * 대시보드 조회 (팀원 목록 + 면담 현황 통계)
 *
 * @param params - 필터 파라미터 (dept_code, search_name)
 * @returns 대시보드 응답 (summary + items)
 */
export async function getDashboard(params?: GetDashboardParams): Promise<DashboardResponse> {
  const response = await apiClient.get<DashboardResponse>('/v1/coaching/dashboard', { params });
  return response.data;
}

// =============================================
// 미팅 생성 / 사전 준비
// =============================================

/**
 * 미팅 레코드 생성 (status=REQUESTED)
 *
 * 사전 준비 모달 열릴 때 즉시 호출하여 meeting_id를 확보합니다.
 *
 * @param request - 팀원 사번 포함 요청
 * @returns 생성된 미팅 ID
 */
export async function createMeeting(request: CreateMeetingRequest): Promise<CreateMeetingResponse> {
  const response = await apiClient.post<CreateMeetingResponse>('/v1/coaching/meetings', request);
  return response.data;
}

/**
 * 사전 준비 데이터 로드
 *
 * 이전 미팅 미완료 Action Item + AI 추천 질문을 불러옵니다.
 *
 * @param meetingId - 미팅 ID
 * @returns 사전 준비 데이터
 */
export async function getPreMeeting(meetingId: string): Promise<PreMeetingResponse> {
  const response = await apiClient.get<PreMeetingResponse>(
    `/v1/coaching/meetings/${meetingId}/pre-meeting`
  );
  return response.data;
}

/**
 * 미팅 취소 (REQUESTED 상태 레코드 삭제)
 *
 * 사전 준비 모달 [취소] 클릭 시 호출합니다.
 * REQUESTED 상태가 아닌 미팅은 삭제 거부됩니다.
 *
 * @param meetingId - 미팅 ID
 */
export async function deleteMeeting(meetingId: string): Promise<void> {
  await apiClient.delete(`/v1/coaching/meetings/${meetingId}`);
}

// =============================================
// 미팅 실행
// =============================================

/**
 * 미팅 시작
 *
 * status = IN_PROGRESS로 전환하고 아젠다를 등록합니다.
 * 이전 N-1, N-2 미팅의 미완료 Action Item이 이월 복사됩니다.
 *
 * @param meetingId - 미팅 ID
 * @param request   - 아젠다 목록
 */
export async function startMeeting(
  meetingId: string,
  request: MeetingStartRequest
): Promise<void> {
  await apiClient.patch(`/v1/coaching/meetings/${meetingId}/start`, request);
}

/**
 * 미팅 실행 화면 초기 데이터 조회
 *
 * @param meetingId - 미팅 ID
 * @returns 미팅 실행 데이터 (아젠다, 이월 Action Item, 타임라인 등)
 */
export async function getActiveMeeting(meetingId: string): Promise<ActiveMeetingResponse> {
  const response = await apiClient.get<ActiveMeetingResponse>(
    `/v1/coaching/meetings/${meetingId}/active`
  );
  return response.data;
}

/**
 * 팀원 R&R 계층 구조 조회
 *
 * @param memberEmpNo - 팀원 사번
 * @returns R&R 트리 구조
 */
export async function getMemberRrTree(memberEmpNo: string): Promise<RrTreeResponse> {
  const response = await apiClient.get<RrTreeResponse>(
    `/v1/coaching/members/${memberEmpNo}/rnr`
  );
  return response.data;
}

/**
 * 타임라인 카드 생성 (R&R 클릭 시)
 *
 * @param meetingId - 미팅 ID
 * @param request   - R&R ID + 시작 시간
 * @returns 생성된 타임라인 카드 정보
 */
export async function createTimeline(
  meetingId: string,
  request: CreateTimelineRequest
): Promise<CreateTimelineResponse> {
  const response = await apiClient.post<CreateTimelineResponse>(
    `/v1/coaching/meetings/${meetingId}/timelines`,
    request
  );
  return response.data;
}

/**
 * 타임라인 카드 업데이트 (카드 마감 OR 구간 요약 수정)
 *
 * - end_time만 전달: 카드 마감 (미팅 실행 중)
 * - segment_summary만 전달: 구간 요약 수정 (히스토리 리포트에서 편집)
 *
 * @param meetingId  - 미팅 ID
 * @param timelineId - 타임라인 카드 ID
 * @param request    - end_time 또는 segment_summary
 */
export async function updateTimeline(
  meetingId: string,
  timelineId: string,
  request: UpdateTimelineRequest
): Promise<void> {
  await apiClient.patch(
    `/v1/coaching/meetings/${meetingId}/timelines/${timelineId}`,
    request
  );
}

/**
 * 개인 메모 저장 (debounce 자동 저장용)
 *
 * @param meetingId - 미팅 ID
 * @param request   - 메모 내용
 */
export async function saveMemo(meetingId: string, request: SaveMemoRequest): Promise<void> {
  await apiClient.patch(`/v1/coaching/meetings/${meetingId}/memo`, request);
}

/**
 * 아젠다 체크 토글 (is_completed 토글)
 *
 * @param meetingId - 미팅 ID
 * @param agendaId  - 아젠다 ID
 * @returns 업데이트된 아젠다 항목
 */
export async function toggleAgendaComplete(
  meetingId: string,
  agendaId: string
): Promise<ActiveAgendaItem> {
  const response = await apiClient.patch<ActiveAgendaItem>(
    `/v1/coaching/meetings/${meetingId}/agendas/${agendaId}/complete`
  );
  return response.data;
}

/**
 * Action Item 체크 토글 (이월 항목도 현재 미팅 row에서만 업데이트)
 *
 * @param meetingId    - 미팅 ID
 * @param actionItemId - Action Item ID
 * @returns 업데이트된 Action Item 항목
 */
export async function toggleActionItemComplete(
  meetingId: string,
  actionItemId: string
): Promise<ActiveActionItem> {
  const response = await apiClient.patch<ActiveActionItem>(
    `/v1/coaching/meetings/${meetingId}/action-items/${actionItemId}/complete`
  );
  return response.data;
}

/**
 * 리더 즉석 아젠다 추가 (source=LEADER_ADDED)
 *
 * @param meetingId - 미팅 ID
 * @param request   - 아젠다 내용
 * @returns 추가된 아젠다 항목
 */
export async function addAgenda(
  meetingId: string,
  request: AddAgendaRequest
): Promise<AddAgendaResponse> {
  const response = await apiClient.post<AddAgendaResponse>(
    `/v1/coaching/meetings/${meetingId}/agendas`,
    request
  );
  return response.data;
}

/**
 * AI 스마트 아젠다 새로고침 (LLM 재호출)
 *
 * @param meetingId - 미팅 ID
 * @returns AI 추천 질문 목록
 */
export async function getAiQuestions(meetingId: string): Promise<AiQuestionsResponse> {
  const response = await apiClient.get<AiQuestionsResponse>(
    `/v1/coaching/meetings/${meetingId}/ai-questions`
  );
  return response.data;
}

// =============================================
// 미팅 종료 + GCS 업로드
// =============================================

/**
 * GCS Presigned Upload URL 발급
 *
 * @param meetingId - 미팅 ID
 * @returns Presigned URL + GCS 경로 + 만료 시간
 */
export async function getPresignedUploadUrl(meetingId: string): Promise<PresignedUrlResponse> {
  const response = await apiClient.post<PresignedUrlResponse>(
    `/v1/coaching/meetings/${meetingId}/presigned-url`
  );
  return response.data;
}

/**
 * GCS 직접 업로드 (XMLHttpRequest 사용 - 업로드 진행률 추적 필요)
 *
 * fetch는 업로드 진행률 추적 불가 → XMLHttpRequest.upload.onprogress 사용 필수
 *
 * @param presignedUrl   - GCS Presigned URL
 * @param audioBlob      - 녹음된 오디오 Blob
 * @param onProgress     - 진행률 콜백 (0~100)
 * @returns 업로드 성공 여부
 */
export async function uploadAudioToGcs(
  presignedUrl: string,
  audioBlob: Blob,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event: ProgressEvent) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`GCS 업로드 실패: ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('GCS 업로드 중 네트워크 오류 발생'));
    };

    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', audioBlob.type || 'audio/webm');
    xhr.send(audioBlob);
  });
}

/**
 * 미팅 종료 처리
 *
 * status = PROCESSING으로 전환하고 AI 파이프라인을 트리거합니다.
 *
 * @param meetingId - 미팅 ID
 * @param request   - 녹음 길이 + GCS 경로 + 타임라인 + 메모
 */
export async function completeMeeting(
  meetingId: string,
  request: CompleteMeetingRequest
): Promise<void> {
  await apiClient.patch(`/v1/coaching/meetings/${meetingId}/complete`, request);
}

// =============================================
// 히스토리 + 리포트
// =============================================

/**
 * 팀원별 미팅 히스토리 목록 조회
 *
 * @param memberEmpNo - 팀원 사번
 * @returns 미팅 히스토리 목록
 */
export async function getMeetingHistory(memberEmpNo: string): Promise<MeetingHistoryResponse> {
  const response = await apiClient.get<MeetingHistoryResponse>(
    `/v1/coaching/members/${memberEmpNo}/meetings`
  );
  return response.data;
}

/**
 * 미팅 상세 리포트 조회
 *
 * @param meetingId - 미팅 ID
 * @returns 미팅 리포트 (AI 요약, 타임라인, Action Item 등)
 */
export async function getMeetingReport(meetingId: string): Promise<MeetingReportResponse> {
  const response = await apiClient.get<MeetingReportResponse>(
    `/v1/coaching/meetings/${meetingId}/report`
  );
  return response.data;
}

/**
 * GCS Presigned Download URL 발급 (오디오 재생용)
 *
 * 매 요청마다 새로운 URL을 발급합니다 (캐싱 금지).
 *
 * @param meetingId - 미팅 ID
 * @returns 오디오 재생용 URL + 만료 시간
 */
export async function getAudioUrl(meetingId: string): Promise<AudioUrlResponse> {
  const response = await apiClient.get<AudioUrlResponse>(
    `/v1/coaching/meetings/${meetingId}/audio-url`
  );
  return response.data;
}
