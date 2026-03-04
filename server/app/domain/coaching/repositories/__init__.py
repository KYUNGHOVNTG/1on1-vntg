"""
Coaching 도메인 Repository

책임:
    - DB에서 Coaching 관련 데이터 조회/저장
    - Service 레이어에서 직접 DB 접근 금지 → 이 클래스로 위임

메서드 목록 (Task 3):
    - find_emp_no_by_user_id   : user_id → emp_no 조회
    - find_leader_info         : 리더의 인사정보 조회
    - find_team_members_with_coaching : 팀원 목록 + 코칭 통계 LEFT JOIN 조회

메서드 목록 (Task 4):
    - find_member_info               : 팀원 인사정보 조회
    - create_meeting                 : 미팅 레코드 생성 (status=REQUESTED)
    - find_meeting_by_id             : 미팅 단건 조회
    - delete_meeting                 : 미팅 레코드 삭제
    - find_previous_completed_meetings : leader-member 간 이전 COMPLETED 미팅 조회
    - find_incomplete_action_items   : 미완료 Action Item 조회
    - find_member_rnr_titles         : 팀원 R&R 제목 목록 조회 (LLM 프롬프트용)
"""

import uuid
from typing import Any, Optional

from sqlalchemy import and_, desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from server.app.core.logging import get_logger
from server.app.domain.coaching.models import (
    TbCoachingRelation,
    TbMeeting,
    TbMeetingActionItem,
)
from server.app.domain.hr.models.department import CMDepartment
from server.app.domain.hr.models.employee import HRMgnt
from server.app.domain.rnr.models import Rr
from server.app.shared.exceptions import NotFoundException, RepositoryException

logger = get_logger(__name__)

# 팀원 직책 코드
MEMBER_POSITION_CODE: str = "P005"


class CoachingRepository:
    """
    Coaching 도메인 데이터 접근 클래스

    SQLAlchemy를 사용하여 실제 데이터베이스에 접근합니다.
    Service 레이어에서 직접 DB 쿼리 작성 금지.
    """

    def __init__(self, db: AsyncSession) -> None:
        """
        Args:
            db: 비동기 데이터베이스 세션
        """
        self.db = db

    async def find_emp_no_by_user_id(self, user_id: str) -> str:
        """
        user_id(JWT 토큰)로 직원 사번(emp_no)을 조회합니다.

        Args:
            user_id: 로그인 사용자 ID (cm_user.user_id)

        Returns:
            str: 직원 사번 (emp_no)

        Raises:
            NotFoundException: 직원 정보가 없을 때
        """
        logger.info("find_emp_no_by_user_id called", extra={"user_id": user_id})

        stmt = select(HRMgnt.emp_no).where(HRMgnt.user_id == user_id)
        result = await self.db.execute(stmt)
        row = result.first()

        if row is None:
            raise NotFoundException(
                message="직원 정보를 찾을 수 없습니다",
                details={"user_id": user_id},
            )

        return row.emp_no

    async def find_leader_info(self, emp_no: str) -> dict[str, Any]:
        """
        리더의 인사정보(dept_code 포함)를 조회합니다.

        Args:
            emp_no: 리더 사번

        Returns:
            dict: emp_no, dept_code, name_kor

        Raises:
            NotFoundException: 직원 정보가 없을 때
        """
        logger.info("find_leader_info called", extra={"emp_no": emp_no})

        stmt = select(HRMgnt).where(HRMgnt.emp_no == emp_no)
        result = await self.db.execute(stmt)
        row = result.scalar_one_or_none()

        if row is None:
            raise NotFoundException(
                message="리더 정보를 찾을 수 없습니다",
                details={"emp_no": emp_no},
            )

        return {
            "emp_no": row.emp_no,
            "dept_code": row.dept_code,
            "name_kor": row.name_kor,
        }

    async def find_team_members_with_coaching(
        self,
        leader_emp_no: str,
        leader_dept_code: str,
        dept_code_filter: Optional[str] = None,
        search_name: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        """
        팀원 목록과 코칭 통계를 함께 조회합니다 (LEFT JOIN).

        - position_code == 'P005' (팀원만)
        - on_work_yn == 'Y' (재직자만)
        - dept_code == leader_dept_code (같은 부서)
        - emp_no != leader_emp_no (리더 자신 제외)

        Args:
            leader_emp_no: 리더 사번 (자신 제외)
            leader_dept_code: 리더 부서 코드
            dept_code_filter: 부서 코드 추가 필터 (optional)
            search_name: 이름 검색어 (optional, 2자 미만 시 전체 조회)

        Returns:
            list[dict]: 팀원 목록 (emp_no, emp_name, dept_name, last_meeting_date, total_meeting_count)
        """
        logger.info(
            "find_team_members_with_coaching called",
            extra={
                "leader_emp_no": leader_emp_no,
                "leader_dept_code": leader_dept_code,
                "dept_code_filter": dept_code_filter,
                "search_name": search_name,
            },
        )

        try:
            # 기본 조건
            conditions = [
                HRMgnt.position_code == MEMBER_POSITION_CODE,
                HRMgnt.on_work_yn == "Y",
                HRMgnt.dept_code == leader_dept_code,
                HRMgnt.emp_no != leader_emp_no,
            ]

            # 부서 필터 (추가 필터)
            if dept_code_filter:
                conditions.append(HRMgnt.dept_code == dept_code_filter)

            # 이름 검색 (2자 이상인 경우에만 적용)
            if search_name and len(search_name) >= 2:
                conditions.append(HRMgnt.name_kor.ilike(f"%{search_name}%"))

            # HRMgnt + CMDepartment + TbCoachingRelation (LEFT JOIN)
            stmt = (
                select(
                    HRMgnt.emp_no,
                    HRMgnt.name_kor.label("emp_name"),
                    CMDepartment.dept_name,
                    TbCoachingRelation.last_meeting_date,
                    TbCoachingRelation.total_meeting_count,
                )
                .join(
                    CMDepartment,
                    HRMgnt.dept_code == CMDepartment.dept_code,
                    isouter=False,
                )
                .outerjoin(
                    TbCoachingRelation,
                    and_(
                        TbCoachingRelation.leader_emp_no == leader_emp_no,
                        TbCoachingRelation.member_emp_no == HRMgnt.emp_no,
                    ),
                )
                .where(and_(*conditions))
                .order_by(HRMgnt.name_kor)
            )

            result = await self.db.execute(stmt)
            rows = result.all()

            return [
                {
                    "emp_no": row.emp_no,
                    "emp_name": row.emp_name,
                    "dept_name": row.dept_name,
                    "last_meeting_date": row.last_meeting_date,
                    "total_meeting_count": row.total_meeting_count or 0,
                }
                for row in rows
            ]

        except NotFoundException:
            raise
        except Exception as exc:
            logger.error(
                "find_team_members_with_coaching 실패",
                extra={"leader_emp_no": leader_emp_no, "error": str(exc)},
            )
            raise RepositoryException(
                "팀원 목록 조회에 실패했습니다",
                details={"leader_emp_no": leader_emp_no},
            ) from exc

    # =============================================
    # Task 4 — 사전 준비 모달 Repository 메서드
    # =============================================

    async def find_member_info(self, member_emp_no: str) -> dict[str, Any]:
        """
        팀원 인사정보를 조회합니다.

        Args:
            member_emp_no: 팀원 사번

        Returns:
            dict: emp_no, emp_name, dept_name

        Raises:
            NotFoundException: 팀원 정보가 없을 때
        """
        logger.info("find_member_info called", extra={"member_emp_no": member_emp_no})

        stmt = (
            select(
                HRMgnt.emp_no,
                HRMgnt.name_kor.label("emp_name"),
                CMDepartment.dept_name,
            )
            .join(CMDepartment, HRMgnt.dept_code == CMDepartment.dept_code)
            .where(HRMgnt.emp_no == member_emp_no)
        )
        result = await self.db.execute(stmt)
        row = result.first()

        if row is None:
            raise NotFoundException(
                message="팀원 정보를 찾을 수 없습니다",
                details={"member_emp_no": member_emp_no},
            )

        return {
            "emp_no": row.emp_no,
            "emp_name": row.emp_name,
            "dept_name": row.dept_name,
        }

    async def create_meeting(self, leader_emp_no: str, member_emp_no: str) -> TbMeeting:
        """
        미팅 레코드를 생성합니다. (status=REQUESTED)

        Args:
            leader_emp_no: 리더 사번
            member_emp_no: 팀원 사번

        Returns:
            TbMeeting: 생성된 미팅 ORM 객체
        """
        logger.info(
            "create_meeting called",
            extra={"leader_emp_no": leader_emp_no, "member_emp_no": member_emp_no},
        )

        try:
            meeting = TbMeeting(
                meeting_id=uuid.uuid4(),
                leader_emp_no=leader_emp_no,
                member_emp_no=member_emp_no,
                status="REQUESTED",
            )
            self.db.add(meeting)
            await self.db.commit()
            await self.db.refresh(meeting)

            logger.info(
                "create_meeting 완료",
                extra={"meeting_id": str(meeting.meeting_id)},
            )
            return meeting

        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "create_meeting 실패",
                extra={"leader_emp_no": leader_emp_no, "error": str(exc)},
            )
            raise RepositoryException(
                "미팅 생성에 실패했습니다",
                details={"leader_emp_no": leader_emp_no},
            ) from exc

    async def find_meeting_by_id(self, meeting_id: str) -> TbMeeting:
        """
        미팅 ID로 미팅을 단건 조회합니다.

        Args:
            meeting_id: 미팅 UUID 문자열

        Returns:
            TbMeeting: 미팅 ORM 객체

        Raises:
            NotFoundException: 미팅이 존재하지 않을 때
        """
        logger.info("find_meeting_by_id called", extra={"meeting_id": meeting_id})

        try:
            meeting_uuid = uuid.UUID(meeting_id)
        except ValueError as exc:
            raise NotFoundException(
                message="유효하지 않은 미팅 ID입니다",
                details={"meeting_id": meeting_id},
            ) from exc

        stmt = select(TbMeeting).where(TbMeeting.meeting_id == meeting_uuid)
        result = await self.db.execute(stmt)
        meeting = result.scalar_one_or_none()

        if meeting is None:
            raise NotFoundException(
                message="미팅을 찾을 수 없습니다",
                details={"meeting_id": meeting_id},
            )

        return meeting

    async def delete_meeting(self, meeting: TbMeeting) -> None:
        """
        미팅 레코드를 삭제합니다. (REQUESTED 상태 전용)

        Args:
            meeting: 삭제할 미팅 ORM 객체
        """
        logger.info(
            "delete_meeting called",
            extra={"meeting_id": str(meeting.meeting_id)},
        )

        try:
            await self.db.delete(meeting)
            await self.db.commit()
            logger.info(
                "delete_meeting 완료",
                extra={"meeting_id": str(meeting.meeting_id)},
            )

        except Exception as exc:
            await self.db.rollback()
            logger.error(
                "delete_meeting 실패",
                extra={"meeting_id": str(meeting.meeting_id), "error": str(exc)},
            )
            raise RepositoryException(
                "미팅 삭제에 실패했습니다",
                details={"meeting_id": str(meeting.meeting_id)},
            ) from exc

    async def find_previous_completed_meetings(
        self,
        leader_emp_no: str,
        member_emp_no: str,
        limit: int = 2,
    ) -> list[TbMeeting]:
        """
        leader-member 간 이전 COMPLETED 미팅을 최신 순으로 조회합니다.

        이월 Action Item 및 사전 준비 데이터 로드에 사용합니다.

        Args:
            leader_emp_no: 리더 사번
            member_emp_no: 팀원 사번
            limit: 조회할 최대 건수 (기본 2건 — N-1, N-2)

        Returns:
            list[TbMeeting]: 최신 순 COMPLETED 미팅 목록
        """
        logger.info(
            "find_previous_completed_meetings called",
            extra={
                "leader_emp_no": leader_emp_no,
                "member_emp_no": member_emp_no,
                "limit": limit,
            },
        )

        stmt = (
            select(TbMeeting)
            .options(selectinload(TbMeeting.record))
            .where(
                and_(
                    TbMeeting.leader_emp_no == leader_emp_no,
                    TbMeeting.member_emp_no == member_emp_no,
                    TbMeeting.status == "COMPLETED",
                )
            )
            .order_by(desc(TbMeeting.completed_at))
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def find_incomplete_action_items(
        self,
        meeting_ids: list[uuid.UUID],
    ) -> list[TbMeetingActionItem]:
        """
        지정된 미팅들의 미완료 Action Item을 조회합니다.

        Args:
            meeting_ids: 조회할 미팅 UUID 목록

        Returns:
            list[TbMeetingActionItem]: 미완료 Action Item 목록
        """
        if not meeting_ids:
            return []

        logger.info(
            "find_incomplete_action_items called",
            extra={"meeting_count": len(meeting_ids)},
        )

        stmt = select(TbMeetingActionItem).where(
            and_(
                TbMeetingActionItem.meeting_id.in_(meeting_ids),
                TbMeetingActionItem.is_completed.is_(False),
            )
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def find_member_rnr_titles(self, member_emp_no: str) -> list[str]:
        """
        팀원의 R&R 제목 목록을 조회합니다. (LLM 프롬프트 구성용)

        현재 연도 기준, MEMBER 타입 R&R만 조회합니다.

        Args:
            member_emp_no: 팀원 사번

        Returns:
            list[str]: R&R 제목 목록
        """
        from datetime import datetime

        current_year = str(datetime.utcnow().year)

        logger.info(
            "find_member_rnr_titles called",
            extra={"member_emp_no": member_emp_no, "year": current_year},
        )

        stmt = (
            select(Rr.title)
            .where(
                and_(
                    Rr.emp_no == member_emp_no,
                    Rr.year == current_year,
                    Rr.rr_type == "MEMBER",
                )
            )
            .order_by(Rr.title)
        )
        result = await self.db.execute(stmt)
        return [row.title for row in result.all()]
