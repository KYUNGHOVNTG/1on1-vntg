"""
Coaching 도메인 Pydantic 스키마

Request/Response DTO 정의
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# =============================================
# 공통 스키마
# =============================================


class MemberInfo(BaseModel):
    emp_no: str
    emp_name: str
    dept_name: str


# =============================================
# Task 3 — 대시보드 스키마
# =============================================


class DashboardSummary(BaseModel):
    """대시보드 상단 집계 카드"""

    requested_count: int  # 미실시 (last_meeting_date IS NULL)
    overdue_2month: int  # 2개월 초과 지연
    due_1month: int  # 1개월 도래
    normal_count: int  # 정상


class DashboardMemberItem(BaseModel):
    """대시보드 팀원 목록 아이템"""

    emp_no: str
    emp_name: str
    dept_name: str
    last_meeting_date: Optional[datetime]
    total_meeting_count: int
    meeting_status: str  # 'NOT_STARTED' | 'OVERDUE_2M' | 'DUE_1M' | 'NORMAL'


class DashboardResponse(BaseModel):
    """GET /coaching/dashboard 응답"""

    summary: DashboardSummary
    items: list[DashboardMemberItem]
    total: int


# =============================================
# Task 4 — 사전 준비 모달 스키마
# =============================================


class CreateMeetingRequest(BaseModel):
    """POST /coaching/meetings 요청"""

    member_emp_no: str


class CreateMeetingResponse(BaseModel):
    """POST /coaching/meetings 응답"""

    meeting_id: str
    member_emp_no: str
    status: str


class ActionItemBrief(BaseModel):
    """사전 준비 모달용 이전 미팅 미완료 Action Item 요약"""

    action_item_id: str
    content: str
    assignee: Optional[str]  # 'LEADER' | 'MEMBER' | None
    origin_meeting_id: str


class PreMeetingResponse(BaseModel):
    """GET /coaching/meetings/{meeting_id}/pre-meeting 응답"""

    meeting_id: str
    member_info: MemberInfo
    is_first_meeting: bool
    previous_action_items: list[ActionItemBrief]  # 이전 N-1, N-2 미팅 미완료 Action Items
    ai_suggested_agendas: list[str]  # AI 추천 질문 (LLM 호출, 실패 시 빈 배열)
    member_preset_agendas: list[str]  # v1: 항상 빈 배열 []


# =============================================
# Task 5 — 미팅 실행 스키마
# =============================================


class AgendaStartItem(BaseModel):
    """PATCH /start body의 아젠다 아이템"""

    content: str
    source: str  # 'AI_SUGGESTED' | 'LEADER_ADDED'


class MeetingStartRequest(BaseModel):
    """PATCH /coaching/meetings/{meeting_id}/start 요청"""

    agendas: list[AgendaStartItem]
    # MEMBER_PRESET은 v1 미사용 → 항상 제외


class ActiveMeetingAgendaItem(BaseModel):
    """활성 미팅 아젠다 아이템"""

    agenda_id: str
    content: str
    source: str  # 'AI_SUGGESTED' | 'LEADER_ADDED' | 'MEMBER_PRESET'
    order: int
    is_completed: bool


class ActiveMeetingActionItem(BaseModel):
    """활성 미팅 Action Item"""

    action_item_id: str
    content: str
    assignee: Optional[str]  # 'LEADER' | 'MEMBER' | None
    is_completed: bool
    is_carried_over: bool
    origin_meeting_id: Optional[str]


class ActiveMeetingTimelineItem(BaseModel):
    """활성 미팅 타임라인 카드"""

    timeline_id: str
    rr_id: Optional[str]
    start_time: int
    end_time: Optional[int]
    segment_summary: Optional[str]


class ActiveMeetingResponse(BaseModel):
    """GET /coaching/meetings/{meeting_id}/active 응답"""

    meeting_id: str
    member_info: MemberInfo
    started_at: datetime
    status: str
    agendas: list[ActiveMeetingAgendaItem]
    action_items: list[ActiveMeetingActionItem]
    timelines: list[ActiveMeetingTimelineItem]
    private_memo: Optional[str]


class RrTreeNode(BaseModel):
    """R&R 계층 구조 노드"""

    rr_id: str
    upper_rr_name: Optional[str]
    rr_name: str
    detail_content: Optional[str]
    children: list["RrTreeNode"] = []

    model_config = {"arbitrary_types_allowed": True}


RrTreeNode.model_rebuild()


class RrTreeResponse(BaseModel):
    """GET /coaching/members/{member_emp_no}/rnr 응답"""

    items: list[RrTreeNode]
    total: int


class CreateTimelineRequest(BaseModel):
    """POST /coaching/meetings/{meeting_id}/timelines 요청"""

    rr_id: Optional[str] = None
    start_time: int


class CreateTimelineResponse(BaseModel):
    """POST /coaching/meetings/{meeting_id}/timelines 응답"""

    timeline_id: str
    rr_id: Optional[str]
    start_time: int
    end_time: Optional[int]


class PatchTimelineRequest(BaseModel):
    """PATCH /coaching/meetings/{meeting_id}/timelines/{timeline_id} 요청

    end_time만 → 카드 마감 (미팅 실행 중)
    segment_summary만 → 구간 요약 수정 (히스토리 리포트에서 편집)
    """

    end_time: Optional[int] = None
    segment_summary: Optional[str] = None


class PatchMemoRequest(BaseModel):
    """PATCH /coaching/meetings/{meeting_id}/memo 요청"""

    private_memo: str


class CreateAgendaRequest(BaseModel):
    """POST /coaching/meetings/{meeting_id}/agendas 요청"""

    content: str


class CreateAgendaResponse(BaseModel):
    """POST /coaching/meetings/{meeting_id}/agendas 응답"""

    agenda_id: str
    content: str
    source: str
    order: int
    is_completed: bool


class AiQuestionsResponse(BaseModel):
    """GET /coaching/meetings/{meeting_id}/ai-questions 응답"""

    ai_suggested_agendas: list[str]


# =============================================
# Task 6 — 미팅 종료 + GCS 업로드 스키마
# =============================================


class PresignedUrlResponse(BaseModel):
    """POST /coaching/meetings/{meeting_id}/presigned-url 응답"""

    presigned_url: str
    gcs_path: str
    expires_at: str


class CompleteMeetingRequest(BaseModel):
    """PATCH /coaching/meetings/{meeting_id}/complete 요청

    GCS 업로드 완료 후 프론트엔드가 전달합니다.
    """

    actual_duration_seconds: int  # 실제 녹음 길이(초)
    gcs_path: str  # 업로드 완료 후 프론트가 전달하는 GCS 경로
    private_memo: Optional[str] = None  # 최종 메모 (없으면 기존 유지)


# =============================================
# Task 7 — 히스토리 및 리포트 스키마
# =============================================


class MeetingHistoryItem(BaseModel):
    """GET /coaching/members/{member_emp_no}/meetings 응답 아이템"""

    meeting_id: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    actual_duration_seconds: int
    status: str  # 'REQUESTED' | 'IN_PROGRESS' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    total_action_items: int   # 전체 Action Item 수 (이월 포함)
    completed_action_items: int  # 완료된 Action Item 수


class MeetingHistoryResponse(BaseModel):
    """GET /coaching/members/{member_emp_no}/meetings 응답"""

    member_info: MemberInfo
    items: list[MeetingHistoryItem]
    total: int


class TimelineItem(BaseModel):
    """리포트용 타임라인 아이템"""

    timeline_id: str
    rr_name: Optional[str]   # R&R 이름 (rr_id → TbRr.rr_name JOIN)
    start_time: int
    end_time: Optional[int]
    segment_summary: Optional[str]


class ActionItemReport(BaseModel):
    """리포트용 Action Item"""

    action_item_id: str
    content: str
    assignee: Optional[str]   # 'LEADER' | 'MEMBER' | None
    is_completed: bool
    is_carried_over: bool
    origin_meeting_id: Optional[str]


class MeetingReportResponse(BaseModel):
    """GET /coaching/meetings/{meeting_id}/report 응답

    audio_url 미포함 — GET /audio-url 별도 호출 사용
    """

    meeting_id: str
    member_info: MemberInfo
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    actual_duration_seconds: int
    status: str
    ai_summary: Optional[str]
    timelines: list[TimelineItem]
    action_items: list[ActionItemReport]
    private_memo: Optional[str]  # 리더만 조회 가능, 멤버는 None 반환


class AudioUrlResponse(BaseModel):
    """GET /coaching/meetings/{meeting_id}/audio-url 응답"""

    audio_url: str
    expires_at: str  # ISO 8601 UTC 문자열
