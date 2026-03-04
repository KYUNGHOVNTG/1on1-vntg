"""
Coaching 도메인 Service

흐름 제어 및 트랜잭션 관리 담당
Repository / Calculator / Formatter 조율
"""

from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.logging import get_logger
from server.app.domain.coaching.repositories import CoachingRepository
from server.app.domain.coaching.schemas import (
    DashboardMemberItem,
    DashboardResponse,
    DashboardSummary,
)

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
