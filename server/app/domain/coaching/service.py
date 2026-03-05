"""
Coaching 도메인 Service

흐름 제어 및 트랜잭션 관리 담당
Repository / Calculator / Formatter 조율
"""

import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.logging import get_logger
from server.app.core.storage.gcs import GCSClient, get_gcs_client
from server.app.domain.coaching.calculators import (
    generate_ai_suggested_agendas,
    run_ai_pipeline,
)
from server.app.domain.coaching.repositories import CoachingRepository
from server.app.domain.coaching.schemas import (
    ActionItemBrief,
    ActionItemReport,
    ActiveMeetingActionItem,
    ActiveMeetingAgendaItem,
    ActiveMeetingResponse,
    ActiveMeetingTimelineItem,
    AiQuestionsResponse,
    AudioUrlResponse,
    CompleteMeetingRequest,
    CreateAgendaResponse,
    CreateMeetingResponse,
    CreateTimelineResponse,
    DashboardMemberItem,
    DashboardResponse,
    DashboardSummary,
    MeetingHistoryItem,
    MeetingHistoryResponse,
    MeetingReportResponse,
    MemberInfo,
    PatchTimelineRequest,
    PreMeetingResponse,
    PresignedUrlResponse,
    RrTreeNode,
    RrTreeResponse,
    TimelineItem,
)
from server.app.shared.exceptions import BusinessLogicException, NotFoundException

logger = get_logger(__name__)

# 면담 상태 판별 기준
_OVERDUE_2M_DAYS: int = 60   # 2개월 (60일)
_DUE_1M_DAYS: int = 30       # 1개월 (30일)


def _calculate_meeting_status(last_meeting_date: Optional[datetime]) -> str:
    """
    마지막 면담일 기준으로 면담 상태를 계산합니다.

    Args:
        last_meeting_date: 마지막 면담일시 (UTC)

    Returns:
        str: 'NOT_STARTED' | 'OVERDUE_2M' | 'DUE_1M' | 'NORMAL'
    """
    if last_meeting_date is None:
        return "NOT_STARTED"

    now = datetime.utcnow()
    elapsed = now - last_meeting_date

    if elapsed > timedelta(days=_OVERDUE_2M_DAYS):
        return "OVERDUE_2M"
    if elapsed > timedelta(days=_DUE_1M_DAYS):
        return "DUE_1M"
    return "NORMAL"


class CoachingDashboardService:
    """
    코칭 대시보드 서비스

    책임:
        - 팀원 목록 + 면담 현황 집계 조회 흐름 제어
        - meeting_status 계산 (단순 날짜 비교, 내부 함수로 처리)
        - Repository 조율 (직접 DB 쿼리 작성 금지)
    """

    def __init__(self, db: AsyncSession) -> None:
        """
        Args:
            db: 비동기 데이터베이스 세션
        """
        self.db = db
        self.repo = CoachingRepository(db)

    async def get_dashboard(
        self,
        user_id: str,
        dept_code_filter: Optional[str] = None,
        search_name: Optional[str] = None,
    ) -> DashboardResponse:
        """
        대시보드 데이터를 조회합니다.

        1. user_id → emp_no 변환
        2. 리더의 dept_code 조회
        3. 팀원 목록 + TbCoachingRelation LEFT JOIN 조회
        4. meeting_status 계산
        5. 집계 요약(summary) 계산

        Args:
            user_id: JWT에서 추출한 로그인 사용자 ID
            dept_code_filter: 부서 코드 필터 (optional)
            search_name: 이름 검색어 (optional, 2자 미만 시 전체 조회)

        Returns:
            DashboardResponse: 요약 카드 + 팀원 목록
        """
        logger.info(
            "get_dashboard called",
            extra={
                "user_id": user_id,
                "dept_code_filter": dept_code_filter,
                "search_name": search_name,
            },
        )

        # 1. user_id → emp_no
        leader_emp_no = await self.repo.find_emp_no_by_user_id(user_id)

        # 2. 리더의 dept_code 조회
        leader_info = await self.repo.find_leader_info(leader_emp_no)
        leader_dept_code: str = leader_info["dept_code"]

        # 3. 팀원 목록 + 코칭 통계 조회
        raw_members = await self.repo.find_team_members_with_coaching(
            leader_emp_no=leader_emp_no,
            leader_dept_code=leader_dept_code,
            dept_code_filter=dept_code_filter,
            search_name=search_name,
        )

        # 4. meeting_status 계산 및 DashboardMemberItem 변환
        items: list[DashboardMemberItem] = []
        for member in raw_members:
            status = _calculate_meeting_status(member["last_meeting_date"])
            items.append(
                DashboardMemberItem(
                    emp_no=member["emp_no"],
                    emp_name=member["emp_name"],
                    dept_name=member["dept_name"],
                    last_meeting_date=member["last_meeting_date"],
                    total_meeting_count=member["total_meeting_count"],
                    meeting_status=status,
                )
            )

        # 5. 집계 요약 계산
        summary = DashboardSummary(
            requested_count=sum(1 for i in items if i.meeting_status == "NOT_STARTED"),
            overdue_2month=sum(1 for i in items if i.meeting_status == "OVERDUE_2M"),
            due_1month=sum(1 for i in items if i.meeting_status == "DUE_1M"),
            normal_count=sum(1 for i in items if i.meeting_status == "NORMAL"),
        )

        logger.info(
            "get_dashboard 완료",
            extra={
                "leader_emp_no": leader_emp_no,
                "total_members": len(items),
            },
        )

        return DashboardResponse(
            summary=summary,
            items=items,
            total=len(items),
        )


# =============================================
# Task 4 — 사전 준비 모달 Service
# =============================================


class CoachingPreMeetingService:
    """
    사전 준비 모달 서비스

    책임:
        - 미팅 레코드 생성/삭제 흐름 제어
        - 사전 준비 데이터 로드 (이전 Action Item + AI 추천 질문)
        - Repository / Calculator 조율 (직접 DB 쿼리 작성 금지)
    """

    def __init__(self, db: AsyncSession) -> None:
        """
        Args:
            db: 비동기 데이터베이스 세션
        """
        self.db = db
        self.repo = CoachingRepository(db)

    async def create_meeting(
        self,
        user_id: str,
        member_emp_no: str,
    ) -> CreateMeetingResponse:
        """
        미팅 레코드를 생성합니다. (status=REQUESTED)

        1. user_id → leader_emp_no 변환
        2. 팀원 정보 유효성 확인
        3. TbMeeting INSERT (status=REQUESTED)

        Args:
            user_id: JWT에서 추출한 로그인 사용자 ID
            member_emp_no: 팀원 사번

        Returns:
            CreateMeetingResponse: 생성된 미팅 ID + 상태
        """
        logger.info(
            "create_meeting called",
            extra={"user_id": user_id, "member_emp_no": member_emp_no},
        )

        # 1. user_id → leader emp_no
        leader_emp_no = await self.repo.find_emp_no_by_user_id(user_id)

        # 2. 팀원 정보 유효성 확인 (존재 여부)
        await self.repo.find_member_info(member_emp_no)

        # 3. 미팅 생성
        meeting = await self.repo.create_meeting(
            leader_emp_no=leader_emp_no,
            member_emp_no=member_emp_no,
        )

        logger.info(
            "create_meeting 완료",
            extra={
                "leader_emp_no": leader_emp_no,
                "member_emp_no": member_emp_no,
                "meeting_id": str(meeting.meeting_id),
            },
        )

        return CreateMeetingResponse(
            meeting_id=str(meeting.meeting_id),
            member_emp_no=member_emp_no,
            status=meeting.status,
        )

    async def get_pre_meeting_data(
        self,
        user_id: str,
        meeting_id: str,
    ) -> PreMeetingResponse:
        """
        사전 준비 모달 데이터를 로드합니다.

        1. user_id → leader_emp_no 변환
        2. 미팅 조회 및 권한 확인 (leader만 접근 가능)
        3. 팀원 정보 조회
        4. 이전 COMPLETED 미팅 조회 (최신 2건)
        5. 미완료 Action Item 수집
        6. LLM 호출: AI 추천 질문 생성 (타임아웃 15초)

        Args:
            user_id: JWT에서 추출한 로그인 사용자 ID
            meeting_id: 미팅 UUID 문자열

        Returns:
            PreMeetingResponse: 사전 준비 데이터 전체

        Raises:
            NotFoundException: 미팅이 없을 때
            BusinessLogicException: 미팅 권한이 없을 때
        """
        logger.info(
            "get_pre_meeting_data called",
            extra={"user_id": user_id, "meeting_id": meeting_id},
        )

        # 1. user_id → leader emp_no
        leader_emp_no = await self.repo.find_emp_no_by_user_id(user_id)

        # 2. 미팅 조회 및 권한 확인
        meeting = await self.repo.find_meeting_by_id(meeting_id)
        if meeting.leader_emp_no != leader_emp_no:
            raise BusinessLogicException(
                "이 미팅에 접근할 권한이 없습니다",
                details={"meeting_id": meeting_id},
            )

        member_emp_no: str = meeting.member_emp_no

        # 3. 팀원 정보 조회
        member_raw = await self.repo.find_member_info(member_emp_no)
        member_info = MemberInfo(
            emp_no=member_raw["emp_no"],
            emp_name=member_raw["emp_name"],
            dept_name=member_raw["dept_name"],
        )

        # 4. 이전 COMPLETED 미팅 조회 (N-1, N-2 — 최신 2건)
        previous_meetings = await self.repo.find_previous_completed_meetings(
            leader_emp_no=leader_emp_no,
            member_emp_no=member_emp_no,
            limit=2,
        )
        is_first_meeting: bool = len(previous_meetings) == 0

        # 5. 미완료 Action Item 수집
        previous_meeting_ids = [m.meeting_id for m in previous_meetings]
        raw_action_items = await self.repo.find_incomplete_action_items(previous_meeting_ids)

        previous_action_items: list[ActionItemBrief] = [
            ActionItemBrief(
                action_item_id=str(item.action_item_id),
                content=item.content,
                assignee=item.assignee,
                origin_meeting_id=str(item.meeting_id),
            )
            for item in raw_action_items
        ]

        # 6. AI 추천 질문 생성 (LLM 호출, 타임아웃 15초 — 실패 시 빈 배열 fallback)
        member_rnr_titles = await self.repo.find_member_rnr_titles(member_emp_no)
        previous_summaries: list[str] = [
            m.record.ai_summary
            for m in previous_meetings
            if m.record is not None and m.record.ai_summary is not None
        ]

        ai_suggested_agendas = await generate_ai_suggested_agendas(
            member_rnr_titles=member_rnr_titles,
            previous_summaries=previous_summaries,
            is_first_meeting=is_first_meeting,
        )

        logger.info(
            "get_pre_meeting_data 완료",
            extra={
                "meeting_id": meeting_id,
                "is_first_meeting": is_first_meeting,
                "action_items_count": len(previous_action_items),
                "ai_agendas_count": len(ai_suggested_agendas),
            },
        )

        return PreMeetingResponse(
            meeting_id=str(meeting.meeting_id),
            member_info=member_info,
            is_first_meeting=is_first_meeting,
            previous_action_items=previous_action_items,
            ai_suggested_agendas=ai_suggested_agendas,
            member_preset_agendas=[],  # v1: 항상 빈 배열
        )

    async def delete_meeting(self, user_id: str, meeting_id: str) -> None:
        """
        사전 준비 모달 취소 시 미팅 레코드를 삭제합니다.

        REQUESTED 상태인 미팅만 삭제 가능합니다.
        이미 시작된(IN_PROGRESS 이상) 미팅은 삭제를 거부합니다.

        Args:
            user_id: JWT에서 추출한 로그인 사용자 ID
            meeting_id: 삭제할 미팅 UUID 문자열

        Raises:
            NotFoundException: 미팅이 없을 때
            BusinessLogicException: 권한 없거나 REQUESTED가 아닐 때
        """
        logger.info(
            "delete_meeting called",
            extra={"user_id": user_id, "meeting_id": meeting_id},
        )

        # leader_emp_no 확인
        leader_emp_no = await self.repo.find_emp_no_by_user_id(user_id)

        # 미팅 조회
        meeting = await self.repo.find_meeting_by_id(meeting_id)

        # 권한 확인
        if meeting.leader_emp_no != leader_emp_no:
            raise BusinessLogicException(
                "이 미팅을 삭제할 권한이 없습니다",
                details={"meeting_id": meeting_id},
            )

        # REQUESTED 상태만 삭제 허용
        if meeting.status != "REQUESTED":
            raise BusinessLogicException(
                "이미 시작된 미팅은 삭제할 수 없습니다",
                details={"meeting_id": meeting_id, "current_status": meeting.status},
            )

        await self.repo.delete_meeting(meeting)

        logger.info(
            "delete_meeting 완료",
            extra={"meeting_id": meeting_id, "leader_emp_no": leader_emp_no},
        )


# =============================================
# Task 5 — 미팅 실행 Service
# =============================================


def _build_rr_tree(rr_list: list) -> list[RrTreeNode]:
    """
    R&R ORM 객체 목록을 계층 트리 구조로 변환합니다.

    parent_rr_id 기반으로 루트 노드를 찾고 children을 재귀적으로 구성합니다.

    Args:
        rr_list: Rr ORM 객체 목록 (parent 관계 포함)

    Returns:
        list[RrTreeNode]: 계층 트리로 변환된 루트 노드 목록
    """
    rr_ids = {str(rr.rr_id) for rr in rr_list}
    nodes: dict[str, RrTreeNode] = {}

    for rr in rr_list:
        parent_rr_name: Optional[str] = None
        if rr.parent is not None:
            parent_rr_name = rr.parent.title

        nodes[str(rr.rr_id)] = RrTreeNode(
            rr_id=str(rr.rr_id),
            upper_rr_name=parent_rr_name,
            rr_name=rr.title,
            detail_content=rr.content,
            children=[],
        )

    # 루트 노드: parent_rr_id가 None이거나 현재 목록에 없는 것
    root_nodes: list[RrTreeNode] = []
    for rr in rr_list:
        node = nodes[str(rr.rr_id)]
        parent_id = str(rr.parent_rr_id) if rr.parent_rr_id is not None else None

        if parent_id is None or parent_id not in rr_ids:
            root_nodes.append(node)
        else:
            nodes[parent_id].children.append(node)

    return root_nodes


class CoachingActiveMeetingService:
    """
    미팅 실행 서비스

    책임:
        - 미팅 시작 (IN_PROGRESS 전환 + 아젠다/이월 Action Item 처리)
        - 미팅 실행 화면 데이터 조회
        - R&R 계층 구조 조회
        - 타임라인 생성/마감/편집
        - 개인 메모 저장
        - 아젠다/Action Item 완료 토글
        - 즉석 아젠다 추가
        - AI 질문 새로고침
    """

    def __init__(self, db: AsyncSession) -> None:
        """
        Args:
            db: 비동기 데이터베이스 세션
        """
        self.db = db
        self.repo = CoachingRepository(db)

    async def start_meeting(
        self,
        user_id: str,
        meeting_id: str,
        agendas: list[dict],
    ) -> None:
        """
        미팅을 시작합니다.

        1. user_id → leader_emp_no 변환
        2. 미팅 조회 및 권한 확인
        3. status == REQUESTED 확인 (중복 시작 방지)
        4. N-1, N-2 미완료 Action Item 이월 복사 INSERT
        5. 아젠다 INSERT
        6. status = IN_PROGRESS, started_at 기록

        Args:
            user_id: JWT에서 추출한 로그인 사용자 ID
            meeting_id: 미팅 UUID 문자열
            agendas: [{"content": str, "source": str}, ...] 형태의 아젠다 목록

        Raises:
            NotFoundException: 미팅이 없을 때
            BusinessLogicException: 권한 없거나 REQUESTED 상태가 아닐 때
        """
        logger.info(
            "start_meeting called",
            extra={"user_id": user_id, "meeting_id": meeting_id},
        )

        # 1. user_id → leader_emp_no
        leader_emp_no = await self.repo.find_emp_no_by_user_id(user_id)

        # 2. 미팅 조회 및 권한 확인
        meeting = await self.repo.find_meeting_by_id(meeting_id)
        if meeting.leader_emp_no != leader_emp_no:
            raise BusinessLogicException(
                "이 미팅에 접근할 권한이 없습니다",
                details={"meeting_id": meeting_id},
            )

        # 3. REQUESTED 상태만 시작 허용 (중복 시작 방지)
        if meeting.status != "REQUESTED":
            raise BusinessLogicException(
                "REQUESTED 상태의 미팅만 시작할 수 있습니다",
                details={"meeting_id": meeting_id, "current_status": meeting.status},
            )

        meeting_uuid: uuid.UUID = meeting.meeting_id
        member_emp_no: str = meeting.member_emp_no

        # 4. N-1, N-2 미완료 Action Item 이월 복사 (COMPLETED 기준 최신 2건)
        previous_meetings = await self.repo.find_previous_completed_meetings(
            leader_emp_no=leader_emp_no,
            member_emp_no=member_emp_no,
            limit=2,
        )
        previous_meeting_ids = [m.meeting_id for m in previous_meetings]
        incomplete_items = await self.repo.find_incomplete_action_items(previous_meeting_ids)
        await self.repo.copy_action_items_as_carried_over(
            meeting_id=meeting_uuid,
            source_items=incomplete_items,
        )

        # 5. 아젠다 INSERT (order는 요청 순서 기준)
        agenda_data = [
            {"content": a["content"], "source": a["source"], "order": idx}
            for idx, a in enumerate(agendas)
        ]
        await self.repo.insert_agendas(meeting_id=meeting_uuid, agendas=agenda_data)

        # 6. status = IN_PROGRESS, started_at 기록
        await self.repo.start_meeting(meeting)

        logger.info(
            "start_meeting 완료",
            extra={
                "meeting_id": meeting_id,
                "leader_emp_no": leader_emp_no,
                "agendas_inserted": len(agenda_data),
                "action_items_carried_over": len(incomplete_items),
            },
        )

    async def get_active_meeting(
        self,
        user_id: str,
        meeting_id: str,
    ) -> ActiveMeetingResponse:
        """
        미팅 실행 화면 초기 데이터를 조회합니다.

        Args:
            user_id: JWT에서 추출한 로그인 사용자 ID
            meeting_id: 미팅 UUID 문자열

        Returns:
            ActiveMeetingResponse: 미팅 실행 화면 전체 데이터

        Raises:
            NotFoundException: 미팅이 없을 때
            BusinessLogicException: 권한 없을 때
        """
        logger.info(
            "get_active_meeting called",
            extra={"user_id": user_id, "meeting_id": meeting_id},
        )

        # leader 또는 member 모두 조회 가능 (실행 화면에는 member도 접근 가능)
        leader_emp_no = await self.repo.find_emp_no_by_user_id(user_id)

        meeting = await self.repo.find_meeting_with_active_data(meeting_id)

        if meeting.leader_emp_no != leader_emp_no and meeting.member_emp_no != leader_emp_no:
            raise BusinessLogicException(
                "이 미팅에 접근할 권한이 없습니다",
                details={"meeting_id": meeting_id},
            )

        if meeting.started_at is None:
            raise BusinessLogicException(
                "아직 시작되지 않은 미팅입니다",
                details={"meeting_id": meeting_id, "status": meeting.status},
            )

        # 팀원 정보 조회
        member_raw = await self.repo.find_member_info(meeting.member_emp_no)
        member_info = MemberInfo(
            emp_no=member_raw["emp_no"],
            emp_name=member_raw["emp_name"],
            dept_name=member_raw["dept_name"],
        )

        # private_memo: 리더만 반환
        private_memo: Optional[str] = (
            meeting.private_memo if meeting.leader_emp_no == leader_emp_no else None
        )

        agendas = sorted(meeting.agendas, key=lambda a: a.order)
        agenda_items = [
            ActiveMeetingAgendaItem(
                agenda_id=str(a.agenda_id),
                content=a.content,
                source=a.source,
                order=a.order,
                is_completed=a.is_completed,
            )
            for a in agendas
        ]

        action_items = [
            ActiveMeetingActionItem(
                action_item_id=str(ai.action_item_id),
                content=ai.content,
                assignee=ai.assignee,
                is_completed=ai.is_completed,
                is_carried_over=ai.is_carried_over,
                origin_meeting_id=str(ai.origin_meeting_id) if ai.origin_meeting_id else None,
            )
            for ai in meeting.action_items
        ]

        timeline_items = [
            ActiveMeetingTimelineItem(
                timeline_id=str(t.timeline_id),
                rr_id=str(t.rr_id) if t.rr_id else None,
                start_time=t.start_time,
                end_time=t.end_time,
                segment_summary=t.segment_summary,
            )
            for t in meeting.timelines
        ]

        logger.info(
            "get_active_meeting 완료",
            extra={"meeting_id": meeting_id},
        )

        return ActiveMeetingResponse(
            meeting_id=str(meeting.meeting_id),
            member_info=member_info,
            started_at=meeting.started_at,
            status=meeting.status,
            agendas=agenda_items,
            action_items=action_items,
            timelines=timeline_items,
            private_memo=private_memo,
        )

    async def get_member_rnr_tree(
        self,
        user_id: str,
        member_emp_no: str,
    ) -> RrTreeResponse:
        """
        팀원의 R&R 계층 구조를 조회합니다.

        Args:
            user_id: JWT에서 추출한 로그인 사용자 ID (접근 기록용)
            member_emp_no: 팀원 사번

        Returns:
            RrTreeResponse: R&R 트리 목록
        """
        logger.info(
            "get_member_rnr_tree called",
            extra={"user_id": user_id, "member_emp_no": member_emp_no},
        )

        rr_list = await self.repo.find_member_rnr_tree(member_emp_no)
        root_nodes = _build_rr_tree(rr_list)

        logger.info(
            "get_member_rnr_tree 완료",
            extra={"member_emp_no": member_emp_no, "root_count": len(root_nodes)},
        )

        return RrTreeResponse(items=root_nodes, total=len(rr_list))

    async def create_timeline(
        self,
        user_id: str,
        meeting_id: str,
        rr_id: Optional[str],
        start_time: int,
    ) -> CreateTimelineResponse:
        """
        타임라인 카드를 생성합니다.

        기존에 end_time IS NULL인 활성 카드가 있으면 자동 마감 후 신규 생성합니다.

        Args:
            user_id: JWT에서 추출한 로그인 사용자 ID
            meeting_id: 미팅 UUID 문자열
            rr_id: R&R UUID 문자열 (optional)
            start_time: 녹음 시작 기준 상대 시간(초)

        Returns:
            CreateTimelineResponse: 생성된 타임라인 정보

        Raises:
            NotFoundException: 미팅이 없을 때
            BusinessLogicException: 권한 없을 때
        """
        logger.info(
            "create_timeline called",
            extra={"user_id": user_id, "meeting_id": meeting_id, "start_time": start_time},
        )

        leader_emp_no = await self.repo.find_emp_no_by_user_id(user_id)
        meeting = await self.repo.find_meeting_by_id(meeting_id)

        if meeting.leader_emp_no != leader_emp_no:
            raise BusinessLogicException(
                "이 미팅에 접근할 권한이 없습니다",
                details={"meeting_id": meeting_id},
            )

        meeting_uuid: uuid.UUID = meeting.meeting_id

        # 활성 타임라인 카드 자동 마감
        open_timeline = await self.repo.find_open_timeline(meeting_uuid)
        if open_timeline is not None:
            await self.repo.patch_timeline(timeline=open_timeline, end_time=start_time)

        # 신규 타임라인 생성
        rr_uuid: Optional[uuid.UUID] = uuid.UUID(rr_id) if rr_id else None
        timeline = await self.repo.create_timeline(
            meeting_id=meeting_uuid,
            rr_id=rr_uuid,
            start_time=start_time,
        )

        logger.info(
            "create_timeline 완료",
            extra={"timeline_id": str(timeline.timeline_id)},
        )

        return CreateTimelineResponse(
            timeline_id=str(timeline.timeline_id),
            rr_id=str(timeline.rr_id) if timeline.rr_id else None,
            start_time=timeline.start_time,
            end_time=timeline.end_time,
        )

    async def patch_timeline(
        self,
        user_id: str,
        meeting_id: str,
        timeline_id: str,
        body: PatchTimelineRequest,
    ) -> None:
        """
        타임라인 카드를 업데이트합니다.

        end_time → 카드 마감 (미팅 실행 중)
        segment_summary → 구간 요약 수정 (히스토리 리포트에서 편집)

        Args:
            user_id: JWT에서 추출한 로그인 사용자 ID
            meeting_id: 미팅 UUID 문자열
            timeline_id: 타임라인 UUID 문자열
            body: { end_time?, segment_summary? }

        Raises:
            NotFoundException: 미팅 또는 타임라인이 없을 때
            BusinessLogicException: 권한 없을 때
        """
        logger.info(
            "patch_timeline called",
            extra={"user_id": user_id, "meeting_id": meeting_id, "timeline_id": timeline_id},
        )

        leader_emp_no = await self.repo.find_emp_no_by_user_id(user_id)
        meeting = await self.repo.find_meeting_by_id(meeting_id)

        if meeting.leader_emp_no != leader_emp_no:
            raise BusinessLogicException(
                "이 미팅에 접근할 권한이 없습니다",
                details={"meeting_id": meeting_id},
            )

        timeline = await self.repo.find_timeline_by_id(
            meeting_id=meeting.meeting_id,
            timeline_id=timeline_id,
        )

        await self.repo.patch_timeline(
            timeline=timeline,
            end_time=body.end_time,
            segment_summary=body.segment_summary,
        )

        logger.info(
            "patch_timeline 완료",
            extra={"timeline_id": timeline_id},
        )

    async def update_memo(
        self,
        user_id: str,
        meeting_id: str,
        private_memo: str,
    ) -> None:
        """
        개인 메모를 저장합니다. (리더만 가능)

        Args:
            user_id: JWT에서 추출한 로그인 사용자 ID
            meeting_id: 미팅 UUID 문자열
            private_memo: 저장할 메모 내용

        Raises:
            NotFoundException: 미팅이 없을 때
            BusinessLogicException: 권한 없을 때 (리더가 아닌 경우)
        """
        logger.info(
            "update_memo called",
            extra={"user_id": user_id, "meeting_id": meeting_id},
        )

        leader_emp_no = await self.repo.find_emp_no_by_user_id(user_id)
        meeting = await self.repo.find_meeting_by_id(meeting_id)

        # 메모 저장은 리더만 가능
        if meeting.leader_emp_no != leader_emp_no:
            raise BusinessLogicException(
                "메모는 리더만 저장할 수 있습니다",
                details={"meeting_id": meeting_id},
            )

        await self.repo.update_meeting_memo(meeting=meeting, private_memo=private_memo)

        logger.info("update_memo 완료", extra={"meeting_id": meeting_id})

    async def toggle_agenda_complete(
        self,
        user_id: str,
        meeting_id: str,
        agenda_id: str,
    ) -> None:
        """
        아젠다의 완료 상태를 토글합니다.

        Args:
            user_id: JWT에서 추출한 로그인 사용자 ID
            meeting_id: 미팅 UUID 문자열
            agenda_id: 아젠다 UUID 문자열

        Raises:
            NotFoundException: 미팅 또는 아젠다가 없을 때
            BusinessLogicException: 권한 없을 때
        """
        logger.info(
            "toggle_agenda_complete called",
            extra={"user_id": user_id, "meeting_id": meeting_id, "agenda_id": agenda_id},
        )

        leader_emp_no = await self.repo.find_emp_no_by_user_id(user_id)
        meeting = await self.repo.find_meeting_by_id(meeting_id)

        if meeting.leader_emp_no != leader_emp_no:
            raise BusinessLogicException(
                "이 미팅에 접근할 권한이 없습니다",
                details={"meeting_id": meeting_id},
            )

        agenda = await self.repo.find_agenda_by_id(
            meeting_id=meeting.meeting_id,
            agenda_id=agenda_id,
        )
        await self.repo.toggle_agenda_complete(agenda)

        logger.info("toggle_agenda_complete 완료", extra={"agenda_id": agenda_id})

    async def toggle_action_item_complete(
        self,
        user_id: str,
        meeting_id: str,
        action_item_id: str,
    ) -> None:
        """
        Action Item의 완료 상태를 토글합니다.

        이월 항목도 현재 미팅 row에서만 업데이트합니다 (원본 미팅 불변).

        Args:
            user_id: JWT에서 추출한 로그인 사용자 ID
            meeting_id: 미팅 UUID 문자열
            action_item_id: Action Item UUID 문자열

        Raises:
            NotFoundException: 미팅 또는 Action Item이 없을 때
            BusinessLogicException: 권한 없을 때
        """
        logger.info(
            "toggle_action_item_complete called",
            extra={
                "user_id": user_id,
                "meeting_id": meeting_id,
                "action_item_id": action_item_id,
            },
        )

        leader_emp_no = await self.repo.find_emp_no_by_user_id(user_id)
        meeting = await self.repo.find_meeting_by_id(meeting_id)

        if meeting.leader_emp_no != leader_emp_no:
            raise BusinessLogicException(
                "이 미팅에 접근할 권한이 없습니다",
                details={"meeting_id": meeting_id},
            )

        action_item = await self.repo.find_action_item_by_id(
            meeting_id=meeting.meeting_id,
            action_item_id=action_item_id,
        )
        await self.repo.toggle_action_item_complete(action_item)

        logger.info("toggle_action_item_complete 완료", extra={"action_item_id": action_item_id})

    async def create_agenda(
        self,
        user_id: str,
        meeting_id: str,
        content: str,
    ) -> CreateAgendaResponse:
        """
        리더가 즉석 아젠다를 추가합니다. (source=LEADER_ADDED)

        Args:
            user_id: JWT에서 추출한 로그인 사용자 ID
            meeting_id: 미팅 UUID 문자열
            content: 아젠다 내용

        Returns:
            CreateAgendaResponse: 생성된 아젠다 정보

        Raises:
            NotFoundException: 미팅이 없을 때
            BusinessLogicException: 권한 없을 때
        """
        logger.info(
            "create_agenda called",
            extra={"user_id": user_id, "meeting_id": meeting_id},
        )

        leader_emp_no = await self.repo.find_emp_no_by_user_id(user_id)
        meeting = await self.repo.find_meeting_by_id(meeting_id)

        if meeting.leader_emp_no != leader_emp_no:
            raise BusinessLogicException(
                "이 미팅에 접근할 권한이 없습니다",
                details={"meeting_id": meeting_id},
            )

        max_order = await self.repo.find_agenda_max_order(meeting.meeting_id)
        agenda = await self.repo.create_agenda(
            meeting_id=meeting.meeting_id,
            content=content,
            order=max_order + 1,
        )

        logger.info("create_agenda 완료", extra={"agenda_id": str(agenda.agenda_id)})

        return CreateAgendaResponse(
            agenda_id=str(agenda.agenda_id),
            content=agenda.content,
            source=agenda.source,
            order=agenda.order,
            is_completed=agenda.is_completed,
        )

    async def get_ai_questions(
        self,
        user_id: str,
        meeting_id: str,
    ) -> AiQuestionsResponse:
        """
        AI 스마트 아젠다를 새로고침합니다. (LLM 재호출)

        Args:
            user_id: JWT에서 추출한 로그인 사용자 ID
            meeting_id: 미팅 UUID 문자열

        Returns:
            AiQuestionsResponse: 새로 생성된 AI 추천 질문 목록

        Raises:
            NotFoundException: 미팅이 없을 때
            BusinessLogicException: 권한 없을 때
        """
        logger.info(
            "get_ai_questions called",
            extra={"user_id": user_id, "meeting_id": meeting_id},
        )

        leader_emp_no = await self.repo.find_emp_no_by_user_id(user_id)
        meeting = await self.repo.find_meeting_by_id(meeting_id)

        if meeting.leader_emp_no != leader_emp_no:
            raise BusinessLogicException(
                "이 미팅에 접근할 권한이 없습니다",
                details={"meeting_id": meeting_id},
            )

        member_emp_no: str = meeting.member_emp_no

        # 이전 COMPLETED 미팅 요약 조회
        previous_meetings = await self.repo.find_previous_completed_meetings(
            leader_emp_no=leader_emp_no,
            member_emp_no=member_emp_no,
            limit=2,
        )
        is_first_meeting: bool = len(previous_meetings) == 0
        member_rnr_titles = await self.repo.find_member_rnr_titles(member_emp_no)
        previous_summaries: list[str] = [
            m.record.ai_summary
            for m in previous_meetings
            if m.record is not None and m.record.ai_summary is not None
        ]

        ai_suggested_agendas = await generate_ai_suggested_agendas(
            member_rnr_titles=member_rnr_titles,
            previous_summaries=previous_summaries,
            is_first_meeting=is_first_meeting,
        )

        logger.info(
            "get_ai_questions 완료",
            extra={"meeting_id": meeting_id, "count": len(ai_suggested_agendas)},
        )

        return AiQuestionsResponse(ai_suggested_agendas=ai_suggested_agendas)


# =============================================
# Task 6 — 미팅 종료 + GCS 업로드 Service
# =============================================


class CoachingCompleteMeetingService:
    """
    미팅 종료 + GCS 업로드 서비스

    책임:
        - GCS Presigned Upload URL 발급
        - 미팅 종료 처리 (PROCESSING 전환 + TbMeetingRecord 생성 + TbCoachingRelation UPSERT)
        - AI 파이프라인 BackgroundTask 트리거
    """

    def __init__(self, db: AsyncSession) -> None:
        """
        Args:
            db: 비동기 데이터베이스 세션
        """
        self.db = db
        self.repo = CoachingRepository(db)
        self.gcs: GCSClient = get_gcs_client()

    async def get_presigned_url(
        self,
        user_id: str,
        meeting_id: str,
    ) -> PresignedUrlResponse:
        """
        GCS Presigned Upload URL을 발급합니다.

        미팅 종료 전 프론트엔드가 호출하여 GCS 직접 업로드용 URL을 발급받습니다.
        만료 시간은 1시간(3600초)입니다.

        Args:
            user_id: JWT에서 추출한 로그인 사용자 ID
            meeting_id: 미팅 UUID 문자열

        Returns:
            PresignedUrlResponse: { presigned_url, gcs_path, expires_at }

        Raises:
            NotFoundException: 미팅이 없을 때
            BusinessLogicException: 권한 없거나 IN_PROGRESS 상태가 아닐 때
        """
        logger.info(
            "get_presigned_url called",
            extra={"user_id": user_id, "meeting_id": meeting_id},
        )

        # 1. user_id → leader_emp_no
        leader_emp_no = await self.repo.find_emp_no_by_user_id(user_id)

        # 2. 미팅 조회 및 권한 확인
        meeting = await self.repo.find_meeting_by_id(meeting_id)
        if meeting.leader_emp_no != leader_emp_no:
            raise BusinessLogicException(
                "이 미팅에 접근할 권한이 없습니다",
                details={"meeting_id": meeting_id},
            )

        # 3. GCS Presigned Upload URL 생성
        url_data = await self.gcs.generate_upload_presigned_url(
            leader_emp_no=leader_emp_no,
            meeting_id=meeting_id,
        )

        logger.info(
            "get_presigned_url 완료",
            extra={"meeting_id": meeting_id, "gcs_path": url_data["gcs_path"]},
        )

        return PresignedUrlResponse(
            presigned_url=url_data["presigned_url"],
            gcs_path=url_data["gcs_path"],
            expires_at=url_data["expires_at"],
        )

    async def complete_meeting(
        self,
        user_id: str,
        meeting_id: str,
        body: CompleteMeetingRequest,
        background_tasks: BackgroundTasks,
    ) -> None:
        """
        미팅 종료를 처리합니다.

        종료 처리 흐름:
        1. user_id → leader_emp_no 변환
        2. 미팅 조회 및 권한 확인
        3. 멱등성 체크: PROCESSING/COMPLETED이면 즉시 반환
        4. gcs_path 없으면 FAILED 처리 후 반환
        5. 마지막 타임라인 카드 end_time NULL이면 actual_duration_seconds로 자동 마감
        6. TbMeetingRecord 생성 (audio_file_url = gcs_path)
        7. 미팅 status=PROCESSING, completed_at=utcnow() 업데이트
        8. TbCoachingRelation UPSERT
        9. AI 파이프라인 BackgroundTask 트리거

        Args:
            user_id: JWT에서 추출한 로그인 사용자 ID
            meeting_id: 미팅 UUID 문자열
            body: { actual_duration_seconds, gcs_path, private_memo? }
            background_tasks: FastAPI BackgroundTasks

        Raises:
            NotFoundException: 미팅이 없을 때
            BusinessLogicException: 권한 없을 때
        """
        logger.info(
            "complete_meeting called",
            extra={"user_id": user_id, "meeting_id": meeting_id},
        )

        # 1. user_id → leader_emp_no
        leader_emp_no = await self.repo.find_emp_no_by_user_id(user_id)

        # 2. 미팅 조회 및 권한 확인
        meeting = await self.repo.find_meeting_by_id(meeting_id)
        if meeting.leader_emp_no != leader_emp_no:
            raise BusinessLogicException(
                "이 미팅에 접근할 권한이 없습니다",
                details={"meeting_id": meeting_id},
            )

        # 3. 멱등성 체크: 이미 PROCESSING/COMPLETED이면 200 반환 (중복 호출 무시)
        if meeting.status in ("PROCESSING", "COMPLETED"):
            logger.info(
                "complete_meeting 멱등성 체크: 이미 처리된 미팅",
                extra={"meeting_id": meeting_id, "status": meeting.status},
            )
            return

        # 4. gcs_path 누락 시 FAILED 처리
        if not body.gcs_path:
            logger.error(
                "complete_meeting: gcs_path 누락 → FAILED 처리",
                extra={"meeting_id": meeting_id},
            )
            await self.repo.mark_meeting_failed(meeting.meeting_id)
            return

        meeting_uuid: uuid.UUID = meeting.meeting_id
        member_emp_no: str = meeting.member_emp_no

        # 5. 마지막 활성 타임라인 자동 마감
        await self.repo.close_open_timeline_with_duration(
            meeting_id=meeting_uuid,
            actual_duration_seconds=body.actual_duration_seconds,
        )

        # 6. TbMeetingRecord 생성
        await self.repo.create_meeting_record(
            meeting_id=meeting_uuid,
            audio_file_url=body.gcs_path,
        )

        # 7. 미팅 PROCESSING 전환
        completed_meeting = await self.repo.complete_meeting(
            meeting=meeting,
            actual_duration_seconds=body.actual_duration_seconds,
            private_memo=body.private_memo,
        )
        completed_at: datetime = completed_meeting.completed_at or datetime.utcnow()

        # 8. TbCoachingRelation UPSERT
        await self.repo.upsert_coaching_relation(
            leader_emp_no=leader_emp_no,
            member_emp_no=member_emp_no,
            meeting_id=meeting_uuid,
            completed_at=completed_at,
        )

        # 9. AI 파이프라인 BackgroundTask 트리거
        background_tasks.add_task(
            run_ai_pipeline,
            meeting_id=str(meeting_uuid),
        )

        logger.info(
            "complete_meeting 완료 — AI 파이프라인 BackgroundTask 등록",
            extra={
                "meeting_id": meeting_id,
                "leader_emp_no": leader_emp_no,
                "member_emp_no": member_emp_no,
                "gcs_path": body.gcs_path,
                "duration": body.actual_duration_seconds,
            },
        )


# =============================================
# Task 7 — 히스토리 및 리포트 Service
# =============================================


class CoachingHistoryService:
    """
    미팅 히스토리 및 리포트 서비스

    담당:
        - 팀원별 미팅 히스토리 목록 조회
        - 미팅 상세 리포트 조회 (private_memo 권한 체크)
        - GCS Presigned Download URL 발급 (오디오 재생용)
    """

    def __init__(self, db: AsyncSession) -> None:
        self.repo = CoachingRepository(db)
        self.gcs: GCSClient = get_gcs_client()

    async def get_member_meetings(
        self,
        user_id: str,
        member_emp_no: str,
    ) -> MeetingHistoryResponse:
        """
        팀원과의 미팅 히스토리 목록을 최신순으로 반환합니다.

        Args:
            user_id: JWT 로그인 사용자 ID (리더 검증용)
            member_emp_no: 팀원 사원번호

        Returns:
            MeetingHistoryResponse: 미팅 목록 + total

        Raises:
            NotFoundException: 팀원 정보를 찾을 수 없을 때
        """
        leader_emp_no = await self.repo.find_emp_no_by_user_id(user_id)
        member = await self.repo.find_member_info(member_emp_no)

        meetings = await self.repo.find_meetings_by_member(
            leader_emp_no=leader_emp_no,
            member_emp_no=member_emp_no,
        )

        items: list[MeetingHistoryItem] = []
        for meeting in meetings:
            total_action_items = len(meeting.action_items)
            completed_action_items = sum(
                1 for ai in meeting.action_items if ai.is_completed
            )
            items.append(
                MeetingHistoryItem(
                    meeting_id=str(meeting.meeting_id),
                    started_at=meeting.started_at,
                    completed_at=meeting.completed_at,
                    actual_duration_seconds=meeting.actual_duration_seconds,
                    status=meeting.status,
                    total_action_items=total_action_items,
                    completed_action_items=completed_action_items,
                )
            )

        dept_name: str = getattr(member, "dept_name", "") or ""

        logger.info(
            "get_member_meetings 완료",
            extra={
                "leader_emp_no": leader_emp_no,
                "member_emp_no": member_emp_no,
                "total": len(items),
            },
        )

        return MeetingHistoryResponse(
            member_info=MemberInfo(
                emp_no=member.emp_no,
                emp_name=member.emp_name,
                dept_name=dept_name,
            ),
            items=items,
            total=len(items),
        )

    async def get_meeting_report(
        self,
        user_id: str,
        meeting_id: str,
    ) -> MeetingReportResponse:
        """
        미팅 상세 리포트를 반환합니다.

        권한 체크:
            - 리더(meeting.leader_emp_no): private_memo 포함
            - 팀원(meeting.member_emp_no): private_memo = None

        Args:
            user_id: JWT 로그인 사용자 ID
            meeting_id: 미팅 UUID 문자열

        Returns:
            MeetingReportResponse: Bento Grid 데이터

        Raises:
            NotFoundException: 미팅이 없거나 접근 권한이 없을 때
        """
        requester_emp_no = await self.repo.find_emp_no_by_user_id(user_id)

        try:
            meeting_uuid = uuid.UUID(meeting_id)
        except ValueError as exc:
            raise NotFoundException(f"유효하지 않은 meeting_id: {meeting_id}") from exc

        meeting = await self.repo.find_meeting_with_report_data(meeting_uuid)
        if meeting is None:
            raise NotFoundException(f"미팅을 찾을 수 없습니다: {meeting_id}")

        # 접근 권한 체크: 리더 또는 팀원만 조회 가능
        is_leader = str(meeting.leader_emp_no) == requester_emp_no
        is_member = str(meeting.member_emp_no) == requester_emp_no
        if not (is_leader or is_member):
            raise NotFoundException(f"미팅 조회 권한이 없습니다: {meeting_id}")

        # 팀원 정보 조회
        member = await self.repo.find_member_info(str(meeting.member_emp_no))
        dept_name: str = getattr(member, "dept_name", "") or ""

        # 타임라인 rr_name 매핑 (rr_id → Rr.title)
        rr_ids = [
            tl.rr_id
            for tl in meeting.timelines
            if tl.rr_id is not None
        ]
        rr_title_map = await self.repo.find_rr_title_map(rr_ids)

        # 타임라인 정렬 (start_time 오름차순)
        sorted_timelines = sorted(meeting.timelines, key=lambda tl: tl.start_time)

        timeline_items: list[TimelineItem] = [
            TimelineItem(
                timeline_id=str(tl.timeline_id),
                rr_name=rr_title_map.get(tl.rr_id) if tl.rr_id else None,
                start_time=tl.start_time,
                end_time=tl.end_time,
                segment_summary=tl.segment_summary,
            )
            for tl in sorted_timelines
        ]

        # Action Item 정렬 (이월 항목 → 신규 항목 순)
        sorted_action_items = sorted(
            meeting.action_items,
            key=lambda ai: (not ai.is_carried_over, ai.action_item_id),
        )

        action_item_reports: list[ActionItemReport] = [
            ActionItemReport(
                action_item_id=str(ai.action_item_id),
                content=ai.content,
                assignee=ai.assignee,
                is_completed=ai.is_completed,
                is_carried_over=ai.is_carried_over,
                origin_meeting_id=str(ai.origin_meeting_id) if ai.origin_meeting_id else None,
            )
            for ai in sorted_action_items
        ]

        # private_memo: 리더만 조회 가능
        private_memo: Optional[str] = meeting.private_memo if is_leader else None

        # AI 요약 (record가 없거나 PROCESSING 중이면 None)
        ai_summary: Optional[str] = meeting.record.ai_summary if meeting.record else None

        logger.info(
            "get_meeting_report 완료",
            extra={
                "meeting_id": meeting_id,
                "requester_emp_no": requester_emp_no,
                "is_leader": is_leader,
                "status": meeting.status,
            },
        )

        return MeetingReportResponse(
            meeting_id=str(meeting.meeting_id),
            member_info=MemberInfo(
                emp_no=member.emp_no,
                emp_name=member.emp_name,
                dept_name=dept_name,
            ),
            started_at=meeting.started_at,
            completed_at=meeting.completed_at,
            actual_duration_seconds=meeting.actual_duration_seconds,
            status=meeting.status,
            ai_summary=ai_summary,
            timelines=timeline_items,
            action_items=action_item_reports,
            private_memo=private_memo,
        )

    async def get_audio_url(
        self,
        user_id: str,
        meeting_id: str,
    ) -> AudioUrlResponse:
        """
        GCS Presigned Download URL을 발급합니다.

        매 요청마다 새로운 URL을 발급하며 캐싱하지 않습니다.
        만료 시간: 1시간

        권한 체크: 리더 또는 팀원만 호출 가능

        Args:
            user_id: JWT 로그인 사용자 ID
            meeting_id: 미팅 UUID 문자열

        Returns:
            AudioUrlResponse: { audio_url, expires_at }

        Raises:
            NotFoundException: 미팅이 없거나 권한이 없거나 녹음 파일이 없을 때
        """
        requester_emp_no = await self.repo.find_emp_no_by_user_id(user_id)

        try:
            meeting_uuid = uuid.UUID(meeting_id)
        except ValueError as exc:
            raise NotFoundException(f"유효하지 않은 meeting_id: {meeting_id}") from exc

        meeting = await self.repo.find_meeting_with_report_data(meeting_uuid)
        if meeting is None:
            raise NotFoundException(f"미팅을 찾을 수 없습니다: {meeting_id}")

        # 접근 권한 체크: 리더 또는 팀원만 오디오 URL 발급 가능
        is_leader = str(meeting.leader_emp_no) == requester_emp_no
        is_member = str(meeting.member_emp_no) == requester_emp_no
        if not (is_leader or is_member):
            raise NotFoundException(f"오디오 URL 발급 권한이 없습니다: {meeting_id}")

        # 녹음 파일 경로 확인
        if meeting.record is None or not meeting.record.audio_file_url:
            raise NotFoundException(f"녹음 파일을 찾을 수 없습니다: {meeting_id}")

        gcs_path: str = meeting.record.audio_file_url

        # Presigned Download URL 발급 (1시간 만료)
        from datetime import datetime as dt

        expiration_seconds = 3600
        presigned_url = await self.gcs.generate_download_presigned_url(
            gcs_path=gcs_path,
            expiration_seconds=expiration_seconds,
        )
        expires_at = (dt.utcnow() + timedelta(seconds=expiration_seconds)).isoformat() + "Z"

        logger.info(
            "get_audio_url 완료",
            extra={
                "meeting_id": meeting_id,
                "requester_emp_no": requester_emp_no,
                "gcs_path": gcs_path,
            },
        )

        return AudioUrlResponse(
            audio_url=presigned_url,
            expires_at=expires_at,
        )
