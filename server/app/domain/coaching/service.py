"""
Coaching 도메인 Service

흐름 제어 및 트랜잭션 관리 담당
Repository / Calculator / Formatter 조율
"""

from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.logging import get_logger
from server.app.domain.coaching.calculators import generate_ai_suggested_agendas
from server.app.domain.coaching.repositories import CoachingRepository
from server.app.domain.coaching.schemas import (
    ActionItemBrief,
    CreateMeetingResponse,
    DashboardMemberItem,
    DashboardResponse,
    DashboardSummary,
    MemberInfo,
    PreMeetingResponse,
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
